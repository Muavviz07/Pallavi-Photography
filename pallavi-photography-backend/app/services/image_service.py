import io
import uuid
import logging
from typing import Optional
from PIL import Image as PILImage, ImageOps
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.image import Image
from app.models.gallery import Gallery
from app.services.s3_service import s3_service

logger = logging.getLogger(__name__)

class ImageService:
    def process_and_upload_image(
        self,
        db: Session,
        file_data: bytes,
        original_filename: str,
        gallery_id: Optional[uuid.UUID] = None,
        title: Optional[str] = None,
        alt_text: Optional[str] = None,
        description: Optional[str] = None,
        aspect: Optional[str] = None,
        uploaded_by_id: Optional[uuid.UUID] = None,
        category: Optional[str] = None,
    ) -> Image:
        """
        Process, optimize, thumbnail and upload an image file.
        Saves record to DB.
        """
        # Create a unique prefix for this upload transaction
        file_prefix = str(uuid.uuid4())
        
        # Load image with Pillow & correct orientation based on EXIF
        try:
            pil_image = PILImage.open(io.BytesIO(file_data))
            pil_image = ImageOps.exif_transpose(pil_image)
        except Exception as e:
            logger.error(f"Failed to open or correct orientation for image: {e}")
            raise ValueError("Invalid image file format.")

        # Gather metadata
        width, height = pil_image.size
        original_format = pil_image.format or "JPEG"
        file_size = len(file_data)
        
        # Determine files' content types
        original_content_type = f"image/{original_format.lower()}"
        if original_format.lower() == "jpg":
            original_content_type = "image/jpeg"

        # 1. Upload original image
        original_key = f"original/{file_prefix}_{original_filename}"
        original_url = s3_service.upload_file(
            io.BytesIO(file_data),
            original_key,
            content_type=original_content_type
        )

        # 2. Generate and upload optimized version (WebP, 80% quality)
        optimized_buffer = io.BytesIO()
        # Ensure we keep colorspace conversion if saving as WebP
        if pil_image.mode in ("RGBA", "LA") or (pil_image.mode == "P" and "transparency" in pil_image.info):
            # Keep transparency
            save_mode = "RGBA"
        else:
            save_mode = "RGB"
        
        opt_image = pil_image.convert(save_mode)
        opt_image.save(optimized_buffer, format="WEBP", quality=80)
        optimized_buffer.seek(0)
        
        optimized_key = f"optimized/{file_prefix}.webp"
        optimized_url = s3_service.upload_file(
            optimized_buffer,
            optimized_key,
            content_type="image/webp"
        )

        # 3. Generate and upload thumbnail version (WebP, 150x150 crop)
        thumb_buffer = io.BytesIO()
        # Use ImageOps.fit to crop and resize nicely to 150x150
        thumb_image = ImageOps.fit(pil_image, (150, 150), centering=(0.5, 0.5))
        thumb_image = thumb_image.convert(save_mode)
        thumb_image.save(thumb_buffer, format="WEBP", quality=80)
        thumb_buffer.seek(0)
        
        thumbnail_key = f"thumbnail/{file_prefix}.webp"
        thumbnail_url = s3_service.upload_file(
            thumb_buffer,
            thumbnail_key,
            content_type="image/webp"
        )

        # Calculate database properties
        dimensions = {"width": width, "height": height}
        if aspect:
            dimensions["aspect"] = aspect
        
        # Save DB record
        db_image = Image(
            gallery_id=gallery_id,
            uploaded_by_id=uploaded_by_id,
            title=title or original_filename.rsplit(".", 1)[0],
            alt_text=alt_text or title or "Portfolio photo",
            description=description,
            category=category,
            original_filename=original_filename,
            original_url=original_url,
            optimized_url=optimized_url,
            thumbnail_url=thumbnail_url,
            file_size=file_size,
            dimensions=dimensions,
            format="webp",
            sort_order=0,  # Default, can be ordered later
            usage_count=1 if gallery_id else 0,
        )
        
        db.add(db_image)
        db.commit()
        db.refresh(db_image)

        # If a gallery exists and has no cover image yet, set this image as cover
        if gallery_id:
            gallery = db.query(Gallery).filter(Gallery.id == gallery_id).first()
            if gallery and not gallery.cover_image_id:
                gallery.cover_image_id = db_image.id
                db.add(gallery)
                db.commit()
                db.refresh(db_image)

        logger.info(f"Successfully processed, optimized and stored image. DB ID: {db_image.id}")
        return db_image

    def delete_image_record(self, db: Session, image_id: uuid.UUID) -> bool:
        """
        Deletes the image database record and associated S3 files.
        """
        db_image = db.query(Image).filter(Image.id == image_id).first()
        if not db_image:
            return False

        # Extract S3 object keys from URLs
        # S3 local URLs: http://localhost:9000/pallavi-photography/original/uuid_filename
        # We need the key path after bucket name
        bucket_prefix = f"/{settings.MINIO_BUCKET_NAME}/"
        
        def get_key_from_url(url: Optional[str]) -> Optional[str]:
            if not url or bucket_prefix not in url:
                return None
            return url.split(bucket_prefix, 1)[1]

        original_key = get_key_from_url(db_image.original_url)
        optimized_key = get_key_from_url(db_image.optimized_url)
        thumbnail_key = get_key_from_url(db_image.thumbnail_url)

        # Delete S3 objects
        if original_key:
            s3_service.delete_file(original_key)
        if optimized_key:
            s3_service.delete_file(optimized_key)
        if thumbnail_key:
            s3_service.delete_file(thumbnail_key)

        # Delete DB Record
        db.delete(db_image)
        db.commit()
        return True

# Singleton instance
image_service = ImageService()
