"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BreadcrumbsBanner from "@/components/common/BreadcrumbsBanner";

const pageTranslations = {
  EN: {
    bannerTitle: "OUR GALLERY",
    breadcrumbHome: "Home",
    breadcrumbGallery: "Our Gallery",
    pageHeading: "GALLERY",
    newbornTitle: "NEWBORN",
    newbornDesc: "Tiny toes, sleepy smiles, and soft cuddles — every newborn moment is fleeting and precious. I gently capture these early days with warmth and care, creating timeless portraits you’ll cherish forever.",
    childrenTitle: "CHILDREN",
    childrenDesc: "Tiny toes, sleepy smiles, and soft cuddles — every newborn moment is fleeting and precious. I gently capture these early days with warmth and care, creating timeless portraits you’ll cherish forever.",
    familyTitle: "FAMILY",
    familyDesc: "Every family has a unique story, and I’m here to help you tell yours. Through heartfelt and candid moments, I create portraits that reflect your love, connection, and togetherness — just as you are.",
    maternityTitle: "MATERNITY",
    maternityDesc: "Pregnancy is a beautiful chapter, filled with anticipation, emotion, and transformation. My maternity sessions highlight your strength and grace, capturing the quiet magic of life before it begins.",
    fineArtTitle: "FINE ART",
    fineArtDesc: "Fine art portraiture is where emotion meets artistry. These sessions are thoughtfully styled and carefully composed, focusing on light, texture, and expression to create images that feel painterly and refined",
    natureTitle: "NATURE",
    natureDesc: "Nature holds endless inspiration — from soft morning light to wild, untamed beauty. With an eye for simplicity and calm, I photograph the raw elegance of the natural world, just as it reveals itself.",
  },
  FR: {
    bannerTitle: "NOTRE GALERIE",
    breadcrumbHome: "Accueil",
    breadcrumbGallery: "Notre Galerie",
    pageHeading: "GALERIE",
    newbornTitle: "NOUVEAU-NÉ",
    newbornDesc: "Petits orteils, sourires endormis et doux câlins — chaque moment avec un nouveau-né est éphémère et précieux. Je capture en douceur ces premiers jours avec chaleur et soin, créant des portraits intemporels que vous chérirez pour toujours.",
    childrenTitle: "ENFANTS",
    childrenDesc: "Petits orteils, sourires endormis et doux câlins — chaque moment avec un nouveau-né est éphémère et précieux. Je capture en douceur ces premiers jours avec chaleur et soin, créant des portraits intemporels que vous chérirez pour toujours.",
    familyTitle: "FAMILLE",
    familyDesc: "Chaque famille a une histoire unique, et je suis là pour vous aider à raconter la vôtre. À travers des moments sincères et spontanés, je crée des portraits qui reflètent votre amour, votre connexion et votre complicité — tels que vous êtes.",
    maternityTitle: "MATERNITÉ",
    maternityDesc: "La grossesse est un chapitre magnifique, rempli d'attente, d'émotion et de transformation. Mes séances maternité mettent en valeur votre force et votre grâce, capturant la magie tranquille de la vie avant qu'elle ne commence.",
    fineArtTitle: "FINE ART",
    fineArtDesc: "Le portrait fine art est le lieu de rencontre entre l'émotion et l'art. Ces séances sont pensées avec soin et composées méticuleusement, mettant l'accent sur la lumière, les textures et les expressions pour créer des images dignes de tableaux.",
    natureTitle: "NATURE",
    natureDesc: "La nature recèle une inspiration infinie — de la douce lumière du matin à la beauté sauvage et indomptée. Avec un œil pour la simplicité et le calme, je photographie l'élégance brute du monde naturel, tel qu'il se révèle.",
  }
};

