export const TILE_DEFS = Object.freeze({
  "#": { type: "wilds", walkable: false, label: "Thick wilds" },
  ".": { type: "meadow", walkable: true, label: "Meadow" },
  S: { type: "start", walkable: true, label: "Commander" },
  G: { type: "goal", walkable: true, label: "Royal banner" },
  r: { type: "recruit", walkable: true, amount: 1, label: "1 soldier" },
  R: { type: "recruit", walkable: true, amount: 2, label: "2 soldiers" },
  g: { type: "goblin", walkable: true, cost: 1, label: "Goblin · needs 1 soldier" },
  o: { type: "goblin", walkable: true, cost: 2, label: "Orc · needs 2 soldiers" },
  t: { type: "goblin", walkable: true, cost: 3, label: "Ogre · needs 3 soldiers" },
  m: { type: "mage", walkable: true, label: "Mage" },
  d: { type: "dragon", walkable: true, label: "Dragon · needs a mage" },
  b: { type: "builder", walkable: true, label: "Builder" },
  "~": { type: "river", walkable: true, label: "River · needs a builder" },
  // The Second Wind: this is the pack's only new recruit type.
  f: { type: "healer", walkable: true, label: "Field healer · restores every tired soldier" },
  // Formation Checkpoints: only the ready-soldier count is inspected; nothing is spent.
  "1": { type: "formation", walkable: true, required: 1, label: "Formation checkpoint · exactly 1 ready soldier" },
  "2": { type: "formation", walkable: true, required: 2, label: "Formation checkpoint · exactly 2 ready soldiers" },
  "3": { type: "formation", walkable: true, required: 3, label: "Formation checkpoint · exactly 3 ready soldiers" },
  // The Grand Maneuver: route markers resolve only when the route departs them.
  i: { type: "stride", walkable: true, label: "Stride Marker · continue straight through" },
  p: { type: "pivot", walkable: true, label: "Pivot Marker · make a right-angle turn" },
  a: { type: "aegis", walkable: true, label: "Aegis Bearer · protects one battle" },
  y: { type: "switch", walkable: true, channel: "sun", label: "Sun switch" },
  Y: { type: "gate", walkable: true, channel: "sun", label: "Sun gate" },
  q: { type: "switch", walkable: true, channel: "moon", label: "Moon switch" },
  Q: { type: "gate", walkable: true, channel: "moon", label: "Moon gate" },

  // Relief Routes: monsters are fed from orthogonally adjacent route tiles.
  h: { type: "hungry", walkable: false, need: 1, label: "Hungry mossling · needs 1 meal" },
  H: { type: "hungry", walkable: false, need: 2, label: "Hungry emberling · needs 2 meals" },

  // Three Banners: three specialist commanders and their matching standards.
  A: { type: "commanderStart", walkable: true, commander: "captain", label: "Captain Alder" },
  X: { type: "commanderGoal", walkable: true, commander: "captain", label: "Alder's red standard" },
  B: { type: "commanderStart", walkable: true, commander: "warden", label: "Warden Bramble" },
  Z: { type: "commanderGoal", walkable: true, commander: "warden", label: "Bramble's blue standard" },
  C: { type: "commanderStart", walkable: true, commander: "sage", label: "Sage Cinder" },
  V: { type: "commanderGoal", walkable: true, commander: "sage", label: "Cinder's violet standard" },
  "*": { type: "beacon", walkable: true, label: "Rally beacon" },
  w: { type: "mud", walkable: true, moveCost: 2, label: "Deep mud · costs 2 movement" },
  c: { type: "supply", walkable: true, bonusMoves: 2, label: "Supply cache · grants 2 movement" },
  ">": { type: "current", walkable: true, force: "R", label: "Eastward marching arrow" },
  "<": { type: "current", walkable: true, force: "L", label: "Westward marching arrow" },
  "^": { type: "current", walkable: true, force: "U", label: "Northward marching arrow" },
  v: { type: "current", walkable: true, force: "D", label: "Southward marching arrow" },

  // The Hunters' Moon: camps the party starts from and the quarry it must clear.
  // These stay walkable so the solver keeps generating candidates; whether a hero
  // may actually stand here is decided by the hunt step logic, like gates today.
  T: { type: "camp", walkable: true, label: "Hunters' camp" },
  n: { type: "huntEnemy", walkable: true, enemy: "goblin", label: "Goblin" },
  O: { type: "huntEnemy", walkable: true, enemy: "orc", label: "Orc · guards the tile it watches" },
  D: { type: "huntEnemy", walkable: true, enemy: "dragon", label: "Dragon · breathes a lane of flame" },
});

// Hunt facing grids are authored with arrows so a level reads correctly by eye.
const HUNT_FACING_CODES = Object.freeze({ "^": "U", ">": "R", v: "D", "<": "L" });

const HUNT_HERO_IDS = Object.freeze(["warrior", "rogue", "mage"]);

export const DIRECTIONS = Object.freeze([
  { code: "U", dr: -1, dc: 0, name: "north" },
  { code: "R", dr: 0, dc: 1, name: "east" },
  { code: "D", dr: 1, dc: 0, name: "south" },
  { code: "L", dr: 0, dc: -1, name: "west" },
]);

const DIRECTION_BY_CODE = new Map(DIRECTIONS.map((direction) => [direction.code, direction]));

export function keyOf(position) {
  return `${position.r},${position.c}`;
}

export function samePosition(a, b) {
  return Boolean(a && b && a.r === b.r && a.c === b.c);
}

export function isAdjacent(a, b) {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
}

function findExactlyOne(rows, tileCode, levelId) {
  const matches = [];
  rows.forEach((row, r) => row.forEach((code, c) => {
    if (code === tileCode) matches.push({ r, c });
  }));
  if (matches.length !== 1) {
    throw new Error(`Level ${levelId} needs exactly one "${tileCode}" tile; found ${matches.length}.`);
  }
  return matches[0];
}

