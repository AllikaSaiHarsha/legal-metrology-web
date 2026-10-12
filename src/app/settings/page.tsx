"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { useSession } from "next-auth/react";
import {
  User,
  Lock,
  Shield,
  Key,
  Save,
  Activity,
  CheckCircle2,
  Server,
  Bell,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const { data: session, update } = useSession();

  const [name, setName] = useState(session?.user?.name || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  // Preference states
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

      setMessage({ type: "success", text: "Officer profile updated successfully." });
      setPassword("");
      setConfirmPassword("");

      await update({ name });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "An error occurred." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <main className="flex-1 ml-72">
        <TopBar
          title="System Settings"
          subtitle="Inspector profile credentials, alert triggers & neural vision parameters"
        />

        <div className="p-8 max-w-5xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl liquid-glass-card">
            <div>
              <h2 className="text-base font-bold text-slate-100 tracking-tight">
                Officer Administration &amp; Configuration
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage enforcement officer credentials and Legal Metrology rule heuristics.
              </p>
            </div>
            <Badge variant="default" className="text-xs">
              Enforcement Level 2 (Inspector)
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Profile Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-2xl liquid-glass-card p-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800/80">
                  <div className="p-2 rounded-xl bg-blue-600/15 border border-blue-500/25 text-blue-400">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">
                      Personal Credentials
                    </h3>
                    <p className="text-xs text-slate-400">
                      Authorized enforcement personnel identity
                    </p>
                  </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-5">
                  {message && (
                    <div
                      className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                        message.type === "success"
                          ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                          : "bg-red-500/15 border border-red-500/30 text-red-300"
                      }`}
                    >
                      {message.type === "success" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Activity className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                      <span>{message.text}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        Officer Full Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        Official Email
                      </label>
                      <input
                        type="email"
                        value={session?.user?.email || ""}
                        disabled
                        className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-500 cursor-not-allowed font-mono"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Locked to statutory credentials.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80">
                    <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">
                      Update Security Password
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1.5">
                          New Password
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="password"
                            placeholder="Leave blank to retain"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1.5">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="password"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-slate-900/80 border border-slate-700/60 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <Button
                      type="submit"
                      variant="default"
                      size="default"
                      disabled={saving}
                      className="shadow-blue-600/30 gap-1.5 text-xs"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? "Saving Changes..." : "Save Credentials"}</span>
                    </Button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right Column: Preferences & Engine Status */}
            <div className="space-y-6">
              <div className="rounded-2xl liquid-glass-card p-6">
                <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-800/80">
                  <div className="p-2 rounded-xl bg-blue-600/15 border border-blue-500/25 text-blue-400">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">
                      Enforcement Preferences
                    </h3>
                    <p className="text-xs text-slate-400">Automated audit behavior</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">Email Alerts</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Notify upon high severity infraction
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEmailAlerts(!emailAlerts)}
                      className={`w-9 h-5 rounded-full transition-colors relative ${
                        emailAlerts ? "bg-blue-600" : "bg-slate-700"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${
                          emailAlerts ? "left-4.5" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">Strict OCR Heuristic</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Confidence threshold &gt; 92%
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStrictOcr(!strictOcr)}
                      className={`w-9 h-5 rounded-full transition-colors relative ${
                        strictOcr ? "bg-blue-600" : "bg-slate-700"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${
                          strictOcr ? "left-4.5" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">Auto-Persist Scans</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Immediate PostgreSQL synchronization
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoSave(!autoSave)}
                      className={`w-9 h-5 rounded-full transition-colors relative ${
                        autoSave ? "bg-blue-600" : "bg-slate-700"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${
                          autoSave ? "left-4.5" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl liquid-glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-blue-600/15 border border-blue-500/25 text-blue-400">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">
                      Neural Engine Status
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">Gemini 2.5 Flash Multimodal</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  OCR inference and 2D spatial coordinate mapping are powered by Google Gemini Vision API via rotating secure keys.
                </p>
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-semibold text-slate-200">Pipeline Operational</span>
                  </div>
                  <Badge variant="success" className="text-[10px]">
                    200 OK
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
