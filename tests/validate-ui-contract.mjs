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
  "boardViewport",
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
  "dragonDeath", "river", "gate", "formation", "win",
];
for (const cue of executionCueNames) {
  assert.match(game, new RegExp(`case\\s+["']${cue}["']\\s*:`), `Soundboard.play() must retain the ${cue} cue.`);
}

assert.match(game, /case\s+["']formation["']\s*:[\s\S]*formation-gate/, "Formation Checkpoints must render a permanent shape-and-text marker.");
assert.match(game, /is-planned-formation-open/, "Formation Checkpoints must expose a planning-preview state.");
assert.match(game, /is-event-formation-open/, "Formation Checkpoints must expose a distinct execution state.");
assert.match(cssWithoutComments, /\.formation-gate\b/, "Formation Checkpoints must have a dedicated silhouette independent of color.");
assert.match(cssWithoutComments, /\.execution-fx--formation\b/, "Formation Checkpoints must have a dedicated execution effect.");
assert.match(game, /function\s+levelUsesFormation\s*\(/, "Workshop playtests must be able to detect Formation Checkpoints from level data.");
assert.match(game, /session\.pack\.id\s*===\s*["']formation-muster["']\s*\|\|\s*levelUsesFormation\s*\(\s*\)/, "Formation rules and legends must work in both Pack 5 and workshop playtests.");
assert.match(cssWithoutComments, /\.route-line--water\b/, "Pack 5 planned and executed routes must use the water accent.");
assert.match(cssWithoutComments, /\.route-head--water\b/, "Pack 5 route heads must use the water accent.");
assert.match(cssWithoutComments, /\.level-list\s*\{[^}]*overflow-y\s*:\s*auto/s, "Desktop level navigation must scroll independently when a pack is long.");

// The board is the viewport-sized game stage; secondary information lives in accessible HUD drawers.
for (const id of ["campaignPanel", "companyPanel", "campaignToggleButton", "companyToggleButton", "hudScrim"]) {
  assert.ok(htmlIds.includes(id), `Full-screen HUD requires #${id}.`);
  assert.ok(boundIds.includes(id), `game.js must bind full-screen HUD #${id}.`);
}
assert.match(cssWithoutComments, /\.game-shell\s*\{[^}]*height\s*:\s*100dvh[^}]*overflow\s*:\s*hidden/s, "The game shell must occupy and contain the viewport.");
assert.match(cssWithoutComments, /\.board-stage\s*\{[^}]*position\s*:\s*absolute[^}]*inset\s*:\s*0/s, "The board stage must fill the game shell rather than render as a center card.");
assert.match(cssWithoutComments, /\.campaign-panel\s*,\s*\.company-panel\s*\{[^}]*position\s*:\s*fixed/s, "Campaign and company UI must render as overlay HUD drawers.");
assert.match(cssWithoutComments, /\.hud-drawer-toggle\s*\{[^}]*position\s*:\s*fixed/s, "HUD drawer controls must remain available around the stage.");
assert.match(html, /id="campaignToggleButton"[^>]*aria-controls="campaignPanel"[^>]*aria-expanded="false"/s, "The campaign drawer toggle must expose its controlled panel and initial state.");
assert.match(html, /id="companyToggleButton"[^>]*aria-controls="companyPanel"[^>]*aria-expanded="false"/s, "The company drawer toggle must expose its controlled panel and initial state.");

const fitBoardToViewport = namedFunction(game, "fitBoardToViewport");
assert.match(fitBoardToViewport.body, /boardViewport\.clientWidth/, "Board fitting must use the actual viewport width.");
assert.match(fitBoardToViewport.body, /boardViewport\.clientHeight/, "Board fitting must use the actual viewport height.");
assert.match(fitBoardToViewport.body, /session\.level\.width/, "Board fitting must account for authored columns.");
assert.match(fitBoardToViewport.body, /session\.level\.height/, "Board fitting must account for authored rows.");
assert.match(fitBoardToViewport.body, /boardWidth\s*=\s*cellSize\s*\*\s*session\.level\.width/, "Board width must be recomputed from the fitted cell size and current level columns.");
assert.match(fitBoardToViewport.body, /boardHeight\s*=\s*cellSize\s*\*\s*session\.level\.height/, "Board height must be recomputed from the fitted cell size and current level rows.");
const renderBoard = namedFunction(game, "renderBoard");
assert.match(renderBoard.body, /requestAnimationFrame\s*\(\s*fitBoardToViewport\s*\)/, "Every newly rendered level must schedule a fresh geometry fit.");
assert.match(game, /new\s+ResizeObserver\s*\(\s*fitBoardToViewport\s*\)/, "Board fitting must react when its viewport changes.");
assert.match(game, /boardResizeObserver\?\.observe\s*\(\s*dom\.boardViewport\s*\)/, "The resize observer must watch the available viewport rather than the fitted board.");
assert.doesNotMatch(game, /level\.width\s*>\s*12/, "Rendered cell density must not be guessed from authored column count.");
assert.doesNotMatch(game, /scrollIntoView\s*\(/, "Fixed-viewport gameplay must not trigger legacy page-scroll jumps.");

const setActiveHudDrawer = namedFunction(game, "setActiveHudDrawer");
assert.match(setActiveHudDrawer.body, /\.inert\s*=\s*!campaignOpen/, "Closed campaign UI must leave the focus order.");
assert.match(setActiveHudDrawer.body, /\.inert\s*=\s*!companyOpen/, "Closed company UI must leave the focus order.");
assert.match(setActiveHudDrawer.body, /aria-expanded/, "HUD toggles must report open state.");
assert.match(setActiveHudDrawer.body, /aria-hidden/, "HUD panels must report hidden state.");
const initializeHud = namedFunction(game, "initializeHud");
assert.match(initializeHud.body, /setActiveHudDrawer\s*\(\s*null\s*\)/, "HUD initialization must close and inert both drawers.");
assert.match(game.slice(initializeHud.end), /initializeHud\s*\(\s*\)/, "The closed HUD state must be initialized during startup.");
assert.match(game, /event\.key\s*!==\s*["']Escape["'][\s\S]*setActiveHudDrawer\s*\(\s*null\s*\)[\s\S]*\.focus\s*\(/, "Escape must close a drawer and restore focus to its toggle.");
const renderPackSelector = namedFunction(game, "renderPackSelector");
assert.match(renderPackSelector.body, /loadPack\s*\([^)]*\)[\s\S]*setActiveHudDrawer\s*\(\s*null\s*\)/, "Changing packs must close the campaign drawer instead of leaving focus behind its scrim.");
assert.match(refreshSession.body, /campaignToggle\.disabled\s*=\s*session\.phase\s*===\s*["']executing["']/, "Mission navigation must lock during solution playback.");
assert.match(refreshSession.body, /companyToggle\.disabled\s*=\s*session\.phase\s*===\s*["']executing["']/, "Company navigation must lock during solution playback.");
assert.match(executePlan.body, /setActiveHudDrawer\s*\(\s*null\s*\)[\s\S]*session\.phase\s*=\s*["']executing["']/, "Execution must close any desktop HUD drawer before playback starts.");

const cellRule = cssRules.find((rule) => rule.selector === ".cell");
const badgeRule = cssRules.find((rule) => rule.selector === ".tile-badge");
const hungerBadgeRule = cssRules.find((rule) => rule.selector === ".tile-badge--hunger");
assert.ok(cellRule && /container-type\s*:\s*inline-size/.test(cellRule.declarations), "Every rendered cell must expose its actual inline size to contained UI.");
assert.ok(badgeRule && /cqi/.test(badgeRule.declarations), "Tile badges must scale from actual rendered cell width.");
assert.ok(hungerBadgeRule && /cqi/.test(hungerBadgeRule.declarations), "Expanding hunger badges must also scale from actual rendered cell width.");
assert.doesNotMatch(badgeRule.declarations, /min-width\s*:\s*20px|height\s*:\s*20px/, "Tile badges must not return to fixed dimensions that can obscure entities.");
assert.doesNotMatch(hungerBadgeRule.declarations, /min-width\s*:\s*24px/, "Hunger progress must not retain its old fixed width floor.");

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
