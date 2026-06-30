import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class HeroSlideBase(BaseModel):
    title: str
    image_url: str
    order: Optional[int] = 0
    is_active: Optional[bool] = True

class HeroSlideCreate(HeroSlideBase):
    pass

class HeroSlideUpdate(BaseModel):
    title: Optional[str] = None
    image_url: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None

class HeroSlideResponse(HeroSlideBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
