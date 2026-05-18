const SVG_NS = "http://www.w3.org/2000/svg";
const GROUND_CELL_TARGET_CUES = Object.freeze({
  valid: {
    haloFill: "rgba(127, 231, 255, 0.12)",
    haloStroke: "rgba(12, 20, 34, 0.92)",
    outlineFill: "rgba(124, 231, 255, 0.08)",
    outlineStroke: "#9ef8ff",
    outlineDasharray: ""
  },
  leafage: {
    haloFill: "rgba(91, 238, 132, 0.13)",
    haloStroke: "rgba(8, 40, 20, 0.92)",
    outlineFill: "rgba(91, 238, 132, 0.09)",
    outlineStroke: "#7effa5",
    outlineDasharray: "2 5"
  },
  fire: {
    haloFill: "rgba(255, 88, 54, 0.16)",
    haloStroke: "rgba(60, 8, 0, 0.94)",
    outlineFill: "rgba(255, 88, 54, 0.1)",
    outlineStroke: "#ff5a36",
    outlineDasharray: "4 3"
  },
  invalid: {
    haloFill: "rgba(255, 211, 122, 0.18)",
    haloStroke: "rgba(84, 48, 0, 0.94)",
    outlineFill: "rgba(255, 211, 122, 0.12)",
    outlineStroke: "#ffd37a",
    outlineDasharray: "8 5"
  },
  powerRadius: {
    haloFill: "rgba(91, 183, 255, 0.1)",
    haloStroke: "rgba(7, 27, 48, 0.72)",
    outlineFill: "rgba(91, 183, 255, 0.07)",
    outlineStroke: "#8edbff",
    outlineDasharray: "",
    markedFill: "rgba(91, 183, 255, 0.22)",
    markedStroke: "rgba(142, 219, 255, 0.34)",
    markedOutlineStroke: "rgba(198, 241, 255, 0.42)",
    markedFillOpacity: 0.42,
    markedOutlineOpacity: 0.4
  }
});
const GROUND_CELL_POLYGON_PROTOTYPES = Object.freeze({
  halo: Object.freeze({
    "stroke-width": "6",
    "stroke-linejoin": "round",
    "stroke-linecap": "round"
  }),
  outline: Object.freeze({
    "stroke-width": "3",
    "stroke-linejoin": "round",
    "stroke-linecap": "round",
    "vector-effect": "non-scaling-stroke"
  }),
  markedFill: Object.freeze({
    fill: "#ffd447",
    stroke: "rgba(80, 52, 0, 0.78)",
    "stroke-width": "5",
    "stroke-linejoin": "round",
    "vector-effect": "non-scaling-stroke"
  }),
  markedOutline: Object.freeze({
    fill: "none",
    stroke: "#fff0a1",
    "stroke-width": "2",
    "stroke-linejoin": "round",
    "vector-effect": "non-scaling-stroke"
  })
});

function createSvgElement(tagName) {
  return document.createElementNS(SVG_NS, tagName);
}

function applySvgAttributes(element, attributes) {
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
}

function createSvgElementFromPrototype(tagName, attributes) {
  const element = createSvgElement(tagName);
  applySvgAttributes(element, attributes);
  return element;
}

function normalizeTargetState(targetState) {
  if (GROUND_CELL_TARGET_CUES[targetState]) {
    return targetState;
  }

  return targetState === "invalid" ? "invalid" : "valid";
}

function getGroundCellCueKey(groundCell, targetState) {
  if (groundCell?.highlightAbilityId === "leafage") {
    return "leafage";
  }

  if (groundCell?.highlightAbilityId === "fire") {
    return "fire";
  }

  if (GROUND_CELL_TARGET_CUES[groundCell?.highlightTargetState]) {
    return groundCell.highlightTargetState;
  }

  return normalizeTargetState(targetState);
}

