"use client";

import React, { useEffect, useState } from "react";

export default function ReserveSessionSection() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    function handleScroll() {
      setScrollY(window.scrollY);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollToContact = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById("contact");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Parallax transform calculation
  const yOffset = scrollY * 0.15;

  return (
    <section className="relative h-[60vh] w-full flex items-center justify-center overflow-hidden border-y border-brand-border">
      {/* Background Image with Parallax Scroll Effect */}
      <div className="absolute inset-0 z-0">
        <div
          className="w-full h-[120%] absolute -top-[10%] left-0"
          style={{
            transform: `translateY(${yOffset}px)`,
            backgroundImage: "url('https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=1920')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        />
        {/* Scrim Overlay */}
        <div className="absolute inset-0 bg-brand-dark/45" />
      </div>

      {/* Content overlay */}
      <div className="relative z-10 text-center max-w-3xl px-6 space-y-6">
        <span className="text-[10px] uppercase tracking-[0.3em] text-white/90 font-semibold block">
          Limited Monthly Slots Available
        </span>
        
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-wide font-serif text-white uppercase">
          Reserve Your Session
        </h2>
        
        <p className="text-xs sm:text-sm text-stone-200 font-light tracking-wider max-w-xl mx-auto leading-relaxed uppercase">
          Whether you're looking to book a session, ask a question, or just say hello — I'd love to hear from you. Every story is unique, and I'm here to help you capture yours in the most beautiful way.
        </p>

        <div className="pt-4">
          <a
            href="#contact"
            onClick={handleScrollToContact}
            className="inline-block bg-brand-sage hover:bg-transparent text-white hover:text-brand-sage border-2 border-brand-sage px-10 py-3.5 text-xs font-serif uppercase tracking-widest transition-all duration-300 font-medium rounded-sm"
          >
            Get In Touch
          </a>
        </div>
      </div>
    </section>
  );
}
