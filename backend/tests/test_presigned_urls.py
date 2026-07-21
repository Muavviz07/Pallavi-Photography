import io
import uuid
import pytest
from unittest.mock import patch, MagicMock
from fastapi import status
from PIL import Image as PILImage

from app.services.s3_service import s3_service
from tests.test_galleries import get_admin_token


def _dummy_png() -> bytes:
    img_byte_arr = io.BytesIO()
    img = PILImage.new("RGB", (10, 10), color="black")
    img.save(img_byte_arr, format="PNG")
    return img_byte_arr.getvalue()


@patch("app.services.s3_service.s3_service.get_object_metadata_and_stream")
def test_public_media_proxy_endpoint(mock_get_object, client):
    mock_body = MagicMock()
    mock_body.__iter__.return_value = [b"fake image bytes"]
    mock_get_object.return_value = {
        "stream": mock_body,
        "content_type": "image/png",
        "content_length": 16,
        "etag": '"etag123"',
        "last_modified": "Mon, 21 Jul 2026 09:00:00 GMT",
    }

    response = client.get("/api/media/public/site-media/sample.png")
    assert response.status_code == status.HTTP_200_OK
    assert "image/png" in response.headers["content-type"]
    assert "public, max-age=31536000" in response.headers["cache-control"]
    assert response.headers["etag"] == '"etag123"'


@patch("app.services.s3_service.s3_service.get_object_metadata_and_stream")
def test_public_media_proxy_304_cache(mock_get_object, client):
    mock_get_object.return_value = {
        "stream": None,
        "content_type": "image/png",
        "content_length": 16,
        "etag": '"etag123"',
        "last_modified": "Mon, 21 Jul 2026 09:00:00 GMT",
    }

    response = client.get(
        "/api/media/public/site-media/sample.png",
        headers={"If-None-Match": '"etag123"'},
    )
    assert response.status_code == status.HTTP_304_NOT_MODIFIED


@patch("app.services.s3_service.s3_service.upload_object")
def test_upload_public_media_returns_proxy_url(mock_upload, client, db):
    mock_upload.return_value = {
        "s3_key": "site-media/public_test.png",
        "file_size": 70,
        "content_type": "image/png",
    }

    token = get_admin_token(client, db, email="proxy_upload@example.com")
    response = client.post(
        "/api/media",
        files={"file": ("public_test.png", io.BytesIO(_dummy_png()), "image/png")},
        data={"image_type": "public"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["file_url"].startswith("/api/media/public/site-media/")
    assert data["file_url"].endswith("_public_test.png")
    assert data["s3_key"].startswith("site-media/")
    assert data["s3_key"].endswith("_public_test.png")


@patch("app.services.s3_service.s3_service.get_presigned_url")
def test_refresh_presigned_url_endpoint(mock_presigned, client, db):
    mock_presigned.return_value = "https://s3.pallaviphotography.com/pallavi-storage/client-galleries/c1/img.png?token=fresh"

    from app.models.image import Image
    db_img = Image(
        id=uuid.uuid4(),
        s3_key="client-galleries/c1/img.png",
        image_type="client_gallery",
    )
    db.add(db_img)
    db.commit()

    response = client.get(f"/api/media/refresh-url/{db_img.id}")
    assert response.status_code == status.HTTP_200_OK
    assert "token=fresh" in response.json()["s3_url"]
