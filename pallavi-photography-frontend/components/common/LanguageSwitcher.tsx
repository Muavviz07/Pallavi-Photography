"use client";

import React, { useState, useEffect } from "react";

export default function LanguageSwitcher() {
  const [lang, setLang] = useState("EN");

  useEffect(() => {
    // Read initial language state
    const storedLang = localStorage.getItem("lang") || "EN";
    setLang(storedLang);

    // Sync with external language changes (e.g. from header)
    const handleLangChange = () => {
      setLang(localStorage.getItem("lang") || "EN");
    };

    window.addEventListener("languagechange", handleLangChange);
    return () => window.removeEventListener("languagechange", handleLangChange);
  }, []);

  const toggleLanguage = () => {
    const nextLang = lang === "EN" ? "FR" : "EN";
    localStorage.setItem("lang", nextLang);
    setLang(nextLang);
    // Dispatch event to notify all listening components to update content instantly
    window.dispatchEvent(new Event("languagechange"));
  };

  return (
    <button
      onClick={toggleLanguage}
      className="fixed bottom-6 left-6 z-50 flex items-center justify-center w-14 h-14 bg-white/80 backdrop-blur-md border border-stone-200/60 rounded-full shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300 cursor-pointer font-sans text-[11px] font-bold tracking-[0.15em] text-[#2C2623] select-none"
      aria-label="Toggle language"
    >
      <span className="transition-all duration-300 transform active:scale-95">
        {lang}
      </span>
    </button>
  );
}
