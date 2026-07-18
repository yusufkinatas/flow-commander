# Pack 6 campaign research and applied rules

Date: 2026-07-18

This note applies the project's existing puzzle-campaign research to Pack 6, **The Grand Maneuver**. It supplements, rather than replaces, `PUZZLE_CAMPAIGN_RESEARCH.md`. The production audit covered the current parser, reducer, solver, Planning/Execution flow, editor, accessibility labels, and all five shipped packs before mechanic selection.

## Existing grammar

Flow Commander's promise is to draw one inspectable orthogonal route, manage a small visible company whose state changes in route order, rewind without penalty, and execute the frozen preview without surprises. A campaign route never revisits a tile. Recruits add resources; combat and specialist obstacles spend them; healers restore tired soldiers; switches preserve access state.

Relief delivery and convoy completion are mode-specific, so their symbols cannot be treated as ordinary campaign mechanics. Formation Checkpoints are Pack 5's Exact Number mechanic and remain implemented for that shipped campaign, but every Pack 6 map, declaration, reference route, and event trace must exclude them.

## Applied findings

### Teach visible route grammar before combining inventory

The prior research favors introducing one idea, giving immediate practice, then testing a consequence. Pack 6 therefore introduces Stride Markers in Level 1, Pivot Markers in Level 6, and Aegis Bearers in Level 11. No level combines a new rule before that rule has a readable isolated example.

Inspection: the frozen mechanic matrix enforces first appearances at Levels 1, 6, and 11; the campaign validator rejects earlier appearances and checks required events on reference traces.

### Keep geometry local and reversible

Stride and Pivot rules consult only the route edge entering the marked tile and the immediately following edge. They do not teleport, slide automatically, depend on an unseen clock, or retain a hidden heading after the marker. A failed experiment occurs while Planning and can be rewound immediately.

Inspection: mechanic fixtures test every cardinal rotation, invalid continuations, deterministic trace parity, and input immutability. Board glyphs show a straight track or corner independently of color.

### Make protection alter ordering rather than replace strength

An Aegis protects a battle only after the ordinary ready-soldier requirement is satisfied. It preserves the ready line; it does not let an under-strength company defeat a stronger enemy. Because the next otherwise-legal soldier battle consumes the Aegis automatically, route order determines which fight receives it.

Inspection: boundary tests prove under-strength failure consumes no Aegis, successful protection consumes one Aegis and tires no soldiers, unprotected combat retains legacy behavior, and mage/dragon or builder/river interactions do not consume Aegis.

### Separate spatial load from party-state load

The two marker rules ask the player to read local path geometry. Aegis asks the player to track one visible consumable. Early levels never require both ledgers at once; later levels couple them deliberately. This avoids repeating Pack 5's dominant recruit/combat/count-audit structure.

Inspection: metadata records dependency depth and cognitive load separately from solver nodes. Reviewers compare neighboring decision chains, not only map silhouettes.

### Preserve a sawtooth with real recovery

The campaign uses five arcs of Introduce, Reinforce, Twist, Combine, and Synthesize. Levels 6, 11, 16, and 21 reduce both dependency depth and the number of simultaneous ledgers. Each arc ends at its local difficulty peak, and every next arc opens below that peak.

Inspection: exact difficulty/load arrays and the complexity distribution are executable assertions in `validate-pack6.mjs`.

### Keep the forbidden mechanic boundary broader than spelling

Pack 6 excludes map symbols `1`, `2`, and `3`; `formation` events or declarations; `F1`/`F2`/`F3`; equality gates on any inventory; and renamed exact-count inspections. Ordinary recruit gains and enemy costs remain legacy mechanics because they add or spend resources after an at-least strength check rather than demand equality.

Inspection: campaign validation checks maps, metadata, briefing/tip/thesis copy, and reference traces. Independent review also rejects conceptual reskins.

## Curation contract

1. Ship 25 static campaign levels with contiguous IDs and at least one production-rule winning witness each.
2. Select and implement exactly three new mechanics in this order: Stride Marker, Pivot Marker, Aegis Bearer.
3. Preserve the five-role cadence, four genuine breathers, exact authored curve, and exact complexity distribution.
4. Never place, declare, mention as a Pack 6 rule, or emit the Exact Number / Formation Checkpoint mechanic.
5. Require every featured marker and Aegis interaction on a documented winning trace; let an independent reviewer judge whether the interaction earns its place.
6. Allow any number of alternative winning routes. Stop solver acceptance at the first witness and never use route count as a quality gate.
7. Keep all state visible, all failures reversible in Planning, and execution event-for-event equal to the frozen trace.
8. Flag fresh-player comprehension and perceived difficulty as residual risks until observed playtesting occurs.

