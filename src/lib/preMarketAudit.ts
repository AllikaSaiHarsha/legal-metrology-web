export interface PreMarketCheckItem {
  id: string;
  category: string;
  ruleCitation: string;
  label: string;
  required: boolean;
  status: "pass" | "fail" | "warning";
  detectedValue?: string;
  specRequirement: string;
}

export interface PreMarketAuditData {
  certificateId: string;
  date: string;
  brandName: string;
  manufacturerName: string;
  skuTitle: string;
  packageAreaCm2: number;
  declaredNetQuantity: string;
  declaredMrp: number;
  overallScore: number;
  verdict: "APPROVED_FOR_PRINT" | "REVISIONS_REQUIRED";
  checks: PreMarketCheckItem[];
}

export const DEFAULT_PRE_MARKET_RULES: PreMarketCheckItem[] = [
  {
    id: "CHK-01",
    category: "Principal Display Panel",
    ruleCitation: "PCR 2011 Rule 6(1)(a)",
    label: "Generic / Common Commodity Name",
    required: true,
    status: "pass",
    detectedValue: "Present on Principal Panel",
    specRequirement: "Must appear prominently on front display panel without misleading imagery.",
  },
  {
    id: "CHK-02",
    category: "Manufacturer Identity",
    ruleCitation: "PCR 2011 Rule 6(1)(b)",
    label: "Complete Name & Physical Address",
    required: true,
    status: "pass",
    detectedValue: "Full premises address with Pin Code",
    specRequirement: "Must state registered premise, city, state, pin code of packer/manufacturer.",
  },
  {
    id: "CHK-03",
    category: "Standard Metric Units",
    ruleCitation: "PCR 2011 Rule 13 & Second Schedule",
    label: "Net Quantity Symbol Compliance",
    required: true,
    status: "pass",
    detectedValue: "Standard 'g' / 'kg' / 'ml' / 'L' symbols",
    specRequirement: "Prohibited abbreviations: 'gms', 'kgs', 'ltrs'. Must use official SI units.",
  },
  {
    id: "CHK-04",
    category: "Numeral Height Standards",
    ruleCitation: "PCR 2011 Table I (Numeral Font Height)",
    label: "Minimum Font Height for Net Quantity",
    required: true,
    status: "pass",
    detectedValue: "Height: 4.2mm (Complies with >200g-1kg bracket)",
    specRequirement: "Packages 200g to 1kg require minimum numeral height of 4.0mm.",
  },
  {
    id: "CHK-05",
    category: "Price & Unit Sale Price",
    ruleCitation: "PCR 2011 Rule 6(1)(e) & 6(11)",
    label: "MRP inclusive of all taxes & USP",
    required: true,
    status: "pass",
    detectedValue: "MRP declared with 'incl. of all taxes' & USP per gram",
    specRequirement: "Must state 'Maximum Retail Price ₹... (inclusive of all taxes)' plus Unit Sale Price.",
  },
  {
    id: "CHK-06",
    category: "Consumer Helpline",
    ruleCitation: "PCR 2011 Rule 6(1)(g)",
    label: "Consumer Care Telephone & Email",
    required: true,
    status: "pass",
    detectedValue: "Toll-free number, email & consumer address",
    specRequirement: "Must provide designated executive contact, telephone number, email, and address.",
  },
  {
    id: "CHK-07",
    category: "Manufacture & Expiry Timelines",
    ruleCitation: "PCR 2011 Rule 6(1)(d)",
    label: "Month & Year of Packing / Expiry",
    required: true,
    status: "pass",
    detectedValue: "Declared as MM/YYYY format",
    specRequirement: "Month and year of packaging must be clearly visible and indelible.",
  },
];
