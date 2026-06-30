import uuid
from enum import Enum
from sqlalchemy import String, DateTime, Date, Time, func
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base

class BookingStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    DECLINED = "declined"
    CANCELLED = "cancelled"

class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    date: Mapped[Date] = mapped_column(Date, nullable=False, index=True)
    time: Mapped[Time] = mapped_column(Time, nullable=False)
    message: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default=BookingStatus.PENDING.value, nullable=False)

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
