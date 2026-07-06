import uuid
from typing import Optional, List, Dict
from sqlalchemy import func
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

    # Count cover image references ONLY if the image is not already in the gallery images list
    for g in db.query(Gallery).filter(Gallery.cover_image_id == image_id).all():
        is_in_gallery = db.query(GalleryImage).filter(GalleryImage.gallery_id == g.id, GalleryImage.image_id == image_id).first() is not None
        if not is_in_gallery:
            count += 1

    for cg in db.query(ClientGallery).filter(ClientGallery.cover_image_id == image_id).all():
        is_in_gallery = db.query(ClientGalleryImage).filter(ClientGalleryImage.client_gallery_id == cg.id, ClientGalleryImage.image_id == image_id).first() is not None
        if not is_in_gallery:
            count += 1

    urls = _image_urls(db_image)
    count += db.query(BlogPost).filter(BlogPost.cover_image_url.in_(urls)).count()
    count += db.query(HeroSlide).filter(HeroSlide.image_url.in_(urls)).count()
    count += db.query(AboutSection).filter(AboutSection.image_url.in_(urls)).count()

    return count


def bulk_compute_usage_counts(db: Session, images: List[Image]) -> Dict[uuid.UUID, int]:
    """Compute usage counts for a list of images in a highly efficient manner (batching queries)."""
    if not images:
        return {}

    image_ids = [img.id for img in images]
    counts = {img_id: 0 for img_id in image_ids}

    # 1. GalleryImage references
    gi_counts = (
        db.query(GalleryImage.image_id, func.count(GalleryImage.gallery_id))
        .filter(GalleryImage.image_id.in_(image_ids))
        .group_by(GalleryImage.image_id)
        .all()
    )
    for img_id, count in gi_counts:
        counts[img_id] += count

    # 2. ClientGalleryImage references
    cgi_counts = (
        db.query(ClientGalleryImage.image_id, func.count(ClientGalleryImage.client_gallery_id))
        .filter(ClientGalleryImage.image_id.in_(image_ids))
        .group_by(ClientGalleryImage.image_id)
        .all()
    )
    for img_id, count in cgi_counts:
        counts[img_id] += count

    # 3. Cover image references only if NOT in the gallery images
    galleries_with_covers = db.query(Gallery.id, Gallery.cover_image_id).filter(Gallery.cover_image_id.in_(image_ids)).all()
    for g_id, cover_id in galleries_with_covers:
        is_in = db.query(GalleryImage).filter(GalleryImage.gallery_id == g_id, GalleryImage.image_id == cover_id).first() is not None
        if not is_in:
            counts[cover_id] += 1

    client_galleries_with_covers = db.query(ClientGallery.id, ClientGallery.cover_image_id).filter(ClientGallery.cover_image_id.in_(image_ids)).all()
    for cg_id, cover_id in client_galleries_with_covers:
        is_in = db.query(ClientGalleryImage).filter(ClientGalleryImage.client_gallery_id == cg_id, ClientGalleryImage.image_id == cover_id).first() is not None
        if not is_in:
            counts[cover_id] += 1

    # 4. Blog posts, hero slides, and about sections (matched by URL)
    url_to_id = {}
    for img in images:
        url_to_id[img.original_url] = img.id
        if img.optimized_url:
            url_to_id[img.optimized_url] = img.id
        if img.thumbnail_url:
            url_to_id[img.thumbnail_url] = img.id

    all_urls = list(url_to_id.keys())
    if all_urls:
        blog_posts = db.query(BlogPost.cover_image_url).filter(BlogPost.cover_image_url.in_(all_urls)).all()
        for (url,) in blog_posts:
            if url in url_to_id:
                counts[url_to_id[url]] += 1

        hero_slides = db.query(HeroSlide.image_url).filter(HeroSlide.image_url.in_(all_urls)).all()
        for (url,) in hero_slides:
            if url in url_to_id:
                counts[url_to_id[url]] += 1

        about_sections = db.query(AboutSection.image_url).filter(AboutSection.image_url.in_(all_urls)).all()
        for (url,) in about_sections:
            if url in url_to_id:
                counts[url_to_id[url]] += 1

    return counts


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
