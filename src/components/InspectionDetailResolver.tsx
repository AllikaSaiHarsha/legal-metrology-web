"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import InspectionAuditView from "./InspectionAuditView";
import { getInspectionById, Inspection, Product, Violation } from "@/lib/inspectionsStore";

interface Props {
  id: string;
  initialInspection?: Inspection;
  initialProduct?: Product;
  initialViolations?: Violation[];
}

export default function InspectionDetailResolver({
  id,
  initialInspection,
  initialProduct,
  initialViolations,
}: Props) {
  const [data, setData] = useState<{
    inspection?: Inspection;
    product?: Product;
    violations: Violation[];
  }>({ violations: [] });

  useEffect(() => {
    if (initialInspection && initialProduct) {
      setData({
        inspection: initialInspection,
        product: initialProduct,
        violations: initialViolations || [],
      });
    } else {
      setData(getInspectionById(id));
    }
  }, [id, initialInspection, initialProduct, initialViolations]);

  if (!data.inspection || !data.product) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-zinc-100 mb-2">
          Inspection Record Not Found
        </h2>
        <p className="text-zinc-400 text-xs max-w-sm mb-6">
          The requested inspection ID &ldquo;{id}&rdquo; was not found in the current session registry.
        </p>
        <Link
          href="/inspections"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Inspections Registry</span>
        </Link>
      </div>
    );
  }

  return (
    <InspectionAuditView
      inspection={data.inspection}
      product={data.product}
      violations={data.violations}
    />
  );
}
