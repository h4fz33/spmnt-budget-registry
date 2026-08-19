/* eslint-disable no-console */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const requirePolicyOwnerApproval = process.argv.includes('--require-policy-owner-approval');
const errors = [];

function readJson(relativePath) {
  const absolutePath = path.join(root, relativePath);
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
}

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function sha256(relativePath) {
  return crypto
    .createHash('sha256')
    .update(fs.readFileSync(path.join(root, relativePath)))
    .digest('hex')
    .toUpperCase();
}

function assert(condition, message) {
  if (!condition) {
    errors.push(message);
  }
}

function assertEqual(actual, expected, label) {
  assert(actual === expected, `${label}: expected ${expected}, received ${actual}`);
}

function allIntegerAmounts(value, pathName = 'root') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => allIntegerAmounts(item, `${pathName}[${index}]`));
    return;
  }

  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, item]) => {
      if (key.endsWith('Satang') && Array.isArray(item)) {
        assert(item.every(Number.isSafeInteger), `${pathName}.${key} must contain only safe integer satang values`);
      } else if (key.endsWith('Satang')) {
        assert(Number.isSafeInteger(item), `${pathName}.${key} must be a safe integer satang value`);
      }
      allIntegerAmounts(item, `${pathName}.${key}`);
    });
  }
}

function sumObjectEffects(events, property, keys) {
  const totals = Object.fromEntries(keys.map((key) => [key, 0]));
  events.forEach((event) => {
    Object.entries(event[property] || {}).forEach(([key, amount]) => {
      assert(Object.hasOwn(totals, key), `${event.eventId} has unsupported ${property} key ${key}`);
      assert(Number.isSafeInteger(amount), `${event.eventId}.${property}.${key} must be integer satang`);
      if (Object.hasOwn(totals, key) && Number.isSafeInteger(amount)) {
        totals[key] += amount;
      }
    });
  });
  return totals;
}

