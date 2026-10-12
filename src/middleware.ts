import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "super-secret-metrology-key-legal-metrology-2026",
});

export const config = {
  matcher: [
    "/((?!api/auth|api/db|login|uploads|_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|gif|png|webp|svg|ico)$).*)",
  ],
};
