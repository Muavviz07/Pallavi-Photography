import io
import uuid
import pytest
from unittest.mock import patch
from fastapi import status
from PIL import Image as PILImage

from app.models.user import User, UserRole
from app.models.image import Image
from app.models.gallery import PortfolioGallery
from app.models.client_gallery import ClientGallery
from app.models.client_gallery_image import ClientGalleryImage
from tests.test_galleries import get_admin_token


def _dummy_png() -> bytes:
    img_byte_arr = io.BytesIO()
    img = PILImage.new("RGB", (10, 10), color="black")
    img.save(img_byte_arr, format="PNG")
    return img_byte_arr.getvalue()


@patch("app.services.s3_service.s3_service.upload_object")
def test_upload_media_to_library(mock_upload, client, db):
    mock_upload.return_value = {
        "s3_key": "site-media/library.png",
        "file_size": 70,
        "content_type": "image/png",
    }

    token = get_admin_token(client, db, email="media_upload@example.com")
    response = client.post(
        "/api/media",
        files={"file": ("library.png", io.BytesIO(_dummy_png()), "image/png")},
        data={
            "title": "Library Photo",
            "description": "Central upload",
            "alt_text": "Alt",
            "category": "family",
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["title"] == "Library Photo"
    assert data["category"] == "family"
    assert data["usage_count"] == 0
    assert data["file_url"].startswith("/api/media/public/site-media/")


def test_list_media_requires_admin(client):
    response = client.get("/api/media")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@patch("app.services.s3_service.s3_service.upload_object")
def test_list_and_get_media(mock_upload, client, db):
    mock_upload.return_value = {
        "s3_key": "site-media/list.png",
        "file_size": 70,
        "content_type": "image/png",
    }
    token = get_admin_token(client, db, email="media_list@example.com")

    upload_resp = client.post(
        "/api/media",
        files={"file": ("list.png", io.BytesIO(_dummy_png()), "image/png")},
        headers={"Authorization": f"Bearer {token}"},
    )
    media_id = upload_resp.json()["id"]

    list_resp = client.get("/api/media", headers={"Authorization": f"Bearer {token}"})
    assert list_resp.status_code == status.HTTP_200_OK
    payload = list_resp.json()
    assert payload["total"] >= 1
    assert any(item["id"] == media_id for item in payload["items"])

    get_resp = client.get(f"/api/media/{media_id}", headers={"Authorization": f"Bearer {token}"})
    assert get_resp.status_code == status.HTTP_200_OK
    assert get_resp.json()["id"] == media_id


@patch("app.services.s3_service.s3_service.upload_object")
def test_update_media_metadata(mock_upload, client, db):
    mock_upload.return_value = {
        "s3_key": "site-media/update.png",
        "file_size": 70,
        "content_type": "image/png",
    }
    token = get_admin_token(client, db, email="media_update@example.com")

    upload_resp = client.post(
        "/api/media",
        files={"file": ("update.png", io.BytesIO(_dummy_png()), "image/png")},
        headers={"Authorization": f"Bearer {token}"},
    )
    media_id = upload_resp.json()["id"]

    patch_resp = client.patch(
        f"/api/media/{media_id}",
        json={"description": "Updated description", "category": "newborn"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert patch_resp.status_code == status.HTTP_200_OK
    assert patch_resp.json()["description"] == "Updated description"
    assert patch_resp.json()["category"] == "newborn"


@patch("app.services.s3_service.s3_service.upload_object")
@patch("app.services.s3_service.s3_service.delete_object")
def test_delete_unused_media(mock_delete, mock_upload, client, db):
    mock_upload.return_value = {
        "s3_key": "site-media/delete.png",
        "file_size": 70,
        "content_type": "image/png",
    }
    mock_delete.return_value = True
    token = get_admin_token(client, db, email="media_delete@example.com")

    upload_resp = client.post(
        "/api/media",
        files={"file": ("delete.png", io.BytesIO(_dummy_png()), "image/png")},
        headers={"Authorization": f"Bearer {token}"},
    )
    media_id = upload_resp.json()["id"]

    delete_resp = client.delete(
        f"/api/media/{media_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert delete_resp.status_code == status.HTTP_200_OK
    mock_delete.assert_called()


@patch("app.services.s3_service.s3_service.upload_object")
def test_cannot_delete_media_in_use(mock_upload, client, db):
    mock_upload.return_value = {
        "s3_key": "site-media/inuse.png",
        "file_size": 70,
        "content_type": "image/png",
    }
    token = get_admin_token(client, db, email="media_inuse@example.com")

    upload_resp = client.post(
        "/api/media",
        files={"file": ("inuse.png", io.BytesIO(_dummy_png()), "image/png")},
        headers={"Authorization": f"Bearer {token}"},
    )
    media_id = upload_resp.json()["id"]

    gallery_resp = client.post(
        "/api/galleries",
        json={"name": "Use Gallery", "slug": "use-gallery", "is_active": True},
        headers={"Authorization": f"Bearer {token}"},
    )
    gallery_id = gallery_resp.json()["id"]

    add_resp = client.post(
        f"/api/galleries/{gallery_id}/images",
        json={"image_id": media_id},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert add_resp.status_code == status.HTTP_200_OK

    delete_resp = client.delete(
        f"/api/media/{media_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert delete_resp.status_code == status.HTTP_400_BAD_REQUEST
    assert "Cannot delete" in delete_resp.json()["detail"]


@patch("app.services.s3_service.s3_service.upload_object")
def test_add_media_to_portfolio_gallery(mock_upload, client, db):
    mock_upload.return_value = {
        "s3_key": "site-media/portfolio.png",
        "file_size": 70,
        "content_type": "image/png",
    }
    token = get_admin_token(client, db, email="media_portfolio@example.com")

    media_resp = client.post(
        "/api/media",
        files={"file": ("portfolio.png", io.BytesIO(_dummy_png()), "image/png")},
        headers={"Authorization": f"Bearer {token}"},
    )
    media_id = media_resp.json()["id"]
    gallery_resp = client.post(
        "/api/galleries",
        json={"name": "Portfolio", "slug": "portfolio-lib", "is_active": True},
        headers={"Authorization": f"Bearer {token}"},
    )
    gallery_id = gallery_resp.json()["id"]

    add_resp = client.post(
        f"/api/galleries/{gallery_id}/images",
        json={"image_id": media_id},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert add_resp.status_code == status.HTTP_200_OK

    images_resp = client.get(f"/api/galleries/{gallery_id}/images")
    assert len(images_resp.json()) == 1


@patch("app.services.s3_service.s3_service.upload_object")
def test_add_media_to_client_gallery(mock_upload, client, db):
    mock_upload.return_value = {
        "s3_key": "site-media/client.png",
        "file_size": 70,
        "content_type": "image/png",
    }
    token = get_admin_token(client, db, email="media_client@example.com")

    admin = db.query(User).filter(User.email == "media_client@example.com").first()
    client_user = User(
        id=uuid.uuid4(),
        email="client_media@example.com",
        password_hash="hashed",
        role=UserRole.CLIENT.value,
        status="active",
    )
    db.add(client_user)
    db.commit()

    media_resp = client.post(
        "/api/media",
        files={"file": ("client.png", io.BytesIO(_dummy_png()), "image/png")},
        headers={"Authorization": f"Bearer {token}"},
    )
    media_id = media_resp.json()["id"]

    gallery_resp = client.post(
        "/api/client-galleries",
        json={
            "title": "Client Proof",
            "slug": "client-proof",
            "user_id": str(client_user.id),
            "password": "secret123",
            "status": "active",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    gallery_id = gallery_resp.json()["id"]

    add_resp = client.post(
        f"/api/client-galleries/{gallery_id}/images",
        json={"image_id": media_id},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert add_resp.status_code == status.HTTP_200_OK
    assert add_resp.json()["image_id"] == media_id

    images_resp = client.get(
        f"/api/client-galleries/{gallery_id}/images",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert len(images_resp.json()) == 1
