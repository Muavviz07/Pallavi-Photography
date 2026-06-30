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

export default function Home() {
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
      <section className="py-24 bg-brand-cream border-b border-brand-border">
        <TestimonialsCarousel />
      </section>

      {/* 6. BLOG SECTION */}
      <BlogSection />

      {/* 7. GET IN TOUCH (CONTACT FORM) */}
      <section id="contact" className="py-24 bg-brand-bg border-b border-brand-border">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 space-y-12">
          {/* Header Title */}
          <div className="text-center space-y-4">
            <span className="text-[10px] uppercase tracking-[0.3em] text-brand-sage font-semibold block">
              Let's Connect
            </span>
            <h3 className="text-3xl sm:text-4xl font-light tracking-wide font-serif text-brand-dark uppercase">
              Get In Touch
            </h3>
            <p className="text-xs text-brand-muted max-w-md mx-auto font-light leading-relaxed">
              Follow our latest stories.
            </p>
          </div>

          {/* Form wrapper */}
          <div className="max-w-xl mx-auto bg-brand-cream border border-brand-border p-8 md:p-12 rounded-xs shadow-xl">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* Dynamic Footer Component */}
      <Footer />
    </>
  );
}
