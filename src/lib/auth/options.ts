import "server-only"

import type { AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

import { prisma } from "@/lib/database/client"

import { authenticateCredentials } from "./credentials"
import {
  refreshAuthenticationToken,
  sessionFromAuthenticationToken,
  tokenForAuthenticatedPrincipal,
} from "./session"

function isAuthenticatedPrincipal(user: unknown): user is Parameters<typeof tokenForAuthenticatedPrincipal>[0] {
  if (!user || typeof user !== "object") {
    return false
  }

  const candidate = user as Record<string, unknown>
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.accountIdentifier === "string" &&
    typeof candidate.authorizationVersion === "number" &&
    Number.isSafeInteger(candidate.authorizationVersion) &&
    typeof candidate.authenticatedAt === "number" &&
    Number.isSafeInteger(candidate.authenticatedAt)
  )
}

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  providers: [
    CredentialsProvider({
      name: "SchoolBanchee Credentials",
      credentials: {
        accountIdentifier: { label: "Account identifier", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        return authenticateCredentials(prisma, credentials)
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return isAuthenticatedPrincipal(user)
          ? tokenForAuthenticatedPrincipal(user)
          : { ...token, invalidated: true }
      }

      return refreshAuthenticationToken(prisma, token)
    },
    async session({ session, token }) {
      const activeSession = sessionFromAuthenticationToken(token, session.expires)
      if (!activeSession) {
        // Throwing clears the JWT session cookie in NextAuth's session route.
        throw new Error("Authentication session is no longer active")
      }

      return activeSession
    },
  },
}
