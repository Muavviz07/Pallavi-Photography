# Pallavi Photography Portfolio & Management Platform

A high-performance, premium web application built for **Pallavi Photography**. This platform comprises a modern Next.js frontend, a robust FastAPI backend, a PostgreSQL database, and MinIO object storage for media assets.

---

## 🏗️ Project Architecture

- **Frontend**: Next.js 16 (React 19, TypeScript, Tailwind CSS v4, NextAuth.js v5)
- **Backend**: FastAPI (Python 3.10+, SQLAlchemy, Uvicorn)
- **Database**: PostgreSQL 15 (Docker)
- **Storage**: MinIO S3-compatible Object Storage (Docker)

---

## 🛠️ Prerequisites

Ensure you have the following installed on your local machine:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js (v18 or higher)](https://nodejs.org/)
- [Python (v3.10 or higher)](https://www.python.org/)

---

## 🚀 Getting Started

Follow these steps to set up and run the entire application locally.

### Step 1: Start the Infrastructure Services (Docker)

Spin up the local PostgreSQL database and MinIO storage container using Docker Compose:

```bash
docker-compose up -d
```

This will launch:
*   **PostgreSQL** on port `5433` (mapped from container's internal `5432`).
*   **MinIO Console** on port `9001` (API on port `9000`).
*   An auto-provisioning service to create the public bucket `pallavi-photography`.

---

### Step 2: Set Up the Backend (FastAPI)

1.  Navigate to the backend directory:
    ```bash
    cd pallavi-photography-backend
    ```

2.  Create and activate a Python virtual environment:
    *   **Windows (PowerShell):**
        ```powershell
        python -m venv venv
        .\venv\Scripts\Activate.ps1
        ```
    *   **macOS / Linux:**
        ```bash
        python3 -m venv venv
        source venv/bin/activate
        ```

3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

4.  Seed and initialize the database (creates tables & inserts mock data):
    ```bash
    python seed.py
    ```

5.  Run the backend server:
    ```bash
    python main.py
    ```
    The API will be available at [http://127.0.0.1:8000](http://127.0.0.1:8000). You can access interactive documentation (Swagger UI) at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

---

### Step 3: Set Up the Frontend (Next.js)

1.  Open a new terminal session and navigate to the frontend directory:
    ```bash
    cd pallavi-photography-frontend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run the development server:
    ```bash
    npm run dev
    ```
    The user interface will be accessible at [http://localhost:3000](http://localhost:3000).

---

## 🔑 Default Accounts (Seeded Data)

The `seed.py` script populates the database with default accounts for development use:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@pallaviphotography.com` | `adminpassword123` |
| **Client** | `client@example.com` | `clientpassword123` |

---

## 📡 Local Endpoints Reference

| Service | Endpoint | Description |
| :--- | :--- | :--- |
| **Frontend App** | [http://localhost:3000](http://localhost:3000) | Next.js Client Application |
| **Backend API** | [http://localhost:8000](http://localhost:8000) | FastAPI Swagger UI Docs at `/docs` |
| **PostgreSQL** | `localhost:5433` | Database (User: `postgres` / Pass: `postgrespassword`) |
| **MinIO Console** | [http://localhost:9001](http://localhost:9001) | Object Storage Web UI (User: `minioadmin` / Pass: `minioadminpassword`) |
