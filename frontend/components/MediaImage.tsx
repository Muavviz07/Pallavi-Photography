"use client";

import React, { useState } from "react";
import { getMediaPreviewUrl, resolveMediaUrl } from "@/lib/media";

interface MediaImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  id?: string;
  media?: any;
  src?: string;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
}

export const MediaImage: React.FC<MediaImageProps> = ({
  id,
  media,
  src,
  alt,
  className = "",
  fill = false,
  width,
  height,
  onError,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);

  let imageUrl = src ? resolveMediaUrl(src) : "";

  if (media) {
    imageUrl = getMediaPreviewUrl(media);
  } else if (id) {
    imageUrl = resolveMediaUrl(`/api/media/proxy/${id}`);
  }

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setHasError(true);
    if (onError) {
      onError(e);
    }
  };

  if (hasError || !imageUrl) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center text-gray-400 text-xs ${className}`}>
        <span>Image not available</span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      width={width}
      height={height}
      onError={handleError}
      {...props}
    />
  );
};
