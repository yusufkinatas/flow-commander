# Pack 6 designer/reviewer record

Date: 2026-07-18

This record preserves the role separation used for **The Grand Maneuver**. The Lead froze `PACK6_CAMPAIGN_SPEC.md` before map authoring, assigned non-overlapping files, and required every designer to self-check against production rules. A different agent reviewed each range without editing it. Any material map, route, metadata, copy, or semantic change incremented the revision and voided the earlier verdict.

## Defined sub-agents and ownership

| Agent | Process role | Owned work | Forbidden work |
|---|---|---|---|
| `root` | Lead Designer / Campaign Curator; Level Designer for 18–25 | Roster/spec freeze, 18–25 source, pack integration, campaign validator, reports | Could not approve 18–25 |
| `campaign_audit` | Level Designer for 01–10; Reviewer for 11–17 and mechanic integration | `grand-maneuver-levels-01-10.js`; read-only review evidence for other assignments | Could not approve 01–10 or edit reviewed files |
| `mechanic_roster` | Candidate analyst; Level Designer for 11–17; Reviewer for 18–25 | Candidate comparison, `grand-maneuver-levels-11-17.js`; read-only late-range review | Could not approve 11–17 or edit 18–25 |
| `integration_audit` | Mechanic implementer; Reviewer for 01–10 | Engine/UI/editor/test vertical slice; read-only early-range review | Could not approve its vertical slice or edit 01–10 |
| `final_campaign_audit` | Fresh integrated-campaign reviewer | Read-only audit of current Pack 6 sources, production semantics, reports, and validators | Could not edit or silently repair any artifact |

## Operational ledger

| Level / surface | Designer | Reviewer | Owned files | Revision | Final status | Approval evidence |
|---|---|---|---|---:|---|---|
| Mechanic vertical slice | `integration_audit` | `campaign_audit` | engine, UI, editor, focused tests | 2 | **APPROVED** | Staged-disclosure re-review plus live browser and focused production checks |
| 01–10 | `campaign_audit` | `integration_audit` | `grand-maneuver-levels-01-10.js` | 2 | **APPROVED** | L9 re-review; production and relaxed-marker diagnostics |
| 11–17 | `mechanic_roster` | `campaign_audit` | `grand-maneuver-levels-11-17.js` | 2 | **APPROVED** | L12/L17 re-review; reference, counter-history, and solver evidence |
| 18–25 | Lead (`root`) | `mechanic_roster` | `grand-maneuver-levels-18-25.js` | 3 | **APPROVED** | L19/L21 targeted re-review after fresh-audit revisions |
| Integrated campaign | Lead (`root`) | `final_campaign_audit` | pack registration, validators, reports | 2 | **APPROVED** | Fresh re-audit verified both bypass fixes, report totals, and the full current campaign |

Allowed workflow statuses were `ASSIGNED`, `DESIGNING`, `SELF-CHECKED`, `IN REVIEW`, `CHANGES REQUIRED`, and `APPROVED`. Reviewers returned only `APPROVED` or `CHANGES REQUIRED` and made no level-source edits.

## Review rubric

A level was approved only when it:

1. fulfilled its frozen slot, learning claim, role, and curve position;
2. used every featured mechanic to support the thesis rather than as corridor decoration;
3. presented readable counter-histories and cause-and-effect without requiring one exclusive route;
4. avoided repeated decision masks across neighboring and parallel-authored ranges;
5. used objective-oriented briefing copy and a reasoning-question tip;
6. parsed and found a production first witness under 2,000,000 nodes;
7. replayed its authored reference as a valid win with required events and no pending marker;
8. preserved trace/simulation parity, determinism, and input immutability; and
9. contained no Exact Number/Formation tile, declaration, event, or equality-gate reskin.

## Mechanic vertical-slice review

Revision 1 passed engine, solver, editor, and focused rule tests but received **CHANGES REQUIRED** because Pack-wide help and HUD branches revealed Pivot and Aegis from Level 1. The implementer changed disclosure to derive from the current level's placed mechanics and added production-source regression checks for Levels 1, 6, 10, 11, and an all-three fixture.

Revision 2 received **APPROVED**. Independent checks confirmed local departure semantics in every rotation, pending-to-resolved Planning states, Aegis strength-before-consumption and stacking, immutable/fresh events, trace/execution parity, accessible non-color labels, editor preservation, and staged guide/HUD disclosure. Live browser evidence covered L1 Stride-only, L6 Pivot-only, L11 Aegis-only, and an all-three level without layout overflow.

## Per-level decisions

