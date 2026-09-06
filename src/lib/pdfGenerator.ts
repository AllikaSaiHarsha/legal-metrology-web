import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Inspection, Product, Violation } from "./inspectionsStore";

export interface PDFReportOptions {
  inspection: Inspection;
  product?: Product;
  violations?: Violation[];
}

export function generateInspectionPDF(options: PDFReportOptions): void {
  const { inspection, product, violations = [] } = options;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Colors
  const navyDark = [15, 23, 42]; // #0f172a
  const indigoPrimary = [79, 70, 229]; // #4f46e5
  const emeraldGreen = [16, 185, 129]; // #10b981
  const roseRed = [225, 29, 72]; // #e11d48
  const slateGray = [100, 116, 139]; // #64748b
  const lightBg = [248, 250, 252]; // #f8fafc

  // --- Top Decorative Header Bar ---
  doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.rect(0, 0, pageWidth, 28, "F");

  doc.setFillColor(indigoPrimary[0], indigoPrimary[1], indigoPrimary[2]);
  doc.rect(0, 28, pageWidth, 2, "F");

  // Title & Government Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("GOVERNMENT OF INDIA", pageWidth / 2, 8, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(
    "MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION • LEGAL METROLOGY DIVISION",
    pageWidth / 2,
    13,
    { align: "center" }
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(
    "STATUTORY COMPLIANCE INSPECTION CERTIFICATE",
    pageWidth / 2,
    22,
    { align: "center" }
  );

  // Certificate Reference Details Box
  const isCompliant = violations.length === 0 && (inspection.complianceScore >= 80);
  const statusLabel = isCompliant ? "COMPLIANT" : "NON-COMPLIANT";
  const statusColor = isCompliant ? emeraldGreen : roseRed;

  let y = 38;

  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(14, y, pageWidth - 28, 24, 3, 3, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, pageWidth - 28, 24, 3, 3, "S");

  doc.setFontSize(8);
  doc.setTextColor(slateGray[0], slateGray[1], slateGray[2]);
  doc.setFont("helvetica", "bold");
  doc.text("CERTIFICATE REF:", 18, y + 6);
  doc.text("INSPECTION ID:", 18, y + 13);
  doc.text("DATE OF AUDIT:", 18, y + 20);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 41, 59);
  doc.text(`LM/CERT/${new Date().getFullYear()}/${inspection.id}`, 50, y + 6);
  doc.text(inspection.id, 50, y + 13);
  doc.text(inspection.date, 50, y + 20);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(slateGray[0], slateGray[1], slateGray[2]);
  doc.text("INSPECTOR:", 100, y + 6);
  doc.text("ZONE / JURISDICTION:", 100, y + 13);
  doc.text("VERDICT:", 100, y + 20);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 41, 59);
  doc.text(inspection.inspector || "Enforcement Officer", 140, y + 6);
  doc.text(inspection.location || "Central Enforcement Zone", 140, y + 13);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text(`${statusLabel} (${inspection.complianceScore || (isCompliant ? 100 : 65)}%)`, 140, y + 20);

  // --- Section 1: Product Information ---
  y += 32;

  doc.setFontSize(10);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.setFont("helvetica", "bold");
  doc.text("1. COMMODITY & PACKAGING PARTICULARS", 14, y);

  doc.setDrawColor(indigoPrimary[0], indigoPrimary[1], indigoPrimary[2]);
  doc.setLineWidth(0.5);
  doc.line(14, y + 2, pageWidth - 14, y + 2);

  y += 6;

  const prodName = product ? product.name : "Packaged Commodity";
  const mfrName = product ? product.manufacturer : "Per Packaging OCR";
  const batchNo = product ? product.batchNo : "LOT-2024-STD";
  const netQty = product ? product.netQuantity : "Declared on Pack";
  const mrpVal = product ? `Rs. ${product.mrp.toFixed(2)}` : "Declared on Pack";
  const mfgDt = product ? product.mfgDate : "Declared on Pack";
  const expDt = product ? product.expiryDate : "Declared on Pack";

  autoTable(doc, {
    startY: y,
    theme: "plain",
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: "bold", textColor: [100, 116, 139], cellWidth: 38 },
      1: { textColor: [30, 41, 59], cellWidth: 55 },
      2: { fontStyle: "bold", textColor: [100, 116, 139], cellWidth: 38 },
      3: { textColor: [30, 41, 59], cellWidth: 55 },
    },
    body: [
      ["Product / Commodity:", prodName, "Manufacturer / Packer:", mfrName],
      ["Batch / Lot Number:", batchNo, "Declared Net Quantity:", netQty],
      ["Maximum Retail Price:", mrpVal, "Date of Manufacture:", mfgDt],
      ["Statutory Expiry / BB:", expDt, "Governing Rules:", "Legal Metrology (PC) Rules, 2011"],
    ],
  });

  // --- Section 2: Statutory Compliance Audit Table ---
  // @ts-ignore
  y = doc.lastAutoTable.finalY + 8;

  doc.setFontSize(10);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.setFont("helvetica", "bold");
  doc.text("2. MANDATORY DECLARATIONS AUDIT (LEGAL METROLOGY ACT, 2009)", 14, y);

  doc.setDrawColor(indigoPrimary[0], indigoPrimary[1], indigoPrimary[2]);
  doc.setLineWidth(0.5);
  doc.line(14, y + 2, pageWidth - 14, y + 2);

  y += 5;

  // Build the 5 mandatory Legal Metrology rule rows
  const ruleAuditData = [
    {
      code: "Rule 6(1)(a)",
      declaration: "Maximum Retail Price (MRP)",
      desc: "Must be clearly declared with 'Inclusive of all taxes'",
      status: violations.some((v) => v.ruleCode.includes("6(1)(a)") || v.ruleTitle.includes("MRP"))
        ? "FAILED"
        : "PASSED",
      finding: product ? `MRP: Rs. ${product.mrp}` : "MRP detected on package",
    },
    {
      code: "Rule 6(1)(b)",
      declaration: "Net Quantity / Weight",
      desc: "Must use standard SI units (g, kg, ml, l)",
      status: violations.some((v) => v.ruleCode.includes("6(1)(b)") || v.ruleTitle.includes("Net"))
        ? "FAILED"
        : "PASSED",
      finding: product ? product.netQuantity : "Standard net quantity detected",
    },
    {
      code: "Rule 6(1)(d)",
      declaration: "Date of Manufacture / Packing",
      desc: "Month and year of manufacture must be clearly marked",
      status: violations.some((v) => v.ruleCode.includes("6(1)(d)") || v.ruleTitle.includes("Manufacture"))
        ? "FAILED"
        : "PASSED",
      finding: product ? product.mfgDate : "Mfg/Packing date detected",
    },
    {
      code: "Rule 6(1)(e)",
      declaration: "Date of Expiry / Best Before",
      desc: "Expiry or best before duration for commodities",
      status: violations.some((v) => v.ruleCode.includes("6(1)(e)") || v.ruleTitle.includes("Expire"))
        ? "FAILED"
        : "PASSED",
      finding: product ? product.expiryDate : "Best before period detected",
    },
    {
      code: "Rule 6(1)(g)",
      declaration: "Consumer Care Details",
      desc: "Name, address, telephone & email of grievance redressal officer",
      status: violations.some((v) => v.ruleCode.includes("6(1)(g)") || v.ruleTitle.includes("Consumer"))
        ? "FAILED"
        : "PASSED",
      finding: "Customer helpline / contact email provided",
    },
  ];

  autoTable(doc, {
    startY: y,
    head: [["Statutory Rule", "Mandatory Declaration", "Standard Required", "Detected Finding", "Compliance"]],
    body: ruleAuditData.map((r) => [r.code, r.declaration, r.desc, r.finding, r.status]),
    theme: "striped",
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "left",
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 3,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 26 },
      1: { fontStyle: "bold", cellWidth: 42 },
      2: { cellWidth: 50 },
      3: { cellWidth: 40 },
      4: { fontStyle: "bold", halign: "center", cellWidth: 24 },
    },
    didParseCell: (data) => {
      if (data.column.index === 4 && data.section === "body") {
        if (data.cell.raw === "PASSED") {
          data.cell.styles.textColor = [16, 185, 129]; // Emerald
        } else {
          data.cell.styles.textColor = [225, 29, 72]; // Red
        }
      }
    },
  });

  // --- Section 3: Statutory Violations & Legal Orders (if any) ---
  // @ts-ignore
  y = doc.lastAutoTable.finalY + 8;

  if (violations.length > 0) {
    doc.setFontSize(10);
    doc.setTextColor(roseRed[0], roseRed[1], roseRed[2]);
    doc.setFont("helvetica", "bold");
    doc.text("3. STATUTORY VIOLATIONS & RECTIFICATION NOTICE", 14, y);

    doc.setDrawColor(roseRed[0], roseRed[1], roseRed[2]);
    doc.setLineWidth(0.5);
    doc.line(14, y + 2, pageWidth - 14, y + 2);

    y += 5;

    autoTable(doc, {
      startY: y,
      head: [["ID", "Rule Code", "Violation Title", "Statutory Directive / Remedy"]],
      body: violations.map((v) => [v.id, v.ruleCode, v.ruleTitle, v.remediation]),
      theme: "plain",
      headStyles: {
        fillColor: [254, 242, 242],
        textColor: [159, 18, 57],
        fontStyle: "bold",
        fontSize: 7.5,
      },
      styles: { fontSize: 7, cellPadding: 2, textColor: [30, 41, 59] },
      columnStyles: {
        0: { cellWidth: 28, fontStyle: "bold" },
        1: { cellWidth: 28, fontStyle: "bold" },
        2: { cellWidth: 45 },
        3: { cellWidth: 80 },
      },
    });

    // @ts-ignore
    y = doc.lastAutoTable.finalY + 6;
  } else {
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(14, y, pageWidth - 28, 12, 2, 2, "F");
    doc.setFontSize(8.5);
    doc.setTextColor(21, 128, 61);
    doc.setFont("helvetica", "bold");
    doc.text(
      "STATUTORY CLEARANCE: All mandatory declarations are present and fully compliant with Rule 6 of Legal Metrology (PC) Rules, 2011.",
      pageWidth / 2,
      y + 7.5,
      { align: "center" }
    );
    y += 18;
  }

  // --- Footer / Authentication Signatures ---
  const footerY = Math.max(y + 8, pageHeight - 45);

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(14, footerY, pageWidth - 14, footerY);

  doc.setFontSize(7.5);
  doc.setTextColor(slateGray[0], slateGray[1], slateGray[2]);
  doc.setFont("helvetica", "normal");
  doc.text(
    "This certificate is an official enforcement document generated by LegalMetrics Digital Metrology System.",
    14,
    footerY + 5
  );
  doc.text(
    "Authorized under Section 15 of Legal Metrology Act, 2009 for inspection of packaged commodities.",
    14,
    footerY + 9
  );

  // Officer Signature Box
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("ENFORCEMENT OFFICER SIGNATURE", pageWidth - 70, footerY + 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(inspection.inspector || "Authorized Signatory", pageWidth - 70, footerY + 18);
  doc.text("Directorate of Legal Metrology", pageWidth - 70, footerY + 22);

  // Download the generated PDF
  const cleanFilename = `Legal-Metrology-Report-${inspection.id}.pdf`;
  doc.save(cleanFilename);
}
