#!/usr/bin/env python3
"""Create portfolio gallery and link all 6 images"""

import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import logging
from app.db.database import SessionLocal, Base, engine
import app.models  # Register models
from app.models.image import Image
from app.models.gallery import PortfolioGallery
from app.models.gallery_image import GalleryImage

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def seed_portfolio():
    """Create portfolio gallery and link images"""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print(f"\n[INFO] Creating or finding portfolio gallery...\n")

    portfolio = (
        db.query(PortfolioGallery)
        .filter(
            (PortfolioGallery.slug == "portfolio")
            | (PortfolioGallery.name == "Portfolio")
        )
        .first()
    )

    if not portfolio:
        portfolio = PortfolioGallery(
            name="Portfolio",
            description="Professional photography portfolio",
            slug="portfolio",
            is_active=True,
        )
        db.add(portfolio)
        db.flush()
        print(f"  [OK] Created gallery: Portfolio ({portfolio.id})")
    else:
        print(f"  [OK] Found existing gallery: Portfolio ({portfolio.id})")

    images = (
        db.query(Image)
        .filter(Image.s3_key.isnot(None), Image.s3_key.contains("site-media/"))
        .order_by(Image.created_at.desc())
        .all()
    )

    print(f"\nLinking {len(images)} images to portfolio gallery\n")

    linked_count = 0

    for i, image in enumerate(images, start=1):
        try:
            existing = (
                db.query(GalleryImage)
                .filter(
                    GalleryImage.gallery_id == portfolio.id,
                    GalleryImage.image_media_id == image.id,
                )
                .first()
            )

            if not existing:
                gallery_image = GalleryImage(
                    gallery_id=portfolio.id,
                    image_media_id=image.id,
                    order_position=i,
                )
                db.add(gallery_image)
                linked_count += 1
                print(f"  [OK] Linked: {image.original_filename or image.file_name or image.id}")
            else:
                print(f"  [OK] Already linked: {image.original_filename or image.file_name or image.id}")

            if i == 1 and not portfolio.cover_media_id:
                portfolio.cover_media_id = image.id
        except Exception as e:
            logger.error(f"Failed to link image {image.id}: {e}")

    db.commit()
    db.close()

    print(f"\n[OK] Linked {linked_count} images to portfolio gallery\n")


if __name__ == "__main__":
    seed_portfolio()
