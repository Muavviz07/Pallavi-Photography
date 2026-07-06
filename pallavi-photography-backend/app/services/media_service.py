import uuid
from typing import Optional
from sqlalchemy.orm import Session
from app.models.image import Image
from app.models.gallery import Gallery
from app.models.gallery_image import GalleryImage
from app.models.client_gallery import ClientGallery
from app.models.client_gallery_image import ClientGalleryImage
from app.models.blog import BlogPost
from app.models.hero_slide import HeroSlide
from app.models.about_section import AboutSection


def _image_urls(db_image: Image) -> list[str]:
    urls = [db_image.original_url]
    if db_image.optimized_url:
        urls.append(db_image.optimized_url)
    if db_image.thumbnail_url:
        urls.append(db_image.thumbnail_url)
    return urls


def compute_usage_count(db: Session, image_id: uuid.UUID) -> int:
    """Count all references to an image across the site."""
    db_image = db.query(Image).filter(Image.id == image_id).first()
    if not db_image:
        return 0

    count = 0

    count += db.query(GalleryImage).filter(GalleryImage.image_id == image_id).count()

    count += (
        db.query(ClientGalleryImage)
        .filter(ClientGalleryImage.image_id == image_id)
        .count()
    )

    count += db.query(Gallery).filter(Gallery.cover_image_id == image_id).count()
    count += (
        db.query(ClientGallery).filter(ClientGallery.cover_image_id == image_id).count()
    )

    urls = _image_urls(db_image)
    count += db.query(BlogPost).filter(BlogPost.cover_image_url.in_(urls)).count()
    count += db.query(HeroSlide).filter(HeroSlide.image_url.in_(urls)).count()
    count += db.query(AboutSection).filter(AboutSection.image_url.in_(urls)).count()

    return count


def refresh_usage_count(db: Session, image_id: uuid.UUID) -> int:
    """Recompute and persist usage_count for an image."""
    db_image = db.query(Image).filter(Image.id == image_id).first()
    if not db_image:
        return 0

    db_image.usage_count = compute_usage_count(db, image_id)
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    return db_image.usage_count


def can_delete_media(db: Session, image_id: uuid.UUID) -> tuple[bool, int]:
    """Return whether media can be deleted and current usage count."""
    usage = compute_usage_count(db, image_id)
    return usage == 0, usage


def get_media_display_url(db_image: Image) -> str:
    return db_image.optimized_url or db_image.original_url
