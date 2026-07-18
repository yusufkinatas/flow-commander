import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function read(relativePath) {
  const absolutePath = resolve(root, relativePath);
  assert.ok(existsSync(absolutePath), `${relativePath} must exist.`);
  return readFileSync(absolutePath, "utf8");
}

const game = read("js/game.js");
const html = read("index.html");
const styles = read("styles.css");

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchingBrace(source, openIndex) {
  let depth = 0;
  let mode = "code";
  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (mode === "line-comment") {
      if (char === "\n") mode = "code";
      continue;
    }
    if (mode === "block-comment") {
      if (char === "*" && next === "/") {
        mode = "code";
        index += 1;
      }
      continue;
    }
    if (["single", "double", "template"].includes(mode)) {
      if (char === "\\") {
        index += 1;
        continue;
      }
      if ((mode === "single" && char === "'")
        || (mode === "double" && char === '"')
        || (mode === "template" && char === "`")) mode = "code";
      continue;
    }

    if (char === "/" && next === "/") {
      mode = "line-comment";
      index += 1;
    } else if (char === "/" && next === "*") {
      mode = "block-comment";
      index += 1;
    } else if (char === "'") mode = "single";
    else if (char === '"') mode = "double";
    else if (char === "`") mode = "template";
    else if (char === "{") depth += 1;
    else if (char === "}" && --depth === 0) return index;
  }
  throw new Error("Could not find a matching closing brace.");
}

function namedFunction(source, name) {
  const declaration = new RegExp(`\\b(?:async\\s+)?function\\s+${escapeRegExp(name)}\\s*\\([^)]*\\)\\s*\\{`).exec(source);
  assert.ok(declaration, `${name}() must remain a named function.`);
  const open = source.indexOf("{", declaration.index);
  const close = matchingBrace(source, open);
  return {
    start: declaration.index,
    end: close + 1,
    body: source.slice(open + 1, close),
    source: source.slice(declaration.index, close + 1),
  };
}

function objectManifest(source, name) {
  const declaration = new RegExp(`\\bconst\\s+${escapeRegExp(name)}\\s*=\\s*Object\\.freeze\\s*\\(\\s*\\{`).exec(source);
  assert.ok(declaration, `${name} must remain an immutable object manifest.`);
  const open = source.indexOf("{", declaration.index);
  const close = matchingBrace(source, open);
  return source.slice(open + 1, close);
}

