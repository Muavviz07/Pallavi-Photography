import uuid
from sqlalchemy import String, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base

class ContactSection(Base):
    __tablename__ = "contact_sections"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(200), default="LET'S CONNECT")
    title_fr: Mapped[str] = mapped_column(String(200), default="CONTACTONS-NOUS")
    
    p1: Mapped[str] = mapped_column(Text, nullable=False)
    p1_fr: Mapped[str] = mapped_column(Text, nullable=True)
    p2: Mapped[str] = mapped_column(Text, nullable=False)
    p2_fr: Mapped[str] = mapped_column(Text, nullable=True)
    
    email: Mapped[str] = mapped_column(String(150), default="pallavi.vishk@gmail.com")
    phone: Mapped[str] = mapped_column(String(50), default="+41 789077644")
    whatsapp: Mapped[str] = mapped_column(String(50), default="+41 789077644")
    instagram: Mapped[str] = mapped_column(String(100), default="@pallavivishk")
    
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
