export interface MediaItem {
  id: string;
  filename: string;
  file_url: string;
  original_url: string;
  s3_key?: string;
  s3_url?: string;
  image_type?: string;
  client_id?: string;
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

export function resolveMediaUrl(url?: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${apiUrl}${cleanPath}`;
}

/**
 * Get media preview URL with proper fallbacks
 * Handles: S3 URLs, proxy URLs, and local URLs
 */
export const getMediaPreviewUrl = (media: any): string => {
  if (!media) return "/placeholder.png";

  if (typeof media === "string") {
    return resolveMediaUrl(media.startsWith("/") || media.startsWith("http") ? media : `/api/media/proxy/${media}`);
  }

  if (media.s3_url) {
    if (media.s3_url.includes("/api/media/proxy")) {
      return resolveMediaUrl(media.s3_url);
    }
    if (media.id && typeof media.id === "string") {
      return resolveMediaUrl(`/api/media/proxy/${media.id}`);
    }
    return resolveMediaUrl(media.s3_url);
  }

  if (media.file_url) {
    return resolveMediaUrl(media.file_url);
  }

  if (media.original_url) {
    return resolveMediaUrl(media.original_url);
  }

  if (media.id && typeof media.id === "string") {
    return resolveMediaUrl(`/api/media/proxy/${media.id}`);
  }

  return "/placeholder.png";
};

/**
 * Get image by ID from database
 * Used by pages that only have image ID (hero slider, etc)
 */
export const getImageById = async (imageId: string) => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const response = await fetch(`${apiUrl}/api/media?limit=200`);
    if (!response.ok) throw new Error("Failed to fetch media");

    const data = await response.json();
    const items = data.items || data.images || [];
    const image = items.find((img: any) => img.id === imageId);

    return image || null;
  } catch (error) {
    console.error("Failed to get image by ID:", error);
    return null;
  }
};

export async function uploadMediaFile(
  file: File,
  token: string,
  metadata?: { title?: string; description?: string; alt_text?: string; image_type?: string; client_id?: string }
): Promise<MediaItem> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const formData = new FormData();
  formData.append("file", file);
  if (metadata?.title) formData.append("title", metadata.title);
  if (metadata?.description) formData.append("description", metadata.description);
  if (metadata?.alt_text) formData.append("alt_text", metadata.alt_text);
  if (metadata?.image_type) formData.append("image_type", metadata.image_type);
  if (metadata?.client_id) formData.append("client_id", metadata.client_id);

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