function directAudioCues(functionBody, functionName) {
  return [...functionBody.matchAll(/\baudio\.play\s*\(\s*([^,)]+)/g)].map((match) => {
    const literal = match[1].trim().match(/^(["'])([^"']+)\1$/);
    assert.ok(literal, `${functionName}() must use explicit cue names for static review.`);
    return literal[2];
  });
}

// Every statically-bound DOM id must exist exactly once, including the phase UI.
const htmlIds = [...html.matchAll(/\bid\s*=\s*(["'])([^"']+)\1/g)].map((match) => match[2]);
const duplicateIds = [...new Set(htmlIds.filter((id, index) => htmlIds.indexOf(id) !== index))];
assert.deepEqual(duplicateIds, [], `HTML ids must be unique; duplicates: ${duplicateIds.join(", ")}`);

const boundIds = [...game.matchAll(/document\.querySelector\(\s*(["'])#([\w:-]+)\1\s*\)/g)].map((match) => match[2]);
for (const id of boundIds) {
  assert.ok(htmlIds.includes(id), `#${id}, queried by game.js, must exist in index.html.`);
}

const phaseIds = [
  "gameBoard",
  "boardStage",
  "routeLayer",
  "partyToken",
  "planningGhost",
  "executionFxLayer",
  "statusText",
  "solvePuzzleButton",
  "companyHeading",
  "companyPhase",
  "companyPhaseText",
  "undoButton",
  "resetButton",
  "hintButton",
];
for (const id of phaseIds) {
  assert.ok(htmlIds.includes(id), `Planning/execution UI requires #${id}.`);
  assert.ok(boundIds.includes(id), `game.js must bind planning/execution UI #${id}.`);
}

const solveTag = [...html.matchAll(/<[a-z][^>]*>/gi)]
  .map((match) => match[0])
  .find((tag) => /\bid\s*=\s*(["'])solvePuzzleButton\1/i.test(tag));
assert.ok(solveTag, "The Solve Puzzle button must exist.");
assert.match(solveTag, /\shidden(?:\s|=|>)/i, "The Solve Puzzle button must start hidden.");

// Planning previews and executed outcomes must remain distinct visual states.
const cssWithoutComments = styles.replace(/\/\*[\s\S]*?\*\//g, "");
assert.match(cssWithoutComments, /\.cell--planned\b/, "CSS must style planned cells.");
assert.match(cssWithoutComments, /\.cell--resolved\b/, "CSS must style mechanically resolved cells.");
assert.doesNotMatch(cssWithoutComments, /\.cell--visited\b/, "Legacy .cell--visited final-state selectors must not return.");
assert.match(game, /classList\.toggle\(\s*["']cell--planned["']\s*,/, "Rendering must toggle the planned-cell class explicitly.");
assert.match(game, /classList\.toggle\(\s*["']cell--resolved["']\s*,/, "Rendering must toggle the resolved-cell class explicitly.");

const cssRules = [...cssWithoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .map((match) => ({ selector: match[1].trim(), declarations: match[2] }));
const plannedRules = cssRules.filter((rule) => rule.selector.includes(".cell--planned"));
const resolvedRules = cssRules.filter((rule) => rule.selector.includes(".cell--resolved"));
assert.ok(plannedRules.length > 0 && resolvedRules.length > 0, "Planned and resolved states each need dedicated CSS rules.");
assert.ok(plannedRules.every((rule) => !rule.selector.includes(".cell--resolved")), "Planned selectors must not alias resolved selectors.");
for (const rule of plannedRules.filter((candidate) => candidate.selector.includes(".entity"))) {
  assert.doesNotMatch(rule.declarations, /\b(?:display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0(?:\.0+)?(?:\s|;|$))/i, "Planning must not consume or hide board entities.");
}
assert.ok(
  resolvedRules.some((rule) => rule.selector.includes(".entity") && /\bopacity\s*:\s*0(?:\.0+)?(?:\s|;|$)/i.test(rule.declarations)),
  "Execution needs a resolved-entity rule that visually consumes completed events.",
);

// Planning compiles candidate routes, but only execution may resolve them.
const attemptAdjacent = namedFunction(game, "attemptAdjacent");
assert.match(attemptAdjacent.body, /\btracePath\s*\(/, "attemptAdjacent() must compile the candidate plan with tracePath().");
assert.match(attemptAdjacent.body, /\.steps\b/, "attemptAdjacent() must read the compiled step events.");
assert.deepEqual(directAudioCues(attemptAdjacent.body, "attemptAdjacent"), ["draw"], "A valid planned step may emit only the draw cue.");
assert.doesNotMatch(attemptAdjacent.body, /\bfinishLevel\s*\(/, "Planning must not finish the level.");
assert.doesNotMatch(attemptAdjacent.body, /\baudioCue\s*\(/, "Planning must not translate mechanic events into execution audio.");

const beginPath = namedFunction(game, "beginPath");
assert.deepEqual(directAudioCues(beginPath.body, "beginPath"), ["draw"], "Beginning a plan must use the draw cue.");

const secureCommanderRoute = namedFunction(game, "secureCommanderRoute");
assert.doesNotMatch(secureCommanderRoute.body, /\baudio\s*\./, "Planning a convoy route must not emit audio.");

const compilePlannedRoutes = namedFunction(game, "compilePlannedRoutes");
assert.match(compilePlannedRoutes.body, /\btracePath\s*\(/, "Compiled routes must be tracePath() products.");

const executePlan = namedFunction(game, "executePlan");
assert.match(executePlan.body, /\bcompilePlannedRoutes\s*\(/, "executePlan() must compile the reviewed plan before playback.");
for (const contract of [/\broute\.trace\.steps\b/, /\bstep\.before\b/, /\bstep\.events\b/, /\bstep\.after\b/]) {
  assert.match(executePlan.body, contract, "executePlan() must consume compiled trace step snapshots and events.");
}
assert.match(executePlan.body, /for\s*\([^)]*\bstartStep\.events\b[^)]*\)/, "executePlan() must present events emitted from the route start.");
assert.match(executePlan.body, /createPartyState\s*\(\s*startStep\.before\s*\)/, "Start events must render against their before-state before being applied.");

const clearExecutionEvent = namedFunction(game, "clearExecutionEvent");
assert.match(clearExecutionEvent.body, /if\s*\(\s*cellClass\s*\)/, "Execution cleanup must guard events that do not add a CSS class.");

const spawnExecutionFx = namedFunction(game, "spawnExecutionFx");
assert.match(spawnExecutionFx.body, /getBoundingClientRect\s*\(/, "Travel effects must derive their distance from the rendered board geometry.");
assert.match(spawnExecutionFx.body, /--fx-d[xy]["']\s*,\s*`[^`]*px`/, "Travel effects must use pixel deltas rather than percentages of the effect sprite.");

const refreshSession = namedFunction(game, "refreshSession");
assert.match(refreshSession.body, /aria-live["']\s*,\s*executing\s*\?\s*["']off["']\s*:\s*["']polite["']/, "Per-step visual status updates must leave the live region off during execution.");

const finishLevel = namedFunction(game, "finishLevel");
const declarationNameIndex = game.indexOf("finishLevel", finishLevel.start);
const finishCalls = [...game.matchAll(/\bfinishLevel\s*\(/g)]
  .filter((match) => match.index !== declarationNameIndex);
assert.equal(finishCalls.length, 1, "Exactly one gameplay path may call finishLevel().");
assert.ok(
  finishCalls[0].index >= executePlan.start && finishCalls[0].index < executePlan.end,
  "executePlan() must be the sole caller of finishLevel().",
);

// Visual/audio manifests must point at shipped assets and retain license provenance.
const visualManifest = objectManifest(game, "ASSETS");
const audioManifest = objectManifest(game, "AUDIO_ASSETS");
const requiredAudioEntries = [
  "draw", "footsteps", "soldierPickup", "builderPickup", "healerPickup", "magePickup", "mageCast",
  "buildStrike", "bridgeCreak", "bridgeSettle", "gateOpen", "soldierWindup", "soldierImpact",
  "goblinDeath", "orcDeath", "largeDeath",
];
for (const entry of requiredAudioEntries) {
  assert.match(audioManifest, new RegExp(`\\b${entry}\\s*:`), `AUDIO_ASSETS must define ${entry}.`);
}

function manifestPaths(manifest, label) {
  const paths = [...manifest.matchAll(/(["'])(\.\/assets\/[^"']+)\1/g)].map((match) => match[2]);
  assert.ok(paths.length > 0, `${label} must contain local asset paths.`);
  for (const assetPath of new Set(paths)) {
    assert.ok(existsSync(resolve(root, assetPath.slice(2))), `${label} references missing ${assetPath}.`);
  }
  return [...new Set(paths)];
}

manifestPaths(visualManifest, "ASSETS");
const audioPaths = manifestPaths(audioManifest, "AUDIO_ASSETS");
assert.ok(audioPaths.every((assetPath) => assetPath.startsWith("./assets/audio/kenney-rpg/") && assetPath.endsWith(".ogg")), "Audio manifest entries must use the retained Kenney OGG selection.");

const executionCueNames = [
  "draw", "move", "commanderReady", "recruit", "mage", "builder", "healer", "heal",
  "soldierAttack", "soldierImpact", "goblinDeath", "orcDeath", "ogreDeath", "dragon",
  "dragonDeath", "river", "gate", "win",
];
for (const cue of executionCueNames) {
  assert.match(game, new RegExp(`case\\s+["']${cue}["']\\s*:`), `Soundboard.play() must retain the ${cue} cue.`);
}

const audioReadme = read("assets/audio/README.md");
const license = read("assets/audio/kenney-rpg/License.txt");
assert.match(audioReadme, /https:\/\/kenney\.nl\/assets\/rpg-audio/i, "Audio README must record the official source URL.");
assert.match(audioReadme, /Kenney/i, "Audio README must name the creator.");
assert.match(audioReadme, /CC0/i, "Audio README must record the CC0 license.");
assert.match(audioReadme, /attribution[^\n]*(?:not required|optional)/i, "Audio README must state the attribution requirement.");
assert.match(license, /Creative Commons Zero|CC0/i, "The original CC0 license must be retained.");
assert.match(license, /not mandatory/i, "The original license must retain its optional-credit statement.");
for (const assetPath of audioPaths) {
  assert.ok(audioReadme.includes(basename(assetPath)), `Audio README must document ${basename(assetPath)}.`);
}

console.log(`✓ UI phase contract validated · ${boundIds.length} DOM bindings · ${audioPaths.length} audio manifest entries`);
