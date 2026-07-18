# Pack 5 campaign specification: The Exacting Muster

Date: 2026-07-18

Pack 5 is a static, 25-level campaign built around Formation Checkpoints. A checkpoint marked `=1`, `=2`, or `=3` admits the commander only when the party has exactly that many **ready soldiers**. It consumes nothing. Tired soldiers and specialists do not count.

## Learning contract

- Levels 1–2 teach the rule in isolation: first exact success, then the fact that excess strength also fails.
- Levels 3–5 establish the three requirements and introduce combat as a deliberate way to reduce the ready line.
- Levels 6, 11, 16, and 21 are deliberate breathers below the preceding arc peak.
- Familiar systems are interleaved only after the checkpoint rule is readable on its own.
- Each arc ends with synthesis, but no capstone is allowed to become an “everything at once” inventory puzzle.
- Every level has one intended route, one design thesis, and at least one consequential Formation Checkpoint.
- The difficulty curve is a rising sawtooth. Authored cognitive load is reviewed alongside solver metrics; it is not inferred from route length alone.

## Mechanic matrix and authored curve

`F1`/`F2`/`F3` are exact ready-soldier checkpoints. “Reduce” means combat is used intentionally to lower the ready line. “Recovery” means the healer changes a later exact count.

Complexity is the roster's authored cognitive-load estimate:

- **1:** very straightforward, with little thought required.
- **2:** a light puzzle.
- **3:** a moderate puzzle.
- **4:** difficult, with a meaningful realization.
- **5:** a major head-scratcher centered on a strong aha moment.

The required distribution is exact: three complexity-1 levels, seven complexity-2 levels, six complexity-3 levels, five complexity-4 levels, and four complexity-5 levels. The sixteen levels rated 1–3 form the teaching, reinforcement, and breathing room around the nine late-weighted peaks.

| ID | Campaign role | Title | Intended difficulty | Complexity | Expected learning or realization | Required mechanics | Purpose |
|---:|---|---|---:|---:|---|---|---|
| 1 | Introduce | One in Line | 1.0 | 1 | F1 | Recruit | One recruit opens one checkpoint and the checkpoint spends nobody. |
| 2 | Reinforce | Too Many Boots | 1.8 | 1 | Over-strength failure | F1, recruit choice | More soldiers are not always better: choose `+1`, not `+2`. |
| 3 | Twist | Pairs on Parade | 2.6 | 2 | F2 | Two recruit values | Compose exactly two ready soldiers from the available muster. |
| 4 | Combine | After the Watch | 3.4 | 2 | Reduce | F1, combat | A goblin can be useful because spending one soldier creates the inspected count. |
| 5 | Synthesize | First Review | 4.5 | 3 | Sequential exact counts | F2 → combat → F1 | Preserve a valid count across two inspections by changing it deliberately between them. |
| 6 | Introduce | Clean Triple | 2.0 | 1 | F3 | `+1`, `+2` | A short, readable breather teaches the largest checkpoint number. |
| 7 | Reinforce | The Spare Rank | 3.4 | 2 | Over-strength at F3 | F3, recruit choice | Take both complementary recruits while rejecting an attractive over-strength branch. |
| 8 | Twist | Count It Twice | 4.2 | 2 | Stable inspection | F1 → recruit → F2 | Passing a checkpoint does not consume soldiers; only the intervening recruit changes the count. |
| 9 | Combine | Sergeant’s Choice | 5.0 | 3 | Arithmetic across ordered forks | F2, reduce, fork order | Choose the branch whose recruit-and-combat arithmetic lands exactly on two. |
| 10 | Synthesize | The Narrow Ledger | 6.2 | 4 | Backward constraint solving | F3 → reduce → F1 | Read two exact constraints backward and choose the only compatible reduction chain. |
| 11 | Introduce | Mage off the Roll | 3.0 | 2 | Specialists excluded | F1, mage | A mage may join without changing an exact ready-soldier count. |
| 12 | Reinforce | Builder’s Column | 4.2 | 3 | Specialist counters stay separate | F2, builder, river | Specialist acquisition and spending happen beside an unchanged soldier formation. |
| 13 | Twist | The Dragon’s Audit | 5.2 | 3 | Solve independent resource ledgers | F1, mage, dragon | Separate the mage economy from the soldier count while ordering both correctly. |
| 14 | Combine | Sealed Attendance | 6.0 | 4 | Persistent access does not alter formation | F2, switch, gate | A persistent seal changes access, while the checkpoint still reads only ready soldiers. |
| 15 | Synthesize | Officers and Ranks | 7.4 | 5 | Preserve one count across two specialist chains | F3, mage/dragon, builder/river | Maintain an exact formation while two independent specialist chains resolve around it. |
| 16 | Introduce | Useful Fatigue | 4.0 | 2 | Tired excluded | F1, combat | A tired soldier remains in the company but correctly disappears from the inspection count. |
| 17 | Reinforce | Battle Count | 5.2 | 3 | Select combat by its resulting count | F2, multiple combat costs | Choose the fight that reduces the ready line to the checkpoint’s exact requirement. |
| 18 | Twist | Recovery Overflow | 6.2 | 4 | Healer can hurt | F2, combat, recovery | Healing at the wrong time restores too many soldiers for the inspection. |
| 19 | Combine | Return to Formation | 7.2 | 4 | Recovery is a required bridge between counts | F1 → recovery → F3 | The healer is required between two different exact counts, not merely helpful. |
| 20 | Synthesize | The Second Inspection | 8.4 | 5 | Recovery timing changes later reductions | reduce, recovery, F2 → F1 | Route order must choreograph fatigue, restoration, and a final deliberate reduction. |
| 21 | Introduce | Parade Rest | 5.0 | 2 | Retrieval | F3, simple recruits | A visually clean breather recalls exact composition before the capstones. |
| 22 | Reinforce | Orders under Seal | 6.6 | 4 | Access order and army size are independent constraints | F1/F2, switch/gate | The seal dictates route order, while two checkpoints dictate army size. |
| 23 | Twist | Quartermaster’s Count | 7.6 | 3 | A specialist detour need not alter attendance | F3, builder/river, reduce | A specialist detour and soldier reduction must both preserve a later exact count. |
| 24 | Combine | Two Audits, One Army | 8.8 | 5 | Helpful recovery can invalidate a later audit | F3 → combat → F1, recovery decoy | A tempting recovery is rejected because the same army must satisfy two audits. |
| 25 | Synthesize | The Exacting March | 10.0 | 5 | Restore only when the complete downstream ledger permits it | F2/F3, reduce, recovery, one seal | The finale’s central insight is when to restore the line so every later exact count remains reachable. |

## Acceptance gates

Every authored candidate must pass all of the following before it can enter the pack:

1. The production parser accepts a rectangular, legal-symbol campaign map with one `S` and one `G`.
2. Its declared `intendedRoute` replays successfully through `tracePath()` and wins.
3. Exhaustive production-engine enumeration completes below the node limit and proves exactly one solution.
4. The exhaustive solution exactly matches `intendedRoute`.
5. The winning trace emits at least one `formation` event, with `actual === required` at every checkpoint.
6. Removing all checkpoints changes the solution space. Each individual checkpoint must also constrain the route unless a reviewer explicitly accepts it as an on-route instructional demonstration, as in the first “inspection does not consume” lesson.
7. Trace and simulation are deterministic, immutable, and event-for-event identical across repeated runs.
8. A separate reviewer records purpose, legibility, novelty, curve placement, and rejected/revised candidates.

Human playtesting remains a post-implementation calibration step. Solver uniqueness proves correctness, not readability or delight.
