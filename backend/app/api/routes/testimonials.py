import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.api.dependencies import get_db, get_current_admin_user
from app.models.testimonial import Testimonial
from app.models.user import User
from app.schemas.testimonial import TestimonialCreate, TestimonialUpdate, TestimonialResponse

router = APIRouter(prefix="/testimonials", tags=["testimonials"])

# Public route to list testimonials (published only)
@router.get("", response_model=List[TestimonialResponse])
def list_published_testimonials(
    db: Session = Depends(get_db),
    category: Optional[str] = Query(None)
):
    query = db.query(Testimonial).filter(Testimonial.published == True)
    if category:
        query = query.filter(Testimonial.category == category)
    return query.order_by(Testimonial.created_at.desc()).all()

# Admin create testimonial
@router.post("", response_model=TestimonialResponse, status_code=status.HTTP_201_CREATED)
def admin_create_testimonial(
    testimonial_in: TestimonialCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    db_testimonial = Testimonial(**testimonial_in.dict())
    db.add(db_testimonial)
    db.commit()
    db.refresh(db_testimonial)
    return db_testimonial

# Admin list all testimonials
@router.get("/admin/all", response_model=List[TestimonialResponse])
def admin_list_testimonials(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    return db.query(Testimonial).order_by(Testimonial.created_at.desc()).all()

# Admin update testimonial
@router.put("/admin/{testimonial_id}", response_model=TestimonialResponse)
def admin_update_testimonial(
    testimonial_id: uuid.UUID,
    testimonial_in: TestimonialUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    testimonial = db.query(Testimonial).filter(Testimonial.id == testimonial_id).first()
    if not testimonial:
        raise HTTPException(status_code=404, detail="Testimonial not found")

    for field, value in testimonial_in.dict(exclude_unset=True).items():
        setattr(testimonial, field, value)

    db.commit()
    db.refresh(testimonial)
    return testimonial

# Admin delete testimonial
@router.delete("/admin/{testimonial_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_testimonial(
    testimonial_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    testimonial = db.query(Testimonial).filter(Testimonial.id == testimonial_id).first()
    if not testimonial:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    db.delete(testimonial)
    db.commit()
    return
