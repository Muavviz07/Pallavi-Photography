"use client";

import React, { useState } from "react";
import { Send, CheckCircle, Loader2 } from "lucide-react";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "newborn",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      // Merge category details into the message body or handle specifically in API
      const payload = {
        name: formData.name,
        email: formData.email,
        message: `[Session Type: ${formData.category.toUpperCase()}]\n\n${formData.message}`,
      };

      const res = await fetch(`${apiUrl}/api/enquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to send message");
      }

      setStatus("success");
      setFormData({ name: "", email: "", category: "newborn", message: "" });
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="w-full bg-[#FAF8F5] border border-[#DCD0C0]/30 rounded-md p-8 shadow-xs">
      {status === "success" ? (
        <div className="text-center py-12 space-y-4 animate-fade-in">
          <CheckCircle className="w-12 h-12 text-[#C4A484] mx-auto" />
          <h4 className="text-lg font-light font-serif text-[#2C2623]">Message Sent!</h4>
          <p className="text-xs text-[#6E635F] font-light max-w-sm mx-auto leading-relaxed">
            Thank you for reaching out. We have received your inquiry and will respond within 24–48 hours to discuss your photography details.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="form-name"
              className="block text-[10px] uppercase tracking-wider text-[#6E635F] mb-1 font-medium"
            >
              Name
            </label>
            <input
              type="text"
              id="form-name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={status === "loading"}
              className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3.5 py-2.5 text-xs outline-hidden focus:border-[#C4A484] transition-colors disabled:opacity-60"
            />
          </div>
          <div>
            <label
              htmlFor="form-email"
              className="block text-[10px] uppercase tracking-wider text-[#6E635F] mb-1 font-medium"
            >
              Email
            </label>
            <input
              type="email"
              id="form-email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={status === "loading"}
              className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3.5 py-2.5 text-xs outline-hidden focus:border-[#C4A484] transition-colors disabled:opacity-60"
            />
          </div>
          <div>
            <label
              htmlFor="form-category"
              className="block text-[10px] uppercase tracking-wider text-[#6E635F] mb-1 font-medium"
            >
              Session Type
            </label>
            <select
              id="form-category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              disabled={status === "loading"}
              className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3.5 py-2.5 text-xs outline-hidden focus:border-[#C4A484] transition-colors disabled:opacity-60"
            >
              <option value="newborn">Newborn Session</option>
              <option value="maternity">Maternity Portrait</option>
              <option value="family">Family Gathering</option>
              <option value="fine-art">Fine Art Session</option>
              <option value="nature">Outdoor Nature</option>
              <option value="other">Other / Inquiry</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="form-message"
              className="block text-[10px] uppercase tracking-wider text-[#6E635F] mb-1 font-medium"
            >
              Message
            </label>
            <textarea
              id="form-message"
              name="message"
              rows={4}
              value={formData.message}
              onChange={handleChange}
              required
              disabled={status === "loading"}
              className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3.5 py-2.5 text-xs outline-hidden focus:border-[#C4A484] transition-colors resize-none disabled:opacity-60"
            />
          </div>
          
          {status === "error" && (
            <p className="text-xs text-red-600 font-light">{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full inline-flex items-center justify-center space-x-2 text-xs uppercase tracking-widest text-[#FCFAF7] bg-[#2C2623] hover:bg-[#352F2C] py-3.5 rounded-sm font-medium transition-all cursor-pointer shadow-xs disabled:opacity-60"
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
