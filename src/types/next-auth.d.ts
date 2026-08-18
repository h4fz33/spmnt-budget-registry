import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      accountIdentifier: string
      authorizationVersion: number
      authenticatedAt: number
    } & DefaultSession["user"]
  }

  interface User {
    accountIdentifier: string
    authorizationVersion: number
    authenticatedAt: number
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accountIdentifier?: string
    authorizationVersion?: number
    authenticatedAt?: number
    invalidated?: boolean
  }
}
