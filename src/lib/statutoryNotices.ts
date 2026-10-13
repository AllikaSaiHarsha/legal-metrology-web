import { Inspection, Product, Violation } from "./inspectionsStore";

export type NoticeType = "show_cause" | "compounding" | "seizure_memo";
export type OffenceTier = "first" | "second" | "subsequent";

export interface StatutoryNoticeData {
  noticeType: NoticeType;
  noticeRef: string;
  issueDate: string;
  hearingDays: number;
  // Entity
  respondentName: string;
  respondentAddress: string;
  establishmentType: "Manufacturer" | "Packer" | "Importer" | "Retailer" | "Wholesaler";
  // Inspection & Product
  inspectionId: string;
  inspectionDate: string;
  inspectionLocation: string;
  inspectorName: string;
  jurisdiction: string;
  productName: string;
  category: string;
  batchNo: string;
  mrpDeclared: number;
  netQuantityDeclared: string;
  // Violations
  violations: Array<{
    ruleCode: string;
    ruleTitle: string;
    description: string;
    severity: string;
  }>;
  // Compounding specific
  offenceTier: OffenceTier;
  compoundingFee: number;
  // Seizure specific
  seizedUnits: number;
  sampleUnitsSeized: number;
  panch1Name: string;
  panch2Name: string;
  panch1Address: string;
  panch2Address: string;
}

export const STATUTORY_PENALTY_RATES: Record<OffenceTier, { baseFee: number; label: string; section: string }> = {
  first: {
    baseFee: 25000,
    label: "First Offence (Section 36(1))",
    section: "Section 36(1) of the Legal Metrology Act, 2009 - Fine up to ₹25,000",
  },
  second: {
    baseFee: 50000,
    label: "Second Offence (Section 36(1) Proviso)",
    section: "Section 36(1) Proviso of the Legal Metrology Act, 2009 - Fine up to ₹50,000",
  },
  subsequent: {
    baseFee: 100000,
    label: "Subsequent Offence (Section 36(2))",
    section: "Section 36(2) of the Legal Metrology Act, 2009 - Fine up to ₹1,00,000 or Imprisonment up to 1 Year",
  },
};

export function calculateCompoundingFee(
  violationsCount: number,
  tier: OffenceTier
): number {
  const base = STATUTORY_PENALTY_RATES[tier].baseFee;
  // Additional composition penalty per secondary violation infraction
  const additional = Math.max(0, violationsCount - 1) * 5000;
  return base + additional;
}

export function generateDefaultNoticeData(
  inspection: Inspection,
  product?: Product,
  violations: Violation[] = []
): StatutoryNoticeData {
  const year = new Date().getFullYear();
  const noticeRef = `DLM/SCN/${year}/${inspection.id.slice(-6).toUpperCase()}`;
  const today = new Date().toISOString().split("T")[0];

  return {
    noticeType: "show_cause",
    noticeRef,
    issueDate: today,
    hearingDays: 15,
    respondentName: product?.manufacturer || "M/s Packaged Commodity Trading Entity",
    respondentAddress: inspection.location || "Central Enforcement Jurisdiction, India",
    establishmentType: "Manufacturer",
    inspectionId: inspection.id,
    inspectionDate: inspection.date || today,
    inspectionLocation: inspection.location || "Authorized Commercial Premises",
    inspectorName: inspection.inspector || "Authorized Legal Metrology Officer",
    jurisdiction: "District Enforcement Division, Directorate of Legal Metrology",
    productName: product?.name || "Pre-packaged Commodity",
    category: product?.category || "Packaged Goods",
    batchNo: product?.batchNo || "BATCH-UNSPECIFIED",
    mrpDeclared: product?.mrp ?? 0,
    netQuantityDeclared: product?.netQuantity || "Unspecified",
    violations: violations.map((v) => ({
      ruleCode: v.ruleCode,
      ruleTitle: v.ruleTitle,
      description: v.description,
      severity: v.severity,
    })),
    offenceTier: "first",
    compoundingFee: calculateCompoundingFee(violations.length, "first"),
    seizedUnits: 25,
    sampleUnitsSeized: 3,
    panch1Name: "Ram Kumar Verma",
    panch2Name: "Anil Sharma",
    panch1Address: "Local Resident / Independent Trader, Market Ward 4",
    panch2Address: "Local Resident / Independent Witness, Market Ward 4",
  };
}
