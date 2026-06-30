"use client";

import React, { useState } from "react";
import { Send, CheckCircle, Loader2 } from "lucide-react";
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
    <div className="w-full max-w-[600px] mx-auto py-6">
      {status === "success" ? (
        <div className="text-center py-12 space-y-4 animate-fade-in">
          <CheckCircle className="w-12 h-12 text-brand-sage mx-auto" />
          <h4 className="text-lg font-light font-serif text-brand-dark uppercase">Message Sent!</h4>
          <p className="text-xs text-brand-muted font-light max-w-sm mx-auto leading-relaxed">
            Thank you for reaching out. We have received your inquiry and will respond within 24–48 hours to discuss your photography details.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* NAME */}
          <div className="flex flex-col space-y-2">
            <label
              htmlFor="form-name"
              className="text-[10px] uppercase tracking-widest text-brand-dark font-medium"
            >
              NAME
            </label>
            <input
              type="text"
              id="form-name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="YOUR FULL NAME"
              required
              disabled={status === "loading"}
              className="w-full bg-transparent border-b border-brand-border py-2.5 text-xs text-brand-dark placeholder-stone-400 outline-hidden focus:border-brand-dark transition-colors duration-200 disabled:opacity-60"
            />
          </div>

          {/* E-MAIL */}
          <div className="flex flex-col space-y-2">
            <label
              htmlFor="form-email"
              className="text-[10px] uppercase tracking-widest text-brand-dark font-medium"
            >
              E-MAIL
            </label>
            <input
              type="email"
              id="form-email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="YOUR EMAIL ADDRESS"
              required
              disabled={status === "loading"}
              className="w-full bg-transparent border-b border-brand-border py-2.5 text-xs text-brand-dark placeholder-stone-400 outline-hidden focus:border-brand-dark transition-colors duration-200 disabled:opacity-60"
            />
          </div>

          {/* TENTATIVE DATE */}
          <div className="flex flex-col space-y-2">
            <label
              htmlFor="form-date"
              className="text-[10px] uppercase tracking-widest text-brand-dark font-medium"
            >
              TENTATIVE DATE
            </label>
            <input
              type="date"
              id="form-date"
              name="tentative_date"
              value={formData.tentative_date}
              onChange={handleChange}
              disabled={status === "loading"}
              className="w-full bg-transparent border-b border-brand-border py-2.5 text-xs text-brand-dark outline-hidden focus:border-brand-dark transition-colors duration-200 disabled:opacity-60"
            />
          </div>

          {/* TELL US MORE */}
          <div className="flex flex-col space-y-2">
            <label
              htmlFor="form-message"
              className="text-[10px] uppercase tracking-widest text-brand-dark font-medium"
            >
              TELL US MORE
            </label>
            <textarea
              id="form-message"
              name="message"
              rows={4}
              value={formData.message}
              onChange={handleChange}
              placeholder="YOUR MESSAGE..."
              required
              disabled={status === "loading"}
              className="w-full bg-transparent border-b border-brand-border py-2.5 text-xs text-brand-dark placeholder-stone-400 outline-hidden focus:border-brand-dark transition-colors duration-200 resize-none disabled:opacity-60"
            />
          </div>
          
          {status === "error" && (
            <p className="text-xs text-red-600 font-light">{errorMessage}</p>
          )}

          {/* SEND BUTTON */}
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full inline-flex items-center justify-center space-x-2 text-xs font-serif uppercase tracking-widest text-white bg-brand-sage hover:bg-transparent hover:text-brand-sage border-2 border-brand-sage py-3.5 rounded-sm font-medium transition-all duration-300 cursor-pointer shadow-xs disabled:opacity-60"
          >
            {status === "loading" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Send Message</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
