import assert from "node:assert/strict";
import { PACKS } from "../js/levels.js";
import {
  analyzeLevel,
  directionsFromPath,
  pathFromDirections,
  simulatePath,
  tracePath,
} from "../js/engine.js";

const pack = PACKS.find((candidate) => candidate.id === "formation-muster");
assert.ok(pack, "Pack 5 must be registered as formation-muster.");
assert.equal(pack.number, 5, "Formation Muster must be Pack 5.");
assert.equal(pack.levels.length, 25, "Pack 5 must contain exactly 25 levels.");
assert.deepEqual(pack.levels.map((level) => level.id), Array.from({ length: 25 }, (_, index) => index + 1), "Pack 5 IDs must be contiguous from 1 through 25.");

const expectedRoles = ["Introduce", "Reinforce", "Twist", "Combine", "Synthesize"];
const expectedDifficulties = [
  1, 1.8, 2.6, 3.4, 4.5,
  2, 3.4, 4.2, 5, 6.2,
  3, 4.2, 5.2, 6, 7.4,
  4, 5.2, 6.2, 7.2, 8.4,
  5, 6.6, 7.6, 8.8, 10,
];
const expectedLoads = [
  1, 1, 2, 2, 3,
  1, 2, 2, 3, 4,
  2, 3, 3, 4, 5,
  2, 3, 4, 4, 5,
  2, 4, 3, 5, 5,
];
assert.deepEqual(pack.levels.map((level) => level.difficulty), expectedDifficulties, "Pack 5 must preserve the reviewed sawtooth difficulty curve.");
assert.deepEqual(pack.levels.map((level) => level.cognitiveLoad), expectedLoads, "Pack 5 must preserve the reviewed cognitive-load curve.");

