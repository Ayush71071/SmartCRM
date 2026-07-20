import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { loginSchema } from "@/features/auth/schemas/auth-schemas";
import { bootstrapOrganizationForUser } from "@/features/auth/actions/bootstrap-organization";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { authConfig } from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        // Brute-force protection: cap attempts per account and per IP.
        const ip = await getClientIp();
        if (!checkRateLimit(`login:email:${email}`, 5, 15 * 60 * 1000)) return null;
        if (!checkRateLimit(`login:ip:${ip}`, 20, 15 * 60 * 1000)) return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],
  events: {
    // Fires once per brand-new user (covers first-time Google sign-in;
    // Credentials sign-up is bootstrapped explicitly in the register action).
    async createUser({ user }) {
      if (user.id) await bootstrapOrganizationForUser(user.id, user.name ?? user.email ?? "My Team");
    },
  },
});
