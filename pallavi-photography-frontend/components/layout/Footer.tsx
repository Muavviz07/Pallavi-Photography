"use client";

import React from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import NewsletterSignup from "../forms/NewsletterSignup";

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
  return (
    <footer className="bg-white text-brand-dark pt-16 border-t border-brand-border/60">
      
      {/* 3-Column Content Grid with vertical borders */}
      <div className="max-w-[1450px] mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-3 items-stretch pb-16">
        
        {/* Column 1: Follow Us */}
        <div className="flex flex-col items-center text-center justify-center space-y-5 py-6 lg:py-2">
          <h4 className="text-[11px] uppercase tracking-[0.25em] text-brand-dark font-medium">
            FOLLOW US
          </h4>
          
          {/* Social Icons with connector line */}
          <div className="flex items-center space-x-4 text-stone-500">
            <a
              href="#"
              className="hover:text-brand-dark transition-colors duration-200"
              aria-label="Facebook"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <span className="w-8 h-[1px] bg-stone-300"></span>
            <a
              href="https://instagram.com/Pallavivishk"
              target="_blank"
              rel="noreferrer"
              className="hover:text-brand-dark transition-colors duration-200"
              aria-label="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
          </div>

          {/* Contact Links */}
          <div className="flex flex-col items-center space-y-2 pt-1">
            <a
              href="mailto:pallavi.vishk@gmail.com"
              className="text-sm font-serif italic text-brand-dark hover:text-brand-sage transition-colors"
            >
              pallavi.vishk@gmail.com
            </a>
            
            <div className="flex items-center space-x-2 text-sm font-serif italic text-brand-dark">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4 text-brand-coral"
              >
                <path d="M6.62 10.79a15.15 15.15 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.27 11.36 11.36 0 004.28 1.15 1 1 0 011 .98v3.48a1 1 0 01-1 1A16 16 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 001.15 4.28 1 1 0 01-.27 1.1l-2.21 2.21z" />
              </svg>
              <a
                href="https://wa.me/41789077644"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brand-sage transition-colors"
              >
                +41 789077644
              </a>
            </div>
          </div>
        </div>

        {/* Column 2: Centered Logo Column with vertical borders */}
        <div className="flex flex-col items-center justify-center text-center space-y-4 py-6 lg:py-2 border-y lg:border-y-0 lg:border-x border-brand-border px-4 md:px-8">
          <Link href="/" className="group cursor-pointer">
            <img
              src="/Pallavi-Logo-V1.webp"
              alt="Pallavi Photography Logo"
              className="h-28 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Column 3: Newsletter Column */}
        <div className="flex flex-col items-center text-center justify-center space-y-4 py-6 lg:py-2">
          <h4 className="text-[11px] uppercase tracking-[0.25em] text-brand-dark font-medium">
            NEWSLETTER
          </h4>
          <p className="text-xs font-serif italic text-brand-muted">
            Follow our latest stories.
          </p>
          <div className="w-full max-w-[280px] mx-auto pt-1">
            <NewsletterSignup />
          </div>
          <div className="pt-1">
            <Link
              href="/privacy-policy"
              className="text-[11px] font-serif italic text-stone-400 hover:text-brand-dark transition-colors block"
            >
              Privacy Policy
            </Link>
          </div>
        </div>

      </div>

      {/* Bottom Bar: Copyright and Language Selector */}
      <div className="bg-[#FAF8F5] border-t border-brand-border/60 py-4 px-6 md:px-10">
        <div className="max-w-[1450px] mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          
          {/* Left Side: Language Box Selector */}
          <div className="flex items-center space-x-1.5 bg-white border border-stone-200 shadow-xs px-3 py-1 text-[11px] font-medium text-stone-700 rounded-sm select-none">
            <span className="text-base leading-none">🇬🇧</span>
            <span className="tracking-wide">EN</span>
            <span className="text-[8px] text-stone-400">▲</span>
          </div>

          {/* Center: Copyright Text */}
          <div className="text-center">
            <p className="text-[12px] font-serif italic text-stone-500">
              © Copyright 2026 – Powered by DELQ Solutions
            </p>
          </div>

          {/* Right Side Spacer/Placeholder to balance layout flex box */}
          <div className="hidden md:block w-16"></div>
          
        </div>
      </div>

      {/* Persistent WhatsApp Floating Button */}
      <a
        href="https://wa.me/41789077644"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 w-11 h-11 bg-green-500 rounded-full flex items-center justify-center text-white hover:scale-105 hover:bg-green-600 transition-all duration-300 shadow-lg z-40"
        title="Chat on WhatsApp"
      >
        <MessageSquare className="w-5.5 h-5.5 fill-white text-green-500" />
      </a>
      
    </footer>
  );
}
