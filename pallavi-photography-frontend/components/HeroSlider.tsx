"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";

interface Slide {
  id: string;
  title: string;
  subtitle?: string | null;
  image_url: string;
  order_position?: number;
  order?: number;
  is_active: boolean;
}

const FALLBACK_SLIDES: Slide[] = [
  {
    id: "fb-1",
    title: "New Beginnings",
    image_url: "https://images.unsplash.com/photo-1610901137736-d7cc46657b11?auto=format&fit=crop&q=80&w=1200",
    order: 1,
    is_active: true
  },
  {
    id: "fb-2",
    title: "Timeless Childhood",
    image_url: "https://images.unsplash.com/photo-1624029769501-5a6cfec0d9e0?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fENoaWxkcmVuJTIwcGhvdG9zaG9vdHxlbnwwfHwwfHx8MA%3D%3D",
    order: 2,
    is_active: true
  },
  {
    id: "fb-3",
    title: "Family Connections",
    image_url: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=1200",
    order: 3,
    is_active: true
  },
  {
    id: "fb-4",
    title: "Maternity Grace",
    image_url: "https://images.unsplash.com/photo-1615766553246-9147b6d50e90?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8TWF0ZXJuaXR5JTIwcGhvdG9zaG9vdHxlbnwwfHwwfHx8MA%3D%3D",
    order: 4,
    is_active: true
  },
  {
    id: "fb-5",
    title: "Fine Art Portraits",
    image_url: "https://images.unsplash.com/photo-1637511844674-d2c52d5f29b5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8RmluZWFydCUyMHBob3Rvc2hvb3R8ZW58MHx8MHx8fDA%3D",
    order: 5,
    is_active: true
  },
  {
    id: "fb-6",
    title: "Nature Scenery",
    image_url: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=1200",
    order: 6,
    is_active: true
  },
  {
    id: "fb-7",
    title: "Newborn Details",
    image_url: "https://images.unsplash.com/photo-1610901137736-d7cc46657b11?auto=format&fit=crop&q=80&w=1200",
    order: 7,
    is_active: true
  },
  {
    id: "fb-8",
    title: "Milestone Moments",
    image_url: "https://images.unsplash.com/photo-1624029769501-5a6cfec0d9e0?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fENoaWxkcmVuJTIwcGhvdG9zaG9vdHxlbnwwfHwwfHx8MA%3D%3D",
    order: 8,
    is_active: true
  },
  {
    id: "fb-9",
    title: "Maternity Elegance",
    image_url: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=1200",
    order: 9,
    is_active: true
  }
];

export default function HeroSlider() {
  const [slides, setSlides] = useState<Slide[]>(FALLBACK_SLIDES);
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    async function fetchSlides() {
      try {
        const res = await api.get<Slide[]>("/hero-slides");
        if (res && res.length > 0) {
          setSlides(res);
        }
      } catch (err) {
        console.error("Failed to load hero slides", err);
      }
    }
    fetchSlides();
  }, []);

  // Merge database slides with fallbacks and sort by order_position ascending
  const activeSlides = (slides.length >= 9 ? slides.slice(0, 9) : [
    ...slides,
    ...FALLBACK_SLIDES.slice(0, 9 - slides.length)
  ])
    .filter(slide => slide.is_active !== false)
    .sort((a, b) => {
      const posA = a.order_position !== undefined ? a.order_position : (a.order || 0);
      const posB = b.order_position !== undefined ? b.order_position : (b.order || 0);
      return posA - posB;
    });

  // Background Prefetching of all slides to ensure lag-free image rendering
  useEffect(() => {
    if (activeSlides.length === 0) return;
    activeSlides.forEach((slide) => {
      const img = new Image();
      img.src = slide.image_url;
    });
  }, [activeSlides]);

  // Auto-play timer
  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % activeSlides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [activeSlides]);

  const handlePrev = () => {
    if (activeSlides.length === 0) return;
    setCurrentIdx((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  const handleNext = () => {
    if (activeSlides.length === 0) return;
    setCurrentIdx((prev) => (prev + 1) % activeSlides.length);
  };

  const currentSlide = activeSlides[currentIdx];

  return (
    <section className="relative min-h-[100dvh] w-full flex items-center justify-center bg-zinc-950 overflow-hidden">
      {/* Background Image Carousel with Fade Transitions */}
      {activeSlides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out ${
            index === currentIdx ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          <img
            src={slide.image_url}
            alt={slide.title}
            className="w-full h-full object-cover object-center scale-102 transition-transform duration-[4500ms] ease-out filter contrast-[1.05] saturate-[1.12]"
            loading={index === 0 ? "eager" : "lazy"}
          />
          {/* Readability scrim/gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 via-brand-dark/30 to-brand-dark/60" />
        </div>
      ))}

      {/* Slide Text Content overlay */}
      <div className="relative z-10 text-center px-6 max-w-5xl lg:max-w-7xl space-y-6">
        <h2 className="text-4xl sm:text-6xl md:text-7xl font-light tracking-[0.25em] text-white uppercase font-serif leading-tight drop-shadow-md">
          {currentSlide?.title || "New Beginnings"}
        </h2>
        {currentSlide?.subtitle && (
          <p className="text-xs sm:text-sm font-light tracking-[0.2em] text-white/80 uppercase font-sans drop-shadow-sm max-w-2xl mx-auto pt-2">
            {currentSlide.subtitle}
          </p>
        )}
        <div className="pt-12">
          <Link
            href="/our-blogs"
            className="inline-flex items-center space-x-2 text-[10px] uppercase tracking-widest text-white border border-white/35 hover:border-white px-8 py-3.5 rounded-sm transition-all duration-300 hover:bg-white/5 cursor-pointer"
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

      {/* Bottom Diamond & Circle indicators matching the reference image */}
      {activeSlides.length > 1 && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-6">
          {/* Keyframe style injection for the revolving outline progress ring */}
          <style>{`
            @keyframes progress-ring-fill {
              0% {
                stroke-dashoffset: 62.83;
              }
              100% {
                stroke-dashoffset: 0;
              }
            }
          `}</style>
          {activeSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIdx(index);
              }}
              className="relative flex items-center justify-center w-8 h-8 focus:outline-hidden cursor-pointer"
              aria-label={`Go to slide ${index + 1}`}
            >
              {/* SVG Revolving Circle for active indicator */}
              {index === currentIdx && (
                <svg key={currentIdx} className="absolute w-7 h-7 -rotate-90" viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.25)"
                    strokeWidth="1"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill="none"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeDasharray="62.83"
                    style={{
                      animation: "progress-ring-fill 4500ms linear forwards"
                    }}
                  />
                </svg>
              )}
              {/* Diamond indicator */}
              <span
                className={`w-1.5 h-1.5 rotate-45 transition-all duration-300 ${
                  index === currentIdx ? "bg-white" : "bg-white/40 hover:bg-white/70"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
