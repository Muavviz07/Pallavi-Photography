from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import ValidationError
from app.api.dependencies import get_db, get_current_active_user, get_user_permissions
from app.core import security
from app.core.rate_limit import login_limiter, refresh_limiter
from app.models.user import User, UserRole, UserStatus
from app.schemas.user import UserCreate, UserResponse, LoginCredentials, Token, TokenPayload, ChangePassword
from jose import jwt, JWTError
import uuid

router = APIRouter()

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system.",
        )
    
    hashed_password = security.get_password_hash(user_in.password)
    
    # Auto-seed the first registered user as Admin
    first_user = db.query(User).first()
    role = UserRole.ADMIN.value if not first_user else UserRole.CLIENT.value
    
    db_user = User(
        email=user_in.email,
        password_hash=hashed_password,
        role=role,
        status=UserStatus.ACTIVE.value
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/login", response_model=Token)
def login(
    credentials: LoginCredentials,
    db: Session = Depends(get_db),
    _rate_limit = Depends(login_limiter)
):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not security.verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
    if user.status != UserStatus.ACTIVE.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
        
    # Get permissions for the token
    permissions = get_user_permissions(db, user)
    
    access_token = security.create_access_token(
        subject=user.id,
        role=user.role,
        status=user.status,
        permissions=permissions
    )
    refresh_token = security.create_refresh_token(subject=user.id)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/refresh-token", response_model=Token)
def refresh_token(
    refresh_token: str,
    db: Session = Depends(get_db),
    _rate_limit = Depends(refresh_limiter)
):
    try:
        payload = jwt.decode(
            refresh_token, security.settings.SECRET_KEY, algorithms=[security.settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
        if token_data.type != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate refresh token",
        )
        
    user = db.query(User).filter(User.id == uuid.UUID(token_data.sub)).first()
    if not user:
        # User account was deleted
        print(f"[SECURITY] User {token_data.sub} attempted token refresh but no longer exists")
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="User account no longer exists. Please log in again."
        )
    if user.status != UserStatus.ACTIVE.value:
        print(f"[SECURITY] Inactive user {token_data.sub} attempted token refresh")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
        
    # Get current permissions for the new token
    permissions = get_user_permissions(db, user)
    
    access_token = security.create_access_token(
        subject=user.id,
        role=user.role,
        status=user.status,
        permissions=permissions
    )
    new_refresh_token = security.create_refresh_token(subject=user.id)
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }

@router.post("/logout")
def logout():
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserResponse)
def read_user_me(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    current_user.permissions = get_user_permissions(db, current_user)
    return current_user

@router.post("/change-password", status_code=status.HTTP_200_OK)
def change_password(
    password_in: ChangePassword,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if not security.verify_password(password_in.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    current_user.password_hash = security.get_password_hash(password_in.new_password)
    db.add(current_user)
    db.commit()
    return {"message": "Password changed successfully"}
