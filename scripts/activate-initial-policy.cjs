const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'data', 'policy-bootstrap', 'POL-INITIAL-PILOT-001.manifest.json');
const activationPath = path.join(root, 'data', 'policy-bootstrap', 'POL-INITIAL-PILOT-001.activation.json');
const cataloguePath = path.join(root, 'docs', 'governance', 'p0-06-initial-effective-dated-policy-catalogue.md');
const requiredEffectiveStart = '2026-08-12T00:00:00+07:00';

function fail(message) {
  throw new Error(`Initial policy activation denied: ${message}`);
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex').toUpperCase();
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(`cannot read JSON at ${path.relative(root, filePath)}: ${error.message}`);
  }
}

function validateSchoolScope(scope) {
  const schoolPath = path.join(root, scope.source);
  if (!fs.existsSync(schoolPath)) fail(`missing School scope source ${scope.source}`);
  if (sha256(schoolPath) !== scope.sha256) fail(`School scope hash mismatch for ${scope.source}`);

  const rows = fs.readFileSync(schoolPath, 'utf8').trim().split(/\r?\n/);
  const dataRows = rows.slice(1).filter(Boolean);
  const smis = dataRows.map((row) => row.split(',')[1]);
  if (dataRows.length !== scope.expectedCount || new Set(smis).size !== scope.expectedCount) {
    fail(`School scope is not exactly ${scope.expectedCount} unique Schools`);
  }

  return { count: dataRows.length, sha256: scope.sha256, source: scope.source };
}

function validateManifest(manifest, effectiveStart, requireDraftCatalogue) {
  if (manifest.policyVersionId !== 'POL-INITIAL-PILOT-001') fail('unexpected Policy Version ID');
  if (manifest.status !== 'DRAFT-PENDING-ACTIVATION') fail('Policy Version is not DRAFT-PENDING-ACTIVATION');
  if (manifest.authorizationBoundary !== 'AUTH-22') fail('activation is outside AUTH-22');
  if (manifest.organizationScope !== '1000960001') fail('organization scope is not 1000960001');
  if (manifest.activationAuthority?.designation !== 'Current Policy Publisher' ||
      manifest.activationAuthority?.applicationIdentity !== '96010001001' ||
      manifest.activationAuthority?.applicationUserName !== 'a96010001001') {
    fail('activation authority is not the Matrix-designated current Policy Publisher');
  }
  if (effectiveStart !== requiredEffectiveStart) fail('effective start differs from the authoritative bootstrap value');
  if (requireDraftCatalogue) {
    const catalogue = fs.readFileSync(cataloguePath, 'utf8');
    if (!catalogue.includes('**Status:** Draft initial catalogue for Policy Publisher activation under `AUTH-22`')) {
      fail('POL-INITIAL-PILOT-001 is not DRAFT-PENDING-ACTIVATION in the catalogue');
    }
  }

  for (const source of manifest.requiredSources) {
    const sourcePath = path.join(root, source.path);
    if (!fs.existsSync(sourcePath)) fail(`missing required source ${source.path}`);
    if (sha256(sourcePath) !== source.sha256) fail(`source hash mismatch for ${source.path}`);
  }

  return validateSchoolScope(manifest.schoolScope);
}

function validateNonOverlap(manifest, schoolScope) {
  const directory = path.dirname(activationPath);
  const activeRecords = fs.readdirSync(directory)
    .filter((name) => name.endsWith('.activation.json'))
    .map((name) => readJson(path.join(directory, name)))
    .filter((record) => record.status === 'ACTIVE' && record.policyVersionId !== manifest.policyVersionId);

  for (const record of activeRecords) {
    if (record.organizationScope === manifest.organizationScope &&
        record.schoolScope?.sha256 === schoolScope.sha256) {
      fail(`overlapping ACTIVE Policy Version ${record.policyVersionId} exists for the same scope/domain`);
    }
  }

  return {
    result: 'PASS',
    checkedActivePolicyVersions: [manifest.policyVersionId, ...activeRecords.map((record) => record.policyVersionId)],
    rationale: 'No different ACTIVE Policy Version covers the same organization and all-17-School bootstrap scope/domain.'
  };
}

function sameActivation(existing, expected) {
  return JSON.stringify(existing) === JSON.stringify(expected);
}

function run() {
  const effectiveStart = process.env.INITIAL_POLICY_EFFECTIVE_START;
  if (!effectiveStart) fail('INITIAL_POLICY_EFFECTIVE_START is missing');
  if (Number.isNaN(Date.parse(effectiveStart))) fail('INITIAL_POLICY_EFFECTIVE_START is invalid');

  const manifest = readJson(manifestPath);
  const hasExistingActivation = fs.existsSync(activationPath);
  const schoolScope = validateManifest(manifest, effectiveStart, !hasExistingActivation);
  const nonOverlapValidation = validateNonOverlap(manifest, schoolScope);
  const activation = {
    policyVersionId: manifest.policyVersionId,
    status: 'ACTIVE',
    effectiveStart,
    effectiveEnd: null,
    organizationScope: manifest.organizationScope,
    schoolScope,
    authorizationBoundary: manifest.authorizationBoundary,
    activationAuthority: manifest.activationAuthority,
    sourceIntegrity: manifest.requiredSources,
    nonOverlapValidation,
    activationAuditEvent: {
      eventType: 'POLICY_VERSION_ACTIVATED',
      policyVersionId: manifest.policyVersionId,
      authorizationBoundary: manifest.authorizationBoundary,
      authoritySubject: manifest.activationAuthority.applicationIdentity,
      technicalExecutor: manifest.activationAuthority.technicalExecutor,
      effectiveStart,
      organizationScope: manifest.organizationScope,
      schoolCount: schoolScope.count,
      sourceIntegrityVerified: true,
      outcome: 'SUCCESS'
    }
  };

  if (hasExistingActivation) {
    const existing = readJson(activationPath);
    if (sameActivation(existing, activation)) {
      console.log(`No-op: ${manifest.policyVersionId} is already ACTIVE with identical activation metadata.`);
      return;
    }
    fail('an activation record already exists with conflicting metadata');
  }

  fs.writeFileSync(activationPath, `${JSON.stringify(activation, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
  console.log(`Activated ${manifest.policyVersionId} under AUTH-22 with effective start ${effectiveStart}.`);
}

run();
