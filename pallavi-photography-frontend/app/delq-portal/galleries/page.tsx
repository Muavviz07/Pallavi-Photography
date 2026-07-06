"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { fetchAPI } from "@/lib/api";
import { 
  Loader2, Plus, Edit2, Trash2, Check, X, ShieldAlert, 
  Image as ImageIcon, ArrowLeft, Eye, EyeOff, CheckCircle2, UserCheck, Star, Library, Upload, FolderArchive, Crop
} from "lucide-react";
import MediaPicker from "@/components/media/MediaPicker";
import ImageCropper from "@/components/cropper/ImageCropper";
import UploadProgressOverlay from "@/components/media/UploadProgressOverlay";
import { MediaItem } from "@/lib/media";

interface UserResponse {
  id: string;
  email: string;
  role: string;
  status: string;
}

interface ClientGalleryResponse {
  id: string;
  title: string;
  slug: string;
  description?: string;
  status: string;
  expiry_date?: string;
  selections_submitted: boolean;
  selections_submitted_at?: string;
  user?: UserResponse;
  user_id: string;
  can_download: boolean;
  can_submit_selections: boolean;
  can_upload: boolean;
  can_download_zip: boolean;
  cover_image_id?: string;
  download_zip_url?: string;
  password_hash?: string;
  cover_image?: {
    id: string;
    original_url: string;
    optimized_url: string;
    thumbnail_url: string;
  };
}

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

