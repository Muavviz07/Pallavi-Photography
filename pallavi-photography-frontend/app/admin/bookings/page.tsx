"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { fetchAPI } from "@/lib/api";
import { Loader2, Check, X, Calendar, User, Mail, ShieldAlert } from "lucide-react";

interface BookingResponse {
  id: string;
  name: string;
  email: string;
  date: string;
  time: string;
  message?: string;
  status: string;
  created_at: string;
}

export default function AdminBookings() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;

  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadBookings = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchAPI("/api/bookings/admin/all", { token });
      setBookings(data);
    } catch (err) {
      console.error("Failed to load bookings list in admin panel", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadBookings();
    }
  }, [token]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (updatingId) return;
    if (!confirm(`Are you sure you want to change booking request status to ${newStatus.toUpperCase()}?`)) return;

    setUpdatingId(id);
    try {
      await fetchAPI(`/api/bookings/admin/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ status: newStatus }),
      });
      loadBookings();
    } catch (err) {
      console.error("Failed to update booking status", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this booking request?")) return;
    try {
      await fetchAPI(`/api/bookings/admin/${id}`, {
        method: "DELETE",
        token,
      });
      loadBookings();
    } catch (err) {
      console.error("Failed to delete booking", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="w-8 h-8 text-[#C4A484] animate-spin" />
        <p className="text-xs text-[#6E635F] font-light">Loading bookings...</p>
      </div>
    );
  }

  if (session && (session.user as any)?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-500" />
        <h2 className="text-lg font-serif font-light text-brand-dark uppercase">Access Denied</h2>
        <p className="text-xs text-brand-muted max-w-sm text-center leading-relaxed">
          You do not have administrative privileges to manage booking requests. Please contact the administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="border-b border-[#DCD0C0]/25 pb-6">
        <h1 className="text-2xl font-light font-serif text-[#2C2623]">
          Photoshoot Booking Requests
        </h1>
        <p className="text-xs text-[#6E635F] font-light mt-1">
          Review reservations submitted by visitors, approve slots to block dates in the calendar, and dispatch notification confirmations.
        </p>
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-[#DCD0C0]/35 rounded-md bg-white">
          <p className="text-xs text-[#6E635F] font-light">No photoshoot requests found.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#DCD0C0]/25 rounded-md overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs font-light text-[#6E635F] border-collapse">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#DCD0C0]/20 text-[#2C2623] font-semibold uppercase tracking-wider text-[9px]">
                <th className="p-4">Client Detail</th>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Additional Message</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Approve / Decline</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const dateStr = new Date(b.date).toLocaleDateString("en-US", {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });
                
                const timeStr = b.time.slice(0, 5);
                const isUpdating = updatingId === b.id;

                return (
                  <tr key={b.id} className="border-b border-[#DCD0C0]/15 hover:bg-[#FAF8F5]/30 transition-colors">
                    <td className="p-4 space-y-0.5">
                      <p className="font-semibold text-[#2C2623]">{b.name}</p>
                      <p className="text-[10px] text-stone-400 font-mono flex items-center gap-1">
                        <Mail className="w-3 h-3 text-stone-300" /> {b.email}
                      </p>
                    </td>
                    <td className="p-4 space-y-0.5">
                      <p className="text-[#2C2623] flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#C4A484] shrink-0" /> {dateStr}
                      </p>
                      <p className="text-[10px] text-stone-400 pl-5">at {timeStr}</p>
                    </td>
                    <td className="p-4 max-w-xs text-[11px] font-light leading-relaxed text-[#6E635F]">
                      {b.message || <span className="text-stone-300 italic">No message</span>}
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-sm text-[9px] font-semibold uppercase tracking-wider ${
                        b.status === "approved"
                          ? "bg-green-50 text-green-700"
                          : b.status === "declined"
                          ? "bg-red-50 text-red-700"
                          : b.status === "cancelled"
                          ? "bg-stone-50 text-stone-500"
                          : "bg-amber-50 text-amber-700"
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {isUpdating ? (
                        <Loader2 className="w-4 h-4 animate-spin text-stone-400 ml-auto" />
                      ) : (
                        <div className="inline-flex space-x-2 items-center justify-end">
                          {b.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(b.id, "approved")}
                                className="p-1.5 border border-green-150 rounded-sm text-green-600 hover:bg-green-50 transition-all cursor-pointer"
                                title="Approve Request"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(b.id, "declined")}
                                className="p-1.5 border border-red-150 rounded-sm text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                                title="Decline Request"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(b.id)}
                            className="p-1.5 border border-stone-200 rounded-sm text-stone-400 hover:text-red-600 hover:border-red-200 transition-all cursor-pointer"
                            title="Delete Request"
                          >
                            Delete
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
