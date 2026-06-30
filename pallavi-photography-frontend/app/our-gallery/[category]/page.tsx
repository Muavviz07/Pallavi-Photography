"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X, ArrowLeft } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

// Curated high-res fallback imagery for visual showcase
const FALLBACK_IMAGES: Record<string, Array<{ id: string; url: string; title: string; altText: string }>> = {
  newborn: [
    { id: "1", url: "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=800", title: "Sweet Dreamer", altText: "Sleeping newborn baby wrapped in cream blanket" },
    { id: "2", url: "https://images.unsplash.com/photo-1544126592-807adc26cc7d?auto=format&fit=crop&q=80&w=800", title: "Tiny Hands", altText: "Close-up of newborn baby's hands holding father's finger" },
    { id: "3", url: "https://images.unsplash.com/photo-1537673172765-a45f94de8b8f?auto=format&fit=crop&q=80&w=800", title: "Peaceful Sleep", altText: "Newborn baby sleeping soundly on woolly wrap" },
    { id: "4", url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=800", title: "Delicate Details", altText: "Macro shot of sleeping newborn toes" },
    { id: "5", url: "https://images.unsplash.com/photo-1515488042361-404e9250afef?auto=format&fit=crop&q=80&w=800", title: "Newborn Smile", altText: "Newborn baby smiling faintly in sleep" }
  ],
  maternity: [
    { id: "1", url: "https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?auto=format&fit=crop&q=80&w=800", title: "Silhouette in Light", altText: "Maternity studio silhouette portrait" },
    { id: "2", url: "https://images.unsplash.com/photo-1517164850305-99a3e65bb47e?auto=format&fit=crop&q=80&w=800", title: "Motherly Glow", altText: "Pregnant mother smiling in outdoor meadow" },
    { id: "3", url: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=800", title: "Quiet Expectation", altText: "Pregnant mother looking down tenderly holding belly" },
    { id: "4", url: "https://images.unsplash.com/photo-1551817958-c5b51e7b9a79?auto=format&fit=crop&q=80&w=800", title: "Gown in the Breeze", altText: "Maternity portrait with flowing white dress" },
    { id: "5", url: "https://images.unsplash.com/photo-1563804870-fb9dfc823611?auto=format&fit=crop&q=80&w=800", title: "Golden hour bump", altText: "Close-up of maternity hands in heart shape on belly" }
  ],
  family: [
    { id: "1", url: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=800", title: "Golden Hugs", altText: "Family group hugging outdoors in field at sunset" },
    { id: "2", url: "https://images.unsplash.com/photo-1609234656388-0ff363383899?auto=format&fit=crop&q=80&w=800", title: "Laughter in Nature", altText: "Parents and two young daughters laughing together" },
    { id: "3", url: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=800", title: "A Mother's Love", altText: "Mother holding daughter while father plays in background" },
    { id: "4", url: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&q=80&w=800", title: "Sunset Stroll", altText: "Family walking hand-in-hand in open landscape" },
    { id: "5", url: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&q=80&w=800", title: "Forehead Kiss", altText: "Mother kissing child on the forehead in bright daylight" }
  ],
  "fine-art": [
    { id: "1", url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800", title: "The Portrait", altText: "Artistic close-up female portrait with soft lighting" },
    { id: "2", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800", title: "Classic Light", altText: "Moody studio portrait with classical warm tones" },
    { id: "3", url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800", title: "Reflective Gaze", altText: "Male fine art portrait looking thoughtful" },
    { id: "4", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=800", title: "Monochrome Study", altText: "Black and white fine art studio portrait" },
    { id: "5", url: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=800", title: "Dreamy Textures", altText: "Soft focus portrait in natural environment" }
  ],
  nature: [
    { id: "1", url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=800", title: "Swiss Horizons", altText: "Alpine mountain range during golden hour" },
    { id: "2", url: "https://images.unsplash.com/photo-1472214222541-d510753a49fa?auto=format&fit=crop&q=80&w=800", title: "Serene Valleys", altText: "Lush green valley in the Swiss Alps" },
    { id: "3", url: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&q=80&w=800", title: "Forest Paths", altText: "Wooden bridge inside sunlit mossy forest" },
    { id: "4", url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=800", title: "Morning Mist", altText: "Misty mountain peaks surrounded by clouds" },
    { id: "5", url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800", title: "Sun Beams", altText: "Sun rays piercing through giant pine trees" }
  ]
};

const CATEGORIES_METADATA: Record<string, { title: string; subtitle: string; description: string }> = {
  newborn: {
    title: "Newborn Portfolio",
    subtitle: "Purity, Soft Textures, & Fleeting Moments",
    description: "Capturing the tender first weeks of life with soft organic materials, soothing neutral tones, and detailed close-ups that document how incredibly tiny they once were."
  },
  maternity: {
    title: "Maternity Portfolio",
    subtitle: "Grace, Strength, & Expectant Light",
    description: "Documenting the beautiful journey of pregnancy. From elegant silhouettes in our warm studio to sun-drenched fine art portraits in the breathtaking Swiss countryside."
  },
  family: {
    title: "Family Portfolio",
    subtitle: "Real Laughter, Warm Hugs, & Genuine Connections",
    description: "Frame-by-frame captures of authentic family love. Outdoor sessions designed as joyful walks in the sunset, capturing clean emotional depth rather than rigid poses."
  },
  "fine-art": {
    title: "Fine Art Portfolio",
    subtitle: "Editorial Depth, Painterly Shading, & Timeless Portraits",
    description: "Classical, deep-contrast portraits styled with high-end editorial textures. Designed as statement fine art prints to hang in your home for generations."
  },
  nature: {
    title: "Nature & Landscapes",
    subtitle: "Swiss Landscapes & Natural Light Study",
    description: "Exploring the raw majesty of nature and golden hour tones. Landscapes, natural flora, and wilderness captures representing our artistic environment."
  }
};

interface GalleryImage {
  id: string;
  url: string;
  title: string;
  altText: string;
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

  useEffect(() => {
    async function fetchImages() {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      try {
        // Try fetching galleries to find the matching one
        const galleriesRes = await fetch(`${apiUrl}/api/galleries?category=${categoryKey}`);
        if (galleriesRes.ok) {
          const galleries = await galleriesRes.json();
          if (galleries && galleries.length > 0) {
            // Find images for this gallery
            const imagesRes = await fetch(`${apiUrl}/api/galleries/${galleries[0].id}/images`);
            if (imagesRes.ok) {
              const data = await imagesRes.json();
              if (data && data.length > 0) {
                const formattedImages = data.map((img: any) => ({
                  id: img.id,
                  url: img.optimized_url || img.original_url,
                  title: img.title || "Untitled",
                  altText: img.alt_text || "Portfolio Image"
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
      
      <main className="flex-1 pt-32 pb-24 bg-[#FCFAF7]">
        {/* Gallery Intro Header */}
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6 mb-16">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest text-[#C4A484] hover:text-[#2C2623] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
          <span className="text-[10px] uppercase tracking-[0.35em] text-[#C4A484] font-semibold block pt-2">
            Fine Art Collection
          </span>
          <h2 className="text-3xl sm:text-5xl font-light tracking-wide font-serif text-[#2C2623] uppercase">
            {metadata.title}
          </h2>
          <span className="block text-xs uppercase tracking-widest font-light text-[#6E635F] italic">
            {metadata.subtitle}
          </span>
          <p className="text-[#6E635F] text-sm leading-relaxed font-light max-w-2xl mx-auto">
            {metadata.description}
          </p>
          <div className="w-12 h-[1px] bg-[#DCD0C0] mx-auto pt-2" />
        </div>

        {/* Gallery Image Grid */}
        <div className="max-w-7xl mx-auto px-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-8 h-8 border-2 border-[#C4A484] border-t-transparent rounded-full animate-spin" />
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
            /* Premium Masonry Grid */
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
              {images.map((img, idx) => (
                <div
                  key={img.id}
                  onClick={() => setActiveImageIndex(idx)}
                  className="break-inside-avoid relative rounded-xs overflow-hidden cursor-pointer shadow-xs group bg-stone-150 transition-all duration-300 hover:shadow-md animate-fade-in block"
                >
                  <img
                    src={img.url}
                    alt={img.altText}
                    className="w-full h-auto object-cover transition-transform duration-700 ease-out scale-100 group-hover:scale-103"
                    loading="lazy"
                  />
                  {/* Subtle Elegant Hover Overlay */}
                  <div className="absolute inset-0 bg-[#2C2623]/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                    <span className="text-[10px] uppercase tracking-widest text-stone-300 block mb-0.5">
                      View Frame
                    </span>
                    <h4 className="text-sm font-light font-serif text-white tracking-wide">
                      {img.title}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 9. PREMIUM LIGHTBOX VIEWER */}
      {activeImageIndex !== null && images.length > 0 && (
        <div className="fixed inset-0 z-[100] bg-[#2C2623]/95 backdrop-blur-md flex items-center justify-center transition-all duration-300">
          
          {/* Close Button */}
          <button
            onClick={() => setActiveImageIndex(null)}
            className="absolute top-6 right-6 text-stone-400 hover:text-white transition-colors cursor-pointer focus:outline-hidden"
            aria-label="Close Lightbox"
          >
            <X className="w-7 h-7" />
          </button>

          {/* Left Arrow Button */}
          <button
            onClick={handlePrevImage}
            className="absolute left-4 sm:left-8 text-stone-400 hover:text-white transition-colors cursor-pointer focus:outline-hidden bg-black/20 p-2.5 rounded-full"
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
            className="absolute right-4 sm:right-8 text-stone-400 hover:text-white transition-colors cursor-pointer focus:outline-hidden bg-black/20 p-2.5 rounded-full"
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
