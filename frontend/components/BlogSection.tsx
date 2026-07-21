"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/date";

interface BlogData {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  thumbnail_url?: string;
  published_date?: string;
}

const sectionTranslations = {
  EN: {
    title: "READ OUR BLOG",
    desc: "Create memories to treasure for generations",
    readMore: "Read More",
    loading: "Loading Journals...",
    noPosts: "No journal articles published yet.",
  },
  FR: {
    title: "LIRE NOTRE BLOG",
    desc: "Créer des souvenirs à chérir pour des générations",
    readMore: "Lire Plus",
    loading: "Chargement des articles...",
    noPosts: "Aucun article de blog publié pour le moment.",
  },
};

export default function BlogSection() {
  const [posts, setPosts] = useState<BlogData[]>([]);
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
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/api/blogs?limit=3`);
        if (res.ok) {
          const data = await res.json();
          setPosts(data);
        }
      } catch (err) {
        console.error("Failed to load homepage blogs", err);
      } finally {
        setLoading(false);
      }
    }
    loadPosts();
  }, []);

  const t = sectionTranslations[lang as "EN" | "FR"] || sectionTranslations.EN;

  return (
    <section className="py-24 bg-[#FCFAF7] border-b border-brand-border">
      <div className="max-w-[1360px] mx-auto px-6 md:px-8">
        
        {/* Section Header matching screenshot 2 */}
        <div className="text-center mb-16 space-y-4">
          <h3 
            className="text-3xl sm:text-4xl font-light tracking-[0.25em] font-serif text-[#2C2623] uppercase"
            style={{ fontWeight: 200 }}
          >
            {t.title}
          </h3>
          <p className="text-sm font-serif italic text-[#6E635F] leading-relaxed">
            {t.desc}
          </p>
        </div>

        {/* Content grid */}
        {loading ? (
          <div className="text-center py-12 text-xs uppercase tracking-widest text-[#C4A484] animate-pulse">
            {t.loading}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-xs text-stone-400 italic">
            {t.noPosts}
          </div>
        ) : (
          /* Grid of exactly 3 cards (3 cols on desktop, 1 col on mobile) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {posts.map((post) => {
              const cardImage =
                post.thumbnail_url ||
                "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=800";

              return (
                <article
                  key={post.id}
                  className="group flex flex-col justify-between space-y-5 text-left"
                >
                  <div className="space-y-5">
                    {/* Locked 3:4 Ratio Cover Image */}
                    <Link
                      href={`/our-blogs/${post.slug}`}
                      className="block relative w-full aspect-[3/4] overflow-hidden bg-stone-100 rounded-sm cursor-pointer shadow-xs"
                    >
                      <img
                        src={cardImage}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-102"
                        loading="lazy"
                      />
                    </Link>

                    {/* Text Area */}
                    <div className="space-y-3 pr-2">
                      {/* Publication Date */}
                      {post.published_date && (
                        <span className="text-[9px] uppercase tracking-[0.2em] text-stone-400 block">
                          {formatDate(post.published_date, lang.toLowerCase())}
                        </span>
                      )}

                      {/* Header in all-caps serif */}
                      <Link href={`/our-blogs/${post.slug}`} className="block">
                        <h4 className="text-lg md:text-xl font-light tracking-[0.16em] font-serif text-[#2C2623] hover:text-[#C4A484] transition-colors duration-300 leading-snug uppercase" style={{ fontWeight: 300 }}>
                          {post.title}
                        </h4>
                      </Link>

                      {/* Paragraph body excerpt */}
                      <p className="text-sm text-[#6E635F] leading-relaxed font-light font-sans line-clamp-3">
                        {post.excerpt || "No description available."}
                      </p>
                    </div>
                  </div>

                  {/* READ MORE Link */}
                  <div className="pt-2">
                    <Link
                      href={`/our-blogs/${post.slug}`}
                      className="inline-block text-[10px] uppercase tracking-[0.25em] font-semibold text-[#2C2623] hover:text-[#C4A484] transition-colors duration-200 cursor-pointer border-b border-[#2C2623]/20 pb-0.5 hover:border-[#C4A484]"
                    >
                      {t.readMore}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
