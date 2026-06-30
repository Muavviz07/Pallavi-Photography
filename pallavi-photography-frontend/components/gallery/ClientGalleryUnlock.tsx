"use client";

import { useState } from "react";
import { Lock, ArrowRight, Eye, EyeOff } from "lucide-react";

interface ClientGalleryUnlockProps {
  slug: string;
  onUnlock: (token: string) => void;
}

export default function ClientGalleryUnlock({ slug, onUnlock }: ClientGalleryUnlockProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setError("");
    setLoading(true);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
      const res = await fetch(`${apiUrl}/api/client-galleries/${slug}/access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setError(errData.detail || "Incorrect password. Please try again.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data.unlocked && data.token) {
        onUnlock(data.token);
      } else {
        setError("Unlock failed. Missing verification token.");
      }
    } catch (err) {
      setError("Network error. Please make sure the backend is active.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FCFAF7] px-6 py-12">
      <div className="max-w-md w-full bg-[#FAF8F5] border border-[#DCD0C0]/50 rounded-md p-8 shadow-xs text-center space-y-6">
        
        {/* Lock Icon */}
        <div className="w-12 h-12 rounded-full bg-[#F5EFEB] border border-[#DCD0C0]/30 flex items-center justify-center mx-auto text-[#C4A484] animate-pulse">
          <Lock className="w-5 h-5" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h2 className="text-2xl font-light tracking-widest uppercase font-serif text-[#2C2623]">
            Private Gallery
          </h2>
          <p className="text-xs text-[#6E635F] tracking-wide font-light">
            This collection is password-protected. Please enter your gallery access key to unlock and view the photographs.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter Entry Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/60 rounded-sm pl-4 pr-12 py-3 text-xs tracking-widest outline-hidden focus:border-[#C4A484] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#2C2623] cursor-pointer"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-500 font-medium text-left">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center space-x-2 text-xs uppercase tracking-widest text-[#FCFAF7] bg-[#2C2623] hover:bg-[#352F2C] py-3.5 rounded-sm font-medium transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-stone-450 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Unlock Gallery</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Back Link */}
        <div className="pt-2">
          <a
            href="/"
            className="text-[10px] uppercase tracking-widest text-[#C4A484] hover:text-[#2C2623] font-medium"
          >
            Return to Homepage
          </a>
        </div>

      </div>
    </div>
  );
}
