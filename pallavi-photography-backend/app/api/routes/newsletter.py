import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import List

from app.api.dependencies import get_db, get_current_admin_user
from app.models.newsletter import NewsletterSubscriber, SubscriberStatus
from app.models.user import User
from app.schemas.newsletter import NewsletterSubscriberCreate, NewsletterSubscriberResponse
from app.services.email_service import email_service
from app.core.config import settings

router = APIRouter(prefix="/newsletter", tags=["newsletter"])

# Public route to subscribe (initiates double-opt-in confirmation email)
@router.post("/subscribe", response_model=NewsletterSubscriberResponse, status_code=status.HTTP_201_CREATED)
def subscribe(subscriber_in: NewsletterSubscriberCreate, db: Session = Depends(get_db)):
    # Check if subscriber already exists
    existing = db.query(NewsletterSubscriber).filter(NewsletterSubscriber.email == subscriber_in.email).first()
    if existing:
        if existing.status == SubscriberStatus.ACTIVE.value:
            raise HTTPException(status_code=400, detail="Email is already subscribed")
        # Reactivate subscription / resend confirmation
        existing.status = SubscriberStatus.PENDING.value
        existing.token = str(uuid.uuid4())
        db.commit()
        db.refresh(existing)
        db_subscriber = existing
    else:
        db_subscriber = NewsletterSubscriber(
            email=subscriber_in.email,
            status=SubscriberStatus.PENDING.value,
            token=str(uuid.uuid4())
        )
        db.add(db_subscriber)
        db.commit()
        db.refresh(db_subscriber)

    # Opt-in link pointing to backend confirmation route
    opt_in_link = f"{settings.NEXT_PUBLIC_API_URL}{settings.API_V1_STR}/newsletter/confirm?token={db_subscriber.token}"
    email_service.send_newsletter_opt_in_email(db_subscriber.email, opt_in_link)

    return db_subscriber

# Public double-opt-in confirmation link
@router.get("/confirm")
def confirm_subscription(token: str = Query(...), db: Session = Depends(get_db)):
    subscriber = db.query(NewsletterSubscriber).filter(NewsletterSubscriber.token == token).first()
    if not subscriber:
        raise HTTPException(status_code=400, detail="Invalid token")

    subscriber.status = SubscriberStatus.ACTIVE.value
    subscriber.subscribed_at = datetime.utcnow()
    # Refresh token to prevent re-use
    subscriber.token = str(uuid.uuid4())
    db.commit()

    # Redirect client back to frontend home page or success query parameter page
    return RedirectResponse(url=f"{settings.NEXTAUTH_URL}?newsletter=confirmed")

# Public unsubscribe link
@router.get("/unsubscribe")
def unsubscribe(email: str = Query(...), token: str = Query(...), db: Session = Depends(get_db)):
    subscriber = db.query(NewsletterSubscriber).filter(
        NewsletterSubscriber.email == email,
        NewsletterSubscriber.token == token
    ).first()
    
    if not subscriber:
        raise HTTPException(status_code=400, detail="Invalid request parameters")

    subscriber.status = SubscriberStatus.UNSUBSCRIBED.value
    db.commit()

    return RedirectResponse(url=f"{settings.NEXTAUTH_URL}?newsletter=unsubscribed")

# Admin list all subscribers
@router.get("/admin/all", response_model=List[NewsletterSubscriberResponse])
def admin_list_subscribers(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    return db.query(NewsletterSubscriber).all()

# Admin send broadcast newsletter email to all active subscribers
@router.post("/admin/broadcast", status_code=status.HTTP_200_OK)
def admin_broadcast_newsletter(
    subject: str = Query(...),
    title: str = Query(...),
    content: str = Query(...),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    active_subscribers = db.query(NewsletterSubscriber).filter(
        NewsletterSubscriber.status == SubscriberStatus.ACTIVE.value
    ).all()

    success_count = 0
    for sub in active_subscribers:
        unsubscribe_link = f"{settings.NEXT_PUBLIC_API_URL}{settings.API_V1_STR}/newsletter/unsubscribe?email={sub.email}&token={sub.token}"
        sent = email_service.send_newsletter_broadcast_email(
            subscriber_email=sub.email,
            subject=subject,
            title=title,
            content=content,
            unsubscribe_link=unsubscribe_link
        )
        if sent:
            success_count += 1

    return {"msg": f"Broadcast complete. Successfully sent to {success_count} of {len(active_subscribers)} active subscribers."}
