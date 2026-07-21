import uuid
import logging
import urllib.parse
from typing import Optional
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    UploadFile,
    File,
    Form,
    Query,
    Request,
    Response,
)
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_admin_user
from app.models.image import Image
from app.models.blog import Blog
from app.models.about_section import AboutSection
from app.models.user import User
from app.schemas.media import (
    MediaResponse,
    MediaListResponse,
    MediaUpdate,
    MediaUploadResponse,
    RefreshUrlResponse,
)
from app.services.image_service import image_service
from app.services.s3_service import s3_service
from app.services.media_service import refresh_usage_count, can_delete_media

router = APIRouter()
logger = logging.getLogger(__name__)


ALLOWED_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
    "application/zip",
    "application/x-zip-compressed",
    "application/octet-stream",
}


def _to_media_response(db_image: Image) -> MediaResponse:
    return MediaResponse.model_validate(db_image)


@router.get("/public/{s3_key:path}")
def get_public_media_proxy(
    s3_key: str,
    request: Request,
):
    """
    Public website asset proxy endpoint.
    Streams image bytes directly from Garage S3 with full HTTP caching support (ETag, Last-Modified, 304 Not Modified).
    Frontend clients never access S3/Garage directly for public assets.
    """
    unquoted_key = urllib.parse.unquote(s3_key)
    try:
        meta = s3_service.get_object_metadata_and_stream(unquoted_key)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Public media asset not found: {str(e)}",
        )

    etag = meta.get("etag")
    if_none_match = request.headers.get("if-none-match")
    if etag and if_none_match and if_none_match.strip('"') == etag.strip('"'):
        return Response(status_code=status.HTTP_304_NOT_MODIFIED)

    headers = {
        "Cache-Control": "public, max-age=31536000, immutable",
    }
    if etag:
        headers["ETag"] = etag
    if meta.get("last_modified"):
        headers["Last-Modified"] = str(meta["last_modified"])

    return StreamingResponse(
        content=meta["stream"],
        media_type=meta["content_type"],
        headers=headers,
    )


@router.post("", response_model=MediaResponse, status_code=status.HTTP_201_CREATED)
async def upload_media(
    file: UploadFile = File(...),
    image_type: Optional[str] = Form(default="public"),
    client_id: Optional[str] = Form(default=None),
    title: Optional[str] = Form(default=None),
    description: Optional[str] = Form(default=""),
    alt_text: Optional[str] = Form(default=""),
    category: Optional[str] = Form(default=None),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """
    Single authoritative upload endpoint.
    Stores immutable metadata in DB (zero presigned URLs persisted).
    """
    print(f"[API media.py] STEP 1: Incoming upload for file='{file.filename}', image_type='{image_type}'")
    logger.info(f"[API media.py] STEP 1: Incoming upload for file='{file.filename}', image_type='{image_type}'")

    content_type = (file.content_type or "").lower()
    filename_lower = (file.filename or "").lower()
    is_zip = filename_lower.endswith(".zip") or "zip" in content_type
    is_image = any(t in content_type for t in ("image/jpeg", "image/png", "image/webp", "image/jpg"))

    if not (is_image or is_zip):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG, WebP images and ZIP archives are allowed.",
        )

    image_info = await image_service.upload_image(
        file, image_type=image_type or "public", client_id=client_id, db=db
    )

    s3_key_val = image_info.get("s3_key")
    db_image = Image(
        id=uuid.uuid4(),
        file_name=image_info.get("filename"),
        original_filename=file.filename,
        original_url=f"/api/media/public/{s3_key_val}" if s3_key_val else "",
        s3_key=s3_key_val,
        s3_url=f"/api/media/public/{s3_key_val}" if s3_key_val else "",
        image_type=image_info.get("image_type", "public"),
        client_id=image_info.get("client_id"),
        content_type=file.content_type,
        title=title,
        description=description,
        alt_text=alt_text,
        category=category,
        uploaded_by_id=current_user.id,
        file_size=image_info.get("file_size"),
    )
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    refresh_usage_count(db, db_image.id)
    db.refresh(db_image)

    return _to_media_response(db_image)