const report = [];
const thresholds = new Set();
for (const level of pack.levels) {
  const expectedArc = Math.ceil(level.id / 5);
  const expectedRole = expectedRoles[(level.id - 1) % 5];
  assert.equal(level.arc, expectedArc, `Pack 5 level ${level.id} must belong to arc ${expectedArc}.`);
  assert.equal(level.role, expectedRole, `Pack 5 level ${level.id} must have the ${expectedRole} role.`);
  assert.ok(
    Array.isArray(level.mechanics) && level.mechanics.some((mechanic) => mechanic === "formation" || /^F[123]$/.test(mechanic)),
    `Pack 5 level ${level.id} must declare a Formation Checkpoint in its mechanic matrix.`,
  );
  assert.ok(typeof level.thesis === "string" && level.thesis.trim().length >= 20, `Pack 5 level ${level.id} needs a substantive design thesis.`);
  assert.ok(Number.isInteger(level.dependencyDepth) && level.dependencyDepth >= 1 && level.dependencyDepth <= 6, `Pack 5 level ${level.id} needs a 1–6 dependency-depth estimate.`);
  assert.match(level.map.join(""), /[123]/, `Pack 5 level ${level.id} must contain a Formation Checkpoint.`);
  assert.doesNotMatch(level.map.join(""), /[hHABXZCV*wc<>^v]/, `Pack 5 level ${level.id} may not introduce relief or convoy tiles.`);
  for (const code of level.map.join("")) if (/[123]/.test(code)) thresholds.add(code);

  const before = JSON.stringify(level);
  const analysis = analyzeLevel(level, { solutionLimit: 1, nodeLimit: 2_000_000 });
  assert.equal(analysis.metrics.aborted, false, `Pack 5 level ${level.id} exceeded the node limit before finding a winning route.`);
  assert.equal(analysis.solvable, true, `Pack 5 level ${level.id} must have at least one winning route.`);

  const witnessPath = analysis.solutions[0].path;
  const witnessRoute = directionsFromPath(witnessPath);
  const witnessTrace = tracePath(level, witnessPath);
  assert.equal(witnessTrace.ok, true, `Pack 5 level ${level.id}'s solver witness must be legal.`);
  assert.equal(witnessTrace.won, true, `Pack 5 level ${level.id}'s solver witness must win.`);

  // Existing Pack 5 data calls this intendedRoute. It is a documented reference
  // solution, not a claim that every other winning route is invalid.
  const referencePath = pathFromDirections(level, level.intendedRoute);
  const trace = tracePath(level, referencePath);
  const replay = simulatePath(level, referencePath);
  assert.equal(trace.ok, true, `Pack 5 level ${level.id}'s reference route must be legal.`);
  assert.equal(trace.won, true, `Pack 5 level ${level.id}'s reference route must win.`);
  assert.deepEqual(replay, trace, `Pack 5 level ${level.id} must use one reducer contract for trace and execution replay.`);
  assert.deepEqual(tracePath(level, pathFromDirections(level, level.intendedRoute)), trace, `Pack 5 level ${level.id}'s trace must be deterministic across repeated runs.`);
  assert.equal(JSON.stringify(level), before, `Pack 5 level ${level.id} must remain immutable during analysis and replay.`);

  const formationEvents = trace.state.events.filter((event) => event.type === "formation");
  assert.ok(formationEvents.length >= 1, `Pack 5 level ${level.id}'s reference route must trigger a Formation Checkpoint.`);
  assert.ok(formationEvents.every((event) => event.required === event.actual), `Pack 5 level ${level.id} must reach every checkpoint with its exact ready count.`);

  const declared = level.mechanics.join(" ").toLowerCase();
  const eventTypes = new Set(trace.state.events.map((event) => event.type));
  for (const required of [1, 2, 3]) {
    if (level.mechanics.includes(`F${required}`)) {
      assert.ok(formationEvents.some((event) => event.required === required), `Pack 5 level ${level.id} must exercise declared F${required}.`);
    }
  }
  if (declared.includes("mage")) assert.ok(eventTypes.has("mage"), `Pack 5 level ${level.id} must recruit its declared mage.`);
  if (declared.includes("dragon")) assert.ok(eventTypes.has("dragon"), `Pack 5 level ${level.id} must resolve its declared dragon.`);
  if (declared.includes("builder")) assert.ok(eventTypes.has("builder"), `Pack 5 level ${level.id} must recruit its declared builder.`);
  if (declared.includes("river")) assert.ok(eventTypes.has("river"), `Pack 5 level ${level.id} must resolve its declared river.`);
  if (/combat|goblin|orc|ogre|fatigue|reduction/.test(declared)) assert.ok(eventTypes.has("goblin"), `Pack 5 level ${level.id} must resolve its declared soldier cost.`);
  if (declared.includes("sun switch")) assert.ok(trace.state.events.some((event) => event.type === "switch" && event.channel === "sun"), `Pack 5 level ${level.id} must light its declared Sun switch.`);
  if (declared.includes("sun gate")) assert.ok(trace.state.events.some((event) => event.type === "gate" && event.channel === "sun"), `Pack 5 level ${level.id} must open its declared Sun gate.`);
  if (/healer|recovery/.test(declared)) {
    assert.match(level.map.join(""), /f/, `Pack 5 level ${level.id} must place its declared healer.`);
    if (!/overflow|decoy/.test(declared)) {
      assert.ok(trace.state.events.some((event) => event.type === "healer" && event.restored > 0), `Pack 5 level ${level.id}'s declared recovery must restore tired soldiers.`);
    }
  }

  const interactionCount = trace.state.events.filter((event) => !["goal", "start"].includes(event.type)).length;
  report.push({
    id: level.id,
    title: level.name,
    role: level.role,
    solvable: analysis.solvable,
    length: analysis.metrics.solutionDepth,
    turns: analysis.metrics.solutionTurns,
    nodes: analysis.metrics.nodesExpanded,
    branches: analysis.metrics.branchNodes,
    deadEnds: analysis.metrics.deadEnds,
    searchRatio: analysis.metrics.searchRatio,
    complexity: analysis.metrics.complexityScore,
    interactions: interactionCount,
    dependencyDepth: level.dependencyDepth,
    cognitiveLoad: level.cognitiveLoad,
    difficulty: level.difficulty,
    witnessRoute,
    referenceRoute: level.intendedRoute,
  });
}

assert.deepEqual([...thresholds].sort(), ["1", "2", "3"], "Pack 5 must exercise all three checkpoint thresholds.");
for (let arc = 1; arc <= 5; arc += 1) {
  const levels = pack.levels.slice((arc - 1) * 5, arc * 5);
  assert.equal(levels.at(-1).difficulty, Math.max(...levels.map((level) => level.difficulty)), `Pack 5 arc ${arc} must end at its local difficulty peak.`);
  if (arc > 1) assert.ok(levels[0].difficulty < pack.levels[(arc - 1) * 5 - 1].difficulty, `Pack 5 arc ${arc} must open below the preceding synthesis peak.`);
}
let consecutivePeaks = 0;
for (const load of expectedLoads) {
  consecutivePeaks = load === 5 ? consecutivePeaks + 1 : 0;
  assert.ok(consecutivePeaks <= 2, "Pack 5 may not place more than two maximum-load peaks consecutively.");
}
const complexityCounts = expectedLoads.reduce((counts, value) => {
  counts[value] = (counts[value] ?? 0) + 1;
  return counts;
}, {});
assert.equal(complexityCounts[5], 4, "Pack 5 must contain exactly four complexity-5 levels.");
assert.equal(complexityCounts[4], 5, "Pack 5 must contain exactly five complexity-4 levels.");
assert.equal((complexityCounts[1] ?? 0) + (complexityCounts[2] ?? 0) + (complexityCounts[3] ?? 0), 16, "Pack 5 must contain sixteen complexity-1–3 levels.");

console.table(report);
console.log("✓ Pack 5: 25 static levels · winning witness found · reference-route replay · reviewed mechanic events and sawtooth curve");
