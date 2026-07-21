import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, computed_field
from app.schemas.image import ImageResponse

class HeroSlideBase(BaseModel):
    title: str
    subtitle: Optional[str] = None
    image_media_id: uuid.UUID
    order_position: Optional[int] = 0
    is_active: Optional[bool] = True

class HeroSlideCreate(HeroSlideBase):
    pass

class HeroSlideUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    image_media_id: Optional[uuid.UUID] = None
    order_position: Optional[int] = None
    is_active: Optional[bool] = None

class HeroSlideResponse(HeroSlideBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    image: Optional[ImageResponse] = None

    @computed_field
    @property
    def image_url(self) -> Optional[str]:
        if self.image:
            return self.image.original_url
        return None
