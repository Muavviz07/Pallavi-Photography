import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, computed_field
from app.schemas.image import ImageResponse

class BlogBase(BaseModel):
    title: str
    excerpt: Optional[str] = None
    body_content: str
    thumbnail_media_id: Optional[uuid.UUID] = None
    is_published: Optional[bool] = True
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None

class BlogCreate(BlogBase):
    pass

class BlogUpdate(BaseModel):
    title: Optional[str] = None
    excerpt: Optional[str] = None
    body_content: Optional[str] = None
    thumbnail_media_id: Optional[uuid.UUID] = None
    is_published: Optional[bool] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None

class BlogResponse(BlogBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slug: str
    published_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    thumbnail: Optional[ImageResponse] = None

    @computed_field
    @property
    def thumbnail_url(self) -> Optional[str]:
        if self.thumbnail:
            return self.thumbnail.optimized_url or self.thumbnail.original_url
        return None
