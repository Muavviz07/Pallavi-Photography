import io
import uuid
import pytest
from unittest.mock import patch
from fastapi import status
from app.models.user import User, UserRole
from app.models.client_gallery import ClientGallery
from app.models.client_gallery_image import ClientGalleryImage

def get_admin_token(client, db, email="admin_cg@example.com", password="password123"):
    client.post("/api/auth/register", json={"email": email, "password": password})
    user = db.query(User).filter(User.email == email).first()
    user.role = UserRole.ADMIN.value
    db.commit()
    login_resp = client.post("/api/auth/login", json={"email": email, "password": password})
    return login_resp.json()["access_token"]

def get_client_token(client, db, email="client_cg@example.com", password="password123"):
    client.post("/api/auth/register", json={"email": email, "password": password})
    login_resp = client.post("/api/auth/login", json={"email": email, "password": password})
    return login_resp.json()["access_token"]

def test_list_client_galleries_unauthorized(client):
    response = client.get("/api/client-galleries")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_create_client_gallery_admin(client, db):
    admin_token = get_admin_token(client, db)
    
    # Create client user first to assign gallery to
    client.post("/api/auth/register", json={"email": "cg_owner@example.com", "password": "password123"})
    client_user = db.query(User).filter(User.email == "cg_owner@example.com").first()
    
    response = client.post(
        "/api/client-galleries",
        json={
            "user_id": str(client_user.id),
            "title": "Baby Liam Session",
            "slug": "baby-liam",
            "description": "Liam newborn session proofs",
            "status": "active",
            "password": "privatepassword",
            "can_upload": True,
            "can_download": True,
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["title"] == "Baby Liam Session"
    assert data["slug"] == "baby-liam"
    assert data["can_upload"] is True
    assert data["can_download"] is True

def test_unlock_client_gallery_password(client, db):
    admin_token = get_admin_token(client, db, email="admin_unl@example.com")
    client.post("/api/auth/register", json={"email": "client_unl@example.com", "password": "password123"})
    client_user = db.query(User).filter(User.email == "client_unl@example.com").first()
    
    # Create password-protected gallery
    client.post(
        "/api/client-galleries",
        json={
            "user_id": str(client_user.id),
            "title": "Liam Lock",
            "slug": "liam-lock",
            "password": "securelockkey",
            "can_view": True,
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    # Get metadata, should specify requires_password = True
    meta_resp = client.get("/api/client-galleries/liam-lock")
    assert meta_resp.status_code == status.HTTP_200_OK
    assert meta_resp.json()["requires_password"] is True
    
    # Try unlocking with wrong password
    access_resp_wrong = client.post(
        "/api/client-galleries/liam-lock/access",
        json={"password": "wrongpassword"}
    )
    assert access_resp_wrong.status_code == status.HTTP_401_UNAUTHORIZED
    
    # Unlock with correct password
    access_resp_correct = client.post(
        "/api/client-galleries/liam-lock/access",
        json={"password": "securelockkey"}
    )
    assert access_resp_correct.status_code == status.HTTP_200_OK
    assert access_resp_correct.json()["unlocked"] is True
    assert "token" in access_resp_correct.json()

@patch("app.services.s3_service.s3_service.upload_file")
def test_client_upload_permission_enforcement(mock_upload, client, db):
    mock_upload.return_value = "http://fake-minio/proof.webp"
    
    admin_token = get_admin_token(client, db, email="admin_pe@example.com")
    client_token = get_client_token(client, db, email="client_pe@example.com", password="password123")
    client_user = db.query(User).filter(User.email == "client_pe@example.com").first()
    
    # Create gallery with can_upload = False
    gallery_no_upload = client.post(
        "/api/client-galleries",
        json={
            "user_id": str(client_user.id),
            "title": "No Upload Proofs",
            "slug": "no-upload-slug",
            "can_upload": False,
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    ).json()
    
    # Create gallery with can_upload = True
    gallery_can_upload = client.post(
        "/api/client-galleries",
        json={
            "user_id": str(client_user.id),
            "title": "Can Upload Proofs",
            "slug": "can-upload-slug",
            "can_upload": True,
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    ).json()
    
    # Dummy file
    from PIL import Image as PILImage
    img_byte_arr = io.BytesIO()
    img = PILImage.new("RGB", (10, 10), color="black")
    img.save(img_byte_arr, format="PNG")
    dummy_png = img_byte_arr.getvalue()
    
    # 1. Try uploading to 'no-upload-slug' using client token, should fail with 403
    upload_fail = client.post(
        f"/api/client-galleries/no-upload-slug/images/upload",
        files={"file": ("test.png", io.BytesIO(dummy_png), "image/png")},
        headers={"Authorization": f"Bearer {client_token}"}
    )
    assert upload_fail.status_code == status.HTTP_403_FORBIDDEN
    
    # 2. Try uploading to 'can-upload-slug' using client token, should succeed
    upload_success = client.post(
        f"/api/client-galleries/can-upload-slug/images/upload",
        files={"file": ("test.png", io.BytesIO(dummy_png), "image/png")},
        headers={"Authorization": f"Bearer {client_token}"}
    )
    assert upload_success.status_code == status.HTTP_200_OK
    assert upload_success.json()["selected"] is False
    assert upload_success.json()["client_gallery_id"] == gallery_can_upload["id"]

@patch("app.services.s3_service.s3_service.upload_file")
def test_image_selection_and_final_submission(mock_upload, client, db):
    mock_upload.return_value = "http://fake-minio/proof.webp"
    
    admin_token = get_admin_token(client, db, email="admin_sub@example.com")
    client_token = get_client_token(client, db, email="client_sub@example.com", password="password123")
    client_user = db.query(User).filter(User.email == "client_sub@example.com").first()
    
    # Create gallery
    gallery = client.post(
        "/api/client-galleries",
        json={
            "user_id": str(client_user.id),
            "title": "Liam Selection Test",
            "slug": "liam-sel-test",
            "can_submit_selections": True,
            "can_upload": True,
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    ).json()
    
    # Upload image
    from PIL import Image as PILImage
    img_byte_arr = io.BytesIO()
    img = PILImage.new("RGB", (10, 10), color="black")
    img.save(img_byte_arr, format="PNG")
    dummy_png = img_byte_arr.getvalue()
    
    upload_resp = client.post(
        f"/api/client-galleries/liam-sel-test/images/upload",
        files={"file": ("test.png", io.BytesIO(dummy_png), "image/png")},
        headers={"Authorization": f"Bearer {client_token}"}
    )
    image_id = upload_resp.json()["image_id"]
    
    # Select the uploaded image
    select_resp = client.post(
        f"/api/client-galleries/liam-sel-test/images/{image_id}/select",
        json={"selected": True},
        headers={"Authorization": f"Bearer {client_token}"}
    )
    assert select_resp.status_code == status.HTTP_200_OK
    assert select_resp.json()["selected"] is True
    
    # Submit selections
    submit_resp = client.post(
        f"/api/client-galleries/liam-sel-test/submit-selections",
        headers={"Authorization": f"Bearer {client_token}"}
    )
    assert submit_resp.status_code == status.HTTP_200_OK
    assert submit_resp.json()["success"] is True
    assert submit_resp.json()["selected_count"] == 1
    
    # Try selecting again after submit, should fail with 400 because submissions are locked
    select_lock = client.post(
        f"/api/client-galleries/liam-sel-test/images/{image_id}/select",
        json={"selected": False},
        headers={"Authorization": f"Bearer {client_token}"}
    )
    assert select_lock.status_code == status.HTTP_400_BAD_REQUEST
    assert "already been submitted" in select_lock.json()["detail"]


def test_download_zip_url_workflow(client, db):
    admin_token = get_admin_token(client, db, email="admin_zip_wf@example.com")
    client.post("/api/auth/register", json={"email": "client_zip_wf@example.com", "password": "password123"})
    client_user = db.query(User).filter(User.email == "client_zip_wf@example.com").first()

    # 1. Create client gallery
    create_resp = client.post(
        "/api/client-galleries",
        json={
            "user_id": str(client_user.id),
            "title": "ZIP Workflow Gallery",
            "slug": "zip-wf-slug",
            "can_download_zip": True,
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert create_resp.status_code == status.HTTP_201_CREATED
    gallery_id = create_resp.json()["id"]

    # 2. Update download_zip_url as admin
    update_resp = client.put(
        f"/api/admin/galleries/{gallery_id}",
        json={
            "download_zip_url": "http://external-storage.local/package.zip"
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert update_resp.status_code == status.HTTP_200_OK
    assert update_resp.json()["download_zip_url"] == "http://external-storage.local/package.zip"

    # 3. Read metadata publicly
    public_resp = client.get("/api/client-galleries/zip-wf-slug")
    assert public_resp.status_code == status.HTTP_200_OK
    assert public_resp.json()["download_zip_url"] == "http://external-storage.local/package.zip"

