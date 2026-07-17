import {
  TILE_DEFS,
  advanceState,
  beaconsComplete,
  createPartyState,
  deliveriesComplete,
  forcedDirectionAt,
  isAdjacent,
  keyOf,
  movementLimit,
  moveAllowedFrom,
  samePosition,
  simulatePath,
  solveLevel,
} from "./engine.js";
import { PACKS, levelKey } from "./levels.js";

const ASSETS = Object.freeze({
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

const dom = {
  board: document.querySelector("#gameBoard"),
  boardStage: document.querySelector("#boardStage"),
  missionPanel: document.querySelector(".mission-panel"),
  boardFrame: document.querySelector(".board-frame"),
  routeLayer: document.querySelector("#routeLayer"),
  party: document.querySelector("#partyToken"),
  confetti: document.querySelector("#confettiLayer"),
  levelList: document.querySelector("#levelList"),
  packSelector: document.querySelector("#packSelector"),
  campaignEyebrow: document.querySelector("#campaignEyebrow"),
  packDescription: document.querySelector("#packDescription"),
  packTitle: document.querySelector("#packTitleLabel"),
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
  healerCount: document.querySelector("#healerCount"),
  soldierCard: document.querySelector("#soldierCard"),
  mageCard: document.querySelector("#mageCard"),
  builderCard: document.querySelector("#builderCard"),
  healerCard: document.querySelector("#healerCard"),
  sealMeter: document.querySelector("#sealMeter"),
  sunSeal: document.querySelector("#sunSeal"),
  moonSeal: document.querySelector("#moonSeal"),
  progressCopy: document.querySelector("#progressCopy"),
  progressFill: document.querySelector("#campaignProgressFill"),
  movementLabel: document.querySelector("#movementLabel"),
  movementCount: document.querySelector("#movementCount"),
  objectiveLabel: document.querySelector("#objectiveLabel"),
  objectiveCount: document.querySelector("#objectiveCount"),
  commanderOrder: document.querySelector("#commanderOrder"),
  rulesList: document.querySelector("#rulesList"),
  mapLegend: document.querySelector("#mapLegend"),
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
  complete: "flow-commander-complete-v2",
  legacyComplete: "flow-commander-complete-v1",
  muted: "flow-commander-muted-v1",
};

function readCompleted() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.complete) ?? "[]");
    if (Array.isArray(saved) && saved.every((value) => typeof value === "string")) return new Set(saved);
    const legacy = JSON.parse(localStorage.getItem(STORAGE_KEYS.legacyComplete) ?? "[]");
    return new Set(Array.isArray(legacy)
      ? legacy.filter(Number.isInteger).map((id) => `${PACKS[0].id}:${id}`)
      : []);
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
    this.musicGain = null;
    this.noiseBuffer = null;
    this.muted = readMuted();
    this.musicTheme = 0;
    this.musicTimer = null;
  }

  ensure() {
    if (this.context) {
      if (this.context.state === "suspended") this.context.resume();
      this.startMusic();
      return;
    }
    const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContextClass) return;
    this.context = new AudioContextClass();
    this.master = this.context.createGain();
    this.master.gain.value = this.muted ? 0 : 0.24;
    this.master.connect(this.context.destination);
    this.musicGain = this.context.createGain();
    this.musicGain.gain.value = 0.34;
    this.musicGain.connect(this.master);
    this.noiseBuffer = this.context.createBuffer(1, this.context.sampleRate * 0.25, this.context.sampleRate);
    const channel = this.noiseBuffer.getChannelData(0);
    for (let index = 0; index < channel.length; index += 1) channel[index] = Math.random() * 2 - 1;
    this.startMusic();
  }

  toggle() {
    this.muted = !this.muted;
    try { localStorage.setItem(STORAGE_KEYS.muted, String(this.muted)); } catch { /* Storage is optional. */ }
    if (this.master && this.context) {
      this.master.gain.cancelScheduledValues(this.context.currentTime);
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.24, this.context.currentTime, 0.02);
    }
    if (!this.muted) this.scheduleMusic();
    return this.muted;
  }

  setTheme(theme) {
    this.musicTheme = theme % 4;
  }

  musicTone(frequency, start, duration, volume = 0.05, type = "triangle") {
    if (!this.context || !this.musicGain || this.muted) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.025);
    gain.gain.setValueAtTime(volume * 0.72, start + duration * 0.62);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(this.musicGain);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  scheduleMusic() {
    if (!this.context || this.muted) return;
    const themes = [
      { notes: [262, 330, 392, 330, 294, 349, 440, 349], bass: [131, 147, 165, 147] },
      { notes: [294, 370, 440, 370, 330, 392, 494, 392], bass: [147, 165, 185, 165] },
      { notes: [247, 311, 370, 466, 370, 311, 277, 349], bass: [123, 139, 156, 139] },
      { notes: [262, 349, 440, 523, 494, 392, 330, 392], bass: [131, 175, 147, 196] },
    ];
    const theme = themes[this.musicTheme];
    const start = this.context.currentTime + 0.06;
    const beat = 0.28;
    theme.notes.forEach((frequency, index) => {
      this.musicTone(frequency, start + index * beat, beat * 0.76, 0.038, index % 2 ? "triangle" : "square");
    });
    theme.bass.forEach((frequency, index) => {
      this.musicTone(frequency, start + index * beat * 2, beat * 1.65, 0.033, "triangle");
    });
  }

  startMusic() {
    if (this.musicTimer) return;
    this.scheduleMusic();
    this.musicTimer = window.setInterval(() => this.scheduleMusic(), 2240);
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
      case "healer":
        [330, 440, 523, 659].forEach((note, index) => this.tone(note, 0.15, "sine", 0.07, index * 0.055));
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
      case "delivery":
        [440, 554, 659].forEach((note, index) => this.tone(note, 0.1, "triangle", 0.055, index * 0.04));
        break;
      case "beacon":
        this.tone(523, 0.18, "square", 0.07);
        this.tone(1046, 0.22, "sine", 0.055, 0.08);
        break;
      case "mud":
        this.noise(0.09, 0.055);
        this.tone(105, 0.08, "triangle", 0.045);
        break;
      case "supply":
        [196, 262, 392].forEach((note, index) => this.tone(note, 0.1, "square", 0.05, index * 0.05));
        break;
      case "current":
        this.tone(280, 0.12, "triangle", 0.055, 0, 520);
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
const solutionCache = new Map();
const session = {
  packIndex: 0,
  pack: PACKS[0],
  levelIndex: 0,
  level: PACKS[0].levels[0],
  path: [],
  routes: [],
  commanderIndex: 0,
  party: createPartyState(),
  completed: readCompleted(),
  drawing: false,
  pointerId: null,
  mode: "idle",
  statusTimer: null,
  victoryTimer: null,
};

function currentCommander() {
  return session.level.mode === "convoy" ? session.level.commanders[session.commanderIndex] : null;
}

function activeStart() {
  return currentCommander()?.start ?? session.level.start;
}

function activeGoal() {
  return currentCommander()?.goal ?? session.level.goal;
}

function currentLevelKey() {
  return levelKey(session.pack, session.level);
}

function cachedSolution() {
  const cacheKey = currentLevelKey();
  if (!solutionCache.has(cacheKey)) solutionCache.set(cacheKey, solveLevel(session.level, 1)[0] ?? null);
  return solutionCache.get(cacheKey);
}

function completedBeaconSet(includeActive = true) {
  const beacons = new Set();
  session.routes.forEach((route) => route.state.beacons.forEach((key) => beacons.add(key)));
  if (includeActive) session.party.beacons.forEach((key) => beacons.add(key));
  return beacons;
}

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
    case "healer":
      cell.append(textNode("healer-aura", "✚"));
      cell.append(image(ASSETS.healer, "entity entity--healer"));
      cell.append(textNode("tile-badge tile-badge--healer", "↺"));
      cell.append(textNode("tile-label", "HEALER"));
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

function renderBoard() {
  const level = session.level;
  dom.board.replaceChildren();
  dom.board.dataset.mode = level.mode;
  dom.boardFrame.dataset.mode = level.mode;
  dom.board.style.setProperty("--cols", level.width);
  dom.board.style.setProperty("--rows", level.height);
  dom.boardFrame.style.setProperty("--cols", level.width);
  dom.boardFrame.style.setProperty("--rows", level.height);
  dom.boardFrame.classList.toggle("board-frame--dense", level.width > 12);
  dom.routeLayer.setAttribute("viewBox", `0 0 ${level.width} ${level.height}`);
  dom.routeLayer.setAttribute("preserveAspectRatio", "none");

  level.rows.forEach((row, r) => {
    row.forEach((tileCode, c) => {
      const def = TILE_DEFS[tileCode];
      const cell = document.createElement("div");
      cell.className = `cell cell--${def.type}`;
      cell.dataset.r = String(r);
      cell.dataset.c = String(c);
      cell.dataset.variation = String((r * 13 + c * 5 + level.id + session.packIndex) % 2);
      cell.dataset.key = `${r},${c}`;
      if (level.mode === "convoy" && def.commander) {
        cell.classList.toggle("is-active-commander", def.commander === currentCommander()?.id);
        cell.classList.toggle("is-locked-commander", session.routes.some((route) => route.commanderId === def.commander));
      }
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-label", `${def.label}, row ${r + 1}, column ${c + 1}`);
      renderTileContents(cell, tileCode, r, c);
      dom.board.append(cell);
    });
  });
  renderObjectiveTiles();
}

function renderPackSelector() {
  dom.packSelector.replaceChildren();
  PACKS.forEach((pack, index) => {
    const cleared = pack.levels.filter((level) => session.completed.has(levelKey(pack, level))).length;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `pack-tab pack-tab--${pack.accent}`;
    button.role = "tab";
    button.setAttribute("aria-selected", String(index === session.packIndex));
    button.setAttribute("aria-label", `${pack.name}, ${cleared} of ${pack.levels.length} cleared`);
    if (index === session.packIndex) button.classList.add("is-current");
    if (cleared === pack.levels.length) button.classList.add("is-complete");
    button.innerHTML = `<span>0${pack.number}</span><strong>${pack.shortName}</strong><small>${cleared}/${pack.levels.length}</small>`;
    button.addEventListener("click", () => loadPack(index));
    dom.packSelector.append(button);
  });
}

function renderLevelList() {
  dom.levelList.replaceChildren();
  session.pack.levels.forEach((level, index) => {
    const completeKey = levelKey(session.pack, level);
    const isComplete = session.completed.has(completeKey);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "level-button";
    if (index === session.levelIndex) button.classList.add("is-current");
    if (isComplete) button.classList.add("is-complete");
    button.setAttribute("aria-current", index === session.levelIndex ? "step" : "false");
    button.setAttribute("aria-label", `Level ${level.id}: ${level.name}, difficulty ${level.difficulty} of 10${isComplete ? ", cleared" : ""}`);
    button.innerHTML = `
      <span class="level-button__number">${isComplete ? "✓" : String(level.id).padStart(2, "0")}</span>
      <span class="level-button__copy"><strong>${level.name}</strong><small>${level.mechanic}</small></span>
      <span class="level-button__check">${index === session.levelIndex ? "◆" : ""}</span>
    `;
    button.addEventListener("click", () => loadLevel(index));
    dom.levelList.append(button);
  });

  const cleared = session.pack.levels.filter((level) => session.completed.has(levelKey(session.pack, level))).length;
  dom.progressCopy.textContent = `${cleared} / ${session.pack.levels.length} CLEARED`;
  dom.progressFill.style.width = `${(cleared / session.pack.levels.length) * 100}%`;
  renderPackSelector();
}

function renderRules() {
  const rules = session.pack.id === "second-wind"
    ? [
        ["Build the company en route", "Every mission begins with the lone commander and no ready units."],
        ["Spend soldiers at goblins", "Handled soldiers become tired, exactly as they do in the Green March."],
        ["Time the healer", "A healer immediately returns every tired soldier to the ready line."],
        ["Use the whole field", "Specialists, switches, and costs still resolve in the order you draw them."],
      ]
    : session.level.mode === "relief"
    ? [
        ["Feed from beside the trail", "Each adjacent route tile serves one meal."],
        ["Respect the movement budget", "The counter includes every step, and there is no room for loops."],
        ["Draw one clean route", "Move orthogonally and never cross your own trail."],
        ["Serve everyone, then finish", "The relief banner opens only after every hunger badge is full."],
      ]
    : session.level.mode === "convoy"
      ? [
          ["Command in the shown order", "Finish the glowing commander's route before the next begins."],
          ["Locked routes become walls", "No commander may cross any earlier trail."],
          ["Use each specialty", "Alder has soldiers, Bramble builds, and Cinder calms dragons."],
          ["Claim the full mission", "Reach matching standards and include every beacon across the routes."],
        ]
      : [
          ["Draw one route", "Move only up, down, left, or right."],
          ["Never cross your trail", "Pull back one tile to undo while drawing."],
          ["Rally before danger", "Units and switches resolve in route order."],
          ["End at the banner", "Arrive with every obstacle handled."],
        ];
  dom.rulesList.innerHTML = rules.map(([title, copy]) => `<li><b>${title}</b><span>${copy}</span></li>`).join("");

  const legend = session.pack.id === "second-wind"
    ? [["recruit", "Recruit"], ["healer", "Healer"], ["danger", "Danger"]]
    : session.level.mode === "relief"
    ? [["hungry", "Hungry"], ["served", "Served"], ["relief", "Relief trail"]]
    : session.level.mode === "convoy"
      ? [["commander", "Commander"], ["beacon", "Beacon"], ["locked", "Locked trail"]]
      : [["recruit", "Recruit"], ["danger", "Danger"], ["route", "Your route"]];
  dom.mapLegend.innerHTML = legend
    .map(([kind, label]) => `<span><i class="legend-swatch legend-swatch--${kind}"></i> ${label}</span>`)
    .join("");
}

function renderMetadata() {
  const level = session.level;
  dom.levelNumber.textContent = `LEVEL ${String(level.id).padStart(2, "0")}`;
  dom.chapter.textContent = `PACK 0${session.pack.number} · ${String(level.id).padStart(2, "0")}`;
  dom.packTitle.textContent = session.pack.name.toUpperCase();
  dom.campaignEyebrow.textContent = session.pack.eyebrow;
  dom.packDescription.textContent = session.pack.description;
  dom.levelTitle.textContent = level.name;
  dom.levelBriefing.textContent = level.briefing;
  dom.difficulty.textContent = `${difficultyName(level.difficulty)} · ${level.difficulty}/10`;
  dom.mechanic.textContent = `${level.id === 1 ? "CORE" : "FIELD NOTE"}: ${level.mechanic.toUpperCase()}`;
  dom.tip.textContent = level.tip;
  const hasSeals = level.map.some((row) => /[yYqQ]/.test(row));
  dom.sealMeter.hidden = !hasSeals;
  document.body.dataset.pack = session.pack.accent;
  renderRules();
}

function svgNode(name, className) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", name);
  node.setAttribute("class", className);
  return node;
}

