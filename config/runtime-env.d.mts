export const environmentModes: readonly ["development", "test", "production"]

export type EnvironmentMode = (typeof environmentModes)[number]
export type EnvironmentInput = Readonly<Record<string, string | undefined>>

export type ServerEnvironment = Readonly<{
  mode: EnvironmentMode
  databaseUrl: string
  nextAuthUrl: string
  nextAuthSecret: string
  schoolSeedEsaoCode?: string
  bootstrapAdminEmail?: string
  initialPolicyEffectiveStart?: string
}>

export class EnvironmentValidationError extends Error {
  constructor(issues: readonly string[])
}

export function loadServerEnvironment(
  source?: EnvironmentInput,
  requestedMode?: EnvironmentMode,
): ServerEnvironment

export function getServerEnvironment(): ServerEnvironment
