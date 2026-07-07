import uuid
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_admin_user
from app.models.image import Image
from app.models.gallery_image import GalleryImage
from app.models.client_gallery_image import ClientGalleryImage
from app.models.gallery import Gallery
from app.models.client_gallery import ClientGallery
from app.models.blog import Blog
from app.models.hero_slide import HeroSlide
from app.models.about_section import AboutSection
from app.models.user import User
from app.schemas.media import MediaResponse, MediaListResponse, MediaUpdate
from app.services.image_service import image_service
from app.services.media_service import refresh_usage_count, can_delete_media

router = APIRouter()

ALLOWED_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
    "application/zip",
    "application/x-zip-compressed",
    "application/octet-stream",  # some browsers send zip as this
}


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
    filename_lower = (file.filename or "").lower()
    is_zip = filename_lower.endswith(".zip") or "zip" in content_type
    is_image = any(t in content_type for t in ("image/jpeg", "image/png", "image/webp"))

    if not (is_image or is_zip):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPEG, PNG, WebP images and ZIP archives are allowed.",
        )

    # Read file bytes then reset pointer for downstream processing (no size limit)
    file_bytes = await file.read()
    if hasattr(file.file, "seek"):
        file.file.seek(0)

    image_info = await image_service.upload_image(file)

    db_image = Image(
        id=uuid.uuid4(),
        original_url=image_info["file_url"],
        optimized_url=None,
        thumbnail_url=None,
        original_filename=file.filename,
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

    # Batch compute exact usage counts and self-heal any out-of-sync db records
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

    # Self-heal single queried image
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
    """Delete media from the library. Only if not in use."""
    # Check if deletable first
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

    # Clean up Blog, Hero, and About section references if any (since they are safe to clear)
    urls = [db_image.original_url]
    if db_image.optimized_url:
        urls.append(db_image.optimized_url)
    if db_image.thumbnail_url:
        urls.append(db_image.thumbnail_url)

    db.query(Blog).filter(Blog.thumbnail_media_id == media_id).update(
        {"thumbnail_media_id": None}, synchronize_session=False
    )
    db.query(HeroSlide).filter(HeroSlide.image_url.in_(urls)).update(
        {"image_url": None}, synchronize_session=False
    )
    db.query(AboutSection).filter(AboutSection.image_url.in_(urls)).update(
        {"image_url": None}, synchronize_session=False
    )
    db.commit()


    # Extract filename from stored URL
    filename = db_image.original_url.split("/")[-1]
    # Delete the file from disk
    file_deleted = image_service.delete_image(filename)
    if not file_deleted:
        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to delete image file: {filename}")

    # Delete the DB record
    db.delete(db_image)
    db.commit()

    return {"message": "Media deleted successfully"}
