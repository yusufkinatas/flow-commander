import assert from "node:assert/strict";
import {
  DIRECTIONS,
  TILE_DEFS,
  advanceState,
  allEnemiesDead,
  analyzeLevel,
  createPartyState,
  heroPlanContext,
  huntCommander,
  huntHazards,
  keyOf,
  parseLevel,
  pathFromDirections,
  simulatePath,
  tracePath,
} from "../js/engine.js";
import { HUNTERS_MOON_RAW } from "../js/packs/hunters-moon.js";

const eventTypes = (events) => events.map((event) => event.type);
const killedBy = (trace) => [...trace.state.kills].sort();

function huntLevel({ map, facing, warrior = 8, rogue = 8, mage = 8, mana = 0, id = 1 }) {
  return parseLevel({
    id,
    mode: "hunt",
    name: "Fixture",
    difficulty: 1,
    mechanic: "Test fixture",
    briefing: "Fixture briefing.",
    tip: "Fixture tip.",
    heroes: [
      { id: "warrior", name: "Bream the Shield", maxMoves: warrior },
      { id: "rogue", name: "Wren Quickstep", maxMoves: rogue },
      { id: "mage", name: "Ash of the Ninth", maxMoves: mage, mana },
    ],
    map,
    facing,
  });
}

function huntOptions({ deadEnemies = [], occupied = [] } = {}) {
  return { deadEnemies: new Set(deadEnemies), occupied: new Set(occupied) };
}

function runRoute(level, heroId, camp, directions, hunt = {}) {
  const commander = huntCommander(level, heroId, camp);
  const path = pathFromDirections(level, directions, commander);
  const options = { commander, hunt: huntOptions(hunt) };
  return { commander, path, options, trace: tracePath(level, path, options) };
}

// ---------------------------------------------------------------------------
// Tile manifest: every hunt tile publishes a non-color rule label.
// ---------------------------------------------------------------------------

assert.deepEqual(
  TILE_DEFS.T,
  { type: "camp", walkable: true, label: "Hunters' camp" },
  "The camp must publish its non-color label.",
);
assert.deepEqual(
  TILE_DEFS.n,
  { type: "huntEnemy", walkable: true, enemy: "goblin", label: "Goblin" },
  "The goblin must publish its enemy kind.",
);
assert.deepEqual(
  TILE_DEFS.O,
  { type: "huntEnemy", walkable: true, enemy: "orc", label: "Orc · guards the tile it watches" },
  "The orc must publish its guard rule label.",
);
assert.deepEqual(
  TILE_DEFS.D,
  { type: "huntEnemy", walkable: true, enemy: "dragon", label: "Dragon · breathes a lane of flame" },
  "The dragon must publish its flame rule label.",
);

// ---------------------------------------------------------------------------
// Parsing: the facing grid must line up with the map exactly.
// ---------------------------------------------------------------------------

const PARSE_MAP = ["#####", "#T.n#", "#T.T#", "#####"];

assert.throws(
  () => huntLevel({ map: PARSE_MAP, facing: ["....."] }),
  /needs a facing grid with 4 rows/,
  "A short facing grid must be rejected.",
);
assert.throws(
  () => huntLevel({ map: PARSE_MAP, facing: ["....", ".....", ".....", "....."] }),
  /facing row 0 must be 5 cells wide/,
  "A ragged facing grid must be rejected.",
);
assert.throws(
  () => huntLevel({ map: PARSE_MAP, facing: [".....", "...#.", ".....", "....."] }),
  /needs a facing arrow/,
  "An enemy without a legal arrow must be rejected.",
);
assert.throws(
  () => huntLevel({ map: PARSE_MAP, facing: [".....", "..vv.", ".....", "....."] }),
  /facing arrow at 1,2 with no enemy on it/,
  "A stray arrow must be rejected.",
);
assert.throws(
  () => huntLevel({ map: ["#####", "#T.n#", "#..T#", "#####"], facing: [".....", "...v.", ".....", "....."] }),
  /needs at least three camps/,
  "Hunt levels must carry a camp for every hero.",
);
assert.throws(
  () => huntLevel({ map: ["#####", "#T.T#", "#T..#", "#####"], facing: [".....", ".....", ".....", "....."] }),
  /needs at least one enemy/,
  "A hunt with nothing to hunt must be rejected.",
);
assert.throws(
  () => parseLevel({
    id: 9,
    mode: "hunt",
    name: "No heroes",
    map: PARSE_MAP,
    facing: [".....", "...v.", ".....", "....."],
    heroes: [{ id: "warrior", name: "W", maxMoves: 3 }],
  }),
  /needs exactly the heroes warrior, rogue, mage/,
  "The party roster is fixed at three named classes.",
);

