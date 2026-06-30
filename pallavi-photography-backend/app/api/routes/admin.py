from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.api.dependencies import get_db, get_current_admin_user
from app.models.client_gallery import ClientGallery
from app.models.client_gallery_image import ClientGalleryImage
from app.models.user import User
from app.schemas.client_gallery import ClientGalleryCreate, ClientGalleryUpdate, ClientGalleryResponse
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter(prefix="/admin", tags=["admin"])

# Galleries CRUD
@router.get("/galleries", response_model=List[ClientGalleryResponse])
def list_galleries(db: Session = Depends(get_db), admin: User = Depends(get_current_admin_user)):
    return db.query(ClientGallery).all()

@router.post("/galleries", response_model=ClientGalleryResponse, status_code=status.HTTP_201_CREATED)
def create_gallery(gallery_in: ClientGalleryCreate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin_user)):
    db_gallery = ClientGallery(**gallery_in.dict())
    db.add(db_gallery)
    db.commit()
    db.refresh(db_gallery)
    return db_gallery

@router.put("/galleries/{gallery_id}", response_model=ClientGalleryResponse)
def update_gallery(gallery_id: int, gallery_in: ClientGalleryUpdate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin_user)):
    gallery = db.query(ClientGallery).filter(ClientGallery.id == gallery_id).first()
    if not gallery:
        raise HTTPException(status_code=404, detail="Gallery not found")
    for field, value in gallery_in.dict(exclude_unset=True).items():
        setattr(gallery, field, value)
    db.commit()
    db.refresh(gallery)
    return gallery

@router.delete("/galleries/{gallery_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_gallery(gallery_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin_user)):
    gallery = db.query(ClientGallery).filter(ClientGallery.id == gallery_id).first()
    if not gallery:
        raise HTTPException(status_code=404, detail="Gallery not found")
    db.delete(gallery)
    db.commit()
    return

# Users CRUD (partial)
@router.get("/users", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db), admin: User = Depends(get_current_admin_user)):
    return db.query(User).all()

@router.patch("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_in: UserUpdate, db: Session = Depends(get_db), admin: User = Depends(get_current_admin_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user_in.role:
        user.role = user_in.role
    if user_in.status:
        user.status = user_in.status
    db.commit()
    db.refresh(user)
    return user

# Simple analytics
@router.get("/analytics")
def get_analytics(db: Session = Depends(get_db), admin: User = Depends(get_current_admin_user)):
    total_galleries = db.query(ClientGallery).count()
    total_images = db.query(ClientGalleryImage).count()
    total_users = db.query(User).count()
    return {
        "total_galleries": total_galleries,
        "total_images": total_images,
        "total_users": total_users,
    }
