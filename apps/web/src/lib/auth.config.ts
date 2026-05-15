import type { NextAuthConfig } from "next-auth"

// Edge-compatible config — no PrismaClient, no Node.js-only imports.
// Used only by middleware to verify the JWT.
export const authConfig = {
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  session: { strategy: "jwt" as const },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string
      return session
    },
  },
  providers: [],
} satisfies NextAuthConfig
