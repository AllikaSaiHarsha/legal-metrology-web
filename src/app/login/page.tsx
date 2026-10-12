"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Scale, ShieldCheck, Lock, Mail, ArrowRight, Activity } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@metrology.gov");
  const [password, setPassword] = useState("admin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError("Invalid credentials. Please verify your officer email and password.");
        setLoading(false);
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to authenticate with enforcement authority.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden select-none p-4">
      {/* Specular Ambient Light Orb */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/[0.12] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-2/3 right-1/4 w-[350px] h-[350px] bg-cyan-500/[0.06] rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 border border-blue-400/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-blue-600/30">
            <Scale className="w-7 h-7 text-white" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">LegalMetrics</h1>
            <Badge variant="default" className="text-[10px] font-mono">
              v2.0
            </Badge>
          </div>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">
            Statutory Enforcement Authority
          </p>
        </div>

        {/* Card */}
        <div className="liquid-glass-card p-8 rounded-3xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5"
              >
                <Activity className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1.5">
                Officer Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/70 rounded-xl py-2 pl-9 pr-3.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-mono"
                  placeholder="officer@metrology.gov.in"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1.5">
                Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/70 rounded-xl py-2 pl-9 pr-3.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="Enter security key"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="default"
              size="lg"
              disabled={loading}
              className="w-full mt-3 shadow-blue-600/30 font-semibold text-xs"
            >
              <span>{loading ? "Verifying Credentials..." : "Access Enforcement Portal"}</span>
              {!loading && <ArrowRight className="w-4 h-4 ml-1" />}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>TLS 1.3 Encrypted</span>
            </span>
            <span className="font-mono">PCR 2011 Sec 15</span>
          </div>
        </div>

        <p className="text-center text-slate-500 text-[11px] mt-6">
          Authorized government enforcement personnel only. All access is audited.
        </p>
      </motion.div>
    </div>
  );
}
