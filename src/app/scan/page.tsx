"use client";

import React from "react";
import FloatingDock from "@/components/FloatingDock";
import LiveInspectionScanner from "@/components/LiveInspectionScanner";

export default function ScanPage() {
  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      <main className="flex-1 flex flex-col overflow-hidden">
        <LiveInspectionScanner />
      </main>
      <FloatingDock />
    </div>
  );
}
