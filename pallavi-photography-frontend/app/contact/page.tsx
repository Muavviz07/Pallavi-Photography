"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BreadcrumbsBanner from "@/components/common/BreadcrumbsBanner";
import { CheckCircle, Loader2, ChevronLeft, ChevronRight, Calendar, Lock } from "lucide-react";
import { api } from "@/lib/api";
import { formatToYYYYMMDD } from "@/lib/date";

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
    
    // Calendar translation keys
    calendarSubtitle: "RESERVATION CALENDAR",
    calendarTitle: "BOOK A PHOTOSHOOT SLOT",
    calendarDesc: "Select an available date and time below to submit your photoshoot session request. The studio will reach out to approve details.",
    calendarSuccessTitle: "Request Submitted!",
    calendarSuccessDesc: "Thank you! Your photoshoot slot request has been sent successfully. We will check availability and send you an email confirmation shortly.",
    calendarResetBtn: "BOOK ANOTHER SLOT",
    calendarDateLabel: "Date",
    calendarTimeSlotsLabel: "Available Time Slots",
    calendarMsgLabel: "Add Message (Optional)",
    calendarCtaBtn: "Request Session Slot",
    calendarPlaceholder: "Please select an available date from the calendar to proceed."
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
    
    // Calendar translation keys
    calendarSubtitle: "CALENDRIER DE RÉSERVATION",
    calendarTitle: "RÉSERVER UN CRÉNEAU",
    calendarDesc: "Sélectionnez une date et un horaire disponibles ci-dessous pour soumettre votre demande de séance photo. Le studio vous contactera pour valider les détails.",
    calendarSuccessTitle: "Demande Envoyée !",
    calendarSuccessDesc: "Merci ! Votre demande de créneau a bien été envoyée. Nous allons vérifier la disponibilité et vous envoyer un e-mail de confirmation très vite.",
    calendarResetBtn: "RÉSERVER UN AUTRE CRÉNEAU",
    calendarDateLabel: "Date",
    calendarTimeSlotsLabel: "Créneaux Horaires Disponibles",
    calendarMsgLabel: "Message (Optionnel)",
    calendarCtaBtn: "Demander ce Créneau",
    calendarPlaceholder: "Veuillez sélectionner une date disponible sur le calendrier pour continuer."
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

  // General Inquiry Form States
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    tentative_date: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Calendar Booking States
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [calendarSummary, setCalendarSummary] = useState<Record<string, { booked: number; total: number; is_locked?: boolean; has_client_booking?: boolean }>>({});
  const [bookingStatus, setBookingStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [bookingError, setBookingError] = useState("");
  const [bookingForm, setBookingForm] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("lang") || "EN";
    setLang(stored);

    const handleLangChange = () => {
      setLang(localStorage.getItem("lang") || "EN");
    };

    window.addEventListener("languagechange", handleLangChange);
    return () => window.removeEventListener("languagechange", handleLangChange);
  }, []);

  // Fetch dynamic contact details on mount
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

  // Fetch monthly calendar summary when active year/month transitions
  useEffect(() => {
    async function fetchAvailability() {
      try {
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 0);
        const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-01`;
        const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;

        const res = await api.get<any>(`/bookings/calendar-summary?start_date=${startStr}&end_date=${endStr}`);
        if (res) {
          setCalendarSummary(res);
          const blocked = Object.keys(res).filter(k => res[k].booked === res[k].total);
          setBookedDates(blocked);
        }
      } catch (err) {
        console.error("Failed to load availability mapping", err);
      }
    }
    fetchAvailability();
  }, [currentDate, year, month]);

  const t = contactTranslations[lang as "EN" | "FR"] || contactTranslations.EN;
  const displayTitle = lang === "FR" ? (contactData.title_fr || contactData.title) : contactData.title;
  const displayP1 = lang === "FR" ? (contactData.p1_fr || contactData.p1) : contactData.p1;
  const displayP2 = lang === "FR" ? (contactData.p2_fr || contactData.p2) : contactData.p2;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBookingInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBookingForm((prev) => ({ ...prev, [name]: value }));
  };

  // Submit General Enquiry Form
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

  // Submit Calendar Booking Form
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !bookingForm.name || !bookingForm.email) return;

    setBookingStatus("loading");
    setBookingError("");

    try {
      const payload = {
        name: bookingForm.name,
        email: bookingForm.email,
        date: formatToYYYYMMDD(selectedDate),
        time: selectedTime,
        message: bookingForm.message
      };

      await api.post("/bookings", payload);

      setBookingStatus("success");
      setBookingForm({ name: "", email: "", message: "" });
      setSelectedDate(null);
      setSelectedTime("");

      // Update booked dates list to block this date locally
      setBookedDates((prev) => [...prev, payload.date]);
    } catch (err: any) {
      setBookingStatus("error");
      setBookingError(err.message || (lang === "FR" ? "Désolé, échec de la réservation." : "Failed to request session slot."));
    }
  };

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const fetchSlotsForDate = async (targetDate: Date) => {
    setLoadingSlots(true);
    try {
      const dateStr = formatToYYYYMMDD(targetDate);
      const res = await api.get<any[]>(`/bookings/available-slots?date=${dateStr}`);
      if (res) {
        setAvailableSlots(res);
      }
    } catch (err) {
      console.error("Error fetching slots:", err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateClick = (day: number) => {
    const dateObj = new Date(year, month, day);
    
    // Block past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateObj < today) return;

    // Block already booked dates
    const isoString = formatToYYYYMMDD(dateObj);
    if (bookedDates.includes(isoString)) return;

    setSelectedDate(dateObj);
    setSelectedTime("");
    fetchSlotsForDate(dateObj);
  };

  const monthNames = lang === "FR" ? [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ] : [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysGrid = [];
  // Empty offset days
  for (let i = 0; i < firstDayOfMonth; i++) {
    daysGrid.push(<div key={`empty-${i}`} className="p-3" />);
  }
  // Days of month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPast = dateObj < today;

    const isoStr = formatToYYYYMMDD(dateObj);
    const daySummary = calendarSummary[isoStr];
    
    // Distinguish lock types
    const isFullyLocked = daySummary && daySummary.is_locked && daySummary.booked === daySummary.total;
    const isPartiallyLocked = daySummary && daySummary.is_locked && daySummary.booked < daySummary.total;
    const isFullyBooked = bookedDates.includes(isoStr) || (daySummary && !daySummary.is_locked && daySummary.booked === daySummary.total);
    const isSelected = selectedDate && selectedDate.getDate() === d && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;

    let dayClass = "bg-white text-[#6E635F] hover:bg-[#FAF8F5]/85 hover:border-[#C4A484]/45 border-stone-100 shadow-2xs";
    if (isPast) {
      dayClass = "text-stone-300 cursor-not-allowed line-through bg-stone-50/10";
    } else if (isFullyLocked) {
      dayClass = "bg-stone-50 text-stone-400 border-stone-200 cursor-not-allowed";
    } else if (isFullyBooked) {
      dayClass = "text-red-700 bg-red-50/60 cursor-not-allowed border border-red-200";
    } else if (isSelected) {
      dayClass = "bg-[#2C2623] text-white font-medium border-[#2C2623] shadow-xs";
    } else if (daySummary && daySummary.booked > 0) {
      if (daySummary.booked === 1) {
        dayClass = "bg-amber-50/40 border-amber-200 text-stone-700 font-medium";
      } else if (daySummary.booked === 2) {
        dayClass = "bg-orange-50/50 border-orange-200 text-stone-700 font-medium";
      } else if (daySummary.booked === 3) {
        dayClass = "bg-orange-100/40 border-orange-300 text-stone-850 font-semibold";
      }
    }

    daysGrid.push(
      <button
        key={`day-${d}`}
        type="button"
        disabled={isPast || isFullyLocked || isFullyBooked}
        onClick={() => handleDateClick(d)}
        className={`p-2.5 text-center text-xs rounded-sm border transition-all cursor-pointer flex flex-col items-center justify-between min-h-[50px] ${dayClass}`}
      >
        <span>{d}</span>
        {isFullyLocked ? (
          <span className="flex items-center justify-center scale-90 mb-0.5" title="Manually Locked Timeframe">
            <Lock className="w-3 h-3 text-stone-450" />
          </span>
        ) : isPartiallyLocked ? (
          <span className="flex items-center justify-center scale-90 mb-0.5 animate-pulse" title="Some Slots Manually Locked">
            <Lock className="w-2.5 h-2.5 text-amber-500/80" />
          </span>
        ) : daySummary && daySummary.booked > 0 ? (
          <span className={`text-[8px] px-1 py-0.5 rounded-full scale-90 ${
            isFullyBooked 
              ? "bg-red-100 text-red-750" 
              : "bg-[#C4A484]/20 text-[#2C2623] font-medium"
          }`}>
            {daySummary.booked} book{daySummary.booked > 1 ? "s" : ""}
          </span>
        ) : null}
      </button>
    );
  }

  const timeSlots = ["09:00:00", "11:00:00", "14:00:00", "16:00:00"];

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
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-brand-dark uppercase tracking-[0.25em] font-light animate-fade-in">
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
            
            {/* Left side Image */}
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
                  <div className="text-center py-12 space-y-4 border border-stone-200/60 p-8 bg-[#FAF8F5] animate-fade-in">
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
                        className="w-full bg-transparent border-b border-stone-200 py-2 text-sm text-stone-800 outline-none focus:border-[#8F9288] transition-colors duration-300 disabled:opacity-60"
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
                        className="w-full bg-transparent border-b border-stone-200 py-2 text-sm text-stone-800 outline-none focus:border-[#8F9288] transition-colors duration-300 disabled:opacity-60"
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
                        className="w-full bg-transparent border-b border-stone-200 py-2 text-sm text-stone-800 placeholder-stone-300 outline-none focus:border-[#8F9288] transition-colors duration-300 disabled:opacity-60"
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
                        className="w-full bg-transparent border-b border-stone-200 py-2 text-sm text-stone-800 outline-none focus:border-[#8F9288] transition-colors duration-300 resize-none min-h-[100px] disabled:opacity-60"
                      />
                    </div>

                    {status === "error" && (
                      <p className="text-xs text-red-650 font-light">{errorMessage}</p>
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

          {/* Calendar Booking Section */}
          <div className="border-t border-stone-100 pt-16 space-y-10 animate-fade-in">
            <div className="text-center max-w-xl mx-auto space-y-3">
              <span className="text-[10px] uppercase tracking-[0.35em] text-[#C4A484] font-semibold block">
                {t.calendarSubtitle}
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif text-[#2C2623] font-light uppercase tracking-wider">
                {t.calendarTitle}
              </h2>
              <p className="text-stone-500 text-xs font-light leading-relaxed">
                {t.calendarDesc}
              </p>
            </div>

            {bookingStatus === "success" ? (
              <div className="max-w-md mx-auto text-center bg-[#FAF8F5] border border-[#DCD0C0]/35 rounded-md p-8 shadow-xs space-y-4 animate-fade-in">
                <CheckCircle className="w-12 h-12 text-[#C4A484] mx-auto animate-bounce" />
                <h4 className="text-lg font-light font-serif text-brand-dark uppercase">
                  {t.calendarSuccessTitle}
                </h4>
                <p className="text-xs text-stone-500 font-light max-w-sm mx-auto leading-relaxed">
                  {t.calendarSuccessDesc}
                </p>
                <button
                  onClick={() => setBookingStatus("idle")}
                  className="inline-block text-xs uppercase tracking-widest text-[#FCFAF7] bg-[#2C2623] hover:bg-[#352F2C] px-6 py-2.5 rounded-sm font-medium transition-all duration-300 cursor-pointer"
                >
                  {t.calendarResetBtn}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                
                {/* Left Calendar Selection */}
                <div className="lg:col-span-7 bg-[#FAF8F5] border border-[#DCD0C0]/30 rounded-md p-6 shadow-xs space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-serif font-light text-[#2C2623]">
                      {monthNames[month]} {year}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handlePrevMonth}
                        type="button"
                        className="p-1.5 rounded-sm border border-[#DCD0C0]/40 text-[#6E635F] hover:text-[#2C2623] hover:bg-[#FCFAF7] transition-all cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleNextMonth}
                        type="button"
                        className="p-1.5 rounded-sm border border-[#DCD0C0]/40 text-[#6E635F] hover:text-[#2C2623] hover:bg-[#FCFAF7] transition-all cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wider text-stone-400 font-semibold mb-2">
                      <span>Su</span>
                      <span>Mo</span>
                      <span>Tu</span>
                      <span>We</span>
                      <span>Th</span>
                      <span>Fr</span>
                      <span>Sa</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {daysGrid}
                    </div>
                  </div>

                  <div className="flex items-center justify-center space-x-4 text-[10px] text-[#6E635F] pt-4 border-t border-[#DCD0C0]/20 font-light">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#2C2623]" />
                      <span>Selected</span>
                    </span>
                    <span className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-red-50/60 border border-red-200" />
                      <span>Booked / Out</span>
                    </span>
                    <span className="flex items-center space-x-1.5">
                      <Lock className="w-3 h-3 text-stone-450" />
                      <span>Locked Day</span>
                    </span>
                  </div>
                </div>

                {/* Right Booking Details & Form */}
                <div className="lg:col-span-5 bg-[#FAF8F5] border border-[#DCD0C0]/30 rounded-md p-6 shadow-xs space-y-6">
                  <h3 className="text-xs uppercase tracking-widest font-semibold text-[#2C2623] border-b border-[#DCD0C0]/25 pb-3">
                    Session Details
                  </h3>

                  {selectedDate ? (
                    <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase text-stone-400 font-semibold">{t.calendarDateLabel}</span>
                        <p className="text-xs text-[#2C2623] font-medium flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#C4A484]" />
                          {selectedDate.toLocaleDateString(lang === "FR" ? "fr-CH" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] uppercase text-stone-400 font-semibold block">{t.calendarTimeSlotsLabel}</span>
                        {loadingSlots ? (
                          <div className="flex items-center space-x-2 py-2">
                            <Loader2 className="w-4 h-4 animate-spin text-[#C4A484]" />
                            <span className="text-[10px] text-stone-400">Checking availability...</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-4 gap-2">
                            {availableSlots.map((slot) => {
                              const isSlotAvailable = slot.available;
                              const isSelected = selectedTime === slot.time || selectedTime === `${slot.time}:00`;
                              const isLocked = slot.status === "busy";
                              
                              let slotClass = "";
                              let content = <span>{slot.time}</span>;
                              
                              if (isLocked) {
                                slotClass = "bg-stone-50 border-stone-250 text-stone-400 cursor-not-allowed flex items-center justify-center gap-1";
                                content = (
                                  <span className="flex items-center gap-1 font-medium">
                                    <Lock className="w-2.5 h-2.5 text-stone-400" />
                                    {slot.time}
                                  </span>
                                );
                              } else if (!isSlotAvailable) {
                                slotClass = "bg-red-50/20 border-red-100/60 text-red-400 cursor-not-allowed line-through flex items-center justify-center";
                                content = <span>{slot.time}</span>;
                              } else if (isSelected) {
                                slotClass = "bg-[#2C2623] text-white border-[#2C2623]";
                              } else {
                                slotClass = "bg-[#FCFAF7] border-[#DCD0C0]/40 text-[#6E635F] hover:border-[#C4A484]/40";
                              }
                              
                              return (
                                <button
                                  key={slot.id}
                                  type="button"
                                  disabled={!isSlotAvailable}
                                  onClick={() => setSelectedTime(`${slot.time}:00`)}
                                  className={`py-2 text-[10px] font-semibold border rounded-sm transition-all cursor-pointer text-center flex items-center justify-center ${slotClass}`}
                                >
                                  {content}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="space-y-3 pt-2">
                        <div>
                          <label htmlFor="booking-name" className="block text-[10px] uppercase tracking-wider text-[#6E635F] mb-1 font-medium">{t.nameFormLabel}</label>
                          <input
                            type="text"
                            id="booking-name"
                            name="name"
                            value={bookingForm.name}
                            onChange={handleBookingInputChange}
                            required
                            disabled={bookingStatus === "loading"}
                            className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3.5 py-2 text-xs outline-none focus:border-[#C4A484] transition-colors"
                          />
                        </div>

                        <div>
                          <label htmlFor="booking-email" className="block text-[10px] uppercase tracking-wider text-[#6E635F] mb-1 font-medium">{t.emailFormLabel}</label>
                          <input
                            type="email"
                            id="booking-email"
                            name="email"
                            value={bookingForm.email}
                            onChange={handleBookingInputChange}
                            required
                            disabled={bookingStatus === "loading"}
                            className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3.5 py-2 text-xs outline-none focus:border-[#C4A484] transition-colors"
                          />
                        </div>

                        <div>
                          <label htmlFor="booking-message" className="block text-[10px] uppercase tracking-wider text-[#6E635F] mb-1 font-medium">{t.calendarMsgLabel}</label>
                          <textarea
                            id="booking-message"
                            name="message"
                            rows={3}
                            value={bookingForm.message}
                            onChange={handleBookingInputChange}
                            disabled={bookingStatus === "loading"}
                            className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3.5 py-2 text-xs outline-none focus:border-[#C4A484] transition-colors resize-none font-light"
                          />
                        </div>
                      </div>

                      {bookingStatus === "error" && (
                        <p className="text-xs text-red-650 font-light">{bookingError}</p>
                      )}

                      <button
                        type="submit"
                        disabled={bookingStatus === "loading" || !selectedTime}
                        className="w-full inline-flex items-center justify-center space-x-2 text-[10px] uppercase tracking-widest text-[#FCFAF7] bg-[#2C2623] hover:bg-[#352F2C] py-3 rounded-sm font-semibold transition-all cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        {bookingStatus === "loading" ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <span>{t.calendarCtaBtn}</span>
                        )}
                      </button>
                    </form>
                  ) : (
                    <div className="text-center py-12 space-y-2 text-[#6E635F]/60">
                      <Calendar className="w-8 h-8 text-[#DCD0C0]/60 mx-auto" />
                      <p className="text-xs font-light">{t.calendarPlaceholder}</p>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}