const parsed = huntLevel({ map: PARSE_MAP, facing: [".....", "...v.", ".....", "....."] });
assert.equal(parsed.goal, null, "A hunt level has no goal tile.");
assert.deepEqual(parsed.start, { r: 1, c: 1 }, "The first camp seeds the legacy start position.");
assert.deepEqual(
  parsed.enemies,
  [{ id: "1,3", r: 1, c: 3, type: "goblin", facing: "D" }],
  "Enemies must be parsed with a stable id, kind, and facing.",
);
assert.deepEqual(parsed.camps, [{ r: 1, c: 1 }, { r: 2, c: 1 }, { r: 2, c: 3 }], "Camps are collected in reading order.");
assert.equal(parsed.heroes.find((hero) => hero.id === "mage").initial.mana, 0, "Mana defaults to zero.");

// ---------------------------------------------------------------------------
// Melee: 4 facings x 4 approaches, per class.
// ---------------------------------------------------------------------------

// A 7x7 room with the quarry dead centre and a camp in every corner, so the same
// enemy can be approached from all four sides within one move budget.
const ARENA_MAP = [
  "#######",
  "#T...T#",
  "#.....#",
  "#..n..#",
  "#.....#",
  "#T...T#",
  "#######",
];
const ARENA_CAMP = { r: 1, c: 1 };
// Each route leaves the north-west camp and arrives at 3,3 moving in the named direction.
const APPROACHES = {
  D: "RRDD",
  U: "DDDRRU",
  R: "DDRR",
  L: "RRRDDL",
};

for (const facing of ["U", "R", "D", "L"]) {
  const arrow = { U: "^", R: ">", D: "v", L: "<" }[facing];
  const level = huntLevel({
    map: ARENA_MAP,
    facing: ["       ".replace(/ /g, "."), ".......", ".......", `...${arrow}...`.slice(0, 7), ".......", ".......", "......."],
  });

  for (const [vector, directions] of Object.entries(APPROACHES)) {
    const warrior = runRoute(level, "warrior", ARENA_CAMP, directions);
    assert.equal(warrior.trace.ok, true, `The warrior must strike a ${facing}-facing enemy from the ${vector} side.`);
    assert.deepEqual(killedBy(warrior.trace), ["3,3"], `The warrior's ${vector} approach must fell the enemy.`);

    const rogue = runRoute(level, "rogue", ARENA_CAMP, directions);
    const fromBehind = vector === facing;
    assert.equal(
      rogue.trace.ok,
      fromBehind,
      `The rogue may strike a ${facing}-facing enemy only while moving ${facing}; moving ${vector} must ${fromBehind ? "succeed" : "fail"}.`,
    );
    if (fromBehind) {
      assert.deepEqual(killedBy(rogue.trace), ["3,3"], "A backstab must fell the enemy.");
      const strike = rogue.trace.steps.at(-1).events.find((event) => event.type === "huntKill");
      assert.equal(strike.method, "backstab", "A rogue kill must record itself as a backstab.");
    } else {
      assert.match(rogue.trace.reason, /only strikes from behind/, "A refused backstab must say why.");
    }

    const mage = runRoute(level, "mage", ARENA_CAMP, directions);
    assert.equal(mage.trace.ok, false, `The mage must refuse melee from the ${vector} side.`);
    assert.match(mage.trace.reason, /cannot fight hand to hand/, "A refused melee must say why.");
  }
}

// The warrior's kill is plain melee, and both classes report the enemy they felled.
const meleeLevel = huntLevel({ map: ARENA_MAP, facing: [".......", ".......", ".......", "...v...", ".......", ".......", "......."] });
const meleeStrike = runRoute(meleeLevel, "warrior", ARENA_CAMP, "RRDD").trace.steps.at(-1).events.at(-1);
assert.deepEqual(
  meleeStrike,
  { type: "huntKill", method: "melee", enemyType: "goblin", enemyId: "3,3", position: { r: 3, c: 3 } },
  "A melee kill must publish a replayable event.",
);

