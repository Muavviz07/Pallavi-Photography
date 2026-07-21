from fastapi import status

def test_register_user(client):
    response = client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "password123"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data
    assert "role" in data
    assert "password_hash" not in data

def test_register_duplicate_user(client):
    client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "password123"}
    )
    response = client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "password123"}
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "exists" in response.json()["detail"]

def test_login_user(client):
    client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "password123"}
    )
    response = client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "password123"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"

def test_login_incorrect_password(client):
    client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "password123"}
    )
    response = client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "wrongpassword"}
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Incorrect" in response.json()["detail"]

def test_get_me(client):
    client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "password123"}
    )
    login_resp = client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "password123"}
    )
    token = login_resp.json()["access_token"]
    
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["email"] == "test@example.com"

def test_get_me_unauthorized(client):
    response = client.get("/api/auth/me")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_refresh_token(client):
    client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "password123"}
    )
    login_resp = client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "password123"}
    )
    refresh_token = login_resp.json()["refresh_token"]
    
    response = client.post(
        "/api/auth/refresh-token",
        params={"refresh_token": refresh_token}
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
