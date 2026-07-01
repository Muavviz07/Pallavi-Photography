from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_admin_user
from app.models.contact_section import ContactSection
from app.models.user import User
from app.schemas.contact_section import ContactSectionUpdate, ContactSectionResponse

router = APIRouter(prefix="/contact", tags=["contact"])

# Public: get contact details
@router.get("", response_model=ContactSectionResponse)
def get_contact_section(db: Session = Depends(get_db)):
    contact = db.query(ContactSection).first()
    if not contact:
        # Create a default one if it doesn't exist
        contact = ContactSection(
            p1="Whether you’re looking to book a session, ask a question, or just say hello — I’d love to hear from you. Every story is unique, and I’m here to help you capture yours in the most beautiful way.",
            p1_fr="Que vous souhaitiez réserver une séance, poser une question ou simplement dire bonjour, j’aimerais beaucoup avoir de vos nouvelles. Chaque histoire est unique et je suis là pour vous aider à capturer la vôtre de la plus belle des manières.",
            p2="Have a date in mind? Drop a message with the type of shoot you’re interested in — portraits, events, lifestyle, or something personal — and we’ll make it happen.",
            p2_fr="Vous avez une date en tête ? Laissez un message avec le type de séance qui vous intéresse — portraits, événements, style de vie ou quelque chose de personnel — et nous ferons en sorte que cela se réalise."
        )
        db.add(contact)
        db.commit()
        db.refresh(contact)
    return contact

# Admin: update contact details
@router.put("", response_model=ContactSectionResponse)
def update_contact_section(
    contact_in: ContactSectionUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    contact = db.query(ContactSection).first()
    if not contact:
        contact = ContactSection(p1="", p2="")
        db.add(contact)
        db.commit()
        db.refresh(contact)
        
    for field, value in contact_in.dict(exclude_unset=True).items():
        setattr(contact, field, value)
        
    db.commit()
    db.refresh(contact)
    return contact
