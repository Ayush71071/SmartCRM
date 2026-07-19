import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { loginSchema } from "@/features/auth/schemas/auth-schemas";
import { bootstrapOrganizationForUser } from "@/features/auth/actions/bootstrap-organization";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  // Credentials sessions can't be persisted through the adapter's session
  // table (that flow assumes an OAuth account), so the whole app runs on
  // JWT sessions even though Google sign-in also goes through here.
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
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

        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],
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
  events: {
    // Fires once per brand-new user (covers first-time Google sign-in;
    // Credentials sign-up is bootstrapped explicitly in the register action).
    async createUser({ user }) {
      if (user.id) await bootstrapOrganizationForUser(user.id, user.name ?? user.email ?? "My Team");
    },
  },
});
