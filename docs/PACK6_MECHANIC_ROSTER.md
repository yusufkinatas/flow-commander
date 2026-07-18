# Pack 6 mechanic roster

Date: 2026-07-18

This roster evaluates candidates against Flow Commander's core promise: draw an inspectable simple route, manage a visible deterministic company, and reason about order. Scores use 1–5, where a high Engineering score means lower integration risk. Equality checks on inventory are vetoed regardless of score because Pack 6 may never use or reskin the Exact Number mechanic.

## Candidate matrix

| Candidate | Fit | Novelty | Clarity | Engineering | Decision |
|---|---:|---:|---:|---:|---|
| **Stride Marker** | 5 | 5 | 5 | 4 | **Selected.** Continue through the marker in the same direction; this creates a local, rotation-symmetric route constraint. |
| **Pivot Marker** | 5 | 5 | 5 | 4 | **Selected.** Make a right-angle turn on the marker; it complements Stride without adding persistent hidden state. |
| **Aegis Bearer** | 5 | 4 | 5 | 4 | **Selected.** A visible consumable preserves the ready line during the next otherwise-legal battle and creates new fight-order decisions. |
| Momentum Gate | 4 | 4 | 3 | 4 | Rejected: combat-then-gate is a switch/gate dependency with a new trigger. |
| Rally Drum | 4 | 3 | 4 | 3 | Rejected: swapping or restoring ready/tired soldiers muddies the Healer's established role. |
| Arcane Academy | 4 | 3 | 4 | 4 | Rejected: soldier-to-mage conversion compresses the existing recruit-then-dragon chain rather than creating a new route question. |
| Paired Waystones | 3 | 5 | 4 | 2 | Rejected: teleportation breaks visible adjacency and needs special pointer, route-line, keyboard, and replay rules. |
| One-way Ledge | 4 | 2 | 5 | 4 | Rejected: it duplicates the existing marching-arrow exit rule. |
| Crumbling Ground | 2 | 2 | 5 | 5 | Rejected: second-entry failure is inert because routes already forbid revisits. |
| Scout Grapple | 3 | 4 | 3 | 2 | Rejected: jumping wilds breaks orthogonal continuity and pointer interpolation. |
| Torch and Fog | 4 | 1 | 5 | 5 | Rejected: collect a torch then cross fog is builder/river with different nouns. |
| Rescue Cage | 3 | 2 | 4 | 4 | Rejected: adjacent rescue repeats Relief Routes' service-from-beside insight. |
| Patrol Parity | 3 | 4 | 2 | 4 | Rejected: odd/even step bookkeeping hides arithmetic in an otherwise inspectable spatial puzzle. |
| Push Boulder | 3 | 5 | 4 | 1 | Rejected: movable terrain creates a Sokoban subsystem and a much larger search state. |
| Timed Fuse | 2 | 4 | 2 | 2 | Rejected: real-time or step-time pressure conflicts with untimed, rewindable planning. |
| Garrison Post | 4 | 4 | 2 | 3 | Rejected: banking soldiers adds opaque inventory state and tends to rely on a forbidden count gate to become legible. |
| Fresh-Line Gate | 4 | 3 | 4 | 5 | Rejected: admitting only a company with no tired soldiers is an equality-gate reskin of the forbidden mechanic. |
| Veteran Gate | 4 | 3 | 4 | 5 | Rejected: checking for a tired soldier is another passive admission tile and overlaps the selected Aegis/combat space. |
| Campfire | 4 | 1 | 5 | 5 | Rejected: restoring tired soldiers is a weaker Healer. |
| Shielded Road | 4 | 3 | 4 | 4 | Rejected: protection tied to one terrain square is less readable and less order-rich than a visible Aegis carried to a chosen battle. |

## Finalist comparison

Stride and Pivot change the question from “what inventory do I have?” to “how must this route pass through this point?” Both rules are local: only the edge entering the marker and the edge leaving it matter. Their glyphs are rotation-independent, so they avoid the persistent hidden heading rejected for a directional turnstile.

Aegis supplies a separate state-order layer. It does not open a matching obstacle, restore fatigue, or inspect a count. Instead, it preserves resources at one automatically selected future fight, making otherwise familiar combat sequences read differently.