function allVisibleRoutes() {
  const locked = session.routes.map((route, index) => ({
    path: route.path,
    className: route.commanderId ?? `route-${index}`,
    locked: true,
  }));
  if (session.path.length) {
    locked.push({
      path: session.path,
      className: currentCommander()?.id ?? session.pack.accent,
      locked: false,
    });
  }
  return locked;
}

function renderObjectiveTiles() {
  if (!dom.board.children.length) return;
  if (session.level.mode === "relief") {
    session.level.targets.forEach((target) => {
      const cell = cellFor(target);
      const delivered = session.party.deliveries.get(keyOf(target)) ?? 0;
      cell?.classList.toggle("is-fed", delivered >= target.need);
      cell?.querySelectorAll(".hunger-pips i").forEach((pip, index) => pip.classList.toggle("is-filled", index < delivered));
      const badge = cell?.querySelector(".tile-badge--hunger");
      if (badge) badge.textContent = delivered >= target.need ? "✓" : `${delivered}/${target.need}`;
    });
  }
  if (session.level.mode === "convoy") {
    const lit = completedBeaconSet();
    session.level.beacons.forEach((beacon) => cellFor(beacon)?.classList.toggle("is-lit", lit.has(keyOf(beacon))));
  }
}

function renderPath() {
  dom.routeLayer.replaceChildren();
  const routes = allVisibleRoutes();
  routes.forEach((route) => {
    const points = route.path.map(({ r, c }) => `${c + 0.5},${r + 0.5}`).join(" ");
    const shadow = svgNode("polyline", "route-shadow");
    const line = svgNode("polyline", `route-line route-line--${route.className}${route.locked ? " is-locked" : ""}`);
    shadow.setAttribute("points", points);
    line.setAttribute("points", points);
    dom.routeLayer.append(shadow, line);
  });

  const head = session.path.at(-1);
  if (head) {
    const headNode = svgNode("circle", `route-head route-head--${currentCommander()?.id ?? session.pack.accent}`);
    headNode.setAttribute("r", "0.19");
    headNode.setAttribute("cx", String(head.c + 0.5));
    headNode.setAttribute("cy", String(head.r + 0.5));
    dom.routeLayer.append(headNode);
  }

  const visited = new Set(routes.flatMap((route) => route.path.map(keyOf)));
  dom.board.querySelectorAll(".cell").forEach((cell) => {
    cell.classList.toggle("cell--visited", visited.has(cell.dataset.key));
    cell.classList.toggle("cell--locked-route", session.routes.some((route) => route.path.some((position) => keyOf(position) === cell.dataset.key)));
  });
  renderObjectiveTiles();
}

function followerTypes() {
  const types = [];
  for (let index = 0; index < session.party.healers; index += 1) types.push("healer");
  for (let index = 0; index < Math.min(session.party.soldiers, 4); index += 1) types.push("soldier");
  for (let index = 0; index < session.party.mages; index += 1) types.push("mage");
  for (let index = 0; index < session.party.builders; index += 1) types.push("builder");
  return types.slice(0, 4);
}

function renderParty(animate = false) {
  const position = session.path.at(-1) ?? activeStart();
  dom.party.style.left = `${((position.c + 0.5) / session.level.width) * 100}%`;
  dom.party.style.top = `${((position.r + 0.5) / session.level.height) * 100}%`;
  dom.party.replaceChildren();
  const commanderId = currentCommander()?.id;
  const commander = image(ASSETS[commanderId] ?? ASSETS.commander, `party-member${commanderId ? ` party-member--${commanderId}` : ""}`);
  dom.party.append(commander);
  followerTypes().forEach((type) => dom.party.append(image(ASSETS[type], "party-follower")));
  if (animate) {
    dom.party.classList.remove("is-stepping");
    void dom.party.offsetWidth;
    dom.party.classList.add("is-stepping");
  }
}

function bumpRoster(type) {
  let card = null;
  if (type === "recruit" || type === "goblin") card = dom.soldierCard;
  if (type === "mage" || type === "dragon") card = dom.mageCard;
  if (type === "builder" || type === "river") card = dom.builderCard;
  if (type === "healer") card = dom.healerCard;
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
  dom.healerCount.textContent = String(session.party.healers);
  dom.soldierCard.classList.toggle("is-active", session.party.soldiers > 0);
  dom.mageCard.classList.toggle("is-active", session.party.mages > 0);
  dom.builderCard.classList.toggle("is-active", session.party.builders > 0);
  dom.healerCard.classList.toggle("is-active", session.party.healers > 0);
  dom.sunSeal.classList.toggle("is-open", session.party.switches.has("sun"));
  dom.moonSeal.classList.toggle("is-open", session.party.switches.has("moon"));
  renderRouteMeters();
  renderCommanderOrder();
  if (event) bumpRoster(event.type);
}

function renderRouteMeters() {
  if (session.level.mode === "relief") {
    const delivered = session.level.targets.reduce((sum, target) => sum + Math.min(target.need, session.party.deliveries.get(keyOf(target)) ?? 0), 0);
    const required = session.level.targets.reduce((sum, target) => sum + target.need, 0);
    dom.movementLabel.textContent = "MOVEMENT BUDGET";
    dom.movementCount.textContent = `${session.party.moves} / ${movementLimit(session.level, null, session.party)}`;
    dom.objectiveLabel.textContent = "MEALS DELIVERED";
    dom.objectiveCount.textContent = `${delivered} / ${required}`;
    return;
  }
  if (session.level.mode === "convoy") {
    const commander = currentCommander();
    const lit = completedBeaconSet().size;
    const securedRoutes = session.routes.length + (session.mode === "won" ? 1 : 0);
    dom.movementLabel.textContent = commander ? `${commander.name.toUpperCase()} · MOVE` : "MOVEMENT";
    dom.movementCount.textContent = commander ? `${session.party.moves} / ${movementLimit(session.level, commander, session.party)}` : "—";
    dom.objectiveLabel.textContent = "ROUTES · BEACONS";
    dom.objectiveCount.textContent = `${securedRoutes}/${session.level.commanders.length} · ${lit}/${session.level.beacons.length}`;
    return;
  }
  dom.movementLabel.textContent = "ROUTE LENGTH";
  dom.movementCount.textContent = String(Math.max(0, session.path.length - 1));
  dom.objectiveLabel.textContent = "READY COMPANY";
  dom.objectiveCount.textContent = `${session.party.soldiers + session.party.mages + session.party.builders + session.party.healers}`;
}

