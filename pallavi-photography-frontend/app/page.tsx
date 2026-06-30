"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight, Send, CheckCircle } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

// Curated high-res imagery matching photography categories
const PORTFOLIO_PREVIEWS = {
  newborn: {
    title: "Newborn Photography",
    tagline: "Purity & Soft Beginnings",
    description: "Honoring the first fleeting days of your baby's life. We create soft, minimalist setups that highlight the tiny details—delicate eyelashes, sleepy smiles, and soft skin.",
    image: "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=800",
    link: "/our-gallery/newborn"
  },
  maternity: {
    title: "Maternity Journeys",
    tagline: "The Miracle of Life",
    description: "Sophisticated maternity portraits capturing the strength, grace, and inner glow of motherhood. Styled in studio or glowing golden-hour Swiss fields.",
    image: "https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?auto=format&fit=crop&q=80&w=800",
    link: "/our-gallery/maternity"
  },
  family: {
    title: "Family Legacy",
    tagline: "Joy & Connection",
    description: "Candid, warm storytelling frames documenting the laughter, hugs, and genuine interactions between your loved ones. Portraits that tell your family's unique narrative.",
    image: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=800",
    link: "/our-gallery/family"
  },
  "fine-art": {
    title: "Fine Art Portraiture",
    tagline: "Timeless & Artistic",
    description: "Editorial, painterly portraiture inspired by classical masterworks. Focuses on dramatic lighting, textured styling, and deep emotional resonance.",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800",
    link: "/our-gallery/fine-art"
  },
  nature: {
    title: "Nature & Light",
    tagline: "The Great Outdoors",
    description: "Landscape-integrated portraiture captured in the scenic majesty of Switzerland. Mountain horizons, lakeside light, and forest shadows blending into art.",
    image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=800",
    link: "/our-gallery/nature"
  }
};

const TESTIMONIALS = [
  {
    quote: "Pallavi has a magical gift with newborns. She handled our 10-day-old son with such gentle care. The portraits are emotional, minimalist, and absolutely beautiful.",
    author: "Elena & Marc S.",
    location: "Zürich, Switzerland"
  },
  {
    quote: "The maternity session was a dream. Pallavi helped style the outfits and made me feel so confident and beautiful. We will cherish these pictures forever.",
    author: "Sophie B.",
    location: "Geneva, Switzerland"
  },
  {
    quote: "We did a family sunset shoot in the Alps. Pallavi managed to capture our kids' wild spirits perfectly. The lighting, composition, and emotional warmth are perfect.",
    author: "The Keller Family",
    location: "Lucerne, Switzerland"
  }
];

const BLOG_POSTS = [
  {
    id: 1,
    title: "Preparing for Your Newborn Session: A Guide for Parents",
    excerpt: "Tips on timing, temperature, feeding, and what to pack to ensure a calm, smooth photography experience for your baby.",
    date: "June 25, 2026",
    category: "Tips & Guides",
    image: "https://images.unsplash.com/photo-1544126592-807adc26cc7d?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: 2,
    title: "Maternity Styling: What to Wear to Showcase Your Glow",
    excerpt: "Explore textures, color palettes, and dress styles that drape beautifully and celebrate your pregnancy shape in portraits.",
    date: "May 18, 2026",
    category: "Styling",
    image: "https://images.unsplash.com/photo-1517164850305-99a3e65bb47e?auto=format&fit=crop&q=80&w=600"
  },
  {
    id: 3,
    title: "Chasing the Golden Hour: Best Outdoor Locations in Switzerland",
    excerpt: "A curated list of mountain passes, lakeside spots, and open meadows that capture Swiss sunlight beautifully.",
    date: "April 10, 2026",
    category: "Locations",
    image: "https://images.unsplash.com/photo-1472214222541-d510753a49fa?auto=format&fit=crop&q=80&w=600"
  }
];

