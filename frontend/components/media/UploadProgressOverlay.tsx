"use client";

import React, { useEffect, useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";

interface UploadProgressOverlayProps {
  isActive: boolean;
  statusText?: string;
  onFadeOutComplete?: () => void;
}

export default function UploadProgressOverlay({
  isActive,
  statusText = "Uploading file...",
  onFadeOutComplete,
}: UploadProgressOverlayProps) {
  const [progress, setProgress] = useState(0);
  const [show, setShow] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isActive) {
      setShow(true);
      setIsSuccess(false);
      setProgress(5);
      
      // Fast phase to 88%
      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 88) {
            clearInterval(timer);
            return 88;
          }
          const increment = Math.max(1, (88 - prev) * 0.25);
          return Math.min(88, prev + increment);
        });
      }, 60);

      return () => clearInterval(timer);
    } else if (show) {
      // Transition to success and 100%
      setIsSuccess(true);
      setProgress(100);

      const fadeOutTimer = setTimeout(() => {
        setShow(false);
        if (onFadeOutComplete) onFadeOutComplete();
      }, 1200);

      return () => clearTimeout(fadeOutTimer);
    }
  }, [isActive, show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity duration-300">
      <div className="bg-[#FCFAF7] border border-[#DCD0C0]/40 p-8 rounded-md max-w-sm w-full mx-4 shadow-xl space-y-6 text-center animate-fade-in">
        {isSuccess ? (
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto animate-scale-up" />
        ) : (
          <Loader2 className="w-12 h-12 text-[#C4A484] mx-auto animate-spin" />
        )}
        
        <div className="space-y-1">
          <h4 className="text-sm font-serif font-semibold text-[#2C2623]">
            {isSuccess ? "Upload Complete!" : "Uploading Assets"}
          </h4>
          <p className="text-xs text-[#6E635F] font-light font-mono">
            {statusText}
          </p>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full bg-[#FAF8F5] border border-[#DCD0C0]/25 h-2 rounded-full overflow-hidden relative">
          <div 
            className="h-full bg-gradient-to-r from-[#C4A484] to-[#2C2623] transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <span className="text-[10px] uppercase tracking-widest text-[#6E635F] font-semibold font-mono block">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}
