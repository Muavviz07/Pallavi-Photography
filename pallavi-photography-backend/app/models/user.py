import uuid
from enum import Enum
from sqlalchemy import String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base

class UserRole(str, Enum):
    ADMIN = "admin"
    CLIENT = "client"

class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"

class User(Base):
    __tablename__ = "users"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default=UserRole.CLIENT.value, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default=UserStatus.ACTIVE.value, nullable=False)
    
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
