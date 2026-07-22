"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { getMediaPreviewUrl } from "@/lib/media";


interface ImageRes {
  url: string;
}

interface Gallery {
  id: string;
  name: string;
  slug: string;
  description: string;
  category?: string;
  cover_url?: string;
  cover_image?: ImageRes;
  is_active?: boolean;
  order_position?: number;
}

const CATEGORY_META: Record<string, { label: string; prefix: string; fallbackImg: string; defaultDesc: string }> = {
  newborn: {
    label: "NEWBORN",
    prefix: "01",
    fallbackImg: "https://images.unsplash.com/photo-1610901137736-d7cc46657b11?auto=format&fit=crop&q=80&w=1200",
    defaultDesc: "Cozy newborn portraiture capturing the pure details of your baby's first weeks in Vevey."
  },
  children: {
    label: "CHILDREN",
    prefix: "02",
    fallbackImg: "https://images.unsplash.com/photo-1624029769501-5a6cfec0d9e0?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fENoaWxkcmVuJTIwcGhvdG9zaG9vdHxlbnwwfHwwfHx8MA%3D%3D",
    defaultDesc: "Authentic, playful outdoor and studio milestone sessions for growing children."
  },
  family: {
    label: "FAMILY",
    prefix: "03",
    fallbackImg: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=1200",
    defaultDesc: "Natural light family gatherings capturing real connections in Swiss landscapes."
  },
  maternity: {
    label: "MATERNITY",
    prefix: "04",
    fallbackImg: "https://images.unsplash.com/photo-1615766553246-9147b6d50e90?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8TWF0ZXJuaXR5JTIwcGhvdG9zaG9vdHxlbnwwfHwwfHx8MA%3D%3D",
    defaultDesc: "Elegant and serene pregnancy portraits by Lake Geneva or conceptual studio setups."
  },
  "fine-art": {
    label: "FINE ART",
    prefix: "05",
    fallbackImg: "https://images.unsplash.com/photo-1637511844674-d2c52d5f29b5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8RmluZWFydCUyMHBob3Rvc2hvb3R8ZW58MHx8MHx8fDA%3D",
    defaultDesc: "Highly styled conceptual portraits resembling classical oil paintings."
  },
  nature: {
    label: "NATURE",
    prefix: "06",
    fallbackImg: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=1200",
    defaultDesc: "Exclusive scenery print licenses from Vaud Alps and Swiss lakes."
  }
};

const CATEGORY_META_TRANS: Record<string, Record<string, { label: string; defaultDesc: string }>> = {
  EN: {
    newborn: {
      label: "NEWBORN",
      defaultDesc: "Cozy newborn portraiture capturing the pure details of your baby's first weeks in Vevey."
    },
    children: {
      label: "CHILDREN",
      defaultDesc: "Authentic, playful outdoor and studio milestone sessions for growing children."
    },
    family: {
      label: "FAMILY",
      defaultDesc: "Natural light family gatherings capturing real connections in Swiss landscapes."
    },
    maternity: {
      label: "MATERNITY",
      defaultDesc: "Elegant and serene pregnancy portraits by Lake Geneva or conceptual studio setups."
    },
    "fine-art": {
      label: "FINE ART",
      defaultDesc: "Highly styled conceptual portraits resembling classical oil paintings."
    },
    nature: {
      label: "NATURE",
      defaultDesc: "Exclusive scenery print licenses from Vaud Alps and Swiss lakes."
    }
  },
  FR: {
    newborn: {
      label: "NOUVEAU-NÉ",
      defaultDesc: "Séances photo nouveau-né chaleureuses capturant les premiers jours de votre bébé à Vevey."
    },
    children: {
      label: "ENFANTS",
      defaultDesc: "Séances d'étape ludiques et authentiques en plein air ou en studio pour enfants."
    },
    family: {
      label: "FAMILLE",
      defaultDesc: "Réunions de famille en lumière naturelle immortalisant de vraies connexions en Suisse."
    },
    maternity: {
      label: "MATERNITÉ",
      defaultDesc: "Séances de grossesse sereines au bord du lac Léman ou configurations de studio conceptuelles."
    },
    "fine-art": {
      label: "BEAUX-ARTS",
      defaultDesc: "Portraits conceptuels très stylisés ressemblant à des peintures à l'huile classiques."
    },
    nature: {
      label: "NATURE",
      defaultDesc: "Licences d'impression de paysages exclusifs des Alpes vaudoises et des lacs suisses."
    }
  }
};

const sectionTranslations = {
  EN: {
    title: "EXPLORE THE PORTFOLIO",
    desc: "Discover newborn, maternity, children, family and fine art photography created in Vevey and across Vaud. Each session is thoughtfully styled to create timeless, elegant portraits for your family."
  },
  FR: {
    title: "DÉCOUVREZ LE PORTFOLIO",
    desc: "Découvrez des photographies de nouveau-nés, de maternité, d'enfants, de famille et d'art créées à Vevey et dans tout le canton de Vaud. Chaque séance est pensée avec soin pour créer des portraits intemporels."
  }
};

