"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { fetchAPI } from "@/lib/api";
import { Loader2, Plus, Edit2, Trash2, Check, X, ShieldAlert, Image as ImageIcon, Library, Crop, ArrowLeft } from "lucide-react";
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

  // New Dynamic Galleries States
  const [galleries, setGalleries] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any | null>(null); // Active gallery for managing images (null = galleries list view)
  const [images, setImages] = useState<ImageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // Gallery Edit/Create modal states
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [galleryFormMode, setGalleryFormMode] = useState<"create" | "edit">("create");
  const [galleryForm, setGalleryForm] = useState({
    id: "",
    name: "",
    slug: "",
    description: "",
    is_active: true,
    order_position: 0,
    cover_media_id: ""
  });
  const [showCoverPicker, setShowCoverPicker] = useState(false);

  // Gallery Edit Settings state (inside image manager)
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
  const [editImageAspect, setEditImageAspect] = useState<string>("square");
  const [editImageSort, setEditImageSort] = useState(0);
  const [savingImage, setSavingImage] = useState(false);

  const loadAllGalleries = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchAPI("/api/galleries", { token });
      setGalleries(data || []);
    } catch (err) {
      console.error("Failed to load galleries list", err);
    } finally {
      setLoading(false);
    }
  };

  const loadGalleryImages = async (galId: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const imgs = await fetchAPI(`/api/galleries/${galId}/images`, { token });
      setImages(imgs || []);
    } catch (err) {
      console.error("Failed to load gallery images", err);
    } finally {
      setLoading(false);
    }
  };

  const refreshCurrentView = async () => {
    if (gallery) {
      try {
        const updated = await fetchAPI(`/api/galleries/${gallery.id}`, { token });
        setGallery(updated);
        setGalleryTitle(updated.name || "");
        setGalleryDesc(updated.description || "");
        setGalleryStatus(updated.is_active ? "published" : "draft");
      } catch (e) {
        // Ignored fallback
      }
      await loadGalleryImages(gallery.id);
    } else {
      await loadAllGalleries();
    }
  };

  // On page load or token availability
  useEffect(() => {
    if (token) {
      loadAllGalleries();
    }
  }, [token]);

  const handleCreateOrUpdateGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSavingGallery(true);
    try {
      const body = {
        name: galleryForm.name,
        slug: galleryForm.slug,
        description: galleryForm.description,
        is_active: galleryForm.is_active,
        order_position: Number(galleryForm.order_position) || 0,
        cover_media_id: galleryForm.cover_media_id || null,
      };

      if (galleryFormMode === "create") {
        await fetchAPI("/api/galleries", {
          method: "POST",
          token,
          body: JSON.stringify(body),
        });
      } else {
        await fetchAPI(`/api/galleries/${galleryForm.id}`, {
          method: "PUT",
          token,
          body: JSON.stringify(body),
        });
      }

      // Automatically update translation files on the frontend
      try {
        await fetch("/api/admin/update-translation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            namespace: "portfolio",
            bulk: true,
            updates: {
              [`gallery_${galleryForm.slug}`]: galleryForm.name,
              [`gallery_desc_${galleryForm.slug}`]: galleryForm.description || "",
            }
          })
        });
      } catch (err) {
        console.error("Failed to automatically update portfolio translations", err);
      }

      setShowGalleryModal(false);
      await loadAllGalleries();
    } catch (err: any) {
      console.error("Failed to save gallery changes", err);
      alert(err.message || "Failed to save gallery.");
    } finally {
      setSavingGallery(false);
    }
  };

  const handleDeleteGallery = async (galId: string) => {
    if (!confirm("Are you sure you want to delete this portfolio gallery? All image associations in this gallery will be permanently deleted.")) return;
    setUpdatingId(galId);
    try {
      await fetchAPI(`/api/galleries/${galId}`, {
        method: "DELETE",
        token,
      });
      if (gallery && gallery.id === galId) {
        setGallery(null);
      }
      await loadAllGalleries();
    } catch (err: any) {
      console.error("Failed to delete gallery", err);
      alert(err.message || "Failed to delete gallery.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveGallerySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gallery) return;
    setSavingGallery(true);
    try {
      const updated = await fetchAPI(`/api/galleries/${gallery.id}`, {
        method: "PUT",
        token,
        body: JSON.stringify({
          name: galleryTitle,
          description: galleryDesc,
          slug: gallery.slug,
          is_active: galleryStatus === "published"
        })
      });

      // Automatically update translation files on the frontend
      try {
        await fetch("/api/admin/update-translation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            namespace: "portfolio",
            bulk: true,
            updates: {
              [`gallery_${gallery.slug}`]: galleryTitle,
              [`gallery_desc_${gallery.slug}`]: galleryDesc || "",
            }
          })
        });
      } catch (err) {
        console.error("Failed to automatically update portfolio translations", err);
      }

      setGallery(updated);
      setEditingGallery(false);
      await loadAllGalleries();
    } catch (err) {
      console.error("Failed to update gallery settings", err);
      alert("Failed to save gallery changes.");
    } finally {
      setSavingGallery(false);
    }
  };

  const handleSelectCoverImage = (media: MediaItem) => {
    setGalleryForm(prev => ({ ...prev, cover_media_id: media.id }));
    setShowCoverPicker(false);
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

  const handleCropAndUpload = async (blob: Blob, title: string, altText: string, aspect?: string) => {
    if (!gallery || !selectedFile) return;
    setUploading(true);
    setUploadStatusText("Cropping and uploading image...");
    setUploadError("");

    try {
      let croppedName = selectedFile.name;
      if (aspect && aspect !== "free") {
        const dotIndex = selectedFile.name.lastIndexOf(".");
        if (dotIndex !== -1) {
          const name = selectedFile.name.substring(0, dotIndex);
          const ext = selectedFile.name.substring(dotIndex);
          croppedName = `${name}-${aspect}${ext}`;
        } else {
          croppedName = `${selectedFile.name}-${aspect}`;
        }
      }
      const formDataPayload = new FormData();
      formDataPayload.append("file", blob, croppedName);
      formDataPayload.append("title", title);
      formDataPayload.append("alt_text", altText);
      formDataPayload.append("aspect", aspect || "square");

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
      
      refreshCurrentView();
    } catch (err: any) {
      throw new Error(err.message || "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleCropConfirm = async (blob: Blob, title: string, altText: string, aspect?: string) => {
    if (croppingExistingImage) {
      await handleConfirmCropExistingImage(blob, title, altText, aspect);
    } else {
      await handleCropAndUpload(blob, title, altText, aspect);
    }
  };

  const handleConfirmCropExistingImage = async (blob: Blob, title: string, altText: string, aspect?: string) => {
    if (!gallery || !token || !croppingExistingImage) return;
    setAddingFromLibrary(true);
    setUploadStatusText("Cropping image in place...");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      // 1. Upload cropped file as a new image in the gallery
      const dataPayload = new FormData();
      const origUrl = croppingExistingImage.optimized_url || croppingExistingImage.original_url || "";
      const origFilename = origUrl.substring(origUrl.lastIndexOf("/") + 1);
      const dotIndex = origFilename.lastIndexOf(".");
      const baseName = dotIndex !== -1 ? origFilename.substring(0, dotIndex) : `${croppingExistingImage.id}_cropped`;
      const ext = dotIndex !== -1 ? origFilename.substring(dotIndex) : ".jpg";
      const aspectSuffix = aspect && aspect !== "free" ? `-${aspect}` : "-cropped";
      const croppedName = `${baseName}${aspectSuffix}${ext}`;

      dataPayload.append("file", blob, croppedName);
      dataPayload.append("title", title || croppingExistingImage.title || "Cropped Portfolio Work");
      dataPayload.append("alt_text", altText || croppingExistingImage.alt_text || "Cropped portfolio image");
      dataPayload.append("aspect", aspect || "square");

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
      refreshCurrentView();
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
      refreshCurrentView();
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
      refreshCurrentView();
    } catch (err: any) {
      alert(err.message || "Failed to add images in bulk.");
    } finally {
      setAddingFromLibrary(false);
      setUploadStatusText("");
    }
  };

  const handleLibraryCropConfirm = async (blob: Blob, title: string, altText: string, aspect?: string) => {
    if (!gallery || !token || !libraryMedia) return;
    setAddingFromLibrary(true);
    setUploadStatusText("Uploading cropped image...");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const formDataPayload = new FormData();
      const dotIndex = libraryMedia.filename.lastIndexOf(".");
      const baseName = dotIndex !== -1 ? libraryMedia.filename.substring(0, dotIndex) : `${libraryMedia.id}_cropped`;
      const ext = dotIndex !== -1 ? libraryMedia.filename.substring(dotIndex) : ".jpg";
      const aspectSuffix = aspect && aspect !== "free" ? `-${aspect}` : "-cropped";
      const croppedName = `${baseName}${aspectSuffix}${ext}`;

      formDataPayload.append("file", blob, croppedName);
      formDataPayload.append("title", title);
      formDataPayload.append("alt_text", altText);
      formDataPayload.append("aspect", aspect || "square");

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
      refreshCurrentView();
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
      refreshCurrentView();
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
      refreshCurrentView();
    } catch (err) {
      console.error("Failed to delete image", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const openCreateGallery = () => {
    setGalleryForm({
      id: "",
      name: "",
      slug: "",
      description: "",
      is_active: true,
      order_position: galleries.length,
      cover_media_id: ""
    });
    setGalleryFormMode("create");
    setShowGalleryModal(true);
  };

  const openEditGallery = (g: any) => {
    setGalleryForm({
      id: g.id,
      name: g.name,
      slug: g.slug,
      description: g.description || "",
      is_active: g.is_active,
      order_position: g.order_position || 0,
      cover_media_id: g.cover_media_id || ""
    });
    setGalleryFormMode("edit");
    setShowGalleryModal(true);
  };

  const selectActiveGalleryForImages = async (g: any) => {
    setGallery(g);
    setGalleryTitle(g.name || "");
    setGalleryDesc(g.description || "");
    setGalleryStatus(g.is_active ? "published" : "draft");
    await loadGalleryImages(g.id);
  };

  return (
    <div className="space-y-10">
      {/* 1. VIEW MODE: Galleries List Dashboard */}
      {!gallery ? (
        <div className="space-y-8 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#DCD0C0]/25 pb-6">
            <div className="space-y-1.5">
              <h1 className="text-2xl font-light font-serif text-[#2C2623] tracking-wide">
                Portfolio Galleries
              </h1>
              <p className="text-xs text-[#6E635F] font-light leading-relaxed">
                Configure public showcase galleries, order sequences, cover imagery, and publish status.
              </p>
            </div>
            <button
              onClick={openCreateGallery}
              className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest text-[#FCFAF7] bg-[#2C2623] hover:bg-[#352F2C] px-5 py-3 rounded-xs font-semibold transition-all duration-300 shadow-xs cursor-pointer hover:shadow-md hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Gallery</span>
            </button>
          </div>

          {/* Galleries Table Grid */}
          {galleries.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-[#DCD0C0]/35 rounded-md bg-white">
              <ImageIcon className="w-8 h-8 text-stone-300 mx-auto mb-3" />
              <p className="text-xs text-[#6E635F] font-light">No portfolio galleries configured yet.</p>
              <button
                onClick={openCreateGallery}
                className="mt-4 text-xs font-semibold text-[#C4A484] hover:underline uppercase tracking-wider cursor-pointer"
              >
                Create your first gallery
              </button>
            </div>
          ) : (
            <div className="bg-white border border-[#DCD0C0]/25 rounded-sm overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs font-light text-[#6E635F] border-collapse">
                <thead>
                  <tr className="bg-stone-50/60 border-b border-[#DCD0C0]/20 text-[#2C2623] font-semibold uppercase tracking-widest text-[9px]">
                    <th className="py-4 px-6 w-24">Cover</th>
                    <th className="py-4 px-6 w-56">Name & Slug</th>
                    <th className="py-4 px-6">Description</th>
                    <th className="py-4 px-6 text-center w-24">Images</th>
                    <th className="py-4 px-6 text-center w-28">Status</th>
                    <th className="py-4 px-6 text-center w-20">Order</th>
                    <th className="py-4 px-6 text-right w-44">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {galleries.map((g) => {
                    const fallbackCover = "https://images.unsplash.com/photo-1610901137736-d7cc46657b11?auto=format&fit=crop&q=80&w=1200";
                    const isDeleting = updatingId === g.id;
                    return (
                      <tr key={g.id} className="border-b border-[#DCD0C0]/15 hover:bg-[#FAF8F5]/30 transition-all duration-200">
                        <td className="py-4 px-6">
                          <div className="w-12 h-12 rounded-xs overflow-hidden bg-stone-100 border border-stone-200/50 flex items-center justify-center shadow-3xs group cursor-pointer">
                            <img
                              src={g.cover_url || fallbackCover}
                              alt={g.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                            />
                          </div>
                        </td>
                        <td className="py-4 px-6 space-y-1">
                          <p className="font-semibold text-[#2C2623] text-sm">{g.name}</p>
                          <p className="text-[9px] font-mono text-stone-400">/portfolio/{g.slug}</p>
                        </td>
                        <td className="py-4 px-6 max-w-xs truncate text-[11px] leading-relaxed text-[#6E635F]" title={g.description}>
                          {g.description || <span className="text-stone-300 italic font-light">No description configured</span>}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="inline-flex w-7 h-7 rounded-full bg-stone-50 text-stone-600 font-mono text-[10px] items-center justify-center border border-stone-200/40 font-medium">
                            {g.image_count ?? 0}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-xs text-[9px] font-semibold uppercase tracking-wider ${
                            g.is_active
                              ? "bg-[#FAF8F5] text-[#C4A484] border border-[#C4A484]/30"
                              : "bg-stone-50 text-stone-400 border border-stone-200/50"
                          }`}>
                            {g.is_active ? "Active" : "Draft"}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center font-mono text-[11px] text-[#2C2623]">{g.order_position ?? 0}</td>
                        <td className="py-4 px-6 text-right">
                          {isDeleting ? (
                            <Loader2 className="w-4 h-4 animate-spin text-stone-400 ml-auto" />
                          ) : (
                            <div className="inline-flex space-x-2.5 items-center justify-end">
                              <button
                                onClick={() => selectActiveGalleryForImages(g)}
                                className="px-3 py-1.5 text-[9px] font-semibold uppercase tracking-widest bg-[#2C2623] text-white hover:bg-[#352F2C] rounded-sm transition-all shadow-xs cursor-pointer"
                              >
                                Images
                              </button>
                              <button
                                onClick={() => openEditGallery(g)}
                                className="p-1.5 border border-stone-100 rounded-sm text-stone-400 hover:text-[#2C2623] hover:bg-stone-50 transition-all cursor-pointer"
                                title="Edit Settings"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteGallery(g.id)}
                                className="p-1.5 border border-stone-100 rounded-sm text-stone-400 hover:text-red-650 hover:bg-red-50/20 transition-all cursor-pointer"
                                title="Delete Gallery"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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
      ) : (
        /* 2. VIEW MODE: Gallery Images Management */
        <div className="space-y-8 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#DCD0C0]/25 pb-6">
            <div className="space-y-1.5">
              <button
                onClick={() => setGallery(null)}
                className="text-xs text-[#C4A484] hover:text-[#2C2623] font-semibold transition-all flex items-center gap-1 cursor-pointer mb-2 group"
              >
                <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                <span>Back to Galleries List</span>
              </button>
              <h1 className="text-2xl font-light font-serif text-[#2C2623] tracking-wide">
                {gallery.name}
              </h1>
              <p className="text-xs text-[#6E635F] font-light leading-relaxed">
                Add, crop, organize, and sort images displayed in the public {gallery.name} portfolio.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setPickerMultiSelect(false);
                  setShowMediaPicker(true);
                }}
                disabled={addingFromLibrary}
                className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest text-[#2C2623] border border-[#2C2623] hover:bg-[#2C2623] hover:text-white px-4 py-2.5 rounded-sm font-semibold transition-all duration-300 cursor-pointer disabled:opacity-50"
              >
                <Library className="w-4 h-4" />
                <span>From Library</span>
              </button>
              <button
                onClick={() => {
                  setPickerMultiSelect(true);
                  setShowMediaPicker(true);
                }}
                disabled={addingFromLibrary}
                className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest text-[#2C2623] border border-[#2C2623] hover:bg-[#2C2623] hover:text-white px-4 py-2.5 rounded-sm font-semibold transition-all duration-300 cursor-pointer disabled:opacity-50"
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
                className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest text-[#FCFAF7] bg-[#2C2623] hover:bg-[#352F2C] px-4 py-2.5 rounded-sm font-semibold transition-all duration-300 shadow-xs cursor-pointer hover:shadow-md hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Image</span>
              </button>
            </div>
          </div>

          {/* Gallery Info Summary */}
          <div className="bg-[#FAF8F5] border border-[#DCD0C0]/25 rounded-md p-6 space-y-4 shadow-3xs">
            <div className="flex items-center justify-between border-b border-[#DCD0C0]/15 pb-3">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#C4A484] font-semibold">
                Gallery Information
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
                <p className="text-stone-500 font-light text-xs max-w-3xl leading-relaxed">{gallery.description || "No description set."}</p>
                <div className="pt-2 flex items-center gap-4 text-[10px] text-stone-400 font-medium">
                  <span>Slug: <strong className="font-mono">/portfolio/{gallery.slug}</strong></span>
                  <span>•</span>
                  <span>Status: <strong className="uppercase text-[#C4A484]">{gallery.is_active ? "Active" : "Draft"}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Images List */}
          {images.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-[#DCD0C0]/35 rounded-md bg-white">
              <ImageIcon className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p className="text-xs text-[#6E635F] font-light">No images uploaded to this portfolio gallery yet.</p>
            </div>
          ) : (
            <div className="bg-white border border-[#DCD0C0]/25 rounded-sm overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs font-light text-[#6E635F] border-collapse">
                <thead>
                  <tr className="bg-stone-50/60 border-b border-[#DCD0C0]/20 text-[#2C2623] font-semibold uppercase tracking-widest text-[9px]">
                    <th className="py-4 px-6 w-32">Frame Preview</th>
                    <th className="py-4 px-6">Title & Alt Text</th>
                    <th className="py-4 px-6 w-44">Layout Aspect</th>
                    <th className="py-4 px-6 text-center w-24">Order</th>
                    <th className="py-4 px-6 text-right w-36">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {images.map((img) => {
                    const aspect = img.dimensions?.aspect || "square";
                    const isDeleting = updatingId === img.id;
                    return (
                      <tr key={img.id} className="border-b border-[#DCD0C0]/15 hover:bg-[#FAF8F5]/30 transition-all duration-200">
                        <td className="py-4 px-6">
                          <div className="w-16 h-16 rounded-xs overflow-hidden bg-stone-100 border border-stone-200/50 flex items-center justify-center shadow-3xs group cursor-pointer">
                            <img
                              src={img.optimized_url || img.original_url}
                              alt={img.alt_text || ""}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                            />
                          </div>
                        </td>
                        <td className="py-4 px-6 space-y-1">
                          <p className="font-semibold text-[#2C2623] text-sm">{img.title || "Untitled"}</p>
                          <p className="text-[10px] text-stone-400 italic max-w-sm overflow-hidden text-ellipsis whitespace-nowrap">{img.alt_text || "No alt text set"}</p>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-block px-2.5 py-0.5 rounded-xs text-[9px] font-semibold uppercase tracking-wider bg-stone-50 border border-stone-200/60 text-[#6E635F]">
                            {aspect === "square" ? "Square (1:1)" :
                             aspect === "portrait" ? "Portrait (3:4)" :
                             aspect === "landscape" ? "Landscape (3:2)" :
                             aspect === "large_square" ? "Large Sq (1:1)" :
                             aspect === "large_portrait" ? "Larger Port (3:5)" :
                             aspect === "wide_landscape" ? "Wide Land (16:9)" :
                             aspect === "panoramic" ? "Panoramic (21:9)" : aspect}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center font-mono text-[11px] text-[#2C2623]">{img.sort_order}</td>
                        <td className="py-4 px-6 text-right">
                          {isDeleting ? (
                            <Loader2 className="w-4 h-4 animate-spin text-stone-400 ml-auto" />
                          ) : (
                            <div className="inline-flex space-x-2.5 items-center justify-end">
                              <button
                                onClick={() => handleOpenEditImage(img)}
                                className="p-1.5 border border-stone-100 rounded-sm text-stone-400 hover:text-[#2C2623] hover:bg-stone-50 transition-all cursor-pointer"
                                title="Edit Metadata"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleCropExistingImage(img)}
                                className="p-1.5 border border-stone-100 rounded-sm text-stone-400 hover:text-[#2C2623] hover:bg-stone-50 transition-all cursor-pointer"
                                title="Crop / Edit Image"
                              >
                                <Crop className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteImage(img.id)}
                                className="p-1.5 border border-stone-100 rounded-sm text-stone-400 hover:text-red-655 hover:bg-red-50/20 transition-all cursor-pointer"
                                title="Delete Image"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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

      {/* CREATE / EDIT GALLERY MODAL */}
      {showGalleryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#DCD0C0]/35 rounded-md p-6 max-w-md w-full shadow-lg space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-[#DCD0C0]/20 pb-3">
              <h3 className="text-sm font-serif font-semibold text-[#2C2623] uppercase tracking-wider">
                {galleryFormMode === "create" ? "Create New Gallery" : "Edit Gallery Metadata"}
              </h3>
              <button
                onClick={() => setShowGalleryModal(false)}
                className="text-[#6E635F] hover:text-[#2C2623]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdateGallery} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-[10px] uppercase text-[#6E635F] font-semibold">Gallery Name</label>
                <input
                  type="text"
                  required
                  value={galleryForm.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    setGalleryForm(prev => ({
                      ...prev,
                      name: val,
                      // Auto slug generation if creating
                      slug: prev.id ? prev.slug : val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
                    }));
                  }}
                  className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase text-[#6E635F] font-semibold">Slug Path</label>
                <input
                  type="text"
                  required
                  value={galleryForm.slug}
                  onChange={(e) => setGalleryForm(prev => ({ ...prev, slug: e.target.value.toLowerCase() }))}
                  className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs font-mono outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase text-[#6E635F] font-semibold">Description</label>
                <textarea
                  value={galleryForm.description}
                  onChange={(e) => setGalleryForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden resize-none font-light"
                />
              </div>

              {/* Cover Image Selection Field */}
              <div className="space-y-1">
                <label className="block text-[10px] uppercase text-[#6E635F] font-semibold">Cover Image</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    disabled
                    placeholder="No cover photo selected"
                    value={galleryForm.cover_media_id || ""}
                    className="w-full bg-stone-50 border border-[#DCD0C0]/45 rounded-sm px-3 py-2 text-[10px] text-stone-400 outline-hidden font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCoverPicker(true)}
                    className="px-3 py-2 border border-[#2C2623] hover:bg-[#2C2623] hover:text-white rounded-sm text-[10px] font-semibold uppercase tracking-wider transition-all"
                  >
                    Browse
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase text-[#6E635F] font-semibold">Order Position</label>
                  <input
                    type="number"
                    value={galleryForm.order_position}
                    onChange={(e) => setGalleryForm(prev => ({ ...prev, order_position: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase text-[#6E635F] font-semibold">Visibility Status</label>
                  <select
                    value={galleryForm.is_active ? "active" : "draft"}
                    onChange={(e) => setGalleryForm(prev => ({ ...prev, is_active: e.target.value === "active" }))}
                    className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden text-[#6E635F]"
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="draft">Draft (Hidden)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#DCD0C0]/25">
                <button
                  type="button"
                  onClick={() => setShowGalleryModal(false)}
                  className="px-4 py-2 border border-[#DCD0C0]/40 text-[#6E635F] hover:text-[#2C2623] rounded-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingGallery}
                  className="inline-flex items-center justify-center bg-[#2C2623] hover:bg-[#352F2C] text-[#FCFAF7] px-5 py-2 rounded-sm font-semibold transition-all disabled:opacity-50 min-w-[80px]"
                >
                  {savingGallery ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GALLERY COVER SELECTOR MODAL */}
      {showCoverPicker && token && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#DCD0C0]/35 rounded-md p-6 max-w-4xl w-full shadow-lg space-y-4 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#DCD0C0]/20 pb-3">
              <h3 className="text-sm font-serif font-semibold text-[#2C2623]">Choose Gallery Cover Image</h3>
              <button onClick={() => setShowCoverPicker(false)} className="text-[#6E635F] hover:text-[#2C2623]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <MediaPicker 
              token={token} 
              multiSelect={false}
              onSelect={handleSelectCoverImage} 
            />
          </div>
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
          defaultAltText={croppingExistingImage?.alt_text || (gallery?.name || "portfolio") + " photography"}
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
          defaultAltText={(gallery?.name || "portfolio") + " photography"}
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
                    onChange={(e) => setEditImageAspect(e.target.value)}
                    className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden text-[#6E635F]"
                  >
                    <option value="square">Square (1:1)</option>
                    <option value="portrait">Standard Portrait (3:4)</option>
                    <option value="landscape">Standard Landscape (3:2)</option>
                    <option value="large_square">Large Square (1:1 Double size)</option>
                    <option value="large_portrait">Larger Portrait (3:5 Double height)</option>
                    <option value="wide_landscape">Wide Landscape (16:9 Double width)</option>
                    <option value="panoramic">Panoramic (21:9 Triple width)</option>
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
              category={gallery?.slug || "general"} 
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
