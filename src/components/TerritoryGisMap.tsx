"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin,
  Layers,
  Flame,
  ShieldCheck,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Navigation,
  Crosshair,
  ExternalLink,
  Building,
  Filter,
  CheckCircle2,
  Package,
  Calendar,
  X,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface GisInspectionPoint {
  id: string;
  locationName: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  commodityName: string;
  inspector: string;
  complianceScore: number;
  status: "compliant" | "critical" | "warning";
  violationType?: "Dual MRP" | "Underweight" | "Missing USP" | "Packaging Defect";
  violationsCount: number;
  date: string;
}

const MOCK_GIS_POINTS: GisInspectionPoint[] = [
  {
    id: "INS-DEL-101",
    locationName: "Khari Baoli Wholesale Spice Mandi",
    address: "Old Delhi, Chandni Chowk Commercial Ward",
    city: "Delhi NCR",
    lat: 28.6562,
    lng: 77.2245,
    commodityName: "Packaged Mustard Oil 1L",
    inspector: "Virender Singh (Zonal Metrologist)",
    complianceScore: 42,
    status: "critical",
    violationType: "Dual MRP",
    violationsCount: 3,
    date: "2026-10-12",
  },
  {
    id: "INS-DEL-102",
    locationName: "Okhla Industrial Area Phase III",
    address: "Packaging & Logistics Zone, New Delhi",
    city: "Delhi NCR",
    lat: 28.5355,
    lng: 77.2728,
    commodityName: "Atta Wheat Flour 5kg",
    inspector: "Virender Singh",
    complianceScore: 68,
    status: "warning",
    violationType: "Underweight",
    violationsCount: 1,
    date: "2026-10-11",
  },
  {
    id: "INS-BOM-201",
    locationName: "Crawford Market Wholesale Goods",
    address: "Dhobi Talao, Fort Mumbai",
    city: "Mumbai",
    lat: 18.9482,
    lng: 72.8344,
    commodityName: "Imported Confectionery Assortment",
    inspector: "Rajesh Kulkarni (Senior Inspector)",
    complianceScore: 35,
    status: "critical",
    violationType: "Missing USP",
    violationsCount: 4,
    date: "2026-10-13",
  },
  {
    id: "INS-BOM-202",
    locationName: "APMC Agricultural Produce Market",
    address: "Vashi, Navi Mumbai Warehousing Sector",
    city: "Mumbai",
    lat: 19.0759,
    lng: 73.0033,
    commodityName: "Tata Salt 1kg",
    inspector: "Rajesh Kulkarni",
    complianceScore: 98,
    status: "compliant",
    violationsCount: 0,
    date: "2026-10-10",
  },
  {
    id: "INS-BLR-301",
    locationName: "KR Market Commercial Hub",
    address: "Kalasipalyam, Bengaluru City",
    city: "Bengaluru",
    lat: 12.9634,
    lng: 77.5752,
    commodityName: "Parle-G Biscuits 800g",
    inspector: "Ananya Hegde (Enforcement Lead)",
    complianceScore: 94,
    status: "compliant",
    violationsCount: 0,
    date: "2026-10-09",
  },
  {
    id: "INS-BLR-302",
    locationName: "Peenya Industrial Mega Complex",
    address: "4th Phase, Peenya, Bengaluru",
    city: "Bengaluru",
    lat: 13.0285,
    lng: 77.5197,
    commodityName: "Detergent Powder Bulk Pack",
    inspector: "Ananya Hegde",
    complianceScore: 50,
    status: "critical",
    violationType: "Underweight",
    violationsCount: 2,
    date: "2026-10-12",
  },
  {
    id: "INS-HYD-401",
    locationName: "Begum Bazar Trading Terminal",
    address: "Afzal Gunj, Hyderabad Central",
    city: "Hyderabad",
    lat: 17.3753,
    lng: 78.4744,
    commodityName: "Sunflower Refined Oil 1L",
    inspector: "K. Venkatesh",
    complianceScore: 40,
    status: "critical",
    violationType: "Dual MRP",
    violationsCount: 2,
    date: "2026-10-13",
  },
  {
    id: "INS-CHE-501",
    locationName: "George Town Wholesale Mandi",
    address: "Parrys Corner, Chennai Port Area",
    city: "Chennai",
    lat: 13.0886,
    lng: 80.2863,
    commodityName: "Amul Butter 500g",
    inspector: "M. Selvam",
    complianceScore: 96,
    status: "compliant",
    violationsCount: 0,
    date: "2026-10-08",
  },
  {
    id: "INS-CCU-601",
    locationName: "Posta Wholesale Mandi",
    address: "Burrabazar Central, Kolkata",
    city: "Kolkata",
    lat: 22.5855,
    lng: 88.3548,
    commodityName: "Mustard Oil Tin Container 15L",
    inspector: "Subhash Banerjee",
    complianceScore: 58,
    status: "warning",
    violationType: "Packaging Defect",
    violationsCount: 1,
    date: "2026-10-11",
  },
  {
    id: "INS-AHM-701",
    locationName: "Kalupur Commercial Grain Hub",
    address: "Old City, Ahmedabad",
    city: "Ahmedabad",
    lat: 23.0225,
    lng: 72.5714,
    commodityName: "Basmati Rice Premium 5kg",
    inspector: "Pravin Patel",
    complianceScore: 44,
    status: "critical",
    violationType: "Dual MRP",
    violationsCount: 2,
    date: "2026-10-13",
  },
];

