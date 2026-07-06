import io
import uuid
import pytest
from unittest.mock import patch
from fastapi import status
from app.models.user import User, UserRole
from app.models.gallery import Gallery, GalleryStatus
from app.models.image import Image

def get_admin_token(client, db, email="admin_test@example.com", password="password123"):
    # Register user
    client.post(
        "/api/auth/register",
        json={"email": email, "password": password}
    )
    # Fetch user from DB and update role to ADMIN
    user = db.query(User).filter(User.email == email).first()
    user.role = UserRole.ADMIN.value
    db.commit()
    
    # Login to get token
    login_resp = client.post(
        "/api/auth/login",
        json={"email": email, "password": password}
    )
    return login_resp.json()["access_token"]

def test_list_galleries_empty(client):
    response = client.get("/api/galleries")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []

def test_create_gallery_unauthorized(client):
    response = client.post(
        "/api/galleries",
        json={"title": "Newborns", "slug": "newborns", "category": "newborn"}
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_create_gallery_as_admin(client, db):
    token = get_admin_token(client, db)
    response = client.post(
        "/api/galleries",
        json={"title": "Newborns", "slug": "newborns", "category": "newborn", "status": "published"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["title"] == "Newborns"
    assert data["slug"] == "newborns"
    assert data["category"] == "newborn"
    assert data["status"] == "published"
    assert "id" in data

def test_create_duplicate_slug_gallery(client, db):
    token = get_admin_token(client, db, email="admin_dup@example.com")
    # First create
    client.post(
        "/api/galleries",
        json={"title": "Family", "slug": "family", "category": "family", "status": "published"},
        headers={"Authorization": f"Bearer {token}"}
    )
    # Second create with duplicate slug
    response = client.post(
        "/api/galleries",
        json={"title": "Family 2", "slug": "family", "category": "family", "status": "published"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "already exists" in response.json()["detail"]

def test_get_gallery_by_slug(client, db):
    token = get_admin_token(client, db, email="admin_slug@example.com")
    # Create gallery
    client.post(
        "/api/galleries",
        json={"title": "Maternity Portfolio", "slug": "maternity-slug", "category": "maternity", "status": "published"},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Get by slug
    response = client.get("/api/galleries/maternity-slug")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["title"] == "Maternity Portfolio"

def test_update_gallery(client, db):
    token = get_admin_token(client, db, email="admin_upd@example.com")
    # Create gallery
    create_resp = client.post(
        "/api/galleries",
        json={"title": "Nature", "slug": "nature", "category": "nature", "status": "draft"},
        headers={"Authorization": f"Bearer {token}"}
    )
    gallery_id = create_resp.json()["id"]
    
    # Update gallery
    response = client.put(
        f"/api/galleries/{gallery_id}",
        json={"title": "Nature Updated", "status": "published"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["title"] == "Nature Updated"
    assert data["status"] == "published"

@patch("app.services.s3_service.s3_service.upload_file")
def test_upload_gallery_image(mock_upload, client, db):
    mock_upload.return_value = "http://fake-minio/pallavi-photography/image.webp"
    
    token = get_admin_token(client, db, email="admin_upload@example.com")
    # Create gallery
    gallery_resp = client.post(
        "/api/galleries",
        json={"title": "Fine Art", "slug": "fine-art", "category": "fine_art", "status": "published"},
        headers={"Authorization": f"Bearer {token}"}
    )
    gallery_id = gallery_resp.json()["id"]
    
    # Create a dummy image in memory dynamically using Pillow
    from PIL import Image as PILImage
    img_byte_arr = io.BytesIO()
    img = PILImage.new("RGB", (10, 10), color="black")
    img.save(img_byte_arr, format="PNG")
    dummy_png = img_byte_arr.getvalue()
    
    response = client.post(
        f"/api/galleries/{gallery_id}/upload",
        files={"file": ("test.png", io.BytesIO(dummy_png), "image/png")},
        data={"title": "Test Photo", "alt_text": "Alt Text", "description": "Desc"},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["title"] == "Test Photo"
    assert data["alt_text"] == "Alt Text"
    assert data["description"] == "Desc"
    assert data["original_url"].startswith("/static/media/")

    # Verify that cover image ID was auto-updated on the gallery
    gallery_get = client.get(f"/api/galleries/{gallery_id}")
    assert gallery_get.json()["cover_image_id"] == data["id"]
