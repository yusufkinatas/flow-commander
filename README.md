# Flow Commander

A complete, dependency-free browser puzzle game about drawing routes and assembling the right tiny company. The campaign contains 74 handcrafted puzzles across six distinct level packs.

## Play

From this folder, start any static file server:

```sh
python3 -m http.server 4174
```

Then open `http://127.0.0.1:4174`.

Controls:

- Mouse, touch, or pen: press the active commander and drag through adjacent tiles to build a plan.
- Tap/click an adjacent tile to extend the route one step at a time.
- Drag back one tile or use **Undo** to retract.
- Keyboard: arrow keys move, Backspace undoes, `R` resets, and `H` gives a nudge.
- When a complete plan reaches the objective, review it and press **Solve Puzzle** to watch the real company execute it.

## Level packs

- **The Green March — 10 levels.** Recruit soldiers, builders, and mages; resolve goblins, real river crossings, dragons, switches, and gates in route order.
- **Relief Routes — 6 levels.** Feed every peaceful monster from a neighboring route tile while staying inside a strict movement budget. One tile can serve several monsters, so spatial coverage matters more than choosing a fork.
- **The Three Banners — 5 levels.** Command Alder, Bramble, and Cinder in order. Their trails lock behind them and cannot cross; later maps add beacons, mud, supply caches, and one-way marching arrows.
- **The Second Wind — 3 levels.** Return to the lone original commander with no army, gather units en route, and use one new Healer recruit to restore tired soldiers at exactly the right moment.
- **The Exacting Muster — 25 levels.** Learn the campaign from first principles, then master Formation Checkpoints that admit exactly one, two, or three ready soldiers. Recruits, combat, specialists, seals, and healing gain new order-sensitive consequences across a research-backed sawtooth curve.
- **The Grand Maneuver — 25 levels.** Learn Stride Markers, Pivot Markers, and stackable Aegis protection in three staged arcs, then combine route geometry with combat order and familiar specialist duties. This pack deliberately excludes every Formation Checkpoint / Exact Number tile.

Each pack builds toward a deliberately interlocked finale, while progress is stored separately per pack.

## Validate levels

```sh
npm test
```

The validator uses the same transition engine as gameplay. It fails if it cannot find at least one complete winning route within the safety limit; it stops at the first winning witness and never rejects a level for having alternatives. The witness is replayed in execution order with the same immutable trace used by Planning. Pack 4 additionally proves that every healer restores tired soldiers between two separate combat costs. Pack 5 checks checkpoint behavior, reference routes, deterministic replay, and its authored curve. Pack 6 checks departure geometry in every rotation, Aegis strength/stacking semantics, staged UI disclosure, editor preservation, all 25 reference routes, its authored sawtooth, and the complete absence of the Exact Number family. `tests/curate-relief.mjs` remains available as a deterministic mixed-authorship tool: it explores terrain variants, rejects only unsolvable maps, and ranks solvable survivors without requiring corridor-like uniqueness.

Pack 5 and Pack 6 each keep their design basis, mechanic roster, frozen campaign specification, independent reviewer record, and solver report in `docs/`. The in-game Level Designer exposes Stride, Pivot, and Aegis brushes alongside the legacy brush set.

## Art and sound

All art is downloaded into `assets/vendor` and works offline. It is licensed under CC0 1.0:

- [Tiny Dungeon](https://kenney.nl/assets/tiny-dungeon), [Tiny Town](https://kenney.nl/assets/tiny-town), [Tiny Farm](https://kenney.nl/assets/tiny-farm), and [Tiny Battle](https://kenney.nl/assets/tiny-battle) by Kenney.
- [Tiny Creatures](https://opengameart.org/content/tiny-creatures) by Clint Bellanger.

Execution foley comes from Kenney's [RPG Audio](https://kenney.nl/assets/rpg-audio) pack by Kenney Vleugels, also licensed CC0 1.0. The exact local files and cue mappings are recorded in [`assets/audio/README.md`](assets/audio/README.md). Attribution is not required by these licenses, but is included in the game and here as a courtesy.

Pack-specific chiptune music, the commander's wordless vocal cue, and tonal sound accents are synthesized locally with the Web Audio API. All sampled foley is stored in the repository, so the game has no remote runtime dependencies.
