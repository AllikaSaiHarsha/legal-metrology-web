"use client";

import React from "react";
import Sidebar from "@/components/Sidebar";
import LiveInspectionScanner from "@/components/LiveInspectionScanner";

export default function ScanPage() {
  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar />
      <main className="flex-1 ml-72 flex flex-col h-screen overflow-hidden">
        <LiveInspectionScanner />
      </main>
    </div>
  );
}
