import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  TILE_DEFS,
  advanceState,
  analyzeLevel,
  clonePartyState,
  createPartyState,
  enterTile,
  parseLevel,
  pathFromDirections,
  simulatePath,
  tracePath,
} from "../js/engine.js";
import { BRUSHES, normalizeDesign } from "../js/designer.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const position = (r, c) => ({ r, c });
const eventTypes = (events) => events.map((event) => event.type);

assert.deepEqual(
  TILE_DEFS.i,
  { type: "stride", walkable: true, label: "Stride Marker · continue straight through" },
  "Stride must publish its non-color rule label.",
);
assert.deepEqual(
  TILE_DEFS.p,
  { type: "pivot", walkable: true, label: "Pivot Marker · make a right-angle turn" },
  "Pivot must publish its non-color rule label.",
);
assert.deepEqual(
  TILE_DEFS.a,
  { type: "aegis", walkable: true, label: "Aegis Bearer · protects one battle" },
  "Aegis must publish its protection rule label.",
);

// The palette is grouped by tile kind, so array position encodes its group rather than any priority.
const pack6Brushes = new Map(BRUSHES.filter((brush) => ["i", "p", "a"].includes(brush.code)).map((brush) => [brush.code, brush]));
assert.deepEqual([...pack6Brushes.keys()].sort(), ["a", "i", "p"], "The editor must expose all three Pack 6 brushes.");
assert.equal(pack6Brushes.get("i").glyph, "↕↔", "Stride's editor glyph must remain readable without color.");
assert.equal(pack6Brushes.get("p").glyph, "↱↰", "Pivot's editor glyph must remain readable without color.");
assert.equal(pack6Brushes.get("a").glyph, "◆", "Aegis's editor glyph must remain readable without color.");
const normalized = normalizeDesign({
  id: "pack6-workshop",
  width: 8,
  height: 4,
  map: ["########", "#SipaG.#", "#123...#", "########"],
});
assert.equal(normalized.map[1], "#SipaG.#", "Workshop normalization must preserve all Pack 6 tiles.");
assert.equal(normalized.map[2], "#123...#", "Adding Pack 6 brushes must preserve Pack 5 Formation brushes.");

// Party snapshots must carry stacked Aegis state and deeply clone maneuver events.
const snapshotSource = createPartyState({
  soldiers: 3,
  aegis: 2,
  events: [{
    type: "stride",
    tile: "i",
    position: position(2, 2),
    incoming: { dr: 0, dc: 1 },
    outgoing: { dr: 0, dc: 1 },
  }],
});
const snapshotClone = clonePartyState(snapshotSource);
assert.equal(snapshotClone.aegis, 2, "Party cloning must retain the visible Aegis count.");
snapshotClone.events[0].incoming.dc = -1;
snapshotClone.events[0].position.c = 9;
assert.equal(snapshotSource.events[0].incoming.dc, 1, "Maneuver vectors must not alias across snapshots.");
assert.equal(snapshotSource.events[0].position.c, 2, "Maneuver positions must not alias across snapshots.");

const firstPickupInput = createPartyState({ aegis: 1 });
const firstPickupBefore = clonePartyState(firstPickupInput);
const firstPickup = enterTile(firstPickupInput, "a", position(1, 3));
assert.equal(firstPickup.ok, true);
assert.equal(firstPickup.state.aegis, 2, "Aegis pickups must stack.");
assert.deepEqual(
  firstPickup.events,
  [{ type: "aegis", tile: "a", position: position(1, 3), amount: 1 }],
  "An Aegis pickup must emit one fresh event.",
);
assert.deepEqual(firstPickupInput, firstPickupBefore, "Aegis pickup resolution must not mutate its input snapshot.");

