import assert from "node:assert/strict";
import { PACKS } from "../js/levels.js";
import {
  analyzeLevel,
  directionsFromPath,
  pathFromDirections,
  simulatePath,
  tracePath,
} from "../js/engine.js";

const pack = PACKS.find((candidate) => candidate.id === "grand-maneuver");
assert.ok(pack, "Pack 6 must be registered as grand-maneuver.");
assert.equal(pack.number, 6, "The Grand Maneuver must be Pack 6.");
assert.equal(pack.levels.length, 25, "Pack 6 must contain exactly 25 levels.");
assert.deepEqual(
  pack.levels.map((level) => level.id),
  Array.from({ length: 25 }, (_, index) => index + 1),
  "Pack 6 IDs must be contiguous from 1 through 25.",
);

const expectedRoles = ["Introduce", "Reinforce", "Twist", "Combine", "Synthesize"];
const expectedDifficulties = [
  1, 1.8, 2.6, 3.4, 4.4,
  2, 3.2, 4.2, 5.1, 6.2,
  3, 4.2, 5.1, 6.3, 7.5,
  4, 5.2, 6.3, 7.3, 8.5,
  5, 6.7, 7.7, 8.9, 10,
];
const expectedLoads = [
  1, 2, 2, 3, 4,
  1, 2, 3, 3, 5,
  1, 2, 3, 4, 5,
  2, 3, 4, 4, 5,
  2, 2, 3, 4, 5,
];
assert.deepEqual(pack.levels.map((level) => level.difficulty), expectedDifficulties, "Pack 6 must preserve the frozen sawtooth difficulty curve.");
assert.deepEqual(pack.levels.map((level) => level.cognitiveLoad), expectedLoads, "Pack 6 must preserve the frozen cognitive-load curve.");

