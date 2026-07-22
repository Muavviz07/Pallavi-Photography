import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, func, Integer, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base


class ClientMedia(Base):
    """Media files uploaded by or for clients"""

    __tablename__ = "client_medias"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)

    # Client reference (references users.id)
    client_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # File information
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    content_type: Mapped[str] = mapped_column(
        String(50), default="application/octet-stream", nullable=False
    )

    # S3 storage
    s3_key: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    s3_url: Mapped[str] = mapped_column(String(2000), nullable=False)

    # Metadata
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    uploaded_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )

    # Timestamps & status
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    client = relationship("User", foreign_keys=[client_id], back_populates="client_medias")
    uploader = relationship("User", foreign_keys=[uploaded_by])

    def __repr__(self):
        return f"<ClientMedia {self.id}: {self.original_filename}>"
