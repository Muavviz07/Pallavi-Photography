"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { fetchAPI } from "@/lib/api";
import { Loader2, Users, FolderHeart, Calendar, Heart } from "lucide-react";

interface AnalyticsData {
  total_galleries: number;
  total_images: number;
  total_users: number;
}

export default function AdminOverview() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = (session as any)?.accessToken;
    if (!token) return;

    const loadStats = async () => {
      try {
        const data = await fetchAPI("/api/admin/analytics", { token });
        setStats(data);
      } catch (err) {
        console.error("Failed to load admin analytics", err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [session]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="w-8 h-8 text-[#C4A484] animate-spin" />
        <p className="text-xs text-[#6E635F] font-light">Loading overview stats...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <span className="text-[10px] uppercase tracking-[0.35em] text-[#C4A484] font-semibold block">
          Welcome back
        </span>
        <h1 className="text-3xl font-light tracking-wide font-serif text-[#2C2623]">
          Admin Console Overview
        </h1>
        <p className="text-[#6E635F] text-xs font-light">
          Manage your client photo delivery portal, review booking requests, organize blog posts, and review user accounts.
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#DCD0C0]/25 rounded-md p-6 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[9px] uppercase tracking-wider text-[#6E635F]">Client Galleries</span>
            <h2 className="text-2xl font-light font-serif text-[#2C2623]">{stats?.total_galleries || 0}</h2>
          </div>
          <div className="p-3 bg-[#FCFAF7] rounded-sm text-[#C4A484]">
            <FolderHeart className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-[#DCD0C0]/25 rounded-md p-6 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[9px] uppercase tracking-wider text-[#6E635F]">Total Images</span>
            <h2 className="text-2xl font-light font-serif text-[#2C2623]">{stats?.total_images || 0}</h2>
          </div>
          <div className="p-3 bg-[#FCFAF7] rounded-sm text-[#C4A484]">
            <Heart className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-[#DCD0C0]/25 rounded-md p-6 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[9px] uppercase tracking-wider text-[#6E635F]">Active Users</span>
            <h2 className="text-2xl font-light font-serif text-[#2C2623]">{stats?.total_users || 0}</h2>
          </div>
          <div className="p-3 bg-[#FCFAF7] rounded-sm text-[#C4A484]">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Quick Links Section */}
      <div className="space-y-4">
        <h3 className="text-xs uppercase tracking-widest font-semibold text-[#2C2623]">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-light tracking-wide text-[#6E635F]">
          <Link
            href="/delq-portal/galleries"
            className="p-4 border border-[#DCD0C0]/35 rounded-sm hover:border-[#C4A484] hover:bg-white text-center transition-all bg-[#FAF8F5]"
          >
            Create Client Gallery
          </Link>
          <Link
            href="/delq-portal/bookings"
            className="p-4 border border-[#DCD0C0]/35 rounded-sm hover:border-[#C4A484] hover:bg-white text-center transition-all bg-[#FAF8F5]"
          >
            Review Bookings
          </Link>
          <Link
            href="/delq-portal/blogs"
            className="p-4 border border-[#DCD0C0]/35 rounded-sm hover:border-[#C4A484] hover:bg-white text-center transition-all bg-[#FAF8F5]"
          >
            Write Blog Post
          </Link>
          <Link
            href="/delq-portal/users"
            className="p-4 border border-[#DCD0C0]/35 rounded-sm hover:border-[#C4A484] hover:bg-white text-center transition-all bg-[#FAF8F5]"
          >
            Manage User Roles
          </Link>
        </div>
      </div>
    </div>
  );
}
