from sqlalchemy.orm import Session
from app.db.database import SessionLocal, Base, engine
from app.models.user import User, UserRole, UserStatus
from app.models.hero_slide import HeroSlide
from app.models.about_section import AboutSection
from app.models.pricing_section import PricingSection
import json
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
        print("Cleaning existing hero slides...")
        db.query(HeroSlide).delete()
        print("Seeding default hero slides...")
        slides = [
            HeroSlide(
                title="New Beginnings",
                image_url="https://images.unsplash.com/photo-1583086762675-5a88bcc72548?w=1600&auto=format&fit=crop&q=80",
                order=1,
                is_active=True
            ),
            HeroSlide(
                title="Timeless Childhood",
                image_url="https://images.unsplash.com/photo-1624029769501-5a6cfec0d9e0?w=1600&auto=format&fit=crop&q=80",
                order=2,
                is_active=True
            ),
            HeroSlide(
                title="Family Connections",
                image_url="https://plus.unsplash.com/premium_photo-1671114205636-b64b9ec631ee?w=1600&auto=format&fit=crop&q=80",
                order=3,
                is_active=True
            ),
            HeroSlide(
                title="Maternity Grace",
                image_url="https://images.unsplash.com/photo-1615766553246-9147b6d50e90?w=1600&auto=format&fit=crop&q=80",
                order=4,
                is_active=True
            ),
            HeroSlide(
                title="Fine Art Portraits",
                image_url="https://images.unsplash.com/photo-1637511844674-d2c52d5f29b5?w=1600&auto=format&fit=crop&q=80",
                order=5,
                is_active=True
            ),
            HeroSlide(
                title="Nature Scenery",
                image_url="https://images.unsplash.com/photo-1698758966922-857c726739d5?w=1600&auto=format&fit=crop&q=80",
                order=6,
                is_active=True
            ),
            HeroSlide(
                title="Newborn Details",
                image_url="https://images.unsplash.com/photo-1583086762675-5a88bcc72548?w=1600&auto=format&fit=crop&q=80",
                order=7,
                is_active=True
            ),
            HeroSlide(
                title="Milestone Moments",
                image_url="https://images.unsplash.com/photo-1624029769501-5a6cfec0d9e0?w=1600&auto=format&fit=crop&q=80",
                order=8,
                is_active=True
            ),
            HeroSlide(
                title="Maternity Elegance",
                image_url="https://images.unsplash.com/photo-1615766553246-9147b6d50e90?w=1600&auto=format&fit=crop&q=80",
                order=9,
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
            
        # Seed Pricing Sections
        print("Checking pricing sections...")
        # Seed Pricing Sections
        print("Cleaning and seeding pricing sections...")
        db.query(PricingSection).delete()
        
        pricing_data = [
            {
                "category": "newborn",
                "title": "NEWBORN PHOTOGRAPHY IN VEVEY, LAUSANNE & VAUD",
                "subtitle": "Newborn Session",
                "description": "If you’re looking for a professional newborn photographer in Vevey or Lausanne, I recommend booking your session during pregnancy to ensure availability.",
                "intro_text": "The ideal time for a newborn photoshoot is within the first 14 days after birth. During this precious stage, babies are naturally sleepy and curled up, allowing for gentle posing and beautifully timeless portraits. At Pallavi Photography, each newborn photography session in Vevey is designed with your baby’s safety, comfort, and well-being as the highest priority.\n\nSessions are calm, baby- led, and unhurried—creating a relaxed experience for both parents and newborns. I welcome families from Lausanne, Vevey, and across the Vaud region, offering a warm and personalized photography experience tailored to your family. A curated collection of handcrafted props, wraps, and outfits is available in soft, elegant tones. Every setup is thoughtfully styled to create artistic, natural-looking newborn portraits you will treasure for years to come.\n\nOn this page, you’ll find detailed pricing information, including the different packages, products, and services I offer—so you can choose what package suits your needs.",
                "notes_text": "Note: Travel fee applies for location beyond 2 km\n\nA CHF 100 non-refundable deposit (session fee) is required to secure your date and session The remaining balance is due on the day of the session\nAdditional digital photos can be purchased from the gallery at: 1 photo CHF 30, 3 photos CHF 75, 5 photos CHF 120\nFamily session info: due to space limitations, a maximum of 4–5 people can be accommodated indoors. Larger groups can be photographed outdoors.\nGift vouchers are also available to purchase",
                "plans_json": json.dumps([
                    {
                        "name": "Petite Collection",
                        "price": "CHF 450",
                        "features": [
                            "1–2 hours session, baby, parent and sibling poses included",
                            "Colour palette can be selected for the session",
                            "Use of curated props and baby outfits",
                            "Password-protected online gallery for image selection",
                            "10 high-resolution (professionally edited) digital images to download",
                            "5 passe-partouts with 13 × 18 cm prints, mounted in 20 × 25 cm mats",
                            "20 credit to use towards wall art, canvases, bigger mat, acrylic prints, or a future session"
                        ],
                        "button_type": "solid"
                    },
                    {
                        "name": "Classic Collection",
                        "price": "CHF 650",
                        "features": [
                            "2–4 hours session, baby, parent and sibling poses included",
                            "Colour palette can be selected for the session",
                            "Use of curated props and baby outfits",
                            "Password-protected online gallery for image selection",
                            "15 high-resolution (professionally edited) digital images to download",
                            "All 15 prints (13 × 18 cm) in a premium keepsake box with acrylic display lid",
                            "50 credit to use towards wall art, canvases, bigger mat, acrylic prints, or a future session"
                        ],
                        "button_type": "solid"
                    },
                    {
                        "name": "Luxe Story Collection",
                        "price": "CHF 850",
                        "features": [
                            "2–4 hours session, baby, parent and sibling poses included",
                            "Colour palette can be selected for the session",
                            "Use of curated props and baby outfits",
                            "Password-protected online gallery for image selection",
                            "20 high-resolution (professionally edited) digital images to download",
                            "All 20 prints (13 × 18 cm) in a premium keepsake box with acrylic display lid",
                            "Beautifully designed 20-page mini photo book",
                            "50 credit to use towards wall art, canvases, bigger mat, acrylic prints, or a future session"
                        ],
                        "button_type": "solid"
                    }
                ])
            },
            {
                "category": "children",
                "title": "CHILDREN PHOTOGRAPHY IN VEVEY, LAUSANNE & VAUD",
                "subtitle": "Children Session",
                "description": "I would love to be part of your child’s journey—documenting these milestones and creating a timeless collection of memories you will treasure for years to come.",
                "intro_text": "After the newborn stage, your child grows and changes faster than ever—those first steps, cheeky smiles, curious eyes, and beautiful bursts of personality. While newborn portraits capture the very beginning, children’s photoshoots from 1 year and up are just as meaningful. These sessions celebrate your child’s growth, individuality, and the joy of these early years. Each stage brings new expressions, emotions, and milestones worth preserving.\n\nPhotographing toddlers and young children is wonderfully dynamic. With their playful energy, curiosity, and ever-changing moods, every session is unique. With a patient, relaxed, and child-led approach, I create a comfortable space where your little one can simply be themselves.\n\nThis allows me to capture natural, genuine moments—from joyful laughter to quiet, in- between expressions that truly reflect their personality. I welcome families from Vevey, Lausanne, and across the Vaud region, offering a warm and personalized photography experience tailored to your child.\n\nOn this page, you’ll also find detailed pricing information about the packages, products, and services I offer, helping you choose what best suits your family.",
                "notes_text": "Note: Travel fee applies for location beyond 2 km\n\nA CHF 100 non-refundable deposit (session fee) is required to secure your date and session The remaining balance is due on the day of the session\nAdditional digital photos can be purchased from the gallery at: 1 photo CHF 30, 3 photos CHF 75, 5 photos CHF 120\nFamily session info: due to space limitations, a maximum of 4–5 people can be accommodated indoors. Larger groups can be photographed outdoors.\nGift vouchers are also available to purchase",
                "plans_json": json.dumps([
                    {
                        "name": "Petite Collection",
                        "price": "CHF 450",
                        "features": [
                            "1 hour session, available indoors or outdoors",
                            "Password-protected online gallery for image selection",
                            "10 high-resolution (professionally edited) digital images to download",
                            "5 passe-partouts with 13 × 18 cm photos, mounted in 20 × 25 cm mats",
                            "20 credit to use towards wall art, canvases, bigger mat, acrylic prints, or a future session"
                        ],
                        "button_type": "solid"
                    },
                    {
                        "name": "Classic Collection",
                        "price": "CHF 650",
                        "features": [
                            "2–3 hours session, available indoors or outdoors",
                            "Password-protected online gallery for image selection",
                            "15 high-resolution (professionally edited) digital images to download",
                            "All 15 prints (13 × 18 cm) in a premium keepsake box with acrylic display lid",
                            "50 credit to use towards wall art, canvases, bigger mat, acrylic prints, or a future session"
                        ],
                        "button_type": "solid"
                    },
                    {
                        "name": "Luxe Story Collection",
                        "price": "CHF 850",
                        "features": [
                            "2–4 hours session, available indoors or outdoors",
                            "Password-protected online gallery for image selection",
                            "20 high-resolution (professionally edited) digital images to download",
                            "All 20 prints (13 × 18 cm) in a premium keepsake box with acrylic display lid",
                            "Beautifully designed 20-page mini photo book",
                            "50 credit to use towards wall art, canvases, bigger mat, acrylic prints, or a future session"
                        ],
                        "button_type": "solid"
                    }
                ])
            },
            {
                "category": "family",
                "title": "FAMILY PHOTOGRAPHY IN VEVEY, LAUSANNE & VAUD",
                "subtitle": "Family Session",
                "description": "On this page, you’ll also find detailed pricing information for family sessions, products, and packages—so you can select the option that best suits your family.",
                "intro_text": "Celebrate and preserve your family’s most precious moments with beautiful, timeless family portraits. Sessions can take place in the comfort of your home or at a local outdoor location, providing the perfect backdrop to capture your family’s genuine connection and personality.\n\nFamily sessions are ideal for milestone birthdays, sibling portraits, or simply documenting everyday moments that you will treasure for years to come. Outdoor sessions are especially stunning during spring and autumn, when the natural light and vibrant surroundings create a warm, memorable atmosphere.\n\nThis session is designed specifically for families and siblings and is not suitable for newborn photography—for newborn sessions, please visit the dedicated newborn page. Families from Vevey, Lausanne, Morges and the surrounding Vaud region are warmly welcome to book a personalized session tailored to their unique story.",
                "notes_text": "Note: Travel fee applies for location beyond 2 km\n\nA CHF 100 non-refundable deposit (session fee) is required to secure your date and session The remaining balance is due on the day of the session\nAdditional digital photos can be purchased from the gallery at: 1 photo CHF 30, 3 photos CHF 75, 5 photos CHF 120\nFamily session info: due to space limitations, a maximum of 4–5 people can be accommodated indoors. Larger groups can be photographed outdoors.\nGift vouchers are also available to purchase",
                "plans_json": json.dumps([
                    {
                        "name": "Petite Collection",
                        "price": "CHF 450",
                        "features": [
                            "1 hour session, available indoors or outdoors",
                            "Password-protected online gallery for image selection",
                            "10 high-resolution (professionally edited) digital images to download",
                            "5 passe-partouts with 13 × 18 cm photos, mounted in 20 × 25 cm mats",
                            "20 credit to use towards wall art, canvases, bigger mat, acrylic prints, or a future session"
                        ],
                        "button_type": "solid"
                    },
                    {
                        "name": "Classic Collection",
                        "price": "CHF 650",
                        "features": [
                            "2–3 hours session, available indoors or outdoors",
                            "Password-protected online gallery for image selection",
                            "15 high-resolution (professionally edited) digital images to download",
                            "All 15 prints (13 × 18 cm) in a premium keepsake box with acrylic display lid",
                            "50 credit to use towards wall art, canvases, bigger mat, acrylic prints, or a future session"
                        ],
                        "button_type": "solid"
                    },
                    {
                        "name": "Luxe Story Collection",
                        "price": "CHF 850",
                        "features": [
                            "2–4 hours session, available indoors or outdoors",
                            "Password-protected online gallery for image selection",
                            "20 high-resolution (professionally edited) digital images to download",
                            "All 20 prints (13 × 18 cm) in a premium keepsake box with acrylic display lid",
                            "Beautifully designed 20-page mini photo book",
                            "50 credit to use towards wall art, canvases, bigger mat, acrylic prints, or a future session"
                        ],
                        "button_type": "solid"
                    }
                ])
            },
            {
                "category": "maternity",
                "title": "MATERNITY PHOTOGRAPHY IN VEVEY, LAUSANNE & VAUD",
                "subtitle": "Maternity Session",
                "description": "On this page, you’ll also find detailed pricing information for maternity sessions, products, and packages—so you can choose what best suits your family.",
                "intro_text": "Ideally scheduled between 32 and 37 weeks, a maternity photoshoot is a beautiful way to celebrate your pregnancy and capture this once-in-a-lifetime journey. Sessions can be held solo, with your partner, or including your children, creating heartfelt and personal portraits that reflect your growing family.\n\nA variety of wardrobe options are available to help you feel comfortable, confident, and radiant, ensuring each image is uniquely styled and timeless. Outdoor sessions in scenic locations around Vevey, Lausanne, Morges and the Vaud region provide natural light and beautiful backdrops, while indoor studio sessions offer a cozy, intimate atmosphere.\n\nFor families looking to document the full journey, we also offer a combined maternity and newborn photography package, making it easy to capture both stages with a cohesive and beautiful collection of images.",
                "notes_text": "Note: Travel fee applies for location beyond 2 km\n\nA CHF 100 non-refundable deposit (session fee) is required to secure your date and session (if only a maternity session is booked) The remaining balance is due on the day of the session\nAdditional digital photos can be purchased from the gallery at: 1 photo CHF 30, 3 photos CHF 75, 5 photos CHF 120\nFamily session info: due to space limitations, a maximum of 4–5 people can be accommodated indoors. Larger groups can be photographed outdoors.\nGift vouchers are also available to purchase",
                "plans_json": json.dumps([
                    {
                        "name": "Petite Collection",
                        "price": "CHF 450",
                        "features": [
                            "1 hour session, available indoors or outdoors",
                            "Password-protected online gallery for image selection",
                            "10 high-resolution (professionally edited) digital images to download",
                            "5 passe-partouts with 13 × 18 cm photos, mounted in 20 × 25 cm mats",
                            "20 credit to use towards wall art, canvases, bigger mat, acrylic prints, or a future session"
                        ],
                        "button_type": "solid"
                    },
                    {
                        "name": "Classic Collection",
                        "price": "CHF 650",
                        "features": [
                            "2–3 hours session, available indoors or outdoors",
                            "Password-protected online gallery for image selection",
                            "15 high-resolution (professionally edited) digital images to download",
                            "All 15 prints (13 × 18 cm) in a premium keepsake box with acrylic display lid",
                            "50 credit to use towards wall art, canvases, bigger mat, acrylic prints, or a future session"
                        ],
                        "button_type": "solid"
                    },
                    {
                        "name": "Luxe Story Collection",
                        "price": "CHF 850",
                        "features": [
                            "2–4 hours session, available indoors or outdoors",
                            "Password-protected online gallery for image selection",
                            "20 high-resolution (professionally edited) digital images to download",
                            "All 20 prints (13 × 18 cm) in a premium keepsake box with acrylic display lid",
                            "Beautifully designed 20-page mini photo book",
                            "50 credit to use towards wall art, canvases, bigger mat, acrylic prints, or a future session"
                        ],
                        "button_type": "solid"
                    },
                    {
                        "name": "Petite maternity and newborn collection",
                        "price": "CHF 550",
                        "features": [
                            "Up to 1.5 hours per session",
                            "Password-protected online gallery for image selection",
                            "15 high-resolution (professionally edited) digital images to download with matching prints (13 × 18 cm)",
                            "250 booking fee (deducted from total)",
                            "20 credit to use towards wall art, canvases, bigger mat, acrylic prints"
                        ],
                        "button_type": "solid"
                    },
                    {
                        "name": "Classic maternity and newborn collection",
                        "price": "CHF 750",
                        "features": [
                            "Up to 2–2.5 hours per session",
                            "Password-protected online gallery for image selection",
                            "20 high-resolution (professionally edited) digital images to download",
                            "All 20 prints (13 × 18 cm) presented in a premium keepsake box with acrylic display lid",
                            "250 booking fee (deducted from total)",
                            "50 credit to use towards wall art, canvases, bigger mat, acrylic prints"
                        ],
                        "button_type": "solid"
                    }
                ])
            },
            {
                "category": "fine-art",
                "title": "FINE ART PORTRAITS IN VEVEY, LAUSANNE & VAUD",
                "subtitle": "Fine Art Session",
                "description": "",
                "intro_text": "Fine Art Portraits offer a highly conceptual and expressive approach to portrait photography, where each session is thoughtfully designed to capture mood, styling, and artistic vision. Using advanced editing and retouching techniques, every portrait is crafted to achieve a timeless, painterly aesthetic that transforms your images into true works of art. Every session is a collaborative creative process, allowing your intention, emotion, and personality to guide the final artwork. Because of the extensive planning, styling, and detailed post-production involved, only a limited number of Fine Art sessions are offered each year, ensuring each portrait receives the attention it deserves.\n\nFine Art packages include professionally matted, museum-quality prints, created to last and displayed as exceptional pieces of art that celebrate your story and individuality. Families, couples, and individuals from Vevey, Lausanne, and across the Vaud region are welcome to book a Fine Art Portrait session.",
                "notes_text": "",
                "plans_json": "[]"
            },
            {
                "category": "nature",
                "title": "Nature Photostock Collection",
                "subtitle": "Nature Licensing",
                "description": "",
                "intro_text": "I offer my photographs from the gallery for personal and commercial use. High resolution image files will be delivered in digital format to the client upon purchase. Price may vary based on the usage requested. Please contact me for a quotation.\n\nAs a creator of these photographs, I hold the copyrights to all of my work. Any form of reproduction, unauthorized use, copying or saving digital photo files, manipulation of image is not permitted.",
                "notes_text": "",
                "plans_json": "[]"
            }
        ]
        
        for item in pricing_data:
            p_sec = PricingSection(
                category=item["category"],
                title=item["title"],
                subtitle=item["subtitle"],
                description=item["description"],
                intro_text=item["intro_text"],
                notes_text=item["notes_text"],
                plans_json=item["plans_json"]
            )
            db.add(p_sec)
        db.commit()
        print("Pricing sections seeded successfully!")
            
    except Exception as e:
        print(f"Seeding failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
