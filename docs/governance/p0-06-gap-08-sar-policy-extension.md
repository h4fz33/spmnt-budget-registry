# GAP-08 SAR Policy Version Extension

**Policy Version ID:** `POL-GAP-08-SAR-001`
**Status:** Product Owner approved for the bootstrap initial pilot; activation remains an `AUTH-22` publication action
**Decision date / effective start:** `2026-08-14T00:00:00+07:00`
**Scope:** SESAO Narathiwat organization `1000960001`; all 17 approved Schools
**Source authority:** OBEC B.E. 2515 central-governance baseline

This version extends, but does not rewrite, `POL-INITIAL-PILOT-001`. Historical SAR instances retain their resolved policy/source revisions. Runtime use requires an attributable `AUTH-22` activation record and non-overlap validation for the SAR policy domain; Product Owner approval does not impersonate that publication command.

## Source integrity

| Source | SHA-256 |
| --- | --- |
| `reseach/แบบ 2515 -1.docx` | `935C06DB6521C34D8E59F69A281D57A757DAF2EA23C0C700BA297B93ADF7F5E7` |
| `reseach/แบบ 2515 -2 - 3 สถานศึกษา.xlsx` | `958529597E98AFE8E9B08DF729FE359B03B656BC676089DAB967B130F30E0489` |
| `reseach/แบบ สพท. 2515.xlsx` | `2573878533CC68300140B8C72A993E97F98C1751C871E77663888216F09B0BE6` |
| `reseach/2515-1_to_2515-2-semantic-scoring-matrix.md` | `EE3A6E4B81E10E9D940FD6593CAACC82A5FB13E9F9BA6A2AE38D85D46445A8A6` |
| `reseach/2515-1_to_2515-2_semantic_scoring_matrix.xlsx` | `6A104EA09C3008B29C56A073508448C2E9361628C43010FE1245966EEEFE18D8` |

## Rules

| Rule ID | Rule | Validation / fail-closed behavior |
| --- | --- | --- |
| `POL-SAR-01` | A direct 2515-1 -> 2515-2 mapping scores full fixed weight for `YES` and zero for `NO`; no partial credit. | Missing/insufficient evidence is neither `NO` nor `N/A`; set `EVIDENCE_GAP` / `REVIEW_REQUIRED` and block final score/submission. |
| `POL-SAR-02` | A composite mapping uses deterministic `ALL_REQUIRED` over source-applicable subcriteria. All applicable `YES` gives full fixed weight; any applicable `NO` gives zero; no fractional score. | Preserve every 2515-1 assertion and semantic mapping. Mixed applicability evaluates only applicable subcriteria. If all subcriteria are genuinely non-applicable, award the full fixed weight. |
| `POL-SAR-03` | `N/A` is allowed only when a documented source condition makes the criterion non-applicable. It requires explicit value, reason, and source-condition/evidence reference. A genuinely non-applicable criterion receives full fixed weight, preserving the 100-point scale. | Reject N/A for applicable criteria or without reason/reference. Missing evidence cannot satisfy N/A. |
| `POL-SAR-04` | Ten dimension weights are `10,20,5,10,20,17,5,3,5,5`; total 100. Result bands are Very Good 85-100, Good 70-84.50, Fair 60-69.50, Improve below 60. | Resolve from this Policy Version, not hard-coded workbook formulas. Store score, band, policy version, source hashes and assertion traceability. |
| `POL-SAR-05` | Exactly two distinct assessors: assigned active Finance Officer and assigned External Assessor. Both sign before active School Director approval/signature. Director cannot assess or submit. Assigned Finance Officer alone submits after approval. | Enforce `AUTH-35` through `AUTH-39`; no generic delegation, `AUTH-26`, or `AcceptAssessment`. |
| `POL-SAR-06` | Lifecycle is `DRAFT -> IN_PROGRESS -> ASSESSOR_1_SIGNED -> ASSESSOR_2_SIGNED -> DIRECTOR_APPROVAL_PENDING -> DIRECTOR_APPROVED -> READY_FOR_SUBMISSION -> SUBMITTED`. | Block progression on missing/non-distinct assignments, missing signature, stale revision, `REVIEW_REQUIRED`, or blocking `EVIDENCE_GAP`. Director approval does not submit. |
| `POL-SAR-07` | July is the source-established annual submission context for the SAR package. | Store the applicable year and July context. Any exact due-day or late-action behavior not stated by the source remains policy data and must not be invented. |
| `POL-SAR-08` | `SB-2515-3-17-SCHOOL-AGGREGATE` is derived only from submitted 2515-2 results for all 17 Schools, with columns aligned to `แบบ สพท. 2515`. | It is not original OBEC 2515-3 and creates no ranking, approval, return, mutation, or score-override authority. Access is `AUTH-24` only. |

## Reproducibility contract

Each SAR snapshot stores the policy version, source hashes, semantic-matrix revision, applicability decisions and evidence references, all 2515-1 assertions, derived 2515-2 criterion scores, dimension totals, total, result band, assessor assignments/signatures, Director approval, submission actor/time, and replacement history. A later policy version never recomputes or overwrites a submitted historical result.

## Activation evidence

`OPEN`: the Matrix-designated Policy Publisher must activate `POL-GAP-08-SAR-001` through `AUTH-22`, recording the actual activation event and SAR-domain non-overlap result. This is a runtime activation prerequisite, not a missing GAP-08 source or Product Owner decision.
