import { createHash, randomUUID } from "node:crypto"

import type { PolicyVersion, Prisma, PrismaClient } from "../../../generated/prisma/client"

import { recordAuditEventInTransaction } from "../audit/core.ts"
import { withSerializableRetry } from "../database/with-serializable-retry.ts"

type DatabaseTransaction = Prisma.TransactionClient

const POLICY_IDENTIFIER = /^POL-[A-Z0-9]+(?:-[A-Z0-9]+)*$/
const SHA_256 = /^[0-9a-f]{64}$/
const SUBJECT_CODE = /^[A-Z][A-Z0-9-]{1,63}$/
const TARGET_TYPE = /^[A-Za-z][A-Za-z0-9._-]{0,63}$/
const TARGET_ID = /^[A-Za-z0-9._:-]{1,128}$/
const REQUIRED_DIRECTORY_SCHOOL_COUNT = 17
const FRESH_AUTHENTICATION_MAX_AGE_MS = 5 * 60 * 1000

export class PolicyPublicationDeniedError extends Error {
  readonly code: string

  constructor(code: string) {
    super(code)
    this.name = "PolicyPublicationDeniedError"
    this.code = code
  }
}

export class PolicyResolutionDeniedError extends Error {
  readonly code: "MISSING_EFFECTIVE_POLICY_VERSION" | "AMBIGUOUS_EFFECTIVE_POLICY_VERSION" | "POLICY_RESOLUTION_TARGET_MISMATCH"

  constructor(code: "MISSING_EFFECTIVE_POLICY_VERSION" | "AMBIGUOUS_EFFECTIVE_POLICY_VERSION" | "POLICY_RESOLUTION_TARGET_MISMATCH") {
    super(code)
    this.name = "PolicyResolutionDeniedError"
    this.code = code
  }
}

// Resolution intentionally has no silent latest-version fallback. Effective
// dates choose exactly one published version; a tie is a configuration error.
export function selectEffectivePolicyVersion<T>(matches: readonly T[]): T {
  if (matches.length === 0) {
    throw new PolicyResolutionDeniedError("MISSING_EFFECTIVE_POLICY_VERSION")
  }
  if (matches.length !== 1) {
    throw new PolicyResolutionDeniedError("AMBIGUOUS_EFFECTIVE_POLICY_VERSION")
  }

  return matches[0]
}

export type PolicySourceEvidenceInput = Readonly<{
  sourceReference: string
  sourceRevision?: string | null
  contentHash: string
}>

export type PolicyPublicationInput = Readonly<{
  policyVersionId: string
  organizationId: string
  actorIdentityId: string
  actorMembershipId: string
  freshAuthenticatedAt: Date
  effectiveFrom: Date
  sources: readonly PolicySourceEvidenceInput[]
  supersedesPolicyVersionId?: string | null
  correlationId?: string | null
  occurredAt?: Date
}>

export type PolicyResolutionInput = Readonly<{
  schoolId: string
  subjectCode: string
  targetType: string
  targetId: string
  effectiveAt: Date
  resolvedAt?: Date
}>

type NormalizedSourceEvidence = Readonly<{
  sourceReference: string
  sourceRevision: string | null
  contentHash: string
}>

type PublicationActor = Readonly<{
  identityId: string
  membershipId: string
  publisherDesignationId: string
}>

function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex")
}

function assertValidDate(value: Date, code: string) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new PolicyPublicationDeniedError(code)
  }
}

function normalizeSources(sources: readonly PolicySourceEvidenceInput[]) {
  if (!Array.isArray(sources) || sources.length === 0) {
    throw new PolicyPublicationDeniedError("POLICY_SOURCE_EVIDENCE_REQUIRED")
  }

  const normalized = sources.map((source) => {
    const sourceReference = typeof source.sourceReference === "string" ? source.sourceReference.trim() : ""
    const sourceRevision = typeof source.sourceRevision === "string" ? source.sourceRevision.trim() || null : null
    const contentHash = typeof source.contentHash === "string" ? source.contentHash.trim().toLowerCase() : ""

    if (!sourceReference || !SHA_256.test(contentHash)) {
      throw new PolicyPublicationDeniedError("INVALID_POLICY_SOURCE_EVIDENCE")
    }

    return Object.freeze({ sourceReference, sourceRevision, contentHash })
  })

  const uniqueSources = new Set(normalized.map((source) => `${source.sourceReference}\u0000${source.contentHash}`))
  if (uniqueSources.size !== normalized.length) {
    throw new PolicyPublicationDeniedError("DUPLICATE_POLICY_SOURCE_EVIDENCE")
  }

  return Object.freeze(
    [...normalized].sort((left, right) =>
      `${left.sourceReference}\u0000${left.sourceRevision ?? ""}\u0000${left.contentHash}`.localeCompare(
        `${right.sourceReference}\u0000${right.sourceRevision ?? ""}\u0000${right.contentHash}`,
      ),
    ),
  )
}

