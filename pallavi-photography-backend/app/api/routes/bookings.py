import uuid
from datetime import date, time, timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app.api.dependencies import get_db, get_current_admin_user, require_feature
from app.models.booking import Booking, BookingStatus
from app.models.booking_slot import BookingSlot, SlotStatus
from app.models.admin_busy_time import AdminBusyTime
from app.models.user import User
from app.schemas.booking import (
    BookingCreate,
    BookingUpdate,
    BookingResponse,
    AdminBusyTimeCreate,
    AdminBusyTimeResponse,
    SlotResponse
)
from app.services.email_service import email_service
from app.core.config import settings

router = APIRouter(prefix="/bookings", tags=["bookings"])

# 4 Default slots configuration
DEFAULT_SLOTS = [
    {"id": 1, "start": time(9, 0), "end": time(11, 0), "label": "09:00"},
    {"id": 2, "start": time(11, 0), "end": time(13, 0), "label": "11:00"},
    {"id": 3, "start": time(14, 0), "end": time(16, 0), "label": "14:00"},
    {"id": 4, "start": time(16, 0), "end": time(18, 0), "label": "16:00"},
]

def get_slots_availability(db: Session, target_date: date):
    # Query booking_slots from DB
    db_slots = db.query(BookingSlot).filter(BookingSlot.date == target_date).all()
    slots_map = {(s.start_time, s.end_time): s for s in db_slots}

    # Query admin busy times for this date
    busy_times = db.query(AdminBusyTime).filter(AdminBusyTime.date == target_date).all()

    results = []
    for ds in DEFAULT_SLOTS:
        start = ds["start"]
        end = ds["end"]
        
        # Check overlaps with any admin busy time
        is_busy = False
        busy_reason = None
        for b in busy_times:
            if b.is_full_day:
                is_busy = True
                busy_reason = b.reason
                break
            if b.start_time is not None and b.end_time is not None:
                if max(b.start_time, start) < min(b.end_time, end):
                    is_busy = True
                    busy_reason = b.reason
                    break
        
        # Check if there is an existing booking slot
        db_slot = slots_map.get((start, end))
        status_val = SlotStatus.AVAILABLE.value
        available = True
        
        if is_busy:
            status_val = "busy"
            available = False
        elif db_slot:
            status_val = db_slot.status
            if db_slot.status in [SlotStatus.ACCEPTED.value, SlotStatus.PENDING.value]:
                available = False
                
        results.append({
            "id": ds["id"],
            "time": ds["label"],
            "available": available,
            "status": status_val,
            "reason": busy_reason if is_busy else None
        })
        
    return results

def is_date_fully_booked(db: Session, target_date: date) -> bool:
    slots = get_slots_availability(db, target_date)
    return all(not s["available"] for s in slots)

# Public route to get already-booked dates (so calendar interface can block them)
@router.get("/availability", response_model=List[str])
def get_booked_dates(db: Session = Depends(get_db)):
    start_date = date.today()
    unavailable_dates = []
    # Scan next 120 days
    for i in range(120):
        d = start_date + timedelta(days=i)
        if is_date_fully_booked(db, d):
            unavailable_dates.append(d.isoformat())
    return unavailable_dates

# Public route to list available slots on a specific date
@router.get("/available-slots", response_model=List[SlotResponse])
def get_available_slots(date: date = Query(...), db: Session = Depends(get_db)):
    return get_slots_availability(db, date)

# Public route to get calendar summary
@router.get("/calendar-summary")
def get_calendar_summary(
    start_date: date = Query(...),
    end_date: date = Query(...),
    db: Session = Depends(get_db)
):
    summary = {}
    current_date = start_date
    while current_date <= end_date:
        slots = get_slots_availability(db, current_date)
        booked_count = sum(1 for s in slots if not s["available"])
        is_locked = any(s["status"] == "busy" for s in slots)
        has_client_booking = any(s["status"] in ["accepted", "pending"] for s in slots)
        summary[current_date.isoformat()] = {
            "booked": booked_count,
            "total": len(slots),
            "is_locked": is_locked,
            "has_client_booking": has_client_booking
        }
        current_date += timedelta(days=1)
    return summary

