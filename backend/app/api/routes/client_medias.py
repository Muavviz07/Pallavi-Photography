import uuid
import logging
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_user
from app.models.client_media import ClientMedia
from app.models.user import User
from app.services.s3_service import s3_service

router = APIRouter(prefix="/client-medias", tags=["client-medias"])
logger = logging.getLogger(__name__)


@router.post("/upload/{client_id}")
async def upload_client_media(
    client_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """Upload media file for a specific client into client-galleries folder"""
    try:
        try:
            client_uuid = uuid.UUID(client_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid client_id UUID format",
            )

        file_content = await file.read()
        filename = file.filename or "unnamed"
        content_type = file.content_type or "application/octet-stream"

        media_id = uuid.uuid4()
        s3_key = f"client-galleries/{client_id}/{media_id}_{filename}"

        s3_service.upload_object(
            s3_key=s3_key,
            file_content=file_content,
            content_type=content_type,
        )

        proxy_url = f"/api/client-medias/file/{media_id}"

        media = ClientMedia(
            id=media_id,
            client_id=client_uuid,
            original_filename=filename,
            file_size=len(file_content),
            content_type=content_type,
            s3_key=s3_key,
            s3_url=proxy_url,
            uploaded_by=current_user.id if current_user else None,
        )

        db.add(media)
        db.commit()
        db.refresh(media)

        logger.info(f"Uploaded client media: {s3_key}")

        return {
            "id": str(media.id),
            "filename": media.original_filename,
            "s3_url": media.s3_url,
            "client_id": str(media.client_id),
            "created_at": media.created_at.isoformat() if media.created_at else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to upload client media: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Upload failed",
        )


@router.get("/file/{media_id}")
async def get_client_media(media_id: str, db: Session = Depends(get_db)):
    """Fetch client media file stream via S3 proxy"""
    try:
        try:
            media_uuid = uuid.UUID(media_id)
            media = db.query(ClientMedia).filter(ClientMedia.id == media_uuid).first()
        except ValueError:
            media = db.query(ClientMedia).filter(ClientMedia.s3_key == media_id).first()

        if not media:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Media not found"
            )

        meta = s3_service.get_object_metadata_and_stream(media.s3_key)

        return StreamingResponse(
            meta["stream"],
            media_type=meta["content_type"] or media.content_type,
            headers={
                "Cache-Control": "public, max-age=604800",
                "Content-Disposition": f'inline; filename="{media.original_filename}"',
                "Access-Control-Allow-Origin": "*",
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch client media '{media_id}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to stream media",
        )


@router.get("/client/{client_id}")
async def list_client_media(client_id: str, db: Session = Depends(get_db)):
    """List all active media for a client"""
    try:
        try:
            client_uuid = uuid.UUID(client_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid client_id UUID format",
            )

        medias = (
            db.query(ClientMedia)
            .filter(
                ClientMedia.client_id == client_uuid,
                ClientMedia.is_archived == False,
            )
            .order_by(ClientMedia.created_at.desc())
            .all()
        )

        return {
            "total": len(medias),
            "medias": [
                {
                    "id": str(m.id),
                    "filename": m.original_filename,
                    "s3_url": m.s3_url,
                    "s3_key": m.s3_key,
                    "created_at": m.created_at.isoformat() if m.created_at else None,
                }
                for m in medias
            ],
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to list client media for '{client_id}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list media",
        )


@router.delete("/{media_id}")
async def delete_client_media(
    media_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """Delete client media file from S3 and database"""
    try:
        try:
            media_uuid = uuid.UUID(media_id)
            media = db.query(ClientMedia).filter(ClientMedia.id == media_uuid).first()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid media_id UUID"
            )

        if not media:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Media not found"
            )

        try:
            s3_service.delete_object(media.s3_key)
        except Exception as e:
            logger.warning(f"Could not delete S3 object '{media.s3_key}': {e}")

        db.delete(media)
        db.commit()

        return {"deleted": True, "id": media_id}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to delete client media '{media_id}': {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete media",
        )
