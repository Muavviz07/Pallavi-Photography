"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X, Loader2 } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BreadcrumbsBanner from "@/components/common/BreadcrumbsBanner";

// Curated high-res fallback imagery for visual showcase
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

const CATEGORIES_METADATA: Record<string, { title: string; subtitle: string; description: string }> = {
  newborn: {
    title: "Newborn Photographer in Vevey, Vaud",
    subtitle: "Purity, Soft Textures, & Fleeting Moments",
    description: "Welcome to the Newborn Photography Gallery — a collection of gentle, timeless portraits capturing the very first days of life. Each photo captures your baby's tiny details, sweet moments in a calm, comfortable, and thoughtfully styled session. Families from Vevey, Lausanne, Montreux, Morges and the surrounding Vaud region are warmly welcomed to experience professional newborn photography sessions designed with comfort, safety, and artistry in mind. If you would like to learn more about newborn session packages and pricing, visit the Newborn Photography Services Page."
  },
  children: {
    title: "Children Photographer in Vevey, Vaud",
    subtitle: "Wonder, Playground Laughter, & Candid Portraits",
    description: "Welcome to the Children Photography Gallery — a place to see the joy, curiosity, and personality of little ones at every stage. Each image captures genuine smiles, playful moments, and the unique spark that makes every child special, all in a relaxed and fun session designed to let their natural energy shine. Families from Vevey, Lausanne, Montreux, Morges, and the surrounding Vaud region are warmly welcomed to enjoy a child-friendly photography experience. If you'd like to learn more about children's session packages and pricing, visit the Children Photography Services Page."
  },
  maternity: {
    title: "Maternity Photographer in Vevey, Vaud",
    subtitle: "Grace, Strength, & Expectant Light",
    description: "Welcome to the Maternity Photography Gallery — celebrating the beauty, anticipation, and emotion of pregnancy. Each portrait captures the glow, connection, and love of this special time, whether alone, with a partner, or including older children, in a comfortable and thoughtfully styled session. Families from Vevey, Lausanne, Montreux, Morges, and the surrounding Vaud region are invited to create lasting memories of this extraordinary journey. If you'd like to learn more about maternity session packages and pricing, visit the Maternity Photography Services Page."
  },
  family: {
    title: "Family Photographer in Vevey, Vaud",
    subtitle: "Real Laughter, Warm Hugs, & Genuine Connections",
    description: "Welcome to the Family Photography Gallery — a collection of moments that celebrate connection, joy, and togetherness. Each session captures laughter, love, and the small, everyday details that make your family unique, in a relaxed and natural setting, whether indoors or at a favorite outdoor location. Families from Vevey, Lausanne, Montreux, Morges, and the surrounding Vaud region are warmly invited to experience photography designed to feel fun, meaningful, and memorable. If you'd like to learn more about family session packages and pricing, visit the Family Photography Services Page."
  },
  "fine-art": {
    title: "Fine Art Photographer in Vevey, Vaud",
    subtitle: "Editorial Depth, Painterly Shading, & Timeless Portraits",
    description: "Welcome to the Fine Art Portraits Gallery — a collection of expressive, timeless images crafted with creativity and emotion. Each portrait is a collaborative work of art, reflecting your personality and story in a unique and meaningful way. Clients from Vevey, Lausanne, Montreux, Morges, and the Vaud region are invited to explore the gallery and experience photography that goes beyond the ordinary. If you're interested in creating your own Fine Art portraits, please get in touch to discuss your vision and availability. Contact Me About Fine Art Sessions"
  },
  nature: {
    title: "Nature Photographer in Vevey, Vaud",
    subtitle: "Swiss Landscapes & Natural Light Study",
    description: "Welcome to the Nature Portraits Gallery — a collection of quiet moments, natural light, and the raw beauty of Swiss landscapes. Each photograph captures the serene details of the flora, mountains, and wilderness surrounding the Vaud region, showcasing the beauty of the natural world in its purest form. If you'd like to learn more about licensing my landscape photographs or booking a session in nature, visit the Nature Photography Services Page."
  }
};

interface GalleryImage {
  id: string;
  url: string;
  title: string;
  altText: string;
  aspect?: string;
}

