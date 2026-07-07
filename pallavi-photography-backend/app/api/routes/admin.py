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
from app.schemas.user import UserResponse, UserUpdate, UserAdminResponse

from app.api.routes.client_galleries import process_and_create_gallery_logic, slugify
from app.core import security
from app.models.blog import Blog
from app.models.image import Image
from app.schemas.blog import BlogCreate, BlogUpdate, BlogResponse
import re
from datetime import datetime

router = APIRouter(tags=["admin"])

# Galleries CRUD
@router.get("/galleries", response_model=List[ClientGalleryResponse])
def list_galleries(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_or_client_user_with_feature("galleries"))):
    return db.query(ClientGallery).all()

@router.post("/galleries", response_model=ClientGalleryResponse, status_code=status.HTTP_201_CREATED)
def create_gallery(gallery_in: ClientGalleryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_or_client_user_with_feature("galleries"))):
    return process_and_create_gallery_logic(gallery_in, db)

@router.put("/galleries/{gallery_id}", response_model=ClientGalleryResponse)
def update_gallery(gallery_id: uuid.UUID, gallery_in: ClientGalleryUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_or_client_user_with_feature("galleries"))):
    gallery = db.query(ClientGallery).filter(ClientGallery.id == gallery_id).first()
    if not gallery:
        raise HTTPException(status_code=404, detail="Gallery not found")
    
    update_data = gallery_in.model_dump(exclude_unset=True)
    if "slug" in update_data and update_data["slug"]:
        slug = slugify(update_data["slug"])
        existing = db.query(ClientGallery).filter(ClientGallery.slug == slug, ClientGallery.id != gallery_id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A client gallery with this slug already exists."
            )
        update_data["slug"] = slug

    for field, value in update_data.items():
        if field == "password" and value is not None:
            from app.core.security import encrypt_password
            gallery.password_hash = encrypt_password(value)
        elif field == "cover_image_id":
            # Allow clearing/setting cover_image_id to None/null
            gallery.cover_image_id = value
        elif field == "download_zip_url":
            # Allow clearing/setting download_zip_url to None/null
            gallery.download_zip_url = value
        elif value is not None:
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

from fastapi import UploadFile, File
from pydantic import BaseModel

class CoverUrlInput(BaseModel):
    url: str

@router.post("/galleries/{gallery_id}/upload-cover", response_model=ClientGalleryResponse)
async def upload_custom_cover_image(
    gallery_id: uuid.UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_or_client_user_with_feature("galleries"))
):
    gallery = db.query(ClientGallery).filter(ClientGallery.id == gallery_id).first()
    if not gallery:
        raise HTTPException(status_code=404, detail="Gallery not found")
        
    file_data = await file.read()
    try:
        from app.services.image_service import ImageService
        image_service = ImageService()
        db_image = image_service.process_and_upload_image(
            db=db,
            file_data=file_data,
            original_filename=file.filename,
            gallery_id=None,
            title=f"Cover - {gallery.title}",
            alt_text=f"Cover image for {gallery.title}"
        )
        
        gallery.cover_image_id = db_image.id
        db.commit()
        db.refresh(gallery)
        return gallery
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image upload failed: {str(e)}"
        )

@router.post("/galleries/{gallery_id}/cover-url", response_model=ClientGalleryResponse)
def set_custom_cover_url(
    gallery_id: uuid.UUID,
    cover_in: CoverUrlInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_or_client_user_with_feature("galleries"))
):
    gallery = db.query(ClientGallery).filter(ClientGallery.id == gallery_id).first()
    if not gallery:
        raise HTTPException(status_code=404, detail="Gallery not found")
        
    try:
        from app.models.image import Image
        db_image = Image(
            original_url=cover_in.url,
            optimized_url=cover_in.url,
            thumbnail_url=cover_in.url,
            title=f"Custom Cover - {gallery.title}",
            alt_text=f"Custom Cover image for {gallery.title}",
            width=800,
            height=600,
            file_size=0
        )
        db.add(db_image)
        db.flush()
        
        gallery.cover_image_id = db_image.id
        db.commit()
        db.refresh(gallery)
        return gallery
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Setting cover URL failed: {str(e)}"
        )

class SetCoverFromLibraryInput(BaseModel):
    image_id: uuid.UUID


