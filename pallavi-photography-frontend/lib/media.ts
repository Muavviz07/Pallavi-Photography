export interface MediaItem {
  id: string;
  filename: string;
  file_url: string;
  original_url: string;
  original_filename?: string;
  optimized_url?: string;
  thumbnail_url?: string;
  title?: string;
  description?: string;
  alt_text?: string;
  category?: string;
  usage_count: number;
  file_size?: number;
  created_at: string;
}

export interface MediaListResponse {
  items: MediaItem[];
  total: number;
  skip: number;
  limit: number;
}

export const MEDIA_CATEGORIES = [
  { value: "", label: "No category" },
  { value: "newborn", label: "Newborn" },
  { value: "family", label: "Family" },
  { value: "maternity", label: "Maternity" },
  { value: "children", label: "Children" },
  { value: "fine-art", label: "Fine Art" },
  { value: "nature", label: "Nature" },
];

export function getMediaPreviewUrl(media: Pick<MediaItem, "thumbnail_url" | "optimized_url" | "file_url" | "original_url">) {
  return media.thumbnail_url || media.optimized_url || media.file_url || media.original_url;
}

export async function uploadMediaFile(
  file: File,
  token: string,
  metadata?: { title?: string; description?: string; alt_text?: string }
): Promise<MediaItem> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const formData = new FormData();
  formData.append("file", file);
  if (metadata?.title) formData.append("title", metadata.title);
  if (metadata?.description) formData.append("description", metadata.description);
  if (metadata?.alt_text) formData.append("alt_text", metadata.alt_text);

  const response = await fetch(`${apiUrl}/api/media`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Upload failed");
  }

  return response.json();
}
