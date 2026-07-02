"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { fetchAPI } from "@/lib/api";
import { 
  Loader2, Plus, Edit2, Trash2, Check, X, ShieldAlert, 
  Image as ImageIcon, Upload, ArrowLeft, Eye, CheckCircle2, UserCheck
} from "lucide-react";

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

  // Photos Management Pane States
  const [selectedGalleryForPhotos, setSelectedGalleryForPhotos] = useState<ClientGalleryResponse | null>(null);
  const [galleryImages, setGalleryImages] = useState<ImageItem[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

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
      can_download: false,
      can_submit_selections: true,
      can_upload: false,
      can_download_zip: false,
    });
    setErrorMsg("");
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
      password: "", // Hide/keep same password unless set
      status: g.status,
      can_download: g.can_download,
      can_submit_selections: g.can_submit_selections,
      can_upload: g.can_upload || false,
      can_download_zip: g.can_download_zip || false,
    });
    setErrorMsg("");
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
    if (!formData.title || !formData.slug || !formData.user_id) {
      setErrorMsg("Please fill out required fields.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      if (formMode === "create") {
        await fetchAPI("/api/admin/galleries", {
          method: "POST",
          token,
          body: JSON.stringify(formData),
        });
      } else {
        const updatePayload: any = { ...formData };
        if (!formData.password) delete updatePayload.password;
        
        await fetchAPI(`/api/admin/galleries/${selectedGalleryId}`, {
          method: "PUT",
          token,
          body: JSON.stringify(updatePayload),
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

  // Image upload handles multiple file selection
  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedGalleryForPhotos) return;

    setUploadingFiles(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Uploading ${i + 1}/${files.length}: ${file.name}...`);
        
        const dataPayload = new FormData();
        dataPayload.append("file", file);
        dataPayload.append("title", file.name.substring(0, file.name.lastIndexOf(".")) || file.name);
        dataPayload.append("alt_text", `${selectedGalleryForPhotos.title} photo proof`);

        const res = await fetch(`${apiUrl}/api/client-galleries/${selectedGalleryForPhotos.id}/images/upload`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: dataPayload
        });

        if (!res.ok) {
          console.error(`Failed to upload ${file.name}`);
        }
      }
      setUploadProgress("");
      loadGalleryImages(selectedGalleryForPhotos.id);
    } catch (err) {
      console.error("Upload process encountered errors", err);
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!selectedGalleryForPhotos || !confirm("Are you sure you want to delete this photo from the gallery?")) return;
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

          <div className="relative">
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

                  {/* Actions cover overlay */}
                  <div className="absolute inset-0 bg-[#2C2623]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
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
                <th className="p-4">Client User</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Selections</th>
                <th className="p-4 text-center">Downloads</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {galleries.map((g) => (
                <tr key={g.id} className="border-b border-[#DCD0C0]/15 hover:bg-[#FAF8F5]/30 transition-colors">
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
                  <td className="p-4 text-right space-x-2">
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
                <label className="block text-[10px] uppercase text-stone-400 font-semibold mb-1">Gallery Title *</label>
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
                <label className="block text-[10px] uppercase text-stone-400 font-semibold mb-1">Slug Route (URL suffix) *</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. smith-newborn"
                  className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden font-mono"
                />
              </div>

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
                <label className="block text-[10px] uppercase text-stone-400 font-semibold mb-1">Associate Client User *</label>
                <select
                  name="user_id"
                  value={formData.user_id}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-stone-400 font-semibold mb-1">
                  Access Password {formMode === "edit" && "(Leave blank to keep current)"}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={formMode === "create"}
                  placeholder="Private gallery unlock key"
                  className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden"
                />
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
    </div>
  );
}
