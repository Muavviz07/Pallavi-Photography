"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api";
import { Loader2, Plus, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

interface PricingPlan {
  name: string;
  price: string;
  description?: string;
  features: string[];
  button_type: "solid" | "outline";
}

const CATEGORIES = [
  { id: "newborn", label: "Newborn" },
  { id: "children", label: "Children" },
  { id: "family", label: "Family" },
  { id: "maternity", label: "Maternity" },
  { id: "fine-art", label: "Fine Art" },
  { id: "nature", label: "Nature" }
];

export default function AdminPricing() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;

  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [introText, setIntroText] = useState("");
  const [notesText, setNotesText] = useState("");
  const [plans, setPlans] = useState<PricingPlan[]>([]);

  // Load pricing details for category
  useEffect(() => {
    if (!token) return;

    async function loadPricing() {
      setLoading(true);
      setStatus("idle");
      try {
        const res = await api.get<any>(`/pricing/${activeCategory}`, { token });
        if (res) {
          setTitle(res.title || "");
          setSubtitle(res.subtitle || "");
          setDescription(res.description || "");
          setIntroText(res.intro_text || "");
          setNotesText(res.notes_text || "");
          
          const parsedPlans = res.plans_json ? JSON.parse(res.plans_json) : [];
          setPlans(parsedPlans);
        }
      } catch (err: any) {
        console.error("Failed to load category pricing details", err);
        setErrorMsg("Failed to retrieve category pricing details.");
        setStatus("error");
      } finally {
        setLoading(false);
      }
    }
    loadPricing();
  }, [activeCategory, token]);

  const handleUpdatePlan = (index: number, key: keyof PricingPlan, value: any) => {
    setPlans((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const handleAddPlan = () => {
    setPlans((prev) => [
      ...prev,
      {
        name: "NEW COLLECTION",
        price: "CHF 500",
        features: ["Feature bullet item 1", "Feature bullet item 2"],
        button_type: "outline"
      }
    ]);
  };

  const handleRemovePlan = (index: number) => {
    setPlans((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSubmitting(true);
    setStatus("idle");
    try {
      const payload = {
        title,
        subtitle,
        description,
        intro_text: introText,
        notes_text: notesText,
        plans_json: JSON.stringify(plans)
      };

      await api.patch(`/pricing/${activeCategory}`, payload, { token });
      setStatus("success");
    } catch (err: any) {
      console.error("Failed to update pricing plans", err);
      setErrorMsg(err.message || "An unexpected error occurred.");
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-10">
      
      {/* Header section */}
      <div className="space-y-2">
        <span className="text-[10px] uppercase tracking-[0.35em] text-[#C4A484] font-semibold block">
          Studio Packages
        </span>
        <h1 className="text-3xl font-light tracking-wide font-serif text-[#2C2623]">
          Manage Pricing & Plans
        </h1>
        <p className="text-[#6E635F] text-xs font-light">
          Customize intro text, notes, prices, and features lists for each photography session category.
        </p>
      </div>

      {/* Categories Tabs Bar */}
      <div className="flex border-b border-[#DCD0C0]/30 overflow-x-auto whitespace-nowrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-6 py-3.5 text-xs uppercase tracking-widest border-b-2 font-medium transition-all cursor-pointer ${
              activeCategory === cat.id
                ? "border-[#C4A484] text-[#2C2623] font-semibold"
                : "border-transparent text-[#6E635F] hover:text-[#2C2623]"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-8 h-8 text-[#C4A484] animate-spin" />
          <p className="text-xs text-[#6E635F] font-light">Loading plan settings...</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-8">
          
          {/* Header & Description Card */}
          <div className="bg-white border border-[#DCD0C0]/25 rounded-md p-6 md:p-8 space-y-6 shadow-xs">
            <h3 className="text-sm uppercase tracking-wider font-semibold text-[#2C2623] border-b border-[#DCD0C0]/20 pb-3">
              Introductory Copy & Titles
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">Page Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full bg-[#FAF8F5] border border-stone-200 py-2.5 px-3.5 text-xs text-[#2C2623] outline-hidden focus:border-[#C4A484] transition-colors rounded-sm"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">Session Subtitle</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  required
                  className="w-full bg-[#FAF8F5] border border-stone-200 py-2.5 px-3.5 text-xs text-[#2C2623] outline-hidden focus:border-[#C4A484] transition-colors rounded-sm"
                />
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">Intro Text (use double newline to separate paragraphs)</label>
              <textarea
                value={introText}
                onChange={(e) => setIntroText(e.target.value)}
                required
                rows={6}
                className="w-full bg-[#FAF8F5] border border-stone-200 py-2.5 px-3.5 text-xs text-[#2C2623] outline-hidden focus:border-[#C4A484] transition-colors rounded-sm font-sans"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">Footer Note Text (below CTA buttons)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-stone-200 py-2.5 px-3.5 text-xs text-[#2C2623] outline-hidden focus:border-[#C4A484] transition-colors rounded-sm"
              />
            </div>
          </div>

          {/* Pricing Plans Manager */}
          <div className="bg-white border border-[#DCD0C0]/25 rounded-md p-6 md:p-8 space-y-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#DCD0C0]/20 pb-3">
              <h3 className="text-sm uppercase tracking-wider font-semibold text-[#2C2623]">
                Packages & Plans
              </h3>
              <button
                type="button"
                onClick={handleAddPlan}
                className="inline-flex items-center space-x-1.5 text-xs uppercase tracking-widest text-[#C4A484] hover:text-[#2C2623] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Package</span>
              </button>
            </div>

            <div className="space-y-6">
              {plans.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-[#DCD0C0]/40 rounded-sm text-stone-400 text-xs">
                  No packages configured. Click "Add Package" to create one.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {plans.map((plan, index) => (
                    <div
                      key={index}
                      className="border border-stone-200/80 p-5 rounded-md relative bg-[#FAF8F5] space-y-4"
                    >
                      <button
                        type="button"
                        onClick={() => handleRemovePlan(index)}
                        className="absolute top-4 right-4 text-red-500 hover:text-red-700 p-1 rounded-full cursor-pointer transition-colors"
                        title="Remove Package"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col space-y-1">
                          <label className="text-[9px] uppercase tracking-wider text-stone-500 font-medium">Package Name</label>
                          <input
                            type="text"
                            value={plan.name}
                            onChange={(e) => handleUpdatePlan(index, "name", e.target.value)}
                            required
                            className="w-full bg-white border border-stone-200 py-2 px-3 text-xs text-[#2C2623] outline-hidden focus:border-[#C4A484] rounded-xs"
                          />
                        </div>

                        <div className="flex flex-col space-y-1">
                          <label className="text-[9px] uppercase tracking-wider text-stone-500 font-medium">Price Label</label>
                          <input
                            type="text"
                            value={plan.price}
                            onChange={(e) => handleUpdatePlan(index, "price", e.target.value)}
                            required
                            className="w-full bg-white border border-stone-200 py-2 px-3 text-xs text-[#2C2623] outline-hidden focus:border-[#C4A484] rounded-xs"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col space-y-1">
                        <label className="text-[9px] uppercase tracking-wider text-stone-500 font-medium">Button Color Style</label>
                        <select
                          value={plan.button_type || "outline"}
                          onChange={(e) => handleUpdatePlan(index, "button_type", e.target.value)}
                          className="w-full bg-white border border-stone-200 py-2 px-3 text-xs text-[#2C2623] outline-hidden focus:border-[#C4A484] rounded-xs"
                        >
                          <option value="solid">Solid (Sage Grey Background)</option>
                          <option value="outline">Outline (Transparent / Border Only)</option>
                        </select>
                      </div>

                      <div className="flex flex-col space-y-1">
                        <label className="text-[9px] uppercase tracking-wider text-stone-500 font-medium">Bullet Features List (one feature per line)</label>
                        <textarea
                          value={plan.features.join("\n")}
                          onChange={(e) => handleUpdatePlan(index, "features", e.target.value.split("\n"))}
                          rows={4}
                          required
                          className="w-full bg-white border border-stone-200 py-2 px-3 text-xs text-[#2C2623] outline-hidden focus:border-[#C4A484] rounded-xs font-sans"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Notes & Details */}
          <div className="bg-white border border-[#DCD0C0]/25 rounded-md p-6 md:p-8 space-y-6 shadow-xs">
            <h3 className="text-sm uppercase tracking-wider font-semibold text-[#2C2623] border-b border-[#DCD0C0]/20 pb-3">
              Terms & Bottom Notes
            </h3>
            
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">Notes & Terms Box (separated by double newlines)</label>
              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                required
                rows={4}
                className="w-full bg-[#FAF8F5] border border-stone-200 py-2.5 px-3.5 text-xs text-[#2C2623] outline-hidden focus:border-[#C4A484] transition-colors rounded-sm"
              />
            </div>
          </div>

          {/* Feedback banners */}
          {status === "success" && (
            <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-700 p-4 rounded-md border border-emerald-200 text-xs">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Pricing details for category '{activeCategory}' updated successfully!</span>
            </div>
          )}

          {status === "error" && (
            <div className="flex items-center space-x-2 bg-red-50 text-red-700 p-4 rounded-md border border-red-200 text-xs">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>Error updating pricing: {errorMsg}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center space-x-4">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center space-x-2 bg-[#2C2623] hover:bg-[#C4A484] text-white text-xs uppercase tracking-widest px-8 py-3.5 transition-colors duration-300 rounded-sm cursor-pointer disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>

        </form>
      )}
    </div>
  );
}
