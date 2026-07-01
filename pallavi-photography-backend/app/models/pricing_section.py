import uuid
from sqlalchemy import String, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base

class PricingSection(Base):
    __tablename__ = "pricing_sections"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    category: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False) # newborn, children, family, maternity, fine-art, nature, faqs
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    subtitle: Mapped[str] = mapped_column(String(255), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    intro_text: Mapped[str] = mapped_column(Text, nullable=True)
    notes_text: Mapped[str] = mapped_column(Text, nullable=True)
    plans_json: Mapped[str] = mapped_column(Text, nullable=True) # JSON string representing the pricing plans list
    
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
