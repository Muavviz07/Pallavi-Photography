import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.api.dependencies import get_db
from app.models.recognition_award import RecognitionAward
from app.schemas.recognition_award import RecognitionAwardResponse

router = APIRouter(prefix="/recognitions-and-awards", tags=["recognitions-and-awards"])

@router.get("", response_model=List[RecognitionAwardResponse])
def get_active_awards(db: Session = Depends(get_db)):
    """
    Get all active recognitions and awards sorted by order_position.
    """
    return db.query(RecognitionAward).filter(
        RecognitionAward.is_active == True
    ).order_by(RecognitionAward.order_position.asc()).all()
