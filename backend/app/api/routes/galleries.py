import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.api.dependencies import (
    get_db,
    get_current_admin_user,
    get_current_admin_or_client_user,
)
from app.models.gallery import PortfolioGallery
from app.models.gallery_image import GalleryImage
from app.models.image import Image
from app.schemas.gallery import GalleryCreate, GalleryUpdate, GalleryResponse, GalleryDetailResponse
from app.schemas.image import ImageResponse
from app.schemas.media import AddMediaToGalleryRequest
from app.services.image_service import image_service
from app.services.media_service import refresh_usage_count, can_delete_media

router = APIRouter()


def get_gallery_by_id_or_slug(db: Session, id_or_slug: str) -> Optional[PortfolioGallery]:
    try:
        gallery_uuid = uuid.UUID(id_or_slug)
        return db.query(PortfolioGallery).filter(PortfolioGallery.id == gallery_uuid).first()
    except ValueError:
        return db.query(PortfolioGallery).filter(PortfolioGallery.slug == id_or_slug).first()


@router.get("", response_model=List[GalleryResponse])
def list_galleries(
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    """
    List galleries. Public access shows only active ones by default.
    """
    query = db.query(PortfolioGallery)
    if is_active is not None:
        query = query.filter(PortfolioGallery.is_active == is_active)

    return query.order_by(PortfolioGallery.order_position.asc(), PortfolioGallery.created_at.desc()).all()


@router.post("", response_model=GalleryResponse, status_code=status.HTTP_201_CREATED)
def create_gallery(
    gallery_in: GalleryCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_or_client_user),
):
    """
    Create a new gallery. (Admin only)
    """
    # Check if slug exists
    existing = db.query(PortfolioGallery).filter(PortfolioGallery.slug == gallery_in.slug).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A gallery with this slug already exists.",
        )

    db_gallery = PortfolioGallery(
        name=gallery_in.name,
        slug=gallery_in.slug,
        description=gallery_in.description,
        cover_media_id=gallery_in.cover_media_id,
        is_active=gallery_in.is_active if gallery_in.is_active is not None else True,
        order_position=gallery_in.order_position if gallery_in.order_position is not None else 0,
    )
    db.add(db_gallery)
    db.commit()
    db.refresh(db_gallery)
    return db_gallery


@router.get("/{id_or_slug}", response_model=GalleryDetailResponse)
def get_gallery(id_or_slug: str, db: Session = Depends(get_db)):
    """
    Get a single gallery by ID or slug.
    """
    gallery = get_gallery_by_id_or_slug(db, id_or_slug)
    if not gallery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Gallery not found."
        )
    
    images_list = []
    # Sort by order_position ascending
    sorted_gi = sorted(gallery.gallery_images, key=lambda x: x.order_position)
    for gi in sorted_gi:
        img_obj = gi.image
        dims = img_obj.dimensions if isinstance(img_obj.dimensions, dict) else {}
        images_list.append({
            "id": img_obj.id,
            "url": img_obj.optimized_url or img_obj.original_url or f"/api/media/proxy/{img_obj.id}",
            "thumbnail_url": img_obj.thumbnail_url or img_obj.optimized_url or img_obj.original_url or f"/api/media/proxy/{img_obj.id}",
            "original_url": img_obj.original_url or img_obj.optimized_url or f"/api/media/proxy/{img_obj.id}",
            "title": img_obj.title,
            "alt_text": img_obj.alt_text,
            "aspect": dims.get("aspect") if dims else None,
            "order_position": gi.order_position
        })
        
    return {
        "id": gallery.id,
        "name": gallery.name,
        "slug": gallery.slug,
        "description": gallery.description,
        "cover_url": gallery.cover_url,
        "images": images_list
    }


@router.put("/{id}", response_model=GalleryResponse)
def update_gallery(
    id: uuid.UUID,
    gallery_in: GalleryUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_or_client_user),
):
    """
    Update a gallery's metadata. (Admin only)
    """
    db_gallery = db.query(PortfolioGallery).filter(PortfolioGallery.id == id).first()
    if not db_gallery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Gallery not found."
        )

    update_data = gallery_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if value is not None:
            setattr(db_gallery, field, value)

    db.add(db_gallery)
    db.commit()
    db.refresh(db_gallery)
    return db_gallery


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_gallery(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_or_client_user),
):
    """
    Delete a gallery. (Admin only)
    """
    db_gallery = db.query(PortfolioGallery).filter(PortfolioGallery.id == id).first()
    if not db_gallery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Gallery not found."
        )
    db.delete(db_gallery)
    db.commit()
    return None


