import uuid
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status
from sqlalchemy.orm import Session

from app.models.image import Image
from app.services.s3_service import s3_service
from app.services.image_service import image_service
from app.api.dependencies import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/images", tags=["admin-images"])


@router.post("/upload-site-media")
async def upload_site_media(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Upload image to site-media/ folder."""
    try:
        content = await file.read()
        unique_file_name = f"{uuid.uuid4()}_{file.filename}"
        s3_key = f"site-media/{unique_file_name}"

        # Upload to S3
        result = s3_service.upload_object(
            s3_key=s3_key,
            file_content=content,
            content_type=file.content_type,
        )

        proxy_url = f"/api/media/public/{s3_key}"

        # Save to database
        image = Image(
            id=uuid.uuid4(),
            file_name=unique_file_name,
            original_filename=file.filename,
            s3_key=s3_key,
            s3_url=proxy_url,
            original_url=proxy_url,
            image_type="public",
            file_size=len(content),
            content_type=file.content_type,
        )
        db.add(image)
        db.commit()
        db.refresh(image)

        return {
            "id": str(image.id),
            "file_name": image.file_name,
            "s3_key": image.s3_key,
            "s3_url": proxy_url,
            "file_url": proxy_url,
            "message": "Image uploaded successfully",
        }
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload-client-gallery/{client_id}")
async def upload_client_gallery(
    client_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Upload image to client-galleries/{client-name}/ folder."""
    try:
        client_name = str(client_id)
        from app.models.client_gallery import ClientGallery
        try:
            client_uuid = uuid.UUID(str(client_id))
            client_gallery = db.query(ClientGallery).filter(ClientGallery.id == client_uuid).first()
            if client_gallery:
                client_name = client_gallery.slug or client_gallery.title
        except ValueError:
            pass

        content = await file.read()
        sanitized_client = "".join(c for c in client_name if c.isalnum() or c in ("-", "_")).lower()
        unique_file_name = f"{uuid.uuid4()}_{file.filename}"
        s3_key = f"client-galleries/{sanitized_client}/{unique_file_name}"

        # Upload to S3
        result = s3_service.upload_object(
            s3_key=s3_key,
            file_content=content,
            content_type=file.content_type,
        )

        presigned_url = s3_service.get_presigned_url(s3_key)

        image = Image(
            id=uuid.uuid4(),
            file_name=unique_file_name,
            original_filename=file.filename,
            s3_key=s3_key,
            s3_url=presigned_url,
            original_url=presigned_url,
            image_type="client_gallery",
            client_id=str(client_id),
            file_size=len(content),
            content_type=file.content_type,
        )
        db.add(image)
        db.commit()
        db.refresh(image)

        return {
            "id": str(image.id),
            "file_name": image.file_name,
            "s3_key": image.s3_key,
            "presigned_url": presigned_url,
            "file_url": presigned_url,
            "message": "Image uploaded successfully",
        }
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{image_id}")
async def delete_image(
    image_id: str,
    db: Session = Depends(get_db),
):
    """Delete image from S3 and database."""
    try:
        image = None
        try:
            img_uuid = uuid.UUID(image_id)
            image = db.query(Image).filter(Image.id == img_uuid).first()
        except ValueError:
            image = db.query(Image).filter(Image.s3_key == image_id).first()

        if not image:
            raise HTTPException(status_code=404, detail="Image not found")

        image_service.delete_image_record(db, image.id)
        return {"message": "Image deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{image_id}")
async def get_image(
    image_id: str,
    db: Session = Depends(get_db),
):
    """Get image details including runtime URL."""
    image = None
    try:
        img_uuid = uuid.UUID(image_id)
        image = db.query(Image).filter(Image.id == img_uuid).first()
    except ValueError:
        image = db.query(Image).filter(Image.s3_key == image_id).first()

    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    file_url = image_service.get_image_url(image)

    return {
        "id": str(image.id),
        "file_name": image.file_name or image.original_filename,
        "s3_key": image.s3_key,
        "s3_url": file_url,
        "file_url": file_url,
        "image_type": image.image_type,
        "created_at": image.created_at,
    }
