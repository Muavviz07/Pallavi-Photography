"use client";

import React, { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BlogCard from "@/components/BlogCard";
import BreadcrumbsBanner from "@/components/common/BreadcrumbsBanner";
import { Loader2 } from "lucide-react";

interface BlogData {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  thumbnail_url?: string;
  published_date?: string;
  is_published: boolean;
}

import { useTranslation } from "@/components/LanguageProvider";

export default function BlogsListPage() {
  const [posts, setPosts] = useState<BlogData[]>([]);
  const [loading, setLoading] = useState(true);
  const { t: translate, lang } = useTranslation("blogs");

  const t = {
    title: translate("title", "READ OUR BLOG"),
    desc: translate("desc", "Create memories to treasure for generations"),
    loading: translate("loading", "Loading journals..."),
    noPosts: translate("noPosts", "No journal articles published yet."),
  };

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        // Fetch up to 3 most recent published blogs
        const res = await fetch(`${apiUrl}/api/blogs?limit=3`);
        if (res.ok) {
          const data = await res.json();
          setPosts(data);
        }
      } catch (err) {
        console.error("Failed to load blogs list", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  return (
    <>
      <Header />

      {/* Standardized Breadcrumbs Banner */}
      <BreadcrumbsBanner
        title="Our Blogs"
        paths={[
          { label: "Home", href: "/" },
          { label: "Our Blogs" }
        ]}
      />
      
      <main className="min-h-screen bg-[#FCFAF7] pt-12 pb-24">
        <div className="max-w-[1250px] mx-auto px-6 md:px-12">

          {/* Loading state */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <Loader2 className="w-8 h-8 text-[#C4A484] animate-spin" />
              <p className="text-xs text-[#6E635F] font-light uppercase tracking-widest">{t.loading}</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-stone-200 rounded-sm">
              <p className="text-sm text-[#6E635F] font-serif italic">{t.noPosts}</p>
            </div>
          ) : (
            /* Responsive Bento-like clean Grid: 3 cols desktop, 2 cols tablet, 1 col mobile */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-16">
              {posts.map((post) => (
                <BlogCard
                  key={post.id}
                  title={post.title}
                  slug={post.slug}
                  excerpt={post.excerpt}
                  thumbnail_url={post.thumbnail_url}
                  published_date={post.published_date}
                />
              ))}
            </div>
          )}

        </div>
      </main>
      
      <Footer />
    </>
  );
}
