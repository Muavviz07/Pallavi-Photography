import uuid
from datetime import datetime, date as date_type, time as time_type
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.booking import BookingStatus

class BookingBase(BaseModel):
    name: str
    email: str
    date: date_type
    time: time_type
    message: Optional[str] = None
    session_type: Optional[str] = None

class BookingCreate(BookingBase):
    pass

class BookingUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    date: Optional[date_type] = None
    time: Optional[time_type] = None
    message: Optional[str] = None
    status: Optional[BookingStatus] = None
    session_type: Optional[str] = None

class BookingResponse(BookingBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: BookingStatus
    created_at: datetime
    updated_at: datetime

class AdminBusyTimeCreate(BaseModel):
    date: date_type
    start_time: Optional[time_type] = None
    end_time: Optional[time_type] = None
    is_full_day: bool = False
    reason: Optional[str] = None

class AdminBusyTimeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    date: date_type
    start_time: Optional[time_type] = None
    end_time: Optional[time_type] = None
    is_full_day: bool
    reason: Optional[str] = None
    created_at: datetime

class SlotResponse(BaseModel):
    id: int
    time: str
    available: bool
    status: str
    reason: Optional[str] = None
