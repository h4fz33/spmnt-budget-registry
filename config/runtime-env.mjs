import { z } from "zod"

export const environmentModes = Object.freeze(["development", "test", "production"])

export class EnvironmentValidationError extends Error {
  constructor(issues) {
    super(`Invalid runtime configuration:\n${issues.map((issue) => `- ${issue}`).join("\n")}`)
    this.name = "EnvironmentValidationError"
  }
}

const requiredString = (name) =>
  z.string({ required_error: `${name} is required` }).trim().min(1, `${name} is required`)

const postgresUrlSchema = requiredString("DATABASE_URL").superRefine((value, context) => {
  try {
    const url = new URL(value)

    if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "DATABASE_URL must use the postgres:// or postgresql:// protocol",
      })
    }

    if (!url.hostname) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "DATABASE_URL must include a database host",
      })
    }
  } catch {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "DATABASE_URL must be a valid PostgreSQL connection URL",
    })
  }
})

const nextAuthUrlSchema = requiredString("NEXTAUTH_URL").superRefine((value, context) => {
  try {
    const url = new URL(value)

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "NEXTAUTH_URL must use the http:// or https:// protocol",
      })
    }
  } catch {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "NEXTAUTH_URL must be a valid URL",
    })
  }
})

const nextAuthSecretSchema = requiredString("NEXTAUTH_SECRET").superRefine((value, context) => {
  if (value.length < 32) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "NEXTAUTH_SECRET must contain at least 32 characters",
    })
  }

  if (value.toLowerCase().includes("replace-with") || value.toLowerCase().includes("change-me")) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "NEXTAUTH_SECRET must not use a template placeholder",
    })
  }
})

const optionalSchoolCodeSchema = z
  .string()
  .optional()
  .transform((value) => value?.trim() || undefined)
  .refine((value) => value === undefined || /^\d{10}$/.test(value), {
    message: "SCHOOL_SEED_ESAO_CODE must contain exactly 10 digits when supplied",
  })

const optionalEmailSchema = z
  .string()
  .optional()
  .transform((value) => value?.trim().toLowerCase() || undefined)
  .refine((value) => value === undefined || z.string().email().safeParse(value).success, {
    message: "BOOTSTRAP_ADMIN_EMAIL must be a valid email address when supplied",
  })

const optionalPolicyStartSchema = z
  .string()
  .optional()
  .transform((value) => value?.trim() || undefined)
  .refine((value) => value === undefined || z.string().datetime({ offset: true }).safeParse(value).success, {
    message: "INITIAL_POLICY_EFFECTIVE_START must be an ISO 8601 timestamp with an offset when supplied",
  })

const environmentSchema = z.object({
  DATABASE_URL: postgresUrlSchema,
  NEXTAUTH_URL: nextAuthUrlSchema,
  NEXTAUTH_SECRET: nextAuthSecretSchema,
  SCHOOL_SEED_ESAO_CODE: optionalSchoolCodeSchema,
  BOOTSTRAP_ADMIN_EMAIL: optionalEmailSchema,
  INITIAL_POLICY_EFFECTIVE_START: optionalPolicyStartSchema,
})

function isEnvironmentMode(value) {
  return environmentModes.includes(value)
}

function readEnvironmentMode(source, requestedMode) {
  const issues = []
  const applicationMode = source.APP_ENV?.trim()
  const nodeMode = source.NODE_ENV?.trim()

  if (applicationMode && !isEnvironmentMode(applicationMode)) {
    issues.push("APP_ENV must be development, test, or production")
  }

  if (nodeMode && !isEnvironmentMode(nodeMode)) {
    issues.push("NODE_ENV must be development, test, or production")
  }

  const parsedApplicationMode = applicationMode && isEnvironmentMode(applicationMode) ? applicationMode : undefined
  const parsedNodeMode = nodeMode && isEnvironmentMode(nodeMode) ? nodeMode : undefined

  if (parsedApplicationMode && parsedNodeMode && parsedApplicationMode !== parsedNodeMode) {
    issues.push("APP_ENV and NODE_ENV must match when both are supplied")
  }

  const mode = parsedApplicationMode ?? parsedNodeMode ?? requestedMode ?? "development"

  if (requestedMode && mode !== requestedMode) {
    issues.push(`Requested ${requestedMode} validation, but the environment resolves to ${mode}`)
  }

  return { mode, issues }
}

function isLoopbackHost(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
}

function formatSchemaIssues(error) {
  return error.issues.map((issue) => {
    const key = issue.path.join(".") || "environment"
    return `${key}: ${issue.message}`
  })
}

export function loadServerEnvironment(source = process.env, requestedMode) {
  const { mode, issues } = readEnvironmentMode(source, requestedMode)
  const parsed = environmentSchema.safeParse({
    DATABASE_URL: source.DATABASE_URL,
    NEXTAUTH_URL: source.NEXTAUTH_URL,
    NEXTAUTH_SECRET: source.NEXTAUTH_SECRET,
    SCHOOL_SEED_ESAO_CODE: source.SCHOOL_SEED_ESAO_CODE,
    BOOTSTRAP_ADMIN_EMAIL: source.BOOTSTRAP_ADMIN_EMAIL,
    INITIAL_POLICY_EFFECTIVE_START: source.INITIAL_POLICY_EFFECTIVE_START,
  })

  if (!parsed.success) {
    issues.push(...formatSchemaIssues(parsed.error))
  }

  if (mode === "production" && parsed.success) {
    const databaseUrl = new URL(parsed.data.DATABASE_URL)
    const nextAuthUrl = new URL(parsed.data.NEXTAUTH_URL)

    if (nextAuthUrl.protocol !== "https:") {
      issues.push("NEXTAUTH_URL must use HTTPS in production")
    }

    if (isLoopbackHost(nextAuthUrl.hostname)) {
      issues.push("NEXTAUTH_URL must not use a loopback host in production")
    }

    if (isLoopbackHost(databaseUrl.hostname)) {
      issues.push("DATABASE_URL must not use a loopback host in production")
    }
  }

  if (issues.length > 0 || !parsed.success || !mode) {
    throw new EnvironmentValidationError(issues)
  }

  return Object.freeze({
    mode,
    databaseUrl: parsed.data.DATABASE_URL,
    nextAuthUrl: parsed.data.NEXTAUTH_URL,
    nextAuthSecret: parsed.data.NEXTAUTH_SECRET,
    schoolSeedEsaoCode: parsed.data.SCHOOL_SEED_ESAO_CODE,
    bootstrapAdminEmail: parsed.data.BOOTSTRAP_ADMIN_EMAIL,
    initialPolicyEffectiveStart: parsed.data.INITIAL_POLICY_EFFECTIVE_START,
  })
}

export function getServerEnvironment() {
  return loadServerEnvironment()
}
