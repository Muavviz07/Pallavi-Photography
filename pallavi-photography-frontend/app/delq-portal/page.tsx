"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { fetchAPI } from "@/lib/api";
import { Loader2, Users, FolderHeart, Calendar, Heart, AlertTriangle } from "lucide-react";

interface AnalyticsData {
  total_galleries: number;
  total_images: number;
  total_users: number;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-10 animate-pulse">
      <div className="space-y-2">
        <div className="h-2.5 w-16 bg-[#DCD0C0]/25 rounded"></div>
        <div className="h-8 w-64 bg-[#DCD0C0]/25 rounded"></div>
        <div className="h-4 w-full max-w-[65ch] bg-[#DCD0C0]/25 rounded mt-2"></div>
      </div>
      
      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-[#DCD0C0]/25 rounded-md p-6 flex items-center justify-between shadow-xs">
            <div className="space-y-2 flex-1">
              <div className="h-2 w-20 bg-[#DCD0C0]/25 rounded"></div>
              <div className="h-7 w-12 bg-[#DCD0C0]/25 rounded mt-1"></div>
            </div>
            <div className="p-3 bg-[#FCFAF7] rounded-sm w-12 h-12 bg-[#DCD0C0]/20"></div>
          </div>
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <div className="space-y-4">
        <div className="h-3 w-28 bg-[#DCD0C0]/25 rounded"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-[#DCD0C0]/10 border border-[#DCD0C0]/15 rounded-sm"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminOverview() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;
  const userRole = (session?.user as any)?.role;
  const [signOutTriggered, setSignOutTriggered] = useState(false);

  // Fetch stats using React Query for automatic caching & deduplication
  const { data: stats, isLoading, error } = useQuery<AnalyticsData, Error>({
    queryKey: ["admin-analytics"],
    queryFn: () => fetchAPI("/api/admin/analytics", { token }),
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes caching
  });

  // Handle account deletions or permission revocations gracefully
  useEffect(() => {
    if (error) {
      const errMsg = error.message || "";
      if (
        errMsg.includes("no longer exists") ||
        errMsg.includes("User not found") ||
        errMsg.includes("410") ||
        errMsg.includes("credentials") ||
        errMsg.includes("privileges") ||
        errMsg.includes("403")
      ) {
        if (!signOutTriggered) {
          setSignOutTriggered(true);
          import("next-auth/react").then(({ signOut }) => {
            signOut({ callbackUrl: "/login?error=SessionExpired" });
          });
        }
      }
    }
  }, [error, signOutTriggered]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4 max-w-md mx-auto text-center">
        <div className="p-4 bg-red-50 rounded-full text-red-500 mb-2">
          <AlertTriangle className="w-12 h-12" />
        </div>
        <h1 className="text-xl font-light font-serif text-[#2C2623]">Access Terminated</h1>
        <p className="text-xs text-[#6E635F] font-light">
          {error.message || "Failed to load admin dashboard statistics. Your account may have been disabled or your session expired."}
        </p>
        <button
          onClick={() => {
            import("next-auth/react").then(({ signOut }) => {
              signOut({ callbackUrl: "/login" });
            });
          }}
          className="mt-2 px-6 py-2.5 bg-[#2C2623] hover:bg-[#C4A484] text-white text-xs uppercase tracking-widest font-semibold transition-all duration-300 rounded-sm shadow-sm cursor-pointer"
        >
          Return to Login
        </button>
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
        <p className="text-[#6E635F] text-xs font-light max-w-[70ch] leading-relaxed">
          Manage your client photo delivery portal, review booking requests, organize blog posts, and review user accounts.
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className={`grid grid-cols-1 ${userRole === "super_admin" ? "md:grid-cols-3" : "md:grid-cols-2"} gap-6`}>
        <div className="bg-white border border-[#DCD0C0]/25 rounded-md p-6 flex items-center justify-between shadow-xs hover:border-[#C4A484]/45 transition-colors duration-300">
          <div className="space-y-1">
            <span className="text-[9px] uppercase tracking-wider text-[#6E635F]">Client Galleries</span>
            <h2 className="text-2xl font-light font-serif text-[#2C2623]">{stats?.total_galleries || 0}</h2>
          </div>
          <div className="p-3 bg-[#FCFAF7] rounded-sm text-[#C4A484]">
            <FolderHeart className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-[#DCD0C0]/25 rounded-md p-6 flex items-center justify-between shadow-xs hover:border-[#C4A484]/45 transition-colors duration-300">
          <div className="space-y-1">
            <span className="text-[9px] uppercase tracking-wider text-[#6E635F]">Total Images</span>
            <h2 className="text-2xl font-light font-serif text-[#2C2623]">{stats?.total_images || 0}</h2>
          </div>
          <div className="p-3 bg-[#FCFAF7] rounded-sm text-[#C4A484]">
            <Heart className="w-6 h-6" />
          </div>
        </div>

        {userRole === "super_admin" && (
          <div className="bg-white border border-[#DCD0C0]/25 rounded-md p-6 flex items-center justify-between shadow-xs hover:border-[#C4A484]/45 transition-colors duration-300">
            <div className="space-y-1">
              <span className="text-[9px] uppercase tracking-wider text-[#6E635F]">Active Users</span>
              <h2 className="text-2xl font-light font-serif text-[#2C2623]">{stats?.total_users || 0}</h2>
            </div>
            <div className="p-3 bg-[#FCFAF7] rounded-sm text-[#C4A484]">
              <Users className="w-6 h-6" />
            </div>
          </div>
        )}
      </div>

      {/* Quick Links Section */}
      {userRole === "super_admin" && (
        <div className="space-y-4">
          <h3 className="text-xs uppercase tracking-widest font-semibold text-[#2C2623]">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs font-light tracking-wide text-[#6E635F]">
            <Link
              href="/delq-portal/galleries"
              className="p-4 border border-[#DCD0C0]/35 rounded-sm hover:border-[#C4A484] hover:bg-white text-center transition-all bg-[#FAF8F5] duration-200"
            >
              Create Client Gallery
            </Link>
            <Link
              href="/delq-portal/bookings"
              className="p-4 border border-[#DCD0C0]/35 rounded-sm hover:border-[#C4A484] hover:bg-white text-center transition-all bg-[#FAF8F5] duration-200"
            >
              Review Bookings
            </Link>
            <Link
              href="/delq-portal/blogs"
              className="p-4 border border-[#DCD0C0]/35 rounded-sm hover:border-[#C4A484] hover:bg-white text-center transition-all bg-[#FAF8F5] duration-200"
            >
              Write Blog Post
            </Link>
            <Link
              href="/delq-portal/users"
              className="p-4 border border-[#DCD0C0]/35 rounded-sm hover:border-[#C4A484] hover:bg-white text-center transition-all bg-[#FAF8F5] duration-200"
            >
              Manage User Roles
            </Link>
            <Link
              href="/delq-portal/super-admin"
              className="p-4 border border-[#C4A484]/45 text-[#C4A484] rounded-sm hover:border-[#C4A484] hover:bg-white text-center transition-all bg-[#C4A484]/5 font-semibold duration-200"
            >
              Configure Permissions
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
