"use client";

import { usePathname } from "next/navigation";
import { useTranslation } from "./LanguageProvider";
import styles from "./LanguageToggle.module.css";

export default function LanguageToggle() {
  const pathname = usePathname();
  const { lang, setLang } = useTranslation("common");

  // Hide on admin panel routes and login screen
  if (pathname?.startsWith("/delq-portal") || pathname?.startsWith("/login")) {
    return null;
  }

  const toggleLanguage = () => {
    setLang(lang === "EN" ? "FR" : "EN");
  };

  return (
    <div className={styles.languageToggle}>
      <button 
        onClick={toggleLanguage}
        className={`${styles.toggleContainer} ${lang === "FR" ? styles.frActive : styles.enActive}`}
        aria-label={`Switch language. Current language: ${lang === "EN" ? "English" : "French"}`}
      >
        {/* Text label displayed in uppercase */}
        <span className={`${styles.labelText} ${lang === "FR" ? styles.labelLeft : styles.labelRight}`}>
          {lang}
        </span>
        
        {/* Sliding circular knob containing custom vector SVG flags */}
        <div 
          className={styles.flagKnob}
          style={{ left: lang === "EN" ? "4px" : "calc(100% - 42px)" }}
        >
          {lang === "EN" ? (
            <svg viewBox="0 0 60 60" className={styles.flagSvg}>
              {/* Blue background */}
              <circle cx="30" cy="30" r="30" fill="#012169" />
              {/* White diagonal cross */}
              <path d="M0,0 L60,60 M60,0 L0,60" stroke="#ffffff" strokeWidth="6" />
              {/* Red diagonal cross */}
              <path d="M0,0 L60,60 M60,0 L0,60" stroke="#C8102E" strokeWidth="3.5" />
              {/* White vertical/horizontal cross */}
              <path d="M30,0 L30,60 M0,30 L60,30" stroke="#ffffff" strokeWidth="10" />
              {/* Red vertical/horizontal cross */}
              <path d="M30,0 L30,60 M0,30 L60,30" stroke="#C8102E" strokeWidth="6" />
            </svg>
          ) : (
            <svg viewBox="0 0 60 60" className={styles.flagSvg}>
              <circle cx="30" cy="30" r="30" fill="#ffffff" />
              <clipPath id="circle-clip">
                <circle cx="30" cy="30" r="30" />
              </clipPath>
              <g clipPath="url(#circle-clip)">
                <rect x="0" y="0" width="20" height="60" fill="#00209F" />
                <rect x="20" y="0" width="20" height="60" fill="#FFFFFF" />
                <rect x="40" y="0" width="20" height="60" fill="#F42A41" />
              </g>
            </svg>
          )}
          {/* Spherical glossy overlay for 3D bubble effect */}
          <div className={styles.glassOverlay} />
        </div>
      </button>
    </div>
  );
}
