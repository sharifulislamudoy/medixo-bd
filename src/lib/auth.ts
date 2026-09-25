import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const expectedRole = process.env.APP_ROLE;
const apiUrl = process.env.API_URL || "http://localhost:4000";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  cookies: {
    sessionToken: {
      name: "medixo-customer.session-token",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production" },
    },
  },
  providers: [
    CredentialsProvider({
      name: "Phone and password",
      credentials: {
        phone: { label: "Phone", type: "tel" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const response = await fetch(`${apiUrl}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...credentials, expectedRole }),
          cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || result.error || "Invalid credentials");
        return result.user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.sessionId = (user as typeof user & { sessionId: string }).sessionId;
      }
      if (token.sessionId) {
        try {
          const response = await fetch(`${apiUrl}/auth/session`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionToken: token.sessionId, expectedRole }),
            cache: "no-store",
          });
          if (!response.ok) return {};
          const result = await response.json();
          token.id = result.user.id;
          token.role = result.user.role;
        } catch {
          return {};
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (!token.id) return null as never;
      session.user.id = String(token.id);
      session.user.role = token.role as typeof session.user.role;
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      if (token?.sessionId) {
        await fetch(`${apiUrl}/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionToken: token.sessionId }),
          cache: "no-store",
        });
      }
    },
  },
  pages: { signIn: "/login", error: "/auth-error" },
  secret: process.env.NEXTAUTH_SECRET,
};
