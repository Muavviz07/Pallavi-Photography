from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.api.dependencies import get_db, get_current_admin_user
from app.models.pricing_section import PricingSection
from app.models.user import User
from app.schemas.pricing_section import PricingSectionUpdate, PricingSectionResponse

router = APIRouter(prefix="/pricing", tags=["pricing"])

# Public: get all pricing sections
@router.get("", response_model=List[PricingSectionResponse])
def get_all_pricing_sections(db: Session = Depends(get_db)):
    return db.query(PricingSection).all()

# Public: get pricing section details for a category
@router.get("/{category}", response_model=PricingSectionResponse)
def get_pricing_section(category: str, db: Session = Depends(get_db)):
    pricing = db.query(PricingSection).filter(PricingSection.category == category.lower()).first()
    if not pricing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pricing details for category '{category}' not found."
        )
    return pricing

# Admin only: update or create pricing section details for a category
@router.patch("/{category}", response_model=PricingSectionResponse)
def update_pricing_section(
    category: str,
    pricing_in: PricingSectionUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    category_lower = category.lower()
    pricing = db.query(PricingSection).filter(PricingSection.category == category_lower).first()
    if not pricing:
        pricing = PricingSection(category=category_lower, title=category.upper())
        db.add(pricing)
        db.commit()
        db.refresh(pricing)
        
    for field, value in pricing_in.dict(exclude_unset=True).items():
        setattr(pricing, field, value)
        
    db.commit()
    db.refresh(pricing)
    return pricing