const INSTAGRAM_PHOTOS = [
  "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=400",
  "https://images.unsplash.com/photo-1544126592-807adc26cc7d?auto=format&fit=crop&q=80&w=400"
];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<keyof typeof PORTFOLIO_PREVIEWS>("newborn");
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [formData, setFormData] = useState({ name: "", email: "", category: "newborn", message: "" });
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Auto-slide testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email) {
      setFormSubmitted(true);
      // Reset form after a small delay
      setTimeout(() => {
        setFormData({ name: "", email: "", category: "newborn", message: "" });
      }, 3000);
    }
  };

  return (
    <>
      <Header />
      
      {/* 1. HERO SECTION */}
      <section className="relative h-screen w-full flex items-center justify-center bg-stone-900 overflow-hidden">
        {/* Background Image with Dark Soft Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=1920"
            alt="New Beginnings Family Portrait"
            className="w-full h-full object-cover object-center opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2C2623]/80 via-transparent to-[#2C2623]/40" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-6 max-w-4xl animate-fade-in space-y-6">
          <span className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-stone-200 block font-light">
            Switzerland Portrait Studio
          </span>
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-light tracking-[0.25em] text-white uppercase font-serif leading-tight">
            New Beginnings
          </h2>
          <p className="text-sm md:text-base text-stone-200 font-light tracking-wide max-w-xl mx-auto leading-relaxed">
            Capturing the pure emotions, soft light, and beautiful details of newborn, family, and maternity journeys.
          </p>
          <div className="pt-8">
            <Link
              href="#explore-portfolio"
              className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest text-white border border-white/35 hover:border-white px-8 py-3.5 rounded-xs transition-all duration-300 hover:bg-white/5"
            >
              <span>Explore Portfolios</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center space-y-2">
          <span className="text-[9px] uppercase tracking-[0.3em] text-stone-300 font-light">Scroll</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-stone-300 to-transparent animate-pulse" />
        </div>
      </section>

      {/* 2. INTRO SECTION */}
      <section id="about" className="py-24 bg-[#FCFAF7] border-b border-[#DCD0C0]/20">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-8">
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#C4A484] font-semibold">
            Welcome to the Studio
          </span>
          <h3 className="text-3xl md:text-4xl font-light tracking-wide font-serif text-[#2C2623]">
            Timeless Portraits, Natural Light
          </h3>
          <p className="text-[#6E635F] text-sm md:text-base leading-relaxed font-light">
            I believe that photography is a gentle art. It is about documenting real, unscripted love, natural connections, and quiet moments. Based in Switzerland, I specialize in fine art newborn setups, maternity storytelling, and outdoor family collections using soft textures and natural illumination.
          </p>
          <div className="pt-2">
            <div className="w-16 h-[1px] bg-[#DCD0C0] mx-auto" />
          </div>
        </div>
      </section>

      {/* 3. EXPLORE PORTFOLIO SECTION */}
      <section id="explore-portfolio" className="py-24 bg-[#FAF8F5]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center md:text-left mb-16 space-y-2">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#C4A484] font-semibold block">
              Curated Collections
            </span>
            <h3 className="text-3xl md:text-4xl font-light tracking-wide font-serif">
              Explore Our Portfolios
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
            {/* Left Category Menu */}
            <div className="md:col-span-5 space-y-6">
              {Object.entries(PORTFOLIO_PREVIEWS).map(([key, data]) => {
                const isActive = activeCategory === key;
                return (
                  <div
                    key={key}
                    onMouseEnter={() => setActiveCategory(key as keyof typeof PORTFOLIO_PREVIEWS)}
                    onClick={() => setActiveCategory(key as keyof typeof PORTFOLIO_PREVIEWS)}
                    className={`group cursor-pointer border-l-2 pl-6 py-2 transition-all duration-300 ${
                      isActive
                        ? "border-[#C4A484] bg-[#F5EFEB]/40"
                        : "border-[#DCD0C0]/20 hover:border-[#C4A484]/40"
                    }`}
                  >
                    <span className="text-[10px] uppercase tracking-widest text-[#C4A484] block font-medium mb-1">
                      {data.tagline}
                    </span>
                    <h4 className={`text-xl font-light tracking-wide font-serif transition-colors duration-250 ${
                      isActive ? "text-[#2C2623]" : "text-[#6E635F] group-hover:text-[#2C2623]"
                    }`}>
                      {data.title}
                    </h4>
                    {isActive && (
                      <div className="mt-3 space-y-4 animate-fade-in">
                        <p className="text-xs text-[#6E635F] leading-relaxed font-light">
                          {data.description}
                        </p>
                        <Link
                          href={data.link}
                          className="inline-flex items-center space-x-2 text-[10px] uppercase tracking-widest text-[#C4A484] font-semibold hover:text-[#2C2623] transition-colors"
                        >
                          <span>View Gallery</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right Image Preview */}
            <div className="md:col-span-7 relative h-[450px] w-full rounded-xs overflow-hidden shadow-md group">
              <img
                src={PORTFOLIO_PREVIEWS[activeCategory].image}
                alt={PORTFOLIO_PREVIEWS[activeCategory].title}
                className="w-full h-full object-cover transition-all duration-700 ease-out scale-100 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-[#2C2623]/10" />
            </div>
          </div>
        </div>
      </section>

      {/* 4. RESERVE YOUR SESSION BANNER (2nd Ref Image) */}
      <section className="relative py-28 w-full flex items-center justify-center bg-stone-900 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=1920"
            alt="Family outdoors background"
            className="w-full h-full object-cover object-center opacity-65"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Banner Content */}
        <div className="relative z-10 text-center px-6 max-w-3xl space-y-6">
          <span className="text-[10px] uppercase tracking-[0.4em] text-stone-200 block font-light">
            Limited Monthly Slots Available
          </span>
          <h2 className="text-3xl sm:text-5xl font-light tracking-[0.25em] text-white uppercase font-serif">
            Reserve Your Session
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 font-light tracking-wide max-w-lg mx-auto leading-relaxed">
            Every season brings beautiful lights and changes. Secure your spot today to document your family's precious milestone in Switzerland.
          </p>
          <div className="pt-4">
            <Link
              href="#contact"
              className="inline-block text-xs uppercase tracking-widest text-[#2C2623] bg-[#FCFAF7] hover:bg-[#FAF8F5] px-8 py-3.5 rounded-sm transition-all duration-300 font-medium hover:shadow-md"
            >
              Get In Touch
            </Link>
          </div>
        </div>
      </section>

      {/* 5. TESTIMONIALS SECTION */}
      <section className="py-24 bg-[#FCFAF7] border-b border-[#DCD0C0]/20">
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#C4A484] font-semibold block mb-8">
            Kind Words
          </span>
          
          {/* Testimonial Quote Slider */}
          <div className="min-h-[160px] flex items-center justify-center">
            {TESTIMONIALS.map((t, idx) => {
              if (idx !== currentTestimonial) return null;
              return (
                <div key={idx} className="space-y-4 animate-fade-in">
                  <p className="text-lg md:text-xl font-light font-serif italic leading-relaxed text-[#2C2623]">
                    "{t.quote}"
                  </p>
                  <div className="pt-4">
                    <span className="block text-xs uppercase tracking-widest font-semibold text-[#2C2623]">
                      {t.author}
                    </span>
                    <span className="block text-[10px] text-[#6E635F] tracking-wider uppercase font-light">
                      {t.location}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center space-x-2.5 mt-8">
            {TESTIMONIALS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentTestimonial(idx)}
                className={`w-1.5 h-1.5 rounded-full cursor-pointer transition-all duration-300 ${
                  idx === currentTestimonial ? "bg-[#C4A484] w-4" : "bg-[#DCD0C0]"
                }`}
                aria-label={`Go to testimonial ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 6. BLOG LIST SECTION */}
      <section className="py-24 bg-[#FAF8F5] border-b border-[#DCD0C0]/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-2">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#C4A484] font-semibold block">
              Journal & Notes
            </span>
            <h3 className="text-3xl md:text-4xl font-light tracking-wide font-serif">
              Read Our Blog
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {BLOG_POSTS.map((post) => (
              <article key={post.id} className="bg-[#FCFAF7] border border-[#DCD0C0]/20 rounded-xs overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col">
                <div className="h-48 w-full relative overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-103"
                  />
                  <span className="absolute top-4 left-4 bg-[#FCFAF7]/90 text-[9px] uppercase tracking-widest text-[#2C2623] px-2 py-1 rounded-sm font-medium">
                    {post.category}
                  </span>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span className="text-[9px] text-[#6E635F] uppercase tracking-wider">{post.date}</span>
                    <h4 className="text-base font-light tracking-wide font-serif text-[#2C2623] hover:text-[#C4A484] transition-colors leading-snug">
                      {post.title}
                    </h4>
                    <p className="text-xs text-[#6E635F] leading-relaxed font-light">
                      {post.excerpt}
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link
                      href="#"
                      className="inline-flex items-center space-x-1.5 text-[9px] uppercase tracking-widest text-[#C4A484] font-semibold hover:text-[#2C2623] transition-colors"
                    >
                      <span>Read Article</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 7. GET IN TOUCH (CONTACT FORM) */}
      <section id="contact" className="py-24 bg-[#FCFAF7] border-b border-[#DCD0C0]/20">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          
          {/* Left Text */}
          <div className="md:col-span-5 space-y-4 text-center md:text-left">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#C4A484] font-semibold block">
              Let's Connect
            </span>
            <h3 className="text-3xl font-light tracking-wide font-serif text-[#2C2623]">
              Get In Touch
            </h3>
            <p className="text-xs text-[#6E635F] leading-relaxed font-light">
              Have questions about pricing, styling, or session availability? Write a message and let's craft something beautiful together. I look forward to hearing from you.
            </p>
            <div className="pt-4 text-xs font-light text-[#6E635F]">
              <p>Email: hello@pallaviphotography.com</p>
              <p>Studio: Zürich, Switzerland</p>
            </div>
          </div>

          {/* Right Form */}
          <div className="md:col-span-7 bg-[#FAF8F5] border border-[#DCD0C0]/30 rounded-md p-8 shadow-xs">
            {formSubmitted ? (
              <div className="text-center py-12 space-y-4 animate-fade-in">
                <CheckCircle className="w-12 h-12 text-[#C4A484] mx-auto" />
                <h4 className="text-lg font-light font-serif">Message Sent!</h4>
                <p className="text-xs text-[#6E635F] font-light max-w-sm mx-auto">
                  Thank you for reaching out. We will get back to you within 24–48 hours to discuss your session.
                </p>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-[10px] uppercase tracking-wider text-[#6E635F] mb-1 font-medium">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                    className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden focus:border-[#C4A484] transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-[10px] uppercase tracking-wider text-[#6E635F] mb-1 font-medium">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    required
                    className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden focus:border-[#C4A484] transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="category" className="block text-[10px] uppercase tracking-wider text-[#6E635F] mb-1 font-medium">Session Type</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                    className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden focus:border-[#C4A484] transition-colors"
                  >
                    <option value="newborn">Newborn Session</option>
                    <option value="maternity">Maternity Portrait</option>
                    <option value="family">Family Gathering</option>
                    <option value="fine-art">Fine Art Session</option>
                    <option value="nature">Outdoor Nature</option>
                    <option value="other">Other / Inquiry</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="message" className="block text-[10px] uppercase tracking-wider text-[#6E635F] mb-1 font-medium">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleFormChange}
                    required
                    className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden focus:border-[#C4A484] transition-colors resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center space-x-2 text-xs uppercase tracking-widest text-[#FCFAF7] bg-[#2C2623] hover:bg-[#352F2C] py-3 rounded-sm font-medium transition-all cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Message</span>
                </button>
              </form>
            )}
          </div>

        </div>
      </section>

      {/* 8. INSTAGRAM GRID SECTION */}
      <section className="py-24 bg-[#FAF8F5] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-12">
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#C4A484] font-semibold block">
              Social Journal
            </span>
            <h3 className="text-3xl font-light tracking-wide font-serif text-[#2C2623]">
              Follow Us on Instagram
            </h3>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs tracking-wider text-[#C4A484] hover:text-[#2C2623] transition-colors uppercase font-medium inline-block pt-1"
            >
              @pallaviphotography
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {INSTAGRAM_PHOTOS.map((src, idx) => (
              <a
                key={idx}
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="block relative h-40 md:h-48 w-full group overflow-hidden bg-stone-200"
              >
                <img
                  src={src}
                  alt={`Instagram feed photo ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-[#2C2623]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center" />
              </a>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
