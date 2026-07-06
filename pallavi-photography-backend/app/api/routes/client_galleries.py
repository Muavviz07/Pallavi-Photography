import uuid
import re
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    UploadFile,
    File,
    Form,
    Header,
    Request,
)
from pydantic import BaseModel
from sqlalchemy.orm import Session
from jose import jwt

from app.api.dependencies import (
    get_db,
    get_current_active_user,
    get_current_admin_user,
    require_feature,
    get_current_admin_or_client_user_with_feature,
)
from app.core.config import settings
from app.core import security
from app.models.user import User, UserRole
from app.models.client_gallery import ClientGallery
from app.models.client_gallery_image import ClientGalleryImage
from app.models.image import Image
from app.schemas.client_gallery import (
    ClientGalleryCreate,
    ClientGalleryUpdate,
    ClientGalleryResponse,
    ClientGalleryImageResponse,
)
from app.schemas.image import ImageResponse
from app.schemas.media import AddMediaToGalleryRequest
from app.services.image_service import image_service
from app.services.email_service import email_service
from app.services.media_service import refresh_usage_count, can_delete_media

router = APIRouter()


class AccessRequest(BaseModel):
    password: str


class SelectionUpdate(BaseModel):
    selected: bool


def get_gallery_by_id_or_slug(db: Session, id_or_slug: str) -> Optional[ClientGallery]:
    try:
        gallery_uuid = uuid.UUID(id_or_slug)
        return db.query(ClientGallery).filter(ClientGallery.id == gallery_uuid).first()
    except ValueError:
        return db.query(ClientGallery).filter(ClientGallery.slug == id_or_slug).first()


def get_current_user_optional(request: Request, db: Session) -> Optional[User]:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        sub = payload.get("sub")
        if not sub:
            return None
        return db.query(User).filter(User.id == uuid.UUID(sub)).first()
    except Exception:
        return None


def create_gallery_token(gallery_id: uuid.UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=1)
    to_encode = {"exp": expire, "sub": str(gallery_id), "type": "gallery_access"}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")


def make_slug_unique(db: Session, base_slug: str) -> str:
    slug = base_slug
    counter = 1
    while db.query(ClientGallery).filter(ClientGallery.slug == slug).first():
        counter += 1
        slug = f"{base_slug}-{counter}"
    return slug


