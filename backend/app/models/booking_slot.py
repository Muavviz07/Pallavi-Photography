import uuid
from enum import Enum
from sqlalchemy import String, Date, Time, ForeignKey, UniqueConstraint, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base

class SlotStatus(str, Enum):
    AVAILABLE = "available"
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class BookingSlot(Base):
    __tablename__ = "booking_slots"
    __table_args__ = (
        UniqueConstraint("date", "start_time", "end_time", name="uq_booking_slot_time"),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    date: Mapped[Date] = mapped_column(Date, nullable=False, index=True)
    start_time: Mapped[Time] = mapped_column(Time, nullable=False)
    end_time: Mapped[Time] = mapped_column(Time, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default=SlotStatus.AVAILABLE.value, nullable=False)
    booking_request_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("bookings.id", ondelete="CASCADE"), nullable=True
    )
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    booking_request = relationship("Booking", foreign_keys=[booking_request_id])