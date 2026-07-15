"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Plus, Edit2, Trash2, Check, X, ArrowUp, ArrowDown } from "lucide-react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  question_fr: string;
  answer_fr: string;
  category: string;
  category_fr: string;
  order: number;
}

const DEFAULT_CATEGORIES = [
  "Newborn Photography FAQs",
  "Maternity Photography FAQs",
  "Family Photography FAQs",
  "Booking & Session Information",
  "Local Service Areas & Outdoor Sessions"
];

export default function AdminFAQsPage() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Edit / Create States
  const [editItem, setEditItem] = useState<FAQItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form Fields
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [questionFr, setQuestionFr] = useState("");
  const [answerFr, setAnswerFr] = useState("");
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [categoryFr, setCategoryFr] = useState("");
  const [orderVal, setOrderVal] = useState(0);

  useEffect(() => {
    loadFAQs();
  }, []);

  async function loadFAQs() {
    setLoading(true);
    try {
      const res = await api.get<FAQItem[]>("/faqs");
      // Sort faqs by category, then by order, then by question
      const sorted = [...res].sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return a.order - b.order;
      });
      setFaqs(sorted);
    } catch (err: any) {
      setError("Failed to load FAQs.");
    } finally {
      setLoading(false);
    }
  }

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setError(msg);
      setTimeout(() => setError(""), 4000);
    } else {
      setSuccess(msg);
      setTimeout(() => setSuccess(""), 4000);
    }
  };

  const handleCreateOpen = () => {
    setIsCreating(true);
    setEditItem(null);
    setQuestion("");
    setAnswer("");
    setQuestionFr("");
    setAnswerFr("");
    setCategory(DEFAULT_CATEGORIES[0]);
    setCustomCategory("");
    setCategoryFr("");
    setOrderVal(faqs.length + 1);
  };

  const handleEditOpen = (item: FAQItem) => {
    setEditItem(item);
    setIsCreating(false);
    setQuestion(item.question);
    setAnswer(item.answer);
    setQuestionFr(item.question_fr || "");
    setAnswerFr(item.answer_fr || "");
    if (DEFAULT_CATEGORIES.includes(item.category)) {
      setCategory(item.category);
      setCustomCategory("");
    } else {
      setCategory("Custom");
      setCustomCategory(item.category);
    }
    setCategoryFr(item.category_fr || "");
    setOrderVal(item.order);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditItem(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || !answer) {
      showNotification("Please provide both English question and answer.", true);
      return;
    }

    setSaving(true);
    const finalCategory = category === "Custom" ? customCategory : category;
    if (!finalCategory) {
      showNotification("Please select or type a category name.", true);
      setSaving(false);
      return;
    }

    let finalQuestionFr = questionFr;
    let finalAnswerFr = answerFr;
    let finalCategoryFr = categoryFr;

    // Automatically translate empty French fields on save
    if (!finalQuestionFr || !finalAnswerFr || !finalCategoryFr) {
      try {
        if (!finalQuestionFr) {
          const res = await fetch("/api/admin/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: question }),
          });
          if (res.ok) {
            const data = await res.json();
            finalQuestionFr = data.translatedText;
          }
        }
        if (!finalAnswerFr) {
          const res = await fetch("/api/admin/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: answer, isMarkdown: true }),
          });
          if (res.ok) {
            const data = await res.json();
            finalAnswerFr = data.translatedText;
          }
        }
        if (!finalCategoryFr) {
          const res = await fetch("/api/admin/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: finalCategory }),
          });
          if (res.ok) {
            const data = await res.json();
            finalCategoryFr = data.translatedText;
          }
        }
      } catch (err) {
        console.error("Auto-translation for FAQ failed", err);
      }
    }

    const payload = {
      question,
      answer,
      question_fr: finalQuestionFr || null,
      answer_fr: finalAnswerFr || null,
      category: finalCategory,
      category_fr: finalCategoryFr || null,
      order: Number(orderVal)
    };

    try {
      if (editItem) {
        await api.patch(`/faqs/${editItem.id}`, payload);
        showNotification("FAQ item updated successfully.");
      } else {
        await api.post("/faqs", payload);
        showNotification("FAQ item created successfully.");
      }
      setIsCreating(false);
      setEditItem(null);
      loadFAQs();
    } catch (err: any) {
      showNotification("Failed to save FAQ item.", true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ item?")) return;

    try {
      await api.delete(`/faqs/${id}`);
      showNotification("FAQ item deleted successfully.");
      loadFAQs();
    } catch (err) {
      showNotification("Failed to delete FAQ item.", true);
    }
  };

  // Group FAQs by category for clean accordion listing
  const groups: Record<string, FAQItem[]> = {};
  faqs.forEach((faq) => {
    if (!groups[faq.category]) {
      groups[faq.category] = [];
    }
    groups[faq.category].push(faq);
  });

  return (
    <div className="space-y-8 select-none">
      
      {/* Header Area */}
      <div className="flex justify-between items-center border-b border-stone-200/80 pb-6">
        <div>
          <h2 className="text-xl font-light tracking-[0.2em] text-[#2C2623] uppercase font-serif">
            Manage FAQs
          </h2>
          <p className="text-xs text-stone-400 font-sans tracking-wide mt-1">
            Create, modify, translate and arrange questions for newborn, maternity, and family photography pages.
          </p>
        </div>
        {!isCreating && !editItem && (
          <button
            onClick={handleCreateOpen}
            className="h-10 px-5 inline-flex items-center space-x-2 text-[10px] uppercase tracking-[0.2em] font-medium bg-[#8F9288] text-white hover:bg-[#7D8076] transition-all rounded-none cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add FAQ</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 text-xs text-red-700 tracking-wide">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border-l-4 border-emerald-400 p-4 text-xs text-emerald-700 tracking-wide">
          {success}
        </div>
      )}

      {/* Edit / Create Form Block */}
      {(isCreating || editItem) && (
        <form onSubmit={handleSave} className="bg-[#FAF8F5] border border-stone-200/80 p-8 space-y-6">
          <h3 className="text-sm font-semibold tracking-wider uppercase text-[#2C2623] border-b border-stone-200 pb-3">
            {editItem ? "Edit FAQ Item" : "Create New FAQ Item"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Category Select */}
            <div className="space-y-2">
              <label className="block text-[10px] tracking-wider uppercase text-stone-500 font-medium">
                Category (English)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-11 px-3 border border-stone-200 bg-white text-xs text-stone-700 focus:outline-hidden"
              >
                {DEFAULT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="Custom">Custom / Add New Category...</option>
              </select>
            </div>

            {/* Custom Category Input if selected */}
            {category === "Custom" && (
              <div className="space-y-2">
                <label className="block text-[10px] tracking-wider uppercase text-stone-500 font-medium">
                  Custom Category Name (English)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Newborn Styling Queries"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full h-11 px-3 border border-stone-200 bg-white text-xs text-stone-700 focus:outline-hidden"
                />
              </div>
            )}

            {/* Category Translation (French) */}
            <div className="space-y-2">
              <label className="block text-[10px] tracking-wider uppercase text-stone-500 font-medium">
                Category Translation (French)
              </label>
              <input
                type="text"
                placeholder="e.g. Questions Fréquentes - Maternité"
                value={categoryFr}
                onChange={(e) => setCategoryFr(e.target.value)}
                className="w-full h-11 px-3 border border-stone-200 bg-white text-xs text-stone-700 focus:outline-hidden"
              />
            </div>

            {/* Order index */}
            <div className="space-y-2">
              <label className="block text-[10px] tracking-wider uppercase text-stone-500 font-medium">
                Sorting Position Order
              </label>
              <input
                type="number"
                value={orderVal}
                onChange={(e) => setOrderVal(Number(e.target.value))}
                className="w-full h-11 px-3 border border-stone-200 bg-white text-xs text-stone-700 focus:outline-hidden"
              />
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-stone-200/50">
            {/* English Content */}
            <div className="space-y-4">
              <span className="block text-[10px] tracking-[0.25em] text-[#8F9288] font-bold uppercase">
                ENGLISH CONTENT
              </span>
              
              <div className="space-y-2">
                <label className="block text-[10px] tracking-wider uppercase text-stone-500 font-medium">
                  Question (EN)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. When should I book my session?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full h-11 px-3 border border-stone-200 bg-white text-xs text-stone-700 focus:outline-hidden"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] tracking-wider uppercase text-stone-500 font-medium">
                  Answer Text (EN)
                </label>
                <textarea
                  rows={6}
                  required
                  placeholder="Provide details..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="w-full p-3 border border-stone-200 bg-white text-xs text-stone-700 focus:outline-hidden"
                />
              </div>
            </div>

            {/* French Content */}
            <div className="space-y-4">
              <span className="block text-[10px] tracking-[0.25em] text-[#8F9288] font-bold uppercase">
                FRENCH CONTENT (Optional)
              </span>

              <div className="space-y-2">
                <label className="block text-[10px] tracking-wider uppercase text-stone-500 font-medium">
                  Question (FR)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Quand devrais-je réserver ma séance ?"
                  value={questionFr}
                  onChange={(e) => setQuestionFr(e.target.value)}
                  className="w-full h-11 px-3 border border-stone-200 bg-white text-xs text-stone-700 focus:outline-hidden"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] tracking-wider uppercase text-stone-500 font-medium">
                  Answer Text (FR)
                </label>
                <textarea
                  rows={6}
                  placeholder="Provide translated details..."
                  value={answerFr}
                  onChange={(e) => setAnswerFr(e.target.value)}
                  className="w-full p-3 border border-stone-200 bg-white text-xs text-stone-700 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="h-10 px-6 inline-flex items-center text-[10px] uppercase tracking-[0.2em] font-medium border border-stone-200 text-stone-500 hover:border-stone-850 hover:text-stone-850 transition-all rounded-none cursor-pointer bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-10 px-6 inline-flex items-center text-[10px] uppercase tracking-[0.2em] font-medium bg-[#8F9288] text-white hover:bg-[#7D8076] transition-all rounded-none cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save FAQ"}
            </button>
          </div>
        </form>
      )}

      {/* FAQs List Section */}
      {loading ? (
        <div className="text-center py-12 text-stone-400 font-serif italic text-sm">
          Loading FAQs...
        </div>
      ) : Object.keys(groups).length === 0 ? (
        <div className="text-center py-12 text-stone-400 font-serif italic text-sm">
          No FAQs configured. Click "Add FAQ" to create one.
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(groups).map(([catName, items]) => (
            <div key={catName} className="space-y-4">
              
              {/* Category Header Label */}
              <div className="bg-[#FAF8F5] border border-stone-200/60 px-5 py-3.5 flex justify-between items-center">
                <span className="font-serif text-[13px] uppercase tracking-[0.15em] text-[#2C2623] font-semibold">
                  {catName}
                </span>
                <span className="text-[10px] text-stone-400 tracking-wider font-sans">
                  {items.length} {items.length === 1 ? "item" : "items"}
                </span>
              </div>

              {/* Items Table */}
              <div className="border border-stone-200/50 bg-white divide-y divide-stone-100">
                {items.map((item) => (
                  <div key={item.id} className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-6 hover:bg-stone-50/30 transition-colors">
                    
                    <div className="space-y-3 flex-1">
                      {/* EN details */}
                      <div className="space-y-1">
                        <span className="text-[10px] tracking-wider uppercase text-stone-400 font-medium block">
                          EN ({item.order})
                        </span>
                        <h4 className="font-serif text-[15px] text-stone-800 font-light leading-snug">
                          {item.question}
                        </h4>
                        <p className="text-xs text-stone-500 font-sans leading-relaxed whitespace-pre-line text-justify max-w-4xl pt-1">
                          {item.answer}
                        </p>
                      </div>

                      {/* FR details if set */}
                      {(item.question_fr || item.answer_fr) && (
                        <div className="space-y-1 pt-2.5 border-t border-stone-100/60">
                          <span className="text-[10px] tracking-wider uppercase text-stone-400 font-medium block">
                            FR (Translated)
                          </span>
                          {item.question_fr && (
                            <h4 className="font-serif text-[15px] text-stone-700 font-light leading-snug">
                              {item.question_fr}
                            </h4>
                          )}
                          {item.answer_fr && (
                            <p className="text-xs text-stone-400 font-sans leading-relaxed whitespace-pre-line text-justify max-w-4xl pt-1">
                              {item.answer_fr}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex md:flex-col items-center gap-2.5 shrink-0 self-start md:self-auto">
                      <button
                        onClick={() => handleEditOpen(item)}
                        className="h-8 w-8 inline-flex items-center justify-center border border-stone-200 text-stone-500 hover:text-stone-800 hover:border-stone-400 bg-white transition-all cursor-pointer"
                        title="Edit FAQ"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="h-8 w-8 inline-flex items-center justify-center border border-stone-200 text-red-400 hover:text-red-600 hover:border-red-300 bg-white transition-all cursor-pointer"
                        title="Delete FAQ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
