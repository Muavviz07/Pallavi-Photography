"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { translations as staticTranslations } from "@/lib/translations";

type TranslationNamespaceData = Record<string, string>;
type TranslationData = Record<string, TranslationNamespaceData>;

interface LanguageContextType {
  lang: "EN" | "FR";
  setLang: (lang: "EN" | "FR") => void;
  translations: TranslationData;
  isLoading: boolean;
  t: (namespace: string, key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const NAMESPACES = [
  "common",
  "header",
  "footer",
  "portfolio",
  "booking",
  "blogs",
  "contact",
  "privacy",
  "recognitions"
];

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<"EN" | "FR">("EN");
  const [translations, setTranslations] = useState<TranslationData>({});
  const [isLoading, setIsLoading] = useState(true);

  // Sync state with localStorage
  useEffect(() => {
    const stored = localStorage.getItem("lang") || "EN";
    setLangState(stored as "EN" | "FR");

    const handleLangChange = () => {
      const current = localStorage.getItem("lang") || "EN";
      setLangState(current as "EN" | "FR");
    };

    window.addEventListener("languagechange", handleLangChange);
    return () => window.removeEventListener("languagechange", handleLangChange);
  }, []);

  // Fetch translation JSONs when language changes
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const loadAllNamespaces = async () => {
      const loadedData: TranslationData = {};
      
      try {
        const langLower = lang.toLowerCase();
        
        await Promise.all(
          NAMESPACES.map(async (ns) => {
            try {
              const res = await fetch(`/locales/${langLower}/${ns}.json`);
              if (res.ok) {
                const data = await res.json();
                loadedData[ns] = data;
              } else {
                loadedData[ns] = {};
              }
            } catch (e) {
              console.warn(`Failed to fetch namespace "${ns}" for language "${lang}"`, e);
              loadedData[ns] = {};
            }
          })
        );
        
        if (isMounted) {
          setTranslations(loadedData);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to load namespaces in parallel", err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadAllNamespaces();

    return () => {
      isMounted = false;
    };
  }, [lang]);

  const setLang = (nextLang: "EN" | "FR") => {
    localStorage.setItem("lang", nextLang);
    setLangState(nextLang);
    window.dispatchEvent(new Event("languagechange"));
  };

  /**
   * Synchronous translation getter that falls back gracefully.
   */
  const t = (namespace: string, key: string, fallback?: string): string => {
    // 1. Look up in dynamically loaded static JSONs
    if (translations[namespace] && translations[namespace][key] !== undefined) {
      return translations[namespace][key];
    }

    // 2. Fallback to hardcoded translations in lib/translations.ts
    const hardcoded = (staticTranslations as any)[lang]?.[key];
    if (hardcoded !== undefined) {
      return hardcoded;
    }

    // 3. Fallback to general staticTranslations (e.g. if key is lowercase and found in EN)
    const fallbackStatic = (staticTranslations as any)[lang]?.[key.charAt(0).toLowerCase() + key.slice(1)];
    if (fallbackStatic !== undefined) {
      return fallbackStatic;
    }

    // 4. Return custom fallback or key itself
    return fallback !== undefined ? fallback : key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, translations, isLoading, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Custom hook to consume translations in any component.
 */
export function useTranslation(namespace: string) {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }

  return {
    t: (key: string, fallback?: string) => context.t(namespace, key, fallback),
    lang: context.lang,
    setLang: context.setLang,
    isLoading: context.isLoading,
  };
}
