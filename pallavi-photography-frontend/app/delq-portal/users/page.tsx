"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { fetchAPI } from "@/lib/api";
import { Loader2, ShieldCheck, ShieldAlert, Shield, Edit, Trash2, Plus, X, AlertCircle } from "lucide-react";

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

  // Modal form states
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "client",
    status: "active",
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      email: "",
      password: "",
      role: "client",
      status: "active",
    });
    setFormError("");
    setShowModal(true);
  };

  const handleOpenEdit = (user: UserResponse) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: "", // Optional during edit
      role: user.role,
      status: user.status,
    });
    setFormError("");
    setShowModal(true);
  };

  const handleDelete = async (user: UserResponse) => {
    if (!confirm(`Are you sure you want to permanently delete user account: ${user.email}? This action cannot be undone.`)) {
      return;
    }

    setUpdatingId(user.id);
    try {
      await fetchAPI(`/api/admin/users/${user.id}`, {
        method: "DELETE",
        token,
      });
      loadUsers();
    } catch (err: any) {
      console.error("Failed to delete user account", err);
      alert(err.message || "Failed to delete user account.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    // Validation
    if (!editingUser && !formData.password) {
      setFormError("Password is required for new accounts.");
      setSubmitting(false);
      return;
    }
    if (formData.password && formData.password.length < 8) {
      setFormError("Password must be at least 8 characters long.");
      setSubmitting(false);
      return;
    }

    try {
      if (editingUser) {
        // Edit User
        const patchData: Record<string, string> = {
          email: formData.email,
          role: formData.role,
          status: formData.status,
        };
        if (formData.password) {
          patchData.password = formData.password;
        }

        await fetchAPI(`/api/admin/users/${editingUser.id}`, {
          method: "PATCH",
          token,
          body: JSON.stringify(patchData),
        });
      } else {
        // Add User
        await fetchAPI("/api/admin/users", {
          method: "POST",
          token,
          body: JSON.stringify(formData),
        });
      }

      setShowModal(false);
      loadUsers();
    } catch (err: any) {
      console.error("Failed to save user account details", err);
      setFormError(err.message || "An error occurred while saving user data.");
    } finally {
      setSubmitting(false);
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

  const role = (session?.user as any)?.role;
  if (session && role !== "admin" && role !== "super_admin") {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-500" />
        <h2 className="text-lg font-serif font-light text-brand-dark uppercase">Access Denied</h2>
        <p className="text-xs text-brand-muted max-w-sm text-center leading-relaxed">
          You do not have administrative privileges to manage user accounts. Please contact the administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="border-b border-[#DCD0C0]/25 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light font-serif text-[#2C2623]">
            Users & Account Roles
          </h1>
          <p className="text-xs text-[#6E635F] font-light mt-1">
            Review visitor user registration accounts, adjust workspace privileges, and manage system active statuses.
          </p>
        </div>

        {/* Add User Button */}
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 bg-[#2C2623] hover:bg-[#C4A484] text-white text-xs uppercase tracking-widest px-4 py-2.5 rounded-sm transition-all duration-300 shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add User</span>
        </button>
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
                        u.role === "super_admin" 
                          ? "bg-stone-850 text-[#C4A484] border border-[#C4A484]/30"
                          : u.role === "admin" 
                            ? "bg-amber-50 text-amber-700 border border-amber-100" 
                            : "bg-stone-50 text-stone-600"
                      }`}>
                        {u.role === "super_admin" ? "Super Admin" : u.role}
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
                      ) : (
                        <div className="inline-flex space-x-4 items-center justify-end">
                          {role === "super_admin" && u.role === "admin" && (
                            <Link
                              href="/delq-portal/super-admin"
                              className="text-stone-400 hover:text-[#C4A484] flex items-center gap-1.5 transition-colors"
                              title="Configure Permissions"
                            >
                              <Shield className="w-4 h-4" />
                              <span>Permissions</span>
                            </Link>
                          )}
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="text-[#6E635F] hover:text-[#C4A484] flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Edit Account details / Password"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          {!isSelf && (
                            <button
                              onClick={() => handleDelete(u)}
                              className="text-stone-400 hover:text-red-600 flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="Delete User Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          )}
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

      {/* Slide-over or Modal edit/add details */}
      {showModal && (
        <div className="fixed inset-0 bg-[#2C2623]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white border border-[#DCD0C0]/25 rounded-md p-6 max-w-md w-full space-y-6 shadow-xl animate-scale-in">
            <div className="border-b border-[#DCD0C0]/15 pb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium tracking-wider text-[#2C2623] uppercase font-serif">
                {editingUser ? "Edit User Details" : "Add New User"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setFormError("");
                }}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-stone-500 font-medium block">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm focus:outline-none focus:border-[#C4A484]"
                  placeholder="user@example.com"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-stone-500 font-medium block">
                  {editingUser ? "New Password (leave empty to keep current)" : "Password"}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-sm focus:outline-none focus:border-[#C4A484]"
                  placeholder={editingUser ? "••••••••" : "At least 8 characters"}
                  minLength={8}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-stone-500 font-medium block">
                    Access Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-sm bg-white focus:outline-none focus:border-[#C4A484]"
                    disabled={!!(editingUser && editingUser.email === session?.user?.email)} // Cannot change own role
                  >
                    <option value="client">Client</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-stone-500 font-medium block">
                    Account Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-sm bg-white focus:outline-none focus:border-[#C4A484]"
                    disabled={!!(editingUser && editingUser.email === session?.user?.email)} // Cannot suspend self
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-[#DCD0C0]/15 flex justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormError("");
                  }}
                  className="px-4 py-2 border border-stone-200 text-stone-600 hover:bg-stone-50 rounded-sm cursor-pointer uppercase tracking-widest font-semibold text-[10px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#2C2623] hover:bg-[#C4A484] text-white rounded-sm cursor-pointer uppercase tracking-widest font-semibold text-[10px] transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save User</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
