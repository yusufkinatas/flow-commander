import assert from "node:assert/strict";
import { PACKS } from "../js/levels.js";
import {
  advanceState,
  createPartyState,
  heroPlanContext,
  parseLevel,
  simulatePath,
  solveLevel,
  tracePath,
} from "../js/engine.js";

function eventTypes(events) {
  return events.map((event) => event.type);
}

function verifyTraceReplay(level, path, commander, label, hunt = undefined) {
  const options = commander ? { commander } : {};
  if (hunt) options.hunt = hunt;
  const trace = tracePath(level, path, options);
  const simulation = simulatePath(level, path, options);

  assert.equal(trace.ok, true, `${label} must compile into a legal trace.`);
  assert.equal(trace.won, true, `${label} must remain a winning route.`);
  assert.deepEqual(simulation, trace, `${label} must use the same trace contract in simulatePath.`);
  assert.equal(trace.steps.length, path.length, `${label} must trace every route tile, including its start.`);
  assert.notStrictEqual(trace.initialState, trace.state, `${label} must expose independent initial and final snapshots.`);

  let replayState = createPartyState(commander?.initial);
  trace.steps.forEach((step, index) => {
    assert.equal(step.index, index, `${label} step indices must be stable.`);
    assert.deepEqual(step.position, path[index], `${label} step ${index} must retain its route position.`);
    assert.notStrictEqual(step.position, path[index], `${label} step ${index} must clone its route position.`);
    assert.equal(step.tile, level.rows[step.position.r][step.position.c], `${label} step ${index} must identify its tile.`);
    assert.deepEqual(step.before, replayState, `${label} step ${index} must begin at the replay state.`);
    assert.notStrictEqual(step.before, replayState, `${label} step ${index} must clone its before snapshot.`);

    const replayed = advanceState(level, replayState, step.position, {
      commander,
      countMove: index > 0,
      previous: path[index - 2],
      from: path[index - 1],
      hunt,
    });
    assert.equal(replayed.ok, true, `${label} step ${index} must replay successfully.`);
    assert.deepEqual(replayed.events, step.events, `${label} step ${index} must preserve newly emitted event order.`);
    assert.deepEqual(replayed.event, step.events.at(-1) ?? null, `${label} step ${index} must retain the compatible singular event.`);
    assert.deepEqual(replayed.state, step.after, `${label} step ${index} must reach the traced after snapshot.`);
    assert.notStrictEqual(step.after, replayed.state, `${label} step ${index} must clone its after snapshot.`);
    replayState = replayed.state;
  });

  assert.deepEqual(replayState, trace.state, `${label} replay must reach the compiled final state.`);
  const orderedEvents = [
    ...trace.initialState.events,
    ...trace.steps.flatMap((step) => step.events),
  ];
  assert.deepEqual(orderedEvents, trace.state.events, `${label} trace events must match final-state event history exactly.`);
}

let levelCount = 0;
let routeCount = 0;
for (const pack of PACKS) {
  for (const level of pack.levels) {
    const solutions = solveLevel(level, 1);
    assert.ok(solutions.length > 0, `${pack.name} level ${level.id} needs a winning witness for flow verification.`);
    for (const [solutionIndex, solution] of solutions.entries()) {
      if (level.mode === "hunt") {
        // Each hunter is replayed against the world snapshot the hunters before it left.
        const plan = heroPlanContext(level, {
          order: solution.order,
          assignment: solution.assignment,
          paths: Object.fromEntries(solution.routes.map((route) => [route.heroId, route.path])),
        });
        for (const entry of plan.entries) {
          verifyTraceReplay(
            level,
            entry.path,
            entry.commander,
            `${pack.name} level ${level.id} solution ${solutionIndex + 1}, ${entry.commander.name}`,
            entry.options.hunt,
          );
          routeCount += 1;
        }
      } else if (level.mode === "convoy") {
        for (const route of solution.routes) {
          const commander = level.commanders.find((candidate) => candidate.id === route.commanderId);
          assert.ok(commander, `${pack.name} level ${level.id} returned an unknown commander.`);
          verifyTraceReplay(
            level,
            route.path,
            commander,
            `${pack.name} level ${level.id} solution ${solutionIndex + 1}, ${commander.name}`,
          );
          routeCount += 1;
        }
      } else {
        verifyTraceReplay(level, solution, null, `${pack.name} level ${level.id} solution ${solutionIndex + 1}`);
        routeCount += 1;
      }
    }
    levelCount += 1;
  }
}

