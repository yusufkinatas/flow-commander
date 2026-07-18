# Pack 5 mechanic roster

Date: 2026-07-18

This roster evaluates candidate mechanics against Flow Commander's core promise: draw one inspectable route, manage a small deterministic party, and discover one true ordering. Scores use a 1–5 scale, where higher is better.

## Evaluation criteria

- **Fit:** creates route-order dependencies using the existing party and simple-path grammar.
- **Novelty:** asks a meaningfully new question rather than renaming an existing dependency.
- **Clarity:** can be understood from its tile, preview state, and a short rule sentence.
- **Engineering:** can share the production reducer, exhaustive solver, designer, and execution replay without a risky subsystem. A high score means low integration risk.

The selection prioritizes fit and clarity, then novelty and engineering. A mechanic is rejected even with a strong total if it compromises preview fidelity, duplicates an existing rule, or expands the game into a different puzzle genre.

## Candidate matrix

| Candidate | Fit | Novelty | Clarity | Engineering | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| **Formation Checkpoint** | 5 | 4 | 5 | 5 | **Selected.** Exact counts turn the familiar army resource into both an asset and a constraint. |
| Rally Drum | 5 | 4 | 4 | 4 | Top three; reject because swapping ready and tired soldiers trespasses on the Healer's restoration space. |
| Paired Waystones | 4 | 5 | 4 | 2 | Top three; reject because warping breaks the board's visible-adjacency contract and adds topology/UI risk. |
| Patrol Gate | 3 | 5 | 2 | 5 | Reject: odd/even move checks hide arithmetic in an otherwise spatial, inventory-readable puzzle. |
| Arcane Academy | 5 | 3 | 4 | 4 | Reject: converting a soldier into a mage compresses the existing recruit-then-specialist grammar instead of opening a new one. |
| Formation Shrine | 4 | 2 | 4 | 3 | Reject: a stance toggle controlling hazards is too close to the existing Sun/Moon switch-and-gate relationship. |
| Clockwork Turnstile | 4 | 4 | 3 | 3 | Reject: a forced clockwise exit makes incoming heading a new hidden state and complicates drag correction. |
| Ice Road | 3 | 3 | 4 | 3 | Reject: forced straight travel is familiar and risks planning/execution divergence during automatic movement. |
| One-way Ledge | 4 | 2 | 5 | 4 | Reject: it is effectively the inverse of the marching-arrow rule already used by Three Banners. |
| Rescue Cage | 4 | 2 | 4 | 4 | Reject: recruiting from an adjacent tile repeats Relief Routes' adjacency-delivery insight. |
| Scout Grapple | 4 | 4 | 4 | 2 | Reject: jumping wilds breaks route adjacency, pointer interpolation, and the board's continuous-path language. |
| Garrison Posts | 5 | 4 | 2 | 3 | Reject: banking and later returning soldiers is opaque unless paired with an upper-bound obstacle—the role Formation Checkpoints fill directly. |
| Push Boulder | 4 | 5 | 4 | 1 | Reject: movable terrain creates a Sokoban subsystem and a much larger position-state search space. |
| Torch/Fog | 4 | 1 | 5 | 4 | Reject: collect a torch, then cross fog is a visual reskin of builder-before-river. |
| Campfire | 5 | 1 | 5 | 5 | Reject: restoring one tired soldier is simply a weaker version of the established Healer. |
| Crumbling Ground | 3 | 3 | 5 | 5 | Reject: because campaign routes cannot revisit tiles, a tile that fails on a second visit is mechanically inert. |

## Top three

1. **Formation Checkpoint** is the strongest extension because it creates an upper-bound constraint with no extra inventory. Existing recruits, battles, and healing all gain new ordering consequences.
2. **Rally Drum** also works with the ready/tired split, but it muddies the Healer's recently taught identity and makes restoration direction harder to communicate.
3. **Paired Waystones** offer the most spatial novelty, but their discontinuous route would require special pointer, route-line, keyboard, accessibility, and solver presentation rules.