for (const [tileCode, cost] of [["g", 1], ["o", 2], ["t", 3]]) {
  const battleInput = createPartyState({ soldiers: cost + 1, tired: 4, aegis: 1 });
  const battleBefore = clonePartyState(battleInput);
  const battlePosition = position(3, cost);
  const protectedBattle = enterTile(battleInput, tileCode, battlePosition);
  assert.equal(protectedBattle.ok, true, `${tileCode} must remain winnable with ordinary ready strength.`);
  assert.equal(protectedBattle.state.soldiers, cost + 1, "Protected combat must preserve ready soldiers.");
  assert.equal(protectedBattle.state.tired, 4, "Protected combat must not add tired soldiers.");
  assert.equal(protectedBattle.state.aegis, 0, "A legal protected combat must consume exactly one Aegis.");
  assert.deepEqual(
    protectedBattle.events,
    [{
      type: "goblin",
      tile: tileCode,
      position: battlePosition,
      cost,
      protected: true,
      aegisUsed: 1,
    }],
    "Protected combat must retain the legacy goblin event family with explicit Aegis evidence.",
  );
  assert.deepEqual(battleInput, battleBefore, "Protected combat must not mutate its input snapshot.");

  const weakInput = createPartyState({ soldiers: cost - 1, tired: 7, aegis: 2 });
  const weakBefore = clonePartyState(weakInput);
  const weakBattle = enterTile(weakInput, tileCode, battlePosition);
  assert.equal(weakBattle.ok, false, "Aegis must not substitute for ordinary battle strength.");
  assert.deepEqual(weakBattle.events, [], "An under-strength battle must emit no event.");
  assert.equal(weakBattle.event, null, "An under-strength battle must expose no compatibility event.");
  assert.match(weakBattle.reason, new RegExp(`needs ${cost} ready soldier`), "The failure must explain the ordinary ready-line requirement.");
  assert.deepEqual(weakInput, weakBefore, "An under-strength failure must leave every Aegis untouched.");

  const legacyInput = createPartyState({ soldiers: cost + 1, tired: 2 });
  const legacyBattle = enterTile(legacyInput, tileCode, battlePosition);
  assert.equal(legacyBattle.ok, true);
  assert.equal(legacyBattle.state.soldiers, 1, "Combat without Aegis must retain legacy soldier spending.");
  assert.equal(legacyBattle.state.tired, 2 + cost, "Combat without Aegis must retain legacy fatigue.");
  assert.equal(legacyBattle.state.aegis, 0);
  assert.deepEqual(
    legacyBattle.events,
    [{ type: "goblin", tile: tileCode, position: battlePosition, cost }],
    "Unprotected combat event shape must remain backward compatible.",
  );
}

const unaffectedInteractions = [
  [".", {}],
  ["m", {}],
  ["d", { mages: 1 }],
  ["b", {}],
  ["~", { builders: 1 }],
  ["f", { soldiers: 0, tired: 2 }],
  ["1", { soldiers: 1 }],
  ["y", {}],
  ["Y", { switches: ["sun"] }],
  ["i", {}],
  ["p", {}],
];
for (const [tileCode, initial] of unaffectedInteractions) {
  const interaction = enterTile(createPartyState({ ...initial, aegis: 2 }), tileCode, position(4, 4));
  assert.equal(interaction.ok, true, `${tileCode} fixture must be a legal noncombat interaction.`);
  assert.equal(interaction.state.aegis, 2, `${tileCode} must not spend or alter carried Aegis.`);
}

const stackedLevel = parseLevel({
  id: "aegis-stacks",
  mode: "campaign",
  map: ["#########", "#SRaaggG#", "#########"],
});
const stackedTrace = tracePath(stackedLevel, pathFromDirections(stackedLevel, "RRRRRR"));
assert.equal(stackedTrace.ok, true);
assert.equal(stackedTrace.won, true);
assert.equal(stackedTrace.state.soldiers, 2, "Two stacked Aegis charges must protect two legal battles.");
assert.equal(stackedTrace.state.tired, 0);
assert.equal(stackedTrace.state.aegis, 0);
assert.deepEqual(eventTypes(stackedTrace.state.events), ["recruit", "aegis", "aegis", "goblin", "goblin", "goal"]);
assert.ok(stackedTrace.state.events.filter((event) => event.protected).every((event) => event.aegisUsed === 1));

