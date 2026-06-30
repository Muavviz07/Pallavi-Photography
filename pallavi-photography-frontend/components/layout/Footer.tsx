"use client";

import React from "react";
import Link from "next/link";
import { Mail, Phone, MessageSquare } from "lucide-react";
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
    <footer className="bg-brand-bg text-brand-dark pt-20 pb-12 border-t border-brand-border">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-12 items-start text-left">
        
        {/* Column 1: Follow Us */}
        <div className="space-y-6">
          <h4 className="text-[10px] uppercase tracking-[0.25em] text-brand-sage font-semibold">
            FOLLOW US
          </h4>
          
          {/* Social Icons */}
          <div className="flex items-center space-x-4 text-brand-muted">
            <a
              href="#"
              className="hover:text-brand-sage transition-colors duration-200"
              aria-label="Facebook"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a
              href="https://instagram.com/Pallavivishk"
              target="_blank"
              rel="noreferrer"
              className="hover:text-brand-sage transition-colors duration-200"
              aria-label="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
          </div>

          {/* Contact Details */}
          <div className="space-y-3 pt-2 text-xs font-light text-brand-muted">
            <a
              href="mailto:pallavi.vishk@gmail.com"
              className="flex items-center space-x-3 hover:text-brand-sage transition-colors duration-200"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>pallavi.vishk@gmail.com</span>
            </a>
            <a
              href="https://wa.me/41789077644"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-3 hover:text-brand-sage transition-colors duration-200"
            >
              <MessageSquare className="w-3.5 h-3.5 text-green-500 fill-green-500" />
              <span>+41 789077644</span>
            </a>
          </div>
        </div>

        {/* Column 2: Logo Column */}
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <Link href="/" className="group">
            <img
              src="/Pallavi-Logo-V1.webp"
              alt="Pallavi Photography Logo"
              className="h-16 w-auto object-contain brightness-0"
            />
          </Link>
          <p className="text-[10px] tracking-[0.3em] text-brand-muted uppercase font-light">
            Timeless Portraits, Natural Light
          </p>
        </div>

        {/* Column 3: Newsletter */}
        <div className="space-y-4">
          <h4 className="text-[10px] uppercase tracking-[0.25em] text-brand-sage font-semibold">
            NEWSLETTER
          </h4>
          <p className="text-xs text-brand-muted leading-relaxed font-light">
            Follow our latest stories.
          </p>
          <div className="pt-2">
            <NewsletterSignup />
          </div>
        </div>

      </div>

      {/* Copyright Bar */}
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 mt-16 pt-8 border-t border-brand-border text-[9px] text-brand-muted flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 uppercase tracking-[0.2em] font-light">
        <p>© Copyright 2026 – Powered by DELQ Solutions</p>
        <p>Switzerland Fine Art Photography Studio</p>
      </div>
    </footer>
  );
}
