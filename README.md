# Flow Commander

A complete, dependency-free browser puzzle game about drawing exact routes and assembling the right tiny company. The campaign contains 24 handcrafted puzzles across four distinct level packs.

## Play

From this folder, start any static file server:

```sh
python3 -m http.server 4174
```

Then open `http://127.0.0.1:4174`.

Controls:

- Mouse, touch, or pen: press the active commander and drag through adjacent tiles.
- Tap/click an adjacent tile to extend the route one step at a time.
- Drag back one tile or use **Undo** to retract.
- Keyboard: arrow keys move, Backspace undoes, `R` resets, and `H` gives a nudge.

## Level packs

- **The Green March — 10 levels.** Recruit soldiers, builders, and mages; resolve goblins, real river crossings, dragons, switches, and gates in route order.
- **Relief Routes — 6 levels.** Feed every peaceful monster from a neighboring route tile while staying inside a strict movement budget. One tile can serve several monsters, so spatial coverage matters more than choosing a fork.
- **The Three Banners — 5 levels.** Command Alder, Bramble, and Cinder in order. Their trails lock behind them and cannot cross; later maps add beacons, mud, supply caches, and one-way marching arrows.
- **The Second Wind — 3 levels.** Return to the lone original commander with no army, gather units en route, and use one new Healer recruit to restore tired soldiers at exactly the right moment.

Each pack builds toward a deliberately interlocked finale, while progress is stored separately per pack.

## Validate levels

```sh
npm test
```

The exhaustive search validator uses the same transition engine as gameplay. It fails unless every level has exactly one complete solution, the search finishes without hitting its safety limit, each mechanic is exercised, routes validate in play order, and the measured complexity strictly rises through Packs 2–4. Pack 4 additionally proves that every healer restores tired soldiers between two separate combat costs. `tests/curate-relief.mjs` is also included as a deterministic mixed-authorship tool: it explores terrain variants, rejects zero- and multi-solution maps, and ranks the survivors by search-tree complexity.

## Art and sound

All art is downloaded into `assets/vendor` and works offline. It is licensed under CC0 1.0:

- [Tiny Dungeon](https://kenney.nl/assets/tiny-dungeon), [Tiny Town](https://kenney.nl/assets/tiny-town), [Tiny Farm](https://kenney.nl/assets/tiny-farm), and [Tiny Battle](https://kenney.nl/assets/tiny-battle) by Kenney.
- [Tiny Creatures](https://opengameart.org/content/tiny-creatures) by Clint Bellanger.

Attribution is not required by the licenses, but is included in the game and here as a courtesy. Pack-specific chiptune music and sound effects are synthesized locally with the Web Audio API; there are no remote runtime dependencies.
