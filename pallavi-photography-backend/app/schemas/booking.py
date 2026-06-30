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

class BookingCreate(BookingBase):
    pass

class BookingUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    date: Optional[date_type] = None
    time: Optional[time_type] = None
    message: Optional[str] = None
    status: Optional[BookingStatus] = None

class BookingResponse(BookingBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: BookingStatus
    created_at: datetime
    updated_at: datetime
