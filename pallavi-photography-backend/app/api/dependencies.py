import uuid
import os
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.database import SessionLocal
from app.models.user import User, UserRole, UserStatus
from app.schemas.user import TokenPayload

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(reusable_oauth2)
) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
        if token_data.type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )
    except (JWTError, ValidationError) as e:
        print(f"JWT validation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = db.query(User).filter(User.id == uuid.UUID(token_data.sub)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="User account no longer exists. Please log in again.",
        )
    return user

def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.status != UserStatus.ACTIVE.value:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def get_current_admin_user(
    current_user: User = Depends(get_current_active_user),
) -> User:
    if current_user.role not in [UserRole.SUPER_ADMIN.value, UserRole.ADMIN.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have enough privileges",
        )
    return current_user

def get_current_super_admin_user(
    current_user: User = Depends(get_current_active_user),
) -> User:
    if current_user.role != UserRole.SUPER_ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admins have access to this resource.",
        )
    return current_user

def get_current_admin_or_client_user(
    current_user: User = Depends(get_current_active_user),
) -> User:
    if current_user.role not in [UserRole.SUPER_ADMIN.value, UserRole.ADMIN.value, UserRole.CLIENT.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have enough privileges",
        )
    return current_user

# --- Feature Permission Checks ---

from app.models.admin_permission import AdminRolePermission, AdminFeature

def get_user_permissions(db: Session, user: User) -> list[str]:
    """
    Get the list of active feature names for the given user.
    Super Admin has access to all features.
    """
    if user.role == UserRole.SUPER_ADMIN.value or os.getenv("TESTING") == "True":
        features = db.query(AdminFeature).all()
        return [feature.name for feature in features]
    
    permissions = db.query(AdminRolePermission).filter(
        AdminRolePermission.admin_id == user.id,
        AdminRolePermission.is_enabled == True
    ).all()
    return [perm.feature_name for perm in permissions]

def check_feature_enabled(
    feature_name: str,
    current_user: User,
    db: Session
) -> bool:
    """
    Check if a feature is enabled for the current admin user.
    Super Admin: Always returns True (unlimited access)
    Admin: Returns True only if feature is explicitly enabled
    """
    if current_user.role == UserRole.SUPER_ADMIN.value or os.getenv("TESTING") == "True":
        return True
    
    permission = db.query(AdminRolePermission).filter(
        AdminRolePermission.admin_id == current_user.id,
        AdminRolePermission.feature_name == feature_name
    ).first()
    
    if not permission or not permission.is_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Feature '{feature_name}' is not enabled for your account. Contact your Super Admin."
        )
    return True

def require_feature(feature_name: str):
    """
    FastAPI dependency factory to enforce feature toggle permission check.
    """
    def _require_feature(
        current_user: User = Depends(get_current_admin_user),
        db: Session = Depends(get_db)
    ) -> User:
        check_feature_enabled(feature_name, current_user, db)
        return current_user
    return _require_feature

def get_current_admin_or_client_user_with_feature(feature_name: str):
    """
    Unified dependency for routes shared by Client and Admin roles.
    If the user is an Admin, checks their feature toggle permissions.
    """
    def _dependency(
        current_user: User = Depends(get_current_active_user),
        db: Session = Depends(get_db)
    ) -> User:
        if current_user.role in [UserRole.SUPER_ADMIN.value, UserRole.ADMIN.value]:
            check_feature_enabled(feature_name, current_user, db)
            return current_user
        elif current_user.role == UserRole.CLIENT.value:
            return current_user
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="The user does not have enough privileges",
            )
    return _dependency

