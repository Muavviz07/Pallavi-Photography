import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.s3_service import s3_service
from app.db.database import SessionLocal
from app.models.image import Image
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def verify_migration():
    """Verify all images migrated correctly."""
    db = SessionLocal()
    
    # Get all images from DB with s3_key set
    images = db.query(Image).filter(Image.s3_key.isnot(None)).all()
    logger.info(f"Total S3 images in database: {len(images)}")
    
    # Test S3 access
    logger.info("Verifying S3 access...")
    
    success_count = 0
    failed_count = 0
    
    for image in images:
        try:
            # Try to access the S3 object
            s3_service.client.head_object(Bucket=s3_service.bucket, Key=image.s3_key)
            success_count += 1
            logger.info(f"✓ {image.s3_key}")
        except Exception as e:
            failed_count += 1
            logger.error(f"✗ {image.s3_key}: {e}")
    
    logger.info(f"\nVerification complete: {success_count} OK, {failed_count} FAILED")
    db.close()

if __name__ == "__main__":
    verify_migration()
