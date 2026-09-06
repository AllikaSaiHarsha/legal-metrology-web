"use client";

import React from "react";
import { Product, Inspection } from "@/lib/inspectionsStore";

interface Props {
  product: Product;
  inspection: Inspection;
}

export default function PackageLabelMockup({ product, inspection }: Props) {
  const isCompliant = product.complianceStatus === "compliant";

  return (
    <div className="relative w-full h-full min-h-[460px] bg-slate-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center p-4 select-none">
      {/* Packaging Container Canvas */}
      <div className="relative w-full max-w-[420px] aspect-[3/4] bg-gradient-to-b from-amber-50 via-white to-amber-50/80 rounded-2xl shadow-2xl p-6 text-slate-800 flex flex-col justify-between border-4 border-amber-200/60 overflow-hidden">
        {/* Background decorative packaging pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(#000 1px, transparent 1px), radial-gradient(#000 1px, transparent 1px)",
            backgroundSize: "16px 16px",
            backgroundPosition: "0 0, 8px 8px",
          }}
        />

        {/* Top Branding Section */}
        <div className="text-center border-b-2 border-slate-800/10 pb-4 relative">
          <span className="inline-block px-3 py-0.5 rounded-full bg-indigo-900 text-white text-[9px] font-bold tracking-widest uppercase mb-1">
            Standard Packaged Commodity
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
            {product.name}
          </h2>
          <p className="text-[11px] font-medium text-slate-600 mt-0.5">
            Manufactured & Packed by {product.manufacturer}
          </p>
        </div>

        {/* Middle Mandatory Packaging Declarations Box */}
        <div className="my-auto space-y-3 bg-white/70 backdrop-blur-sm p-4 rounded-xl border border-slate-200/80 shadow-sm text-xs">
          {/* Net Quantity */}
          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500 font-bold uppercase text-[10px]">
              Net Quantity / Wt:
            </span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              {product.netQuantity}
            </span>
          </div>

          {/* Maximum Retail Price */}
          <div className="flex items-center justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500 font-bold uppercase text-[10px]">
              Maximum Retail Price:
            </span>
            <div className="text-right">
              <span className="font-mono font-black text-slate-900 text-base">
                ₹{product.mrp.toFixed(2)}
              </span>
              <span className="block text-[9px] text-slate-600 font-medium">
                {isCompliant
                  ? "(Inclusive of all taxes)"
                  : "(Taxes extra / incomplete declaration)"}
              </span>
            </div>
          </div>

          {/* Mfg Date & Batch */}
          <div className="grid grid-cols-2 gap-2 py-1 border-b border-slate-100">
            <div>
              <span className="text-slate-500 font-bold uppercase text-[9px] block">
                Mfg / Pkg Date:
              </span>
              <span className="font-mono font-bold text-slate-800 text-xs">
                {product.mfgDate}
              </span>
            </div>
            <div>
              <span className="text-slate-500 font-bold uppercase text-[9px] block">
                Batch / Lot No:
              </span>
              <span className="font-mono font-semibold text-slate-800 text-xs">
                {product.batchNo}
              </span>
            </div>
          </div>

          {/* Expiry Date */}
          <div className="py-1 border-b border-slate-100">
            <span className="text-slate-500 font-bold uppercase text-[9px] block">
              Best Before / Expiry:
            </span>
            <span className="font-mono font-bold text-slate-800 text-xs">
              {product.expiryDate || "12 Months from Date of Packaging"}
            </span>
          </div>

          {/* Consumer Care */}
          <div className="pt-1">
            <span className="text-slate-500 font-bold uppercase text-[9px] block">
              Consumer Care Cell:
            </span>
            <p className="text-[10px] text-slate-700 font-medium leading-tight">
              Toll Free: 1800-22-1111 • Email: care@{product.manufacturer.toLowerCase().replace(/[^a-z0-9]/g, "") || "company"}.com
            </p>
          </div>
        </div>

        {/* Bottom Statutory Compliance Bar & Barcode */}
        <div className="pt-3 border-t-2 border-slate-800/10 flex items-center justify-between text-[9px] text-slate-500 font-mono">
          <div>
            <span className="font-bold text-slate-700 block">FSSAI Lic. No. 10012345678901</span>
            <span>Country of Origin: India</span>
          </div>

          {/* Stylized Barcode */}
          <div className="flex flex-col items-end">
            <div className="flex gap-[2px] h-6 items-end">
              {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 3].map((w, i) => (
                <div
                  key={i}
                  className="bg-slate-800 h-full"
                  style={{ width: `${w}px` }}
                />
              ))}
            </div>
            <span className="text-[8px] tracking-widest mt-0.5">8 901030 500214</span>
          </div>
        </div>
      </div>
    </div>
  );
}
