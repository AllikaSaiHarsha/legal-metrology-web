"use client";

import { Detection } from "@/lib/api";
import {
  saveImageToIDB,
  getImageFromIDB,
  getAllImagesFromIDB,
  deleteImageFromIDB,
} from "@/lib/idb";

export interface Product {
  id: string;
  name: string;
  category: string;
  manufacturer: string;
  mfgDate: string;
  expiryDate: string;
  batchNo: string;
  netQuantity: string;
  mrp: number;
  complianceStatus: "compliant" | "non-compliant" | "pending";
}

export interface Inspection {
  id: string;
  productId: string;
  inspector: string;
  date: string;
  location: string;
  status: "completed" | "in-progress" | "scheduled";
  imageUrl: string;
  findings: string[];
  complianceScore: number;
  detections?: Detection[];
}

export interface Violation {
  id: string;
  inspectionId: string;
  ruleCode: string;
  ruleTitle: string;
  description: string;
  severity: "critical" | "major" | "minor";
  remediation: string;
  status: "open" | "resolved" | "under-review";
}

export interface RecentInspectionItem {
  id: string;
  product: string;
  inspector: string;
  location: string;
  date: string;
  status: string;
  complianceScore: number;
}

export interface StoreData {
  products: Product[];
  inspections: Inspection[];
  violations: Violation[];
}

const STORAGE_KEY = "legal_metrology_inspections_data_v2";
const EVENT_NAME = "legal-metrology-store-update";
const IMAGE_PREFIX = "lm_img_";

// Fast in-memory cache for large base64/blob images
const memoryImageCache = new Map<string, string>();
let isIDBHydrating = false;
let hasHydratedIDB = false;

function getInitialStore(): StoreData {
  return {
    products: [],
    inspections: [],
    violations: [],
  };
}

/** Save an image across Memory, SessionStorage, and IndexedDB. */
export function setCachedImage(id: string, imageUrl: string): void {
  if (!id || !imageUrl) return;
  memoryImageCache.set(id, imageUrl);
  saveImageToSession(id, imageUrl);
  saveImageToIDB(id, imageUrl);
}

/** Synchronous lookup from memory cache or session storage. */
export function getCachedImage(id: string): string {
  if (!id) return "";
  return memoryImageCache.get(id) || getImageFromSession(id) || "";
}

/** Retrieve image asynchronously from IndexedDB if not in memory. */
export async function getInspectionImage(id: string): Promise<string> {
  const sync = getCachedImage(id);
  if (sync) return sync;
  const idb = await getImageFromIDB(id);
  if (idb) {
    memoryImageCache.set(id, idb);
    saveImageToSession(id, idb);
    return idb;
  }
  return "";
}

/** Asynchronously hydrate in-memory cache with all images from IndexedDB. */
export async function hydrateImagesFromIDB(): Promise<void> {
  if (typeof window === "undefined" || isIDBHydrating || hasHydratedIDB) return;
  isIDBHydrating = true;
  try {
    const allImages = await getAllImagesFromIDB();
    let updatedAny = false;
    for (const [id, url] of Object.entries(allImages)) {
      if (url && !memoryImageCache.has(id)) {
        memoryImageCache.set(id, url);
        saveImageToSession(id, url);
        updatedAny = true;
      }
    }
    hasHydratedIDB = true;
    if (updatedAny) {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: loadStore() }));
    }
  } catch (err) {
    console.warn("Failed to hydrate images from IDB:", err);
  } finally {
    isIDBHydrating = false;
  }
}

