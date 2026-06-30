from sqlalchemy.orm import Session
from app.db.database import SessionLocal, Base, engine
from app.models.user import User, UserRole, UserStatus
from app.models.hero_slide import HeroSlide
from app.models.about_section import AboutSection
from app.core import security

def seed_db():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if any admin exists
        admin_email = "admin@pallaviphotography.com"
        admin = db.query(User).filter(User.email == admin_email).first()
        
        if not admin:
            print(f"Creating default admin user: {admin_email} ...")
            hashed_password = security.get_password_hash("adminpassword123")
            admin_user = User(
                email=admin_email,
                password_hash=hashed_password,
                role=UserRole.ADMIN.value,
                status=UserStatus.ACTIVE.value
            )
            db.add(admin_user)
            db.commit()
            print("Admin user seeded successfully!")
        else:
            print(f"Admin user '{admin_email}' already exists.")
            
        # Check if any client exists
        client_email = "client@example.com"
        client = db.query(User).filter(User.email == client_email).first()
        
        if not client:
            print(f"Creating default client user: {client_email} ...")
            hashed_password = security.get_password_hash("clientpassword123")
            client_user = User(
                email=client_email,
                password_hash=hashed_password,
                role=UserRole.CLIENT.value,
                status=UserStatus.ACTIVE.value
            )
            db.add(client_user)
            db.commit()
            print("Client user seeded successfully!")
        else:
            print(f"Client user '{client_email}' already exists.")
            
        # Seed Hero Slides
        if db.query(HeroSlide).count() == 0:
            print("Seeding default hero slides...")
            slides = [
                HeroSlide(
                    title="New Beginnings",
                    image_url="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=1920",
                    order=1,
                    is_active=True
                ),
                HeroSlide(
                    title="Timeless Childhood",
                    image_url="https://images.unsplash.com/photo-1476703719129-8eb99415f6e8?auto=format&fit=crop&q=80&w=1920",
                    order=2,
                    is_active=True
                ),
                HeroSlide(
                    title="Maternity Grace",
                    image_url="https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=1920",
                    order=3,
                    is_active=True
                )
            ]
            db.bulk_save_objects(slides)
            db.commit()
            print("Hero slides seeded successfully!")
            
        # Seed About Section
        if db.query(AboutSection).count() == 0:
            print("Seeding default about section details...")
            about = AboutSection(
                title="About Me",
                quote="Take in every little moment as they would not stay the same forever. Time flies....",
                bio_text="I believe that photography is a gentle art. It is about documenting real, unscripted love, natural connections, and quiet moments. Based in Switzerland, I specialize in fine art newborn setups, maternity storytelling, and outdoor family collections using soft textures and natural illumination.",
                awards_text="Recognitions & Awards details"
            )
            db.add(about)
            db.commit()
            print("About section seeded successfully!")
            
    except Exception as e:
        print(f"Seeding failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
