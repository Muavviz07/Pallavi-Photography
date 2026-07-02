from sqlalchemy.orm import Session
from app.db.database import SessionLocal, Base, engine
from app.models.user import User, UserRole, UserStatus
from app.models.hero_slide import HeroSlide
from app.models.about_section import AboutSection
from app.models.pricing_section import PricingSection
from app.models.faq import FAQ
from app.models.contact_section import ContactSection
from app.models.system_setting import SystemSetting
import json
from app.core import security

def seed_db():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Clean system settings
        print("Cleaning system settings...")
        db.query(SystemSetting).delete()
        db.commit()

        # Clean existing users
        print("Cleaning existing users...")
        db.query(User).delete()
        db.commit()

        # Seed superadmin
        superadmin_email = "superadmin@pallaviphotography.com"
        print(f"Creating default superadmin user: {superadmin_email} ...")
        hashed_superadmin_password = security.get_password_hash("superadminpassword123")
        superadmin_user = User(
            email=superadmin_email,
            password_hash=hashed_superadmin_password,
            role=UserRole.SUPER_ADMIN.value,
            status=UserStatus.ACTIVE.value
        )
        db.add(superadmin_user)

        # Seed admin
        admin_email = "admin@pallaviphotography.com"
        print(f"Creating default admin user: {admin_email} ...")
        hashed_admin_password = security.get_password_hash("adminpassword123")
        admin_user = User(
            email=admin_email,
            password_hash=hashed_admin_password,
            role=UserRole.ADMIN.value,
            status=UserStatus.ACTIVE.value
        )
        db.add(admin_user)
        db.commit()
        print("Superadmin and Admin users seeded successfully!")

        # Seed features and permissions
        from app.models.admin_permission import AdminFeature, AdminRolePermission
        print("Cleaning existing features and permissions...")
        db.query(AdminRolePermission).delete()
        db.query(AdminFeature).delete()
        db.commit()

        features_to_create = [
            ("galleries", "Manage client galleries", True),
            ("bookings", "View and manage bookings", True),
            ("pricing", "Manage pricing pages", False),
            ("faqs", "Manage FAQ section", False),
            ("contact", "View contact form submissions", False),
            ("blogs", "Create and manage blog posts", False),
            ("enquiries", "View client enquiries", True),
            ("users", "Manage user roles and permissions", False),
            ("analytics", "View analytics and statistics", True),
        ]

        print("Seeding available features...")
        for name, desc, default_enabled in features_to_create:
            feature = AdminFeature(
                name=name,
                description=desc,
                default_enabled=default_enabled
            )
            db.add(feature)
        db.commit()

        # Seed permissions for the seeded admin user
        print("Seeding permissions for default admin...")
        admin = db.query(User).filter(User.email == admin_email).first()
        if admin:
            features = db.query(AdminFeature).all()
            for feature in features:
                perm = AdminRolePermission(
                    admin_id=admin.id,
                    feature_name=feature.name,
                    is_enabled=feature.default_enabled
                )
                db.add(perm)
            db.commit()
            print("Permissions for default admin seeded successfully!")
            
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
        
        # Seed FAQ Items
        print("Cleaning and seeding FAQ items...")
        db.query(FAQ).delete()
        
        faq_data = [
            # Newborn FAQs
            {
                "question": "When should I book my newborn photography session?",
                "answer": "It’s best to book your newborn photography session in Vevey during your second trimester to reserve your due date. Newborn sessions are ideally scheduled within 7–14 days after birth, when babies are naturally sleepy and curl into sweet, posed positions.",
                "question_fr": "Quand dois-je réserver ma séance de photographie de nouveau-né ?",
                "answer_fr": "Il est préférable de réserver votre séance photo de nouveau-né à Vevey au cours de votre deuxième trimestre pour garantir la disponibilité autour de votre date d'accouchement. Les séances pour nouveau-nés sont idéalement planifiées dans les 7 à 14 jours suivant la naissance, lorsque les bébés dorment naturellement beaucoup et se recroquevillent facilement dans ces douces poses.",
                "category": "Newborn Photography FAQs",
                "category_fr": "Questions Fréquentes - Photographie de Nouveau-Né",
                "order": 1
            },
            {
                "question": "What props and wraps do you provide?",
                "answer": "I provide a wide selection of newborn photography props, including baskets, blankets, headbands, and wraps in various colors and textures. Before your session, we will discuss your preferred color palette and styling so the images match your vision and home décor.",
                "question_fr": "Quels accessoires et langes fournissez-vous ?",
                "answer_fr": "Je fournis une large sélection d'accessoires de photographie pour nouveau-nés, y compris des paniers, des couvertures, des bandeaux et des langes dans divers coloris et textures. Avant votre séance, nous discuterons de vos préférences de palette de couleurs et de style pour que les images s'accordent à votre vision et à votre décoration intérieure.",
                "category": "Newborn Photography FAQs",
                "category_fr": "Questions Fréquentes - Photographie de Nouveau-Né",
                "order": 2
            },
            {
                "question": "Can parents and siblings be included?",
                "answer": "Absolutely! Parent and sibling portraits are always encouraged to capture timeless family memories alongside your newborn.",
                "question_fr": "Les parents et les frères et sœurs peuvent-ils être inclus ?",
                "answer_fr": "Absolument ! Les portraits de famille avec les parents et la fratrie sont toujours encouragés pour capturer des souvenirs précieux aux côtés de votre nouveau-né.",
                "category": "Newborn Photography FAQs",
                "category_fr": "Questions Fréquentes - Photographie de Nouveau-Né",
                "order": 3
            },
            {
                "question": "How long does a newborn session last?",
                "answer": "Newborn sessions typically last 2–4 hours to allow for feeding, soothing, and gentle posing while keeping your baby comfortable and safe.",
                "question_fr": "Combien de temps dure une séance pour nouveau-né ?",
                "answer_fr": "Les séances pour nouveau-nés durent généralement de 2 à 4 heures pour permettre de nourrir, apaiser et poser doucement votre bébé tout en assurant son confort et sa sécurité.",
                "category": "Newborn Photography FAQs",
                "category_fr": "Questions Fréquentes - Photographie de Nouveau-Né",
                "order": 4
            },
            # Maternity FAQs
            {
                "question": "When is the best time for a maternity photoshoot?",
                "answer": "The ideal window for maternity photography is 28–36 weeks of pregnancy, when your baby bump is beautifully defined and you’re still comfortable moving naturally.",
                "question_fr": "Quel est le meilleur moment pour une séance photo de grossesse ?",
                "answer_fr": "Le moment idéal pour la photographie de maternité se situe entre la 28ème et la 36ème semaine de grossesse, lorsque votre ventre est joliment arrondi et que vous pouvez encore vous déplacer confortablement.",
                "category": "Maternity Photography FAQs",
                "category_fr": "Questions Fréquentes - Photographie de Maternité",
                "order": 1
            },
            {
                "question": "What should I wear for my maternity photos?",
                "answer": "Before your session, we will discuss what to wear. I provide styling guidance and a wide selection of maternity wardrobe options, including flowing gowns and dresses, which you may choose for your photoshoot. This ensures you feel confident and radiant. If you are searching for a maternity photographer Vaud area, you’re in the right place!",
                "question_fr": "Que dois-je porter pour mes photos de maternité ?",
                "answer_fr": "Avant votre séance, nous conviendrons ensemble de votre tenue. Je propose des conseils de style et un grand choix de robes de maternité fluides et d'habits de grossesse parmi lesquels vous pourrez choisir pour votre séance. Cela vous garantit de vous sentir confiante et radieuse. Si vous cherchez un photographe de maternité dans la région de Vaud, vous êtes au bon endroit !",
                "category": "Maternity Photography FAQs",
                "category_fr": "Questions Fréquentes - Photographie de Maternité",
                "order": 2
            },
            {
                "question": "Can my partner and children join the session?",
                "answer": "Of course! Maternity photography celebrates your growing family, so partners and siblings are always welcome.",
                "question_fr": "Mon partenaire et mes enfants peuvent-ils participer à la séance ?",
                "answer_fr": "Bien sûr ! La photographie de maternité célèbre l'agrandissement de votre famille, les partenaires et les enfants sont donc toujours les bienvenus.",
                "category": "Maternity Photography FAQs",
                "category_fr": "Questions Fréquentes - Photographie de Maternité",
                "order": 3
            },
            {
                "question": "Where do maternity sessions take place?",
                "answer": "Maternity sessions can be held outdoors or indoors. For outdoor sessions, I carefully select the date based on weather conditions, usually finalizing it 1–2 weeks in advance to ensure the best light and comfort.",
                "question_fr": "Où se déroulent les séances de maternité ?",
                "answer_fr": "Les séances de maternité peuvent avoir lieu en extérieur ou en intérieur. Pour les séances en extérieur, je sélectionne soigneusement la date en fonction des conditions météorologiques, généralement en la finalisant 1 à 2 semaines à l'avance pour garantir une lumière optimale et votre confort.",
                "category": "Maternity Photography FAQs",
                "category_fr": "Questions Fréquentes - Photographie de Maternité",
                "order": 4
            },
            # Family FAQs
            {
                "question": "What should we wear for our family photoshoot?",
                "answer": "After booking, I provide a family styling guide to help coordinate outfits. Neutral tones, soft textures, and complementary colors photograph beautifully, keeping the focus on your family’s connection.",
                "question_fr": "Que devons-nous porter pour notre séance photo de famille ?",
                "answer_fr": "Après la réservation, je vous fournis un guide de style pour vous aider à coordonner vos tenues. Les tons neutres, les matières douces et les couleurs complémentaires rendent magnifiquement en photo, mettant en valeur la complicité et l'affection de votre famille.",
                "category": "Family Photography FAQs",
                "category_fr": "Questions Fréquentes - Photographie de Famille",
                "order": 1
            },
            {
                "question": "How long is a family session?",
                "answer": "Family sessions typically last 1–2 Hours, allowing time for both posed portraits and natural, candid moments.",
                "question_fr": "Combien de temps dure une séance de famille ?",
                "answer_fr": "Les séances de famille durent généralement de 1 à 2 heures, laissant le temps pour des portraits posés ainsi que pour des moments spontanés et naturels.",
                "category": "Family Photography FAQs",
                "category_fr": "Questions Fréquentes - Photographie de Famille",
                "order": 2
            },
            {
                "question": "What if my children don’t cooperate?",
                "answer": "No worries! I use playful prompts and gentle guidance to capture authentic smiles and interactions. Many of the best photos happen during candid, relaxed moments.",
                "question_fr": "Que se passe-t-il si mes enfants ne coopèrent pas ?",
                "answer_fr": "Pas de panique ! J'utilise des invitations au jeu et des conseils bienveillants pour capturer des sourires et des échanges authentiques. Les meilleures photos surviennent souvent lors de moments spontanés et détendus.",
                "category": "Family Photography FAQs",
                "category_fr": "Questions Fréquentes - Photographie de Famille",
                "order": 3
            },
            {
                "question": "Where do family sessions take place?",
                "answer": "Sessions can be outdoors at scenic locations in Vevey, Lausanne, Montreux, Morges, Fribourg, and surrounding Vaud areas, or indoors.",
                "question_fr": "Où se déroulent les séances de famille ?",
                "answer_fr": "Les séances peuvent se dérouler en extérieur dans des endroits magnifiques à Vevey, Lausanne, Montreux, Morges, Fribourg et dans d'autres régions de Vaud, ou en intérieur.",
                "category": "Family Photography FAQs",
                "category_fr": "Questions Fréquentes - Photographie de Famille",
                "order": 4
            },
            # Booking FAQs
            {
                "question": "How do I book a session?",
                "answer": "You can book your newborn, maternity, or family photography session in several ways:\n- Fill out the contact form on my website\n- Send a message via WhatsApp or email using the contact details listed on the website\n\nOnce your session is confirmed, you will receive a client agreement to review and sign. To secure your session date, a signed agreement and advance payment are required. For newborn sessions, the booking is scheduled based on your due date, and the exact session date will be finalized after your baby arrives.",
                "question_fr": "Comment réserver une séance ?",
                "answer_fr": "Vous pouvez réserver votre séance de photographie de nouveau-né, de maternité ou de famille de plusieurs façons :\n- Remplissez le formulaire de contact sur mon site web\n- Envoyez un message via WhatsApp ou par e-mail en utilisant les coordonnées indiquées sur le site\n\nUne fois votre séance confirmée, vous recevrez un contrat client à lire et à signer. Pour bloquer la date de votre séance, le contrat signé et un acompte sont requis. Pour les séances nouveau-né, la réservation est planifiée en fonction de votre date de terme prévue, et la date exacte de la séance sera finalisée après la naissance de votre bébé.",
                "category": "Booking & Session Information",
                "category_fr": "Réservation & Informations Pratiques",
                "order": 1
            },
            {
                "question": "What happens after the session?",
                "answer": "After your session, I edit the best images in 3-4 weeks and share them in a private online gallery. From this gallery, you can:\n- Select your favorite images\n- Choose a photography package based on the number of photos you want\n- Choose additional print products you wish to order\n\nThis ensures you only pay for what you love.",
                "question_fr": "Que se passe-t-il après la séance ?",
                "answer_fr": "Après votre séance, je traite et retouche les meilleures photos sous 3 à 4 semaines et les partage dans une galerie en ligne privée. Depuis cette galerie, vous pouvez :\n- Sélectionner vos photos préférées\n- Choisir une formule photo en fonction du nombre d'images souhaité\n- Commander des tirages physiques ou des produits imprimés supplémentaires\n\nCela vous garantit de ne payer que pour ce que vous aimez.",
                "category": "Booking & Session Information",
                "category_fr": "Réservation & Informations Pratiques",
                "order": 2
            },
            {
                "question": "What print products do you offer?",
                "answer": "Besides the prints included in your package, I offer high-quality professional prints, including:\n- Large fine art prints\n- Passepartout (matted) prints\n- Canvas wall art\n- Premium photo books in various sizes\n\nAll prints are made with professional-grade materials for lasting color and archival quality. Please reach out for product options and pricing.",
                "question_fr": "Quels produits imprimés proposez-vous ?",
                "answer_fr": "En plus des tirages inclus dans vos formules, je propose des impressions professionnelles de haute qualité, notamment :\n- Grands tirages d'art (fine art)\n- Tirages avec passe-partout\n- Impressions sur toile\n- Livres photo haut de gamme de différents formats\n\nTous les tirages sont fabriqués avec des matériaux de qualité professionnelle pour garantir des couleurs durables et une conservation optimale. Veuillez me contacter pour connaître les tarifs détaillés des produits.",
                "category": "Booking & Session Information",
                "category_fr": "Réservation & Informations Pratiques",
                "order": 3
            },
            {
                "question": "How do we receive our photos and prints?",
                "answer": "Once full payment is completed:\n- Your selected digital images are delivered for download\n- Print products are processed\n\nPrint delivery options:\n- Smaller prints can be posted (additional postage charges apply)\n- Larger fine art prints, canvases, and wall art must be collected in Vevey to ensure safe handling",
                "question_fr": "Comment recevons-nous nos photos et tirages ?",
                "answer_fr": "Une fois le règlement finalisé :\n- Vos fichiers numériques sélectionnés vous sont livrés en téléchargement\n- La commande de vos impressions physiques est lancée\n\nOptions de livraison des tirages :\n- Les petits formats peuvent être envoyés par la poste (frais de port en sus)\n- Les grands formats d'art, toiles et cadres doivent être récupérés à Vevey pour éviter tout dommage durant le transport",
                "category": "Booking & Session Information",
                "category_fr": "Réservation & Informations Pratiques",
                "order": 4
            },
            # Local Service FAQs
            {
                "question": "Do you photograph families from Lausanne or other cities?",
                "answer": "I serve Vevey, Lausanne, Montreux, Morges, Fribourg, and other areas in Vaud.",
                "question_fr": "Réalisez-vous des séances pour des familles de Lausanne ou d'autres villes ?",
                "answer_fr": "Je dessers Vevey, Lausanne, Montreux, Morges, Fribourg et d'autres localités du canton de Vaud.",
                "category": "Local Service Areas & Outdoor Sessions",
                "category_fr": "Zones Desservies & Séances en Extérieur",
                "order": 1
            },
            {
                "question": "How do you choose the date for outdoor sessions?",
                "answer": "For outdoor sessions, I carefully select dates based on weather conditions and usually finalize the session 1–2 weeks in advance to ensure the best lighting, comfort, and results.",
                "question_fr": "Comment choisissez-vous la date pour les séances en plein air ?",
                "answer_fr": "Pour les séances en extérieur, je sélectionne soigneusement les météos et finalise généralement le rendez-vous 1 à 2 semaines à l'avance pour garantir le meilleur confort, les plus belles lumières et un rendu idéal.",
                "category": "Local Service Areas & Outdoor Sessions",
                "category_fr": "Zones Desservies & Séances en Extérieur",
                "order": 2
            }
        ]
        
        for item in faq_data:
            faq_item = FAQ(
                question=item["question"],
                answer=item["answer"],
                question_fr=item["question_fr"],
                answer_fr=item["answer_fr"],
                category=item["category"],
                category_fr=item["category_fr"],
                order=item["order"]
            )
            db.add(faq_item)
        db.commit()
        print("FAQ items seeded successfully!")

        # Seed Contact Section
        print("Cleaning and seeding Contact section...")
        db.query(ContactSection).delete()
        contact = ContactSection(
            title="LET'S CONNECT",
            title_fr="CONTACTONS-NOUS",
            p1="Whether you’re looking to book a session, ask a question, or just say hello — I’d love to hear from you. Every story is unique, and I’m here to help you capture yours in the most beautiful way.",
            p1_fr="Que vous souhaitiez réserver une séance, poser une question ou simplement dire bonjour, j’aimerais beaucoup avoir de vos nouvelles. Chaque histoire est unique et je suis là pour vous aider à capturer la vôtre de la plus belle des manières.",
            p2="Have a date in mind? Drop a message with the type of shoot you’re interested in — portraits, events, lifestyle, or something personal — and we’ll make it happen.",
            p2_fr="Vous avez une date en tête ? Laissez un message avec le type de séance qui vous intéresse — portraits, événements, style de vie ou quelque chose de personnel — et nous ferons en sorte que cela se réalise.",
            email="pallavi.vishk@gmail.com",
            phone="+41 789077644",
            whatsapp="+41 789077644",
            instagram="@pallavivishk"
        )
        db.add(contact)
        db.commit()
        print("Contact section seeded successfully!")
            
    except Exception as e:
        print(f"Seeding failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
