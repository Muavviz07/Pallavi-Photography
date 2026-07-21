import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class AboutSectionBase(BaseModel):
    title: str = "About Me"
    quote: Optional[str] = None
    bio_text: Optional[str] = None
    awards_text: Optional[str] = None
    image_url: Optional[str] = None

class AboutSectionCreate(AboutSectionBase):
    pass

class AboutSectionUpdate(BaseModel):
    title: Optional[str] = None
    quote: Optional[str] = None
    bio_text: Optional[str] = None
    awards_text: Optional[str] = None
    image_url: Optional[str] = None

class AboutSectionResponse(AboutSectionBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
