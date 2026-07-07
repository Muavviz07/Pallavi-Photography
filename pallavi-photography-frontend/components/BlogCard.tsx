"use client";

import React from "react";
import Link from "next/link";

interface BlogCardProps {
  title: string;
  slug: string;
  excerpt?: string;
  thumbnail_url?: string;
  published_date?: string;
}

export default function BlogCard({
  title,
  slug,
  excerpt,
  thumbnail_url,
  published_date,
}: BlogCardProps) {
  // Use a reliable fallback if no thumbnail is provided
  const imageUrl =
    thumbnail_url ||
    "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=800";

  return (
    <article className="group flex flex-col justify-between space-y-5 text-left">
      <div className="space-y-5">
        {/* Cover Image in strict 3:4 Aspect Ratio */}
        <Link
          href={`/our-blogs/${slug}`}
          className="block relative w-full aspect-[3/4] overflow-hidden bg-stone-100 rounded-sm cursor-pointer shadow-xs"
        >
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-102"
            loading="lazy"
          />
        </Link>

        {/* Card Info */}
        <div className="space-y-3 pr-2">
          {/* Metadata */}
          {published_date && (
            <span className="text-[9px] uppercase tracking-[0.2em] text-stone-400 block">
              {new Date(published_date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )}

          {/* Title - serif, uppercase, wide letter spacing */}
          <Link href={`/our-blogs/${slug}`} className="block">
            <h4 className="text-lg md:text-xl font-light tracking-[0.16em] font-serif text-[#2C2623] hover:text-[#C4A484] transition-colors duration-300 leading-snug uppercase">
              {title}
            </h4>
          </Link>

          {/* Excerpt */}
          <p className="text-xs text-[#6E635F] leading-relaxed font-light font-sans line-clamp-3">
            {excerpt || "No description available."}
          </p>
        </div>
      </div>

      {/* Read More Link */}
      <div className="pt-2">
        <Link
          href={`/our-blogs/${slug}`}
          className="inline-block text-[10px] uppercase tracking-[0.25em] font-semibold text-[#2C2623] hover:text-[#C4A484] transition-colors duration-200 cursor-pointer border-b border-[#2C2623]/20 pb-0.5 hover:border-[#C4A484]"
        >
          Read More
        </Link>
      </div>
    </article>
  );
}
