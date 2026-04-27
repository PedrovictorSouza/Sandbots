"use client";

import { useEffect, useRef, useState } from "react";

const GRID_TOOL_STORAGE_KEY = "pragt-grid-tool-v1";
const MAX_Z_INDEX = 2147483646;
const BREAKPOINTS = [
  {
    id: "mobile",
    label: "Mobile",
    maxWidth: 779
  },
  {
    id: "tablet",
    label: "Tablet",
    maxWidth: 1099
  },
  {
    id: "desktop",
    label: "Desktop",
    maxWidth: Number.POSITIVE_INFINITY
  }
];
const GUIDE_TOGGLES = [
  {
    id: "bounds",
    label: "Bounds"
  },
  {
    id: "columns",
    label: "Columns"
  },
  {
    id: "rows",
    label: "Rows"
  },
  {
    id: "gutters",
    label: "Gutters"
  },
  {
    id: "spacing",
    label: "Spacing"
  },
  {
    id: "safeArea",
    label: "Safe area"
  }
];
const FIELD_DEFINITIONS = [
  {
    key: "columns",
    label: "Columns",
    min: 1,
    max: 24
  },
  {
    key: "rows",
    label: "Rows",
    min: 1,
    max: 24
  },
  {
    key: "gap",
    label: "Gap",
    min: 0,
    max: 80
  },
  {
    key: "padding",
    label: "Side pad",
    min: 0,
    max: 120
  },
  {
    key: "maxWidth",
    label: "Max width",
    min: 320,
    max: 1920
  },
  {
    key: "rowHeight",
    label: "Baseline",
    min: 4,
    max: 40
  }
];

function createBreakpointConfig(overrides = {}) {
  return {
    columns: 12,
    rows: 10,
    gap: 20,
    padding: 16,
    maxWidth: 1440,
    rowHeight: 8,
    ...overrides
  };
}

function createScopeConfig(overrides = {}) {
  return {
    mobile: createBreakpointConfig({
      columns: 4,
      rows: 6,
      gap: 16,
      padding: 16,
      maxWidth: 420,
      rowHeight: 8,
      ...(overrides.mobile || {})
    }),
    tablet: createBreakpointConfig({
      columns: 8,
      rows: 8,
      gap: 18,
      padding: 20,
      maxWidth: 960,
      rowHeight: 8,
      ...(overrides.tablet || {})
    }),
    desktop: createBreakpointConfig({
      columns: 12,
      rows: 10,
      gap: 20,
      padding: 16,
      maxWidth: 1440,
      rowHeight: 8,
      ...(overrides.desktop || {})
    })
  };
}

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function createGridState(scopeOverrides = {}) {
  const scopes = {};
  const keys = Object.keys(scopeOverrides);

  scopes.global = createScopeConfig(scopeOverrides.global);

  for (const key of keys) {
    if (key === "global") {
      continue;
    }

    scopes[key] = createScopeConfig(scopeOverrides[key]);
  }

  return {
    scopes
  };
}

const BUILTIN_PRESETS = [
  {
    id: "balanced-system",
    name: "Balanced",
    description: "Landing + product balance",
    grid: createGridState()
  },
  {
    id: "product-dense",
    name: "Product",
    description: "More density, tighter spacing",
    grid: createGridState({
      global: {
        mobile: {
          columns: 4,
          rows: 8,
          gap: 12,
          padding: 14,
          maxWidth: 420,
          rowHeight: 8
        },
        tablet: {
          columns: 8,
          rows: 10,
          gap: 16,
          padding: 18,
          maxWidth: 1040,
          rowHeight: 8
        },
        desktop: {
          columns: 12,
          rows: 12,
          gap: 16,
          padding: 20,
          maxWidth: 1320,
          rowHeight: 8
        }
      }
    })
  },
  {
    id: "editorial-wide",
    name: "Editorial",
    description: "More air and wider gutters",
    grid: createGridState({
      global: {
        mobile: {
          columns: 4,
          rows: 6,
          gap: 18,
          padding: 18,
          maxWidth: 440,
          rowHeight: 10
        },
        tablet: {
          columns: 8,
          rows: 8,
          gap: 24,
          padding: 28,
          maxWidth: 1120,
          rowHeight: 10
        },
        desktop: {
          columns: 12,
          rows: 10,
          gap: 28,
          padding: 32,
          maxWidth: 1520,
          rowHeight: 10
        }
      }
    })
  }
];