def process_and_create_gallery_logic(
    gallery_in: ClientGalleryCreate, db: Session
) -> ClientGallery:
    # 1. Resolve / generate slug
    if not gallery_in.slug or not gallery_in.slug.strip():
        base_slug = slugify(gallery_in.title)
        if not base_slug:
            base_slug = "gallery"
        slug = make_slug_unique(db, base_slug)
    else:
        slug = slugify(gallery_in.slug)
        existing = db.query(ClientGallery).filter(ClientGallery.slug == slug).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A client gallery with this slug already exists.",
            )

    # 2. Resolve / create owner User using title (client name) as username
    user_id = gallery_in.user_id
    if not user_id:
        username = gallery_in.title
        # Make sure username is unique in the users table
        email = username
        counter = 1
        while db.query(User).filter(User.email == email).first():
            counter += 1
            email = f"{username} ({counter})"

        # Create User
        password_to_hash = gallery_in.password or "temporary_client_password"
        db_user = User(
            email=email,
            password_hash=security.encrypt_password(password_to_hash),
            role=UserRole.CLIENT.value,
            status="active",
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        user_id = db_user.id

    # 3. Store gallery passcode as encrypted in password_hash
    password_hash = (
        security.encrypt_password(gallery_in.password) if gallery_in.password else None
    )

    # 4. Create ClientGallery
    db_gallery = ClientGallery(
        user_id=user_id,
        title=gallery_in.title,
        slug=slug,
        description=gallery_in.description,
        status=gallery_in.status or "active",
        password_hash=password_hash,
        expiry_date=gallery_in.expiry_date,
        can_view=gallery_in.can_view if gallery_in.can_view is not None else True,
        can_upload=gallery_in.can_upload
        if gallery_in.can_upload is not None
        else False,
        can_replace=gallery_in.can_replace
        if gallery_in.can_replace is not None
        else False,
        can_delete=gallery_in.can_delete
        if gallery_in.can_delete is not None
        else False,
        can_download=gallery_in.can_download
        if gallery_in.can_download is not None
        else True,
        can_download_zip=gallery_in.can_download_zip
        if gallery_in.can_download_zip is not None
        else False,
        can_edit_details=gallery_in.can_edit_details
        if gallery_in.can_edit_details is not None
        else False,
        can_submit_selections=gallery_in.can_submit_selections
        if gallery_in.can_submit_selections is not None
        else True,
        can_share=gallery_in.can_share if gallery_in.can_share is not None else False,
    )
    db.add(db_gallery)
    db.commit()
    db.refresh(db_gallery)
    return db_gallery


def check_gallery_access(
    id_or_slug: str, request: Request, db: Session
) -> ClientGallery:
    gallery = get_gallery_by_id_or_slug(db, id_or_slug)
    if not gallery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Client gallery not found."
        )

    user = get_current_user_optional(request, db)

    # Admins always bypass access restrictions
    if user and user.role in [UserRole.ADMIN.value, UserRole.SUPER_ADMIN.value]:
        return gallery

    # Owner of the gallery always bypasses password verification
    if user and user.id == gallery.user_id:
        return gallery

    # Check basic status
    if gallery.status == "closed":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="This gallery is closed."
        )

    # Check expiry dates
    if gallery.expiry_date:
        # Normalize naive/aware datetimes
        expiry = (
            gallery.expiry_date.replace(tzinfo=timezone.utc)
            if gallery.expiry_date.tzinfo is None
            else gallery.expiry_date
        )
        if expiry < datetime.now(timezone.utc):
            if gallery.status != "expired":
                gallery.status = "expired"
                db.add(gallery)
                db.commit()
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This gallery has expired.",
            )

    # Check password protection
    if gallery.password_hash:
        gallery_token = request.headers.get("X-Gallery-Token")
        if not gallery_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Password is required to access this private gallery.",
            )
        try:
            payload = jwt.decode(
                gallery_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
            )
            if (
                payload.get("sub") != str(gallery.id)
                or payload.get("type") != "gallery_access"
            ):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid gallery access token.",
                )
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid gallery access token.",
            )

    # Check view permissions
    if not gallery.can_view:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Viewing this gallery has been disabled by the administrator.",
        )

    return gallery


@router.get("/public/list")
def list_public_client_galleries(db: Session = Depends(get_db)):
    """
    List all active client galleries publicly.
    """
    # Exclude closed and expired galleries
    galleries = (
        db.query(ClientGallery)
        .filter(ClientGallery.status == "active")
        .order_by(ClientGallery.created_at.desc())
        .all()
    )

    res = []
    for g in galleries:
        image_count = (
            db.query(ClientGalleryImage)
            .filter(ClientGalleryImage.client_gallery_id == g.id)
            .count()
        )
        client_name = (
            g.user.email.split("@")[0].replace(".", " ").title() if g.user else "Client"
        )

        cover_image_url = None
        if g.cover_image:
            cover_image_url = g.cover_image.optimized_url or g.cover_image.original_url

        res.append(
            {
                "id": str(g.id),
                "title": g.title,
                "slug": g.slug,
                "description": g.description,
                "expiry_date": g.expiry_date.isoformat() if g.expiry_date else None,
                "cover_image_url": cover_image_url,
                "image_count": image_count,
                "client_name": client_name,
            }
        )
    return res


@router.get("", response_model=List[ClientGalleryResponse])
def list_client_galleries(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_or_client_user_with_feature("galleries")),
):
    """
    List client galleries.
    Admins see all, Client users see only their assigned galleries.
    """
    if current_user.role in [UserRole.ADMIN.value, UserRole.SUPER_ADMIN.value]:
        return db.query(ClientGallery).order_by(ClientGallery.created_at.desc()).all()
    else:
        return (
            db.query(ClientGallery)
            .filter(ClientGallery.user_id == current_user.id)
            .order_by(ClientGallery.created_at.desc())
            .all()
        )


@router.post(
    "", response_model=ClientGalleryResponse, status_code=status.HTTP_201_CREATED
)
def create_client_gallery(
    gallery_in: ClientGalleryCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_feature("galleries")),
):
    """
    Create a new client gallery. (Admin only)
    """
    return process_and_create_gallery_logic(gallery_in, db)


