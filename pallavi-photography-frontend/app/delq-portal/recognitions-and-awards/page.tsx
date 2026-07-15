"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { fetchAPI } from "@/lib/api";
import { Loader2, Plus, Edit2, Trash2, X, Image as ImageIcon } from "lucide-react";
import MediaPicker from "@/components/media/MediaPicker";
import { MediaItem } from "@/lib/media";

interface AwardResponse {
  id: string;
  title: string;
  description?: string | null;
  image_media_id: string;
  image_url: string;
  order_position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminRecognitionsAndAwards() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;

  const [awards, setAwards] = useState<AwardResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedAwardId, setSelectedAwardId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_media_id: "",
    order_position: 0,
    is_active: true,
  });

  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const loadAwards = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchAPI("/api/admin/recognitions-and-awards", { token });
      setAwards(data);
    } catch (err: any) {
      console.error("Failed to load awards in admin console", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadAwards();
    }
  }, [token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "order_position" ? parseInt(value) || 0 : value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleMediaSelect = (item: MediaItem) => {
    setFormData((prev) => ({
      ...prev,
      image_media_id: item.id,
    }));
    setPreviewUrl(item.optimized_url || item.original_url);
    setShowMediaPicker(false);
  };

  const handleOpenCreate = () => {
    setFormMode("create");
    setSelectedAwardId(null);
    setFormData({
      title: "",
      description: "",
      image_media_id: "",
      order_position: awards.length > 0 ? Math.max(...awards.map(a => a.order_position)) + 1 : 0,
      is_active: true,
    });
    setPreviewUrl("");
    setShowFormModal(true);
  };

  const handleOpenEdit = (award: AwardResponse) => {
    setFormMode("edit");
    setSelectedAwardId(award.id);
    setFormData({
      title: award.title,
      description: award.description || "",
      image_media_id: award.image_media_id,
      order_position: award.order_position,
      is_active: award.is_active,
    });
    setPreviewUrl(award.image_url);
    setShowFormModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image_media_id) {
      alert("Please select an award image from the Media Library.");
      return;
    }

    setSubmitting(true);
    try {
      let savedAward;
      if (formMode === "create") {
        savedAward = await fetchAPI("/api/admin/recognitions-and-awards", {
          method: "POST",
          token,
          body: JSON.stringify(formData),
        });
      } else {
        savedAward = await fetchAPI(`/api/admin/recognitions-and-awards/${selectedAwardId}`, {
          method: "PUT",
          token,
          body: JSON.stringify(formData),
        });
      }

      // Automatically update translation files on the frontend
      if (savedAward && savedAward.id) {
        try {
          await fetch("/api/admin/update-translation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              namespace: "recognitions",
              bulk: true,
              updates: {
                [`award_title_${savedAward.id}`]: formData.title,
                [`award_desc_${savedAward.id}`]: formData.description || "",
              }
            })
          });
        } catch (err) {
          console.error("Failed to automatically update awards translations", err);
        }
      }

      setShowFormModal(false);
      loadAwards();
    } catch (err: any) {
      alert(err.message || "Failed to save award.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDelete = (award: AwardResponse) => {
    setSelectedAwardId(award.id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAwardId || !token) return;
    setSubmitting(true);
    try {
      await fetchAPI(`/api/admin/recognitions-and-awards/${selectedAwardId}`, {
        method: "DELETE",
        token,
      });
      setShowDeleteModal(false);
      loadAwards();
    } catch (err: any) {
      alert(err.message || "Failed to delete award.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (award: AwardResponse) => {
    if (!token) return;
    try {
      await fetchAPI(`/api/admin/recognitions-and-awards/${award.id}`, {
        method: "PUT",
        token,
        body: JSON.stringify({ is_active: !award.is_active }),
      });
      loadAwards();
    } catch (err: any) {
      alert("Failed to toggle status.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200/50 pb-5">
        <div>
          <h2 className="text-xl font-semibold tracking-wide text-stone-800 font-serif uppercase">
            Recognitions & Awards
          </h2>
          <p className="text-xs text-stone-500 font-light">
            Manage photography recognitions, certificates, and press features shown on the Awards page
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-2 bg-[#2C2623] hover:bg-[#C4A484] text-white text-[10px] uppercase tracking-widest font-semibold px-4 py-2.5 rounded-sm transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Award</span>
        </button>
      </div>

      {/* List table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="w-8 h-8 text-[#C4A484] animate-spin" />
          <p className="text-xs text-stone-500 font-light uppercase tracking-widest">
            Loading awards...
          </p>
        </div>
      ) : awards.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-stone-200 bg-white rounded-xs p-8">
          <p className="text-sm text-stone-500 font-serif italic mb-4">
            No awards or recognitions configured yet.
          </p>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center space-x-2 border border-[#2C2623] text-[#2C2623] hover:bg-[#2C2623] hover:text-white text-[10px] uppercase tracking-widest font-semibold px-4 py-2 rounded-xs transition-colors cursor-pointer"
          >
            Create Your First Award
          </button>
        </div>
      ) : (
        <div className="bg-white border border-stone-200/80 rounded-xs overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-[10px] uppercase tracking-widest font-semibold text-stone-600">
                  <th className="py-4 px-6 w-24">Preview</th>
                  <th className="py-4 px-6">Title</th>
                  <th className="py-4 px-6">Description</th>
                  <th className="py-4 px-6 w-24">Order</th>
                  <th className="py-4 px-6 w-28">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-light text-stone-700">
                {awards.map((award) => (
                  <tr key={award.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="w-12 h-12 overflow-hidden rounded-xs bg-stone-100 border border-stone-200">
                        <img
                          src={award.image_url}
                          alt={award.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="py-4 px-6 font-medium text-stone-800 uppercase tracking-wide font-serif max-w-[200px] truncate">
                      {award.title}
                    </td>
                    <td className="py-4 px-6 text-stone-500 max-w-[250px] truncate">
                      {award.description || <em className="text-stone-300">None</em>}
                    </td>
                    <td className="py-4 px-6 font-mono text-[10px]">
                      {award.order_position}
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleToggleActive(award)}
                        className={`inline-block text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-sm font-semibold border transition-all cursor-pointer ${
                          award.is_active
                            ? "bg-[#C4A484]/10 border-[#C4A484]/30 text-[#C4A484] hover:bg-[#C4A484]/20"
                            : "bg-stone-100 border-stone-200 text-stone-500 hover:bg-stone-200/50"
                        }`}
                      >
                        {award.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(award)}
                        className="inline-flex items-center justify-center p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-sm cursor-pointer transition-colors"
                        title="Edit Award"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenDelete(award)}
                        className="inline-flex items-center justify-center p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-sm cursor-pointer transition-colors"
                        title="Delete Award"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Award Edit/Create Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-[#FCFAF7] border border-stone-200/80 rounded-xs shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-200/60 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-stone-800 font-serif">
                {formMode === "create" ? "Create Award" : "Edit Award"}
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Left Column - Details */}
                <div className="md:col-span-7 space-y-4">
                  {/* Title */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-stone-500 font-semibold block">
                      Award Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Lens Culture Portrait Award"
                      className="w-full bg-white border border-stone-300/80 rounded-xs px-3 py-2 text-xs text-stone-800 outline-hidden focus:border-[#C4A484] transition-colors"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-stone-500 font-semibold block">
                      Description (Optional)
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="e.g. Winner in Fine Art Portrait Category, 2025"
                      className="w-full bg-white border border-stone-300/80 rounded-xs px-3 py-2 text-xs text-stone-800 outline-hidden focus:border-[#C4A484] transition-colors resize-none font-sans font-light"
                    />
                  </div>

                  {/* Order Position */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-stone-500 font-semibold block">
                      Order Position
                    </label>
                    <input
                      type="number"
                      name="order_position"
                      value={formData.order_position}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full bg-white border border-stone-300/80 rounded-xs px-3 py-2 text-xs text-stone-800 outline-hidden focus:border-[#C4A484] transition-colors"
                    />
                  </div>
                </div>

                {/* Right Column - Media & Settings */}
                <div className="md:col-span-5 space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-stone-500 font-semibold block">
                      Award Image *
                    </label>
                    {formData.image_media_id ? (
                      <div className="relative aspect-3/4 w-full bg-stone-100 border border-stone-300/60 rounded-xs overflow-hidden group shadow-xs">
                        <img
                          src={previewUrl}
                          alt="Award Preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-2">
                          <button
                            type="button"
                            onClick={() => setShowMediaPicker(true)}
                            className="bg-white/90 hover:bg-white text-stone-800 text-[9px] uppercase tracking-widest px-2.5 py-1.5 rounded-sm font-semibold transition-colors cursor-pointer"
                          >
                            Replace
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowMediaPicker(true)}
                        className="flex flex-col items-center justify-center border-2 border-dashed border-stone-300/80 hover:border-[#C4A484] bg-stone-50 hover:bg-[#C4A484]/5 aspect-3/4 w-full rounded-xs cursor-pointer transition-all duration-200 group p-4"
                      >
                        <ImageIcon className="w-7 h-7 text-stone-400 group-hover:text-[#C4A484] mb-2" />
                        <span className="text-[9px] uppercase tracking-widest text-stone-500 font-bold group-hover:text-[#C4A484] text-center">
                          Choose Image
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center space-x-3 bg-white border border-stone-200/80 p-4 rounded-xs">
                    <input
                      type="checkbox"
                      id="is_active"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleCheckboxChange}
                      className="w-4 h-4 text-[#C4A484] border-stone-300 rounded-sm focus:ring-[#C4A484] cursor-pointer"
                    />
                    <label
                      htmlFor="is_active"
                      className="text-xs text-stone-700 font-light cursor-pointer select-none"
                    >
                      Make award active
                    </label>
                  </div>
                </div>
              </div>

              {/* Actions footer */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-stone-200/60">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="bg-stone-200 hover:bg-stone-300 text-stone-800 text-[10px] uppercase tracking-widest font-semibold px-4 py-2.5 rounded-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#2C2623] hover:bg-[#C4A484] text-white text-[10px] uppercase tracking-widest font-semibold px-4 py-2.5 rounded-xs transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Saving..." : "Save Award"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
          <div className="bg-[#FCFAF7] border border-stone-200/80 rounded-xs shadow-xl max-w-md w-full p-6 space-y-6">
            <div className="space-y-2">
              <h3 className="text-base font-semibold uppercase tracking-widest text-stone-800 font-serif">
                Delete Award Entry
              </h3>
              <p className="text-xs text-stone-500 font-light leading-relaxed">
                Are you sure you want to permanently delete this award entry? This action is irreversible and the background image will remain in the Media Library.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="bg-stone-200 hover:bg-stone-300 text-stone-800 text-[10px] uppercase tracking-widest font-semibold px-4 py-2 rounded-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={submitting}
                className="bg-red-600 hover:bg-red-700 text-white text-[10px] uppercase tracking-widest font-semibold px-4 py-2 rounded-xs transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Picker Modal */}
      {showMediaPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xs shadow-xl max-w-4xl w-full max-h-[85vh] p-6 flex flex-col relative border border-stone-200">
            <button
              onClick={() => setShowMediaPicker(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-stone-800 font-serif mb-4">
              Select Award Image
            </h3>
            <div className="flex-1 overflow-y-auto">
              <MediaPicker token={token} onSelect={handleMediaSelect} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
