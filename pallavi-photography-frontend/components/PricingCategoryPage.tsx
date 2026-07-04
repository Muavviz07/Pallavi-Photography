"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BreadcrumbsBanner from "@/components/common/BreadcrumbsBanner";
import { api } from "@/lib/api";

interface PricingPlan {
  name: string;
  price: string;
  description?: string;
  features: string[];
  button_type?: "solid" | "outline";
}

interface PricingData {
  category: string;
  title: string;
  subtitle: string;
  description: string;
  intro_text: string;
  notes_text: string;
  plans: PricingPlan[];
}

const FALLBACK_PRICING_DATA: Record<string, PricingData> = {
  newborn: {
    category: "newborn",
    title: "NEWBORN PHOTOGRAPHY IN VEVEY, LAUSANNE & VAUD",
    subtitle: "NEWBORN SESSION",
    description: "If you're looking for a professional newborn photographer in Vevey or Lausanne, I recommend booking your session during pregnancy to ensure availability.",
    intro_text: "The ideal time for a newborn photoshoot is within the first 14 days after birth. During this precious stage, babies are naturally sleepy and curled up, allowing for gentle posing and beautifully timeless portraits. At Pallavi Photography, each newborn photography session in Vevey is designed with your baby's safety, comfort, and well-being as the highest priority.\n\nSessions are calm, baby-led, and unhurried—creating a relaxed experience for both parents and newborns. I welcome families from Lausanne, Vevey, and across the Vaud region, offering a warm and personalized photography experience tailored to your family. A curated collection of handcrafted props, wraps, and outfits is available in soft, elegant tones. Every setup is thoughtfully styled to create artistic, natural-looking newborn portraits you will treasure for years to come.\n\nOn this page, you'll find detailed pricing information, including the different packages, products, and services I offer—so you can choose what package suits your needs. If you'd love to see beautiful newborn moments I've captured for other families, explore the gallery here:",
    notes_text: "NOTE: TRAVEL FEE APPLIES FOR LOCATION BEYOND 2 KM\n\nA CHF 100 non-refundable deposit (session fee) is required to secure your date and session. The remaining balance is due on the day of the session.\nAdditional digital photos can be purchased from the gallery at: 1 photo CHF 30, 3 photos CHF 75, 5 photos CHF 120.\nFamily session info: due to space limitations, a maximum of 4–5 people can be accommodated indoors. Larger groups can be photographed outdoors. Gift vouchers are also available to purchase.",
    plans: [
      {
        name: "PETITE COLLECTION",
        price: "CHF 450",
        features: [
          "1–2 hours session, baby, parent and sibling poses included",
          "Colour palette can be selected for the session",
          "Use of curated props and baby outfits",
          "Password-protected online gallery for image selection",
          "10 high-resolution (professionally edited) digital images to download",
          "5 passe-partouts with 13 × 18 cm prints, mounted in 20 × 25 cm mats",
          "20 credit to use towards wall art, canvases, bigger mat, acrylic prints, or a future session"
        ],
        button_type: "solid"
      },
      {
        name: "CLASSIC COLLECTION",
        price: "CHF 650",
        features: [
          "2–4 hours session, baby, parent and sibling poses included",
          "Colour palette can be selected for the session",
          "Use of curated props and baby outfits",
          "Password-protected online gallery for image selection",
          "15 high-resolution (professionally edited) digital images to download",
          "All 15 prints (13 × 18 cm) in a premium keepsake box with acrylic display lid",
          "50 credit to use towards wall art, canvases, bigger mat, acrylic prints, or a future session"
        ],
        button_type: "outline"
      },
      {
        name: "LUXE STORY COLLECTION",
        price: "CHF 850",
        features: [
          "2–4 hours session, baby, parent and sibling poses included",
          "Colour palette can be selected for the session",
          "Use of curated props and baby outfits",
          "Password-protected online gallery for image selection",
          "20 high-resolution (professionally edited) digital images to download",
          "All 20 prints (13 × 18 cm) in a premium keepsake box with acrylic display lid",
          "Beautifully designed 20-page mini photo book",
          "50 credit to use towards wall art, canvases, bigger mat, acrylic prints, or a future session"
        ],
        button_type: "outline"
      }
    ]
  },
  children: {
    category: "children",
    title: "CHILDREN PORTRAITURE IN SWITZERLAND",
    subtitle: "CHILDREN SESSION",
    description: "If you're looking for a professional child photographer, I recommend booking your session early to secure your preferred date.",
    intro_text: "Milestone child portraiture captures the laughter, curiosity, and unique personality of your child as they grow. Whether in our calm studio or outdoors in beautiful Swiss natural locations, each session is tailored to your child's pace.\n\nWe design fun, interactive shoots where children can be themselves, creating natural and unforced expressions. From toddlers to pre-teens, every portrait is a memory frozen in time.",
    notes_text: "NOTE: TRAVEL FEE APPLIES FOR LOCATION BEYOND 2 KM\n\nA CHF 100 non-refundable deposit is required to secure your booking slot.",
    plans: [
      {
        name: "STUDIO PORTRAIT",
        price: "CHF 380",
        features: [
          "1 hour session",
          "12 edited high-res digital photos",
          "Minimalist studio backdrop setup",
          "Online private gallery",
          "Print release"
        ],
        button_type: "solid"
      },
      {
        name: "OUTDOOR STORYBOOK",
        price: "CHF 550",
        features: [
          "1.5 hours session in location",
          "25 edited high-res digital photos",
          "Natural settings, action and details documented",
          "Online private gallery",
          "Fine Art prints set (5 prints)"
        ],
        button_type: "outline"
      }
    ]
  },
  family: {
    category: "family",
    title: "FAMILY PORTRAIT PHOTOGRAPHY IN VEY LAUSANNE & VAUD",
    subtitle: "FAMILY SESSION",
    description: "Celebrate the connection, hugs, and laughter of your family.",
    intro_text: "Every family has a unique connection, and my outdoor family sessions are designed to celebrate your togetherness. We focus on natural light, real smiles, and unscripted embraces in the breathtaking Swiss landscape.",
    notes_text: "NOTE: TRAVEL FEE APPLIES FOR LOCATION BEYOND 2 KM\n\nA CHF 100 non-refundable deposit is required to secure your booking slot.",
    plans: [
      {
        name: "GOLDEN HOUR SESSION",
        price: "CHF 490",
        features: [
          "1.5 hours sunset outdoor session",
          "20 edited high-res digital photos",
          "Up to 5 family members",
          "Online private selection gallery",
          "Print release"
        ],
        button_type: "solid"
      },
      {
        name: "ELITE SIGNATURE",
        price: "CHF 850",
        features: [
          "2 hours in choice location",
          "45 edited high-res digital photos",
          "Custom premium photo book album",
          "High-res downloads for sharing",
          "Unlimited group edits"
        ],
        button_type: "outline"
      }
    ]
  },
  maternity: {
    category: "maternity",
    title: "MATERNITY PORTRAIT SESSIONS IN SWITZERLAND",
    subtitle: "MATERNITY SESSION",
    description: "Pregnancy is a beautiful chapter, filled with anticipation and grace.",
    intro_text: "Celebrate the strength and glow of motherhood. We offer custom sessions by Geneva Lake or in our private natural light studio, providing access to elegant designer wardrobe and gowns.",
    notes_text: "NOTE: TRAVEL FEE APPLIES FOR LOCATION BEYOND 2 KM\n\nA CHF 100 non-refundable deposit is required to secure your booking slot.",
    plans: [
      {
        name: "LAKESIDE SUNSET SESSION",
        price: "CHF 450",
        features: [
          "1.5 hours session",
          "15 edited high-res digital photos",
          "Access to elegant maternity gowns selection",
          "Partner & older children included",
          "Online private selection gallery"
        ],
        button_type: "solid"
      },
      {
        name: "MATERNITY & NEWBORN BUNDLE",
        price: "CHF 990",
        features: [
          "Full Lakeside Maternity session (15 photos)",
          "Full Legacy Newborn session (30 photos)",
          "Custom fine art print sets",
          "Extended session times",
          "Highest priority calendar slots reserving"
        ],
        button_type: "outline"
      }
    ]
  },
  "fine-art": {
    category: "fine-art",
    title: "FINE ART EDITORIAL PORTRAITS IN SWITZERLAND",
    subtitle: "FINE ART SESSION",
    description: "Highly styled conceptual portraits resembling classical oil paintings.",
    intro_text: "Designed for those seeking signature, museum-grade portraiture. Using deep painterly contrast and hand-crafted backdrops, these sessions turn your portrait into a piece of fine art.",
    notes_text: "NOTE: TRAVEL FEE APPLIES FOR LOCATION BEYOND 2 KM\n\nA CHF 150 non-refundable deposit is required to secure your booking slot.",
    plans: [
      {
        name: "SINGLE CREATIVE MASTER",
        price: "CHF 600",
        features: [
          "2 hours structured conceptual shoot",
          "5 heavily retouched painterly masterpiece files",
          "Custom mood board and styling guidance",
          "Fine art museum-grade printed canvas (40x50cm)",
          "Print release"
        ],
        button_type: "solid"
      }
    ]
  },
  nature: {
    category: "nature",
    title: "NATURE & LANDSCAPE PHOTOSTOCK LICENSING",
    subtitle: "NATURE LICENSING",
    description: "High-resolution digital downloads and exclusive print licensing.",
    intro_text: "Bring the raw majesty of Swiss alpine landscapes and calm Geneva Lake scenes to your space. Our curated print-ready photostock is available for editorial, commercial, and personal wall art licensing.",
    notes_text: "High-res files are delivered as digital TIFF/RAW or premium museum-grade prints. Custom orders available upon request.",
    plans: [
      {
        name: "STANDARD LICENSE",
        price: "CHF 150",
        features: [
          "High-res digital download",
          "Web/social usage permissions",
          "Lifetime digital royalty free usage"
        ],
        button_type: "solid"
      },
      {
        name: "COMMERCIAL EXCLUSIVE",
        price: "CHF 600",
        features: [
          "TIFF and RAW files download",
          "Full print licensing",
          "Exclusive commercial print use release"
        ],
        button_type: "outline"
      }
    ]
  }
};

