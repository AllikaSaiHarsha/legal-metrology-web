import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export async function GET(req: Request, context: { params: Promise<{ nextauth: string[] }> }) {
  const params = await context.params;
  return handler(req, { params } as any);
}

export async function POST(req: Request, context: { params: Promise<{ nextauth: string[] }> }) {
  const params = await context.params;
  return handler(req, { params } as any);
}
