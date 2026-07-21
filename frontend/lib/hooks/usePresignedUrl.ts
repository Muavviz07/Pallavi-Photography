"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export interface UsePresignedUrlProps {
  imageId?: string;
  initialUrl: string;
  expiresAt?: string | null;
  refreshThreshold?: number; // in minutes, default 60
}

export const usePresignedUrl = ({
  imageId,
  initialUrl,
  expiresAt,
  refreshThreshold = 60,
}: UsePresignedUrlProps) => {
  const [url, setUrl] = useState<string>(initialUrl);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    setUrl(initialUrl);
  }, [initialUrl]);

  const checkAndRefresh = useCallback(async () => {
    if (!imageId || !expiresAt) return;

    try {
      const expirationDate = new Date(expiresAt).getTime();
      const now = new Date().getTime();
      const minutesRemaining = (expirationDate - now) / (1000 * 60);

      if (minutesRemaining < refreshThreshold) {
        setIsRefreshing(true);
        console.log(
          `[usePresignedUrl] Image ID '${imageId}' expires in ${minutesRemaining.toFixed(1)}m (< ${refreshThreshold}m). Refreshing...`
        );
        
        const res = await api.get<{ s3_url: string; expires_at: string }>(
          `/api/media/refresh-url/${imageId}`
        );
        if (res?.s3_url) {
          setUrl(res.s3_url);
          console.log(`[usePresignedUrl] URL refreshed successfully for '${imageId}'`);
        }
      }
    } catch (error) {
      console.warn(`[usePresignedUrl] Refresh error for '${imageId}':`, error);
    } finally {
      setIsRefreshing(false);
    }
  }, [imageId, expiresAt, refreshThreshold]);

  useEffect(() => {
    checkAndRefresh();
    const interval = setInterval(checkAndRefresh, 5 * 60 * 1000); // Check every 5 mins
    return () => clearInterval(interval);
  }, [checkAndRefresh]);

  return { url, isRefreshing };
};
