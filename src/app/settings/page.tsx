"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { useSession } from "next-auth/react";
import { User, Lock, Bell, Shield, Key, Save, Activity, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  
  const [name, setName] = useState(session?.user?.name || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  // Mock preference states
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [strictOcr, setStrictOcr] = useState(true);
  const [autoSave, setAutoSave] = useState(true);

  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [session?.user?.name]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;
    
    if (password && password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const payload: any = { name };
      if (password) payload.password = password;
      
      const res = await fetch(`/api/db/users/${(session.user as any).id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        try {
          const data = JSON.parse(errorText);
          throw new Error(data.error || "Failed to update profile");
        } catch {
          throw new Error("Failed to update profile: " + errorText);
        }
      }

      setMessage({ type: "success", text: "Profile updated successfully." });
      setPassword("");
      setConfirmPassword("");
      
      // Update next-auth session
      await update({ name });
      
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "An error occurred." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />
      <main className="flex-1 ml-72">
        <TopBar title="Settings" subtitle="Manage your account and system preferences" />
        
        <div className="p-8 max-w-5xl mx-auto space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Account Settings</h2>
            <p className="text-zinc-400 mt-1">Update your personal information and preferences.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Profile Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-zinc-900/60 border border-white/[0.08] rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-400" />
                  Personal Information
                </h3>
                
                <form onSubmit={handleUpdateProfile} className="space-y-5">
                  {message && (
                    <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${
                      message.type === "success" 
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                        : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                    }`}>
                      {message.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                      {message.text}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={session?.user?.email || ""}
                        disabled
                        className="w-full bg-zinc-950/50 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-zinc-500 cursor-not-allowed"
                      />
                      <p className="text-[10px] text-zinc-500 mt-1">Email cannot be changed.</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/[0.04]">
                    <h4 className="text-sm font-medium text-white mb-4">Update Password</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                          New Password
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="password"
                            placeholder="Leave blank to keep current"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-zinc-950 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="password"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-zinc-950 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right Column: System Preferences */}
            <div className="space-y-6">
              <div className="bg-zinc-900/60 border border-white/[0.08] rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-400" />
                  System Preferences
                </h3>
                
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-white">Email Alerts</h4>
                      <p className="text-xs text-zinc-500 mt-0.5">Notify on high severity violations</p>
                    </div>
                    <button 
                      onClick={() => setEmailAlerts(!emailAlerts)}
                      className={`w-10 h-6 rounded-full transition-colors relative ${emailAlerts ? 'bg-indigo-500' : 'bg-zinc-700'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${emailAlerts ? 'left-5' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-white">Strict OCR Mode</h4>
                      <p className="text-xs text-zinc-500 mt-0.5">Require higher confidence scores</p>
                    </div>
                    <button 
                      onClick={() => setStrictOcr(!strictOcr)}
                      className={`w-10 h-6 rounded-full transition-colors relative ${strictOcr ? 'bg-indigo-500' : 'bg-zinc-700'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${strictOcr ? 'left-5' : 'left-1'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-white">Auto-save Scans</h4>
                      <p className="text-xs text-zinc-500 mt-0.5">Save immediately after AI analysis</p>
                    </div>
                    <button 
                      onClick={() => setAutoSave(!autoSave)}
                      className={`w-10 h-6 rounded-full transition-colors relative ${autoSave ? 'bg-indigo-500' : 'bg-zinc-700'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${autoSave ? 'left-5' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/60 border border-white/[0.08] rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Key className="w-5 h-5 text-indigo-400" />
                  API Configuration
                </h3>
                <p className="text-xs text-zinc-400 mb-4">
                  Vision AI keys are managed via secure environment variables and cannot be edited here.
                </p>
                <div className="bg-zinc-950 border border-white/5 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm font-medium text-zinc-300">Gemini 2.5 Flash Connected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
