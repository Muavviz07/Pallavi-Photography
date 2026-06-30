"use client";

import React, { useState } from "react";
import { Send, CheckCircle, Loader2 } from "lucide-react";

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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Subscription failed");
      }

      setStatus("success");
      setEmail("");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {status === "success" ? (
        <div className="flex items-center space-x-3 bg-[#FCFAF7] border border-[#C4A484]/30 rounded-sm p-4 text-[#2C2623] animate-fade-in shadow-xs">
          <CheckCircle className="w-5 h-5 text-[#C4A484] shrink-0" />
          <p className="text-xs font-light">
            Thank you! Please check your email to confirm your subscription.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              required
              disabled={status === "loading"}
              className="flex-1 bg-[#FCFAF7] border border-[#DCD0C0]/50 rounded-xs px-3.5 py-2.5 text-xs text-[#2C2623] placeholder-[#6E635F]/60 outline-hidden focus:border-[#C4A484] disabled:opacity-60 transition-colors"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="inline-flex items-center justify-center bg-[#2C2623] hover:bg-[#352F2C] text-[#FCFAF7] px-5 py-2.5 rounded-xs text-xs uppercase tracking-widest font-medium transition-all disabled:opacity-60 cursor-pointer min-w-[100px]"
            >
              {status === "loading" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <span>Join</span>
                  <Send className="w-3 h-3 ml-1.5" />
                </>
              )}
            </button>
          </div>
          {status === "error" && (
            <p className="text-[10px] text-red-600 font-light pl-1">{message}</p>
          )}
        </form>
      )}
    </div>
  );
}
