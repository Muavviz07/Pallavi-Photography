import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_admin_user
from app.models.image import Image
from app.models.user import User
from app.schemas.media import MediaResponse, MediaListResponse, MediaUpdate
from app.services.image_service import image_service
from app.services.media_service import refresh_usage_count, can_delete_media

router = APIRouter()

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
MAX_SIZE = 10 * 1024 * 1024


def _to_media_response(db_image: Image) -> MediaResponse:
    return MediaResponse.model_validate(db_image)


@router.post("", response_model=MediaResponse, status_code=status.HTTP_201_CREATED)
async def upload_media(
    file: UploadFile = File(...),
    title: Optional[str] = Form(default=None),
    description: Optional[str] = Form(default=""),
    alt_text: Optional[str] = Form(default=""),
    category: Optional[str] = Form(default=None),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """Upload a new image to the centralized media library."""
    content_type = (file.content_type or "").lower()
    if content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG, and WebP images are allowed.",
        )

    file_data = await file.read()
    if len(file_data) > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size must be under 10MB.",
        )

    try:
        db_image = image_service.process_and_upload_image(
            db=db,
            file_data=file_data,
            original_filename=file.filename or "upload.jpg",
            gallery_id=None,
            title=title,
            alt_text=alt_text or None,
            description=description or None,
            uploaded_by_id=current_user.id,
            category=category or None,
        )
        return _to_media_response(db_image)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("", response_model=MediaListResponse)
def list_media(
    category: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db),
):
    """List all media in the library with optional filters."""
    query = db.query(Image)

    if category:
        query = query.filter(Image.category == category)

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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found.")
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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found.")

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
    """Delete media from the library. Blocked if still referenced anywhere."""
    deletable, usage = can_delete_media(db, media_id)
    if not deletable:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete. This media is used in {usage} place(s). Remove from galleries first.",
        )

    success = image_service.delete_image_record(db, media_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found.")

    return {"message": "Media deleted successfully"}
