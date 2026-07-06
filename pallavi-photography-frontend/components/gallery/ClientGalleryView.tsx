"use client";

import { useState, useEffect } from "react";
import { Check, Download, Package, Send, CheckSquare, Square, ChevronLeft, ChevronRight, X, Lock } from "lucide-react";
import Image from "next/image";
import ImageUpload from "@/components/gallery/ImageUpload";

interface ImageItem {
  image_id: string;
  selected: boolean;
  image: {
    id: string;
    title: string;
    alt_text: string;
    original_url: string;
    optimized_url: string;
    thumbnail_url: string;
  };
}

interface ClientGalleryViewProps {
  slug: string;
  token: string;
  meta: {
    id: string;
    title: string;
    description: string;
    can_view: boolean;
    can_upload: boolean;
    can_download: boolean;
    can_download_zip: boolean;
    can_submit_selections: boolean;
    selections_submitted: boolean;
    selections_submitted_at: string | null;
    download_zip_url?: string | null;
  };
}

export default function ClientGalleryView({ slug, token, meta: initialMeta }: ClientGalleryViewProps) {
  const [meta, setMeta] = useState(initialMeta);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [zipBundling, setZipBundling] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchImages = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/client-galleries/${slug}/images`, {
        headers: {
          "X-Gallery-Token": token,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setImages(data);
      }
    } catch (err) {
      console.error("Failed to load images:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [slug, token]);

  const toggleSelection = async (imageId: string, currentSelected: boolean) => {
    if (meta.selections_submitted || !meta.can_submit_selections) return;

    // Optimistic UI update
    setImages((prev) =>
      prev.map((item) =>
        item.image_id === imageId ? { ...item, selected: !currentSelected } : item
      )
    );

    try {
      const res = await fetch(`${apiUrl}/api/client-galleries/${slug}/images/${imageId}/select`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Gallery-Token": token,
        },
        body: JSON.stringify({ selected: !currentSelected }),
      });
      if (!res.ok) {
        // Rollback on failure
        fetchImages();
      }
    } catch (err) {
      console.error("Failed to save selection:", err);
      fetchImages();
    }
  };

  const handleSelectAll = async (select: boolean) => {
    if (meta.selections_submitted || !meta.can_submit_selections) return;
    
    // Batch update selections locally first
    setImages((prev) => prev.map((item) => ({ ...item, selected: select })));

    // Send selection state to backend sequentially or let it handle (in production a batch API is ideal, but for now we toggle each)
    for (const img of images) {
      if (img.selected !== select) {
        try {
          await fetch(`${apiUrl}/api/client-galleries/${slug}/images/${img.image_id}/select`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Gallery-Token": token,
            },
            body: JSON.stringify({ selected: select }),
          });
        } catch (err) {
          console.error(err);
        }
      }
    }
    fetchImages();
  };

  const handleSubmitSelections = async () => {
    if (meta.selections_submitted || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/api/client-galleries/${slug}/submit-selections`, {
        method: "POST",
        headers: {
          "X-Gallery-Token": token,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setMeta((prev) => ({
          ...prev,
          selections_submitted: true,
          selections_submitted_at: data.submitted_at,
        }));
        setSubmitSuccess(true);
      } else {
        alert("Failed to submit selections. Please contact support.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error occurred during submission.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename || "download.jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
      // Fallback: Open in new tab
      window.open(url, "_blank");
    }
  };

  const handleDownloadZip = () => {
    if (zipBundling) return;
    setZipBundling(true);
    setZipProgress(10);

    const interval = setInterval(() => {
      setZipProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setZipBundling(false);
          
          // Trigger download checklist mock TXT as file representing zipped assets
          const selectedImages = images.filter((img) => img.selected);
          const txtContent = `Pallavi Photography Gallery ZIP Bundle\nGallery: ${meta.title}\nDate: ${new Date().toLocaleDateString()}\n\nDownloaded Items:\n` + 
            selectedImages.map((img, idx) => `${idx + 1}. ${img.image.title} (${img.image.optimized_url})`).join("\n");
          
          const blob = new Blob([txtContent], { type: "text/plain" });
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = `${slug}_selected_proofs.txt`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);

          return 0;
        }
        return prev + 15;
      });
    }, 400);
  };

  const selectedImages = images.filter((img) => img.selected);
  const selectedCount = selectedImages.length;

  // Key listeners for Lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") setLightboxIndex((prev) => (prev !== null && prev < images.length - 1 ? prev + 1 : 0));
      if (e.key === "ArrowLeft") setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : images.length - 1));
      if (e.key === " ") {
        e.preventDefault();
        const currentImg = images[lightboxIndex];
        if (currentImg && meta.can_submit_selections && !meta.selections_submitted) {
          toggleSelection(currentImg.image_id, currentImg.selected);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, images, meta]);

  return (
    <div className="bg-[#FCFAF7] min-h-screen">
      {/* Editorial Header */}
      <div className="max-w-7xl mx-auto px-6 pt-32 pb-12">
        <div className="border-b border-[#DCD0C0]/30 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <span className="text-[10px] uppercase tracking-[0.35em] text-[#C4A484] font-semibold block">
              Private Proofs
            </span>
            <h1 className="text-3xl sm:text-5xl font-light tracking-wide font-serif text-[#2C2623] uppercase">
              {meta.title}
            </h1>
            <p className="text-xs sm:text-sm text-[#6E635F] font-light max-w-xl leading-relaxed">
              {meta.description || "Review your photo session proofs, select your favorite frames, and submit them for final touch-up edits."}
            </p>
          </div>

          {/* Action Tools Panel */}
          <div className="flex flex-wrap items-center gap-3">
            {meta.can_submit_selections && !meta.selections_submitted && (
              <>
                <button
                  onClick={() => handleSelectAll(true)}
                  className="inline-flex items-center space-x-1.5 text-xs text-[#6E635F] hover:text-[#2C2623] border border-[#DCD0C0]/50 px-3.5 py-2.5 rounded-sm bg-[#FCFAF7] cursor-pointer"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Select All</span>
                </button>
                <button
                  onClick={() => handleSelectAll(false)}
                  className="inline-flex items-center space-x-1.5 text-xs text-[#6E635F] hover:text-[#2C2623] border border-[#DCD0C0]/50 px-3.5 py-2.5 rounded-sm bg-[#FCFAF7] cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              </>
            )}

            {meta.can_download_zip && selectedCount > 0 && (
              <button
                onClick={handleDownloadZip}
                disabled={zipBundling}
                className="inline-flex items-center space-x-1.5 text-xs text-[#2C2623] hover:text-white hover:bg-[#2C2623] border border-[#2C2623] px-4 py-2.5 rounded-sm transition-all duration-300 cursor-pointer disabled:opacity-50"
              >
                {zipBundling ? (
                  <>
                    <div className="w-3 h-3 border-2 border-stone-450 border-t-transparent rounded-full animate-spin" />
                    <span>Zipping ({zipProgress}%)</span>
                  </>
                ) : (
                  <>
                    <Package className="w-3.5 h-3.5" />
                    <span>Download ZIP ({selectedCount})</span>
                  </>
                )}
              </button>
            )}

            {meta.download_zip_url && (
              <a
                href={meta.download_zip_url.startsWith("/static/") ? `${apiUrl}${meta.download_zip_url}` : meta.download_zip_url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 text-xs text-white bg-[#C4A484] hover:bg-[#B39373] px-4 py-2.5 rounded-sm transition-all duration-300 cursor-pointer font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download ZIP Bundle</span>
              </a>
            )}

            {meta.can_submit_selections && (
              <button
                onClick={handleSubmitSelections}
                disabled={selectedCount === 0 || meta.selections_submitted || submitting}
                className="inline-flex items-center space-x-1.5 text-xs uppercase tracking-widest text-[#FCFAF7] bg-[#2C2623] hover:bg-[#352F2C] border border-[#2C2623] px-5 py-2.5 rounded-sm transition-all duration-300 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {meta.selections_submitted ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Finalized</span>
                  </>
                ) : submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-stone-200 border-t-transparent rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Choice ({selectedCount})</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {meta.selections_submitted && (
          <div className="mt-4 bg-[#F5EFEB] border-l-3 border-[#C4A484] p-4 text-xs text-[#6E635F]">
            ✓ Your photo selection checklist has been finalized and submitted. Admin has been notified. Locked on{" "}
            {new Date(meta.selections_submitted_at || "").toLocaleString()}.
          </div>
        )}
      </div>

      {/* Upload Zone (if enabled) */}
      {meta.can_upload && !meta.selections_submitted && (
        <div className="max-w-7xl mx-auto px-6 pb-8">
          <ImageUpload slug={slug} token={token} onUploadSuccess={fetchImages} />
        </div>
      )}

      {/* Proofs Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-8 h-8 border-2 border-[#C4A484] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs uppercase tracking-wider text-[#6E635F] font-light">Loading Proofs...</p>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-20 bg-[#FAF8F5] border border-[#DCD0C0]/20 rounded-sm">
            <p className="text-sm font-light text-[#6E635F]">This private gallery currently contains no photos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {images.map((item, idx) => {
              const { image_id, selected, image } = item;
              return (
                <div
                  key={image_id}
                  className={`relative rounded-xs overflow-hidden bg-stone-150 border transition-all duration-300 flex flex-col group ${
                    selected ? "border-[#C4A484] shadow-xs" : "border-[#DCD0C0]/20 hover:border-[#C4A484]/40"
                  }`}
                >
                  {/* Image Frame */}
                  <div
                    className="relative aspect-square w-full overflow-hidden bg-stone-200 group/image cursor-pointer"
                  >
                    <img
                      onClick={() => setLightboxIndex(idx)}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        toggleSelection(image_id, selected);
                      }}
                      src={image.thumbnail_url || image.optimized_url}
                      alt={image.alt_text}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                      loading="lazy"
                      title="Click to view full, Double-click to select/deselect"
                    />
                    
                    {/* Floating check button directly on image card - permanently visible for ease of use on mobile */}
                    {meta.can_submit_selections && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelection(image_id, selected);
                        }}
                        disabled={meta.selections_submitted}
                        className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-350 shadow-md z-10 ${
                          selected
                            ? "bg-[#C4A484] border-[#C4A484] text-white opacity-100 scale-100"
                            : "border-stone-300 bg-white/90 text-stone-600 opacity-85 hover:opacity-100 hover:bg-white hover:text-[#C4A484] hover:scale-105"
                        } disabled:opacity-40`}
                        title={selected ? "Deselect image" : "Select image"}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Info and Selection Toggles */}
                  <div className="p-4 bg-[#FAF8F5] flex items-center justify-between border-t border-[#DCD0C0]/25">
                    <div className="space-y-0.5 truncate pr-2">
                      <span className="text-[10px] text-stone-500 font-light truncate block">
                        {image.title}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Individual Download Icon */}
                      {meta.can_download && (
                        <button
                          onClick={() => handleDownloadImage(image.optimized_url || image.original_url, `${image.title || 'proof'}.webp`)}
                          className="w-7 h-7 rounded-full border border-stone-200 text-[#6E635F] hover:text-[#2C2623] hover:border-[#2C2623] bg-white flex items-center justify-center transition-colors cursor-pointer"
                          title="Download high-res WebP"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Selection Checkbox */}
                      {meta.can_submit_selections && (
                        <button
                          onClick={() => toggleSelection(image_id, selected)}
                          disabled={meta.selections_submitted}
                          className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                            selected
                              ? "bg-[#C4A484] border-[#C4A484] text-white"
                              : "border-stone-300 bg-white text-transparent hover:border-[#C4A484]"
                          } disabled:opacity-40`}
                          title={selected ? "Selected" : "Select image"}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selection Submission Toast */}
      {submitSuccess && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-[#2C2623] text-white p-5 shadow-lg border border-[#C4A484]/30 rounded-md flex items-start space-x-3.5 animate-fade-in">
          <div className="w-5 h-5 rounded-full bg-[#C4A484] text-white flex items-center justify-center mt-0.5 shrink-0">
            <Check className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#C4A484]">Submission Complete</h4>
            <p className="text-[11px] text-stone-300 font-light mt-1">
              Your choices were recorded. We'll start processing these frames shortly and email you when final edits are ready!
            </p>
            <button
              onClick={() => setSubmitSuccess(false)}
              className="text-[9px] uppercase tracking-wider text-stone-400 hover:text-white font-medium block pt-3 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Lightbox Overlay */}
      {lightboxIndex !== null && images.length > 0 && (
        <div className="fixed inset-0 z-[100] bg-[#2C2623]/95 backdrop-blur-md flex items-center justify-center transition-all duration-300">
          {/* Close Lightbox */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 text-stone-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close Lightbox"
          >
            <X className="w-7 h-7" />
          </button>

          {/* Left Navigation */}
          <button
            onClick={() => setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : images.length - 1))}
            className="absolute left-4 sm:left-8 text-stone-400 hover:text-white transition-colors bg-black/20 p-2.5 rounded-full cursor-pointer"
            aria-label="Prev Image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Core Image Frame */}
          <div className="max-w-[90vw] max-h-[80vh] flex flex-col items-center justify-center">
            <img
              src={images[lightboxIndex].image.optimized_url || images[lightboxIndex].image.original_url}
              alt={images[lightboxIndex].image.alt_text}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (meta.can_submit_selections && !meta.selections_submitted) {
                  toggleSelection(images[lightboxIndex].image_id, images[lightboxIndex].selected);
                }
              }}
              className="max-w-full max-h-[72vh] object-contain shadow-2xl animate-fade-in cursor-pointer"
              title="Double-click to select/deselect frame"
            />
            {meta.can_submit_selections && !meta.selections_submitted && (
              <span className="text-[9px] text-stone-400 mt-1 font-light tracking-wide uppercase">
                Tip: Double-click / double-tap image to select/deselect
              </span>
            )}
            
            {/* Control Panel Below Lightbox */}
            <div className="mt-4 text-center space-y-2">
              <h4 className="text-sm font-serif font-light text-white tracking-wider">
                {images[lightboxIndex].image.title}
              </h4>
              <div className="flex items-center justify-center space-x-4 pt-1">
                {/* Selection Toggle in Lightbox */}
                {meta.can_submit_selections && (
                  <button
                    onClick={() => toggleSelection(images[lightboxIndex].image_id, images[lightboxIndex].selected)}
                    disabled={meta.selections_submitted}
                    className={`inline-flex items-center space-x-1.5 text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-sm border cursor-pointer ${
                      images[lightboxIndex].selected
                        ? "bg-[#C4A484] border-[#C4A484] text-white"
                        : "border-stone-500 text-stone-300 hover:border-white hover:text-white"
                    } disabled:opacity-50`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{images[lightboxIndex].selected ? "Selected" : "Select Frame"}</span>
                  </button>
                )}

                {/* Individual Download inside Lightbox */}
                {meta.can_download && (
                  <button
                    onClick={() => handleDownloadImage(images[lightboxIndex].image.optimized_url || images[lightboxIndex].image.original_url, `${images[lightboxIndex].image.title || 'proof'}.webp`)}
                    className="inline-flex items-center space-x-1.5 text-[10px] uppercase tracking-widest border border-stone-500 text-stone-300 hover:border-white hover:text-white px-3 py-1.5 rounded-sm cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                )}
              </div>
              <span className="inline-block text-[9px] text-stone-500 font-light">
                {lightboxIndex + 1} / {images.length}
              </span>
            </div>
          </div>

          {/* Right Navigation */}
          <button
            onClick={() => setLightboxIndex((prev) => (prev !== null && prev < images.length - 1 ? prev + 1 : 0))}
            className="absolute right-4 sm:right-8 text-stone-400 hover:text-white transition-colors bg-black/20 p-2.5 rounded-full cursor-pointer"
            aria-label="Next Image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}
