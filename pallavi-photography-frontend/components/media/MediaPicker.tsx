"use client";

import React, { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import { getMediaPreviewUrl, MediaItem } from "@/lib/media";
import { Loader2, Search } from "lucide-react";

interface MediaPickerProps {
  token: string;
  onSelect: (media: MediaItem) => void;
  category?: string;
  selectedId?: string | null;
  className?: string;
}

export default function MediaPicker({
  token,
  onSelect,
  category,
  selectedId,
  className = "",
}: MediaPickerProps) {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMedia = async () => {
      if (!token) return;
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ limit: "200" });
        if (searchTerm) params.set("search", searchTerm);
        const data = await fetchAPI(`/api/media?${params.toString()}`, { token });
        setMediaList(data.items || []);
      } catch (err: any) {
        setError(err.message || "Failed to load media library");
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(loadMedia, searchTerm ? 250 : 0);
    return () => clearTimeout(timer);
  }, [token, searchTerm]);

  if (loading && mediaList.length === 0) {
    return (
      <div className={`flex items-center justify-center py-12 text-xs text-[#6E635F] ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin mr-2 text-[#C4A484]" />
        Loading media library...
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
        <input
          type="text"
          placeholder="Search media..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm pl-9 pr-3 py-2 text-xs outline-hidden"
        />
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-sm px-3 py-2">{error}</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[420px] overflow-y-auto pr-1">
        {mediaList.map((media) => {
          const isSelected = selectedId === media.id;
          return (
            <button
              key={media.id}
              type="button"
              onClick={() => onSelect(media)}
              className={`text-left border rounded-sm overflow-hidden transition-all cursor-pointer ${
                isSelected
                  ? "border-[#C4A484] ring-2 ring-[#C4A484]/30"
                  : "border-[#DCD0C0]/30 hover:border-[#C4A484]"
              }`}
            >
              <div className="aspect-square bg-stone-100 relative">
                <img
                  src={getMediaPreviewUrl(media)}
                  alt={media.alt_text || media.filename}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div className="p-2 space-y-1">
                <p className="text-[10px] font-medium text-[#2C2623] truncate">
                  {media.title || media.filename}
                </p>
                {media.category && (
                  <span className="inline-block text-[9px] uppercase tracking-wider bg-[#FAF8F5] text-[#6E635F] px-1.5 py-0.5 rounded-sm">
                    {media.category}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {!loading && mediaList.length === 0 && (
        <div className="text-center py-10 text-xs text-[#6E635F] border border-dashed border-[#DCD0C0]/35 rounded-sm">
          No media found. Upload images in the Media Library first.
        </div>
      )}
    </div>
  );
}
