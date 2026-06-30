"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, Heart } from "lucide-react";

const Instagram = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const Facebook = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="bg-[#2C2623] text-[#FAF8F5] pt-16 pb-12 border-t border-[#DCD0C0]/10">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
        
        {/* Column 1: Studio Details */}
        <div className="space-y-4">
          <Link href="/" className="inline-block group">
            <h3 className="text-xl font-light tracking-[0.25em] uppercase font-serif">
              PALLAVI
            </h3>
            <span className="block text-[8px] tracking-[0.4em] uppercase font-sans text-stone-400 -mt-1">
              Photography
            </span>
          </Link>
          <p className="text-xs text-stone-400 leading-relaxed font-light max-w-sm">
            Elegantly documenting newborns, maternity journeys, warm family stories, and raw nature portraits across Switzerland. Creating timeless memories with high-end digital precision.
          </p>
          <div className="flex items-center space-x-4 pt-2">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="text-stone-400 hover:text-[#C4A484] transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              className="text-stone-400 hover:text-[#C4A484] transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a
              href="mailto:hello@pallaviphotography.com"
              className="text-stone-400 hover:text-[#C4A484] transition-colors"
              aria-label="Email"
            >
              <Mail className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Column 2: Navigation Links */}
        <div className="space-y-4 md:pl-12">
          <h4 className="text-xs uppercase tracking-widest font-semibold text-[#C4A484]">
            Explore
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs font-light tracking-wide text-stone-300">
            <div className="space-y-2">
              <Link href="/" className="block hover:text-[#C4A484] transition-colors">Home</Link>
              <Link href="/#about" className="block hover:text-[#C4A484] transition-colors">About Me</Link>
              <Link href="/#contact" className="block hover:text-[#C4A484] transition-colors">Contact</Link>
              <Link href="/client-portal" className="block hover:text-[#C4A484] transition-colors">Client Portal</Link>
            </div>
            <div className="space-y-2">
              <Link href="/our-gallery/newborn" className="block hover:text-[#C4A484] transition-colors">Newborns</Link>
              <Link href="/our-gallery/maternity" className="block hover:text-[#C4A484] transition-colors">Maternity</Link>
              <Link href="/our-gallery/family" className="block hover:text-[#C4A484] transition-colors">Family</Link>
              <Link href="/our-gallery/fine-art" className="block hover:text-[#C4A484] transition-colors">Fine Art</Link>
            </div>
          </div>
        </div>

        {/* Column 3: Newsletter */}
        <div className="space-y-4">
          <h4 className="text-xs uppercase tracking-widest font-semibold text-[#C4A484]">
            Newsletter
          </h4>
          <p className="text-xs text-stone-400 leading-relaxed font-light">
            Subscribe to receive seasonal session availability, mini-shoot slots, and photography insights.
          </p>
          {subscribed ? (
            <p className="text-xs text-[#C4A484] font-medium transition-all duration-300">
              Thank you! You have successfully subscribed to our list.
            </p>
          ) : (
            <form onSubmit={handleSubscribe} className="flex max-w-sm border-b border-stone-500 pb-1">
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-transparent border-0 ring-0 outline-hidden flex-1 text-xs text-white placeholder-stone-500 py-1"
              />
              <button
                type="submit"
                className="text-stone-400 hover:text-[#C4A484] transition-colors pl-2"
                aria-label="Subscribe"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

      </div>

      {/* Copyright Bar */}
      <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-stone-800 text-[10px] text-stone-500 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 uppercase tracking-widest font-light">
        <p>© {new Date().getFullYear()} Pallavi Photography. All rights reserved.</p>
        <p className="flex items-center space-x-1">
          <span>Crafted with</span>
          <Heart className="w-2.5 h-2.5 text-[#C4A484] fill-[#C4A484]" />
          <span>in Switzerland</span>
        </p>
      </div>
    </footer>
  );
}
