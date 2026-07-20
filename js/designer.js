import { TILE_DEFS, analyzeLevel, parseLevel } from "./engine.js";
import { renderTile } from "./tiles.js";

const STORAGE_KEY = "flow-commander-level-workshop-v1";
const MIN_WIDTH = 4;
const MAX_WIDTH = 24;
const MIN_HEIGHT = 4;
const MAX_HEIGHT = 16;

const EMPTY_CODE = ".";
const HOTBAR_SLOTS = 10;
const BRUSH_SIZES = Object.freeze([1, 2, 3]);
const MAX_CELL_SIZE = 96;
const MIN_CELL_SIZE = 14;
// One commander and one banner per map, so these never paint as a block and never erase by accident.
const UNIQUE_CODES = Object.freeze(["S", "G"]);

const BRUSHES = Object.freeze([
  { code: ".", group: "Terrain", label: "Meadow", glyph: "·" },
  { code: "#", group: "Terrain", label: "Thick wilds", glyph: "▦" },
  { code: "~", group: "Terrain", label: "River · needs a builder", glyph: "≈" },
  { code: "w", group: "Terrain", label: "Deep mud · costs 2 movement", glyph: "▒" },
  { code: "c", group: "Terrain", label: "Supply cache · grants 2 movement", glyph: "▣" },

  { code: "S", group: "Markers", label: "Commander start", glyph: "◆" },
  { code: "G", group: "Markers", label: "Royal banner", glyph: "⚑" },
  { code: "*", group: "Markers", label: "Rally beacon", glyph: "◎" },

  { code: "r", group: "Company", label: "One soldier", glyph: "+1" },
  { code: "R", group: "Company", label: "Two soldiers", glyph: "+2" },
  { code: "m", group: "Company", label: "Mage recruit", glyph: "✦" },
  { code: "b", group: "Company", label: "Builder recruit", glyph: "B" },
  { code: "f", group: "Company", label: "Field healer", glyph: "✚" },
  { code: "a", group: "Company", label: "Aegis Bearer · protects one battle", glyph: "◆" },

  { code: "g", group: "Foes", label: "Goblin · costs 1 soldier", glyph: "1" },
  { code: "o", group: "Foes", label: "Orc · costs 2 soldiers", glyph: "2" },
  { code: "t", group: "Foes", label: "Ogre · costs 3 soldiers", glyph: "3" },
  { code: "d", group: "Foes", label: "Dragon · needs a mage", glyph: "D" },
  { code: "h", group: "Foes", label: "Hungry mossling · fed from 1 adjacent route tile", glyph: "⌾" },
  { code: "H", group: "Foes", label: "Hungry emberling · fed from 2 adjacent route tiles", glyph: "⌾" },

  { code: "1", group: "Formation", label: "Formation checkpoint · exactly 1 ready soldier", glyph: "=1" },
  { code: "2", group: "Formation", label: "Formation checkpoint · exactly 2 ready soldiers", glyph: "=2" },
  { code: "3", group: "Formation", label: "Formation checkpoint · exactly 3 ready soldiers", glyph: "=3" },

  { code: "i", group: "Route", label: "Stride Marker · continue straight through", glyph: "↕↔" },
  { code: "p", group: "Route", label: "Pivot Marker · make a right-angle turn", glyph: "↱↰" },
  { code: ">", group: "Route", label: "Eastward marching arrow", glyph: "→" },
  { code: "<", group: "Route", label: "Westward marching arrow", glyph: "←" },
  { code: "^", group: "Route", label: "Northward marching arrow", glyph: "↑" },
  { code: "v", group: "Route", label: "Southward marching arrow", glyph: "↓" },

  { code: "y", group: "Seals", label: "Sun switch", glyph: "☀" },
  { code: "Y", group: "Seals", label: "Sun gate", glyph: "☀" },
  { code: "q", group: "Seals", label: "Moon switch", glyph: "☾" },
  { code: "Q", group: "Seals", label: "Moon gate", glyph: "☾" },
]);

