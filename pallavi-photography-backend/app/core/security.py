from datetime import datetime, timedelta, timezone
from typing import Any, Union
from jose import jwt
import bcrypt
import base64
import hashlib
from cryptography.fernet import Fernet
from app.core.config import settings

# Derive urlsafe base64 32-byte key from settings.SECRET_KEY
key_bytes = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
fernet_key = base64.urlsafe_b64encode(key_bytes)
fernet = Fernet(fernet_key)

def encrypt_password(plain_password: str) -> str:
    if not plain_password:
        return ""
    encrypted = fernet.encrypt(plain_password.encode()).decode()
    return f"enc:{encrypted}"

def decrypt_password(encrypted_password: str) -> str:
    if not encrypted_password:
        return ""
    if encrypted_password.startswith("enc:"):
        try:
            token = encrypted_password[4:]
            return fernet.decrypt(token.encode()).decode()
        except Exception:
            return encrypted_password
    return encrypted_password

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

def create_access_token(
    subject: Union[str, Any],
    role: str = None,
    status: str = None,
    permissions: list = None,
    expires_delta: timedelta = None
) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "access",
        "role": role,
        "status": status,
        "permissions": permissions or []
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt
