import {
  TILE_DEFS,
  createPartyState,
  enterTile,
  isAdjacent,
  keyOf,
  samePosition,
  simulatePath,
  solveLevel,
} from "./engine.js";
import { LEVELS } from "./levels.js";

const ASSETS = Object.freeze({
  commander: "./assets/vendor/kenney-tiny-dungeon/Tiles/tile_0100.png",
  soldier: "./assets/vendor/kenney-tiny-dungeon/Tiles/tile_0098.png",
  mage: "./assets/vendor/kenney-tiny-dungeon/Tiles/tile_0084.png",
  builder: "./assets/vendor/kenney-tiny-farm/Tiles/tile_0108.png",
  goblin: "./assets/vendor/tiny-creatures/tiny-creatures/Tiles/tile_0011.png",
  orc: "./assets/vendor/tiny-creatures/tiny-creatures/Tiles/tile_0012.png",
  ogre: "./assets/vendor/tiny-creatures/tiny-creatures/Tiles/tile_0015.png",
  dragon: "./assets/vendor/tiny-creatures/tiny-creatures/Tiles/tile_0034.png",
  goal: "./assets/vendor/kenney-tiny-town/Tiles/tile_0095.png",
  wilds: [
    "./assets/vendor/kenney-tiny-town/Tiles/tile_0007.png",
    "./assets/vendor/kenney-tiny-town/Tiles/tile_0008.png",
    "./assets/vendor/kenney-tiny-town/Tiles/tile_0009.png",
    "./assets/vendor/kenney-tiny-town/Tiles/tile_0010.png",
  ],
});

const dom = {
  board: document.querySelector("#gameBoard"),
  boardStage: document.querySelector("#boardStage"),
  boardFrame: document.querySelector(".board-frame"),
  routeLayer: document.querySelector("#routeLayer"),
  routeShadow: document.querySelector("#routeShadow"),
  routeLine: document.querySelector("#routeLine"),
  routeHead: document.querySelector("#routeHead"),
  party: document.querySelector("#partyToken"),
  confetti: document.querySelector("#confettiLayer"),
  levelList: document.querySelector("#levelList"),
  levelNumber: document.querySelector("#levelNumber"),
  levelTitle: document.querySelector("#levelTitle"),
  levelBriefing: document.querySelector("#levelBriefing"),
  difficulty: document.querySelector("#difficultyLabel"),
  mechanic: document.querySelector("#mechanicLabel"),
  tip: document.querySelector("#tipLabel"),
  chapter: document.querySelector("#chapterLabel"),
  status: document.querySelector("#statusText"),
  callout: document.querySelector("#drawCallout"),
  soldierCount: document.querySelector("#soldierCount"),
  tiredCount: document.querySelector("#tiredCount"),
  mageCount: document.querySelector("#mageCount"),
  builderCount: document.querySelector("#builderCount"),
  soldierCard: document.querySelector("#soldierCard"),
  mageCard: document.querySelector("#mageCard"),
  builderCard: document.querySelector("#builderCard"),
  sealMeter: document.querySelector("#sealMeter"),
  sunSeal: document.querySelector("#sunSeal"),
  moonSeal: document.querySelector("#moonSeal"),
  progressCopy: document.querySelector("#progressCopy"),
  progressFill: document.querySelector("#campaignProgressFill"),
  undo: document.querySelector("#undoButton"),
  reset: document.querySelector("#resetButton"),
  hint: document.querySelector("#hintButton"),
  sound: document.querySelector("#soundButton"),
  credits: document.querySelector("#creditsButton"),
  closeCredits: document.querySelector("#closeCreditsButton"),
  creditsDialog: document.querySelector("#creditsDialog"),
  victoryDialog: document.querySelector("#victoryDialog"),
  victoryTitle: document.querySelector("#victoryTitle"),
  victoryCopy: document.querySelector("#victoryCopy"),
  victorySteps: document.querySelector("#victorySteps"),
  victoryRank: document.querySelector("#victoryRank"),
  replay: document.querySelector("#replayButton"),
  next: document.querySelector("#nextButton"),
};

const STORAGE_KEYS = {
  complete: "flow-commander-complete-v1",
  muted: "flow-commander-muted-v1",
};

function readCompleted() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEYS.complete) ?? "[]");
    return new Set(Array.isArray(value) ? value.filter(Number.isInteger) : []);
  } catch {
    return new Set();
  }
}