/** Normalize any /uploads/ URL to local root-relative path */
export function normalizeImageUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("data:image") || url.startsWith("blob:")) return url;
  const match = url.match(/\/uploads\/([^\/\?#]+)$/);
  if (match) {
    return `/uploads/${match[1]}`;
  }
  return url;
}

export function loadStore(): StoreData {
  if (typeof window === "undefined") {
    return getInitialStore();
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialStore();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed: StoreData = JSON.parse(raw);

    // Re-attach images from memory or sessionStorage where available
    parsed.inspections = parsed.inspections.map((ins) => {
      const cached = getCachedImage(ins.id);
      if (cached) {
        return { ...ins, imageUrl: cached };
      }
      if (ins.imageUrl.startsWith("__session__") || ins.imageUrl.startsWith("__idb__")) {
        return { ...ins, imageUrl: cached || "" };
      }
      return { ...ins, imageUrl: normalizeImageUrl(ins.imageUrl) };
    });

    // Fire background IDB hydration if not done yet
    if (!hasHydratedIDB && !isIDBHydrating) {
      setTimeout(() => hydrateImagesFromIDB(), 10);
    }

    return parsed;
  } catch (err) {
    return getInitialStore();
  }
}

// Ensure the local store is hydrated from the real DB on load
let hasFetchedFromDB = false;
export async function hydrateStoreFromDB(): Promise<void> {
  if (typeof window === "undefined" || hasFetchedFromDB) return;
  try {
    const res = await fetch("/api/db/inspections");
    if (res.ok) {
      const data = await res.json();
      const newStore = {
        inspections: data.inspections || [],
        products: data.products || [],
        violations: data.violations || [],
      };
      // Format the detections back into the nested shape the UI expects
      newStore.inspections.forEach((ins: any) => {
        // Re-attach local high-resolution cached image if available
        const cached = getCachedImage(ins.id);
        if (cached) {
          ins.imageUrl = cached;
        } else {
          ins.imageUrl = normalizeImageUrl(ins.imageUrl);
        }

        if (ins.detections) {
          ins.detections = ins.detections.map((d: any) => ({
            id: d.id,
            category: d.category,
            label: d.label,
            status: d.status,
            boxX: d.boxX,
            boxY: d.boxY,
            boxWidth: d.boxWidth,
            boxHeight: d.boxHeight,
            box: {
              x: d.boxX,
              y: d.boxY,
              width: d.boxWidth,
              height: d.boxHeight
            }
          }));
        }
      });
      saveStore(newStore);
      hasFetchedFromDB = true;
    }
  } catch (err) {
    console.error("Failed to hydrate from DB", err);
  }
}

/** Save a base64 image for a specific inspection ID into sessionStorage. */
function saveImageToSession(inspectionId: string, imageUrl: string): void {
  if (typeof window === "undefined") return;
  if (!imageUrl || !imageUrl.startsWith("data:image")) return;
  try {
    sessionStorage.setItem(`${IMAGE_PREFIX}${inspectionId}`, imageUrl);
  } catch {
    // sessionStorage quota reached
  }
}

/** Retrieve a base64 image for an inspection from sessionStorage. */
export function getImageFromSession(inspectionId: string): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(`${IMAGE_PREFIX}${inspectionId}`) || "";
}

export function saveStore(data: StoreData): void {
  if (typeof window === "undefined") return;

  // Persist images to Memory, SessionStorage, and IndexedDB
  const slimInspections = data.inspections.map((ins) => {
    const isLarge =
      ins.imageUrl &&
      (ins.imageUrl.startsWith("data:image") || ins.imageUrl.startsWith("blob:") || ins.imageUrl.length > 500);

    if (isLarge) {
      setCachedImage(ins.id, ins.imageUrl);
      return { ...ins, imageUrl: `__idb__${ins.id}` };
    }

    if (ins.imageUrl.startsWith("__idb__") || ins.imageUrl.startsWith("__session__")) {
      const cached = getCachedImage(ins.id);
      if (cached) {
        saveImageToIDB(ins.id, cached);
      }
      return ins;
    }

    return ins;
  });

  const slimData: StoreData = { ...data, inspections: slimInspections };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slimData));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: loadStore() }));
  } catch (err) {
    console.warn("localStorage quota exceeded even with slim items.", err);
    try {
      const barebonesData: StoreData = {
        ...slimData,
        inspections: slimInspections.map((ins) => ({
          ...ins,
          imageUrl: `__idb__${ins.id}`,
        })),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(barebonesData));
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: loadStore() }));
    } catch (fallbackErr) {
      console.error("Critical failure: Could not save store.", fallbackErr);
    }
  }
}