// Coordinate bounding box for India projection
const GEO_BOUNDS = {
  minLat: 8.0,
  maxLat: 34.0,
  minLng: 68.0,
  maxLng: 90.0,
};

export default function TerritoryGisMap() {
  const [filterStatus, setFilterStatus] = useState<"all" | "critical" | "warning" | "compliant">("all");
  const [filterViolation, setFilterViolation] = useState<string>("all");
  const [selectedPoint, setSelectedPoint] = useState<GisInspectionPoint | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const filteredPoints = useMemo(() => {
    return MOCK_GIS_POINTS.filter((p) => {
      const matchesStatus = filterStatus === "all" || p.status === filterStatus;
      const matchesViolation =
        filterViolation === "all" ||
        (p.violationType && p.violationType.toLowerCase() === filterViolation.toLowerCase());
      return matchesStatus && matchesViolation;
    });
  }, [filterStatus, filterViolation]);

  // Convert lat/lng to SVG percentage coordinates (Equirectangular projection)
  const projectCoords = (lat: number, lng: number) => {
    const x = ((lng - GEO_BOUNDS.minLng) / (GEO_BOUNDS.maxLng - GEO_BOUNDS.minLng)) * 100;
    const y = ((GEO_BOUNDS.maxLat - lat) / (GEO_BOUNDS.maxLat - GEO_BOUNDS.minLat)) * 100;
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const criticalHotspotsCount = MOCK_GIS_POINTS.filter((p) => p.status === "critical").length;
  const avgCompliance = Math.round(
    MOCK_GIS_POINTS.reduce((acc, p) => acc + p.complianceScore, 0) / MOCK_GIS_POINTS.length
  );

  return (
    <div className="relative w-full h-[calc(100vh-140px)] min-h-[580px] rounded-3xl bg-slate-950 border border-slate-800/80 overflow-hidden flex flex-col shadow-2xl">
      {/* Top Map Control Bar */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4 z-20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100">
                National GIS Territorial Enforcement Grid
              </h2>
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">
                Live Satellite Hotspots
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400">
              Geotagged inspections, violation cluster density &amp; territorial heatmaps
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                filterStatus === "all" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All Audits ({MOCK_GIS_POINTS.length})
            </button>
            <button
              onClick={() => setFilterStatus("critical")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition ${
                filterStatus === "critical"
                  ? "bg-red-600 text-white"
                  : "text-red-400 hover:text-red-300"
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>Hotspots ({criticalHotspotsCount})</span>
            </button>
            <button
              onClick={() => setFilterStatus("compliant")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                filterStatus === "compliant"
                  ? "bg-emerald-600 text-white"
                  : "text-emerald-400 hover:text-emerald-300"
              }`}
            >
              Compliant
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleGetLocation}
            disabled={isLocating}
            className="text-xs gap-1.5 border-slate-700 bg-slate-800/80 text-slate-200"
            title="Locate Inspector Beacon via Device GPS"
          >
            <Crosshair className={`w-3.5 h-3.5 ${isLocating ? "animate-spin text-blue-400" : ""}`} />
            <span>{userLocation ? "GPS Locked" : "My Location"}</span>
          </Button>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2.0))}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Canvas Area */}
      <div className="relative flex-1 bg-slate-950 overflow-hidden flex items-center justify-center">
        {/* Subtle Map Grid / Topography Background */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #3b82f6 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />

        {/* Ambient Radial Vignette */}
        <div className="absolute inset-0 bg-radial from-transparent via-slate-950/60 to-slate-950 pointer-events-none" />

        {/* Scalable GIS Surface */}
        <div
          className="relative w-full h-full max-w-5xl max-h-[680px] transition-transform duration-300"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Stylized Indian Subcontinent Outline (Vector Representation) */}
          <svg className="w-full h-full text-slate-800/40" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* National Territory Polygon Guide */}
            <path
              d="M 30,12 L 40,8 L 52,14 L 62,24 L 75,32 L 88,40 L 85,55 L 78,65 L 60,82 L 48,92 L 44,82 L 35,68 L 22,50 L 15,36 L 24,24 Z"
              fill="rgba(30, 41, 59, 0.35)"
              stroke="rgba(59, 130, 246, 0.25)"
              strokeWidth="0.6"
              strokeDasharray="1.5 1.5"
            />
            {/* Major State Territorial Arteries */}
            <line x1="30" y1="12" x2="48" y2="92" stroke="rgba(71, 85, 105, 0.2)" strokeWidth="0.4" />
            <line x1="15" y1="36" x2="85" y2="55" stroke="rgba(71, 85, 105, 0.2)" strokeWidth="0.4" />
          </svg>

          {/* User Location Beacon */}
          {userLocation && (() => {
            const pos = projectCoords(userLocation.lat, userLocation.lng);
            return (
              <div
                className="absolute z-30 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              >
                <span className="relative flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-cyan-500 border-2 border-white items-center justify-center shadow-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  </span>
                </span>
                <span className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-[9px] font-mono text-cyan-200">
                  Officer Active Beacon
                </span>
              </div>
            );
          })()}

          {/* Inspection Pins & Heat Radii */}
          {filteredPoints.map((point) => {
            const pos = projectCoords(point.lat, point.lng);
            const isSelected = selectedPoint?.id === point.id;
            const isCritical = point.status === "critical";
            const isWarning = point.status === "warning";

            return (
              <div
                key={point.id}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                onClick={() => setSelectedPoint(point)}
              >
                {/* Heat Emission Ring for Critical Hotspots */}
                {isCritical && (
                  <span className="absolute -inset-2 rounded-full bg-red-500/20 animate-ping pointer-events-none" />
                )}

                {/* Marker Button */}
                <div
                  className={`relative p-1.5 rounded-full border-2 transition-transform duration-200 group-hover:scale-125 shadow-lg ${
                    isSelected
                      ? "bg-blue-600 border-white scale-125 ring-4 ring-blue-500/30"
                      : isCritical
                      ? "bg-red-600 border-red-300 text-white shadow-red-950/60"
                      : isWarning
                      ? "bg-amber-500 border-amber-200 text-white shadow-amber-950/60"
                      : "bg-emerald-600 border-emerald-200 text-white shadow-emerald-950/60"
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-white" />
                </div>

                {/* Compact Label */}
                <div className="absolute top-7 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border shadow-md ${
                      isCritical
                        ? "bg-red-950/90 text-red-200 border-red-500/40"
                        : isWarning
                        ? "bg-amber-950/90 text-amber-200 border-amber-500/40"
                        : "bg-emerald-950/90 text-emerald-200 border-emerald-500/40"
                    }`}
                  >
                    {point.city}: {point.complianceScore}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Inspection Detail Drawer (Floating Liquid Glass Card) */}
        <AnimatePresence>
          {selectedPoint && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute right-6 top-6 bottom-6 w-96 max-w-[calc(100vw-3rem)] z-30 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-slate-700/80 shadow-2xl p-5 flex flex-col justify-between overflow-y-auto"
            >
              <div className="space-y-4">
                {/* Drawer Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <Badge
                      variant={
                        selectedPoint.status === "critical"
                          ? "destructive"
                          : selectedPoint.status === "warning"
                          ? "warning"
                          : "success"
                      }
                      className="text-[10px] uppercase font-bold"
                    >
                      {selectedPoint.status === "critical"
                        ? "Statutory Infractions Active"
                        : selectedPoint.status === "warning"
                        ? "Minor Discrepancy"
                        : "Fully Compliant"}
                    </Badge>
                    <h3 className="text-sm font-bold text-slate-100 mt-1.5 leading-snug">
                      {selectedPoint.locationName}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedPoint.address}</p>
                  </div>
                  <button
                    onClick={() => setSelectedPoint(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Score & Coordinates */}
                <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                      Compliance Rating
                    </span>
                    <span
                      className={`text-lg font-bold font-mono ${
                        selectedPoint.complianceScore < 70 ? "text-red-400" : "text-emerald-400"
                      }`}
                    >
                      {selectedPoint.complianceScore}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                      Geotag Coordinates
                    </span>
                    <span className="text-[11px] font-mono text-slate-300 block truncate">
                      {selectedPoint.lat.toFixed(4)}°N, {selectedPoint.lng.toFixed(4)}°E
                    </span>
                  </div>
                </div>

                {/* Commodity Identity */}
                <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Package className="w-3.5 h-3.5 text-blue-400" />
                    <span className="font-semibold text-slate-200">
                      {selectedPoint.commodityName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    <span>Audit Officer: {selectedPoint.inspector}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Inspection Date: {selectedPoint.date}</span>
                  </div>
                </div>

                {/* Violation Detail if Any */}
                {selectedPoint.violationType && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-300 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      <span>{selectedPoint.violationType} Infraction</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Detected {selectedPoint.violationsCount} non-compliances under PCR 2011.
                      Statutory notices and compounding assessments queued for processing.
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <Link href={`/inspections?search=${encodeURIComponent(selectedPoint.locationName)}`}>
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full text-xs gap-1.5 bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-950/40"
                  >
                    <span>View Inspection Audit Log</span>
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </Link>
                <Link href="/violations">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs border-slate-700 bg-slate-800/60 text-slate-300"
                  >
                    <span>Inspect Violation Dossier</span>
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Metrics Pill */}
        <div className="absolute left-6 bottom-6 z-20 flex items-center gap-4 px-4 py-2.5 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 text-xs shadow-xl">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">National Compliance Avg:</span>
            <span className="font-mono font-bold text-slate-100">{avgCompliance}%</span>
          </div>
          <div className="w-px h-4 bg-slate-700" />
          <div className="flex items-center gap-2">
            <span className="text-slate-400">High-Risk Enforcement Clusters:</span>
            <span className="font-mono font-bold text-red-400">{criticalHotspotsCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