function readMuted() {
  try {
    return localStorage.getItem(STORAGE_KEYS.muted) === "true";
  } catch {
    return false;
  }
}

class Soundboard {
  constructor() {
    this.context = null;
    this.master = null;
    this.noiseBuffer = null;
    this.muted = readMuted();
  }

  ensure() {
    if (this.context) {
      if (this.context.state === "suspended") this.context.resume();
      return;
    }
    const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContextClass) return;
    this.context = new AudioContextClass();
    this.master = this.context.createGain();
    this.master.gain.value = this.muted ? 0 : 0.24;
    this.master.connect(this.context.destination);
    this.noiseBuffer = this.context.createBuffer(1, this.context.sampleRate * 0.25, this.context.sampleRate);
    const channel = this.noiseBuffer.getChannelData(0);
    for (let index = 0; index < channel.length; index += 1) channel[index] = Math.random() * 2 - 1;
  }

  toggle() {
    this.muted = !this.muted;
    try { localStorage.setItem(STORAGE_KEYS.muted, String(this.muted)); } catch { /* Storage is optional. */ }
    if (this.master && this.context) {
      this.master.gain.cancelScheduledValues(this.context.currentTime);
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.24, this.context.currentTime, 0.02);
    }
    return this.muted;
  }

  tone(frequency, duration = 0.08, type = "triangle", volume = 0.16, delay = 0, endFrequency = null) {
    if (!this.context || !this.master || this.muted) return;
    const start = this.context.currentTime + delay;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  noise(duration = 0.1, volume = 0.11, delay = 0) {
    if (!this.context || !this.master || !this.noiseBuffer || this.muted) return;
    const start = this.context.currentTime + delay;
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    source.buffer = this.noiseBuffer;
    filter.type = "lowpass";
    filter.frequency.value = 850;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
    source.start(start);
    source.stop(start + duration);
  }

  play(cue, step = 0) {
    this.ensure();
    switch (cue) {
      case "step":
        this.tone(185 + (step % 6) * 14, 0.045, "triangle", 0.065);
        break;
      case "undo":
        this.tone(170, 0.07, "triangle", 0.08, 0, 118);
        break;
      case "recruit":
        [330, 440, 554].forEach((note, index) => this.tone(note, 0.11, "square", 0.07, index * 0.055));
        break;
      case "mage":
        [392, 587, 784].forEach((note, index) => this.tone(note, 0.18, "sine", 0.065, index * 0.07));
        break;
      case "builder":
        [170, 220, 180].forEach((note, index) => this.tone(note, 0.055, "square", 0.065, index * 0.045));
        break;
      case "goblin":
        this.noise(0.13, 0.11);
        this.tone(125, 0.16, "sine", 0.12, 0, 86);
        break;
      case "dragon":
        this.noise(0.2, 0.08);
        this.tone(220, 0.28, "sawtooth", 0.07, 0, 560);
        this.tone(880, 0.18, "sine", 0.045, 0.12);
        break;
      case "river":
        [210, 190, 230, 205].forEach((note, index) => this.tone(note, 0.045, "square", 0.045, index * 0.04));
        break;
      case "switch":
        this.tone(310, 0.08, "square", 0.08);
        this.tone(620, 0.12, "sine", 0.08, 0.06);
        break;
      case "gate":
        this.tone(280, 0.18, "square", 0.07, 0, 105);
        break;
      case "blocked":
        this.tone(92, 0.12, "square", 0.075);
        break;
      case "win":
        [262, 330, 392, 523, 659].forEach((note, index) => this.tone(note, 0.26, "triangle", 0.095, index * 0.11));
        break;
      default:
        break;
    }
  }
}

const audio = new Soundboard();
const solutions = LEVELS.map((level) => solveLevel(level, 1)[0]);
const session = {
  levelIndex: 0,
  level: LEVELS[0],
  path: [],
  party: createPartyState(),
  completed: readCompleted(),
  drawing: false,
  pointerId: null,
  mode: "idle",
  statusTimer: null,
  victoryTimer: null,
};

function persistCompleted() {
  try { localStorage.setItem(STORAGE_KEYS.complete, JSON.stringify([...session.completed])); } catch { /* Storage is optional. */ }
}

function difficultyName(value) {
  if (value <= 2) return "GENTLE";
  if (value <= 4) return "EASY";
  if (value <= 6) return "TACTICAL";
  if (value <= 8) return "HARD";
  return "MASTER";
}

