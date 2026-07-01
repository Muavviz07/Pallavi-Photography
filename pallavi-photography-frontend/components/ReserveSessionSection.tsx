"use client";

import React, { useEffect, useState } from "react";
import { translations } from "@/lib/translations";

export default function ReserveSessionSection() {
  const [offsetY, setOffsetY] = useState(0);
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

  useEffect(() => {
    const section = document.getElementById("reserve-session-section");
    if (!section) return;

    function handleScroll() {
      const rect = section.getBoundingClientRect();
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      // Calculate scroll progress when section is entering / in viewport
      const scrolled = scrollTop - (rect.top + scrollTop - window.innerHeight);
      if (scrolled > 0) {
        setOffsetY(scrolled * 0.22); // Elegant parallax coefficient
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial load run
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollToContact = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById("contact");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const t = translations[lang as "EN" | "FR"] || translations.EN;

  return (
    <section
      id="reserve-session-section"
      className="relative h-[85vh] w-full flex items-center justify-center overflow-hidden border-y border-brand-border/60"
    >
      {/* Background Image with Parallax Scroll Effect */}
      <div className="absolute inset-0 z-0">
        <div
          className="w-full h-[155%] absolute -top-[30%] left-0"
          style={{
            transform: `translateY(${offsetY}px)`,
            backgroundImage: "url('https://images.unsplash.com/photo-1625850864219-585a0e8fac0e?auto=format&fit=crop&q=80&w=1920')",
            backgroundSize: "cover",
            backgroundPosition: "center 35%"
          }}
        />
        {/* Dark opacity overlay to ensure readability of white text */}
        <div className="absolute inset-0 bg-black/55 z-10" />
      </div>

      {/* Content overlay */}
      <div className="relative z-20 text-center max-w-4xl px-6 space-y-6">

        {/* Serif Spaced Title */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[50px] font-light tracking-[0.25em] font-serif text-white uppercase drop-shadow-sm">
          {t.reserveSectionTitle}
        </h2>

        {/* Serif Italic description paragraph matching reference image */}
        <p className="text-sm sm:text-base font-serif italic text-stone-200 tracking-wide max-w-2xl mx-auto leading-relaxed">
          {t.reserveSectionDesc}
        </p>

        {/* Outline transparent white button matching reference screenshot */}
        <div className="pt-6">
          <a
            href="#contact"
            onClick={handleScrollToContact}
            className="inline-flex items-center justify-center border border-white/60 hover:border-white text-white text-[11px] font-sans uppercase tracking-[0.25em] px-8 py-3.5 transition-all duration-300 hover:bg-white/5 cursor-pointer rounded-none select-none"
          >
            {t.reserveSectionBtn}
          </a>
        </div>

      </div>
    </section>
  );
}