export function calculatePolicySourceIntegrityDigest(sources: readonly NormalizedSourceEvidence[]) {
  return sha256(
    JSON.stringify({
      version: 1,
      sources: sources.map((source) => ({
        sourceReference: source.sourceReference,
        sourceRevision: source.sourceRevision,
        contentHash: source.contentHash,
      })),
    }),
  )
}

export function calculatePolicyVersionIntegrityDigest(input: Readonly<{
  policyVersionId: string
  organizationId: string
  effectiveFrom: Date
  supersedesId: string | null
  publisherDesignationId: string
  publisherIdentityId: string
  sourceIntegrityDigest: string
  schoolIds: readonly string[]
}>) {
  return sha256(
    JSON.stringify({
      version: 1,
      policyVersionId: input.policyVersionId,
      organizationId: input.organizationId,
      effectiveFrom: input.effectiveFrom.toISOString(),
      supersedesId: input.supersedesId,
      publisherDesignationId: input.publisherDesignationId,
      publisherIdentityId: input.publisherIdentityId,
      sourceIntegrityDigest: input.sourceIntegrityDigest,
      schoolIds: [...input.schoolIds].sort(),
    }),
  )
}

export function calculatePolicyResolutionIntegrityDigest(input: Readonly<{
  policyVersionId: string
  schoolId: string
  subjectCode: string
  targetType: string
  targetId: string
  effectiveAt: Date
  resolvedAt: Date
}>) {
  return sha256(
    JSON.stringify({
      version: 1,
      policyVersionId: input.policyVersionId,
      schoolId: input.schoolId,
      subjectCode: input.subjectCode,
      targetType: input.targetType,
      targetId: input.targetId,
      effectiveAt: input.effectiveAt.toISOString(),
      resolvedAt: input.resolvedAt.toISOString(),
    }),
  )
}

function assertPublicationInput(input: PolicyPublicationInput, occurredAt: Date) {
  if (!POLICY_IDENTIFIER.test(input.policyVersionId)) {
    throw new PolicyPublicationDeniedError("INVALID_POLICY_VERSION_IDENTIFIER")
  }

  assertValidDate(input.effectiveFrom, "INVALID_POLICY_EFFECTIVE_DATE")
  assertValidDate(input.freshAuthenticatedAt, "INVALID_FRESH_AUTHENTICATION")
  assertValidDate(occurredAt, "INVALID_POLICY_ACTIVATION_TIME")

  if (
    input.freshAuthenticatedAt.getTime() > occurredAt.getTime() ||
    occurredAt.getTime() - input.freshAuthenticatedAt.getTime() > FRESH_AUTHENTICATION_MAX_AGE_MS
  ) {
    throw new PolicyPublicationDeniedError("FRESH_AUTHENTICATION_REQUIRED")
  }

  if (!input.organizationId || !input.actorIdentityId || !input.actorMembershipId) {
    throw new PolicyPublicationDeniedError("POLICY_PUBLISHER_IDENTITY_REQUIRED")
  }

  return normalizeSources(input.sources)
}

async function resolvePublicationActor(
  transaction: DatabaseTransaction,
  input: PolicyPublicationInput,
  occurredAt: Date,
): Promise<PublicationActor> {
  const membership = await transaction.approvedMembership.findFirst({
    where: {
      id: input.actorMembershipId,
      identityId: input.actorIdentityId,
      organizationId: input.organizationId,
      status: "ACTIVE",
      effectiveFrom: { lte: occurredAt },
      OR: [{ effectiveTo: null }, { effectiveTo: { gt: occurredAt } }],
      identity: { accountStatus: "ACTIVE" },
    },
  })

  if (!membership) {
    throw new PolicyPublicationDeniedError("POLICY_PUBLISHER_ACTIVE_MEMBERSHIP_REQUIRED")
  }

  const designation = await transaction.policyPublisherDesignation.findFirst({
    where: {
      organizationId: input.organizationId,
      identityId: input.actorIdentityId,
      status: "CURRENT",
      effectiveFrom: { lte: occurredAt },
    },
  })

  if (!designation) {
    throw new PolicyPublicationDeniedError("CURRENT_POLICY_PUBLISHER_REQUIRED")
  }

  const provenance = await transaction.policyPublisherDesignationProvenance.findFirst({
    where: {
      organizationId: input.organizationId,
      currentDesignationId: designation.id,
    },
    select: { id: true },
  })
  if (!provenance) {
    throw new PolicyPublicationDeniedError("CURRENT_POLICY_PUBLISHER_PROVENANCE_REQUIRED")
  }

  return Object.freeze({
    identityId: membership.identityId,
    membershipId: membership.id,
    publisherDesignationId: designation.id,
  })
}

