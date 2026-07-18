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
});

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

  const departure = markerDeparture(level, state, options.previous, options.from, position);
  if (!departure.ok) return departure;

  const transition = enterTile(departure.state, tileCode, position);
  if (!transition.ok) return transition;
  const next = transition.state;
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

  const events = [...departure.events, ...transition.events].map(cloneEvent);
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
    return { ok: false, initialState, state, steps, won: false, reason: "A route must begin on the active commander." };
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
  const won = !pending && samePosition(path.at(-1), goal)
    && (level.mode !== "relief" || deliveriesComplete(level, state));
  return { ok: true, initialState, state: clonePartyState(state), steps, won, pending };
}

export function simulatePath(level, path, options = {}) {
  return tracePath(level, path, options);
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

function finalizeAnalysis(level, result, metrics) {
  const first = result.solutions[0] ?? null;
  const paths = first
    ? level.mode === "convoy" ? first.routes.map((route) => route.path) : [first.path]
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
  };
  const metrics = createMetrics(settings.nodeLimit);
  const result = level.mode === "convoy"
    ? analyzeConvoyLevel(level, settings, metrics)
    : analyzeSingleLevel(level, settings, metrics);
  return finalizeAnalysis(level, result, metrics);
}

export function solveLevel(level, limit = 1) {
  const analysis = analyzeLevel(level, { solutionLimit: limit });
  if (level.mode === "convoy") return analysis.solutions;
  return analysis.solutions.map((solution) => solution.path);
}
