"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FolderOpen, Calendar, ArrowRight, Loader2 } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BreadcrumbsBanner from "@/components/common/BreadcrumbsBanner";

interface PublicGallery {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  expiry_date: string | null;
  cover_image_url: string | null;
  image_count: number;
  client_name: string;
}

export default function PublicClientGalleriesPage() {
  const [galleries, setGalleries] = useState<PublicGallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    async function fetchPublicGalleries() {
      try {
        const res = await fetch(`${apiUrl}/api/client-galleries/public/list`);
        if (!res.ok) {
          throw new Error("Failed to load galleries.");
        }
        const data = await res.json();
        setGalleries(data);
      } catch (err) {
        console.error("Error loading public client galleries:", err);
        setError("Unable to retrieve public client galleries. Please check back later.");
      } finally {
        setLoading(false);
      }
    }
    fetchPublicGalleries();
  }, []);

  return (
    <>
      <Header />

      {/* Premium Standardized Banner */}
      <BreadcrumbsBanner
        title="CLIENT GALLERY"
        paths={[
          { label: "Home", href: "/" },
          { label: "Client Galleries" }
        ]}
      />

      <main className="flex-1 bg-[#FCFAF7] pt-14 pb-28">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Header Intro */}
          <div className="text-center space-y-4 mb-16 animate-fade-in">
            <span className="text-[10px] uppercase tracking-[0.35em] text-[#C4A484] font-semibold block">
              Private Showcases
            </span>
            <h2 className="text-3xl sm:text-5xl font-light tracking-wide font-serif text-[#2C2623] uppercase">
              Client Galleries
            </h2>
            <p className="text-xs sm:text-sm text-[#6E635F] font-light max-w-xl mx-auto leading-relaxed">
              Find your personalized photography portal below. Click your folder and enter your custom entry password to access and download your frames.
            </p>
            <div className="w-12 h-[1px] bg-[#DCD0C0] mx-auto pt-2" />
          </div>

          {/* Loader / Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <Loader2 className="w-8 h-8 text-[#C4A484] animate-spin" />
              <p className="text-xs uppercase tracking-wider text-[#6E635F] font-light">
                Fetching Client Catalogs...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-20 bg-white border border-[#DCD0C0]/25 rounded-md max-w-xl mx-auto p-8 space-y-4">
              <p className="text-sm font-light text-red-600">{error}</p>
              <Link href="/" className="inline-block text-xs uppercase tracking-widest text-[#C4A484] underline">
                Return Home
              </Link>
            </div>
          ) : galleries.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-[#DCD0C0]/35 rounded-md bg-white max-w-md mx-auto p-8 space-y-4">
              <FolderOpen className="w-10 h-10 text-stone-300 mx-auto" />
              <h4 className="text-sm font-serif font-light text-[#2C2623] uppercase tracking-wider">No Active Sessions</h4>
              <p className="text-xs text-[#6E635F] font-light">
                There are currently no active public client galleries listed. Please check the URL link sent to you by email.
              </p>
            </div>
          ) : (
            /* Premium Grid - matching reference layout */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {galleries.map((gallery) => {
                const coverImage = gallery.cover_image_url || "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=800";
                return (
                  <Link
                    key={gallery.id}
                    href={`/client-galleries/${gallery.slug}`}
                    className="group flex flex-col space-y-4 text-[#2C2623] hover:no-underline"
                  >
                    {/* Thumbnail Cover image container */}
                    <div className="relative aspect-[3/2] w-full overflow-hidden bg-stone-100 rounded-xs shadow-xs group-hover:shadow-md transition-all duration-500 border border-[#DCD0C0]/10">
                      <img
                        src={coverImage}
                        alt={gallery.title}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out scale-100 group-hover:scale-103"
                        loading="lazy"
                      />
                      
                      {/* Count Badge Overlay */}
                      <span className="absolute bottom-4 right-4 bg-[#2C2623]/80 backdrop-blur-xs text-[#FCFAF7] text-[9px] uppercase tracking-widest px-2.5 py-1 font-semibold rounded-xs shadow-xs">
                        {gallery.image_count} {gallery.image_count === 1 ? "Frame" : "Frames"}
                      </span>
                    </div>

                    {/* Meta Fields */}
                    <div className="space-y-1.5 px-1 flex flex-col">
                      <div className="flex items-center justify-between text-[9px] uppercase tracking-widest text-[#C4A484] font-semibold">
                        <span>{gallery.client_name}</span>
                        {gallery.expiry_date && (
                          <span className="flex items-center space-x-1 text-stone-400 font-normal">
                            <Calendar className="w-3 h-3" />
                            <span>Exp: {new Date(gallery.expiry_date).toLocaleDateString()}</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-serif font-light text-[#2C2623] group-hover:text-[#C4A484] transition-colors leading-snug">
                        {gallery.title}
                      </h3>

                      {gallery.description && (
                        <p className="text-xs text-[#6E635F] font-light leading-relaxed line-clamp-2">
                          {gallery.description}
                        </p>
                      )}

                      <div className="pt-2 flex items-center space-x-1 text-[10px] uppercase tracking-widest text-[#2C2623] font-semibold group-hover:text-[#C4A484] transition-colors">
                        <span>Unlock Session</span>
                        <ArrowRight className="w-3 h-3 translate-x-0 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

        </div>
      </main>

      <Footer />
    </>
  );
}
