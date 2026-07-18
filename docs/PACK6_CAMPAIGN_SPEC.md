# Pack 6 campaign specification: The Grand Maneuver

Date: 2026-07-18
Status: **FROZEN BEFORE MAP AUTHORING**

## Campaign parameters

| Parameter | Frozen value |
|---|---|
| Level count / arc shape | 25 levels; five arcs of five roles |
| New mechanics / order | Stride Marker → Pivot Marker → Aegis Bearer |
| Solvability | At least one winning route; alternatives unrestricted and uncounted |
| Human playtesting | Not available in this implementation run; record as residual risk |
| Solver budget | 2,000,000 nodes per level; stop at first witness |
| Complexity budget | `1:3`, `2:7`, `3:6`, `4:5`, `5:4` |
| Forbidden gameplay family | Exact Number / Formation Checkpoints and every equality-gate reskin |

Map symbols `1`, `2`, and `3`; `formation`/`F1`/`F2`/`F3` declarations; Formation events; and equality checks on any inventory are forbidden in all Pack 6 source, metadata, and traces. Existing numeric recruit and enemy badges remain legal legacy mechanics.

## Learning contract

- Levels 1–5 teach Stride Markers from atomic passage to a compact two-marker synthesis.
- Levels 6–9 teach Pivot Markers without Aegis; Level 10 is the first Stride/Pivot combination.
- Levels 11–15 teach Aegis pickup, automatic spending, strength exclusion, and combat ordering without route-marker overload.
- Levels 16–18 are deliberate pairwise combinations; Levels 19–20 introduce all-three play.
- Levels 21–25 recall, invert, and synthesize the full grammar around one focused finale thesis.
- Levels 6, 11, 16, and 21 are genuine recovery points below the previous synthesis peak.
- Every level has one thesis, one primary realization, a documented reference route, and a separate reviewer.

## Authored curve

Complexity describes expected cognitive work, not route length or solver nodes.

| Complexity | 1 | 2 | 3 | 4 | 5 |
|---|---:|---:|---:|---:|---:|
| Count | 3 | 7 | 6 | 5 | 4 |

Frozen difficulty sequence:

`1, 1.8, 2.6, 3.4, 4.4 / 2, 3.2, 4.2, 5.1, 6.2 / 3, 4.2, 5.1, 6.3, 7.5 / 4, 5.2, 6.3, 7.3, 8.5 / 5, 6.7, 7.7, 8.9, 10`

Frozen complexity sequence:

`1, 2, 2, 3, 4 / 1, 2, 3, 3, 5 / 1, 2, 3, 4, 5 / 2, 3, 4, 4, 5 / 2, 2, 3, 4, 5`

## Mechanic matrix

`S` means Stride, `P` means Pivot, and `A` means Aegis. These abbreviations are metadata shorthand only; authored map symbols are `i`, `p`, and `a`.