// Later planned moves must see resources already collected and spent earlier in the route.
const resourceLevel = parseLevel({
  id: "trace-resource",
  mode: "campaign",
  map: [
    "#######",
    "#SrggG#",
    "#######",
  ],
});
const resourcePath = [1, 2, 3, 4].map((c) => ({ r: 1, c }));
const blockedPlan = tracePath(resourceLevel, resourcePath);
assert.equal(blockedPlan.ok, false, "A planned soldier cannot be spent twice.");
assert.equal(blockedPlan.won, false, "A resource-blocked plan cannot be winning.");
assert.equal(blockedPlan.blockedIndex, 3, "The second goblin must be the blocked planned step.");
assert.equal(blockedPlan.steps.length, 3, "Only committed legal planning steps belong to the trace.");
assert.equal(blockedPlan.state.soldiers, 0, "The first planned goblin must consume the recruited soldier.");
assert.equal(blockedPlan.state.tired, 1, "The consumed planned soldier must remain tired in preview state.");
assert.deepEqual(eventTypes(blockedPlan.state.events), ["recruit", "goblin"], "Invalid planning must retain prior event order.");
assert.match(blockedPlan.reason, /needs 1 ready soldier/, "The resource failure must explain the current simulated army.");
assert.deepEqual(simulatePath(resourceLevel, resourcePath), blockedPlan, "Invalid simulation and trace results must agree.");

// A no-op tile must not repeat the previous tile's event through the singular compatibility field.
const meadowLevel = parseLevel({
  id: "trace-meadow",
  mode: "campaign",
  map: [
    "######",
    "#Sr.G#",
    "######",
  ],
});
const meadowPath = [1, 2, 3, 4].map((c) => ({ r: 1, c }));
const meadowTrace = tracePath(meadowLevel, meadowPath);
assert.equal(meadowTrace.ok, true);
assert.deepEqual(eventTypes(meadowTrace.steps[1].events), ["recruit"]);
assert.deepEqual(meadowTrace.steps[2].events, [], "Meadow steps must emit no event.");
let meadowState = advanceState(meadowLevel, createPartyState(), meadowPath[0], { countMove: false }).state;
meadowState = advanceState(meadowLevel, meadowState, meadowPath[1]).state;
const meadowTransition = advanceState(meadowLevel, meadowState, meadowPath[2]);
assert.deepEqual(meadowTransition.events, [], "advanceState must expose an empty fresh-event array for meadow.");
assert.equal(meadowTransition.event, null, "advanceState must not repeat a recruit as the meadow's singular event.");

// A relief step may resolve its own tile and an adjacent delivery; both must survive in order.
const simultaneousLevel = parseLevel({
  id: "trace-simultaneous",
  mode: "relief",
  maxMoves: 4,
  map: [
    "#######",
    "#Sr..G#",
    "##h####",
    "#######",
  ],
});
const simultaneousPath = [1, 2, 3, 4, 5].map((c) => ({ r: 1, c }));
const simultaneousTrace = tracePath(simultaneousLevel, simultaneousPath);
assert.equal(simultaneousTrace.ok, true);
assert.equal(simultaneousTrace.won, true);
assert.deepEqual(
  eventTypes(simultaneousTrace.steps[1].events),
  ["recruit", "delivery"],
  "Tile resolution must precede its simultaneous adjacent delivery.",
);
assert.deepEqual(
  eventTypes(simultaneousTrace.state.events),
  ["recruit", "delivery", "goal"],
  "The cumulative history must preserve simultaneous event order without duplication.",
);
let simultaneousState = advanceState(simultaneousLevel, createPartyState(), simultaneousPath[0], { countMove: false }).state;
const simultaneousTransition = advanceState(simultaneousLevel, simultaneousState, simultaneousPath[1]);
assert.deepEqual(eventTypes(simultaneousTransition.events), ["recruit", "delivery"]);
assert.equal(simultaneousTransition.event?.type, "delivery", "The legacy singular event must remain the final event on the step.");

console.log(`✓ ${levelCount} levels / ${routeCount} solver routes traced and replayed with deterministic state and event parity`);