export function subscribeStore(callback: (data: StoreData) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const handler = () => {
    callback(loadStore());
  };

  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", handler);

  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
  };
}

export function getInspections(): Inspection[] {
  return loadStore().inspections;
}

export function getProducts(): Product[] {
  return loadStore().products;
}

export function getViolations(): Violation[] {
  return loadStore().violations;
}

export function getInspectionById(id: string): {
  inspection?: Inspection;
  product?: Product;
  violations: Violation[];
} {
  const store = loadStore();
  const inspection = store.inspections.find((i) => i.id === id);
  if (!inspection) {
    return { violations: [] };
  }
  const product = store.products.find((p) => p.id === inspection.productId);
  const violations = store.violations.filter((v) => v.inspectionId === id);

  return { inspection, product, violations };
}

export interface SaveScannedPayload {
  productName: string;
  manufacturer?: string;
  batchNo?: string;
  detections: Detection[];
  imageUrl: string;
  inspectorName?: string;
  location?: string;
}

export function saveScannedInspection(payload: SaveScannedPayload): {
  inspection: Inspection;
  product: Product;
  violations: Violation[];
} {
  const store = loadStore();

  const scanCount = store.inspections.filter((i) => i.id.startsWith("INS-SCAN")).length + 1;
  const inspectionId = `INS-SCAN-${String(scanCount).padStart(3, "0")}`;
  const productId = `PRD-SCAN-${String(scanCount).padStart(3, "0")}`;

  // Extract values from the 5 targeted Legal Metrology detections
  let detectedMrp = 0;
  let detectedNetQty = "Not Declared";
  let detectedMfgDate = new Date().toISOString().split("T")[0];
  let detectedExpDate = "Not Declared";

  const violations: Violation[] = [];
  let passedCount = 0;
  let failedCount = 0;

  payload.detections.forEach((det, idx) => {
    const isPassed = det.status === "Passed";
    const isFailed = det.status === "Failed";

    if (isPassed) passedCount++;
    if (isFailed) failedCount++;

    const category = det.category || "General";
    const vioId = `VIO-SCAN-${String(scanCount).padStart(2, "0")}-${idx + 1}`;

    // Extract extracted values for product details
    if (category === "MRP") {
      const priceMatch = det.label.match(/(?:Rs\.?|₹|INR)?\s*(\d+(?:\.\d{1,2})?)/i);
      if (priceMatch) detectedMrp = parseFloat(priceMatch[1]);
    } else if (category === "Net Weight") {
      const qtyMatch = det.label.match(/(\d+(?:\.\d+)?\s*(?:g|gm|gms|kg|ml|l|ltr|cc|pieces|units|n))/i);
      if (qtyMatch) detectedNetQty = qtyMatch[1];
    } else if (category === "Manufacture Date") {
      const mfgMatch = det.label.match(/(\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4}|\d{1,2}[./\-]\d{2,4}|[A-Za-z]{3,9}\s*\d{2,4})/i);
      if (mfgMatch) detectedMfgDate = mfgMatch[1];
    } else if (category === "Expire Date") {
      const expMatch = det.label.match(/(\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4}|\d+\s*Months?(?:\s*from\s*mfg)?)/i);
      if (expMatch) detectedExpDate = expMatch[1];
    }

    // If detection failed, log as a violation
    if (isFailed) {
      const ruleCodeMap: Record<string, string> = {
        MRP: "LM-R6(1)(a)",
        "Net Weight": "LM-R6(1)(b)",
        "Manufacture Date": "LM-R6(1)(d)",
        "Expire Date": "LM-R6(1)(e)",
        "Consumer Info": "LM-R6(1)(g)",
      };

      violations.push({
        id: vioId,
        inspectionId: inspectionId,
        ruleCode: ruleCodeMap[category] || `LM-R${idx + 1}`,
        ruleTitle: `${category} Statutory Non-Compliance`,
        description: det.label,
        severity: category === "MRP" || category === "Net Weight" ? "critical" : "major",
        remediation: `Correct package printing to conform to Rule 6 of Legal Metrology (Packaged Commodities) Rules, 2011.`,
        status: "open",
      });
    }
  });

  const totalDetections = payload.detections.length;
  const complianceScore =
    totalDetections > 0
      ? Math.round((passedCount / totalDetections) * 100)
      : 80;

  const isCompliant = failedCount === 0 && passedCount >= 3;

  const newProduct: Product = {
    id: productId,
    name: payload.productName || "Scanned Commodity",
    category: "Packaged Commodity",
    manufacturer: payload.manufacturer || "Manufacturer (Per OCR Detection)",
    mfgDate: detectedMfgDate,
    expiryDate: detectedExpDate,
    batchNo: payload.batchNo || `LOT-${new Date().getFullYear()}-${String(scanCount).padStart(3, "0")}`,
    netQuantity: detectedNetQty,
    mrp: detectedMrp || 99,
    complianceStatus: isCompliant ? "compliant" : "non-compliant",
  };

  const newInspection: Inspection = {
    id: inspectionId,
    productId: productId,
    inspector: payload.inspectorName || "Rajesh Kumar (Senior Inspector)",
    date: new Date().toISOString().split("T")[0],
    location: payload.location || "Mumbai Central Enforcement Zone",
    status: "completed",
    imageUrl: payload.imageUrl,
    findings: payload.detections.map((d) => d.label),
    complianceScore: complianceScore,
    detections: payload.detections,
  };

  store.products.unshift(newProduct);
  store.inspections.unshift(newInspection);
  store.violations.unshift(...violations);

  saveStore(store);

  // Background sync to real DB
  if (typeof window !== "undefined") {
    fetch("/api/db/inspections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inspection: newInspection,
        product: newProduct,
        violations: violations
      })
    }).catch(console.error);
  }

  return {
    inspection: newInspection,
    product: newProduct,
    violations: violations,
  };
}