function tileAt(position) {
  return session.level.rows[position.r]?.[position.c] ?? "#";
}

function image(src, className, alt = "") {
  const node = document.createElement("img");
  node.className = className;
  node.src = src;
  node.alt = alt;
  node.draggable = false;
  return node;
}

function textNode(className, value) {
  const node = document.createElement("span");
  node.className = className;
  node.textContent = value;
  return node;
}

function renderTileContents(cell, tileCode, r, c) {
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
      cell.append(textNode("tile-label", def.cost === 1 ? "GOBLIN" : def.cost === 2 ? "GOBLIN DUO" : "GOBLIN TROOP"));
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
    case "river": {
      const planks = document.createElement("span");
      planks.className = "bridge-planks";
      planks.innerHTML = "<i></i><i></i><i></i><i></i>";
      cell.append(planks, textNode("tile-label", "RIVER"));
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
    default:
      break;
  }
}

function renderBoard() {
  const level = session.level;
  dom.board.replaceChildren();
  dom.board.style.setProperty("--cols", level.width);
  dom.board.style.setProperty("--rows", level.height);
  dom.boardFrame.style.setProperty("--cols", level.width);
  dom.boardFrame.style.setProperty("--rows", level.height);
  dom.boardFrame.classList.toggle("board-frame--dense", level.width > 14);
  dom.routeLayer.setAttribute("viewBox", `0 0 ${level.width} ${level.height}`);
  dom.routeLayer.setAttribute("preserveAspectRatio", "none");

  level.rows.forEach((row, r) => {
    row.forEach((tileCode, c) => {
      const def = TILE_DEFS[tileCode];
      const cell = document.createElement("div");
      cell.className = `cell cell--${def.type}`;
      cell.dataset.r = String(r);
      cell.dataset.c = String(c);
      cell.dataset.variation = String((r * 13 + c * 5 + level.id) % 2);
      cell.dataset.key = `${r},${c}`;
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-label", `${def.label}, row ${r + 1}, column ${c + 1}`);
      renderTileContents(cell, tileCode, r, c);
      dom.board.append(cell);
    });
  });
}

function renderLevelList() {
  dom.levelList.replaceChildren();
  LEVELS.forEach((level, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "level-button";
    if (index === session.levelIndex) button.classList.add("is-current");
    if (session.completed.has(level.id)) button.classList.add("is-complete");
    button.setAttribute("aria-current", index === session.levelIndex ? "step" : "false");
    button.setAttribute("aria-label", `Level ${level.id}: ${level.name}, difficulty ${level.difficulty} of 10${session.completed.has(level.id) ? ", cleared" : ""}`);
    button.innerHTML = `
      <span class="level-button__number">${session.completed.has(level.id) ? "✓" : String(level.id).padStart(2, "0")}</span>
      <span class="level-button__copy"><strong>${level.name}</strong><small>${level.mechanic}</small></span>
      <span class="level-button__check">${index === session.levelIndex ? "◆" : ""}</span>
    `;
    button.addEventListener("click", () => loadLevel(index));
    dom.levelList.append(button);
  });

  const cleared = session.completed.size;
  dom.progressCopy.textContent = `${cleared} / ${LEVELS.length} CLEARED`;
  dom.progressFill.style.width = `${(cleared / LEVELS.length) * 100}%`;
}

function renderMetadata() {
  const level = session.level;
  dom.levelNumber.textContent = `LEVEL ${String(level.id).padStart(2, "0")}`;
  dom.chapter.textContent = `CHAPTER ${String(level.id).padStart(2, "0")}`;
  dom.levelTitle.textContent = level.name;
  dom.levelBriefing.textContent = level.briefing;
  dom.difficulty.textContent = `${difficultyName(level.difficulty)} · ${level.difficulty}/10`;
  dom.mechanic.textContent = `${level.id === 1 ? "CORE" : "FIELD NOTE"}: ${level.mechanic.toUpperCase()}`;
  dom.tip.textContent = level.tip;
  const hasSeals = level.map.some((row) => /[yYqQ]/.test(row));
  dom.sealMeter.hidden = !hasSeals;
}

