import { analyzeLevel, parseLevel } from "../js/engine.js";

// Deterministic mixed-authorship helper: keep authored objectives fixed, vary only
// meadow/wild tiles, then retain every layout for which the production solver
// can find at least one winning route. Alternative winning routes are allowed.
const SCENARIOS = {
  2: { width: 9, height: 6, start: [1, 1], goal: [1, 7], targets: [[2, 3, "H"]], maxMoves: 10, wallChance: 0.24 },
  3: { width: 11, height: 7, start: [1, 1], goal: [4, 9], targets: [[1, 5, "h"], [3, 3, "h"], [4, 7, "h"]], maxMoves: 15, wallChance: 0.27 },
  4: { width: 11, height: 8, start: [1, 1], goal: [6, 9], targets: [[2, 3, "H"], [3, 7, "H"], [5, 5, "h"]], maxMoves: 19, wallChance: 0.3 },
};

const scenarioId = Number(process.argv[2] ?? 2);
const attempts = Number(process.argv[3] ?? 6000);
const scenario = SCENARIOS[scenarioId];
if (!scenario) throw new Error(`Unknown scenario ${scenarioId}.`);

let seed = 0x5f3759df ^ scenarioId;
function random() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 2 ** 32;
}

function makeMap() {
  const rows = Array.from({ length: scenario.height }, (_, r) => Array.from({ length: scenario.width }, (_, c) => {
    if (r === 0 || c === 0 || r === scenario.height - 1 || c === scenario.width - 1) return "#";
    return random() < scenario.wallChance ? "#" : ".";
  }));
  rows[scenario.start[0]][scenario.start[1]] = "S";
  rows[scenario.goal[0]][scenario.goal[1]] = "G";
  for (const [r, c, tile] of scenario.targets) rows[r][c] = tile;
  return rows.map((row) => row.join(""));
}

const best = [];
for (let attempt = 0; attempt < attempts; attempt += 1) {
  const map = makeMap();
  let level;
  try {
    level = parseLevel({ id: scenarioId, mode: "relief", maxMoves: scenario.maxMoves, map });
  } catch {
    continue;
  }
  const analysis = analyzeLevel(level, { solutionLimit: 1, nodeLimit: 250_000 });
  if (!analysis.solvable) continue;
  const openTiles = map.join("").match(/[.SG]/g)?.length ?? 0;
  const rank = analysis.metrics.complexityScore + openTiles * 0.18;
  best.push({ rank, map, metrics: analysis.metrics });
  best.sort((a, b) => b.rank - a.rank);
  if (best.length > 8) best.length = 8;
}

for (const candidate of best) {
  console.log(`\nrank=${candidate.rank.toFixed(2)} nodes=${candidate.metrics.nodesExpanded} dead=${candidate.metrics.deadEnds} branches=${candidate.metrics.branchNodes} depth=${candidate.metrics.solutionDepth} turns=${candidate.metrics.solutionTurns}`);
  console.log(candidate.map.map((row) => `"${row}",`).join("\n"));
}

if (!best.length) process.exitCode = 1;
