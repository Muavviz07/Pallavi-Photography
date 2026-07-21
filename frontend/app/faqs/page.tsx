"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BreadcrumbsBanner from "@/components/common/BreadcrumbsBanner";
import { ChevronDown } from "lucide-react";
import { api } from "@/lib/api";

interface FAQItem {
  q: string;
  qFr?: string;
  a: React.ReactNode;
  aFr?: React.ReactNode;
}

interface FAQGroup {
  title: string;
  titleFr?: string;
  intro?: string;
  items: FAQItem[];
}

import { useTranslation } from "@/components/LanguageProvider";

export default function FAQsPage() {
  const { lang } = useTranslation("common");
  const [faqGroups, setFaqGroups] = useState<FAQGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const fallbackDataEN: FAQGroup[] = [
    {
      title: "Newborn Photography FAQs",
      intro: "If you are searching for a newborn photographer Vevey, you’re in the right place!",
      items: [
        {
          q: "When should I book my newborn photography session?",
          a: "It’s best to book your newborn photography session in Vevey during your second trimester to reserve your due date. Newborn sessions are ideally scheduled within 7–14 days after birth, when babies are naturally sleepy and curl into sweet, posed positions."
        },
        {
          q: "What props and wraps do you provide?",
          a: "I provide a wide selection of newborn photography props, including baskets, blankets, headbands, and wraps in various colors and textures. Before your session, we will discuss your preferred color palette and styling so the images match your vision and home décor."
        },
        {
          q: "Can parents and siblings be included?",
          a: "Absolutely! Parent and sibling portraits are always encouraged to capture timeless family memories alongside your newborn."
        },
        {
          q: "How long does a newborn session last?",
          a: "Newborn sessions typically last 2–4 hours to allow for feeding, soothing, and gentle posing while keeping your baby comfortable and safe."
        }
      ]
    },
    {
      title: "Maternity Photography FAQs",
      items: [
        {
          q: "When is the best time for a maternity photoshoot?",
          a: "The ideal window for maternity photography is 28–36 weeks of pregnancy, when your baby bump is beautifully defined and you’re still comfortable moving naturally."
        },
        {
          q: "What should I wear for my maternity photos?",
          a: "Before your session, we will discuss what to wear. I provide styling guidance and a wide selection of maternity wardrobe options, including flowing gowns and dresses, which you may choose for your photoshoot. This ensures you feel confident and radiant. If you are searching for a maternity photographer Vaud area, you’re in the right place!"
        },
        {
          q: "Can my partner and children join the session?",
          a: "Of course! Maternity photography celebrates your growing family, so partners and siblings are always welcome."
        },
        {
          q: "Where do maternity sessions take place?",
          a: "Maternity sessions can be held outdoors or indoors. For outdoor sessions, I carefully select the date based on weather conditions, usually finalizing it 1–2 weeks in advance to ensure the best light and comfort."
        }
      ]
    },
    {
      title: "Family Photography FAQs",
      items: [
        {
          q: "What should we wear for our family photoshoot?",
          a: "After booking, I provide a family styling guide to help coordinate outfits. Neutral tones, soft textures, and complementary colors photograph beautifully, keeping the focus on your family’s connection."
        },
        {
          q: "How long is a family session?",
          a: "Family sessions typically last 1–2 Hours, allowing time for both posed portraits and natural, candid moments."
        },
        {
          q: "What if my children don’t cooperate?",
          a: "No worries! I use playful prompts and gentle guidance to capture authentic smiles and interactions. Many of the best photos happen during candid, relaxed moments."
        },
        {
          q: "Where do family sessions take place?",
          a: "Sessions can be outdoors at scenic locations in Vevey, Lausanne, Montreux, Morges, Fribourg, and surrounding Vaud areas, or indoors."
        }
      ]
    },
    {
      title: "Booking & Session Information",
      items: [
        {
          q: "How do I book a session?",
          a: "You can book your newborn, maternity, or family photography session in several ways:\n- Fill out the contact form on my website\n- Send a message via WhatsApp or email using the contact details listed on the website\n\nOnce your session is confirmed, you will receive a client agreement to review and sign. To secure your session date, a signed agreement and advance payment are required. For newborn sessions, the booking is scheduled based on your due date, and the exact session date will be finalized after your baby arrives."
        },
        {
          q: "What happens after the session?",
          a: "After your session, I edit the best images in 3-4 weeks and share them in a private online gallery. From this gallery, you can:\n- Select your favorite images\n- Choose a photography package based on the number of photos you want\n- Choose additional print products you wish to order\n\nThis ensures you only pay for what you love."
        },
        {
          q: "What print products do you offer?",
          a: "Besides the prints included in your package, I offer high-quality professional prints, including:\n- Large fine art prints\n- Passepartout (matted) prints\n- Canvas wall art\n- Premium photo books in various sizes\n\nAll prints are made with professional-grade materials for lasting color and archival quality. Please reach out for product options and pricing."
        },
        {
          q: "How do we receive our photos and prints?",
          a: "Once full payment is completed:\n- Your selected digital images are delivered for download\n- Print products are processed\n\nPrint delivery options:\n- Smaller prints can be posted (additional postage charges apply)\n- Larger fine art prints, canvases, and wall art must be collected in Vevey to ensure safe handling"
        }
      ]
    },
    {
      title: "Local Service Areas & Outdoor Sessions",
      items: [
        {
          q: "Do you photograph families from Lausanne or other cities?",
          a: "I serve Vevey, Lausanne, Montreux, Morges, Fribourg, and other areas in Vaud."
        },
        {
          q: "How do you choose the date for outdoor sessions?",
          a: "For outdoor sessions, I carefully select dates based on weather conditions and usually finalize the session 1–2 weeks in advance to ensure the best lighting, comfort, and results."
        }
      ]
    }
  ];

  const fallbackDataFR: FAQGroup[] = [
    {
      title: "Questions Fréquentes - Photographie de Nouveau-Né",
      intro: "Si vous cherchez un photographe de nouveau-né à Vevey, vous êtes au bon endroit !",
      items: [
        {
          q: "Quand dois-je réserver ma séance de photographie de nouveau-né ?",
          a: "Il est préférable de réserver votre séance photo de nouveau-né à Vevey au cours de votre deuxième trimestre pour garantir la disponibilité autour de votre date d'accouchement. Les séances pour nouveau-nés sont idéalement planifiées dans les 7 à 14 jours suivant la naissance, lorsque les bébés dorment naturellement beaucoup et se recroquevillent facilement dans ces douces poses."
        },
        {
          q: "Quels accessoires et langes fournissez-vous ?",
          a: "Je fournis une large sélection d'accessoires de photographie pour nouveau-nés, y compris des paniers, des couvertures, des bandeaux et des langes dans divers coloris et textures. Avant votre séance, nous discuterons de vos préférences de palette de couleurs et de style pour que les images s'accordent à votre vision et à votre décoration intérieure."
        },
        {
          q: "Les parents et les frères et sœurs peuvent-ils être inclus ?",
          a: "Absolument ! Les portraits de famille avec les parents et la fratrie sont toujours encouragés pour capturer des souvenirs précieux aux côtés de votre nouveau-né."
        },
        {
          q: "Combien de temps dure une séance pour nouveau-né ?",
          a: "Les séances pour nouveau-nés durent généralement de 2 à 4 heures pour permettre de nourrir, apaiser et poser doucement votre bébé tout en assurant son confort et sa sécurité."
        }
      ]
    },
    {
      title: "Questions Fréquentes - Photographie de Maternité",
      items: [
        {
          q: "Quel est le meilleur moment pour une séance photo de grossesse ?",
          a: "Le moment idéal pour la photographie de maternité se situe entre la 28ème et la 36ème semaine de grossesse, lorsque votre ventre est joliment arrondi et que vous pouvez encore vous déplacer confortablement."
        },
        {
          q: "Que dois-je porter pour mes photos de maternité ?",
          a: "Avant votre séance, nous conviendrons ensemble de votre tenue. Je propose des conseils de style et un grand choix de robes de maternité fluides et d'habits de grossesse parmi lesquels vous pourrez choisir pour votre séance. Cela vous garantit de vous sentir confiante et radieuse. Si vous cherchez un photographe de maternité dans la région de Vaud, vous êtes au bon endroit !"
        },
        {
          q: "Mon partenaire et mes enfants peuvent-ils participer à la séance ?",
          a: "Bien sûr ! La photographie de maternité célèbre l'agrandissement de votre famille, les partenaires et les enfants sont donc toujours les bienvenus."
        },
        {
          q: "Où se déroulent les séances de maternité ?",
          a: "Les séances de maternité peuvent avoir lieu en extérieur ou en intérieur. Pour les séances en extérieur, je sélectionne soigneusement la date en fonction des conditions météorologiques, généralement en la finalisant 1 à 2 semaines à l'avance pour garantir une lumière optimale et votre confort."
        }
      ]
    },
    {
      title: "Questions Fréquentes - Photographie de Famille",
      items: [
        {
          q: "Que devons-nous porter pour notre séance photo de famille ?",
          a: "Après la réservation, je vous fournis un guide de style pour vous aider à coordonner vos tenues. Les tons neutres, les matières douces et les couleurs complémentaires rendent magnifiquement en photo, mettant en valeur la complicité et l'affection de votre famille."
        },
        {
          q: "Combien de temps dure une séance de famille ?",
          a: "Les séances de famille durent généralement de 1 à 2 heures, laissant le temps pour des portraits posés ainsi que pour des moments spontanés et naturels."
        },
        {
          q: "Que se passe-t-il si mes enfants ne coopèrent pas ?",
          a: "Pas de panique ! J'utilise des invitations au jeu et des conseils bienveillants pour capturer des sourires et des échanges authentiques. Les meilleures photos surviennent souvent lors de moments spontanés et détendus."
        },
        {
          q: "Où se déroulent les séances de famille ?",
          a: "Les séances peuvent se dérouler en extérieur dans des endroits magnifiques à Vevey, Lausanne, Montreux, Morges, Fribourg et dans d'autres régions de Vaud, ou en intérieur."
        }
      ]
    },
    {
      title: "Réservation & Informations Pratiques",
      items: [
        {
          q: "Comment réserver une séance ?",
          a: "Vous pouvez réserver votre séance de photographie de nouveau-né, de maternité ou de famille de plusieurs façons :\n- Remplissez le formulaire de contact sur mon site web\n- Envoyer un message via WhatsApp ou par e-mail en utilisant les coordonnées indiquées sur le site\n\nUne fois votre séance confirmée, vous recevrez un contrat client à lire et à signer. Pour bloquer la date de votre séance, le contrat signé et un acompte sont requis. Pour les séances nouveau-né, la réservation est planifiée en fonction de votre date de terme prévue, et la date exacte de la séance sera finalisée après la naissance de votre bébé."
        },
        {
          q: "Que se passe-t-il après la séance ?",
          a: "Après votre séance, je traite et retouche les meilleures photos sous 3 à 4 semaines et les partage dans une galerie en ligne privée. Depuis cette galerie, vous pouvez :\n- Sélectionner vos photos préférées\n- Choisir une formule photo en fonction du nombre d'images souhaité\n- Commander des tirages physiques ou des produits imprimés supplémentaires\n\nCela vous garantit de ne payer que pour ce que vous aimez."
        },
        {
          q: "Quels produits imprimés proposez-vous ?",
          a: "En plus des tirages inclus dans vos formules, je propose des impressions professionnelles de haute qualité, notamment :\n- Grands tirages d'art (fine art)\n- Tirages avec passe-partout\n- Impressions sur toile\n- Livres photo haut de gamme de différents formats\n\nTous les tirages sont fabriqués avec des matériaux de qualité professionnelle pour garantir des couleurs durables et une conservation optimale. Veuillez me contacter pour connaître les tarifs détaillés des produits."
        },
        {
          q: "Comment recevons-nous nos photos et tirages ?",
          a: "Une fois le règlement finalisé :\n- Vos fichiers numériques sélectionnés vous sont livrés en téléchargement\n- La commande de vos impressions physiques est lancée\n\nOptions de livraison des tirages :\n- Les petits formats peuvent être envoyés par la poste (frais de port en sus)\n- Les grands formats d'art, toiles et cadres doivent être récupérés à Vevey pour éviter tout dommage durant le transport"
        }
      ]
    },
    {
      title: "Zones Desservies & Séances en Extérieur",
      items: [
        {
          q: "Réalisez-vous des séances pour des familles de Lausanne ou d'autres villes ?",
          a: "Je dessers Vevey, Lausanne, Montreux, Morges, Fribourg et d'autres localités du canton de Vaud."
        },
        {
          q: "Comment choisissez-vous la date pour les séances en plein air ?",
          a: "Pour les séances en extérieur, je sélectionne soigneusement les météos et finalise généralement le rendez-vous 1 à 2 semaines à l'avance pour garantir le meilleur confort, les plus belles lumières et un rendu idéal."
        }
      ]
    }
  ];

  useEffect(() => {
    async function loadFaqs() {
      try {
        const res = await api.get<any[]>("/faqs");
        if (res && res.length > 0) {
          const groupsMap: Record<string, { title: string; titleFr: string; items: FAQItem[] }> = {};
          
          res.forEach((item) => {
            const catKey = item.category;
            if (!groupsMap[catKey]) {
              groupsMap[catKey] = {
                title: item.category,
                titleFr: item.category_fr || item.category,
                items: []
              };
            }
            groupsMap[catKey].items.push({
              q: item.question,
              qFr: item.question_fr || item.question,
              a: item.answer,
              aFr: item.answer_fr || item.answer
            });
          });

          const sortedGroups = Object.values(groupsMap);
          setFaqGroups(sortedGroups as FAQGroup[]);
        } else {
          setFaqGroups(lang === "FR" ? fallbackDataFR : fallbackDataEN);
        }
      } catch (err) {
        console.warn("Failed to load dynamic FAQs, falling back to static", err);
        setFaqGroups(lang === "FR" ? fallbackDataFR : fallbackDataEN);
      } finally {
        setLoading(false);
      }
    }
    loadFaqs();
  }, [lang]);

  const toggleItem = (groupIdx: number, itemIdx: number) => {
    const key = `${groupIdx}-${itemIdx}`;
    setOpenItems((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <>
      <Header />

      <BreadcrumbsBanner
        title={lang === "FR" ? "FAQ" : "FAQS"}
        paths={[
          { label: lang === "FR" ? "Accueil" : "Home", href: "/" },
          { label: lang === "FR" ? "FAQ" : "FAQs" }
        ]}
      />

      <main className="bg-white py-16">
        <div className="max-w-[1250px] mx-auto px-6 md:px-10 space-y-16">
          
          {/* Header Introduction (Wide Layout) */}
          <div className="space-y-6 text-left border-b border-stone-100 pb-12 w-full">
            <h1 className="text-xl sm:text-2xl md:text-[28px] tracking-[0.15em] font-serif text-brand-dark uppercase font-light leading-snug">
              {lang === "FR"
                ? "FAQ - Photographe Famille, Maternité, Nouveau-Né & Enfants – Vevey, Vaud, Suisse"
                : "Family, Maternity, Newborn & Children Photographer FAQs – Vevey, Vaud, Switzerland"}
            </h1>
            
            <p className="text-sm text-stone-500 font-sans font-light leading-relaxed tracking-wide text-justify max-w-5xl">
              {lang === "FR"
                ? "Bienvenue ! Vous trouverez ici les réponses aux questions courantes sur la photographie de nouveau-né, de maternité et de famille à Vevey et ses environs, notamment Lausanne, Montreux, Morges, Fribourg et dans toute la région de Vaud. Apprenez-en plus sur le déroulement des séances, les vêtements à privilégier, les accessoires, les tirages et comment réserver votre séance photo."
                : "Welcome! Here you’ll find answers to common questions about newborn, maternity, and family photography in Vevey and nearby areas including Lausanne, Montreux, Morges, Fribourg, and across the Vaud region. Learn more about how sessions work, what to wear, props, prints, and how to book your photography session."}
            </p>
          </div>

          {/* Accordion Categories (Constrained and Centered for reading focus) */}
          <div className="space-y-16 w-full max-w-[980px] mx-auto">
            {faqGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-6">
                
                {/* Category Header */}
                <h2 className="text-lg sm:text-xl md:text-[22px] tracking-[0.1em] font-serif text-[#2C2623] font-medium border-b border-stone-200/80 pb-3.5 mt-8">
                  {lang === "FR" ? (group.titleFr || group.title) : group.title}
                </h2>

                {group.intro && (
                  <p className="text-xs text-stone-400 font-serif italic -mt-3">
                    {group.intro}
                  </p>
                )}

                {/* Group Accordions */}
                <div className="divide-y divide-stone-100/80">
                  {group.items.map((item, itemIdx) => {
                    const isOpen = !!openItems[`${groupIdx}-${itemIdx}`];
                    const questionText = lang === "FR" ? (item.qFr || item.q) : item.q;
                    const answerContent = lang === "FR" ? (item.aFr || item.a) : item.a;

                    return (
                      <div key={itemIdx} className="py-5 sm:py-6 space-y-3 transition-all duration-300">
                        {/* Toggle header */}
                        <button
                          onClick={() => toggleItem(groupIdx, itemIdx)}
                          className="w-full flex items-center justify-between text-left text-stone-700 hover:text-stone-900 transition-colors py-1.5 focus:outline-hidden cursor-pointer"
                        >
                          <span className="font-serif text-[15px] sm:text-base md:text-[17px] font-light leading-snug tracking-wide">
                            {questionText}
                          </span>
                          <span className="text-stone-400 shrink-0 ml-4">
                            <ChevronDown className={`w-4.5 h-4.5 text-stone-400 transition-transform duration-350 ease-in-out ${isOpen ? "rotate-180 text-[#8F9288]" : ""}`} />
                          </span>
                        </button>

                        {/* Smooth Height Transition Body */}
                        <div
                          className={`grid transition-all duration-350 ease-in-out overflow-hidden text-xs sm:text-sm text-stone-500 font-sans font-light leading-relaxed tracking-wide text-justify ${
                            isOpen ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0"
                          }`}
                        >
                          <div className="overflow-hidden">
                            <div className="pb-3 text-stone-500 font-sans font-light leading-relaxed text-[13px] sm:text-[13.5px] max-w-5xl whitespace-pre-line">
                              {answerContent}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            ))}
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}