function createDefaultToolState() {
  return {
    panelOpen: false,
    overlayVisible: true,
    selectedScope: "global",
    selectedBreakpoint: "desktop",
    toggles: {
      bounds: true,
      columns: true,
      rows: false,
      gutters: true,
      spacing: false,
      safeArea: false
    },
    grid: createGridState(),
    customPresets: []
  };
}

function toScopeId(value, fallback = "scope") {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || fallback;
}

function startCase(value) {
  return String(value || "")
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function getViewportBreakpoint(width) {
  if (width <= BREAKPOINTS[0].maxWidth) {
    return "mobile";
  }

  if (width <= BREAKPOINTS[1].maxWidth) {
    return "tablet";
  }

  return "desktop";
}

function getDefaultScopes() {
  return [
    {
      id: "global",
      label: "Global Canvas",
      element: null
    }
  ];
}

function detectScopes() {
  if (typeof document === "undefined") {
    return getDefaultScopes();
  }

  const scopes = getDefaultScopes();
  const seen = new Set(["global"]);
  const elements = document.querySelectorAll("[data-pragt-grid]");

  elements.forEach((element, index) => {
    const rawId = element.getAttribute("data-pragt-grid");
    const id = toScopeId(rawId, `scope-${index + 1}`);

    if (seen.has(id)) {
      return;
    }

    seen.add(id);
    scopes.push({
      id,
      label: element.getAttribute("data-pragt-grid-label") || startCase(id),
      element
    });
  });

  return scopes;
}

function mergeDetectedScopes(grid, scopes) {
  let changed = false;
  const nextGrid = cloneValue(grid);

  for (const scope of scopes) {
    if (nextGrid.scopes[scope.id]) {
      continue;
    }

    changed = true;
    nextGrid.scopes[scope.id] = createScopeConfig(nextGrid.scopes.global);
  }

  return changed ? nextGrid : grid;
}

function resolveScopeConfig(grid, scopeId, breakpoint) {
  const scopeConfig = grid.scopes[scopeId] || grid.scopes.global;

  return scopeConfig[breakpoint] || grid.scopes.global[breakpoint];
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
}

function setNumericConfig(toolState, scopeId, breakpoint, key, nextValue) {
  const field = FIELD_DEFINITIONS.find((item) => item.key === key);

  if (!field) {
    return toolState;
  }

  const grid = cloneValue(toolState.grid);
  const scopeConfig = grid.scopes[scopeId] || createScopeConfig(grid.scopes.global);

  if (!grid.scopes[scopeId]) {
    grid.scopes[scopeId] = scopeConfig;
  }

  scopeConfig[breakpoint][key] = clamp(Math.round(nextValue), field.min, field.max);

  return {
    ...toolState,
    grid
  };
}

function resetScopeBreakpoint(toolState, scopeId, breakpoint) {
  const grid = cloneValue(toolState.grid);

  if (scopeId === "global") {
    grid.scopes.global[breakpoint] = createScopeConfig()[breakpoint];
  } else {
    grid.scopes[scopeId] = grid.scopes[scopeId] || createScopeConfig(grid.scopes.global);
    grid.scopes[scopeId][breakpoint] = cloneValue(grid.scopes.global[breakpoint]);
  }

  return {
    ...toolState,
    grid
  };
}

function readStoredState() {
  if (typeof window === "undefined") {
    return createDefaultToolState();
  }

  const fallback = createDefaultToolState();

  try {
    const raw = window.localStorage.getItem(GRID_TOOL_STORAGE_KEY);

    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw);
    const safeGrid =
      parsed.grid && parsed.grid.scopes && parsed.grid.scopes.global
        ? parsed.grid
        : fallback.grid;

    return {
      ...fallback,
      ...parsed,
      toggles: {
        ...fallback.toggles,
        ...(parsed.toggles || {})
      },
      grid: mergeDetectedScopes(safeGrid, [{ id: "global" }]),
      customPresets: Array.isArray(parsed.customPresets) ? parsed.customPresets : []
    };
  } catch {
    return fallback;
  }
}