const report = [];
const protectedCosts = new Set();
const strideAxes = new Set();
const pivotExits = new Set();
for (const level of pack.levels) {
  const label = `Pack 6 level ${level.id}`;
  assert.equal(level.arc, Math.ceil(level.id / 5), `${label} must use its frozen arc.`);
  assert.equal(level.role, expectedRoles[(level.id - 1) % 5], `${label} must use its frozen campaign role.`);
  assert.ok(Number.isInteger(level.dependencyDepth) && level.dependencyDepth >= 1 && level.dependencyDepth <= 6, `${label} needs a 1–6 dependency depth.`);
  assert.ok(typeof level.thesis === "string" && level.thesis.trim().length >= 30, `${label} needs a substantive thesis.`);
  assert.ok(typeof level.briefing === "string" && level.briefing.trim().length >= 30, `${label} needs a readable briefing.`);
  assert.ok(typeof level.tip === "string" && level.tip.trim().length >= 25, `${label} needs a reasoning-oriented tip.`);
  assert.match(level.tip.trim(), /\?$/, `${label}'s tip must ask a reasoning question instead of state the route.`);
  assert.ok(typeof level.referenceRoute === "string" && level.referenceRoute.length >= 1, `${label} needs a documented reference route.`);
  assert.ok(Array.isArray(level.mechanics) && level.mechanics.some((name) => ["stride", "pivot", "aegis"].includes(name)), `${label} must feature a selected Pack 6 mechanic.`);

  const mapText = level.map.join("");
  const metadataText = [level.name, level.mechanic, level.briefing, level.tip, level.thesis, ...level.mechanics].join(" ");
  assert.doesNotMatch(mapText, /[123]/, `${label} may never use Exact Number / Formation Checkpoint tiles.`);
  assert.doesNotMatch(mapText, /[hHABXZCV*wc<>^v]/, `${label} may not import Relief or Convoy tile families.`);
  assert.doesNotMatch(metadataText, /\b(?:formation|F1|F2|F3|checkpoint|exact(?:ly)?)\b/i, `${label} may not declare or reskin Exact Number.`);
  for (const [mechanicName, tileCode] of [["stride", "i"], ["pivot", "p"], ["aegis", "a"]]) {
    const declared = level.mechanics.includes(mechanicName);
    const placed = mapText.includes(tileCode);
    assert.equal(placed, declared, `${label} must keep its ${mechanicName} declaration and placed ${tileCode} tile in sync.`);
  }

  if (level.id <= 5) assert.doesNotMatch(mapText, /[pa]/, `${label} appears before Pivot or Aegis introduction.`);
  if (level.id >= 6 && level.id <= 9) {
    assert.match(mapText, /p/, `${label} must teach Pivot.`);
    assert.doesNotMatch(mapText, /a/, `${label} appears before Aegis introduction.`);
  }
  if (level.id === 10) {
    assert.match(mapText, /i/, "Level 10 must recall Stride.");
    assert.match(mapText, /p/, "Level 10 must combine Pivot.");
    assert.doesNotMatch(mapText, /a/, "Level 10 appears before Aegis introduction.");
  }
  if (level.id >= 11 && level.id <= 15) {
    assert.match(mapText, /a/, `${label} must teach Aegis.`);
    assert.doesNotMatch(mapText, /[ip]/, `${label} must isolate Aegis before marker combinations.`);
  }
  if (level.id === 16) assert.match(mapText, /(?=.*i)(?=.*a)/, "Level 16 must combine Stride and Aegis.");
  if (level.id === 17) assert.match(mapText, /(?=.*p)(?=.*a)/, "Level 17 must combine Pivot and Aegis.");
  if (level.id === 18) {
    assert.match(mapText, /(?=.*i)(?=.*p)/, "Level 18 must recall both route markers.");
    assert.doesNotMatch(mapText, /a/, "Level 18 is the marker-only pairwise contrast.");
  }
  if (level.id >= 19 && [19, 20, 23, 24, 25].includes(level.id)) {
    assert.match(mapText, /(?=.*i)(?=.*p)(?=.*a)/, `${label} must contain all three selected mechanics.`);
  }

  const before = JSON.stringify(level);
  const analysis = analyzeLevel(level, { solutionLimit: 1, nodeLimit: 2_000_000 });
  assert.equal(analysis.metrics.aborted, false, `${label} exceeded the first-witness node budget.`);
  assert.equal(analysis.solvable, true, `${label} must have a winning route.`);
  const witnessPath = analysis.solutions[0].path;
  const witnessTrace = tracePath(level, witnessPath);
  assert.equal(witnessTrace.ok, true, `${label}'s solver witness must be legal.`);
  assert.equal(witnessTrace.won, true, `${label}'s solver witness must win.`);

  const referencePath = pathFromDirections(level, level.referenceRoute);
  const trace = tracePath(level, referencePath);
  const replay = simulatePath(level, referencePath);
  assert.equal(trace.ok, true, `${label}'s reference route must be legal.`);
  assert.equal(trace.won, true, `${label}'s reference route must win.`);
  assert.equal(trace.pending, false, `${label}'s winning reference may not end on a pending marker.`);
  assert.deepEqual(replay, trace, `${label} must use one production trace/replay contract.`);
  assert.deepEqual(tracePath(level, pathFromDirections(level, level.referenceRoute)), trace, `${label}'s reference trace must be deterministic.`);
  assert.equal(JSON.stringify(level), before, `${label} must remain immutable during analysis and replay.`);

  const events = trace.state.events;
  assert.equal(events.some((event) => event.type === "formation"), false, `${label} may not emit the forbidden Formation event.`);
  const strideEvents = events.filter((event) => event.type === "stride");
  const pivotEvents = events.filter((event) => event.type === "pivot");
  const aegisEvents = events.filter((event) => event.type === "aegis");
  const protectedEvents = events.filter((event) => event.type === "goblin" && event.protected);
  assert.equal(strideEvents.length, [...mapText].filter((code) => code === "i").length, `${label}'s reference route must depart every placed Stride Marker.`);
  assert.equal(pivotEvents.length, [...mapText].filter((code) => code === "p").length, `${label}'s reference route must depart every placed Pivot Marker.`);
  assert.equal(aegisEvents.length, [...mapText].filter((code) => code === "a").length, `${label}'s reference route must collect every placed Aegis.`);

  for (const event of strideEvents) {
    assert.deepEqual(event.outgoing, event.incoming, `${label} must continue straight at every Stride event.`);
    strideAxes.add(event.incoming.dr === 0 ? "horizontal" : "vertical");
  }
  for (const event of pivotEvents) {
    const dotProduct = event.incoming.dr * event.outgoing.dr + event.incoming.dc * event.outgoing.dc;
    assert.equal(Math.abs(dotProduct), 0, `${label} must turn at every Pivot event.`);
    pivotExits.add(`${event.outgoing.dr},${event.outgoing.dc}`);
  }
  if (level.mechanics.includes("aegis")) {
    assert.ok(aegisEvents.length >= 1, `${label} must collect its declared Aegis.`);
    assert.ok(protectedEvents.length >= 1, `${label} must spend Aegis on a legal protected battle.`);
    assert.ok(events.some((event, index) => event.type === "goblin" && !event.protected && index > events.indexOf(protectedEvents[0])), `${label} must demonstrate why preserved soldiers matter in a later unprotected battle.`);
    protectedEvents.forEach((event) => protectedCosts.add(event.cost));
  }

  const declared = level.mechanics.join(" ").toLowerCase();
  const eventTypes = new Set(events.map((event) => event.type));
  if (declared.includes("builder")) assert.ok(eventTypes.has("builder"), `${label} must exercise its declared builder.`);
  if (declared.includes("river")) assert.ok(eventTypes.has("river"), `${label} must exercise its declared river.`);
  if (declared.includes("healer")) assert.ok(events.some((event) => event.type === "healer" && event.restored > 0), `${label} must exercise meaningful recovery.`);
  if (declared.includes("recruit")) assert.ok(eventTypes.has("recruit"), `${label} must exercise its declared recruit.`);

  report.push({
    id: level.id,
    title: level.name,
    role: level.role,
    referenceLength: level.referenceRoute.length,
    witnessLength: analysis.metrics.solutionDepth,
    nodes: analysis.metrics.nodesExpanded,
    dependency: level.dependencyDepth,
    complexity: level.cognitiveLoad,
    difficulty: level.difficulty,
    witness: directionsFromPath(witnessPath),
  });
}

