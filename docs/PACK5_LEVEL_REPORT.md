# Pack 5 automated solvability and quality report

Date: 2026-07-18

The production solver finds a winning witness for all 25 static levels in The Exacting Muster. Each authored `intendedRoute` also wins as a reference example, and replay through the Planning/Execution trace is deterministic and immutable. The validator stops after its first winning witness; it does not count alternatives or reject open and symmetric layouts.

## Results

Reference length describes the authored example route, not a shortest or exclusive solution. Dependency depth and complexity are authored cognitive estimates. First-witness search metrics may still be inspected diagnostically, but they depend on traversal order and are not a route-count or difficulty contract.

| ID | Level | Solvable | Reference length | Dependency | Complexity | Difficulty | Flag |
|---:|---|---|---:|---:|---:|---:|---|
| 1 | One in Line | PASS | 8 | 1 | 1 | 1.0 | — |
| 2 | Too Many Boots | PASS | 9 | 1 | 1 | 1.8 | — |
| 3 | Pairs on Parade | PASS | 8 | 2 | 2 | 2.6 | — |
| 4 | After the Watch | PASS | 9 | 2 | 2 | 3.4 | — |
| 5 | First Review | PASS | 14 | 3 | 3 | 4.5 | — |
| 6 | Clean Triple | PASS | 9 | 2 | 1 | 2.0 | Breather |
| 7 | The Spare Rank | PASS | 10 | 2 | 2 | 3.4 | — |
| 8 | Count It Twice | PASS | 10 | 3 | 2 | 4.2 | Instructional audit¹ |
| 9 | Sergeant's Choice | PASS | 15 | 3 | 3 | 5.0 | — |
| 10 | The Narrow Ledger | PASS | 24 | 5 | 4 | 6.2 | — |
| 11 | Mage off the Roll | PASS | 8 | 3 | 2 | 3.0 | Breather |
| 12 | Builder's Column | PASS | 18 | 3 | 3 | 4.2 | — |
| 13 | The Dragon's Audit | PASS | 19 | 4 | 3 | 5.2 | — |
| 14 | Sealed Attendance | PASS | 21 | 4 | 4 | 6.0 | — |
| 15 | Officers and Ranks | PASS | 26 | 6 | 5 | 7.4 | Parallel audit¹; concept > search² |
| 16 | Useful Fatigue | PASS | 9 | 4 | 2 | 4.0 | Breather |
| 17 | Battle Count | PASS | 9 | 4 | 3 | 5.2 | — |
| 18 | Recovery Overflow | PASS | 12 | 4 | 4 | 6.2 | Concept > search² |
| 19 | Return to Formation | PASS | 17 | 5 | 4 | 7.2 | — |
| 20 | The Second Inspection | PASS | 25 | 6 | 5 | 8.4 | Concept > search² |
| 21 | Parade Rest | PASS | 10 | 2 | 2 | 5.0 | Breather |
| 22 | Orders under Seal | PASS | 19 | 5 | 4 | 6.6 | — |
| 23 | Quartermaster's Count | PASS | 17 | 4 | 3 | 7.6 | Topology > concept³ |
| 24 | Two Audits, One Army | PASS | 19 | 5 | 5 | 8.8 | — |
| 25 | The Exacting March | PASS | 28 | 6 | 5 | 10.0 | Intentional maximum |

¹ Level 8's first F1 is an explicitly reviewed on-route teaching check: it demonstrates that inspection consumes nothing before the same soldier is counted again at F2. Level 15 repeats F3 consistently across four specialist-order lanes to provide a common audit interface. These are design-review observations, not route-space gates.

² These levels derive difficulty from a short state-order realization rather than a large search tree. Level 15 distinguishes four specialist-order failures; Level 18 introduces harmful recovery; Level 20 chains reduction, recovery, and a second reduction. Their authored ratings remain plausible but need human calibration.

³ Level 23's solver explores more geometry than its single builder-plus-combat realization suggests. The reviewer retained complexity 3 and treated the search score as a topology effect, not evidence of human difficulty.

## Acceptance evidence

- **Validity:** all maps are rectangular, contain known campaign symbols, and have contiguous IDs 1–25.
- **Solvability:** 25/25 searches find a winning witness within the node limit. Alternative winning routes are allowed and not counted.
- **Reference routes:** every legacy `intendedRoute` is checked as a valid winning example, without requiring the solver's first witness to match it.
- **Mechanic evidence:** declared checkpoint, combat, specialist, river, dragon, recovery, and Sun-seal events are checked on reference traces. Meaningfulness remains a reviewer judgment rather than a route-space ablation gate.
- **Required mechanics:** declared formation thresholds, combat, specialist, river, dragon, recovery, and Sun-seal events are checked against the winning production trace.
- **Flow parity:** `tracePath()` and `simulatePath()` are deep-equal, repeated runs are deterministic, and level data remains unchanged.
- **Curve:** levels 6, 11, 16, and 21 are measurable breathers. Every five-level arc ends at its local intended-difficulty peak and the next arc opens below it.
- **Distribution:** complexity 1: 3 levels; complexity 2: 7; complexity 3: 6; complexity 4: 5; complexity 5: 4. This is exactly four 5s, five 4s, and sixteen levels rated 1–3.

## Limitations

A winning witness proves possibility under production rules, not completeness, uniqueness, human comprehension, or enjoyment. First-witness search nodes are topology- and traversal-order-sensitive, while authored dependency/complexity estimates remain hypotheses until fresh players attempt the campaign. No browser-based manual playtest was used, per the project constraint; future calibration should observe first-time players without changing the deterministic solvability gates.
