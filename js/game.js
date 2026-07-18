import {
  TILE_DEFS,
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
  tracePath,
} from "./engine.js";
import { PACKS, levelKey } from "./levels.js";
import { createLevelDesigner } from "./designer.js";

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

const AUDIO_ASSETS = Object.freeze({
  draw: "./assets/audio/kenney-rpg/metalClick.ogg",
  footsteps: Object.freeze([
    "./assets/audio/kenney-rpg/footstep00.ogg",
    "./assets/audio/kenney-rpg/footstep01.ogg",
    "./assets/audio/kenney-rpg/footstep02.ogg",
    "./assets/audio/kenney-rpg/footstep03.ogg",
    "./assets/audio/kenney-rpg/footstep04.ogg",
    "./assets/audio/kenney-rpg/footstep05.ogg",
  ]),
  soldierPickup: "./assets/audio/kenney-rpg/cloth1.ogg",
  builderPickup: "./assets/audio/kenney-rpg/cloth2.ogg",
  healerPickup: "./assets/audio/kenney-rpg/cloth2.ogg",
  magePickup: "./assets/audio/kenney-rpg/bookOpen.ogg",
  mageCast: "./assets/audio/kenney-rpg/bookFlip1.ogg",
  buildStrike: "./assets/audio/kenney-rpg/chop.ogg",
  bridgeCreak: "./assets/audio/kenney-rpg/creak1.ogg",
  bridgeSettle: "./assets/audio/kenney-rpg/doorClose_1.ogg",
  gateOpen: "./assets/audio/kenney-rpg/doorOpen_1.ogg",
  soldierWindup: "./assets/audio/kenney-rpg/drawKnife1.ogg",
  soldierImpact: "./assets/audio/kenney-rpg/knifeSlice.ogg",
  goblinDeath: "./assets/audio/kenney-rpg/dropLeather.ogg",
  orcDeath: "./assets/audio/kenney-rpg/metalPot2.ogg",
  largeDeath: "./assets/audio/kenney-rpg/creak3.ogg",
});

const dom = {
  board: document.querySelector("#gameBoard"),
  boardStage: document.querySelector("#boardStage"),
  missionPanel: document.querySelector(".mission-panel"),
  boardFrame: document.querySelector(".board-frame"),
  routeLayer: document.querySelector("#routeLayer"),
  party: document.querySelector("#partyToken"),
  planningGhost: document.querySelector("#planningGhost"),
  executionFx: document.querySelector("#executionFxLayer"),
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
  solve: document.querySelector("#solvePuzzleButton"),
  companyHeading: document.querySelector("#companyHeading"),
  companyPhase: document.querySelector("#companyPhase"),
  companyPhaseText: document.querySelector("#companyPhaseText"),
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
  backToDesigner: document.querySelector("#backToDesignerButton"),
  designer: document.querySelector("#designerButton"),
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
    this.preloadedSamples = new Map();
    this.activeSamples = new Set();
  }

  ensure() {
    this.primeSamples();
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
    this.activeSamples.forEach((sample) => { sample.muted = this.muted; });
    if (!this.muted) this.scheduleMusic();
    return this.muted;
  }

  primeSamples() {
    const sources = Object.values(AUDIO_ASSETS).flat();
    sources.forEach((src) => {
      if (this.preloadedSamples.has(src)) return;
      const sample = new Audio(src);
      sample.preload = "auto";
      this.preloadedSamples.set(src, sample);
    });
  }

  sample(cue, step = 0, options = {}) {
    if (this.muted) return;
    const source = AUDIO_ASSETS[cue];
    const src = Array.isArray(source) ? source[step % source.length] : source;
    if (!src) return;
    const sample = new Audio(src);
    sample.preload = "auto";
    sample.volume = Math.min(1, options.volume ?? 0.32);
    sample.playbackRate = options.rate ?? 1;
    sample.muted = this.muted;
    this.activeSamples.add(sample);
    const release = () => this.activeSamples.delete(sample);
    sample.addEventListener("ended", release, { once: true });
    sample.addEventListener("error", release, { once: true });
    sample.play().catch(release);
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
      case "draw":
        this.sample("draw", step, { volume: 0.16, rate: 1.05 + (step % 4) * 0.035 });
        this.tone(250 + (step % 5) * 18, 0.035, "triangle", 0.035);
        break;
      case "move":
        this.sample("footsteps", step, { volume: 0.28, rate: 1.04 + (step % 3) * 0.025 });
        break;
      case "commanderReady":
        // A tiny two-syllable, wordless "mip-mup" made from short formant-like tones.
        this.tone(360, 0.085, "square", 0.075, 0, 520);
        this.tone(540, 0.1, "triangle", 0.085, 0.09, 420);
        this.tone(720, 0.055, "sine", 0.04, 0.035, 610);
        break;
      case "step":
        this.sample("footsteps", step, { volume: 0.26 });
        break;
      case "undo":
        this.tone(170, 0.07, "triangle", 0.08, 0, 118);
        break;
      case "recruit":
        this.sample("soldierPickup", step, { volume: 0.3, rate: 1.08 });
        [330, 440, 554].forEach((note, index) => this.tone(note, 0.11, "square", 0.07, index * 0.055));
        break;
      case "mage":
        this.sample("magePickup", step, { volume: 0.3, rate: 1.08 });
        [392, 587, 784].forEach((note, index) => this.tone(note, 0.18, "sine", 0.065, index * 0.07));
        break;
      case "builder":
        this.sample("builderPickup", step, { volume: 0.32, rate: 0.96 });
        [170, 220, 180].forEach((note, index) => this.tone(note, 0.055, "square", 0.065, index * 0.045));
        break;
      case "healer":
        this.sample("healerPickup", step, { volume: 0.27, rate: 1.18 });
        [330, 440, 523, 659].forEach((note, index) => this.tone(note, 0.15, "sine", 0.07, index * 0.055));
        break;
      case "heal":
        this.sample("healerPickup", step, { volume: 0.26, rate: 1.34 });
        [294, 392, 494, 659, 784].forEach((note, index) => this.tone(note, 0.2, "sine", 0.05, index * 0.035));
        break;
      case "soldierAttack":
        this.sample("soldierWindup", step, { volume: 0.35, rate: 1.12 });
        break;
      case "soldierImpact":
        this.sample("soldierImpact", step, { volume: 0.38, rate: 1.05 });
        this.noise(0.06, 0.055);
        break;
      case "goblinDeath":
        this.sample("goblinDeath", step, { volume: 0.38, rate: 1.18 });
        this.tone(150, 0.13, "sine", 0.08, 0, 92);
        break;
      case "orcDeath":
        this.sample("orcDeath", step, { volume: 0.38, rate: 1.05 });
        this.tone(118, 0.18, "sawtooth", 0.055, 0, 76);
        break;
      case "ogreDeath":
        this.sample("largeDeath", step, { volume: 0.42, rate: 0.76 });
        this.sample("orcDeath", step, { volume: 0.3, rate: 0.78 });
        this.noise(0.18, 0.09);
        break;
      case "goblin":
        this.noise(0.13, 0.11);
        this.tone(125, 0.16, "sine", 0.12, 0, 86);
        break;
      case "dragon":
        this.sample("mageCast", step, { volume: 0.3, rate: 1.16 });
        this.noise(0.2, 0.08);
        this.tone(220, 0.28, "sawtooth", 0.07, 0, 560);
        this.tone(880, 0.18, "sine", 0.045, 0.12);
        break;
      case "dragonDeath":
        this.sample("largeDeath", step, { volume: 0.42, rate: 0.62 });
        this.tone(190, 0.32, "sawtooth", 0.07, 0, 72);
        this.noise(0.24, 0.08);
        break;
      case "river":
        this.sample("buildStrike", step, { volume: 0.34, rate: 1.02 });
        this.sample("bridgeCreak", step, { volume: 0.25, rate: 1.1 });
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
        this.sample("gateOpen", step, { volume: 0.3, rate: 1.18 });
        this.tone(280, 0.18, "square", 0.07, 0, 105);
        break;
      case "blocked":
        this.tone(92, 0.12, "square", 0.075);
        break;
      case "win":
        this.sample("bridgeSettle", step, { volume: 0.28, rate: 1.25 });
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
  drafts: new Map(),
  commanderIndex: 0,
  party: createPartyState(),
  completed: readCompleted(),
  phase: "planning",
  drawing: false,
  pointerId: null,
  mode: "idle",
  statusTimer: null,
  victoryTimer: null,
  executionRunId: 0,
  execution: null,
  blockedFeedback: { key: "", at: 0, audioAt: 0 },
  lastUndoAt: 0,
  playtest: null,
};
let designerController = null;

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
  if (session.playtest) return `designer:${session.playtest.designId}:${session.level.map.join("/")}`;
  return levelKey(session.pack, session.level);
}

