"use client";

import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import {
  Users,
  Plus,
  ShieldCheck,
  Mail,
  Lock,
  User,
  Trash2,
  Edit2,
  Activity,
  X,
  ShieldAlert,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function TeamPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState("");

  // Form State
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editId, setEditId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("inspector");
  const [saving, setSaving] = useState(false);

  const isAdmin = (session?.user as any)?.role === "admin";

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/db/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openAddModal = () => {
    setFormMode("add");
    setEditId("");
    setName("");
    setEmail("");
    setPassword("");
    setRole("inspector");
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserAccount) => {
    setFormMode("edit");
    setEditId(user.id);
    setName(user.name);
    setEmail(user.email);
    setPassword("");
    setRole(user.role);
    setError("");
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await fetch(`/api/db/users/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
      } else {
        const errorText = await res.text();
        try {
          const data = JSON.parse(errorText);
          alert(data.error || "Failed to delete");
        } catch {
          alert("Failed to delete: " + errorText);
        }
      }
    } catch (err) {
      alert("An error occurred");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload: any = { name, email, role };
      if (password) payload.password = password;

      const url = formMode === "add" ? "/api/db/users" : `/api/db/users/${editId}`;
      const method = formMode === "add" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        try {
          const data = JSON.parse(errorText);
          setError(data.error || "Something went wrong");
        } catch {
          setError("Something went wrong");
        }
        setSaving(false);
        return;
      }

      await fetchUsers();
      setIsModalOpen(false);
    } catch (err) {
      setError("Network error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <main className="flex-1 ml-72">
        <TopBar
          title="Team Management"
          subtitle="Enforcement officer RBAC directory and access provisioning"
        />

        <div className="p-8 max-w-7xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl liquid-glass-card">
            <div>
              <h2 className="text-base font-bold text-slate-100 tracking-tight">
                Authorized Personnel Roster
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage access roles, field inspector accounts, and administrative authority
              </p>
            </div>
            {isAdmin && (
              <Button
                variant="default"
                size="sm"
                onClick={openAddModal}
                className="shadow-blue-600/30 gap-1.5 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Officer</span>
              </Button>
            )}
          </div>

          {!isAdmin && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/25 rounded-2xl flex items-start gap-3 text-yellow-400">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-xs uppercase tracking-wider">
                  Inspector Tier View Only
                </h3>
                <p className="text-xs mt-1 text-slate-300">
                  You are signed in as an Inspector. Administrative rights are required to provision, modify, or revoke user accounts.
                </p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-44 bg-slate-900/40 rounded-2xl border border-slate-800/80" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="rounded-2xl liquid-glass-card p-5 flex flex-col justify-between group hover:border-blue-500/30"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-full bg-blue-600/15 border border-blue-500/25 flex items-center justify-center text-blue-400 font-bold text-base shadow-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            title="Edit User"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-100">{user.name}</h3>
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-mono text-[11px] truncate">{user.email}</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <Badge
                      variant={user.role === "admin" ? "destructive" : "default"}
                      className="text-[10px] uppercase font-mono"
                    >
                      {user.role}
                    </Badge>
                    {(session?.user as any)?.id === user.id && (
                      <span className="text-[11px] text-blue-400 font-semibold font-mono">
                        (Active Session)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden z-10"
            >
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-100">
                  {formMode === "add" ? "Provision New Officer" : "Edit Officer Record"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {error && (
                  <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/25 text-red-300 text-xs flex items-center gap-2">
                    <Activity className="w-4 h-4 text-red-400" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Officer Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-700/70 rounded-xl py-2 pl-9 pr-3.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Official Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-700/70 rounded-xl py-2 pl-9 pr-3.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Security Password {formMode === "edit" && "(Leave blank to keep current)"}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      required={formMode === "add"}
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-700/70 rounded-xl py-2 pl-9 pr-3.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Enforcement Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-700/70 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
                    <option value="inspector">Inspector (Field Enforcement)</option>
                    <option value="admin">Administrator (Supervisory / RBAC)</option>
                  </select>
                </div>

                <div className="pt-3 flex gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="default"
                    size="default"
                    disabled={saving}
                    className="flex-1 shadow-blue-600/30 text-xs"
                  >
                    {saving ? "Saving..." : "Save Record"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