@router.get("/{id_or_slug}/images", response_model=List[ImageResponse])
def list_gallery_images(
    id_or_slug: str, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)
):
    """
    List images for a specific gallery.
    """
    gallery = get_gallery_by_id_or_slug(db, id_or_slug)
    if not gallery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Gallery not found."
        )

    images = (
        db.query(Image)
        .join(GalleryImage, GalleryImage.image_media_id == Image.id)
        .filter(GalleryImage.gallery_id == gallery.id)
        .order_by(GalleryImage.order_position.asc(), Image.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return images


@router.post("/{id}/upload", response_model=ImageResponse)
async def upload_gallery_image(
    id: uuid.UUID,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    alt_text: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    aspect: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_or_client_user),
):
    """
    Upload and process an image to be associated with a gallery. (Admin only)
    """
    db_gallery = db.query(PortfolioGallery).filter(PortfolioGallery.id == id).first()
    if not db_gallery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Gallery not found."
        )

    file_data = await file.read()
    try:
        db_image = image_service.process_and_upload_image(
            db=db,
            file_data=file_data,
            original_filename=file.filename,
            title=title,
            alt_text=alt_text,
            description=description,
            aspect=aspect,
        )
        order = len(db_gallery.gallery_images)
        gi = GalleryImage(gallery_id=db_gallery.id, image_media_id=db_image.id, order_position=order)
        db.add(gi)
        if not db_gallery.cover_media_id:
            db_gallery.cover_media_id = db_image.id
            db.add(db_gallery)
        db.commit()
        refresh_usage_count(db, db_image.id)
        db.refresh(db_image)
        return db_image
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_image(
    image_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_or_client_user),
):
    """
    Remove an image from all portfolio galleries.
    The image file remains in the media library.
    """
    db.query(GalleryImage).filter(GalleryImage.image_media_id == image_id).delete()
    db.commit()
    refresh_usage_count(db, image_id)

    return None


@router.put("/images/{image_id}", response_model=ImageResponse)
def update_image_metadata(
    image_id: uuid.UUID,
    title: Optional[str] = Form(None),
    alt_text: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    sort_order: Optional[int] = Form(None),
    aspect: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_or_client_user),
):
    """
    Update image metadata. (Admin only)
    """
    db_image = db.query(Image).filter(Image.id == image_id).first()
    if not db_image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Image not found."
        )

    if title is not None:
        db_image.title = title
    if alt_text is not None:
        db_image.alt_text = alt_text
    if description is not None:
        db_image.description = description
    if sort_order is not None:
        db_image.sort_order = sort_order
    if aspect is not None:
        # Merge or update the dimensions dict
        from sqlalchemy.orm.attributes import flag_modified

        dims = dict(db_image.dimensions) if db_image.dimensions else {}
        dims["aspect"] = aspect
        db_image.dimensions = dims
        flag_modified(db_image, "dimensions")

    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    return db_image


@router.post("/{id}/images", response_model=ImageResponse)
def add_image_from_media_library(
    id: uuid.UUID,
    body: AddMediaToGalleryRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_or_client_user),
):
    """
    Add an existing media library image to a portfolio gallery.
    """
    db_gallery = db.query(PortfolioGallery).filter(PortfolioGallery.id == id).first()
    if not db_gallery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gallery not found.",
        )

    db_image = db.query(Image).filter(Image.id == body.image_id).first()
    if not db_image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media not found.",
        )

    existing = (
        db.query(GalleryImage)
        .filter(
            GalleryImage.gallery_id == id,
            GalleryImage.image_media_id == body.image_id,
        )
        .first()
    )
    if not existing:
        gi = GalleryImage(
            gallery_id=id,
            image_media_id=body.image_id,
            order_position=body.sort_order if body.sort_order is not None else 0,
        )
        db.add(gi)

    if not db_gallery.cover_media_id:
        db_gallery.cover_media_id = db_image.id

    db.add(db_gallery)
    db.commit()
    db.refresh(db_image)
    refresh_usage_count(db, db_image.id)
    return db_image


@router.put("/admin/{gallery_id}/images/{image_id}")
@router.put("/{gallery_id}/images/{image_id}")
def reorder_gallery_image(
    gallery_id: uuid.UUID,
    image_id: uuid.UUID,
    body: dict,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_or_client_user),
):
    """Reorder an image in the gallery."""
    gi = db.query(GalleryImage).filter(
        GalleryImage.gallery_id == gallery_id,
        GalleryImage.image_media_id == image_id
    ).first()
    if not gi:
        raise HTTPException(status_code=404, detail="Image association not found in this gallery")
    
    order_pos = body.get("order_position", 0)
    gi.order_position = order_pos
    db.add(gi)
    db.commit()
    return {"message": "Reordered successfully"}


@router.delete("/admin/{gallery_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
@router.delete("/{gallery_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_image_from_gallery(
    gallery_id: uuid.UUID,
    image_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_admin_or_client_user),
):
    """Remove an image from a gallery."""
    gi = db.query(GalleryImage).filter(
        GalleryImage.gallery_id == gallery_id,
        GalleryImage.image_media_id == image_id
    ).first()
    if not gi:
        raise HTTPException(status_code=404, detail="Image association not found")
        
    db.delete(gi)
    
    # If this was the cover image, clear it or pick another one
    gallery = db.query(PortfolioGallery).filter(PortfolioGallery.id == gallery_id).first()
    if gallery and gallery.cover_media_id == image_id:
        # Find next available image
        next_img = db.query(GalleryImage).filter(GalleryImage.gallery_id == gallery_id).first()
        gallery.cover_media_id = next_img.image_media_id if next_img else None
        db.add(gallery)
        
    db.commit()
    refresh_usage_count(db, image_id)
    return None
