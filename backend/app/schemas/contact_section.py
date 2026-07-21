from datetime import datetime
from typing import Optional
import uuid
from pydantic import BaseModel, ConfigDict

class ContactSectionBase(BaseModel):
    title: str = "LET'S CONNECT"
    title_fr: str = "CONTACTONS-NOUS"
    p1: str
    p1_fr: Optional[str] = None
    p2: str
    p2_fr: Optional[str] = None
    email: str = "pallavi.vishk@gmail.com"
    phone: str = "+41 789077644"
    whatsapp: str = "+41 789077644"
    instagram: str = "@pallavivishk"

class ContactSectionUpdate(BaseModel):
    title: Optional[str] = None
    title_fr: Optional[str] = None
    p1: Optional[str] = None
    p1_fr: Optional[str] = None
    p2: Optional[str] = None
    p2_fr: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    instagram: Optional[str] = None

class ContactSectionResponse(ContactSectionBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    updated_at: datetime