// The facing grid runs parallel to the map: an arrow on every enemy cell, a dot
// everywhere else. Mismatches are authoring bugs, so they fail loudly.
function parseHuntFacing(level, rows, height, width) {
  if (!Array.isArray(level.facing) || level.facing.length !== height) {
    throw new Error(`Hunt level ${level.id} needs a facing grid with ${height} rows.`);
  }
  return level.facing.map((row, r) => {
    const cells = [...row];
    if (cells.length !== width) {
      throw new Error(`Hunt level ${level.id} facing row ${r} must be ${width} cells wide; found ${cells.length}.`);
    }
    return cells.map((cell, c) => {
      const isEnemy = TILE_DEFS[rows[r][c]]?.type === "huntEnemy";
      if (!isEnemy) {
        if (cell !== ".") {
          throw new Error(`Hunt level ${level.id} has a facing arrow at ${r},${c} with no enemy on it.`);
        }
        return null;
      }
      const facing = HUNT_FACING_CODES[cell];
      if (!facing) {
        throw new Error(`Hunt level ${level.id} needs a facing arrow (^ > v <) at ${r},${c}; found "${cell}".`);
      }
      return facing;
    });
  });
}

function parseHuntHeroes(level) {
  const heroes = Array.isArray(level.heroes) ? level.heroes : [];
  const ids = heroes.map((hero) => hero.id);
  if (ids.length !== HUNT_HERO_IDS.length || HUNT_HERO_IDS.some((id) => !ids.includes(id))) {
    throw new Error(`Hunt level ${level.id} needs exactly the heroes ${HUNT_HERO_IDS.join(", ")}.`);
  }
  return HUNT_HERO_IDS.map((id) => {
    const hero = heroes.find((candidate) => candidate.id === id);
    if (!Number.isInteger(hero.maxMoves) || hero.maxMoves < 0) {
      throw new Error(`Hunt level ${level.id} needs a non-negative maxMoves for the ${id}.`);
    }
    return { ...hero, initial: { mana: hero.mana ?? 0 } };
  });
}

export function parseLevel(level) {
  const rows = level.map.map((row) => [...row]);
  const height = rows.length;
  const width = rows[0]?.length ?? 0;

  if (!height || !width || rows.some((row) => row.length !== width)) {
    throw new Error(`Level ${level.id} has an invalid rectangular map.`);
  }

  const targets = [];
  const beacons = [];
  rows.forEach((row, r) => {
    row.forEach((tile, c) => {
      const def = TILE_DEFS[tile];
      if (!def) throw new Error(`Unknown tile "${tile}" in level ${level.id}.`);
      if (def.type === "hungry") targets.push({ r, c, need: def.need, tile });
      if (def.type === "beacon") beacons.push({ r, c });
    });
  });

  if (level.mode === "convoy") {
    if (!Array.isArray(level.commanders) || level.commanders.length < 2) {
      throw new Error(`Convoy level ${level.id} needs at least two commanders.`);
    }
    const commanders = level.commanders.map((commander) => ({
      ...commander,
      start: findExactlyOne(rows, commander.startTile, level.id),
      goal: findExactlyOne(rows, commander.goalTile, level.id),
      initial: { ...(commander.initial ?? {}) },
    }));
    return {
      ...level,
      rows,
      width,
      height,
      commanders,
      start: commanders[0].start,
      goal: commanders[0].goal,
      targets,
      beacons,
    };
  }

  if (level.mode === "hunt") {
    const facingRows = parseHuntFacing(level, rows, height, width);
    const camps = [];
    const enemies = [];
    rows.forEach((row, r) => {
      row.forEach((tile, c) => {
        const def = TILE_DEFS[tile];
        if (def.type === "camp") camps.push({ r, c });
        if (def.type === "huntEnemy") {
          enemies.push({ id: keyOf({ r, c }), r, c, type: def.enemy, facing: facingRows[r][c] });
        }
      });
    });

    if (camps.length < 3) {
      throw new Error(`Hunt level ${level.id} needs at least three camps ("T"); found ${camps.length}.`);
    }
    if (!enemies.length) {
      throw new Error(`Hunt level ${level.id} needs at least one enemy to hunt.`);
    }

    const heroes = parseHuntHeroes(level);
    return {
      ...level,
      rows,
      width,
      height,
      camps,
      enemies,
      heroes,
      start: camps[0],
      goal: null,
      targets,
      beacons,
    };
  }

  const start = findExactlyOne(rows, "S", level.id);
  const goal = findExactlyOne(rows, "G", level.id);
  if (level.mode === "relief" && (!Number.isInteger(level.maxMoves) || level.maxMoves < 1)) {
    throw new Error(`Relief level ${level.id} needs a positive maxMoves budget.`);
  }
  return { ...level, rows, width, height, start, goal, targets, beacons };
}

export function createPartyState(initial = {}) {
  return {
    soldiers: initial.soldiers ?? 0,
    tired: initial.tired ?? 0,
    mages: initial.mages ?? 0,
    builders: initial.builders ?? 0,
    healers: initial.healers ?? 0,
    aegis: initial.aegis ?? 0,
    switches: new Set(initial.switches ?? []),
    deliveries: new Map(initial.deliveries ?? []),
    beacons: new Set(initial.beacons ?? []),
    mana: initial.mana ?? 0,
    kills: new Set(initial.kills ?? []),
    moves: initial.moves ?? 0,
    bonusMoves: initial.bonusMoves ?? 0,
    events: (initial.events ?? []).map(cloneEvent),
  };
}

export function clonePartyState(state) {
  return createPartyState(state);
}

