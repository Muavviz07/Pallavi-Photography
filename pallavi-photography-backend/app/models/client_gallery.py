import uuid
from sqlalchemy import String, DateTime, func, Integer, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base

class ClientGallery(Base):
    __tablename__ = "client_galleries"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="active", nullable=False)  # active, expired, closed
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)  # Hashed password for direct access
    expiry_date: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cover_image_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("images.id", use_alter=True, name="fk_client_gallery_cover_image"), nullable=True)
    
    # Permission Flags
    can_view: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    can_upload: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    can_replace: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    can_delete: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    can_download: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    can_download_zip: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    can_edit_details: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    can_submit_selections: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    can_share: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Selections Submit Status
    selections_submitted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    selections_submitted_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    download_zip_url: Mapped[str | None] = mapped_column(String, nullable=True)
    
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    cover_image = relationship("Image", foreign_keys=[cover_image_id], post_update=True)
    images = relationship("ClientGalleryImage", back_populates="client_gallery", cascade="all, delete-orphan")
