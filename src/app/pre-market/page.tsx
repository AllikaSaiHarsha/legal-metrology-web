"use client";

import React from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import PreMarketAuditPortal from "@/components/PreMarketAuditPortal";
import { ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PreMarketPage() {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <main className="flex-1 ml-72">
        <TopBar
          title="Pre-Market Packaging Self-Audit"
          subtitle="Brand packaging artwork verification and pre-print statutory readiness certification"
          action={
            <Link href="/scan">
              <Button size="sm" variant="default" className="shadow-blue-600/30 gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Live Field Scanner</span>
              </Button>
            </Link>
          }
        />

        <div className="p-8 max-w-7xl">
          <PreMarketAuditPortal />
        </div>
      </main>
    </div>
  );
}
