"""
Single Authoritative Image Storage Service.
Handles image uploads to Garage S3 storage, record deletions,
and centralized runtime URL resolution for public assets and client galleries.
"""

import uuid
import logging
from pathlib import Path
from typing import Optional, Any
from sqlalchemy.orm import Session
from app.models.image import Image
from app.services.s3_service import s3_service

logger = logging.getLogger(__name__)


class ImageService:
    """
    Single authoritative pipeline for image operations.
    """

    def __init__(self):
        self.storage_dir = Path("static/media")
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        print(f"[ImageService] Initialized single authoritative image pipeline.")
        logger.info(f"[ImageService] Initialized single authoritative image pipeline.")

    def get_image_url(self, image: Any) -> str:
        """
        Single authoritative backend URL resolver.
        Determines the appropriate URL to return based on image_type:
        - 'client_gallery': Short-lived runtime presigned URL.
        - 'public' / site media: Application proxy endpoint (/api/media/public/{s3_key}).
        """
        if not image:
            return ""

        s3_key = getattr(image, "s3_key", None)
        image_type = getattr(image, "image_type", "public") or "public"

        if image_type == "client_gallery" and s3_key:
            print(f"[ImageService] URL GENERATION (Presigned): Resolving runtime URL for private key '{s3_key}'")
            logger.info(f"[ImageService] URL GENERATION (Presigned): Resolving runtime URL for private key '{s3_key}'")
            return s3_service.get_presigned_url(s3_key)

        if s3_key:
            print(f"[ImageService] URL GENERATION (Public Proxy): Resolving proxy URL for key '{s3_key}'")
            logger.info(f"[ImageService] URL GENERATION (Public Proxy): Resolving proxy URL for key '{s3_key}'")
            return f"/api/media/public/{s3_key}"

        original_url = getattr(image, "original_url", None)
        return original_url or ""

    async def upload_image(
        self,
        file: Any,
        image_type: str = "public",
        client_id: Optional[Any] = None,
        db: Optional[Session] = None,
    ) -> dict:
        """
        Single authoritative method to upload file to S3 and return metadata.
        Stores immutable metadata in DB (zero presigned URLs persisted).
        """
        try:
            content = await file.read()
            if not content:
                raise ValueError("File is empty")

            original_filename = file.filename or f"{uuid.uuid4()}.jpg"
            print(f"[ImageService] UPLOAD: Processing '{original_filename}' as '{image_type}' (size={len(content)} bytes)")
            logger.info(f"[ImageService] UPLOAD: Processing '{original_filename}' as '{image_type}' (size={len(content)} bytes)")

            if image_type == "client_gallery":
                client_name = str(client_id) if client_id else "general"
                if db and client_id:
                    from app.models.client_gallery import ClientGallery
                    try:
                        c_uuid = uuid.UUID(str(client_id))
                        cg = db.query(ClientGallery).filter(ClientGallery.id == c_uuid).first()
                        if cg:
                            client_name = cg.slug or cg.title
                    except ValueError:
                        pass
                sanitized_client = "".join(c for c in client_name if c.isalnum() or c in ("-", "_")).lower()
                unique_file_name = f"{uuid.uuid4()}_{original_filename}"
                s3_key = f"client-galleries/{sanitized_client}/{unique_file_name}"
            else:
                unique_file_name = f"{uuid.uuid4()}_{original_filename}"
                s3_key = f"site-media/{unique_file_name}"

            content_type = getattr(file, "content_type", None) or "image/jpeg"
            s3_result = s3_service.upload_object(
                s3_key=s3_key,
                file_content=content,
                content_type=content_type,
            )

            print(f"[ImageService] UPLOAD SUCCESS: s3_key='{s3_key}', size={len(content)} bytes")
            logger.info(f"[ImageService] UPLOAD SUCCESS: s3_key='{s3_key}', size={len(content)} bytes")

            return {
                "filename": original_filename,
                "s3_key": s3_key,
                "image_type": image_type,
                "client_id": str(client_id) if client_id else None,
                "file_size": len(content),
                "mime_type": content_type,
            }
        except Exception as e:
            print(f"[ImageService ERROR] Upload failed: {e}")
            logger.error(f"[ImageService ERROR] Upload failed: {e}", exc_info=True)
            raise ValueError(f"Upload failed: {str(e)}")

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
        image_type: str = "public",
        client_id: Optional[Any] = None,
    ) -> Image:
        if not file_data:
            raise ValueError("File is empty")

        unique_filename = f"{uuid.uuid4()}_{original_filename}"
        s3_key = f"site-media/{unique_filename}"
        s3_service.upload_object(s3_key=s3_key, file_content=file_data)

        proxy_url = f"/api/media/public/{s3_key}"
        db_image = Image(
            id=uuid.uuid4(),
            file_name=unique_filename,
            original_filename=original_filename,
            original_url=proxy_url,
            s3_key=s3_key,
            s3_url=proxy_url,
            image_type=image_type,
            client_id=str(client_id) if client_id else None,
            title=title,
            alt_text=alt_text,
            description=description,
            gallery_id=gallery_id,
            file_size=len(file_data),
            dimensions={"aspect": aspect} if aspect else None,
        )
        db.add(db_image)
        db.flush()
        return db_image

    def delete_image_record(self, db: Session, image_id: uuid.UUID) -> bool:
        """
        Single authoritative delete pipeline:
        Removes database record and deletes Garage S3 object with logging.
        """
        db_image = db.query(Image).filter(Image.id == image_id).first()
        if not db_image:
            return False

        s3_key = db_image.s3_key or (db_image.original_url.split("/")[-1] if db_image.original_url else None)
        if s3_key:
            print(f"[ImageService] DELETE: Deleting S3 object for image_id='{image_id}', key='{s3_key}'")
            logger.info(f"[ImageService] DELETE: Deleting S3 object for image_id='{image_id}', key='{s3_key}'")
            try:
                s3_service.delete_object(s3_key)
            except Exception as e:
                logger.warning(f"[ImageService WARNING] S3 delete error for key '{s3_key}': {e}")

        db.delete(db_image)
        db.commit()
        print(f"[ImageService] DELETE SUCCESS: Removed DB record image_id='{image_id}'")
        logger.info(f"[ImageService] DELETE SUCCESS: Removed DB record image_id='{image_id}'")
        return True

    def delete_image(self, filename: str) -> bool:
        """Helper for deleting object by key or filename."""
        s3_key = filename if "site-media" in filename or "client-galleries" in filename else f"site-media/{filename}"
        return s3_service.delete_object(s3_key)


# Create global instance
image_service = ImageService()
