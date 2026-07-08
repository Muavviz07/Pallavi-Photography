import uuid
from sqlalchemy import String, Date, Time, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base

class AdminBusyTime(Base):
    __tablename__ = "admin_busy_time"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    date: Mapped[Date] = mapped_column(Date, nullable=False, index=True)
    start_time: Mapped[Time | None] = mapped_column(Time, nullable=True)
    end_time: Mapped[Time | None] = mapped_column(Time, nullable=True)
    is_full_day: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    reason: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())