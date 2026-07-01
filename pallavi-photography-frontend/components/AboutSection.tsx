"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { translations } from "@/lib/translations";

export default function AboutSection() {
  const [lang, setLang] = useState("EN");

  useEffect(() => {
    const stored = localStorage.getItem("lang") || "EN";
    setLang(stored);

    const handleLangChange = () => {
      setLang(localStorage.getItem("lang") || "EN");
    };

    window.addEventListener("languagechange", handleLangChange);
    return () => window.removeEventListener("languagechange", handleLangChange);
  }, []);

  const t = translations[lang as "EN" | "FR"] || translations.EN;

  return (
    <section className="py-20 bg-[#FAF8F5] border-b border-brand-border/60">
      <div className="max-w-[900px] mx-auto px-6 text-center space-y-8">
        
        {/* Header (Serif spaced uppercase title matching screenshot) */}
        <h3 className="text-base sm:text-lg tracking-[0.22em] font-serif text-brand-dark uppercase leading-relaxed" style={{ fontWeight: 400 }}>
          {t.aboutTitle.split(" - ")[0]} <br className="hidden sm:inline" />
          {t.aboutTitle.split(" - ")[1]}
        </h3>

        {/* Bio Body Text blocks (light grey, spaced out, centered) */}
        <div className="space-y-5 text-stone-500 font-light text-xs sm:text-[13px] leading-relaxed max-w-[850px] mx-auto">
          <p>
            {t.aboutQuote}
          </p>
          <p>
            {t.aboutBio1}
          </p>
          <p>
            {t.aboutBio2}
          </p>
          <p>
            {t.aboutBio3}
          </p>
        </div>

        {/* Muted Sage-Grey flat CTA Button */}
        <div className="flex justify-center pt-4">
          <Link
            href="/about-me"
            className="w-48 h-11 inline-flex items-center justify-center text-[11px] font-sans uppercase tracking-[0.25em] text-white bg-[#A3A69C] hover:bg-[#8F9288] transition-colors duration-300 cursor-pointer select-none rounded-none"
          >
            {t.aboutBtn}
          </Link>
        </div>
        
      </div>
    </section>
  );
}
