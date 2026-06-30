import uuid
from sqlalchemy import ForeignKey, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base

class ClientGalleryImage(Base):
    __tablename__ = "client_gallery_images"
    
    client_gallery_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("client_galleries.id", ondelete="CASCADE"), primary_key=True)
    image_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("images.id", ondelete="CASCADE"), primary_key=True)
    selected: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    download_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Relationships
    client_gallery = relationship("ClientGallery", back_populates="images", foreign_keys=[client_gallery_id])
    image = relationship("Image", foreign_keys=[image_id])
