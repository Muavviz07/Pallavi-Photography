from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )
    
    PROJECT_NAME: str = "Pallavi Photography Backend"
    API_V1_STR: str = "/api"
    
    DATABASE_URL: str
    TEST_DATABASE_URL: str
    
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    MINIO_ROOT_USER: str = "minioadmin"
    MINIO_ROOT_PASSWORD: str = "minioadminpassword"
    MINIO_ENDPOINT: str = "http://localhost:9000"
    MINIO_BUCKET_NAME: str = "pallavi-photography"

    # S3/Garage Configuration
    S3_ENDPOINT: str = "https://s3.pallaviphotography.com"
    S3_REGION: str = "garage"
    S3_BUCKET: str = "pallavi-storage"
    S3_ACCESS_KEY: str = ""
    S3_SECRET_KEY: str = ""
    S3_USE_SSL: bool = True
    S3_ADDRESS_STYLE: str = "path"

    # S3 Folder prefixes
    S3_SITE_MEDIA_PREFIX: str = "site-media"
    S3_CLIENT_GALLERIES_PREFIX: str = "client-galleries"

    # Presigned URL expiration (seconds)
    S3_PRESIGNED_URL_EXPIRATION: int = 3600
    
    RESEND_API_KEY: str | None = None
    
    NEXT_PUBLIC_API_URL: str
    NEXTAUTH_URL: str
    
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

settings = Settings()