function renderCommanderOrder() {
  const convoy = session.level.mode === "convoy";
  dom.commanderOrder.hidden = !convoy;
  if (!convoy) {
    dom.commanderOrder.replaceChildren();
    return;
  }
  dom.commanderOrder.replaceChildren();
  session.level.commanders.forEach((commander, index) => {
    const chip = document.createElement("div");
    chip.className = `commander-chip commander-chip--${commander.id}`;
    if (index === session.commanderIndex && session.mode !== "won") chip.classList.add("is-active");
    if (index < session.commanderIndex || session.mode === "won") chip.classList.add("is-complete");
    chip.innerHTML = `<img src="${ASSETS[commander.id]}" alt=""><span><b>${index + 1}. ${commander.name.replace(/^(Captain|Warden|Sage) /, "")}</b><small>${commander.maxMoves} move${commander.maxMoves === 1 ? "" : "s"}</small></span><i>${index < session.commanderIndex || session.mode === "won" ? "✓" : index === session.commanderIndex ? "◆" : ""}</i>`;
    dom.commanderOrder.append(chip);
  });
}

function defaultStatus() {
  if (!session.path.length) {
    if (session.level.mode === "convoy") return `<b>${currentCommander()?.name.toUpperCase()}</b> · draw from the glowing start`;
    return "<b>PRESS + DRAG</b> from your commander";
  }
  const budget = session.level.mode === "campaign" ? `${session.path.length} tiles` : `${session.party.moves} movement used`;
  return `<b>KEEP DRAWING</b> from the glowing head · ${budget}`;
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
    case "healer": return event.restored
      ? `<b>SECOND WIND!</b> The healer returns ${event.restored} tired soldier${event.restored === 1 ? "" : "s"} to duty.`
      : "<b>HEALER RALLIED!</b> No one is tired yet — timing matters.";
    case "switch": return `<b>${event.channel.toUpperCase()} SWITCH LIT!</b> Its matching gate is open.`;
    case "gate": return `<b>${event.channel.toUpperCase()} GATE OPEN!</b> March through.`;
    case "delivery": {
      const count = event.targets.length;
      return `<b>${count > 1 ? "DOUBLE DELIVERY!" : "MEAL DELIVERED!"}</b> A hunger badge fills beside the trail.`;
    }
    case "beacon": return "<b>BEACON LIT!</b> Its signal counts across every commander route.";
    case "mud": return "<b>DEEP MUD</b> This square costs two movement.";
    case "supply": return `<b>SUPPLIES FOUND!</b> The active commander gains ${event.bonusMoves} movement.`;
    case "current": return "<b>MARCHING ARROW</b> Your next step must follow its direction.";
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
  if (event.type === "healer") return "healer";
  if (event.type === "switch") return "switch";
  if (event.type === "gate") return "gate";
  if (["delivery", "beacon", "mud", "supply", "current"].includes(event.type)) return event.type;
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
    session.party = createPartyState(currentCommander()?.initial);
    return;
  }
  const result = simulatePath(session.level, session.path, { commander: currentCommander() });
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

