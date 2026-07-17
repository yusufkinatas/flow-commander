export const TILE_DEFS = Object.freeze({
  "#": { type: "wilds", walkable: false, label: "Thick wilds" },
  ".": { type: "meadow", walkable: true, label: "Meadow" },
  S: { type: "start", walkable: true, label: "Commander" },
  G: { type: "goal", walkable: true, label: "Royal banner" },
  r: { type: "recruit", walkable: true, amount: 1, label: "1 soldier" },
  R: { type: "recruit", walkable: true, amount: 2, label: "2 soldiers" },
  g: { type: "goblin", walkable: true, cost: 1, label: "Goblin · needs 1 soldier" },
  o: { type: "goblin", walkable: true, cost: 2, label: "Goblin duo · needs 2 soldiers" },
  t: { type: "goblin", walkable: true, cost: 3, label: "Goblin troop · needs 3 soldiers" },
  m: { type: "mage", walkable: true, label: "Mage" },
  d: { type: "dragon", walkable: true, label: "Dragon · needs a mage" },
  b: { type: "builder", walkable: true, label: "Builder" },
  "~": { type: "river", walkable: true, label: "River · needs a builder" },
  y: { type: "switch", walkable: true, channel: "sun", label: "Sun switch" },
  Y: { type: "gate", walkable: true, channel: "sun", label: "Sun gate" },
  q: { type: "switch", walkable: true, channel: "moon", label: "Moon switch" },
  Q: { type: "gate", walkable: true, channel: "moon", label: "Moon gate" },
});

export function keyOf(position) {
  return `${position.r},${position.c}`;
}

export function samePosition(a, b) {
  return Boolean(a && b && a.r === b.r && a.c === b.c);
}

export function isAdjacent(a, b) {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
}

export function parseLevel(level) {
  const rows = level.map.map((row) => [...row]);
  const height = rows.length;
  const width = rows[0]?.length ?? 0;

  if (!height || !width || rows.some((row) => row.length !== width)) {
    throw new Error(`Level ${level.id} has an invalid rectangular map.`);
  }

  let start = null;
  let goal = null;
  rows.forEach((row, r) => {
    row.forEach((tile, c) => {
      if (!TILE_DEFS[tile]) throw new Error(`Unknown tile "${tile}" in level ${level.id}.`);
      if (tile === "S") start = { r, c };
      if (tile === "G") goal = { r, c };
    });
  });

  if (!start || !goal) throw new Error(`Level ${level.id} needs one start and one goal.`);
  return { ...level, rows, width, height, start, goal };
}

export function createPartyState() {
  return {
    soldiers: 0,
    tired: 0,
    mages: 0,
    builders: 0,
    switches: new Set(),
    events: [],
  };
}

export function clonePartyState(state) {
  return {
    soldiers: state.soldiers,
    tired: state.tired,
    mages: state.mages,
    builders: state.builders,
    switches: new Set(state.switches),
    events: [...state.events],
  };
}

export function enterTile(state, tileCode, position) {
  const tile = TILE_DEFS[tileCode];
  if (!tile?.walkable) {
    return { ok: false, reason: "The thicket is too dense to cross." };
  }

  const next = clonePartyState(state);
  const baseEvent = { type: tile.type, tile: tileCode, position: { ...position } };

  switch (tile.type) {
    case "recruit":
      next.soldiers += tile.amount;
      next.events.push({ ...baseEvent, amount: tile.amount });
      break;
    case "goblin":
      if (next.soldiers < tile.cost) {
        const plural = tile.cost === 1 ? "soldier" : "soldiers";
        return {
          ok: false,
          reason: `This goblin guard needs ${tile.cost} ready ${plural} — you have ${next.soldiers}.`,
        };
      }
      next.soldiers -= tile.cost;
      next.tired += tile.cost;
      next.events.push({ ...baseEvent, cost: tile.cost });
      break;
    case "mage":
      next.mages += 1;
      next.events.push(baseEvent);
      break;
    case "dragon":
      if (next.mages < 1) {
        return { ok: false, reason: "Recruit the mage before facing this dragon." };
      }
      next.mages -= 1;
      next.events.push(baseEvent);
      break;
    case "builder":
      next.builders += 1;
      next.events.push(baseEvent);
      break;
    case "river":
      if (next.builders < 1) {
        return { ok: false, reason: "A builder is needed to lay a safe bridge here." };
      }
      next.builders -= 1;
      next.events.push(baseEvent);
      break;
    case "switch":
      next.switches.add(tile.channel);
      next.events.push({ ...baseEvent, channel: tile.channel });
      break;
    case "gate":
      if (!next.switches.has(tile.channel)) {
        const name = tile.channel === "sun" ? "Sun" : "Moon";
        return { ok: false, reason: `The ${name} gate is shut. Find its matching switch first.` };
      }
      next.events.push({ ...baseEvent, channel: tile.channel });
      break;
    case "goal":
      next.events.push(baseEvent);
      break;
    default:
      break;
  }

  return { ok: true, state: next, event: next.events.at(-1) ?? null };
}

