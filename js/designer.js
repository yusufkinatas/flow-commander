import { TILE_DEFS, analyzeLevel, parseLevel } from "./engine.js";

const STORAGE_KEY = "flow-commander-level-workshop-v1";
const MIN_WIDTH = 4;
const MAX_WIDTH = 24;
const MIN_HEIGHT = 4;
const MAX_HEIGHT = 16;

const BRUSHES = Object.freeze([
  { code: ".", label: "Meadow", glyph: "·" },
  { code: "#", label: "Thick wilds", glyph: "▦" },
  { code: "S", label: "Commander start", glyph: "◆" },
  { code: "G", label: "Royal banner", glyph: "⚑" },
  { code: "r", label: "One soldier", glyph: "+1" },
  { code: "R", label: "Two soldiers", glyph: "+2" },
  { code: "1", label: "Formation checkpoint · exactly 1 ready soldier", glyph: "=1" },
  { code: "2", label: "Formation checkpoint · exactly 2 ready soldiers", glyph: "=2" },
  { code: "3", label: "Formation checkpoint · exactly 3 ready soldiers", glyph: "=3" },
  { code: "g", label: "Goblin · costs 1 soldier", glyph: "1" },
  { code: "o", label: "Goblin duo · costs 2 soldiers", glyph: "2" },
  { code: "t", label: "Goblin troop · costs 3 soldiers", glyph: "3" },
  { code: "m", label: "Mage recruit", glyph: "✦" },
  { code: "d", label: "Dragon · needs a mage", glyph: "D" },
  { code: "b", label: "Builder recruit", glyph: "B" },
  { code: "~", label: "River · needs a builder", glyph: "≈" },
  { code: "f", label: "Field healer", glyph: "✚" },
  { code: "y", label: "Sun switch", glyph: "☀" },
  { code: "Y", label: "Sun gate", glyph: "☀" },
  { code: "q", label: "Moon switch", glyph: "☾" },
  { code: "Q", label: "Moon gate", glyph: "☾" },
]);

const BRUSH_BY_CODE = new Map(BRUSHES.map((brush) => [brush.code, brush]));
const DIFFICULTY_VALUES = Object.freeze({ Gentle: 2, Tricky: 4, Clever: 6, Hard: 8, Master: 10 });

const SPRITES = Object.freeze({
  "#": "./assets/vendor/kenney-tiny-town/Tiles/tile_0007.png",
  S: "./assets/vendor/kenney-tiny-dungeon/Tiles/tile_0100.png",
  G: "./assets/vendor/kenney-tiny-town/Tiles/tile_0095.png",
  r: "./assets/vendor/kenney-tiny-dungeon/Tiles/tile_0098.png",
  R: "./assets/vendor/kenney-tiny-dungeon/Tiles/tile_0098.png",
  g: "./assets/vendor/tiny-creatures/tiny-creatures/Tiles/tile_0011.png",
  o: "./assets/vendor/tiny-creatures/tiny-creatures/Tiles/tile_0012.png",
  t: "./assets/vendor/tiny-creatures/tiny-creatures/Tiles/tile_0015.png",
  m: "./assets/vendor/kenney-tiny-dungeon/Tiles/tile_0084.png",
  d: "./assets/vendor/tiny-creatures/tiny-creatures/Tiles/tile_0034.png",
  b: "./assets/vendor/kenney-tiny-farm/Tiles/tile_0108.png",
  f: "./assets/vendor/kenney-tiny-dungeon/Tiles/tile_0087.png",
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? Math.round(value) : min));
}

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `map-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function blankMap(width = 9, height = 7) {
  const rows = Array.from({ length: height }, (_, row) => {
    if (row === 0 || row === height - 1) return "#".repeat(width);
    return `#${".".repeat(width - 2)}#`;
  });
  const middle = Math.floor(height / 2);
  const row = [...rows[middle]];
  row[1] = "S";
  row[width - 2] = "G";
  rows[middle] = row.join("");
  return rows;
}

function createDesign(name = "Untitled March") {
  const width = 9;
  const height = 7;
  return {
    id: createId(),
    name,
    difficulty: "Clever",
    mechanic: "Recruit → rally",
    briefing: "Gather the right company, handle every obstacle, and reach the banner.",
    tip: "Work backward from the final obstacle before drawing.",
    width,
    height,
    map: blankMap(width, height),
    updatedAt: Date.now(),
  };
}

