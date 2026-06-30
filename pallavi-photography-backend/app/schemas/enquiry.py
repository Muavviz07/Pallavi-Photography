import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.enquiry import EnquiryStatus

class EnquiryBase(BaseModel):
    name: str
    email: str
    message: str

class EnquiryCreate(EnquiryBase):
    pass

class EnquiryUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    message: Optional[str] = None
    status: Optional[EnquiryStatus] = None

class EnquiryResponse(EnquiryBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: EnquiryStatus
    created_at: datetime
    updated_at: datetime
