import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.api.dependencies import get_db
from app.models.hero_slide import HeroSlide
from app.schemas.hero_slide import HeroSlideResponse

router = APIRouter(prefix="/hero-slides", tags=["hero-slides"])

@router.get("", response_model=List[HeroSlideResponse])
def get_active_slides(db: Session = Depends(get_db)):
    """
    Get all active hero slides sorted by order_position.
    """
    return db.query(HeroSlide).filter(
        HeroSlide.is_active == True
    ).order_by(HeroSlide.order_position.asc()).all()
