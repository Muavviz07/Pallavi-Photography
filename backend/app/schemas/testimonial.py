import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class TestimonialBase(BaseModel):
    author: str
    role: Optional[str] = None
    text: str
    rating: Optional[int] = 5
    published: Optional[bool] = True
    category: Optional[str] = None

class TestimonialCreate(TestimonialBase):
    pass

class TestimonialUpdate(BaseModel):
    author: Optional[str] = None
    role: Optional[str] = None
    text: Optional[str] = None
    rating: Optional[int] = None
    published: Optional[bool] = None
    category: Optional[str] = None

class TestimonialResponse(TestimonialBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