function cachedSolution() {
  const cacheKey = currentLevelKey();
  if (!solutionCache.has(cacheKey)) solutionCache.set(cacheKey, solveLevel(session.level, 1)[0] ?? null);
  return solutionCache.get(cacheKey);
}

function commanderById(commanderId) {
  return session.level.mode === "convoy"
    ? session.level.commanders.find((commander) => commander.id === commanderId) ?? null
    : null;
}

function plannedRouteSpecs(includeActive = true) {
  if (session.level.mode !== "convoy") {
    return includeActive && session.path.length
      ? [{ commanderId: null, path: session.path.map((position) => ({ ...position })) }]
      : [];
  }
  const routes = session.routes.map((route) => ({
    commanderId: route.commanderId,
    path: route.path.map((position) => ({ ...position })),
  }));
  if (includeActive && session.path.length) {
    routes.push({
      commanderId: currentCommander()?.id ?? null,
      path: session.path.map((position) => ({ ...position })),
    });
  }
  return routes;
}

function compilePlannedRoutes() {
  return plannedRouteSpecs().map((route) => {
    const commander = commanderById(route.commanderId);
    return {
      ...route,
      commander,
      trace: tracePath(session.level, route.path, { commander }),
    };
  });
}

function planSolved() {
  if (session.phase !== "planning" || !session.path.length) return false;
  const compiled = compilePlannedRoutes();
  if (session.level.mode !== "convoy") return compiled.length === 1 && compiled[0].trace.ok && compiled[0].trace.won;
  if (compiled.length !== session.level.commanders.length || compiled.some((route) => !route.trace.ok || !route.trace.won)) return false;
  const beacons = new Set();
  compiled.forEach((route) => route.trace.state.beacons.forEach((key) => beacons.add(key)));
  return beaconsComplete(session.level, beacons);
}

function executionStateActive() {
  return (session.phase === "executing" || session.phase === "won") && session.execution;
}

function completedCommanderIds() {
  return new Set(session.routes.map((route) => route.commanderId));
}

function displayedCommanderState() {
  if (session.level.mode !== "convoy") return { activeId: null, completed: new Set() };
  if (session.phase === "won") {
    return {
      activeId: null,
      completed: new Set((session.execution?.routes ?? []).map((route) => route.commanderId)),
    };
  }
  if (session.phase === "executing" && session.execution) {
    return {
      activeId: session.execution.commanderId,
      completed: new Set(
        session.execution.routes
          .slice(0, session.execution.routeIndex)
          .map((route) => route.commanderId),
      ),
    };
  }
  return {
    activeId: currentCommander()?.id ?? null,
    completed: completedCommanderIds(),
  };
}

function visibleBeaconSet(includeActive = true) {
  const beacons = new Set();
  session.routes.forEach((route) => route.state.beacons.forEach((key) => beacons.add(key)));
  session.drafts.forEach((draft) => draft.state.beacons.forEach((key) => beacons.add(key)));
  if (includeActive) session.party.beacons.forEach((key) => beacons.add(key));
  return beacons;
}

function securedBeaconSet() {
  const beacons = new Set();
  session.routes.forEach((route) => route.state.beacons.forEach((key) => beacons.add(key)));
  return beacons;
}

