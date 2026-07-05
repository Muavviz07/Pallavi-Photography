"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { fetchAPI } from "@/lib/api";
import {
  getMediaPreviewUrl,
  MEDIA_CATEGORIES,
  MediaItem,
  MediaListResponse,
  uploadMediaFile,
} from "@/lib/media";
import { Loader2, Trash2, Upload } from "lucide-react";

export default function MediaManagementPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;

  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [altText, setAltText] = useState("");
  const [category, setCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadMedia = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (filterCategory) params.set("category", filterCategory);
      if (searchTerm) params.set("search", searchTerm);
      const data: MediaListResponse = await fetchAPI(`/api/media?${params.toString()}`, { token });
      setMediaList(data.items || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message || "Failed to load media");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadMedia();
  }, [token, filterCategory]);

  useEffect(() => {
    if (!token) return;
    const timer = setTimeout(loadMedia, searchTerm ? 300 : 0);
    return () => clearTimeout(timer);
  }, [searchTerm, token]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !token) return;

    setUploading(true);
    setError("");
    setSuccess("");
    try {
      const newMedia = await uploadMediaFile(selectedFile, token, {
        title: title || undefined,
        description: description || undefined,
        alt_text: altText || undefined,
        category: category || undefined,
      });
      setMediaList((prev) => [newMedia, ...prev]);
      setTotal((prev) => prev + 1);
      setSelectedFile(null);
      setTitle("");
      setDescription("");
      setAltText("");
      setCategory("");
      setSuccess("Image uploaded to media library.");
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (mediaId: string) => {
    if (!token || !confirm("Delete this media from the library?")) return;

    try {
      await fetchAPI(`/api/media/${mediaId}`, { method: "DELETE", token });
      setMediaList((prev) => prev.filter((m) => m.id !== mediaId));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      alert(err.message || "Failed to delete media");
    }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex items-start justify-between border-b border-[#DCD0C0]/25 pb-6 gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-light font-serif text-[#2C2623]">Media Library</h1>
          <p className="text-xs text-[#6E635F] font-light">
            Centralized image management for portfolio, client galleries, and blog content.
          </p>
        </div>
        <p className="text-[10px] uppercase tracking-wider text-stone-400 font-medium whitespace-nowrap">
          {total} item{total === 1 ? "" : "s"}
        </p>
      </div>

      <div className="bg-white border border-[#DCD0C0]/25 rounded-md p-6 space-y-4">
        <h2 className="text-sm font-serif font-semibold text-[#2C2623]">Upload New Media</h2>

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="border-2 border-dashed border-[#DCD0C0]/40 rounded-sm p-8 text-center bg-[#FAF8F5]/50">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="hidden"
              id="media-file-input"
            />
            <label htmlFor="media-file-input" className="cursor-pointer flex flex-col items-center space-y-2">
              <Upload className="w-7 h-7 text-[#C4A484]" />
              <span className="text-xs font-medium text-[#2C2623]">
                {selectedFile ? selectedFile.name : "Click to upload or drag and drop"}
              </span>
              <span className="text-[10px] text-[#6E635F]">PNG, JPG, WebP up to 10MB</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden"
            />
            <input
              type="text"
              placeholder="Alt text for accessibility"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              className="bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden"
            />
          </div>

          <textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden resize-none font-light"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden"
          >
            {MEDIA_CATEGORIES.map((cat) => (
              <option key={cat.value || "none"} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={!selectedFile || uploading}
            className="w-full md:w-auto inline-flex items-center justify-center px-6 py-2.5 bg-[#2C2623] hover:bg-[#352F2C] text-white rounded-sm text-xs uppercase tracking-widest font-semibold transition-all disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : null}
            {uploading ? "Uploading..." : "Upload Media"}
          </button>
        </form>

        {success && <p className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-sm px-3 py-2">{success}</p>}
        {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-sm px-3 py-2">{error}</p>}
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <input
          type="text"
          placeholder="Search media..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 bg-white border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-white border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden md:w-48"
        >
          <option value="">All categories</option>
          {MEDIA_CATEGORIES.filter((c) => c.value).map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="w-7 h-7 text-[#C4A484] animate-spin" />
          <p className="text-xs text-[#6E635F]">Loading media library...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {mediaList.map((media) => (
            <div
              key={media.id}
              className="bg-white border border-[#DCD0C0]/25 rounded-md overflow-hidden hover:shadow-sm transition-shadow"
            >
              <div className="relative aspect-square bg-stone-100">
                <img
                  src={getMediaPreviewUrl(media)}
                  alt={media.alt_text || media.filename}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div className="p-3 space-y-2">
                <p className="text-xs font-medium text-[#2C2623] truncate">{media.title || media.filename}</p>
                {media.description && (
                  <p className="text-[10px] text-[#6E635F] line-clamp-2 font-light">{media.description}</p>
                )}
                {media.category && (
                  <span className="inline-block text-[9px] uppercase tracking-wider bg-[#FAF8F5] text-[#6E635F] px-2 py-0.5 rounded-sm">
                    {media.category}
                  </span>
                )}
                <p className="text-[10px] text-stone-400">
                  Used in {media.usage_count} place{media.usage_count === 1 ? "" : "s"}
                </p>
                <button
                  onClick={() => handleDelete(media.id)}
                  disabled={media.usage_count > 0}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-red-600 border border-red-200 rounded-sm hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed text-[10px] uppercase tracking-wider font-semibold transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && mediaList.length === 0 && (
        <div className="text-center py-16 border border-dashed border-[#DCD0C0]/35 rounded-md bg-white">
          <p className="text-xs text-[#6E635F] font-light">No media uploaded yet.</p>
        </div>
      )}

      <p className="text-[10px] text-stone-400 font-light">
        Use selected media in{" "}
        <Link href="/delq-portal/portfolio" className="text-[#C4A484] hover:underline">
          Portfolio
        </Link>
        ,{" "}
        <Link href="/delq-portal/galleries" className="text-[#C4A484] hover:underline">
          Client Galleries
        </Link>
        , or{" "}
        <Link href="/delq-portal/blogs" className="text-[#C4A484] hover:underline">
          Blog Journal
        </Link>
        .
      </p>
    </div>
  );
}
