#!/usr/bin/env python3
"""Migrate real local images to S3 and update database records"""

import sys
import os
import glob
import logging
import uuid
import mimetypes

sys.path.insert(0, '.')

from app.db.database import SessionLocal
from app.models.image import Image
from app.services.s3_service import s3_service
from app.services.image_service import image_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def migrate_local_images():
    """Migrate valid local images to S3"""
    db = SessionLocal()
    valid_extensions = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp"}

    possible_paths = ["static/media", "app/static/media"]
    image_files = []
    for p in possible_paths:
        if os.path.exists(p):
            image_files.extend(glob.glob(f"{p}/*.*"))

    filtered_files = []
    for file_path in image_files:
        filename = os.path.basename(file_path)
        ext = os.path.splitext(filename)[1].lower()
        file_size = os.path.getsize(file_path)
        if ext not in valid_extensions:
            print(f"[SKIP] Skipping non-image extension: {filename}")
            continue
        if file_size <= 100:
            print(f"[SKIP] Skipping dummy test file ({file_size} bytes): {filename}")
            continue
        filtered_files.append(file_path)

    print(f"\n[INFO] Found {len(filtered_files)} valid local image files on disk to migrate\n")

    migrated_count = 0
    failed_count = 0

    for file_path in filtered_files:
        filename = os.path.basename(file_path)
        try:
            with open(file_path, "rb") as f:
                file_content = f.read()

            s3_key = f"site-media/{uuid.uuid4()}_{filename}"
            content_type = mimetypes.guess_type(filename)[0] or "image/jpeg"

            s3_service.upload_object(s3_key=s3_key, file_content=file_content, content_type=content_type)
            proxy_url = f"/api/media/proxy/{s3_key}"

            img_rec = (
                db.query(Image)
                .filter(
                    (Image.original_filename == filename)
                    | (Image.file_name == filename)
                    | (Image.original_url.like(f"%{filename}"))
                )
                .first()
            )

            if img_rec:
                img_rec.s3_key = s3_key
                img_rec.s3_url = proxy_url
                img_rec.original_url = proxy_url
                img_rec.image_type = "public"
                print(f"  [OK] Migrated disk file & updated DB record: {filename} -> {s3_key}")
            else:
                new_img = Image(
                    id=uuid.uuid4(),
                    file_name=filename,
                    original_filename=filename,
                    s3_key=s3_key,
                    s3_url=proxy_url,
                    original_url=proxy_url,
                    image_type="public",
                    file_size=len(file_content),
                    content_type=content_type,
                )
                db.add(new_img)
                print(f"  [OK] Created new DB record for disk file: {filename} -> {s3_key}")

            db.commit()
            migrated_count += 1
        except Exception as e:
            logger.error(f"Migration error for {filename}: {e}", exc_info=True)
            failed_count += 1

    db.close()

    print("\n" + "=" * 80)
    print("MIGRATION COMPLETE")
    print(f"[SUCCESS] Migrated: {migrated_count}")
    print(f"[FAIL] Failed: {failed_count}")
    print("=" * 80 + "\n")
    return migrated_count


if __name__ == "__main__":
    migrate_local_images()
