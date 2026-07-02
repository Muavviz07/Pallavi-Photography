"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { fetchAPI } from "@/lib/api";
import { Loader2, TrendingUp, Sparkles, Database, ShieldAlert } from "lucide-react";

interface AnalyticsData {
  total_galleries: number;
  total_images: number;
  total_users: number;
}

export default function AdminAnalytics() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;

  const [stats, setStats] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const data = await fetchAPI("/api/admin/analytics", { token });
        setStats(data);
      } catch (err) {
        console.error("Failed to load admin analytics statistics", err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="w-8 h-8 text-[#C4A484] animate-spin" />
        <p className="text-xs text-[#6E635F] font-light">Loading database analytics...</p>
      </div>
    );
  }

  const role = (session?.user as any)?.role;
  if (session && role !== "admin" && role !== "super_admin") {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-500" />
        <h2 className="text-lg font-serif font-light text-brand-dark uppercase">Access Denied</h2>
        <p className="text-xs text-brand-muted max-w-sm text-center leading-relaxed">
          You do not have administrative privileges to view analytics. Please contact the administrator.
        </p>
      </div>
    );
  }

  // Calculate generic indicator ratios for mock visualization
  const galleryPercentage = Math.min(((stats?.total_galleries || 0) / 20) * 100, 100);
  const imagePercentage = Math.min(((stats?.total_images || 0) / 200) * 100, 100);
  const userPercentage = Math.min(((stats?.total_users || 0) / 30) * 100, 100);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="border-b border-[#DCD0C0]/25 pb-6">
        <h1 className="text-2xl font-light font-serif text-[#2C2623]">
          System Database Analytics
        </h1>
        <p className="text-xs text-[#6E635F] font-light mt-1">
          Monitor system metrics, evaluate data allocations, and analyze photo delivery volumes.
        </p>
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#DCD0C0]/25 rounded-md p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#6E635F]">Active Portals</span>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div className="space-y-1">
            <h2 className="text-3xl font-light font-serif text-[#2C2623]">{stats?.total_galleries || 0}</h2>
            <p className="text-[10px] text-stone-400">Created Client Portals</p>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-[#FAF8F5] rounded-full h-1.5 overflow-hidden">
            <div className="bg-[#C4A484] h-1.5 rounded-full transition-all duration-500" style={{ width: `${galleryPercentage}%` }} />
          </div>
        </div>

        <div className="bg-white border border-[#DCD0C0]/25 rounded-md p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#6E635F]">Storage Assets</span>
            <Database className="w-4 h-4 text-blue-500" />
          </div>
          <div className="space-y-1">
            <h2 className="text-3xl font-light font-serif text-[#2C2623]">{stats?.total_images || 0}</h2>
            <p className="text-[10px] text-stone-400">Optimized WebP Images</p>
          </div>
          <div className="w-full bg-[#FAF8F5] rounded-full h-1.5 overflow-hidden">
            <div className="bg-stone-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${imagePercentage}%` }} />
          </div>
        </div>

        <div className="bg-white border border-[#DCD0C0]/25 rounded-md p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#6E635F]">User Registrations</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="space-y-1">
            <h2 className="text-3xl font-light font-serif text-[#2C2623]">{stats?.total_users || 0}</h2>
            <p className="text-[10px] text-stone-400">Total Accounts</p>
          </div>
          <div className="w-full bg-[#FAF8F5] rounded-full h-1.5 overflow-hidden">
            <div className="bg-amber-400 h-1.5 rounded-full transition-all duration-500" style={{ width: `${userPercentage}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