const BRUSH_BY_CODE = new Map(BRUSHES.map((brush) => [brush.code, brush]));
const BRUSH_GROUPS = [...new Set(BRUSHES.map((brush) => brush.group))];
const DEFAULT_HOTBAR = Object.freeze(["#", ".", "r", "R", "g", "o", "m", "b", "~", "G"]);
const DIFFICULTY_VALUES = Object.freeze({ Gentle: 2, Tricky: 4, Clever: 6, Hard: 8, Master: 10 });

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

function normalizeHotbar(candidate) {
  const source = Array.isArray(candidate) ? candidate : [];
  return Array.from({ length: HOTBAR_SLOTS }, (_, slot) => (
    BRUSH_BY_CODE.has(source[slot]) ? source[slot] : DEFAULT_HOTBAR[slot]
  ));
}

function readWorkspace() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    const designs = Array.isArray(parsed?.designs) ? parsed.designs.map(normalizeDesign).filter(Boolean) : [];
    if (designs.length) {
      return {
        designs,
        activeId: designs.some((design) => design.id === parsed.activeId) ? parsed.activeId : designs[0].id,
        hotbar: normalizeHotbar(parsed?.hotbar),
        activeSlot: clamp(Number(parsed?.activeSlot), 0, HOTBAR_SLOTS - 1),
      };
    }
  } catch { /* A clean workshop is safer than failing on corrupt browser storage. */ }
  const starter = createDesign("My First March");
  return { designs: [starter], activeId: starter.id, hotbar: normalizeHotbar(null), activeSlot: 0 };
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

// Every surface paints through the shared board renderer, so a brush chip, a
// workshop cell, and the played tile are the same pixels.
function appendBrushVisual(node, code, variant = "cell", r = 0, c = 0) {
  renderTile(node, code, r, c, { showParty: true });
  node.classList.add(variant === "chip" ? "tile-chip" : "designer-cell");
}

// The native title tooltip takes about a second to appear, which is far too slow for a
// palette you sweep across. This is the same information, shown the instant you hover.
function createTooltip() {
  const node = document.createElement("div");
  node.className = "editor-tooltip";
  node.hidden = true;
  document.body.append(node);

  let anchor = null;
  let anchorKey = null;

  function place() {
    if (!anchor?.isConnected) return hide();
    const rect = anchor.getBoundingClientRect();
    const own = node.getBoundingClientRect();
    const above = rect.top - own.height - 10;
    const below = above >= 8;
    node.style.left = `${clamp(rect.left + rect.width / 2 - own.width / 2, 8, Math.max(8, window.innerWidth - own.width - 8))}px`;
    node.style.top = `${below ? above : rect.bottom + 10}px`;
    node.classList.toggle("is-below", !below);
  }

  function show(element, text, key = null) {
    if (!text) return;
    anchor = element;
    anchorKey = key;
    node.textContent = text;
    node.hidden = false;
    place();
  }

  function hide(element = null) {
    if (element && anchor !== element) return;
    anchor = null;
    anchorKey = null;
    node.hidden = true;
  }

  // Hotbar and library rebuild their buttons wholesale, so the hovered node is replaced
  // under a cursor that never moved. Re-anchor to its successor instead of blinking out.
  function reattach() {
    if (!anchorKey || node.hidden) return;
    const next = document.querySelector(`[data-tooltip-key="${anchorKey}"]`);
    if (!next) return hide();
    anchor = next;
    node.textContent = next.dataset.tooltip ?? node.textContent;
    place();
  }

  return { show, hide, reattach };
}

function copyFallback(textarea) {
  textarea.focus();
  textarea.select();
  return document.execCommand?.("copy") ?? false;
}

