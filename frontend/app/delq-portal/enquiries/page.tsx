"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { fetchAPI } from "@/lib/api";
import { Loader2, Mail, Check, Trash2, Calendar, ShieldAlert } from "lucide-react";

interface EnquiryResponse {
  id: string;
  name: string;
  email: string;
  message: string;
  status: string;
  created_at: string;
}

export default function AdminEnquiries() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;

  const [enquiries, setEnquiries] = useState<EnquiryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadEnquiries = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchAPI("/api/enquiries/admin/all", { token });
      setEnquiries(data);
    } catch (err) {
      console.error("Failed to load enquiries list in admin panel", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadEnquiries();
    }
  }, [token]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (updatingId) return;
    setUpdatingId(id);
    try {
      await fetchAPI(`/api/enquiries/admin/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ status: newStatus }),
      });
      loadEnquiries();
    } catch (err) {
      console.error("Failed to update enquiry status", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contact submission log?")) return;
    try {
      await fetchAPI(`/api/enquiries/admin/${id}`, {
        method: "DELETE",
        token,
      });
      loadEnquiries();
    } catch (err) {
      console.error("Failed to delete enquiry log", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="w-8 h-8 text-[#C4A484] animate-spin" />
        <p className="text-xs text-[#6E635F] font-light">Loading enquiries...</p>
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
          You do not have administrative privileges to view enquiries. Please contact the administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="border-b border-[#DCD0C0]/25 pb-6">
        <h1 className="text-2xl font-light font-serif text-[#2C2623]">
          Contact Form Enquiries
        </h1>
        <p className="text-xs text-[#6E635F] font-light mt-1">
          Review visitor contact queries, track read status, and manage client messages.
        </p>
      </div>

      {/* Enquiries list */}
      {enquiries.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-[#DCD0C0]/35 rounded-md bg-white">
          <p className="text-xs text-[#6E635F] font-light">No messages received yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#DCD0C0]/25 rounded-md overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs font-light text-[#6E635F] border-collapse">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#DCD0C0]/20 text-[#2C2623] font-semibold uppercase tracking-wider text-[9px]">
                <th className="p-4">Visitor Details</th>
                <th className="p-4">Message Context</th>
                <th className="p-4">Submission Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((e) => {
                const dateStr = new Date(e.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });
                const isUpdating = updatingId === e.id;

                return (
                  <tr key={e.id} className="border-b border-[#DCD0C0]/15 hover:bg-[#FAF8F5]/30 transition-colors">
                    <td className="p-4 space-y-0.5">
                      <p className="font-semibold text-[#2C2623]">{e.name}</p>
                      <p className="text-[10px] text-stone-400 font-mono flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-stone-300" /> {e.email}
                      </p>
                    </td>
                    <td className="p-4 max-w-md text-[11px] font-light leading-relaxed text-[#6E635F] whitespace-pre-wrap">
                      {e.message}
                    </td>
                    <td className="p-4 text-stone-400 flex items-center gap-1.5 pt-6">
                      <Calendar className="w-3.5 h-3.5 text-stone-300 shrink-0" />
                      <span>{dateStr}</span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-sm text-[9px] font-semibold uppercase tracking-wider ${
                        e.status === "read"
                          ? "bg-green-50 text-green-700"
                          : e.status === "responded"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-amber-50 text-amber-700"
                      }`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {isUpdating ? (
                        <Loader2 className="w-4 h-4 animate-spin text-stone-400 ml-auto" />
                      ) : (
                        <div className="inline-flex space-x-2 items-center justify-end">
                          {e.status === "pending" && (
                            <button
                              onClick={() => handleUpdateStatus(e.id, "read")}
                              className="p-1 text-stone-400 hover:text-green-600 transition-colors"
                              title="Mark as Read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(e.id)}
                            className="p-1 text-stone-400 hover:text-red-600 transition-colors"
                            title="Delete Log"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