# Public route to create a booking request
@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking_request(booking_in: BookingCreate, db: Session = Depends(get_db)):
    # Find matching default slot by start time
    req_time = booking_in.time
    # Normalize req_time to time object
    if isinstance(req_time, str):
        try:
            req_time = datetime.strptime(req_time, "%H:%M:%S").time()
        except ValueError:
            req_time = datetime.strptime(req_time, "%H:%M").time()

    matched_slot = None
    for ds in DEFAULT_SLOTS:
        if ds["start"].hour == req_time.hour and ds["start"].minute == req_time.minute:
            matched_slot = ds
            break

    if not matched_slot:
        raise HTTPException(status_code=400, detail="Invalid slot time selected")

    # Check if slot is available
    slots = get_slots_availability(db, booking_in.date)
    slot_avail = next((s for s in slots if s["time"] == matched_slot["label"]), None)
    if not slot_avail or not slot_avail["available"]:
        raise HTTPException(status_code=400, detail="This slot is no longer available")

    db_booking = Booking(
        name=booking_in.name,
        email=booking_in.email,
        date=booking_in.date,
        time=req_time,
        message=booking_in.message,
        session_type=booking_in.session_type,
        status=BookingStatus.PENDING.value
    )
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)

    # Link to a BookingSlot
    db_slot = BookingSlot(
        date=db_booking.date,
        start_time=matched_slot["start"],
        end_time=matched_slot["end"],
        status=SlotStatus.PENDING.value,
        booking_request_id=db_booking.id
    )
    db.add(db_slot)
    db.commit()

    # Find admin notification email
    admin_user = db.query(User).filter(User.role == "admin").first()
    admin_email = admin_user.email if admin_user else "admin@pallaviphotography.com"

    # Send email notification
    email_service.send_booking_requested_email(
        admin_email=admin_email,
        client_name=db_booking.name,
        client_email=db_booking.email,
        booking_date=db_booking.date.isoformat(),
        booking_time=db_booking.time.isoformat(),
        message=db_booking.message
    )

    return db_booking

# Admin list all bookings with filters
@router.get("/admin/all")
def admin_list_bookings(
    period: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    status: Optional[str] = Query(None),
    session_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    admin: User = Depends(require_feature("bookings"))
):
    query = db.query(Booking)
    
    if period:
        today = date.today()
        if period == "today":
            query = query.filter(Booking.date == today)
        elif period == "week":
            start_of_week = today - timedelta(days=today.weekday())
            end_of_week = start_of_week + timedelta(days=6)
            query = query.filter(Booking.date >= start_of_week, Booking.date <= end_of_week)
        elif period == "month":
            query = query.filter(
                func.extract('year', Booking.date) == today.year,
                func.extract('month', Booking.date) == today.month
            )
        elif period == "custom" and start_date and end_date:
            query = query.filter(Booking.date >= start_date, Booking.date <= end_date)
    elif start_date and end_date:
        query = query.filter(Booking.date >= start_date, Booking.date <= end_date)

    if status:
        mapped_status = status.lower()
        if mapped_status == "accepted":
            mapped_status = "approved"
        elif mapped_status == "rejected":
            mapped_status = "declined"
        query = query.filter(Booking.status == mapped_status)

    if session_type:
        query = query.filter(Booking.session_type.ilike(session_type))

    total = db.query(Booking).count()
    bookings_list = query.order_by(Booking.date.asc(), Booking.time.asc()).all()
    
    return {
        "total": total,
        "filtered": len(bookings_list),
        "bookings": bookings_list
    }

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

    for field, value in booking_in.model_dump(exclude_unset=True).items():
        setattr(booking, field, value)

    if booking.status != old_status:
        status_changed = True

    db.add(booking)
    db.commit()
    db.refresh(booking)

    # Sync with associated BookingSlot
    slot = db.query(BookingSlot).filter(BookingSlot.booking_request_id == booking_id).first()
    if slot:
        if booking.status == BookingStatus.APPROVED.value:
            slot.status = SlotStatus.ACCEPTED.value
        elif booking.status in [BookingStatus.DECLINED.value, BookingStatus.CANCELLED.value]:
            slot.status = SlotStatus.REJECTED.value
        elif booking.status == BookingStatus.PENDING.value:
            slot.status = SlotStatus.PENDING.value
        db.add(slot)
        db.commit()

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

# Admin delete booking request
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
    return None

# Admin Busy Time Endpoints
@router.post("/admin/busy-time", response_model=AdminBusyTimeResponse, status_code=status.HTTP_201_CREATED)
def create_busy_time(
    busy_in: AdminBusyTimeCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_feature("bookings"))
):
    db_busy = AdminBusyTime(
        date=busy_in.date,
        start_time=busy_in.start_time,
        end_time=busy_in.end_time,
        is_full_day=busy_in.is_full_day,
        reason=busy_in.reason
    )
    db.add(db_busy)
    db.commit()
    db.refresh(db_busy)
    return db_busy

@router.get("/admin/busy-time", response_model=List[AdminBusyTimeResponse])
def get_busy_times(
    db: Session = Depends(get_db),
    admin: User = Depends(require_feature("bookings"))
):
    return db.query(AdminBusyTime).order_by(AdminBusyTime.date.asc(), AdminBusyTime.start_time.asc()).all()

@router.delete("/admin/busy-time/{busy_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_busy_time(
    busy_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(require_feature("bookings"))
):
    db_busy = db.query(AdminBusyTime).filter(AdminBusyTime.id == busy_id).first()
    if not db_busy:
        raise HTTPException(status_code=404, detail="Busy time block not found")
    db.delete(db_busy)
    db.commit()
    return None
