# Pack 5 automated solvability and quality report

Date: 2026-07-18

The production exhaustive solver certified all 25 static levels in The Exacting Muster. Every level has exactly one solution, the solution matches its authored `intendedRoute`, and replay through the Planning/Execution trace is deterministic and immutable. The complete campaign expands 1,391 solver nodes across 373 solution moves; the largest level expands 191 nodes, far below the 2,000,000-node safety limit.

## Results

“Effort” is `expanded nodes / branch nodes`. “No F” is the exact number of solutions after replacing every Formation Checkpoint with meadow; values above one are evidence that the mechanic removes real alternatives. Dependency depth and complexity are authored cognitive estimates reviewed separately from solver effort.

| ID | Level | Solutions | Length | Effort | Dependency | Complexity | Difficulty | No F | Flag |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | One in Line | 1 | 8 | 25 / 2 | 1 | 1 | 1.0 | 2 | — |
| 2 | Too Many Boots | 1 | 9 | 29 / 2 | 1 | 1 | 1.8 | 2 | — |
| 3 | Pairs on Parade | 1 | 8 | 22 / 2 | 2 | 2 | 2.6 | 2 | — |
| 4 | After the Watch | 1 | 9 | 26 / 2 | 2 | 2 | 3.4 | 2 | — |
| 5 | First Review | 1 | 14 | 41 / 4 | 3 | 3 | 4.5 | 4 | — |
| 6 | Clean Triple | 1 | 9 | 29 / 2 | 2 | 1 | 2.0 | 2 | Breather |
| 7 | The Spare Rank | 1 | 10 | 33 / 2 | 2 | 2 | 3.4 | 2 | — |
| 8 | Count It Twice | 1 | 10 | 28 / 2 | 3 | 2 | 4.2 | 2 | Instructional audit¹ |
| 9 | Sergeant's Choice | 1 | 15 | 66 / 6 | 3 | 3 | 5.0 | 4 | — |
| 10 | The Narrow Ledger | 1 | 24 | 97 / 8 | 5 | 4 | 6.2 | 7 | — |
| 11 | Mage off the Roll | 1 | 8 | 30 / 2 | 3 | 2 | 3.0 | 2 | Breather |
| 12 | Builder's Column | 1 | 18 | 69 / 3 | 3 | 3 | 4.2 | 2 | — |
| 13 | The Dragon's Audit | 1 | 19 | 79 / 7 | 4 | 3 | 5.2 | 2 | — |
| 14 | Sealed Attendance | 1 | 21 | 111 / 9 | 4 | 4 | 6.0 | 2 | — |
| 15 | Officers and Ranks | 1 | 26 | 54 / 6 | 6 | 5 | 7.4 | 2 | Parallel audit¹; concept > search² |
| 16 | Useful Fatigue | 1 | 9 | 24 / 2 | 4 | 2 | 4.0 | 2 | Breather |
| 17 | Battle Count | 1 | 9 | 56 / 4 | 4 | 3 | 5.2 | 3 | — |
| 18 | Recovery Overflow | 1 | 12 | 32 / 2 | 4 | 4 | 6.2 | 2 | Concept > search² |
| 19 | Return to Formation | 1 | 17 | 65 / 7 | 5 | 4 | 7.2 | 4 | — |
| 20 | The Second Inspection | 1 | 25 | 63 / 4 | 6 | 5 | 8.4 | 4 | Concept > search² |
| 21 | Parade Rest | 1 | 10 | 33 / 2 | 2 | 2 | 5.0 | 2 | Breather |
| 22 | Orders under Seal | 1 | 19 | 50 / 6 | 5 | 4 | 6.6 | 4 | — |
| 23 | Quartermaster's Count | 1 | 17 | 73 / 5 | 4 | 3 | 7.6 | 2 | Topology > concept³ |
| 24 | Two Audits, One Army | 1 | 19 | 65 / 8 | 5 | 5 | 8.8 | 8 | — |
| 25 | The Exacting March | 1 | 28 | 191 / 31 | 6 | 5 | 10.0 | 8 | Intentional maximum |

¹ Level 8's first F1 is an explicitly reviewed on-route teaching check: it demonstrates that inspection consumes nothing before the same soldier is counted again at F2. Level 15 repeats F3 consistently across four specialist-order lanes; one F3 rejects an over-strength history, while the other three provide a common audit interface before later specialist failures. In both cases the overall formation family constrains the solution and the exemptions are explicit in level metadata.

² These levels derive difficulty from a short state-order realization rather than a large search tree. Level 15 distinguishes four specialist-order failures; Level 18 introduces harmful recovery; Level 20 chains reduction, recovery, and a second reduction. Their authored ratings remain plausible but need human calibration.

³ Level 23's solver explores more geometry than its single builder-plus-combat realization suggests. The reviewer retained complexity 3 and treated the search score as a topology effect, not evidence of human difficulty.

## Acceptance evidence

- **Validity:** all maps are rectangular, contain known campaign symbols, and have contiguous IDs 1–25.
- **Exact solutions:** 25/25 exhaustive searches completed; every solution count is exactly one and every route equals `intendedRoute`.
- **Mechanic necessity:** removing all checkpoints produces 2–8 solutions per level. Individual checkpoints and Sun seal tiles are ablated too; each constrains the route unless covered by a documented reviewer-approved teaching/parallel-audit exemption.
- **Required mechanics:** declared formation thresholds, combat, specialist, river, dragon, recovery, and Sun-seal events are checked against the winning production trace.
- **Flow parity:** `tracePath()` and `simulatePath()` are deep-equal, repeated runs are deterministic, and level data remains unchanged.
- **Curve:** levels 6, 11, 16, and 21 are measurable breathers. Every five-level arc ends at its local intended-difficulty peak and the next arc opens below it.
- **Distribution:** complexity 1: 3 levels; complexity 2: 7; complexity 3: 6; complexity 4: 5; complexity 5: 4. This is exactly four 5s, five 4s, and sixteen levels rated 1–3.

## Limitations

Exhaustive uniqueness proves production-rule correctness, not human comprehension or enjoyment. Solver nodes are topology-sensitive, and authored dependency/complexity estimates remain hypotheses until fresh players attempt the campaign. No browser-based manual playtest was used, per the project constraint; future calibration should observe first-time players without changing the deterministic acceptance gates.
