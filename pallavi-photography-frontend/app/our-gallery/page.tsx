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

  useEffect(() => {
    const stored = localStorage.getItem("lang") || "EN";
    setLang(stored);

    const handleLangChange = () => {
      setLang(localStorage.getItem("lang") || "EN");
    };

    window.addEventListener("languagechange", handleLangChange);
    return () => window.removeEventListener("languagechange", handleLangChange);
  }, []);

  const t = pageTranslations[lang as "EN" | "FR"] || pageTranslations.EN;

  const galleryItems = [
    {
      slug: "newborn",
      title: t.newbornTitle,
      desc: t.newbornDesc,
      image: "https://images.unsplash.com/photo-1610901137736-d7cc46657b11?auto=format&fit=crop&q=80&w=1200",
    },
    {
      slug: "children",
      title: t.childrenTitle,
      desc: t.childrenDesc,
      image: "https://images.unsplash.com/photo-1624029769501-5a6cfec0d9e0?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fENoaWxkcmVuJTIwcGhvdG9zaG9vdHxlbnwwfHwwfHx8MA%3D%3D",
    },
    {
      slug: "family",
      title: t.familyTitle,
      desc: t.familyDesc,
      image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=1200",
    },
    {
      slug: "maternity",
      title: t.maternityTitle,
      desc: t.maternityDesc,
      image: "https://images.unsplash.com/photo-1615766553246-9147b6d50e90?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8TWF0ZXJuaXR5JTIwcGhvdG9zaG9vdHxlbnwwfHwwfHx8MA%3D%3D",
    },
    {
      slug: "fine-art",
      title: t.fineArtTitle,
      desc: t.fineArtDesc,
      image: "https://images.unsplash.com/photo-1637511844674-d2c52d5f29b5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8RmluZWFydCUyMHBob3Rvc2hvb3R8ZW58MHx8MHx8fDA%3D",
    },
    {
      slug: "nature",
      title: t.natureTitle,
      desc: t.natureDesc,
      image: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=1200",
    }
  ];

  return (
    <>
      <Header />

      {/* Standardized Breadcrumbs Banner */}
      <BreadcrumbsBanner
        title="OUR GALLERY"
        paths={[
          { label: "Home", href: "/" },
          { label: "Our Gallery" }
        ]}
      />

      {/* Main Content Area */}
      <section className="py-14 bg-white">
        <div className="max-w-[1200px] mx-auto px-6 md:px-10">
          
          {/* Section Heading */}
          <h1 className="text-2xl sm:text-3xl tracking-[0.25em] font-serif text-brand-dark uppercase text-left border-b border-stone-100 pb-4 mb-10">
            {t.pageHeading}
          </h1>

          {/* Gallery Items Alternating List */}
          <div className="space-y-20 md:space-y-28">
            {galleryItems.map((item, idx) => {
              const isEven = idx % 2 === 0;
              return (
                <div
                  key={item.slug}
                  className={`grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-center`}
                >
                  {/* Image Column (col-span-7 for larger display) */}
                  <div
                    className={`col-span-1 md:col-span-7 ${
                      isEven ? "md:order-1" : "md:order-2"
                    }`}
                  >
                    <Link
                      href={`/our-gallery/${item.slug}`}
                      className="group block relative aspect-3/2 overflow-hidden bg-brand-cream border border-brand-border/40 rounded-xs shadow-xs cursor-pointer"
                    >
                      <img
                        src={item.image}
                        alt={`${item.title} preview`}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out scale-100 group-hover:scale-103"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </Link>
                  </div>

                  {/* Text Column (col-span-5) */}
                  <div
                    className={`col-span-1 md:col-span-5 space-y-4 ${
                      isEven ? "md:order-2 text-left" : "md:order-1 text-left"
                    }`}
                  >
                    <h3 className="text-lg sm:text-xl md:text-2xl tracking-[0.2em] font-serif text-brand-dark uppercase">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-500 font-light leading-relaxed tracking-wide font-sans">
                      {item.desc}
                    </p>
                    <div className="pt-2">
                      <Link
                        href={`/our-gallery/${item.slug}`}
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

        </div>
      </section>

      <Footer />
    </>
  );
}