function cloneEvent(event) {
  const cloned = { ...event };
  if (event.position) cloned.position = { ...event.position };
  if (event.from) cloned.from = { ...event.from };
  if (event.incoming) cloned.incoming = { ...event.incoming };
  if (event.outgoing) cloned.outgoing = { ...event.outgoing };
  if (event.targets) cloned.targets = event.targets.map((target) => ({ ...target }));
  return cloned;
}

function failedTransition(reason) {
  return { ok: false, reason, events: [], event: null };
}

export function enterTile(state, tileCode, position) {
  const tile = TILE_DEFS[tileCode];
  if (!tile?.walkable) {
    return failedTransition(tile?.type === "hungry" ? "March beside the monster to deliver a meal." : "The thicket is too dense to cross.");
  }

  const next = clonePartyState(state);
  const eventStart = next.events.length;
  const baseEvent = { type: tile.type, tile: tileCode, position: { ...position } };

  switch (tile.type) {
    case "recruit":
      next.soldiers += tile.amount;
      next.events.push({ ...baseEvent, amount: tile.amount });
      break;
    case "goblin":
      if (next.soldiers < tile.cost) {
        const plural = tile.cost === 1 ? "soldier" : "soldiers";
        return failedTransition(`This goblin guard needs ${tile.cost} ready ${plural} — you have ${next.soldiers}.`);
      }
      if (next.aegis > 0) {
        next.aegis -= 1;
        next.events.push({ ...baseEvent, cost: tile.cost, protected: true, aegisUsed: 1 });
      } else {
        next.soldiers -= tile.cost;
        next.tired += tile.cost;
        next.events.push({ ...baseEvent, cost: tile.cost });
      }
      break;
    case "mage":
      next.mages += 1;
      next.events.push(baseEvent);
      break;
    case "dragon":
      if (next.mages < 1) return failedTransition("Recruit the mage before facing this dragon.");
      next.mages -= 1;
      next.events.push(baseEvent);
      break;
    case "builder":
      next.builders += 1;
      next.events.push(baseEvent);
      break;
    case "healer": {
      const restored = next.tired;
      next.healers += 1;
      next.soldiers += restored;
      next.tired = 0;
      next.events.push({ ...baseEvent, restored });
      break;
    }
    case "aegis":
      next.aegis += 1;
      next.events.push({ ...baseEvent, amount: 1 });
      break;
    case "formation": {
      const actual = next.soldiers;
      if (actual !== tile.required) {
        const requiredUnit = tile.required === 1 ? "soldier" : "soldiers";
        const actualUnit = actual === 1 ? "soldier" : "soldiers";
        return failedTransition(
          `Formation checkpoint requires exactly ${tile.required} ready ${requiredUnit} — you have ${actual} ready ${actualUnit}.`,
        );
      }
      next.events.push({ ...baseEvent, required: tile.required, actual });
      break;
    }
    case "river":
      if (next.builders < 1) return failedTransition("A builder is needed to lay a safe bridge here.");
      next.builders -= 1;
      next.events.push(baseEvent);
      break;
    case "switch":
      next.switches.add(tile.channel);
      next.events.push({ ...baseEvent, channel: tile.channel });
      break;
    case "gate": {
      if (!next.switches.has(tile.channel)) {
        const name = tile.channel === "sun" ? "Sun" : "Moon";
        return failedTransition(`The ${name} gate is shut. Find its matching switch first.`);
      }
      next.events.push({ ...baseEvent, channel: tile.channel });
      break;
    }
    case "beacon":
      next.beacons.add(keyOf(position));
      next.events.push(baseEvent);
      break;
    case "mud":
      next.events.push(baseEvent);
      break;
    case "supply":
      next.bonusMoves += tile.bonusMoves;
      next.events.push({ ...baseEvent, bonusMoves: tile.bonusMoves });
      break;
    case "current":
      next.events.push({ ...baseEvent, force: tile.force });
      break;
    case "goal":
    case "commanderGoal":
      next.events.push(baseEvent);
      break;
    default:
      break;
  }

  const events = next.events.slice(eventStart).map(cloneEvent);
  return { ok: true, state: next, events, event: events.at(-1) ?? null };
}

export function deliveriesComplete(level, state) {
  return level.targets.every((target) => (state.deliveries.get(keyOf(target)) ?? 0) >= target.need);
}

export function beaconsComplete(level, beaconSet) {
  return level.beacons.every((beacon) => beaconSet.has(keyOf(beacon)));
}

export function movementLimit(level, commander = null, state = null) {
  const base = commander?.maxMoves ?? level.maxMoves ?? Number.POSITIVE_INFINITY;
  return base + (state?.bonusMoves ?? 0);
}

function routeVector(from, to) {
  if (!from || !to) return null;
  return { dr: to.r - from.r, dc: to.c - from.c };
}

function isCardinalUnitVector(vector) {
  return Boolean(vector) && Math.abs(vector.dr) + Math.abs(vector.dc) === 1;
}

function markerDeparture(level, state, previous, from, to) {
  const tileCode = from ? level.rows[from.r]?.[from.c] : null;
  const tile = TILE_DEFS[tileCode];
  if (!tile || !["stride", "pivot"].includes(tile.type)) {
    return { ok: true, state, events: [] };
  }

  const incoming = routeVector(previous, from);
  const outgoing = routeVector(from, to);
  if (!isCardinalUnitVector(incoming) || !isCardinalUnitVector(outgoing)) {
    return failedTransition(
      tile.type === "stride"
        ? "Enter the Stride Marker before choosing its straight departure."
        : "Enter the Pivot Marker before choosing its right-angle departure.",
    );
  }

  const straight = incoming.dr === outgoing.dr && incoming.dc === outgoing.dc;
  const perpendicular = incoming.dr * outgoing.dr + incoming.dc * outgoing.dc === 0;
  if (tile.type === "stride" && !straight) {
    return failedTransition("Continue straight through the Stride Marker in the direction you entered.");
  }
  if (tile.type === "pivot" && !perpendicular) {
    return failedTransition("Make a right-angle turn when leaving the Pivot Marker.");
  }

  const next = clonePartyState(state);
  const event = {
    type: tile.type,
    tile: tileCode,
    position: { ...from },
    incoming,
    outgoing,
  };
  next.events.push(event);
  return { ok: true, state: next, events: [cloneEvent(event)], event: cloneEvent(event) };
}