function executedBeaconSet() {
  const beacons = new Set(session.execution?.beacons ?? []);
  if (session.phase === "executing" || session.phase === "won") {
    session.party.beacons.forEach((key) => beacons.add(key));
  }
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
  const commanderDisplay = displayedCommanderState();
  dom.board.replaceChildren();
  dom.board.dataset.mode = level.mode;
  dom.boardFrame.dataset.mode = level.mode;
  dom.board.dataset.phase = session.phase;
  dom.boardFrame.dataset.phase = session.phase;
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
      if (def.type === "goblin") cell.dataset.enemyTier = String(def.cost);
      if (level.mode === "convoy" && def.commander) {
        cell.classList.toggle("is-active-commander", def.commander === commanderDisplay.activeId);
        cell.classList.toggle("is-locked-commander", commanderDisplay.completed.has(def.commander));
        cell.classList.toggle("has-draft-commander", session.drafts.has(def.commander));
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
    button.disabled = session.phase === "executing";
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
    button.disabled = session.phase === "executing";
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
          ["Choose any commander", "Switch from a commander card or an unfinished commander's start tile."],
          ["Every route reserves space", "Completed and unfinished trails stay put, so commanders cannot cross."],
          ["Use each specialty", "Alder has soldiers, Bramble builds, and Cinder calms dragons."],
          ["Claim the full mission", "Reach matching standards and include every beacon across the routes."],
        ]
      : [
          ["Draw one route", "Move only up, down, left, or right."],
          ["Rewind freely", "Drag onto any earlier trail tile to pull back there instantly."],
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
  dom.levelNumber.textContent = session.playtest ? "DRAFT PLAYTEST" : `LEVEL ${String(level.id).padStart(2, "0")}`;
  dom.chapter.textContent = session.playtest ? "WORKSHOP · PLAYTEST" : `PACK 0${session.pack.number} · ${String(level.id).padStart(2, "0")}`;
  dom.packTitle.textContent = session.playtest ? "CUSTOM LEVEL" : session.pack.name.toUpperCase();
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
  const visible = session.routes.map((route, index) => ({
    path: route.path,
    className: route.commanderId ?? `route-${index}`,
    locked: session.phase === "planning"
      || session.phase === "won"
      || (session.phase === "executing" && index < (session.execution?.routeIndex ?? 0)),
  }));
  session.drafts.forEach((draft, commanderId) => {
    if (!draft.path.length) return;
    visible.push({
      path: draft.path,
      className: commanderId,
      locked: false,
      draft: true,
    });
  });
  if (session.path.length) {
    visible.push({
      path: session.path,
      className: currentCommander()?.id ?? session.pack.accent,
      locked: session.phase === "won",
    });
  }
  return visible;
}

function renderObjectiveTiles() {
  if (!dom.board.children.length) return;
  const planning = session.phase === "planning";
  if (session.level.mode === "relief") {
    session.level.targets.forEach((target) => {
      const cell = cellFor(target);
      const delivered = session.party.deliveries.get(keyOf(target)) ?? 0;
      cell?.classList.toggle("is-planned-fed", planning && delivered >= target.need);
      cell?.classList.toggle("is-fed", !planning && delivered >= target.need);
      cell?.querySelectorAll(".hunger-pips i").forEach((pip, index) => {
        pip.classList.toggle("is-planned-filled", planning && index < delivered);
        pip.classList.toggle("is-filled", !planning && index < delivered);
      });
      const badge = cell?.querySelector(".tile-badge--hunger");
      if (badge) badge.textContent = delivered >= target.need ? (planning ? "◇" : "✓") : `${delivered}/${target.need}`;
    });
  }
  if (session.level.mode === "convoy") {
    const lit = planning ? visibleBeaconSet() : executedBeaconSet();
    session.level.beacons.forEach((beacon) => {
      const cell = cellFor(beacon);
      cell?.classList.toggle("is-planned-lit", planning && lit.has(keyOf(beacon)));
      cell?.classList.toggle("is-lit", !planning && lit.has(keyOf(beacon)));
    });
  }

  const plannedKeys = new Set(allVisibleRoutes().flatMap((route) => route.path.map(keyOf)));
  dom.board.querySelectorAll(".cell").forEach((cell) => {
    const tile = TILE_DEFS[tileAt(positionFromCell(cell))];
    const planned = planning && plannedKeys.has(cell.dataset.key);
    cell.classList.toggle("is-planned-bridge", planned && tile?.type === "river");
    cell.classList.toggle("is-planned-open", planned && tile?.type === "gate");
  });
}

function renderPath() {
  dom.routeLayer.replaceChildren();
  const routes = allVisibleRoutes();
  routes.forEach((route, routeIndex) => {
    const points = route.path.map(({ r, c }) => `${c + 0.5},${r + 0.5}`).join(" ");
    const shadow = svgNode("polyline", "route-shadow");
    const phaseClass = session.phase === "won" ? " is-executed" : " is-planned";
    const line = svgNode("polyline", `route-line route-line--${route.className}${route.locked ? " is-locked" : ""}${route.draft ? " is-draft" : phaseClass}`);
    shadow.setAttribute("points", points);
    line.setAttribute("points", points);
    dom.routeLayer.append(shadow, line);

    if (session.phase === "executing" && session.execution) {
      const executedLength = routeIndex < session.execution.routeIndex
        ? route.path.length
        : routeIndex === session.execution.routeIndex
          ? session.execution.stepIndex + 1
          : 0;
      if (executedLength > 0) {
        const executed = svgNode("polyline", `route-line route-line--${route.className} is-executed`);
        executed.setAttribute("points", route.path.slice(0, executedLength).map(({ r, c }) => `${c + 0.5},${r + 0.5}`).join(" "));
        dom.routeLayer.append(executed);
      }
    }
  });

  const head = session.phase === "planning" ? session.path.at(-1) : null;
  if (head) {
    const headNode = svgNode("circle", `route-head route-head--${currentCommander()?.id ?? session.pack.accent}`);
    headNode.setAttribute("r", "0.19");
    headNode.setAttribute("cx", String(head.c + 0.5));
    headNode.setAttribute("cy", String(head.r + 0.5));
    dom.routeLayer.append(headNode);
  }

  const planned = new Set(routes.flatMap((route) => route.path.map(keyOf)));
  const locked = new Set(routes.filter((route) => route.locked).flatMap((route) => route.path.map(keyOf)));
  const draft = new Set([...session.drafts.values()].flatMap((route) => route.path.map(keyOf)));
  const resolved = new Set(session.execution?.resolved ?? []);
  dom.board.querySelectorAll(".cell").forEach((cell) => {
    const isPlanned = planned.has(cell.dataset.key);
    const tile = TILE_DEFS[tileAt(positionFromCell(cell))];
    cell.classList.toggle("cell--planned", isPlanned);
    cell.classList.toggle("cell--resolved", resolved.has(cell.dataset.key));
    cell.classList.toggle("cell--planned-event", session.phase === "planning" && isPlanned && !["meadow", "start", "commanderStart"].includes(tile?.type));
    cell.classList.toggle("cell--locked-route", locked.has(cell.dataset.key));
    cell.classList.toggle("cell--draft-route", draft.has(cell.dataset.key));
  });
  renderObjectiveTiles();
}

function followerTypes(state = session.party) {
  const types = [];
  for (let index = 0; index < state.healers; index += 1) types.push("healer");
  for (let index = 0; index < Math.min(state.soldiers, 4); index += 1) types.push("soldier");
  for (let index = 0; index < state.mages; index += 1) types.push("mage");
  for (let index = 0; index < state.builders; index += 1) types.push("builder");
  return types.slice(0, 4);
}

function fillPartyToken(container, state, commanderId) {
  container.replaceChildren();
  const commander = image(ASSETS[commanderId] ?? ASSETS.commander, `party-member${commanderId ? ` party-member--${commanderId}` : ""}`);
  container.append(commander);
  followerTypes(state).forEach((type) => container.append(image(ASSETS[type], "party-follower")));
}

function positionToken(container, position) {
  container.style.left = `${((position.c + 0.5) / session.level.width) * 100}%`;
  container.style.top = `${((position.r + 0.5) / session.level.height) * 100}%`;
}

function renderParty(animate = false) {
  const execution = executionStateActive() ? session.execution : null;
  const commanderId = execution?.commanderId ?? currentCommander()?.id;
  const commander = commanderById(commanderId) ?? currentCommander();
  const position = execution?.position ?? commander?.start ?? session.level.start;
  const state = execution ? session.party : createPartyState(commander?.initial);
  positionToken(dom.party, position);
  fillPartyToken(dom.party, state, commanderId);
  if (animate) {
    dom.party.classList.remove("is-stepping");
    void dom.party.offsetWidth;
    dom.party.classList.add("is-stepping");
  }
}

function renderPlanningGhost() {
  if (!dom.planningGhost) return;
  const visible = session.phase === "planning" && session.path.length > 1;
  dom.planningGhost.hidden = !visible;
  if (!visible) {
    dom.planningGhost.replaceChildren();
    return;
  }
  positionToken(dom.planningGhost, session.path.at(-1));
  fillPartyToken(dom.planningGhost, session.party, currentCommander()?.id);
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
  const ready = planSolved();
  if (dom.companyHeading) dom.companyHeading.textContent = session.phase === "planning" ? "PLANNED COMPANY" : "YOUR COMPANY";
  const phaseText = ready
    ? "READY"
    : session.phase === "planning"
      ? "PREVIEW"
      : session.phase === "executing"
        ? "EXECUTING"
        : "SECURED";
  if (dom.companyPhaseText && dom.companyPhaseText.textContent !== phaseText) {
    dom.companyPhaseText.textContent = phaseText;
  }
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
  if (session.phase === "executing" && session.execution) {
    dom.movementLabel.textContent = "EXECUTION PROGRESS";
    dom.movementCount.textContent = `${session.execution.completedSteps} / ${session.execution.totalSteps}`;
    dom.objectiveLabel.textContent = "CURRENT EVENT";
    dom.objectiveCount.textContent = session.execution.eventLabel ?? "MARCHING";
    return;
  }
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
    const lit = visibleBeaconSet().size;
    const securedRoutes = session.routes.length + (["ready", "executing", "won"].includes(session.mode) ? 1 : 0);
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
  const commanderDisplay = displayedCommanderState();
  session.level.commanders.forEach((commander, index) => {
    const complete = commanderDisplay.completed.has(commander.id);
    const active = commanderDisplay.activeId === commander.id && !complete;
    const hasDraft = session.phase === "planning" && session.drafts.has(commander.id);
    const stateLabel = complete
      ? (session.phase === "planning" ? "route planned" : "route secured")
      : session.phase === "executing"
        ? (active ? "executing route" : "queued route")
        : hasDraft
          ? "unfinished route saved"
          : active
            ? "currently selected"
            : "available";
    const detailLabel = complete
      ? (session.phase === "planning" ? "route planned" : "route secured")
      : session.phase === "executing"
        ? (active ? "executing" : "queued")
        : hasDraft
          ? "unfinished · resume"
          : `${commander.maxMoves} move${commander.maxMoves === 1 ? "" : "s"}`;
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = `commander-chip commander-chip--${commander.id}`;
    if (active) chip.classList.add("is-active");
    if (complete) chip.classList.add("is-complete");
    if (hasDraft) chip.classList.add("has-draft");
    chip.disabled = complete || session.phase !== "planning";
    chip.setAttribute("aria-pressed", String(active));
    chip.setAttribute("aria-label", `${commander.name}, ${stateLabel}`);
    chip.innerHTML = `<img src="${ASSETS[commander.id]}" alt=""><span><b>${commander.name.replace(/^(Captain|Warden|Sage) /, "")}</b><small>${detailLabel}</small></span><i>${complete ? "✓" : active ? "◆" : hasDraft ? "•" : ""}</i>`;
    chip.addEventListener("click", () => selectCommander(index));
    dom.commanderOrder.append(chip);
  });
}

function defaultStatus() {
  if (session.phase === "executing") return `<b>SOLUTION IN MOTION</b> ${session.execution?.eventLabel ?? "Your planned route is playing back."}`;
  if (session.phase === "won") return "<b>ROUTE SECURED!</b> Your company reached the royal banner.";
  if (planSolved()) return "<b>WINNING PLAN READY!</b> Review the route, rewind if needed, or solve the puzzle.";
  if (!session.path.length) {
    if (session.level.mode === "convoy") return `<b>${currentCommander()?.name.toUpperCase()}</b> · draw here, or choose any available commander`;
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
    case "goblin": {
      const enemy = event.cost === 1 ? "GOBLIN" : event.cost === 2 ? "ORC" : "OGRE";
      return `<b>${enemy} DEFEATED!</b> ${event.cost} soldier${event.cost === 1 ? " rests" : "s rest"} here.`;
    }
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

function planningEventStatus(events = []) {
  const event = events.at(-1);
  if (!event) return null;
  switch (event.type) {
    case "recruit": return `<b>PLANNED RALLY</b> ${event.amount} ready soldier${event.amount === 1 ? " joins" : "s join"} the preview company.`;
    case "goblin": return `<b>PLANNED COMBAT</b> ${event.cost} ready soldier${event.cost === 1 ? " becomes" : "s become"} tired here.`;
    case "mage": return "<b>PLANNED RALLY</b> The preview company gains one mage.";
    case "dragon": return "<b>PLANNED SPELL</b> One mage is reserved for this dragon.";
    case "builder": return "<b>PLANNED RALLY</b> The preview company gains one builder.";
    case "river": return "<b>PLANNED BRIDGE</b> One builder is reserved for this crossing.";
    case "healer": return event.restored
      ? `<b>PLANNED SECOND WIND</b> ${event.restored} tired soldier${event.restored === 1 ? " returns" : "s return"} to ready duty.`
      : "<b>PLANNED HEALER</b> No tired soldiers would be restored here.";
    case "switch": return `<b>PLANNED SWITCH</b> The ${event.channel} seal will remain open.`;
    case "gate": return `<b>PLANNED GATE</b> The ${event.channel} seal is available before this step.`;
    case "delivery": return `<b>PLANNED DELIVERY</b> ${event.targets.length} hunger badge${event.targets.length === 1 ? " fills" : "s fill"} beside this tile.`;
    case "beacon": return "<b>PLANNED BEACON</b> This signal is included in the route set.";
    case "supply": return `<b>PLANNED SUPPLIES</b> The movement budget grows by ${event.bonusMoves}.`;
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

function refreshSession(event = null, animate = false, previewEvents = []) {
  const ready = planSolved();
  const visualPhase = ready ? "ready" : session.phase;
  const executing = session.phase === "executing";
  document.body.dataset.gamePhase = visualPhase;
  document.body.classList.toggle("is-execution-locked", executing);
  dom.board.dataset.phase = visualPhase;
  dom.boardFrame.dataset.phase = visualPhase;
  dom.boardFrame.classList.toggle("is-input-locked", executing);
  dom.callout.setAttribute("role", executing ? "presentation" : "status");
  dom.callout.setAttribute("aria-live", executing ? "off" : "polite");
  dom.board.setAttribute("aria-busy", String(executing));
  dom.board.setAttribute("aria-disabled", String(executing));
  dom.board.tabIndex = executing ? -1 : 0;
  dom.board.setAttribute("aria-label", executing
    ? "Puzzle execution in progress. Planning controls are locked."
    : session.phase === "won"
      ? "Puzzle solved. The executed route is shown."
      : ready
        ? "Winning route planned. Review it or activate Solve Puzzle."
        : "Puzzle map. Draw from the commander to the banner.");
  renderPath();
  renderParty(animate);
  renderPlanningGhost();
  renderRoster(session.phase === "executing" ? event : null);
  dom.undo.disabled = session.path.length === 0 || session.phase !== "planning";
  dom.reset.disabled = session.phase === "executing";
  dom.hint.disabled = session.phase === "executing";
  dom.backToDesigner.disabled = session.phase === "executing";
  dom.designer.disabled = session.phase === "executing";
  dom.credits.disabled = session.phase === "executing";
  if (dom.solve) {
    dom.solve.hidden = !ready;
    dom.solve.disabled = !ready;
    dom.solve.setAttribute("aria-hidden", String(!ready));
  }
  if (session.phase === "planning" && previewEvents.length) {
    const status = planningEventStatus(previewEvents);
    if (status) setStatus(status, "normal", 1500);
    else setStatus();
  } else if (event) {
    const status = eventStatus(event);
    if (status) setStatus(status, "normal", 1500);
  } else if (session.phase !== "won") {
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

function clearBlockedFeedback(resetAudio = false) {
  session.blockedFeedback.key = "";
  session.blockedFeedback.at = 0;
  if (resetAudio) session.blockedFeedback.audioAt = 0;
}

function flashBlocked(position, reason) {
  const now = globalThis.performance?.now?.() ?? Date.now();
  const feedbackKey = `${keyOf(position)}:${reason}`;
  if (session.blockedFeedback.key === feedbackKey && now - session.blockedFeedback.at < 750) {
    session.blockedFeedback.at = now;
    return;
  }
  session.blockedFeedback.key = feedbackKey;
  session.blockedFeedback.at = now;

  const cell = cellFor(position);
  if (cell) {
    cell.classList.remove("cell--blocked");
    void cell.offsetWidth;
    cell.classList.add("cell--blocked");
    window.setTimeout(() => cell.classList.remove("cell--blocked"), 320);
  }
  if (!session.blockedFeedback.audioAt || now - session.blockedFeedback.audioAt >= 400) {
    audio.play("blocked");
    session.blockedFeedback.audioAt = now;
  }
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
  if (!session.path.length || session.phase !== "planning") return;
  session.path.pop();
  recomputeParty();
  clearBlockedFeedback();
  if (withSound) audio.play("draw", session.path.length);
  session.mode = session.path.length ? "paused" : "idle";
  refreshSession();
}

function pathIndexAt(position) {
  return session.path.findIndex((step) => samePosition(step, position));
}

function rewindPathTo(position, withSound = true) {
  const index = pathIndexAt(position);
  if (index < 0 || index === session.path.length - 1 || session.phase !== "planning") return false;
  session.path = session.path.slice(0, index + 1);
  recomputeParty();
  clearBlockedFeedback();
  session.mode = session.drawing ? "drawing" : "paused";
  const now = globalThis.performance?.now?.() ?? Date.now();
  if (withSound && now - session.lastUndoAt >= 110) {
    audio.play("draw", session.path.length);
    session.lastUndoAt = now;
  }
  refreshSession();
  return true;
}

function foreignRouteAt(position) {
  const positionKey = keyOf(position);
  if (session.routes.some((route) => route.path.some((step) => keyOf(step) === positionKey))) return true;
  return [...session.drafts.values()].some((draft) => draft.path.some((step) => keyOf(step) === positionKey));
}

function reservedCommanderTile(position) {
  if (session.level.mode !== "convoy") return false;
  const def = TILE_DEFS[tileAt(position)];
  return ["commanderStart", "commanderGoal"].includes(def?.type) && def.commander !== currentCommander()?.id;
}

function saveActiveDraft() {
  if (session.level.mode !== "convoy") return;
  const commander = currentCommander();
  if (!commander || completedCommanderIds().has(commander.id)) return;
  if (!session.path.length) {
    session.drafts.delete(commander.id);
    return;
  }
  session.drafts.set(commander.id, {
    path: session.path.map((position) => ({ ...position })),
    state: createPartyState(session.party),
  });
}

function selectCommander(index, options = {}) {
  if (session.level.mode !== "convoy" || session.phase !== "planning") return false;
  const commander = session.level.commanders[index];
  if (!commander || completedCommanderIds().has(commander.id)) return false;
  if (index === session.commanderIndex) return true;

  if (options.saveCurrent !== false) saveActiveDraft();
  if (session.pointerId !== null) {
    try { dom.boardFrame.releasePointerCapture?.(session.pointerId); } catch { /* Pointer capture may already be gone. */ }
  }
  session.drawing = false;
  session.pointerId = null;
  session.commanderIndex = index;
  const draft = session.drafts.get(commander.id);
  session.drafts.delete(commander.id);
  session.path = draft?.path.map((position) => ({ ...position })) ?? [];
  session.party = draft ? createPartyState(draft.state) : createPartyState(commander.initial);
  session.mode = session.path.length ? "paused" : "idle";
  clearBlockedFeedback();
  renderBoard();
  refreshSession();
  if (!options.silent) {
    setStatus(`<b>${commander.name.toUpperCase()} SELECTED</b> ${draft ? "Continue the saved plan from its glowing head." : "Plan from the glowing start."}`, "success", 1600);
  }
  return true;
}

function commanderStartIndexAt(position) {
  if (session.level.mode !== "convoy") return -1;
  return session.level.commanders.findIndex((commander) => samePosition(commander.start, position));
}

function secureCommanderRoute() {
  const commander = currentCommander();
  session.routes.push({
    commanderId: commander.id,
    path: session.path.map((position) => ({ ...position })),
    state: createPartyState(session.party),
  });
  session.drafts.delete(commander.id);
  const complete = completedCommanderIds();
  const nextIndex = session.level.commanders.findIndex((candidate) => !complete.has(candidate.id));
  session.path = [];
  session.party = createPartyState();
  selectCommander(nextIndex, { saveCurrent: false, silent: true });
  setStatus(`<b>${commander.name.toUpperCase()} ROUTE PLANNED!</b> Choose any remaining commander; unfinished plans stay saved.`, "success", 2400);
}

function attemptAdjacent(position) {
  if (session.phase !== "planning") return false;
  const head = session.path.at(-1);
  if (!head || samePosition(head, position)) return "noop";

  if (pathIndexAt(position) >= 0) {
    rewindPathTo(position);
    return "rewound";
  }

  if (!isAdjacent(head, position)) return false;
  if (!moveAllowedFrom(session.level, head, position)) {
    const direction = forcedDirectionAt(session.level, head);
    flashBlocked(position, `The marching arrow requires the next step ${direction === "U" ? "north" : direction === "R" ? "east" : direction === "D" ? "south" : "west"}.`);
    return false;
  }
  if (foreignRouteAt(position)) {
    flashBlocked(position, "Another commander's saved route already occupies that square.");
    return false;
  }
  if (reservedCommanderTile(position)) {
    flashBlocked(position, "That start or standard is reserved for another commander.");
    return false;
  }

  const candidatePath = [...session.path, position];
  const transition = tracePath(session.level, candidatePath, { commander: currentCommander() });
  if (!transition.ok) {
    flashBlocked(position, transition.reason);
    return false;
  }

  const isActiveGoal = samePosition(position, activeGoal());
  const isFinalCommander = session.level.mode === "convoy" && session.routes.length === session.level.commanders.length - 1;
  if (isActiveGoal && isFinalCommander) {
    const finalBeacons = securedBeaconSet();
    transition.state.beacons.forEach((beacon) => finalBeacons.add(beacon));
    if (!beaconsComplete(session.level, finalBeacons)) {
      flashBlocked(position, "Light every rally beacon before the final commander reaches their standard.");
      return false;
    }
  }

  session.path.push(position);
  session.party = transition.state;
  session.mode = "drawing";
  clearBlockedFeedback();
  markFresh(position);
  const events = transition.steps.at(-1)?.events ?? [];
  audio.play("draw", session.path.length);
  refreshSession(null, false, events);

  if (isActiveGoal) {
    if (session.level.mode === "convoy" && !isFinalCommander) secureCommanderRoute();
    else {
      session.mode = "ready";
      session.drawing = false;
      refreshSession(null, false, events);
    }
  }
  return "advanced";
}

function attemptToward(target) {
  let head = session.path.at(-1);
  if (!head || samePosition(head, target)) return;

  if (pathIndexAt(target) >= 0) {
    rewindPathTo(target);
    return;
  }

  if (isAdjacent(head, target)) {
    attemptAdjacent(target);
    return;
  }

  if (head.r === target.r) {
    const direction = Math.sign(target.c - head.c);
    while (session.phase === "planning" && session.mode !== "ready" && head.c !== target.c) {
      const next = { r: head.r, c: head.c + direction };
      if (attemptAdjacent(next) !== "advanced") break;
      head = session.path.at(-1);
    }
  } else if (head.c === target.c) {
    const direction = Math.sign(target.r - head.r);
    while (session.phase === "planning" && session.mode !== "ready" && head.r !== target.r) {
      const next = { r: head.r + direction, c: head.c };
      if (attemptAdjacent(next) !== "advanced") break;
      head = session.path.at(-1);
    }
  }
}

function beginPath() {
  if (session.path.length || session.phase !== "planning") return;
  session.path = [{ ...activeStart() }];
  const startTrace = tracePath(session.level, session.path, { commander: currentCommander() });
  session.party = startTrace.state;
  session.mode = "drawing";
  clearBlockedFeedback();
  audio.play("draw", 0);
  refreshSession();
}

function handlePointerDown(event) {
  if (event.button !== undefined && event.button !== 0) return;
  if (session.phase !== "planning") return;
  audio.ensure();
  const cell = event.target.closest(".cell");
  const position = positionFromCell(cell);
  if (!position) return;

  const commanderStartIndex = commanderStartIndexAt(position);
  if (commanderStartIndex >= 0 && commanderStartIndex !== session.commanderIndex) {
    const commander = session.level.commanders[commanderStartIndex];
    if (!selectCommander(commanderStartIndex)) {
      flashBlocked(position, `${commander.name}'s route is already secured.`);
      return;
    }
    if (session.path.length) {
      event.preventDefault();
      return;
    }
  }

  if (!session.path.length) {
    if (!samePosition(position, activeStart())) {
      flashBlocked(position, session.level.mode === "convoy" ? `Begin on ${currentCommander().name}, the glowing active commander.` : "Begin on the commander.");
      return;
    }
    beginPath();
  } else {
    const head = session.path.at(-1);
    const earlierPathTile = pathIndexAt(position) >= 0;
    if (!samePosition(position, head) && !isAdjacent(position, head) && !earlierPathTile) {
      flashBlocked(position, "Continue from the glowing route head.");
      return;
    }
    if (!samePosition(position, head)) {
      if (earlierPathTile) rewindPathTo(position);
      else attemptAdjacent(position);
    }
  }

  session.drawing = session.phase === "planning" && session.mode !== "ready" && session.path.length > 0;
  session.pointerId = event.pointerId;
  if (session.drawing) {
    try { dom.boardFrame.setPointerCapture?.(event.pointerId); } catch { /* Synthetic and older pointer sources may not support capture. */ }
  }
  event.preventDefault();
}

function handlePointerMove(event) {
  if (!session.drawing || event.pointerId !== session.pointerId || session.phase !== "planning") return;
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
  clearBlockedFeedback();
  if (session.mode === "drawing") session.mode = "paused";
}

function handleKeyboard(event) {
  if (session.phase !== "planning") return;
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
  if (session.mode === "ready") return;
  audio.ensure();
  if (!session.path.length) beginPath();
  const head = session.path.at(-1);
  attemptAdjacent({ r: head.r + delta[0], c: head.c + delta[1] });
  event.preventDefault();
}

function executionEventLabel(event) {
  if (!event) return "MARCHING";
  if (event.type === "recruit") return "SOLDIER PICKUP";
  if (event.type === "goblin") return event.cost === 1 ? "GOBLIN COMBAT" : event.cost === 2 ? "ORC COMBAT" : "OGRE COMBAT";
  if (event.type === "mage") return "MAGE PICKUP";
  if (event.type === "dragon") return "FIREBALL";
  if (event.type === "builder") return "BUILDER PICKUP";
  if (event.type === "river") return "BRIDGE BUILD";
  if (event.type === "healer") return event.restored ? "HEALING" : "HEALER PICKUP";
  if (event.type === "goal" || event.type === "commanderGoal") return "STANDARD SECURED";
  return event.type.toUpperCase();
}

function executionDelay(milliseconds, runId) {
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const duration = reduced ? Math.min(24, milliseconds) : milliseconds;
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(runId === session.executionRunId), duration);
  });
}

function pulseClass(node, className) {
  if (!node) return;
  node.classList.remove(className);
  void node.offsetWidth;
  node.classList.add(className);
}

function spawnExecutionFx(kind, position, destination = position) {
  if (!dom.executionFx) return null;
  dom.executionFx.hidden = false;
  const effectBounds = dom.executionFx.getBoundingClientRect();
  const cellWidth = effectBounds.width / session.level.width;
  const cellHeight = effectBounds.height / session.level.height;
  const effect = document.createElement("span");
  effect.className = `execution-fx execution-fx--${kind}`;
  effect.style.setProperty("--fx-x", `${((position.c + 0.5) / session.level.width) * 100}%`);
  effect.style.setProperty("--fx-y", `${((position.r + 0.5) / session.level.height) * 100}%`);
  effect.style.setProperty("--fx-dx", `${(destination.c - position.c) * cellWidth}px`);
  effect.style.setProperty("--fx-dy", `${(destination.r - position.r) * cellHeight}px`);
  dom.executionFx.append(effect);
  return effect;
}

function clearExecutionEvent(cell, cellClass, effect) {
  if (cellClass) cell?.classList.remove(cellClass);
  effect?.remove();
  if (dom.executionFx && !dom.executionFx.children.length) dom.executionFx.hidden = true;
}

async function presentExecutionEvent(event, position, runId, eventPause, fromPosition = position) {
  if (!event || runId !== session.executionRunId) return false;
  const cell = cellFor(position);
  session.execution.eventLabel = executionEventLabel(event);
  renderRouteMeters();

  let cellClass = "";
  let effect = null;
  let pause = eventPause;

  switch (event.type) {
    case "recruit":
      cellClass = "is-event-recruit";
      cell?.classList.add(cellClass);
      effect = spawnExecutionFx("recruit", position);
      audio.play("recruit", session.execution.completedSteps);
      pause = Math.max(pause, 300);
      break;
    case "mage":
      cellClass = "is-event-mage";
      cell?.classList.add(cellClass);
      effect = spawnExecutionFx("mage", position);
      audio.play("mage", session.execution.completedSteps);
      pause = Math.max(pause, 320);
      break;
    case "builder":
      cellClass = "is-event-builder";
      cell?.classList.add(cellClass);
      effect = spawnExecutionFx("builder", position);
      audio.play("builder", session.execution.completedSteps);
      pause = Math.max(pause, 320);
      break;
    case "healer":
      cellClass = event.restored ? "is-event-healing" : "is-event-healer";
      cell?.classList.add("is-event-healer", cellClass);
      effect = spawnExecutionFx(event.restored ? "healing" : "healer", position);
      pulseClass(dom.party, event.restored ? "is-healing" : "is-stepping");
      audio.play(event.restored ? "heal" : "healer", session.execution.completedSteps);
      pause = Math.max(pause, event.restored ? 540 : 360);
      break;
    case "goblin": {
      const tier = event.cost === 1 ? "goblin" : event.cost === 2 ? "orc" : "ogre";
      pulseClass(dom.party, "is-attacking");
      audio.play("soldierAttack", session.execution.completedSteps);
      if (!await executionDelay(70, runId)) return false;
      audio.play("soldierImpact", session.execution.completedSteps);
      cellClass = `is-event-${tier}-death`;
      cell?.classList.add(cellClass);
      effect = spawnExecutionFx(`impact-${tier}`, position);
      audio.play(`${tier}Death`, session.execution.completedSteps);
      pause = Math.max(pause, event.cost === 1 ? 320 : event.cost === 2 ? 340 : 400);
      break;
    }
    case "dragon": {
      pulseClass(dom.party, "is-casting");
      const fireball = spawnExecutionFx("fireball", fromPosition, position);
      audio.play("dragon", session.execution.completedSteps);
      if (!await executionDelay(280, runId)) return false;
      fireball?.remove();
      cellClass = "is-event-dragon-death";
      cell?.classList.add(cellClass);
      effect = spawnExecutionFx("dragon-death", position);
      audio.play("dragonDeath", session.execution.completedSteps);
      pause = Math.max(pause, 460);
      break;
    }
    case "river":
      cellClass = "is-event-bridge-build";
      cell?.classList.add(cellClass);
      effect = spawnExecutionFx("bridge", position);
      audio.play("river", session.execution.completedSteps);
      pause = Math.max(pause, 340);
      break;
    case "goal":
    case "commanderGoal":
      cellClass = "is-event-complete";
      cell?.classList.add(cellClass);
      effect = spawnExecutionFx("completion", position);
      pause = Math.max(pause, 440);
      break;
    default: {
      const cue = audioCue(event);
      if (cue !== "step") audio.play(cue, session.execution.completedSteps);
      pause = Math.max(70, eventPause - 30);
      break;
    }
  }

  const current = await executionDelay(pause, runId);
  clearExecutionEvent(cell, cellClass, effect);
  if (event.type === "healer") cell?.classList.remove("is-event-healer", "is-event-healing");
  dom.party.classList.remove("is-attacking", "is-casting", "is-healing");
  return current;
}

function cancelExecution() {
  session.executionRunId += 1;
  session.execution = null;
  dom.executionFx?.replaceChildren();
  if (dom.executionFx) dom.executionFx.hidden = true;
  document.body.classList.remove("is-execution-locked");
  dom.party.classList.remove("is-starting", "is-attacking", "is-casting", "is-healing");
}

async function executePlan() {
  if (!planSolved()) return;
  const routes = compilePlannedRoutes();
  if (!routes.length || routes.some((route) => !route.trace.ok || !route.trace.won)) {
    flashBlocked(session.path.at(-1) ?? activeStart(), "The plan changed before execution. Review the route and try again.");
    return;
  }

  const runId = session.executionRunId + 1;
  session.executionRunId = runId;
  const totalSteps = routes.reduce((sum, route) => sum + Math.max(0, route.trace.steps.length - 1), 0);
  const stepPause = totalSteps > 44 ? 72 : totalSteps > 24 ? 88 : 108;
  const eventPause = totalSteps > 44 ? 220 : totalSteps > 24 ? 255 : 300;
  const firstRoute = routes[0];

  session.phase = "executing";
  session.mode = "executing";
  session.drawing = false;
  session.pointerId = null;
  session.party = createPartyState(firstRoute.trace.initialState);
  session.execution = {
    runId,
    routes,
    routeIndex: 0,
    stepIndex: 0,
    commanderId: firstRoute.commanderId,
    position: { ...firstRoute.trace.steps[0].position },
    resolved: new Set(),
    beacons: new Set(),
    completedSteps: 0,
    totalSteps,
    eventLabel: "READY!",
  };

  clearBlockedFeedback(true);
  renderBoard();
  renderLevelList();
  refreshSession();
  pulseClass(dom.party, "is-starting");
  audio.play("commanderReady");
  setStatus("<b>FORWARD!</b> The commander is bringing your plan to life.", "success");
  if (!await executionDelay(330, runId)) return;
  dom.party.classList.remove("is-starting");

  for (let routeIndex = 0; routeIndex < routes.length; routeIndex += 1) {
    const route = routes[routeIndex];
    const startStep = route.trace.steps[0];
    session.execution.routeIndex = routeIndex;
    session.execution.stepIndex = 0;
    session.execution.commanderId = route.commanderId;
    session.execution.position = { ...startStep.position };
    session.execution.eventLabel = "READY!";
    session.party = createPartyState(startStep.before);
    renderBoard();
    refreshSession();

    if (routeIndex > 0) {
      pulseClass(dom.party, "is-starting");
      audio.play("commanderReady", routeIndex);
      setStatus(`<b>${route.commander.name.toUpperCase()} STEPS FORWARD!</b> The next planned route begins.`, "success");
      if (!await executionDelay(250, runId)) return;
      dom.party.classList.remove("is-starting");
    }

    for (const event of startStep.events) {
      if (!await presentExecutionEvent(event, startStep.position, runId, eventPause, startStep.position)) return;
    }
    session.party = createPartyState(startStep.after);
    session.execution.resolved.add(keyOf(startStep.position));
    refreshSession(startStep.events.at(-1) ?? null);

    for (let stepIndex = 1; stepIndex < route.trace.steps.length; stepIndex += 1) {
      if (runId !== session.executionRunId) return;
      const step = route.trace.steps[stepIndex];
      session.execution.stepIndex = stepIndex;
      session.execution.position = { ...step.position };
      session.execution.eventLabel = "MARCHING";
      session.party = createPartyState(step.before);
      audio.play("move", session.execution.completedSteps);
      renderParty(true);
      renderRouteMeters();
      setStatus(`<b>EXECUTING PLAN</b> Step ${session.execution.completedSteps + 1} of ${totalSteps}.`);
      if (!await executionDelay(stepPause, runId)) return;

      const previousPosition = route.trace.steps[stepIndex - 1].position;
      for (const event of step.events) {
        if (!await presentExecutionEvent(event, step.position, runId, eventPause, previousPosition)) return;
      }

      session.party = createPartyState(step.after);
      session.execution.resolved.add(keyOf(step.position));
      session.execution.completedSteps += 1;
      const lastEvent = step.events.at(-1) ?? null;
      refreshSession(lastEvent);
      if (!await executionDelay(step.events.length ? 35 : 18, runId)) return;
    }

    route.trace.state.beacons.forEach((beacon) => session.execution.beacons.add(beacon));
  }

  if (runId !== session.executionRunId) return;
  finishLevel();
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
  session.phase = "won";
  session.mode = "won";
  session.drawing = false;
  if (session.level.mode === "convoy") renderBoard();
  const isPlaytest = Boolean(session.playtest);
  if (!isPlaytest) {
    session.completed.add(currentLevelKey());
    persistCompleted();
    renderLevelList();
  }
  refreshSession();
  dom.party.classList.add("is-winning");
  createConfetti();
  audio.play("win");
  setStatus(isPlaytest
    ? "<b>PLAYTEST CLEAR!</b> This draft can be completed under the real game rules."
    : "<b>ROUTE SECURED!</b> Your company reached the royal banner.", "success");

  const isPackFinale = session.levelIndex === session.pack.levels.length - 1;
  const isGameFinale = isPackFinale && session.packIndex === PACKS.length - 1;
  dom.victoryTitle.textContent = isPlaytest ? "Playtest complete!" : isGameFinale ? "The company rises again!" : isPackFinale ? `${session.pack.shortName} complete!` : "Company assembled!";
  dom.victoryCopy.textContent = isPlaytest
    ? "The route works in play. Return to the workshop to refine, analyze, or copy it."
    : isGameFinale
    ? "The lone commander turned every hard choice into one final, unstoppable company."
    : isPackFinale
      ? `${session.pack.name} is secure. A new campaign is ready.`
      : `${session.level.name} is secure. The next march awaits.`;
  const totalTiles = session.routes.reduce((sum, route) => sum + route.path.length, 0) + session.path.length;
  dom.victorySteps.textContent = String(totalTiles);
  dom.victoryRank.textContent = session.level.difficulty >= 9 ? "★★★" : session.level.difficulty >= 6 ? "★★" : "★";
  dom.next.innerHTML = isPlaytest
    ? "BACK TO DESIGNER <span>▦</span>"
    : isGameFinale
    ? "FIRST PACK <span>↻</span>"
    : isPackFinale
      ? "NEXT PACK <span>→</span>"
      : "NEXT MARCH <span>→</span>";

  session.victoryTimer = window.setTimeout(() => {
    if (!dom.victoryDialog.open && session.phase === "won") dom.victoryDialog.showModal();
  }, 850);
}

function clearTimers() {
  if (session.statusTimer) window.clearTimeout(session.statusTimer);
  if (session.victoryTimer) window.clearTimeout(session.victoryTimer);
  session.statusTimer = null;
  session.victoryTimer = null;
}

function resetLevel() {
  cancelExecution();
  clearTimers();
  session.path = [];
  session.routes = [];
  session.drafts.clear();
  session.commanderIndex = 0;
  session.party = createPartyState(currentCommander()?.initial);
  session.phase = "planning";
  session.mode = "idle";
  session.drawing = false;
  session.pointerId = null;
  clearBlockedFeedback(true);
  dom.party.classList.remove("is-winning", "is-stepping");
  dom.confetti.replaceChildren();
  if (dom.victoryDialog.open) dom.victoryDialog.close();
  renderBoard();
  refreshSession();
}

function loadLevel(index) {
  cancelExecution();
  clearTimers();
  const levels = session.pack.levels;
  session.levelIndex = (index + levels.length) % levels.length;
  session.level = levels[session.levelIndex];
  session.path = [];
  session.routes = [];
  session.drafts.clear();
  session.commanderIndex = 0;
  session.party = createPartyState(currentCommander()?.initial);
  session.phase = "planning";
  session.mode = "idle";
  session.drawing = false;
  session.pointerId = null;
  clearBlockedFeedback(true);
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

function startDesignerPlaytest(level, context) {
  const returnTo = session.playtest?.returnTo ?? {
    packIndex: Math.max(0, session.packIndex),
    levelIndex: session.levelIndex,
  };
  session.playtest = {
    designId: context.designId,
    returnTo,
  };
  session.packIndex = -1;
  session.pack = {
    id: "designer-playtest",
    number: "✦",
    name: "Level Workshop",
    shortName: "Workshop",
    eyebrow: "LIVE PLAYTEST",
    description: "This browser-saved draft is running in the real game rules. Return to the workshop to keep painting.",
    accent: "gold",
    levels: [level],
  };
  session.levelIndex = 0;
  session.level = level;
  cancelExecution();
  clearTimers();
  session.path = [];
  session.routes = [];
  session.drafts.clear();
  session.commanderIndex = 0;
  session.party = createPartyState(currentCommander()?.initial);
  session.phase = "planning";
  session.mode = "idle";
  session.drawing = false;
  session.pointerId = null;
  clearBlockedFeedback(true);
  dom.backToDesigner.hidden = false;
  dom.party.classList.remove("is-winning", "is-stepping");
  dom.confetti.replaceChildren();
  if (dom.victoryDialog.open) dom.victoryDialog.close();
  audio.setTheme(0);
  renderMetadata();
  renderBoard();
  renderLevelList();
  refreshSession();
  dom.board.focus({ preventScroll: true });
  dom.missionPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function returnToDesigner() {
  if (!session.playtest) {
    designerController?.open();
    return;
  }
  const { designId, returnTo } = session.playtest;
  session.playtest = null;
  dom.backToDesigner.hidden = true;
  session.packIndex = returnTo.packIndex;
  session.pack = PACKS[session.packIndex];
  audio.setTheme(session.packIndex);
  loadLevel(returnTo.levelIndex);
  designerController?.open(designId);
}

function loadPack(index) {
  if (session.playtest) {
    session.playtest = null;
    dom.backToDesigner.hidden = true;
  }
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
  if (session.phase !== "planning") return;
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
dom.solve?.addEventListener("click", executePlan);
dom.sound.addEventListener("click", () => {
  audio.ensure();
  audio.toggle();
  updateSoundButton();
});
dom.credits.addEventListener("click", () => dom.creditsDialog.showModal());
dom.closeCredits.addEventListener("click", () => dom.creditsDialog.close());
dom.creditsDialog.addEventListener("click", (event) => {
  if (event.target === dom.creditsDialog) dom.creditsDialog.close();
});
dom.replay.addEventListener("click", resetLevel);
dom.next.addEventListener("click", () => session.playtest ? returnToDesigner() : loadNextMission());
dom.backToDesigner.addEventListener("click", returnToDesigner);

designerController = createLevelDesigner({ onPlaytest: startDesignerPlaytest });

updateSoundButton();
audio.setTheme(0);
loadLevel(0);
