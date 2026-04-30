const SVG_NS = "http://www.w3.org/2000/svg";

function createSvgElement(tagName) {
  return document.createElementNS(SVG_NS, tagName);
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

  const halo = createSvgElement("polygon");
  halo.setAttribute("fill", "rgba(127, 231, 255, 0.12)");
  halo.setAttribute("stroke", "rgba(12, 20, 34, 0.92)");
  halo.setAttribute("stroke-width", "6");
  halo.setAttribute("stroke-linejoin", "round");

  const outline = createSvgElement("polygon");
  outline.setAttribute("fill", "rgba(124, 231, 255, 0.08)");
  outline.setAttribute("stroke", "#9ef8ff");
  outline.setAttribute("stroke-width", "3");
  outline.setAttribute("stroke-linejoin", "round");
  outline.setAttribute("vector-effect", "non-scaling-stroke");

  svg.append(markedGroup, halo, outline);
  layer.append(svg);
  mount.append(layer);

  const state = {
    active: false,
    elevation: 0.06,
    groundCell: null,
    markedGroundCells: [],
    pulsePhase: 0
  };

  function hide() {
    state.active = false;
    state.groundCell = null;
    state.markedGroundCells = [];
    layer.hidden = true;
  }

  function setHighlightState({
    groundCell = null,
    markedGroundCells = [],
    elevation = 0.06,
    pulsePhase = 0
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
    layer.hidden = false;
  }

  function show({ groundCell = null, markedGroundCells = [], elevation = 0.06, pulsePhase = 0 } = {}) {
    setHighlightState({
      groundCell,
      markedGroundCells,
      elevation,
      pulsePhase
    });
  }

  function setGroundCell(groundCell) {
    if (!groundCell && !state.markedGroundCells.length) {
      hide();
      return;
    }

    state.groundCell = groundCell;
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
    const pairIndex = index * 2;
    let fillPolygon = markedGroup.children[pairIndex];
    let outlinePolygon = markedGroup.children[pairIndex + 1];

    if (!fillPolygon || !outlinePolygon) {
      fillPolygon = createSvgElement("polygon");
      fillPolygon.setAttribute("fill", "#ffd447");
      fillPolygon.setAttribute("stroke", "rgba(80, 52, 0, 0.78)");
      fillPolygon.setAttribute("stroke-width", "5");
      fillPolygon.setAttribute("stroke-linejoin", "round");
      fillPolygon.setAttribute("vector-effect", "non-scaling-stroke");

      outlinePolygon = createSvgElement("polygon");
      outlinePolygon.setAttribute("fill", "none");
      outlinePolygon.setAttribute("stroke", "#fff0a1");
      outlinePolygon.setAttribute("stroke-width", "2");
      outlinePolygon.setAttribute("stroke-linejoin", "round");
      outlinePolygon.setAttribute("vector-effect", "non-scaling-stroke");

      markedGroup.append(fillPolygon, outlinePolygon);
    }

    return [fillPolygon, outlinePolygon];
  }

  function hideUnusedMarkedPolygons(activeCount) {
    for (let index = activeCount * 2; index < markedGroup.children.length; index += 1) {
      markedGroup.children[index].setAttribute("display", "none");
    }
  }

  function update(camera, viewportWidth, viewportHeight) {
    if (!state.active) {
      return;
    }

    let hasVisibleGroundCell = false;
    svg.setAttribute("viewBox", `0 0 ${viewportWidth} ${viewportHeight}`);

    if (state.groundCell) {
      const projectedGroundCell = getProjectedGroundCellPoints(
        camera,
        state.groundCell,
        viewportWidth,
        viewportHeight
      );

      if (!projectedGroundCell.clipped) {
        hasVisibleGroundCell = true;
        halo.removeAttribute("display");
        outline.removeAttribute("display");
        halo.setAttribute("points", projectedGroundCell.points);
        outline.setAttribute("points", projectedGroundCell.points);
      } else {
        halo.setAttribute("display", "none");
        outline.setAttribute("display", "none");
      }
    } else {
      halo.setAttribute("display", "none");
      outline.setAttribute("display", "none");
    }

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
      fillPolygon.setAttribute("fill-opacity", pulseOpacity.toFixed(3));
      outlinePolygon.setAttribute("stroke-opacity", (0.52 + state.pulsePhase * 0.38).toFixed(3));
      markedVisibleCount += 1;
    }

    hideUnusedMarkedPolygons(markedVisibleCount);
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
