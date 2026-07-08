"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BreadcrumbsBanner from "@/components/common/BreadcrumbsBanner";
import { Loader2 } from "lucide-react";
import { formatDate } from "@/lib/date";

interface BlogData {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  body_content: string;
  thumbnail_url?: string;
  published_date?: string;
  is_published: boolean;
  meta_title?: string;
  meta_description?: string;
}

// Clean custom parser to parse markdown titles, quotes, lists, numbered headers and paragraphs
function renderBlogContent(text: string) {
  if (!text) return null;

  const lines = text.split("\n");
  let headingCounter = 0;

  return lines.map((line, idx) => {
    const trimmed = line.trim();

    // 1. Blockquote support (e.g. > Photography is...)
    if (trimmed.startsWith(">")) {
      return (
        <blockquote 
          key={idx} 
          className="border-y border-[#C4A484]/30 py-10 my-10 text-center max-w-2xl mx-auto relative font-serif italic text-lg sm:text-xl md:text-2xl text-[#2C2623]/90 tracking-wide leading-relaxed"
        >
          <span className="text-7xl text-[#C4A484]/25 font-serif absolute left-2 top-2 select-none pointer-events-none">“</span>
          <p className="px-12 md:px-16 inline-block">
            {trimmed.slice(1).trim()}
          </p>
          <span className="text-7xl text-[#C4A484]/25 font-serif absolute right-2 bottom-2 select-none pointer-events-none">”</span>
        </blockquote>
      );
    }

    // 2. Numbered Headers support (e.g. 1. WEAR WHAT FEELS LIKE YOU)
    const numberedHeaderMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numberedHeaderMatch) {
      headingCounter++;
      const titleText = numberedHeaderMatch[2];
      return (
        <h3 
          key={idx} 
          className="text-base sm:text-lg md:text-xl font-bold tracking-wide font-serif text-[#2C2623] mt-10 mb-4 uppercase"
          style={{ fontWeight: 700 }}
        >
          {headingCounter}. {titleText}
        </h3>
      );
    }

    // 2b. Standalone section titles
    const isHeading = 
      trimmed.length > 0 && 
      trimmed.length < 80 && 
      !trimmed.endsWith(".") && 
      !trimmed.endsWith(",") && 
      !trimmed.endsWith(":") && 
      !trimmed.startsWith(">") && 
      !trimmed.startsWith("-") && 
      !trimmed.startsWith("*") && 
      !trimmed.startsWith("#") && 
      !/^\d+\.\s+/.test(trimmed);

    if (isHeading) {
      headingCounter++;
      return (
        <h3 
          key={idx} 
          className="text-base sm:text-lg md:text-xl font-bold tracking-wide font-serif text-[#2C2623] mt-10 mb-4"
          style={{ fontWeight: 700 }}
        >
          {headingCounter}. {trimmed}
        </h3>
      );
    }

    // 3. Normal Markdown Headers
    if (trimmed.startsWith("###")) {
      return (
        <h4 key={idx} className="text-xs sm:text-sm font-semibold tracking-wider text-[#2C2623] mt-8 mb-3 uppercase">
          {trimmed.slice(3).trim()}
        </h4>
      );
    }
    if (trimmed.startsWith("##")) {
      return (
        <h3 key={idx} className="text-base sm:text-lg font-light tracking-wide font-serif text-[#2C2623] mt-10 mb-4">
          {trimmed.slice(2).trim()}
        </h3>
      );
    }
    if (trimmed.startsWith("#")) {
      return (
        <h2 key={idx} className="text-xl sm:text-2xl font-light tracking-wide font-serif text-[#2C2623] mt-12 mb-4">
          {trimmed.slice(1).trim()}
        </h2>
      );
    }

    // 4. Bullet lists
    if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
      return (
        <ul key={idx} className="list-disc pl-6 mb-4 text-xs text-[#6E635F] font-light leading-relaxed font-sans">
          <li>{trimmed.slice(1).trim()}</li>
        </ul>
      );
    }

    // 5. Empty spacer lines - return null to avoid double spacing
    if (trimmed === "") {
      return null;
    }

    // 6. Inline bold tags parser (**bold**)
    const parts = line.split("**");
    if (parts.length > 1) {
      return (
        <p key={idx} className="text-xs sm:text-sm text-[#6E635F] font-light leading-relaxed mb-4 font-sans">
          {parts.map((part, pIdx) => 
            pIdx % 2 === 1 ? (
              <strong key={pIdx} className="font-semibold text-[#2C2623]">{part}</strong>
            ) : (
              part
            )
          )}
        </p>
      );
    }

    // 7. Standard paragraph
    return (
      <p key={idx} className="text-xs sm:text-sm text-[#6E635F] font-light leading-relaxed mb-4 font-sans">
        {line}
      </p>
    );
  });
}

