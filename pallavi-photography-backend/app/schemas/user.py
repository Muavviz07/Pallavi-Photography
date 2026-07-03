import uuid
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator

class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    role: str | None = "client"
    status: str | None = "active"

class UserUpdate(BaseModel):
    email: str | None = None
    password: str | None = Field(None, min_length=8)
    role: str | None = None
    status: str | None = None

class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    role: str
    status: str
    created_at: datetime
    updated_at: datetime
    permissions: list[str] | None = None

class UserAdminResponse(UserResponse):
    password_hash: str | None = None

    @field_validator("password_hash", mode="before")
    @classmethod
    def decrypt_db_password(cls, v: str | None) -> str | None:
        if v:
            from app.core.security import decrypt_password
            return decrypt_password(v)
        return v

class LoginCredentials(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    sub: str | None = None
    type: str | None = None
    role: str | None = None
    status: str | None = None
    permissions: list[str] | None = None

class ChangePassword(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)
