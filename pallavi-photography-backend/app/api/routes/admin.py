import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List

from app.api.dependencies import (
    get_db,
    get_current_admin_user,
    get_current_admin_or_client_user,
    get_current_super_admin_user,
    require_feature,
    get_current_admin_or_client_user_with_feature
)
from app.models.client_gallery import ClientGallery
from app.models.client_gallery_image import ClientGalleryImage
from app.models.user import User, UserRole
from app.models.system_setting import SystemSetting
from app.schemas.client_gallery import ClientGalleryCreate, ClientGalleryUpdate, ClientGalleryResponse
from app.schemas.user import UserResponse, UserUpdate

router = APIRouter(tags=["admin"])

# Galleries CRUD
@router.get("/galleries", response_model=List[ClientGalleryResponse])
def list_galleries(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_or_client_user_with_feature("galleries"))):
    return db.query(ClientGallery).all()

@router.post("/galleries", response_model=ClientGalleryResponse, status_code=status.HTTP_201_CREATED)
def create_gallery(gallery_in: ClientGalleryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_or_client_user_with_feature("galleries"))):
    db_gallery = ClientGallery(**gallery_in.dict())
    db.add(db_gallery)
    db.commit()
    db.refresh(db_gallery)
    return db_gallery

@router.put("/galleries/{gallery_id}", response_model=ClientGalleryResponse)
def update_gallery(gallery_id: uuid.UUID, gallery_in: ClientGalleryUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_or_client_user_with_feature("galleries"))):
    gallery = db.query(ClientGallery).filter(ClientGallery.id == gallery_id).first()
    if not gallery:
        raise HTTPException(status_code=404, detail="Gallery not found")
    for field, value in gallery_in.dict(exclude_unset=True).items():
        setattr(gallery, field, value)
    db.commit()
    db.refresh(gallery)
    return gallery

@router.delete("/galleries/{gallery_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_gallery(gallery_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_or_client_user_with_feature("galleries"))):
    gallery = db.query(ClientGallery).filter(ClientGallery.id == gallery_id).first()
    if not gallery:
        raise HTTPException(status_code=404, detail="Gallery not found")
    db.delete(gallery)
    db.commit()
    return

from app.core.security import get_password_hash
from app.schemas.user import UserCreate

# Users CRUD (Full)
@router.get("/users", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(require_feature("users"))):
    return db.query(User).all()

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user_in: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(require_feature("users"))):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="A user with this email already exists.")
    
    db_user = User(
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        role=user_in.role or "client",
        status=user_in.status or "active"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.patch("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: uuid.UUID, user_in: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_feature("users"))):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_in.email:
        existing = db.query(User).filter(User.email == user_in.email, User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email is already in use by another user.")
        user.email = user_in.email
        
    if user_in.password:
        user.password_hash = get_password_hash(user_in.password)
        
    if user_in.role:
        user.role = user_in.role
        
    if user_in.status:
        user.status = user_in.status
        
    db.commit()
    db.refresh(user)
    return user

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(require_feature("users"))):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Do not allow deleting self
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account.")
        
    db.delete(user)
    db.commit()
    return

# Simple analytics
@router.get("/analytics")
def get_analytics(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_or_client_user_with_feature("analytics"))):
    total_galleries = db.query(ClientGallery).count()
    total_images = db.query(ClientGalleryImage).count()
    total_users = db.query(User).count()
    return {
        "total_galleries": total_galleries,
        "total_images": total_images,
        "total_users": total_users,
    }

DEFAULT_SIDEBAR_SETTINGS = {
    "galleries": False,
    "bookings": True,
    "pricing": False,
    "faqs": False,
    "contact": False,
    "blogs": False,
    "enquiries": True,
    "users": False,
    "analytics": True
}

@router.get("/settings")
def get_settings(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    # Returns permissions mapping for the calling admin
    if current_user.role == UserRole.SUPER_ADMIN.value:
        return {k: True for k in DEFAULT_SIDEBAR_SETTINGS.keys()}
        
    from app.models.admin_permission import AdminRolePermission
    permissions = db.query(AdminRolePermission).filter(AdminRolePermission.admin_id == current_user.id).all()
    if not permissions:
        return DEFAULT_SIDEBAR_SETTINGS
        
    return {p.feature_name: p.is_enabled for p in permissions}

@router.post("/settings")
def save_settings(settings_data: dict, request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_super_admin_user)):
    # Legacy endpoint: update settings globally for all admins in system_settings, and audit it
    setting = db.query(SystemSetting).filter(SystemSetting.key == "sidebar_features").first()
    if not setting:
        setting = SystemSetting(key="sidebar_features", value=settings_data)
        db.add(setting)
    else:
        setting.value = settings_data
        db.add(setting)
    
    # Audit log
    import json
    from app.models.audit_log import AuditLog
    audit_log = AuditLog(
        admin_id=current_user.id,
        action="update_global_settings",
        resource_type="system_settings",
        resource_id="sidebar_features",
        details=json.dumps({"global_settings": settings_data}),
        ip_address=request.headers.get("x-forwarded-for") or request.client.host or "unknown"
    )
    db.add(audit_log)
    db.commit()
    db.refresh(setting)
    return setting.value

# Super Admin Management Endpoints

@router.get("/admin-users")
def list_admin_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin_user)
):
    """
    Super Admin only: List all admin and super admin users.
    """
    admins = db.query(User).filter(
        User.role.in_([UserRole.ADMIN.value, UserRole.SUPER_ADMIN.value])
    ).all()
    return [
        {
            "id": str(admin.id),
            "email": admin.email,
            "role": admin.role,
            "status": admin.status,
        }
        for admin in admins
    ]