const weakTraceLevel = parseLevel({
  id: "aegis-is-not-strength",
  mode: "campaign",
  map: ["#######", "#SaogG#", "#######"],
});
const weakTrace = tracePath(weakTraceLevel, pathFromDirections(weakTraceLevel, "RR"));
assert.equal(weakTrace.ok, false, "Planning must reject an under-strength fight even after an Aegis pickup.");
assert.equal(weakTrace.blockedIndex, 2);
assert.equal(weakTrace.state.aegis, 1, "The rejected plan must retain the prior Aegis preview state.");
assert.deepEqual(eventTypes(weakTrace.state.events), ["aegis"]);

function openMarkerLevel(tileCode) {
  return parseLevel({
    id: `marker-${tileCode}`,
    mode: "campaign",
    map: [
      "#######",
      "#S....#",
      "#.....#",
      `#..${tileCode}..#`,
      "#.....#",
      "#....G#",
      "#######",
    ],
  });
}

const cardinals = [
  { dr: -1, dc: 0 },
  { dr: 0, dc: 1 },
  { dr: 1, dc: 0 },
  { dr: 0, dc: -1 },
];
const marker = position(3, 3);
for (const incoming of cardinals) {
  const previous = position(marker.r - incoming.dr, marker.c - incoming.dc);
  const straightDestination = position(marker.r + incoming.dr, marker.c + incoming.dc);
  const normalizeZero = (value) => Object.is(value, -0) ? 0 : value;
  const left = { dr: normalizeZero(-incoming.dc), dc: normalizeZero(incoming.dr) };
  const right = { dr: normalizeZero(incoming.dc), dc: normalizeZero(-incoming.dr) };

  const strideState = createPartyState({ aegis: 2, events: [{ type: "aegis", tile: "a", position: position(1, 1), amount: 1 }] });
  const strideBefore = clonePartyState(strideState);
  const straight = advanceState(openMarkerLevel("i"), strideState, straightDestination, {
    previous,
    from: marker,
    countMove: false,
  });
  assert.equal(straight.ok, true, "Stride must accept a straight exit in every rotation.");
  assert.deepEqual(straight.events, [{
    type: "stride",
    tile: "i",
    position: marker,
    incoming,
    outgoing: incoming,
  }]);
  assert.equal(straight.state.aegis, 2, "Stride must not alter carried Aegis.");
  assert.deepEqual(strideState, strideBefore, "Valid Stride resolution must not mutate the source snapshot.");

  const strideTurn = advanceState(
    openMarkerLevel("i"),
    strideState,
    position(marker.r + left.dr, marker.c + left.dc),
    { previous, from: marker, countMove: false },
  );
  assert.equal(strideTurn.ok, false, "Stride must reject a turn in every rotation.");
  assert.match(strideTurn.reason, /Continue straight through/);
  assert.deepEqual(strideTurn.events, [], "An invalid Stride departure must emit no event.");
  assert.deepEqual(strideState, strideBefore, "An invalid Stride departure must not mutate state.");

  for (const outgoing of [left, right]) {
    const pivotState = createPartyState({ aegis: 1 });
    const pivotBefore = clonePartyState(pivotState);
    const turn = advanceState(
      openMarkerLevel("p"),
      pivotState,
      position(marker.r + outgoing.dr, marker.c + outgoing.dc),
      { previous, from: marker, countMove: false },
    );
    assert.equal(turn.ok, true, "Pivot must accept both right-angle exits in every rotation.");
    assert.deepEqual(turn.events, [{
      type: "pivot",
      tile: "p",
      position: marker,
      incoming,
      outgoing,
    }]);
    assert.equal(turn.state.aegis, 1, "Pivot must not alter carried Aegis.");
    assert.deepEqual(pivotState, pivotBefore, "Valid Pivot resolution must not mutate the source snapshot.");
  }

  const pivotStraightState = createPartyState({ aegis: 1 });
  const pivotStraightBefore = clonePartyState(pivotStraightState);
  const pivotStraight = advanceState(openMarkerLevel("p"), pivotStraightState, straightDestination, {
    previous,
    from: marker,
    countMove: false,
  });
  assert.equal(pivotStraight.ok, false, "Pivot must reject a straight exit in every rotation.");
  assert.match(pivotStraight.reason, /right-angle turn/);
  assert.deepEqual(pivotStraight.events, [], "An invalid Pivot departure must emit no event.");
  assert.deepEqual(pivotStraightState, pivotStraightBefore, "An invalid Pivot departure must not mutate state.");
}

