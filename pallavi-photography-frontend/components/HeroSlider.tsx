"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";

interface Slide {
  id: string;
  title: string;
  image_url: string;
  order: number;
  is_active: boolean;
}

export default function HeroSlider() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSlides() {
      try {
        const res = await api.get<Slide[]>("/hero-sliders");
        setSlides(res);
      } catch (err) {
        console.error("Failed to load hero slides", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSlides();
  }, []);

  // Auto-play timer
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [slides]);

  const handlePrev = () => {
    if (slides.length === 0) return;
    setCurrentIdx((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    if (slides.length === 0) return;
    setCurrentIdx((prev) => (prev + 1) % slides.length);
  };

  if (loading) {
    return (
      <section className="relative min-h-[100dvh] w-full flex items-center justify-center bg-zinc-950 text-white">
        <div className="text-xs uppercase tracking-[0.3em] font-light animate-pulse text-brand-sage">
          Entering Studio...
        </div>
      </section>
    );
  }

  // Fallback slides if DB is empty
  const activeSlides = slides.length > 0 ? slides : [
    {
      id: "default-1",
      title: "New Beginnings",
      image_url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=1920",
      order: 1,
      is_active: true
    }
  ];

  const currentSlide = activeSlides[currentIdx];

  return (
    <section className="relative min-h-[100dvh] w-full flex items-center justify-center bg-zinc-950 overflow-hidden">
      {/* Background Image Carousel with Fade Transitions */}
      {activeSlides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out ${
            index === currentIdx ? "opacity-60 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          <img
            src={slide.image_url}
            alt={slide.title}
            className="w-full h-full object-cover object-center scale-102 transition-transform duration-[4500ms] ease-out"
          />
          {/* Readability scrim/gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/85 via-brand-dark/20 to-brand-dark/50" />
        </div>
      ))}

      {/* Slide Text Content overlay */}
      <div className="relative z-10 text-center px-6 max-w-4xl space-y-6">
        <span className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-white/80 block font-light">
          Switzerland Fine Art Studio
        </span>
        <h2 className="text-4xl sm:text-6xl md:text-7xl font-light tracking-[0.25em] text-white uppercase font-serif leading-tight drop-shadow-md">
          {currentSlide?.title || "New Beginnings"}
        </h2>
        <p className="text-xs md:text-sm text-stone-200 font-light tracking-widest max-w-xl mx-auto leading-relaxed uppercase">
          Capturing the pure emotions, soft light, and beautiful details of newborn, family, and maternity journeys.
        </p>
        <div className="pt-8">
          <Link
            href="/our-blogs"
            className="inline-flex items-center space-x-2 text-[10px] uppercase tracking-widest text-white border border-white/35 hover:border-white px-8 py-3.5 rounded-sm transition-all duration-300 hover:bg-white/5"
          >
            <span>Explore Portfolio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Manual Left/Right Arrow Navigation */}
      {activeSlides.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-20 text-white/50 hover:text-white p-2 hover:scale-105 transition-all cursor-pointer"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-8 h-8 stroke-1" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-20 text-white/50 hover:text-white p-2 hover:scale-105 transition-all cursor-pointer"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-8 h-8 stroke-1" />
          </button>
        </>
      )}

      {/* Bottom indicators */}
      {activeSlides.length > 1 && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex space-x-3">
          {activeSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIdx(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                index === currentIdx ? "bg-white scale-120 shadow-xs" : "bg-white/30 hover:bg-white/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
