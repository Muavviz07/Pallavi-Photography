import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.models.gallery import GalleryStatus
from app.schemas.image import ImageResponse

class GalleryBase(BaseModel):
    title: str
    slug: str
    description: Optional[str] = None
    category: str  # newborn, children, family, maternity, fine_art, nature
    status: Optional[GalleryStatus] = GalleryStatus.DRAFT
    sort_order: Optional[int] = 0

class GalleryCreate(GalleryBase):
    pass

class GalleryUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    status: Optional[GalleryStatus] = None
    sort_order: Optional[int] = None

class GalleryResponse(GalleryBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    cover_image_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime
    cover_image: Optional[ImageResponse] = None
