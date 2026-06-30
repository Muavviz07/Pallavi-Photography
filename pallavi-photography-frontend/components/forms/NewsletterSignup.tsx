"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setMessage("");

    try {
      await api.post("/newsletter/subscribe", { email });
      setStatus("success");
      setEmail("");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="w-full">
      {status === "success" ? (
        <div className="text-center py-2 animate-fade-in">
          <p className="text-[11px] font-serif italic text-brand-sage">
            Thank you for subscribing!
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-1">
          <div className="flex items-center justify-between border-b border-brand-border/80 py-1 focus-within:border-brand-dark transition-colors duration-250 w-full relative">
            <span className="text-[10px] tracking-[0.2em] text-stone-400 font-light select-none shrink-0 mr-3">
              E-MAIL
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={status === "loading"}
              className="flex-1 bg-transparent text-xs text-brand-dark outline-hidden py-1"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="text-stone-400 hover:text-brand-dark transition-colors p-1 cursor-pointer disabled:opacity-60 shrink-0"
              title="Subscribe"
            >
              {status === "loading" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 text-stone-400"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              )}
            </button>
          </div>
          {status === "error" && (
            <p className="text-[10px] text-red-600 font-light">{message}</p>
          )}
        </form>
      )}
    </div>
  );
}