export function updateInspectionProduct(
  inspectionId: string,
  updates: { productName?: string; manufacturer?: string }
): void {
  const store = loadStore();
  const inspection = store.inspections.find((i) => i.id === inspectionId);
  if (inspection) {
    const product = store.products.find((p) => p.id === inspection.productId);
    if (product) {
      if (updates.productName) product.name = updates.productName;
      if (updates.manufacturer) product.manufacturer = updates.manufacturer;
      saveStore(store);
    }
  }
}

export function deleteInspection(inspectionId: string): void {
  const store = loadStore();
  
  const inspectionIndex = store.inspections.findIndex((i) => i.id === inspectionId);
  if (inspectionIndex !== -1) {
    const productId = store.inspections[inspectionIndex].productId;
    
    // Remove the inspection
    store.inspections.splice(inspectionIndex, 1);
    
    // Remove the associated product
    store.products = store.products.filter(p => p.id !== productId);
    
    // Remove all associated violations
    store.violations = store.violations.filter(v => v.inspectionId !== inspectionId);
    
    memoryImageCache.delete(inspectionId);
    deleteImageFromIDB(inspectionId);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(`${IMAGE_PREFIX}${inspectionId}`);
      } catch {}
    }

    saveStore(store);

    // Background sync to real DB
    if (typeof window !== "undefined") {
      fetch(`/api/db/inspections/${inspectionId}`, {
        method: "DELETE"
      }).catch(console.error);
    }
  }
}