export function createLevelDesigner({ onPlaytest } = {}) {
  const dom = {
    open: document.querySelector("#designerButton"),
    shell: document.querySelector("#editorShell"),
    gameShell: document.querySelector("#game"),
    close: document.querySelector("#closeDesignerButton"),
    viewport: document.querySelector("#editorViewport"),
    frame: document.querySelector("#editorFrame"),
    grid: document.querySelector("#designerGrid"),
    hotbar: document.querySelector("#designerHotbar"),
    sizes: document.querySelector("#designerBrushSizes"),
    library: document.querySelector("#designerLibrary"),
    libraryTray: document.querySelector("#designerLibraryTray"),
    libraryToggle: document.querySelector("#toggleLibraryButton"),
    libraryClose: document.querySelector("#closeLibraryButton"),
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
    status: document.querySelector("#designerStatus"),
    autosave: document.querySelector("#designerAutosave"),
    saveWrap: document.querySelector(".designer-head__save"),
    analyze: document.querySelector("#analyzeDesignButton"),
    playtest: document.querySelector("#playtestDesignButton"),
    copy: document.querySelector("#copyDesignButton"),
    output: document.querySelector("#designExport"),
  };
  if (!dom.shell || !dom.grid || !dom.hotbar) {
    return { open() {}, close() {}, isOpen: () => false, activeId: () => null };
  }

  const workspace = readWorkspace();
  const tooltip = createTooltip();
  let brushSize = 1;
  let opened = false;
  let painting = false;
  let strokeCode = EMPTY_CODE;
  let strokeAnchor = null;
  let saveTimer = null;

  function activeDesign() {
    return workspace.designs.find((design) => design.id === workspace.activeId) ?? workspace.designs[0];
  }

  // `key` is stable across re-renders so the tooltip can follow a rebuilt button.
  function bindTooltip(element, text, key = null) {
    element.dataset.tooltip = text;
    if (key) element.dataset.tooltipKey = key;
    element.addEventListener("pointerenter", () => tooltip.show(element, text, key));
    element.addEventListener("pointerleave", () => tooltip.hide(element));
    element.addEventListener("focus", () => tooltip.show(element, text, key));
    element.addEventListener("blur", () => tooltip.hide(element));
  }

  function selectedCode() {
    return workspace.hotbar[workspace.activeSlot] ?? EMPTY_CODE;
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

  function renderHotbar() {
    dom.hotbar.replaceChildren();
    workspace.hotbar.forEach((code, slot) => {
      const brush = BRUSH_BY_CODE.get(code);
      const wrap = document.createElement("button");
      wrap.type = "button";
      wrap.className = "editor-hotbar__slot";
      wrap.dataset.slot = String(slot);
      bindTooltip(wrap, `${brush?.label ?? code} · key ${(slot + 1) % 10}`, `hotbar-${slot}`);
      wrap.setAttribute("aria-label", `Slot ${slot + 1}: ${brush?.label ?? code}`);
      wrap.setAttribute("aria-pressed", String(slot === workspace.activeSlot));

      const tile = document.createElement("span");
      appendBrushVisual(tile, code, "chip");
      const key = document.createElement("kbd");
      key.className = "editor-hotbar__key";
      key.textContent = String((slot + 1) % 10);

      wrap.append(tile, key);
      wrap.addEventListener("click", () => setActiveSlot(slot));
      dom.hotbar.append(wrap);
    });
    tooltip.reattach();
  }

  function renderLibrary() {
    dom.library.replaceChildren();
    BRUSH_GROUPS.forEach((group) => {
      const section = document.createElement("div");
      section.className = "editor-library__group";
      const heading = document.createElement("h4");
      heading.textContent = group;
      const tiles = document.createElement("div");
      tiles.className = "editor-library__tiles";
      BRUSHES.filter((brush) => brush.group === group).forEach((brush) => {
        const button = document.createElement("button");
        button.type = "button";
        bindTooltip(button, brush.label, `library-${brush.code}`);
        button.setAttribute("aria-label", `${brush.label}. Load into slot ${workspace.activeSlot + 1}.`);
        appendBrushVisual(button, brush.code, "chip");
        button.classList.toggle("is-selected", brush.code === selectedCode());
        button.addEventListener("click", () => assignToActiveSlot(brush.code));
        tiles.append(button);
      });
      section.append(heading, tiles);
      dom.library.append(section);
    });
    tooltip.reattach();
  }

  function renderBrushSizes() {
    dom.sizes.replaceChildren();
    BRUSH_SIZES.forEach((size) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "editor-size";
      button.textContent = `${size}×${size}`;
      bindTooltip(button, `${size}×${size} brush · [ and ] resize`, `brush-size-${size}`);
      button.setAttribute("aria-pressed", String(size === brushSize));
      button.addEventListener("click", () => setBrushSize(size));
      dom.sizes.append(button);
    });
    tooltip.reattach();
  }

  function setActiveSlot(slot) {
    workspace.activeSlot = clamp(slot, 0, HOTBAR_SLOTS - 1);
    renderHotbar();
    if (!dom.libraryTray.hidden) renderLibrary();
    persistNow();
  }

  function assignToActiveSlot(code) {
    workspace.hotbar[workspace.activeSlot] = code;
    renderHotbar();
    renderLibrary();
    persistNow();
    setStatus(`${BRUSH_BY_CODE.get(code)?.label ?? code} loaded into slot ${(workspace.activeSlot + 1) % 10}.`);
  }

  function setBrushSize(size) {
    brushSize = BRUSH_SIZES.includes(size) ? size : 1;
    renderBrushSizes();
    previewBrush(dom.grid.querySelector(".is-brush-preview"));
  }

  function cycleBrushSize(step) {
    const index = BRUSH_SIZES.indexOf(brushSize);
    setBrushSize(BRUSH_SIZES[clamp(index + step, 0, BRUSH_SIZES.length - 1)]);
  }

  function toggleLibrary(force = null) {
    const show = force ?? dom.libraryTray.hidden;
    dom.libraryTray.hidden = !show;
    dom.libraryToggle.setAttribute("aria-expanded", String(show));
    if (show) renderLibrary();
    fitGrid();
  }

  function updateGridCell(r, c) {
    const cell = dom.grid.querySelector(`[data-r="${r}"][data-c="${c}"]`);
    if (!cell) return;
    const code = activeDesign().map[r][c];
    appendBrushVisual(cell, code, "cell", r, c);
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
        appendBrushVisual(cell, design.map[r][c], "cell", r, c);
        cell.dataset.r = String(r);
        cell.dataset.c = String(c);
        cell.setAttribute("role", "gridcell");
        cell.setAttribute("aria-label", `${TILE_DEFS[design.map[r][c]].label}, row ${r + 1}, column ${c + 1}`);
        dom.grid.append(cell);
      }
    }
    fitGrid();
  }

  // The canvas scales the way the real board does, so a full-size map never needs scrolling.
  function fitGrid() {
    if (!opened) return;
    const design = activeDesign();
    const width = dom.viewport.clientWidth;
    const height = dom.viewport.clientHeight;
    if (!width || !height) return;
    const viewportStyle = window.getComputedStyle(dom.viewport);
    const frameStyle = window.getComputedStyle(dom.frame);
    const horizontalPadding = Number.parseFloat(viewportStyle.paddingLeft) + Number.parseFloat(viewportStyle.paddingRight);
    const verticalPadding = Number.parseFloat(viewportStyle.paddingTop) + Number.parseFloat(viewportStyle.paddingBottom);
    const horizontalFrame = Number.parseFloat(frameStyle.borderLeftWidth) + Number.parseFloat(frameStyle.borderRightWidth);
    const verticalFrame = Number.parseFloat(frameStyle.borderTopWidth) + Number.parseFloat(frameStyle.borderBottomWidth);
    const cellSize = Math.max(MIN_CELL_SIZE, Math.floor(Math.min(
      (width - horizontalPadding - horizontalFrame) / design.width,
      (height - verticalPadding - verticalFrame) / design.height,
      MAX_CELL_SIZE,
    )));
    dom.grid.style.setProperty("--designer-cell-size", `${cellSize}px`);
    dom.frame.style.width = `${cellSize * design.width + horizontalFrame}px`;
    dom.frame.style.height = `${cellSize * design.height + verticalFrame}px`;
    dom.frame.classList.toggle("editor-frame--dense", cellSize < 34);
  }

  // Returns "painted" only when the map actually changed, so a wide stroke can report why it skipped tiles.
  function paintAt(r, c, code) {
    const design = activeDesign();
    const targetCode = design.map[r]?.[c];
    if (targetCode === undefined) return "outside";
    if (targetCode === code) return "same";
    if (UNIQUE_CODES.includes(targetCode) && !UNIQUE_CODES.includes(code)) return "protected";

    if (UNIQUE_CODES.includes(code)) {
      const oppositeMarker = code === "S" ? "G" : "S";
      const swapsMarkers = targetCode === oppositeMarker;
      let markerWasMoved = false;
      design.map.forEach((row, rowIndex) => {
        const previousColumn = row.indexOf(code);
        if (previousColumn < 0) return;
        const replacement = [...row];
        replacement[previousColumn] = swapsMarkers && !markerWasMoved ? oppositeMarker : EMPTY_CODE;
        markerWasMoved = true;
        design.map[rowIndex] = replacement.join("");
        updateGridCell(rowIndex, previousColumn);
      });
      if (swapsMarkers && !markerWasMoved) return "missing";
    }

    const row = [...design.map[r]];
    row[c] = code;
    design.map[r] = row.join("");
    updateGridCell(r, c);
    return "painted";
  }

  // Pointer samples are coarser than the grid, so a quick drag would otherwise skip whole tiles.
  function* lineBetween(from, to) {
    const spanRow = Math.abs(to.r - from.r);
    const spanColumn = Math.abs(to.c - from.c);
    const stepRow = from.r < to.r ? 1 : -1;
    const stepColumn = from.c < to.c ? 1 : -1;
    let error = spanColumn - spanRow;
    let { r, c } = from;
    for (;;) {
      yield { r, c };
      if (r === to.r && c === to.c) return;
      const doubled = error * 2;
      if (doubled > -spanRow) {
        error -= spanRow;
        c += stepColumn;
      }
      if (doubled < spanColumn) {
        error += spanColumn;
        r += stepRow;
      }
    }
  }

  function stamp(r, c, outcomes) {
    // Unique markers are single tiles no matter how wide the brush is.
    const size = UNIQUE_CODES.includes(strokeCode) ? 1 : brushSize;
    const offset = Math.floor((size - 1) / 2);
    for (let dr = 0; dr < size; dr += 1) {
      for (let dc = 0; dc < size; dc += 1) {
        outcomes.push(paintAt(r - offset + dr, c - offset + dc, strokeCode));
      }
    }
  }

  // A wide brush has to show its footprint before it commits, not after.
  function previewBrush(cell) {
    for (const marked of dom.grid.querySelectorAll(".is-brush-preview")) {
      marked.classList.remove("is-brush-preview");
    }
    if (!cell?.classList.contains("designer-cell")) return;
    const r = Number(cell.dataset.r);
    const c = Number(cell.dataset.c);
    const size = UNIQUE_CODES.includes(selectedCode()) ? 1 : brushSize;
    const offset = Math.floor((size - 1) / 2);
    for (let dr = 0; dr < size; dr += 1) {
      for (let dc = 0; dc < size; dc += 1) {
        const target = dom.grid.querySelector(`[data-r="${r - offset + dr}"][data-c="${c - offset + dc}"]`);
        target?.classList.add("is-brush-preview");
      }
    }
  }

  function paintStroke(cell) {
    if (!cell?.classList.contains("designer-cell")) return;
    const r = Number(cell.dataset.r);
    const c = Number(cell.dataset.c);
    if (strokeAnchor && strokeAnchor.r === r && strokeAnchor.c === c) return;
    const from = strokeAnchor ?? { r, c };
    strokeAnchor = { r, c };

    // Repainting the previous anchor is a no-op, so the span can stay inclusive at both ends.
    const outcomes = [];
    for (const point of lineBetween(from, { r, c })) stamp(point.r, point.c, outcomes);

    if (outcomes.includes("painted")) {
      setStatus("Draft changed. Analyze when the route is ready.");
      scheduleSave();
      return;
    }
    if (outcomes.includes("missing")) {
      setStatus(`Paint the missing ${strokeCode === "S" ? "commander" : "banner"} on an empty tile first.`, "error");
      return;
    }
    if (outcomes.includes("protected")) {
      setStatus("Keep one commander and one banner. Move a marker by selecting its own brush.", "error");
    }
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
    setStatus("Paint a route, then analyze it to confirm the level can be won.");
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
    if (dom.analyze.disabled) return;
    setStatus("Searching for a legal winning route…", "working");
    dom.analyze.disabled = true;
    window.setTimeout(() => {
      try {
        const level = parseActiveDesign();
        const analysis = analyzeLevel(level, { solutionLimit: 1, nodeLimit: 350_000 });
        const metrics = analysis.metrics;
        if (analysis.solvable) {
          setStatus(`Winning route found · ${metrics.solutionDepth} moves · ${metrics.solutionTurns} turns · alternative routes are allowed.`, "success");
        } else if (metrics.aborted) {
          setStatus(`No winning route was found within 350,000 checks. Simplify the search or verify the map another way.`, "error");
        } else {
          setStatus(`No solution found after ${metrics.nodesExpanded.toLocaleString()} checks. Open a route or change the resource order.`, "error");
        }
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "This map could not be analyzed.", "error");
      } finally {
        dom.analyze.disabled = false;
      }
    }, 30);
  }

  function createNewDesign() {
    const design = createDesign(`Untitled March ${workspace.designs.length + 1}`);
    workspace.designs.push(design);
    workspace.activeId = design.id;
    renderActiveDesign();
    persistNow();
    dom.name.focus();
    dom.name.select();
  }

  function duplicateActiveDesign() {
    const source = activeDesign();
    const copy = normalizeDesign({ ...source, id: createId(), name: `${source.name} Copy`, map: [...source.map], updatedAt: Date.now() });
    workspace.designs.push(copy);
    workspace.activeId = copy.id;
    renderActiveDesign();
    persistNow();
    setStatus(`Duplicated to “${copy.name}”. The original is untouched.`, "success");
  }

  function deleteActiveDesign() {
    const design = activeDesign();
    tooltip.hide();
    if (!window.confirm(`Delete “${design.name}” from this browser?`)) return;
    workspace.designs = workspace.designs.filter((candidate) => candidate.id !== design.id);
    if (!workspace.designs.length) workspace.designs.push(createDesign("My First March"));
    workspace.activeId = workspace.designs[0].id;
    renderActiveDesign();
    persistNow();
  }

  async function copyLevelData() {
    let copied = false;
    try {
      await navigator.clipboard.writeText(dom.output.value);
      copied = true;
    } catch {
      copied = copyFallback(dom.output);
    }
    setStatus(copied ? "Level data copied. Paste it back into chat whenever it is ready." : "Select the export text and copy it manually.", copied ? "success" : "error");
  }

  function playtestActiveDesign() {
    try {
      const level = parseActiveDesign();
      persistNow();
      close();
      onPlaytest?.(level, { designId: activeDesign().id, raw: exportableLevel(activeDesign()) });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "This map cannot be playtested yet.", "error");
    }
  }

  function open(designId = null) {
    if (designId && workspace.designs.some((design) => design.id === designId)) workspace.activeId = designId;
    opened = true;
    document.body.classList.add("mode-editor");
    dom.shell.hidden = false;
    if (dom.gameShell) dom.gameShell.hidden = true;
    dom.open?.setAttribute("aria-pressed", "true");
    renderActiveDesign();
    persistNow();
    window.requestAnimationFrame(fitGrid);
  }

  function close() {
    painting = false;
    opened = false;
    tooltip.hide();
    persistNow();
    document.body.classList.remove("mode-editor");
    dom.shell.hidden = true;
    if (dom.gameShell) dom.gameShell.hidden = false;
    dom.open?.setAttribute("aria-pressed", "false");
    toggleLibrary(false);
  }

  [
    [dom.analyze, "Analyze this map for a winning route · A"],
    [dom.playtest, "Play the map yourself · P"],
    [dom.create, "Start a blank map · N"],
    [dom.duplicate, "Duplicate this map · D"],
    [dom.remove, "Delete this map · Backspace"],
    [dom.copy, "Copy this level's data to the clipboard · C"],
    [dom.libraryToggle, "Browse every tile · E"],
  ].forEach(([button, text], index) => button && bindTooltip(button, text, `action-${index}`));

  renderHotbar();
  renderBrushSizes();
  renderActiveDesign();
  persistNow();

  dom.open?.addEventListener("click", () => (opened ? close() : open()));
  dom.close?.addEventListener("click", close);
  // Reaching for Missions or the field guide means leaving the workshop, not stacking a drawer over a hidden board.
  ["#campaignToggleButton", "#helpToggleButton"].forEach((selector) => {
    document.querySelector(selector)?.addEventListener("click", () => {
      if (opened) close();
    }, true);
  });
  dom.libraryToggle.addEventListener("click", () => toggleLibrary());
  dom.libraryClose.addEventListener("click", () => {
    toggleLibrary(false);
    dom.libraryToggle.focus({ preventScroll: true });
  });
  dom.select.addEventListener("change", () => {
    workspace.activeId = dom.select.value;
    renderActiveDesign();
    persistNow();
  });
  dom.create.addEventListener("click", createNewDesign);
  dom.duplicate.addEventListener("click", duplicateActiveDesign);
  dom.remove.addEventListener("click", deleteActiveDesign);

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

  // Left paints the hotbar brush; right always clears back to the default empty tile.
  dom.grid.addEventListener("contextmenu", (event) => event.preventDefault());
  dom.grid.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 && event.button !== 2) return;
    painting = true;
    strokeCode = event.button === 2 ? EMPTY_CODE : selectedCode();
    strokeAnchor = null;
    paintStroke(event.target.closest(".designer-cell"));
    try { dom.grid.setPointerCapture?.(event.pointerId); } catch { /* Some synthetic or older pointers cannot be captured. */ }
    event.preventDefault();
  });
  dom.grid.addEventListener("pointermove", (event) => {
    const element = document.elementFromPoint(event.clientX, event.clientY);
    const cell = element?.closest?.(".designer-cell");
    previewBrush(cell);
    if (!painting) return;
    paintStroke(cell);
    event.preventDefault();
  });
  dom.grid.addEventListener("pointerleave", () => previewBrush(null));
  const endPaint = () => {
    painting = false;
    strokeAnchor = null;
  };
  dom.grid.addEventListener("pointerup", endPaint);
  dom.grid.addEventListener("pointercancel", endPaint);
  dom.grid.addEventListener("lostpointercapture", endPaint);
  dom.grid.addEventListener("wheel", (event) => {
    event.preventDefault();
    const step = event.deltaY > 0 ? 1 : -1;
    setActiveSlot((workspace.activeSlot + step + HOTBAR_SLOTS) % HOTBAR_SLOTS);
  }, { passive: false });

  document.addEventListener("keydown", (event) => {
    // A key the game already consumed can be what reopened the workshop mid-event.
    if (!opened || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target;
    if (target instanceof HTMLElement && (target.closest("input, textarea, select") || target.isContentEditable)) return;
    if (event.key === "Escape") {
      if (dom.libraryTray.hidden) close();
      else toggleLibrary(false);
      event.preventDefault();
      return;
    }
    const digit = "1234567890".indexOf(event.key);
    if (digit >= 0) {
      setActiveSlot(digit);
      event.preventDefault();
      return;
    }
    if (event.key === "[" || event.key === "]") {
      cycleBrushSize(event.key === "]" ? 1 : -1);
      event.preventDefault();
      return;
    }
    // Deleting a map is the one destructive action here, so it answers only to the
    // reflex key for "remove this" rather than to a letter sitting next to the others.
    const shortcuts = {
      Backspace: deleteActiveDesign,
      e: toggleLibrary,
      a: analyzeActiveDesign,
      p: playtestActiveDesign,
      n: createNewDesign,
      d: duplicateActiveDesign,
      c: copyLevelData,
    };
    const action = event.key === "Backspace" ? "Backspace" : event.key.toLowerCase();
    if (Object.hasOwn(shortcuts, action)) {
      shortcuts[action]();
      event.preventDefault();
    }
  });

  dom.analyze.addEventListener("click", analyzeActiveDesign);
  dom.playtest.addEventListener("click", playtestActiveDesign);
  dom.copy.addEventListener("click", copyLevelData);

  const gridResizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver(fitGrid) : null;
  gridResizeObserver?.observe(dom.viewport);
  window.addEventListener("resize", fitGrid);
  // A fixed tooltip cannot follow an anchor that scrolls out from under it.
  window.addEventListener("resize", () => tooltip.hide());
  document.addEventListener("scroll", () => tooltip.hide(), true);
  window.addEventListener("beforeunload", persistNow);

  return {
    open,
    close,
    isOpen: () => opened,
    activeId: () => activeDesign().id,
  };
}

export { BRUSHES, exportableLevel, normalizeDesign };
