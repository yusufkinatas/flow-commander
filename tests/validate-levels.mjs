import assert from "node:assert/strict";
import { LEVELS } from "../js/levels.js";
import { directionsFromPath, simulatePath, solveLevel } from "../js/engine.js";

assert.equal(LEVELS.length, 10, "The campaign must contain exactly ten levels.");

let previousDifficulty = 0;
const report = [];

for (const level of LEVELS) {
  assert.ok(level.difficulty >= previousDifficulty, `Level ${level.id} breaks the difficulty ramp.`);
  previousDifficulty = level.difficulty;

  const solutions = solveLevel(level, 3);
  assert.equal(
    solutions.length,
    1,
    `Level ${level.id} must have exactly one solution; found ${solutions.length}${solutions.length === 3 ? "+" : ""}.`,
  );

  const result = simulatePath(level, solutions[0]);
  assert.equal(result.ok, true, `Level ${level.id}'s solution must be legal.`);
  assert.equal(result.won, true, `Level ${level.id}'s solution must reach the banner.`);

  report.push({
    level: level.id,
    name: level.name,
    difficulty: level.difficulty,
    tiles: solutions[0].length,
    route: directionsFromPath(solutions[0]),
    solutions: solutions.length,
  });
}

const campaignTiles = LEVELS.flatMap((level) => level.map).join("");
for (const requiredTile of ["r", "g", "b", "~", "m", "d", "y", "Y", "q", "Q"]) {
  assert.ok(campaignTiles.includes(requiredTile), `Campaign is missing required mechanic tile: ${requiredTile}`);
}

console.table(report);
console.log("✓ 10 levels validated · 1 solution each · difficulty is non-decreasing · all mechanics present");
