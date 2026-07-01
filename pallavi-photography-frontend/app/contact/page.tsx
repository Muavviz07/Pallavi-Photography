"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BreadcrumbsBanner from "@/components/common/BreadcrumbsBanner";
import { CheckCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

const contactTranslations = {
  EN: {
    bannerTitle: "CONTACT",
    emailLabel: "EMAIL",
    callLabel: "CALL ME",
    whatsappLabel: "WHATSAPP",
    followLabel: "FOLLOW",
    nameFormLabel: "NAME",
    emailFormLabel: "E-MAIL",
    dateFormLabel: "TENTATIVE DATE",
    messageFormLabel: "TELL US MORE",
    sendBtn: "SEND",
    successTitle: "Message Sent!",
    successDesc: "Thank you for reaching out. We have received your inquiry and will respond within 24–48 hours to discuss your photography details.",
  },
  FR: {
    bannerTitle: "CONTACT",
    emailLabel: "E-MAIL",
    callLabel: "APPELEZ-MOI",
    whatsappLabel: "WHATSAPP",
    followLabel: "SUIVRE",
    nameFormLabel: "NOM",
    emailFormLabel: "E-MAIL",
    dateFormLabel: "DATE PRÉVUE",
    messageFormLabel: "DITES-EN PLUS",
    sendBtn: "ENVOYER",
    successTitle: "Message Envoyé !",
    successDesc: "Merci pour votre message. Nous avons bien reçu votre demande et nous vous répondrons dans les 24 à 48 heures pour discuter des détails de votre séance.",
  }
};

export default function ContactPage() {
  const [lang, setLang] = useState("EN");
  const [contactData, setContactData] = useState({
    title: "LET'S CONNECT",
    title_fr: "CONTACTONS-NOUS",
    p1: "Whether you’re looking to book a session, ask a question, or just say hello — I’d love to hear from you. Every story is unique, and I’m here to help you capture yours in the most beautiful way.",
    p1_fr: "Que vous souhaitiez réserver une séance, poser une question ou simplement dire bonjour, j’aimerais beaucoup avoir de vos nouvelles. Chaque histoire est unique et je suis là pour vous aider à capturer la vôtre de la plus belle des manières.",
    p2: "Have a date in mind? Drop a message with the type of shoot you’re interested in — portraits, events, lifestyle, or something personal — and we’ll make it happen.",
    p2_fr: "Vous avez une date en tête ? Laissez un message avec le type de séance qui vous intéresse — portraits, événements, style de vie ou quelque chose de personnel — et nous ferons en sorte que cela se réalise.",
    email: "pallavi.vishk@gmail.com",
    phone: "+41 789077644",
    whatsapp: "+41 789077644",
    instagram: "@pallavivishk"
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    tentative_date: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("lang") || "EN";
    setLang(stored);

    const handleLangChange = () => {
      setLang(localStorage.getItem("lang") || "EN");
    };

    window.addEventListener("languagechange", handleLangChange);
    return () => window.removeEventListener("languagechange", handleLangChange);
  }, []);

  // Fetch dynamic contact data
  useEffect(() => {
    async function loadContactSection() {
      try {
        const res = await api.get<any>("/contact");
        if (res) {
          setContactData(res);
        }
      } catch (err) {
        console.warn("Failed to load contact section from backend, using fallbacks", err);
      }
    }
    loadContactSection();
  }, []);

  const t = contactTranslations[lang as "EN" | "FR"] || contactTranslations.EN;
  const displayTitle = lang === "FR" ? (contactData.title_fr || contactData.title) : contactData.title;
  const displayP1 = lang === "FR" ? (contactData.p1_fr || contactData.p1) : contactData.p1;
  const displayP2 = lang === "FR" ? (contactData.p2_fr || contactData.p2) : contactData.p2;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        message: `[Tentative Date: ${formData.tentative_date || "Not Specified"}]\n\n${formData.message}`,
      };

      await api.post("/enquiries", payload);
      setStatus("success");
      setFormData({ name: "", email: "", tentative_date: "", message: "" });
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || (lang === "FR" ? "Une erreur est survenue." : "An unexpected error occurred. Please try again."));
    }
  };

  return (
    <>
      <Header />

      <BreadcrumbsBanner
        title={t.bannerTitle}
        paths={[
          { label: lang === "FR" ? "Accueil" : "Home", href: "/" },
          { label: "Contact" }
        ]}
      />

      <main className="bg-white py-16">
        <div className="max-w-[1250px] mx-auto px-6 md:px-10 space-y-16">
          
          {/* Page Main Title */}
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-brand-dark uppercase tracking-[0.25em] font-light">
              {displayTitle}
            </h1>
          </div>

          {/* Four Columns Contact Info Rows */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center border-b border-stone-100 pb-12">
            
            {/* EMAIL */}
            <div className="space-y-1">
              <span className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-[#8F9288] block font-medium">
                {t.emailLabel}
              </span>
              <a
                href={`mailto:${contactData.email}`}
                className="text-stone-500 font-sans font-light text-[13px] sm:text-sm tracking-wide hover:text-stone-850 transition-colors"
              >
                {contactData.email}
              </a>
            </div>

            {/* CALL ME */}
            <div className="space-y-1">
              <span className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-[#8F9288] block font-medium">
                {t.callLabel}
              </span>
              <a
                href={`tel:${contactData.phone}`}
                className="text-stone-500 font-sans font-light text-[13px] sm:text-sm tracking-wide hover:text-stone-850 transition-colors"
              >
                {contactData.phone}
              </a>
            </div>

            {/* WHATSAPP */}
            <div className="space-y-1">
              <span className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-[#8F9288] block font-medium">
                {t.whatsappLabel}
              </span>
              <a
                href={`https://wa.me/${contactData.whatsapp.replace(/\s+/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-500 font-sans font-light text-[13px] sm:text-sm tracking-wide hover:text-stone-850 transition-colors"
              >
                {contactData.whatsapp}
              </a>
            </div>

            {/* FOLLOW */}
            <div className="space-y-1">
              <span className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-[#8F9288] block font-medium">
                {t.followLabel}
              </span>
              <a
                href={`https://instagram.com/${contactData.instagram.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-500 font-sans font-light text-[13px] sm:text-sm tracking-wide hover:text-stone-850 transition-colors"
              >
                {contactData.instagram}
              </a>
            </div>

          </div>

          {/* Two Columns Grid: Picture & Contact Form */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-20 items-start">
            
            {/* Left side Image (Portrait from about-me page) */}
            <div className="col-span-1 md:col-span-6 flex justify-center">
              <div className="w-full max-w-[480px] aspect-[3/4] overflow-hidden bg-stone-50 border border-stone-200/50 shadow-xs">
                <img
                  src="/Pallavi.jpg"
                  alt="Pallavi Portrait Photographer Swiss"
                  className="w-full h-full object-cover hover:scale-101 transition-transform duration-500"
                />
              </div>
            </div>

            {/* Right side Texts and Contact Form */}
            <div className="col-span-1 md:col-span-6 space-y-10">
              
              {/* Introduction paragraphs */}
              <div className="space-y-5 text-stone-500 font-sans font-light leading-relaxed tracking-wide text-justify text-sm">
                <p className="font-serif italic text-base text-[#8F9288] leading-relaxed">
                  {displayP1}
                </p>
                <p>
                  {displayP2}
                </p>
              </div>

              {/* Form implementation */}
              <div className="w-full">
                {status === "success" ? (
                  <div className="text-center py-12 space-y-4 border border-stone-200/60 p-8 bg-[#FAF8F5]">
                    <CheckCircle className="w-12 h-12 text-[#8F9288] mx-auto animate-bounce" />
                    <h4 className="text-lg font-serif font-light text-brand-dark uppercase">
                      {t.successTitle}
                    </h4>
                    <p className="text-xs text-stone-500 font-light leading-relaxed max-w-sm mx-auto">
                      {t.successDesc}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-8">
                    
                    {/* NAME */}
                    <div className="flex flex-col space-y-2">
                      <label
                        htmlFor="name"
                        className="text-[10px] uppercase tracking-[0.25em] text-stone-400 font-medium"
                      >
                        {t.nameFormLabel}
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        disabled={status === "loading"}
                        className="w-full bg-transparent border-b border-stone-200 py-2 text-sm text-stone-800 outline-hidden focus:border-[#8F9288] transition-colors duration-300 disabled:opacity-60"
                      />
                    </div>

                    {/* EMAIL */}
                    <div className="flex flex-col space-y-2">
                      <label
                        htmlFor="email"
                        className="text-[10px] uppercase tracking-[0.25em] text-stone-400 font-medium"
                      >
                        {t.emailFormLabel}
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        disabled={status === "loading"}
                        className="w-full bg-transparent border-b border-stone-200 py-2 text-sm text-stone-800 outline-hidden focus:border-[#8F9288] transition-colors duration-300 disabled:opacity-60"
                      />
                    </div>

                    {/* TENTATIVE DATE */}
                    <div className="flex flex-col space-y-2">
                      <label
                        htmlFor="tentative_date"
                        className="text-[10px] uppercase tracking-[0.25em] text-stone-400 font-medium"
                      >
                        {t.dateFormLabel}
                      </label>
                      <input
                        type="text"
                        id="tentative_date"
                        name="tentative_date"
                        placeholder="DD.MM.YYYY"
                        value={formData.tentative_date}
                        onChange={handleChange}
                        disabled={status === "loading"}
                        className="w-full bg-transparent border-b border-stone-200 py-2 text-sm text-stone-800 placeholder-stone-300 outline-hidden focus:border-[#8F9288] transition-colors duration-300 disabled:opacity-60"
                      />
                    </div>

                    {/* TELL US MORE */}
                    <div className="flex flex-col space-y-2">
                      <label
                        htmlFor="message"
                        className="text-[10px] uppercase tracking-[0.25em] text-stone-400 font-medium"
                      >
                        {t.messageFormLabel}
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        required
                        rows={4}
                        value={formData.message}
                        onChange={handleChange}
                        disabled={status === "loading"}
                        className="w-full bg-transparent border-b border-stone-200 py-2 text-sm text-stone-800 outline-hidden focus:border-[#8F9288] transition-colors duration-300 resize-none min-h-[100px] disabled:opacity-60"
                      />
                    </div>

                    {status === "error" && (
                      <p className="text-xs text-red-600 font-light">{errorMessage}</p>
                    )}

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={status === "loading"}
                        className="w-full h-12 inline-flex items-center justify-center text-[10px] font-sans uppercase tracking-[0.25em] text-white bg-[#8F9288] hover:bg-[#7D8076] transition-colors duration-300 cursor-pointer disabled:opacity-60 select-none rounded-none"
                      >
                        {status === "loading" ? (
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                        ) : (
                          t.sendBtn
                        )}
                      </button>
                    </div>

                  </form>
                )}
              </div>

            </div>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}
