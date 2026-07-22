#!/usr/bin/env python3
"""Seed valid image references for Blogs and Recognitions/Awards"""

import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import logging
from app.db.database import SessionLocal, Base, engine
import app.models  # Register models
from app.models.image import Image
from app.models.blog import Blog
from app.models.recognition_award import RecognitionAward

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def seed_blogs_and_awards():
    """Assign active S3 images to Blogs and RecognitionAwards"""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("\n[INFO] Seeding Blogs & Awards image references...\n")

        # Get active site images
        images = (
            db.query(Image)
            .filter(Image.s3_key.isnot(None), Image.s3_key.contains("site-media/"))
            .all()
        )

        if not images:
            print("[!] No active site-media images found!")
            return

        print(f"Found {len(images)} active media library images.")

        img_map = { (img.file_name or img.original_filename or "").lower(): img for img in images }
        img_list = list(images)

        # 1. Update Blogs
        blogs = db.query(Blog).all()
        for idx, blog in enumerate(blogs):
            if not blog.thumbnail_media_id or blog.thumbnail is None:
                selected_img = img_list[idx % len(img_list)]
                blog.thumbnail_media_id = selected_img.id
                print(f"  [OK] Assigned thumbnail for Blog '{blog.title}' -> {selected_img.original_filename or selected_img.file_name}")

        db.commit()

        # 2. Update Recognition Awards
        awards = db.query(RecognitionAward).all()
        
        sample_awards_data = [
            ("LensCulture Portrait Winner", "Honored for excellence in fine art portraiture.", "fineart"),
            ("Vaud Photography Excellence", "Awarded best newborn & family photographer in Vaud.", "baby"),
            ("International Child Photo Award", "Recognized for capturing genuine childhood emotion.", "children"),
            ("Swiss Family Art Honors", "Top family photo session award in Lausanne & Vevey.", "family"),
        ]

        for idx, (title, desc, key_hint) in enumerate(sample_awards_data):
            matched_img = None
            for k, img in img_map.items():
                if key_hint in k:
                    matched_img = img
                    break
            if not matched_img:
                matched_img = img_list[idx % len(img_list)]

            existing = db.query(RecognitionAward).filter(RecognitionAward.title == title).first()
            if not existing:
                award = RecognitionAward(
                    title=title,
                    description=desc,
                    image_media_id=matched_img.id,
                    order_position=idx + 1,
                    is_active=True,
                )
                db.add(award)
                print(f"  [OK] Created Award '{title}' -> {matched_img.original_filename or matched_img.file_name}")
            else:
                existing.image_media_id = matched_img.id
                existing.description = desc
                existing.order_position = idx + 1
                existing.is_active = True
                print(f"  [OK] Updated Award '{title}' -> {matched_img.original_filename or matched_img.file_name}")

        db.commit()
        print("\n[OK] Blogs & Awards images successfully seeded!\n")

    except Exception as e:
        db.rollback()
        logger.error(f"Failed to seed blogs & awards: {e}", exc_info=True)
        print(f"\n[ERROR] Seeding failed: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_blogs_and_awards()
