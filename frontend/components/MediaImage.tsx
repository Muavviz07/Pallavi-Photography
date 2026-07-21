"use client";

import React, { useState } from "react";
import { usePresignedUrl } from "@/lib/hooks/usePresignedUrl";
import { resolveMediaUrl } from "@/lib/media";

export interface MediaImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  id?: string;
  src: string;
  expiresAt?: string | null;
  alt: string;
  refreshThreshold?: number;
  showRefreshingBadge?: boolean;
}

export const MediaImage: React.FC<MediaImageProps> = ({
  id,
  src,
  expiresAt,
  alt,
  className = "",
  refreshThreshold = 60,
  showRefreshingBadge = false,
  onError,
  ...props
}) => {
  const { url, isRefreshing } = usePresignedUrl({
    imageId: id,
    initialUrl: src,
    expiresAt,
    refreshThreshold,
  });

  const [hasError, setHasError] = useState(false);
  const resolvedSrc = resolveMediaUrl(url);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setHasError(true);
    if (onError) {
      onError(e);
    }
  };

  return (
    <div className="relative inline-block overflow-hidden">
      <img
        src={resolvedSrc}
        alt={alt}
        className={`${className} ${isRefreshing ? "opacity-75 transition-opacity" : ""}`}
        onError={handleError}
        {...props}
      />
      {showRefreshingBadge && isRefreshing && (
        <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded shadow">
          Refreshing...
        </span>
      )}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 text-xs p-2 text-center">
          Failed to load image
        </div>
      )}
    </div>
  );
};
