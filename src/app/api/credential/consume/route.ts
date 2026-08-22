import { NextResponse } from "next/server"

import { prisma } from "@/lib/database/client"
import {
  consumeCredentialOperation,
  OrganizationLifecycleCredentialError,
  OrganizationLifecycleError,
  OrganizationLifecycleValidationError,
} from "@/lib/organization/lifecycle"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = await consumeCredentialOperation(prisma, body)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof OrganizationLifecycleValidationError) return NextResponse.json({ error: error.message }, { status: 400 })
    if (error instanceof OrganizationLifecycleCredentialError) return NextResponse.json({ error: error.message }, { status: 422 })
    if (error instanceof OrganizationLifecycleError) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ error: "Credential could not be completed" }, { status: 500 })
  }
}