| ID | Role | Working title | Difficulty | Complexity | Expected learning / realization | Required mechanics | Purpose |
|---:|---|---|---:|---:|---|---|---|
| 1 | Introduce | Through the Line | 1.0 | 1 | S: continue in the entering direction | S | Demonstrate one marker on a readable straight march. |
| 2 | Reinforce | No Sidestep | 1.8 | 2 | A turn made on S is rejected | S, route choice | Contrast the legal continuation with one tempting sidestep. |
| 3 | Twist | The Way In | 2.6 | 2 | Entry direction determines the useful S exit | S, approach choice | Make the player choose an approach rather than merely follow a corridor. |
| 4 | Combine | Straight to Muster | 3.4 | 3 | Preserve S geometry while collecting a soldier | S, recruit | Couple a local line constraint with a familiar pickup detour. |
| 5 | Synthesize | Double Cadence | 4.4 | 4 | Set up two differently oriented S passages | S, two markers, builder/river | Chain two local straight constraints around one familiar dependency. |
| 6 | Introduce | First Pivot | 2.0 | 1 | P requires a right-angle exit | P | Teach one visible corner as a true post-peak breather. |
| 7 | Reinforce | Either Corner | 3.2 | 2 | P permits left or right, not straight | P, branch choice | Show player agency inside the turn rule. |
| 8 | Twist | Change the Approach | 4.2 | 3 | A different P entry exposes a different exit pair | P, approach choice | Make entry selection, rather than turn direction alone, carry the decision. |
| 9 | Combine | Muster on the Bend | 5.1 | 3 | Turn geometry and combat order share a junction | P, recruit, combat | Couple one Pivot decision to a familiar resource history. |
| 10 | Synthesize | Cadence Change | 6.2 | 5 | Alternate straight and turn obligations | S, P | Read a compact sequence of opposite local route rules. |
| 11 | Introduce | Shield Bearer | 3.0 | 1 | A protects the next legal battle | A, recruit, two combats | Prove protection preserves soldiers needed for the following fight. |
| 12 | Reinforce | One Shield, One Fight | 4.2 | 2 | A is consumed once and automatically | A, combat choice | Choose which reachable fight should receive the single protection. |
| 13 | Twist | Shield Is Not Strength | 5.1 | 3 | A cannot win an under-strength fight | A, recruit choice, combat | Separate protection from the ordinary minimum-strength requirement. |
| 14 | Combine | Hold the Aegis | 6.3 | 4 | Noncombat interactions do not consume A | A, specialist pair, combat | Carry protection through a specialist duty to the fight that needs it. |
| 15 | Synthesize | Protected Reserve | 7.5 | 5 | One protected fight preserves a reserve for a later chain | A, multiple combats, healer | Choose protection and recovery order without any count gate. |
| 16 | Introduce | Straight under Cover | 4.0 | 2 | S geometry can remain atomic while A resolves combat | S, A, combat | A short pairwise-combination breather with one spatial and one state fact. |
| 17 | Reinforce | Shielded Turn | 5.2 | 3 | P approach decides which fight follows A | P, A, combat | Couple a turn decision to automatic protection order. |
| 18 | Twist | False Rhythm | 6.3 | 4 | S and P may demand different approaches to the same junction | S, P, specialist | Recall both marker rules through a noncombat counter-history. |
| 19 | Combine | Drill under Fire | 7.3 | 4 | Geometry determines whether A reaches the intended fight | S, P, A, combat | Introduce all three mechanics with two independent decisions. |
| 20 | Synthesize | The Reserve Maneuver | 8.5 | 5 | Carry and spend A across an alternating drill | S, P, A, multiple combats | Link spatial cadence to a protected/unprotected battle sequence. |
| 21 | Introduce | Parade Recall | 5.0 | 2 | Quickly discriminate S from P | S, P | Recover after the peak with two isolated, readable markers. |
| 22 | Reinforce | Aegis Detour | 6.7 | 2 | The legal marker route must collect A before a later fight | S, A, combat | Reconnect spatial access and protection without adding a third ledger. |
| 23 | Twist | Break the Cadence | 7.7 | 3 | The visually direct marker order is not the valid approach order | S, P, A | Invert the assumed approach while keeping the route compact. |
| 24 | Combine | Three Orders | 8.9 | 4 | Two geometry decisions independently place one protected fight | S, P, A, combat, specialist | Create a high-load but focused all-three dependency chain. |
| 25 | Synthesize | The Grand Maneuver | 10.0 | 5 | Preserve A through the drill and spend it only at the decisive battle | S, P, A, combat, builder/river | Finish on one thesis: geometry chooses the battle that receives the reserve. |

## Campaign assertions

- IDs are contiguous from 1 through 25 and roles repeat in the frozen cadence.
- Each arc ends at its local difficulty maximum; the next opens below it.
- No more than two complexity-5 levels are consecutive.
- Stride first appears at 1, Pivot at 6, Aegis at 11, and all three first appear together at 19.
- Every level contains at least one selected mechanic; later levels must exercise every mechanic they declare.
- Pack 6 maps exclude Relief/Convoy symbols as well as Formation symbols.
- Briefings explain the objective without naming the route; tips ask a reasoning question rather than reveal a direction string.

## Parallel production ledger

The Lead freezes this specification and owns cross-range integration. Designers edit only their assigned range files; reviewers make no edits and may not review a range they authored.

| Level / surface | Designer / implementer | Independent reviewer | Owned files | Revision | Initial status |
|---|---|---|---|---:|---|
| Mechanic vertical slice | `integration_audit` | `campaign_audit` | engine, UI, editor, mechanic tests | 1 | ASSIGNED |
| 01–10 | `campaign_audit` | `integration_audit` | `grand-maneuver-levels-01-10.js` | 1 | ASSIGNED |
| 11–17 | `mechanic_roster` | `campaign_audit` | `grand-maneuver-levels-11-17.js` | 1 | ASSIGNED |
| 18–25 | Lead Designer (`root`) | `mechanic_roster` | `grand-maneuver-levels-18-25.js` | 1 | ASSIGNED |
| Campaign integration | Lead Designer (`root`) | final fresh audit | pack assembly, campaign validator, reports | 1 | ASSIGNED |

Allowed statuses are `ASSIGNED`, `DESIGNING`, `SELF-CHECKED`, `IN REVIEW`, `CHANGES REQUIRED`, and `APPROVED`. A material map, reference-route, semantic, metadata, or hint change increments the revision and voids prior approval.

## Acceptance gates

Every level must parse, find a first winning witness below the node budget, replay its reference route to a win, remain deterministic and immutable, and emit every declared new-mechanic event. Every Stride/Pivot reference passage must satisfy its geometry; every declared Aegis level must pick up Aegis, spend it on a protected legal battle, and demonstrate the intended downstream consequence in review.

Automation never enumerates or rejects alternative winning routes. Independent review judges teaching clarity, meaningful use, novelty, copy, pacing, and curve placement. Human calibration remains a documented limitation of this run.
