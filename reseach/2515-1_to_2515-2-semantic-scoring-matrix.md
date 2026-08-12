# Semantic Scoring Matrix: แบบ 2515-1 → แบบ 2515-2

## Status
Working implementation reference derived from the OBEC source manuals supplied in this conversation. It separates source-supported semantic mappings from implementation interpretations.

## Governing principle
- แบบ 2515-1 = detailed Self Assessment / observation checklist.
- แบบ 2515-2 = scored summary criteria, total 100 points.
- Mapping MUST be semantic/content-based, not number-based.
- Mapping types: DIRECT, COMPOSITE, EXPANDED, SUPPORTING/UNSCORED.
- The source manuals do **not** specify a partial-credit algorithm for composite criteria. Any `ALL_REQUIRED` rule below is therefore an implementation proposal, not an OBEC-stated scoring formula.

## Matrix

| Dim | 2515-2 | Max | 2515-1 source | Type | Confidence |
|---:|---|---:|---|---|---|
| 1 | 1.1 | 2 | 1.1 | DIRECT | HIGH |
| 1 | 1.2 | 1 | 1.3 | DIRECT | HIGH |
| 1 | 1.3 | 1 | 1.5 | DIRECT | HIGH |
| 1 | 1.4 | 1 | 1.7 | DIRECT | HIGH |
| 1 | 1.5 | 1 | 1.11 | DIRECT | HIGH |
| 1 | 1.6 | 2 | 1.10; 1.12; 1.13 | COMPOSITE | MEDIUM |
| 1 | 1.7 | 1 | 1.14 | DIRECT | HIGH |
| 1 | 1.8 | 1 | 1.15 | DIRECT | HIGH |
| 2 | 2.1 | 5 | 2.1 | DIRECT | HIGH |
| 2 | 2.2 | 5 | 2.4 | DIRECT | HIGH |
| 2 | 2.3 | 2 | 2.3 | DIRECT | HIGH |
| 2 | 2.4 | 5 | 2.5 | DIRECT | HIGH |
| 2 | 2.5 | 3 | 2.6 | DIRECT | HIGH |
| 3 | 3.1 | 1 | 3.1 | DIRECT | HIGH |
| 3 | 3.2 | 1 | 3.2 | DIRECT | HIGH |
| 3 | 3.3 | 2 | 3.3 | DIRECT | HIGH |
| 3 | 3.4 | 0.5 | 3.4.2; 3.4.3 | COMPOSITE | MEDIUM |
| 3 | 3.5 | 0.5 | 3.5 | DIRECT | HIGH |
| 4 | 4.1 | 1 | 4.1 | DIRECT | HIGH |
| 4 | 4.2 | 2 | 4.2 | DIRECT | HIGH |
| 4 | 4.3 | 4 | 4.3 | DIRECT | HIGH |
| 4 | 4.4 | 2 | 4.4 | DIRECT | HIGH |
| 4 | 4.5 | 1 | 4.5 | DIRECT | HIGH |
| 5 | 5.1 | 5 | 5.1 + 5.1.1.1–5.1.5 | COMPOSITE | MEDIUM |
| 5 | 5.2 | 5 | 5.2 | DIRECT | HIGH |
| 5 | 5.3 | 5 | 5.4 | DIRECT | HIGH |
| 5 | 5.4 | 3 | 5.5; 5.5.1–5.5.5 | COMPOSITE | HIGH |
| 5 | 5.5 | 2 | 5.6 | DIRECT | HIGH |
| 6 | 6.1 | 5 | 6.1 | DIRECT | HIGH |
| 6 | 6.2 | 3 | 6.1 | EXPANDED | HIGH |
| 6 | 6.3 | 1 | 6.2 | DIRECT | HIGH |
| 6 | 6.4 | 1 | 6.3.1 | DIRECT | HIGH |
| 6 | 6.5 | 2 | 6.3.2; 9.4.1–9.4.2 (supporting) | DIRECT | HIGH |
| 6 | 6.6 | 2 | 6.3.3(1); 6.3.3(2) | COMPOSITE | HIGH |
| 6 | 6.7 | 3 | 6.4.1; 6.4.2 | COMPOSITE | HIGH |
| 7 | 7.1 | 2 | 7.1.1 | DIRECT | HIGH |
| 7 | 7.2 | 1 | 7.1.2 | DIRECT | HIGH |
| 7 | 7.3 | 0.5 | 7.2.1 | DIRECT | HIGH |
| 7 | 7.4 | 0.5 | 7.2.2 | DIRECT | HIGH |
| 7 | 7.5 | 0.5 | 7.2.3 | DIRECT | HIGH |
| 7 | 7.6 | 0.5 | 7.3 | DIRECT | HIGH |
| 8 | 8.1 | 1 | 8.1 | DIRECT | HIGH |
| 8 | 8.2 | 2 | 8.2.1; 8.2.2 | COMPOSITE | HIGH |
| 9 | 9.1 | 1 | 9.1; 9.1.1–9.1.5 | COMPOSITE | HIGH |
| 9 | 9.2 | 1 | 9.2 | DIRECT | HIGH |
| 9 | 9.3 | 1 | 9.3 | DIRECT | HIGH |
| 9 | 9.4 | 1 | 9.5.1(1); 9.5.1(2) | COMPOSITE | HIGH |
| 9 | 9.5 | 1 | 9.6.1; 9.6.2; 9.6.3 | COMPOSITE | HIGH |
| 10 | 10.1 | 1 | 10.4 | DIRECT | HIGH |
| 10 | 10.2 | 1 | 10.2; 10.3 | COMPOSITE | HIGH |
| 10 | 10.3 | 1 | 10.5 | DIRECT | HIGH |
| 10 | 10.4 | 1 | 10.6 | DIRECT | HIGH |
| 10 | 10.5 | 1 | 10.7 | DIRECT | HIGH |

## Critical interpretation examples

### Dimension 1
`2515-2 1.6` is a composite of `2515-1 1.10 + 1.12 + 1.13`; it is not equivalent to `2515-1 1.6`.

### Dimension 6
`2515-1 6.1` contains both cash-book and off-budget-register controls, while `2515-2` separates these into `6.1` and `6.2`. This is an EXPANDED mapping.

### Dimension 10
`2515-2 10.1` corresponds to `2515-1 10.4` (receipt register), not `2515-1 10.1`. This demonstrates why numeric matching is unsafe.

## Implementation guardrails
1. Never infer a score from the 2515-1 item number.
2. Preserve every 2515-1 response even when it is not independently scored.
3. Store mapping provenance and mapping type with each scored criterion.
4. Do not invent fractional scoring for composite criteria unless an authoritative scoring rule is supplied.
5. For ambiguous composite cases, use `REVIEW_REQUIRED` rather than silently guessing.
6. Keep the 100-point weights exactly as stated in 2515-2.