function renderPath() {
  const points = session.path.map(({ r, c }) => `${c + 0.5},${r + 0.5}`).join(" ");
  dom.routeShadow.setAttribute("points", points);
  dom.routeLine.setAttribute("points", points);
  const head = session.path.at(-1);
  if (head) {
    dom.routeHead.style.display = "";
    dom.routeHead.setAttribute("cx", String(head.c + 0.5));
    dom.routeHead.setAttribute("cy", String(head.r + 0.5));
  } else {
    dom.routeHead.style.display = "none";
  }

  const visited = new Set(session.path.map(keyOf));
  dom.board.querySelectorAll(".cell").forEach((cell) => {
    cell.classList.toggle("cell--visited", visited.has(cell.dataset.key));
  });
}

function followerTypes() {
  const types = [];
  for (let index = 0; index < Math.min(session.party.soldiers, 4); index += 1) types.push("soldier");
  for (let index = 0; index < session.party.mages; index += 1) types.push("mage");
  for (let index = 0; index < session.party.builders; index += 1) types.push("builder");
  return types.slice(0, 4);
}

function renderParty(animate = false) {
  const position = session.path.at(-1) ?? session.level.start;
  dom.party.style.left = `${((position.c + 0.5) / session.level.width) * 100}%`;
  dom.party.style.top = `${((position.r + 0.5) / session.level.height) * 100}%`;
  dom.party.replaceChildren();
  const commander = image(ASSETS.commander, "party-member");
  dom.party.append(commander);
  followerTypes().forEach((type) => dom.party.append(image(ASSETS[type], "party-follower")));
  if (animate) {
    dom.party.classList.remove("is-stepping");
    void dom.party.offsetWidth;
    dom.party.classList.add("is-stepping");
  }
}

function bumpRoster(type) {
  const card = type === "recruit" || type === "goblin"
    ? dom.soldierCard
    : type === "mage" || type === "dragon"
      ? dom.mageCard
      : type === "builder" || type === "river"
        ? dom.builderCard
        : null;
  if (!card) return;
  card.classList.remove("is-bumping");
  void card.offsetWidth;
  card.classList.add("is-bumping");
}

function renderRoster(event = null) {
  dom.soldierCount.textContent = String(session.party.soldiers);
  dom.tiredCount.textContent = `${session.party.tired} tired`;
  dom.mageCount.textContent = String(session.party.mages);
  dom.builderCount.textContent = String(session.party.builders);
  dom.soldierCard.classList.toggle("is-active", session.party.soldiers > 0);
  dom.mageCard.classList.toggle("is-active", session.party.mages > 0);
  dom.builderCard.classList.toggle("is-active", session.party.builders > 0);
  dom.sunSeal.classList.toggle("is-open", session.party.switches.has("sun"));
  dom.moonSeal.classList.toggle("is-open", session.party.switches.has("moon"));
  if (event) bumpRoster(event.type);
}

function defaultStatus() {
  if (!session.path.length) return "<b>PRESS + DRAG</b> from your commander";
  return `<b>KEEP DRAWING</b> from the glowing head · ${session.path.length} tiles`;
}

function setStatus(message = defaultStatus(), tone = "normal", timeout = 0) {
  if (session.statusTimer) window.clearTimeout(session.statusTimer);
  dom.status.innerHTML = message;
  dom.callout.classList.toggle("is-error", tone === "error");
  dom.callout.classList.toggle("is-success", tone === "success");
  if (timeout) {
    session.statusTimer = window.setTimeout(() => setStatus(), timeout);
  }
}

function eventStatus(event) {
  if (!event) return null;
  switch (event.type) {
    case "recruit": return event.amount === 1 ? "<b>SOLDIER RALLIED!</b> The company grows." : "<b>SQUAD RALLIED!</b> Two soldiers join the line.";
    case "goblin": return `<b>GOBLINS HANDLED!</b> ${event.cost} soldier${event.cost === 1 ? " rests" : "s rest"} here.`;
    case "mage": return "<b>MAGE RALLIED!</b> One dragon can now be enchanted.";
    case "dragon": return "<b>DRAGON CALMED!</b> The mage stays to weave the spell.";
    case "builder": return "<b>BUILDER RALLIED!</b> One river can now be bridged.";
    case "river": return "<b>BRIDGE LAID!</b> The builder stays to finish the crossing.";
    case "switch": return `<b>${event.channel.toUpperCase()} SWITCH LIT!</b> Its matching gate is open.`;
    case "gate": return `<b>${event.channel.toUpperCase()} GATE OPEN!</b> March through.`;
    default: return null;
  }
}

