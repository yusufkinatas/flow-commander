# Pack 5 designer/reviewer record

Date: 2026-07-18

This record preserves the two-role workflow required for The Exacting Muster. Level Designers authored candidates against `PACK5_CAMPAIGN_SPEC.md`; separate Game Design Reviewers then inspected purpose, teaching clarity, fairness, pacing, authored complexity, production-solver output, intended-route fidelity, and mechanic necessity. A reviewer could return only **APPROVED** or **CHANGES REQUIRED** with actionable feedback. Changed levels were resubmitted until approved.

## Review rubric

A level is approved only when it:

1. fulfills its roster purpose and communicates the expected realization;
2. introduces no unannounced mechanic inside an already dense problem;
3. contains no gratuitous branch or interactive tile;
4. has readable cause-and-effect and useful briefing/tip copy;
5. fits its complexity rating and position in the sawtooth curve;
6. parses and exhaustively solves under the production engine;
7. has exactly one solution matching `intendedRoute`;
8. emits valid Formation Checkpoint events and changes solution space when all and individual checkpoints are removed, except for an explicit reviewed teaching/parallel-audit marker; and
9. replays deterministically through the shared Planning/Execution trace.

## Level decisions

| ID | Initial reviewer decision | Important response | Final decision and justification |
|---:|---|---|---|
| 1 | APPROVED | None. | **APPROVED.** Atomic F1 introduction with a short, legible under-strength counterexample. |
| 2 | CHANGES REQUIRED | Replaced L1's duplicate mask with a staggered vertical choice. | **APPROVED.** The over-strength lesson is isolated in a distinct 9-step topology. |
| 3 | APPROVED | None. | **APPROVED.** Mandatory `+1` followed by a meaningful `+1`/`+2` choice teaches F2 composition. |
| 4 | APPROVED | None. | **APPROVED.** Combat is clearly inverted into a useful reduction before F1. |
| 5 | APPROVED | None. | **APPROVED.** Two decisions independently establish F2 and then F1. |
| 6 | APPROVED | None. | **APPROVED.** A visually distinct, low-load F3 breather. |
| 7 | APPROVED | None. | **APPROVED.** Complementary recruits contrast cleanly with an over-strength alternative. |
| 8 | CHANGES REQUIRED | Replaced L5's duplicate mask with mandatory `r → F1`, then a compact vertical recruit choice. | **APPROVED.** It now teaches non-consuming inspection directly; the first F1 is a documented instructional audit. |
| 9 | APPROVED | None. | **APPROVED.** Two arithmetic choices create four unchecked histories and one valid F2 result. |
| 10 | CHANGES REQUIRED | Added a linked fight-and-replacement ledger, then a second counter-history so F3 and F1 constrain independently. | **APPROVED.** Its 97 nodes and five-step dependency depth now exceed Level 9 and support the synthesis role. |
| 11 | APPROVED | None. | **APPROVED.** Mage/dragon purposefully demonstrates that specialists do not enter the ready count. |
| 12 | CHANGES REQUIRED | Replaced a one-choice corridor with three columns that separately test F2 and builder-before-river order. | **APPROVED.** Only one lane satisfies both ledgers; copy no longer reveals it. |
| 13 | APPROVED | None. | **APPROVED.** Soldier formation and mage order form two independent, readable ledgers. |
| 14 | CHANGES REQUIRED | Replaced serial diamonds with an asymmetric seal network; then made the switchless history formation-valid so `y`, `Y`, their pair, and F2 all constrain. | **APPROVED.** Access and arithmetic are now coupled without duplicating Level 13. |
| 15 | CHANGES REQUIRED | Rebuilt serial checklist forks as a shared-resource review ring; corrected briefing copy after re-review. | **APPROVED.** Four lanes fail for distinct specialist/order reasons. Repeated F3 markers form one documented parallel audit. |
| 16 | APPROVED | None. | **APPROVED.** A sharp post-peak breather that teaches tired soldiers are excluded. |
| 17 | CHANGES REQUIRED | Kept the approved three-patrol map but replaced a solution-revealing tip with an arithmetic prompt. | **APPROVED.** The player, rather than the copy, now identifies the cost-two patrol. |
| 18 | APPROVED | None. | **APPROVED.** The healer trap cleanly introduces the realization that recovery can hurt. |
| 19 | APPROVED, then strengthened | Added a second recoverable army history when per-checkpoint ablation exposed an F3 confirmation that did not constrain. | **APPROVED.** F1 identifies the current line; recovery and F3 independently reveal the original army size. |
| 20 | APPROVED | None. | **APPROVED.** Two combat decisions around required recovery create a clear complexity-5 dependency chain. |
| 21 | APPROVED | None. | **APPROVED.** Compact F3 retrieval works as the final deliberate breather. |
| 22 | CHANGES REQUIRED | Compressed long corridors and separated levy/F2, switch/Y, and combat/F1 into three independent decisions. | **APPROVED.** Every audit and seal tile now rejects a different otherwise-valid route. |
| 23 | CHANGES REQUIRED | Removed a gratuitous recruit identified by tile ablation. | **APPROVED.** The builder detour and combat cost are the only remaining decisions; complexity 3 is appropriate. |
| 24 | CHANGES REQUIRED | Added an ogre counter-history that makes F3 necessary and compressed 43 moves/77 open tiles to 19/30. | **APPROVED.** Three linked decisions now create the peak instead of corridor length. |
| 25 | CHANGES REQUIRED | Rebuilt the finale from 45 moves/80 open tiles to 28/44, separating Sun order, early/late recovery, two F2 checks, and F3 history. | **APPROVED.** Sixteen geometric combinations reduce fairly to one, with each visible constraint independently consequential. |

All final decisions were made by a reviewer role separate from the Level Designer who authored or revised the level. Reviewers made no file edits.

## Important designer revisions before review

- Level 1 removed a repeated F1 check so the introduction remained atomic.
- Level 3 replaced a shallow `+1`/`+2` choice with a mandatory first recruit and a consequential composition choice.
- Level 5 added a second fork so its two inspections constrain separate decisions.
- Level 6 changed from another horizontal fork into a vertical march, improving visual variety.
- Level 9 expanded one arithmetic choice into two linked decisions.
- Level 10 replaced a one-soldier fight with an orc so the `F3 → reduce → F1` dependency is exact.
- Levels 11–15 rejected pure corridors and serial item-checklist diamonds in favor of coupled formation/specialist ledgers.
- Level 17 kept its readable symmetric map but removed answer-giving hint copy.
- Level 18 discarded an alternate muster that made the negative-healing lesson ambiguous.
- Level 19 replaced a linear recovery chain with two histories that F1 and F3 distinguish independently.
- Level 22 replaced a long vertical chain with three compact, independent decisions.
- Level 23 removed a recruit that tile ablation proved gratuitous.
- Level 24 added a `4 − 3 = 1` counter-history and cut its route from 43 to 19 moves.
- Level 25 separated seal validity from recovery timing and cut its route from 45 to 28 moves.

## Scope limitation

No browser-based manual playtest was used for these levels. The review evidence is deterministic solver/replay data plus design inspection. Fresh-player comprehension and perceived difficulty remain human-calibration risks and are called out in the final report.
