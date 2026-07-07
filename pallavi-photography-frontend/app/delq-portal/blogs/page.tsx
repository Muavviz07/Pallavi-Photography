"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { fetchAPI } from "@/lib/api";
import { Loader2, Plus, Edit2, Trash2, X, Image as ImageIcon } from "lucide-react";
import MediaPicker from "@/components/media/MediaPicker";
import { MediaItem } from "@/lib/media";

interface BlogResponse {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  body_content: string;
  thumbnail_media_id?: string | null;
  thumbnail_url?: string | null;
  is_published: boolean;
  published_date?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminBlogs() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;

  const [blogs, setBlogs] = useState<BlogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedBlogId, setSelectedBlogId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    body_content: "",
    thumbnail_media_id: "",
    is_published: true,
    meta_title: "",
    meta_description: "",
  });

  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [slugModified, setSlugModified] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  // Load all blogs
  const loadBlogs = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchAPI("/api/admin/blogs", { token });
      setBlogs(data);
    } catch (err: any) {
      console.error("Failed to load blogs in admin console", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadBlogs();
    }
  }, [token]);

  // Slug generator helper
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // remove special chars
      .replace(/[\s-]+/g, "-") // replace spaces/hyphens with a single hyphen
      .trim();
  };

  // Sync title to slug if user hasn't typed in slug manually
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData((prev) => {
      const updated = { ...prev, title: val };
      if (!slugModified) {
        updated.slug = generateSlug(val);
      }
      return updated;
    });
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSlugModified(val !== "");
    setFormData((prev) => ({ ...prev, slug: val }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  // Open Create Form
  const handleOpenCreate = () => {
    setFormMode("create");
    setSelectedBlogId(null);
    setFormData({
      title: "",
      slug: "",
      excerpt: "",
      body_content: "",
      thumbnail_media_id: "",
      is_published: true,
      meta_title: "",
      meta_description: "",
    });
    setPreviewUrl("");
    setSlugModified(false);
    setErrorMsg("");
    setShowFormModal(true);
  };

  // Open Edit Form
  const handleOpenEdit = (blog: BlogResponse) => {
    setFormMode("edit");
    setSelectedBlogId(blog.id);
    setFormData({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt || "",
      body_content: blog.body_content,
      thumbnail_media_id: blog.thumbnail_media_id || "",
      is_published: blog.is_published,
      meta_title: blog.meta_title || "",
      meta_description: blog.meta_description || "",
    });
    setPreviewUrl(blog.thumbnail_url || "");
    setSlugModified(true);
    setErrorMsg("");
    setShowFormModal(true);
  };

  // Image Selection from MediaPicker
  const handleSelectMedia = (media: MediaItem) => {
    setFormData((prev) => ({
      ...prev,
      thumbnail_media_id: media.id,
    }));
    setPreviewUrl(media.optimized_url || media.original_url || media.file_url || "");
    setShowMediaPicker(false);
  };

  // Form Submit (Save / Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.slug || !formData.body_content) {
      setErrorMsg("Title, Slug, and Body Content are required.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const payload = {
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt || null,
        body_content: formData.body_content,
        thumbnail_media_id: formData.thumbnail_media_id || null,
        is_published: formData.is_published,
        meta_title: formData.meta_title || null,
        meta_description: formData.meta_description || null,
      };

      if (formMode === "create") {
        await fetchAPI("/api/admin/blogs", {
          method: "POST",
          token,
          body: JSON.stringify(payload),
        });
      } else {
        await fetchAPI(`/api/admin/blogs/${selectedBlogId}`, {
          method: "PUT",
          token,
          body: JSON.stringify(payload),
        });
      }
      setShowFormModal(false);
      loadBlogs();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save blog post.");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Delete Dialog
  const handleOpenDelete = (blog: BlogResponse) => {
    setSelectedBlogId(blog.id);
    setShowDeleteModal(true);
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!selectedBlogId || !token) return;
    setSubmitting(true);
    try {
      await fetchAPI(`/api/admin/blogs/${selectedBlogId}`, {
        method: "DELETE",
        token,
      });
      setShowDeleteModal(false);
      loadBlogs();
    } catch (err: any) {
      alert(err.message || "Failed to delete blog post.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200/50 pb-5">
        <div>
          <h2 className="text-xl font-semibold tracking-wide text-stone-800 font-serif uppercase">
            Blog Posts
          </h2>
          <p className="text-xs text-stone-500 font-light">
            Write, manage, and edit journal stories for Pallavi Photography
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-2 bg-[#2C2623] hover:bg-[#C4A484] text-white text-[10px] uppercase tracking-widest font-semibold px-4 py-2.5 rounded-sm transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Blog Post</span>
        </button>
      </div>

      {/* Blogs list table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="w-8 h-8 text-[#C4A484] animate-spin" />
          <p className="text-xs text-stone-500 font-light uppercase tracking-widest">
            Loading blog list...
          </p>
        </div>
      ) : blogs.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-stone-200 bg-white rounded-xs p-8">
          <p className="text-sm text-stone-500 font-serif italic mb-4">
            No blog posts published or drafted yet.
          </p>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center space-x-2 border border-[#2C2623] text-[#2C2623] hover:bg-[#2C2623] hover:text-white text-[10px] uppercase tracking-widest font-semibold px-4 py-2 rounded-xs transition-colors cursor-pointer"
          >
            Create Your First Post
          </button>
        </div>
      ) : (
        <div className="bg-white border border-stone-200/80 rounded-xs overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-[10px] uppercase tracking-widest font-semibold text-stone-600">
                  <th className="py-4 px-6 w-24">Cover</th>
                  <th className="py-4 px-6">Title</th>
                  <th className="py-4 px-6">Slug</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Created Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-light text-stone-700">
                {blogs.map((b) => (
                  <tr key={b.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="aspect-[3/4] w-16 overflow-hidden rounded-xs bg-stone-100 border border-stone-200">
                        <img
                          src={
                            b.thumbnail_url ||
                            "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=150"
                          }
                          alt={b.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="py-4 px-6 font-medium text-stone-800 uppercase tracking-wide font-serif max-w-[200px] truncate">
                      {b.title}
                    </td>
                    <td className="py-4 px-6 font-mono text-[10px] text-stone-500">
                      {b.slug}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-block text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-sm font-semibold border ${
                          b.is_published
                            ? "bg-[#C4A484]/10 border-[#C4A484]/30 text-[#C4A484]"
                            : "bg-stone-100 border-stone-200 text-stone-500"
                        }`}
                      >
                        {b.is_published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-stone-500">
                      {new Date(b.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex space-x-2">
                        <button
                          onClick={() => handleOpenEdit(b)}
                          className="p-2 text-stone-500 hover:text-stone-800 bg-stone-100 hover:bg-stone-200/60 rounded-xs transition-colors cursor-pointer"
                          title="Edit post"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(b)}
                          className="p-2 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xs transition-colors cursor-pointer"
                          title="Delete post"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE & EDIT FORM MODAL */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#FCFAF7] border border-stone-200 rounded-sm w-full max-w-4xl p-6 md:p-8 space-y-6 shadow-xl max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setShowFormModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div>
              <h3 className="text-lg font-serif font-semibold text-stone-800 uppercase tracking-widest border-b border-stone-200 pb-3">
                {formMode === "create" ? "Create New Blog Post" : "Edit Blog Post"}
              </h3>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-xs">
                {errorMsg}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Columns - Blog details */}
                <div className="md:col-span-2 space-y-4">
                  {/* Title */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-stone-600 font-semibold block">
                      Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleTitleChange}
                      required
                      placeholder="e.g. Your First Photo Session"
                      className="w-full bg-white border border-stone-300/80 rounded-xs px-3 py-2 text-xs text-stone-800 outline-hidden focus:border-[#C4A484] transition-colors"
                    />
                  </div>

                  {/* Slug */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-stone-600 font-semibold block">
                      Slug URL *
                    </label>
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleSlugChange}
                      required
                      placeholder="e.g. your-first-photo-session"
                      className="w-full bg-stone-50 border border-stone-300/80 rounded-xs px-3 py-2 text-xs font-mono text-stone-600 outline-hidden focus:border-[#C4A484] transition-colors"
                    />
                  </div>

                  {/* Excerpt */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase tracking-widest text-stone-600 font-semibold block">
                        Excerpt (100 - 150 characters)
                      </label>
                      <span className="text-[9px] text-stone-400">
                        {formData.excerpt.length} chars
                      </span>
                    </div>
                    <textarea
                      name="excerpt"
                      value={formData.excerpt}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="A short snippet to display on card grids..."
                      className="w-full bg-white border border-stone-300/80 rounded-xs px-3 py-2 text-xs text-stone-800 outline-hidden focus:border-[#C4A484] transition-colors resize-none"
                    />
                  </div>

                  {/* Body Content */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-stone-600 font-semibold block">
                      Body Content (Markdown format supported) *
                    </label>
                    <textarea
                      name="body_content"
                      value={formData.body_content}
                      onChange={handleInputChange}
                      rows={12}
                      required
                      placeholder="Write your story here... You can write headers, paragraphs, and list items. Use > prefix for blockquotes."
                      className="w-full bg-white border border-stone-300/80 rounded-xs px-3 py-2 text-xs text-stone-800 outline-hidden focus:border-[#C4A484] transition-colors font-mono"
                    />
                  </div>
                </div>

                {/* Right Column - Media / Settings */}
                <div className="space-y-6">
                  {/* Thumbnail / Cover Image */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-stone-600 font-semibold block">
                      Cover Image (Locked 3:4) *
                    </label>
                    
                    {formData.thumbnail_media_id ? (
                      <div className="relative aspect-[3/4] w-full bg-stone-100 border border-stone-300/60 rounded-xs overflow-hidden group shadow-xs">
                        <img
                          src={previewUrl}
                          alt="Cover preview"
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
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, thumbnail_media_id: "" }));
                              setPreviewUrl("");
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white text-[9px] uppercase tracking-widest px-2.5 py-1.5 rounded-sm font-semibold transition-colors cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowMediaPicker(true)}
                        className="flex flex-col items-center justify-center border-2 border-dashed border-stone-300/80 hover:border-[#C4A484] bg-stone-50 hover:bg-[#C4A484]/5 aspect-[3/4] w-full rounded-xs cursor-pointer transition-all duration-200 group p-4"
                      >
                        <ImageIcon className="w-7 h-7 text-stone-400 group-hover:text-[#C4A484] mb-2" />
                        <span className="text-[9px] uppercase tracking-widest text-stone-500 font-bold group-hover:text-[#C4A484]">
                          Choose from Media Library
                        </span>
                        <span className="text-[8px] text-stone-400 mt-1">
                          No direct file uploads
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Publish Status Toggle */}
                  <div className="bg-white border border-stone-200/80 p-4 rounded-xs space-y-3">
                    <h4 className="text-[10px] uppercase tracking-widest text-stone-600 font-semibold">
                      Publish Settings
                    </h4>
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="is_published"
                        name="is_published"
                        checked={formData.is_published}
                        onChange={handleCheckboxChange}
                        className="w-4 h-4 text-[#C4A484] border-stone-300 rounded-sm focus:ring-[#C4A484] cursor-pointer"
                      />
                      <label
                        htmlFor="is_published"
                        className="text-xs text-stone-700 font-light cursor-pointer select-none"
                      >
                        Publish immediately
                      </label>
                    </div>
                  </div>

                  {/* SEO Metadata Card */}
                  <div className="bg-white border border-stone-200/80 p-4 rounded-xs space-y-4">
                    <h4 className="text-[10px] uppercase tracking-widest text-stone-600 font-semibold border-b border-stone-100 pb-2">
                      SEO Settings (Optional)
                    </h4>
                    
                    {/* Meta Title */}
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest text-stone-500 font-medium block">
                        Meta Title
                      </label>
                      <input
                        type="text"
                        name="meta_title"
                        value={formData.meta_title}
                        onChange={handleInputChange}
                        placeholder="Search engine title..."
                        className="w-full bg-white border border-stone-300/80 rounded-xs px-2.5 py-1.5 text-xs text-stone-800 outline-hidden focus:border-[#C4A484] transition-colors"
                      />
                    </div>

                    {/* Meta Description */}
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest text-stone-500 font-medium block">
                        Meta Description
                      </label>
                      <textarea
                        name="meta_description"
                        value={formData.meta_description}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Search engine snippet description..."
                        className="w-full bg-white border border-stone-300/80 rounded-xs px-2.5 py-1.5 text-xs text-stone-800 outline-hidden focus:border-[#C4A484] transition-colors resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Action buttons */}
              <div className="flex justify-end gap-3 border-t border-stone-200 pt-5">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-600 text-[10px] uppercase tracking-widest font-semibold rounded-sm hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#2C2623] hover:bg-[#C4A484] text-white text-[10px] uppercase tracking-widest font-semibold rounded-sm transition-all shadow-xs flex items-center space-x-2 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-3 h-3 animate-spin text-white" />}
                  <span>{formMode === "create" ? "Save Post" : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#FCFAF7] border border-stone-200 rounded-sm w-full max-w-md p-6 space-y-6 shadow-xl relative">
            <div>
              <h3 className="text-base font-serif font-semibold text-stone-800 uppercase tracking-widest border-b border-stone-200 pb-3">
                Confirm Deletion
              </h3>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed font-light font-sans">
              Are you sure you want to delete this blog post? This action is permanent and cannot be undone. 
              <br />
              <span className="text-[10px] text-stone-400 italic">
                Note: The cover image will remain in the Media Library.
              </span>
            </p>

            <div className="flex justify-end gap-3 border-t border-stone-200 pt-4">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-stone-300 text-stone-600 text-[10px] uppercase tracking-widest font-semibold rounded-sm hover:bg-stone-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={submitting}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-[10px] uppercase tracking-widest font-semibold rounded-sm transition-all shadow-xs flex items-center space-x-2 cursor-pointer"
              >
                {submitting && <Loader2 className="w-3 h-3 animate-spin text-white" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MEDIA SELECTOR PICKER MODAL */}
      {showMediaPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-stone-200 rounded-sm w-full max-w-4xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto relative flex flex-col">
            <button
              onClick={() => setShowMediaPicker(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-serif font-semibold text-stone-800 uppercase tracking-widest border-b border-stone-200 pb-3 mb-4">
              Select Blog Cover Image
            </h3>

            <div className="overflow-y-auto flex-1 pr-1">
              <MediaPicker
                token={token}
                selectedId={formData.thumbnail_media_id}
                onSelect={handleSelectMedia}
                allowedExtensions={[".jpg", ".jpeg", ".png", ".webp"]}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