function audioCue(event) {
  if (!event) return "step";
  if (event.type === "recruit") return "recruit";
  if (event.type === "goblin") return "goblin";
  if (event.type === "mage") return "mage";
  if (event.type === "dragon") return "dragon";
  if (event.type === "builder") return "builder";
  if (event.type === "river") return "river";
  if (event.type === "switch") return "switch";
  if (event.type === "gate") return "gate";
  return "step";
}

function refreshSession(event = null, animate = false) {
  renderPath();
  renderParty(animate);
  renderRoster(event);
  dom.undo.disabled = session.path.length === 0 || session.mode === "won";
  if (event) {
    const status = eventStatus(event);
    if (status) setStatus(status, "normal", 1500);
  } else if (session.mode !== "won") {
    setStatus();
  }
}

function recomputeParty() {
  if (!session.path.length) {
    session.party = createPartyState();
    return;
  }
  const result = simulatePath(session.level, session.path);
  session.party = result.state;
}

function positionFromCell(cell) {
  if (!cell?.classList.contains("cell")) return null;
  return { r: Number(cell.dataset.r), c: Number(cell.dataset.c) };
}

function cellFor(position) {
  return dom.board.querySelector(`.cell[data-r="${position.r}"][data-c="${position.c}"]`);
}

function flashBlocked(position, reason) {
  const cell = cellFor(position);
  if (cell) {
    cell.classList.remove("cell--blocked");
    void cell.offsetWidth;
    cell.classList.add("cell--blocked");
    window.setTimeout(() => cell.classList.remove("cell--blocked"), 320);
  }
  audio.play("blocked");
  setStatus(`<b>ROUTE BLOCKED</b> ${reason}`, "error", 2200);
}

function markFresh(position) {
  const cell = cellFor(position);
  if (!cell) return;
  cell.classList.remove("cell--fresh");
  void cell.offsetWidth;
  cell.classList.add("cell--fresh");
  window.setTimeout(() => cell.classList.remove("cell--fresh"), 260);
}

function undoStep(withSound = true) {
  if (!session.path.length || session.mode === "won") return;
  session.path.pop();
  recomputeParty();
  if (withSound) audio.play("undo");
  refreshSession(null, true);
  session.mode = session.path.length ? "paused" : "idle";
}

function attemptAdjacent(position) {
  const head = session.path.at(-1);
  if (!head || samePosition(head, position)) return true;

  const previous = session.path.at(-2);
  if (previous && samePosition(previous, position)) {
    undoStep();
    return true;
  }

  if (!isAdjacent(head, position)) return false;
  if (session.path.some((step) => samePosition(step, position))) {
    flashBlocked(position, "The trail cannot cross itself. Pull back one square instead.");
    return false;
  }

  const transition = enterTile(session.party, tileAt(position), position);
  if (!transition.ok) {
    flashBlocked(position, transition.reason);
    return false;
  }

  session.path.push(position);
  session.party = transition.state;
  session.mode = "drawing";
  markFresh(position);
  const cue = audioCue(transition.event);
  audio.play(cue, session.path.length);
  refreshSession(transition.event, true);

  if (samePosition(position, session.level.goal)) finishLevel();
  return true;
}

function attemptToward(target) {
  let head = session.path.at(-1);
  if (!head || samePosition(head, target)) return;

  if (isAdjacent(head, target)) {
    attemptAdjacent(target);
    return;
  }

  if (head.r === target.r) {
    const direction = Math.sign(target.c - head.c);
    while (session.mode !== "won" && head.c !== target.c) {
      const next = { r: head.r, c: head.c + direction };
      if (!attemptAdjacent(next)) break;
      head = session.path.at(-1);
    }
  } else if (head.c === target.c) {
    const direction = Math.sign(target.r - head.r);
    while (session.mode !== "won" && head.r !== target.r) {
      const next = { r: head.r + direction, c: head.c };
      if (!attemptAdjacent(next)) break;
      head = session.path.at(-1);
    }
  }
}

function beginPath() {
  if (session.path.length) return;
  session.path = [{ ...session.level.start }];
  session.party = createPartyState();
  session.mode = "drawing";
  audio.play("step", 0);
  refreshSession(null, true);
}

