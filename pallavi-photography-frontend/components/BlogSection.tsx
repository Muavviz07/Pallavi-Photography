"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { api } from "@/lib/api";

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

export default function BlogSection() {
  const [posts, setPosts] = useState<BlogPostData[]>([]);
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

  useEffect(() => {
    async function loadPosts() {
      try {
        const res = await api.get<BlogPostData[]>("/blogs?limit=3");
        setPosts(res);
      } catch (err) {
        console.error("Failed to load homepage blogs", err);
      } finally {
        setLoading(false);
      }
    }
    loadPosts();
  }, []);

  const getLocalizedPost = (post: BlogPostData) => {
    if (lang === "EN" || !post.translations || post.translations.length === 0) {
      return {
        title: post.title,
        summary: post.summary || post.content.slice(0, 140) + "...",
      };
    }
    const t = post.translations.find((item: any) => item.language.toLowerCase() === lang.toLowerCase());
    return {
      title: t ? t.title : post.title,
      summary: t ? t.summary || post.summary || post.content.slice(0, 140) + "..." : post.summary || post.content.slice(0, 140) + "...",
    };
  };

  return (
    <section className="py-24 bg-brand-bg border-b border-brand-border">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12">
        
        {/* Header Title */}
        <div className="text-center mb-16 space-y-4">
          <span className="text-[10px] uppercase tracking-[0.3em] text-brand-sage font-semibold block">
            Journal & Notes
          </span>
          <h3 className="text-3xl sm:text-4xl font-light tracking-wide font-serif text-brand-dark uppercase">
            Read Our Blog
          </h3>
          <p className="text-xs text-brand-muted max-w-xl mx-auto font-light leading-relaxed">
            Create memories to treasure for generations
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-xs uppercase tracking-widest text-brand-sage animate-pulse">
            Loading Latest Journals...
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-xs text-brand-muted italic">
            No journal articles published yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {posts.map((post) => {
              const { title, summary } = getLocalizedPost(post);
              return (
                <article
                  key={post.id}
                  className="bg-brand-cream border border-brand-border rounded-xs overflow-hidden flex flex-col justify-between hover:shadow-xl transition-all duration-300"
                >
                  <div className="space-y-4">
                    {/* Card Cover image */}
                    <div className="h-56 w-full relative overflow-hidden bg-stone-200 border-b border-brand-border">
                      <img
                        src={post.cover_image_url || "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=600"}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-102"
                      />
                      <span className="absolute top-4 left-4 bg-brand-bg/90 border border-brand-border/40 text-[9px] uppercase tracking-widest text-brand-dark px-2.5 py-1 rounded-sm font-semibold">
                        {post.category}
                      </span>
                    </div>

                    {/* Card text content */}
                    <div className="p-6 md:p-8 space-y-3">
                      <div className="flex items-center space-x-2 text-[9px] text-brand-muted uppercase tracking-wider">
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{post.reading_time} Min Read</span>
                      </div>
                      
                      <h4 className="text-lg font-light tracking-wide font-serif text-brand-dark hover:text-brand-sage transition-colors leading-snug uppercase">
                        {title}
                      </h4>
                      
                      <p className="text-xs text-brand-muted leading-relaxed font-light line-clamp-3">
                        {summary}
                      </p>
                    </div>
                  </div>

                  {/* Read More button */}
                  <div className="p-6 md:p-8 pt-0">
                    <Link
                      href={`/our-blogs/${post.slug}`}
                      className="inline-flex items-center space-x-2 text-[10px] uppercase tracking-widest text-brand-sage font-semibold hover:text-brand-dark transition-colors duration-150"
                    >
                      <span>Read More</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* View all button */}
        <div className="text-center pt-16">
          <Link
            href="/our-blogs"
            className="inline-flex items-center space-x-2 border border-brand-dark/25 hover:border-brand-dark px-10 py-3.5 text-xs font-serif uppercase tracking-widest transition-all duration-300 font-medium hover:bg-brand-dark hover:text-white rounded-sm"
          >
            <span>View All Blogs</span>
            <BookOpen className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </section>
  );
}
