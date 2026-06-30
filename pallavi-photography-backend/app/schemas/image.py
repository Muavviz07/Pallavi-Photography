import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, ConfigDict

class ImageBase(BaseModel):
    title: Optional[str] = None
    alt_text: Optional[str] = None
    description: Optional[str] = None
    sort_order: Optional[int] = 0

class ImageCreate(ImageBase):
    pass

class ImageResponse(ImageBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    gallery_id: Optional[uuid.UUID] = None
    original_filename: Optional[str] = None
    original_url: str
    optimized_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    file_size: Optional[int] = None
    dimensions: Optional[Dict[str, Any]] = None
    format: Optional[str] = None
    created_at: datetime
    updated_at: datetime
