"use client";

import React, { useState } from "react";
import { Send, CheckCircle, Loader2 } from "lucide-react";
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
        <div className="flex items-center space-x-3 bg-brand-cream border border-brand-sage/30 rounded-xs p-4 text-brand-dark animate-fade-in">
          <CheckCircle className="w-5 h-5 text-brand-sage shrink-0" />
          <p className="text-[11px] font-light">
            Thank you! Please check your email to confirm your subscription.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex items-center border-b border-brand-border py-1.5 focus-within:border-brand-dark transition-colors duration-250">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="YOUR EMAIL ADDRESS"
              required
              disabled={status === "loading"}
              className="flex-1 bg-transparent text-xs text-brand-dark placeholder-stone-400 outline-hidden py-1"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="text-brand-sage hover:text-brand-dark transition-colors p-1.5 cursor-pointer disabled:opacity-60"
              title="Subscribe"
            >
              {status === "loading" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
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