// Living quarry, keyed by position: every enemy the level declared, minus the ones
// earlier heroes felled (options.hunt.deadEnemies) and the ones this route felled.
function huntAlive(level, options, state) {
  const dead = new Set(options.hunt?.deadEnemies ?? []);
  state?.kills?.forEach((id) => dead.add(id));
  const alive = new Map();
  for (const enemy of level.enemies) {
    if (!dead.has(enemy.id)) alive.set(enemy.id, enemy);
  }
  return alive;
}

// Walls stop a ray; so does a living enemy. Dead enemies are transparent, and the
// callback decides whether the blocking enemy matters (LOS kills it, flame stops on it).
function huntRay(level, origin, direction, alive, onCell) {
  let r = origin.r + direction.dr;
  let c = origin.c + direction.dc;
  while (true) {
    const tile = TILE_DEFS[level.rows[r]?.[c]];
    if (!tile?.walkable) return;
    const key = keyOf({ r, c });
    const enemy = alive.get(key);
    if (onCell({ r, c }, key, enemy) === false) return;
    if (enemy) return;
    r += direction.dr;
    c += direction.dc;
  }
}

// Hazards projected by the living creatures, split by the source that projects them so
// the board can draw a guarded square and a flame lane differently. `lethal` is the set
// the rules actually enforce for this hero: flame burns everyone, an orc's stare spares
// the warrior. Computed from the living set, so a lane goes cold the moment its owner dies.
function huntHazardsFromAlive(level, alive, heroId) {
  const guarded = new Set();
  const flame = new Set();
  for (const enemy of alive.values()) {
    const direction = DIRECTION_BY_CODE.get(enemy.facing);
    if (!direction) continue;
    if (enemy.type === "orc") {
      const front = { r: enemy.r + direction.dr, c: enemy.c + direction.dc };
      if (TILE_DEFS[level.rows[front.r]?.[front.c]]?.walkable) guarded.add(keyOf(front));
    } else if (enemy.type === "dragon") {
      // A living creature soaks the flame, so its own tile stays safe to strike.
      huntRay(level, enemy, direction, alive, (_position, key, blocker) => {
        if (blocker) return false;
        flame.add(key);
      });
    }
  }
  const lethal = new Set(flame);
  if (heroId !== "warrior") guarded.forEach((key) => lethal.add(key));
  return { guarded, flame, lethal };
}

function huntThreat(level, alive, heroId) {
  return huntHazardsFromAlive(level, alive, heroId).lethal;
}

// The board draws hazards from this, so the overlay can never disagree with the rule.
// `deadEnemies` must be the snapshot this hero actually walks into — the kills of the
// hunters before it, not the whole party's eventual tally.
export function huntHazards(level, deadEnemies, heroId = null) {
  const alive = huntAlive(level, { hunt: { deadEnemies } }, null);
  return huntHazardsFromAlive(level, alive, heroId);
}

function huntThreatReason(level, alive, heroId, key) {
  for (const enemy of alive.values()) {
    const direction = DIRECTION_BY_CODE.get(enemy.facing);
    if (!direction) continue;
    if (enemy.type === "orc" && heroId !== "warrior") {
      const front = { r: enemy.r + direction.dr, c: enemy.c + direction.dc };
      if (keyOf(front) === key) return "The orc is watching that square — only the warrior can walk into its guard.";
    }
    if (enemy.type === "dragon") {
      let hit = false;
      huntRay(level, enemy, direction, alive, (_position, cellKey, blocker) => {
        if (blocker) return false;
        if (cellKey === key) hit = true;
      });
      if (hit) return "That square lies in the dragon's flame.";
    }
  }
  return "That square is not safe to stand on.";
}

// Melee resolution. The warrior strikes from any side, the rogue only from behind,
// and the mage never at arm's length — the refusal text doubles as the player nudge.
function huntEnemyEntry(level, state, position, options, enemy) {
  const heroId = options.commander?.id ?? null;
  if (heroId === "mage") {
    return failedTransition("The mage cannot fight hand to hand — strike from a distance instead.");
  }
  if (heroId === "rogue") {
    const incoming = routeVector(options.from, position);
    const facing = DIRECTION_BY_CODE.get(enemy.facing);
    const behind = isCardinalUnitVector(incoming) && facing
      && incoming.dr === facing.dr && incoming.dc === facing.dc;
    if (!behind) {
      return failedTransition("The rogue only strikes from behind — approach from the way this enemy is looking.");
    }
  }
  const next = clonePartyState(state);
  next.kills.add(enemy.id);
  const event = {
    type: "huntKill",
    method: heroId === "rogue" ? "backstab" : "melee",
    enemyType: enemy.type,
    enemyId: enemy.id,
    position: { ...position },
  };
  next.events.push(event);
  return { ok: true, state: next, events: [cloneEvent(event)], event: cloneEvent(event) };
}

