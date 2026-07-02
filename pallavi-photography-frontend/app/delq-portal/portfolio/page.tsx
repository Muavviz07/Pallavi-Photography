"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { fetchAPI } from "@/lib/api";
import { Loader2, Plus, Edit2, Trash2, Check, X, ShieldAlert, Image as ImageIcon, Sliders, ZoomIn, Move } from "lucide-react";

interface GalleryResponse {
  id: string;
  title: string;
  slug: string;
  description?: string;
  category: string;
  status: string;
}

interface ImageResponse {
  id: string;
  original_url: string;
  optimized_url?: string;
  title?: string;
  alt_text?: string;
  description?: string;
  sort_order: number;
  dimensions?: {
    width?: number;
    height?: number;
    aspect?: string;
  };
}

const CATEGORIES = [
  { key: "newborn", label: "Newborn" },
  { key: "children", label: "Children" },
  { key: "family", label: "Family" },
  { key: "maternity", label: "Maternity" },
  { key: "fine_art", label: "Fine Art" },
  { key: "nature", label: "Nature" }
];

export default function PortfolioAdmin() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;

  const [activeCategory, setActiveCategory] = useState("newborn");
  const [gallery, setGallery] = useState<GalleryResponse | null>(null);
  const [images, setImages] = useState<ImageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // Gallery Edit Settings state
  const [editingGallery, setEditingGallery] = useState(false);
  const [galleryTitle, setGalleryTitle] = useState("");
  const [galleryDesc, setGalleryDesc] = useState("");
  const [galleryStatus, setGalleryStatus] = useState("published");
  const [savingGallery, setSavingGallery] = useState(false);

  // Upload & Cropper Modal States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string>("");
  const [cropAspect, setCropAspect] = useState<"square" | "portrait" | "landscape">("square");
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [imageTitle, setImageTitle] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Edit Image Metadata Modal States
  const [showEditImageModal, setShowEditImageModal] = useState(false);
  const [editingImage, setEditingImage] = useState<ImageResponse | null>(null);
  const [editImageTitle, setEditImageTitle] = useState("");
  const [editImageAlt, setEditImageAlt] = useState("");
  const [editImageAspect, setEditImageAspect] = useState<"square" | "portrait" | "landscape">("square");
  const [editImageSort, setEditImageSort] = useState(0);
  const [savingImage, setSavingImage] = useState(false);

  // Mouse Drag Panning Refs
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const previewRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const loadGalleryAndImages = async (categoryKey: string) => {
    if (!token) return;
    setLoading(true);
    setEditingGallery(false);
    try {
      // Fetch galleries by category key (backend handles hyphen replacement)
      const data = await fetchAPI(`/api/galleries?category=${categoryKey}`, { token });
      if (data && data.length > 0) {
        const gal = data[0];
        setGallery(gal);
        setGalleryTitle(gal.title);
        setGalleryDesc(gal.description || "");
        setGalleryStatus(gal.status);
        
        // Fetch images
        const imgs = await fetchAPI(`/api/galleries/${gal.id}/images`, { token });
        setImages(imgs);
      } else {
        // Automatically initialize standard gallery for this category
        const initialTitle = `${categoryKey.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())} Portfolio`;
        const initialSlug = categoryKey.replace("_", "-");
        
        const newGal = await fetchAPI("/api/galleries", {
          method: "POST",
          token,
          body: JSON.stringify({
            title: initialTitle,
            slug: initialSlug,
            description: `Collection of high-resolution professional ${categoryKey.replace("_", " ")} photography.`,
            category: categoryKey,
            status: "published",
            sort_order: 0
          })
        });
        
        setGallery(newGal);
        setGalleryTitle(newGal.title);
        setGalleryDesc(newGal.description || "");
        setGalleryStatus(newGal.status);
        setImages([]);
      }
    } catch (err) {
      console.error("Failed to load portfolio gallery", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadGalleryAndImages(activeCategory);
    }
  }, [activeCategory, token]);

  const handleSaveGallerySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gallery) return;
    setSavingGallery(true);
    try {
      const updated = await fetchAPI(`/api/galleries/${gallery.id}`, {
        method: "PUT",
        token,
        body: JSON.stringify({
          title: galleryTitle,
          description: galleryDesc,
          slug: gallery.slug,
          category: gallery.category,
          status: galleryStatus
        })
      });
      setGallery(updated);
      setEditingGallery(false);
    } catch (err) {
      console.error("Failed to update gallery settings", err);
      alert("Failed to save gallery changes.");
    } finally {
      setSavingGallery(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImageTitle(file.name.substring(0, file.name.lastIndexOf(".")) || file.name);
      setImageAlt(activeCategory.replace("_", " ") + " portfolio photograph");
      setZoom(1);
      setPanX(0);
      setPanY(0);
      setUploadError("");
      
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag Panning Event Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!selectedFile) return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX - panX, y: e.clientY - panY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    setPanX(newX);
    setPanY(newY);
  };

  const handleMouseUpOrLeave = () => {
    isDragging.current = false;
  };

  const handleCropAndUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gallery || !selectedFile || !imgRef.current) return;
    setUploading(true);
    setUploadError("");

    try {
      const sourceImg = imgRef.current;
      
      // Determine canvas aspect crop dimensions
      let cw = 1200;
      let ch = 1200;
      let targetRatio = 1;
      if (cropAspect === "portrait") {
        cw = 1080;
        ch = 1440;
        targetRatio = 0.75;
      } else if (cropAspect === "landscape") {
        cw = 1440;
        ch = 960;
        targetRatio = 1.5;
      }

      const canvas = document.createElement("canvas");
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext("2d");

      if (!ctx) throw new Error("Could not construct 2D context");

      // White fill
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, cw, ch);

      // Compute visual fit matching CSS object-cover
      const imageRatio = sourceImg.naturalWidth / sourceImg.naturalHeight;
      
      let drawWidth = cw;
      let drawHeight = ch;
      if (imageRatio > targetRatio) {
        drawWidth = ch * imageRatio;
      } else {
        drawHeight = cw / imageRatio;
      }

      // Apply zoom
      drawWidth *= zoom;
      drawHeight *= zoom;

      // Map scale offset translation from preview element size to canvas scale
      const previewWidth = previewRef.current?.offsetWidth || 350;
      const scaleFactor = drawWidth / (previewWidth * zoom);
      
      const translateX = panX * scaleFactor;
      const translateY = panY * scaleFactor;

      const x = (cw - drawWidth) / 2 + translateX;
      const y = (ch - drawHeight) / 2 + translateY;

      // Draw onto canvas
      ctx.drawImage(sourceImg, x, y, drawWidth, drawHeight);

      // Extract blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setUploadError("Failed to extract cropped image.");
          setUploading(false);
          return;
        }

        try {
          const formDataPayload = new FormData();
          formDataPayload.append("file", blob, selectedFile.name);
          formDataPayload.append("title", imageTitle);
          formDataPayload.append("alt_text", imageAlt);
          formDataPayload.append("aspect", cropAspect);

          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
          const res = await fetch(`${apiUrl}/api/galleries/${gallery.id}/upload`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`
            },
            body: formDataPayload
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.detail || "Upload request failed.");
          }

          setShowUploadModal(false);
          setSelectedFile(null);
          setImageSrc("");
          
          // Reload images
          loadGalleryAndImages(activeCategory);
        } catch (err: any) {
          setUploadError(err.message || "Failed to upload image.");
        } finally {
          setUploading(false);
        }
      }, "image/jpeg", 0.9);

    } catch (err: any) {
      setUploadError(err.message || "Failed to process crop operations.");
      setUploading(false);
    }
  };

  const handleOpenEditImage = (img: ImageResponse) => {
    setEditingImage(img);
    setEditImageTitle(img.title || "");
    setEditImageAlt(img.alt_text || "");
    setEditImageAspect((img.dimensions?.aspect as any) || "square");
    setEditImageSort(img.sort_order);
    setShowEditImageModal(true);
  };

  const handleSaveImageMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingImage) return;
    setSavingImage(true);
    try {
      const formDataPayload = new FormData();
      formDataPayload.append("title", editImageTitle);
      formDataPayload.append("alt_text", editImageAlt);
      formDataPayload.append("aspect", editImageAspect);
      formDataPayload.append("sort_order", editImageSort.toString());

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/galleries/images/${editingImage.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formDataPayload
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Update failed.");
      }

      setShowEditImageModal(false);
      loadGalleryAndImages(activeCategory);
    } catch (err: any) {
      alert(err.message || "Failed to update image.");
    } finally {
      setSavingImage(false);
    }
  };

  const handleDeleteImage = async (imgId: string) => {
    if (!confirm("Are you sure you want to remove this image from the portfolio? This will delete the files permanently.")) return;
    setUpdatingId(imgId);
    try {
      await fetchAPI(`/api/galleries/images/${imgId}`, {
        method: "DELETE",
        token
      });
      loadGalleryAndImages(activeCategory);
    } catch (err) {
      console.error("Failed to delete image", err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#DCD0C0]/25 pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-light font-serif text-[#2C2623]">
            Portfolio Galleries
          </h1>
          <p className="text-xs text-[#6E635F] font-light">
            Manage public portfolio works for each photography category. Apply cropping layouts for visual consistency.
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedFile(null);
            setImageSrc("");
            setImageTitle("");
            setImageAlt("");
            setShowUploadModal(true);
          }}
          disabled={!gallery}
          className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest text-[#FCFAF7] bg-[#2C2623] hover:bg-[#352F2C] px-4 py-2.5 rounded-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Image</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#DCD0C0]/20 gap-2 text-xs tracking-wider font-light text-stone-500 uppercase overflow-x-auto pb-px">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-4 py-3 border-b-2 transition-all font-medium whitespace-nowrap cursor-pointer ${
              activeCategory === cat.key
                ? "border-[#C4A484] text-[#2C2623] font-semibold"
                : "border-transparent hover:text-[#2C2623]"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="w-8 h-8 text-[#C4A484] animate-spin" />
          <p className="text-xs text-[#6E635F] font-light">Loading category data...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Gallery Info Panel */}
          {gallery && (
            <div className="bg-[#FAF8F5] border border-[#DCD0C0]/25 rounded-md p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#DCD0C0]/15 pb-3">
                <span className="text-[10px] uppercase font-mono tracking-widest text-[#C4A484]">
                  Active Configuration
                </span>
                <button
                  onClick={() => setEditingGallery(!editingGallery)}
                  className="text-xs text-[#C4A484] hover:text-[#2C2623] font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{editingGallery ? "Cancel" : "Edit Metadata"}</span>
                </button>
              </div>

              {editingGallery ? (
                <form onSubmit={handleSaveGallerySettings} className="space-y-4 text-xs max-w-xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider text-stone-500 block font-medium">Gallery Title</label>
                      <input
                        type="text"
                        required
                        value={galleryTitle}
                        onChange={(e) => setGalleryTitle(e.target.value)}
                        className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3.5 py-2 text-xs outline-hidden"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider text-stone-500 block font-medium">Publication Status</label>
                      <select
                        value={galleryStatus}
                        onChange={(e) => setGalleryStatus(e.target.value)}
                        className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3.5 py-2 text-xs outline-hidden"
                      >
                        <option value="published">Published (Public)</option>
                        <option value="draft">Draft (Hidden)</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-stone-500 block font-medium">Description</label>
                    <textarea
                      value={galleryDesc}
                      onChange={(e) => setGalleryDesc(e.target.value)}
                      rows={2}
                      className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3.5 py-2 text-xs outline-hidden resize-none font-light"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingGallery}
                    className="inline-flex items-center justify-center bg-[#2C2623] hover:bg-[#352F2C] text-white text-[10px] uppercase tracking-widest px-4 py-2 rounded-sm font-semibold transition-all disabled:opacity-50"
                  >
                    {savingGallery && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                    Save Changes
                  </button>
                </form>
              ) : (
                <div className="space-y-2">
                  <h3 className="text-lg font-serif font-light text-[#2C2623]">{gallery.title}</h3>
                  <p className="text-stone-500 font-light text-xs max-w-3xl leading-relaxed">{gallery.description || "No description set."}</p>
                  <div className="pt-2 flex items-center gap-4 text-[10px] text-stone-400 font-medium">
                    <span>Slug: <strong className="font-mono">/our-gallery/{gallery.slug}</strong></span>
                    <span>•</span>
                    <span>Status: <strong className="uppercase text-[#C4A484]">{gallery.status}</strong></span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Images List */}
          {images.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-[#DCD0C0]/35 rounded-md bg-white">
              <ImageIcon className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p className="text-xs text-[#6E635F] font-light">No images uploaded to this portfolio yet.</p>
            </div>
          ) : (
            <div className="bg-white border border-[#DCD0C0]/25 rounded-md overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs font-light text-[#6E635F] border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b border-[#DCD0C0]/20 text-[#2C2623] font-semibold uppercase tracking-wider text-[9px]">
                    <th className="p-4">Frame Preview</th>
                    <th className="p-4">Title & Alt Text</th>
                    <th className="p-4">Layout Aspect</th>
                    <th className="p-4 text-center">Order</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {images.map((img) => {
                    const aspect = img.dimensions?.aspect || "square";
                    const isDeleting = updatingId === img.id;
                    return (
                      <tr key={img.id} className="border-b border-[#DCD0C0]/15 hover:bg-[#FAF8F5]/30 transition-colors">
                        <td className="p-4 w-28">
                          <div className="w-16 h-16 rounded-sm overflow-hidden bg-stone-100 border border-stone-200/50 flex items-center justify-center">
                            <img
                              src={img.optimized_url || img.original_url}
                              alt={img.alt_text || ""}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </td>
                        <td className="p-4 space-y-1">
                          <p className="font-semibold text-[#2C2623]">{img.title || "Untitled"}</p>
                          <p className="text-[10px] text-stone-400 italic max-w-sm overflow-hidden text-ellipsis whitespace-nowrap">{img.alt_text || "No description set"}</p>
                        </td>
                        <td className="p-4">
                          <span className="inline-block px-2.5 py-0.5 rounded-sm text-[9px] font-semibold uppercase tracking-wider bg-stone-50 border border-stone-200/50 text-[#6E635F]">
                            {aspect}
                          </span>
                        </td>
                        <td className="p-4 text-center font-mono text-[10px]">{img.sort_order}</td>
                        <td className="p-4 text-right space-x-2">
                          {isDeleting ? (
                            <Loader2 className="w-4 h-4 animate-spin text-stone-400 ml-auto" />
                          ) : (
                            <>
                              <button
                                onClick={() => handleOpenEditImage(img)}
                                className="p-1 text-stone-400 hover:text-[#2C2623] transition-colors cursor-pointer"
                                title="Edit Metadata"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteImage(img.id)}
                                className="p-1 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                                title="Delete Image"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CROPPER / UPLOADER MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white border border-[#DCD0C0]/35 rounded-md p-6 max-w-xl w-full shadow-lg space-y-6 animate-scale-in my-8">
            <div className="flex items-center justify-between border-b border-[#DCD0C0]/20 pb-3">
              <h3 className="text-sm font-serif font-semibold text-[#2C2623] uppercase tracking-wider">
                Upload & Crop Image
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-[#6E635F] hover:text-[#2C2623]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCropAndUpload} className="space-y-5 text-xs">
              {/* File input selector */}
              {!selectedFile ? (
                <div className="border border-dashed border-[#DCD0C0] rounded-sm p-12 text-center bg-[#FAF8F5] hover:bg-white transition-all">
                  <ImageIcon className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                  <label htmlFor="portfolio-file" className="cursor-pointer font-semibold text-[#C4A484] hover:underline uppercase tracking-widest text-[10px] block">
                    Choose Image File
                  </label>
                  <input
                    type="file"
                    id="portfolio-file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <p className="text-[10px] text-stone-400 font-light mt-1">High resolution JPEGs, PNGs, or WebPs supported.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Left Side: Drag Panner and Crop box */}
                  <div className="md:col-span-7 flex flex-col items-center space-y-4">
                    <span className="text-[9px] uppercase tracking-wider font-semibold text-stone-400 block self-start">
                      Crop Frame & Alignment (Drag to Pan)
                    </span>
                    
                    {/* Aspect Crop Box Element */}
                    <div
                      ref={previewRef}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUpOrLeave}
                      onMouseLeave={handleMouseUpOrLeave}
                      className={`relative w-full max-w-[320px] bg-stone-100 border border-stone-200 overflow-hidden cursor-move select-none ${
                        cropAspect === "portrait" ? "aspect-[3/4]" : cropAspect === "landscape" ? "aspect-[3/2]" : "aspect-square"
                      }`}
                    >
                      {imageSrc && (
                        <img
                          ref={imgRef}
                          src={imageSrc}
                          alt="Crop Source"
                          draggable={false}
                          style={{
                            transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
                            transformOrigin: "center center",
                          }}
                          className="w-full h-full object-cover pointer-events-none"
                        />
                      )}
                      
                      {/* Grid lines overlay for aesthetic */}
                      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-20 border border-[#2C2623]/30">
                        <div className="border-r border-b border-[#2C2623]/30" />
                        <div className="border-r border-b border-[#2C2623]/30" />
                        <div className="border-b border-[#2C2623]/30" />
                        <div className="border-r border-b border-[#2C2623]/30" />
                        <div className="border-r border-b border-[#2C2623]/30" />
                        <div className="border-b border-[#2C2623]/30" />
                        <div className="border-r border-[#2C2623]/30" />
                        <div className="border-r border-[#2C2623]/30" />
                        <div />
                      </div>
                    </div>

                    {/* Scale slider */}
                    <div className="w-full max-w-[320px] space-y-1 pt-2">
                      <div className="flex items-center justify-between text-[10px] text-stone-500">
                        <span className="flex items-center gap-1"><Sliders className="w-3.5 h-3.5" /> Scale Zoom</span>
                        <span>{Math.round(zoom * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="3"
                        step="0.05"
                        value={zoom}
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                        className="w-full accent-[#C4A484]"
                      />
                    </div>
                  </div>

                  {/* Right Side Settings */}
                  <div className="md:col-span-5 space-y-4">
                    {/* Dimension Selection */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] uppercase text-stone-400 font-semibold">Aspect Crop Ratio</label>
                      <div className="grid grid-cols-3 gap-1">
                        {(["square", "portrait", "landscape"] as const).map((ratio) => (
                          <button
                            key={ratio}
                            type="button"
                            onClick={() => {
                              setCropAspect(ratio);
                              setPanX(0);
                              setPanY(0);
                            }}
                            className={`py-1.5 border text-[9px] uppercase tracking-wider font-semibold text-center rounded-sm transition-all cursor-pointer ${
                              cropAspect === ratio
                                ? "bg-[#2C2623] text-white border-[#2C2623]"
                                : "bg-[#FAF8F5] text-stone-500 hover:border-[#C4A484]/40"
                            }`}
                          >
                            {ratio}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase text-stone-400 font-semibold">Image Title</label>
                      <input
                        type="text"
                        required
                        value={imageTitle}
                        onChange={(e) => setImageTitle(e.target.value)}
                        className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] uppercase text-stone-400 font-semibold">Alt / Caption description</label>
                      <textarea
                        value={imageAlt}
                        onChange={(e) => setImageAlt(e.target.value)}
                        rows={2}
                        className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden resize-none font-light"
                      />
                    </div>
                  </div>
                </div>
              )}

              {uploadError && (
                <p className="text-[10px] text-red-600 font-light bg-red-50 p-2 rounded-sm border border-red-100 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>{uploadError}</span>
                </p>
              )}

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#DCD0C0]/25">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-[#DCD0C0]/40 text-[#6E635F] hover:text-[#2C2623] rounded-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="inline-flex items-center justify-center bg-[#2C2623] hover:bg-[#352F2C] text-[#FCFAF7] px-5 py-2 rounded-sm font-semibold transition-all disabled:opacity-50 min-w-[80px]"
                >
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Crop & Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT IMAGE METADATA MODAL */}
      {showEditImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#DCD0C0]/35 rounded-md p-6 max-w-md w-full shadow-lg space-y-6 animate-scale-in">
            <div className="flex items-center justify-between border-b border-[#DCD0C0]/20 pb-3">
              <h3 className="text-sm font-serif font-semibold text-[#2C2623] uppercase tracking-wider">
                Edit Image Details
              </h3>
              <button
                onClick={() => setShowEditImageModal(false)}
                className="text-[#6E635F] hover:text-[#2C2623]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveImageMetadata} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-[10px] uppercase text-stone-400 font-semibold">Image Title</label>
                <input
                  type="text"
                  required
                  value={editImageTitle}
                  onChange={(e) => setEditImageTitle(e.target.value)}
                  className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase text-stone-400 font-semibold">Alt description</label>
                <input
                  type="text"
                  value={editImageAlt}
                  onChange={(e) => setEditImageAlt(e.target.value)}
                  className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase text-stone-400 font-semibold">Aspect Crop</label>
                  <select
                    value={editImageAspect}
                    onChange={(e) => setEditImageAspect(e.target.value as any)}
                    className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden"
                  >
                    <option value="square">Square</option>
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase text-stone-400 font-semibold">Sort Order</label>
                  <input
                    type="number"
                    value={editImageSort}
                    onChange={(e) => setEditImageSort(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#DCD0C0]/25">
                <button
                  type="button"
                  onClick={() => setShowEditImageModal(false)}
                  className="px-4 py-2 border border-[#DCD0C0]/40 text-[#6E635F] hover:text-[#2C2623] rounded-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingImage}
                  className="inline-flex items-center justify-center bg-[#2C2623] hover:bg-[#352F2C] text-[#FCFAF7] px-5 py-2 rounded-sm font-semibold transition-all disabled:opacity-50 min-w-[80px]"
                >
                  {savingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