const CATEGORY_IMAGES: Record<string, string> = {
  newborn: "https://images.unsplash.com/photo-1610901137736-d7cc46657b11?auto=format&fit=crop&q=80&w=800",
  children: "https://images.unsplash.com/photo-1624029769501-5a6cfec0d9e0?w=600&auto=format&fit=crop&q=60",
  family: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=800",
  maternity: "https://images.unsplash.com/photo-1615766553246-9147b6d50e90?w=600&auto=format&fit=crop&q=60",
  "fine-art": "https://images.unsplash.com/photo-1637511844674-d2c52d5f29b5?w=600&auto=format&fit=crop&q=60",
  nature: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&q=80&w=800"
};

export default function PricingCategoryPage() {
  const params = useParams();
  const rawCategory = (params.category as string) || "newborn";
  const category = rawCategory.toLowerCase() === "fine-art" ? "fine-art" : rawCategory.toLowerCase();

  const [pricing, setPricing] = useState<PricingData | null>(null);
  const [loading, setLoading] = useState(true);
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
    async function loadPricing() {
      try {
        const res = await api.get<any>(`/pricing/${category}`);
        if (res) {
          const parsedPlans = res.plans_json ? JSON.parse(res.plans_json) : [];
          setPricing({
            category: res.category,
            title: res.title,
            subtitle: res.subtitle,
            description: res.description,
            intro_text: res.intro_text,
            notes_text: res.notes_text,
            plans: parsedPlans
          });
        }
      } catch (err) {
        console.warn(`Failed to fetch pricing for category ${category}, falling back to static configurations.`, err);
        setPricing(FALLBACK_PRICING_DATA[category] || FALLBACK_PRICING_DATA.newborn);
      } finally {
        setLoading(false);
      }
    }
    loadPricing();
  }, [category]);

  if (loading || !pricing) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-sm font-medium uppercase tracking-[0.2em] animate-pulse text-stone-400">
          Loading pricing details...
        </div>
      </div>
    );
  }

  // Parse price label details helper
  const parsePrice = (priceStr: string) => {
    const parts = priceStr.split(" ");
    if (parts.length >= 2) {
      return { currency: parts[0], value: parts.slice(1).join(" ") };
    }
    return { currency: "CHF", value: priceStr };
  };

  return (
    <>
      <Header />

      {/* Standardized Breadcrumbs Banner */}
      <BreadcrumbsBanner
        title={pricing.subtitle}
        paths={[
          { label: "Home", href: "/" },
          { label: pricing.subtitle.charAt(0) + pricing.subtitle.slice(1).toLowerCase() }
        ]}
      />

      {/* Main Container */}
      <main className="bg-white py-16">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10 space-y-20">
          
          {/* Top Intro Section (Clean Full-Width Text Layout matching Grid width) */}
          <div className="w-full text-left space-y-6">
            <h2 className="text-xl sm:text-2xl md:text-[28px] tracking-[0.2em] font-serif text-brand-dark uppercase font-light leading-snug">
              {pricing.title}
            </h2>
            
            <div className="w-12 h-[1.5px] bg-[#A3A69C] opacity-60"></div>
            
            {/* Split description block by paragraphs */}
            <div className="space-y-5 text-sm text-stone-500 font-sans font-light leading-relaxed tracking-wide text-justify">
              {pricing.intro_text.split("\n\n").map((para, idx) => {
                const isLead = idx === 0;
                return (
                  <p key={idx} className={isLead ? "text-stone-600 font-normal text-base leading-relaxed" : ""}>
                    {para}
                  </p>
                );
              })}
            </div>

            {/* Re-designed Gallery Link Button */}
            <div className="pt-4 flex items-center">
              <Link
                href={`/our-gallery/${category}`}
                className="inline-flex items-center space-x-2 text-[11px] font-sans uppercase tracking-[0.25em] text-[#8F9288] hover:text-[#7D8076] border-b border-[#8F9288]/40 hover:border-[#7D8076] pb-1 transition-all duration-300 cursor-pointer"
              >
                <span>{lang === "FR" ? `Voir la galerie ${category}` : `View ${category.charAt(0).toUpperCase() + category.slice(1)} Gallery`}</span>
                <span className="text-xs">→</span>
              </Link>
            </div>

            {/* Note text below button */}
            <p className="text-xs text-stone-400 font-serif italic pt-1">
              {pricing.description}
            </p>
          </div>

          {/* Package Lists Section (Rendered only if category has plans) */}
          {pricing.plans && pricing.plans.length > 0 && (
            <div className="space-y-20 pt-6">
              
              {/* Standard Session Packages */}
              <div className="space-y-12">
                {/* Pricing Grid Title */}
                <div className="text-center space-y-2">
                  <h3 className="text-2xl sm:text-3xl tracking-[0.25em] font-serif text-brand-dark uppercase" style={{ fontWeight: 300 }}>
                    {pricing.subtitle}
                  </h3>
                  <p className="text-xs sm:text-sm font-serif italic text-stone-500">
                    {lang === "FR" 
                      ? "Chaque formule est conçue et réalisée par mes soins, garantissant une touche personnelle à chaque image" 
                      : "Every package is crafted and delivered by me, ensuring a personal touch in every frame"}
                  </p>
                </div>

                {/* Packages Grid (Flex wrap to align 1, 2, or 3 packages to the middle/center horizontally) */}
                <div className="flex flex-wrap justify-center gap-8 items-stretch">
                  {pricing.plans.slice(0, 3).map((plan, index) => {
                    const priceData = parsePrice(plan.price);

                    return (
                      <div
                        key={plan.name}
                        className="bg-[#FCFAF9]/40 border border-stone-200/50 p-8 md:p-10 flex flex-col justify-between space-y-12 text-center transition-all duration-350 hover:bg-[#FCFAF9]/90 hover:shadow-xs group w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.33%-1.5rem)] max-w-[365px] min-w-[280px]"
                      >
                        <div className="space-y-8">
                          {/* Top Accent Bar inside column */}
                          <div className="w-8 h-[2px] bg-[#8F9288]/40 mx-auto transition-all group-hover:w-16 duration-300"></div>

                          {/* Plan Title */}
                          <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-[#8F9288] block font-semibold">
                            {plan.name}
                          </span>

                          {/* Price Block */}
                          <div className="text-stone-400 font-serif italic text-sm">
                            {priceData.currency}
                            <span className="text-4xl sm:text-5xl font-extralight font-serif text-stone-600 italic ml-1 block -mt-1">
                              {priceData.value}
                            </span>
                          </div>

                          {/* Separator Accent */}
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-4 h-[0.5px] bg-stone-200"></div>
                            <span className="text-[7px] text-stone-300">✦</span>
                            <div className="w-4 h-[0.5px] bg-stone-200"></div>
                          </div>

                          {/* Plan Bullet Features */}
                          <div className="flex justify-center">
                            <ul className="space-y-4 text-left max-w-[260px]">
                              {plan.features.map((f, idx) => (
                                <li key={idx} className="flex items-start space-x-3 text-stone-500 text-xs sm:text-[13px] font-sans font-light leading-relaxed">
                                  <span className="w-1 h-1 rounded-full bg-stone-300 shrink-0 mt-2"></span>
                                  <span>{f}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Plan Button (Solid Background Color) */}
                        <div className="pt-6 flex justify-center">
                          <Link
                            href="/book-a-session"
                            className="w-full max-w-[220px] h-11 inline-flex items-center justify-center text-[9px] sm:text-[10px] font-sans uppercase tracking-[0.25em] transition-all duration-300 border bg-[#8F9288] border-[#8F9288] text-white hover:bg-[#7D8076] hover:border-[#7D8076] hover:tracking-[0.3em] font-medium rounded-none cursor-pointer"
                          >
                            {lang === "FR" ? "S'INFORMER" : "ENQUIRE"}
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Maternity & Newborn Combo Section (Rendered only if additional combo plans exist) */}
              {pricing.plans.length > 3 && (
                <div className="space-y-12 pt-8 border-t border-stone-100">
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl sm:text-3xl tracking-[0.25em] font-serif text-brand-dark uppercase" style={{ fontWeight: 300 }}>
                      Maternity & Newborn Combo – Cherish Every Moment
                    </h3>
                    <p className="text-xs sm:text-sm font-serif italic text-stone-500">
                      Celebrate the journey from bump to baby with our exclusive photography packages
                    </p>
                  </div>

                  {/* Combo Packages Grid (Centered Flex Container for less than 3 packages) */}
                  <div className="flex flex-wrap justify-center gap-8 items-stretch">
                    {pricing.plans.slice(3).map((plan) => {
                      const priceData = parsePrice(plan.price);

                      return (
                        <div
                          key={plan.name}
                          className="bg-[#FCFAF9]/40 border border-stone-200/50 p-8 md:p-10 flex flex-col justify-between space-y-12 text-center transition-all duration-350 hover:bg-[#FCFAF9]/90 hover:shadow-xs group w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.33%-1.5rem)] max-w-[365px] min-w-[280px]"
                        >
                          <div className="space-y-8">
                            {/* Top Accent Bar inside column */}
                            <div className="w-8 h-[2px] bg-[#8F9288]/40 mx-auto transition-all group-hover:w-16 duration-300"></div>

                            {/* Plan Title */}
                            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-[#8F9288] block font-semibold">
                              {plan.name}
                            </span>

                            {/* Price Block */}
                            <div className="text-stone-400 font-serif italic text-sm">
                              {priceData.currency}
                              <span className="text-4xl sm:text-5xl font-extralight font-serif text-stone-600 italic ml-1 block -mt-1">
                                {priceData.value}
                              </span>
                            </div>

                            {/* Separator Accent */}
                            <div className="flex items-center justify-center space-x-2">
                              <div className="w-4 h-[0.5px] bg-stone-200"></div>
                              <span className="text-[7px] text-stone-300">✦</span>
                              <div className="w-4 h-[0.5px] bg-stone-200"></div>
                            </div>

                            {/* Plan Bullet Features */}
                            <div className="flex justify-center">
                              <ul className="space-y-4 text-left max-w-[260px]">
                                {plan.features.map((f, idx) => (
                                  <li key={idx} className="flex items-start space-x-3 text-stone-500 text-xs sm:text-[13px] font-sans font-light leading-relaxed">
                                    <span className="w-1 h-1 rounded-full bg-stone-300 shrink-0 mt-2"></span>
                                    <span>{f}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {/* Plan Button (Solid Background Color) */}
                          <div className="pt-6 flex justify-center">
                            <Link
                              href="/book-a-session"
                              className="w-full max-w-[220px] h-11 inline-flex items-center justify-center text-[9px] sm:text-[10px] font-sans uppercase tracking-[0.25em] transition-all duration-300 border bg-[#8F9288] border-[#8F9288] text-white hover:bg-[#7D8076] hover:border-[#7D8076] hover:tracking-[0.3em] font-medium rounded-none cursor-pointer"
                            >
                              {lang === "FR" ? "S'INFORMER" : "ENQUIRE"}
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Bottom Notes Block */}
              {pricing.notes_text && (
                <div className="bg-[#FAF8F5] border border-stone-200/60 p-8 md:p-12 rounded-none space-y-6 text-center max-w-4xl mx-auto">
                  {pricing.notes_text.split("\n\n").map((note, idx) => {
                    const isTitle = note.startsWith("NOTE:") || note.startsWith("Note:");
                    return (
                      <p
                        key={idx}
                        className={`text-stone-500 leading-relaxed font-sans ${
                          isTitle
                             ? "text-[11px] sm:text-xs uppercase tracking-[0.2em] font-medium text-stone-600"
                             : "text-xs sm:text-[13px] font-light max-w-2xl mx-auto"
                        }`}
                      >
                        {note}
                      </p>
                    );
                  })}
                </div>
              )}

            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