// ---------------------------------------------------------------------------
// Mage line of sight (D4).
// ---------------------------------------------------------------------------

// Two enemies on different cardinals from one camp: north is scanned before east.
const PRIORITY_MAP = [
  "#######",
  "#..n..#",
  "#T.T.n#",
  "#T....#",
  "#######",
];
const PRIORITY_FACING = [".......", "...v...", ".....v.", ".......", "......."];
const MAGE_CAMP = { r: 2, c: 3 };

const oneMana = huntLevel({ map: PRIORITY_MAP, facing: PRIORITY_FACING, mana: 1 });
const priority = runRoute(oneMana, "mage", MAGE_CAMP, "");
assert.equal(priority.trace.ok, true, "A stay-home mage route is legal.");
assert.deepEqual(killedBy(priority.trace), ["1,3"], "With one mana the U ray must resolve before the R ray.");
assert.equal(priority.trace.state.mana, 0, "Each bolt must spend one mana.");
const bolt = priority.trace.steps[0].events.find((event) => event.type === "bolt");
assert.deepEqual(
  bolt,
  { type: "bolt", direction: "U", enemyType: "goblin", enemyId: "1,3", from: { r: 2, c: 3 }, position: { r: 1, c: 3 } },
  "A bolt must publish its direction, origin, and victim.",
);

const twoMana = huntLevel({ map: PRIORITY_MAP, facing: PRIORITY_FACING, mana: 2 });
const both = runRoute(twoMana, "mage", MAGE_CAMP, "");
assert.deepEqual(killedBy(both.trace), ["1,3", "2,5"], "Two mana must clear both cardinals in one arrival.");
assert.deepEqual(
  eventTypes(both.trace.steps[0].events).filter((type) => type === "bolt"),
  ["bolt", "bolt"],
  "Each kill must emit its own bolt event.",
);

const noMana = huntLevel({ map: PRIORITY_MAP, facing: PRIORITY_FACING, mana: 0 });
const idle = runRoute(noMana, "mage", MAGE_CAMP, "");
assert.deepEqual(killedBy(idle.trace), [], "A mage without mana must not fire.");
assert.deepEqual(idle.trace.steps[0].events, [], "A spent mage must emit nothing on arrival.");

// A wall stops the ray before the enemy behind it.
const walled = huntLevel({
  map: ["#######", "#..#..#", "#T.n.n#", "#T...T#", "#######"],
  facing: [".......", ".......", "...v.v.", ".......", "......."],
  mana: 2,
});
const blockedRay = runRoute(walled, "mage", { r: 2, c: 1 }, "");
assert.deepEqual(killedBy(blockedRay.trace), ["2,3"], "A wall must not stop the ray that never meets it, but the nearest enemy still blocks.");

// One kill per direction per arrival: the enemy behind an enemy needs a second stop.
const QUEUE_MAP = ["#######", "#T.n.n#", "#T...T#", "#######"];
const QUEUE_FACING = [".......", "...v.v.", ".......", "......."];
const queue = huntLevel({ map: QUEUE_MAP, facing: QUEUE_FACING, mana: 2 });
const firstArrival = runRoute(queue, "mage", { r: 1, c: 1 }, "");
assert.deepEqual(killedBy(firstArrival.trace), ["1,3"], "A single arrival may fell only the nearest enemy on a ray.");
assert.equal(firstArrival.trace.state.mana, 1, "The unused mana must survive the arrival.");

const secondArrival = runRoute(queue, "mage", { r: 1, c: 1 }, "R");
assert.deepEqual(
  killedBy(secondArrival.trace),
  ["1,3", "1,5"],
  "Stepping once more must open the corridor and fell the enemy behind.",
);
assert.deepEqual(
  killedBy({ state: { kills: new Set([...secondArrival.trace.steps[0].after.kills]) } }),
  ["1,3"],
  "The first arrival's snapshot must still show only the nearer kill.",
);

// A dead enemy is transparent: another hero's kill opens the lane.
const opened = runRoute(queue, "mage", { r: 1, c: 1 }, "", { deadEnemies: ["1,3"] });
assert.deepEqual(killedBy(opened.trace), ["1,5"], "An enemy felled by an earlier hero must not block line of sight.");

