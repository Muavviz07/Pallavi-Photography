"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, Calendar, Share2, Loader2, ArrowRight } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

interface BlogPostData {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  content: string;
  category: string;
  cover_image_url?: string;
  reading_time: number;
  published_at?: string;
  created_at: string;
  translations?: any[];
}

// Simple custom markdown-like renderer to parse titles, lists and paragraphs cleanly
function renderContent(text: string) {
  if (!text) return null;
  
  const lines = text.split("\n");
  return lines.map((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("###")) {
      return (
        <h4 key={idx} className="text-base font-medium tracking-wide text-[#2C2623] mt-6 mb-2 uppercase">
          {trimmed.slice(3).trim()}
        </h4>
      );
    }
    if (trimmed.startsWith("##")) {
      return (
        <h3 key={idx} className="text-xl font-light tracking-wide font-serif text-[#2C2623] mt-8 mb-3">
          {trimmed.slice(2).trim()}
        </h3>
      );
    }
    if (trimmed.startsWith("#")) {
      return (
        <h2 key={idx} className="text-2xl font-light tracking-wide font-serif text-[#2C2623] mt-10 mb-4">
          {trimmed.slice(1).trim()}
        </h2>
      );
    }
    if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
      return (
        <ul key={idx} className="list-disc pl-6 my-2 text-xs text-[#6E635F] font-light leading-relaxed">
          <li>{trimmed.slice(1).trim()}</li>
        </ul>
      );
    }
    if (trimmed === "") {
      return <div key={idx} className="h-4" />;
    }
    
    // Parse simple bold tag **text** inline
    const parts = line.split("**");
    if (parts.length > 1) {
      return (
        <p key={idx} className="text-xs text-[#6E635F] font-light leading-relaxed my-2.5">
          {parts.map((part, pIdx) => (pIdx % 2 === 1 ? <strong key={pIdx} className="font-semibold text-[#2C2623]">{part}</strong> : part))}
        </p>
      );
    }

    return (
      <p key={idx} className="text-xs text-[#6E635F] font-light leading-relaxed my-2.5">
        {line}
      </p>
    );
  });
}

export default function BlogDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [post, setPost] = useState<BlogPostData | null>(null);
  const [related, setRelated] = useState<BlogPostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState("EN");

  useEffect(() => {
    const stored = localStorage.getItem("lang") || "EN";
    setLang(stored);

    const handleLangChange = () => {
      setLang(localStorage.getItem("lang") || "EN");
    };

    window.addEventListener("languagechange", handleLangChange);
    return () => window.removeEventListener("languagechange", handleLangChange);
  }, []);

  const getLocalizedPost = (p: BlogPostData) => {
    if (lang === "EN" || !p.translations || p.translations.length === 0) {
      return {
        title: p.title,
        summary: p.summary,
        content: p.content,
      };
    }
    const t = p.translations.find((item: any) => item.language.toLowerCase() === lang.toLowerCase());
    return {
      title: t ? t.title : p.title,
      summary: t ? t.summary || p.summary : p.summary,
      content: t ? t.content : p.content,
    };
  };

  useEffect(() => {
    if (!slug) return;

    const fetchPostDetails = async () => {
      setLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        // Fetch main blog post
        const res = await fetch(`${apiUrl}/api/blogs/${slug}`);
        if (!res.ok) {
          throw new Error("Post not found");
        }
        const data = await res.json();
        setPost(data);

        // Fetch related posts (same category or recent)
        const relRes = await fetch(`${apiUrl}/api/blogs?category=${encodeURIComponent(data.category)}&limit=4`);
        if (relRes.ok) {
          const relData = await relRes.json();
          // Filter out current post
          setRelated(relData.filter((p: BlogPostData) => p.slug !== slug).slice(0, 3));
        }
      } catch (err) {
        console.error("Failed to load blog details", err);
        router.push("/our-blogs");
      } finally {
        setLoading(false);
      }
    };

    fetchPostDetails();
  }, [slug, router]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title,
        text: post?.summary,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FCFAF7] space-y-4">
          <Loader2 className="w-8 h-8 text-[#C4A484] animate-spin" />
          <p className="text-xs text-[#6E635F] font-light">Loading article details...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!post) return null;

  const displayImage = post.cover_image_url || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800";
  const dateStr = post.published_at
    ? new Date(post.published_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Draft";

  const { title: postTitle, summary: postSummary, content: postContent } = getLocalizedPost(post);

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#FCFAF7] pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Back button & Main Article */}
          <div className="lg:col-span-8 space-y-8">
            <Link
              href="/our-blogs"
              className="inline-flex items-center space-x-2 text-[10px] uppercase tracking-widest text-[#6E635F] hover:text-[#2C2623] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Journal</span>
            </Link>

            {/* Post Banner */}
            <div className="relative h-[450px] w-full rounded-sm overflow-hidden shadow-xs">
              <img
                src={displayImage}
                alt={postTitle}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Post Meta */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4 text-[10px] text-[#6E635F] uppercase tracking-wider">
                <span className="bg-[#FAF8F5] border border-[#DCD0C0]/40 px-2.5 py-1 rounded-sm">
                  {post.category}
                </span>
                <span className="flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{dateStr}</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{post.reading_time} min read</span>
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-light tracking-wide font-serif text-[#2C2623] leading-tight">
                {postTitle}
              </h1>

              {postSummary && (
                <p className="text-sm font-light text-[#6E635F] leading-relaxed italic border-l-2 border-[#C4A484] pl-4">
                  {postSummary}
                </p>
              )}
            </div>

            {/* Body Content */}
            <div className="pt-4 border-t border-[#DCD0C0]/20 prose prose-stone max-w-none">
              {renderContent(postContent)}
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-between pt-8 border-t border-[#DCD0C0]/20">
              <button
                onClick={handleShare}
                className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest text-[#C4A484] hover:text-[#2C2623] transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Story</span>
              </button>
            </div>
          </div>

          {/* Sidebar (Related Posts) */}
          <aside className="lg:col-span-4 space-y-8 lg:sticky lg:top-32 h-fit">
            <div className="bg-[#FAF8F5] border border-[#DCD0C0]/35 rounded-md p-6 space-y-6">
              <h3 className="text-xs uppercase tracking-widest font-semibold text-[#2C2623]">
                Related Stories
              </h3>
              
              {related.length === 0 ? (
                <p className="text-xs text-[#6E635F] font-light">No related stories found.</p>
              ) : (
                <div className="space-y-6">
                  {related.map((rel) => {
                    const relDate = rel.published_at
                      ? new Date(rel.published_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      : "Draft";
                    return (
                      <div key={rel.id} className="flex gap-4 items-start group">
                        <div className="w-16 h-16 shrink-0 relative rounded-sm overflow-hidden bg-stone-100">
                          <img
                            src={rel.cover_image_url || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200"}
                            alt={rel.title}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase tracking-wider text-[#6E635F]">
                            {relDate} • {rel.category}
                          </span>
                          <h4 className="text-xs font-light text-[#2C2623] hover:text-[#C4A484] font-serif leading-snug line-clamp-2">
                            <Link href={`/our-blogs/${rel.slug}`}>{rel.title}</Link>
                          </h4>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </>
  );
}
