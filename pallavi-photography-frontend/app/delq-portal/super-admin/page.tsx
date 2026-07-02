"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api";
import { Loader2, ShieldCheck, Save, AlertCircle } from "lucide-react";

interface SidebarSettings {
  galleries: boolean;
  bookings: boolean;
  pricing: boolean;
  faqs: boolean;
  contact: boolean;
  blogs: boolean;
  enquiries: boolean;
  users: boolean;
  analytics: boolean;
}

const FEATURE_LABELS: Record<keyof SidebarSettings, string> = {
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

  const [settings, setSettings] = useState<SidebarSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!token) return;

    const loadSettings = async () => {
      try {
        const data = await api.get<SidebarSettings>("/api/admin/settings", { token });
        setSettings(data);
      } catch (err) {
        console.error("Failed to load sidebar settings", err);
        setMessage({ type: "error", text: "Failed to load sidebar settings." });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [token]);

  const handleToggle = (key: keyof SidebarSettings) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  const handleSave = async () => {
    if (!settings || !token) return;
    setSaving(true);
    setMessage(null);

    try {
      await api.post("/api/admin/settings", settings, { token });
      setMessage({ type: "success", text: "Admin sidebar permissions updated successfully!" });
      // Force page refresh after a short delay so that sidebar updates
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error("Failed to save settings", err);
      setMessage({ type: "error", text: "Failed to save admin sidebar settings." });
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="w-8 h-8 text-[#C4A484] animate-spin" />
        <p className="text-xs text-[#6E635F] font-light">Loading system permissions...</p>
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
          Configure the active features and sidebar options displayed to users with the **Admin** role.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-md text-xs font-medium border ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white border border-[#DCD0C0]/25 rounded-md shadow-xs p-6 space-y-6">
        <div className="border-b border-[#DCD0C0]/15 pb-4 flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-[#C4A484]" />
          <h2 className="text-sm font-medium tracking-wider text-[#2C2623] uppercase">
            Admin Sidebar Feature Toggles
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {settings &&
            Object.keys(settings).map((key) => {
              const settingKey = key as keyof SidebarSettings;
              const isEnabled = settings[settingKey];

              return (
                <div
                  key={key}
                  className="flex items-center justify-between p-4 rounded-sm border border-[#DCD0C0]/15 bg-[#FCFAF7]/50 hover:bg-[#FCFAF7] transition-all"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-medium text-[#2C2623]">
                      {FEATURE_LABELS[settingKey] || key}
                    </span>
                    <span className="block text-[10px] text-[#6E635F] font-light">
                      Toggle access to the {FEATURE_LABELS[settingKey].toLowerCase()} route.
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggle(settingKey)}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isEnabled ? "bg-[#C4A484]" : "bg-stone-300"
                    }`}
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

        <div className="pt-4 border-t border-[#DCD0C0]/15 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center space-x-2 bg-[#2C2623] text-white text-xs uppercase tracking-widest px-6 py-3 rounded-sm hover:bg-[#C4A484] hover:text-white transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Permissions</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
