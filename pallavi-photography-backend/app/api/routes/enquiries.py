import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List

from app.api.dependencies import get_db, get_current_admin_user
from app.models.enquiry import Enquiry, EnquiryStatus
from app.models.user import User
from app.schemas.enquiry import EnquiryCreate, EnquiryUpdate, EnquiryResponse
from app.services.email_service import email_service

router = APIRouter(prefix="/enquiries", tags=["enquiries"])

# Public contact form submission
@router.post("", response_model=EnquiryResponse, status_code=status.HTTP_201_CREATED)
def create_enquiry(enquiry_in: EnquiryCreate, db: Session = Depends(get_db)):
    db_enquiry = Enquiry(**enquiry_in.dict())
    db.add(db_enquiry)
    db.commit()
    db.refresh(db_enquiry)

    # Find admin user
    admin_user = db.query(User).filter(User.role == "admin").first()
    admin_email = admin_user.email if admin_user else "admin@pallaviphotography.com"

    # Send email to admin
    email_service.send_contact_enquiry_received_email(
        admin_email=admin_email,
        visitor_name=db_enquiry.name,
        visitor_email=db_enquiry.email,
        message=db_enquiry.message
    )

    # Send auto-reply confirmation to client
    email_service.send_contact_auto_reply_email(
        visitor_email=db_enquiry.email,
        visitor_name=db_enquiry.name
    )

    return db_enquiry

# Admin list all enquiries
@router.get("/admin/all", response_model=List[EnquiryResponse])
def admin_list_enquiries(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    return db.query(Enquiry).order_by(Enquiry.created_at.desc()).all()

# Admin update status (read, responded, etc.)
@router.patch("/admin/{enquiry_id}", response_model=EnquiryResponse)
def admin_update_enquiry(
    enquiry_id: uuid.UUID,
    enquiry_in: EnquiryUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    enquiry = db.query(Enquiry).filter(Enquiry.id == enquiry_id).first()
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")

    for field, value in enquiry_in.dict(exclude_unset=True).items():
        setattr(enquiry, field, value)

    db.commit()
    db.refresh(enquiry)
    return enquiry

# Admin delete enquiry
@router.delete("/admin/{enquiry_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_enquiry(
    enquiry_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    enquiry = db.query(Enquiry).filter(Enquiry.id == enquiry_id).first()
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")
    db.delete(enquiry)
    db.commit()
    return
