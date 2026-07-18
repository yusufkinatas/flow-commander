import assert from "node:assert/strict";
import { PACKS } from "../js/levels.js";
import {
  analyzeLevel,
  beaconsComplete,
  directionsFromPath,
  keyOf,
  parseLevel,
  simulatePath,
} from "../js/engine.js";
import { exportableLevel, normalizeDesign } from "../js/designer.js";

assert.deepEqual(PACKS.map((pack) => pack.levels.length), [10, 6, 5, 3, 25], "The five packs must contain 10, 6, 5, 3, and 25 levels.");

const report = [];
for (const pack of PACKS) {
  let previousDifficulty = 0;
  for (const level of pack.levels) {
    if (pack.id !== "formation-muster") {
      assert.ok(level.difficulty >= previousDifficulty, `${pack.name} level ${level.id} breaks the authored difficulty ramp.`);
    }
    previousDifficulty = level.difficulty;

    const analysis = analyzeLevel(level, { solutionLimit: 1, nodeLimit: 2_000_000 });
    assert.equal(analysis.metrics.aborted, false, `${pack.name} level ${level.id} exceeded the node limit before finding a winning route.`);
    assert.equal(analysis.solvable, true, `${pack.name} level ${level.id} must have at least one winning route.`);

    const solution = analysis.solutions[0];
    const paths = level.mode === "convoy" ? solution.routes.map((route) => route.path) : [solution.path];
    if (level.mode === "convoy") {
      const occupied = new Set();
      const litBeacons = new Set();
      const expectedCommanderIds = new Set(level.commanders.map((commander) => commander.id));
      const routedCommanderIds = new Set(solution.routes.map((route) => route.commanderId));
      assert.deepEqual(routedCommanderIds, expectedCommanderIds, `${pack.name} level ${level.id} must route every commander exactly once.`);
      solution.routes.forEach((route) => {
        const commander = level.commanders.find((candidate) => candidate.id === route.commanderId);
        assert.ok(commander, `${pack.name} level ${level.id} returned an unknown commander route.`);
        const result = simulatePath(level, route.path, { commander });
        assert.equal(result.ok, true, `${pack.name} level ${level.id} has an illegal ${commander.name} route.`);
        assert.equal(result.won, true, `${commander.name} does not reach the matching standard.`);
        route.path.forEach((position) => {
          const key = keyOf(position);
          assert.equal(occupied.has(key), false, `${pack.name} level ${level.id} has crossing commander routes.`);
          occupied.add(key);
        });
        result.state.beacons.forEach((beacon) => litBeacons.add(beacon));
      });
      assert.equal(beaconsComplete(level, litBeacons), true, `${pack.name} level ${level.id} leaves a beacon dark.`);
    } else {
      const result = simulatePath(level, solution.path);
      assert.equal(result.ok, true, `${pack.name} level ${level.id}'s solution must be legal.`);
      assert.equal(result.won, true, `${pack.name} level ${level.id}'s solution must reach the banner.`);
      if (pack.id === "second-wind") {
        const routeTiles = solution.path.map(({ r, c }) => level.rows[r][c]);
        const healerIndex = routeTiles.indexOf("f");
        const healerEvent = result.state.events.find((event) => event.type === "healer" && event.restored > 0);
        assert.ok(healerIndex > 0, `${pack.name} level ${level.id} must route through a healer.`);
        assert.ok(routeTiles.slice(0, healerIndex).some((tile) => /[got]/.test(tile)), `${pack.name} level ${level.id} needs a soldier cost before its healer.`);
        assert.ok(routeTiles.slice(healerIndex + 1).some((tile) => /[got]/.test(tile)), `${pack.name} level ${level.id} needs a soldier cost after its healer.`);
        assert.ok(healerEvent, `${pack.name} level ${level.id}'s healer must actually restore tired soldiers.`);
        const withoutHealer = parseLevel({
          ...level,
          rows: undefined,
          map: level.map.map((row) => row.replaceAll("f", ".")),
        });
        const noHealerAnalysis = analyzeLevel(withoutHealer, { solutionLimit: 1, nodeLimit: 2_000_000 });
        assert.equal(noHealerAnalysis.metrics.aborted, false, `${pack.name} level ${level.id}'s no-healer proof exceeded the node limit.`);
        assert.equal(noHealerAnalysis.solvable, false, `${pack.name} level ${level.id} must be impossible without its new recruit.`);
      }
    }

    report.push({
      pack: `P${pack.number}`,
      level: level.id,
      name: level.name,
      solvable: analysis.solvable,
      nodes: analysis.metrics.nodesExpanded,
      deadEnds: analysis.metrics.deadEnds,
      branches: analysis.metrics.branchNodes,
      depth: analysis.metrics.solutionDepth,
      turns: analysis.metrics.solutionTurns,
      score: analysis.metrics.complexityScore,
      route: paths.map(directionsFromPath).join(" | "),
    });
  }
}

