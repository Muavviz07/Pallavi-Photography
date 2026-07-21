"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

interface AccessDeniedProps {
  message?: string;
  redirectTo?: string;
  buttonText?: string;
}

export default function AccessDenied({
  message = "You do not have the required permissions to access this page. Please contact your system administrator to request access.",
  redirectTo = "/delq-portal",
  buttonText = "Return to Overview"
}: AccessDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6 animate-scale-in">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center border border-red-100/50">
        <ShieldAlert className="w-8 h-8 text-red-500 animate-pulse" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-serif font-light text-[#2C2623] tracking-wide">
          Access Denied
        </h2>
        <p className="text-xs text-stone-500 max-w-sm font-light leading-relaxed">
          {message}
        </p>
      </div>
      <Link
        href={redirectTo}
        className="inline-flex items-center text-[10px] uppercase tracking-widest text-[#FCFAF7] bg-[#2C2623] hover:bg-[#352F2C] px-5 py-3 rounded-sm font-semibold transition-all duration-300 shadow-sm cursor-pointer"
      >
        {buttonText}
      </Link>
    </div>
  );
}
