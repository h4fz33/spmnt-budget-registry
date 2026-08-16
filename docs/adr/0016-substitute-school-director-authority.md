# Substitute School Director Authority

**Status:** accepted
**Date:** 2026-08-15

Private Business / Product Owner approved a constrained substitute-authority model for School Director-required commands. Each School retains zero or one active School Director. Only an able active Director, otherwise one valid Acting authority, otherwise one valid Temporary authority may be the Effective Director Authority for the exact School, command, and time; all other cases deny. The model is deliberately not a role, membership, generic delegation, emergency override, or additional active Director.

An Acting record identifies the unavailable active Director and a distinct named Acting substitute with documented inability. A Temporary record identifies its named Temporary substitute and documented basis that Active/Acting resolution cannot supply a holder, including a School with zero active Director. This clarification adds no external eligibility criteria or evidence type: `BLK-011` continues to make appointment and exercise fail closed until Private Business / Product Owner supplies the exact authoritative appointment/organizational evidence type and validation rule.

ESAO Admin alone manages named Acting/Temporary authority records through `AUTH-14`; System Admin cannot do so and gains no financial authority. `AUTH-15` may operate only for `AUTH-09`, `AUTH-11`, `AUTH-12`, `AUTH-18`, and the approval portion of `AUTH-21`, subject to all underlying evidence and segregation-of-duties controls. `AUTH-19`, `AUTH-34`, `AUTH-35`, `AUTH-38`, and all other commands remain outside this authority. The exact authoritative appointment/organizational evidence type and validation rule were not supplied, so `BLK-011` keeps all substitute appointment and exercise execution fail closed.
