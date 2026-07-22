"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { fetchAPI } from "@/lib/api";
import {
  getMediaPreviewUrl,
  MediaItem,
  MediaListResponse,
  uploadMediaFile,
} from "@/lib/media";
import {
  Loader2,
  Trash2,
  Upload,
  Edit2,
  Copy,
  Check,
  X,
  ExternalLink,
  FileArchive,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import ImageCropper from "@/components/cropper/ImageCropper";
import UploadProgressOverlay from "@/components/media/UploadProgressOverlay";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const isZip = (media: MediaItem) =>
  (media.original_url || "").toLowerCase().endsWith(".zip") || 
  (media.original_filename || "").toLowerCase().endsWith(".zip") ||
  (media.filename || "").toLowerCase().endsWith(".zip");

const getFullUrl = (media: MediaItem) => {
  if (media.id) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return `${apiUrl}/api/media/proxy/${media.id}`;
  }
  const path = media.file_url || media.s3_url || media.original_url || "";
  return path.startsWith("http") ? path : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${path.startsWith("/") ? path : `/${path}`}`;
};

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
  const [searchTerm, setSearchTerm] = useState("");

  const [showCropper, setShowCropper] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Edit modal state
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAltText, setEditAltText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Copy link state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  
  const lightboxImages = mediaList.filter(item => !isZip(item));

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") {
        setLightboxIndex((prev) => (prev !== null && prev < lightboxImages.length - 1 ? prev + 1 : 0));
      }
      if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : lightboxImages.length - 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, lightboxImages]);

  const loadMedia = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (searchTerm) params.set("search", searchTerm);
      const data: MediaListResponse = await fetchAPI(`/api/media?${params.toString()}`, { token });
      setMediaList(data.items || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message || "Failed to load media");
    } finally {
      setLoading(false);
    }
  }, [token, searchTerm]);

  useEffect(() => {
    if (token) loadMedia();
  }, [token]);

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
      });
      setMediaList((prev) => [newMedia, ...prev]);
      setTotal((prev) => prev + 1);
      setSelectedFile(null);
      setTitle("");
      setDescription("");
      setAltText("");
      setSuccess("File uploaded to media library.");
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleCroppedUpload = async (blob: Blob, cropTitle: string, cropAltText: string, aspect?: string) => {
    if (!token) return;
    setUploading(true);
    setError("");
    setSuccess("");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const formData = new FormData();
      
      let croppedName = selectedFile?.name || "cropped.jpg";
      if (selectedFile?.name && aspect && aspect !== "free") {
        const dotIndex = selectedFile.name.lastIndexOf(".");
        if (dotIndex !== -1) {
          const name = selectedFile.name.substring(0, dotIndex);
          const ext = selectedFile.name.substring(dotIndex);
          croppedName = `${name}-${aspect}${ext}`;
        } else {
          croppedName = `${selectedFile.name}-${aspect}`;
        }
      }
      formData.append("file", blob, croppedName);
      if (cropTitle) formData.append("title", cropTitle);
      if (description) formData.append("description", description);
      if (cropAltText) formData.append("alt_text", cropAltText);

      const response = await fetch(`${apiUrl}/api/media`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Upload failed");
      }

      const newMedia = await response.json();
      setMediaList((prev) => [newMedia, ...prev]);
      setTotal((prev) => prev + 1);
      setShowCropper(false);
      setSelectedFile(null);
      setCropperImageSrc("");
      setTitle("");
      setDescription("");
      setAltText("");
      setSuccess("Image cropped and uploaded to media library.");
    } catch (err: any) {
      throw new Error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (mediaId: string) => {
    if (!token || !confirm("Delete this media from the library? This is permanent.")) return;
    try {
      await fetchAPI(`/api/media/${mediaId}`, { method: "DELETE", token });
      setMediaList((prev) => prev.filter((m) => m.id !== mediaId));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      alert(err.message || "Failed to delete media");
    }
  };

  const openEditModal = (media: MediaItem) => {
    setEditingMedia(media);
    setEditTitle(media.title || "");
    setEditDescription(media.description || "");
    setEditAltText(media.alt_text || "");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMedia || !token) return;
    setSavingEdit(true);
    try {
      const updated = await fetchAPI(`/api/media/${editingMedia.id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({
          title: editTitle || null,
          description: editDescription || null,
          alt_text: editAltText || null,
        }),
      });
      setMediaList((prev) => prev.map((m) => (m.id === editingMedia.id ? { ...m, ...updated } : m)));
      setEditingMedia(null);
    } catch (err: any) {
      alert(err.message || "Failed to save changes");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCopyLink = (media: MediaItem) => {
    const url = getFullUrl(media);
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(media.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };



  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-[#DCD0C0]/25 pb-6 gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-light font-serif text-[#2C2623]">Media Library</h1>
          <p className="text-xs text-[#6E635F] font-light">
            Centralized file management for portfolio, client galleries, and blog content.
          </p>
        </div>
        <p className="text-[10px] uppercase tracking-wider text-stone-400 font-medium whitespace-nowrap">
          {total} item{total === 1 ? "" : "s"}
        </p>
      </div>

      {/* Upload Form */}
      <div className="bg-white border border-[#DCD0C0]/25 rounded-md p-6 space-y-4">
        <h2 className="text-sm font-serif font-semibold text-[#2C2623]">Upload New File</h2>

        <form onSubmit={handleUpload} className="space-y-4">
          {/* Drop zone */}
          <div className="border-2 border-dashed border-[#DCD0C0]/40 rounded-sm p-8 text-center bg-[#FAF8F5]/50">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/zip,.zip"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setSelectedFile(file);
                if (file && !file.name.endsWith(".zip")) {
                  const reader = new FileReader();
                  reader.onload = () => {
                    setCropperImageSrc(reader.result as string);
                    setShowCropper(true);
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="hidden"
              id="media-file-input"
            />
            <label htmlFor="media-file-input" className="cursor-pointer flex flex-col items-center space-y-2">
              {selectedFile?.name?.endsWith(".zip") ? (
                <FileArchive className="w-7 h-7 text-[#C4A484]" />
              ) : (
                <Upload className="w-7 h-7 text-[#C4A484]" />
              )}
              <span className="text-xs font-medium text-[#2C2623]">
                {selectedFile ? selectedFile.name : "Click to upload or drag and drop"}
              </span>
              <span className="text-[10px] text-[#6E635F]">PNG, JPG, WebP, ZIP — no size limit</span>
            </label>
          </div>

          {/* Metadata fields */}
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

          <button
            type="submit"
            disabled={!selectedFile || uploading}
            className="w-full md:w-auto inline-flex items-center justify-center px-6 py-2.5 bg-[#2C2623] hover:bg-[#352F2C] text-white rounded-sm text-xs uppercase tracking-widest font-semibold transition-all disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : null}
            {uploading ? "Uploading..." : "Upload File"}
          </button>
        </form>

        {success && <p className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-sm px-3 py-2">{success}</p>}
        {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-sm px-3 py-2">{error}</p>}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by title, filename, description…"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full bg-white border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden"
      />

      {/* Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="w-7 h-7 text-[#C4A484] animate-spin" />
          <p className="text-xs text-[#6E635F]">Loading media library…</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {mediaList.map((media) => (
            <div
              key={media.id}
              className="bg-white border border-[#DCD0C0]/25 rounded-md overflow-hidden hover:shadow-sm transition-shadow flex flex-col"
            >
              {/* Thumbnail or zip icon */}
              <div className="relative aspect-square bg-stone-100 flex items-center justify-center">
                {isZip(media) ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileArchive className="w-10 h-10 text-[#C4A484]" />
                    <span className="text-[10px] text-[#6E635F] font-mono">ZIP archive</span>
                  </div>
                ) : (
                  <img
                    src={getMediaPreviewUrl(media)}
                    alt={media.alt_text || media.filename}
                    onClick={() => {
                      const idx = lightboxImages.findIndex((img) => img.id === media.id);
                      if (idx !== -1) setLightboxIndex(idx);
                    }}
                    className="absolute inset-0 w-full h-full object-cover cursor-zoom-in hover:scale-[1.02] transition-transform duration-300"
                  />
                )}
              </div>

              {/* Info & actions */}
              <div className="p-3 space-y-2 flex-1 flex flex-col">
                <p className="text-xs font-medium text-[#2C2623] truncate">
                  {media.title || media.filename}
                </p>
                {media.description && (
                  <p className="text-[10px] text-[#6E635F] line-clamp-2 font-light">{media.description}</p>
                )}

                {/* File URL link */}
                <div className="flex items-center gap-1.5 bg-[#FAF8F5] border border-[#DCD0C0]/30 rounded-sm px-2 py-1 min-w-0">
                  <a
                    href={getFullUrl(media)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] text-[#C4A484] hover:underline truncate flex-1 font-mono"
                    title={getFullUrl(media)}
                  >
                    {media.original_url}
                  </a>
                  <button
                    onClick={() => handleCopyLink(media)}
                    className="shrink-0 text-stone-400 hover:text-[#2C2623] transition-colors cursor-pointer"
                    title="Copy link"
                  >
                    {copiedId === media.id ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                  <a
                    href={getFullUrl(media)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-stone-400 hover:text-[#2C2623] transition-colors"
                    title="Open file"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <p className="text-[10px] text-stone-400">
                  Used in {media.usage_count ?? 0} place{(media.usage_count ?? 0) === 1 ? "" : "s"}
                </p>

                {/* Actions */}
                <div className="flex gap-2 mt-auto pt-2">
                  <button
                    onClick={() => openEditModal(media)}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[#2C2623] border border-[#DCD0C0]/40 rounded-sm hover:bg-[#FAF8F5] text-[10px] uppercase tracking-wider font-semibold transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(media.id)}
                    disabled={(media.usage_count ?? 0) > 0}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-red-600 border border-red-200 rounded-sm hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed text-[10px] uppercase tracking-wider font-semibold transition-colors cursor-pointer"
                    title={(media.usage_count ?? 0) > 0 ? "Cannot delete — in use" : "Delete"}
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
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

      {/* Edit Modal */}
      {editingMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-[#DCD0C0]/35 rounded-md p-6 max-w-lg w-full shadow-lg space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-[#DCD0C0]/20 pb-3">
              <h3 className="text-sm font-serif font-semibold text-[#2C2623]">Edit Media Details</h3>
              <button onClick={() => setEditingMedia(null)} className="text-[#6E635F] hover:text-[#2C2623] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Preview */}
            <div className="flex gap-4 items-start">
              {isZip(editingMedia) ? (
                <div className="w-20 h-20 shrink-0 rounded-sm bg-stone-100 flex items-center justify-center border border-[#DCD0C0]/20">
                  <FileArchive className="w-8 h-8 text-[#C4A484]" />
                </div>
              ) : (
                <img
                  src={getMediaPreviewUrl(editingMedia)}
                  alt={editingMedia.alt_text || editingMedia.filename}
                  className="w-20 h-20 object-cover rounded-sm shrink-0 border border-[#DCD0C0]/20"
                />
              )}
              <div className="space-y-1 text-[10px] text-stone-500 min-w-0">
                <p className="font-mono truncate">{editingMedia.filename}</p>
                {editingMedia.file_size && (
                  <p>{(editingMedia.file_size / 1024).toFixed(1)} KB</p>
                )}
                <a
                  href={getFullUrl(editingMedia)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#C4A484] hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" /> Open file
                </a>
              </div>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-stone-400 font-semibold block">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g. Newborn sleeping pose"
                  className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-stone-400 font-semibold block">Alt Text</label>
                <input
                  type="text"
                  value={editAltText}
                  onChange={(e) => setEditAltText(e.target.value)}
                  placeholder="Describe the image for accessibility"
                  className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-stone-400 font-semibold block">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  placeholder="Optional internal notes about this file"
                  className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden resize-none font-light"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#DCD0C0]/20">
                <button
                  type="button"
                  onClick={() => setEditingMedia(null)}
                  className="px-4 py-2 border border-[#DCD0C0]/40 text-[#6E635F] hover:text-[#2C2623] rounded-sm text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#2C2623] hover:bg-[#352F2C] text-white rounded-sm text-xs uppercase tracking-widest font-semibold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {savingEdit ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Free crop modal for image files */}
      {showCropper && cropperImageSrc && (
        <ImageCropper
          open={showCropper}
          imageSrc={cropperImageSrc}
          onCancel={() => {
            setShowCropper(false);
            setSelectedFile(null);
            setCropperImageSrc("");
          }}
          onConfirm={handleCroppedUpload}
          defaultTitle={selectedFile?.name?.substring(0, selectedFile.name.lastIndexOf(".")) || ""}
          defaultAltText=""
          confirmLabel="Crop & Upload to Library"
        />
      )}

      {/* Lightbox Overlay */}
      {lightboxIndex !== null && lightboxImages.length > 0 && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-xs transition-opacity duration-300">
          {/* Close Lightbox */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 z-50 p-2 text-stone-400 hover:text-white transition-colors cursor-pointer bg-black/20 rounded-full"
            aria-label="Close Lightbox"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Left Arrow */}
          <button
            onClick={() => setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : lightboxImages.length - 1))}
            className="absolute left-6 z-40 p-3 text-stone-450 hover:text-white transition-colors cursor-pointer hover:bg-white/5 rounded-full"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          {/* Image Container */}
          <div className="max-w-[85vw] max-h-[80vh] flex items-center justify-center relative">
            <img
              src={getFullUrl(lightboxImages[lightboxIndex])}
              alt={lightboxImages[lightboxIndex].alt_text || "Lightbox view"}
              className="max-w-full max-h-[80vh] object-contain rounded-xs shadow-2xl animate-fade-in select-none"
            />
          </div>

          {/* Right Arrow */}
          <button
            onClick={() => setLightboxIndex((prev) => (prev !== null && prev < lightboxImages.length - 1 ? prev + 1 : 0))}
            className="absolute right-6 z-40 p-3 text-stone-450 hover:text-white transition-colors cursor-pointer hover:bg-white/5 rounded-full"
            aria-label="Next image"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          {/* Control Panel Below Lightbox */}
          <div className="mt-6 text-center space-y-2 z-40 max-w-lg px-4">
            <h4 className="text-sm font-serif font-light text-white uppercase tracking-wider">
              {lightboxImages[lightboxIndex].title || lightboxImages[lightboxIndex].filename}
            </h4>
            {lightboxImages[lightboxIndex].description && (
              <p className="text-xs text-stone-400 font-light line-clamp-2 leading-relaxed">
                {lightboxImages[lightboxIndex].description}
              </p>
            )}
            <div className="text-[10px] text-stone-500 font-mono pt-1">
              {lightboxIndex + 1} / {lightboxImages.length}
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress Simulation Overlay */}
      <UploadProgressOverlay 
        isActive={uploading} 
        statusText={selectedFile ? `Uploading ${selectedFile.name}...` : "Uploading image..."} 
      />
    </div>
  );
}
