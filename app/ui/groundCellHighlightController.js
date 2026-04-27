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

  svg.append(halo, outline);
  layer.append(svg);
  mount.append(layer);

  const state = {
    active: false,
    elevation: 0.06,
    groundCell: null
  };

  function hide() {
    state.active = false;
    state.groundCell = null;
    layer.hidden = true;
  }

  function show({ groundCell, elevation = 0.06 } = {}) {
    if (!groundCell) {
      hide();
      return;
    }

    state.active = true;
    state.groundCell = groundCell;
    state.elevation = elevation;
    layer.hidden = false;
  }

  function setGroundCell(groundCell) {
    if (!groundCell) {
      hide();
      return;
    }

    state.groundCell = groundCell;
  }

  function update(camera, viewportWidth, viewportHeight) {
    if (!state.active || !state.groundCell) {
      return;
    }

    const halfSpan = (state.groundCell.tileSpan || 0) * 0.5;
    const [centerX,, centerZ] = state.groundCell.offset;
    const surfaceY = (state.groundCell.surfaceY || 0) + state.elevation;
    const corners = [
      [centerX - halfSpan, surfaceY, centerZ - halfSpan],
      [centerX + halfSpan, surfaceY, centerZ - halfSpan],
      [centerX + halfSpan, surfaceY, centerZ + halfSpan],
      [centerX - halfSpan, surfaceY, centerZ + halfSpan]
    ];
    const projectedCorners = corners.map((corner) => {
      return camera.project(corner, viewportWidth, viewportHeight);
    });

    const allClipped = projectedCorners.every((point) => point.depth > 1);
    if (allClipped) {
      layer.hidden = true;
      return;
    }

    layer.hidden = false;
    svg.setAttribute("viewBox", `0 0 ${viewportWidth} ${viewportHeight}`);

    const points = projectedCorners.map((point) => {
      return `${point.x.toFixed(2)},${point.y.toFixed(2)}`;
    }).join(" ");

    halo.setAttribute("points", points);
    outline.setAttribute("points", points);
  }

  return {
    hide,
    isVisible() {
      return state.active;
    },
    setGroundCell,
    show,
    update
  };
}
