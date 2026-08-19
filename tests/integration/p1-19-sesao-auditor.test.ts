import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { test } from "node:test"

import { createDatabaseClient } from "../../scripts/db-client.mjs"
import { authenticateCredentials } from "../../src/lib/auth/credentials.ts"
import { bootstrapSesaoAuditors, SESA0_AUDITOR_BOOTSTRAP_ID, PILOT_ESAO_ORGANIZATION_ID } from "../../src/lib/bootstrap/sesao-auditor.ts"
import { applySesaoAuditorAppointment, revokeSesaoAuditor, resolveActiveSesaoAuditor, SesaoAuditorFreshAuthenticationRequiredError, SesaoAuditorReplayError } from "../../src/lib/authorization/sesao-auditor.ts"

test("P1-19 seals named Auditor configuration and applies exact appointment/revocation", async () => {
  const { client } = createDatabaseClient({ requestedMode: "test" })
  const suffix = randomUUID().replaceAll("-", "").slice(0, 12)
  const now = new Date()
  try {
    let bootstrap = await client.sesaoAuditorBootstrap.findUnique({ where: { id: SESA0_AUDITOR_BOOTSTRAP_ID }, include: { configurations: { include: { identity: true, schoolScopes: true } } } })
    if (!bootstrap) {
      await bootstrapSesaoAuditors(client, { accounts: [
        { accountIdentifier: `p119-initial-${suffix}@synthetic.test`, password: "P1-19-Initial-Password", personName: "P1-19 Initial Auditor" },
        { accountIdentifier: `p119-second-${suffix}@synthetic.test`, password: "P1-19-Second-Password", personName: "P1-19 Second Auditor" },
      ] })
      bootstrap = await client.sesaoAuditorBootstrap.findUniqueOrThrow({ where: { id: SESA0_AUDITOR_BOOTSTRAP_ID }, include: { configurations: { include: { identity: true, schoolScopes: true } } } })
    }
    assert.equal(bootstrap.esaoOrganizationId, PILOT_ESAO_ORGANIZATION_ID)
    assert.ok(bootstrap.configurations.length >= 1)
    assert.equal(bootstrap.configurations.every((configuration) => configuration.schoolScopes.length === 17), true)

    const adminBootstrap = await client.systemAdminBootstrap.findUniqueOrThrow({ where: { id: "p1-17" }, include: { identity: true, membership: true } })
    const adminSession = { identityId: adminBootstrap.identityId, membershipId: adminBootstrap.membershipId, accountIdentifier: adminBootstrap.identity.accountIdentifier, authorizationVersion: adminBootstrap.identity.authorizationVersion, membershipAuthorizationVersion: adminBootstrap.membership.authorizationVersion, authenticatedAt: Date.now() }
    const schools = bootstrap.configurations[0]!.schoolScopes.map((scope) => scope.schoolId)

    const subjectIdentity = await client.authenticatedIdentity.create({ data: { accountIdentifier: `p119-appointed-${suffix}@synthetic.test`, displayName: "P1-19 Appointed Auditor", accountStatus: "ACTIVE", passwordHash: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy", passwordChangedAt: now, memberships: { create: { organizationId: PILOT_ESAO_ORGANIZATION_ID, status: "ACTIVE", effectiveFrom: now } } }, include: { memberships: true } })
    const evidence = { externalApprovalRecordId: `PO-P1-19-${suffix}`, approvalAuthorityLabel: "Private Business / Product Owner", approvalAuthorityIdentity: "synthetic-product-owner@synthetic.test", approvalEvidenceReference: `synthetic://p1-19/${suffix}`, approvalEvidenceHash: "a".repeat(64) }
    const appointment = await applySesaoAuditorAppointment(client, { actor: adminSession, evidence, subject: { subjectIdentityId: subjectIdentity.id, subjectAccountIdentifier: subjectIdentity.accountIdentifier, subjectPersonName: subjectIdentity.displayName, subjectRoleCode: "SESAO_AUDITOR", subjectEsaoOrganizationId: PILOT_ESAO_ORGANIZATION_ID, schoolIds: schools } })
    const authenticated = await authenticateCredentials(client, { accountIdentifier: subjectIdentity.accountIdentifier, password: "wrong-password" })
    assert.equal(authenticated, null)
    const currentIdentity = await client.authenticatedIdentity.findUniqueOrThrow({ where: { id: subjectIdentity.id }, select: { authorizationVersion: true } })
    assert.ok(await resolveActiveSesaoAuditor(client, { identityId: subjectIdentity.id, authorizationVersion: currentIdentity.authorizationVersion }))
    await assert.rejects(() => applySesaoAuditorAppointment(client, { actor: adminSession, evidence, subject: { subjectIdentityId: subjectIdentity.id, subjectAccountIdentifier: subjectIdentity.accountIdentifier, subjectPersonName: subjectIdentity.displayName, subjectRoleCode: "SESAO_AUDITOR", subjectEsaoOrganizationId: PILOT_ESAO_ORGANIZATION_ID, schoolIds: schools } }), (error: unknown) => error instanceof SesaoAuditorReplayError)
    await assert.rejects(() => applySesaoAuditorAppointment(client, { actor: { ...adminSession, authenticatedAt: Date.now() - 6 * 60 * 1000 }, evidence, subject: { subjectIdentityId: subjectIdentity.id, subjectAccountIdentifier: subjectIdentity.accountIdentifier, subjectPersonName: subjectIdentity.displayName, subjectRoleCode: "SESAO_AUDITOR", subjectEsaoOrganizationId: PILOT_ESAO_ORGANIZATION_ID, schoolIds: schools } }), (error: unknown) => error instanceof SesaoAuditorFreshAuthenticationRequiredError)

    const revoked = await revokeSesaoAuditor(client, { actor: { ...adminSession, authenticatedAt: Date.now() }, configurationId: appointment.configurationId, evidence: { ...evidence, externalApprovalRecordId: `${evidence.externalApprovalRecordId}-REVOKE`, approvalEvidenceHash: "b".repeat(64) }, subject: { subjectIdentityId: subjectIdentity.id, subjectAccountIdentifier: subjectIdentity.accountIdentifier, subjectPersonName: subjectIdentity.displayName, subjectRoleCode: "SESAO_AUDITOR", subjectEsaoOrganizationId: PILOT_ESAO_ORGANIZATION_ID, schoolIds: schools } })
    assert.equal(revoked.configurationId, appointment.configurationId)
    const revokedIdentity = await client.authenticatedIdentity.findUniqueOrThrow({ where: { id: subjectIdentity.id }, select: { authorizationVersion: true } })
    assert.equal(await resolveActiveSesaoAuditor(client, { identityId: subjectIdentity.id, authorizationVersion: currentIdentity.authorizationVersion }), null)
    assert.equal(revokedIdentity.authorizationVersion, currentIdentity.authorizationVersion + 1)
    const provenance = await client.sesaoAuditorProvenance.findMany({ where: { configurationId: appointment.configurationId }, orderBy: { action: "asc" } })
    assert.deepEqual(provenance.map((record) => record.action), ["APPOINT", "REVOKE"])
    assert.equal(provenance[0]!.approvalAuthorityLabel, "Private Business / Product Owner")
    assert.equal(provenance[0]!.technicalExecutorIdentityId, adminBootstrap.identityId)
    await assert.rejects(() => client.$executeRaw`UPDATE "SesaoAuditorSchoolScope" SET "schoolId" = "schoolId" WHERE "configurationId" = ${appointment.configurationId}`, (error: unknown) => error instanceof Error)
  } finally {
    await client.$disconnect()
  }
})