export function getDynamicDashboardStats(): {
  kpiStats: {
    totalInspections: number;
    complianceRate: number;
    activeViolations: number;
    pendingAudits: number;
    trend: {
      totalInspections: number;
      complianceRate: number;
      activeViolations: number;
      pendingAudits: number;
    };
  };
  recentInspections: RecentInspectionItem[];
  violationsByCategory: { category: string; count: number }[];
  monthlyTrend: { month: string; inspections: number; violations: number }[];
} {
  const store = loadStore();

  const total = store.inspections.length;
  const compliantCount = store.products.filter((p) => p.complianceStatus === "compliant").length;
  const complianceRate = total > 0 ? Number(((compliantCount / total) * 100).toFixed(1)) : 85.0;

  const activeViolations = store.violations.filter((v) => v.status === "open").length;
  const pendingAudits = store.inspections.filter((i) => i.status === "in-progress" || i.status === "scheduled").length;

  const recentInspections: RecentInspectionItem[] = store.inspections.slice(0, 6).map((ins) => {
    const prod = store.products.find((p) => p.id === ins.productId);
    return {
      id: ins.id,
      product: prod ? prod.name : "Packaged Commodity",
      inspector: ins.inspector,
      location: ins.location,
      date: ins.date,
      status: ins.status,
      complianceScore: ins.complianceScore || (prod?.complianceStatus === "compliant" ? 95 : 65),
    };
  });

  // Calculate dynamic violations by category
  const categoryCounts: Record<string, number> = {
    "MRP Declaration": 0,
    "Net Quantity": 0,
    "Date Marking": 0,
    "Consumer Info": 0,
    "Weight & Measure": 0,
    "Packaging": 0,
  };

  store.violations.forEach((v) => {
    if (v.ruleCode.includes("6(1)(a)") || v.ruleTitle.includes("MRP")) {
      categoryCounts["MRP Declaration"]++;
    } else if (v.ruleCode.includes("6(1)(b)") || v.ruleTitle.includes("Net")) {
      categoryCounts["Net Quantity"]++;
    } else if (v.ruleCode.includes("6(1)(d)") || v.ruleCode.includes("6(1)(e)") || v.ruleTitle.includes("Date")) {
      categoryCounts["Date Marking"]++;
    } else if (v.ruleCode.includes("6(1)(g)") || v.ruleTitle.includes("Consumer")) {
      categoryCounts["Consumer Info"]++;
    } else {
      categoryCounts["Packaging"]++;
    }
  });

  const violationsByCategory = Object.entries(categoryCounts)
    .filter(([_, count]) => count > 0)
    .map(([category, count]) => ({
      category,
      count: count,
    }));
    
  // If no violations exist yet, provide a single placeholder so pie chart renders a grey ring
  if (violationsByCategory.length === 0) {
    violationsByCategory.push({ category: "No Violations Found", count: 1 });
  }

  // Calculate dynamic Monthly Trend for the Area Chart
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentDate = new Date();
  
  // Generate buckets for the last 6 months
  const monthlyTrendMap: Record<string, { inspections: number; violations: number }> = {};
  const monthlyTrendArray = [];
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`;
    monthlyTrendMap[label] = { inspections: 0, violations: 0 };
    monthlyTrendArray.push(label);
  }

  // Populate inspections
  store.inspections.forEach(ins => {
    const date = new Date(ins.date);
    const label = `${monthNames[date.getMonth()]} ${date.getFullYear().toString().substring(2)}`;
    if (monthlyTrendMap[label]) {
      monthlyTrendMap[label].inspections++;
    }
  });

  // Populate violations (we look up the inspection date for each violation)
  store.violations.forEach(vio => {
    const parentIns = store.inspections.find(i => i.id === vio.inspectionId);
    if (parentIns) {
      const date = new Date(parentIns.date);
      const label = `${monthNames[date.getMonth()]} ${date.getFullYear().toString().substring(2)}`;
      if (monthlyTrendMap[label]) {
        monthlyTrendMap[label].violations++;
      }
    }
  });

  const monthlyTrend = monthlyTrendArray.map(label => ({
    month: label,
    inspections: monthlyTrendMap[label].inspections,
    violations: monthlyTrendMap[label].violations
  }));

  return {
    kpiStats: {
      totalInspections: total,
      complianceRate: complianceRate,
      activeViolations: activeViolations,
      pendingAudits: pendingAudits,
      trend: {
        totalInspections: total > 0 ? 100 : 0, 
        complianceRate: 0,
        activeViolations: 0,
        pendingAudits: 0,
      },
    },
    recentInspections,
    violationsByCategory,
    monthlyTrend
  };
}
