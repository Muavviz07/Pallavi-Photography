import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_admin_user, get_current_admin_or_client_user
from app.models.gallery import Gallery, GalleryStatus
from app.models.image import Image
from app.schemas.gallery import GalleryCreate, GalleryUpdate, GalleryResponse
from app.schemas.image import ImageResponse
from app.services.image_service import image_service

router = APIRouter()

def get_gallery_by_id_or_slug(db: Session, id_or_slug: str) -> Optional[Gallery]:
    try:
        gallery_uuid = uuid.UUID(id_or_slug)
        return db.query(Gallery).filter(Gallery.id == gallery_uuid).first()
    except ValueError:
        return db.query(Gallery).filter(Gallery.slug == id_or_slug).first()

@router.get("", response_model=List[GalleryResponse])
def list_galleries(
    category: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    List galleries. Public access shows only PUBLISHED by default.
    Admin can filter by status.
    """
    query = db.query(Gallery)
    if category:
        query = query.filter(Gallery.category == category)
    
    if status:
        query = query.filter(Gallery.status == status)
    else:
        # Default to public published check
        query = query.filter(Gallery.status == GalleryStatus.PUBLISHED.value)
        
    return query.order_by(Gallery.sort_order.asc(), Gallery.created_at.desc()).all()

@router.post("", response_model=GalleryResponse, status_code=status.HTTP_201_CREATED)
def create_gallery(
    gallery_in: GalleryCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_or_client_user)
):
    """
    Create a new gallery. (Admin only)
    """
    # Check if slug exists
    existing = db.query(Gallery).filter(Gallery.slug == gallery_in.slug).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A gallery with this slug already exists."
        )
    
    db_gallery = Gallery(
        title=gallery_in.title,
        slug=gallery_in.slug,
        description=gallery_in.description,
        category=gallery_in.category,
        status=gallery_in.status.value if gallery_in.status else GalleryStatus.DRAFT.value,
        sort_order=gallery_in.sort_order
    )
    db.add(db_gallery)
    db.commit()
    db.refresh(db_gallery)
    return db_gallery

@router.get("/{id_or_slug}", response_model=GalleryResponse)
def get_gallery(id_or_slug: str, db: Session = Depends(get_db)):
    """
    Get a single gallery by ID or slug.
    """
    gallery = get_gallery_by_id_or_slug(db, id_or_slug)
    if not gallery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gallery not found."
        )
    return gallery

@router.put("/{id}", response_model=GalleryResponse)
def update_gallery(
    id: uuid.UUID,
    gallery_in: GalleryUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_or_client_user)
):
    """
    Update a gallery's metadata. (Admin only)
    """
    db_gallery = db.query(Gallery).filter(Gallery.id == id).first()
    if not db_gallery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gallery not found."
        )
    
    update_data = gallery_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "status" and value is not None:
            setattr(db_gallery, field, value.value)
        elif value is not None:
            setattr(db_gallery, field, value)
            
    db.add(db_gallery)
    db.commit()
    db.refresh(db_gallery)
    return db_gallery

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_gallery(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_or_client_user)
):
    """
    Delete a gallery. (Admin only)
    """
    db_gallery = db.query(Gallery).filter(Gallery.id == id).first()
    if not db_gallery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gallery not found."
        )
    db.delete(db_gallery)
    db.commit()
    return None

@router.get("/{id_or_slug}/images", response_model=List[ImageResponse])
def list_gallery_images(
    id_or_slug: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    List images for a specific gallery.
    """
    gallery = get_gallery_by_id_or_slug(db, id_or_slug)
    if not gallery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gallery not found."
        )
        
    images = db.query(Image)\
        .filter(Image.gallery_id == gallery.id)\
        .order_by(Image.sort_order.asc(), Image.created_at.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()
    return images

@router.post("/{id}/upload", response_model=ImageResponse)
async def upload_gallery_image(
    id: uuid.UUID,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    alt_text: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_or_client_user)
):
    """
    Upload and process an image to be associated with a gallery. (Admin only)
    """
    db_gallery = db.query(Gallery).filter(Gallery.id == id).first()
    if not db_gallery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gallery not found."
        )
    
    file_data = await file.read()
    try:
        db_image = image_service.process_and_upload_image(
            db=db,
            file_data=file_data,
            original_filename=file.filename,
            gallery_id=db_gallery.id,
            title=title,
            alt_text=alt_text,
            description=description
        )
        return db_image
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_image(
    image_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_or_client_user)
):
    """
    Delete an image record and remove it from storage. (Admin only)
    """
    success = image_service.delete_image_record(db, image_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found."
        )
    return None

@router.put("/images/{image_id}", response_model=ImageResponse)
def update_image_metadata(
    image_id: uuid.UUID,
    title: Optional[str] = Form(None),
    alt_text: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    sort_order: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_or_client_user)
):
    """
    Update image metadata. (Admin only)
    """
    db_image = db.query(Image).filter(Image.id == image_id).first()
    if not db_image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found."
        )
        
    if title is not None:
        db_image.title = title
    if alt_text is not None:
        db_image.alt_text = alt_text
    if description is not None:
        db_image.description = description
    if sort_order is not None:
        db_image.sort_order = sort_order
        
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    return db_image
