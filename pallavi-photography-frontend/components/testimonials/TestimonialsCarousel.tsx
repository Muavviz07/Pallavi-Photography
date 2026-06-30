"use client";

import React, { useState, useEffect } from "react";

interface TestimonialData {
  id?: string;
  author: string;
  role?: string;
  text: string;
  rating?: number;
  category?: string;
}

const STATIC_TESTIMONIALS: TestimonialData[] = [
  {
    text: "Pallavi has a magical gift with newborns. She handled our 10-day-old son with such gentle care. The portraits are emotional, minimalist, and absolutely beautiful.",
    author: "Elena & Marc S.",
    role: "Zürich, Switzerland"
  },
  {
    text: "The maternity session was a dream. Pallavi helped style the outfits and made me feel so confident and beautiful. We will cherish these pictures forever.",
    author: "Sophie B.",
    role: "Geneva, Switzerland"
  },
  {
    text: "We did a family sunset shoot in the Alps. Pallavi managed to capture our kids' wild spirits perfectly. The lighting, composition, and emotional warmth are perfect.",
    author: "The Keller Family",
    role: "Lucerne, Switzerland"
  }
];

export default function TestimonialsCarousel({ category }: { category?: string }) {
  const [testimonials, setTestimonials] = useState<TestimonialData[]>(STATIC_TESTIMONIALS);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const queryParams = category ? `?category=${category}` : "";
        const res = await fetch(`${apiUrl}/api/testimonials${queryParams}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setTestimonials(data);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch testimonials from backend, falling back to static", err);
      }
    };
    fetchTestimonials();
  }, [category]);

  // Auto-slide testimonials
  useEffect(() => {
    if (testimonials.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [testimonials]);

  if (testimonials.length === 0) return null;

  const current = testimonials[currentIndex];

  return (
    <div className="max-w-4xl mx-auto px-6 text-center relative">
      <span className="text-[11px] uppercase tracking-[0.25em] text-brand-sage font-semibold block mb-2">
        TESTIMONIALS
      </span>
      <h3 className="text-xl sm:text-2xl font-serif text-brand-dark uppercase tracking-[0.15em] block mb-8" style={{ fontWeight: 300 }}>
        What Our Clients Say
      </h3>

      <div className="min-h-[120px] flex items-center justify-center">
        <div className="space-y-4 animate-fade-in transition-opacity duration-300">
          <p className="text-lg md:text-xl font-light font-serif italic leading-relaxed text-brand-dark">
            "{current.text}"
          </p>
        </div>
      </div>

      {testimonials.length > 1 && (
        <div className="flex items-center justify-center space-x-2.5 mt-8">
          {testimonials.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-1.5 h-1.5 rounded-full cursor-pointer transition-all duration-300 ${
                idx === currentIndex ? "bg-brand-dark w-4" : "bg-stone-200 hover:bg-stone-300"
              }`}
              aria-label={`Go to testimonial ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
