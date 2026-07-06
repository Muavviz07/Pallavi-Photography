"""
Local file storage service for image uploads.
Saves images to ./static/media/ directory.
When S3 is ready, just replace upload_image() method - no other changes needed.
"""

import os
import uuid
from pathlib import Path
from typing import Optional
import shutil

class ImageService:
    """
    Handle image uploads to local disk storage.
    
    Images are saved with UUID-based filenames to ensure uniqueness.
    File structure:
        static/media/
        ├── a1b2c3d4-e5f6-47a8-b9c0-d1e2f3a4b5c6.jpeg
        ├── b5c6d7e8-f9a0-11b2-c3d4-e5f6a7b8c9d0.png
        └── ... more images
    """
    
    def __init__(self):
        """Initialize and create storage directory."""
        self.storage_dir = Path("static/media")
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        print(f"[ImageService] Storage initialized at: {self.storage_dir.absolute()}")
    
    async def upload_image(self, file) -> dict:
        """
        Save uploaded image to disk and return metadata.
        
        Args:
            file: UploadFile object from FastAPI
        
        Returns:
            Dictionary with:
            {
                "filename": "a1b2c3d4-e5f6-47a8.jpeg",
                "file_url": "/static/media/a1b2c3d4-e5f6-47a8.jpeg",
                "file_size": 12345,
                "mime_type": "image/jpeg"
            }
        
        Raises:
            ValueError: If file is invalid
        """
        try:
            content = await file.read()
            if not content:
                raise ValueError("File is empty")
            if file.filename and "." in file.filename:
                file_ext = file.filename.split(".")[-1].lower()
                # Normalize jpeg → jpg
                if file_ext == "jpeg":
                    file_ext = "jpg"
            else:
                file_ext = "jpg"
            unique_filename = f"{uuid.uuid4()}.{file_ext}"
            file_path = self.storage_dir / unique_filename
            with open(file_path, "wb") as f:
                f.write(content)
            if not file_path.exists():
                raise ValueError("File failed to save to disk")
            file_url = f"/static/media/{unique_filename}"
            return {
                "filename": unique_filename,
                "file_url": file_url,
                "file_size": len(content),
                "mime_type": file.content_type or "image/jpeg"
            }
        except Exception as e:
            raise ValueError(f"Upload failed: {str(e)}")
            
    def delete_image(self, filename: str) -> bool:
        """
        Delete file from disk.
        
        Returns:
            True if deleted, False if file didn't exist
        """
        try:
            file_path = self.storage_dir / filename
            if not file_path.exists():
                print(f"[ImageService] File not found: {filename}")
                return False
            file_path.unlink()
            print(f"[ImageService] Deleted: {filename}")
            return True
        except Exception as e:
            print(f"[ImageService] Error deleting {filename}: {e}")
            return False
    
    def file_exists(self, filename: str) -> bool:
        """Check if image file exists on disk."""
        return (self.storage_dir / filename).exists()
    
    def get_file_size(self, filename: str) -> Optional[int]:
        """Get file size in bytes."""
        file_path = self.storage_dir / filename
        if file_path.exists():
            return file_path.stat().st_size
        return None

# Create global instance - will be imported by other modules
image_service = ImageService()