Formation Checkpoints win because their new idea is conceptual rather than systemic: “more soldiers is not always better.” They preserve orthogonal drawing, deterministic replay, state visibility, and the same exact solver while making nearly every campaign resource newly relevant.

## Selected rule: Formation Checkpoints

Formation Checkpoints are numbered **1**, **2**, or **3**. The commander may enter one only while the party has **exactly** that many ready soldiers.

- Ready soldiers count; tired soldiers, mages, builders, and healers do not.
- Passing a checkpoint consumes nothing and changes no party stat.
- Both under-strength and over-strength entry fail. The message reports the required and actual ready-soldier counts.
- Planning checks the rule immediately and shows the numbered checkpoint as open on a valid planned route.
- Execution visibly inspects the formation, opens the checkpoint, and then advances. It reuses the same reducer result as planning, so execution cannot reveal a new outcome.
- The symbols `1`, `2`, and `3` encode the three thresholds in authored maps; the visible tile retains the numeral and a distinct checkpoint silhouette so meaning never relies on color alone.

## Design affordances

The rule adds an upper bound to a game that previously rewarded accumulating resources. This produces readable dependencies without adding randomness or timing:

- **Recruit then check:** choose which recruit can be collected before an exact threshold.
- **Fight then check:** spend ready soldiers in combat to lower the formation to the required size.
- **Check then recruit:** delay a useful recruit because taking it early would overfill the formation.
- **Fight, heal, check:** a Healer can deliberately raise the ready count by restoring tired soldiers, so healing may need to occur before or after a checkpoint.
- **Checkpoint sequence:** two different numbers constrain the resources that may occur between them.
- **Specialist decoy:** builders and mages remain available without affecting the count, supporting clear mixed-mechanic routes.

Each checkpoint exposes the count the player already sees in the party readout. Failed experiments remain reversible in Planning, and the unique intended route can be proved with the existing exhaustive search.

## Implementation implications

- **Engine and solver:** register three walkable tile codes and reject entry unless `state.soldiers === required`; emit a formation event on success. No new state dimension is required, so solver states and route enumeration remain unchanged.
- **Planning and execution:** surface required/actual failure text, mark valid planned checkpoints, add a short inspection/open beat, and map the event to a distinct audiovisual cue.
- **Board and accessibility:** render a strong arch/checkpoint silhouette with a permanent numeral, full accessible label, non-color open state, and rules/legend copy.
- **Level designer:** add three brushes with threshold-specific names and glyphs. Exported static maps continue to use one character per tile.
- **Validation:** test under-, exact-, and over-strength entry; reducer/trace parity; intended-route replay; exact uniqueness; threshold coverage; and meaningful use rather than decorative placement.

## Rejection record

- **Rally Drum:** overlaps the Healer and weakens the ready/tired model's thematic clarity.
- **Paired Waystones:** requires discontinuous routing and additional UI/topology semantics.
- **Patrol Gate:** substitutes hidden parity bookkeeping for visible party reasoning.
- **Arcane Academy:** recombines existing soldier and mage dependencies without enough new decision space.
- **Formation Shrine:** repeats switch/gate state under a stance name.
- **Clockwork Turnstile:** introduces heading state that is easy to miss when backtracking a plan.
- **Ice Road:** repeats a common sliding constraint and complicates direct plan control.
- **One-way Ledge:** is too close to an existing directional-arrow mechanic.
- **Rescue Cage:** repeats an existing adjacent-service mechanic.
- **Scout Grapple:** breaks the game's orthogonally connected route contract.
- **Garrison Posts:** requires extra banked-count state and is difficult to read without the selected mechanic.
- **Push Boulder:** expands scope into object-position planning and state-heavy Sokoban search.
- **Torch/Fog:** is builder/river with different nouns.
- **Campfire:** is a strictly weaker Healer.
- **Crumbling Ground:** has no consequence under the no-revisit route rule.
