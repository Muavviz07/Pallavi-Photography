"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Loader2, Check } from "lucide-react";

interface ContactSectionData {
  id?: string;
  title: string;
  title_fr: string;
  p1: string;
  p1_fr: string;
  p2: string;
  p2_fr: string;
  email: string;
  phone: string;
  whatsapp: string;
  instagram: string;
}

export default function AdminContactPage() {
  const [formData, setFormData] = useState<ContactSectionData>({
    title: "",
    title_fr: "",
    p1: "",
    p1_fr: "",
    p2: "",
    p2_fr: "",
    email: "",
    phone: "",
    whatsapp: "",
    instagram: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadContactSection() {
      try {
        const res = await api.get<ContactSectionData>("/contact");
        if (res) {
          setFormData({
            title: res.title || "LET'S CONNECT",
            title_fr: res.title_fr || "CONTACTONS-NOUS",
            p1: res.p1 || "",
            p1_fr: res.p1_fr || "",
            p2: res.p2 || "",
            p2_fr: res.p2_fr || "",
            email: res.email || "",
            phone: res.phone || "",
            whatsapp: res.whatsapp || "",
            instagram: res.instagram || ""
          });
        }
      } catch (err) {
        setError("Failed to load contact section details.");
      } finally {
        setLoading(false);
      }
    }
    loadContactSection();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.put("/contact", formData);
      setSuccess("Contact page details updated successfully!");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError("Failed to save contact section details.");
      setTimeout(() => setError(""), 4000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-stone-400 font-serif italic text-sm">
        Loading Contact settings...
      </div>
    );
  }

  return (
    <div className="space-y-8 select-none">
      
      {/* Header Area */}
      <div className="border-b border-stone-200/80 pb-6">
        <h2 className="text-xl font-light tracking-[0.2em] text-[#2C2623] uppercase font-serif">
          Manage Contact Details
        </h2>
        <p className="text-xs text-stone-400 font-sans tracking-wide mt-1">
          Customize header titles, introductory descriptions, phone numbers, and social handles on the public Contact page.
        </p>
      </div>

      {/* Alert Banners */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 text-xs text-red-700 tracking-wide">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border-l-4 border-emerald-400 p-4 text-xs text-emerald-700 tracking-wide flex items-center space-x-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Edit Form */}
      <form onSubmit={handleSave} className="bg-[#FAF8F5] border border-stone-200/80 p-8 space-y-8">
        
        {/* Contact Info Items Grid */}
        <div className="space-y-4">
          <span className="block text-[10px] tracking-[0.25em] text-[#8F9288] font-bold uppercase border-b border-stone-200 pb-2">
            CONTACT CHANNELS & HANDLES
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* EMAIL */}
            <div className="space-y-2">
              <label className="block text-[10px] tracking-wider uppercase text-stone-500 font-medium">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full h-11 px-3 border border-stone-200 bg-white text-xs text-stone-700 focus:outline-hidden"
              />
            </div>

            {/* CALL ME */}
            <div className="space-y-2">
              <label className="block text-[10px] tracking-wider uppercase text-stone-500 font-medium">
                Phone Number (CALL ME)
              </label>
              <input
                type="text"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full h-11 px-3 border border-stone-200 bg-white text-xs text-stone-700 focus:outline-hidden"
              />
            </div>

            {/* WHATSAPP */}
            <div className="space-y-2">
              <label className="block text-[10px] tracking-wider uppercase text-stone-500 font-medium">
                WhatsApp Phone Number
              </label>
              <input
                type="text"
                name="whatsapp"
                required
                value={formData.whatsapp}
                onChange={handleChange}
                className="w-full h-11 px-3 border border-stone-200 bg-white text-xs text-stone-700 focus:outline-hidden"
              />
            </div>

            {/* FOLLOW */}
            <div className="space-y-2">
              <label className="block text-[10px] tracking-wider uppercase text-stone-500 font-medium">
                Instagram Follow Handle
              </label>
              <input
                type="text"
                name="instagram"
                required
                value={formData.instagram}
                onChange={handleChange}
                className="w-full h-11 px-3 border border-stone-200 bg-white text-xs text-stone-700 focus:outline-hidden"
              />
            </div>

          </div>
        </div>

        {/* Content Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-stone-200/50">
          
          {/* English Content */}
          <div className="space-y-6">
            <span className="block text-[10px] tracking-[0.25em] text-[#8F9288] font-bold uppercase border-b border-stone-200/60 pb-2">
              ENGLISH CONTENT
            </span>

            <div className="space-y-2">
              <label className="block text-[10px] tracking-wider uppercase text-stone-500 font-medium">
                Main Header Title (EN)
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full h-11 px-3 border border-stone-200 bg-white text-xs text-stone-700 focus:outline-hidden"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] tracking-wider uppercase text-stone-500 font-medium">
                Intro Paragraph 1 (EN)
              </label>
              <textarea
                name="p1"
                rows={4}
                required
                value={formData.p1}
                onChange={handleChange}
                className="w-full p-3 border border-stone-200 bg-white text-xs text-stone-700 focus:outline-hidden"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] tracking-wider uppercase text-stone-500 font-medium">
                Intro Paragraph 2 (EN)
              </label>
              <textarea
                name="p2"
                rows={4}
                required
                value={formData.p2}
                onChange={handleChange}
                className="w-full p-3 border border-stone-200 bg-white text-xs text-stone-700 focus:outline-hidden"
              />
            </div>
          </div>

          {/* French Content */}
          <div className="space-y-6">
            <span className="block text-[10px] tracking-[0.25em] text-[#8F9288] font-bold uppercase border-b border-stone-200/60 pb-2">
              FRENCH CONTENT
            </span>

            <div className="space-y-2">
              <label className="block text-[10px] tracking-wider uppercase text-stone-500 font-medium">
                Main Header Title (FR)
              </label>
              <input
                type="text"
                name="title_fr"
                required
                value={formData.title_fr}
                onChange={handleChange}
                className="w-full h-11 px-3 border border-stone-200 bg-white text-xs text-stone-700 focus:outline-hidden"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] tracking-wider uppercase text-stone-500 font-medium">
                Intro Paragraph 1 (FR)
              </label>
              <textarea
                name="p1_fr"
                rows={4}
                required
                value={formData.p1_fr}
                onChange={handleChange}
                className="w-full p-3 border border-stone-200 bg-white text-xs text-stone-700 focus:outline-hidden"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] tracking-wider uppercase text-stone-500 font-medium">
                Intro Paragraph 2 (FR)
              </label>
              <textarea
                name="p2_fr"
                rows={4}
                required
                value={formData.p2_fr}
                onChange={handleChange}
                className="w-full p-3 border border-stone-200 bg-white text-xs text-stone-700 focus:outline-hidden"
              />
            </div>
          </div>

        </div>

        {/* Form Actions */}
        <div className="pt-4 border-t border-stone-200 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="h-10 px-6 inline-flex items-center text-[10px] uppercase tracking-[0.2em] font-medium bg-[#8F9288] text-white hover:bg-[#7D8076] transition-all rounded-none cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Contact Settings</span>
            )}
          </button>
        </div>

      </form>

    </div>
  );
}