for (const tileCode of ["i", "p"]) {
  const provisionalInput = createPartyState({ soldiers: 2, aegis: 3 });
  const provisionalBefore = clonePartyState(provisionalInput);
  const provisionalEntry = enterTile(provisionalInput, tileCode, marker);
  assert.equal(provisionalEntry.ok, true, "Marker entry must be provisionally legal.");
  assert.deepEqual(provisionalEntry.events, [], "Marker entry alone must not emit its departure event.");
  assert.deepEqual(provisionalEntry.state, provisionalBefore, "Marker entry must not change party state.");
  assert.notStrictEqual(provisionalEntry.state, provisionalInput, "Marker entry must still return an independent snapshot.");

  const missingIncoming = advanceState(openMarkerLevel(tileCode), provisionalInput, position(3, 4), {
    from: marker,
    countMove: false,
  });
  assert.equal(missingIncoming.ok, false, "A marker cannot resolve without a cardinal entering edge.");
  assert.deepEqual(missingIncoming.events, []);

  const nonUnitIncoming = advanceState(openMarkerLevel(tileCode), provisionalInput, position(3, 4), {
    previous: position(3, 1),
    from: marker,
    countMove: false,
  });
  assert.equal(nonUnitIncoming.ok, false, "Marker geometry must reject a non-unit incoming vector.");
  assert.deepEqual(nonUnitIncoming.events, []);

  const nonUnitOutgoing = advanceState(openMarkerLevel(tileCode), provisionalInput, position(3, 5), {
    previous: position(3, 2),
    from: marker,
    countMove: false,
  });
  assert.equal(nonUnitOutgoing.ok, false, "Marker geometry must reject a non-unit outgoing vector.");
  assert.deepEqual(nonUnitOutgoing.events, []);
  assert.deepEqual(provisionalInput, provisionalBefore, "Malformed marker context must remain immutable.");
}

const strideLevel = parseLevel({
  id: "stride-trace",
  mode: "campaign",
  map: ["#######", "#Si..G#", "#.....#", "#######"],
});
const pendingStridePath = pathFromDirections(strideLevel, "R");
const pendingStride = tracePath(strideLevel, pendingStridePath);
assert.equal(pendingStride.ok, true, "Entry onto a Stride marker must compile provisionally.");
assert.equal(pendingStride.pending, true, "A route head on Stride must remain visibly pending.");
assert.equal(pendingStride.won, false, "A pending marker head must never win.");
assert.deepEqual(pendingStride.steps.at(-1).events, [], "Stride must not emit on entry.");
assert.equal(pendingStride.state.events.some((event) => event.type === "stride"), false);
const markerAsGoal = tracePath({ ...strideLevel, goal: position(1, 2) }, pendingStridePath);
assert.equal(markerAsGoal.pending, true);
assert.equal(markerAsGoal.won, false, "Pending must override geometric goal coincidence in the trace contract.");

const invalidStride = tracePath(strideLevel, pathFromDirections(strideLevel, "RD"));
assert.equal(invalidStride.ok, false, "Planning must reject a turn away from Stride.");
assert.equal(invalidStride.blockedIndex, 2);
assert.equal(invalidStride.steps.length, 2, "The invalid destination must not join the frozen trace.");
assert.equal(invalidStride.state.events.some((event) => event.type === "stride"), false, "Invalid departure must not leak a marker event.");

