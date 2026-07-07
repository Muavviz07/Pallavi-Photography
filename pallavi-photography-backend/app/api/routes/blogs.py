import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.api.dependencies import get_db
from app.models.blog import Blog
from app.schemas.blog import BlogResponse

router = APIRouter(prefix="/blogs", tags=["blogs"])

# Public get all (published only)
@router.get("", response_model=List[BlogResponse])
def get_published_blogs(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
):
    """
    Get all published blog posts ordered by publication date.
    """
    query = db.query(Blog).filter(Blog.is_published == True)
    return query.order_by(Blog.published_date.desc()).offset(skip).limit(limit).all()

# Public get by slug
@router.get("/{slug}", response_model=BlogResponse)
def get_blog_by_slug(slug: str, db: Session = Depends(get_db)):
    """
    Get a single published blog post by its unique slug.
    """
    post = db.query(Blog).filter(Blog.slug == slug, Blog.is_published == True).first()
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return post
