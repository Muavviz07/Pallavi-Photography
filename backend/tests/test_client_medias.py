import io
import uuid
import pytest
from unittest.mock import patch
from fastapi import status
from app.models.user import User, UserRole
from tests.test_galleries import get_admin_token


def _dummy_png() -> bytes:
    from PIL import Image as PILImage

    img_byte_arr = io.BytesIO()
    img = PILImage.new("RGB", (10, 10), color="blue")
    img.save(img_byte_arr, format="PNG")
    return img_byte_arr.getvalue()


@pytest.fixture
def client_user(db):
    user = User(
        id=uuid.uuid4(),
        email=f"client_{uuid.uuid4().hex[:6]}@example.com",
        password_hash="hashed",
        role=UserRole.CLIENT.value,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@patch("app.services.s3_service.s3_service.upload_object")
@patch("app.services.s3_service.s3_service.get_object_metadata_and_stream")
@patch("app.services.s3_service.s3_service.delete_object")
def test_client_medias_crud(
    mock_delete, mock_stream, mock_upload, client, db, client_user
):
    token = get_admin_token(client, db, email="client_admin_test@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    mock_upload.return_value = {
        "s3_key": f"client-galleries/{client_user.id}/test.png",
        "file_size": 100,
        "content_type": "image/png",
    }
    mock_stream.return_value = {
        "stream": io.BytesIO(_dummy_png()),
        "content_type": "image/png",
    }

    # 1. Upload client media
    upload_res = client.post(
        f"/api/client-medias/upload/{client_user.id}",
        files={"file": ("test.png", io.BytesIO(_dummy_png()), "image/png")},
        headers=headers,
    )
    assert upload_res.status_code == status.HTTP_200_OK
    data = upload_res.json()
    assert "id" in data
    media_id = data["id"]
    assert data["client_id"] == str(client_user.id)

    # 2. List client media
    list_res = client.get(f"/api/client-medias/client/{client_user.id}")
    assert list_res.status_code == status.HTTP_200_OK
    list_data = list_res.json()
    assert list_data["total"] == 1
    assert list_data["medias"][0]["id"] == media_id

    # 3. Stream client media
    file_res = client.get(f"/api/client-medias/file/{media_id}")
    assert file_res.status_code == status.HTTP_200_OK
    assert file_res.headers["content-type"] == "image/png"

    # 4. Delete client media
    del_res = client.delete(
        f"/api/client-medias/{media_id}",
        headers=headers,
    )
    assert del_res.status_code == status.HTTP_200_OK
    assert del_res.json()["deleted"] is True

    # 5. Verify deletion in list
    list_res_after = client.get(f"/api/client-medias/client/{client_user.id}")
    assert list_res_after.json()["total"] == 0
