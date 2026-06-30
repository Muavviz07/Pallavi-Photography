from sqlalchemy.orm import Session
from app.db.database import SessionLocal, Base, engine
from app.models.user import User, UserRole, UserStatus
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
            
    except Exception as e:
        print(f"Seeding failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
