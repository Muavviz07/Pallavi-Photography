"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar, CheckCircle, Loader2, Lock } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function BookSessionPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [calendarSummary, setCalendarSummary] = useState<Record<string, { booked: number; total: number; is_locked?: boolean; has_client_booking?: boolean }>>({});
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [lang, setLang] = useState("EN");
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    session_type: "",
    message: ""
  });
  const [sessionTypes, setSessionTypes] = useState<any[]>([]);

  useEffect(() => {
    const fetchSessionTypes = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/api/galleries`);
        if (res.ok) {
          const data = await res.json();
          const active = data.filter((g: any) => g.is_active);
          setSessionTypes(active);
        }
      } catch (err) {
        console.error("Failed to fetch session types", err);
      }
    };
    fetchSessionTypes();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    const stored = localStorage.getItem("lang") || "EN";
    setLang(stored);

    const handleLangChange = () => {
      setLang(localStorage.getItem("lang") || "EN");
    };

    window.addEventListener("languagechange", handleLangChange);
    return () => window.removeEventListener("languagechange", handleLangChange);
  }, []);

  // Fetch monthly calendar summary whenever current month/year changes
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 0);
        // Format to YYYY-MM-DD
        const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-01`;
        const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/api/bookings/calendar-summary?start_date=${startStr}&end_date=${endStr}`);
        if (res.ok) {
          const data = await res.json();
          setCalendarSummary(data);
        }
      } catch (err) {
        console.error("Failed to load calendar summary:", err);
      }
    };
    fetchSummary();
  }, [currentDate, year, month]);

  const fetchSlotsForDate = async (targetDate: Date) => {
    setLoadingSlots(true);
    try {
      const dateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}-${String(targetDate.getDate()).padStart(2, "0")}`;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/bookings/available-slots?date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        setAvailableSlots(data);
      }
    } catch (err) {
      console.error("Error fetching slots:", err);
    } finally {
      setLoadingSlots(false);
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

  const handleDateClick = (day: number) => {
    const dateObj = new Date(year, month, day);
    
    // Block past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateObj < today) return;

    setSelectedDate(dateObj);
    setSelectedTime("");
    fetchSlotsForDate(dateObj);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !formData.name || !formData.email || !formData.session_type) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      const payload = {
        name: formData.name,
        email: formData.email,
        date: `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`,
        time: selectedTime.includes(":") ? selectedTime : `${selectedTime}:00`,
        session_type: formData.session_type,
        message: formData.message
      };

      const res = await fetch(`${apiUrl}/api/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to submit booking request");
      }

      setStatus("success");
      setFormData({ name: "", email: "", session_type: "", message: "" });
      setSelectedDate(null);
      setSelectedTime("");

      // Refresh calendar summary immediately
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-01`;
      const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
      const refreshRes = await fetch(`${apiUrl}/api/bookings/calendar-summary?start_date=${startStr}&end_date=${endStr}`);
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        setCalendarSummary(data);
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "An unexpected error occurred.");
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysGrid = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    daysGrid.push(<div key={`empty-${i}`} className="p-3" />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPast = dateObj < today;

    const isoStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;
    const daySummary = calendarSummary[isoStr];
    
    // Distinguish lock types
    const isFullyLocked = daySummary && daySummary.is_locked && daySummary.booked === daySummary.total;
    const isPartiallyLocked = daySummary && daySummary.is_locked && daySummary.booked < daySummary.total;
    const isFullyBooked = daySummary && !daySummary.is_locked && daySummary.booked === daySummary.total;
    const isSelected = selectedDate && selectedDate.getDate() === d && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;

    let dayClass = "bg-white text-[#6E635F] hover:bg-[#FAF8F5]/80 hover:border-[#C4A484]/40 border-stone-100 shadow-2xs";
    if (isPast) {
      dayClass = "text-stone-300 cursor-not-allowed line-through bg-stone-50/10";
    } else if (isFullyLocked) {
      dayClass = "bg-stone-50 text-stone-400 border-stone-200 cursor-not-allowed";
    } else if (isFullyBooked) {
      dayClass = "text-red-700 bg-red-50/60 cursor-not-allowed border border-red-200";
    } else if (isSelected) {
      dayClass = "bg-[#2C2623] text-white font-medium border-[#2C2623] shadow-md";
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
              ? "bg-red-100 text-red-755" 
              : "bg-[#C4A484]/20 text-[#2C2623] font-medium"
          }`}>
            {daySummary.booked} book{daySummary.booked > 1 ? "s" : ""}
          </span>
        ) : null}
      </button>
    );
  }

  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-[#FCFAF7] pt-32 pb-24">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          
          <div className="text-center max-w-xl mx-auto space-y-4">
            <span className="text-[10px] uppercase tracking-[0.35em] text-[#C4A484] font-semibold block">
              Reservation Center
            </span>
            <h1 className="text-4xl font-light tracking-wide font-serif text-[#2C2623]">
              Book Your Photoshoot
            </h1>
            <p className="text-[#6E635F] text-xs font-light leading-relaxed">
              Select an available date and time below to submit your photoshoot session request. The studio will reach out to approve details.
            </p>
          </div>

          {status === "success" ? (
            <div className="max-w-md mx-auto text-center bg-[#FAF8F5] border border-[#DCD0C0]/35 rounded-md p-8 shadow-xs space-y-4 animate-fade-in">
              <CheckCircle className="w-12 h-12 text-[#C4A484] mx-auto" />
              <h4 className="text-lg font-light font-serif">Request Submitted!</h4>
              <p className="text-xs text-[#6E635F] font-light max-w-sm mx-auto leading-relaxed">
                Thank you! Your photoshoot slot request has been sent successfully. We will check availability and send you an email confirmation shortly.
              </p>
              <button
                onClick={() => setStatus("idle")}
                className="inline-block text-xs uppercase tracking-widest text-[#FCFAF7] bg-[#2C2623] hover:bg-[#352F2C] px-6 py-2.5 rounded-sm font-medium transition-all"
              >
                Book Another Slot
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

                <div className="flex flex-wrap items-center justify-center gap-4 text-[9px] text-[#6E635F] pt-4 border-t border-[#DCD0C0]/20 font-light uppercase tracking-wider">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-50/40 border border-amber-200" />
                    <span>1 Booked</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-orange-50/50 border border-orange-200" />
                    <span>2 Booked</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-orange-100/40 border border-orange-300" />
                    <span>3 Booked</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-red-50/60 border border-red-200" />
                    <span>Fully Booked</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <Lock className="w-2.5 h-2.5 text-stone-450" />
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
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase text-stone-400 font-semibold">Date</span>
                      <p className="text-xs text-[#2C2623] font-medium flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#C4A484]" />
                        {selectedDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] uppercase text-stone-400 font-semibold block">Available Time Slots</span>
                      {loadingSlots ? (
                        <div className="flex items-center space-x-2 py-2">
                          <Loader2 className="w-4 h-4 animate-spin text-brand-sage" />
                          <span className="text-[10px] text-stone-400">Checking availability...</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-2">
                           {availableSlots.map((slot) => {
                             const isSlotAvailable = slot.available;
                             const isSelected = selectedTime === slot.time;
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
                                 onClick={() => setSelectedTime(slot.time)}
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
                        <label htmlFor="booking-name" className="block text-[10px] uppercase tracking-wider text-[#6E635F] mb-1 font-medium">Name</label>
                        <input
                          type="text"
                          id="booking-name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          disabled={status === "loading"}
                          className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3.5 py-2 text-xs outline-hidden focus:border-[#C4A484] transition-colors"
                        />
                      </div>

                      <div>
                        <label htmlFor="booking-email" className="block text-[10px] uppercase tracking-wider text-[#6E635F] mb-1 font-medium">Email</label>
                        <input
                          type="email"
                          id="booking-email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          disabled={status === "loading"}
                          className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3.5 py-2 text-xs outline-hidden focus:border-[#C4A484] transition-colors"
                        />
                      </div>

                      <div>
                        <label htmlFor="booking-session-type" className="block text-[10px] uppercase tracking-wider text-[#6E635F] mb-1 font-medium">Session Type</label>
                        <select
                          id="booking-session-type"
                          name="session_type"
                          value={formData.session_type}
                          onChange={handleInputChange}
                          required
                          disabled={status === "loading"}
                          className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3.5 py-2 text-xs outline-hidden focus:border-[#C4A484] transition-colors"
                        >
                          <option value="">Select a session type...</option>
                          {sessionTypes.map((g) => (
                            <option key={g.id} value={g.name}>
                              {g.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="booking-message" className="block text-[10px] uppercase tracking-wider text-[#6E635F] mb-1 font-medium">Add Message (Optional)</label>
                        <textarea
                          id="booking-message"
                          name="message"
                          rows={3}
                          value={formData.message}
                          onChange={handleInputChange}
                          disabled={status === "loading"}
                          className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3.5 py-2 text-xs outline-hidden focus:border-[#C4A484] transition-colors resize-none font-light"
                        />
                      </div>
                    </div>

                    {status === "error" && (
                      <p className="text-xs text-red-600 font-light">{errorMessage}</p>
                    )}

                    <button
                      type="submit"
                      disabled={status === "loading" || !selectedTime}
                      className="w-full inline-flex items-center justify-center space-x-2 text-xs uppercase tracking-widest text-[#FCFAF7] bg-[#2C2623] hover:bg-[#352F2C] py-3 rounded-sm font-medium transition-all cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {status === "loading" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <span>Request Session Slot</span>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-12 space-y-2 text-[#6E635F]/60">
                    <Calendar className="w-8 h-8 text-[#DCD0C0]/60 mx-auto" />
                    <p className="text-xs font-light">Please select an available date from the calendar to proceed.</p>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