async function resolveDirectoryScope(transaction: DatabaseTransaction, organizationId: string) {
  const schools = await transaction.school.findMany({
    where: {
      directoryIsActive: true,
      organization: {
        type: "SCHOOL",
        status: "ACTIVE",
        parentOrganizationId: organizationId,
      },
    },
    orderBy: { organizationId: "asc" },
    select: { organizationId: true },
  })

  if (schools.length !== REQUIRED_DIRECTORY_SCHOOL_COUNT) {
    throw new PolicyPublicationDeniedError("ALL_17_SCHOOL_SCOPE_REQUIRED")
  }

  return Object.freeze(schools.map((school) => school.organizationId))
}

export async function publishPolicyVersion(database: PrismaClient, input: PolicyPublicationInput) {
  const occurredAt = input.occurredAt ?? new Date()
  const sources = assertPublicationInput(input, occurredAt)

  return withSerializableRetry(
    () =>
      database.$transaction(
        async (transaction) => {
          const actor = await resolvePublicationActor(transaction, input, occurredAt)
          const schoolIds = await resolveDirectoryScope(transaction, input.organizationId)
          const existingByIdentifier = await transaction.policyVersion.findUnique({
            where: { policyVersionId: input.policyVersionId },
          })

          if (existingByIdentifier) {
            throw new PolicyPublicationDeniedError("POLICY_VERSION_IDENTIFIER_ALREADY_EXISTS")
          }

          const activeVersions = await transaction.policyVersion.findMany({
            where: { organizationId: input.organizationId, status: "ACTIVE" },
            orderBy: { effectiveFrom: "asc" },
          })
          if (activeVersions.length > 1) {
            throw new PolicyPublicationDeniedError("AMBIGUOUS_ACTIVE_POLICY_VERSION")
          }

          const predecessor = activeVersions[0] ?? null
          const requestedSupersedesId = input.supersedesPolicyVersionId ?? null
          if ((predecessor?.policyVersionId ?? null) !== requestedSupersedesId) {
            throw new PolicyPublicationDeniedError("EXACT_ACTIVE_POLICY_SUPERSESSION_REQUIRED")
          }
          if (predecessor && input.effectiveFrom.getTime() <= predecessor.effectiveFrom.getTime()) {
            throw new PolicyPublicationDeniedError("POLICY_SUPERSESSION_MUST_BE_PROSPECTIVE")
          }

          const sourceIntegrityDigest = calculatePolicySourceIntegrityDigest(sources)
          const policyVersionId = randomUUID()
          const integrityDigest = calculatePolicyVersionIntegrityDigest({
            policyVersionId: input.policyVersionId,
            organizationId: input.organizationId,
            effectiveFrom: input.effectiveFrom,
            supersedesId: predecessor?.id ?? null,
            publisherDesignationId: actor.publisherDesignationId,
            publisherIdentityId: actor.identityId,
            sourceIntegrityDigest,
            schoolIds,
          })

          await transaction.policyVersion.create({
            data: {
              id: policyVersionId,
              policyVersionId: input.policyVersionId,
              organizationId: input.organizationId,
              status: "DRAFT",
              effectiveFrom: input.effectiveFrom,
              publisherDesignationId: actor.publisherDesignationId,
              publisherIdentityId: actor.identityId,
              sourceIntegrityDigest,
              integrityDigest,
              supersedesId: predecessor?.id ?? null,
            },
          })
          await transaction.policyVersionSourceEvidence.createMany({
            data: sources.map((source) => ({
              policyVersionId,
              sourceReference: source.sourceReference,
              sourceRevision: source.sourceRevision,
              contentHash: source.contentHash,
              recordedAt: occurredAt,
            })),
          })
          await transaction.policyVersionSchoolScope.createMany({
            data: schoolIds.map((schoolId) => ({ policyVersionId, schoolId })),
          })

          if (predecessor) {
            await transaction.policyVersion.update({
              where: { id: predecessor.id },
              data: { status: "SUPERSEDED", effectiveTo: input.effectiveFrom },
            })
          }

          const activated = await transaction.policyVersion.update({
            where: { id: policyVersionId },
            data: { status: "ACTIVE", activatedAt: occurredAt },
            include: { sourceEvidence: true, schoolScopes: true },
          })
          const auditEvent = await recordAuditEventInTransaction(transaction, {
            actorIdentityId: actor.identityId,
            actorMembershipId: actor.membershipId,
            scope: { kind: "ORGANIZATION", organizationId: input.organizationId },
            commandCode: "AUTH-22",
            targetType: "PolicyVersion",
            targetId: input.policyVersionId,
            outcome: "SUCCESS",
            reasonCode: "POLICY_VERSION_ACTIVATED",
            correlationId: input.correlationId ?? null,
            occurredAt,
          })

          return Object.freeze({ policyVersion: activated, auditEvent })
        },
        { isolationLevel: "Serializable" },
      ),
    { operationKey: `P1-07-PUBLISH-${input.policyVersionId}` },
  )
}

