import pytest
from fastapi.testclient import TestClient
from app.models.user import UserRole
from tests.test_phase5 import get_admin_auth_header

def test_hero_sliders_flow(client: TestClient):
    admin_headers = get_admin_auth_header(client)

    # 1. Create a hero slide
    create_res = client.post("/api/hero-sliders", headers=admin_headers, json={
        "title": "Natural Born Storytelling",
        "image_url": "https://example.com/test-slide.jpg",
        "order": 10,
        "is_active": True
    })
    assert create_res.status_code == 201
    slide_id = create_res.json()["id"]

    # 2. Get active slides
    active_res = client.get("/api/hero-sliders")
    assert active_res.status_code == 200
    titles = [s["title"] for s in active_res.json()]
    assert "Natural Born Storytelling" in titles

    # 3. Update the slide
    patch_res = client.patch(f"/api/hero-sliders/{slide_id}", headers=admin_headers, json={
        "title": "Beautiful Maternity Stories"
    })
    assert patch_res.status_code == 200
    assert patch_res.json()["title"] == "Beautiful Maternity Stories"

    # 4. Get all slides (admin/client)
    all_res = client.get("/api/hero-sliders/all", headers=admin_headers)
    assert all_res.status_code == 200
    assert len(all_res.json()) >= 1

    # 5. Delete slide
    del_res = client.delete(f"/api/hero-sliders/{slide_id}", headers=admin_headers)
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
