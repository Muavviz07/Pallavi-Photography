import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

class BlogPostTranslationBase(BaseModel):
    language: str
    title: str
    content: str
    summary: Optional[str] = None

class BlogPostTranslationCreate(BlogPostTranslationBase):
    pass

class BlogPostTranslationResponse(BlogPostTranslationBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    blog_post_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

class BlogPostBase(BaseModel):
    title: str
    slug: str
    content: str
    summary: Optional[str] = None
    published: Optional[bool] = False
    published_at: Optional[datetime] = None
    category: str
    tags: Optional[str] = None
    cover_image_url: Optional[str] = None
    reading_time: Optional[int] = 1

class BlogPostCreate(BlogPostBase):
    translations: Optional[List[BlogPostTranslationCreate]] = None

class BlogPostUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    content: Optional[str] = None
    summary: Optional[str] = None
    published: Optional[bool] = None
    published_at: Optional[datetime] = None
    category: Optional[str] = None
    tags: Optional[str] = None
    cover_image_url: Optional[str] = None
    reading_time: Optional[int] = None
    translations: Optional[List[BlogPostTranslationCreate]] = None

class BlogPostResponse(BlogPostBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    translations: List[BlogPostTranslationResponse] = []
