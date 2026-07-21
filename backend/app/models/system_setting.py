from sqlalchemy import String, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base

class SystemSetting(Base):
    __tablename__ = "system_settings"
    
    key: Mapped[str] = mapped_column(String(255), primary_key=True)
    value: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