export default function BlogDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [post, setPost] = useState<BlogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState("en");

  useEffect(() => {
    setLang((localStorage.getItem("lang") || "EN").toLowerCase());
  }, []);

  useEffect(() => {
    if (!slug) return;

    const fetchPost = async () => {
      setLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/api/blogs/${slug}`);
        if (!res.ok) {
          throw new Error("Post not found");
        }
        const data = await res.json();
        setPost(data);
      } catch (err) {
        console.error("Failed to load blog details", err);
        router.push("/our-blogs");
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug, router]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FCFAF7] space-y-4">
          <Loader2 className="w-8 h-8 text-[#C4A484] animate-spin" />
          <p className="text-xs text-[#6E635F] font-light uppercase tracking-widest">Loading article...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!post) return null;

  // Use a reliable fallback if no thumbnail is provided
  const bannerImageUrl =
    post.thumbnail_url ||
    "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=1200";

  return (
    <>
      {/* Set page meta metadata dynamically */}
      <title>{post.meta_title || `${post.title} | Pallavi Photography`}</title>
      {post.meta_description && <meta name="description" content={post.meta_description} />}

      <Header />

      {/* Standardized Breadcrumbs Banner */}
      <BreadcrumbsBanner
        title="Our Blogs"
        paths={[
          { label: "Home", href: "/" },
          { label: "Our Blogs", href: "/our-blogs" },
          { label: post.title }
        ]}
      />

      <main className="min-h-screen bg-[#FCFAF7] pt-12 pb-0">

        {/* Content Container */}
        <div className="max-w-[1450px] mx-auto px-4 md:px-6 py-16 space-y-12">
          
          {/* 2. Blog Title - Centered & Serif */}
          <div className="text-center max-w-4xl mx-auto pt-4">
            <h1 
              className="text-2xl sm:text-4xl md:text-5xl font-light tracking-[0.2em] font-serif text-[#2C2623] uppercase leading-tight"
              style={{ fontWeight: 200 }}
            >
              {post.title}
            </h1>
            {post.published_date && (
              <span className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-[#C4A484] block mt-5 font-light">
                {formatDate(post.published_date, lang)}
              </span>
            )}
          </div>

          {/* 3. Locked 3:4 Ratio centered banner image */}
          <div className="w-full max-w-4xl mx-auto overflow-hidden bg-stone-100 rounded-sm shadow-md aspect-[3/4] relative">
            <img
              src={bannerImageUrl}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* 4. Blog Body Content */}
          <div className="max-w-5xl mx-auto py-8">
            {renderBlogContent(post.body_content)}
          </div>

        </div>

        {/* 5. Follow on Instagram call-out Banner */}
        <section className="py-24 bg-white text-center border-t border-b border-brand-border/60">
          <div className="space-y-4">
            <h3 
              className="text-2xl sm:text-3xl md:text-4xl tracking-[0.3em] font-serif text-brand-dark uppercase" 
              style={{ fontWeight: 300 }}
            >
              FOLLOW ME ON INSTAGRAM
            </h3>
            <a 
              href="https://instagram.com/Pallavivishk" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm sm:text-base font-serif italic text-brand-muted hover:text-brand-sage transition-colors tracking-wide block cursor-pointer"
              style={{ fontWeight: 300 }}
            >
              @ Pallavivishk
            </a>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}