export function createGroundCellHighlightController({ mount } = {}) {
  if (!(mount instanceof HTMLElement)) {
    throw new Error("Ground cell highlight controller requires a valid mount element.");
  }

  const layer = document.createElement("div");
  layer.dataset.groundCellHighlightLayer = "true";
  layer.hidden = true;
  Object.assign(layer.style, {
    position: "absolute",
    inset: "0",
    overflow: "hidden",
    pointerEvents: "none",
    zIndex: "17"
  });

  const svg = createSvgElement("svg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.setAttribute("preserveAspectRatio", "none");

  const markedGroup = createSvgElement("g");

  const halo = createSvgElementFromPrototype("polygon", GROUND_CELL_POLYGON_PROTOTYPES.halo);
  const outline = createSvgElementFromPrototype("polygon", GROUND_CELL_POLYGON_PROTOTYPES.outline);

  svg.append(markedGroup, halo, outline);
  layer.append(svg);
  mount.append(layer);

  const state = {
    active: false,
    elevation: 0.06,
    groundCell: null,
    markedGroundCells: [],
    pulsePhase: 0,
    targetState: "valid"
  };
  const markedPolygonPairs = [];

  function applyTargetCue(targetState) {
    const normalizedTargetState = GROUND_CELL_TARGET_CUES[targetState] ?
      targetState :
      normalizeTargetState(targetState);
    const cue = GROUND_CELL_TARGET_CUES[normalizedTargetState];

    layer.dataset.groundCellTargetState = normalizedTargetState;
    halo.setAttribute("fill", cue.haloFill);
    halo.setAttribute("stroke", cue.haloStroke);
    outline.setAttribute("fill", cue.outlineFill);
    outline.setAttribute("stroke", cue.outlineStroke);
    if (cue.outlineDasharray) {
      outline.setAttribute("stroke-dasharray", cue.outlineDasharray);
    } else {
      outline.removeAttribute("stroke-dasharray");
    }
  }

  applyTargetCue(state.targetState);

  function hide() {
    state.active = false;
    state.groundCell = null;
    state.markedGroundCells = [];
    delete layer.dataset.groundCellTargetState;
    layer.hidden = true;
  }

  function setHighlightState({
    groundCell = null,
    markedGroundCells = [],
    elevation = 0.06,
    pulsePhase = 0,
    targetState = "valid"
  } = {}) {
    const filteredMarkedGroundCells = (markedGroundCells || []).filter(Boolean);

    if (!groundCell && !filteredMarkedGroundCells.length) {
      hide();
      return;
    }

    state.active = true;
    state.groundCell = groundCell;
    state.markedGroundCells = filteredMarkedGroundCells;
    state.elevation = elevation;
    state.pulsePhase = pulsePhase;
    const cueSource = groundCell || filteredMarkedGroundCells[0] || null;
    state.targetState = getGroundCellCueKey(
      cueSource,
      cueSource?.highlightTargetState || targetState
    );
    applyTargetCue(state.targetState);
    layer.hidden = false;
  }

  function show({
    groundCell = null,
    markedGroundCells = [],
    elevation = 0.06,
    pulsePhase = 0,
    targetState = "valid"
  } = {}) {
    setHighlightState({
      groundCell,
      markedGroundCells,
      elevation,
      pulsePhase,
      targetState
    });
  }

  function setGroundCell(groundCell) {
    if (!groundCell && !state.markedGroundCells.length) {
      hide();
      return;
    }

    state.groundCell = groundCell;
    state.targetState = getGroundCellCueKey(
      groundCell,
      groundCell?.highlightTargetState || state.targetState
    );
    applyTargetCue(state.targetState);
  }

  function getProjectedGroundCellPoints(camera, groundCell, viewportWidth, viewportHeight) {
    const halfSpan = (groundCell.tileSpan || 0) * 0.5;
    const [centerX,, centerZ] = groundCell.offset;
    const surfaceY = (groundCell.surfaceY || 0) + state.elevation;
    const corners = [
      [centerX - halfSpan, surfaceY, centerZ - halfSpan],
      [centerX + halfSpan, surfaceY, centerZ - halfSpan],
      [centerX + halfSpan, surfaceY, centerZ + halfSpan],
      [centerX - halfSpan, surfaceY, centerZ + halfSpan]
    ];
    const projectedCorners = corners.map((corner) => {
      return camera.project(corner, viewportWidth, viewportHeight);
    });

    return {
      clipped: projectedCorners.every((point) => point.depth > 1),
      points: projectedCorners.map((point) => {
        return `${point.x.toFixed(2)},${point.y.toFixed(2)}`;
      }).join(" ")
    };
  }

  function getMarkedPolygonPair(index) {
    let pair = markedPolygonPairs[index];

    if (!pair) {
      const fillPolygon = createSvgElementFromPrototype(
        "polygon",
        GROUND_CELL_POLYGON_PROTOTYPES.markedFill
      );
      const outlinePolygon = createSvgElementFromPrototype(
        "polygon",
        GROUND_CELL_POLYGON_PROTOTYPES.markedOutline
      );

      markedGroup.append(fillPolygon, outlinePolygon);
      pair = [fillPolygon, outlinePolygon];
      markedPolygonPairs[index] = pair;
    }

    return pair;
  }

  function hideUnusedMarkedPolygons(activeCount) {
    for (let index = activeCount; index < markedPolygonPairs.length; index += 1) {
      const [fillPolygon, outlinePolygon] = markedPolygonPairs[index];
      fillPolygon.setAttribute("display", "none");
      outlinePolygon.setAttribute("display", "none");
    }
  }

  function hidePrimaryGroundCell() {
    halo.setAttribute("display", "none");
    outline.setAttribute("display", "none");
  }

  function updatePrimaryGroundCell(camera, viewportWidth, viewportHeight) {
    if (!state.groundCell) {
      hidePrimaryGroundCell();
      return false;
    }

    const projectedGroundCell = getProjectedGroundCellPoints(
      camera,
      state.groundCell,
      viewportWidth,
      viewportHeight
    );

    if (projectedGroundCell.clipped) {
      hidePrimaryGroundCell();
      return false;
    }

    halo.removeAttribute("display");
    outline.removeAttribute("display");
    halo.setAttribute("points", projectedGroundCell.points);
    outline.setAttribute("points", projectedGroundCell.points);
    return true;
  }

  function applyMarkedGroundCellCue(fillPolygon, outlinePolygon, markedGroundCell, pulseOpacity) {
    const cueKey = getGroundCellCueKey(
      markedGroundCell,
      markedGroundCell.highlightTargetState || state.targetState
    );
    const cue = GROUND_CELL_TARGET_CUES[cueKey] || GROUND_CELL_TARGET_CUES.valid;
    const fillOpacity = Number.isFinite(cue.markedFillOpacity) ?
      cue.markedFillOpacity :
      pulseOpacity;
    const outlineOpacity = Number.isFinite(cue.markedOutlineOpacity) ?
      cue.markedOutlineOpacity :
      0.52 + state.pulsePhase * 0.38;

    fillPolygon.setAttribute("fill", cue.markedFill || cue.outlineFill);
    fillPolygon.setAttribute("stroke", cue.markedStroke || cue.outlineStroke);
    outlinePolygon.setAttribute("stroke", cue.markedOutlineStroke || cue.outlineStroke);
    fillPolygon.setAttribute("fill-opacity", fillOpacity.toFixed(3));
    outlinePolygon.setAttribute("stroke-opacity", outlineOpacity.toFixed(3));
    if (cue.outlineDasharray) {
      outlinePolygon.setAttribute("stroke-dasharray", cue.outlineDasharray);
    } else {
      outlinePolygon.removeAttribute("stroke-dasharray");
    }
  }

  function updateMarkedGroundCells(camera, viewportWidth, viewportHeight) {
    const pulseOpacity = 0.16 + state.pulsePhase * 0.22;
    let markedVisibleCount = 0;

    for (const markedGroundCell of state.markedGroundCells) {
      const projectedGroundCell = getProjectedGroundCellPoints(
        camera,
        markedGroundCell,
        viewportWidth,
        viewportHeight
      );

      if (projectedGroundCell.clipped) {
        continue;
      }

      const [fillPolygon, outlinePolygon] = getMarkedPolygonPair(markedVisibleCount);
      fillPolygon.removeAttribute("display");
      outlinePolygon.removeAttribute("display");
      fillPolygon.setAttribute("points", projectedGroundCell.points);
      outlinePolygon.setAttribute("points", projectedGroundCell.points);
      applyMarkedGroundCellCue(fillPolygon, outlinePolygon, markedGroundCell, pulseOpacity);
      markedVisibleCount += 1;
    }

    hideUnusedMarkedPolygons(markedVisibleCount);
    return markedVisibleCount;
  }

  function update(camera, viewportWidth, viewportHeight) {
    if (!state.active) {
      return;
    }

    svg.setAttribute("viewBox", `0 0 ${viewportWidth} ${viewportHeight}`);

    const hasVisibleGroundCell = updatePrimaryGroundCell(camera, viewportWidth, viewportHeight);
    const markedVisibleCount = updateMarkedGroundCells(camera, viewportWidth, viewportHeight);
    layer.hidden = !hasVisibleGroundCell && markedVisibleCount === 0;
  }

  return {
    hide,
    isVisible() {
      return state.active;
    },
    setGroundCell,
    setHighlightState,
    show,
    update
  };
}
