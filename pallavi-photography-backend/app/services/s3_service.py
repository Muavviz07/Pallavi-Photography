import json
import logging
from typing import BinaryIO
import boto3
from botocore.exceptions import ClientError
from app.core.config import settings

logger = logging.getLogger(__name__)

class S3Service:
    def __init__(self):
        self.s3_client = boto3.client(
            "s3",
            endpoint_url=settings.MINIO_ENDPOINT,
            aws_access_key_id=settings.MINIO_ROOT_USER,
            aws_secret_access_key=settings.MINIO_ROOT_PASSWORD,
            region_name="us-east-1",
        )
        self.bucket_name = settings.MINIO_BUCKET_NAME
        self.ensure_bucket_exists_and_public()

    def ensure_bucket_exists_and_public(self):
        try:
            # Check if bucket exists
            self.s3_client.head_bucket(Bucket=self.bucket_name)
            logger.info(f"Bucket '{self.bucket_name}' already exists.")
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code")
            if error_code in ["404", "NoSuchBucket"]:
                logger.info(f"Bucket '{self.bucket_name}' does not exist. Creating...")
                try:
                    self.s3_client.create_bucket(Bucket=self.bucket_name)
                    logger.info(f"Bucket '{self.bucket_name}' created successfully.")
                except Exception as create_err:
                    logger.error(f"Failed to create bucket: {create_err}")
                    raise create_err
            else:
                logger.error(f"Error checking bucket: {e}")
                raise e

        # Set public read policy on the bucket
        try:
            bucket_policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "PublicRead",
                        "Effect": "Allow",
                        "Principal": "*",
                        "Action": ["s3:GetObject"],
                        "Resource": [f"arn:aws:s3:::{self.bucket_name}/*"],
                    }
                ],
            }
            policy_string = json.dumps(bucket_policy)
            self.s3_client.put_bucket_policy(
                Bucket=self.bucket_name, Policy=policy_string
            )
            logger.info(f"Public read policy applied to bucket '{self.bucket_name}'.")
        except Exception as policy_err:
            logger.warning(f"Could not apply public policy to bucket: {policy_err}")

    def upload_file(self, file_obj: BinaryIO, object_name: str, content_type: str = "image/webp") -> str:
        """
        Uploads a file object to S3 and returns its public access URL.
        """
        try:
            self.s3_client.upload_fileobj(
                file_obj,
                self.bucket_name,
                object_name,
                ExtraArgs={
                    "ContentType": content_type,
                },
            )
            # Build public url
            # For MinIO local environment, we return the MINIO_ENDPOINT/bucket/object_name URL
            public_url = f"{settings.MINIO_ENDPOINT}/{self.bucket_name}/{object_name}"
            logger.info(f"Uploaded file '{object_name}' to S3. URL: {public_url}")
            return public_url
        except ClientError as e:
            logger.error(f"Failed to upload file to S3: {e}")
            raise e

    def delete_file(self, object_name: str) -> bool:
        """
        Deletes a file object from S3.
        """
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=object_name)
            logger.info(f"Deleted file '{object_name}' from S3.")
            return True
        except ClientError as e:
            logger.error(f"Failed to delete file from S3: {e}")
            return False

# Singleton instance
s3_service = S3Service()
