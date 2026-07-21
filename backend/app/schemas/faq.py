import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class FAQBase(BaseModel):
    question: str
    answer: str
    question_fr: Optional[str] = None
    answer_fr: Optional[str] = None
    category: str
    category_fr: Optional[str] = None
    order: int = 0

class FAQCreate(FAQBase):
    pass

class FAQUpdate(BaseModel):
    question: Optional[str] = None
    answer: Optional[str] = None
    question_fr: Optional[str] = None
    answer_fr: Optional[str] = None
    category: Optional[str] = None
    category_fr: Optional[str] = None
    order: Optional[int] = None

class FAQResponse(FAQBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
