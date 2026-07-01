import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.api.dependencies import get_db, get_current_admin_user
from app.models.faq import FAQ
from app.models.user import User
from app.schemas.faq import FAQCreate, FAQUpdate, FAQResponse

router = APIRouter(prefix="/faqs", tags=["faqs"])

# Public: get all FAQ items ordered by category and order index
@router.get("", response_model=List[FAQResponse])
def get_all_faqs(db: Session = Depends(get_db)):
    return db.query(FAQ).order_by(FAQ.category, FAQ.order).all()

# Admin: create a new FAQ item
@router.post("", response_model=FAQResponse, status_code=status.HTTP_201_CREATED)
def create_faq(
    faq_in: FAQCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    faq = FAQ(**faq_in.dict())
    db.add(faq)
    db.commit()
    db.refresh(faq)
    return faq

# Admin: update an existing FAQ item
@router.patch("/{faq_id}", response_model=FAQResponse)
def update_faq(
    faq_id: uuid.UUID,
    faq_in: FAQUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    faq = db.query(FAQ).filter(FAQ.id == faq_id).first()
    if not faq:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="FAQ item not found."
        )
        
    for field, value in faq_in.dict(exclude_unset=True).items():
        setattr(faq, field, value)
        
    db.commit()
    db.refresh(faq)
    return faq

# Admin: delete an FAQ item
@router.delete("/{faq_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_faq(
    faq_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    faq = db.query(FAQ).filter(FAQ.id == faq_id).first()
    if not faq:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="FAQ item not found."
        )
        
    db.delete(faq)
    db.commit()
    return None