@router.get("/{id_or_slug}")
def get_client_gallery_meta(
    id_or_slug: str, request: Request, db: Session = Depends(get_db)
):
    """
    Gets metadata for a gallery and indicates if password unlock is required.
    """
    gallery = get_gallery_by_id_or_slug(db, id_or_slug)
    if not gallery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Client gallery not found."
        )

    user = get_current_user_optional(request, db)

    # Check if password protection is active and if they need to unlock it
    requires_password = False
    if gallery.password_hash:
        requires_password = True
        # Determine if it's already unlocked
        gallery_token = request.headers.get("X-Gallery-Token")
        if gallery_token:
            try:
                payload = jwt.decode(
                    gallery_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
                )
                if (
                    payload.get("sub") == str(gallery.id)
                    and payload.get("type") == "gallery_access"
                ):
                    requires_password = False
            except Exception:
                pass

        # Admins and Owners bypass password protection requirements
        if user and (
            user.role in [UserRole.ADMIN.value, UserRole.SUPER_ADMIN.value]
            or user.id == gallery.user_id
        ):
            requires_password = False

    # Check status/expiry if user is NOT admin or owner
    if not (
        user
        and (
            user.role in [UserRole.ADMIN.value, UserRole.SUPER_ADMIN.value]
            or user.id == gallery.user_id
        )
    ):
        if gallery.status == "closed":
            raise HTTPException(status_code=403, detail="This gallery is closed.")
        if gallery.expiry_date:
            expiry = (
                gallery.expiry_date.replace(tzinfo=timezone.utc)
                if gallery.expiry_date.tzinfo is None
                else gallery.expiry_date
            )
            if expiry < datetime.now(timezone.utc):
                raise HTTPException(status_code=403, detail="This gallery has expired.")

    # Return safe metadata. If password is required, hide full nested relationships.
    return {
        "id": gallery.id,
        "title": gallery.title,
        "slug": gallery.slug,
        "description": gallery.description,
        "status": gallery.status,
        "expiry_date": gallery.expiry_date,
        "requires_password": requires_password,
        "can_view": gallery.can_view,
        "can_upload": gallery.can_upload,
        "can_download": gallery.can_download,
        "can_download_zip": gallery.can_download_zip,
        "can_submit_selections": gallery.can_submit_selections,
        "can_share": gallery.can_share,
        "selections_submitted": gallery.selections_submitted,
        "selections_submitted_at": gallery.selections_submitted_at,
        "cover_image_id": gallery.cover_image_id,
        "cover_image": ImageResponse.model_validate(gallery.cover_image)
        if (gallery.cover_image and not requires_password)
        else None,
        "user_id": gallery.user_id,
        "download_zip_url": gallery.download_zip_url if not requires_password else None,
    }


@router.post("/{id_or_slug}/access")
def unlock_client_gallery(
    id_or_slug: str, access_in: AccessRequest, db: Session = Depends(get_db)
):
    """
    Unlock password-protected gallery and retrieve a temporary access token.
    """
    gallery = get_gallery_by_id_or_slug(db, id_or_slug)
    if not gallery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Client gallery not found."
        )

    if not gallery.password_hash:
        return {"unlocked": True, "token": None}

    password_correct = False
    decrypted_pw = security.decrypt_password(gallery.password_hash)
    if decrypted_pw == access_in.password:
        password_correct = True
    else:
        try:
            password_correct = security.verify_password(
                access_in.password, gallery.password_hash
            )
        except Exception:
            pass

    if not password_correct:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect password."
        )

    token = create_gallery_token(gallery.id)
    return {"unlocked": True, "token": token}


@router.put("/{id}", response_model=ClientGalleryResponse)
def update_client_gallery(
    id: uuid.UUID,
    gallery_in: ClientGalleryUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_feature("galleries")),
):
    """
    Update client gallery settings. (Admin only)
    """
    db_gallery = db.query(ClientGallery).filter(ClientGallery.id == id).first()
    if not db_gallery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Client gallery not found."
        )

    update_data = gallery_in.model_dump(exclude_unset=True)
    if "slug" in update_data and update_data["slug"]:
        slug = slugify(update_data["slug"])
        existing = (
            db.query(ClientGallery)
            .filter(ClientGallery.slug == slug, ClientGallery.id != id)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A client gallery with this slug already exists.",
            )
        update_data["slug"] = slug

    for field, value in update_data.items():
        if field == "password" and value is not None:
            db_gallery.password_hash = security.encrypt_password(value)
        elif field == "cover_image_id":
            # Allow clearing/setting cover_image_id to None/null
            db_gallery.cover_image_id = value
        elif value is not None:
            setattr(db_gallery, field, value)

    db.add(db_gallery)
    db.commit()
    db.refresh(db_gallery)
    return db_gallery


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client_gallery(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_feature("galleries")),
):
    """
    Delete client gallery. (Admin only)
    """
    db_gallery = db.query(ClientGallery).filter(ClientGallery.id == id).first()
    if not db_gallery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Client gallery not found."
        )
    db.delete(db_gallery)
    db.commit()
    return None