function fiscalYearForGregorianDate(value, label) {
  const match = typeof value === 'string' ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null;
  if (!match) {
    errors.push(`${label} must be a Gregorian YYYY-MM-DD date`);
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  if (!Number.isInteger(year) || month < 1 || month > 12 || day < 1 || day > daysInMonth) {
    errors.push(`${label} is not a valid Gregorian date`);
    return null;
  }
  return year + 543 - (month < 10 ? 1 : 0);
}

const fixturePath = 'data/acceptance/P0-09/fixture.json';
const expectedPath = 'data/acceptance/P0-09/expected-results.json';
const formsPath = 'data/acceptance/P0-09/form-output-expectations.json';
const approvalPath = 'data/acceptance/P0-09/policy-owner-approval.json';
const activationPath = 'data/policy-bootstrap/POL-INITIAL-PILOT-001.activation.json';

const fixture = readJson(fixturePath);
const expected = readJson(expectedPath);
const forms = readJson(formsPath);
const approval = readJson(approvalPath);
const activation = readJson(activationPath);
const matrix = readText('docs/governance/p0-03-fund-flow-record-matrix.md');
const policyCatalogue = readText('docs/governance/p0-06-initial-effective-dated-policy-catalogue.md');
const formRegister = readText('docs/research/p0-05-form-report-sample-register.md');

assertEqual(fixture.schema, 'schoolbanchee/p0-09-acceptance-fixture/v1', 'fixture schema');
assertEqual(expected.schema, 'schoolbanchee/p0-09-expected-results/v1', 'expected results schema');
assertEqual(forms.schema, 'schoolbanchee/p0-09-form-output-expectations/v1', 'form output schema');
assertEqual(approval.schema, 'schoolbanchee/p0-09-policy-owner-approval/v1', 'policy-owner approval schema');
assertEqual(fixture.fixtureId, expected.fixtureId, 'fixture and expected-results ID');
assertEqual(fixture.fixtureId, forms.fixtureId, 'fixture and form-output ID');
assertEqual(fixture.fixtureId, approval.fixtureId, 'fixture and approval ID');
assertEqual(fixture.moneyUnit, 'satang', 'fixture money unit');
assertEqual(expected.moneyUnit, 'satang', 'expected-results money unit');
const fixtureFiscalYear = fiscalYearForGregorianDate(fixture.fiscalPeriod?.reportingDate, 'fixture reporting date');
assertEqual(fixture.fiscalPeriod?.fiscalYearBE, fixtureFiscalYear, 'fixture fiscal-year label');
assertEqual(expected.fiscalPeriod?.fiscalYearBE, fixture.fiscalPeriod?.fiscalYearBE, 'expected-results fiscal-year label');
assertEqual(expected.fiscalPeriod?.reportingDate, fixture.fiscalPeriod?.reportingDate, 'expected-results reporting date');
assertEqual(expected.fiscalPeriod?.timezone, fixture.fiscalPeriod?.timezone, 'expected-results reporting timezone');
assert(fixture.anonymization.isAnonymized === true, 'fixture must be marked anonymized');
assert(fixture.anonymization.mappingRetainedInRepository === false, 'fixture cannot retain an anonymization mapping in the repository');
assert(fixture.actors.every((actor) => actor.isPseudonym === true), 'all fixture actors must be pseudonymous');
assert(fixture.evidenceCatalog.every((evidence) => evidence.isSynthetic === true), 'all fixture evidence references must be synthetic');
allIntegerAmounts(fixture);
allIntegerAmounts(expected);

assertEqual(activation.status, 'ACTIVE', 'POL-INITIAL-PILOT-001 activation status');
assertEqual(activation.policyVersionId, fixture.policyResolution.financialPolicyVersionId, 'active financial policy ID');
assertEqual(activation.organizationScope, fixture.anonymization.organizationScope, 'active financial policy organization scope');
assertEqual(fixture.policyResolution.financialPolicyStatus, 'ACTIVE', 'fixture financial policy status');
assertEqual(fixture.policyResolution.annualSelfAssessmentMode, 'STRUCTURAL_ONLY_NOT_RUNTIME', 'GAP-08 execution boundary');
assertEqual(expected.requiredReportTotals.annualSelfAssessment2515_2.runtimeStatus, 'STRUCTURAL_ONLY_NOT_RUNTIME', 'GAP-08 report boundary');
const financialPolicyStartDate = activation.effectiveStart.slice(0, 10);

const requiredFundFlows = Array.from({ length: 14 }, (_, index) => `FF-${String(index + 1).padStart(2, '0')}`);
const eventByFlow = new Map();
const eventIds = new Set();
fixture.financialEvents.forEach((event) => {
  assert(!eventIds.has(event.eventId), `duplicate event ID ${event.eventId}`);
  eventIds.add(event.eventId);
  assert(!eventByFlow.has(event.fundFlow), `fixture has more than one ${event.fundFlow} event`);
  eventByFlow.set(event.fundFlow, event);
  assert(matrix.includes(`\`${event.fundFlow}\``), `${event.fundFlow} is absent from P0-03 matrix`);
  assert(event.eventDate >= financialPolicyStartDate, `${event.eventId} predates active POL-INITIAL-PILOT-001`);
  assertEqual(fiscalYearForGregorianDate(event.eventDate, `${event.eventId} event date`), fixture.fiscalPeriod.fiscalYearBE, `${event.eventId} fiscal-year label`);
});
assertEqual(eventByFlow.size, requiredFundFlows.length, 'P0-03 Fund Flow coverage count');
requiredFundFlows.forEach((fundFlow) => assert(eventByFlow.has(fundFlow), `fixture is missing ${fundFlow}`));
['POL-FF-01', 'POL-FF-02', 'POL-FF-03', 'POL-FF-04', 'POL-FF-05', 'POL-FF-06', 'POL-FF-07', 'POL-FF-08', 'POL-FF-09', 'POL-FF-10', 'POL-FF-11'].forEach((ruleId) => {
  assert(policyCatalogue.includes(`\`${ruleId}\``), `${ruleId} is absent from POL-INITIAL-PILOT-001`);
});

const requiredCashbookBehavior = {
  'FF-01': 'PROHIBITED',
  'FF-02': 'PROHIBITED',
  'FF-03': 'REQUIRED',
  'FF-04': 'REQUIRED',
  'FF-05': 'REQUIRED',
  'FF-06': 'REQUIRED',
  'FF-07': 'REQUIRED',
  'FF-08': 'REQUIRED',
  'FF-09': 'NONE',
  'FF-10': 'REQUIRED',
  'FF-11': 'PROHIBITED',
  'FF-12': 'REQUIRED',
  'FF-13': 'PROHIBITED',
  'FF-14': 'PROHIBITED'
};

Object.entries(requiredCashbookBehavior).forEach(([fundFlow, behavior]) => {
  const entry = eventByFlow.get(fundFlow).cashbook;
  if (behavior === 'REQUIRED') {
    assert(entry && ['RECEIPT', 'PAYMENT'].includes(entry.side), `${fundFlow} requires one cashbook receipt/payment entry`);
    assert(entry && entry.amountSatang > 0, `${fundFlow} cashbook amount must be positive`);
  } else {
    assert(entry === null, `${fundFlow} must not create a Cashbook Cross-Check entry`);
  }
});

const expectedLinks = {
  'FF-02': 'FF-01',
  'FF-06': 'FF-05',
  'FF-08': 'FF-07',
  'FF-09': 'FF-04',
  'FF-10': 'FF-09',
  'FF-12': 'FF-11',
  'FF-13': 'FF-11'
};
Object.entries(expectedLinks).forEach(([childFlow, parentFlow]) => {
  assertEqual(eventByFlow.get(childFlow).linkedEventId, eventByFlow.get(parentFlow).eventId, `${childFlow} parent linkage`);
});

const expectedAuthorization = {
  'FF-01': 'AUTH-10',
  'FF-02': 'AUTH-10',
  'FF-03': 'AUTH-10',
  'FF-04': 'AUTH-11',
  'FF-05': 'AUTH-10',
  'FF-06': 'AUTH-11',
  'FF-07': 'AUTH-10',
  'FF-08': 'AUTH-11',
  'FF-09': 'INHERITS_AUTH-11_FROM_EVT-FF04-001',
  'FF-10': 'AUTH-11',
  'FF-11': 'AUTH-12',
  'FF-12': 'AUTH-10',
  'FF-13': 'AUTH-10',
  'FF-14': 'AUTH-34'
};
Object.entries(expectedAuthorization).forEach(([fundFlow, authorization]) => {
  assertEqual(eventByFlow.get(fundFlow).authorizationCommand, authorization, `${fundFlow} authorization boundary`);
});

const evidenceIds = new Set(fixture.evidenceCatalog.map((evidence) => evidence.evidenceId));
fixture.financialEvents.forEach((event) => {
  assert(event.evidenceRefs.length > 0, `${event.eventId} must contain evidence references`);
  event.evidenceRefs.forEach((evidenceId) => assert(evidenceIds.has(evidenceId), `${event.eventId} has an unknown evidence reference ${evidenceId}`));
});

const registry = sumObjectEffects(fixture.financialEvents, 'registryEffects', [
  'schoolRevenueSatang',
  'withheldTaxSatang',
  'stateIncomeSatang',
  'contractSecuritySatang',
  'documentsHeldSatang'
]);
Object.entries(registry).forEach(([key, value]) => assertEqual(value, expected.registryTotals[key], `registry total ${key}`));
const registryTotal = Object.values(registry).reduce((total, amount) => total + amount, 0);
assertEqual(registryTotal, expected.registryTotals.canonicalRegistryClosingTotalSatang, 'canonical registry closing total');

const positions = sumObjectEffects(fixture.financialEvents, 'moneyPositionEffects', [
  'cashSatang',
  'bankSatang',
  'documentsHeldSatang'
]);
Object.entries(positions).forEach(([key, value]) => assertEqual(value, expected.balanceTotals[key], `money-position total ${key}`));
const moneyPositionTotal = Object.values(positions).reduce((total, amount) => total + amount, 0);
assertEqual(moneyPositionTotal, expected.balanceTotals.moneyPositionTotalSatang, 'money-position grand total');
assertEqual(moneyPositionTotal, registryTotal, 'registry and money-position reconciliation total');

const budgetEffects = sumObjectEffects(fixture.financialEvents, 'budgetEffects', [
  'outstandingCommitmentSatang',
  'confirmedUseSatang'
]);
const revisedAllocationSatang = fixture.budgetAllocations.reduce((total, allocation) => total + allocation.revisedAllocationSatang, 0);
assertEqual(revisedAllocationSatang, expected.budgetTotals.revisedAllocationSatang, 'revised allocation total');
assertEqual(budgetEffects.confirmedUseSatang, expected.budgetTotals.confirmedUseSatang, 'confirmed budget use total');
assertEqual(budgetEffects.outstandingCommitmentSatang, expected.budgetTotals.outstandingCommitmentSatang, 'outstanding budget commitment total');
assertEqual(
  revisedAllocationSatang - budgetEffects.confirmedUseSatang - budgetEffects.outstandingCommitmentSatang,
  expected.budgetTotals.availableBudgetSatang,
  'available budget total'
);

const cashbookEntries = fixture.financialEvents.map((event) => event.cashbook).filter(Boolean);
const cashbookReceiptSatang = cashbookEntries.filter((entry) => entry.side === 'RECEIPT').reduce((total, entry) => total + entry.amountSatang, 0);
const cashbookPaymentSatang = cashbookEntries.filter((entry) => entry.side === 'PAYMENT').reduce((total, entry) => total + entry.amountSatang, 0);
assertEqual(cashbookReceiptSatang, expected.reconciliationTotals.cashbookReceiptSatang, 'cashbook receipt total');
assertEqual(cashbookPaymentSatang, expected.reconciliationTotals.cashbookPaymentSatang, 'cashbook payment total');
assertEqual(cashbookReceiptSatang - cashbookPaymentSatang, expected.reconciliationTotals.cashbookClosingSatang, 'cashbook closing total');
assertEqual(expected.reconciliationTotals.cashbookClosingSatang - registryTotal, expected.reconciliationTotals.registryCashbookDifferenceSatang, 'registry/cashbook difference');
assertEqual(expected.reconciliationTotals.bankRegisterSatang, positions.bankSatang, 'bank register to money-position total');
assertEqual(
  expected.reconciliationTotals.bankStatementSatang
    - expected.reconciliationTotals.outstandingChequeSatang
    + expected.reconciliationTotals.unrecordedTransferSatang
    - expected.reconciliationTotals.bankRegisterSatang,
  expected.reconciliationTotals.bankReconciliationDifferenceSatang,
  'bank reconciliation difference'
);

const reports = expected.requiredReportTotals;
assertEqual(reports.documentRequestRegister.claimSatang, eventByFlow.get('FF-01').amountSatang, 'document-request claim total');
assertEqual(reports.documentRequestRegister.confirmedSatang, eventByFlow.get('FF-02').amountSatang, 'document-request confirmation total');
assertEqual(reports.documentRequestRegister.claimSatang - reports.documentRequestRegister.confirmedSatang, reports.documentRequestRegister.unconfirmedSatang, 'document-request unconfirmed total');
assertEqual(reports.dailyBalanceReport.totalSatang, moneyPositionTotal, 'Daily Balance report total');
assertEqual(reports.remainingFundClassificationReport.stateIncomeSatang, registry.stateIncomeSatang, 'remaining-fund State Income total');
assertEqual(reports.remainingFundClassificationReport.nonBudgetarySatang, registry.schoolRevenueSatang + registry.withheldTaxSatang + registry.contractSecuritySatang, 'remaining-fund Non-Budgetary total');
assertEqual(reports.remainingFundClassificationReport.grandTotalSatang, registryTotal, 'remaining-fund grand total');
assertEqual(reports.annualSchoolRevenueReceiptPaymentReport.closingBalanceSatang, registry.schoolRevenueSatang, 'annual School Revenue closing total');
assertEqual(
  reports.annualSchoolRevenueReceiptPaymentReport.openingBalanceSatang
    + reports.annualSchoolRevenueReceiptPaymentReport.receiptSatang
    - reports.annualSchoolRevenueReceiptPaymentReport.paymentSatang,
  reports.annualSchoolRevenueReceiptPaymentReport.closingBalanceSatang,
  'annual School Revenue receipt/payment arithmetic'
);

const ff06 = eventByFlow.get('FF-06');
const ff08 = eventByFlow.get('FF-08');
const ff10 = eventByFlow.get('FF-10');
const ff11 = eventByFlow.get('FF-11');
const ff12 = eventByFlow.get('FF-12');
const ff13 = eventByFlow.get('FF-13');
const ff14 = eventByFlow.get('FF-14');
assertEqual(ff06.controlState, expected.controlAndEvidenceStates.stateIncomeRemittance.status, 'State Income partial-remittance state');
assertEqual(ff06.outstandingSatang, expected.controlAndEvidenceStates.stateIncomeRemittance.outstandingSatang, 'State Income outstanding balance');
assertEqual(ff10.controlState, expected.controlAndEvidenceStates.withheldTax.status, 'Withheld Tax partial-remittance state');
assertEqual(ff10.outstandingSatang, expected.controlAndEvidenceStates.withheldTax.outstandingSatang, 'Withheld Tax outstanding balance');
assertEqual(ff08.controlState, expected.controlAndEvidenceStates.contractSecurity.status, 'Contract Security partial-return state');
assertEqual(ff08.outstandingSatang, expected.controlAndEvidenceStates.contractSecurity.outstandingSatang, 'Contract Security outstanding balance');
assertEqual(ff12.atomicGroup, 'ADVANCE-SETTLEMENT-001', 'Advance expense settlement group');
assertEqual(ff13.atomicGroup, 'ADVANCE-SETTLEMENT-001', 'Advance unused-cash return group');
assertEqual(ff12.amountSatang + ff13.amountSatang, ff11.amountSatang, 'Advance settlement discharge amount');
assertEqual(ff14.moneyPositionEffects.cashSatang + ff14.moneyPositionEffects.bankSatang, 0, 'FF-14 net-zero money-position movement');
assert(ff14.cashbook === null, 'FF-14 cannot create a Cashbook Cross-Check entry');
assert(ff14.sameFund === true && ff14.crossSchool === false && ff14.fundScope === 'schoolRevenue', 'FF-14 must remain within one School and Fund');

const requiredGapContracts = ['GAP-01', 'GAP-02', 'GAP-03', 'GAP-04', 'GAP-05', 'GAP-06', 'GAP-07', 'GAP-08'];
const coveredGapContracts = forms.p0_05Coverage.map((coverage) => coverage.contractId);
requiredGapContracts.forEach((contractId) => {
  assert(coveredGapContracts.includes(contractId), `form-output expectations are missing ${contractId}`);
  assert(formRegister.includes(`\`${contractId}\``), `${contractId} is absent from the P0-05 register`);
});
const requiredReportContracts = ['FR-01', 'FR-02', 'FR-03/04', 'FR-05', 'FR-06', 'FR-07/08', 'FR-09', 'FR-10', 'FR-11', 'FR-12', 'FR-13', 'FR-14/15'];
const coveredReportContracts = forms.reportAndRegisterCoverage.map((coverage) => coverage.contractId);
requiredReportContracts.forEach((contractId) => assert(coveredReportContracts.includes(contractId), `form-output expectations are missing ${contractId}`));

const formCoverageById = new Map(forms.p0_05Coverage.map((coverage) => [coverage.contractId, coverage]));
assert(formCoverageById.get('GAP-06').output.includes(`FY ${fixture.fiscalPeriod.fiscalYearBE}`), 'GAP-06 fiscal-year projection label');
assertEqual(formCoverageById.get('GAP-07').expected.totalSatang, reports.dailyBalanceReport.totalSatang, 'GAP-07 Daily Balance total');
assertEqual(formCoverageById.get('GAP-08').expected.totalScorePointsX100, reports.annualSelfAssessment2515_2.totalPointsX100, 'GAP-08 2515-2 structural total');
assertEqual(formCoverageById.get('GAP-08').expected.aggregateRequiredSchoolCount, reports.schoolbanchee2515_3Aggregate.requiredSubmittedSchoolCount, 'GAP-08 2515-3 required School count');
assertEqual(forms.mode, 'STRUCTURAL_ACCEPTANCE_EXPECTATION_NOT_RUNTIME_RENDERING', 'form output execution boundary');

const expectedHashes = approval.requiredIntegrityBindings;
assertEqual(expectedHashes.fixtureSha256, sha256(fixturePath), 'fixture integrity hash');
assertEqual(expectedHashes.expectedResultsSha256, sha256(expectedPath), 'expected-results integrity hash');
assertEqual(expectedHashes.formOutputExpectationsSha256, sha256(formsPath), 'form-output integrity hash');
assert(approval.approvalRequired === true, 'policy-owner approval must remain required');
assertEqual(approval.approverRole, 'Private Business / Product Owner', 'policy-owner approver role');
assert(['PENDING_EXTERNAL_POLICY_OWNER_APPROVAL', 'APPROVED'].includes(approval.approvalStatus), 'approval record has an invalid status');
if (requirePolicyOwnerApproval) {
  assertEqual(approval.approvalStatus, 'APPROVED', 'policy-owner approval status');
  if (approval.approvalStatus === 'APPROVED') {
    assert(typeof approval.approverIdentity === 'string' && approval.approverIdentity.length > 0, 'policy-owner approver identity');
    assert(typeof approval.signedAt === 'string' && approval.signedAt.length > 0, 'policy-owner signed-at evidence');
    assert(typeof approval.signatureEvidenceReference === 'string' && approval.signatureEvidenceReference.length > 0, 'policy-owner signature-evidence reference');
  }
}

if (errors.length > 0) {
  console.error('P0-09 acceptance dataset verification failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(`P0-09 deterministic fixture verification passed for ${fixture.fixtureId}.`);
  if (approval.approvalStatus !== 'APPROVED') {
    console.log('Private Business / Product Owner approval remains pending; run with --require-policy-owner-approval after recording the required attributable approval evidence.');
  }
}
