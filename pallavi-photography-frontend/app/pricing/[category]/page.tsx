"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ArrowLeft, Check, Sparkles } from "lucide-react";

interface PricingPlan {
  name: string;
  price: string;
  description: string;
  features: string[];
}

const PRICING_DATA: Record<string, { title: string; subtitle: string; description: string; image: string; plans: PricingPlan[] }> = {
  newborn: {
    title: "Newborn Collection",
    subtitle: "Artistic, soft, and gentle newborn photography in-studio",
    description: "Capture the precious, fleeting details of your baby's first weeks. Our newborn sessions are held in a warm, sanitized studio environment with beautiful props, soft wraps, and natural lighting.",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=1200",
    plans: [
      {
        name: "Essential",
        price: "CHF 450",
        description: "Perfect to capture the first milestones",
        features: ["2 hours in-studio session", "15 fully edited high-res digital photos", "Access to beautiful newborn wardrobe & props", "Online private client gallery for selection", "Print release"]
      },
      {
        name: "Premium Legacy",
        price: "CHF 750",
        description: "Full baby storytelling collection including family photos",
        features: ["3 hours in-studio session", "30 fully edited high-res digital photos", "Newborn & sibling/parent poses included", "Custom fine art print album (10 pages)", "Online private client gallery", "Complimentary maternity mini-session voucher"]
      }
    ]
  },
  children: {
    title: "Children Portraits",
    subtitle: "Documenting milestone childhood memories with natural light",
    description: "Celebrate the growth, giggles, and personality of your children. Sessions can be conducted outdoors or in our minimalist natural-light studio setups.",
    image: "https://images.unsplash.com/photo-1476703719129-8eb99415f6e8?auto=format&fit=crop&q=80&w=1200",
    plans: [
      {
        name: "Studio Portrait",
        price: "CHF 380",
        description: "Minimalist classic studio portraiture",
        features: ["1 hour session", "12 edited high-res digital photos", "Minimalist studio backdrop setup", "Online private gallery", "Print release"]
      },
      {
        name: "Outdoor Storybook",
        price: "CHF 550",
        description: "Creative storytelling session in beautiful outdoor location",
        features: ["1.5 hours session in location", "25 edited high-res digital photos", "Natural settings, action and details documented", "Online private gallery", "Fine Art prints set (5 prints)"]
      }
    ]
  },
  family: {
    title: "Family Collections",
    subtitle: "Warm, authentic connections captured in natural locations",
    description: "Unscripted, warm laughter and real hugs in Vaud or Vevey. We focus on capturing authentic relationships and timeless moments in stunning Swiss nature backgrounds.",
    image: "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=1200",
    plans: [
      {
        name: "Golden Hour Session",
        price: "CHF 490",
        description: "Sunkissed portraiture in natural backdrop",
        features: ["1.5 hours sunset outdoor session", "20 edited high-res digital photos", "Up to 5 family members", "Online private selection gallery", "Print release"]
      },
      {
        name: "Elite Signature",
        price: "CHF 850",
        description: "The ultimate family heirloom session and album set",
        features: ["2 hours in choice location", "45 edited high-res digital photos", "Custom premium photo book album", "High-res downloads for sharing", "Unlimited group edits"]
      }
    ]
  },
  maternity: {
    title: "Maternity Grace",
    subtitle: "Elegant pregnancy portraiture celebrating a new chapter",
    description: "Honoring the beauty of motherhood. We provide guidance on elegant styling, wraps, and gorgeous locations (lakeside, mountain peaks, or studio) to celebrate your maternity journey.",
    image: "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=1200",
    plans: [
      {
        name: "Lakeside Sunset Session",
        price: "CHF 450",
        description: "Romantic pregnancy shoot by Geneva Lake",
        features: ["1.5 hours session", "15 edited high-res digital photos", "Access to elegant maternity gowns selection", "Partner & older children included", "Online private selection gallery"]
      },
      {
        name: "Maternity & Newborn Bundle",
        price: "CHF 990",
        description: "Save CHF 210 with this ultimate double milestone package",
        features: ["Full Lakeside Maternity session (15 photos)", "Full Legacy Newborn session (30 photos)", "Custom fine art print sets", "Extended session times", "Highest priority calendar slots reserving"]
      }
    ]
  },
  "fine-art": {
    title: "Fine Art Custom Portraiture",
    subtitle: "Highly styled editorial portraits resembling classic paintings",
    description: "Designed for those looking for signature, painting-like portraits. Custom painterly lighting, deep colors, and exquisite styling make these photographs standalone works of art.",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=1200",
    plans: [
      {
        name: "Single Creative Master",
        price: "CHF 600",
        description: "A unique painterly editorial portrait piece",
        features: ["2 hours structured conceptual shoot", "5 heavily retouched painterly masterpiece files", "Custom mood board and styling guidance", "Fine art museum-grade printed canvas (40x50cm)", "Print release"]
      }
    ]
  },
  nature: {
    title: "Nature Photostock",
    subtitle: "Licensing landscape and wildlife collections from Vaud",
    description: "High-resolution editorial and commercial licensing of stunning Swiss scenery, wildlife, and lake scenes from Vevey and the surrounding Alps.",
    image: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=1200",
    plans: [
      {
        name: "Standard License",
        price: "CHF 150 / image",
        description: "Digital web publication usage",
        features: ["High-res digital download", "Web/social usage permissions", "Lifetime digital royalty free usage"]
      },
      {
        name: "Commercial Exclusive",
        price: "CHF 600 / image",
        description: "Print and exclusive publication rights",
        features: ["TIFF and RAW files download", "Full print licensing", "Exclusive commercial print use release"]
      }
    ]
  },
  faqs: {
    title: "Pricing FAQs",
    subtitle: "Everything you need to know about booking and deliverables",
    description: "Transparency is key. Here are details about booking deposit fees, cancellation, dress selections, and image selection delivery windows.",
    image: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=1200",
    plans: [
      {
        name: "Booking & Retainer",
        price: "Deposit: CHF 150",
        description: "Retainer details",
        features: ["CHF 150 non-refundable deposit secures slot", "Balance payable on the shoot session date", "One rescheduling permitted with 48h notice"]
      },
      {
        name: "Turnaround Time",
        price: "Delivery: 2-3 Weeks",
        description: "Editing timelines",
        features: ["Online selection proofing gallery within 5 days", "Fully edited high-res downloads in 2-3 weeks", "Express delivery (3 days) available for CHF 100 surcharge"]
      }
    ]
  }
};

