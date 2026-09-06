"use client";

import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { Users, Plus, ShieldCheck, Mail, Lock, User, MoreVertical, Trash2, Edit2, Activity, X } from "lucide-react";
import { useSession } from "next-auth/react";

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
    setPassword(""); // leave blank unless changing
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
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />
      <main className="flex-1 ml-72">
        <TopBar title="Team Management" subtitle="Manage inspectors and admins" />
        
        <div className="p-8 max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">System Users</h2>
              <p className="text-zinc-400 mt-1">Manage access for enforcement officers</p>
            </div>
            {isAdmin && (
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-600/20"
              >
                <Plus className="w-4 h-4" />
                Add User
              </button>
            )}
          </div>

          {!isAdmin && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 text-amber-500">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <div>
                <h3 className="font-semibold text-sm">Admin Access Required</h3>
                <p className="text-sm mt-1 opacity-80">You can view the team, but only administrators can add, edit, or delete users.</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-white/5 rounded-2xl"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {users.map((user) => (
                <div key={user.id} className="bg-zinc-900/60 border border-white/[0.08] p-6 rounded-2xl flex flex-col justify-between group hover:border-indigo-500/30 transition-all">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-lg">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      
                      {isAdmin && (
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditModal(user)} className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(user.id)} className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-white">{user.name}</h3>
                    <div className="flex items-center gap-2 text-zinc-400 text-sm mt-2">
                      <Mail className="w-4 h-4" />
                      {user.email}
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/[0.04]">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${user.role === 'admin' ? 'bg-rose-500/20 text-rose-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                      {user.role.toUpperCase()}
                    </span>
                    {(session?.user as any)?.id === user.id && (
                      <span className="text-xs text-zinc-500">You</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/[0.08] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/[0.08] flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">
                {formMode === "add" ? "Add New User" : "Edit User"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-500 mb-2">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-zinc-950/50 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-500 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-zinc-950/50 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-500 mb-2">
                  Password {formMode === "edit" && "(Leave blank to keep current)"}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input required={formMode === "add"} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-zinc-950/50 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-500 mb-2">Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full bg-zinc-950/50 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none appearance-none">
                  <option value="inspector">Inspector</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-zinc-300 hover:bg-white/5 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50">
                  {saving ? "Saving..." : "Save User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
