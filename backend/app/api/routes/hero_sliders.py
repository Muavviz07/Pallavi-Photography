import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.api.dependencies import get_db, get_current_admin_user, get_current_admin_or_client_user
from app.models.hero_slide import HeroSlide
from app.models.user import User
from app.schemas.hero_slide import HeroSlideCreate, HeroSlideUpdate, HeroSlideResponse

router = APIRouter(prefix="/hero-sliders", tags=["hero-sliders"])

# Public: get all active slides
@router.get("", response_model=List[HeroSlideResponse])
def get_active_slides(db: Session = Depends(get_db)):
    return db.query(HeroSlide).filter(HeroSlide.is_active == True).order_by(HeroSlide.order.asc()).all()

# Admin/Client: list all slides
@router.get("/all", response_model=List[HeroSlideResponse])
def get_all_slides(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_or_client_user)
):
    return db.query(HeroSlide).order_by(HeroSlide.order.asc()).all()

# Admin only: create slide
@router.post("", response_model=HeroSlideResponse, status_code=status.HTTP_201_CREATED)
def create_slide(
    slide_in: HeroSlideCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    db_slide = HeroSlide(**slide_in.dict())
    db.add(db_slide)
    db.commit()
    db.refresh(db_slide)
    return db_slide

# Admin only: update slide
@router.patch("/{slide_id}", response_model=HeroSlideResponse)
def update_slide(
    slide_id: uuid.UUID,
    slide_in: HeroSlideUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    db_slide = db.query(HeroSlide).filter(HeroSlide.id == slide_id).first()
    if not db_slide:
        raise HTTPException(status_code=404, detail="Hero slide not found")
        
    for field, value in slide_in.dict(exclude_unset=True).items():
        setattr(db_slide, field, value)
        
    db.commit()
    db.refresh(db_slide)
    return db_slide

# Admin only: delete slide
@router.delete("/{slide_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_slide(
    slide_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    db_slide = db.query(HeroSlide).filter(HeroSlide.id == slide_id).first()
    if not db_slide:
        raise HTTPException(status_code=404, detail="Hero slide not found")
        
    db.delete(db_slide)
    db.commit()
    return