function normalizeDesign(candidate) {
  if (!candidate || typeof candidate !== "object") return null;
  const width = clamp(Number(candidate.width ?? candidate.map?.[0]?.length), MIN_WIDTH, MAX_WIDTH);
  const height = clamp(Number(candidate.height ?? candidate.map?.length), MIN_HEIGHT, MAX_HEIGHT);
  const source = Array.isArray(candidate.map) ? candidate.map : [];
  const map = Array.from({ length: height }, (_, r) => {
    const input = typeof source[r] === "string" ? source[r] : "";
    return Array.from({ length: width }, (_, c) => BRUSH_BY_CODE.has(input[c]) ? input[c] : ".").join("");
  });
  return {
    id: typeof candidate.id === "string" && candidate.id ? candidate.id : createId(),
    name: String(candidate.name || "Untitled March").slice(0, 60),
    difficulty: Object.hasOwn(DIFFICULTY_VALUES, candidate.difficulty) ? candidate.difficulty : "Clever",
    mechanic: String(candidate.mechanic || "Recruit → rally").slice(0, 70),
    briefing: String(candidate.briefing || "Gather the right company and reach the banner.").slice(0, 240),
    tip: String(candidate.tip || "Work backward before drawing.").slice(0, 180),
    width,
    height,
    map,
    updatedAt: Number(candidate.updatedAt) || Date.now(),
  };
}

function readWorkspace() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    const designs = Array.isArray(parsed?.designs) ? parsed.designs.map(normalizeDesign).filter(Boolean) : [];
    if (designs.length) {
      return {
        designs,
        activeId: designs.some((design) => design.id === parsed.activeId) ? parsed.activeId : designs[0].id,
      };
    }
  } catch { /* A clean workshop is safer than failing on corrupt browser storage. */ }
  const starter = createDesign("My First March");
  return { designs: [starter], activeId: starter.id };
}

function exportableLevel(design) {
  return {
    id: 1,
    mode: "campaign",
    name: design.name.trim() || "Untitled March",
    difficulty: DIFFICULTY_VALUES[design.difficulty] ?? 6,
    mechanic: design.mechanic.trim() || "Custom route",
    briefing: design.briefing.trim() || "Reach the banner.",
    tip: design.tip.trim() || "Plan before drawing.",
    map: [...design.map],
  };
}

function appendBrushVisual(node, code, palette = false) {
  node.replaceChildren();
  node.className = `${palette ? "designer-palette__button" : "designer-cell"} designer-cell--${TILE_DEFS[code]?.type ?? "meadow"}`;
  node.dataset.code = code;
  const sprite = SPRITES[code];
  if (sprite) {
    const image = document.createElement("img");
    image.src = sprite;
    image.alt = "";
    image.draggable = false;
    node.append(image);
  } else {
    const glyph = document.createElement("span");
    glyph.className = "designer-cell__glyph";
    glyph.textContent = BRUSH_BY_CODE.get(code)?.glyph ?? code;
    node.append(glyph);
  }
  if (["R", "r", "g", "o", "t"].includes(code)) {
    const badge = document.createElement("span");
    badge.className = `designer-cell__badge${/[rR]/.test(code) ? " is-pickup" : ""}`;
    badge.textContent = code === "R" ? "+2" : code === "r" ? "+1" : String(TILE_DEFS[code].cost);
    node.append(badge);
  }
}

function copyFallback(textarea) {
  textarea.focus();
  textarea.select();
  return document.execCommand?.("copy") ?? false;
}

