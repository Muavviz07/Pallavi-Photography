"use client";

import React, { useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    tentative_date: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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
      setErrorMessage(err.message || "An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="w-full">
      {status === "success" ? (
        <div className="text-center py-12 space-y-4 animate-fade-in">
          <CheckCircle className="w-12 h-12 text-[#A3A69C] mx-auto" />
          <h4 className="text-lg font-light font-serif text-brand-dark uppercase">Message Sent!</h4>
          <p className="text-xs text-brand-muted font-light max-w-sm mx-auto leading-relaxed">
            Thank you for reaching out. We have received your inquiry and will respond within 24–48 hours to discuss your photography details.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-10">
          
          {/* Row 1: NAME (Full Width) */}
          <div className="flex flex-col space-y-1">
            <label
              htmlFor="form-name"
              className="text-[10px] uppercase tracking-[0.25em] text-stone-400 font-medium"
            >
              NAME
            </label>
            <input
              type="text"
              id="form-name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={status === "loading"}
              className="w-full bg-transparent border-b border-stone-200 py-1 text-xs text-brand-dark outline-hidden focus:border-brand-dark transition-colors duration-200 disabled:opacity-60"
            />
          </div>

          {/* Row 2: E-MAIL and TENTATIVE DATE (2 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            
            {/* E-MAIL */}
            <div className="flex flex-col space-y-1">
              <label
                htmlFor="form-email"
                className="text-[10px] uppercase tracking-[0.25em] text-stone-400 font-medium"
              >
                E-MAIL
              </label>
              <input
                type="email"
                id="form-email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={status === "loading"}
                className="w-full bg-transparent border-b border-stone-200 py-1 text-xs text-brand-dark outline-hidden focus:border-brand-dark transition-colors duration-200 disabled:opacity-60"
              />
            </div>

            {/* TENTATIVE DATE */}
            <div className="flex flex-col space-y-1">
              <label
                htmlFor="form-date"
                className="text-[10px] uppercase tracking-[0.25em] text-stone-400 font-medium"
              >
                TENTATIVE DATE
              </label>
              <input
                type="text"
                id="form-date"
                name="tentative_date"
                value={formData.tentative_date}
                onChange={handleChange}
                placeholder="DD.MM.YYYY"
                disabled={status === "loading"}
                className="w-full bg-transparent border-b border-stone-200 py-1 text-xs text-brand-dark placeholder-stone-300 outline-hidden focus:border-brand-dark transition-colors duration-200 disabled:opacity-60"
              />
            </div>

          </div>

          {/* Row 3: TELL US MORE (Full Width Textarea) */}
          <div className="flex flex-col space-y-1">
            <label
              htmlFor="form-message"
              className="text-[10px] uppercase tracking-[0.25em] text-stone-400 font-medium"
            >
              TELL US MORE
            </label>
            <textarea
              id="form-message"
              name="message"
              rows={4}
              value={formData.message}
              onChange={handleChange}
              required
              disabled={status === "loading"}
              className="w-full bg-transparent border-b border-stone-200 py-1.5 text-xs text-brand-dark outline-hidden focus:border-brand-dark transition-colors duration-200 resize-y min-h-[80px] disabled:opacity-60"
            />
          </div>
          
          {status === "error" && (
            <p className="text-xs text-red-600 font-light">{errorMessage}</p>
          )}

          {/* Centered SEND Button */}
          <div className="flex justify-center pt-2">
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-48 h-11 inline-flex items-center justify-center text-[11px] font-sans uppercase tracking-[0.25em] text-white bg-[#A3A69C] hover:bg-[#8F9288] transition-colors duration-300 cursor-pointer disabled:opacity-60 select-none rounded-none"
            >
              {status === "loading" ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                "SEND"
              )}
            </button>
          </div>

        </form>
      )}
    </div>
  );
}