export default function ExplorePortfolioSection() {
  const [dbGalleries, setDbGalleries] = useState<Gallery[]>([]);
  const [activeSlug, setActiveSlug] = useState("");
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
    async function loadGalleries() {
      try {
        const galleries = await api.get<Gallery[]>("/galleries");
        // Filter only active ones
        const active = (galleries || []).filter((g: Gallery) => g.is_active);

        // Custom order sequence
        const REQUIRED_ORDER = ["newborn", "children", "family", "maternity", "fine-art", "nature"];
        const sorted: Gallery[] = [];

        REQUIRED_ORDER.forEach((slugPattern) => {
          const found = active.find(
            (g) => {
              const s = (g.slug || "").toLowerCase();
              return s === slugPattern || s.replace("_", "-") === slugPattern;
            }
          );
          if (found && !sorted.includes(found)) {
            sorted.push(found);
          }
        });

        active.forEach((g) => {
          if (!sorted.includes(g)) {
            sorted.push(g);
          }
        });

        setDbGalleries(sorted);
        if (sorted.length > 0) {
          setActiveSlug(sorted[0].slug);
        }
      } catch (err) {
        console.error("Failed to load portfolio galleries", err);
      }
    }
    loadGalleries();
  }, []);

  const currentDbGallery = dbGalleries.find(g => g.slug === activeSlug) || dbGalleries[0];
  const activeCategoryKey = currentDbGallery?.slug.toLowerCase().replace("_", "-") || "";
  const currentMeta = CATEGORY_META[activeCategoryKey] || {
    fallbackImg: "https://images.unsplash.com/photo-1610901137736-d7cc46657b11?auto=format&fit=crop&q=80&w=1200",
    defaultDesc: currentDbGallery?.description || ""
  };

  const getGalleryLabel = (gal: Gallery) => {
    const key = gal.slug.toLowerCase().replace("_", "-");
    const trans = CATEGORY_META_TRANS[lang as "EN" | "FR"]?.[key] || CATEGORY_META_TRANS.EN[key];
    if (trans) return trans.label;
    return gal.name.toUpperCase();
  };

  const rawImage = currentDbGallery?.cover_url || currentDbGallery?.cover_image?.url;
  const featuredImage = rawImage
    ? getMediaPreviewUrl(rawImage)
    : currentMeta.fallbackImg;


  const linkHref = currentDbGallery ? `/portfolio/${currentDbGallery.slug}` : "#";
  const sectionText = sectionTranslations[lang as "EN" | "FR"] || sectionTranslations.EN;

  if (dbGalleries.length === 0) {
    return null;
  }

  return (
    <section id="explore-portfolio" className="py-24 bg-white border-b border-brand-border/60">

      {/* Keyframe styles for slide entry and underline transitions */}
      <style>{`
        @keyframes slide-in-left-to-right {
          0% {
            transform: translateX(-30px);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>

      <div className="max-w-[1450px] mx-auto px-6 md:px-10">

        {/* Header content (reduced title size by 2 points and weight to 200/extralight) */}
        <div className="text-center mb-12 space-y-3">
          <h3 className="text-3xl sm:text-4xl lg:text-[46px] tracking-[0.25em] font-serif text-brand-dark uppercase" style={{ fontWeight: 200 }}>
            {sectionText.title}
          </h3>
          <p className="text-sm sm:text-base text-stone-500 max-w-3xl mx-auto font-sans font-light leading-relaxed">
            {sectionText.desc}
          </p>
        </div>

        {/* Categories list and Image showcase split (narrowed gap to gap-1) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-1 items-center">

          {/* Left Category Menu (space-y-6 for generous vertical space, lg:col-span-3 to narrow the text column and pull the image closer) */}
          <div className="lg:col-span-3 flex flex-col justify-center space-y-6 lg:pl-0 py-2">
            {dbGalleries.map((gal, idx) => {
              const isActive = activeSlug === gal.slug;
              const prefix = String(idx + 1).padStart(2, "0");
              const label = getGalleryLabel(gal);
              const itemLinkHref = `/portfolio/${gal.slug}`;

              return (
                <div
                  key={gal.id}
                  onMouseEnter={() => setActiveSlug(gal.slug)}
                  className="group select-none text-left block"
                >
                  {/* Category Prefix Number */}
                  <span className="text-[10px] sm:text-xs tracking-[0.25em] font-sans text-stone-400 block mb-0.5 animate-fade-in">
                    {prefix}
                  </span>

                  {/* Category Link Label with left-to-right expanding underline */}
                  <div className="inline-block">
                    <Link href={itemLinkHref}>
                      <span
                        className={`text-xl sm:text-2xl lg:text-[28px] tracking-[0.18em] font-serif uppercase transition-colors duration-300 block pb-1 relative cursor-pointer leading-none ${isActive ? "text-brand-dark font-normal" : "text-stone-400 hover:text-stone-700"
                          }`}
                      >
                        {label}
                        <span
                          className={`absolute bottom-0 left-0 h-[1.5px] bg-brand-dark transition-all duration-300 ease-out origin-left ${isActive ? "w-full scale-x-100" : "w-0 scale-x-0 group-hover:w-full group-hover:scale-x-100"
                            }`}
                        />
                      </span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Featured Image Showcase (lg:col-span-9 fills up the layout) */}
          <div className="lg:col-span-9 flex items-center">
            <Link href={linkHref} className="group block relative w-full h-[320px] sm:h-[450px] md:h-[550px] overflow-hidden bg-brand-cream border border-brand-border/60 rounded-xs shadow-xs cursor-pointer">
              <img
                key={activeSlug}
                src={featuredImage}
                alt={`${activeSlug} Collection Preview`}
                className="w-full h-full object-cover transition-transform duration-700 ease-out scale-100 group-hover:scale-103"
                style={{
                  animation: "slide-in-left-to-right 600ms cubic-bezier(0.16, 1, 0.3, 1) forwards"
                }}
                loading="eager"
              />
              <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