export default function AdminGalleries() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;

  const [galleries, setGalleries] = useState<ClientGalleryResponse[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedGalleryId, setSelectedGalleryId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    user_id: "",
    password: "",
    status: "active",
    can_download: false,
    can_submit_selections: true,
    can_upload: false,
    can_download_zip: false,
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Photos Management Pane States
  const [selectedGalleryForPhotos, setSelectedGalleryForPhotos] = useState<ClientGalleryResponse | null>(null);
  const [galleryImages, setGalleryImages] = useState<ImageItem[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [addingFromLibrary, setAddingFromLibrary] = useState(false);
  const [customCoverUrlInput, setCustomCoverUrlInput] = useState("");
  const [showCropper, setShowCropper] = useState(false);
  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const [cropQueueIndex, setCropQueueIndex] = useState(0);
  const [cropperImageSrc, setCropperImageSrc] = useState("");
  // Crop-from-library state
  const [libraryMedia, setLibraryMedia] = useState<MediaItem | null>(null);
  const [showLibraryCropper, setShowLibraryCropper] = useState(false);
  // Flag to distinguish cover cropping vs adding image from library
  const [isCoverCrop, setIsCoverCrop] = useState(false);
  const [libraryCropperSrc, setLibraryCropperSrc] = useState("");

  const [zipUrlInput, setZipUrlInput] = useState("");
  const [showZipPicker, setShowZipPicker] = useState(false);
  const [updatingZip, setUpdatingZip] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState("");
  const [pickerMultiSelect, setPickerMultiSelect] = useState(false);
  const [croppingExistingImage, setCroppingExistingImage] = useState<any | null>(null);

  useEffect(() => {
    if (selectedGalleryForPhotos) {
      setZipUrlInput(selectedGalleryForPhotos.download_zip_url || "");
    }
  }, [selectedGalleryForPhotos]);

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const gallData = await fetchAPI("/api/admin/galleries", { token });
      const userData = await fetchAPI("/api/admin/users", { token });
      setGalleries(gallData);
      setUsers(userData.filter((u: UserResponse) => u.role === "client"));
    } catch (err) {
      console.error("Failed to load galleries data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const loadGalleryImages = async (galId: string) => {
    setLoadingImages(true);
    try {
      const data = await fetchAPI(`/api/client-galleries/${galId}/images`, { token });
      setGalleryImages(data);
    } catch (err) {
      console.error("Failed to fetch gallery images", err);
    } finally {
      setLoadingImages(false);
    }
  };

  const handleOpenCreate = () => {
    setFormMode("create");
    setSelectedGalleryId(null);
    setFormData({
      title: "",
      slug: "",
      description: "",
      user_id: users[0]?.id || "",
      password: "",
      status: "active",
      can_download: true,
      can_submit_selections: true,
      can_upload: false,
      can_download_zip: false,
    });
    setErrorMsg("");
    setShowPassword(false);
    setShowModal(true);
  };

  const handleOpenEdit = (g: ClientGalleryResponse) => {
    setFormMode("edit");
    setSelectedGalleryId(g.id);
    setFormData({
      title: g.title,
      slug: g.slug,
      description: g.description || "",
      user_id: g.user_id,
      password: g.password_hash || "",
      status: g.status,
      can_download: g.can_download,
      can_submit_selections: g.can_submit_selections,
      can_upload: g.can_upload || false,
      can_download_zip: g.can_download_zip || false,
    });
    setErrorMsg("");
    setShowPassword(false);
    setShowModal(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formMode === "create") {
      if (!formData.title || !formData.password) {
        setErrorMsg("Please fill out Client Name and Password.");
        return;
      }
    } else {
      if (!formData.title) {
        setErrorMsg("Please fill out Client Name.");
        return;
      }
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      if (formMode === "create") {
        const payload: any = {
          title: formData.title,
          password: formData.password,
        };
        if (formData.slug && formData.slug.trim()) {
          payload.slug = formData.slug.trim();
        }
        await fetchAPI("/api/admin/galleries", {
          method: "POST",
          token,
          body: JSON.stringify(payload),
        });
      } else {
        const payload: any = {
          title: formData.title,
          description: formData.description,
          status: formData.status,
          can_download: formData.can_download,
          can_submit_selections: formData.can_submit_selections,
          can_upload: formData.can_upload,
          can_download_zip: formData.can_download_zip,
        };
        if (formData.slug && formData.slug.trim()) {
          payload.slug = formData.slug.trim();
        }
        if (formData.password) {
          payload.password = formData.password;
        }
        
        await fetchAPI(`/api/admin/galleries/${selectedGalleryId}`, {
          method: "PUT",
          token,
          body: JSON.stringify(payload),
        });
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit gallery request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this gallery? This action is permanent and will delete all links.")) return;
    try {
      await fetchAPI(`/api/admin/galleries/${id}`, {
        method: "DELETE",
        token,
      });
      loadData();
    } catch (err) {
      console.error("Failed to delete gallery", err);
    }
  };

  // Image upload handles multiple file selection with sequential cropping
  const handleImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedGalleryForPhotos) return;

    const fileArray = Array.from(files);
    setCropQueue(fileArray);
    setCropQueueIndex(0);

    const reader = new FileReader();
    reader.onload = () => {
      setCropperImageSrc(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(fileArray[0]);

    setUploadProgress(`Cropping 1/${fileArray.length}...`);
  };

  const uploadSingleCropped = async (blob: Blob, title: string, altText: string): Promise<void> => {
    if (!selectedGalleryForPhotos || !token) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const dataPayload = new FormData();
    dataPayload.append("file", blob);
    dataPayload.append("title", title);
    dataPayload.append("alt_text", altText);

    const res = await fetch(`${apiUrl}/api/client-galleries/${selectedGalleryForPhotos.id}/images/upload`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` },
      body: dataPayload,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `Failed to upload ${title}`);
    }
  };

  const handleCroppedUpload = async (blob: Blob, title: string, altText: string) => {
    if (!selectedGalleryForPhotos) return;

    try {
      await uploadSingleCropped(blob, title, altText);

      const nextIndex = cropQueueIndex + 1;
      if (nextIndex < cropQueue.length) {
        setCropQueueIndex(nextIndex);
        setUploadProgress(`Cropping ${nextIndex + 1}/${cropQueue.length}...`);
        const nextFile = cropQueue[nextIndex];
        const reader = new FileReader();
        reader.onload = () => {
          setCropperImageSrc(reader.result as string);
        };
        reader.readAsDataURL(nextFile);
      } else {
        setShowCropper(false);
        setCropQueue([]);
        setCropQueueIndex(0);
        setCropperImageSrc("");
        setUploadProgress("");
        loadGalleryImages(selectedGalleryForPhotos.id);
      }
    } catch (err: any) {
      throw new Error(err.message || "Upload failed.");
    }
  };

  const handleAddFromLibrary = (media: MediaItem) => {
    // Open cropper to add image to gallery (not cover)
    setIsCoverCrop(false);
    setLibraryMedia(media);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const src = media.optimized_url || media.original_url || "";
    const fullSrc = src.startsWith("http") ? src : `${apiUrl}${src}`;
    setLibraryCropperSrc(fullSrc);
    setShowMediaPicker(false);
    setShowLibraryCropper(true);
  };

  const handleCropConfirm = async (blob: Blob, title: string, altText: string) => {
    if (croppingExistingImage) {
      await handleConfirmCropExistingImage(blob, title, altText);
    } else {
      await handleCroppedUpload(blob, title, altText);
    }
  };

  const handleConfirmCropExistingImage = async (blob: Blob, title: string, altText: string) => {
    if (!selectedGalleryForPhotos || !token || !croppingExistingImage) return;
    setAddingFromLibrary(true);
    setUploadStatusText("Cropping image in-place...");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      // 1. Upload cropped file as a new image in the gallery
      const dataPayload = new FormData();
      dataPayload.append("file", blob, `${croppingExistingImage.id}_cropped.jpg`);
      dataPayload.append("title", title || croppingExistingImage.title || "Cropped Frame");
      dataPayload.append("alt_text", altText || croppingExistingImage.alt_text || "Cropped proof image");

      const uploadRes = await fetch(`${apiUrl}/api/client-galleries/${selectedGalleryForPhotos.id}/images/upload`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: dataPayload,
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to upload cropped image.");
      }

      // 2. Remove the old image link from this gallery
      await fetch(`${apiUrl}/api/client-galleries/${selectedGalleryForPhotos.id}/images/${croppingExistingImage.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      setShowCropper(false);
      setCropperImageSrc("");
      setCroppingExistingImage(null);
      loadGalleryImages(selectedGalleryForPhotos.id);
    } catch (err: any) {
      alert(err.message || "Failed to crop existing image.");
    } finally {
      setAddingFromLibrary(false);
      setUploadStatusText("");
    }
  };

  const handleCropExistingImage = (imageItem: any) => {
    setCroppingExistingImage(imageItem);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const src = imageItem.optimized_url || imageItem.original_url || "";
    const fullSrc = src.startsWith("http") ? src : `${apiUrl}${src}`;
    setCropperImageSrc(fullSrc);
    setShowCropper(true);
  };

  const handleBulkAddFromLibrary = async (mediaItems: MediaItem[]) => {
    if (!selectedGalleryForPhotos || !token || mediaItems.length === 0) return;
    setShowMediaPicker(false);
    setAddingFromLibrary(true);
    setUploadStatusText(`Adding 1/${mediaItems.length} images...`);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      for (let i = 0; i < mediaItems.length; i++) {
        const media = mediaItems[i];
        setUploadStatusText(`Linking image ${i + 1}/${mediaItems.length}: ${media.title || media.filename}...`);
        const res = await fetch(
          `${apiUrl}/api/client-galleries/${selectedGalleryForPhotos.id}/images`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ image_id: media.id }),
          }
        );
        if (!res.ok) {
          console.error(`Failed to link image ${media.id}`);
        }
      }
      loadGalleryImages(selectedGalleryForPhotos.id);
    } catch (err: any) {
      alert(err.message || "Failed to add images in bulk.");
    } finally {
      setAddingFromLibrary(false);
      setUploadStatusText("");
    }
  };

  const handleLibraryCropConfirm = async (blob: Blob, title: string, altText: string) => {
    if (!selectedGalleryForPhotos || !token || !libraryMedia) return;
    setAddingFromLibrary(true);
    setUploadStatusText("Uploading cropped image...");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const formDataPayload = new FormData();
      formDataPayload.append("file", blob, `${libraryMedia.id}_cropped.jpg`);
      formDataPayload.append("title", title);
      formDataPayload.append("alt_text", altText);

      const res = await fetch(`${apiUrl}/api/client-galleries/${selectedGalleryForPhotos.id}/images/upload`, {
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
      loadGalleryImages(selectedGalleryForPhotos.id);
    } catch (err: any) {
      throw new Error(err.message || "Failed to add image from library.");
    } finally {
      setAddingFromLibrary(false);
    }
  };

  const handleUseOriginalFromLibrary = async () => {
    if (!selectedGalleryForPhotos || !token || !libraryMedia) return;
    setAddingFromLibrary(true);
    setUploadStatusText("Linking original library image...");
    try {
      if (isCoverCrop) {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/admin/galleries/${selectedGalleryForPhotos.id}/set-cover-from-library`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ image_id: libraryMedia.id }),
          }
        );
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || "Failed to set cover image.");
        }
        const updated = await res.json();
        setSelectedGalleryForPhotos(updated);
        setGalleries((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
      } else {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/client-galleries/${selectedGalleryForPhotos.id}/images`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ image_id: libraryMedia.id }),
          }
        );
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || "Failed to add image.");
        }
        loadGalleryImages(selectedGalleryForPhotos.id);
      }

      setShowLibraryCropper(false);
      setLibraryMedia(null);
      setLibraryCropperSrc("");
      setIsCoverCrop(false);
    } catch (err: any) {
      alert(err.message || "Failed to add image from library.");
    } finally {
      setAddingFromLibrary(false);
    }
  };

  const handleSaveZipUrl = async () => {
    if (!selectedGalleryForPhotos || !token) return;
    setUpdatingZip(true);
    try {
      const updated = await fetchAPI(`/api/admin/galleries/${selectedGalleryForPhotos.id}`, {
        method: "PUT",
        token,
        body: JSON.stringify({ download_zip_url: zipUrlInput.trim() || null })
      });
      setSelectedGalleryForPhotos(updated);
      setGalleries((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
      alert("Gallery ZIP download URL updated successfully!");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to update ZIP URL.");
    } finally {
      setUpdatingZip(false);
    }
  };


  const handleDeleteImage = async (imageId: string) => {
    if (!selectedGalleryForPhotos || !confirm("Remove this photo from the gallery? The file will remain in the media library.")) return;
    try {
      await fetchAPI(`/api/client-galleries/${selectedGalleryForPhotos.id}/images/${imageId}`, {
        method: "DELETE",
        token
      });
      loadGalleryImages(selectedGalleryForPhotos.id);
    } catch (err) {
      console.error("Failed to delete gallery photo", err);
    }
  };

  const handleSetCoverImage = async (imageId: string) => {
    if (!selectedGalleryForPhotos || !token) return;
    try {
      const updated = await fetchAPI(`/api/client-galleries/${selectedGalleryForPhotos.id}`, {
        method: "PUT",
        token,
        body: JSON.stringify({ cover_image_id: imageId })
      });
      setSelectedGalleryForPhotos(updated);
      setGalleries((prev) =>
        prev.map((g) => (g.id === updated.id ? updated : g))
      );
    } catch (err) {
      console.error("Failed to set cover image", err);
    }
  };

  const handleCustomCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedGalleryForPhotos || !token) return;
    
    setUploadingFiles(true);
    setUploadProgress("Uploading custom cover image...");
    
    const formDataObj = new FormData();
    formDataObj.append("file", file);
    
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/admin/galleries/${selectedGalleryForPhotos.id}/upload-cover`, {
        method: "POST",
        headers,
        body: formDataObj
      });
      
      if (!res.ok) {
        throw new Error("Upload cover failed");
      }
      
      const updated = await res.json();
      setSelectedGalleryForPhotos(updated);
      setGalleries((prev) =>
        prev.map((g) => (g.id === updated.id ? updated : g))
      );
      setUploadProgress("");
    } catch (err) {
      console.error(err);
      alert("Failed to upload custom cover image");
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleCustomCoverUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCoverUrlInput.trim() || !selectedGalleryForPhotos || !token) return;
    
    setUploadingFiles(true);
    setUploadProgress("Setting custom cover image URL...");
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/admin/galleries/${selectedGalleryForPhotos.id}/cover-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ url: customCoverUrlInput.trim() })
      });
      
      if (!res.ok) {
        throw new Error("Setting cover URL failed");
      }
      
      const updated = await res.json();
      setSelectedGalleryForPhotos(updated);
      setGalleries((prev) =>
        prev.map((g) => (g.id === updated.id ? updated : g))
      );
      setCustomCoverUrlInput("");
      setUploadProgress("");
    } catch (err) {
      console.error(err);
      alert("Failed to set cover image URL");
    } finally {
      setUploadingFiles(false);
    }
  };

  // Open cropper for cover image selection from library
  const handleSetCoverFromLibrary = async (media: MediaItem) => {
    if (!selectedGalleryForPhotos || !token) return;
    // Prepare cropper for cover image
    setIsCoverCrop(true);
    setLibraryMedia(media);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const src = media.optimized_url || media.original_url || "";
    const fullSrc = src.startsWith("http") ? src : `${apiUrl}${src}`;
    setLibraryCropperSrc(fullSrc);
    setShowCoverPicker(false);
    setShowLibraryCropper(true);
  };

  // After cropping, upload the cropped image as gallery cover
  const handleCoverCropConfirm = async (blob: Blob, title: string, altText: string) => {
    if (!selectedGalleryForPhotos || !token) return;
    setUploadingFiles(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const formDataPayload = new FormData();
      formDataPayload.append("file", blob, `${selectedGalleryForPhotos.id}_cover.jpg`);
      // Optional: include title/alt if backend uses it; otherwise just upload file
      if (title) formDataPayload.append("title", title);
      if (altText) formDataPayload.append("alt_text", altText);

      const res = await fetch(`${apiUrl}/api/admin/galleries/${selectedGalleryForPhotos.id}/upload-cover`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formDataPayload,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Upload cover failed");
      }

      const updated = await res.json();
      setSelectedGalleryForPhotos(updated);
      setGalleries((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    } catch (err: any) {
      console.error(err);
      alert("Failed to set cover image after cropping");
    } finally {
      setUploadingFiles(false);
      setShowLibraryCropper(false);
      setLibraryMedia(null);
      setLibraryCropperSrc("");
    }
  };

  const handleClearCoverImage = async () => {
    if (!selectedGalleryForPhotos || !token) return;
    if (!confirm("Are you sure you want to remove the cover image?")) return;
    
    try {
      const updated = await fetchAPI(`/api/client-galleries/${selectedGalleryForPhotos.id}`, {
        method: "PUT",
        token,
        body: JSON.stringify({ cover_image_id: null })
      });
      setSelectedGalleryForPhotos(updated);
      setGalleries((prev) =>
        prev.map((g) => (g.id === updated.id ? updated : g))
      );
    } catch (err) {
      console.error("Failed to clear cover image", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="w-8 h-8 text-[#C4A484] animate-spin" />
        <p className="text-xs text-[#6E635F] font-light">Loading galleries...</p>
      </div>
    );
  }

  // Nested Pane: Photo management view
  if (selectedGalleryForPhotos) {
    return (
      <>
      <div className="space-y-10 animate-fade-in">
        {/* Back navigation header */}
        <div className="flex items-center justify-between border-b border-[#DCD0C0]/25 pb-6">
          <div className="space-y-1">
            <button
              onClick={() => {
                setSelectedGalleryForPhotos(null);
                setGalleryImages([]);
              }}
              className="inline-flex items-center space-x-1 text-xs uppercase tracking-widest text-[#C4A484] hover:text-[#2C2623] transition-colors mb-2 cursor-pointer font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Galleries</span>
            </button>
            <h1 className="text-2xl font-light font-serif text-[#2C2623]">
              Manage Gallery Photos
            </h1>
            <p className="text-xs text-[#6E635F] font-light font-mono">
              Gallery: {selectedGalleryForPhotos.title} (/{selectedGalleryForPhotos.slug})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setPickerMultiSelect(false);
                setShowMediaPicker(true);
              }}
              disabled={addingFromLibrary}
              className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest text-[#2C2623] border border-[#2C2623] hover:bg-[#2C2623] hover:text-white px-4 py-2.5 rounded-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              <Library className="w-4 h-4" />
              <span>From Library</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPickerMultiSelect(true);
                setShowMediaPicker(true);
              }}
              disabled={addingFromLibrary}
              className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest text-[#2C2623] border border-[#2C2623] hover:bg-[#2C2623] hover:text-white px-4 py-2.5 rounded-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              <Library className="w-4 h-4" />
              <span>Bulk Add</span>
            </button>
            <label
              htmlFor="upload-multi-photos"
              className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest text-[#FCFAF7] bg-[#2C2623] hover:bg-[#352F2C] px-4 py-2.5 rounded-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Photos</span>
            </label>
            <input
              type="file"
              id="upload-multi-photos"
              multiple
              accept="image/*"
              disabled={uploadingFiles}
              onChange={handleImagesUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Upload progress message */}
        {uploadingFiles && (
          <div className="bg-[#FAF8F5] border border-[#C4A484]/30 rounded-sm p-4 text-xs text-[#6E635F] flex items-center space-x-3">
            <Loader2 className="w-4 h-4 text-[#C4A484] animate-spin" />
            <span>{uploadProgress}</span>
          </div>
        )}

        {/* Cover / Thumbnail Section */}
        {(() => {
          const selectedCoverUrl = selectedGalleryForPhotos.cover_image 
            ? (selectedGalleryForPhotos.cover_image.thumbnail_url || selectedGalleryForPhotos.cover_image.optimized_url || selectedGalleryForPhotos.cover_image.original_url)
            : "";
          
          return (
            <div className="bg-white border border-[#DCD0C0]/25 rounded-md p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-[#2C2623] uppercase tracking-wider font-serif">
                    Gallery Cover / Thumbnail
                  </h3>
                  <p className="text-xs text-[#6E635F] font-light">
                    Select a cover image from your media library to represent this gallery.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCoverPicker(true)}
                    className="inline-flex items-center space-x-1.5 text-xs uppercase tracking-widest text-[#2C2623] border border-[#2C2623] hover:bg-[#2C2623] hover:text-white px-3.5 py-2 rounded-sm font-semibold transition-all cursor-pointer"
                  >
                    <Library className="w-3.5 h-3.5" />
                    <span>{selectedGalleryForPhotos.cover_image_id ? "Change Cover" : "Pick from Library"}</span>
                  </button>
                  {selectedGalleryForPhotos.cover_image_id && (
                    <button
                      onClick={handleClearCoverImage}
                      className="inline-flex items-center space-x-1.5 text-xs uppercase tracking-widest text-red-600 border border-red-200 hover:bg-red-50 px-3.5 py-2 rounded-sm font-semibold transition-all cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Remove Cover</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Current cover preview */}
              <div className="pt-3 border-t border-[#DCD0C0]/15">
                <span className="text-[10px] uppercase tracking-wider text-stone-500 font-medium block mb-2">Current Cover Preview</span>
                <div className="w-48 aspect-video rounded-sm bg-stone-100 border border-[#DCD0C0]/20 overflow-hidden relative flex items-center justify-center">
                  {selectedCoverUrl ? (
                    <img
                      src={selectedCoverUrl}
                      alt="Gallery cover thumbnail"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <ImageIcon className="w-6 h-6 text-stone-300 mx-auto mb-1.5" />
                      <span className="text-[10px] text-stone-400 block font-light">No cover set</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ZIP Download Settings Card */}
        <div className="bg-white border border-[#DCD0C0]/25 rounded-md p-6 space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-[#2C2623] uppercase tracking-wider font-serif">
              ZIP Download Package
            </h3>
            <p className="text-xs text-[#6E635F] font-light">
              Provide a direct ZIP download URL or select a ZIP archive from the Media Library for the client.
            </p>
          </div>

          <div className="pt-3 border-t border-[#DCD0C0]/15 space-y-4">
            {/* Client Selections Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-[#FAF8F5] p-3 border border-[#DCD0C0]/20 rounded-sm">
              <div className="space-y-0.5">
                <span className="font-medium text-stone-500 uppercase tracking-wider text-[9px] block">Client Selection Status</span>
                <span className="text-[#2C2623] font-serif font-light text-sm">
                  {selectedGalleryForPhotos.selections_submitted ? (
                    <span className="text-green-600 font-semibold inline-flex items-center gap-1">
                      <Check className="w-4 h-4" /> Finalized & Submitted
                    </span>
                  ) : (
                    <span className="text-stone-500 font-normal">Pending client submission</span>
                  )}
                </span>
              </div>
              {selectedGalleryForPhotos.selections_submitted && selectedGalleryForPhotos.selections_submitted_at && (
                <span className="text-[10px] text-stone-400">
                  Submitted on: {new Date(selectedGalleryForPhotos.selections_submitted_at).toLocaleString()}
                </span>
              )}
            </div>

            {/* URL Input Form */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-stone-500 font-medium block">
                Download ZIP URL / Link
              </label>
              <div className="flex flex-col md:flex-row gap-2">
                <input
                  type="text"
                  placeholder="e.g. /static/media/123-abc.zip or Google Drive/Dropbox link"
                  value={zipUrlInput}
                  onChange={(e) => setZipUrlInput(e.target.value)}
                  className="flex-1 bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden text-[#2C2623]"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowZipPicker(true)}
                    className="inline-flex items-center justify-center space-x-1.5 text-xs uppercase tracking-widest text-[#2C2623] border border-[#DCD0C0] hover:bg-stone-50 px-4 py-2 rounded-sm transition-all cursor-pointer font-medium"
                  >
                    <Library className="w-3.5 h-3.5" />
                    <span>Library</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveZipUrl}
                    disabled={updatingZip}
                    className="inline-flex items-center justify-center space-x-1.5 text-xs uppercase tracking-widest text-[#FCFAF7] bg-[#C4A484] hover:bg-[#B39373] px-4 py-2 rounded-sm transition-all cursor-pointer font-semibold disabled:opacity-50"
                  >
                    {updatingZip ? "Saving..." : "Save Link"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Image Grid view with client selection status */}
        {loadingImages ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-6 h-6 text-[#C4A484] animate-spin" />
            <p className="text-xs text-[#6E635F] font-light">Loading photos...</p>
          </div>
        ) : galleryImages.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-[#DCD0C0]/35 rounded-md bg-white">
            <ImageIcon className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="text-xs text-[#6E635F] font-light">This gallery is currently empty. Upload photos to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {galleryImages.map((item) => (
              <div
                key={item.image_id}
                className={`relative group bg-[#FAF8F5] border border-[#DCD0C0]/25 rounded-sm overflow-hidden shadow-xs flex flex-col justify-between ${
                  item.selected ? "ring-2 ring-[#C4A484]/65 border-transparent" : ""
                }`}
              >
                {/* Thumbnail container */}
                <div className="aspect-square w-full bg-stone-100 overflow-hidden relative">
                  <img
                    src={item.image.thumbnail_url || item.image.optimized_url}
                    alt={item.image.alt_text}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Selection Overlay Badge */}
                  {item.selected && (
                    <div className="absolute top-2 left-2 bg-[#C4A484] text-white p-1 rounded-full shadow-xs" title="Selected by client">
                      <UserCheck className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {/* Cover image indicator badge */}
                  {selectedGalleryForPhotos.cover_image_id === item.image.id && (
                    <div className="absolute top-2 right-2 bg-[#2C2623] text-[#C4A484] p-1.5 rounded-full shadow-xs" title="Gallery Thumbnail / Cover Image">
                      <Star className="w-3.5 h-3.5 fill-[#C4A484]" />
                    </div>
                  )}

                  {/* Actions cover overlay */}
                  <div className="absolute inset-0 bg-[#2C2623]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
                    <button
                      onClick={() => handleSetCoverImage(item.image.id)}
                      className={`p-2 rounded-full transition-colors cursor-pointer ${
                        selectedGalleryForPhotos.cover_image_id === item.image.id
                          ? "bg-[#C4A484] text-white hover:bg-[#C4A484]/90"
                          : "bg-white/95 text-stone-700 hover:bg-white hover:text-[#C4A484]"
                      }`}
                      title="Set as gallery cover/thumbnail"
                    >
                      <Star className={`w-4 h-4 ${selectedGalleryForPhotos.cover_image_id === item.image.id ? 'fill-white' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleCropExistingImage(item.image)}
                      className="p-2 bg-white/95 text-stone-700 hover:bg-white hover:text-[#C4A484] rounded-full transition-colors cursor-pointer"
                      title="Crop / Edit photo"
                    >
                      <Crop className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteImage(item.image.id)}
                      className="p-2 bg-white/95 rounded-full text-red-600 hover:bg-white transition-colors cursor-pointer"
                      title="Delete photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Meta details */}
                <div className="p-3 space-y-1">
                  <p className="text-[10px] text-[#2C2623] truncate font-medium">{item.image.title}</p>
                  <p className="text-[9px] uppercase tracking-wider font-semibold flex items-center gap-1">
                    {item.selected ? (
                      <span className="text-[#C4A484] flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Selected
                      </span>
                    ) : (
                      <span className="text-stone-400">Unselected</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
              multiSelect={pickerMultiSelect}
              onSelectMultiple={handleBulkAddFromLibrary}
              onSelect={handleAddFromLibrary} 
            />
          </div>
        </div>
      )}

      {/* Cover image picker modal */}
      {showCoverPicker && token && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#DCD0C0]/35 rounded-md p-6 max-w-4xl w-full shadow-lg space-y-4 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#DCD0C0]/20 pb-3">
              <h3 className="text-sm font-serif font-semibold text-[#2C2623]">Select Cover Image from Library</h3>
              <button onClick={() => setShowCoverPicker(false)} className="text-[#6E635F] hover:text-[#2C2623]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <MediaPicker token={token} onSelect={handleSetCoverFromLibrary} />
          </div>
        </div>
      )}

      {/* ZIP file picker modal */}
      {showZipPicker && token && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#DCD0C0]/35 rounded-md p-6 max-w-4xl w-full shadow-lg space-y-4 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#DCD0C0]/20 pb-3">
              <h3 className="text-sm font-serif font-semibold text-[#2C2623]">Select ZIP File from Library</h3>
              <button onClick={() => setShowZipPicker(false)} className="text-[#6E635F] hover:text-[#2C2623]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <MediaPicker 
              token={token} 
              allowedExtensions={[".zip"]} 
              onSelect={(media) => {
                setZipUrlInput(media.original_url);
                setShowZipPicker(false);
              }} 
            />
          </div>
        </div>
      )}

      {/* Free crop modal for sequential cropping */}
      {showCropper && cropperImageSrc && (
        <ImageCropper
          open={showCropper}
          imageSrc={cropperImageSrc}
          onCancel={() => {
            setShowCropper(false);
            setCropQueue([]);
            setCropQueueIndex(0);
            setCropperImageSrc("");
            setUploadProgress("");
            setCroppingExistingImage(null);
          }}
          onConfirm={handleCropConfirm}
          defaultTitle={croppingExistingImage?.title || cropQueue[cropQueueIndex]?.name?.substring(0, cropQueue[cropQueueIndex].name.lastIndexOf(".")) || ""}
          defaultAltText={croppingExistingImage?.alt_text || `${selectedGalleryForPhotos?.title || ""} photo proof`}
          confirmLabel="Crop & Upload"
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
            setIsCoverCrop(false);
          }}
          onConfirm={isCoverCrop ? handleCoverCropConfirm : handleLibraryCropConfirm}
          onUseOriginal={handleUseOriginalFromLibrary}
          defaultTitle={libraryMedia?.title || ""}
          defaultAltText={libraryMedia?.alt_text || `${selectedGalleryForPhotos?.title || ""} photo proof`}
          confirmLabel={isCoverCrop ? "Crop & Set Cover" : "Crop & Add"}
        />
      )}
      </>
    );
  }

  // Primary list pane
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#DCD0C0]/25 pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-light font-serif text-[#2C2623]">
            Client Galleries
          </h1>
          <p className="text-xs text-[#6E635F] font-light">
            Manage custom private photo proofs, secure entry passwords, and final download/selection permissions for clients.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest text-[#FCFAF7] bg-[#2C2623] hover:bg-[#352F2C] px-4 py-2.5 rounded-sm font-semibold transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Gallery</span>
        </button>
      </div>

      {/* Grid List */}
      {galleries.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-[#DCD0C0]/35 rounded-md bg-white">
          <p className="text-xs text-[#6E635F] font-light">No client galleries created yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#DCD0C0]/25 rounded-md overflow-hidden shadow-xs animate-fade-in">
          <table className="w-full text-left text-xs font-light text-[#6E635F] border-collapse">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#DCD0C0]/20 text-[#2C2623] font-semibold uppercase tracking-wider text-[9px]">
                <th className="p-4">Title & Slug</th>
                <th className="p-4">Client Username</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Selections</th>
                <th className="p-4 text-center">Downloads</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {galleries.map((g) => (
                <tr 
                  key={g.id} 
                  onClick={() => {
                    setSelectedGalleryForPhotos(g);
                    loadGalleryImages(g.id);
                  }}
                  className="border-b border-[#DCD0C0]/15 hover:bg-[#FAF8F5]/30 transition-colors cursor-pointer"
                >
                  <td className="p-4 space-y-0.5">
                    <p className="font-semibold text-[#2C2623]">{g.title}</p>
                    <p className="text-[10px] text-stone-400 font-mono">/{g.slug}</p>
                  </td>
                  <td className="p-4">{g.user?.email || "Unknown"}</td>
                  <td className="p-4">
                    <span className={`inline-block px-2 py-0.5 rounded-sm text-[9px] font-semibold uppercase tracking-wider ${
                      g.status === "active" ? "bg-green-50 text-green-700" : "bg-stone-50 text-stone-600"
                    }`}>
                      {g.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {g.selections_submitted ? (
                      <span className="inline-flex items-center text-green-600 font-semibold gap-0.5" title={g.selections_submitted_at ? new Date(g.selections_submitted_at).toLocaleString() : ""}>
                        <Check className="w-3.5 h-3.5" /> Yes
                      </span>
                    ) : (
                      <span className="text-stone-300">Pending</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    {g.can_download ? (
                      <span className="text-green-600 font-medium">Enabled</span>
                    ) : (
                      <span className="text-stone-400">Locked</span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setSelectedGalleryForPhotos(g);
                        loadGalleryImages(g.id);
                      }}
                      className="p-1 text-[#C4A484] hover:text-[#2C2623] transition-colors cursor-pointer"
                      title="Manage Photos"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(g)}
                      className="p-1 text-stone-400 hover:text-[#2C2623] transition-colors cursor-pointer"
                      title="Edit Settings"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(g.id)}
                      className="p-1 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Delete Gallery"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Popup */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-[#DCD0C0]/35 rounded-md p-6 max-w-md w-full shadow-lg space-y-6 animate-scale-in mx-4">
            <div className="flex items-center justify-between border-b border-[#DCD0C0]/20 pb-3">
              <h3 className="text-sm font-serif font-semibold text-[#2C2623] uppercase tracking-wider">
                {formMode === "create" ? "Create Client Gallery" : "Edit Client Gallery"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#6E635F] hover:text-[#2C2623]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase text-stone-400 font-semibold mb-1">
                  {formMode === "create" ? "Client Name *" : "Client Name / Gallery Title *"}
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Newborn Session - Smith Family"
                  className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-stone-400 font-semibold mb-1">
                  Slug Route (URL suffix) {formMode === "create" ? "(Optional)" : "*"}
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  required={formMode === "edit"}
                  placeholder={formMode === "create" ? "Auto-generated if left empty" : "e.g. smith-newborn"}
                  className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden font-mono"
                />
                <p className="text-[10px] text-stone-400 mt-1 leading-normal font-light">
                  This determines the URL structure (e.g., /client-galleries/slug). If left empty, it will be automatically generated from the Client Name.
                </p>
              </div>

              {formMode === "edit" && (
                <>
                  <div>
                    <label className="block text-[10px] uppercase text-stone-400 font-semibold mb-1">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden resize-none font-light"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-stone-400 font-semibold mb-1">Associated Client</label>
                    <input
                      type="text"
                      readOnly
                      value={galleries.find((g) => g.id === selectedGalleryId)?.user?.email || "No client user associated"}
                      className="w-full bg-[#FAF8F5] border border-[#DCD0C0]/25 text-stone-500 rounded-sm px-3 py-2 text-xs outline-hidden cursor-not-allowed font-medium"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-[10px] uppercase text-stone-400 font-semibold mb-1">
                  Access Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    autoComplete="new-password"
                    placeholder="Private gallery unlock key"
                    className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm pl-3 pr-10 py-2 text-xs outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-[#2C2623] cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Permissions & Status Toggles */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#DCD0C0]/15">
                <label className="flex items-center space-x-2 text-[#6E635F] cursor-pointer">
                  <input
                    type="checkbox"
                    name="can_download"
                    checked={formData.can_download}
                    onChange={handleCheckboxChange}
                    className="w-3.5 h-3.5 accent-[#C4A484]"
                  />
                  <span>Allow Downloads</span>
                </label>

                <label className="flex items-center space-x-2 text-[#6E635F] cursor-pointer">
                  <input
                    type="checkbox"
                    name="can_submit_selections"
                    checked={formData.can_submit_selections}
                    onChange={handleCheckboxChange}
                    className="w-3.5 h-3.5 accent-[#C4A484]"
                  />
                  <span>Enable Selections</span>
                </label>
              </div>

              {errorMsg && (
                <p className="text-[10px] text-red-600 font-light bg-red-50 p-2 rounded-sm border border-red-100 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </p>
              )}

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#DCD0C0]/25">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-[#DCD0C0]/40 text-[#6E635F] hover:text-[#2C2623] rounded-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center bg-[#2C2623] hover:bg-[#352F2C] text-[#FCFAF7] px-5 py-2 rounded-sm font-semibold transition-all disabled:opacity-50 min-w-[80px]"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Progress Simulation Overlay */}
      <UploadProgressOverlay isActive={uploadingFiles || addingFromLibrary} statusText={uploadStatusText || "Uploading custom assets..."} />
    </div>
  );
}
