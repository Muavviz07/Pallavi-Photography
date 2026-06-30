import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.user import UserResponse
from app.schemas.image import ImageResponse

class ClientGalleryBase(BaseModel):
    title: str
    slug: str
    description: Optional[str] = None
    status: Optional[str] = "active"
    expiry_date: Optional[datetime] = None
    
    # Permissions
    can_view: Optional[bool] = True
    can_upload: Optional[bool] = False
    can_replace: Optional[bool] = False
    can_delete: Optional[bool] = False
    can_download: Optional[bool] = False
    can_download_zip: Optional[bool] = False
    can_edit_details: Optional[bool] = False
    can_submit_selections: Optional[bool] = True
    can_share: Optional[bool] = False

class ClientGalleryCreate(ClientGalleryBase):
    user_id: uuid.UUID
    password: Optional[str] = None

class ClientGalleryUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    password: Optional[str] = None
    expiry_date: Optional[datetime] = None
    
    # Permissions
    can_view: Optional[bool] = None
    can_upload: Optional[bool] = None
    can_replace: Optional[bool] = None
    can_delete: Optional[bool] = None
    can_download: Optional[bool] = None
    can_download_zip: Optional[bool] = None
    can_edit_details: Optional[bool] = None
    can_submit_selections: Optional[bool] = None
    can_share: Optional[bool] = None
    
    cover_image_id: Optional[uuid.UUID] = None

class ClientGalleryResponse(ClientGalleryBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    cover_image_id: Optional[uuid.UUID] = None
    selections_submitted: bool
    selections_submitted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # Nested relations
    cover_image: Optional[ImageResponse] = None
    user: Optional[UserResponse] = None

# Nested image validation mapping selections
class ClientGalleryImageResponse(BaseModel):
    image_id: uuid.UUID
    client_gallery_id: uuid.UUID
    selected: bool
    download_count: int
    image: ImageResponse
    
    model_config = ConfigDict(from_attributes=True)
