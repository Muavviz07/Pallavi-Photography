"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ArrowRight, Sparkles, Award } from "lucide-react";
import { api } from "@/lib/api";

interface AboutData {
  title: string;
  quote: string;
  bio_text: string;
  awards_text: string;
  image_url?: string;
}

function AboutPageContent() {
  const searchParams = useSearchParams();
  const section = searchParams.get("section");
  const [data, setData] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAbout() {
      try {
        const res = await api.get<AboutData>("/about");
        setData(res);
      } catch (err) {
        console.error("Failed to fetch about data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAbout();
  }, []);

  useEffect(() => {
    if (section === "awards") {
      const el = document.getElementById("awards-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [section, data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="text-sm font-medium uppercase tracking-[0.2em] animate-pulse text-brand-sage">
          Loading Studio Details...
        </div>
      </div>
    );
  }

  const bioText = data?.bio_text || "I believe that photography is a gentle art...";
  const quoteText = data?.quote || "Take in every little moment as they would not stay the same forever...";
  const awardsText = data?.awards_text || "Recognitions & Awards details...";

  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-brand-bg pt-32 pb-24">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 space-y-20">
          
          {/* Main Biography Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left side text column */}
            <div className="lg:col-span-7 space-y-8">
              <span className="text-[10px] uppercase tracking-[0.3em] text-brand-sage font-semibold block">
                Switzerland Portrait Studio
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-wide font-serif text-brand-dark leading-tight uppercase">
                Newborn, Children, Maternity, Family and Fine Art Photographer in Vevey, Vaud – Switzerland.
              </h2>
              
              <div className="w-12 h-[1px] bg-brand-sage/40"></div>

              {/* Quote block */}
              <div className="pl-6 border-l border-brand-sage/30">
                <p className="text-base font-serif italic text-brand-muted leading-relaxed">
                  "{quoteText}"
                </p>
              </div>

              {/* Description paragraphs */}
              <div className="text-sm text-brand-muted leading-relaxed space-y-6">
                {bioText.split("\n\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

              <div className="pt-4">
                <Link
                  href="/book-a-session"
                  className="inline-flex items-center space-x-3 bg-brand-sage text-white text-xs uppercase tracking-widest px-8 py-3.5 hover:bg-brand-dark transition-all duration-300 rounded-sm"
                >
                  <span>Book a Session</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Right side Image display column */}
            <div className="lg:col-span-5 relative">
              <div className="aspect-[4/5] rounded-xs overflow-hidden shadow-2xl border border-brand-border bg-brand-cream relative">
                <img
                  src={data?.image_url || "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=800"}
                  alt="Pallavi Portrait Photographer"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Floating accent elements */}
              <div className="absolute -bottom-6 -left-6 bg-[#D4A5A5] text-white p-6 rounded-xs shadow-lg hidden md:block border border-brand-border/10">
                <Sparkles className="w-6 h-6 mb-2 animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest font-semibold block">Artistic Capture</span>
                <span className="text-[9px] text-white/80 block font-light">Natural Lighting setups</span>
              </div>
            </div>
          </div>

          {/* Awards & Recognitions Section */}
          <div id="awards-section" className="pt-16 border-t border-brand-border space-y-10">
            <div className="text-center space-y-3">
              <span className="text-[10px] uppercase tracking-[0.3em] text-brand-sage font-semibold block">
                Milestones & Press
              </span>
              <h3 className="text-2xl md:text-3xl font-light tracking-wide font-serif text-brand-dark uppercase">
                Recognitions & Awards
              </h3>
            </div>

            <div className="bg-brand-cream border border-brand-border p-8 md:p-12 rounded-xs max-w-4xl mx-auto flex flex-col md:flex-row items-center md:items-start gap-8">
              <div className="bg-brand-sage/10 text-brand-sage p-4 rounded-full">
                <Award className="w-10 h-10" />
              </div>
              <div className="space-y-6 text-left flex-1">
                <div className="text-sm text-brand-muted leading-relaxed space-y-4">
                  {awardsText.split("\n\n").map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-brand-border">
                  <div className="text-center md:text-left">
                    <span className="text-lg font-serif text-brand-dark font-medium block">2026</span>
                    <span className="text-[10px] tracking-wider text-brand-muted uppercase">Vaud Arts Select</span>
                  </div>
                  <div className="text-center md:text-left">
                    <span className="text-lg font-serif text-brand-dark font-medium block">Top 10</span>
                    <span className="text-[10px] tracking-wider text-brand-muted uppercase">Swiss Newborn Photographers</span>
                  </div>
                  <div className="text-center md:text-left">
                    <span className="text-lg font-serif text-brand-dark font-medium block">Gold</span>
                    <span className="text-[10px] tracking-wider text-brand-muted uppercase">Fine Art Portrait Award</span>
                  </div>
                  <div className="text-center md:text-left">
                    <span className="text-lg font-serif text-brand-dark font-medium block">Featured</span>
                    <span className="text-[10px] tracking-wider text-brand-muted uppercase">Maternity Journeys Mag</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}

export default function AboutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="text-sm font-medium uppercase tracking-[0.2em] animate-pulse text-brand-sage">
          Loading Studio Details...
        </div>
      </div>
    }>
      <AboutPageContent />
    </Suspense>
  );
}