The set is coherent because the markers determine **where and how** the route can bend, while Aegis determines **which legal battle** preserves the company. The order is frozen as Stride → Pivot → Aegis. Stride and Pivot combine only after Pivot's introduction; Aegis combines with markers only after its own introduction.

## Selected rule: Stride Marker

Rule sentence: After entering a Stride Marker, the next route edge must continue in the same cardinal direction as the entering edge.

- Symbol / event: `i` / `stride`.
- Counts, consumes, changes: nothing in the party.
- Valid behavior: entry is provisionally allowed from any side; a straight departure emits one fresh `stride` event at the marker position in the compiled trace.
- Invalid behavior: attempting a right-angle turn from the marker fails immediately in Planning with a straight-ahead explanation.
- Exclusions: it does not force automatic movement, prescribe a global orientation, or retain heading after the player leaves.
- Planning preview: a route ending on the marker is visibly pending; invalid exits are rejected before they join the route.
- Execution: the frozen trace presents the departure event at the marker; it does not recalculate geometry.
- Accessibility: label “Stride Marker · continue straight through”; a paired straight-line silhouette carries meaning without color.
- Solver impact: no new party-state dimension; route search consults the immediately previous path cell when leaving the marker.

Design affordances:

- Approach a shared cell from the side that leaves the useful straight exit.
- Preserve a straight segment while deciding where to recruit or fight before it.
- Chain differently oriented markers without arrows or automatic movement.

## Selected rule: Pivot Marker

Rule sentence: After entering a Pivot Marker, the next route edge must form a right angle with the entering edge.

- Symbol / event: `p` / `pivot`.
- Counts, consumes, changes: nothing in the party.
- Valid behavior: entry is provisionally allowed; either left or right departure is legal and emits one fresh `pivot` event at the marker position.
- Invalid behavior: attempting to continue straight fails immediately in Planning with a turn explanation; reversing remains forbidden by the base no-revisit rule.
- Exclusions: it does not force a compass direction or remember heading beyond the marker.
- Planning preview: a route ending on the marker is visibly pending; the player chooses either valid corner.
- Execution: the frozen trace presents the departure event at the marker from the already-approved geometry.
- Accessibility: label “Pivot Marker · make a right-angle turn”; a bent-track silhouette carries meaning without color.
- Solver impact: no new party-state dimension; route search compares the incoming and outgoing unit vectors locally.

Design affordances:

- Turn away from a tempting straight corridor.
- Choose which side of the marker to enter so a later resource remains reachable.
- Alternate Pivot and Stride markers to create readable cadence puzzles.

## Selected rule: Aegis Bearer

Rule sentence: An Aegis Bearer adds one Aegis; the next soldier battle the ready line is already strong enough to win consumes one Aegis and tires no soldiers.

- Symbol / event: `a` / `aegis`; protected combat remains a `goblin` event with `protected: true` and `aegisUsed: 1`.
- Counts / consumes / changes: the pickup adds one visible Aegis. A protected `g`, `o`, or `t` battle consumes one Aegis while preserving ready and tired soldier counts.
- Does not affect: mage/dragon, builder/river, switches/gates, healers, markers, movement, or Formation Checkpoints.
- Under-strength behavior: the battle fails before protection is consumed; an Aegis is defense, not extra strength.
- Unprotected behavior: with no Aegis, legacy combat tires the normal soldier cost.
- Planning preview: the Company HUD shows the preview Aegis count and protected combat callout.
- Execution: pickup and shield-impact effects consume the same frozen event/state snapshots as Planning.
- Accessibility: label “Aegis Bearer · protects one battle”; shield silhouette, text, and counter do not rely on color or sound.
- Solver-state impact: add one non-negative `aegis` counter to party state; existing first-witness DFS already carries complete party snapshots.

Design affordances:

- Decide which of several fights should automatically spend the protection.
- Carry an Aegis through specialists and markers without consuming it.
- Preserve soldiers for a later unprotected battle.
- Discover that an Aegis cannot compensate for arriving under-strength.

## Frozen rejection boundary

Pack 6 may not use `1`, `2`, or `3` tiles, `formation` events or metadata, `F1`/`F2`/`F3`, equality-based inventory gates, or a renamed inspection/audit mechanic. Pack 5 and its editor brushes remain intact for backward compatibility.
