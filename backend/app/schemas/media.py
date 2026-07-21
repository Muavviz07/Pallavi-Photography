import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field, computed_field
from app.services.image_service import image_service


class MediaUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    alt_text: Optional[str] = None
    category: Optional[str] = None


class MediaResponse(BaseModel):
    """Media library view of a centralized Image record with runtime URL resolution."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: Optional[str] = None
    description: Optional[str] = None
    alt_text: Optional[str] = None
    category: Optional[str] = None
    original_filename: Optional[str] = None
    s3_key: Optional[str] = None
    image_type: Optional[str] = "public"
    client_id: Optional[str] = None
    optimized_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    file_size: Optional[int] = None
    dimensions: Optional[Dict[str, Any]] = None
    format: Optional[str] = None
    gallery_id: Optional[uuid.UUID] = None
    usage_count: int = 0
    created_at: datetime
    updated_at: datetime

    @computed_field
    @property
    def file_url(self) -> str:
        return image_service.get_image_url(self)

    @computed_field
    @property
    def original_url(self) -> str:
        return image_service.get_image_url(self)

    @computed_field
    @property
    def filename(self) -> str:
        return self.original_filename or (self.file_url.rsplit("/", 1)[-1] if self.file_url else "image.jpg")


class MediaUploadResponse(BaseModel):
    id: uuid.UUID
    file_url: str
    s3_key: Optional[str] = None
    image_type: str
    message: str


class RefreshUrlResponse(BaseModel):
    s3_url: str
    message: str = "URL refreshed"


class MediaListResponse(BaseModel):
    items: List[MediaResponse]
    total: int
    skip: int
    limit: int


class AddMediaToGalleryRequest(BaseModel):
    image_id: uuid.UUID = Field(..., description="ID of media library image to add")
    sort_order: Optional[int] = 0