const validStridePath = pathFromDirections(strideLevel, "RRRR");
const validStridePathBefore = structuredClone(validStridePath);
const validStride = tracePath(strideLevel, validStridePath);
assert.equal(validStride.ok, true);
assert.equal(validStride.won, true);
assert.equal(validStride.pending, false);
assert.deepEqual(validStride.steps[2].events, [{
  type: "stride",
  tile: "i",
  position: position(1, 2),
  incoming: { dr: 0, dc: 1 },
  outgoing: { dr: 0, dc: 1 },
}], "The departure event must be attached to the destination step but point at the marker.");
assert.deepEqual(validStridePath, validStridePathBefore, "Trace compilation must not mutate route geometry.");

const atomicFailureLevel = parseLevel({
  id: "marker-before-blocked-combat",
  mode: "campaign",
  map: ["######", "#SigG#", "######"],
});
const atomicFailureState = createPartyState({ aegis: 2 });
const atomicFailureBefore = clonePartyState(atomicFailureState);
const atomicFailure = advanceState(atomicFailureLevel, atomicFailureState, position(1, 3), {
  previous: position(1, 1),
  from: position(1, 2),
});
assert.equal(atomicFailure.ok, false, "A valid marker departure cannot make an under-strength destination legal.");
assert.deepEqual(atomicFailure.events, [], "A failed destination must not leak its provisional departure event.");
assert.deepEqual(atomicFailureState, atomicFailureBefore, "A failed destination after valid geometry must remain atomic and immutable.");

const pivotLevel = parseLevel({
  id: "pivot-trace",
  mode: "campaign",
  map: ["#######", "#S....#", "#.pG..#", "#.....#", "#######"],
});
const pendingPivot = tracePath(pivotLevel, pathFromDirections(pivotLevel, "RD"));
assert.equal(pendingPivot.ok, true);
assert.equal(pendingPivot.pending, true, "A route head on Pivot must remain visibly pending.");
assert.equal(pendingPivot.won, false);
assert.deepEqual(pendingPivot.steps.at(-1).events, []);

const invalidPivot = tracePath(pivotLevel, pathFromDirections(pivotLevel, "RDD"));
assert.equal(invalidPivot.ok, false, "Planning must reject continuing straight through Pivot.");
assert.equal(invalidPivot.blockedIndex, 3);
assert.equal(invalidPivot.state.events.some((event) => event.type === "pivot"), false);

const validPivot = tracePath(pivotLevel, pathFromDirections(pivotLevel, "RDR"));
assert.equal(validPivot.ok, true);
assert.equal(validPivot.won, true);
assert.deepEqual(validPivot.steps[3].events[0], {
  type: "pivot",
  tile: "p",
  position: position(2, 2),
  incoming: { dr: 1, dc: 0 },
  outgoing: { dr: 0, dc: 1 },
});

const markerArrivalLevel = parseLevel({
  id: "marker-arrival-order",
  mode: "campaign",
  map: ["#######", "#Sia.G#", "#######"],
});
const markerArrival = tracePath(markerArrivalLevel, pathFromDirections(markerArrivalLevel, "RRRR"));
assert.equal(markerArrival.ok, true);
assert.equal(markerArrival.won, true);
assert.deepEqual(
  eventTypes(markerArrival.steps[2].events),
  ["stride", "aegis"],
  "A departure event must precede the destination tile event on the same frozen step.",
);
assert.deepEqual(eventTypes(markerArrival.state.events), ["stride", "aegis", "goal"]);

function verifyCombination({ id, map, directions, expectedEvents }) {
  const level = parseLevel({ id, mode: "campaign", map });
  const path = pathFromDirections(level, directions);
  const levelBefore = JSON.stringify(level);
  const pathBefore = structuredClone(path);
  const trace = tracePath(level, path);
  assert.equal(trace.ok, true, `${id} must compile.`);
  assert.equal(trace.won, true, `${id} must win.`);
  assert.equal(trace.pending, false, `${id} must not end on a provisional marker.`);
  assert.deepEqual(eventTypes(trace.state.events), expectedEvents, `${id} must preserve cross-mechanic event order.`);
  assert.deepEqual(simulatePath(level, path), trace, `${id} simulation must use the production trace contract.`);
  assert.deepEqual(tracePath(level, path), trace, `${id} tracing must be deterministic.`);
  assert.equal(JSON.stringify(level), levelBefore, `${id} analysis must not mutate level data.`);
  assert.deepEqual(path, pathBefore, `${id} analysis must not mutate its path.`);
  return { level, trace };
}

