import { TILE_DEFS } from "./engine.js";

// One renderer for every surface. The workshop paints the same tiles the board
// plays, so a map never looks different depending on where you are looking at it.
export const ASSETS = Object.freeze({
  commander: "./assets/vendor/kenney-tiny-dungeon/Tiles/tile_0100.png",
  captain: "./assets/vendor/kenney-tiny-dungeon/Tiles/tile_0086.png",
  warden: "./assets/vendor/kenney-tiny-dungeon/Tiles/tile_0100.png",
  sage: "./assets/vendor/kenney-tiny-dungeon/Tiles/tile_0084.png",
  soldier: "./assets/vendor/kenney-tiny-dungeon/Tiles/tile_0098.png",
  mage: "./assets/vendor/kenney-tiny-dungeon/Tiles/tile_0084.png",
  builder: "./assets/vendor/kenney-tiny-farm/Tiles/tile_0108.png",
  healer: "./assets/vendor/kenney-tiny-dungeon/Tiles/tile_0087.png",
  goblin: "./assets/vendor/tiny-creatures/tiny-creatures/Tiles/tile_0011.png",
  orc: "./assets/vendor/tiny-creatures/tiny-creatures/Tiles/tile_0012.png",
  ogre: "./assets/vendor/tiny-creatures/tiny-creatures/Tiles/tile_0015.png",
  dragon: "./assets/vendor/tiny-creatures/tiny-creatures/Tiles/tile_0034.png",
  mossling: "./assets/vendor/tiny-creatures/tiny-creatures/Tiles/tile_0001.png",
  emberling: "./assets/vendor/tiny-creatures/tiny-creatures/Tiles/tile_0004.png",
  supplies: "./assets/vendor/kenney-tiny-dungeon/Tiles/tile_0004.png",
  goal: "./assets/vendor/kenney-tiny-town/Tiles/tile_0095.png",
  wilds: [
    "./assets/vendor/kenney-tiny-town/Tiles/tile_0007.png",
    "./assets/vendor/kenney-tiny-town/Tiles/tile_0008.png",
    "./assets/vendor/kenney-tiny-town/Tiles/tile_0009.png",
    "./assets/vendor/kenney-tiny-town/Tiles/tile_0010.png",
  ],
});

export function image(src, className, alt = "") {
  const node = document.createElement("img");
  node.className = className;
  node.src = src;
  node.alt = alt;
  node.draggable = false;
  return node;
}

export function textNode(className, value) {
  const node = document.createElement("span");
  node.className = className;
  node.textContent = value;
  return node;
}