// Integrated-review regressions: these routes previously won while bypassing a level's thesis.
const level19 = pack.levels[18];
const formerLevel19Bypass = tracePath(
  level19,
  pathFromDirections(level19, "RDDRRRRRRRDRURRURDRR"),
);
assert.equal(formerLevel19Bypass.won, false, "Level 19 may not restore the reviewed cheap-patrol bypass around the orc lane.");

const level19CheapFirst = tracePath(
  level19,
  pathFromDirections(level19, "RDDRRRRRRRDDRRRRRUURR"),
);
assert.equal(level19CheapFirst.ok, false, "Level 19's g-first Pivot branch must fail before the banner.");
assert.match(level19CheapFirst.reason, /needs 1 ready soldier/, "Level 19's g-first history must run out of reserve at the final watch.");
assert.deepEqual(
  level19CheapFirst.state.events
    .filter((event) => event.type === "goblin")
    .map((event) => ({ cost: event.cost, protected: Boolean(event.protected) })),
  [{ cost: 1, protected: true }, { cost: 2, protected: false }],
  "Level 19's rejected branch must visibly waste Aegis on the goblin before paying the orc cost.",
);

const level21 = pack.levels[20];
const formerLevel21Shortcut = tracePath(
  level21,
  pathFromDirections(level21, "RRRRDDD"),
);
assert.equal(formerLevel21Shortcut.won, false, "Level 21 may not reach the banner after recalling Stride but skipping Pivot.");
assert.ok(
  tracePath(level21, pathFromDirections(level21, level21.referenceRoute)).state.events.some((event) => event.type === "pivot"),
  "Level 21's winning recall route must resolve Pivot as well as Stride.",
);

assert.deepEqual([...strideAxes].sort(), ["horizontal", "vertical"], "Pack 6 must exercise horizontal and vertical Stride passages.");
assert.ok(pivotExits.size >= 3, "Pack 6 must exercise Pivot departures in at least three cardinal directions.");
assert.deepEqual([...protectedCosts].sort(), [1, 2, 3], "Pack 6 must protect goblin-, orc-, and ogre-tier battles across the campaign.");

for (let arc = 1; arc <= 5; arc += 1) {
  const levels = pack.levels.slice((arc - 1) * 5, arc * 5);
  assert.equal(levels.at(-1).difficulty, Math.max(...levels.map((level) => level.difficulty)), `Pack 6 arc ${arc} must end at its local difficulty peak.`);
  if (arc > 1) assert.ok(levels[0].difficulty < pack.levels[(arc - 1) * 5 - 1].difficulty, `Pack 6 arc ${arc} must open below the preceding synthesis peak.`);
}
const complexityCounts = expectedLoads.reduce((counts, load) => {
  counts[load] = (counts[load] ?? 0) + 1;
  return counts;
}, {});
assert.deepEqual(complexityCounts, { 1: 3, 2: 7, 3: 6, 4: 5, 5: 4 }, "Pack 6 must preserve the frozen complexity distribution.");
let consecutivePeaks = 0;
for (const load of expectedLoads) {
  consecutivePeaks = load === 5 ? consecutivePeaks + 1 : 0;
  assert.ok(consecutivePeaks <= 2, "Pack 6 may not cluster more than two maximum-load levels.");
}

console.table(report);
console.log("✓ Pack 6: 25 levels · no Exact Number · three staged mechanics · winning references · reviewed sawtooth contract");
