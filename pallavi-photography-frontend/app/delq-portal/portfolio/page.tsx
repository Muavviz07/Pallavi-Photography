"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { fetchAPI } from "@/lib/api";
import { Loader2, Plus, Edit2, Trash2, Check, X, ShieldAlert, Image as ImageIcon, Library, Crop } from "lucide-react";
import MediaPicker from "@/components/media/MediaPicker";
import ImageCropper from "@/components/cropper/ImageCropper";
import { MediaItem } from "@/lib/media";
import UploadProgressOverlay from "@/components/media/UploadProgressOverlay";

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
  const [showCropper, setShowCropper] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Media library picker
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [addingFromLibrary, setAddingFromLibrary] = useState(false);
  // Crop-from-library state
  const [libraryMedia, setLibraryMedia] = useState<MediaItem | null>(null);
  const [showLibraryCropper, setShowLibraryCropper] = useState(false);
  const [libraryCropperSrc, setLibraryCropperSrc] = useState("");
  const [uploadStatusText, setUploadStatusText] = useState("");
  const [pickerMultiSelect, setPickerMultiSelect] = useState(false);
  const [croppingExistingImage, setCroppingExistingImage] = useState<ImageResponse | null>(null);

  // Edit Image Metadata Modal States
  const [showEditImageModal, setShowEditImageModal] = useState(false);
  const [editingImage, setEditingImage] = useState<ImageResponse | null>(null);
  const [editImageTitle, setEditImageTitle] = useState("");
  const [editImageAlt, setEditImageAlt] = useState("");
  const [editImageAspect, setEditImageAspect] = useState<"square" | "portrait" | "landscape">("square");
  const [editImageSort, setEditImageSort] = useState(0);
  const [savingImage, setSavingImage] = useState(false);

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
        setGalleryTitle(gal.title || "");
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
      setUploadError("");
      
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setShowUploadModal(false);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropAndUpload = async (blob: Blob, title: string, altText: string) => {
    if (!gallery || !selectedFile) return;
    setUploading(true);
    setUploadStatusText("Cropping and uploading image...");
    setUploadError("");

    try {
      const formDataPayload = new FormData();
      formDataPayload.append("file", blob, selectedFile.name);
      formDataPayload.append("title", title);
      formDataPayload.append("alt_text", altText);

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

      setShowCropper(false);
      setSelectedFile(null);
      setImageSrc("");
      
      loadGalleryAndImages(activeCategory);
    } catch (err: any) {
      throw new Error(err.message || "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleCropConfirm = async (blob: Blob, title: string, altText: string) => {
    if (croppingExistingImage) {
      await handleConfirmCropExistingImage(blob, title, altText);
    } else {
      await handleCropAndUpload(blob, title, altText);
    }
  };

  const handleConfirmCropExistingImage = async (blob: Blob, title: string, altText: string) => {
    if (!gallery || !token || !croppingExistingImage) return;
    setAddingFromLibrary(true);
    setUploadStatusText("Cropping image in place...");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      // 1. Upload cropped file as a new image in the gallery
      const dataPayload = new FormData();
      dataPayload.append("file", blob, `${croppingExistingImage.id}_cropped.jpg`);
      dataPayload.append("title", title || croppingExistingImage.title || "Cropped Portfolio Work");
      dataPayload.append("alt_text", altText || croppingExistingImage.alt_text || "Cropped portfolio image");

      const uploadRes = await fetch(`${apiUrl}/api/galleries/${gallery.id}/upload`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: dataPayload,
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to upload cropped image.");
      }

      // 2. Remove the old image link from this gallery
      await fetch(`${apiUrl}/api/galleries/images/${croppingExistingImage.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      setShowCropper(false);
      setImageSrc("");
      setCroppingExistingImage(null);
      loadGalleryAndImages(activeCategory);
    } catch (err: any) {
      alert(err.message || "Failed to crop existing image.");
    } finally {
      setAddingFromLibrary(false);
      setUploadStatusText("");
    }
  };

  const handleCropExistingImage = (img: ImageResponse) => {
    setCroppingExistingImage(img);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const src = img.optimized_url || img.original_url || "";
    const fullSrc = src.startsWith("http") ? src : `${apiUrl}${src}`;
    setImageSrc(fullSrc);
    setShowCropper(true);
  };

  const handleOpenEditImage = (img: ImageResponse) => {
    setEditingImage(img);
    setEditImageTitle(img.title || "");
    setEditImageAlt(img.alt_text || "");
    setEditImageAspect((img.dimensions?.aspect as any) || "square");
    setEditImageSort(img.sort_order ?? 0);
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

  const handleAddFromLibrary = (media: MediaItem) => {
    // Instead of adding directly, open the cropper first
    setLibraryMedia(media);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const src = media.optimized_url || media.original_url || "";
    // Build absolute URL if relative
    const fullSrc = src.startsWith("http") ? src : `${apiUrl}${src}`;
    setLibraryCropperSrc(fullSrc);
    setShowMediaPicker(false);
    setShowLibraryCropper(true);
  };

  const handleBulkAddFromLibrary = async (mediaItems: MediaItem[]) => {
    if (!gallery || !token || mediaItems.length === 0) return;
    setShowMediaPicker(false);
    setAddingFromLibrary(true);
    setUploadStatusText(`Adding 1/${mediaItems.length} images...`);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      for (let i = 0; i < mediaItems.length; i++) {
        const media = mediaItems[i];
        setUploadStatusText(`Linking image ${i + 1}/${mediaItems.length}: ${media.title || media.filename}...`);
        const res = await fetch(
          `${apiUrl}/api/galleries/${gallery.id}/images`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ image_id: media.id }),
          }
        );
        if (!res.ok) {
          console.error(`Failed to link image ${media.id}`);
        }
      }
      loadGalleryAndImages(activeCategory);
    } catch (err: any) {
      alert(err.message || "Failed to add images in bulk.");
    } finally {
      setAddingFromLibrary(false);
      setUploadStatusText("");
    }
  };

  const handleLibraryCropConfirm = async (blob: Blob, title: string, altText: string) => {
    if (!gallery || !token || !libraryMedia) return;
    setAddingFromLibrary(true);
    setUploadStatusText("Uploading cropped image...");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const formDataPayload = new FormData();
      formDataPayload.append("file", blob, `${libraryMedia.id}_cropped.jpg`);
      formDataPayload.append("title", title);
      formDataPayload.append("alt_text", altText);

      const res = await fetch(`${apiUrl}/api/galleries/${gallery.id}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formDataPayload,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Upload failed.");
      }

      setShowLibraryCropper(false);
      setLibraryMedia(null);
      setLibraryCropperSrc("");
      loadGalleryAndImages(activeCategory);
    } catch (err: any) {
      throw new Error(err.message || "Failed to add image from library.");
    } finally {
      setAddingFromLibrary(false);
    }
  };

  /** Called when user picks a library image with NO crop changes — link the existing image directly. */
  const handleUseOriginalFromLibrary = async () => {
    if (!gallery || !token || !libraryMedia) return;
    setAddingFromLibrary(true);
    setUploadStatusText("Linking original library image...");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/galleries/${gallery.id}/images`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ image_id: libraryMedia.id }),
        }
      );
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to add image.");
      }
      setShowLibraryCropper(false);
      setLibraryMedia(null);
      setLibraryCropperSrc("");
      loadGalleryAndImages(activeCategory);
    } catch (err: any) {
      alert(err.message || "Failed to add image from library.");
    } finally {
      setAddingFromLibrary(false);
    }
  };

  const handleDeleteImage = async (imgId: string) => {
    if (!confirm("Remove this image from the portfolio gallery? The file will remain in the media library.")) return;
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setPickerMultiSelect(false);
              setShowMediaPicker(true);
            }}
            disabled={!gallery || addingFromLibrary}
            className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest text-[#2C2623] border border-[#2C2623] hover:bg-[#2C2623] hover:text-white px-4 py-2.5 rounded-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            <Library className="w-4 h-4" />
            <span>From Library</span>
          </button>
          <button
            onClick={() => {
              setPickerMultiSelect(true);
              setShowMediaPicker(true);
            }}
            disabled={!gallery || addingFromLibrary}
            className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest text-[#2C2623] border border-[#2C2623] hover:bg-[#2C2623] hover:text-white px-4 py-2.5 rounded-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            <Library className="w-4 h-4" />
            <span>Bulk Add</span>
          </button>
          <button
            onClick={() => {
              setSelectedFile(null);
              setImageSrc("");
              setShowUploadModal(true);
            }}
            disabled={!gallery}
            className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest text-[#FCFAF7] bg-[#2C2623] hover:bg-[#352F2C] px-4 py-2.5 rounded-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Image</span>
          </button>
        </div>
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
                                onClick={() => handleCropExistingImage(img)}
                                className="p-1 text-stone-450 hover:text-[#2C2623] transition-colors cursor-pointer"
                                title="Crop / Edit Image"
                              >
                                <Crop className="w-4 h-4" />
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

      {/* FILE SELECTION MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#DCD0C0]/35 rounded-md p-6 max-w-md w-full shadow-lg space-y-6 animate-scale-in">
            <div className="flex items-center justify-between border-b border-[#DCD0C0]/20 pb-3">
              <h3 className="text-sm font-serif font-semibold text-[#2C2623] uppercase tracking-wider">
                Select Image to Upload
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-[#6E635F] hover:text-[#2C2623] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

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

            <div className="flex justify-end">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 border border-[#DCD0C0]/40 text-[#6E635F] hover:text-[#2C2623] rounded-sm transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FREE CROP MODAL — file upload */}
      {showCropper && imageSrc && (
        <ImageCropper
          open={showCropper}
          imageSrc={imageSrc}
          onCancel={() => {
            setShowCropper(false);
            setSelectedFile(null);
            setImageSrc("");
            setCroppingExistingImage(null);
          }}
          onConfirm={handleCropConfirm}
          defaultTitle={croppingExistingImage?.title || selectedFile?.name?.substring(0, selectedFile.name.lastIndexOf(".")) || ""}
          defaultAltText={croppingExistingImage?.alt_text || activeCategory.replace("_", " ") + " portfolio photograph"}
          confirmLabel={uploading ? "Uploading..." : "Crop & Upload"}
        />
      )}

      {/* FREE CROP MODAL — from library */}
      {showLibraryCropper && libraryCropperSrc && (
        <ImageCropper
          open={showLibraryCropper}
          imageSrc={libraryCropperSrc}
          onCancel={() => {
            setShowLibraryCropper(false);
            setLibraryMedia(null);
            setLibraryCropperSrc("");
          }}
          onConfirm={handleLibraryCropConfirm}
          onUseOriginal={handleUseOriginalFromLibrary}
          defaultTitle={libraryMedia?.title || ""}
          defaultAltText={activeCategory.replace("_", " ") + " portfolio photograph"}
          confirmLabel={addingFromLibrary ? "Adding..." : "Crop & Add"}
        />
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
      {showMediaPicker && token && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#DCD0C0]/35 rounded-md p-6 max-w-4xl w-full shadow-lg space-y-4 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#DCD0C0]/20 pb-3">
              <h3 className="text-sm font-serif font-semibold text-[#2C2623]">Select from Media Library</h3>
              <button onClick={() => setShowMediaPicker(false)} className="text-[#6E635F] hover:text-[#2C2623]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <MediaPicker 
              token={token} 
              category={activeCategory} 
              multiSelect={pickerMultiSelect}
              onSelectMultiple={handleBulkAddFromLibrary}
              onSelect={handleAddFromLibrary} 
            />
          </div>
        </div>
      )}

      {/* Upload Progress Simulation Overlay */}
      <UploadProgressOverlay isActive={uploading || addingFromLibrary} statusText={uploadStatusText} />
    </div>
  );
}