export function simulatePath(level, path) {
  let state = createPartyState();
  if (!path.length || !samePosition(path[0], level.start)) {
    return { ok: false, state, reason: "A route must begin on the commander." };
  }

  const visited = new Set();
  for (let index = 0; index < path.length; index += 1) {
    const position = path[index];
    const previous = path[index - 1];
    const positionKey = keyOf(position);

    if (visited.has(positionKey)) {
      return { ok: false, state, reason: "The route cannot cross itself.", blockedIndex: index };
    }
    if (previous && !isAdjacent(previous, position)) {
      return { ok: false, state, reason: "Move one square up, down, left, or right.", blockedIndex: index };
    }

    const tileCode = level.rows[position.r]?.[position.c];
    const transition = enterTile(state, tileCode, position);
    if (!transition.ok) return { ...transition, state, blockedIndex: index };
    state = transition.state;
    visited.add(positionKey);

    if (tileCode === "G" && index !== path.length - 1) {
      return { ok: false, state, reason: "The banner must be the final square.", blockedIndex: index };
    }
  }

  return {
    ok: true,
    state,
    won: samePosition(path.at(-1), level.goal),
  };
}

export function pathFromDirections(level, directions) {
  const deltas = { U: [-1, 0], D: [1, 0], L: [0, -1], R: [0, 1] };
  const path = [{ ...level.start }];
  for (const direction of directions) {
    const [dr, dc] = deltas[direction] ?? [];
    if (dr === undefined) throw new Error(`Unknown direction ${direction}.`);
    const last = path.at(-1);
    path.push({ r: last.r + dr, c: last.c + dc });
  }
  return path;
}

export function directionsFromPath(path) {
  return path.slice(1).map((position, index) => {
    const previous = path[index];
    const dr = position.r - previous.r;
    const dc = position.c - previous.c;
    if (dr === -1) return "U";
    if (dr === 1) return "D";
    if (dc === -1) return "L";
    if (dc === 1) return "R";
    return "?";
  }).join("");
}

export function solveLevel(level, limit = 2) {
  const solutions = [];
  const visited = new Set([keyOf(level.start)]);
  const path = [{ ...level.start }];
  const initial = enterTile(createPartyState(), "S", level.start).state;
  const directions = [[-1, 0], [0, 1], [1, 0], [0, -1]];

  function dfs(position, state) {
    if (solutions.length >= limit) return;
    if (samePosition(position, level.goal)) {
      solutions.push(path.map((step) => ({ ...step })));
      return;
    }

    for (const [dr, dc] of directions) {
      const next = { r: position.r + dr, c: position.c + dc };
      const nextKey = keyOf(next);
      if (visited.has(nextKey)) continue;

      const tileCode = level.rows[next.r]?.[next.c];
      if (!tileCode || !TILE_DEFS[tileCode]?.walkable) continue;

      const transition = enterTile(state, tileCode, next);
      if (!transition.ok) continue;

      visited.add(nextKey);
      path.push(next);
      dfs(next, transition.state);
      path.pop();
      visited.delete(nextKey);
      if (solutions.length >= limit) return;
    }
  }

  dfs(level.start, initial);
  return solutions;
}
