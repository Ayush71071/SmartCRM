import type { NextAuthConfig } from "next-auth";

// Edge-safe subset of the NextAuth config — no PrismaAdapter, no bcryptjs,
// no provider `authorize()` callbacks. middleware.ts runs on the Edge
// runtime, which can't load Prisma's Node bindings or bcrypt's native/WASM
// crypto; pulling the full config (via auth.ts) into middleware pushed the
// Edge Function bundle past Vercel's 1MB limit. This file only needs enough
// to decode the JWT and expose `req.auth` for route-protection checks — the
// full config (adapter, providers, DB-backed authorize) lives in auth.ts and
// is only ever imported by Node-runtime code (API routes, Server Components,
// Server Actions).
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.userId = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
};