function applyVarsToElement(element, prefix, config) {
  element.style.setProperty(`${prefix}columns`, String(config.columns));
  element.style.setProperty(`${prefix}rows`, String(config.rows));
  element.style.setProperty(`${prefix}gap`, `${config.gap}px`);
  element.style.setProperty(`${prefix}padding`, `${config.padding}px`);
  element.style.setProperty(`${prefix}max-width`, `${config.maxWidth}px`);
  element.style.setProperty(`${prefix}row-height`, `${config.rowHeight}px`);
}

function buildCssSnippet(scopeId, grid) {
  const scopeConfig = grid.scopes[scopeId] || grid.scopes.global;
  const cssVarPrefix = scopeId === "global" ? "--pragt-grid-" : `--pragt-grid-${scopeId}-`;
  const selector =
    scopeId === "global" ? ":root" : `[data-pragt-grid="${scopeId}"]`;

  const desktop = scopeConfig.desktop;
  const tablet = scopeConfig.tablet;
  const mobile = scopeConfig.mobile;

  return `${selector} {
  ${cssVarPrefix}columns: ${desktop.columns};
  ${cssVarPrefix}rows: ${desktop.rows};
  ${cssVarPrefix}gap: ${desktop.gap}px;
  ${cssVarPrefix}padding: ${desktop.padding}px;
  ${cssVarPrefix}max-width: ${desktop.maxWidth}px;
  ${cssVarPrefix}row-height: ${desktop.rowHeight}px;
}

@media (max-width: ${BREAKPOINTS[1].maxWidth}px) {
  ${selector} {
    ${cssVarPrefix}columns: ${tablet.columns};
    ${cssVarPrefix}rows: ${tablet.rows};
    ${cssVarPrefix}gap: ${tablet.gap}px;
    ${cssVarPrefix}padding: ${tablet.padding}px;
    ${cssVarPrefix}max-width: ${tablet.maxWidth}px;
    ${cssVarPrefix}row-height: ${tablet.rowHeight}px;
  }
}

@media (max-width: ${BREAKPOINTS[0].maxWidth}px) {
  ${selector} {
    ${cssVarPrefix}columns: ${mobile.columns};
    ${cssVarPrefix}rows: ${mobile.rows};
    ${cssVarPrefix}gap: ${mobile.gap}px;
    ${cssVarPrefix}padding: ${mobile.padding}px;
    ${cssVarPrefix}max-width: ${mobile.maxWidth}px;
    ${cssVarPrefix}row-height: ${mobile.rowHeight}px;
  }
}`;
}

function getOverlayRect(scope, config) {
  if (typeof window === "undefined") {
    return null;
  }

  if (!scope || scope.id === "global" || !scope.element) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const width = Math.min(config.maxWidth, Math.max(0, viewportWidth - config.padding * 2));
    const left = Math.max(config.padding, (viewportWidth - width) / 2);

    return {
      top: 0,
      left,
      width,
      height: viewportHeight,
      outerTop: 0,
      outerLeft: 0,
      outerWidth: viewportWidth,
      outerHeight: viewportHeight
    };
  }

  const rect = scope.element.getBoundingClientRect();
  const width = Math.min(config.maxWidth, rect.width);
  const inset = Math.max(0, (rect.width - width) / 2);

  return {
    top: rect.top,
    left: rect.left + inset,
    width,
    height: rect.height,
    outerTop: rect.top,
    outerLeft: rect.left,
    outerWidth: rect.width,
    outerHeight: rect.height
  };
}