const pack2Tiles = PACKS[1].levels.flatMap((level) => level.map).join("");
assert.match(pack2Tiles, /h/, "Relief Routes must contain one-meal monsters.");
assert.match(pack2Tiles, /H/, "Relief Routes must contain two-meal monsters.");

const pack3Tiles = PACKS[2].levels.flatMap((level) => level.map).join("");
for (const requiredTile of ["A", "X", "B", "Z", "C", "V", "*", "w", "c"]) {
  assert.ok(pack3Tiles.includes(requiredTile), `The Three Banners is missing mechanic tile: ${requiredTile}`);
}
assert.match(pack3Tiles, /[<>^v]/, "The Three Banners must contain a marching arrow.");

const pack4Tiles = PACKS[3].levels.flatMap((level) => level.map).join("");
assert.match(pack4Tiles, /f/, "The Second Wind must contain the healer recruit.");
assert.doesNotMatch(pack4Tiles, /[hHABXZCV*wc<>^v]/, "The Second Wind may only extend the original campaign with healers.");
for (const level of PACKS[3].levels) {
  assert.match(level.map.join(""), /f/, `The Second Wind level ${level.id} must use a healer.`);
}

const pack5Tiles = PACKS[4].levels.flatMap((level) => level.map).join("");
for (const checkpoint of ["1", "2", "3"]) {
  assert.ok(pack5Tiles.includes(checkpoint), `The Exacting Muster must contain Formation Checkpoint ${checkpoint}.`);
}
assert.doesNotMatch(pack5Tiles, /[hHABXZCV*wc<>^v]/, "The Exacting Muster may only extend campaign mechanics with Formation Checkpoints.");

// Convoy route geometry is independent of which commander the player selects first.
const convoySample = PACKS[2].levels[0];
const reversedConvoy = { ...convoySample, commanders: [...convoySample.commanders].reverse() };
const reversedAnalysis = analyzeLevel(reversedConvoy, { solutionLimit: 1, nodeLimit: 50_000 });
assert.equal(reversedAnalysis.solvable, true, "Selecting convoy commanders in another order must preserve solvability.");
const normalizeRoutes = (solution) => solution.routes
  .map((route) => `${route.commanderId}:${directionsFromPath(route.path)}`)
  .sort();
assert.deepEqual(
  normalizeRoutes(reversedAnalysis.solutions[0]),
  normalizeRoutes(analyzeLevel(convoySample, { solutionLimit: 1, nodeLimit: 50_000 }).solutions[0]),
  "Convoy execution order must not change the solution geometry.",
);

// Browser-workshop exports use the exact same parser and solver as authored levels.
const workshopDesign = normalizeDesign({
  id: "test-design",
  name: "Workshop Muster",
  difficulty: "Gentle",
  mechanic: "Recruit → rally",
  briefing: "Test the exported draft.",
  tip: "Keep marching east.",
  width: 9,
  height: 5,
  map: ["#########", "#########", "#S.r.g.G#", "#########", "#########"],
});
const workshopExport = exportableLevel(workshopDesign);
assert.equal(workshopExport.difficulty, 2, "Workshop difficulty labels must export as numeric game difficulty.");
const workshopAnalysis = analyzeLevel(parseLevel(workshopExport), { solutionLimit: 1, nodeLimit: 10_000 });
assert.equal(workshopAnalysis.solvable, true, "A valid workshop export must have a production-solver winning route.");

// Open geometry is valid. This fixture deliberately has multiple winning
// paths; acceptance stops at one witness instead of turning alternatives into
// an error or requiring the designer to add corridor walls.
const openFieldLevel = parseLevel({
  id: "open-field-regression",
  mode: "campaign",
  map: [
    "#####",
    "#S..#",
    "#...#",
    "#..G#",
    "#####",
  ],
});
const openFieldAlternatives = analyzeLevel(openFieldLevel, { solutionLimit: 2, nodeLimit: 10_000 });
assert.equal(openFieldAlternatives.solutions.length, 2, "The open-field fixture must retain two witnesses to prove alternatives exist.");
const openFieldAcceptance = analyzeLevel(openFieldLevel, { solutionLimit: 1, nodeLimit: 10_000 });
assert.equal(openFieldAcceptance.solvable, true, "An open field with alternative winning routes must pass solvability validation.");

console.table(report);
console.log("✓ 49 levels have winning routes · open alternatives accepted · free commander order proven · workshop export verified · all mechanics present");
