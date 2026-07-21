import uuid
from sqlalchemy import String, DateTime, func, Integer, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base


class Image(Base):
    """
    Centralized media library. All uploaded images are stored here.
    Portfolio galleries link via gallery_id; client galleries via ClientGalleryImage junction.
    Supports S3/Garage storage with presigned URLs & dual expiration policies.
    """

    __tablename__ = "images"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    gallery_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("portfolio_galleries.id", ondelete="CASCADE"), nullable=True
    )
    uploaded_by_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id"), nullable=True, index=True
    )
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    alt_text: Mapped[str | None] = mapped_column(String(500), nullable=True)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)

    # File naming & URLs
    file_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    original_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    original_url: Mapped[str | None] = mapped_column(
        String(2000), nullable=True, index=True
    )
    optimized_url: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(String(2000), nullable=True)

    # S3 Storage & Presigned URL details
    s3_key: Mapped[str | None] = mapped_column(String(500), nullable=True, index=True)
    s3_url: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    url_expiration_time: Mapped[DateTime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    image_type: Mapped[str | None] = mapped_column(
        String(50), default="public", nullable=True
    )  # 'public', 'client_gallery'
    client_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    local_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    content_type: Mapped[str | None] = mapped_column(String(50), nullable=True)

    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    dimensions: Mapped[dict | None] = mapped_column(
        JSON, nullable=True
    )  # JSONB mapping in PostgreSQL
    format: Mapped[str | None] = mapped_column(String(50), nullable=True)

    sort_order: Mapped[int | None] = mapped_column(Integer, nullable=True)
    usage_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    gallery = relationship(
        "PortfolioGallery", back_populates="images", foreign_keys=[gallery_id], viewonly=True
    )
    gallery_links = relationship(
        "GalleryImage", back_populates="image", cascade="all, delete-orphan"
    )
    uploaded_by = relationship("User", foreign_keys=[uploaded_by_id])
