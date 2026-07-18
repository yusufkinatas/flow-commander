import assert from "node:assert/strict";
import {
  TILE_DEFS,
  createPartyState,
  enterTile,
  parseLevel,
  pathFromDirections,
  simulatePath,
  tracePath,
} from "../js/engine.js";
import { BRUSHES, normalizeDesign } from "../js/designer.js";

for (const required of [1, 2, 3]) {
  const code = String(required);
  const tile = TILE_DEFS[code];
  const unit = required === 1 ? "soldier" : "soldiers";
  assert.deepEqual(
    tile,
    {
      type: "formation",
      walkable: true,
      required,
      label: `Formation checkpoint · exactly ${required} ready ${unit}`,
    },
    `Formation tile ${code} must publish its exact ready-soldier rule.`,
  );

  const initial = createPartyState({
    soldiers: required,
    tired: 7,
    mages: 4,
    builders: 3,
    healers: 2,
    events: [{ type: "recruit", tile: "R", position: { r: 1, c: 1 }, amount: 2 }],
  });
  const transition = enterTile(initial, code, { r: 2, c: required });
  assert.equal(transition.ok, true, `Exactly ${required} ready soldiers must pass checkpoint ${code}.`);
  assert.equal(transition.state.soldiers, required, "A formation checkpoint must not consume ready soldiers.");
  assert.equal(transition.state.tired, 7, "A formation checkpoint must not alter tired soldiers.");
  assert.equal(transition.state.mages, 4, "Specialists must not be counted or consumed by a checkpoint.");
  assert.equal(transition.state.builders, 3, "Builders must not be counted or consumed by a checkpoint.");
  assert.equal(transition.state.healers, 2, "Healers must not be counted or consumed by a checkpoint.");
  assert.deepEqual(
    transition.events,
    [{ type: "formation", tile: code, position: { r: 2, c: required }, required, actual: required }],
    "A successful checkpoint must emit one fresh event with the required and actual counts.",
  );
  assert.deepEqual(transition.event, transition.events[0], "The compatibility event must be the new checkpoint event.");
  assert.equal(transition.state.events.length, 2, "The checkpoint event must append to prior history exactly once.");
  assert.equal(transition.state.events[0].type, "recruit", "Entering a checkpoint must preserve prior history.");
  assert.deepEqual(initial.events.map((event) => event.type), ["recruit"], "Entering a checkpoint must not mutate its input state.");
}

const formationBrushes = BRUSHES.filter((brush) => ["1", "2", "3"].includes(brush.code));
assert.deepEqual(formationBrushes.map((brush) => brush.glyph), ["=1", "=2", "=3"], "The Level Designer must expose all checkpoint thresholds with explicit equality glyphs.");
const normalizedFormationDesign = normalizeDesign({
  id: "formation-workshop",
  width: 7,
  height: 4,
  map: ["#######", "#S123G#", "#.....#", "#######"],
});
assert.equal(normalizedFormationDesign.map[1], "#S123G#", "Level Designer normalization must preserve Formation Checkpoint tiles.");

const under = enterTile(
  createPartyState({ soldiers: 1, tired: 20, mages: 20, builders: 20, healers: 20 }),
  "2",
  { r: 0, c: 0 },
);
assert.equal(under.ok, false, "One ready soldier must not pass a two-soldier checkpoint.");
assert.match(under.reason, /requires exactly 2 ready soldiers/, "An under-strength failure must state the requirement.");
assert.match(under.reason, /have 1 ready soldier/, "An under-strength failure must state the actual count.");
assert.deepEqual(under.events, [], "A blocked checkpoint must emit no event.");
assert.equal(under.event, null, "A blocked checkpoint must expose no compatibility event.");

const over = enterTile(createPartyState({ soldiers: 3 }), "2", { r: 0, c: 0 });
assert.equal(over.ok, false, "Three ready soldiers must not pass a two-soldier checkpoint.");
assert.match(over.reason, /requires exactly 2 ready soldiers/, "An over-strength failure must state the requirement.");
assert.match(over.reason, /have 3 ready soldiers/, "An over-strength failure must state the actual count.");

const traceLevel = parseLevel({
  id: "formation-trace",
  mode: "campaign",
  map: [
    "######",
    "#SR2G#",
    "######",
  ],
});
const tracePathInput = pathFromDirections(traceLevel, "RRR");
const trace = tracePath(traceLevel, tracePathInput);
assert.equal(trace.ok, true, "A recruit-to-exact-checkpoint route must trace successfully.");
assert.equal(trace.won, true, "The exact-checkpoint route must reach the banner.");
assert.deepEqual(simulatePath(traceLevel, tracePathInput), trace, "Simulation must delegate to the same checkpoint trace contract.");
assert.deepEqual(
  trace.steps[2].events,
  [{ type: "formation", tile: "2", position: { r: 1, c: 3 }, required: 2, actual: 2 }],
  "The traced checkpoint step must contain only its fresh formation event.",
);
assert.equal(trace.steps[2].before.soldiers, 2, "The trace must preview the ready count before the checkpoint.");
assert.equal(trace.steps[2].after.soldiers, 2, "The trace must preserve the ready count after the checkpoint.");
assert.deepEqual(
  trace.state.events.map((event) => event.type),
  ["recruit", "formation", "goal"],
  "Checkpoint trace history must remain ordered and duplication-free.",
);

const specialistLevel = parseLevel({
  id: "formation-specialists-do-not-count",
  mode: "campaign",
  map: [
    "######",
    "#Sm1G#",
    "######",
  ],
});
const specialistTrace = tracePath(specialistLevel, pathFromDirections(specialistLevel, "RRR"));
assert.equal(specialistTrace.ok, false, "A mage without a ready soldier must not satisfy checkpoint 1.");
assert.equal(specialistTrace.blockedIndex, 2, "The specialist-only route must stop on the checkpoint.");
assert.match(specialistTrace.reason, /have 0 ready soldiers/, "The failure must report ready soldiers, not total units.");

console.log("✓ formation checkpoints enforce exact ready-soldier counts with deterministic trace parity");