@router.post("/upload-site-media", response_model=MediaUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_site_media_endpoint(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Upload public site image."""
    res = await upload_media(
        file=file, image_type="public", current_user=current_user, db=db
    )
    return MediaUploadResponse(
        id=res.id,
        file_url=res.file_url,
        s3_key=res.s3_key,
        image_type="public",
        message="Public site image uploaded",
    )


@router.post("/upload-client-gallery/{client_id}", response_model=MediaUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_client_gallery_endpoint(
    client_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Upload client gallery image."""
    res = await upload_media(
        file=file, image_type="client_gallery", client_id=client_id, current_user=current_user, db=db
    )
    return MediaUploadResponse(
        id=res.id,
        file_url=res.file_url,
        s3_key=res.s3_key,
        image_type="client_gallery",
        message="Client gallery image uploaded",
    )


@router.get("/refresh-url/{image_id}", response_model=RefreshUrlResponse)
def refresh_image_url(
    image_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Generate fresh short-lived presigned URL at runtime for private gallery image."""
    db_image = db.query(Image).filter(Image.id == image_id).first()
    if not db_image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Image not found."
        )

    if not db_image.s3_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Image has no S3 key."
        )

    fresh_url = s3_service.get_presigned_url(db_image.s3_key)
    return RefreshUrlResponse(
        s3_url=fresh_url,
        message="URL refreshed",
    )


@router.get("", response_model=MediaListResponse)
def list_media(
    category: Optional[str] = None,
    image_type: Optional[str] = Query(default=None, description="Filter by image_type ('public', 'client_gallery')"),
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """List all media in the library with optional category/image_type filters."""
    query = db.query(Image)

    if category:
        query = query.filter(Image.category == category)

    if image_type:
        query = query.filter(Image.image_type == image_type)

    if search:
        term = f"%{search.lower()}%"
        query = query.filter(
            (Image.original_filename.ilike(term))
            | (Image.title.ilike(term))
            | (Image.description.ilike(term))
        )

    total = query.count()
    media_list = (
        query.order_by(Image.created_at.desc())
        .offset(skip)
        .limit(min(limit, 100))
        .all()
    )

    from app.services.media_service import bulk_compute_usage_counts
    computed_counts = bulk_compute_usage_counts(db, media_list)
    
    db_updated = False
    for m in media_list:
        actual_count = computed_counts.get(m.id, 0)
        if m.usage_count != actual_count:
            m.usage_count = actual_count
            db.add(m)
            db_updated = True
            
    if db_updated:
        db.commit()
        for m in media_list:
            db.refresh(m)

    return MediaListResponse(
        items=[_to_media_response(m) for m in media_list],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/{media_id}", response_model=MediaResponse)
def get_media(
    media_id: uuid.UUID,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Get a single media item by ID."""
    db_image = db.query(Image).filter(Image.id == media_id).first()
    if not db_image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Media not found."
        )

    from app.services.media_service import compute_usage_count
    actual_count = compute_usage_count(db, db_image.id)
    if db_image.usage_count != actual_count:
        db_image.usage_count = actual_count
        db.add(db_image)
        db.commit()
        db.refresh(db_image)

    return _to_media_response(db_image)


@router.patch("/{media_id}", response_model=MediaResponse)
def update_media(
    media_id: uuid.UUID,
    media_in: MediaUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Update media metadata (not the file itself)."""
    db_image = db.query(Image).filter(Image.id == media_id).first()
    if not db_image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Media not found."
        )

    update_data = media_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_image, field, value)

    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    return _to_media_response(db_image)


@router.delete("/{media_id}")
def delete_media(
    media_id: uuid.UUID,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Delete media from the library. Single authoritative delete flow."""
    deletable, usage = can_delete_media(db, media_id)
    if not deletable:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete. This media is used in {usage} place(s). It may be set as a cover image or referenced elsewhere.",
        )

    db_image = db.query(Image).filter(Image.id == media_id).first()
    if not db_image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Media not found."
        )

    db.query(Blog).filter(Blog.thumbnail_media_id == media_id).update(
        {"thumbnail_media_id": None}, synchronize_session=False
    )
    db.query(AboutSection).filter(AboutSection.image_url.in_([db_image.s3_key, db_image.original_url])).update(
        {"image_url": None}, synchronize_session=False
    )
    db.commit()

    image_service.delete_image_record(db, media_id)
    return {"message": "Media deleted successfully"}
