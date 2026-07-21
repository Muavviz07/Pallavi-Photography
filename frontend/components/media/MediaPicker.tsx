"use client";

import React, { useEffect, useState } from "react";
import { fetchAPI } from "@/lib/api";
import { getMediaPreviewUrl, MediaItem } from "@/lib/media";
import { Loader2, Search, FolderArchive, Check, CheckSquare, Square } from "lucide-react";

interface MediaPickerProps {
  token: string;
  onSelect: (media: MediaItem) => void;
  onSelectMultiple?: (mediaList: MediaItem[]) => void;
  category?: string;
  selectedId?: string | null;
  allowedExtensions?: string[];
  multiSelect?: boolean;
  className?: string;
}

export default function MediaPicker({
  token,
  onSelect,
  onSelectMultiple,
  category,
  selectedId,
  allowedExtensions,
  multiSelect = false,
  className = "",
}: MediaPickerProps) {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [selectedItems, setSelectedItems] = useState<MediaItem[]>([]);

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

  const filteredMediaList = allowedExtensions
    ? mediaList.filter((item) => {
        const filename = (item.original_filename || item.filename || "").toLowerCase();
        return allowedExtensions.some((ext) => filename.endsWith(ext.toLowerCase()));
      })
    : mediaList;

  const handleItemClick = (media: MediaItem) => {
    if (multiSelect) {
      const isSel = selectedItems.some((item) => item.id === media.id);
      if (isSel) {
        setSelectedItems(selectedItems.filter((item) => item.id !== media.id));
      } else {
        setSelectedItems([...selectedItems, media]);
      }
    } else {
      onSelect(media);
    }
  };

  const handleSelectAll = () => {
    setSelectedItems(filteredMediaList);
  };

  const handleClearAll = () => {
    setSelectedItems([]);
  };

  const handleConfirmMultiSelect = () => {
    if (onSelectMultiple) {
      onSelectMultiple(selectedItems);
    }
  };

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
      <div className="flex flex-col sm:flex-row gap-2 justify-between sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
          <input
            type="text"
            placeholder="Search media..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm pl-9 pr-3 py-2 text-xs outline-hidden"
          />
        </div>
        
        {multiSelect && filteredMediaList.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-[#6E635F] hover:text-[#2C2623] px-2 py-1 border border-[#DCD0C0]/35 rounded-sm bg-[#FAF8F5] cursor-pointer"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[#6E635F] hover:text-[#2C2623] px-2 py-1 border border-[#DCD0C0]/35 rounded-sm bg-[#FAF8F5] cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-sm px-3 py-2">{error}</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[350px] overflow-y-auto pr-1">
        {filteredMediaList.map((media) => {
          const isSelectedSingle = selectedId === media.id;
          const isSelectedMulti = selectedItems.some((item) => item.id === media.id);
          const isSelected = multiSelect ? isSelectedMulti : isSelectedSingle;
          
          const isZip = (media.original_filename || "").toLowerCase().endsWith(".zip") || (media.original_url || "").toLowerCase().endsWith(".zip");

          return (
            <button
              key={media.id}
              type="button"
              onClick={() => handleItemClick(media)}
              className={`text-left border rounded-sm overflow-hidden transition-all cursor-pointer relative group ${
                isSelected
                  ? "border-[#C4A484] ring-2 ring-[#C4A484]/30 bg-stone-50"
                  : "border-[#DCD0C0]/30 hover:border-[#C4A484]"
              }`}
            >
              <div className="aspect-square bg-stone-100 relative flex items-center justify-center">
                {isZip ? (
                  <div className="flex flex-col items-center justify-center p-2 text-stone-400">
                    <FolderArchive className="w-8 h-8 text-[#C4A484] mb-1" />
                    <span className="text-[9px] uppercase tracking-wider block font-mono text-[#6E635F]">ZIP</span>
                  </div>
                ) : (
                  <img
                    src={getMediaPreviewUrl(media)}
                    alt={media.alt_text || media.filename}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                
                {/* Multi selection checkbox overlay */}
                {multiSelect && (
                  <div className="absolute top-1.5 right-1.5 z-10">
                    {isSelectedMulti ? (
                      <div className="bg-[#C4A484] text-white p-0.5 rounded-sm">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="bg-white/80 border border-stone-300 p-0.5 rounded-sm opacity-60 group-hover:opacity-100 transition-opacity">
                        <div className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                )}
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

      {!loading && filteredMediaList.length === 0 && (
        <div className="text-center py-10 text-xs text-[#6E635F] border border-dashed border-[#DCD0C0]/35 rounded-sm">
          No media files found matching the search criteria.
        </div>
      )}

      {/* Multi select confirm actions footer bar */}
      {multiSelect && (
        <div className="flex items-center justify-between border-t border-[#DCD0C0]/20 pt-4 mt-2">
          <span className="text-xs text-[#6E635F] font-light">
            Selected <strong className="text-[#2C2623] font-semibold">{selectedItems.length}</strong> asset{selectedItems.length === 1 ? "" : "s"}
          </span>
          <button
            type="button"
            onClick={handleConfirmMultiSelect}
            disabled={selectedItems.length === 0}
            className="inline-flex items-center space-x-1.5 text-xs uppercase tracking-widest text-[#FCFAF7] bg-[#2C2623] hover:bg-[#352F2C] disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2.5 rounded-sm font-semibold transition-all cursor-pointer"
          >
            <span>Add Selected ({selectedItems.length})</span>
          </button>
        </div>
      )}
    </div>
  );
}
