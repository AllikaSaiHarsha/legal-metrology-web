import { prisma } from "@/lib/prisma";
import InspectionDetailResolver from "@/components/InspectionDetailResolver";
import mockData from "@/data/mockData.json";

export default async function InspectionPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const cleanId = decodeURIComponent(id || "").trim();

  let dbInspection: any = null;
  try {
    dbInspection = await prisma.inspection.findUnique({
      where: { id: cleanId },
      include: {
        product: true,
        violations: true,
        detections: true,
      },
    });
  } catch (err) {
    console.warn("Prisma inspection lookup warning (offline/sync):", err);
  }

  let mappedInspection: any = null;
  let mappedProduct: any = null;
  let mappedViolations: any = [];

  if (dbInspection) {
    mappedInspection = {
      id: dbInspection.id,
      productId: dbInspection.productId,
      inspector: dbInspection.inspector,
      date: dbInspection.date,
      location: dbInspection.location,
      status: dbInspection.status,
      imageUrl: dbInspection.imageUrl,
      complianceScore: dbInspection.complianceScore,
      detections: dbInspection.detections,
    };
    mappedProduct = dbInspection.product || {
      id: dbInspection.productId || "PRD-DEFAULT",
      name: "Packaged Commodity",
      category: "Packaged Goods (PCR 2011)",
      manufacturer: "Per Packaging Label",
      mfgDate: "Per Label",
      expiryDate: "Per Label",
      batchNo: "Per Label",
      netQuantity: "Declared on Pack",
      mrp: 0,
      complianceStatus: "compliant",
    };
    mappedViolations = dbInspection.violations || [];
  } else {
    // Fallback to statutory seed registry for mock/historical items
    const foundMock = (mockData.inspections || []).find((i: any) => i.id === cleanId);
    if (foundMock) {
      mappedInspection = foundMock;
      mappedProduct =
        (mockData.products || []).find((p: any) => p.id === foundMock.productId) || {
          id: foundMock.productId,
          name: "Packaged Commodity",
          category: "Packaged Goods",
          manufacturer: "Per Label",
          mfgDate: "Per Label",
          expiryDate: "Per Label",
          batchNo: "Per Label",
          netQuantity: "Per Label",
          mrp: 0,
          complianceStatus: "compliant",
        };
      mappedViolations = (mockData.violations || []).filter(
        (v: any) => v.inspectionId === cleanId
      );
    }
  }

  return (
    <InspectionDetailResolver
      id={cleanId}
      initialInspection={mappedInspection || undefined}
      initialProduct={mappedProduct || undefined}
      initialViolations={mappedViolations}
    />
  );
}