// `showParty` draws the commander onto the start tile. The board does not need it --
// a live .party-token sits on top there -- but the workshop has no token, so without
// this the start tile would read as an empty ring.
export function renderTileContents(cell, tileCode, r, c, { showParty = false } = {}) {
  const def = TILE_DEFS[tileCode];
  switch (def.type) {
    case "wilds": {
      if ((r * 7 + c * 11) % 4 !== 0) {
        cell.append(image(ASSETS.wilds[(r + c * 3) % ASSETS.wilds.length], "wild-sprite"));
      }
      break;
    }
    case "start":
      cell.append(textNode("start-ring", ""));
      if (showParty) cell.append(image(ASSETS.commander, "entity entity--commander-standby"));
      break;
    case "goal":
      cell.append(image(ASSETS.goal, "entity entity--goal"));
      cell.append(textNode("tile-label", "BANNER"));
      break;
    case "recruit":
      cell.append(image(ASSETS.soldier, "entity entity--recruit"));
      cell.append(textNode("tile-badge tile-badge--pickup", `+${def.amount}`));
      cell.append(textNode("tile-label", def.amount === 1 ? "SOLDIER" : "SQUAD"));
      break;
    case "goblin": {
      const sprite = def.cost === 1 ? ASSETS.goblin : def.cost === 2 ? ASSETS.orc : ASSETS.ogre;
      cell.append(image(sprite, "entity entity--goblin"));
      cell.append(textNode("tile-badge", String(def.cost)));
      cell.append(textNode("tile-label", def.cost === 1 ? "GOBLIN" : def.cost === 2 ? "ORC" : "OGRE"));
      break;
    }
    case "mage":
      cell.append(image(ASSETS.mage, "entity entity--mage"));
      cell.append(textNode("tile-badge tile-badge--pickup", "+1"));
      cell.append(textNode("tile-label", "MAGE"));
      break;
    case "dragon":
      cell.append(image(ASSETS.dragon, "entity entity--dragon"));
      cell.append(textNode("tile-badge", "✦"));
      cell.append(textNode("tile-label", "DRAGON"));
      break;
    case "builder":
      cell.append(image(ASSETS.builder, "entity entity--builder"));
      cell.append(textNode("tile-badge tile-badge--pickup", "+1"));
      cell.append(textNode("tile-label", "BUILDER"));
      break;
    case "healer":
      cell.append(textNode("healer-aura", "✚"));
      cell.append(image(ASSETS.healer, "entity entity--healer"));
      cell.append(textNode("tile-badge tile-badge--healer", "↺"));
      cell.append(textNode("tile-label", "HEALER"));
      break;
    case "stride":
      cell.append(
        textNode("maneuver-marker maneuver-marker--stride", "↕↔"),
        textNode("tile-label", "STRAIGHT THROUGH"),
      );
      break;
    case "pivot":
      cell.append(
        textNode("maneuver-marker maneuver-marker--pivot", "↱↰"),
        textNode("tile-label", "RIGHT-ANGLE TURN"),
      );
      break;
    case "aegis":
      cell.append(
        textNode("aegis-symbol", "◆"),
        textNode("tile-badge tile-badge--aegis", "+1"),
        textNode("tile-label", "AEGIS"),
      );
      break;
    case "river": {
      const water = document.createElement("span");
      water.className = "river-water";
      water.innerHTML = "<i></i><i></i><i></i>";
      const planks = document.createElement("span");
      planks.className = "bridge-planks";
      planks.innerHTML = "<i></i><i></i><i></i><i></i>";
      cell.append(water, planks, textNode("tile-label", "RIVER"));
      break;
    }
    case "switch": {
      const symbol = def.channel === "sun" ? "☀" : "☾";
      const className = def.channel === "sun" ? "switch-symbol" : "switch-symbol switch-symbol--moon";
      cell.append(textNode(className, symbol), textNode("tile-label", `${def.channel} switch`));
      break;
    }
    case "gate": {
      const symbol = def.channel === "sun" ? "☀" : "☾";
      const className = def.channel === "sun" ? "gate-symbol" : "gate-symbol gate-symbol--moon";
      cell.append(textNode(className, symbol), textNode("tile-label", `${def.channel} gate`));
      break;
    }
    case "formation":
      cell.append(
        textNode("formation-gate", `=${def.required}`),
        textNode("tile-badge tile-badge--formation", String(def.required)),
        textNode("tile-label", `EXACTLY ${def.required} READY`),
      );
      break;
    case "hungry": {
      const monster = def.need === 1 ? ASSETS.mossling : ASSETS.emberling;
      cell.append(image(monster, `entity entity--hungry entity--hungry-${def.need}`));
      cell.append(textNode("tile-badge tile-badge--hunger", String(def.need)));
      const pips = document.createElement("span");
      pips.className = "hunger-pips";
      for (let index = 0; index < def.need; index += 1) pips.append(document.createElement("i"));
      cell.append(pips, textNode("tile-label", def.need === 1 ? "1 MEAL" : "2 MEALS"));
      break;
    }
    case "commanderStart":
      cell.append(textNode(`start-ring start-ring--${def.commander}`, ""));
      cell.append(image(ASSETS[def.commander], `entity entity--commander-standby entity--${def.commander}`));
      cell.append(textNode("tile-label", def.commander.toUpperCase()));
      break;
    case "commanderGoal":
      cell.append(image(ASSETS.goal, `entity entity--goal entity--goal-${def.commander}`));
      cell.append(textNode(`standard-gem standard-gem--${def.commander}`, "◆"));
      cell.append(textNode("tile-label", `${def.commander} flag`));
      break;
    case "beacon":
      cell.append(textNode("beacon-symbol", "✦"), textNode("tile-label", "BEACON"));
      break;
    case "mud": {
      const mud = document.createElement("span");
      mud.className = "mud-ripples";
      mud.innerHTML = "<i></i><i></i><i></i>";
      cell.append(mud, textNode("tile-badge tile-badge--terrain", "2"), textNode("tile-label", "MUD · 2"));
      break;
    }
    case "supply":
      cell.append(image(ASSETS.supplies, "entity entity--supply"));
      cell.append(textNode("tile-badge tile-badge--pickup", "+2"));
      cell.append(textNode("tile-label", "SUPPLY"));
      break;
    case "current": {
      const arrow = def.force === "R" ? "→" : def.force === "L" ? "←" : def.force === "U" ? "↑" : "↓";
      cell.append(textNode("current-arrow", arrow), textNode("tile-label", "MARCH"));
      break;
    }
    default:
      break;
  }
}

// Rebuilds a node into a complete board cell: type class, terrain variation, and contents.
export function renderTile(cell, tileCode, r = 0, c = 0, options = {}) {
  const def = TILE_DEFS[tileCode] ?? TILE_DEFS["."];
  cell.replaceChildren();
  cell.className = `cell cell--${def.type}`;
  cell.dataset.code = tileCode;
  cell.dataset.variation = String(options.variation ?? (r * 13 + c * 5) % 2);
  if (def.type === "goblin") cell.dataset.enemyTier = String(def.cost);
  else delete cell.dataset.enemyTier;
  renderTileContents(cell, tileCode, r, c, options);
}