function assertResolutionInput(input: PolicyResolutionInput, resolvedAt: Date) {
  if (!SUBJECT_CODE.test(input.subjectCode) || !TARGET_TYPE.test(input.targetType) || !TARGET_ID.test(input.targetId)) {
    throw new PolicyResolutionDeniedError("MISSING_EFFECTIVE_POLICY_VERSION")
  }
  if (!(input.effectiveAt instanceof Date) || Number.isNaN(input.effectiveAt.getTime()) || !(resolvedAt instanceof Date) || Number.isNaN(resolvedAt.getTime())) {
    throw new PolicyResolutionDeniedError("MISSING_EFFECTIVE_POLICY_VERSION")
  }
}

async function resolveCandidatePolicyVersion(
  transaction: DatabaseTransaction,
  schoolId: string,
  effectiveAt: Date,
): Promise<PolicyVersion> {
  const school = await transaction.school.findUnique({
    where: { organizationId: schoolId },
    include: { organization: true },
  })
  const organizationId = school?.organization.parentOrganizationId
  if (!school || !school.directoryIsActive || !organizationId) {
    throw new PolicyResolutionDeniedError("MISSING_EFFECTIVE_POLICY_VERSION")
  }

  const matches = await transaction.policyVersion.findMany({
    where: {
      organizationId,
      status: { in: ["ACTIVE", "SUPERSEDED"] },
      effectiveFrom: { lte: effectiveAt },
      OR: [{ effectiveTo: null }, { effectiveTo: { gt: effectiveAt } }],
      schoolScopes: { some: { schoolId } },
    },
    orderBy: { effectiveFrom: "asc" },
  })

  return selectEffectivePolicyVersion(matches)
}

export async function resolvePolicyVersion(database: PrismaClient, input: PolicyResolutionInput) {
  const resolvedAt = input.resolvedAt ?? new Date()
  assertResolutionInput(input, resolvedAt)

  return withSerializableRetry(
    () =>
      database.$transaction(
        async (transaction) => {
          const existing = await transaction.policyResolutionRecord.findUnique({
            where: { targetType_targetId: { targetType: input.targetType, targetId: input.targetId } },
            include: { policyVersion: true },
          })
          if (existing) {
            if (
              existing.schoolId !== input.schoolId ||
              existing.subjectCode !== input.subjectCode ||
              existing.effectiveAt.getTime() !== input.effectiveAt.getTime()
            ) {
              throw new PolicyResolutionDeniedError("POLICY_RESOLUTION_TARGET_MISMATCH")
            }
            return Object.freeze({ policyVersion: existing.policyVersion, resolution: existing })
          }

          const policyVersion = await resolveCandidatePolicyVersion(transaction, input.schoolId, input.effectiveAt)
          const integrityDigest = calculatePolicyResolutionIntegrityDigest({
            policyVersionId: policyVersion.id,
            schoolId: input.schoolId,
            subjectCode: input.subjectCode,
            targetType: input.targetType,
            targetId: input.targetId,
            effectiveAt: input.effectiveAt,
            resolvedAt,
          })
          const resolution = await transaction.policyResolutionRecord.create({
            data: {
              policyVersionId: policyVersion.id,
              schoolId: input.schoolId,
              subjectCode: input.subjectCode,
              targetType: input.targetType,
              targetId: input.targetId,
              effectiveAt: input.effectiveAt,
              resolvedAt,
              integrityDigest,
            },
          })

          return Object.freeze({ policyVersion, resolution })
        },
        { isolationLevel: "Serializable" },
      ),
    { operationKey: `P1-07-RESOLVE-${input.targetType}-${input.targetId}` },
  )
}
