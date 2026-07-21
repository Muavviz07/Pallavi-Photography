import boto3
from botocore.exceptions import ClientError
from app.core.config import settings
import logging
from typing import Optional, BinaryIO, Dict, Any
from datetime import datetime
import mimetypes

logger = logging.getLogger(__name__)


class S3Service:
    """
    Single authoritative S3/Garage storage service.
    Handles object uploads, deletions, presigned URLs (for private media),
    and object streaming metadata (for public media proxy).
    """

    def __init__(self):
        logger.info(
            f"[S3Service] Initializing boto3 S3 client for endpoint '{settings.S3_ENDPOINT}', "
            f"bucket '{settings.S3_BUCKET}', region '{settings.S3_REGION}'"
        )
        self.client = boto3.client(
            "s3",
            endpoint_url=settings.S3_ENDPOINT,
            aws_access_key_id=settings.S3_ACCESS_KEY,
            aws_secret_access_key=settings.S3_SECRET_KEY,
            region_name=settings.S3_REGION,
            use_ssl=settings.S3_USE_SSL,
        )
        self.bucket = settings.S3_BUCKET
        self.bucket_name = settings.S3_BUCKET

    def is_configured(self) -> bool:
        """Check if S3 credentials are set."""
        key = (settings.S3_ACCESS_KEY or "").strip()
        secret = (settings.S3_SECRET_KEY or "").strip()
        return bool(key and secret)

    def upload_object(
        self,
        s3_key: str,
        file_content: bytes,
        content_type: Optional[str] = None,
    ) -> dict:
        """
        Single authoritative method to upload object to S3.
        Stores object in private Garage bucket.
        """
        if not content_type:
            content_type = mimetypes.guess_type(s3_key)[0] or "application/octet-stream"

        print(f"[S3Service] UPLOAD: Uploading Key='{s3_key}', Size={len(file_content)} bytes, ContentType='{content_type}'")
        logger.info(f"[S3Service] UPLOAD: Uploading Key='{s3_key}', Size={len(file_content)} bytes, ContentType='{content_type}'")

        try:
            self.client.put_object(
                Bucket=self.bucket,
                Key=s3_key,
                Body=file_content,
                ContentType=content_type,
            )
            return {
                "s3_key": s3_key,
                "file_size": len(file_content),
                "content_type": content_type,
            }
        except ClientError as e:
            print(f"[S3Service ERROR] ClientError uploading Key='{s3_key}': {e}")
            logger.error(f"[S3Service ERROR] ClientError uploading Key='{s3_key}': {e}", exc_info=True)
            raise Exception(f"S3 upload failed: {str(e)}")

    def delete_object(self, s3_key: str) -> bool:
        """
        Single authoritative method to delete object from S3.
        """
        try:
            print(f"[S3Service] DELETE: Deleting Key='{s3_key}'")
            logger.info(f"[S3Service] DELETE: Deleting Key='{s3_key}'")
            self.client.delete_object(Bucket=self.bucket, Key=s3_key)
            return True
        except ClientError as e:
            logger.error(f"[S3Service ERROR] Failed to delete Key='{s3_key}': {e}", exc_info=True)
            raise Exception(f"S3 delete failed: {str(e)}")

    def get_object_metadata_and_stream(self, s3_key: str) -> Dict[str, Any]:
        """
        Retrieve object stream and metadata for public image proxying.
        Returns dict with stream, content_type, content_length, etag, and last_modified.
        """
        try:
            response = self.client.get_object(Bucket=self.bucket, Key=s3_key)
            return {
                "stream": response["Body"],
                "content_type": response.get("ContentType", "application/octet-stream"),
                "content_length": response.get("ContentLength"),
                "etag": response.get("ETag"),
                "last_modified": response.get("LastModified"),
            }
        except ClientError as e:
            logger.error(f"[S3Service ERROR] Object not found or error for Key='{s3_key}': {e}")
            raise Exception(f"Object not found: {str(e)}")

    def get_presigned_url(self, s3_key: str, expiration: int = 604800) -> str:
        """
        Generate short-lived presigned URL at runtime for private client gallery media.
        Default expiration: 7 days (604800 seconds).
        """
        try:
            url = self.client.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket, "Key": s3_key},
                ExpiresIn=expiration,
            )
            print(f"[S3Service] URL GENERATION (Presigned): Key='{s3_key}', expiration={expiration}s")
            logger.info(f"[S3Service] URL GENERATION (Presigned): Key='{s3_key}', expiration={expiration}s")
            return url
        except ClientError as e:
            logger.error(f"[S3Service ERROR] Failed to generate presigned URL for Key='{s3_key}': {e}", exc_info=True)
            raise Exception(f"Presigned URL generation failed: {str(e)}")

    def list_objects(self, prefix: str = "") -> list:
        """List all objects in S3 with prefix."""
        try:
            response = self.client.list_objects_v2(
                Bucket=self.bucket,
                Prefix=prefix,
            )
            if "Contents" not in response:
                return []
            return [{"Key": obj["Key"], "Size": obj["Size"], "LastModified": str(obj["LastModified"])} 
                    for obj in response["Contents"]]
        except ClientError as e:
            logger.error(f"[S3Service ERROR] Failed to list objects: {e}")
            raise Exception(f"S3 list failed: {str(e)}")

    # Backwards compatibility helpers for existing tests
    def upload_file(self, file_obj: BinaryIO, object_name: str, content_type: str = "image/webp") -> str:
        content = file_obj.read() if hasattr(file_obj, "read") else file_obj
        res = self.upload_object(s3_key=object_name, file_content=content, content_type=content_type)
        return f"/api/media/public/{res['s3_key']}"

    def upload_site_media(self, file_name: str, file_content: bytes) -> dict:
        s3_key = f"{settings.S3_SITE_MEDIA_PREFIX}/{file_name}"
        res = self.upload_object(s3_key=s3_key, file_content=file_content)
        res["file_name"] = file_name
        res["s3_url"] = f"/api/media/public/{s3_key}"
        return res

    def upload_client_gallery(self, client_name: str, file_name: str, file_content: bytes) -> dict:
        sanitized_client = "".join(c for c in client_name if c.isalnum() or c in ("-", "_")).lower()
        s3_key = f"{settings.S3_CLIENT_GALLERIES_PREFIX}/{sanitized_client}/{file_name}"
        res = self.upload_object(s3_key=s3_key, file_content=file_content)
        res["file_name"] = file_name
        res["s3_url"] = self.get_presigned_url(s3_key)
        return res


# Create singleton
s3_service = S3Service()