// D4: on every arrival, scan the four cardinals once in U,R,D,L order while mana lasts.
// Each ray kills at most one living enemy, so chained kills need a second arrival.
function huntMageScan(level, state, position, options) {
  let next = state;
  const events = [];
  for (const direction of DIRECTIONS) {
    if (next.mana <= 0) break;
    const alive = huntAlive(level, options, next);
    let victim = null;
    huntRay(level, position, direction, alive, (_cell, _key, enemy) => {
      if (enemy) victim = enemy;
    });
    if (!victim) continue;
    next = clonePartyState(next);
    next.mana -= 1;
    next.kills.add(victim.id);
    const event = {
      type: "bolt",
      direction: direction.code,
      enemyType: victim.type,
      enemyId: victim.id,
      from: { ...position },
      position: { r: victim.r, c: victim.c },
    };
    next.events.push(event);
    events.push(cloneEvent(event));
  }
  return { state: next, events };
}

export function allEnemiesDead(level, deadSet) {
  const dead = deadSet instanceof Set ? deadSet : new Set(deadSet ?? []);
  return (level.enemies ?? []).every((enemy) => dead.has(enemy.id));
}

function feedAdjacentTargets(level, state, position) {
  const fed = [];
  for (const target of level.targets) {
    if (!isAdjacent(position, target)) continue;
    const targetKey = keyOf(target);
    const before = state.deliveries.get(targetKey) ?? 0;
    if (before >= target.need) continue;
    const after = before + 1;
    state.deliveries.set(targetKey, after);
    fed.push({ ...target, delivered: after });
  }
  return fed;
}

export function advanceState(level, state, position, options = {}) {
  const tileCode = level.rows[position.r]?.[position.c];
  const tile = TILE_DEFS[tileCode];
  const commander = options.commander ?? null;
  if (!tile) return failedTransition("That square lies beyond the map.");
  if (tile.type === "commanderGoal" && tile.commander !== commander?.id) {
    return failedTransition("That standard belongs to another commander.");
  }

  const isHunt = level.mode === "hunt";
  const alive = isHunt ? huntAlive(level, options, state) : null;
  const positionKey = keyOf(position);
  if (isHunt) {
    if (options.hunt?.occupied?.has(positionKey)) {
      return failedTransition("Another hunter is holding that square.");
    }
    const threat = huntThreat(level, alive, commander?.id);
    if (threat.has(positionKey)) {
      return failedTransition(huntThreatReason(level, alive, commander?.id, positionKey));
    }
  }

  const departure = markerDeparture(level, state, options.previous, options.from, position);
  if (!departure.ok) return departure;

  const transition = enterTile(departure.state, tileCode, position);
  if (!transition.ok) return transition;
  let next = transition.state;
  const huntEvents = [];

  if (isHunt && tile.type === "huntEnemy" && alive.has(positionKey)) {
    const strike = huntEnemyEntry(level, next, position, options, alive.get(positionKey));
    if (!strike.ok) return strike;
    next = strike.state;
    huntEvents.push(...strike.events);
  }

  if (options.countMove !== false) next.moves += tile.moveCost ?? 1;

  const fed = level.mode === "relief" ? feedAdjacentTargets(level, next, position) : [];
  const limit = movementLimit(level, commander, next);
  if (next.moves > limit) {
    return failedTransition(`That route costs ${next.moves} movement — the limit is ${limit}.`);
  }
  if (tile.type === "goal" && level.mode === "relief" && !deliveriesComplete(level, next)) {
    const remaining = level.targets.filter((target) => (next.deliveries.get(keyOf(target)) ?? 0) < target.need).length;
    return failedTransition(`${remaining} hungry monster${remaining === 1 ? " still needs" : "s still need"} a delivery before the banner.`);
  }

  if (isHunt && commander?.id === "mage") {
    const scan = huntMageScan(level, next, position, options);
    next = scan.state;
    huntEvents.push(...scan.events);
  }

  const events = [...departure.events, ...transition.events, ...huntEvents].map(cloneEvent);
  if (fed.length) {
    const deliveryEvent = { type: "delivery", targets: fed, position: { ...position } };
    next.events.push(deliveryEvent);
    events.push(cloneEvent(deliveryEvent));
  }
  return { ok: true, state: next, events, event: events.at(-1) ?? null };
}

export function forcedDirectionAt(level, position) {
  const tile = TILE_DEFS[level.rows[position.r]?.[position.c]];
  return tile?.force ?? null;
}

export function moveAllowedFrom(level, from, to) {
  if (!isAdjacent(from, to)) return false;
  const forced = forcedDirectionAt(level, from);
  if (!forced) return true;
  const direction = DIRECTION_BY_CODE.get(forced);
  return to.r === from.r + direction.dr && to.c === from.c + direction.dc;
}

export function tracePath(level, path, options = {}) {
  const commander = options.commander ?? (level.mode === "convoy" ? level.commanders[0] : null);
  const start = commander?.start ?? level.start;
  const goal = commander?.goal ?? level.goal;
  let state = createPartyState(commander?.initial);
  const initialState = clonePartyState(state);
  const steps = [];
  if (!path.length || !samePosition(path[0], start)) {
    return {
      ok: false,
      initialState,
      state,
      steps,
      won: false,
      reason: level.mode === "hunt"
        ? "A route must begin at this hunter's camp."
        : "A route must begin on the active commander.",
    };
  }

  const visited = new Set();
  for (let index = 0; index < path.length; index += 1) {
    const position = path[index];
    const from = path[index - 1];
    const previous = path[index - 2];
    const positionKey = keyOf(position);
    if (visited.has(positionKey)) return { ok: false, initialState, state: clonePartyState(state), steps, won: false, reason: "The route cannot cross itself.", blockedIndex: index };
    if (from && !moveAllowedFrom(level, from, position)) {
      return { ok: false, initialState, state: clonePartyState(state), steps, won: false, reason: forcedDirectionAt(level, from) ? "Follow the marching arrow." : "Move one square up, down, left, or right.", blockedIndex: index };
    }
    const before = clonePartyState(state);
    const transition = advanceState(level, state, position, {
      commander,
      countMove: index > 0,
      previous,
      from,
      hunt: options.hunt,
    });
    if (!transition.ok) {
      return {
        ...transition,
        initialState,
        state: clonePartyState(state),
        steps,
        won: false,
        blockedIndex: index,
      };
    }
    state = transition.state;
    steps.push({
      index,
      position: { ...position },
      tile: level.rows[position.r][position.c],
      before,
      after: clonePartyState(state),
      events: transition.events.map(cloneEvent),
    });
    visited.add(positionKey);
    if (samePosition(position, goal) && index !== path.length - 1) {
      return { ok: false, initialState, state: clonePartyState(state), steps, won: false, reason: "The banner must be the final square.", blockedIndex: index };
    }
  }

  const finalTile = TILE_DEFS[level.rows[path.at(-1)?.r]?.[path.at(-1)?.c]];
  const pending = ["stride", "pivot"].includes(finalTile?.type);
  // A hunt route never wins on its own — the pack-wide kill count decides that, so a
  // legal route is simply a route that held together.
  const won = level.mode === "hunt"
    ? !pending
    : !pending && samePosition(path.at(-1), goal)
      && (level.mode !== "relief" || deliveriesComplete(level, state));
  return { ok: true, initialState, state: clonePartyState(state), steps, won, pending };
}

