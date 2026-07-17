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

assert.deepEqual(PACKS.map((pack) => pack.levels.length), [10, 6, 5, 3], "The four packs must contain 10, 6, 5, and 3 levels.");

const report = [];
for (const pack of PACKS) {
  let previousDifficulty = 0;
  let previousComplexity = 0;
  for (const level of pack.levels) {
    assert.ok(level.difficulty >= previousDifficulty, `${pack.name} level ${level.id} breaks the authored difficulty ramp.`);
    previousDifficulty = level.difficulty;

    const analysis = analyzeLevel(level, { solutionLimit: 2, nodeLimit: 2_000_000 });
    assert.equal(analysis.metrics.aborted, false, `${pack.name} level ${level.id} exceeded the exhaustive node limit.`);
    assert.equal(analysis.complete, true, `${pack.name} level ${level.id} did not finish exhaustive enumeration.`);
    assert.equal(analysis.solutionCount, 1, `${pack.name} level ${level.id} must have exactly one solution.`);
    assert.equal(analysis.unique, true, `${pack.name} level ${level.id} failed the uniqueness proof.`);

    const solution = analysis.solutions[0];
    const paths = level.mode === "convoy" ? solution.routes.map((route) => route.path) : [solution.path];
    if (level.mode === "convoy") {
      const occupied = new Set();
      const litBeacons = new Set();
      solution.routes.forEach((route, index) => {
        const commander = level.commanders[index];
        assert.equal(route.commanderId, commander.id, `${pack.name} level ${level.id} uses the wrong commander order.`);
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
        assert.equal(noHealerAnalysis.solutionCount, 0, `${pack.name} level ${level.id} must be impossible without its new recruit.`);
      }
    }

    if (pack.id !== "green-march") {
      assert.ok(
        analysis.metrics.complexityScore > previousComplexity,
        `${pack.name} level ${level.id} must be measurably more complex than the previous level (${analysis.metrics.complexityScore} <= ${previousComplexity}).`,
      );
      previousComplexity = analysis.metrics.complexityScore;
    }

    report.push({
      pack: `P${pack.number}`,
      level: level.id,
      name: level.name,
      solutions: analysis.solutionCount,
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

console.table(report);
console.log("✓ 24 levels exhaustively validated · exactly 1 solution each · measurable Pack 2–4 complexity ramps · all mechanics present");
