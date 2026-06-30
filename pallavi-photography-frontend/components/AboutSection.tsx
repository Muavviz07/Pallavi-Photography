"use client";

import React from "react";
import Link from "next/link";

export default function AboutSection() {
  return (
    <section className="py-20 bg-[#FAF8F5] border-b border-brand-border/60">
      <div className="max-w-[900px] mx-auto px-6 text-center space-y-8">
        
        {/* Header (Serif spaced uppercase title matching screenshot) */}
        <h3 className="text-base sm:text-lg tracking-[0.22em] font-serif text-brand-dark uppercase leading-relaxed" style={{ fontWeight: 400 }}>
          NEWBORN, CHILDREN, MATERNITY, FAMILY AND FINE ART <br className="hidden sm:inline" />
          PHOTOGRAPHER IN VEVEY, VAUD - SWITZERLAND.
        </h3>

        {/* Bio Body Text blocks (light grey, spaced out, centered) */}
        <div className="space-y-5 text-stone-500 font-light text-xs sm:text-[13px] leading-relaxed max-w-[850px] mx-auto">
          <p>
            Take in every little moment as they would not stay the same forever. Time flies....
          </p>
          <p>
            Hi there ! I'm Pallavi, a professional family, newborn, baby, maternity, children, fine art and nature photographer based in Vevey, Switzerland. I work with families across Lausanne, Montreux and Morges, and also welcome clients from Geneva, Fribourg and Zurich for newborn and family portraits. I specialize in capturing authentic and timeless moments — from the beauty of pregnancy to the delicate early days of your newborn, the laughter of childhood, and the peaceful charm of the natural world.
          </p>
          <p>
            Whether you're looking to document a special milestone or simply preserve everyday memories, I'm here to help you.
          </p>
          <p>
            Thank you for stopping by ! Feel free to explore my portfolio and learn more about my journey and approach to photography.
          </p>
        </div>

        {/* Muted Sage-Grey flat CTA Button */}
        <div className="flex justify-center pt-4">
          <Link
            href="/about"
            className="w-48 h-11 inline-flex items-center justify-center text-[11px] font-sans uppercase tracking-[0.25em] text-white bg-[#A3A69C] hover:bg-[#8F9288] transition-colors duration-300 cursor-pointer select-none rounded-none"
          >
            ABOUT ME
          </Link>
        </div>
        
      </div>
    </section>
  );
}
