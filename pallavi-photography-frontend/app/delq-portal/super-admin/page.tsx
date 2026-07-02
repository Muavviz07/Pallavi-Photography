"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { fetchAPI } from "@/lib/api";
import { Loader2, ShieldCheck, Save, AlertCircle, CheckCircle, Users, Shield } from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  role: string;
  status: string;
}

interface FeaturePermission {
  name: string;
  description: string;
  enabled: boolean;
}

const FEATURE_LABELS: Record<string, string> = {
  galleries: "Galleries & Clients",
  bookings: "Booking Requests",
  pricing: "Manage Pricing",
  faqs: "Manage FAQs",
  contact: "Manage Contact",
  blogs: "Blog Journal",
  enquiries: "Enquiries Log",
  users: "Users & Roles",
  analytics: "Analytics",
};

export default function SuperAdminPage() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;
  const userRole = (session?.user as any)?.role;

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [features, setFeatures] = useState<FeaturePermission[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load list of admin users
  useEffect(() => {
    if (!token || userRole !== "super_admin") return;

    const loadAdmins = async () => {
      try {
        const data = await fetchAPI("/api/admin/admin-users", { token });
        setAdminUsers(data);
        // Automatically select the first admin user that is not a super_admin if possible
        const firstRegularAdmin = data.find((u: AdminUser) => u.role === "admin");
        if (firstRegularAdmin) {
          setSelectedAdmin(firstRegularAdmin);
        } else if (data.length > 0) {
          setSelectedAdmin(data[0]);
        }
      } catch (err) {
        console.error("Failed to load admin users", err);
        setMessage({ type: "error", text: "Failed to load admin accounts list." });
      } finally {
        setLoadingAdmins(false);
      }
    };

    loadAdmins();
  }, [token, userRole]);

  // Load permissions for selected admin user
  useEffect(() => {
    if (!token || !selectedAdmin) return;

    const loadPermissions = async () => {
      setLoadingPermissions(true);
      setMessage(null);
      try {
        const data = await fetchAPI(`/api/admin/admin-users/${selectedAdmin.id}/permissions`, { token });
        setFeatures(data.features || []);
      } catch (err) {
        console.error("Failed to load permissions", err);
        setMessage({ type: "error", text: `Failed to load permissions for ${selectedAdmin.email}` });
      } finally {
        setLoadingPermissions(false);
      }
    };

    loadPermissions();
  }, [token, selectedAdmin]);

  const handleToggle = (featureName: string) => {
    if (selectedAdmin?.role === "super_admin") return; // Super admin has locked permissions (always true)
    
    setFeatures(
      features.map((f) =>
        f.name === featureName ? { ...f, enabled: !f.enabled } : f
      )
    );
  };

  const handleSave = async () => {
    if (!token || !selectedAdmin) return;
    setSaving(true);
    setMessage(null);

    // Transform permissions back to dict mapping
    const permissionsData = features.reduce((acc, f) => {
      acc[f.name] = f.enabled;
      return acc;
    }, {} as Record<string, boolean>);

    try {
      await fetchAPI(`/api/admin/admin-users/${selectedAdmin.id}/permissions`, {
        method: "PATCH",
        body: JSON.stringify(permissionsData),
        token,
      });
      setMessage({ type: "success", text: `Permissions updated successfully for ${selectedAdmin.email}!` });
    } catch (err: any) {
      console.error("Failed to save settings", err);
      setMessage({ type: "error", text: err.message || "Failed to save admin sidebar settings." });
    } finally {
      setSaving(false);
    }
  };

  if (userRole !== "super_admin") {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h1 className="text-xl font-serif text-[#2C2623]">Access Denied</h1>
        <p className="text-xs text-[#6E635F] font-light">Only super admins can access this page.</p>
      </div>
    );
  }

  if (loadingAdmins) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="w-8 h-8 text-[#C4A484] animate-spin" />
        <p className="text-xs text-[#6E635F] font-light">Loading workspace settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <span className="text-[10px] uppercase tracking-[0.35em] text-[#C4A484] font-semibold block">
          Developer Workspace
        </span>
        <h1 className="text-3xl font-light tracking-wide font-serif text-[#2C2623]">
          Super Admin Panel
        </h1>
        <p className="text-[#6E635F] text-xs font-light">
          Manage granular feature access and permissions on a per-admin user basis. Changes apply dynamically to their dashboards.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-md text-xs font-medium border flex items-center gap-2.5 transition-all duration-300 ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Side: Admins List */}
        <div className="bg-white border border-[#DCD0C0]/25 rounded-md p-6 space-y-4 shadow-xs animate-fade-in">
          <div className="flex items-center gap-2 border-b border-[#DCD0C0]/15 pb-3">
            <Users className="w-4 h-4 text-[#C4A484]" />
            <h2 className="text-xs font-medium tracking-wider text-[#2C2623] uppercase">
              Admin Accounts
            </h2>
          </div>
          <div className="flex flex-col gap-2">
            {adminUsers.map((admin) => (
              <button
                key={admin.id}
                onClick={() => setSelectedAdmin(admin)}
                className={`w-full text-left p-3.5 rounded-sm border transition-all duration-200 flex flex-col gap-1 cursor-pointer ${
                  selectedAdmin?.id === admin.id
                    ? "bg-[#FCFAF7] border-[#C4A484] shadow-xs"
                    : "bg-white border-stone-200/60 hover:bg-[#FCFAF7]/40 hover:border-stone-300"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-medium text-[#2C2623] truncate max-w-[150px]">{admin.email}</span>
                  <span className={`text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full font-semibold ${
                    admin.role === "super_admin" 
                      ? "bg-stone-850 text-[#C4A484]" 
                      : "bg-[#FAF8F5] text-stone-600 border border-stone-200/50"
                  }`}>
                    {admin.role === "super_admin" ? "Super" : "Admin"}
                  </span>
                </div>
                <span className="text-[10px] text-stone-400 font-light lowercase">Status: {admin.status}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Features Toggles */}
        <div className="lg:col-span-2 bg-white border border-[#DCD0C0]/25 rounded-md p-6 space-y-6 shadow-xs animate-fade-in">
          {selectedAdmin ? (
            <>
              <div className="border-b border-[#DCD0C0]/15 pb-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-[#C4A484]" />
                  <div className="space-y-0.5">
                    <h2 className="text-sm font-medium tracking-wider text-[#2C2623] uppercase">
                      Sidebar Access & Features
                    </h2>
                    <p className="text-[10px] text-stone-400 font-light">Configuring permissions for {selectedAdmin.email}</p>
                  </div>
                </div>
                {selectedAdmin.role === "super_admin" && (
                  <span className="text-[9px] uppercase tracking-wider text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded">
                    Lock Enabled
                  </span>
                )}
              </div>

              {loadingPermissions ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <Loader2 className="w-6 h-6 text-[#C4A484] animate-spin" />
                  <p className="text-[10px] text-stone-400">Loading user permissions map...</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {features.map((feature) => {
                      const isEnabled = feature.enabled;
                      const isLocked = selectedAdmin.role === "super_admin";
                      
                      return (
                        <div
                          key={feature.name}
                          className={`flex items-center justify-between p-4 rounded-sm border transition-all duration-200 ${
                            isLocked 
                              ? "bg-stone-50 border-stone-200/50" 
                              : isEnabled
                                ? "bg-[#FCFAF7]/40 border-[#C4A484]/30 hover:border-[#C4A484]/60"
                                : "bg-white border-stone-100 hover:bg-[#FCFAF7]/20 hover:border-stone-200"
                          }`}
                        >
                          <div className="space-y-0.5 pr-2">
                            <span className="text-xs font-semibold text-[#2C2623]">
                              {FEATURE_LABELS[feature.name] || feature.name}
                            </span>
                            <span className="block text-[9px] text-stone-400 font-light leading-relaxed">
                              {feature.description}
                            </span>
                          </div>

                          <button
                            onClick={() => handleToggle(feature.name)}
                            disabled={isLocked}
                            className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              isEnabled ? "bg-[#C4A484]" : "bg-stone-200"
                            } ${isLocked ? "opacity-60 cursor-not-allowed" : ""}`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                isEnabled ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {selectedAdmin.role !== "super_admin" && (
                    <div className="pt-4 border-t border-[#DCD0C0]/15 flex justify-end">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center space-x-2 bg-[#2C2623] hover:bg-[#C4A484] text-white text-xs uppercase tracking-widest px-6 py-3.5 rounded-sm transition-all duration-350 shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Saving Permissions...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            <span>Save Permissions</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="text-center py-24 text-stone-400 text-xs font-light">
              Select an admin user account to review and adjust permissions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
