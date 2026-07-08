import pytest
from fastapi.testclient import TestClient
from app.models.user import UserRole
from tests.test_phase5 import get_admin_auth_header

def test_hero_sliders_flow(client: TestClient):
    admin_headers = get_admin_auth_header(client)

    # Upload media first to get UUID
    import io
    from PIL import Image as PILImage
    img_byte_arr = io.BytesIO()
    img = PILImage.new("RGB", (10, 10), color="black")
    img.save(img_byte_arr, format="PNG")
    dummy_png = img_byte_arr.getvalue()
    
    media_resp = client.post(
        "/api/media",
        files={"file": ("test.png", io.BytesIO(dummy_png), "image/png")},
        headers=admin_headers
    )
    media_id = media_resp.json()["id"]

    # 1. Create a hero slide
    create_res = client.post("/api/admin/hero-slides", headers=admin_headers, json={
        "title": "Natural Born Storytelling",
        "subtitle": "Capturing gentle moments",
        "image_media_id": media_id,
        "order_position": 10,
        "is_active": True
    })
    assert create_res.status_code == 201
    slide_id = create_res.json()["id"]

    # 2. Get active slides
    active_res = client.get("/api/hero-slides")
    assert active_res.status_code == 200
    titles = [s["title"] for s in active_res.json()]
    assert "Natural Born Storytelling" in titles

    # 3. Update the slide
    patch_res = client.put(f"/api/admin/hero-slides/{slide_id}", headers=admin_headers, json={
        "title": "Beautiful Maternity Stories",
        "subtitle": "Capturing gentle moments",
        "image_media_id": media_id,
        "order_position": 10,
        "is_active": True
    })
    assert patch_res.status_code == 200
    assert patch_res.json()["title"] == "Beautiful Maternity Stories"

    # 4. Get all slides (admin)
    all_res = client.get("/api/admin/hero-slides", headers=admin_headers)
    assert all_res.status_code == 200
    assert len(all_res.json()) >= 1

    # 5. Delete slide
    del_res = client.delete(f"/api/admin/hero-slides/{slide_id}", headers=admin_headers)
    assert del_res.status_code == 204

def test_about_flow(client: TestClient):
    admin_headers = get_admin_auth_header(client)

    # 1. Get about details
    get_res = client.get("/api/about")
    assert get_res.status_code == 200
    assert get_res.json()["title"] == "About Me"

    # 2. Update about details
    patch_res = client.patch("/api/about", headers=admin_headers, json={
        "quote": "Time flies fast. Document the moments.",
        "bio_text": "I specialize in fine art newborn setups in Switzerland."
    })
    assert patch_res.status_code == 200
    assert patch_res.json()["quote"] == "Time flies fast. Document the moments."