@router.post("/galleries/{gallery_id}/set-cover-from-library", response_model=ClientGalleryResponse)
def set_cover_from_library(
    gallery_id: uuid.UUID,
    body: SetCoverFromLibraryInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_or_client_user_with_feature("galleries")),
):
    """Set an existing media library image as gallery cover without creating a duplicate."""
    gallery = db.query(ClientGallery).filter(ClientGallery.id == gallery_id).first()
    if not gallery:
        raise HTTPException(status_code=404, detail="Gallery not found")

    from app.models.image import Image
    db_image = db.query(Image).filter(Image.id == body.image_id).first()
    if not db_image:
        raise HTTPException(status_code=404, detail="Media not found")

    gallery.cover_image_id = db_image.id
    db.commit()
    db.refresh(gallery)

    from app.services.media_service import refresh_usage_count
    refresh_usage_count(db, db_image.id)

    return gallery


from app.core.security import encrypt_password
from app.schemas.user import UserCreate

# Users CRUD (Full)
@router.get("/users", response_model=List[UserAdminResponse])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    return db.query(User).all()

@router.post("/users", response_model=UserAdminResponse, status_code=status.HTTP_201_CREATED)
def create_user(user_in: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(require_feature("users"))):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="A user with this email already exists.")
    
    db_user = User(
        email=user_in.email,
        password_hash=encrypt_password(user_in.password),
        role=user_in.role or "client",
        status=user_in.status or "active"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.patch("/users/{user_id}", response_model=UserAdminResponse)
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
        user.password_hash = encrypt_password(user_in.password)
        
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


# Helper function to generate unique slug from title
def generate_unique_slug(title: str, db: Session, exclude_id: uuid.UUID = None) -> str:
    slug = title.lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s-]+', '-', slug).strip('-')
    
    base_slug = slug
    counter = 1
    while True:
        query = db.query(Blog).filter(Blog.slug == slug)
        if exclude_id:
            query = query.filter(Blog.id != exclude_id)
        if not query.first():
            return slug
        slug = f"{base_slug}-{counter}"
        counter += 1

# List all blogs (admin)
@router.get("/blogs", response_model=List[BlogResponse])
def list_all_blogs_admin(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_feature("blogs"))
):
    return db.query(Blog).order_by(Blog.created_at.desc()).all()

# Get blog by ID (admin)
@router.get("/blogs/{blog_id}", response_model=BlogResponse)
def get_blog_by_id_admin(
    blog_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_feature("blogs"))
):
    blog = db.query(Blog).filter(Blog.id == blog_id).first()
    if not blog:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return blog

# Create new blog
@router.post("/blogs", response_model=BlogResponse, status_code=status.HTTP_201_CREATED)
def create_blog_admin(
    blog_in: BlogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_feature("blogs"))
):
    if blog_in.thumbnail_media_id:
        img = db.query(Image).filter(Image.id == blog_in.thumbnail_media_id).first()
        if not img:
            raise HTTPException(status_code=400, detail="Invalid thumbnail_media_id: Media not found")

    blog_data = blog_in.model_dump()
    slug = generate_unique_slug(blog_in.title, db)
    blog_data["slug"] = slug
    
    if blog_in.is_published:
        blog_data["published_date"] = datetime.utcnow()
    else:
        blog_data["published_date"] = None
        
    db_blog = Blog(**blog_data)
    db.add(db_blog)
    db.commit()
    db.refresh(db_blog)
    return db_blog

# Update existing blog
@router.put("/blogs/{blog_id}", response_model=BlogResponse)
def update_blog_admin(
    blog_id: uuid.UUID,
    blog_in: BlogUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_feature("blogs"))
):
    blog = db.query(Blog).filter(Blog.id == blog_id).first()
    if not blog:
        raise HTTPException(status_code=404, detail="Blog post not found")

    update_data = blog_in.model_dump(exclude_unset=True)
    
    if "thumbnail_media_id" in update_data and update_data["thumbnail_media_id"]:
        img = db.query(Image).filter(Image.id == update_data["thumbnail_media_id"]).first()
        if not img:
            raise HTTPException(status_code=400, detail="Invalid thumbnail_media_id: Media not found")

    if "title" in update_data and update_data["title"] != blog.title:
        update_data["slug"] = generate_unique_slug(update_data["title"], db, exclude_id=blog_id)

    if "is_published" in update_data:
        if update_data["is_published"] and not blog.is_published:
            update_data["published_date"] = datetime.utcnow()
        elif not update_data["is_published"]:
            update_data["published_date"] = None

    for field, value in update_data.items():
        setattr(blog, field, value)

    db.commit()
    db.refresh(blog)
    return blog

# Delete blog
@router.delete("/blogs/{blog_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_blog_admin(
    blog_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_feature("blogs"))
):
    blog = db.query(Blog).filter(Blog.id == blog_id).first()
    if not blog:
        raise HTTPException(status_code=404, detail="Blog post not found")
        
    db.delete(blog)
    db.commit()
    return
