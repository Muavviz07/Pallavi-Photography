"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X, Loader2 } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BreadcrumbsBanner from "@/components/common/BreadcrumbsBanner";

interface AwardItem {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  order_position: number;
  is_active: boolean;
}

export default function RecognitionsAndAwardsPage() {
  const [awards, setAwards] = useState<AwardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  useEffect(() => {
    async function fetchAwards() {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      try {
        const res = await fetch(`${apiUrl}/api/recognitions-and-awards/`);
        if (res.ok) {
          const data = await res.json();
          setAwards(data);
        }
      } catch (err) {
        console.error("Failed to fetch awards from backend.", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAwards();
  }, []);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (activeImageIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveImageIndex(null);
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeImageIndex, awards]);

  const handleNext = () => {
    if (activeImageIndex === null || awards.length === 0) return;
    setActiveImageIndex((prev) => (prev !== null && prev < awards.length - 1 ? prev + 1 : 0));
  };

  const handlePrev = () => {
    if (activeImageIndex === null || awards.length === 0) return;
    setActiveImageIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : awards.length - 1));
  };

  return (
    <>
      <Header />

      {/* Standardized Breadcrumbs Banner */}
      <BreadcrumbsBanner
        title="RECOGNITIONS & AWARDS"
        paths={[
          { label: "Home", href: "/" },
          { label: "Recognitions & Awards" }
        ]}
      />

      <main className="flex-1 pt-12 pb-24 bg-[#FCFAF7]">
        {/* Intro Section */}
        <div className="max-w-7xl mx-auto px-6 md:px-10 mb-16 text-left space-y-6">
          <h2 className="text-xl sm:text-2xl md:text-[28px] tracking-[0.2em] font-serif text-brand-dark uppercase font-light leading-snug">
            RECOGNITIONS & AWARDS
          </h2>
          <div className="w-12 h-[1.5px] bg-[#A3A69C] opacity-60"></div>
          <p className="text-sm text-stone-500 font-sans font-light leading-relaxed tracking-wide max-w-4xl text-justify">
            Grateful for the moments, and honored by the recognition — here are a few milestones that have shaped my journey.
          </p>
        </div>

        {/* Masonry Image Grid */}
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-8 h-8 border-2 border-[#C4A484] border-t-transparent rounded-full animate-spin text-[#C4A484]" />
              <p className="text-xs uppercase tracking-wider text-[#6E635F] font-light">Loading recognitions...</p>
            </div>
          ) : awards.length === 0 ? (
            <div className="text-center py-20 bg-[#FAF8F5] border border-[#DCD0C0]/20 rounded-sm">
              <p className="text-sm font-light text-[#6E635F]">No recognitions or awards published yet.</p>
            </div>
          ) : (
            /* Premium Native CSS Column Masonry for original aspects */
            <div className="columns-1 sm:columns-2 md:columns-3 gap-6 [column-fill:_balance] box-border">
              {awards.map((award, idx) => (
                <div
                  key={award.id}
                  onClick={() => setActiveImageIndex(idx)}
                  className="break-inside-avoid mb-6 rounded-xs overflow-hidden cursor-pointer shadow-xs group bg-[#FAF8F5] border border-[#DCD0C0]/20 transition-all duration-300 hover:shadow-md block w-full relative"
                >
                  <img
                    src={award.image_url}
                    alt={award.title}
                    className="w-full h-auto object-cover transition-transform duration-1000 ease-out scale-100 group-hover:scale-102"
                    loading="lazy"
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2C2623]/75 via-[#2C2623]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
                    <span className="text-[9px] uppercase tracking-[0.25em] text-[#C4A484] font-semibold block mb-1 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500 delay-75">
                      View Award
                    </span>
                    <h4 className="text-sm font-light font-serif text-white tracking-wide transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500 delay-100 uppercase">
                      {award.title}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Fullscreen Lightbox Modal */}
      {activeImageIndex !== null && awards.length > 0 && (
        <div 
          className="fixed inset-0 z-[100] bg-[#2C2623]/95 backdrop-blur-md flex items-center justify-center transition-all duration-300"
          onClick={() => setActiveImageIndex(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setActiveImageIndex(null)}
            className="absolute top-6 right-6 text-stone-400 hover:text-white transition-colors cursor-pointer focus:outline-none z-10"
            aria-label="Close Lightbox"
          >
            <X className="w-7 h-7" />
          </button>

          {/* Left arrow */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-4 sm:left-8 text-stone-400 hover:text-white transition-colors cursor-pointer focus:outline-none bg-black/20 p-2.5 rounded-full z-10"
            aria-label="Previous Image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Image & details container */}
          <div 
            className="max-w-[90vw] max-h-[85vh] flex flex-col items-center justify-center select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={awards[activeImageIndex].image_url}
              alt={awards[activeImageIndex].title}
              className="max-w-full max-h-[68vh] object-contain shadow-2xl animate-fade-in"
            />
            {/* Metadata underneath */}
            <div className="mt-5 text-center space-y-2 max-w-2xl px-4">
              <h4 className="text-base font-serif font-light text-white tracking-wider uppercase">
                {awards[activeImageIndex].title}
              </h4>
              {awards[activeImageIndex].description && (
                <p className="text-xs text-stone-300 font-light font-sans leading-relaxed">
                  {awards[activeImageIndex].description}
                </p>
              )}
              <span className="inline-block text-[9px] text-stone-500 font-light pt-1">
                {activeImageIndex + 1} / {awards.length}
              </span>
            </div>
          </div>

          {/* Right arrow */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-4 sm:right-8 text-stone-400 hover:text-white transition-colors cursor-pointer focus:outline-none bg-black/20 p-2.5 rounded-full z-10"
            aria-label="Next Image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}

      <Footer />
    </>
  );
}
