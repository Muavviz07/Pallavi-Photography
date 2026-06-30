import uuid
from enum import Enum
from sqlalchemy import String, DateTime, func, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base

class GalleryStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    HIDDEN = "hidden"

class Gallery(Base):
    __tablename__ = "galleries"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)  # newborn, children, family, maternity, fine_art, nature
    cover_image_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("images.id", use_alter=True, name="fk_gallery_cover_image"), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default=GalleryStatus.DRAFT.value, nullable=False)
    sort_order: Mapped[int | None] = mapped_column(Integer, nullable=True)
    
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    cover_image = relationship("Image", foreign_keys=[cover_image_id], post_update=True)
    images = relationship("Image", back_populates="gallery", foreign_keys="[Image.gallery_id]", cascade="all, delete-orphan")
