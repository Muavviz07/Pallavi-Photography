"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

interface ImageRes {
  url: string;
}

interface Gallery {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  cover_image?: ImageRes;
}

const CATEGORY_META: Record<string, { label: string; prefix: string; fallbackImg: string; defaultDesc: string }> = {
  newborn: {
    label: "NEWBORN",
    prefix: "01",
    fallbackImg: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=800",
    defaultDesc: "Cozy newborn portraiture capturing the pure details of your baby's first weeks in Vevey."
  },
  children: {
    label: "CHILDREN",
    prefix: "02",
    fallbackImg: "https://images.unsplash.com/photo-1476703719129-8eb99415f6e8?auto=format&fit=crop&q=80&w=800",
    defaultDesc: "Authentic, playful outdoor and studio milestone sessions for growing children."
  },
  family: {
    label: "FAMILY",
    prefix: "03",
    fallbackImg: "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=800",
    defaultDesc: "Natural light family gatherings capturing real connections in Swiss landscapes."
  },
  maternity: {
    label: "MATERNITY",
    prefix: "04",
    fallbackImg: "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=800",
    defaultDesc: "Elegant and serene pregnancy portraits by Lake Geneva or conceptual studio setups."
  },
  "fine-art": {
    label: "FINE ART",
    prefix: "05",
    fallbackImg: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=800",
    defaultDesc: "Highly styled conceptual portraits resembling classical oil paintings."
  },
  nature: {
    label: "NATURE",
    prefix: "06",
    fallbackImg: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=800",
    defaultDesc: "Exclusive scenery print licenses from Vaud Alps and Swiss lakes."
  }
};

export default function ExplorePortfolioSection() {
  const [activeCategory, setActiveCategory] = useState("newborn");
  const [categoryData, setCategoryData] = useState<Record<string, Gallery>>({});

  useEffect(() => {
    async function loadGalleries() {
      try {
        const galleries = await api.get<Gallery[]>("/galleries");
        const mapped: Record<string, Gallery> = {};
        
        // Group galleries to pick the first published one for each category
        galleries.forEach((gal) => {
          const cat = gal.category.toLowerCase();
          if (!mapped[cat]) {
            mapped[cat] = gal;
          }
        });
        setCategoryData(mapped);
      } catch (err) {
        console.error("Failed to load portfolio galleries", err);
      }
    }
    loadGalleries();
  }, []);

  const currentMeta = CATEGORY_META[activeCategory];
  const currentDbGallery = categoryData[activeCategory];
  const featuredImage = currentDbGallery?.cover_image?.url || currentMeta.fallbackImg;
  const description = currentDbGallery?.description || currentMeta.defaultDesc;
  const linkHref = currentDbGallery ? `/our-gallery/${currentDbGallery.slug}` : `/our-gallery/${activeCategory}`;

  return (
    <section id="explore-portfolio" className="py-24 bg-brand-bg border-b border-brand-border">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12">
        
        {/* Header content */}
        <div className="text-center md:text-left mb-16 space-y-4">
          <span className="text-[10px] uppercase tracking-[0.3em] text-brand-sage font-semibold block">
            Curated Collections
          </span>
          <h3 className="text-3xl sm:text-4xl font-light tracking-wide font-serif text-brand-dark uppercase">
            Explore the Portfolio
          </h3>
          <p className="text-xs text-brand-muted max-w-xl font-light leading-relaxed">
            Discover newborn, maternity, children, family and fine art photography created in Vevey and across Vaud...
          </p>
        </div>

        {/* Categories list and Image showcase split */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          
          {/* Left Category Menu */}
          <div className="md:col-span-5 space-y-4">
            {Object.keys(CATEGORY_META).map((key) => {
              const meta = CATEGORY_META[key];
              const isActive = activeCategory === key;
              return (
                <div
                  key={key}
                  onMouseEnter={() => setActiveCategory(key)}
                  onClick={() => setActiveCategory(key)}
                  className={`group cursor-pointer border-l-2 pl-6 py-2.5 transition-all duration-300 ${
                    isActive
                      ? "border-brand-sage bg-brand-cream/45"
                      : "border-transparent hover:border-brand-sage/40"
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-widest text-brand-sage block font-semibold mb-1">
                    {meta.prefix} {meta.label}
                  </span>
                  <h4 className={`text-lg font-light tracking-widest font-serif transition-colors duration-200 uppercase ${
                    isActive ? "text-brand-dark" : "text-brand-muted group-hover:text-brand-dark"
                  }`}>
                    {meta.label} COLLECTION
                  </h4>
                  {isActive && (
                    <div className="mt-3 space-y-4 animate-fade-in">
                      <p className="text-xs text-brand-muted leading-relaxed font-light">
                        {description}
                      </p>
                      <Link
                        href={linkHref}
                        className="inline-flex items-center space-x-2 text-[10px] uppercase tracking-widest text-brand-sage font-semibold hover:text-brand-dark transition-colors duration-150"
                      >
                        <span>View Gallery</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Featured Image Showcase */}
          <div className="md:col-span-7 relative h-[480px] w-full rounded-xs overflow-hidden shadow-2xl group border border-brand-border bg-brand-cream">
            <img
              src={featuredImage}
              alt={`${activeCategory} Collection Preview`}
              className="w-full h-full object-cover transition-transform duration-700 ease-out scale-100 group-hover:scale-103"
            />
            {/* Soft decorative shadow overlay */}
            <div className="absolute inset-0 bg-brand-dark/5" />
          </div>

        </div>
      </div>
    </section>
  );
}
