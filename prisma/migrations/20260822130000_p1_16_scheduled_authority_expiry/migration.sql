-- P1-16: an authority that is already expired when its scheduled start is
-- first observed must be allowed to move directly to its terminal state.
CREATE OR REPLACE FUNCTION "p1_04_preserve_immutable_columns"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_record JSONB := to_jsonb(NEW);
  old_record JSONB := to_jsonb(OLD);
BEGIN
  IF TG_TABLE_NAME = 'AuthenticatedIdentity'
    AND new_record -> 'accountIdentifier' IS DISTINCT FROM old_record -> 'accountIdentifier' THEN
    RAISE EXCEPTION 'Authenticated identity identifier is immutable' USING ERRCODE = '23514';
  ELSIF TG_TABLE_NAME = 'School'
    AND (new_record -> 'smisCode' IS DISTINCT FROM old_record -> 'smisCode'
      OR new_record -> 'moeCode' IS DISTINCT FROM old_record -> 'moeCode') THEN
    RAISE EXCEPTION 'School identifiers are immutable' USING ERRCODE = '23514';
  ELSIF TG_TABLE_NAME = 'ApprovedMembership'
    AND (new_record -> 'identityId' IS DISTINCT FROM old_record -> 'identityId'
      OR new_record -> 'organizationId' IS DISTINCT FROM old_record -> 'organizationId'
      OR new_record -> 'effectiveFrom' IS DISTINCT FROM old_record -> 'effectiveFrom'
      OR new_record -> 'approvedByIdentityId' IS DISTINCT FROM old_record -> 'approvedByIdentityId') THEN
    RAISE EXCEPTION 'Approved Membership scope is immutable' USING ERRCODE = '23514';
  ELSIF TG_TABLE_NAME = 'SchoolRoleAssignment'
    AND (new_record -> 'membershipId' IS DISTINCT FROM old_record -> 'membershipId'
      OR new_record -> 'schoolId' IS DISTINCT FROM old_record -> 'schoolId'
      OR new_record -> 'role' IS DISTINCT FROM old_record -> 'role'
      OR new_record -> 'effectiveFrom' IS DISTINCT FROM old_record -> 'effectiveFrom'
      OR new_record -> 'grantReason' IS DISTINCT FROM old_record -> 'grantReason'
      OR new_record -> 'evidenceReference' IS DISTINCT FROM old_record -> 'evidenceReference'
      OR new_record -> 'grantedByIdentityId' IS DISTINCT FROM old_record -> 'grantedByIdentityId') THEN
    RAISE EXCEPTION 'School role assignment scope is immutable' USING ERRCODE = '23514';
  ELSIF TG_TABLE_NAME = 'FiscalYear'
    AND (new_record -> 'schoolId' IS DISTINCT FROM old_record -> 'schoolId'
      OR new_record -> 'buddhistYear' IS DISTINCT FROM old_record -> 'buddhistYear'
      OR new_record -> 'startsOn' IS DISTINCT FROM old_record -> 'startsOn'
      OR new_record -> 'endsOn' IS DISTINCT FROM old_record -> 'endsOn') THEN
    RAISE EXCEPTION 'Fiscal Year boundaries are immutable' USING ERRCODE = '23514';
  ELSIF TG_TABLE_NAME = 'ActiveDirectorAvailability'
    AND (new_record -> 'schoolId' IS DISTINCT FROM old_record -> 'schoolId'
      OR new_record -> 'directorRoleAssignmentId' IS DISTINCT FROM old_record -> 'directorRoleAssignmentId'
      OR new_record -> 'unavailableFrom' IS DISTINCT FROM old_record -> 'unavailableFrom'
      OR new_record -> 'recordedByIdentityId' IS DISTINCT FROM old_record -> 'recordedByIdentityId') THEN
    RAISE EXCEPTION 'Director availability scope is immutable' USING ERRCODE = '23514';
  ELSIF TG_TABLE_NAME = 'SubstituteDirectorAuthority'
    AND (new_record -> 'schoolId' IS DISTINCT FROM old_record -> 'schoolId'
      OR new_record -> 'variant' IS DISTINCT FROM old_record -> 'variant'
      OR new_record -> 'appointingIdentityId' IS DISTINCT FROM old_record -> 'appointingIdentityId'
      OR new_record -> 'subjectRoleAssignmentId' IS DISTINCT FROM old_record -> 'subjectRoleAssignmentId'
      OR new_record -> 'availabilityId' IS DISTINCT FROM old_record -> 'availabilityId'
      OR new_record -> 'actingReasonCode' IS DISTINCT FROM old_record -> 'actingReasonCode'
      OR new_record -> 'reasonDetail' IS DISTINCT FROM old_record -> 'reasonDetail'
      OR new_record -> 'temporaryBasis' IS DISTINCT FROM old_record -> 'temporaryBasis'
      OR new_record -> 'commandScope' IS DISTINCT FROM old_record -> 'commandScope'
      OR new_record -> 'effectiveFrom' IS DISTINCT FROM old_record -> 'effectiveFrom'
      OR new_record -> 'expiresAt' IS DISTINCT FROM old_record -> 'expiresAt'
      OR new_record -> 'supersedesId' IS DISTINCT FROM old_record -> 'supersedesId'
      OR new_record -> 'integrityDigest' IS DISTINCT FROM old_record -> 'integrityDigest'
      OR new_record -> 'evidenceReference' IS DISTINCT FROM old_record -> 'evidenceReference'
      OR new_record -> 'evidenceContentHash' IS DISTINCT FROM old_record -> 'evidenceContentHash') THEN
    RAISE EXCEPTION 'Substitute authority record is immutable apart from lifecycle status and revision' USING ERRCODE = '23514';
  END IF;

  IF TG_TABLE_NAME = 'SubstituteDirectorAuthority'
    AND (new_record -> 'status' IS DISTINCT FROM old_record -> 'status'
      OR new_record -> 'recordVersion' IS DISTINCT FROM old_record -> 'recordVersion') THEN
    IF (new_record ->> 'recordVersion')::INTEGER <> (old_record ->> 'recordVersion')::INTEGER + 1
      OR new_record -> 'status' IS NOT DISTINCT FROM old_record -> 'status' THEN
      RAISE EXCEPTION 'Substitute authority lifecycle updates must advance recordVersion with a status change' USING ERRCODE = '23514';
    END IF;
    IF NOT (
      (old_record ->> 'status' = 'SCHEDULED' AND new_record ->> 'status' IN ('IN_FORCE', 'REVOKED', 'EXPIRED', 'SUPERSEDED', 'INVALIDATED'))
      OR (old_record ->> 'status' = 'IN_FORCE' AND new_record ->> 'status' IN ('REVOKED', 'EXPIRED', 'SUPERSEDED', 'INVALIDATED', 'ENDED_ON_RETURN'))
    ) THEN
      RAISE EXCEPTION 'Substitute authority lifecycle transition is invalid' USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