function handlePointerDown(event) {
  if (event.button !== undefined && event.button !== 0) return;
  if (session.mode === "won") return;
  audio.ensure();
  const cell = event.target.closest(".cell");
  const position = positionFromCell(cell);
  if (!position) return;

  if (!session.path.length) {
    if (!samePosition(position, session.level.start)) {
      flashBlocked(position, "Begin on the lone commander.");
      return;
    }
    beginPath();
  } else {
    const head = session.path.at(-1);
    if (!samePosition(position, head) && !isAdjacent(position, head)) {
      flashBlocked(position, "Continue from the glowing route head.");
      return;
    }
    if (!samePosition(position, head)) attemptAdjacent(position);
  }

  session.drawing = session.mode !== "won";
  session.pointerId = event.pointerId;
  if (session.drawing) dom.boardFrame.setPointerCapture?.(event.pointerId);
  event.preventDefault();
}

function handlePointerMove(event) {
  if (!session.drawing || event.pointerId !== session.pointerId || session.mode === "won") return;
  const element = document.elementFromPoint(event.clientX, event.clientY);
  const cell = element?.closest?.(".cell");
  const position = positionFromCell(cell);
  if (position) attemptToward(position);
  event.preventDefault();
}

function endPointer(event) {
  if (event.pointerId !== session.pointerId) return;
  session.drawing = false;
  session.pointerId = null;
  if (session.mode === "drawing") session.mode = "paused";
}

function handleKeyboard(event) {
  if (session.mode === "won") return;
  const deltas = {
    ArrowUp: [-1, 0],
    ArrowRight: [0, 1],
    ArrowDown: [1, 0],
    ArrowLeft: [0, -1],
  };

  if ((event.key === "Enter" || event.key === " ") && !session.path.length) {
    audio.ensure();
    beginPath();
    event.preventDefault();
    return;
  }
  if (event.key === "Backspace" || event.key === "Delete") {
    undoStep();
    event.preventDefault();
    return;
  }
  if (event.key.toLowerCase() === "r") {
    resetLevel();
    event.preventDefault();
    return;
  }
  if (event.key.toLowerCase() === "h") {
    showNudge();
    event.preventDefault();
    return;
  }

  const delta = deltas[event.key];
  if (!delta) return;
  audio.ensure();
  if (!session.path.length) beginPath();
  const head = session.path.at(-1);
  attemptAdjacent({ r: head.r + delta[0], c: head.c + delta[1] });
  event.preventDefault();
}

function createConfetti() {
  dom.confetti.replaceChildren();
  const colors = ["#ffc95c", "#73e0a4", "#ff766f", "#a997ff", "#fff2d6"];
  for (let index = 0; index < 28; index += 1) {
    const piece = document.createElement("i");
    piece.className = "confetti";
    const angle = (Math.PI * 2 * index) / 28 + Math.random() * 0.2;
    const distance = 70 + Math.random() * 190;
    piece.style.setProperty("--tx", `${Math.cos(angle) * distance}px`);
    piece.style.setProperty("--ty", `${Math.sin(angle) * distance - 45}px`);
    piece.style.setProperty("--spin", `${Math.round(Math.random() * 5 + 2) * 90}deg`);
    piece.style.setProperty("--confetti-color", colors[index % colors.length]);
    piece.style.animationDelay = `${Math.random() * 130}ms`;
    dom.confetti.append(piece);
  }
}

function finishLevel() {
  session.mode = "won";
  session.drawing = false;
  session.completed.add(session.level.id);
  persistCompleted();
  renderLevelList();
  dom.undo.disabled = true;
  dom.party.classList.add("is-winning");
  createConfetti();
  audio.play("win");
  setStatus("<b>ROUTE SECURED!</b> Your company reached the royal banner.", "success");

  dom.victoryTitle.textContent = session.level.id === LEVELS.length ? "The realm rallies!" : "Company assembled!";
  dom.victoryCopy.textContent = session.level.id === LEVELS.length
    ? "Every seal is open and every crossing is safe. A true commander's route."
    : `${session.level.name} is secure. The next march awaits.`;
  dom.victorySteps.textContent = String(session.path.length);
  dom.victoryRank.textContent = session.level.difficulty >= 9 ? "★★★" : session.level.difficulty >= 6 ? "★★" : "★";
  dom.next.innerHTML = session.level.id === LEVELS.length ? "FIRST MARCH <span>↻</span>" : "NEXT MARCH <span>→</span>";

  session.victoryTimer = window.setTimeout(() => {
    if (!dom.victoryDialog.open && session.mode === "won") dom.victoryDialog.showModal();
  }, 850);
}

