import uuid
from sqlalchemy import String, Text, Integer, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base

class FAQ(Base):
    __tablename__ = "faqs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    question: Mapped[str] = mapped_column(String(500), nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    question_fr: Mapped[str] = mapped_column(String(500), nullable=True)
    answer_fr: Mapped[str] = mapped_column(Text, nullable=True)
    
    category: Mapped[str] = mapped_column(String(100), nullable=False) # e.g. "Newborn Photography FAQs", etc.
    category_fr: Mapped[str] = mapped_column(String(100), nullable=True)
    
    order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
