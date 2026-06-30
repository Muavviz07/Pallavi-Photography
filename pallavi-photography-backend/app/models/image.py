import uuid
from sqlalchemy import String, DateTime, func, Integer, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base

class Image(Base):
    __tablename__ = "images"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    gallery_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("galleries.id", ondelete="CASCADE"), nullable=True)
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    alt_text: Mapped[str | None] = mapped_column(String(500), nullable=True)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    
    original_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    original_url: Mapped[str] = mapped_column(String(500), nullable=False)
    optimized_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    dimensions: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # JSONB mapping in PostgreSQL
    format: Mapped[str | None] = mapped_column(String(50), nullable=True)
    
    sort_order: Mapped[int | None] = mapped_column(Integer, nullable=True)
    
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    gallery = relationship("Gallery", back_populates="images", foreign_keys=[gallery_id])
