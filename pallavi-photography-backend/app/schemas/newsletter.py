import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.newsletter import SubscriberStatus

class NewsletterSubscriberBase(BaseModel):
    email: str

class NewsletterSubscriberCreate(NewsletterSubscriberBase):
    pass

class NewsletterSubscriberResponse(NewsletterSubscriberBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: SubscriberStatus
    subscribed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