@router.get("/{id_or_slug}/images", response_model=List[ClientGalleryImageResponse])
def list_client_gallery_images(
    id_or_slug: str, request: Request, db: Session = Depends(get_db)
):
    """
    List all images inside a private client gallery.
    """
    gallery = check_gallery_access(id_or_slug, request, db)

    images = (
        db.query(ClientGalleryImage)
        .filter(ClientGalleryImage.client_gallery_id == gallery.id)
        .join(Image, ClientGalleryImage.image_id == Image.id)
        .order_by(Image.sort_order.asc(), Image.created_at.desc())
        .all()
    )

    return images


@router.post(
    "/{id_or_slug}/images/{image_id}/select", response_model=ClientGalleryImageResponse
)
def select_gallery_image(
    id_or_slug: str,
    image_id: uuid.UUID,
    selection_in: SelectionUpdate,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Toggles the selection checkmark of a specific image inside a gallery.
    """
    gallery = check_gallery_access(id_or_slug, request, db)

    if not gallery.can_submit_selections:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Submitting selections has been disabled for this gallery.",
        )

    if gallery.selections_submitted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selections have already been submitted and finalized.",
        )

    db_cg_image = (
        db.query(ClientGalleryImage)
        .filter(
            ClientGalleryImage.client_gallery_id == gallery.id,
            ClientGalleryImage.image_id == image_id,
        )
        .first()
    )

    if not db_cg_image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found in this client gallery.",
        )

    db_cg_image.selected = selection_in.selected
    db.add(db_cg_image)
    db.commit()
    db.refresh(db_cg_image)
    return db_cg_image


@router.post("/{id_or_slug}/images", response_model=ClientGalleryImageResponse)
def add_image_from_media_library(
    id_or_slug: str,
    body: AddMediaToGalleryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    """
    Add an existing media library image to a client gallery. (Admin only)
    """
    gallery = get_gallery_by_id_or_slug(db, id_or_slug)
    if not gallery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client gallery not found.",
        )

    db_image = db.query(Image).filter(Image.id == body.image_id).first()
    if not db_image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media not found.",
        )

    if db_image.gallery_id is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This image is assigned to a portfolio gallery and cannot be added here.",
        )

    existing = (
        db.query(ClientGalleryImage)
        .filter(
            ClientGalleryImage.client_gallery_id == gallery.id,
            ClientGalleryImage.image_id == body.image_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This image is already in the gallery.",
        )

    db_cg_image = ClientGalleryImage(
        client_gallery_id=gallery.id,
        image_id=db_image.id,
        selected=False,
    )
    db.add(db_cg_image)

    if not gallery.cover_image_id:
        gallery.cover_image_id = db_image.id
        db.add(gallery)

    db.commit()
    db.refresh(db_cg_image)
    refresh_usage_count(db, db_image.id)
    return db_cg_image


@router.post("/{id_or_slug}/images/upload", response_model=ClientGalleryImageResponse)
async def upload_client_gallery_image(
    id_or_slug: str,
    request: Request,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    alt_text: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    """
    Upload an image for a client gallery.
    Admin can upload, or the client can upload if can_upload permission is set.
    """
    gallery = check_gallery_access(id_or_slug, request, db)
    user = get_current_user_optional(request, db)

    # If not admin, check if upload is allowed for client
    if not (user and user.role in [UserRole.ADMIN.value, UserRole.SUPER_ADMIN.value]):
        if not gallery.can_upload:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Uploading images to this gallery has been disabled.",
            )

    file_data = await file.read()
    try:
        # Process and upload the image using standard image service
        db_image = image_service.process_and_upload_image(
            db=db,
            file_data=file_data,
            original_filename=file.filename,
            gallery_id=None,  # Not in public gallery
            title=title,
            alt_text=alt_text,
            description=description,
        )

        # Link to client gallery
        db_cg_image = ClientGalleryImage(
            client_gallery_id=gallery.id, image_id=db_image.id, selected=False
        )
        db.add(db_cg_image)

        # Auto cover image update if none is set
        if not gallery.cover_image_id:
            gallery.cover_image_id = db_image.id
            db.add(gallery)

        db.commit()
        db.refresh(db_cg_image)
        refresh_usage_count(db, db_image.id)
        return db_cg_image

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete(
    "/{id_or_slug}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_client_gallery_image(
    id_or_slug: str,
    image_id: uuid.UUID,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Delete an image from a client gallery.
    Requires admin or delete permission enabled on gallery.
    """
    gallery = check_gallery_access(id_or_slug, request, db)
    user = get_current_user_optional(request, db)

    # If not admin, check if delete is allowed for client
    if not (user and user.role in [UserRole.ADMIN.value, UserRole.SUPER_ADMIN.value]):
        if not gallery.can_delete:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Deleting images from this gallery has been disabled.",
            )

    db_cg_image = (
        db.query(ClientGalleryImage)
        .filter(
            ClientGalleryImage.client_gallery_id == gallery.id,
            ClientGalleryImage.image_id == image_id,
        )
        .first()
    )

    if not db_cg_image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image link not found in this client gallery.",
        )

    # Remove junction only; the image file remains in the media library
    if gallery.cover_image_id == image_id:
        gallery.cover_image_id = None
        db.add(gallery)

    db.delete(db_cg_image)
    db.commit()
    refresh_usage_count(db, image_id)

    return None


