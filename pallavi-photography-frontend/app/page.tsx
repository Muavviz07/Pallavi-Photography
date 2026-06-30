"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight, Send, CheckCircle } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ContactForm from "@/components/forms/ContactForm";
import TestimonialsCarousel from "@/components/testimonials/TestimonialsCarousel";
import { translations, Language } from "@/lib/translations";

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
  const [lang, setLang] = useState<Language>("EN");

  useEffect(() => {
    const stored = (localStorage.getItem("lang") as Language) || "EN";
    setLang(stored);

    const handleLangChange = () => {
      const nextLang = (localStorage.getItem("lang") as Language) || "EN";
      setLang(nextLang);
    };

    window.addEventListener("languagechange", handleLangChange);
    return () => window.removeEventListener("languagechange", handleLangChange);
  }, []);

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
              <span>{translations[lang].explorePortfolio}</span>
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
            {translations[lang].welcome}
          </span>
          <h3 className="text-3xl md:text-4xl font-light tracking-wide font-serif text-[#2C2623]">
            {translations[lang].timelessPortraits}
          </h3>
          <p className="text-[#6E635F] text-sm md:text-base leading-relaxed font-light">
            {translations[lang].introText}
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
              {translations[lang].curatedCollections}
            </span>
            <h3 className="text-3xl md:text-4xl font-light tracking-wide font-serif">
              {translations[lang].explorePortfolio}
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
            {translations[lang].slotsAvailable}
          </span>
          <h2 className="text-3xl sm:text-5xl font-light tracking-[0.25em] text-white uppercase font-serif">
            {translations[lang].reserveSession}
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 font-light tracking-wide max-w-lg mx-auto leading-relaxed">
            {translations[lang].reserveText}
          </p>
          <div className="pt-4">
            <Link
              href="#contact"
              className="inline-block text-xs uppercase tracking-widest text-[#2C2623] bg-[#FCFAF7] hover:bg-[#FAF8F5] px-8 py-3.5 rounded-sm transition-all duration-300 font-medium hover:shadow-md"
            >
              {translations[lang].getInTouch}
            </Link>
          </div>
        </div>
      </section>

      {/* 5. TESTIMONIALS SECTION */}
      <section className="py-24 bg-[#FCFAF7] border-b border-[#DCD0C0]/20">
        <TestimonialsCarousel />
      </section>

      {/* 6. BLOG LIST SECTION */}
      <section className="py-24 bg-[#FAF8F5] border-b border-[#DCD0C0]/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-2">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#C4A484] font-semibold block">
              Journal & Notes
            </span>
            <h3 className="text-3xl md:text-4xl font-light tracking-wide font-serif">
              {translations[lang].readBlog}
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
          <div className="md:col-span-7">
            <ContactForm />
          </div>

        </div>
      </section>

      {/* 8. INSTAGRAM GRID SECTION */}
      <section className="py-24 bg-[#FAF8F5] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-12">
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#C4A484] font-semibold block">
              {translations[lang].socialJournal}
            </span>
            <h3 className="text-3xl font-light tracking-wide font-serif text-[#2C2623]">
              {translations[lang].followUs}
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
