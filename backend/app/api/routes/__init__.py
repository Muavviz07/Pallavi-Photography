from fastapi import APIRouter
from app.api.routes import auth, health, galleries, client_galleries, admin, blogs, bookings, enquiries, newsletter, testimonials, hero_slides, recognitions_awards, about, pricing, faqs, contact, media, admin_images

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(galleries.router, prefix="/galleries", tags=["galleries"])
api_router.include_router(client_galleries.router, prefix="/client-galleries", tags=["client-galleries"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(admin_images.router)
api_router.include_router(blogs.router, tags=["blogs"])
api_router.include_router(bookings.router, tags=["bookings"])
api_router.include_router(enquiries.router, tags=["enquiries"])
api_router.include_router(newsletter.router, tags=["newsletter"])
api_router.include_router(testimonials.router, tags=["testimonials"])
api_router.include_router(hero_slides.router, tags=["hero-slides"])
api_router.include_router(recognitions_awards.router, tags=["recognitions-and-awards"])
api_router.include_router(about.router, tags=["about"])
api_router.include_router(pricing.router, tags=["pricing"])
api_router.include_router(faqs.router, tags=["faqs"])
api_router.include_router(contact.router, tags=["contact"])
api_router.include_router(media.router, prefix="/media", tags=["media"])



