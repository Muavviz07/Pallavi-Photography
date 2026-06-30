"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Folder, Settings, LogOut, User, Key, Eye, EyeOff, CheckCircle, ChevronRight } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const handleLogout = async () => {
    await signOut({ redirectTo: "/auth/login" });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${apiUrl}/api/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || "Failed to change password. Please check your current password.");
        return;
      }

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError("Network error. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <>
        <Header />
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FCFAF7] space-y-4">
          <div className="w-8 h-8 border-2 border-[#C4A484] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-wider text-[#6E635F] font-light">
            Loading settings...
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
            Please log in to manage your settings.
          </p>
          <Link href="/auth/login" className="text-xs uppercase tracking-widest text-[#C4A484] font-medium underline">
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
                  className="flex items-center justify-between px-3 py-2.5 rounded-sm bg-[#F5EFEB] text-[#2C2623]"
                >
                  <span className="flex items-center space-x-2">
                    <Settings className="w-4 h-4 text-[#C4A484]" />
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

          {/* Right Panel: Settings Fields */}
          <div className="lg:col-span-8 space-y-8">
            <div className="space-y-2 border-b border-[#DCD0C0]/25 pb-4">
              <h2 className="text-2xl font-light tracking-widest font-serif uppercase text-[#2C2623]">
                Account Settings
              </h2>
              <p className="text-xs text-[#6E635F] font-light">
                Configure your profile configurations and change password.
              </p>
            </div>

            {/* Change Password Panel */}
            <div className="bg-[#FAF8F5] border border-[#DCD0C0]/35 rounded-md p-8 shadow-xs max-w-xl">
              <div className="flex items-center space-x-2.5 mb-6 text-[#C4A484]">
                <Key className="w-4 h-4" />
                <h3 className="text-xs uppercase tracking-widest font-semibold text-[#2C2623]">
                  Change Password
                </h3>
              </div>

              {success && (
                <div className="mb-6 bg-green-50 border border-green-200 text-xs text-green-700 p-4 rounded-sm flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                  <span>Password updated successfully.</span>
                </div>
              )}

              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-xs text-red-700 p-4 rounded-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-5">
                {/* Current password */}
                <div className="space-y-1">
                  <label htmlFor="current" className="block text-[10px] uppercase tracking-wider text-[#6E635F] font-medium">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPass.current ? "text" : "password"}
                      id="current"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/50 rounded-sm pl-3 pr-10 py-2.5 text-xs outline-hidden focus:border-[#C4A484] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((prev) => ({ ...prev, current: !prev.current }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPass.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div className="space-y-1">
                  <label htmlFor="new" className="block text-[10px] uppercase tracking-wider text-[#6E635F] font-medium">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPass.new ? "text" : "password"}
                      id="new"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/50 rounded-sm pl-3 pr-10 py-2.5 text-xs outline-hidden focus:border-[#C4A484] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((prev) => ({ ...prev, new: !prev.new }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPass.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div className="space-y-1">
                  <label htmlFor="confirm" className="block text-[10px] uppercase tracking-wider text-[#6E635F] font-medium">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPass.confirm ? "text" : "password"}
                      id="confirm"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full bg-[#FCFAF7] border border-[#DCD0C0]/50 rounded-sm pl-3 pr-10 py-2.5 text-xs outline-hidden focus:border-[#C4A484] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((prev) => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPass.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center space-x-2 text-xs uppercase tracking-widest text-[#FCFAF7] bg-[#2C2623] hover:bg-[#352F2C] py-3 rounded-sm font-medium transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-stone-450 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>Update Password</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}
