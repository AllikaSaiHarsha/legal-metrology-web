import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Deleting the inspection will cascade and delete its detections and violations
    const inspection = await prisma.inspection.delete({
      where: { id },
    });

    // Also delete the associated product
    if (inspection.productId) {
      await prisma.product.delete({
        where: { id: inspection.productId }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting inspection:', error);
    return NextResponse.json({ error: 'Failed to delete inspection' }, { status: 500 });
  }
}