@router.post("/{id_or_slug}/submit-selections")
def submit_gallery_selections(
    id_or_slug: str, request: Request, db: Session = Depends(get_db)
):
    """
    Lock and finalize the selected image checklist, then notify the admin.
    """
    gallery = check_gallery_access(id_or_slug, request, db)

    if not gallery.can_submit_selections:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Submitting selections has been disabled for this gallery.",
        )

    if gallery.selections_submitted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selections have already been submitted.",
        )

    # Verify client details (needs to be associated with an account)
    client_user = db.query(User).filter(User.id == gallery.user_id).first()
    client_email = client_user.email if client_user else "unknown@client.com"

    # Get selected images count
    selected_count = (
        db.query(ClientGalleryImage)
        .filter(
            ClientGalleryImage.client_gallery_id == gallery.id,
            ClientGalleryImage.selected == True,
        )
        .count()
    )

    # Mark as finalized
    gallery.selections_submitted = True
    gallery.selections_submitted_at = datetime.now(timezone.utc)
    db.add(gallery)
    db.commit()
    db.refresh(gallery)

    # Find admin email
    admin_users = (
        db.query(User)
        .filter(User.role.in_([UserRole.ADMIN.value, UserRole.SUPER_ADMIN.value]))
        .all()
    )
    admin_emails = (
        [a.email for a in admin_users]
        if admin_users
        else ["admin@pallaviphotography.com"]
    )

    for email in admin_emails:
        email_service.send_selections_submitted_email(
            admin_email=email,
            client_email=client_email,
            gallery_title=gallery.title,
            selected_count=selected_count,
        )

    return {
        "success": True,
        "detail": "Selections finalized and admin notified.",
        "submitted_at": gallery.selections_submitted_at,
        "selected_count": selected_count,
    }


@router.post("/{id_or_slug}/share")
def share_client_gallery(
    id_or_slug: str,
    email: str,
    plain_password: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user=Depends(require_feature("galleries")),
):
    """
    Dispatches direct gallery shared link and password to client via email. (Admin only)
    """
    gallery = get_gallery_by_id_or_slug(db, id_or_slug)
    if not gallery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Client gallery not found."
        )

    gallery_link = f"{settings.NEXTAUTH_URL}/client-galleries/{gallery.slug}"

    # Send email
    email_service.send_gallery_shared_email(
        to_email=email,
        gallery_title=gallery.title,
        gallery_link=gallery_link,
        password=plain_password,
    )

    return {"success": True, "detail": f"Gallery invite sent to {email}"}
