import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Inspection, Product, Violation } from "./inspectionsStore";
import { StatutoryNoticeData, STATUTORY_PENALTY_RATES } from "./statutoryNotices";
import { PreMarketAuditData } from "./preMarketAudit";

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

export function generateStatutoryNoticePDF(data: StatutoryNoticeData): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Colors
  const darkCrimson = [136, 19, 55]; // #881337 - Official legal crimson
  const navyDark = [15, 23, 42]; // #0f172a
  const amberGold = [217, 119, 6]; // #d97706
  const slateGray = [100, 116, 139];
  const charcoalText = [30, 41, 59];
  const lightBg = [254, 252, 248];

  // Primary banner color based on notice type
  const headerBg =
    data.noticeType === "seizure_memo"
      ? darkCrimson
      : data.noticeType === "compounding"
      ? [30, 58, 138] // Deep blue
      : [120, 53, 15]; // Deep amber / bronze

  // --- Header Banner ---
  doc.setFillColor(headerBg[0], headerBg[1], headerBg[2]);
  doc.rect(0, 0, pageWidth, 28, "F");

  doc.setFillColor(amberGold[0], amberGold[1], amberGold[2]);
  doc.rect(0, 28, pageWidth, 2, "F");

  // Government Emblem & Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text("GOVERNMENT OF INDIA • DIRECTORATE OF LEGAL METROLOGY", pageWidth / 2, 7.5, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(254, 243, 199);
  doc.text(
    "MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION • ENFORCEMENT & COMPLIANCE WING",
    pageWidth / 2,
    12.5,
    { align: "center" }
  );

  let titleText = "FORM VI — STATUTORY SHOW CAUSE NOTICE";
  let subTitle = "UNDER SECTION 18 & 36, LEGAL METROLOGY ACT, 2009 R/W RULE 6 OF PCR, 2011";

  if (data.noticeType === "compounding") {
    titleText = "FORM VIII — NOTICE FOR COMPOUNDING OF OFFENCE";
    subTitle = "UNDER SECTION 48 OF LEGAL METROLOGY ACT, 2009 (COMPOSITION PENALTY ASSESSMENT)";
  } else if (data.noticeType === "seizure_memo") {
    titleText = "STATUTORY SEIZURE MEMO & PANCHNAMA OF GOODS";
    subTitle = "UNDER SECTION 15 OF LEGAL METROLOGY ACT, 2009 & RULE 29 OF PCR, 2011";
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  doc.setTextColor(255, 255, 255);
  doc.text(titleText, pageWidth / 2, 20, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(253, 230, 138);
  doc.text(subTitle, pageWidth / 2, 25, { align: "center" });

  // Notice Metadata Bar
  let y = 36;
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(14, y, pageWidth - 28, 22, 2, 2, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, pageWidth - 28, 22, 2, 2, "S");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(slateGray[0], slateGray[1], slateGray[2]);
  doc.text("NOTICE REF NO:", 18, y + 6);
  doc.text("DATE OF ISSUE:", 18, y + 12);
  doc.text("RESPONSE PERIOD:", 18, y + 18);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(charcoalText[0], charcoalText[1], charcoalText[2]);
  doc.text(data.noticeRef, 48, y + 6);
  doc.text(data.issueDate, 48, y + 12);
  doc.text(`${data.hearingDays} Days from receipt`, 48, y + 18);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(slateGray[0], slateGray[1], slateGray[2]);
  doc.text("ENFORCEMENT DIVISION:", 110, y + 6);
  doc.text("INVESTIGATING OFFICER:", 110, y + 12);
  doc.text("INSPECTION AUDIT ID:", 110, y + 18);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(charcoalText[0], charcoalText[1], charcoalText[2]);
  doc.text(data.jurisdiction, 150, y + 6);
  doc.text(data.inspectorName, 150, y + 12);
  doc.text(data.inspectionId, 150, y + 18);

  // Respondent Address Section
  y = 63;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text("TO (RESPONDENT / NOTICEE):", 14, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(charcoalText[0], charcoalText[1], charcoalText[2]);
  doc.text(`M/s ${data.respondentName}`, 14, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(slateGray[0], slateGray[1], slateGray[2]);
  doc.text(`Premises / Jurisdiction: ${data.respondentAddress}`, 14, y + 9.5);
  doc.text(`Establishment Class: ${data.establishmentType} under Legal Metrology Act, 2009`, 14, y + 14);

  // Subject Heading
  y = 83;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text(
    `SUB: STATUTORY INFRACTIONS DETECTED IN COMMODITY "${data.productName.toUpperCase()}" (BATCH: ${data.batchNo})`,
    16,
    y + 4.5
  );

  // Pre-table Text / Allegations
  y = 94;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(charcoalText[0], charcoalText[1], charcoalText[2]);
  const introPara =
    `WHEREAS during an official inspection conducted on ${data.inspectionDate} at ${data.inspectionLocation} under Section 15 of the Legal Metrology Act, 2009, packages of the pre-packaged commodity "${data.productName}" (Net Content: ${data.netQuantityDeclared}, Declared MRP: INR ${data.mrpDeclared}) were examined and found to contravene statutory packaging provisions as specified below:`;
  
  const splitIntro = doc.splitTextToSize(introPara, pageWidth - 28);
  doc.text(splitIntro, 14, y);
  y += splitIntro.length * 4 + 2;

  // Infractions Table
  const tableRows = data.violations.map((v, i) => [
    `${i + 1}`,
    v.ruleCode,
    v.ruleTitle,
    v.description,
    v.severity.toUpperCase(),
  ]);

  autoTable(doc, {
    startY: y,
    head: [["S.No", "Statutory Rule", "Infraction Title", "Observation / Defect", "Severity"]],
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: headerBg as [number, number, number],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: charcoalText as [number, number, number],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: 26, fontStyle: "bold" },
      2: { cellWidth: 42, fontStyle: "bold" },
      3: { cellWidth: 78 },
      4: { cellWidth: 24, halign: "center" },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || y + 40;
  y = finalY + 6;

  // Specific Notice Directives / Legal Action Clause
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);

  if (data.noticeType === "show_cause") {
    doc.text("STATUTORY DIRECTIVE & CALL TO SHOW CAUSE:", 14, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.8);
    doc.setTextColor(charcoalText[0], charcoalText[1], charcoalText[2]);
    const directiveText =
      `NOW THEREFORE, in accordance with Section 18 & 36 of the Legal Metrology Act, 2009 read with Rule 6 of the Legal Metrology (Packaged Commodities) Rules, 2011, you are hereby directed to SHOW CAUSE in writing within ${data.hearingDays} days from receipt of this notice why prosecution should not be launched against your establishment and nominated Directors under Section 36(1) before the Competent Judicial Magistrate.\n\nFailure to reply within the stipulated time shall be deemed as admission of the offences, and ex-parte statutory prosecution shall be instituted without further notice.`;
    const splitDirective = doc.splitTextToSize(directiveText, pageWidth - 28);
    doc.text(splitDirective, 14, y);
    y += splitDirective.length * 3.8 + 6;
  } else if (data.noticeType === "compounding") {
    doc.text("STATUTORY COMPOUNDING ASSESSMENT (SECTION 48):", 14, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.8);
    doc.setTextColor(charcoalText[0], charcoalText[1], charcoalText[2]);
    const compoundingText =
      `WHEREAS the offences are compoundable under Section 48 of the Act, you are hereby offered the opportunity to compound the offences by remitting a composition fee of INR ${data.compoundingFee.toLocaleString()} (Rupees ${data.compoundingFee.toLocaleString()} only) calculated under ${STATUTORY_PENALTY_RATES[data.offenceTier].section}.\n\nRemit the compounded sum to the Designated Government Treasury Account within ${data.hearingDays} days and submit proof of compliance to avoid criminal proceedings in the Court of Law.`;
    const splitCompounding = doc.splitTextToSize(compoundingText, pageWidth - 28);
    doc.text(splitCompounding, 14, y);
    y += splitCompounding.length * 3.8 + 6;
  } else if (data.noticeType === "seizure_memo") {
    doc.text("PANCHNAMA & SEIZURE PARTICULARS (SECTION 15):", 14, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.8);
    doc.setTextColor(charcoalText[0], charcoalText[1], charcoalText[2]);
    const seizureText =
      `In exercise of powers under Section 15 of Legal Metrology Act, 2009, the undersigned has SEIZED ${data.seizedUnits} packages of "${data.productName}" (Batch: ${data.batchNo}) from the premises, and drawn ${data.sampleUnitsSeized} test units under official paper seal for laboratory validation.\n\nPANCH WITNESS 1: ${data.panch1Name} (${data.panch1Address})\nPANCH WITNESS 2: ${data.panch2Name} (${data.panch2Address})\nThe seized lot is handed over for safe custody to avoid alteration or disposal.`;
    const splitSeizure = doc.splitTextToSize(seizureText, pageWidth - 28);
    doc.text(splitSeizure, 14, y);
    y += splitSeizure.length * 3.8 + 6;
  }

  // Signature Block
  const sigY = Math.min(y + 2, pageHeight - 34);

  // Left Signature (Noticee / Witness)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text("ACKNOWLEDGEMENT / WITNESSES", 14, sigY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(slateGray[0], slateGray[1], slateGray[2]);
  doc.text("Signature / Seal of Noticee or Representative", 14, sigY + 5);
  doc.text(`Dated: ${data.issueDate}`, 14, sigY + 9);

  // Right Signature (Legal Metrology Officer)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text("LEGAL METROLOGY ENFORCEMENT OFFICER", pageWidth - 80, sigY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(slateGray[0], slateGray[1], slateGray[2]);
  doc.text(data.inspectorName, pageWidth - 80, sigY + 5);
  doc.text(data.jurisdiction, pageWidth - 80, sigY + 9);
  doc.text("Office Seal & Digital Signature Hash", pageWidth - 80, sigY + 13);

  // Bottom Security Line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

  doc.setFontSize(6.5);
  doc.setTextColor(slateGray[0], slateGray[1], slateGray[2]);
  doc.text(
    `Official statutory instrument generated under the Legal Metrology Act, 2009. Ref: ${data.noticeRef} • Issued on ${data.issueDate}`,
    pageWidth / 2,
    pageHeight - 8,
    { align: "center" }
  );

  const filename = `${data.noticeType.toUpperCase()}-${data.noticeRef.replace(/[\/\\]/g, "-")}.pdf`;
  doc.save(filename);
}

export function generatePreMarketCertificatePDF(data: PreMarketAuditData): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const forestGreen = [6, 78, 59]; // #064e3b
  const emeraldAccent = [16, 185, 129]; // #10b981
  const navyDark = [15, 23, 42];
  const slateGray = [100, 116, 139];
  const charcoal = [30, 41, 59];
  const lightBg = [240, 253, 244]; // Soft emerald tint

  // Header Banner
  doc.setFillColor(forestGreen[0], forestGreen[1], forestGreen[2]);
  doc.rect(0, 0, pageWidth, 28, "F");

  doc.setFillColor(emeraldAccent[0], emeraldAccent[1], emeraldAccent[2]);
  doc.rect(0, 28, pageWidth, 2, "F");

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text("GOVERNMENT OF INDIA • DIRECTORATE OF LEGAL METROLOGY", pageWidth / 2, 7.5, {
    align: "center",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(209, 250, 229);
  doc.text(
    "PRE-MARKET REGULATORY CONFORMITY & PACKAGING ARTWORK ASSESSMENT CELL",
    pageWidth / 2,
    12.5,
    { align: "center" }
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(
    "PRE-MARKET PACKAGING COMPLIANCE READINESS CERTIFICATE",
    pageWidth / 2,
    21,
    { align: "center" }
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(167, 243, 208);
  doc.text(
    "CONFORMITY ASSESSMENT UNDER RULE 6 OF LEGAL METROLOGY (PACKAGED COMMODITIES) RULES, 2011",
    pageWidth / 2,
    25.5,
    { align: "center" }
  );

  // Metadata Card
  let y = 36;
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(14, y, pageWidth - 28, 26, 2, 2, "F");
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(14, y, pageWidth - 28, 26, 2, 2, "S");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(slateGray[0], slateGray[1], slateGray[2]);
  doc.text("CERTIFICATE ID:", 18, y + 6);
  doc.text("DATE OF APPRAISAL:", 18, y + 12);
  doc.text("APPLICANT BRAND:", 18, y + 18);
  doc.text("MANUFACTURER / PACKER:", 18, y + 24);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(charcoal[0], charcoal[1], charcoal[2]);
  doc.text(data.certificateId, 58, y + 6);
  doc.text(data.date, 58, y + 12);
  doc.text(data.brandName, 58, y + 18);
  doc.text(data.manufacturerName, 58, y + 24);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(slateGray[0], slateGray[1], slateGray[2]);
  doc.text("COMMODITY SKU:", 120, y + 6);
  doc.text("DECLARED NET QTY:", 120, y + 12);
  doc.text("PROPOSED MRP:", 120, y + 18);
  doc.text("VERDICT:", 120, y + 24);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(charcoal[0], charcoal[1], charcoal[2]);
  doc.text(data.skuTitle, 155, y + 6);
  doc.text(data.declaredNetQuantity, 155, y + 12);
  doc.text(`INR ${data.declaredMrp.toFixed(2)}`, 155, y + 18);

  const isApproved = data.verdict === "APPROVED_FOR_PRINT";
  doc.setFont("helvetica", "bold");
  doc.setTextColor(isApproved ? 16 : 225, isApproved ? 185 : 29, isApproved ? 129 : 72);
  doc.text(isApproved ? "APPROVED FOR PRINT" : "REVISIONS REQUIRED", 155, y + 24);

  // Table of Checked Rules
  y = 68;
  const tableRows = data.checks.map((c, i) => [
    `${i + 1}`,
    c.ruleCitation,
    c.label,
    c.detectedValue || "Verified in Proof",
    c.status.toUpperCase(),
  ]);

  autoTable(doc, {
    startY: y,
    head: [["S.No", "Rule Citation", "Statutory Declaration", "Artwork Observation", "Result"]],
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: forestGreen as [number, number, number],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: charcoal as [number, number, number],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: 34, fontStyle: "bold" },
      2: { cellWidth: 54, fontStyle: "bold" },
      3: { cellWidth: 62 },
      4: { cellWidth: 20, halign: "center" },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || y + 50;
  let endY = finalY + 8;

  // Legal Validation Paragraph
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text("REGULATORY ADVISORY & STATUTORY CERTIFICATION:", 14, endY);
  endY += 4.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(charcoal[0], charcoal[1], charcoal[2]);
  const certificationText =
    "This certificate confirms that the digital packaging artwork proof submitted for the aforesaid commodity has been examined against the mandatory declarations and font height specifications prescribed under the Legal Metrology (Packaged Commodities) Rules, 2011.\n\nCommercial batches manufactured, packed, or imported under this packaging design must strictly maintain the indelibility, positioning, and accuracy of declarations verified herein. Any subsequent alteration of declared MRP, net weight, or packer address will nullify this clearance.";

  const splitText = doc.splitTextToSize(certificationText, pageWidth - 28);
  doc.text(splitText, 14, endY);
  endY += splitText.length * 3.6 + 6;

  // Signature Block
  const sigY = Math.min(endY + 2, pageHeight - 34);

  // Left Stamp
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(forestGreen[0], forestGreen[1], forestGreen[2]);
  doc.text("PRE-MARKET VERIFICATION DIVISION", 14, sigY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(slateGray[0], slateGray[1], slateGray[2]);
  doc.text("Directorate of Legal Metrology, Government of India", 14, sigY + 5);
  doc.text(`Validated On: ${data.date}`, 14, sigY + 9);

  // Right Signatory
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.text("CONTROLLER OF LEGAL METROLOGY", pageWidth - 76, sigY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(slateGray[0], slateGray[1], slateGray[2]);
  doc.text("Authorized Technical Examiner", pageWidth - 76, sigY + 5);
  doc.text("Digital Seal & Hash Verified", pageWidth - 76, sigY + 9);

  // Footer line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

  doc.setFontSize(6.5);
  doc.setTextColor(slateGray[0], slateGray[1], slateGray[2]);
  doc.text(
    `Pre-Market Conformity Instrument Ref: ${data.certificateId} • Verified under Legal Metrology Act, 2009`,
    pageWidth / 2,
    pageHeight - 8,
    { align: "center" }
  );

  const cleanFilename = `Pre-Market-Readiness-${data.certificateId.replace(/[\/\\]/g, "-")}.pdf`;
  doc.save(cleanFilename);
}


