import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_admin_user
from app.models.about_section import AboutSection
from app.models.user import User
from app.schemas.about_section import AboutSectionUpdate, AboutSectionResponse

router = APIRouter(prefix="/about", tags=["about"])

# Public: get about section details
@router.get("", response_model=AboutSectionResponse)
def get_about_section(db: Session = Depends(get_db)):
    about = db.query(AboutSection).first()
    if not about:
        # Create default record if empty
        about = AboutSection(
            title="About Me",
            quote="Take in every little moment as they would not stay the same forever. Time flies....",
            bio_text="I believe that photography is a gentle art. It is about documenting real, unscripted love, natural connections, and quiet moments. Based in Switzerland, I specialize in fine art newborn setups, maternity storytelling, and outdoor family collections using soft textures and natural illumination.",
            awards_text="Recognitions & Awards details"
        )
        db.add(about)
        db.commit()
        db.refresh(about)
    return about

# Admin only: update about section details
@router.patch("", response_model=AboutSectionResponse)
def update_about_section(
    about_in: AboutSectionUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    about = db.query(AboutSection).first()
    if not about:
        about = AboutSection()
        db.add(about)
        
    for field, value in about_in.dict(exclude_unset=True).items():
        setattr(about, field, value)
        
    db.commit()
    db.refresh(about)
    return about