verifyCombination({
  id: "stride-pivot-pair",
  map: ["######", "#Sip##", "###.##", "##G.##", "######"],
  directions: "RRDDL",
  expectedEvents: ["stride", "pivot", "goal"],
});

const strideAegisPair = verifyCombination({
  id: "stride-aegis-pair",
  map: ["########", "#SiRagG#", "########"],
  directions: "RRRRR",
  expectedEvents: ["stride", "recruit", "aegis", "goblin", "goal"],
});
assert.equal(strideAegisPair.trace.state.events.find((event) => event.type === "goblin").protected, true);

const pivotAegisPair = verifyCombination({
  id: "pivot-aegis-pair",
  map: ["######", "#SRp##", "###a##", "##Gg##", "######"],
  directions: "RRDDL",
  expectedEvents: ["recruit", "pivot", "aegis", "goblin", "goal"],
});
assert.equal(pivotAegisPair.trace.state.events.find((event) => event.type === "goblin").protected, true);

const allThree = verifyCombination({
  id: "all-three-mechanics",
  map: ["######", "#SiRp#", "####a#", "###Gg#", "######"],
  directions: "RRRDDL",
  expectedEvents: ["stride", "recruit", "pivot", "aegis", "goblin", "goal"],
});
assert.equal(allThree.trace.state.soldiers, 2, "Aegis must preserve the recruited line in the all-three fixture.");
assert.equal(allThree.trace.state.tired, 0);
assert.equal(allThree.trace.state.aegis, 0);
assert.deepEqual(
  eventTypes(allThree.trace.steps[4].events),
  ["pivot", "aegis"],
  "Pivot departure must resolve before the Aegis destination pickup.",
);
const analysis = analyzeLevel(allThree.level, { solutionLimit: 1, nodeLimit: 10_000 });
assert.equal(analysis.metrics.aborted, false, "The solver must handle all three mechanics within the normal DFS state.");
assert.equal(analysis.solvable, true, "The solver must find an all-three witness.");
const solverTrace = tracePath(allThree.level, analysis.solutions[0].path);
assert.equal(solverTrace.won, true, "Solver witnesses must replay through the same marker/Aegis contract.");
assert.ok(solverTrace.state.events.some((event) => event.type === "stride"));
assert.ok(solverTrace.state.events.some((event) => event.type === "pivot"));
assert.ok(solverTrace.state.events.some((event) => event.type === "goblin" && event.protected));

// The UI contract must expose each mechanic in planning, execution, the HUD, and the teal Pack 6 theme.
const game = readFileSync(resolve(root, "js/game.js"), "utf8");
const html = readFileSync(resolve(root, "index.html"), "utf8");
const styles = readFileSync(resolve(root, "styles.css"), "utf8");
assert.match(html, /id="aegisCard"/);
assert.match(html, /id="aegisCount"/);
assert.match(html, /id="aegisCard"[^>]*\bhidden\b/, "The future Aegis HUD must start hidden before level-sensitive rendering.");
assert.match(html, /roster-card__glyph--aegis[^>]*>◆</, "The HUD must include a non-color Aegis silhouette.");

function namedFunctionSource(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name}() must remain a named production function.`);
  const open = source.indexOf("{", start);
  let depth = 0;
  let quote = null;
  for (let index = open; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (char === "\\") index += 1;
      else if (char === quote) quote = null;
      continue;
    }
    if (["\"", "'", "`"].includes(char)) {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}" && --depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`Could not extract ${name}().`);
}

const stagedPresentation = Function(`
  "use strict";
  ${namedFunctionSource(game, "grandManeuverDisclosure")}
  ${namedFunctionSource(game, "grandManeuverRules")}
  ${namedFunctionSource(game, "grandManeuverLegend")}
  return { grandManeuverDisclosure, grandManeuverRules, grandManeuverLegend };
`)();

