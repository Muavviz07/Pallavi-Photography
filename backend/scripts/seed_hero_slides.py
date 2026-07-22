#!/usr/bin/env python3
"""Create hero slides using the same 6 portfolio images"""

import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import logging
from app.db.database import SessionLocal, Base, engine
import app.models  # Register models
from app.models.image import Image
from app.models.hero_slide import HeroSlide

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SLIDE_TITLES = {
    "baby.jpg": ("Baby Photography", "Precious Moments & New Beginnings"),
    "children.jpg": ("Children Photography", "Capturing Pure Joy & Curiosity"),
    "family.jpg": ("Family Portraits", "Timeless Memories Together"),
    "maternity.jpg": ("Maternity Photography", "Celebrating New Life"),
    "nature.jpg": ("Nature & Landscape", "Beautiful Outdoor Scenery"),
    "fineart.jpg": ("Fine Art Photography", "Artistic & Fine Art Portraits"),
}


def seed_hero_slides():
    """Create hero slides from portfolio images"""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print(f"\n[INFO] Creating hero slides from portfolio images...\n")

    images = (
        db.query(Image)
        .filter(Image.s3_key.isnot(None), Image.s3_key.contains("site-media/"))
        .order_by(Image.created_at.desc())
        .all()
    )

    print(f"Processing {len(images)} portfolio images for Hero Slides\n")

    created = 0

    for i, image in enumerate(images, start=1):
        try:
            filename = (image.file_name or image.original_filename or "").lower()

            existing = (
                db.query(HeroSlide)
                .filter(HeroSlide.image_media_id == image.id)
                .first()
            )

            title_info = SLIDE_TITLES.get(
                filename, (f"Slide {i}", "Professional Photography")
            )

            if existing:
                existing.title = title_info[0]
                existing.subtitle = title_info[1]
                existing.order_position = i
                existing.is_active = True
                print(f"  [OK] Updated existing slide {i}: {title_info[0]}")
            else:
                slide = HeroSlide(
                    image_media_id=image.id,
                    title=title_info[0],
                    subtitle=title_info[1],
                    order_position=i,
                    is_active=True,
                )
                db.add(slide)
                created += 1
                print(f"  [OK] Created slide {i}: {title_info[0]}")
        except Exception as e:
            logger.error(f"Failed to create slide for image {image.id}: {e}")

    db.commit()
    db.close()

    print(f"\n[OK] Hero slides updated/created successfully\n")


if __name__ == "__main__":
    seed_hero_slides()
