import uuid
from sqlalchemy import (
    String,
    DateTime,
    func,
    Integer,
    ForeignKey,
    JSON,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base


class GalleryImage(Base):
    __tablename__ = "gallery_images"
    __table_args__ = (
        UniqueConstraint("gallery_id", "image_media_id", name="uq_gallery_image"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    gallery_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("portfolio_galleries.id", ondelete="CASCADE"), nullable=False, index=True
    )
    image_media_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("images.id", ondelete="CASCADE"), nullable=False, index=True
    )
    order_position: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    gallery = relationship("PortfolioGallery", back_populates="gallery_images")
    image = relationship("Image", back_populates="gallery_links")
