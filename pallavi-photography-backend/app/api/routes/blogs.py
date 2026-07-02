import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime

from app.api.dependencies import get_db, get_current_admin_user, require_feature
from app.models.blog import BlogPost, BlogPostTranslation
from app.models.user import User
from app.schemas.blog import BlogPostCreate, BlogPostUpdate, BlogPostResponse

router = APIRouter(prefix="/blogs", tags=["blogs"])

# Public get all (published only)
@router.get("", response_model=List[BlogPostResponse])
def get_published_blogs(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None)
):
    query = db.query(BlogPost).filter(BlogPost.published == True)
    
    if category:
        query = query.filter(BlogPost.category == category)
        
    if search:
        search_filter = f"%{search}%"
        # Search in base post title/content or translations
        query = query.outerjoin(BlogPostTranslation).filter(
            or_(
                BlogPost.title.ilike(search_filter),
                BlogPost.content.ilike(search_filter),
                BlogPostTranslation.title.ilike(search_filter),
                BlogPostTranslation.content.ilike(search_filter)
            )
        ).distinct()
        
    return query.order_by(BlogPost.published_at.desc()).offset(skip).limit(limit).all()

# Public get by slug
@router.get("/{slug}", response_model=BlogPostResponse)
def get_blog_by_slug(slug: str, db: Session = Depends(get_db)):
    post = db.query(BlogPost).filter(BlogPost.slug == slug, BlogPost.published == True).first()
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return post

# Admin create
@router.post("", response_model=BlogPostResponse, status_code=status.HTTP_201_CREATED)
def create_blog_post(
    post_in: BlogPostCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_feature("blogs"))
):
    # Check if slug exists
    if db.query(BlogPost).filter(BlogPost.slug == post_in.slug).first():
        raise HTTPException(status_code=400, detail="Slug already exists")

    post_data = post_in.dict(exclude={"translations"})
    if post_data.get("published") and not post_data.get("published_at"):
        post_data["published_at"] = datetime.utcnow()

    db_post = BlogPost(**post_data)
    db.add(db_post)
    db.commit()
    db.refresh(db_post)

    if post_in.translations:
        for trans in post_in.translations:
            db_trans = BlogPostTranslation(**trans.dict(), blog_post_id=db_post.id)
            db.add(db_trans)
        db.commit()
        db.refresh(db_post)

    return db_post

# Admin list all (drafts + published)
@router.get("/admin/all", response_model=List[BlogPostResponse])
def admin_list_blogs(
    db: Session = Depends(get_db),
    admin: User = Depends(require_feature("blogs"))
):
    return db.query(BlogPost).order_by(BlogPost.created_at.desc()).all()

# Admin get details by ID
@router.get("/admin/{post_id}", response_model=BlogPostResponse)
def admin_get_blog(
    post_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(require_feature("blogs"))
):
    post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return post

# Admin update
@router.put("/admin/{post_id}", response_model=BlogPostResponse)
def admin_update_blog(
    post_id: uuid.UUID,
    post_in: BlogPostUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_feature("blogs"))
):
    post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")

    # Update base fields
    update_data = post_in.dict(exclude={"translations"}, exclude_unset=True)
    if "published" in update_data:
        if update_data["published"] and not post.published:
            update_data["published_at"] = datetime.utcnow()
        elif not update_data["published"]:
            update_data["published_at"] = None

    for field, value in update_data.items():
        setattr(post, field, value)

    # Handle translations update
    if post_in.translations is not None:
        # Delete existing translations
        db.query(BlogPostTranslation).filter(BlogPostTranslation.blog_post_id == post_id).delete()
        # Add new ones
        for trans in post_in.translations:
            db_trans = BlogPostTranslation(**trans.dict(), blog_post_id=post_id)
            db.add(db_trans)

    db.commit()
    db.refresh(post)
    return post

# Admin delete
@router.delete("/admin/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_blog(
    post_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(require_feature("blogs"))
):
    post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    db.delete(post)
    db.commit()
    return
