# Flow Commander codebase assessment

Date: 2026-07-18
Baseline: `main` at `1a8419c` (`Add freeform controls and level workshop`)

This assessment records the game as it existed before the planning/execution refactor. The worktree was clean and `npm test` passed before implementation began.

## Architecture

The project is a dependency-free browser game. `index.html` owns the document structure, `styles.css` owns the complete visual system, and the JavaScript is split into three main layers:

- `js/engine.js` is the pure rules and search layer. It defines tiles, parses level data, reduces one tile transition, simulates complete paths, and searches for winning routes.
- `js/game.js` is the browser session controller and renderer. It owns input, current routes, DOM rendering, synthesized audio, local progress, hints, and victory.
- `js/levels.js` and `js/packs/*.js` contain authored campaign data. `js/designer.js` provides the browser-saved level workshop.

This separation is a strong basis for the requested work: gameplay, hints, tests, and the solver already share `advanceState`. Planning and execution should compile and consume a trace from that same reducer instead of reproducing rules in the animation layer.

## Party state and mechanics

`createPartyState` creates the complete mechanical state:

- ready and tired soldiers
- mages, builders, and healers
- persistent Sun/Moon switches
- relief deliveries
- convoy beacons
- movement spent and bonus movement
- a cumulative event ledger

Current tile rules are:

| Codes | Rule |
| --- | --- |
| `#`, `.` | Wilds are impassable; meadow is a no-op. |
| `S`, `G` | Single-route start and final banner. |
| `r`, `R` | Recruit one or two ready soldiers. |
| `g`, `o`, `t` | Require and exhaust one, two, or three ready soldiers. |
| `m`, `d` | Recruit a mage; a dragon consumes one mage. |
| `b`, `~` | Recruit a builder; a river crossing consumes one builder. |
| `f` | Recruit a healer and immediately restore all tired soldiers to ready. |
| `y`, `Y`, `q`, `Q` | Sun/Moon switches persist; matching gates require their switch. |
| `h`, `H` | Non-walkable relief targets needing one or two adjacent route deliveries. |
| `A/X`, `B/Z`, `C/V` | Three convoy commanders and their matching standards. |
| `*` | A convoy beacon, shared across completed routes. |
| `w`, `c` | Deep mud costs two movement; supplies add two bonus movement. |
| `>`, `<`, `^`, `v` | The next step must follow the displayed direction. |

Soldiers spent in combat become tired rather than disappearing. Specialists are consumed by their matching obstacle. Extra resources at the goal are allowed.

## Path validation and win rules

`simulatePath` requires a route to begin at the active commander, remain orthogonally adjacent, never revisit a tile, obey marching arrows, satisfy every resource/gate requirement in route order, and stop when it reaches its goal. The browser treats dragging onto an earlier route tile as rewind rather than a crossing.

Mode-specific rules are:

- Campaign: reach `G` after all encountered transitions validate.
- Relief: satisfy every adjacent-delivery target before `G` and remain within `maxMoves`.
- Convoy: every commander reaches the matching standard within their own budget; routes and saved drafts cannot overlap or use another commander's start/goal; all beacons must be covered across the route set.

The pure convoy solver models occupied/reserved geometry independently, while some equivalent checks still live in `game.js`. A plan-level convoy compiler should centralize this invariant before execution replay.

## Level format and campaign loading

Authored levels are JavaScript objects. Common fields are `id`, `name`, numeric `difficulty`, `mechanic`, `briefing`, `tip`, `mode`, and a rectangular string-array `map`. Relief levels add `maxMoves`. Convoy levels add `commanders`, each with an ID, name, start/goal tile codes, movement budget, and optional initial resources.

`parseLevel` validates rectangular geometry, known tile symbols, required starts/goals, relief budgets, and convoy commander presence, then derives rows, dimensions, coordinates, targets, and beacons. Unknown metadata is preserved, so campaign-specific `complexity`, `requiredMechanics`, and intended-solution fields can be added without changing the loader.

Four packs currently contain 24 levels:

| Pack | Mode | Count | Authored difficulty |
| --- | --- | ---: | ---: |
| The Green March | campaign | 10 | 1–10 |
| Relief Routes | relief | 6 | 2.5–10 |
| The Three Banners | convoy | 5 | 3–10 |
| The Second Wind | campaign | 3 | 8–10 |

