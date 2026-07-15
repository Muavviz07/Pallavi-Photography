"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import HeroSlider from "@/components/HeroSlider";
import AboutSection from "@/components/AboutSection";
import ExplorePortfolioSection from "@/components/ExplorePortfolioSection";
import ReserveSessionSection from "@/components/ReserveSessionSection";
import TestimonialsCarousel from "@/components/testimonials/TestimonialsCarousel";
import BlogSection from "@/components/BlogSection";
import ContactForm from "@/components/forms/ContactForm";
import Footer from "@/components/layout/Footer";

import { useTranslation } from "@/components/LanguageProvider";

export default function Home() {
  const { t: translate, lang } = useTranslation("common");

  const t = {
    getInTouch: translate("getInTouchUppercase", "GET IN TOUCH"),
    followLatest: translate("followLatest", "Follow our latest stories."),
    followInsta: translate("followInsta", "FOLLOW ME ON INSTAGRAM"),
  };

  return (
    <>
      {/* Dynamic Header Component */}
      <Header />

      {/* 1. HERO SLIDER */}
      <HeroSlider />

      {/* 2. ABOUT SECTION */}
      <AboutSection />

      {/* 3. EXPLORE PORTFOLIO SECTION */}
      <ExplorePortfolioSection />

      {/* 4. RESERVE YOUR SESSION SECTION */}
      <ReserveSessionSection />

      {/* 5. TESTIMONIALS SECTION */}
      <section className="py-24 bg-white border-b border-brand-border">
        <TestimonialsCarousel />
      </section>

      {/* 6. BLOG SECTION */}
      <BlogSection />

      {/* 7. GET IN TOUCH (CONTACT FORM) */}
      <section id="contact" className="py-24 bg-white border-b border-brand-border">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 space-y-12">
          {/* Header Title */}
          <div className="text-center space-y-2">
            <h3 className="text-2xl sm:text-3xl md:text-4xl tracking-[0.25em] font-serif text-brand-dark uppercase" style={{ fontWeight: 300 }}>
              {t.getInTouch}
            </h3>
            <p className="text-xs font-serif italic text-brand-muted leading-relaxed">
              {t.followLatest}
            </p>
          </div>

          {/* Form wrapper (styled with white background and thin border matching screenshot) */}
          <div className="max-w-3xl mx-auto bg-white border border-stone-200/80 p-8 md:p-16 rounded-xs">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* 8. FOLLOW ME ON INSTAGRAM BANNER */}
      <section className="py-24 bg-white text-center border-b border-brand-border">
        <div className="space-y-4">
          <h3 className="text-2xl sm:text-3xl md:text-4xl tracking-[0.3em] font-serif text-brand-dark uppercase" style={{ fontWeight: 300 }}>
            {t.followInsta}
          </h3>
          <a 
            href="https://instagram.com/Pallavivishk" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sm sm:text-base font-serif italic text-brand-muted hover:text-brand-sage transition-colors tracking-wide block"
            style={{ fontWeight: 300 }}
          >
            @ Pallavivishk
          </a>
        </div>
      </section>

      {/* Dynamic Footer Component */}
      <Footer />
    </>
  );
}
