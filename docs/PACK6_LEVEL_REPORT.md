# Pack 6 automated solvability and quality report

Date: 2026-07-18

The production solver finds a winning witness for all 25 levels in **The Grand Maneuver**. Every authored `referenceRoute` also wins through the production trace, including departure-timed Stride/Pivot events and Aegis-protected combat. The validator stops at the first witness; it does not enumerate alternatives or reject open and symmetric layouts.

## Results

Reference length describes the authored example, not a shortest or exclusive route. Dependency depth and complexity are authored cognitive estimates. First-witness search metrics are diagnostic because they depend on map topology and traversal order.

| ID | Level | Solvable | Reference | Witness | Nodes | Dependency | Complexity | Difficulty | Flag |
|---:|---|---|---:|---:|---:|---:|---:|---:|---|
| 1 | Through the Line | PASS | 6 | 6 | 7 | 1 | 1 | 1.0 | — |
| 2 | No Sidestep | PASS | 9 | 9 | 10 | 2 | 2 | 1.8 | — |
| 3 | The Way In | PASS | 5 | 5 | 9 | 2 | 2 | 2.6 | — |
| 4 | Straight to Muster | PASS | 6 | 6 | 10 | 3 | 3 | 3.4 | — |
| 5 | Double Cadence | PASS | 14 | 14 | 16 | 5 | 4 | 4.4 | — |
| 6 | First Pivot | PASS | 6 | 6 | 7 | 1 | 1 | 2.0 | Breather |
| 7 | Either Corner | PASS | 5 | 5 | 6 | 2 | 2 | 3.2 | — |
| 8 | Change the Approach | PASS | 6 | 6 | 7 | 3 | 3 | 4.2 | — |
| 9 | Muster on the Bend | PASS | 8 | 8 | 9 | 4 | 3 | 5.1 | — |
| 10 | Cadence Change | PASS | 12 | 14 | 15 | 6 | 5 | 6.2 | Concept > search¹ |
| 11 | Shield Bearer | PASS | 10 | 10 | 11 | 2 | 1 | 3.0 | Breather |
| 12 | One Shield, One Fight | PASS | 16 | 16 | 29 | 3 | 2 | 4.2 | — |
| 13 | Shield Is Not Strength | PASS | 13 | 13 | 32 | 3 | 3 | 5.1 | — |
| 14 | Hold the Aegis | PASS | 17 | 17 | 35 | 4 | 4 | 6.3 | — |
| 15 | Protected Reserve | PASS | 18 | 18 | 70 | 5 | 5 | 7.5 | — |
| 16 | Straight under Cover | PASS | 12 | 12 | 13 | 3 | 2 | 4.0 | Breather |
| 17 | Shielded Turn | PASS | 15 | 15 | 28 | 4 | 3 | 5.2 | — |
| 18 | False Rhythm | PASS | 17 | 17 | 29 | 4 | 4 | 6.3 | — |
| 19 | Drill under Fire | PASS | 21 | 21 | 29 | 5 | 4 | 7.3 | — |
| 20 | The Reserve Maneuver | PASS | 19 | 21 | 326 | 6 | 5 | 8.5 | — |
| 21 | Parade Recall | PASS | 8 | 8 | 9 | 2 | 2 | 5.0 | Breather |
| 22 | Aegis Detour | PASS | 10 | 12 | 15 | 3 | 2 | 6.7 | — |
| 23 | Break the Cadence | PASS | 17 | 17 | 23 | 4 | 3 | 7.7 | — |
| 24 | Three Orders | PASS | 29 | 35 | 822 | 6 | 4 | 8.9 | Topology > concept² |
| 25 | The Grand Maneuver | PASS | 23 | 23 | 33 | 6 | 5 | 10.0 | Concept > search¹ |

¹ Levels 10 and 25 ask the player to compose several visible geometric obligations even though the production depth-first order finds a witness quickly. Their high authored load remains a fresh-player calibration hypothesis.

² Level 24's open approach loop produces 822 first-witness nodes and 210 dead ends. The reviewed idea is a four-part strength/protection/turn/bridge ledger, so the search spike is retained as a topology diagnostic rather than promoted to complexity 5.

## Aggregate evidence

- **Solvability:** 25/25 first-witness searches succeed below the 2,000,000-node limit; no search aborts.
- **Reference replay:** 25/25 authored routes parse, win, and finish with no unresolved route marker.
- **Search totals:** 1,600 expanded nodes, 358 branch nodes, and 330 dead ends before the 25 first witnesses; Level 24 is the maximum at 822 nodes.
- **Route totals:** 322 authored reference moves and 334 first-witness moves. The longest witness is Level 24 at 35 moves.
- **Production parity:** trace and simulation are deeply equal; repeated traces are deterministic; analysis leaves level data and route inputs unchanged.
- **Mechanic range:** Stride resolves horizontally and vertically; Pivot exits cover at least three cardinal directions; protected battles cover costs 1, 2, and 3.
- **Reference event coverage:** every placed Stride/Pivot marker is departed on its authored reference, every placed Aegis is acquired and consumed there, and every Aegis reference includes a later unprotected battle that needs the preserved line. Independent design review and targeted counter-history regressions separately judge whether those events earn each level's thesis.
- **Forbidden family:** all 25 maps exclude `1`, `2`, and `3`; metadata and traces contain no Formation/Exact Number declaration or equality-gate substitute.
- **Curve:** Levels 6, 11, 16, and 21 are deliberate recovery points, every arc ends at its local authored-difficulty peak, and the next arc opens below it.
- **Distribution:** complexity 1: 3 levels; complexity 2: 7; complexity 3: 6; complexity 4: 5; complexity 5: 4.

## Limitations

A winning witness proves that the level is possible under production rules. It does not prove uniqueness, completeness, fresh-player comprehension, enjoyment, or perceived difficulty. First-witness solver nodes are topology- and traversal-order-sensitive, while authored complexity and dependency estimates remain hypotheses until observed with players.

Live browser checks exercised mechanic disclosure, marker pending/resolved presentation, Aegis pickup/protection preview, and HUD layout. They were integration checks, not fresh-player calibration; comprehension, hint quality, fatigue across peaks, and perceived difficulty remain residual risks.