// ---------------------------------------------------------------------------
// Threats (D5): class-aware, order-dependent, blocked at draw time.
// ---------------------------------------------------------------------------

const ORC_MAP = ["#######", "#..O..#", "#T...T#", "#T....#", "#######"];
const ORC_FACING = [".......", "...v...", ".......", ".......", "......."];
const orcLevel = huntLevel({ map: ORC_MAP, facing: ORC_FACING });
const WATCHED = "RR"; // 2,1 -> 2,2 -> 2,3, the tile the orc watches

assert.equal(runRoute(orcLevel, "warrior", { r: 2, c: 1 }, WATCHED).trace.ok, true, "The warrior may walk into the orc's guard.");
for (const heroId of ["rogue", "mage"]) {
  const guarded = runRoute(orcLevel, heroId, { r: 2, c: 1 }, WATCHED);
  assert.equal(guarded.trace.ok, false, `The ${heroId} must be turned back by the orc's guard.`);
  assert.match(guarded.trace.reason, /orc is watching/, "A guarded tile must name the orc.");
  assert.equal(guarded.trace.blockedIndex, 2, "The refusal must point at the guarded square.");
}

// Kill the projector and the guard evaporates for everyone.
const orcDead = runRoute(orcLevel, "rogue", { r: 2, c: 5 }, "LL", { deadEnemies: ["1,3"] });
assert.equal(orcDead.trace.ok, true, "A felled orc must stop guarding its tile.");

const DRAGON_MAP = ["#########", "#D.....T#", "#T.....T#", "#########"];
const DRAGON_FACING = [".........", ".>.......", ".........", "........."];
const dragonLevel = huntLevel({ map: DRAGON_MAP, facing: DRAGON_FACING });

