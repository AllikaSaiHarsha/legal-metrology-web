import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const inspections = await prisma.inspection.findMany({
      include: {
        product: true,
        violations: true,
        detections: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Format to match the legacy localStorage format
    const formattedInspections = inspections.map((ins: any) => ({
      id: ins.id,
      productId: ins.productId,
      inspector: ins.inspector,
      date: ins.date,
      location: ins.location,
      status: ins.status,
      imageUrl: ins.imageUrl,
      complianceScore: ins.complianceScore,
      detections: ins.detections,
    }));

    const allProducts = inspections.map((ins: any) => ins.product).filter(Boolean);
    const productsMap = new Map();
    allProducts.forEach((p: any) => productsMap.set(p.id, p));
    const products = Array.from(productsMap.values());
    const violations = inspections.flatMap((ins: any) => ins.violations);

    return NextResponse.json({
      inspections: formattedInspections,
      products,
      violations
    });
  } catch (error) {
    console.error('Error fetching inspections:', error);
    return NextResponse.json({ error: 'Failed to fetch inspections' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { inspection, product, violations } = body;

    // Save product (use upsert to prevent unique constraint errors)
    await prisma.product.upsert({
      where: { id: product.id },
      update: {
        name: product.name,
        category: product.category,
        manufacturer: product.manufacturer,
        mfgDate: product.mfgDate,
        expiryDate: product.expiryDate,
        batchNo: product.batchNo,
        netQuantity: product.netQuantity,
        mrp: product.mrp,
        complianceStatus: product.complianceStatus,
      },
      create: {
        id: product.id,
        name: product.name,
        category: product.category,
        manufacturer: product.manufacturer,
        mfgDate: product.mfgDate,
        expiryDate: product.expiryDate,
        batchNo: product.batchNo,
        netQuantity: product.netQuantity,
        mrp: product.mrp,
        complianceStatus: product.complianceStatus,
      }
    });

    // Save inspection with detections
    await prisma.inspection.upsert({
      where: { id: inspection.id },
      update: {
        inspector: inspection.inspector,
        date: inspection.date,
        location: inspection.location,
        status: inspection.status,
        imageUrl: inspection.imageUrl,
        complianceScore: inspection.complianceScore,
      },
      create: {
        id: inspection.id,
        productId: product.id,
        inspector: inspection.inspector,
        date: inspection.date,
        location: inspection.location,
        status: inspection.status,
        imageUrl: inspection.imageUrl,
        complianceScore: inspection.complianceScore,
        detections: {
          create: inspection.detections?.map((d: any) => ({
            category: d.category,
            label: d.label,
            status: d.status,
            boxX: d.box?.x || 0,
            boxY: d.box?.y || 0,
            boxWidth: d.box?.width || 0,
            boxHeight: d.box?.height || 0,
          })) || []
        }
      }
    });

    // Save violations
    if (violations && violations.length > 0) {
      for (const v of violations) {
        await prisma.violation.upsert({
          where: { id: v.id },
          update: {
            ruleCode: v.ruleCode,
            ruleTitle: v.ruleTitle,
            description: v.description,
            severity: v.severity,
            remediation: v.remediation,
            status: v.status,
          },
          create: {
            id: v.id,
            inspectionId: inspection.id,
            ruleCode: v.ruleCode,
            ruleTitle: v.ruleTitle,
            description: v.description,
            severity: v.severity,
            remediation: v.remediation,
            status: v.status,
          }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving inspection:', error);
    return NextResponse.json({ error: 'Failed to save inspection' }, { status: 500 });
  }
}