| ID | Initial decision | Important response | Final decision and justification |
|---:|---|---|---|
| 1 | APPROVED | None. | **APPROVED.** One straight departure introduces Stride atomically. |
| 2 | APPROVED | None. | **APPROVED.** A visible sidestep contrasts with the aligned exit. |
| 3 | APPROVED | None. | **APPROVED.** Approach, rather than corridor following, determines the useful line. |
| 4 | APPROVED | None. | **APPROVED.** Recruitment and useful Stride approach form one dependency. |
| 5 | APPROVED | None. | **APPROVED.** Two orientations frame a compact builder/river synthesis. |
| 6 | APPROVED | None. | **APPROVED.** A state-free corner is a genuine post-peak breather. |
| 7 | APPROVED | None. | **APPROVED.** Left and right corners preserve agency while straight remains tempting. |
| 8 | APPROVED | None. | **APPROVED.** Entry choice changes the available Pivot exit pair. |
| 9 | CHANGES REQUIRED | Rebuilt the forced T so neutralizing Pivot adds a direct win; the legal winning corner now forces recruit before mandatory combat. | **APPROVED.** Pivot, not walls, rejects the straight history and the copy matches the fight order. |
| 10 | APPROVED | None. | **APPROVED.** Four alternating local obligations form the first marker synthesis. |
| 11 | APPROVED | None. | **APPROVED.** One shielded battle visibly preserves the company for the second. |
| 12 | CHANGES REQUIRED | Equalized pre-branch strength and rebuilt the lanes as `g→o` versus `o→g`. | **APPROVED.** Automatic single-use protection is now the only branch difference. |
| 13 | APPROVED | None. | **APPROVED.** The recruit choice isolates “protection is not strength.” |
| 14 | APPROVED | None. | **APPROVED.** Builder/river duty visibly leaves Aegis untouched for combat. |
| 15 | APPROVED | None. | **APPROVED.** Fatigue, recovery, and late protection form one readable peak ledger. |
| 16 | APPROVED | None. | **APPROVED.** One spatial fact and one state fact make a substantive pairwise breather. |
| 17 | CHANGES REQUIRED | Replaced the repeated fixed-entry T with two real Pivot approaches and matching combat orders. | **APPROVED.** Approach selection now decides `o[A]→g→g` versus the failing `g[A]→o→g` history. |
| 18 | CHANGES REQUIRED | Removed a decorative mage and rebuilt both marker approaches around builder/river access. | **APPROVED.** Stride rejects a turning shortcut while Pivot rejects direct continuation; both earn the noncombat Twist. |
| 19 | CHANGES REQUIRED twice | Revision 2 replaced forced markers and the duplicate mask. The fresh audit then found a winning route that shielded a goblin and skipped the orc; revision 3 vertically separated both fight lanes from the straight Pivot corridor and added regressions for the former bypass and `g[A]→o` failure. | **APPROVED.** Current reference is `o[A]→g→g`; the cheap-first lane now reaches the final watch with no reserve, and the former bypass hits wilds. |
| 20 | CHANGES REQUIRED | Rebuilt the open field so wrong Stride and wrong Pivot histories spend Aegis on different early patrols. | **APPROVED.** Both geometry decisions preserve Aegis for `o[A]→g`, earning the complexity-5 synthesis. |
| 21 | CHANGES REQUIRED twice | Revision 2 replaced a rule-restating tip. The fresh audit then found `RRRRDDD`, which won after Stride while skipping Pivot; revision 3 rebuilt the breather as the compact forced route `RRRRRDRD` and locked the former shortcut. | **APPROVED.** The current eight-move route emits Stride, Pivot, then goal without adding state load. |
| 22 | CHANGES REQUIRED | Rebuilt the forced corridor as a wrong-side Stride approach that cannot turn into the Aegis lane. | **APPROVED.** The marker now causes the compact recruit/Aegis detour. |
| 23 | CHANGES REQUIRED | Rebuilt the route so Pivot's correct corner loops into Stride from the only useful side; rewrote the tip. | **APPROVED.** Pivot feeds Stride instead of merely preceding it, with a simple downstream shield purpose. |
| 24 | CHANGES REQUIRED | Replaced L19's duplicate mask with a full-muster Stride inversion, ogre-tier Pivot decision, and builder/river tail. | **APPROVED.** Strength, protection, geometry, and bridge order form one linked but focused chain. |
| 25 | CHANGES REQUIRED | Replaced L20's optional-small-fight structure with a coupled Stride-to-Pivot approach and mandatory `t[A]→g→g→g→river` watch. | **APPROVED.** Both route rules causally place the single protection on the decisive ogre, earning the finale thesis. |

## Fresh integrated audit — revision 1

After every assigned range and the mechanic slice had approval, `final_campaign_audit` read the current files rather than the earlier handoffs. Its verdict was **CHANGES REQUIRED** despite all automated suites being green:

1. Level 19 admitted `RDDRRRRRRRDRURRURDRR`, which protected a goblin, skipped the orc, and still won. This contradicted the approved combat-order thesis.
2. Level 21 admitted `RRRRDDD`, which resolved Stride but reached the banner without Pivot. This contradicted the two-marker recall claim.

The Lead rebuilt only those two maps, added named production-trace regressions for the historical routes and the current cheap-first Level 19 lane, updated the measured report, and returned both levels to their independent range reviewer.

Revision 2 received **APPROVED** from both the assigned range reviewer and the fresh integrated reviewer. The former Level 19 bypass now hits wilds, its cheap-first branch fails after `g[A]→o`, and the winning reference exercises `Stride→Aegis→Pivot→o[A]→g→g`. The former Level 21 shortcut now hits wilds, and its winning reference resolves both markers. The fresh reviewer independently recomputed the final report totals and reran the focused and full 74-level suites without editing files.

## Cross-range conclusions

- L19 and L24 now share only deliberate recall of protecting the stronger fight: L19 is a compact two-soldier geometry branch; L24 adds a reverse-Stride full muster, an ogre-strength requirement, and bridge consequence.
- L20 and L25 are materially distinct: L20 contains two independent early shield-spend traps; L25 couples Stride into Pivot approach and makes every correct-route battle mandatory.
- Every non-breather marker in Levels 18–25 rejects an otherwise-winning relaxed-marker history; L21 is the explicit state-free demonstration exception.
- Removing Aegis from an applicable reference makes its downstream route fail.
- Alternative winning geometry remained legal throughout review and was never used as a rejection count.

## Human-calibration scope

Browser QA verified interaction and presentation, but no fresh player attempted the campaign without prior design knowledge. Teaching comprehension, hint use, perceived difficulty, and fatigue across peaks remain calibration risks recorded in `PACK6_LEVEL_REPORT.md`.
