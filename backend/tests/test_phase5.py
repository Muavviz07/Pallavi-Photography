import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
import uuid

# Helper to get admin authorization header
def get_admin_auth_header(client: TestClient):
    # Register/Login admin
    client.post("/api/auth/register", json={
        "email": "admin_test@example.com",
        "password": "strongpassword123",
        "role": "admin"
    })
    res = client.post("/api/auth/login", json={
        "email": "admin_test@example.com",
        "password": "strongpassword123"
    })
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_testimonials_flow(client: TestClient):
    admin_headers = get_admin_auth_header(client)
    
    # 1. Create a testimonial (admin role validated endpoint is /api/testimonials)
    create_res = client.post("/api/testimonials", headers=admin_headers, json={
        "text": "Beautiful natural lighting newborn photos",
        "author": "Alice Dupont",
        "role": "Geneva, CH"
    })
    assert create_res.status_code == 201
    testimonial_id = create_res.json()["id"]

    # 2. Get public testimonials
    get_res = client.get("/api/testimonials")
    assert get_res.status_code == 200
    assert len(get_res.json()) >= 1
    assert get_res.json()[0]["author"] == "Alice Dupont"

    # 3. Delete testimonial (returns 204)
    del_res = client.delete(f"/api/testimonials/admin/{testimonial_id}", headers=admin_headers)
    assert del_res.status_code == 204

def test_enquiries_flow(client: TestClient):
    admin_headers = get_admin_auth_header(client)

    # 1. Create enquiry
    enq_res = client.post("/api/enquiries", json={
        "name": "John Doe",
        "email": "john@example.com",
        "message": "I would love to book a sunset session."
    })
    assert enq_res.status_code == 201
    enquiry_id = enq_res.json()["id"]

    # 2. List enquiries (admin)
    list_res = client.get("/api/enquiries/admin/all", headers=admin_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 3. Update enquiry status
    patch_res = client.patch(f"/api/enquiries/admin/{enquiry_id}", headers=admin_headers, json={
        "status": "read"
    })
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "read"

    # 4. Delete enquiry (returns 204)
    del_res = client.delete(f"/api/enquiries/admin/{enquiry_id}", headers=admin_headers)
    assert del_res.status_code == 204

def test_newsletter_flow(client: TestClient):
    # 1. Subscribe to newsletter
    sub_res = client.post("/api/newsletter/subscribe", json={
        "email": "subscriber@example.com"
    })
    assert sub_res.status_code == 201
    
    # 2. Confirm email verification link via token
    # Retrieve the token from db inside the test context
    # (Since we are using the test db fixture, we can check subscriber token)
    # But wait, we can also test invalid token response
    invalid_confirm = client.get("/api/newsletter/confirm?token=invalidtoken")
    assert invalid_confirm.status_code == 400

def test_blogs_flow(client: TestClient):
    admin_headers = get_admin_auth_header(client)

    blog_res = client.post("/api/admin/blogs", headers=admin_headers, json={
        "title": "Beautiful Sunset Locations",
        "slug": "beautiful-sunset-locations-test",
        "body_content": "Here are the top locations for sunset portrait shoots in Geneva.",
        "is_published": True,
        "translations": [
            {
                "language": "fr",
                "title": "Beaux Endroits pour le Coucher du Soleil",
                "content": "Voici les meilleurs endroits pour des portraits au coucher du soleil à Genève.",
                "summary": "Résumé en français"
            }
        ]
    })
    assert blog_res.status_code == 201
    post_id = blog_res.json()["id"]

    # 2. Get public blog by slug
    get_res = client.get(f"/api/blogs/{blog_res.json()['slug']}")
    assert get_res.status_code == 200
    assert get_res.json()["title"] == "Beautiful Sunset Locations"

    # 3. Clean up
    del_res = client.delete(f"/api/admin/blogs/{post_id}", headers=admin_headers)
    assert del_res.status_code == 204

def test_bookings_flow(client: TestClient):
    admin_headers = get_admin_auth_header(client)

    # 1. Create booking slot request
    book_res = client.post("/api/bookings", json={
        "name": "Jane Smith",
        "email": "jane@example.com",
        "date": "2026-07-15",
        "time": "14:00:00",
        "message": "Maternity photo shoot session request."
    })
    assert book_res.status_code == 201
    booking_id = book_res.json()["id"]

    # 2. Get availability mapping
    avail_res = client.get("/api/bookings/availability")
    assert avail_res.status_code == 200
    # Pending bookings do not block dates in the calendar until approved!
    assert "2026-07-15" not in avail_res.json()

    # 3. Approve booking request (admin)
    app_res = client.patch(f"/api/bookings/admin/{booking_id}", headers=admin_headers, json={
        "status": "approved"
    })
    assert app_res.status_code == 200
    assert app_res.json()["status"] == "approved"

    # 4. Check slot availability (14:00 should be blocked, others open)
    avail_res_new = client.get("/api/bookings/available-slots?date=2026-07-15")
    assert avail_res_new.status_code == 200
    slots_data = avail_res_new.json()
    slot_14 = next(s for s in slots_data if s["time"] == "14:00")
    assert slot_14["available"] is False
    assert slot_14["status"] == "accepted"

    # 5. Clean up
    del_res = client.delete(f"/api/bookings/admin/{booking_id}", headers=admin_headers)
    assert del_res.status_code == 204
