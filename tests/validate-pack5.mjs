import assert from "node:assert/strict";
import { PACKS } from "../js/levels.js";
import {
  analyzeLevel,
  directionsFromPath,
  parseLevel,
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
  const analysis = analyzeLevel(level, { solutionLimit: Number.POSITIVE_INFINITY, nodeLimit: 2_000_000 });
  assert.equal(analysis.metrics.aborted, false, `Pack 5 level ${level.id} exceeded the exhaustive node limit.`);
  assert.equal(analysis.complete, true, `Pack 5 level ${level.id} must finish exhaustive enumeration.`);
  assert.equal(analysis.solutionCount, 1, `Pack 5 level ${level.id} must have exactly one solution.`);
  assert.equal(analysis.unique, true, `Pack 5 level ${level.id} must have a proven unique solution.`);

  const uniquePath = analysis.solutions[0].path;
  const uniqueRoute = directionsFromPath(uniquePath);
  assert.equal(uniqueRoute, level.intendedRoute, `Pack 5 level ${level.id}'s exhaustive route must match intendedRoute.`);
  const intendedPath = pathFromDirections(level, level.intendedRoute);
  assert.deepEqual(intendedPath, uniquePath, `Pack 5 level ${level.id}'s intendedRoute must reconstruct the exhaustive path exactly.`);

  const trace = tracePath(level, intendedPath);
  const replay = simulatePath(level, intendedPath);
  assert.equal(trace.ok, true, `Pack 5 level ${level.id}'s intended route must be legal.`);
  assert.equal(trace.won, true, `Pack 5 level ${level.id}'s intended route must win.`);
  assert.deepEqual(replay, trace, `Pack 5 level ${level.id} must use one reducer contract for trace and execution replay.`);
  assert.deepEqual(tracePath(level, pathFromDirections(level, level.intendedRoute)), trace, `Pack 5 level ${level.id}'s trace must be deterministic across repeated runs.`);
  assert.equal(JSON.stringify(level), before, `Pack 5 level ${level.id} must remain immutable during analysis and replay.`);

  const formationEvents = trace.state.events.filter((event) => event.type === "formation");
  assert.ok(formationEvents.length >= 1, `Pack 5 level ${level.id}'s unique route must trigger a Formation Checkpoint.`);
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

  const withoutFormation = parseLevel({
    ...level,
    rows: undefined,
    map: level.map.map((row) => row.replace(/[123]/g, ".")),
  });
  const noFormationAnalysis = analyzeLevel(withoutFormation, { solutionLimit: Number.POSITIVE_INFINITY, nodeLimit: 2_000_000 });
  assert.equal(noFormationAnalysis.metrics.aborted, false, `Pack 5 level ${level.id}'s mechanic-necessity proof exceeded the node limit.`);
  const noFormationRoutes = noFormationAnalysis.solutions.map((solution) => directionsFromPath(solution.path));
  assert.ok(
    noFormationAnalysis.solutionCount !== 1 || noFormationRoutes[0] !== uniqueRoute,
    `Pack 5 level ${level.id}'s solution space must change when Formation Checkpoints are removed.`,
  );

  const checkpointKeys = new Set();
  let constrainingCheckpointCount = 0;
  for (let row = 0; row < level.map.length; row += 1) {
    for (let column = 0; column < level.map[row].length; column += 1) {
      if (!/[123]/.test(level.map[row][column])) continue;
      const replacement = [...level.map[row]];
      const checkpoint = replacement[column];
      replacement[column] = ".";
      const withoutOneCheckpoint = parseLevel({
        ...level,
        rows: undefined,
        map: level.map.map((mapRow, index) => index === row ? replacement.join("") : mapRow),
      });
      const singleAblation = analyzeLevel(withoutOneCheckpoint, { solutionLimit: 2, nodeLimit: 2_000_000 });
      assert.equal(singleAblation.metrics.aborted, false, `Pack 5 level ${level.id}'s F${checkpoint} ablation exceeded the node limit.`);
      const ablatedRoutes = singleAblation.solutions.map((solution) => directionsFromPath(solution.path));
      const changedRouteSpace = singleAblation.solutionCount !== 1 || ablatedRoutes[0] !== uniqueRoute;
      const checkpointKey = `${row},${column}`;
      checkpointKeys.add(checkpointKey);
      if (changedRouteSpace) constrainingCheckpointCount += 1;
      const reviewedExemption = level.checkpointExemptions?.[checkpointKey];
      if (!changedRouteSpace) {
        assert.ok(typeof reviewedExemption === "string" && reviewedExemption.length >= 40, `Pack 5 level ${level.id}'s F${checkpoint} checkpoint at ${checkpointKey} must constrain the route or carry a substantive reviewed exemption.`);
        assert.ok(
          trace.state.events.some((event) => event.type === "formation" && event.position.r === row && event.position.c === column)
            || level.mechanics.includes("parallel audit"),
          `Pack 5 level ${level.id}'s exempt checkpoint at ${checkpointKey} must occur on the intended route or belong to a declared parallel audit.`,
        );
      }
    }
  }
  assert.ok(constrainingCheckpointCount >= 1, `Pack 5 level ${level.id} needs at least one individually route-constraining checkpoint.`);
  for (const exemptionKey of Object.keys(level.checkpointExemptions ?? {})) {
    assert.ok(checkpointKeys.has(exemptionKey), `Pack 5 level ${level.id}'s checkpoint exemption ${exemptionKey} must reference a real checkpoint.`);
  }

  if (declared.includes("sun switch") || declared.includes("sun gate")) {
    const withoutSealPair = parseLevel({
      ...level,
      rows: undefined,
      map: level.map.map((row) => row.replace(/[yY]/g, ".")),
    });
    const sealAblation = analyzeLevel(withoutSealPair, { solutionLimit: 2, nodeLimit: 2_000_000 });
    assert.equal(sealAblation.metrics.aborted, false, `Pack 5 level ${level.id}'s Sun-seal ablation exceeded the node limit.`);
    const sealRoutes = sealAblation.solutions.map((solution) => directionsFromPath(solution.path));
    assert.ok(
      sealAblation.solutionCount !== 1 || sealRoutes[0] !== uniqueRoute,
      `Pack 5 level ${level.id}'s Sun switch/gate pair must change its solution space.`,
    );

    for (let row = 0; row < level.map.length; row += 1) {
      for (let column = 0; column < level.map[row].length; column += 1) {
        if (!/[yY]/.test(level.map[row][column])) continue;
        const replacement = [...level.map[row]];
        const sealTile = replacement[column];
        replacement[column] = ".";
        const withoutOneSealTile = parseLevel({
          ...level,
          rows: undefined,
          map: level.map.map((mapRow, index) => index === row ? replacement.join("") : mapRow),
        });
        const oneSealAblation = analyzeLevel(withoutOneSealTile, { solutionLimit: 2, nodeLimit: 2_000_000 });
        assert.equal(oneSealAblation.metrics.aborted, false, `Pack 5 level ${level.id}'s ${sealTile} ablation exceeded the node limit.`);
        const oneSealRoutes = oneSealAblation.solutions.map((solution) => directionsFromPath(solution.path));
        assert.ok(
          oneSealAblation.solutionCount !== 1 || oneSealRoutes[0] !== uniqueRoute,
          `Pack 5 level ${level.id}'s ${sealTile} tile at ${row},${column} must individually constrain its route.`,
        );
      }
    }
  }

  const interactionCount = trace.state.events.filter((event) => !["goal", "start"].includes(event.type)).length;
  report.push({
    id: level.id,
    title: level.name,
    role: level.role,
    solutions: analysis.solutionCount,
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
    withoutCheckpoints: noFormationAnalysis.solutionCount,
    route: uniqueRoute,
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
console.log("✓ Pack 5: 25 static levels · exact uniqueness · intended-route replay · mechanic necessity · reviewed sawtooth curve");