function clearTimers() {
  if (session.statusTimer) window.clearTimeout(session.statusTimer);
  if (session.victoryTimer) window.clearTimeout(session.victoryTimer);
  session.statusTimer = null;
  session.victoryTimer = null;
}

function resetLevel() {
  clearTimers();
  session.path = [];
  session.party = createPartyState();
  session.mode = "idle";
  session.drawing = false;
  session.pointerId = null;
  dom.party.classList.remove("is-winning", "is-stepping");
  dom.confetti.replaceChildren();
  if (dom.victoryDialog.open) dom.victoryDialog.close();
  refreshSession();
}

function loadLevel(index) {
  clearTimers();
  session.levelIndex = (index + LEVELS.length) % LEVELS.length;
  session.level = LEVELS[session.levelIndex];
  session.path = [];
  session.party = createPartyState();
  session.mode = "idle";
  session.drawing = false;
  session.pointerId = null;
  dom.party.classList.remove("is-winning", "is-stepping");
  dom.confetti.replaceChildren();
  if (dom.victoryDialog.open) dom.victoryDialog.close();
  renderMetadata();
  renderBoard();
  renderLevelList();
  refreshSession();
  dom.board.focus({ preventScroll: true });
}

function commonPrefixLength(a, b) {
  let index = 0;
  while (index < a.length && index < b.length && samePosition(a[index], b[index])) index += 1;
  return index;
}

function showNudge() {
  audio.ensure();
  const solution = solutions[session.levelIndex];
  if (!solution) {
    setStatus("<b>NO SCOUT REPORT</b> This map needs a cartographer.", "error", 1800);
    return;
  }
  const prefix = commonPrefixLength(session.path, solution);
  let position;
  if (!session.path.length) {
    position = solution[0];
    setStatus("<b>SCOUT'S NUDGE</b> Begin on the commander.", "normal", 1800);
  } else if (prefix < session.path.length) {
    position = session.path[Math.max(0, prefix - 1)];
    setStatus("<b>SCOUT'S NUDGE</b> Pull back to the last glowing fork.", "error", 2000);
  } else if (prefix < solution.length) {
    position = solution[prefix];
    setStatus("<b>SCOUT'S NUDGE</b> Consider the flashing adjacent tile.", "normal", 1800);
  } else {
    setStatus("<b>SCOUT'S NUDGE</b> You already found the true route!", "success", 1800);
    return;
  }
  const cell = cellFor(position);
  if (cell) {
    cell.classList.remove("cell--hint");
    void cell.offsetWidth;
    cell.classList.add("cell--hint");
    window.setTimeout(() => cell.classList.remove("cell--hint"), 2100);
  }
  audio.play("switch");
}

function updateSoundButton() {
  dom.sound.classList.toggle("is-muted", audio.muted);
  dom.sound.setAttribute("aria-label", audio.muted ? "Unmute sound" : "Mute sound");
  dom.sound.title = audio.muted ? "Unmute sound" : "Mute sound";
  dom.sound.querySelector(".icon-button__glyph").textContent = audio.muted ? "×" : "♪";
}

dom.board.tabIndex = 0;
dom.board.addEventListener("keydown", handleKeyboard);
dom.boardFrame.addEventListener("pointerdown", handlePointerDown);
dom.boardFrame.addEventListener("pointermove", handlePointerMove);
dom.boardFrame.addEventListener("pointerup", endPointer);
dom.boardFrame.addEventListener("pointercancel", endPointer);
dom.boardFrame.addEventListener("lostpointercapture", endPointer);
dom.undo.addEventListener("click", () => undoStep());
dom.reset.addEventListener("click", resetLevel);
dom.hint.addEventListener("click", showNudge);
dom.sound.addEventListener("click", () => {
  audio.ensure();
  audio.toggle();
  updateSoundButton();
  if (!audio.muted) audio.play("switch");
});
dom.credits.addEventListener("click", () => dom.creditsDialog.showModal());
dom.closeCredits.addEventListener("click", () => dom.creditsDialog.close());
dom.creditsDialog.addEventListener("click", (event) => {
  if (event.target === dom.creditsDialog) dom.creditsDialog.close();
});
dom.replay.addEventListener("click", resetLevel);
dom.next.addEventListener("click", () => loadLevel((session.levelIndex + 1) % LEVELS.length));

updateSoundButton();
loadLevel(0);
