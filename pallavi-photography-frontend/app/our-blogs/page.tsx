"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Search, Loader2 } from "lucide-react";
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

const CATEGORIES = ["All", "Tips & Guides", "Styling", "Locations", "Stories"];

export default function BlogsPage() {
  const [posts, setPosts] = useState<BlogPostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
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

  const getLocalizedPost = (post: BlogPostData) => {
    if (lang === "EN" || !post.translations || post.translations.length === 0) {
      return {
        title: post.title,
        summary: post.summary,
      };
    }
    const t = post.translations.find((item: any) => item.language.toLowerCase() === lang.toLowerCase());
    return {
      title: t ? t.title : post.title,
      summary: t ? t.summary || post.summary : post.summary,
    };
  };

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        let url = `${apiUrl}/api/blogs?limit=50`;
        
        const params = [];
        if (search) params.push(`search=${encodeURIComponent(search)}`);
        if (activeCategory !== "All") params.push(`category=${encodeURIComponent(activeCategory)}`);
        
        if (params.length > 0) {
          url += `&${params.join("&")}`;
        }

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setPosts(data);
        }
      } catch (err) {
        console.error("Failed to load blog posts", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchPosts();
    }, 300); // Debounce search

    return () => clearTimeout(timer);
  }, [search, activeCategory]);

  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-[#FCFAF7] pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-[10px] uppercase tracking-[0.35em] text-[#C4A484] font-semibold block">
              Photography Journal
            </span>
            <h1 className="text-4xl md:text-5xl font-light tracking-wide font-serif text-[#2C2623]">
              Stories, Tips & Inspiration
            </h1>
            <p className="text-[#6E635F] text-sm font-light leading-relaxed">
              Explore styling preparation guidelines, outdoor newborn session guides, locations, and capturing authentic Swiss family stories.
            </p>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-[#DCD0C0]/20 pb-8">
            {/* Category Tags */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 text-[10px] uppercase tracking-widest rounded-xs border transition-all cursor-pointer ${
                    activeCategory === cat
                      ? "bg-[#2C2623] text-[#FCFAF7] border-[#2C2623]"
                      : "bg-[#FCFAF7] text-[#6E635F] border-[#DCD0C0]/40 hover:border-[#C4A484]/60"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full max-w-xs">
              <input
                type="text"
                placeholder="Search journal..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#DCD0C0]/40 rounded-sm pl-9 pr-4 py-2.5 text-xs text-[#2C2623] placeholder-[#6E635F]/60 outline-hidden focus:border-[#C4A484] transition-colors"
              />
              <Search className="absolute left-3.5 top-3 w-3.5 h-3.5 text-[#6E635F]/60" />
            </div>
          </div>

          {/* Posts Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <Loader2 className="w-8 h-8 text-[#C4A484] animate-spin" />
              <p className="text-xs text-[#6E635F] font-light">Loading stories...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-[#DCD0C0]/40 rounded-lg bg-[#FAF8F5]/50">
              <p className="text-sm text-[#6E635F] font-light">No articles match your selection.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {posts.map((post) => {
                const displayImage = post.cover_image_url || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800";
                const dateStr = post.published_at
                  ? new Date(post.published_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Draft";

                const { title: postTitle, summary: postSummary } = getLocalizedPost(post);

                return (
                  <article
                    key={post.id}
                    className="bg-[#FCFAF7] border border-[#DCD0C0]/25 rounded-xs overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col h-full"
                  >
                    <div className="h-48 w-full relative overflow-hidden bg-stone-100">
                      <img
                        src={displayImage}
                        alt={postTitle}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-103"
                      />
                      <span className="absolute top-4 left-4 bg-[#FCFAF7]/90 text-[9px] uppercase tracking-widest text-[#2C2623] px-2 py-1 rounded-sm font-medium">
                        {post.category}
                      </span>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[9px] text-[#6E635F] uppercase tracking-wider">
                          <span>{dateStr}</span>
                          <span>•</span>
                          <span>{post.reading_time} min read</span>
                        </div>
                        <h2 className="text-lg font-light tracking-wide font-serif text-[#2C2623] hover:text-[#C4A484] transition-colors leading-snug">
                          <Link href={`/our-blogs/${post.slug}`}>{postTitle}</Link>
                        </h2>
                        {postSummary && (
                          <p className="text-xs text-[#6E635F] leading-relaxed font-light line-clamp-3">
                            {postSummary}
                          </p>
                        )}
                      </div>

                      <div className="pt-2">
                        <Link
                          href={`/our-blogs/${post.slug}`}
                          className="inline-flex items-center space-x-1.5 text-[9px] uppercase tracking-widest text-[#C4A484] font-semibold hover:text-[#2C2623] transition-colors"
                        >
                          <span>Read Full Story</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </>
  );
}
