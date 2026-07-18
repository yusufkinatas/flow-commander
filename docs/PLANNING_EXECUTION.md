# Planning and execution architecture

## Phase model

The browser controller now separates four player-visible phases:

1. **Planning** — input extends or rewinds route geometry. Every candidate is compiled by `tracePath`; the real commander remains at the start, a translucent ghost shows the planned head and simulated followers, and the roster is explicitly labelled as a preview.
2. **Ready** — derived only when the compiled route (or complete convoy route set) wins. The route remains rewindable and the prominent **Solve Puzzle** button is visible. Nothing executes automatically.
3. **Executing** — the frozen compiled traces are replayed in route and event order. Planning, navigation, workshop, and reset controls are disabled. The visual board starts pristine, then resolved cells, party state, animations, and sounds advance through the trace.
4. **Won** — completion is persisted and the existing victory flow opens only after replay reaches the final trace step.

Resetting or loading another level increments an execution run ID. Every asynchronous replay wait checks that ID, preventing a stale movie from mutating a new level.

## Single mechanical authority

`tracePath(level, path, options)` is the shared plan compiler. It returns validation, initial/final party state, win state, and a snapshot for every accepted tile:

```js
{
  index,
  position,
  tile,
  before,
  after,
  events,
}
```

`simulatePath` delegates to `tracePath`, the solver still reduces candidates with `advanceState`, planning validates every extension with `tracePath`, and execution consumes the frozen trace without recalculating combat or resource rules. Event arrays contain only events created by that step and retain simultaneous tile-plus-relief-delivery events in order.

## Visual separation

- `.cell--planned` and the SVG route communicate geometry only.
- Preview-only classes (`is-planned-fed`, `is-planned-lit`, `is-planned-open`, and `is-planned-bridge`) use translucent/dashed styling.
- `.cell--resolved` is applied only after the corresponding execution step and is the sole trigger for removing entities, finishing bridges, and opening gates.
- `#partyToken` is the real company; `#planningGhost` is the planned company.
- Execution-only transient classes and `#executionFxLayer` provide unit pickups, attacks, differentiated deaths, fireball, bridge, healing, and completion effects.

## Audio palette

All stored foley comes from Kenney's **RPG Audio** collection by Kenney Vleugels, licensed CC0 1.0. The local selection, archive provenance, exact files, and cue mapping are recorded in `assets/audio/README.md`; the original license is retained beside the audio files.

Planning emits only the route-draw cue and invalid-route cue. Execution adds varied footsteps, distinct pickups, soldier attack layers, different goblin/orc/ogre death layers, mage/fireball feedback, bridge construction, healing, gates, and completion. Music, tonal accents, and the commander's short wordless “mip-mup” cue remain synthesized locally with Web Audio.

## Verification

- `tests/validate-flow.mjs` replays all 33 solver routes across the original 24 levels and proves trace/simulation/reducer state and event parity.
- Regression cases cover resource-dependent later moves, no-op tiles not repeating old events, simultaneous relief events, and immutable trace snapshots.
- Automated local-browser checks covered:
  - stationary real commander and moving ghost;
  - no resolved cells or hidden entities while planning;
  - Solve button hidden until a winning plan;
  - rewind removing ready state;
  - execution input locking and pristine-board reset;
  - recruit/combat, bridge construction, and two-route convoy playback;
  - exact final resolved geometry, party goal position, and victory state;
  - no browser console errors.
