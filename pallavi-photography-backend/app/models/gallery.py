import uuid
from sqlalchemy import String, DateTime, func, Integer, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base


class PortfolioGallery(Base):
    __tablename__ = "portfolio_galleries"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    cover_media_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("images.id", use_alter=True, name="fk_gallery_cover_image"),
        nullable=True,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    order_position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    cover_image = relationship("Image", foreign_keys=[cover_media_id], post_update=True)
    gallery_images = relationship(
        "GalleryImage", back_populates="gallery", cascade="all, delete-orphan"
    )
    images = relationship(
        "Image",
        secondary="gallery_images",
        viewonly=True,
        order_by="GalleryImage.order_position.asc()",
    )

    @property
    def cover_url(self) -> str | None:
        if self.cover_image:
            return self.cover_image.optimized_url or self.cover_image.original_url
        return None

    @property
    def image_count(self) -> int:
        return len(self.gallery_images) if self.gallery_images else 0