export function simulatePath(level, path, options = {}) {
  return tracePath(level, path, options);
}

// D1: a hero is just a convoy-style commander pinned to the camp the player picked,
// which is what lets the whole existing budget/route plumbing carry hunt mode.
export function huntCommander(level, heroId, camp) {
  const hero = (level.heroes ?? []).find((candidate) => candidate.id === heroId);
  if (!hero || !camp) return null;
  return {
    id: hero.id,
    name: hero.name,
    maxMoves: hero.maxMoves,
    start: { ...camp },
    goal: null,
    initial: { ...(hero.initial ?? {}) },
  };
}

function toLookup(value) {
  if (value instanceof Map) return value;
  return new Map(Object.entries(value ?? {}));
}

// D3: replays a whole party plan in order, handing each hero the snapshot of the world
// the heroes before it left behind. One helper so the board, the solver and the tests
// can never drift apart on what "the state route three sees" means.
export function heroPlanContext(level, plan = {}) {
  const assignment = toLookup(plan.assignment);
  const paths = toLookup(plan.paths);
  const order = plan.order ?? [...assignment.keys()];
  const deadEnemies = new Set();
  const resting = new Set();
  const entries = [];

  order.forEach((heroId, index) => {
    const camp = assignment.get(heroId) ?? null;
    const commander = huntCommander(level, heroId, camp);
    const occupied = new Set(resting);
    for (let later = index + 1; later < order.length; later += 1) {
      const laterCamp = assignment.get(order[later]);
      if (laterCamp) occupied.add(keyOf(laterCamp));
    }
    if (camp) occupied.delete(keyOf(camp));

    const options = { commander, hunt: { deadEnemies: new Set(deadEnemies), occupied } };
    const path = paths.get(heroId) ?? (camp ? [{ ...camp }] : []);
    const trace = commander ? tracePath(level, path, options) : null;
    if (trace?.ok) {
      trace.state.kills.forEach((id) => deadEnemies.add(id));
      resting.add(keyOf(path.at(-1)));
    }
    entries.push({ heroId, commander, camp, path, options, trace });
  });

  const campKeys = entries.filter((entry) => entry.camp).map((entry) => keyOf(entry.camp));
  const distinctCamps = campKeys.length === order.length && new Set(campKeys).size === order.length;
  const solved = distinctCamps
    && entries.length === (level.heroes?.length ?? 0)
    && entries.every((entry) => entry.trace?.ok)
    && allEnemiesDead(level, deadEnemies);

  return { entries, deadEnemies, distinctCamps, solved };
}

export function pathFromDirections(level, directions, commander = null) {
  const start = commander?.start ?? level.start;
  const path = [{ ...start }];
  for (const directionCode of directions) {
    const direction = DIRECTION_BY_CODE.get(directionCode);
    if (!direction) throw new Error(`Unknown direction ${directionCode}.`);
    const last = path.at(-1);
    path.push({ r: last.r + direction.dr, c: last.c + direction.dc });
  }
  return path;
}

export function directionsFromPath(path) {
  return path.slice(1).map((position, index) => {
    const previous = path[index];
    const direction = DIRECTIONS.find(({ dr, dc }) => position.r - previous.r === dr && position.c - previous.c === dc);
    return direction?.code ?? "?";
  }).join("");
}

function pathTurns(path) {
  const directions = directionsFromPath(path);
  let turns = 0;
  for (let index = 1; index < directions.length; index += 1) {
    if (directions[index] !== directions[index - 1]) turns += 1;
  }
  return turns;
}

function createMetrics(nodeLimit) {
  return {
    nodesExpanded: 0,
    deadEnds: 0,
    branchNodes: 0,
    totalLegalMoves: 0,
    maxBranching: 0,
    maxDepth: 0,
    pruned: 0,
    nodeLimit,
    aborted: false,
  };
}

function recordBranch(metrics, legalMoves, depth) {
  metrics.maxDepth = Math.max(metrics.maxDepth, depth);
  metrics.totalLegalMoves += legalMoves;
  metrics.maxBranching = Math.max(metrics.maxBranching, legalMoves);
  if (legalMoves > 1) metrics.branchNodes += 1;
  if (legalMoves === 0) metrics.deadEnds += 1;
}

function walkable(level, position) {
  return Boolean(TILE_DEFS[level.rows[position.r]?.[position.c]]?.walkable);
}

