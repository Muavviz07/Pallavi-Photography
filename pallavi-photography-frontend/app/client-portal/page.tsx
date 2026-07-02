"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Folder, Clock, Calendar, CheckCircle, ArrowRight, User, Settings, LogOut, ChevronRight } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

interface GalleryResponse {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: string;
  expiry_date: string | null;
  selections_submitted: boolean;
  selections_submitted_at: string | null;
}

export default function ClientPortalPage() {
  const { data: session, status } = useSession();
  const [galleries, setGalleries] = useState<GalleryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    if (status === "authenticated" && session?.accessToken) {
      fetchClientGalleries();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, session]);

  const fetchClientGalleries = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${apiUrl}/api/client-galleries`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (!res.ok) {
        setError("Failed to load assigned galleries.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setGalleries(data);
    } catch (err) {
      setError("Failed to connect to the backend server.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirectTo: "/login" });
  };

  if (status === "loading" || loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FCFAF7] space-y-4">
          <div className="w-8 h-8 border-2 border-[#C4A484] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-wider text-[#6E635F] font-light">
            Loading Client Workspace...
          </p>
        </div>
        <Footer />
      </>
    );
  }

  if (status === "unauthenticated") {
    return (
      <>
        <Header />
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FCFAF7] px-6 text-center space-y-5">
          <h2 className="text-2xl font-light font-serif text-[#2C2623] uppercase tracking-widest">
            Client Login Required
          </h2>
          <p className="text-xs text-[#6E635F] font-light max-w-xs">
            Please log in with your client credentials to access your private photography dashboard.
          </p>
          <Link
            href="/login"
            className="inline-block text-xs uppercase tracking-widest text-[#FCFAF7] bg-[#2C2623] hover:bg-[#352F2C] px-8 py-3 rounded-sm font-medium transition-all shadow-xs"
          >
            Log In
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      
      <main className="flex-1 bg-[#FCFAF7] pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Panel: Profile Quick Summary */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#FAF8F5] border border-[#DCD0C0]/50 rounded-md p-8 space-y-6 shadow-xs">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-[#F5EFEB] border border-[#DCD0C0]/35 flex items-center justify-center text-[#C4A484]">
                  <User className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-sm font-semibold text-[#2C2623] uppercase tracking-wider">
                    Client Portal
                  </h3>
                  <p className="text-xs text-[#6E635F] font-mono truncate max-w-[180px]" title={session?.user?.email || ""}>
                    {session?.user?.email}
                  </p>
                </div>
              </div>

              <div className="w-full h-[1px] bg-[#EAE4DC]" />

              <nav className="flex flex-col space-y-2 text-xs font-medium uppercase tracking-wider text-[#6E635F]">
                <Link
                  href="/client-portal"
                  className="flex items-center justify-between px-3 py-2.5 rounded-sm bg-[#F5EFEB] text-[#2C2623]"
                >
                  <span className="flex items-center space-x-2">
                    <Folder className="w-4 h-4 text-[#C4A484]" />
                    <span>My Galleries</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/client-portal/settings"
                  className="flex items-center justify-between px-3 py-2.5 rounded-sm hover:bg-[#F5EFEB] hover:text-[#2C2623] transition-colors"
                >
                  <span className="flex items-center space-x-2">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </nav>

              <div className="pt-4">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 text-xs uppercase tracking-widest text-[#2C2623] border border-[#2C2623]/20 hover:border-[#2C2623] py-2.5 rounded-sm transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel: Galleries Feed */}
          <div className="lg:col-span-8 space-y-8">
            <div className="space-y-2 border-b border-[#DCD0C0]/25 pb-4">
              <h2 className="text-2xl font-light tracking-widest font-serif uppercase text-[#2C2623]">
                Your Galleries
              </h2>
              <p className="text-xs text-[#6E635F] font-light">
                Here are the private photography collections assigned to your account. Click on a gallery to review pictures and submit selections.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-xs text-red-600 p-4 rounded-sm">
                {error}
              </div>
            )}

            {galleries.length === 0 ? (
              <div className="text-center py-20 bg-[#FAF8F5] border border-[#DCD0C0]/20 rounded-md space-y-3">
                <Folder className="w-8 h-8 text-[#C4A484] mx-auto opacity-60 animate-bounce" />
                <h4 className="text-sm font-serif font-light text-[#2C2623] uppercase tracking-wider">
                  No Galleries Assigned
                </h4>
                <p className="text-xs text-[#6E635F] font-light max-w-sm mx-auto">
                  We are currently organizing your session proofs. Once uploaded, your galleries will appear here automatically. You will receive an email invite once ready!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {galleries.map((gallery) => (
                  <Link
                    key={gallery.id}
                    href={`/client-galleries/${gallery.slug}`}
                    className="group bg-[#FAF8F5] border border-[#DCD0C0]/35 rounded-md p-6 hover:shadow-md hover:border-[#C4A484]/40 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <span className="text-[10px] uppercase tracking-widest text-[#C4A484] font-semibold">
                          Assigned proofs
                        </span>
                        
                        {/* Status tag */}
                        <span className={`text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-sm font-medium ${
                          gallery.status === "active"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {gallery.status}
                        </span>
                      </div>
                      
                      <div className="space-y-1.5">
                        <h3 className="text-lg font-light font-serif text-[#2C2623] group-hover:text-[#C4A484] transition-colors leading-snug">
                          {gallery.title}
                        </h3>
                        <p className="text-xs text-[#6E635F] leading-relaxed font-light line-clamp-2">
                          {gallery.description || "Review and select your favorite proofs."}
                        </p>
                      </div>
                    </div>

                    <div className="pt-6">
                      <div className="w-full h-[1px] bg-[#EAE4DC] mb-4" />
                      <div className="flex items-center justify-between text-[10px] text-[#6E635F]">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          <span>
                            {gallery.expiry_date
                              ? `Expires ${new Date(gallery.expiry_date).toLocaleDateString()}`
                              : "No expiration"}
                          </span>
                        </span>
                        
                        {gallery.selections_submitted ? (
                          <span className="flex items-center space-x-1 text-green-600 font-medium">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Submitted</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1 font-semibold group-hover:text-[#2C2623] transition-colors">
                            <span>Open</span>
                            <ArrowRight className="w-3 h-3 translate-x-0 group-hover:translate-x-1 transition-transform" />
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}
