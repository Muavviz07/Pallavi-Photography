"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface PathItem {
  label: string;
  href?: string;
}

interface BreadcrumbsBannerProps {
  title: string;
  paths: PathItem[];
}

export default function BreadcrumbsBanner({ title, paths }: BreadcrumbsBannerProps) {
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

  // Simple localized translations for common breadcrumb names
  const translateLabel = (label: string) => {
    if (lang === "FR") {
      if (label.toUpperCase() === "HOME") return "Accueil";
      if (label.toUpperCase() === "OUR GALLERY") return "Notre Galerie";
      if (label.toUpperCase() === "OUR BLOGS") return "Notre Blog";
      if (label.toUpperCase() === "GALLERY") return "Galerie";
      if (label.toUpperCase() === "ABOUT") return "À Propos";
      if (label.toUpperCase() === "CONTACT") return "Contact";
      if (label.toUpperCase() === "PRICING") return "Tarifs";
    }
    return label;
  };

  const translateTitle = (titleText: string) => {
    if (lang === "FR") {
      if (titleText.toUpperCase() === "OUR GALLERY") return "NOTRE GALERIE";
      if (titleText.toUpperCase() === "OUR BLOGS") return "NOTRE BLOG";
      if (titleText.toUpperCase() === "PRICING") return "NOS TARIFS";
      if (titleText.toUpperCase() === "ABOUT") return "À PROPOS DE NOUS";
      if (titleText.toUpperCase() === "CONTACT") return "CONTACTEZ-NOUS";
    }
    return titleText;
  };

  return (
    <section 
      style={{
        background: "linear-gradient(90deg, #372E40 0%, #523F5C 50%, #302838 100%)"
      }}
      className="text-white py-10 md:py-12 border-b border-white/5 relative z-10"
    >
      <div className="max-w-[1300px] mx-auto px-6 md:px-10 flex flex-row justify-between items-center whitespace-nowrap">
        {/* Left Side: Page Title */}
        <h2 className="text-sm sm:text-base md:text-[17px] font-serif font-light tracking-[0.25em] uppercase text-white">
          {translateTitle(title)}
        </h2>

        {/* Right Side: Breadcrumbs */}
        <div className="text-xs sm:text-sm md:text-[15px] font-serif italic text-stone-200/90 tracking-wide flex items-center space-x-1.5 select-none">
          {paths.map((path, idx) => {
            const isLast = idx === paths.length - 1;
            const translatedText = translateLabel(path.label);
            
            return (
              <React.Fragment key={idx}>
                {path.href && !isLast ? (
                  <Link href={path.href} className="hover:text-white transition-colors duration-200">
                    {translatedText}
                  </Link>
                ) : (
                  <span className={isLast ? "text-white/100" : ""}>{translatedText}</span>
                )}
                {!isLast && <span className="text-white/40 text-xs sm:text-sm not-italic">/</span>}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
}