export default function CategoryGalleryPage({ params }: { params: Promise<{ category: string }> }) {
  // Resolve params using React.use() which is required in Next.js 15+
  const resolvedParams = React.use(params);
  const rawCategory = resolvedParams.category;
  
  // Normalize category key
  const categoryKey = rawCategory.toLowerCase() === "fine-art" ? "fine-art" : rawCategory.toLowerCase();
  const metadata = CATEGORIES_METADATA[categoryKey] || {
    title: "Photography Portfolio",
    subtitle: "Documenting Beautiful Lifetimes",
    description: "Explore our collection of high-resolution professional photography."
  };

  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const [lang, setLang] = useState("EN");
  const [galleryTitle, setGalleryTitle] = useState(metadata.title);
  const [galleryDescription, setGalleryDescription] = useState(metadata.description);

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
    async function fetchImages() {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      try {
        // Try fetching galleries to find the matching one (normalizing fine-art/fine_art category search)
        const galleriesRes = await fetch(`${apiUrl}/api/galleries?category=${categoryKey}`);
        if (galleriesRes.ok) {
          const galleries = await galleriesRes.json();
          if (galleries && galleries.length > 0) {
            const gal = galleries[0];
            if (gal.title) setGalleryTitle(gal.title);
            if (gal.description) setGalleryDescription(gal.description);
            // Find images for this gallery
            const imagesRes = await fetch(`${apiUrl}/api/galleries/${gal.id}/images`);
            if (imagesRes.ok) {
              const data = await imagesRes.json();
              if (data && data.length > 0) {
                const formattedImages = data.map((img: any) => ({
                  id: img.id,
                  url: img.optimized_url || img.original_url,
                  title: img.title || "Untitled",
                  altText: img.alt_text || "Portfolio Image",
                  aspect: img.dimensions?.aspect || "square" // Defaults to square aspect crop
                }));
                setImages(formattedImages);
                setLoading(false);
                return;
              }
            }
          }
        }
      } catch (err) {
        console.warn("Failed to fetch gallery from backend, using high-res local fallbacks.", err);
      }

      // If backend fails or is empty, use highly curated fallbacks
      setImages(FALLBACK_IMAGES[categoryKey] || []);
      setLoading(false);
    }

    fetchImages();
  }, [categoryKey]);

  // Lightbox key listeners
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

  return (
    <>
      <Header />

      {/* Standardized Breadcrumbs Banner */}
      <BreadcrumbsBanner
        title={`${categoryKey} GALLERY`}
        paths={[
          { label: "Home", href: "/" },
          { label: "Our Gallery", href: "/our-gallery" },
          { label: categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1) }
        ]}
      />
      
      <main className="flex-1 pt-14 pb-24 bg-[#FCFAF7]">
        {/* Gallery Intro Header */}
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
              href={`/${categoryKey}`}
              className="inline-flex items-center space-x-2 text-[11px] font-sans uppercase tracking-[0.25em] text-[#8F9288] hover:text-[#7D8076] border-b border-[#8F9288]/40 hover:border-[#7D8076] pb-1 transition-all duration-300 cursor-pointer"
            >
              <span>{lang === "FR" ? `Voir les tarifs ${categoryKey}` : `View ${categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1)} Pricing`}</span>
              <span className="text-xs">→</span>
            </Link>
          </div>
        </div>

        {/* Gallery Image Grid */}
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-8 h-8 border-2 border-[#C4A484] border-t-transparent rounded-full animate-spin text-[#C4A484]" />
              <p className="text-xs uppercase tracking-wider text-[#6E635F] font-light">Loading Portfolio...</p>
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-20 bg-[#FAF8F5] border border-[#DCD0C0]/20 rounded-sm">
              <p className="text-sm font-light text-[#6E635F]">This portfolio gallery is currently empty.</p>
              <Link href="/" className="mt-4 inline-block text-xs uppercase tracking-widest text-[#C4A484] font-medium underline">
                Return Home
              </Link>
            </div>
          ) : (
            /* Premium Aspect-Aligned Grid - matching reference layout exactly */
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
                    className={`relative rounded-xs overflow-hidden cursor-pointer shadow-xs group bg-[#FAF8F5] border border-[#DCD0C0]/20 transition-all duration-300 hover:shadow-md animate-fade-in block w-full ${aspectClass}`}
                  >
                    <img
                      src={img.url}
                      alt={img.altText}
                      className="w-full h-full object-cover transition-transform duration-1000 ease-out scale-100 group-hover:scale-102"
                      loading="lazy"
                    />
                    {/* Subtle Elegant Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#2C2623]/75 via-[#2C2623]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
                      <span className="text-[9px] uppercase tracking-[0.25em] text-[#C4A484] font-semibold block mb-1 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500 delay-75">
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

      {/* PREMIUM LIGHTBOX VIEWER */}
      {activeImageIndex !== null && images.length > 0 && (
        <div className="fixed inset-0 z-[100] bg-[#2C2623]/95 backdrop-blur-md flex items-center justify-center transition-all duration-300">
          
          {/* Close Button */}
          <button
            onClick={() => setActiveImageIndex(null)}
            className="absolute top-6 right-6 text-stone-400 hover:text-white transition-colors cursor-pointer focus:outline-none"
            aria-label="Close Lightbox"
          >
            <X className="w-7 h-7" />
          </button>

          {/* Left Arrow Button */}
          <button
            onClick={handlePrevImage}
            className="absolute left-4 sm:left-8 text-stone-400 hover:text-white transition-colors cursor-pointer focus:outline-none bg-black/20 p-2.5 rounded-full"
            aria-label="Previous Image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Image Container */}
          <div className="max-w-[90vw] max-h-[80vh] flex flex-col items-center justify-center select-none">
            <img
              src={images[activeImageIndex].url}
              alt={images[activeImageIndex].altText}
              className="max-w-full max-h-[72vh] object-contain shadow-2xl animate-fade-in"
            />
            {/* Metadata overlay below image */}
            <div className="mt-4 text-center space-y-1">
              <h4 className="text-sm font-serif font-light text-white tracking-wider">
                {images[activeImageIndex].title}
              </h4>
              <p className="text-[10px] text-stone-400 uppercase tracking-widest font-light">
                {images[activeImageIndex].altText}
              </p>
              <span className="inline-block text-[9px] text-stone-500 font-light pt-2">
                {activeImageIndex + 1} / {images.length}
              </span>
            </div>
          </div>

          {/* Right Arrow Button */}
          <button
            onClick={handleNextImage}
            className="absolute right-4 sm:right-8 text-stone-400 hover:text-white transition-colors cursor-pointer focus:outline-none bg-black/20 p-2.5 rounded-full"
            aria-label="Next Image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}

      <Footer />
    </>
  );
}
