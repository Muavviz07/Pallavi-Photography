import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class GalleryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    order_position: Optional[int] = 0
    is_active: Optional[bool] = True

class GalleryCreate(GalleryBase):
    cover_media_id: Optional[uuid.UUID] = None

class GalleryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    cover_media_id: Optional[uuid.UUID] = None
    order_position: Optional[int] = None
    is_active: Optional[bool] = None

class GalleryResponse(GalleryBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    cover_media_id: Optional[uuid.UUID] = None
    cover_url: Optional[str] = None
    image_count: int = 0
    created_at: datetime
    updated_at: datetime

class GalleryDetailImageResponse(BaseModel):
    id: uuid.UUID
    url: str
    thumbnail_url: Optional[str] = None
    original_url: Optional[str] = None
    title: Optional[str] = None
    alt_text: Optional[str] = None
    aspect: Optional[str] = None
    order_position: int

class GalleryDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str] = None
    cover_url: Optional[str] = None
    images: List[GalleryDetailImageResponse] = []
