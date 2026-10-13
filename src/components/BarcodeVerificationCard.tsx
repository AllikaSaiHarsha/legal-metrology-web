"use client";

import React, { useState } from "react";
import {
  Barcode,
  Search,
  CheckCircle2,
  AlertTriangle,
  Building,
  Scale,
  ShieldAlert,
  PlusCircle,
  ExternalLink,
  QrCode,
  Tag,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface MasterProductRecord {
  id: string;
  name: string;
  manufacturer: string;
  category: string;
  netQuantity: string;
  mrp: number;
  batchNo?: string;
  barcode?: string;
  complianceStatus?: string;
  imageUrl?: string | null;
}

interface BarcodeVerificationCardProps {
  currentOcrMrp?: number;
  currentOcrQuantity?: string;
  onApplyProductInfo?: (product: MasterProductRecord) => void;
  onAddViolation?: (violation: {
    ruleCode: string;
    ruleTitle: string;
    description: string;
    severity: "critical" | "major";
  }) => void;
}

export default function BarcodeVerificationCard({
  currentOcrMrp,
  currentOcrQuantity,
  onApplyProductInfo,
  onAddViolation,
}: BarcodeVerificationCardProps) {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<{
    found: boolean;
    source?: string;
    registryName?: string;
    barcode?: string;
    isIndianGS1?: boolean;
    product?: MasterProductRecord;
    message?: string;
  } | null>(null);

  const handleLookup = async (codeToLookup?: string) => {
    const code = (codeToLookup || barcodeInput).trim();
    if (!code) return;

    setIsLoading(true);
    setLookupResult(null);

    try {
      const res = await fetch(`/api/barcode/${encodeURIComponent(code)}`);
      const data = await res.json();
      setLookupResult(data);

      if (data.found && data.product && onApplyProductInfo) {
        onApplyProductInfo(data.product);
      }
    } catch (err) {
      console.error("Barcode lookup error:", err);
      setLookupResult({
        found: false,
        message: "Failed to connect to master barcode registry.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSelect = (code: string) => {
    setBarcodeInput(code);
    handleLookup(code);
  };

  // Dual MRP Tampering Check
  const hasDualMrpAlert = Boolean(
    lookupResult?.found &&
      lookupResult.product?.mrp &&
      lookupResult.product.mrp > 0 &&
      currentOcrMrp &&
      currentOcrMrp > lookupResult.product.mrp
  );

  const priceDiff = hasDualMrpAlert && lookupResult?.product?.mrp
    ? (currentOcrMrp! - lookupResult.product.mrp).toFixed(2)
    : "0";

  return (
    <div className="p-4 rounded-2xl liquid-glass-card border border-slate-800 space-y-4">
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/25 text-blue-400">
            <Barcode className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <span>GS1 Barcode & Anti-Tamper Verification</span>
              <Badge variant="outline" className="text-[9px] border-blue-500/30 text-blue-400">
                Rule 18(2) PCR
              </Badge>
            </h3>
            <p className="text-[11px] text-slate-400">
              Cross-verify scanned packaging against national GTIN / LMPC registry
            </p>
          </div>
        </div>

        {lookupResult?.isIndianGS1 && (
          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
            🇮🇳 GS1 India 890
          </Badge>
        )}
      </div>

      {/* Input & Lookup Row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            placeholder="Enter EAN-13 / GTIN barcode (e.g., 8901030018507)..."
            className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
          <QrCode className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={() => handleLookup()}
          disabled={isLoading || !barcodeInput.trim()}
          className="text-xs bg-blue-600 hover:bg-blue-500 text-white gap-1.5 shadow-md shadow-blue-950/40"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Search className="w-3.5 h-3.5" />
          )}
          <span>Verify</span>
        </Button>
      </div>

      {/* Quick Test Barcodes */}
      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 flex-wrap">
        <span className="text-slate-500 text-[10px] uppercase font-semibold">Quick Test:</span>
        <button
          type="button"
          onClick={() => handleQuickSelect("8901030018507")}
          className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] border border-slate-700/60 transition"
        >
          Tata Salt (8901030018507)
        </button>
        <button
          type="button"
          onClick={() => handleQuickSelect("8901262010041")}
          className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] border border-slate-700/60 transition"
        >
          Amul Butter (8901262010041)
        </button>
        <button
          type="button"
          onClick={() => handleQuickSelect("8901063012213")}
          className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] border border-slate-700/60 transition"
        >
          Britannia (8901063012213)
        </button>
      </div>

      {/* Lookup Result Box */}
      {lookupResult && (
        <div className="space-y-3 pt-1">
          {lookupResult.found && lookupResult.product ? (
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-bold text-slate-100">
                      {lookupResult.product.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Manufacturer: {lookupResult.product.manufacturer}
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-300">
                  {lookupResult.registryName || "Verified Master SKU"}
                </Badge>
              </div>

              {/* Master Specs Grid */}
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                    Registered MRP
                  </span>
                  <span className="font-mono font-bold text-emerald-400">
                    {lookupResult.product.mrp > 0
                      ? `₹${lookupResult.product.mrp.toFixed(2)}`
                      : "Official Tariff"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                    Standard Quantity
                  </span>
                  <span className="font-mono font-semibold text-slate-200">
                    {lookupResult.product.netQuantity || "1 Standard Pack"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                    Classification
                  </span>
                  <span className="text-slate-300 truncate block">
                    {lookupResult.product.category || "FMCG"}
                  </span>
                </div>
              </div>

              {/* DUAL MRP TAMPER ALERT */}
              {hasDualMrpAlert && (
                <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    <span>DUAL MRP / OVERPRICING DETECTED!</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-red-300">
                    Physical label price (₹{currentOcrMrp?.toFixed(2)}) exceeds the authorized master
                    registered MRP (₹{lookupResult.product.mrp.toFixed(2)}) by ₹{priceDiff}. Direct
                    contravention of Section 18 / Rule 18(2) of PCR 2011.
                  </p>
                  {onAddViolation && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() =>
                        onAddViolation({
                          ruleCode: "PCR-R18-2",
                          ruleTitle: "Dual MRP & Unauthorized Sticker Alteration",
                          description: `Physical label price sticker (INR ${currentOcrMrp}) exceeds authorized GTIN master registered MRP (INR ${lookupResult.product?.mrp}) by INR ${priceDiff}.`,
                          severity: "critical",
                        })
                      }
                      className="bg-red-600 hover:bg-red-500 text-white text-[11px] h-7 px-2.5 gap-1 shadow-md shadow-red-950/40"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Record Dual MRP Infraction</span>
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Uncataloged Commodity SKU</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {lookupResult.message ||
                  "This barcode is not yet registered in the central LMPC repository or GS1 index."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
