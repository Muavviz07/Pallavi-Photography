"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { fetchAPI } from "@/lib/api";
import { Loader2, ShieldCheck, UserCheck, UserMinus, ShieldAlert } from "lucide-react";

interface UserResponse {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

export default function AdminUsers() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;

  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadUsers = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchAPI("/api/admin/users", { token });
      setUsers(data);
    } catch (err) {
      console.error("Failed to load user accounts list", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadUsers();
    }
  }, [token]);

  const handleRoleToggle = async (user: UserResponse) => {
    if (updatingId) return;
    const nextRole = user.role === "admin" ? "client" : "admin";
    if (!confirm(`Are you sure you want to change role for ${user.email} to ${nextRole.toUpperCase()}?`)) return;

    setUpdatingId(user.id);
    try {
      await fetchAPI(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ role: nextRole }),
      });
      loadUsers();
    } catch (err) {
      console.error("Failed to update user role", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusToggle = async (user: UserResponse) => {
    if (updatingId) return;
    const nextStatus = user.status === "active" ? "suspended" : "active";
    if (!confirm(`Are you sure you want to ${nextStatus === "active" ? "ACTIVATE" : "SUSPEND"} account for ${user.email}?`)) return;

    setUpdatingId(user.id);
    try {
      await fetchAPI(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ status: nextStatus }),
      });
      loadUsers();
    } catch (err) {
      console.error("Failed to update user status", err);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="w-8 h-8 text-[#C4A484] animate-spin" />
        <p className="text-xs text-[#6E635F] font-light">Loading user accounts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="border-b border-[#DCD0C0]/25 pb-6">
        <h1 className="text-2xl font-light font-serif text-[#2C2623]">
          Users & Account Roles
        </h1>
        <p className="text-xs text-[#6E635F] font-light mt-1">
          Review visitor user registration accounts, adjust workspace privileges, and manage system active statuses.
        </p>
      </div>

      {/* Users Table */}
      {users.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-[#DCD0C0]/35 rounded-md bg-white">
          <p className="text-xs text-[#6E635F] font-light">No user records found.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#DCD0C0]/25 rounded-md overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs font-light text-[#6E635F] border-collapse">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#DCD0C0]/20 text-[#2C2623] font-semibold uppercase tracking-wider text-[9px]">
                <th className="p-4">Registered Email</th>
                <th className="p-4">Access Role</th>
                <th className="p-4">Account Status</th>
                <th className="p-4">Date Joined</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const dateStr = new Date(u.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });
                const isSelf = session?.user?.email === u.email;
                const isUpdating = updatingId === u.id;

                return (
                  <tr key={u.id} className="border-b border-[#DCD0C0]/15 hover:bg-[#FAF8F5]/30 transition-colors">
                    <td className="p-4 font-medium text-[#2C2623]">{u.email} {isSelf && <span className="text-[10px] text-[#C4A484] font-normal italic ml-1">(You)</span>}</td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-sm text-[9px] font-semibold uppercase tracking-wider ${
                        u.role === "admin" ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-stone-50 text-stone-600"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-2 py-0.5 rounded-sm text-[9px] font-semibold uppercase tracking-wider ${
                        u.status === "active" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-4 text-stone-400">{dateStr}</td>
                    <td className="p-4 text-right space-x-3">
                      {isUpdating ? (
                        <Loader2 className="w-4 h-4 animate-spin text-stone-400 ml-auto" />
                      ) : isSelf ? (
                        <span className="text-[10px] text-stone-300 italic">No actions</span>
                      ) : (
                        <div className="inline-flex space-x-4 items-center justify-end">
                          <button
                            onClick={() => handleRoleToggle(u)}
                            className="text-stone-400 hover:text-[#C4A484] flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Toggle Privileges"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>Toggle Role</span>
                          </button>
                          <button
                            onClick={() => handleStatusToggle(u)}
                            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                              u.status === "active" ? "text-stone-400 hover:text-red-600" : "text-stone-400 hover:text-green-600"
                            }`}
                            title="Toggle Account Status"
                          >
                            {u.status === "active" ? (
                              <>
                                <UserMinus className="w-4 h-4" />
                                <span>Suspend</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-4 h-4" />
                                <span>Activate</span>
                              </>
                            )}
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
