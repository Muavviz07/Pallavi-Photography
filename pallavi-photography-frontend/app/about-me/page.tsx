"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BreadcrumbsBanner from "@/components/common/BreadcrumbsBanner";

const aboutTranslations = {
  EN: {
    bannerTitle: "ABOUT ME",
    breadcrumbHome: "Home",
    breadcrumbAbout: "About Me",
    quoteText: "There’s a quiet story and a unique kind of beauty in everything around us.",
    heading: "I'M PALLAVI,",
    p1: "your Newborn babies, children, family, maternity and nature photographer based in Vevey, Switzerland. I am here to capture photographs of your family, children, babies and grandparents which evoke emotions, tell stories and build connections. It has been an incredible journey ever since I picked my camera. Learning the art and knowing what I can create with my camera is phenomenal. I started my journey with nature photography and now, I absolutely love to capture family portrait photographs. Over the years, I have attended portrait workshops, online training, to better fine tune my skills which are naturally embedded in me as a nature photographer.",
    p2: "I am equally passionate for portrait and nature photography. Where, portrait photography honours me to capture beautiful and timeless images for you, nature photography gives me a chance to capture uniqueness and beautiful art of nature. Photography has given me the present of capturing the stories of today. I believe a photograph possesses the power to narrate the stories in generations to come, all without sound or words. This is why I feel privileged to be a part of this art form, and I am grateful for every moment I get to spend behind the camera.",
    p3: "So if you want to have a lovely portrait created for Newborn babies, children, family, maternity then , please contact me to book a photography session and let me capture the moment which matters most to you",
    p4: "And if nature speaks to your heart like it does to mine, feel free to explore my NatureVibes gallery — a curated collection of fine art photographs available for purchase and licensing. Simply reach out to me for high-resolution quotes or custom orders.",
    p5: "Thank you for being here. I look forward to capturing the moments that matter most to you."
  },
  FR: {
    bannerTitle: "À PROPOS DE MOI",
    breadcrumbHome: "Accueil",
    breadcrumbAbout: "À Propos de Moi",
    quoteText: "Il y a une histoire silencieuse et une beauté unique dans chaque chose qui nous entoure.",
    heading: "JE SUIS PALLAVI,",
    p1: "votre photographe de nouveau-nés, d'enfants, de famille, de maternité et de nature basée à Vevey, en Suisse. Je suis ici pour capturer des photographies de votre famille, de vos enfants, de vos bébés et de vos grands-parents qui évoquent des émotions, racontent des histoires et créent des liens. C'est un voyage incroyable depuis que j'ai pris mon appareil photo. Apprendre l'art et savoir ce que je peux créer avec mon appareil photo est phénoménal. J'ai commencé mon parcours avec la photographie de nature et maintenant, j'adore capturer des portraits de famille. Au fil des ans, j'ai participé à des ateliers de portrait et à des formations en ligne pour perfectionner mes compétences, qui sont naturellement ancrées en moi en tant que photographe de nature.",
    p2: "Je suis également passionnée par la photographie de portrait et de nature. Là où la photographie de portrait m'honore de capturer des images magnifiques et intemporelles pour vous, la photographie de nature me donne la chance de capturer la singularité et l'art de la nature. La photographie m'a offert le cadeau de capturer les histoires d'aujourd'hui. Je crois qu'une photographie possède le pouvoir de raconter des histoires aux générations à venir, le tout sans bruit ni paroles. C'est pourquoi je me sens privilégiée de faire partie de cette forme d'art, et je suis reconnaissante pour chaque instant que je passe derrière l'appareil photo.",
    p3: "Alors si vous souhaitez avoir un joli portrait créé pour votre nouveau-né, vos enfants, votre famille ou votre maternité, veuillez me contacter pour réserver une séance photo et laissez-moi capturer le moment qui compte le plus pour vous.",
    p4: "Et si la nature parle à votre cœur comme elle le fait au mien, n'hésitez pas à explorer ma galerie NatureVibes — une collection soigneusement sélectionnée de photographies d'art disponibles à l'achat et sous licence. Contactez-moi simplement pour obtenir des devis haute résolution ou des commandes personnalisées.",
    p5: "Merci d'être ici. J'ai hâte de capturer les moments qui comptent le plus pour vous."
  }
};

export default function AboutMePage() {
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

  const t = aboutTranslations[lang as "EN" | "FR"] || aboutTranslations.EN;

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
