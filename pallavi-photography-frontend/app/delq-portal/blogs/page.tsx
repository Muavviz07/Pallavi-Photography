"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { fetchAPI } from "@/lib/api";
import { Loader2, Plus, Edit2, Trash2, X, ShieldAlert, Image as ImageIcon } from "lucide-react";
import MediaPicker from "@/components/media/MediaPicker";
import { MediaItem } from "@/lib/media";

interface BlogPostResponse {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  content: string;
  category: string;
  cover_image_url?: string;
  reading_time: number;
  published: boolean;
  created_at: string;
}

const CATEGORIES = ["Tips & Guides", "Styling", "Locations", "Stories"];

export default function AdminBlogs() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;

  const [posts, setPosts] = useState<BlogPostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    summary: "",
    content: "",
    category: CATEGORIES[0],
    cover_image_url: "",
    reading_time: 5,
    published: false,
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [showCoverPicker, setShowCoverPicker] = useState(false);

  const handleSelectCover = (media: MediaItem) => {
    setFormData((prev) => ({
      ...prev,
      cover_image_url: media.file_url || media.optimized_url || media.original_url,
    }));
    setShowCoverPicker(false);
  };

  const loadPosts = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchAPI("/api/blogs/admin/all", { token });
      setPosts(data);
    } catch (err) {
      console.error("Failed to load blog posts in admin panel", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadPosts();
    }
  }, [token]);

  const handleOpenCreate = () => {
    setFormMode("create");
    setSelectedPostId(null);
    setFormData({
      title: "",
      slug: "",
      summary: "",
      content: "",
      category: CATEGORIES[0],
      cover_image_url: "",
      reading_time: 5,
      published: false,
    });
    setErrorMsg("");
    setShowModal(true);
  };

  const handleOpenEdit = (p: BlogPostResponse) => {
    setFormMode("edit");
    setSelectedPostId(p.id);
    setFormData({
      title: p.title,
      slug: p.slug,
      summary: p.summary || "",
      content: p.content,
      category: p.category,
      cover_image_url: p.cover_image_url || "",
      reading_time: p.reading_time,
      published: p.published,
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
    if (!formData.title || !formData.slug || !formData.content) {
      setErrorMsg("Please fill out required fields.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      if (formMode === "create") {
        await fetchAPI("/api/blogs", {
          method: "POST",
          token,
          body: JSON.stringify(formData),
        });
      } else {
        await fetchAPI(`/api/blogs/admin/${selectedPostId}`, {
          method: "PUT",
          token,
          body: JSON.stringify(formData),
        });
      }
      setShowModal(false);
      loadPosts();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save blog post.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;
    try {
      await fetchAPI(`/api/blogs/admin/${id}`, {
        method: "DELETE",
        token,
      });
      loadPosts();
    } catch (err) {
      console.error("Failed to delete blog post", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="w-8 h-8 text-[#C4A484] animate-spin" />
        <p className="text-xs text-[#6E635F] font-light">Loading blog manager...</p>
      </div>
    );
  }

  const role = (session?.user as any)?.role;
  if (session && role !== "admin" && role !== "super_admin") {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-500" />
        <h2 className="text-lg font-serif font-light text-brand-dark uppercase">Access Denied</h2>
        <p className="text-xs text-brand-muted max-w-sm text-center leading-relaxed">
          You do not have administrative privileges to manage blogs. Please contact the administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#DCD0C0]/25 pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-light font-serif text-[#2C2623]">
            Blog Journal Manager
          </h1>
          <p className="text-xs text-[#6E635F] font-light mt-1">
            Write guides, locations, styling, and session preparation insights for client education and SEO optimization.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest text-[#FCFAF7] bg-[#2C2623] hover:bg-[#352F2C] px-4 py-2.5 rounded-sm font-semibold transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Article</span>
        </button>
      </div>

      {/* List */}
      {posts.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-[#DCD0C0]/35 rounded-md bg-white">
          <p className="text-xs text-[#6E635F] font-light">No articles written yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#DCD0C0]/25 rounded-md overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs font-light text-[#6E635F] border-collapse">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#DCD0C0]/20 text-[#2C2623] font-semibold uppercase tracking-wider text-[9px]">
                <th className="p-4">Title & Slug</th>
                <th className="p-4">Category</th>
                <th className="p-4">Status</th>
                <th className="p-4">Reading Time</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} className="border-b border-[#DCD0C0]/15 hover:bg-[#FAF8F5]/30 transition-colors">
                  <td className="p-4 space-y-0.5 max-w-xs">
                    <p className="font-semibold text-[#2C2623] line-clamp-1">{p.title}</p>
                    <p className="text-[10px] text-stone-400 font-mono">/{p.slug}</p>
                  </td>
                  <td className="p-4">{p.category}</td>
                  <td className="p-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-sm text-[9px] font-semibold uppercase tracking-wider ${
                      p.published ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                    }`}>
                      {p.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="p-4">{p.reading_time} min</td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-1 text-stone-400 hover:text-[#2C2623] transition-colors"
                      title="Edit Post"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-1 text-stone-400 hover:text-red-600 transition-colors"
                      title="Delete Post"
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

      {/* Modal Editor */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs overflow-y-auto p-4">
          <div className="bg-white border border-[#DCD0C0]/35 rounded-md p-6 max-w-2xl w-full shadow-lg space-y-6 animate-fade-in my-8">
            <div className="flex items-center justify-between border-b border-[#DCD0C0]/20 pb-3">
              <h3 className="text-sm font-serif font-semibold text-[#2C2623]">
                {formMode === "create" ? "Write Blog Article" : "Edit Blog Article"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#6E635F] hover:text-[#2C2623]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-stone-400 font-semibold mb-1">Article Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Newborn Session Prep Guide"
                    className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-stone-400 font-semibold mb-1">Slug Route *</label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. newborn-prep-guide"
                    className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-stone-400 font-semibold mb-1">Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-stone-400 font-semibold mb-1">Reading Time (minutes)</label>
                  <input
                    type="number"
                    name="reading_time"
                    value={formData.reading_time}
                    onChange={handleInputChange}
                    min={1}
                    className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="block text-[10px] uppercase text-stone-400 font-semibold">Featured Cover Image</label>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCoverPicker(true)}
                      className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#2C2623] border border-[#2C2623] hover:bg-[#2C2623] hover:text-white px-3 py-2 rounded-sm font-semibold transition-all"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      Select from Library
                    </button>
                    <input
                      type="text"
                      name="cover_image_url"
                      value={formData.cover_image_url}
                      onChange={handleInputChange}
                      placeholder="Or paste image URL"
                      className="flex-1 min-w-[200px] bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden"
                    />
                  </div>
                  {formData.cover_image_url && (
                    <div className="w-32 aspect-video rounded-sm overflow-hidden border border-[#DCD0C0]/30 bg-stone-100">
                      <img
                        src={formData.cover_image_url}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-stone-400 font-semibold mb-1">Summary Excerpt</label>
                <textarea
                  name="summary"
                  value={formData.summary}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="Short outline summarizing the article post..."
                  className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden resize-none font-light"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-stone-400 font-semibold mb-1">Body Content *</label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  rows={10}
                  required
                  placeholder="Write post content. Support # Headers, - Lists, and **Bold** tags."
                  className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/40 rounded-sm px-3 py-2 text-xs outline-hidden resize-y font-light leading-relaxed"
                />
              </div>

              <div className="pt-2 border-t border-[#DCD0C0]/15">
                <label className="flex items-center space-x-2 text-[#6E635F] cursor-pointer">
                  <input
                    type="checkbox"
                    name="published"
                    checked={formData.published}
                    onChange={handleCheckboxChange}
                    className="w-3.5 h-3.5 accent-[#C4A484]"
                  />
                  <span>Publish immediately</span>
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

      {showCoverPicker && token && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#DCD0C0]/35 rounded-md p-6 max-w-4xl w-full shadow-lg space-y-4 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#DCD0C0]/20 pb-3">
              <h3 className="text-sm font-serif font-semibold text-[#2C2623]">Select Cover Image</h3>
              <button onClick={() => setShowCoverPicker(false)} className="text-[#6E635F] hover:text-[#2C2623]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <MediaPicker token={token} onSelect={handleSelectCover} />
          </div>
        </div>
      )}
    </div>
  );
}
