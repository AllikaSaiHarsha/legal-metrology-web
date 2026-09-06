import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const violations = await prisma.violation.findMany({
      orderBy: {
        createdAt: "desc"
      },
      include: {
        inspection: {
          include: {
            product: true
          }
        }
      }
    });

    return NextResponse.json(violations);
  } catch (error) {
    console.error("Failed to fetch violations:", error);
    return NextResponse.json({ error: "Failed to fetch violations" }, { status: 500 });
  }
}