@router.get("/admin-users/{admin_id}/permissions")
def get_admin_permissions(
    admin_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin_user)
):
    """
    Super Admin only: Get feature permissions for a specific admin user.
    """
    admin = db.query(User).filter(User.id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin user not found")
        
    from app.models.admin_permission import AdminFeature, AdminRolePermission
    all_features = db.query(AdminFeature).all()
    
    if admin.role == UserRole.SUPER_ADMIN.value:
        # Super Admins always have all permissions active
        return {
            "admin_id": str(admin_id),
            "admin_email": admin.email,
            "features": [
                {
                    "name": feature.name,
                    "description": feature.description,
                    "enabled": True
                }
                for feature in all_features
            ]
        }
        
    permissions = db.query(AdminRolePermission).filter(
        AdminRolePermission.admin_id == admin_id
    ).all()
    
    perm_map = {p.feature_name: p.is_enabled for p in permissions}
    
    return {
        "admin_id": str(admin_id),
        "admin_email": admin.email,
        "features": [
            {
                "name": feature.name,
                "description": feature.description,
                "enabled": perm_map.get(feature.name, feature.default_enabled)
            }
            for feature in all_features
        ]
    }

@router.patch("/admin-users/{admin_id}/permissions")
def update_admin_permissions(
    admin_id: uuid.UUID,
    permissions_data: dict,  # {"feature_name": bool, ...}
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin_user)
):
    """
    Super Admin only: Update permissions for a specific admin user and log in audit_logs.
    """
    admin = db.query(User).filter(User.id == admin_id).first()
    if not admin or admin.role != UserRole.ADMIN.value:
        raise HTTPException(status_code=404, detail="Admin user not found or is not a regular admin")
        
    from app.models.admin_permission import AdminFeature, AdminRolePermission
    from app.models.audit_log import AuditLog
    
    # Verify features and update permissions
    old_permissions = {}
    new_permissions = {}
    
    for feature_name, is_enabled in permissions_data.items():
        feature = db.query(AdminFeature).filter(AdminFeature.name == feature_name).first()
        if not feature:
            raise HTTPException(status_code=400, detail=f"Feature '{feature_name}' does not exist")
            
        perm = db.query(AdminRolePermission).filter(
            AdminRolePermission.admin_id == admin_id,
            AdminRolePermission.feature_name == feature_name
        ).first()
        
        if perm:
            old_permissions[feature_name] = perm.is_enabled
            perm.is_enabled = is_enabled
        else:
            old_permissions[feature_name] = feature.default_enabled
            perm = AdminRolePermission(
                admin_id=admin_id,
                feature_name=feature_name,
                is_enabled=is_enabled
            )
            db.add(perm)
            
        new_permissions[feature_name] = is_enabled
        
    db.commit()
    
    # Create audit log
    import json
    audit_log = AuditLog(
        admin_id=current_user.id,
        action="update_admin_permissions",
        resource_type="admin_user_permissions",
        resource_id=str(admin_id),
        details=json.dumps({
            "target_admin_email": admin.email,
            "old_permissions": old_permissions,
            "new_permissions": new_permissions
        }),
        ip_address=request.headers.get("x-forwarded-for") or request.client.host or "unknown"
    )
    db.add(audit_log)
    db.commit()
    
    return {"message": "Permissions updated successfully"}