export default function OurGalleryIndex() {
  const [lang, setLang] = useState("EN");
  const [galleries, setGalleries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    async function loadGalleries() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/api/galleries`);
        if (res.ok) {
          const data = await res.json();
          // Filter active ones
          const active = (data || []).filter((g: any) => g.is_active);

          const REQUIRED_ORDER = ["newborn", "children", "family", "maternity", "fine-art", "nature"];
          const sorted: any[] = [];

          REQUIRED_ORDER.forEach((slugPattern) => {
            const found = active.find(
              (g: any) => {
                const s = (g.slug || "").toLowerCase();
                return s === slugPattern || s.replace("_", "-") === slugPattern;
              }
            );
            if (found && !sorted.includes(found)) {
              sorted.push(found);
            }
          });

          active.forEach((g: any) => {
            if (!sorted.includes(g)) {
              sorted.push(g);
            }
          });

          setGalleries(sorted);
        }
      } catch (err) {
        console.error("Error loading galleries:", err);
      } finally {
        setLoading(false);
      }
    }
    loadGalleries();
  }, []);

  const t = pageTranslations[lang as "EN" | "FR"] || pageTranslations.EN;

  return (
    <>
      <Header />

      {/* Standardized Breadcrumbs Banner */}
      <BreadcrumbsBanner
        title={t.bannerTitle}
        paths={[
          { label: t.breadcrumbHome, href: "/" },
          { label: t.breadcrumbGallery }
        ]}
      />

      {/* Main Content Area */}
      <section className="py-14 bg-white">
        <div className="max-w-[1200px] mx-auto px-6 md:px-10">
          
          {/* Section Heading */}
          <h1 className="text-2xl sm:text-3xl tracking-[0.25em] font-serif text-brand-dark uppercase text-left border-b border-stone-100 pb-4 mb-10">
            {t.pageHeading}
          </h1>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-brand-sage border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-xs text-stone-400 uppercase tracking-widest font-sans">
                {lang === "FR" ? "Chargement..." : "Loading Galleries..."}
              </p>
            </div>
          ) : galleries.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-sm text-stone-500 font-light font-sans tracking-wide">
                {lang === "FR" ? "Aucune galerie trouvée." : "No galleries found."}
              </p>
            </div>
          ) : (
            /* Gallery Items Alternating List */
            <div className="space-y-20 md:space-y-28">
              {galleries.map((item, idx) => {
                const isEven = idx % 2 === 0;
                const coverImage = item.cover_url || "https://images.unsplash.com/photo-1610901137736-d7cc46657b11?auto=format&fit=crop&q=80&w=1200";
                
                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-center"
                  >
                    {/* Image Column */}
                    <div
                      className={`col-span-1 md:col-span-7 ${
                        isEven ? "md:order-1" : "md:order-2"
                      }`}
                    >
                      <Link
                        href={`/portfolio/${item.slug}`}
                        className="group block relative aspect-3/2 overflow-hidden bg-brand-cream border border-brand-border/40 rounded-xs shadow-xs cursor-pointer"
                      >
                        <img
                          src={coverImage}
                          alt={`${item.name} cover`}
                          className="w-full h-full object-cover transition-transform duration-700 ease-out scale-100 group-hover:scale-103"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </Link>
                    </div>

                    {/* Text Column */}
                    <div
                      className={`col-span-1 md:col-span-5 space-y-4 ${
                        isEven ? "md:order-2 text-left" : "md:order-1 text-left"
                      }`}
                    >
                      <h3 className="text-lg sm:text-xl md:text-2xl tracking-[0.2em] font-serif text-brand-dark uppercase">
                        {item.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-stone-500 font-light leading-relaxed tracking-wide font-sans">
                        {item.description}
                      </p>
                      <div className="pt-2">
                        <Link
                          href={`/portfolio/${item.slug}`}
                          className="inline-block text-[11px] font-sans uppercase tracking-[0.25em] text-brand-dark border-b border-brand-dark/40 pb-1 hover:border-brand-dark transition-all duration-300 cursor-pointer"
                        >
                          {lang === "FR" ? "Voir la galerie" : "View Gallery"}
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </section>

      <Footer />
    </>
  );
}