function lockedRouteAt(position) {
  const positionKey = keyOf(position);
  return session.routes.some((route) => route.path.some((step) => keyOf(step) === positionKey));
}

function reservedCommanderTile(position) {
  if (session.level.mode !== "convoy") return false;
  const def = TILE_DEFS[tileAt(position)];
  return ["commanderStart", "commanderGoal"].includes(def?.type) && def.commander !== currentCommander()?.id;
}

function lockCommanderRoute() {
  const commander = currentCommander();
  session.routes.push({
    commanderId: commander.id,
    path: session.path.map((position) => ({ ...position })),
    state: createPartyState(session.party),
  });
  session.commanderIndex += 1;
  session.path = [];
  session.party = createPartyState(currentCommander()?.initial);
  session.mode = "idle";
  audio.play("switch");
  renderBoard();
  refreshSession(null, true);
  setStatus(`<b>${commander.name.toUpperCase()} SECURED!</b> ${currentCommander().name} now draws the next locked route.`, "success", 2400);
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
  if (!moveAllowedFrom(session.level, head, position)) {
    const direction = forcedDirectionAt(session.level, head);
    flashBlocked(position, `The marching arrow requires the next step ${direction === "U" ? "north" : direction === "R" ? "east" : direction === "D" ? "south" : "west"}.`);
    return false;
  }
  if (session.path.some((step) => samePosition(step, position))) {
    flashBlocked(position, "The trail cannot cross itself. Pull back one square instead.");
    return false;
  }
  if (lockedRouteAt(position)) {
    flashBlocked(position, "A locked commander route already occupies that square.");
    return false;
  }
  if (reservedCommanderTile(position)) {
    flashBlocked(position, "That start or standard is reserved for another commander.");
    return false;
  }

  const transition = advanceState(session.level, session.party, position, { commander: currentCommander() });
  if (!transition.ok) {
    flashBlocked(position, transition.reason);
    return false;
  }

  const isActiveGoal = samePosition(position, activeGoal());
  const isFinalCommander = session.level.mode === "convoy" && session.commanderIndex === session.level.commanders.length - 1;
  if (isActiveGoal && isFinalCommander) {
    const finalBeacons = completedBeaconSet(false);
    transition.state.beacons.forEach((beacon) => finalBeacons.add(beacon));
    if (!beaconsComplete(session.level, finalBeacons)) {
      flashBlocked(position, "Light every rally beacon before the final commander reaches their standard.");
      return false;
    }
  }

  session.path.push(position);
  session.party = transition.state;
  session.mode = "drawing";
  markFresh(position);
  const cue = audioCue(transition.event);
  audio.play(cue, session.path.length);
  refreshSession(transition.event, true);

  if (isActiveGoal) {
    if (session.level.mode === "convoy" && !isFinalCommander) lockCommanderRoute();
    else finishLevel();
  }
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
  session.path = [{ ...activeStart() }];
  const startTransition = advanceState(session.level, createPartyState(currentCommander()?.initial), activeStart(), {
    commander: currentCommander(),
    countMove: false,
  });
  session.party = startTransition.state;
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
    if (!samePosition(position, activeStart())) {
      flashBlocked(position, session.level.mode === "convoy" ? `Begin on ${currentCommander().name}, the glowing active commander.` : "Begin on the commander.");
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

  session.drawing = session.mode !== "won" && session.path.length > 0;
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
  session.completed.add(currentLevelKey());
  persistCompleted();
  renderLevelList();
  renderRouteMeters();
  renderCommanderOrder();
  dom.undo.disabled = true;
  dom.party.classList.add("is-winning");
  createConfetti();
  audio.play("win");
  setStatus("<b>ROUTE SECURED!</b> Your company reached the royal banner.", "success");

  const isPackFinale = session.levelIndex === session.pack.levels.length - 1;
  const isGameFinale = isPackFinale && session.packIndex === PACKS.length - 1;
  dom.victoryTitle.textContent = isGameFinale ? "The company rises again!" : isPackFinale ? `${session.pack.shortName} complete!` : "Company assembled!";
  dom.victoryCopy.textContent = isGameFinale
    ? "The lone commander turned every hard choice into one final, unstoppable company."
    : isPackFinale
      ? `${session.pack.name} is secure. A new campaign is ready.`
      : `${session.level.name} is secure. The next march awaits.`;
  const totalTiles = session.routes.reduce((sum, route) => sum + route.path.length, 0) + session.path.length;
  dom.victorySteps.textContent = String(totalTiles);
  dom.victoryRank.textContent = session.level.difficulty >= 9 ? "★★★" : session.level.difficulty >= 6 ? "★★" : "★";
  dom.next.innerHTML = isGameFinale
    ? "FIRST PACK <span>↻</span>"
    : isPackFinale
      ? "NEXT PACK <span>→</span>"
      : "NEXT MARCH <span>→</span>";

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
  session.routes = [];
  session.commanderIndex = 0;
  session.party = createPartyState(currentCommander()?.initial);
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
  const levels = session.pack.levels;
  session.levelIndex = (index + levels.length) % levels.length;
  session.level = levels[session.levelIndex];
  session.path = [];
  session.routes = [];
  session.commanderIndex = 0;
  session.party = createPartyState(currentCommander()?.initial);
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
  if (window.matchMedia("(max-width: 820px)").matches) {
    dom.missionPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function loadPack(index) {
  session.packIndex = (index + PACKS.length) % PACKS.length;
  session.pack = PACKS[session.packIndex];
  audio.setTheme(session.packIndex);
  loadLevel(0);
}

function loadNextMission() {
  if (session.levelIndex < session.pack.levels.length - 1) {
    loadLevel(session.levelIndex + 1);
    return;
  }
  loadPack(session.packIndex < PACKS.length - 1 ? session.packIndex + 1 : 0);
}

function commonPrefixLength(a, b) {
  let index = 0;
  while (index < a.length && index < b.length && samePosition(a[index], b[index])) index += 1;
  return index;
}

function showNudge() {
  audio.ensure();
  const scoutReport = cachedSolution();
  const solution = session.level.mode === "convoy"
    ? scoutReport?.routes.find((route) => route.commanderId === currentCommander()?.id)?.path
    : scoutReport;
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
dom.next.addEventListener("click", loadNextMission);

updateSoundButton();
audio.setTheme(0);
loadLevel(0);
