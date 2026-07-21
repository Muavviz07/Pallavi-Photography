import os
import sys
import logging
import mimetypes
from pathlib import Path
from datetime import datetime
import argparse

# Add project to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.s3_service import s3_service
from app.db.database import SessionLocal
from app.models.image import Image
from app.core.config import settings

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'migration_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler(),
    ]
)

logger = logging.getLogger(__name__)

class S3Migrator:
    def __init__(self, test_mode=False, dry_run=False):
        self.test_mode = test_mode
        self.dry_run = dry_run
        self.db = SessionLocal()
        self.stats = {
            "total": 0,
            "success": 0,
            "failed": 0,
            "skipped": 0,
        }
    
    def scan_local_storage(self, base_path="public/media"):
        """Scan local storage for all images."""
        images = []
        
        if not os.path.exists(base_path):
            logger.warning(f"Local storage path not found: {base_path}")
            return images
        
        for root, dirs, files in os.walk(base_path):
            for file in files:
                if file.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
                    local_path = os.path.join(root, file)
                    images.append(local_path)
        
        return images
    
    def migrate_image(self, local_path):
        """Migrate single image to S3."""
        try:
            # Read file
            with open(local_path, 'rb') as f:
                content = f.read()
            
            file_name = os.path.basename(local_path)
            file_size = len(content)
            content_type = mimetypes.guess_type(file_name)[0] or "image/jpeg"
            
            logger.info(f"Migrating: {local_path} ({file_size} bytes)")
            
            if self.dry_run:
                logger.info(f"[DRY RUN] Would upload: {file_name}")
                self.stats["success"] += 1
                return True
            
            # Upload to S3 (assume site-media for all existing images)
            result = s3_service.upload_site_media(
                file_name=file_name,
                file_content=content,
            )
            
            if self.test_mode:
                logger.info(f"[TEST MODE] Uploaded to S3: {result['s3_key']}")
            
            # Save to database
            image = Image(
                file_name=file_name,
                original_filename=file_name,
                s3_key=result["s3_key"],
                s3_url=result["s3_url"],
                original_url=result["s3_url"],
                image_type="site-media",
                local_path=local_path,
                file_size=file_size,
                content_type=content_type,
            )
            self.db.add(image)
            
            self.stats["success"] += 1
            return True
            
        except Exception as e:
            logger.error(f"Failed to migrate {local_path}: {e}")
            self.stats["failed"] += 1
            return False
    
    def run(self, base_path="public/media"):
        """Run migration."""
        logger.info(f"Starting migration (dry_run={self.dry_run}, test_mode={self.test_mode})")
        
        images = self.scan_local_storage(base_path)
        self.stats["total"] = len(images)
        
        logger.info(f"Found {len(images)} images to migrate")
        
        for i, image_path in enumerate(images, 1):
            logger.info(f"[{i}/{len(images)}] Processing: {image_path}")
            self.migrate_image(image_path)
        
        # Commit all at once
        if not self.dry_run:
            try:
                self.db.commit()
                logger.info("Database committed successfully")
            except Exception as e:
                logger.error(f"Database commit failed: {e}")
                self.db.rollback()
                self.stats["failed"] = self.stats["success"]
                self.stats["success"] = 0
        
        self.print_report()
        self.db.close()
    
    def print_report(self):
        """Print migration report."""
        logger.info("=" * 50)
        logger.info("MIGRATION REPORT")
        logger.info("=" * 50)
        logger.info(f"Total images: {self.stats['total']}")
        logger.info(f"Successful: {self.stats['success']}")
        logger.info(f"Failed: {self.stats['failed']}")
        logger.info(f"Skipped: {self.stats['skipped']}")
        logger.info("=" * 50)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Migrate local images to S3")
    parser.add_argument("--dry-run", action="store_true", help="Don't actually upload")
    parser.add_argument("--test-mode", action="store_true", help="Upload but don't delete local files")
    parser.add_argument("--path", default="public/media", help="Path to local media")
    
    args = parser.parse_args()
    
    migrator = S3Migrator(test_mode=args.test_mode, dry_run=args.dry_run)
    migrator.run(base_path=args.path)
