"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface AboutData {
  title: string;
  quote: string;
  bio_text: string;
  awards_text: string;
  image_url?: string;
}

export default function AboutSection() {
  const [data, setData] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAbout() {
      try {
        const res = await api.get<AboutData>("/about");
        setData(res);
      } catch (err) {
        console.error("Failed to load home about details", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAbout();
  }, []);

  const quote = data?.quote || "Take in every little moment as they would not stay the same forever. Time flies....";
  const bioPreview = data?.bio_text
    ? data.bio_text.slice(0, 300) + "..."
    : "I believe that photography is a gentle art. It is about documenting real, unscripted love, natural connections, and quiet moments. Based in Switzerland, I specialize in fine art newborn setups, maternity storytelling, and outdoor family collections...";

  return (
    <section className="py-24 bg-brand-bg border-b border-brand-border">
      <div className="max-w-[800px] mx-auto px-6 text-center space-y-10">
        
        {/* Subtitle Eyebrow label */}
        <span className="text-[10px] uppercase tracking-[0.3em] text-brand-sage font-semibold block">
          Welcome to the Studio
        </span>

        {/* Heading serif */}
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-light tracking-wide font-serif text-brand-dark uppercase leading-tight">
          Newborn, Children, Maternity, Family and Fine Art Photographer in Vevey, Vaud – Switzerland.
        </h3>

        {/* Hairline spacer */}
        <div className="w-12 h-[1px] bg-brand-sage/40 mx-auto"></div>

        {/* Quote italic block */}
        <div className="max-w-xl mx-auto italic font-serif text-brand-muted text-sm leading-relaxed">
          "{quote}"
        </div>

        {/* Short biography preview */}
        <p className="text-sm text-brand-muted leading-relaxed font-light">
          {bioPreview}
        </p>

        {/* CTA Button styled as: flat design, sage green background, serif uppercase text, 2px border on hover */}
        <div className="pt-4">
          <Link
            href="/about"
            className="inline-block bg-brand-sage hover:bg-transparent text-white hover:text-brand-sage border-2 border-brand-sage px-10 py-3.5 text-xs font-serif uppercase tracking-widest transition-all duration-300 font-medium rounded-sm"
          >
            About Me
          </Link>
        </div>
      </div>
    </section>
  );
}
