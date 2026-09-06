import { prisma } from "@/lib/prisma";
import InspectionDetailResolver from "@/components/InspectionDetailResolver";

export default async function InspectionPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  let dbInspection = await prisma.inspection.findUnique({
    where: { id },
    include: {
      product: true,
      violations: true,
      detections: true,
    }
  });

  let mappedInspection: any;
  let mappedProduct: any;
  let mappedViolations: any;

  if (!dbInspection) {
    // Fallback to mockData to prevent hydration mismatch for older mock items
    const mockData = require("@/data/mockData.json");
    mappedInspection = mockData.inspections.find((i: any) => i.id === id);
    mappedProduct = mappedInspection ? mockData.products.find((p: any) => p.id === mappedInspection.productId) : null;
    mappedViolations = mockData.violations.filter((v: any) => v.inspectionId === id);
  } else {
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
    mappedProduct = dbInspection.product;
    mappedViolations = dbInspection.violations;
  }

  if (!mappedInspection) {
    return (
      <InspectionDetailResolver id={id} />
    );
  }

  return (
    <InspectionDetailResolver
      id={id}
      initialInspection={mappedInspection}
      initialProduct={mappedProduct}
      initialViolations={mappedViolations}
    />
  );
}
