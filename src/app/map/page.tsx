"use client";

import React from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import TerritoryGisMap from "@/components/TerritoryGisMap";
import { MapPin, Navigation, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MapPage() {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <main className="flex-1 ml-72">
        <TopBar
          title="Territorial GIS Enforcement Grid"
          subtitle="Real-time geo-spatial tracking of market inspections, violation clusters, and field routes"
          action={
            <Link href="/scan">
              <Button size="sm" variant="default" className="shadow-blue-600/30 gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>New Field Inspection</span>
              </Button>
            </Link>
          }
        />

        <div className="p-8 max-w-7xl">
          <TerritoryGisMap />
        </div>
      </main>
    </div>
  );
}
