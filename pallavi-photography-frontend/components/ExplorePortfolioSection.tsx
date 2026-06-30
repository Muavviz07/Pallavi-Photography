"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
    fallbackImg: "https://images.unsplash.com/photo-1610901137736-d7cc46657b11?auto=format&fit=crop&q=80&w=1200",
    defaultDesc: "Cozy newborn portraiture capturing the pure details of your baby's first weeks in Vevey."
  },
  children: {
    label: "CHILDREN",
    prefix: "02",
    fallbackImg: "https://images.unsplash.com/photo-1481966115753-963394378f23?auto=format&fit=crop&q=80&w=1200",
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
    fallbackImg: "https://images.unsplash.com/photo-1559466273-d95e72debaf8?auto=format&fit=crop&q=80&w=1200",
    defaultDesc: "Elegant and serene pregnancy portraits by Lake Geneva or conceptual studio setups."
  },
  "fine-art": {
    label: "FINE ART",
    prefix: "05",
    fallbackImg: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=1200",
    defaultDesc: "Highly styled conceptual portraits resembling classical oil paintings."
  },
  nature: {
    label: "NATURE",
    prefix: "06",
    fallbackImg: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=1200",
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
  const linkHref = currentDbGallery ? `/our-gallery/${currentDbGallery.slug}` : `/our-gallery/${activeCategory}`;

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
        <div className="text-center mb-2 space-y-3">
          <h3 className="text-3xl sm:text-4xl lg:text-[46px] tracking-[0.25em] font-serif text-brand-dark uppercase" style={{ fontWeight: 200 }}>
            EXPLORE THE PORTFOLIO
          </h3>
          <p className="text-sm sm:text-base text-stone-500 max-w-3xl mx-auto font-sans font-light leading-relaxed">
            Discover newborn, maternity, children, family and fine art photography created in Vevey and across Vaud. Each session is thoughtfully styled to create timeless, elegant portraits for your family.
          </p>
        </div>

        {/* Categories list and Image showcase split (narrowed gap to gap-1) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-1 items-center">
          
          {/* Left Category Menu (space-y-6 for generous vertical space, lg:col-span-3 to narrow the text column and pull the image closer) */}
          <div className="lg:col-span-3 flex flex-col justify-center space-y-6 lg:pl-0 py-2">
            {Object.keys(CATEGORY_META).map((key) => {
              const meta = CATEGORY_META[key];
              const isActive = activeCategory === key;
              // Determine custom link for this specific category item
              const itemDbGallery = categoryData[key];
              const itemLinkHref = itemDbGallery ? `/our-gallery/${itemDbGallery.slug}` : `/our-gallery/${key}`;
              
              return (
                <div
                  key={key}
                  onMouseEnter={() => setActiveCategory(key)}
                  className="group select-none text-left block"
                >
                  {/* Category Prefix Number */}
                  <span className="text-[10px] sm:text-xs tracking-[0.25em] font-sans text-stone-400 block mb-0.5 animate-fade-in">
                    {meta.prefix}
                  </span>
                  
                  {/* Category Link Label with left-to-right expanding underline */}
                  <div className="inline-block">
                    <Link href={itemLinkHref}>
                      <span
                        className={`text-xl sm:text-2xl lg:text-[28px] tracking-[0.18em] font-serif uppercase transition-colors duration-300 block pb-1 relative cursor-pointer leading-none ${
                          isActive ? "text-brand-dark font-normal" : "text-stone-400 hover:text-stone-700"
                        }`}
                      >
                        {meta.label}
                        <span
                          className={`absolute bottom-0 left-0 h-[1.5px] bg-brand-dark transition-all duration-300 ease-out origin-left ${
                            isActive ? "w-full scale-x-100" : "w-0 scale-x-0 group-hover:w-full group-hover:scale-x-100"
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
                key={activeCategory}
                src={featuredImage}
                alt={`${activeCategory} Collection Preview`}
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