function enumerateSingleRoutes(level, commander, occupied, onSolution, control, metrics) {
  const start = commander?.start ?? level.start;
  const goal = commander?.goal ?? level.goal;
  const reserved = new Set(occupied ?? []);
  reserved.delete(keyOf(start));
  reserved.delete(keyOf(goal));
  const visited = new Set(reserved);
  visited.add(keyOf(start));
  const path = [{ ...start }];
  let initialTransition = advanceState(level, createPartyState(commander?.initial), start, { commander, countMove: false });
  if (!initialTransition.ok) return;

  function dfs(position, state) {
    if (metrics.aborted || control.stop) return;
    metrics.nodesExpanded += 1;
    if (metrics.nodesExpanded > metrics.nodeLimit) {
      metrics.aborted = true;
      return;
    }
    metrics.maxDepth = Math.max(metrics.maxDepth, path.length - 1);

    if (samePosition(position, goal)) {
      if (level.mode !== "relief" || deliveriesComplete(level, state)) onSolution(path, state);
      else metrics.deadEnds += 1;
      return;
    }

    const possibleDirections = forcedDirectionAt(level, position)
      ? [DIRECTION_BY_CODE.get(forcedDirectionAt(level, position))]
      : DIRECTIONS;
    const candidates = [];
    for (const direction of possibleDirections) {
      const next = { r: position.r + direction.dr, c: position.c + direction.dc };
      const nextKey = keyOf(next);
      if (visited.has(nextKey) || !walkable(level, next)) continue;
      const transition = advanceState(level, state, next, {
        commander,
        previous: path.at(-2),
        from: position,
      });
      if (!transition.ok) {
        metrics.pruned += 1;
        continue;
      }
      candidates.push({ next, nextKey, transition });
    }
    recordBranch(metrics, candidates.length, path.length - 1);

    for (const candidate of candidates) {
      visited.add(candidate.nextKey);
      path.push(candidate.next);
      dfs(candidate.next, candidate.transition.state);
      path.pop();
      visited.delete(candidate.nextKey);
      if (metrics.aborted || control.stop) return;
    }
  }

  dfs(start, initialTransition.state);
}

function analyzeSingleLevel(level, options, metrics) {
  const solutions = [];
  const control = { stop: false };
  enumerateSingleRoutes(level, null, new Set(), (path, state) => {
    solutions.push({ path: path.map((position) => ({ ...position })), state: clonePartyState(state) });
    if (solutions.length >= options.solutionLimit) control.stop = true;
  }, control, metrics);
  return { solutions, stoppedAtLimit: control.stop };
}

function convoyReserved(level, activeCommander, occupied) {
  const reserved = new Set(occupied);
  for (const commander of level.commanders) {
    if (commander.id === activeCommander.id) continue;
    reserved.add(keyOf(commander.start));
    reserved.add(keyOf(commander.goal));
  }
  return reserved;
}

function analyzeConvoyLevel(level, options, metrics) {
  const solutions = [];
  const control = { stop: false };
  const routeStack = [];

  function assignCommander(index, occupied, sharedBeacons) {
    if (metrics.aborted || control.stop) return;
    if (index === level.commanders.length) {
      if (!beaconsComplete(level, sharedBeacons)) {
        metrics.deadEnds += 1;
        return;
      }
      solutions.push({
        routes: routeStack.map((route) => ({
          commanderId: route.commanderId,
          path: route.path.map((position) => ({ ...position })),
          state: clonePartyState(route.state),
        })),
      });
      if (solutions.length >= options.solutionLimit) control.stop = true;
      return;
    }

    const commander = level.commanders[index];
    const reserved = convoyReserved(level, commander, occupied);
    enumerateSingleRoutes(level, commander, reserved, (path, state) => {
      const nextOccupied = new Set(occupied);
      path.forEach((position) => nextOccupied.add(keyOf(position)));
      const nextBeacons = new Set(sharedBeacons);
      state.beacons.forEach((beacon) => nextBeacons.add(beacon));
      routeStack.push({ commanderId: commander.id, path: [...path], state });
      assignCommander(index + 1, nextOccupied, nextBeacons);
      routeStack.pop();
    }, control, metrics);
  }

  assignCommander(0, new Set(), new Set());
  return { solutions, stoppedAtLimit: control.stop };
}

// Unlike a convoy route, a hunt route has no goal tile to terminate on: every node the
// hero can reach is a legal place to stop, so the next hero plans from each of them.
function enumerateHuntRoutes(level, commander, huntOptions, onRoute, control, metrics, settings = {}) {
  const start = commander.start;
  const visited = new Set([keyOf(start)]);
  const path = [{ ...start }];
  const initial = advanceState(level, createPartyState(commander.initial), start, {
    commander,
    countMove: false,
    hunt: huntOptions,
  });
  if (!initial.ok) return;

  function dfs(position, state) {
    if (metrics.aborted || control.stop) return;
    metrics.nodesExpanded += 1;
    if (metrics.nodesExpanded > metrics.nodeLimit) {
      metrics.aborted = true;
      return;
    }
    metrics.maxDepth = Math.max(metrics.maxDepth, path.length - 1);

    onRoute(path, state);
    if (metrics.aborted || control.stop) return;
    // Emit-and-stop: once the quarry is clear, walking further can only cost moves.
    if (settings.stopWhenClear?.(state)) return;

    const forced = forcedDirectionAt(level, position);
    const possibleDirections = forced ? [DIRECTION_BY_CODE.get(forced)] : DIRECTIONS;
    const candidates = [];
    for (const direction of possibleDirections) {
      const next = { r: position.r + direction.dr, c: position.c + direction.dc };
      const nextKey = keyOf(next);
      if (visited.has(nextKey) || !walkable(level, next)) continue;
      const transition = advanceState(level, state, next, {
        commander,
        previous: path.at(-2),
        from: position,
        hunt: huntOptions,
      });
      if (!transition.ok) {
        metrics.pruned += 1;
        continue;
      }
      candidates.push({ next, nextKey, transition });
    }
    recordBranch(metrics, candidates.length, path.length - 1);

    for (const candidate of candidates) {
      visited.add(candidate.nextKey);
      path.push(candidate.next);
      dfs(candidate.next, candidate.transition.state);
      path.pop();
      visited.delete(candidate.nextKey);
      if (metrics.aborted || control.stop) return;
    }
  }

  dfs(start, initial.state);
}

