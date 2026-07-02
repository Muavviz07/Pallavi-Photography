import uuid
from sqlalchemy import String, DateTime, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from app.db.database import Base

class AuditLog(Base):
    """
    Log all admin actions for compliance and security.
    """
    __tablename__ = "audit_logs"
    
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    admin_id: Mapped[uuid.UUID] = mapped_column(index=True, nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False)  # "update_permissions", etc.
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False)  # "admin_permissions"
    resource_id: Mapped[str] = mapped_column(String(100), nullable=False)
    details: Mapped[str] = mapped_column(Text, nullable=False)  # JSON string
    ip_address: Mapped[str] = mapped_column(String(50), nullable=False, default="unknown")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
