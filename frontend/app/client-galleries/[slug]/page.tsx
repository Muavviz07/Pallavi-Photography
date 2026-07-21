"use client";

import React, { useState, useEffect } from "react";
import ClientGalleryUnlock from "@/components/gallery/ClientGalleryUnlock";
import ClientGalleryView from "@/components/gallery/ClientGalleryView";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function ClientGalleryPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = React.use(params);
  const slug = resolvedParams.slug;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [meta, setMeta] = useState<any>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Check if token exists in sessionStorage on mount
  useEffect(() => {
    const savedToken = sessionStorage.getItem(`gallery_token_${slug}`);
    if (savedToken) {
      setToken(savedToken);
    } else {
      // Fetch metadata directly without token to see if it requires password
      fetchMetadata(null);
    }
  }, [slug]);

  // Fetch metadata again whenever the token changes
  useEffect(() => {
    if (token) {
      fetchMetadata(token);
    }
  }, [token]);

  const fetchMetadata = async (galleryToken: string | null) => {
    setLoading(true);
    setError("");

    try {
      const headers: Record<string, string> = {};
      if (galleryToken) {
        headers["X-Gallery-Token"] = galleryToken;
      }

      const res = await fetch(`${apiUrl}/api/client-galleries/${slug}`, { headers });
      
      if (!res.ok) {
        if (res.status === 401) {
          // Token expired or invalid, prompt password again
          setToken(null);
          sessionStorage.removeItem(`gallery_token_${slug}`);
          setMeta({ requires_password: true });
        } else if (res.status === 403) {
          setError("This gallery has expired or has been closed by the administrator.");
        } else {
          setError("Gallery not found or connection error.");
        }
        setLoading(false);
        return;
      }

      const data = await res.json();
      setMeta(data);
    } catch (err) {
      setError("Failed to connect to the backend API.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = (unlockedToken: string) => {
    sessionStorage.setItem(`gallery_token_${slug}`, unlockedToken);
    setToken(unlockedToken);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FCFAF7] space-y-4">
          <div className="w-8 h-8 border-2 border-[#C4A484] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-wider text-[#6E635F] font-light">
            Connecting Securely...
          </p>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FCFAF7] px-6 text-center space-y-4">
          <h2 className="text-xl font-light font-serif text-[#2C2623] uppercase tracking-widest">
            Gallery Restriction
          </h2>
          <p className="text-xs text-[#6E635F] font-light max-w-sm">
            {error}
          </p>
          <a
            href="/"
            className="text-[10px] uppercase tracking-widest text-[#C4A484] hover:text-[#2C2623] underline font-semibold"
          >
            Return to Homepage
          </a>
        </div>
        <Footer />
      </>
    );
  }

  // If password check is required, show the Password Unlock challenge page
  if (meta && meta.requires_password) {
    return (
      <ClientGalleryUnlock slug={slug} onUnlock={handleUnlock} />
    );
  }

  // If unlocked, stream full private grid gallery
  return (
    <>
      <Header />
      {meta && (
        <ClientGalleryView
          slug={slug}
          token={token || ""}
          meta={{
            id: meta.id,
            title: meta.title,
            description: meta.description,
            can_view: meta.can_view,
            can_upload: meta.can_upload,
            can_download: meta.can_download,
            can_download_zip: meta.can_download_zip,
            can_submit_selections: meta.can_submit_selections,
            selections_submitted: meta.selections_submitted,
            selections_submitted_at: meta.selections_submitted_at,
            download_zip_url: meta.download_zip_url,
          }}
        />
      )}
      <Footer />
    </>
  );
}
