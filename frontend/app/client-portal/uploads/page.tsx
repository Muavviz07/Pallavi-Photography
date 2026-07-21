"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Folder, Settings, LogOut, User, Upload, ArrowLeft, AlertTriangle, CheckCircle, ChevronRight } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ImageUpload from "@/components/gallery/ImageUpload";

interface GalleryResponse {
  id: string;
  title: string;
  slug: string;
  status: string;
  can_upload: boolean;
  selections_submitted: boolean;
}

export default function UploadsPage() {
  const { data: session, status } = useSession();
  const [galleries, setGalleries] = useState<GalleryResponse[]>([]);
  const [selectedGalleryId, setSelectedGalleryId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploadedCount, setUploadedCount] = useState(0);

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
      if (data.length > 0) {
        // Find first gallery where upload is enabled
        const uploadable = data.find((g: any) => g.can_upload && !g.selections_submitted);
        if (uploadable) {
          setSelectedGalleryId(uploadable.id);
        } else {
          setSelectedGalleryId(data[0].id);
        }
      }
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

  const handleUploadSuccess = () => {
    setUploadedCount((prev) => prev + 1);
  };

  const selectedGallery = galleries.find((g) => g.id === selectedGalleryId);

  if (status === "loading" || loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FCFAF7] space-y-4">
          <div className="w-8 h-8 border-2 border-[#C4A484] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-wider text-[#6E635F] font-light">
            Loading upload portal...
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
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FCFAF7] px-6 text-center space-y-4">
          <h2 className="text-xl font-light font-serif text-[#2C2623] uppercase tracking-widest">
            Access Denied
          </h2>
          <p className="text-xs text-[#6E635F] font-light">
            Please log in to manage your uploads.
          </p>
          <Link href="/login" className="text-xs uppercase tracking-widest text-[#C4A484] font-medium underline">
            Go to Login
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
                  <p className="text-xs text-[#6E635F] font-mono truncate max-w-[180px]">
                    {session?.user?.email}
                  </p>
                </div>
              </div>

              <div className="w-full h-[1px] bg-[#EAE4DC]" />

              <nav className="flex flex-col space-y-2 text-xs font-medium uppercase tracking-wider text-[#6E635F]">
                <Link
                  href="/client-portal"
                  className="flex items-center justify-between px-3 py-2.5 rounded-sm hover:bg-[#F5EFEB] hover:text-[#2C2623] transition-colors"
                >
                  <span className="flex items-center space-x-2">
                    <Folder className="w-4 h-4 text-stone-400" />
                    <span>My Galleries</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/client-portal/settings"
                  className="flex items-center justify-between px-3 py-2.5 rounded-sm hover:bg-[#F5EFEB] hover:text-[#2C2623] transition-colors"
                >
                  <span className="flex items-center space-x-2">
                    <Settings className="w-4 h-4 text-stone-400" />
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

          {/* Right Panel: Upload Zone */}
          <div className="lg:col-span-8 space-y-8">
            <div className="space-y-2 border-b border-[#DCD0C0]/25 pb-4">
              <div className="flex items-center space-x-2.5 text-[#C4A484] mb-1">
                <Link href="/client-portal" className="text-stone-400 hover:text-[#2C2623] transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <span className="text-[10px] uppercase tracking-widest font-semibold">Workspace</span>
              </div>
              <h2 className="text-2xl font-light tracking-widest font-serif uppercase text-[#2C2623]">
                Photo Upload Manager
              </h2>
              <p className="text-xs text-[#6E635F] font-light">
                Add photos to your private gallery. Only galleries with active client-upload permissions are editable.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-xs text-red-700 p-4 rounded-sm">
                {error}
              </div>
            )}

            {galleries.length === 0 ? (
              <div className="text-center py-20 bg-[#FAF8F5] border border-[#DCD0C0]/20 rounded-md">
                <p className="text-sm font-light text-[#6E635F]">No active galleries found to edit.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Gallery Dropdown Selector */}
                <div className="bg-[#FAF8F5] border border-[#DCD0C0]/35 rounded-md p-6 shadow-xs max-w-xl space-y-3">
                  <label htmlFor="gallery-select" className="block text-[10px] uppercase tracking-wider text-[#6E635F] font-medium">
                    Choose Destination Gallery
                  </label>
                  <select
                    id="gallery-select"
                    value={selectedGalleryId}
                    onChange={(e) => {
                      setSelectedGalleryId(e.target.value);
                      setUploadedCount(0);
                    }}
                    className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/50 rounded-sm px-3.5 py-2.5 text-xs outline-hidden focus:border-[#C4A484] transition-colors"
                  >
                    {galleries.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title} {g.can_upload ? "" : "(Upload Disabled)"}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Upload Zone rendering based on permissions */}
                {selectedGallery ? (
                  selectedGallery.selections_submitted ? (
                    <div className="bg-[#F5EFEB] border-l-3 border-[#C4A484] p-5 text-xs text-[#6E635F] flex items-center space-x-3 max-w-xl">
                      <AlertTriangle className="w-5 h-5 text-[#C4A484] shrink-0" />
                      <span>
                        This gallery's selections have already been finalized. Uploading is disabled.
                      </span>
                    </div>
                  ) : selectedGallery.can_upload ? (
                    <div className="space-y-6">
                      <ImageUpload
                        slug={selectedGallery.slug}
                        token={session?.accessToken || ""}
                        onUploadSuccess={handleUploadSuccess}
                      />
                      
                      {uploadedCount > 0 && (
                        <div className="bg-green-50 border border-green-200 text-xs text-green-700 p-4 rounded-sm flex items-center justify-between max-w-xl">
                          <span className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span>Successfully processed and updated gallery frames.</span>
                          </span>
                          <Link
                            href={`/client-galleries/${selectedGallery.slug}`}
                            className="text-xs uppercase tracking-widest font-semibold text-[#2C2623] hover:text-[#C4A484] underline"
                          >
                            View Gallery
                          </Link>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-[#F5EFEB] border-l-3 border-[#C4A484] p-5 text-xs text-[#6E635F] flex items-start space-x-3 max-w-xl">
                      <AlertTriangle className="w-5 h-5 text-[#C4A484] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-[#2C2623] mb-1">Upload Permission Disabled</h4>
                        <p className="font-light">
                          Uploading photos has been disabled for this gallery. Please contact your photographer if you need to add your own selections or reference photos.
                        </p>
                      </div>
                    </div>
                  )
                ) : null}
              </div>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}
