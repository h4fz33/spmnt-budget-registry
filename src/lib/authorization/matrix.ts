export const AUTHORIZATION_ROLES = [
  "FINANCE_OFFICER",
  "SCHOOL_ADMIN",
  "SCHOOL_DIRECTOR",
  "EFFECTIVE_DIRECTOR_AUTHORITY",
  "ESAO_ADMIN",
  "ESAO_REVIEWER",
  "EXTERNAL_ASSESSOR",
  "SESAO_AUDITOR",
  "POLICY_PUBLISHER",
  "SYSTEM_ADMIN",
  "PRODUCT_OWNER",
] as const

export type AuthorizationRole = (typeof AUTHORIZATION_ROLES)[number]

export type AuthorizationMatrixEntry = Readonly<{
  actors: readonly AuthorizationRole[]
  implementation: "CURRENT" | "CONTEXTUAL" | "DEFERRED" | "DENIED"
}>

// This is the P1 server-side projection of the P0-04 command matrix. Entries
// that need records introduced by later tasks are explicit fail-closed values,
// rather than role fallbacks.
export const P0_04_AUTHORIZATION_MATRIX = {
  "AUTH-01": { actors: ["SCHOOL_ADMIN"], implementation: "CONTEXTUAL" },
  "AUTH-01/BOOTSTRAP": { actors: ["SYSTEM_ADMIN"], implementation: "DEFERRED" },
  "AUTH-02": { actors: ["SYSTEM_ADMIN"], implementation: "DEFERRED" },
  "AUTH-03": { actors: ["ESAO_ADMIN"], implementation: "DEFERRED" },
  "AUTH-04": { actors: ["ESAO_ADMIN"], implementation: "DEFERRED" },
  "AUTH-05": { actors: ["ESAO_ADMIN"], implementation: "DEFERRED" },
  "AUTH-06": { actors: ["SYSTEM_ADMIN"], implementation: "DEFERRED" },
  "AUTH-07": { actors: ["SYSTEM_ADMIN"], implementation: "DEFERRED" },
  "AUTH-08": { actors: ["PRODUCT_OWNER", "SYSTEM_ADMIN"], implementation: "DEFERRED" },
  "AUTH-09": { actors: ["EFFECTIVE_DIRECTOR_AUTHORITY"], implementation: "CURRENT" },
  "AUTH-10": { actors: ["FINANCE_OFFICER"], implementation: "CONTEXTUAL" },
  "AUTH-11": {
    actors: ["FINANCE_OFFICER", "EFFECTIVE_DIRECTOR_AUTHORITY"],
    implementation: "CONTEXTUAL",
  },
  "AUTH-12": {
    actors: ["FINANCE_OFFICER", "EFFECTIVE_DIRECTOR_AUTHORITY"],
    implementation: "CONTEXTUAL",
  },
  "AUTH-13": { actors: ["FINANCE_OFFICER"], implementation: "CONTEXTUAL" },
  "AUTH-14": {
    actors: ["SCHOOL_DIRECTOR", "ESAO_ADMIN"],
    implementation: "DEFERRED",
  },
  "AUTH-15": { actors: ["EFFECTIVE_DIRECTOR_AUTHORITY"], implementation: "CURRENT" },
  "AUTH-16": { actors: ["FINANCE_OFFICER"], implementation: "CONTEXTUAL" },
  "AUTH-17": {
    actors: ["FINANCE_OFFICER", "SCHOOL_ADMIN"],
    implementation: "DEFERRED",
  },
  "AUTH-18": { actors: ["EFFECTIVE_DIRECTOR_AUTHORITY"], implementation: "CURRENT" },
  "AUTH-19": { actors: ["SCHOOL_DIRECTOR"], implementation: "DEFERRED" },
  "AUTH-20": {
    actors: ["FINANCE_OFFICER", "SCHOOL_ADMIN"],
    implementation: "DEFERRED",
  },
  "AUTH-21": { actors: ["SCHOOL_DIRECTOR"], implementation: "CURRENT" },
  "AUTH-22": { actors: ["POLICY_PUBLISHER"], implementation: "DEFERRED" },
  "AUTH-23": { actors: [], implementation: "DENIED" },
  "AUTH-24": { actors: ["ESAO_REVIEWER"], implementation: "DEFERRED" },
  "AUTH-25": { actors: ["ESAO_ADMIN"], implementation: "DEFERRED" },
  "AUTH-26": { actors: ["SESAO_AUDITOR"], implementation: "DEFERRED" },
  "AUTH-27": { actors: ["SESAO_AUDITOR"], implementation: "DEFERRED" },
  "AUTH-28": { actors: ["SYSTEM_ADMIN"], implementation: "DEFERRED" },
  "AUTH-29": { actors: [], implementation: "DENIED" },
  "AUTH-30": { actors: [], implementation: "DENIED" },
  "AUTH-31": { actors: ["SESAO_AUDITOR"], implementation: "DEFERRED" },
  "AUTH-32": { actors: ["SESAO_AUDITOR"], implementation: "DEFERRED" },
  "AUTH-33": { actors: ["SESAO_AUDITOR"], implementation: "DEFERRED" },
  "AUTH-34": {
    actors: ["FINANCE_OFFICER", "SCHOOL_DIRECTOR"],
    implementation: "DEFERRED",
  },
  "AUTH-35": { actors: ["SCHOOL_DIRECTOR"], implementation: "DEFERRED" },
  "AUTH-36": { actors: ["FINANCE_OFFICER"], implementation: "DEFERRED" },
  "AUTH-37": { actors: ["EXTERNAL_ASSESSOR"], implementation: "DEFERRED" },
  "AUTH-38": { actors: ["SCHOOL_DIRECTOR"], implementation: "DEFERRED" },
  "AUTH-39": { actors: ["FINANCE_OFFICER"], implementation: "DEFERRED" },
} as const satisfies Record<string, AuthorizationMatrixEntry>

export type AuthorizationCommand = keyof typeof P0_04_AUTHORIZATION_MATRIX

export const SUBSTITUTE_DIRECTOR_COMMANDS = ["AUTH-09", "AUTH-11", "AUTH-12", "AUTH-18"] as const

export type SubstituteDirectorCommand = (typeof SUBSTITUTE_DIRECTOR_COMMANDS)[number]

export const ACTIVE_DIRECTOR_ONLY_COMMANDS = ["AUTH-19", "AUTH-21", "AUTH-34", "AUTH-35", "AUTH-38"] as const

export function isSubstituteDirectorCommand(command: string): command is SubstituteDirectorCommand {
  return (SUBSTITUTE_DIRECTOR_COMMANDS as readonly string[]).includes(command)
}

export function isAuthorizationCommand(command: string): command is AuthorizationCommand {
  return Object.hasOwn(P0_04_AUTHORIZATION_MATRIX, command)
}
