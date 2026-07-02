import uuid
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.api.dependencies import get_db, get_current_admin_user, require_feature
from app.models.booking import Booking, BookingStatus
from app.models.user import User
from app.schemas.booking import BookingCreate, BookingUpdate, BookingResponse
from app.services.email_service import email_service
from app.core.config import settings

router = APIRouter(prefix="/bookings", tags=["bookings"])

# Public route to get already-booked dates (so calendar interface can block them)
@router.get("/availability", response_model=List[str])
def get_booked_dates(db: Session = Depends(get_db)):
    # Get all booking dates that are approved or pending
    bookings = db.query(Booking).filter(
        Booking.status.in_([BookingStatus.APPROVED.value, BookingStatus.PENDING.value])
    ).all()
    # Format dates as ISO strings
    return list(set(b.date.isoformat() for b in bookings))

# Public route to create a booking request
@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking_request(booking_in: BookingCreate, db: Session = Depends(get_db)):
    # Check if a booking already exists on this date
    existing_booking = db.query(Booking).filter(
        Booking.date == booking_in.date,
        Booking.status == BookingStatus.APPROVED.value
    ).first()
    if existing_booking:
        raise HTTPException(status_code=400, detail="This date is already fully booked")

    db_booking = Booking(**booking_in.dict())
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)

    # Find an admin's email to send the request notification
    # For fallback, use environment or default
    admin_user = db.query(User).filter(User.role == "admin").first()
    admin_email = admin_user.email if admin_user else "admin@pallaviphotography.com"

    # Send notification email to admin
    email_service.send_booking_requested_email(
        admin_email=admin_email,
        client_name=db_booking.name,
        client_email=db_booking.email,
        booking_date=db_booking.date.isoformat(),
        booking_time=db_booking.time.isoformat(),
        message=db_booking.message
    )

    return db_booking

# Admin list all bookings
@router.get("/admin/all", response_model=List[BookingResponse])
def admin_list_bookings(
    db: Session = Depends(get_db),
    admin: User = Depends(require_feature("bookings"))
):
    return db.query(Booking).order_by(Booking.date.asc(), Booking.time.asc()).all()

# Admin update booking status (approve, decline, etc.)
@router.patch("/admin/{booking_id}", response_model=BookingResponse)
def admin_update_booking(
    booking_id: uuid.UUID,
    booking_in: BookingUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_feature("bookings"))
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking request not found")

    status_changed = False
    old_status = booking.status

    for field, value in booking_in.dict(exclude_unset=True).items():
        setattr(booking, field, value)

    if booking.status != old_status:
        status_changed = True

    db.commit()
    db.refresh(booking)

    # If status is updated, notify client
    if status_changed and booking.status in [BookingStatus.APPROVED.value, BookingStatus.DECLINED.value]:
        email_service.send_booking_status_updated_email(
            client_email=booking.email,
            client_name=booking.name,
            booking_date=booking.date.isoformat(),
            booking_time=booking.time.isoformat(),
            status=booking.status
        )

    return booking

# Admin delete booking
@router.delete("/admin/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_booking(
    booking_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(require_feature("bookings"))
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking request not found")
    db.delete(booking)
    db.commit()
    return
