"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X, Loader2 } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BreadcrumbsBanner from "@/components/common/BreadcrumbsBanner";

const FALLBACK_IMAGES: Record<string, Array<{ id: string; url: string; title: string; altText: string; aspect?: string }>> = {
  newborn: [
    { id: "1", url: "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=800", title: "Sweet Dreamer", altText: "Sleeping newborn baby wrapped in cream blanket", aspect: "large_square" },
    { id: "2", url: "https://images.unsplash.com/photo-1544126592-807adc26cc7d?auto=format&fit=crop&q=80&w=800", title: "Tiny Hands", altText: "Close-up of newborn baby's hands holding father's finger", aspect: "large_portrait" },
    { id: "3", url: "https://images.unsplash.com/photo-1537673172765-a45f94de8b8f?auto=format&fit=crop&q=80&w=800", title: "Peaceful Sleep", altText: "Newborn baby sleeping soundly on woolly wrap", aspect: "square" },
    { id: "4", url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=800", title: "Delicate Details", altText: "Macro shot of sleeping newborn toes", aspect: "wide_landscape" },
    { id: "5", url: "https://images.unsplash.com/photo-1515488042361-404e9250afef?auto=format&fit=crop&q=80&w=800", title: "Newborn Smile", altText: "Newborn baby smiling faintly in sleep", aspect: "portrait" }
  ],
  children: [
    { id: "1", url: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=800", title: "Pure Joy", altText: "Young child smiling in sunlit meadow", aspect: "large_square" },
    { id: "2", url: "https://images.unsplash.com/photo-1471286174240-e6458e7d5a73?auto=format&fit=crop&q=80&w=800", title: "Little Explorer", altText: "Toddler looking down at flowers outdoors", aspect: "portrait" },
    { id: "3", url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=800", title: "Childhood Wonder", altText: "Little boy playing with bubbles", aspect: "square" },
    { id: "4", url: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&q=80&w=800", title: "Warm Smile", altText: "Young girl portrait outdoors", aspect: "wide_landscape" },
    { id: "5", url: "https://images.unsplash.com/photo-1481959110741-1963ea9cc6f6?auto=format&fit=crop&q=80&w=800", title: "Carefree Days", altText: "Child running in grassy field", aspect: "large_portrait" }
  ],
  maternity: [
    { id: "1", url: "https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?auto=format&fit=crop&q=80&w=800", title: "Silhouette in Light", altText: "Maternity studio silhouette portrait", aspect: "large_portrait" },
    { id: "2", url: "https://images.unsplash.com/photo-1517164850305-99a3e65bb47e?auto=format&fit=crop&q=80&w=800", title: "Motherly Glow", altText: "Pregnant mother smiling in outdoor meadow", aspect: "square" },
    { id: "3", url: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=800", title: "Quiet Expectation", altText: "Pregnant mother looking down tenderly holding belly", aspect: "portrait" },
    { id: "4", url: "https://images.unsplash.com/photo-1551817958-c5b51e7b9a79?auto=format&fit=crop&q=80&w=800", title: "Gown in the Breeze", altText: "Maternity portrait with flowing white dress", aspect: "wide_landscape" },
    { id: "5", url: "https://images.unsplash.com/photo-1563804870-fb9dfc823611?auto=format&fit=crop&q=80&w=800", title: "Golden Hour Bump", altText: "Close-up of maternity hands in heart shape on belly", aspect: "large_square" }
  ],
  family: [
    { id: "1", url: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=800", title: "Golden Hugs", altText: "Family group hugging outdoors in field at sunset", aspect: "wide_landscape" },
    { id: "2", url: "https://images.unsplash.com/photo-1609234656388-0ff363383899?auto=format&fit=crop&q=80&w=800", title: "Laughter in Nature", altText: "Parents and two young daughters laughing together", aspect: "large_square" },
    { id: "3", url: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=800", title: "A Mother's Love", altText: "Mother holding daughter while father plays in background", aspect: "portrait" },
    { id: "4", url: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=800", title: "Sunset Stroll", altText: "Family walking hand-in-hand in open landscape", aspect: "panoramic" },
    { id: "5", url: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=800", title: "Forehead Kiss", altText: "Mother kissing child on the forehead in bright daylight", aspect: "large_portrait" }
  ],
  "fine-art": [
    { id: "1", url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800", title: "The Portrait", altText: "Artistic close-up female portrait with soft lighting", aspect: "large_portrait" },
    { id: "2", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800", title: "Classic Light", altText: "Moody studio portrait with classical warm tones", aspect: "large_square" },
    { id: "3", url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800", title: "Reflective Gaze", altText: "Male fine art portrait looking thoughtful", aspect: "portrait" },
    { id: "4", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=800", title: "Monochrome Study", altText: "Black and white fine art studio portrait", aspect: "wide_landscape" },
    { id: "5", url: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=800", title: "Dreamy Textures", altText: "Soft focus portrait in natural environment", aspect: "square" }
  ],
  nature: [
    { id: "1", url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=800", title: "Swiss Horizons", altText: "Alpine mountain range during golden hour", aspect: "panoramic" },
    { id: "2", url: "https://images.unsplash.com/photo-1472214222541-d510753a49fa?auto=format&fit=crop&q=80&w=800", title: "Serene Valleys", altText: "Lush green valley in the Swiss Alps", aspect: "large_square" },
    { id: "3", url: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&q=80&w=800", title: "Forest Paths", altText: "Wooden bridge inside sunlit mossy forest", aspect: "wide_landscape" },
    { id: "4", url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=800", title: "Morning Mist", altText: "Misty mountain peaks surrounded by clouds", aspect: "large_portrait" },
    { id: "5", url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800", title: "Sun Beams", altText: "Sun rays piercing through giant pine trees", aspect: "portrait" }
  ]
};

interface GalleryImage {
  id: string;
  url: string;
  title: string;
  altText: string;
  aspect?: string;
}

export default function DynamicPortfolioPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = React.use(params);
  const slug = resolvedParams.slug;
  const categoryKey = slug.toLowerCase();

  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [lang, setLang] = useState("EN");
  const [galleryTitle, setGalleryTitle] = useState("");
  const [galleryDescription, setGalleryDescription] = useState("");

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
    async function fetchGalleryDetails() {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      try {
        const res = await fetch(`${apiUrl}/api/galleries/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setGalleryTitle(data.name);
          setGalleryDescription(data.description || "");
          
          if (data.images && data.images.length > 0) {
            const formatted = data.images.map((img: any, idx: number) => {
              const aspectPatterns = ["square", "portrait", "landscape", "square", "large_portrait", "wide_landscape"];
              const aspect = aspectPatterns[idx % aspectPatterns.length];
              return {
                id: img.id,
                url: img.url,
                title: `${data.name} - Frame ${idx + 1}`,
                altText: `${data.name} portfolio showcase image`,
                aspect: aspect
              };
            });
            setImages(formatted);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Failed to fetch dynamic gallery from backend, using fallbacks.", err);
      }

      const fallbacksMeta: Record<string, { title: string; description: string }> = {
        newborn: {
          title: "Newborn Photographer in Vevey, Vaud",
          description: "Welcome to the Newborn Photography Gallery — a collection of gentle, timeless portraits capturing the very first days of life. Each photo captures your baby's tiny details, sweet moments in a calm, comfortable, and thoughtfully styled session."
        },
        children: {
          title: "Children Photographer in Vevey, Vaud",
          description: "Welcome to the Children Photography Gallery — a place to see the joy, curiosity, and personality of little ones at every stage. Each image captures genuine smiles, playful moments, and the unique spark that makes every child special."
        },
        maternity: {
          title: "Maternity Photographer in Vevey, Vaud",
          description: "Welcome to the Maternity Photography Gallery — celebrating the beauty, anticipation, and emotion of pregnancy. Each portrait captures the glow, connection, and love of this special time."
        },
        family: {
          title: "Family Photographer in Vevey, Vaud",
          description: "Welcome to the Family Photography Gallery — a collection of moments that celebrate connection, joy, and togetherness. Each session captures laughter, love, and the small, everyday details that make your family unique."
        },
        "fine-art": {
          title: "Fine Art Photographer in Vevey, Vaud",
          description: "Welcome to the Fine Art Portraits Gallery — a collection of expressive, timeless images crafted with creativity and emotion. Each portrait is a collaborative work of art, reflecting your personality and story."
        },
        nature: {
          title: "Nature Photographer in Vevey, Vaud",
          description: "Welcome to the Nature Portraits Gallery — a collection of quiet moments, natural light, and the raw beauty of Swiss landscapes. Each photograph captures the serene details of the flora, mountains, and wilderness."
        }
      };

      const meta = fallbacksMeta[categoryKey] || {
        title: slug.charAt(0).toUpperCase() + slug.slice(1) + " Portfolio",
        description: "Explore our collection of high-resolution professional photography."
      };

      setGalleryTitle(meta.title);
      setGalleryDescription(meta.description);
      setImages(FALLBACK_IMAGES[categoryKey] || []);
      setLoading(false);
    }

    fetchGalleryDetails();
  }, [slug, categoryKey]);

  useEffect(() => {
    if (activeImageIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveImageIndex(null);
      if (e.key === "ArrowRight") handleNextImage();
      if (e.key === "ArrowLeft") handlePrevImage();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeImageIndex, images]);

  const handleNextImage = () => {
    if (activeImageIndex === null || images.length === 0) return;
    setActiveImageIndex((prev) => (prev !== null && prev < images.length - 1 ? prev + 1 : 0));
  };

  const handlePrevImage = () => {
    if (activeImageIndex === null || images.length === 0) return;
    setActiveImageIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : images.length - 1));
  };

  const bannerTitle = galleryTitle ? galleryTitle.toUpperCase() : "PORTFOLIO";

  return (
    <>
      <Header />

      <BreadcrumbsBanner
        title={bannerTitle}
        paths={[
          { label: lang === "FR" ? "Accueil" : "Home", href: "/" },
          { label: lang === "FR" ? "Galerie" : "Our Gallery", href: "/our-gallery" },
          { label: slug.charAt(0).toUpperCase() + slug.slice(1) }
        ]}
      />
      
      <main className="flex-1 pt-14 pb-24 bg-[#FCFAF7]">
        <div className="max-w-7xl mx-auto px-6 md:px-10 mb-16 text-left space-y-6 animate-fade-in">
          <h2 className="text-xl sm:text-2xl md:text-[28px] tracking-[0.2em] font-serif text-brand-dark uppercase font-light leading-snug">
            {galleryTitle.toUpperCase()}
          </h2>
          
          <div className="w-12 h-[1.5px] bg-[#A3A69C] opacity-60"></div>
          
          <div className="space-y-5 text-sm text-stone-500 font-sans font-light leading-relaxed tracking-wide text-justify">
            {galleryDescription.split("\n\n").map((para, idx) => {
              const isLead = idx === 0;
              return (
                <p key={idx} className={isLead ? "text-stone-600 font-normal text-base leading-relaxed" : ""}>
                  {para}
                </p>
              );
            })}
          </div>

          <div className="pt-4 flex items-center">
            <Link
              href={`/pricing`}
              className="inline-flex items-center space-x-2 text-[11px] font-sans uppercase tracking-[0.25em] text-[#8F9288] hover:text-[#7D8076] border-b border-[#8F9288]/40 hover:border-[#7D8076] pb-1 transition-all duration-300 cursor-pointer"
            >
              <span>{lang === "FR" ? "Voir les tarifs" : "View Package Details"}</span>
              <span className="text-xs">→</span>
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-8 h-8 border-2 border-brand-sage border-t-transparent rounded-full animate-spin text-brand-sage" />
              <p className="text-xs uppercase tracking-wider text-stone-400 font-light">Loading Portfolio...</p>
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-20 bg-white border border-brand-border/40 rounded-xs shadow-xs">
              <p className="text-sm font-light text-stone-500">This portfolio gallery is currently empty.</p>
              <Link href="/our-gallery" className="mt-4 inline-block text-xs uppercase tracking-widest text-brand-sage font-medium underline">
                Return to Gallery Index
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 grid-flow-row-dense">
              {images.map((img, idx) => {
                const getAspectClass = (aspect?: string) => {
                  switch (aspect) {
                    case "large_square":
                      return "col-span-1 sm:col-span-2 aspect-square";
                    case "large_portrait":
                      return "col-span-1 aspect-[3/5]";
                    case "wide_landscape":
                      return "col-span-1 sm:col-span-2 aspect-[16/9]";
                    case "panoramic":
                      return "col-span-1 sm:col-span-2 lg:col-span-3 aspect-[21/9]";
                    case "portrait":
                      return "col-span-1 aspect-[3/4]";
                    case "landscape":
                      return "col-span-1 aspect-[3/2]";
                    case "square":
                    default:
                      return "col-span-1 aspect-square";
                  }
                };
                const aspectClass = getAspectClass(img.aspect);
                return (
                  <div
                    key={img.id}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative rounded-xs overflow-hidden cursor-pointer shadow-xs group bg-white border border-brand-border/40 transition-all duration-300 hover:shadow-md animate-fade-in block w-full ${aspectClass}`}
                  >
                    <img
                      src={img.url}
                      alt={img.altText}
                      className="w-full h-full object-cover transition-transform duration-1000 ease-out scale-100 group-hover:scale-102"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
                      <span className="text-[9px] uppercase tracking-[0.25em] text-brand-sage font-semibold block mb-1 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500 delay-75">
                        View Frame
                      </span>
                      <h4 className="text-sm font-light font-serif text-white tracking-wide transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500 delay-100">
                        {img.title}
                      </h4>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {activeImageIndex !== null && images.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-between p-4 sm:p-8 animate-fade-in">
          <div className="w-full flex items-center justify-between text-white/70 text-xs tracking-widest font-sans font-light">
            <span>
              {activeImageIndex + 1} / {images.length}
            </span>
            <button
              onClick={() => setActiveImageIndex(null)}
              className="p-2 text-white hover:text-brand-sage transition-colors duration-200 cursor-pointer"
              aria-label="Close lightbox"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="relative flex-1 w-full max-h-[80vh] flex items-center justify-center">
            <button
              onClick={handlePrevImage}
              className="absolute left-0 sm:left-4 z-10 p-3 text-white/50 hover:text-white transition-colors duration-200 cursor-pointer bg-black/20 rounded-full"
              aria-label="Previous frame"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <img
              src={images[activeImageIndex].url}
              alt={images[activeImageIndex].altText}
              className="max-w-full max-h-[75vh] object-contain shadow-2xl rounded-xs animate-fade-in transition-all duration-300 select-none"
            />

            <button
              onClick={handleNextImage}
              className="absolute right-0 sm:right-4 z-10 p-3 text-white/50 hover:text-white transition-colors duration-200 cursor-pointer bg-black/20 rounded-full"
              aria-label="Next frame"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <div className="text-center text-white space-y-1.5 pb-2">
            <h4 className="text-sm font-serif italic tracking-wide text-brand-sage">
              {images[activeImageIndex].title}
            </h4>
            <p className="text-[10px] tracking-[0.2em] uppercase text-white/40 font-light">
              {galleryTitle}
            </p>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}