const disclosureMilestones = [
  { label: "L1 Stride introduction", level: { map: ["#SiG#"] }, expected: { stride: true, pivot: false, aegis: false } },
  { label: "L6 Pivot introduction", level: { map: ["#SpG#"] }, expected: { stride: false, pivot: true, aegis: false } },
  { label: "L10 marker combination", level: { map: ["#SipG#"] }, expected: { stride: true, pivot: true, aegis: false } },
  { label: "L11 Aegis introduction", level: { map: ["#SaG#"] }, expected: { stride: false, pivot: false, aegis: true } },
  { label: "all-three synthesis", level: { rows: [["#", "S", "i", "p", "a", "G", "#"]] }, expected: { stride: true, pivot: true, aegis: true } },
];
for (const milestone of disclosureMilestones) {
  const disclosure = stagedPresentation.grandManeuverDisclosure(milestone.level);
  assert.deepEqual(disclosure, milestone.expected, `${milestone.label} must disclose only mechanics placed in that level.`);
  const rules = stagedPresentation.grandManeuverRules(disclosure);
  const ruleText = rules.flat().join(" ").toLowerCase();
  const legend = stagedPresentation.grandManeuverLegend(disclosure).map(([kind]) => kind);
  const expectedLegend = Object.entries(milestone.expected).filter(([, present]) => present).map(([mechanic]) => mechanic);
  assert.deepEqual(legend, expectedLegend, `${milestone.label} legend must not spoil future or absent mechanics.`);
  for (const [mechanic, present] of Object.entries(milestone.expected)) {
    const name = new RegExp(`\\b${mechanic}\\b`, "i");
    if (present) assert.match(ruleText, name, `${milestone.label} rules must explain ${mechanic}.`);
    else assert.doesNotMatch(ruleText, name, `${milestone.label} rules must not reveal ${mechanic}.`);
  }
}
assert.deepEqual(
  stagedPresentation.grandManeuverRules({ stride: false, pivot: false, aegis: false }),
  [],
  "A level without Pack 6 tiles must not receive Pack 6 rules.",
);
assert.doesNotMatch(game, /session\.pack\.id === "grand-maneuver"/, "Pack-wide checks must not reveal future mechanics.");
assert.match(game, /const maneuverDisclosure = grandManeuverDisclosure\(\)/, "Rules and legend must derive from current-level disclosure.");
assert.match(
  game,
  /dom\.aegisCard\.hidden = !\(grandManeuverDisclosure\(\)\.aegis \|\| session\.party\.aegis > 0\)/,
  "The Aegis HUD must appear only when the level contains Aegis or the party carries one.",
);

for (const contract of [
  /maneuver-marker--stride/,
  /maneuver-marker--pivot/,
  /aegis-symbol/,
  /is-planned-marker-pending/,
  /is-planned-marker-resolved/,
  /is-planned-protected/,
  /event\.protected\s*\?\s*"aegisGuard"/,
  /spawnExecutionFx\("aegis-guard"/,
  /const departureEvents = step\.events\.filter/,
  /event\.position \?\? route\.trace\.steps\[stepIndex - 1\]\.position/,
  /session\.execution\.resolved\.add\(keyOf\(eventPosition\)\)/,
]) assert.match(game, contract, "Game UI must preserve the Pack 6 planning/execution contract.");

for (const contract of [
  /--teal:\s*#[0-9a-f]{6}/i,
  /body\[data-pack="teal"\]/,
  /\.pack-tab--teal\.is-current/,
  /\.route-line--teal/,
  /\.route-head--teal/,
  /\.cell--stride/,
  /\.cell--pivot/,
  /\.cell--aegis/,
  /\.cell\.is-planned-marker-pending/,
  /\.cell\.is-planned-protected/,
  /\.execution-fx--aegis-guard/,
  /\.designer-cell--stride/,
  /\.designer-cell--pivot/,
  /\.designer-cell--aegis/,
]) assert.match(styles, contract, "CSS must expose distinct Pack 6 tile, state, editor, and teal-theme visuals.");

console.log("✓ Pack 6 mechanics: departure geometry · Aegis strength/stacking · immutability · solver/trace parity · staged UI/editor states");
