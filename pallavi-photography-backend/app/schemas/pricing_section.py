import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class PricingSectionBase(BaseModel):
    category: str
    title: str
    subtitle: Optional[str] = None
    description: Optional[str] = None
    intro_text: Optional[str] = None
    notes_text: Optional[str] = None
    plans_json: Optional[str] = None

class PricingSectionCreate(PricingSectionBase):
    pass

class PricingSectionUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    description: Optional[str] = None
    intro_text: Optional[str] = None
    notes_text: Optional[str] = None
    plans_json: Optional[str] = None

class PricingSectionResponse(PricingSectionBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