export default function PricingCategoryPage() {
  const params = useParams();
  const category = (params.category as string) || "newborn";
  
  const data = PRICING_DATA[category] || PRICING_DATA.newborn;

  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-brand-bg pt-32 pb-24">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 space-y-16">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest text-brand-muted hover:text-brand-dark transition-colors duration-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>

          {/* Intro Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-[10px] uppercase tracking-[0.3em] text-brand-sage font-semibold">
                Investment Packages
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-wide font-serif text-brand-dark leading-tight uppercase">
                {data.title}
              </h2>
              <p className="text-sm font-serif italic text-brand-muted leading-relaxed">
                "{data.subtitle}"
              </p>
              <p className="text-sm text-brand-muted leading-relaxed max-w-xl">
                {data.description}
              </p>
              
              <div className="pt-4">
                <Link
                  href="/book-a-session"
                  className="inline-flex items-center space-x-2 bg-brand-sage text-white text-xs uppercase tracking-widest px-8 py-3.5 hover:bg-brand-dark transition-colors duration-300 rounded-sm"
                >
                  <span>Book This Session</span>
                  <Sparkles className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="h-[400px] rounded-xs overflow-hidden shadow-lg border border-brand-border">
              <img
                src={data.image}
                alt={data.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Pricing cards grid */}
          <div className="space-y-10 pt-10">
            <h3 className="text-center text-xl tracking-[0.2em] font-light uppercase text-brand-dark">
              Available Sessions & Plans
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {data.plans.map((plan) => (
                <div
                  key={plan.name}
                  className="bg-brand-cream border border-brand-border p-8 md:p-10 rounded-xs flex flex-col justify-between space-y-8"
                >
                  <div className="space-y-4">
                    <span className="text-xs uppercase tracking-[0.2em] text-brand-sage block font-semibold">
                      {plan.name}
                    </span>
                    <div className="text-3xl font-light tracking-wider text-brand-dark">
                      {plan.price}
                    </div>
                    <p className="text-xs text-brand-muted italic">
                      {plan.description}
                    </p>
                    
                    <div className="w-8 h-[1px] bg-brand-sage/20 my-4"></div>
                    
                    <ul className="space-y-3.5">
                      {plan.features.map((f, idx) => (
                        <li key={idx} className="flex items-start space-x-3 text-xs text-brand-muted">
                          <Check className="w-3.5 h-3.5 text-brand-sage shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    href="/book-a-session"
                    className="w-full text-center border border-brand-dark/30 hover:border-brand-dark text-[10px] uppercase tracking-widest py-3 hover:bg-brand-dark hover:text-white transition-all duration-300 rounded-sm font-medium"
                  >
                    Select Plan
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