function huntPermutations(ids) {
  if (ids.length <= 1) return [[...ids]];
  const result = [];
  ids.forEach((id, index) => {
    const rest = [...ids.slice(0, index), ...ids.slice(index + 1)];
    for (const tail of huntPermutations(rest)) result.push([id, ...tail]);
  });
  return result;
}

function analyzeHuntLevel(level, options, metrics) {
  const solutions = [];
  const control = { stop: false };
  const heroIds = level.heroes.map((hero) => hero.id);
  const orders = options.forceOrder ? [[...options.forceOrder]] : huntPermutations(heroIds);
  const routeStack = [];

  function planHero(order, camps, index, deadEnemies, resting) {
    if (metrics.aborted || control.stop) return;
    if (index === order.length) {
      if (!allEnemiesDead(level, deadEnemies)) {
        metrics.deadEnds += 1;
        return;
      }
      solutions.push({
        order: [...order],
        assignment: Object.fromEntries(order.map((heroId, slot) => [heroId, { ...camps[slot] }])),
        routes: routeStack.map((route) => ({
          heroId: route.heroId,
          path: route.path.map((position) => ({ ...position })),
          state: clonePartyState(route.state),
        })),
      });
      if (solutions.length >= options.solutionLimit) control.stop = true;
      return;
    }

    const heroId = order[index];
    const camp = camps[index];
    const commander = huntCommander(level, heroId, camp);
    const occupied = new Set(resting);
    for (let later = index + 1; later < order.length; later += 1) occupied.add(keyOf(camps[later]));
    occupied.delete(keyOf(camp));
    const huntOptions = { deadEnemies: new Set(deadEnemies), occupied };

    enumerateHuntRoutes(level, commander, huntOptions, (path, state) => {
      const nextDead = new Set(deadEnemies);
      state.kills.forEach((id) => nextDead.add(id));
      const nextResting = new Set(resting);
      nextResting.add(keyOf(path.at(-1)));
      routeStack.push({ heroId, path: [...path], state });
      planHero(order, camps, index + 1, nextDead, nextResting);
      routeStack.pop();
    }, control, metrics, {
      stopWhenClear: (state) => {
        const combined = new Set(deadEnemies);
        state.kills.forEach((id) => combined.add(id));
        return allEnemiesDead(level, combined);
      },
    });
  }

  function chooseCamps(order, chosen, used) {
    if (metrics.aborted || control.stop) return;
    if (chosen.length === order.length) {
      planHero(order, chosen, 0, new Set(), new Set());
      return;
    }
    for (const camp of level.camps) {
      const key = keyOf(camp);
      if (used.has(key)) continue;
      used.add(key);
      chosen.push(camp);
      chooseCamps(order, chosen, used);
      chosen.pop();
      used.delete(key);
      if (metrics.aborted || control.stop) return;
    }
  }

  for (const order of orders) {
    if (metrics.aborted || control.stop) break;
    chooseCamps(order, [], new Set());
  }

  return { solutions, stoppedAtLimit: control.stop };
}

function finalizeAnalysis(level, result, metrics) {
  const first = result.solutions[0] ?? null;
  const multiRoute = level.mode === "convoy" || level.mode === "hunt";
  const paths = first
    ? multiRoute ? first.routes.map((route) => route.path) : [first.path]
    : [];
  const solutionDepth = paths.reduce((sum, path) => sum + Math.max(0, path.length - 1), 0);
  const solutionTurns = paths.reduce((sum, path) => sum + pathTurns(path), 0);
  const searchRatio = solutionDepth ? metrics.nodesExpanded / solutionDepth : 0;
  const complexityScore = Number((
    Math.log2(metrics.nodesExpanded + 1) * 1.6
    + Math.log2(metrics.deadEnds + 1) * 1.2
    + Math.log2(metrics.branchNodes + 1) * 1.1
    + solutionTurns * 0.55
    + solutionDepth * 0.12
  ).toFixed(2));

  return {
    ...result,
    levelId: level.id,
    solvable: result.solutions.length > 0,
    complete: !result.stoppedAtLimit && !metrics.aborted,
    metrics: {
      ...metrics,
      averageBranching: metrics.nodesExpanded ? Number((metrics.totalLegalMoves / metrics.nodesExpanded).toFixed(3)) : 0,
      solutionDepth,
      solutionTurns,
      searchRatio: Number(searchRatio.toFixed(2)),
      complexityScore,
    },
  };
}

export function analyzeLevel(level, options = {}) {
  const settings = {
    solutionLimit: options.solutionLimit ?? 1,
    nodeLimit: options.nodeLimit ?? 2_000_000,
    forceOrder: options.forceOrder ?? null,
  };
  const metrics = createMetrics(settings.nodeLimit);
  let result;
  if (level.mode === "convoy") result = analyzeConvoyLevel(level, settings, metrics);
  else if (level.mode === "hunt") result = analyzeHuntLevel(level, settings, metrics);
  else result = analyzeSingleLevel(level, settings, metrics);
  return finalizeAnalysis(level, result, metrics);
}

export function solveLevel(level, limit = 1) {
  const analysis = analyzeLevel(level, { solutionLimit: limit });
  if (level.mode === "convoy" || level.mode === "hunt") return analysis.solutions;
  return analysis.solutions.map((solution) => solution.path);
}
