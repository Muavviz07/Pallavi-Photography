import io
import pytest
from unittest.mock import MagicMock, patch
from app.services.s3_service import S3Service, s3_service
from app.core.config import settings


@pytest.fixture
def mock_boto3_client():
    with patch("boto3.client") as mock_client:
        mock_s3 = MagicMock()
        mock_client.return_value = mock_s3
        yield mock_s3


def test_upload_site_media(mock_boto3_client):
    service = S3Service()
    service.client = mock_boto3_client

    result = service.upload_site_media("test_hero.jpg", b"fake image bytes")

    assert result["s3_key"] == "site-media/test_hero.jpg"
    assert result["file_name"] == "test_hero.jpg"
    mock_boto3_client.put_object.assert_called_once_with(
        Bucket=settings.S3_BUCKET,
        Key="site-media/test_hero.jpg",
        Body=b"fake image bytes",
        ContentType="image/jpeg",
    )


def test_upload_client_gallery(mock_boto3_client):
    service = S3Service()
    service.client = mock_boto3_client

    result = service.upload_client_gallery("John & Jane", "wedding_01.jpg", b"fake photo bytes")

    assert result["s3_key"] == "client-galleries/johnjane/wedding_01.jpg"
    assert result["file_name"] == "wedding_01.jpg"
    mock_boto3_client.put_object.assert_called_once()


def test_delete_object(mock_boto3_client):
    service = S3Service()
    service.client = mock_boto3_client

    res = service.delete_object("site-media/test_hero.jpg")
    assert res is True
    mock_boto3_client.delete_object.assert_called_once_with(
        Bucket=settings.S3_BUCKET,
        Key="site-media/test_hero.jpg",
    )


def test_get_presigned_url(mock_boto3_client):
    service = S3Service()
    service.client = mock_boto3_client
    mock_boto3_client.generate_presigned_url.return_value = "https://s3.pallaviphotography.com/pallavi-storage/key?signed=1"

    url = service.get_presigned_url("client-galleries/john_jane/wedding_01.jpg", expiration=1800)
    assert "signed=1" in url
    mock_boto3_client.generate_presigned_url.assert_called_once_with(
        "get_object",
        Params={"Bucket": settings.S3_BUCKET, "Key": "client-galleries/john_jane/wedding_01.jpg"},
        ExpiresIn=1800,
    )


def test_admin_upload_site_media_route(client, db):
    file_content = b"sample image payload"
    file_obj = io.BytesIO(file_content)

    with patch.object(s3_service, "upload_object") as mock_upload:
        mock_upload.return_value = {
            "s3_key": "site-media/test.jpg",
            "file_size": 20,
            "content_type": "image/jpeg",
        }

        response = client.post(
            "/api/admin/images/upload-site-media",
            files={"file": ("test.jpg", file_obj, "image/jpeg")},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["s3_key"].startswith("site-media/")
        assert data["s3_key"].endswith("_test.jpg")
        assert "id" in data


def test_admin_delete_image_route(client, db):
    file_content = b"sample image payload"
    file_obj = io.BytesIO(file_content)

    with patch.object(s3_service, "upload_object") as mock_upload:
        mock_upload.return_value = {
            "s3_key": "site-media/to_del.jpg",
            "file_size": 20,
            "content_type": "image/jpeg",
        }

        res_upload = client.post(
            "/api/admin/images/upload-site-media",
            files={"file": ("to_del.jpg", file_obj, "image/jpeg")},
        )
        img_id = res_upload.json()["id"]

    with patch.object(s3_service, "delete_object") as mock_delete:
        mock_delete.return_value = True

        res_del = client.delete(f"/api/admin/images/{img_id}")
        assert res_del.status_code == 200
        assert res_del.json()["message"] == "Image deleted successfully"