The UI iterates `PACKS`, so a fifth static pack will automatically appear in navigation. Rules copy and music themes contain a few pack-index/pack-ID special cases that need deliberate extension.

## Current planning, animation, and audio behavior

There is currently no separate plan. `session.path` is active geometry and `session.party` is its simulated result, but `attemptAdjacent` immediately combines validation, state mutation, DOM changes, sound, route commitment, and victory.

The single party token moves to `session.path.at(-1)` and renders the simulated followers. `renderPath` applies `.cell--visited` to route geometry. CSS interprets that class as final resolution: pickups and enemies disappear, bridges rise, gates collapse, and healer auras stop. Relief hunger pips and convoy beacons also update directly from simulated state. Rewind recomputes mechanics correctly, but it rewinds an already animated visible board.

Audio is generated in `Soundboard` with the Web Audio API. Four short synthesized music themes loop locally. Existing cues cover step, undo, each current recruit/obstacle family, delivery, beacon, mud, supply, current, switch/gate, blocked input, and victory. Event cues play during route drawing because `attemptAdjacent` calls `audioCue` immediately. There are no stored sound files in `assets/audio` and the credits explicitly describe all sound as synthesized.

Existing animation primitives include party step/win motion, follower bobbing, pickup disappearance, enemy/dragon idle motion, bridge construction, switch/gate state, healer aura, fed-monster dance, beacon flare, roster bump, invalid shake, route-head pulse, confetti, and the victory dialog. They are useful building blocks, but planned geometry and resolved execution need distinct classes.

## Automated tools and baseline

`npm test` runs `tests/validate-levels.mjs`. It finds at least one winning witness for every level, replays that witness through production rules, checks convoy non-crossing and beacons, checks required pack mechanics, proves healer necessity for Pack 4, checks one reversed convoy order, and verifies workshop exports. Alternative winning routes are allowed and are not counted.

The analyzer reports expanded nodes, dead ends, branch nodes, pruning, maximum depth/branching, solution length, turns, search ratio, and a heuristic complexity score. `tests/curate-relief.mjs` is a deterministic terrain-variant curator, but is not part of `npm test`.

Current test limitations:

- No DOM, input, animation, or audio tests exist.
- Pack counts are hard-coded as `[10, 6, 5, 3]`.
- Most packs retain nondecreasing authored difficulty, while Pack 5 has explicit sawtooth-curve assertions. First-witness search metrics are diagnostic only and do not gate the authored difficulty order.
- The parser does not fully validate metadata types, contiguous IDs, declared mechanic use, or pack schema.
- The DFS reports the first deterministic winning witness it encounters. It intentionally does not find a shortest route, count alternatives, or treat the first witness as the only valid solution.

## Correctness issues to resolve before replay

1. `enterTile` returns the last cumulative event even when the current tile emits nothing. A meadow after a recruit can therefore repeat the recruit's status and sound. Transitions need an explicit list of newly emitted events.
2. One relief step can both resolve its tile and feed adjacent monsters. The state ledger retains both events, but `advanceState` exposes only one. An execution trace must retain every event in step order.
3. Planned route geometry currently drives final visual state through `.cell--visited`; planned, previewed, and resolved cells need separate representations.
4. The only commander token is already the preview token. Planning needs a stationary real commander and a distinct ghost with simulated followers.
5. Convoy overlap/reservation and aggregate-beacon validation are split between UI and solver implementations.
6. Async execution needs cancellation when reset, level/pack navigation, replay, or workshop return occurs.

## Refactor direction

Add a pure route trace compiler in `engine.js` that returns initial/final state and immutable per-step snapshots with all newly emitted events. `simulatePath` and execution should use that compiler. Planning may validate candidate geometry by compiling it, while execution consumes the already validated trace and performs presentation only.

Browser state should explicitly distinguish `planning`, `ready`, `executing`, and `won`. Convoy routes can retain their saved/draft model, but remain plans until the complete route set is approved. The Solve Puzzle control should appear only in `ready`, execution should reset visual resolution state, replay all routes with adaptive short timing, and only then persist completion and show victory.