for (const heroId of ["warrior", "rogue", "mage"]) {
  // 2,1 -> 2,2 -> 1,2, stepping up into the lane rather than onto the dragon itself.
  const scorched = runRoute(dragonLevel, heroId, { r: 2, c: 1 }, "RU");
  assert.equal(scorched.trace.ok, false, `The dragon's flame must stop the ${heroId} too.`);
  assert.match(scorched.trace.reason, /dragon's flame/, "A scorched tile must name the flame.");
}

// The flame reaches a camp, so nobody may be posted there at all.
const scorchedCamp = runRoute(dragonLevel, "warrior", { r: 1, c: 7 }, "");
assert.equal(scorchedCamp.trace.ok, false, "A camp inside the flame must refuse its hero at step 0.");
assert.match(scorchedCamp.trace.reason, /dragon's flame/, "A scorched camp must explain itself.");

// A living body soaks the flame: its own tile stays strikeable and the lane behind it is safe.
const soaked = huntLevel({
  map: ["#########", "#D.n...T#", "#T.....T#", "#########"],
  facing: [".........", ".>.v.....", ".........", "........."],
});
assert.equal(runRoute(soaked, "warrior", { r: 1, c: 7 }, "").trace.ok, true, "A shielded camp must stay usable.");
assert.equal(runRoute(soaked, "warrior", { r: 1, c: 7 }, "LLL").trace.ok, true, "The lane behind a living body must stay walkable.");
assert.equal(runRoute(soaked, "warrior", { r: 1, c: 7 }, "LLLL").trace.ok, true, "The body that soaks the flame must still be strikeable.");
assert.deepEqual(killedBy(runRoute(soaked, "warrior", { r: 1, c: 7 }, "LLLL").trace), ["1,3"], "Striking the shield must fell it.");
// Once it dies the flame runs the full lane again.
assert.equal(
  runRoute(soaked, "warrior", { r: 1, c: 7 }, "", { deadEnemies: ["1,3"] }).trace.ok,
  false,
  "Felling the shield must let the flame reach the camp behind it.",
);

// A wall stops the flame outright.
const walledFlame = huntLevel({
  map: ["#########", "#D.#...T#", "#T.....T#", "#########"],
  facing: [".........", ".>.......", ".........", "........."],
});
assert.equal(runRoute(walledFlame, "warrior", { r: 1, c: 7 }, "").trace.ok, true, "A wall must cap the flame lane.");
assert.equal(runRoute(walledFlame, "warrior", { r: 2, c: 1 }, "RU").trace.ok, false, "The tile before the wall must still burn.");

// ---------------------------------------------------------------------------
// Shared state across routes (D3, D6).
// ---------------------------------------------------------------------------

const SHARED_MAP = ["#######", "#T.n.T#", "#.....#", "#T....#", "#######"];
const SHARED_FACING = [".......", "...v...", ".......", ".......", "......."];
const shared = huntLevel({ map: SHARED_MAP, facing: SHARED_FACING });

// A felled enemy leaves a plain walkable tile behind.
const overCorpse = runRoute(shared, "rogue", { r: 1, c: 5 }, "LL", { deadEnemies: ["1,3"] });
assert.equal(overCorpse.trace.ok, true, "A later hero must be able to walk over a felled enemy.");
assert.deepEqual(killedBy(overCorpse.trace), [], "Walking over a corpse must not re-kill it.");

// Earlier resting tiles and later camps are solid.
const ontoResting = runRoute(shared, "rogue", { r: 1, c: 5 }, "L", { deadEnemies: ["1,3"], occupied: ["1,4"] });
assert.equal(ontoResting.trace.ok, false, "An earlier hero's resting tile must block the route.");
assert.match(ontoResting.trace.reason, /Another hunter/, "An occupied tile must name the hunter holding it.");

// Self-crossing is still forbidden even though foreign trails may be crossed.
const selfCross = runRoute(shared, "warrior", { r: 3, c: 1 }, "URDL");
assert.equal(selfCross.trace.ok, false, "A route must still never cross itself.");
assert.match(selfCross.trace.reason, /cannot cross itself/, "Self-crossing must keep its original wording.");

// heroPlanContext threads the snapshots, and trails may share tiles.
const crossing = heroPlanContext(shared, {
  order: ["warrior", "rogue", "mage"],
  assignment: { warrior: { r: 3, c: 1 }, rogue: { r: 1, c: 5 }, mage: { r: 1, c: 1 } },
  paths: {
    // The warrior climbs to the goblin through 2,3; the rogue later crosses that same
    // square on its way west, which hunt mode permits and convoy mode never did.
    warrior: pathFromDirections(shared, "RURU", huntCommander(shared, "warrior", { r: 3, c: 1 })),
    rogue: pathFromDirections(shared, "DLL", huntCommander(shared, "rogue", { r: 1, c: 5 })),
    mage: pathFromDirections(shared, "", huntCommander(shared, "mage", { r: 1, c: 1 })),
  },
});
assert.deepEqual(
  crossing.entries.map((entry) => entry.trace.ok),
  [true, true, true],
  "Two trails must be allowed to cross the same square.",
);
assert.ok(crossing.entries[0].path.some((step) => keyOf(step) === "2,3"), "The warrior must pass through the shared square.");
assert.ok(crossing.entries[1].path.some((step) => keyOf(step) === "2,4"), "The rogue must reach its own square.");
assert.deepEqual([...crossing.deadEnemies], ["1,3"], "The party's kills must accumulate across routes.");
assert.equal(crossing.solved, true, "Clearing every enemy from distinct camps must count as solved.");

// A later hero's camp is reserved while the earlier hero draws.
const intoLaterCamp = heroPlanContext(shared, {
  order: ["warrior", "rogue", "mage"],
  assignment: { warrior: { r: 3, c: 1 }, rogue: { r: 1, c: 5 }, mage: { r: 1, c: 1 } },
  paths: { warrior: pathFromDirections(shared, "UU", huntCommander(shared, "warrior", { r: 3, c: 1 })) },
});
assert.equal(intoLaterCamp.entries[0].trace.ok, false, "A hero must not park on a camp a later hero still needs.");
assert.match(intoLaterCamp.entries[0].trace.reason, /Another hunter/, "A reserved camp must explain itself.");

// Two heroes on one camp is never a plan.
const doubleBooked = heroPlanContext(shared, {
  order: ["warrior", "rogue", "mage"],
  assignment: { warrior: { r: 3, c: 1 }, rogue: { r: 3, c: 1 }, mage: { r: 1, c: 1 } },
  paths: {},
});
assert.equal(doubleBooked.distinctCamps, false, "Two heroes may not share a camp.");
assert.equal(doubleBooked.solved, false, "A double-booked plan can never be solved.");

assert.equal(allEnemiesDead(shared, new Set(["1,3"])), true, "Clearing the roster must satisfy the win predicate.");
assert.equal(allEnemiesDead(shared, new Set()), false, "An untouched roster must not satisfy the win predicate.");

// ---------------------------------------------------------------------------
// Determinism: repeat traces and manual replay must agree exactly.
// ---------------------------------------------------------------------------

function verifyHuntReplay(level, path, options, label) {
  const trace = tracePath(level, path, options);
  assert.equal(trace.ok, true, `${label} must compile into a legal trace.`);
  assert.deepEqual(tracePath(level, path, options), trace, `${label} must trace identically when repeated.`);
  assert.deepEqual(simulatePath(level, path, options), trace, `${label} must share the simulatePath contract.`);

  let replayState = createPartyState(options.commander?.initial);
  trace.steps.forEach((step, index) => {
    assert.deepEqual(step.before, replayState, `${label} step ${index} must begin at the replay state.`);
    const replayed = advanceState(level, replayState, step.position, {
      commander: options.commander,
      countMove: index > 0,
      previous: path[index - 2],
      from: path[index - 1],
      hunt: options.hunt,
    });
    assert.equal(replayed.ok, true, `${label} step ${index} must replay successfully.`);
    assert.deepEqual(replayed.events, step.events, `${label} step ${index} must preserve newly emitted event order.`);
    assert.deepEqual(replayed.state, step.after, `${label} step ${index} must reach the traced after snapshot.`);
    replayState = replayed.state;
  });
  assert.deepEqual(replayState, trace.state, `${label} replay must reach the compiled final state.`);
  const orderedEvents = [...trace.initialState.events, ...trace.steps.flatMap((step) => step.events)];
  assert.deepEqual(orderedEvents, trace.state.events, `${label} trace events must match final-state event history exactly.`);
}

const determinism = huntLevel({ map: QUEUE_MAP, facing: QUEUE_FACING, mana: 2 });
const determinismRoute = runRoute(determinism, "mage", { r: 1, c: 1 }, "R");
verifyHuntReplay(determinism, determinismRoute.path, determinismRoute.options, "A mage bolting down a corridor");

const meleeReplay = runRoute(meleeLevel, "warrior", ARENA_CAMP, "RRDD");
verifyHuntReplay(meleeLevel, meleeReplay.path, meleeReplay.options, "A warrior charging the centre");

// Kills recorded in one trace must never leak into another.
const isolated = runRoute(determinism, "mage", { r: 1, c: 1 }, "");
assert.deepEqual(killedBy(isolated.trace), ["1,3"], "A fresh trace must start from an untouched roster.");

// ---------------------------------------------------------------------------
// Order dependence (the deliberate inverse of the convoy order-invariance rule).
// ---------------------------------------------------------------------------

// The goblin in the south-east pocket can only be reached by a bolt fired from the
// camp at 1,7 - and that camp sits inside the dragon's flame until the dragon dies.
// So the warrior must make its kill before the mage can even take up its post.
const ORDER_LEVEL = huntLevel({
  map: [
    "#########",
    "#...D..T#",
    "#.#####.#",
    "#T#####n#",
    "#T#######",
    "#########",
  ],
  facing: [
    ".........",
    "....>....",
    ".........",
    ".......v.",
    ".........",
    ".........",
  ],
  warrior: 5,
  rogue: 0,
  mage: 0,
  mana: 1,
});

const forward = analyzeLevel(ORDER_LEVEL, { solutionLimit: 1, forceOrder: ["warrior", "rogue", "mage"] });
assert.equal(forward.solvable, true, "The witness level must be solvable when the warrior clears the way first.");

const reversed = analyzeLevel(ORDER_LEVEL, { solutionLimit: 1, forceOrder: ["mage", "rogue", "warrior"] });
assert.equal(reversed.solvable, false, "The same level must be unsolvable when the mage spends its bolt too early.");
assert.equal(reversed.metrics.aborted, false, "The unsolvable order must be proven by exhaustion, not by a node limit.");

// And the free solver finds the order on its own.
const free = analyzeLevel(ORDER_LEVEL, { solutionLimit: 1 });
assert.equal(free.solvable, true, "The solver must discover a working order unaided.");
assert.equal(free.solutions[0].order.indexOf("warrior") < free.solutions[0].order.indexOf("mage"), true, "Its solution must send the warrior before the mage.");

// The solver's own answer must survive a replay through the shared plan helper.
const witness = free.solutions[0];
const replayed = heroPlanContext(ORDER_LEVEL, {
  order: witness.order,
  assignment: witness.assignment,
  paths: Object.fromEntries(witness.routes.map((route) => [route.heroId, route.path])),
});
assert.equal(replayed.solved, true, "A solver solution must replay to a solved plan.");
assert.equal(allEnemiesDead(ORDER_LEVEL, replayed.deadEnemies), true, "A solver solution must clear every enemy.");

// ---------------------------------------------------------------------------
// Solver hygiene.
// ---------------------------------------------------------------------------

const arena = huntLevel({ map: ARENA_MAP, facing: [".......", ".......", ".......", "...v...", ".......", ".......", "......."] });
const arenaAnalysis = analyzeLevel(arena, { solutionLimit: 1, nodeLimit: 500_000 });
assert.equal(arenaAnalysis.solvable, true, "An open arena must be solvable.");
assert.equal(arenaAnalysis.metrics.aborted, false, "An open arena must not exhaust the node limit.");
assert.equal(arenaAnalysis.solutions[0].routes.length, 3, "Every hero must be given a route, even a standing one.");
assert.equal(
  new Set(Object.values(arenaAnalysis.solutions[0].assignment).map(keyOf)).size,
  3,
  "A solution must post the three heroes to distinct camps.",
);

// Emit-and-stop: the search never keeps walking a hero once the roster is already
// clear. It is a satisfiability search, so earlier routes may still wander.
const cleared = new Set();
for (const route of arenaAnalysis.solutions[0].routes) {
  const alreadyDone = allEnemiesDead(arena, cleared);
  if (alreadyDone) {
    assert.equal(route.path.length - 1, 0, `The ${route.heroId} must stay home once the hunt is already over.`);
  }
  route.state.kills.forEach((id) => cleared.add(id));
}
assert.equal(allEnemiesDead(arena, cleared), true, "A reported solution must actually clear the roster.");

// ---------------------------------------------------------------------------
// The board's hazard overlay must be the same geometry the rules enforce.
// ---------------------------------------------------------------------------

// huntHazards() exists so the UI never re-derives threat rules. Bind the two: for every
// hero, on every walkable square of every shipped hunt level, "the overlay paints this
// lethal" must agree exactly with "the engine refuses to step here".
for (const raw of HUNTERS_MOON_RAW) {
  const level = parseLevel(raw);
  for (const heroId of ["warrior", "rogue", "mage"]) {
    for (const deadEnemies of [new Set(), new Set(level.enemies.slice(0, 1).map((enemy) => enemy.id))]) {
      const { lethal, guarded, flame } = huntHazards(level, deadEnemies, heroId);
      for (const key of [...guarded, ...flame]) {
        assert.equal(typeof key, "string", "Hazard sets must be keyed by position.");
      }
      for (let r = 0; r < level.height; r += 1) {
        for (let c = 0; c < level.width; c += 1) {
          const position = { r, c };
          const key = keyOf(position);
          if (!TILE_DEFS[level.rows[r][c]]?.walkable) continue;
          if (level.enemies.some((enemy) => enemy.id === key && !deadEnemies.has(key))) continue;

          // Ask the engine directly: may this hero stand here?
          const commander = huntCommander(level, heroId, position);
          const stood = tracePath(level, [position], { commander, hunt: { deadEnemies, occupied: new Set() } });
          const refusedByHazard = !stood.ok && /orc is watching|dragon's flame/.test(stood.reason ?? "");
          assert.equal(
            lethal.has(key),
            refusedByHazard,
            `${level.name}: the board and the rules disagree about ${key} for the ${heroId}.`,
          );
        }
      }
      // Flame burns every class; only the orc's stare is class-aware.
      assert.equal([...flame].every((key) => lethal.has(key)), true, "Flame must be lethal to every hunter.");
      if (heroId === "warrior") {
        assert.equal([...guarded].some((key) => lethal.has(key) && !flame.has(key)), false, "A guarded square must not stop the warrior.");
      }
    }
  }
}

// DIRECTIONS order is load-bearing for D4 and must not be reshuffled.
assert.deepEqual(DIRECTIONS.map((direction) => direction.code), ["U", "R", "D", "L"], "Mage scan order depends on the DIRECTIONS sequence.");

console.log("✓ Hunt mechanics: backstab geometry · line-of-sight determinism · class-aware threats · shared kill state · order dependence");