export function createLevelDesigner({ onPlaytest } = {}) {
  const dom = {
    open: document.querySelector("#designerButton"),
    dialog: document.querySelector("#designerDialog"),
    close: document.querySelector("#closeDesignerButton"),
    select: document.querySelector("#designSelect"),
    create: document.querySelector("#newDesignButton"),
    duplicate: document.querySelector("#duplicateDesignButton"),
    remove: document.querySelector("#deleteDesignButton"),
    name: document.querySelector("#designName"),
    difficulty: document.querySelector("#designDifficulty"),
    mechanic: document.querySelector("#designMechanic"),
    briefing: document.querySelector("#designBriefing"),
    tip: document.querySelector("#designTip"),
    width: document.querySelector("#designWidth"),
    height: document.querySelector("#designHeight"),
    palette: document.querySelector("#designerPalette"),
    grid: document.querySelector("#designerGrid"),
    status: document.querySelector("#designerStatus"),
    autosave: document.querySelector("#designerAutosave"),
    saveWrap: document.querySelector(".designer-head__save"),
    analyze: document.querySelector("#analyzeDesignButton"),
    playtest: document.querySelector("#playtestDesignButton"),
    copy: document.querySelector("#copyDesignButton"),
    output: document.querySelector("#designExport"),
  };
  if (!dom.dialog || !dom.grid || !dom.palette) {
    return { open() {}, close() {}, activeId: () => null };
  }

  const workspace = readWorkspace();
  let selectedBrush = ".";
  let painting = false;
  let paintedCell = "";
  let saveTimer = null;

  function activeDesign() {
    return workspace.designs.find((design) => design.id === workspace.activeId) ?? workspace.designs[0];
  }

  function setStatus(message, tone = "normal") {
    dom.status.textContent = message;
    dom.status.classList.toggle("is-success", tone === "success");
    dom.status.classList.toggle("is-error", tone === "error");
    dom.status.classList.toggle("is-working", tone === "working");
  }

  function refreshExport() {
    dom.output.value = JSON.stringify(exportableLevel(activeDesign()), null, 2);
  }

  function persistNow() {
    if (saveTimer) window.clearTimeout(saveTimer);
    saveTimer = null;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
      const time = new Intl.DateTimeFormat([], { hour: "2-digit", minute: "2-digit" }).format(new Date());
      dom.autosave.textContent = `Saved locally · ${time}`;
    } catch {
      dom.autosave.textContent = "Browser storage is unavailable";
    }
    dom.saveWrap?.classList.remove("is-saving");
  }

  function scheduleSave() {
    activeDesign().updatedAt = Date.now();
    dom.saveWrap?.classList.add("is-saving");
    dom.autosave.textContent = "Saving locally…";
    refreshExport();
    if (saveTimer) window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(persistNow, 120);
  }

  function renderSelect() {
    dom.select.replaceChildren();
    [...workspace.designs]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .forEach((design) => {
        const option = document.createElement("option");
        option.value = design.id;
        option.textContent = design.name || "Untitled March";
        option.selected = design.id === workspace.activeId;
        dom.select.append(option);
      });
  }

  function renderPalette() {
    dom.palette.replaceChildren();
    BRUSHES.forEach((brush) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.code = brush.code;
      button.title = brush.label;
      button.setAttribute("aria-label", brush.label);
      button.setAttribute("aria-pressed", String(brush.code === selectedBrush));
      appendBrushVisual(button, brush.code, true);
      button.addEventListener("click", () => {
        selectedBrush = brush.code;
        renderPalette();
      });
      dom.palette.append(button);
    });
  }

  function updateGridCell(r, c) {
    const cell = dom.grid.querySelector(`[data-r="${r}"][data-c="${c}"]`);
    if (!cell) return;
    const code = activeDesign().map[r][c];
    appendBrushVisual(cell, code);
    cell.dataset.r = String(r);
    cell.dataset.c = String(c);
    cell.setAttribute("aria-label", `${TILE_DEFS[code].label}, row ${r + 1}, column ${c + 1}`);
  }

  function renderGrid() {
    const design = activeDesign();
    dom.grid.replaceChildren();
    dom.grid.style.setProperty("--design-cols", design.width);
    for (let r = 0; r < design.height; r += 1) {
      for (let c = 0; c < design.width; c += 1) {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.dataset.r = String(r);
        cell.dataset.c = String(c);
        appendBrushVisual(cell, design.map[r][c]);
        cell.dataset.r = String(r);
        cell.dataset.c = String(c);
        cell.setAttribute("role", "gridcell");
        cell.setAttribute("aria-label", `${TILE_DEFS[design.map[r][c]].label}, row ${r + 1}, column ${c + 1}`);
        dom.grid.append(cell);
      }
    }
  }

  function paintCell(cell) {
    if (!cell?.classList.contains("designer-cell")) return;
    const r = Number(cell.dataset.r);
    const c = Number(cell.dataset.c);
    const paintKey = `${r},${c},${selectedBrush}`;
    if (paintKey === paintedCell) return;
    paintedCell = paintKey;
    const design = activeDesign();
    const targetCode = design.map[r]?.[c];
    if (targetCode === selectedBrush) return;

    if (["S", "G"].includes(targetCode) && !["S", "G"].includes(selectedBrush)) {
      setStatus("Keep one commander and one banner. Move a marker by selecting its matching brush.", "error");
      return;
    }

    if (["S", "G"].includes(selectedBrush)) {
      const oppositeMarker = selectedBrush === "S" ? "G" : "S";
      const swapsMarkers = targetCode === oppositeMarker;
      let markerWasMoved = false;
      design.map.forEach((row, rowIndex) => {
        const previousColumn = row.indexOf(selectedBrush);
        if (previousColumn < 0) return;
        const replacement = [...row];
        replacement[previousColumn] = swapsMarkers && !markerWasMoved ? oppositeMarker : ".";
        markerWasMoved = true;
        design.map[rowIndex] = replacement.join("");
        updateGridCell(rowIndex, previousColumn);
      });
      if (swapsMarkers && !markerWasMoved) {
        setStatus(`Paint the missing ${selectedBrush === "S" ? "commander" : "banner"} on an empty tile first.`, "error");
        return;
      }
    }

    const row = [...design.map[r]];
    row[c] = selectedBrush;
    design.map[r] = row.join("");
    updateGridCell(r, c);
    setStatus("Draft changed. Analyze when the route is ready.");
    scheduleSave();
  }

  function renderActiveDesign() {
    const design = activeDesign();
    dom.name.value = design.name;
    dom.difficulty.value = design.difficulty;
    dom.mechanic.value = design.mechanic;
    dom.briefing.value = design.briefing;
    dom.tip.value = design.tip;
    dom.width.value = String(design.width);
    dom.height.value = String(design.height);
    renderSelect();
    renderGrid();
    refreshExport();
    setStatus("Paint a route, then analyze it for a unique solution.");
  }

  function resizeMap() {
    const design = activeDesign();
    const width = clamp(Number(dom.width.value), MIN_WIDTH, MAX_WIDTH);
    const height = clamp(Number(dom.height.value), MIN_HEIGHT, MAX_HEIGHT);
    dom.width.value = String(width);
    dom.height.value = String(height);
    if (width === design.width && height === design.height) return;
    const oldMap = design.map;
    design.map = Array.from({ length: height }, (_, r) => Array.from({ length: width }, (_, c) => oldMap[r]?.[c] ?? ".").join(""));
    design.width = width;
    design.height = height;
    renderGrid();
    setStatus("Map resized. Check that it still has one start and one banner.");
    scheduleSave();
  }

  function parseActiveDesign() {
    return parseLevel(exportableLevel(activeDesign()));
  }

  function analyzeActiveDesign() {
    setStatus("Exploring every legal route…", "working");
    dom.analyze.disabled = true;
    window.setTimeout(() => {
      try {
        const level = parseActiveDesign();
        const analysis = analyzeLevel(level, { solutionLimit: 2, nodeLimit: 350_000 });
        const metrics = analysis.metrics;
        if (metrics.aborted) {
          setStatus(`Search reached 350,000 routes. The map is too open to prove uniqueness; add walls or constraints.`, "error");
        } else if (analysis.solutionCount === 0) {
          setStatus(`No solution found after ${metrics.nodesExpanded.toLocaleString()} checks. Open a route or change the resource order.`, "error");
        } else if (analysis.solutionCount > 1) {
          setStatus(`Multiple solutions found. Add a meaningful constraint; two routes appeared within ${metrics.nodesExpanded.toLocaleString()} checks.`, "error");
        } else {
          setStatus(`Unique solution proven · ${metrics.solutionDepth} moves · ${metrics.solutionTurns} turns · complexity ${metrics.complexityScore}.`, "success");
        }
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "This map could not be analyzed.", "error");
      } finally {
        dom.analyze.disabled = false;
      }
    }, 30);
  }

  function open(designId = null) {
    if (designId && workspace.designs.some((design) => design.id === designId)) workspace.activeId = designId;
    renderActiveDesign();
    persistNow();
    if (!dom.dialog.open) dom.dialog.showModal();
  }

  function close() {
    painting = false;
    persistNow();
    if (dom.dialog.open) dom.dialog.close();
  }

  renderPalette();
  renderActiveDesign();
  persistNow();

  dom.open?.addEventListener("click", () => open());
  dom.close?.addEventListener("click", close);
  dom.dialog.addEventListener("click", (event) => {
    if (event.target === dom.dialog) close();
  });
  dom.dialog.addEventListener("close", () => {
    painting = false;
    persistNow();
  });
  dom.select.addEventListener("change", () => {
    workspace.activeId = dom.select.value;
    renderActiveDesign();
    persistNow();
  });
  dom.create.addEventListener("click", () => {
    const design = createDesign(`Untitled March ${workspace.designs.length + 1}`);
    workspace.designs.push(design);
    workspace.activeId = design.id;
    renderActiveDesign();
    persistNow();
    dom.name.focus();
    dom.name.select();
  });
  dom.duplicate.addEventListener("click", () => {
    const source = activeDesign();
    const copy = normalizeDesign({ ...source, id: createId(), name: `${source.name} Copy`, map: [...source.map], updatedAt: Date.now() });
    workspace.designs.push(copy);
    workspace.activeId = copy.id;
    renderActiveDesign();
    persistNow();
  });
  dom.remove.addEventListener("click", () => {
    const design = activeDesign();
    if (!window.confirm(`Delete “${design.name}” from this browser?`)) return;
    workspace.designs = workspace.designs.filter((candidate) => candidate.id !== design.id);
    if (!workspace.designs.length) workspace.designs.push(createDesign("My First March"));
    workspace.activeId = workspace.designs[0].id;
    renderActiveDesign();
    persistNow();
  });

  const metadataBindings = [
    [dom.name, "name"],
    [dom.difficulty, "difficulty"],
    [dom.mechanic, "mechanic"],
    [dom.briefing, "briefing"],
    [dom.tip, "tip"],
  ];
  metadataBindings.forEach(([field, key]) => field.addEventListener("input", () => {
    activeDesign()[key] = field.value;
    if (key === "name") renderSelect();
    scheduleSave();
  }));
  dom.width.addEventListener("change", resizeMap);
  dom.height.addEventListener("change", resizeMap);

  dom.grid.addEventListener("pointerdown", (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    painting = true;
    paintedCell = "";
    paintCell(event.target.closest(".designer-cell"));
    try { dom.grid.setPointerCapture?.(event.pointerId); } catch { /* Some synthetic or older pointers cannot be captured. */ }
    event.preventDefault();
  });
  dom.grid.addEventListener("pointermove", (event) => {
    if (!painting) return;
    const element = document.elementFromPoint(event.clientX, event.clientY);
    paintCell(element?.closest?.(".designer-cell"));
    event.preventDefault();
  });
  const endPaint = () => {
    painting = false;
    paintedCell = "";
  };
  dom.grid.addEventListener("pointerup", endPaint);
  dom.grid.addEventListener("pointercancel", endPaint);
  dom.grid.addEventListener("lostpointercapture", endPaint);

  dom.analyze.addEventListener("click", analyzeActiveDesign);
  dom.playtest.addEventListener("click", () => {
    try {
      const level = parseActiveDesign();
      persistNow();
      close();
      onPlaytest?.(level, { designId: activeDesign().id, raw: exportableLevel(activeDesign()) });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "This map cannot be playtested yet.", "error");
    }
  });
  dom.copy.addEventListener("click", async () => {
    const text = dom.output.value;
    let copied = false;
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch {
      copied = copyFallback(dom.output);
    }
    setStatus(copied ? "Level data copied. Paste it back into chat whenever it is ready." : "Select the export text and copy it manually.", copied ? "success" : "error");
  });
  window.addEventListener("beforeunload", persistNow);

  return {
    open,
    close,
    activeId: () => activeDesign().id,
  };
}

export { BRUSHES, exportableLevel, normalizeDesign };