export default function PragtGridTool() {
  const [toolState, setToolState] = useState(createDefaultToolState);
  const [detectedScopes, setDetectedScopes] = useState(getDefaultScopes);
  const [viewportWidth, setViewportWidth] = useState(1440);
  const [overlayTick, setOverlayTick] = useState(0);
  const [hasMounted, setHasMounted] = useState(false);
  const hasLoadedStateRef = useRef(false);
  const rafRef = useRef(0);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return undefined;
    }

    const stored = readStoredState();
    setToolState((prev) => ({
      ...prev,
      ...stored,
      selectedBreakpoint:
        stored.selectedBreakpoint || getViewportBreakpoint(window.innerWidth || 1440)
    }));
    hasLoadedStateRef.current = true;

    return undefined;
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development" || !hasLoadedStateRef.current) {
      return undefined;
    }

    window.localStorage.setItem(GRID_TOOL_STORAGE_KEY, JSON.stringify(toolState));

    return undefined;
  }, [toolState]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return undefined;
    }

    const syncScopes = () => {
      const scopes = detectScopes();
      setDetectedScopes(scopes);
      setToolState((prev) => {
        const nextGrid = mergeDetectedScopes(prev.grid, scopes);
        const selectedScopeExists = scopes.some((scope) => scope.id === prev.selectedScope);

        if (nextGrid === prev.grid && selectedScopeExists) {
          return prev;
        }

        return {
          ...prev,
          selectedScope: selectedScopeExists ? prev.selectedScope : "global",
          grid: nextGrid
        };
      });
    };

    syncScopes();

    const observer = new MutationObserver(syncScopes);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-pragt-grid", "data-pragt-grid-label"]
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return undefined;
    }

    const updateViewport = () => {
      setViewportWidth(window.innerWidth);
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);

    return () => {
      window.removeEventListener("resize", updateViewport);
    };
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return undefined;
    }

    const scheduleOverlayUpdate = () => {
      if (rafRef.current) {
        return;
      }

      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = 0;
        setOverlayTick((value) => value + 1);
        setViewportWidth(window.innerWidth);
      });
    };

    window.addEventListener("resize", scheduleOverlayUpdate);
    window.addEventListener("scroll", scheduleOverlayUpdate, true);

    return () => {
      window.removeEventListener("resize", scheduleOverlayUpdate);
      window.removeEventListener("scroll", scheduleOverlayUpdate, true);

      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.defaultPrevented || !event.shiftKey || event.key.toLowerCase() !== "g") {
        return;
      }

      const target = event.target;

      if (target instanceof HTMLElement) {
        const tagName = String(target.tagName || "").toLowerCase();

        if (tagName === "input" || tagName === "textarea" || target.isContentEditable) {
          return;
        }
      }

      event.preventDefault();
      setToolState((prev) => ({
        ...prev,
        panelOpen: !prev.panelOpen
      }));
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return undefined;
    }

    const root = document.documentElement;
    const currentBreakpoint = getViewportBreakpoint(viewportWidth);
    const globalConfig = resolveScopeConfig(toolState.grid, "global", currentBreakpoint);

    applyVarsToElement(root, "--pragt-grid-", globalConfig);

    for (const scope of detectedScopes) {
      if (scope.id === "global" || !scope.element) {
        continue;
      }

      const config = resolveScopeConfig(toolState.grid, scope.id, currentBreakpoint);
      const prefix = `--pragt-grid-${scope.id}-`;

      applyVarsToElement(scope.element, "--pragt-scope-", config);
      applyVarsToElement(scope.element, prefix, config);
    }

    return undefined;
  }, [detectedScopes, toolState.grid, viewportWidth]);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const currentViewportBreakpoint = getViewportBreakpoint(viewportWidth);
  const currentScope =
    detectedScopes.find((scope) => scope.id === toolState.selectedScope) || detectedScopes[0];
  const currentEditConfig = resolveScopeConfig(
    toolState.grid,
    currentScope.id,
    toolState.selectedBreakpoint
  );
  const currentOverlayConfig = resolveScopeConfig(
    toolState.grid,
    currentScope.id,
    currentViewportBreakpoint
  );
  const overlayRect = hasMounted ? getOverlayRect(currentScope, currentOverlayConfig) : null;

  async function handleCopyCss() {
    const snippet = buildCssSnippet(currentScope.id, toolState.grid);

    try {
      await navigator.clipboard.writeText(snippet);
    } catch {
      window.prompt("Copie o snippet abaixo.", snippet);
    }
  }

  function handleSavePreset() {
    const name = window.prompt("Nome do preset");

    if (!name) {
      return;
    }

    setToolState((prev) => {
      const id = `${toScopeId(name, "preset")}-${Date.now()}`;

      return {
        ...prev,
        customPresets: [
          {
            id,
            name: name.trim(),
            grid: cloneValue(prev.grid)
          },
          ...prev.customPresets
        ]
      };
    });
  }

  return (
    <>
      {toolState.overlayVisible && overlayRect ? (
        <div
          aria-hidden="true"
          className="pragt-grid-overlay"
          data-overlay-tick={overlayTick}
          style={{ zIndex: MAX_Z_INDEX - 1 }}
        >
          <div
            className="pragt-grid-overlay-target"
            style={{
              top: `${overlayRect.outerTop}px`,
              left: `${overlayRect.outerLeft}px`,
              width: `${overlayRect.outerWidth}px`,
              height: `${overlayRect.outerHeight}px`
            }}
          />
          <div
            className="pragt-grid-overlay-frame"
            style={{
              top: `${overlayRect.top}px`,
              left: `${overlayRect.left}px`,
              width: `${overlayRect.width}px`,
              height: `${overlayRect.height}px`
            }}
          >
            {toolState.toggles.bounds ? (
              <div className="pragt-grid-overlay-bounds">
                <span className="pragt-grid-overlay-label">
                  {currentScope.label} · {currentViewportBreakpoint}
                </span>
              </div>
            ) : null}

            {toolState.toggles.spacing ? (
              <div
                className="pragt-grid-overlay-baseline"
                style={{
                  backgroundSize: `100% ${currentOverlayConfig.rowHeight}px`
                }}
              />
            ) : null}

            {toolState.toggles.rows ? (
              <div
                className="pragt-grid-overlay-rows"
                style={{
                  gridTemplateRows: `repeat(${currentOverlayConfig.rows}, minmax(0, 1fr))`
                }}
              >
                {Array.from({ length: currentOverlayConfig.rows }).map((_, index) => (
                  <span key={`row-${index}`} className="pragt-grid-overlay-row" />
                ))}
              </div>
            ) : null}

            {toolState.toggles.columns ? (
              <div
                className={`pragt-grid-overlay-columns${
                  toolState.toggles.gutters ? "" : " is-flat"
                }`}
                style={{
                  gridTemplateColumns: `repeat(${currentOverlayConfig.columns}, minmax(0, 1fr))`,
                  gap: `${toolState.toggles.gutters ? currentOverlayConfig.gap : 0}px`
                }}
              >
                {Array.from({ length: currentOverlayConfig.columns }).map((_, index) => (
                  <span key={`column-${index}`} className="pragt-grid-overlay-column" />
                ))}
              </div>
            ) : null}

            {toolState.toggles.safeArea ? (
              <div className="pragt-grid-overlay-safe-area" />
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="pragt-grid-tool">
        {toolState.panelOpen ? (
          <section className="pragt-grid-panel">
            <header className="pragt-grid-panel-header">
              <div>
                <p className="pragt-grid-eyebrow">PRAGT CSS</p>
                <h2>Grid System Tool</h2>
                <p className="pragt-grid-hint">
                  Shift + G abre/fecha. O viewport ativo agora e&#39;{" "}
                  <strong>{currentViewportBreakpoint}</strong>.
                </p>
              </div>

              <div className="pragt-grid-panel-actions">
                <button
                  type="button"
                  className={`pragt-grid-chip${toolState.overlayVisible ? " is-active" : ""}`}
                  onClick={() =>
                    setToolState((prev) => ({
                      ...prev,
                      overlayVisible: !prev.overlayVisible
                    }))
                  }
                >
                  Overlay
                </button>
                <button
                  type="button"
                  className="pragt-grid-close"
                  onClick={() =>
                    setToolState((prev) => ({
                      ...prev,
                      panelOpen: false
                    }))
                  }
                >
                  ×
                </button>
              </div>
            </header>

            <section className="pragt-grid-block">
              <p className="pragt-grid-block-label">Scopes</p>
              <div className="pragt-grid-chip-row">
                {detectedScopes.map((scope) => (
                  <button
                    key={scope.id}
                    type="button"
                    className={`pragt-grid-chip${
                      toolState.selectedScope === scope.id ? " is-active" : ""
                    }`}
                    onClick={() =>
                      setToolState((prev) => ({
                        ...prev,
                        selectedScope: scope.id
                      }))
                    }
                  >
                    {scope.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="pragt-grid-block">
              <p className="pragt-grid-block-label">Breakpoints</p>
              <div className="pragt-grid-chip-row">
                {BREAKPOINTS.map((breakpoint) => (
                  <button
                    key={breakpoint.id}
                    type="button"
                    className={`pragt-grid-chip${
                      toolState.selectedBreakpoint === breakpoint.id ? " is-active" : ""
                    }`}
                    onClick={() =>
                      setToolState((prev) => ({
                        ...prev,
                        selectedBreakpoint: breakpoint.id
                      }))
                    }
                  >
                    {breakpoint.label}
                    {currentViewportBreakpoint === breakpoint.id ? " • live" : ""}
                  </button>
                ))}
              </div>
            </section>

            <section className="pragt-grid-block">
              <p className="pragt-grid-block-label">Presets</p>
              <div className="pragt-grid-preset-list">
                {BUILTIN_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className="pragt-grid-preset"
                    onClick={() =>
                      setToolState((prev) => ({
                        ...prev,
                        grid: cloneValue(preset.grid)
                      }))
                    }
                  >
                    <strong>{preset.name}</strong>
                    <span>{preset.description}</span>
                  </button>
                ))}
              </div>
              <div className="pragt-grid-inline-actions">
                <button type="button" className="pragt-grid-action" onClick={handleSavePreset}>
                  Save current preset
                </button>
              </div>
              {toolState.customPresets.length ? (
                <div className="pragt-grid-custom-presets">
                  {toolState.customPresets.map((preset) => (
                    <div key={preset.id} className="pragt-grid-custom-preset">
                      <button
                        type="button"
                        className="pragt-grid-chip"
                        onClick={() =>
                          setToolState((prev) => ({
                            ...prev,
                            grid: cloneValue(preset.grid)
                          }))
                        }
                      >
                        {preset.name}
                      </button>
                      <button
                        type="button"
                        className="pragt-grid-close pragt-grid-close--small"
                        onClick={() =>
                          setToolState((prev) => ({
                            ...prev,
                            customPresets: prev.customPresets.filter(
                              (item) => item.id !== preset.id
                            )
                          }))
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="pragt-grid-block">
              <p className="pragt-grid-block-label">Guides</p>
              <div className="pragt-grid-chip-row">
                {GUIDE_TOGGLES.map((toggle) => (
                  <button
                    key={toggle.id}
                    type="button"
                    className={`pragt-grid-chip${
                      toolState.toggles[toggle.id] ? " is-active" : ""
                    }`}
                    onClick={() =>
                      setToolState((prev) => ({
                        ...prev,
                        toggles: {
                          ...prev.toggles,
                          [toggle.id]: !prev.toggles[toggle.id]
                        }
                      }))
                    }
                  >
                    {toggle.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="pragt-grid-block">
              <p className="pragt-grid-block-label">Controls</p>
              <div className="pragt-grid-field-grid">
                {FIELD_DEFINITIONS.map((field) => (
                  <label key={field.key} className="pragt-grid-field">
                    <span>{field.label}</span>
                    <input
                      type="number"
                      min={field.min}
                      max={field.max}
                      value={currentEditConfig[field.key]}
                      onChange={(event) =>
                        setToolState((prev) =>
                          setNumericConfig(
                            prev,
                            currentScope.id,
                            toolState.selectedBreakpoint,
                            field.key,
                            Number(event.target.value)
                          )
                        )
                      }
                    />
                  </label>
                ))}
              </div>
            </section>

            <section className="pragt-grid-inline-actions">
              <button
                type="button"
                className="pragt-grid-action"
                onClick={() =>
                  setToolState((prev) =>
                    resetScopeBreakpoint(prev, currentScope.id, toolState.selectedBreakpoint)
                  )
                }
              >
                Reset scope
              </button>
              <button type="button" className="pragt-grid-action" onClick={handleCopyCss}>
                Copy CSS vars
              </button>
            </section>
          </section>
        ) : (
          <button
            type="button"
            className="pragt-grid-launcher"
            onClick={() =>
              setToolState((prev) => ({
                ...prev,
                panelOpen: true
              }))
            }
          >
            Grid Tool
          </button>
        )}
      </div>
    </>
  );
}
