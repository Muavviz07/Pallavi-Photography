"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BreadcrumbsBanner from "@/components/common/BreadcrumbsBanner";

import { useTranslation } from "@/components/LanguageProvider";

export default function AboutMePage() {
  const { t: translate, lang } = useTranslation("common");

  const t = {
    bannerTitle: translate("aboutBtn", "ABOUT ME"),
    breadcrumbHome: translate("home", "Home"),
    breadcrumbAbout: translate("aboutMe", "About Me"),
    quoteText: translate("aboutQuote", "There’s a quiet story and a unique kind of beauty in everything around us."),
    heading: translate("aboutMeHeadline", "I'M PALLAVI,"),
    p1: translate("aboutMeP1", "your Newborn babies, children, family, maternity and nature photographer based in Vevey, Switzerland. I am here to capture photographs of your family, children, babies and grandparents which evoke emotions, tell stories and build connections. It has been an incredible journey ever since I picked my camera. Learning the art and knowing what I can create with my camera is phenomenal. I started my journey with nature photography and now, I absolutely love to capture family portrait photographs. Over the years, I have attended portrait workshops, online training, to better fine tune my skills which are naturally embedded in me as a nature photographer."),
    p2: translate("aboutMeP2", "I am equally passionate for portrait and nature photography. Where, portrait photography honours me to capture beautiful and timeless images for you, nature photography gives me a chance to capture uniqueness and beautiful art of nature. Photography has given me the present of capturing the stories of today. I believe a photograph possesses the power to narrate the stories in generations to come, all without sound or words. This is why I feel privileged to be a part of this art form, and I am grateful for every moment I get to spend behind the camera."),
    p3: translate("aboutMeP3", "So if you want to have a lovely portrait created for Newborn babies, children, family, maternity then , please contact me to book a photography session and let me capture the moment which matters most to you"),
    p4: translate("aboutMeP4", "And if nature speaks to your heart like it does to mine, feel free to explore my NatureVibes gallery — a curated collection of fine art photographs available for purchase and licensing. Simply reach out to me for high-resolution quotes or custom orders."),
    p5: translate("aboutMeP5", "Thank you for being here. I look forward to capturing the moments that matter most to you."),
  };

  return (
    <>
      <Header />

      {/* Standardized Breadcrumbs Banner */}
      <BreadcrumbsBanner
        title={t.bannerTitle}
        paths={[
          { label: "Home", href: "/" },
          { label: "About Me" }
        ]}
      />

      {/* Main Content Body */}
      <main className="py-16 md:py-20 bg-white">
        <div className="max-w-[1100px] mx-auto px-6 md:px-10 space-y-16">
          
          {/* Top Row: Picture + Quote */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-center">
            {/* Left side Image */}
            <div className="col-span-1 md:col-span-6 flex justify-center md:justify-start">
              <div className="w-full max-w-[420px] aspect-square overflow-hidden bg-brand-cream border border-brand-border/40 rounded-xs shadow-xs">
                <img
                  src="/Pallavi.jpg"
                  alt="Pallavi Portrait Photographer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Right side Elegant Quote */}
            <div className="col-span-1 md:col-span-6 flex items-center justify-center py-4">
              <div className="relative pl-12 pr-6 py-4">
                {/* Large visual quote marks */}
                <span className="absolute left-0 top-0 text-[100px] font-serif leading-none text-stone-200 select-none pointer-events-none font-light">
                  “
                </span>
                <p className="font-serif italic text-base sm:text-lg md:text-xl text-stone-600 leading-relaxed font-light relative z-10">
                  {t.quoteText}
                </p>
                <span className="absolute right-0 bottom-[-30px] text-[100px] font-serif leading-none text-stone-200 select-none pointer-events-none font-light">
                  ”
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Row: Biography Content */}
          <div className="space-y-6 pt-4">
            <h2 className="text-2xl sm:text-3xl tracking-[0.25em] font-serif text-[#2C2623] uppercase">
              {t.heading}
            </h2>
            
            <div className="space-y-6 text-sm text-stone-500 font-sans font-light leading-relaxed tracking-wide text-justify">
              <p>{t.p1}</p>
              <p>{t.p2}</p>
              <p>{t.p3}</p>
              <p>{t.p4}</p>
              <p>{t.p5}</p>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}
