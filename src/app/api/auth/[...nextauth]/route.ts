import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, context: { params: Promise<{ nextauth: string[] }> }) {
  if (!process.env.NEXTAUTH_SECRET) {
    process.env.NEXTAUTH_SECRET = "super-secret-metrology-key-legal-metrology-2026";
  }
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  if (host && (process.env.VERCEL || !process.env.NEXTAUTH_URL)) {
    process.env.NEXTAUTH_URL = `${proto}://${host}`;
  }
  const params = await context.params;
  const handler = NextAuth(authOptions);
  return handler(req, { params } as any);
}

export async function POST(req: Request, context: { params: Promise<{ nextauth: string[] }> }) {
  if (!process.env.NEXTAUTH_SECRET) {
    process.env.NEXTAUTH_SECRET = "super-secret-metrology-key-legal-metrology-2026";
  }
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  if (host && (process.env.VERCEL || !process.env.NEXTAUTH_URL)) {
    process.env.NEXTAUTH_URL = `${proto}://${host}`;
  }
  const params = await context.params;
  const handler = NextAuth(authOptions);
  return handler(req, { params } as any);
}
