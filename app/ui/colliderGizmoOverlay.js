const SVG_NS = "http://www.w3.org/2000/svg";

function createSvgElement(tagName) {
  return document.createElementNS(SVG_NS, tagName);
}

function createColliderMarker() {
  const group = createSvgElement("g");
  const halo = createSvgElement("polygon");
  const outline = createSvgElement("polygon");
  const label = createSvgElement("text");

  halo.setAttribute("class", "collider-gizmo-overlay__halo");
  outline.setAttribute("class", "collider-gizmo-overlay__outline");
  label.setAttribute("class", "collider-gizmo-overlay__label");
  label.textContent = "COLLIDER";

  group.append(halo, outline, label);

  return {
    group,
    halo,
    outline,
    label
  };
}

function getColliderTopCorners(collider) {
  const position = collider?.position || [0, 0, 0];
  const size = collider?.size || [1, 1, 1];
  const halfX = Math.max(0.05, size[0] * 0.5);
  const halfZ = Math.max(0.05, size[2] * 0.5);
  const surfaceY = Number.isFinite(collider?.surfaceY)
    ? collider.surfaceY
    : position[1] + size[1] * 0.5;

  return [
    [position[0] - halfX, surfaceY + 0.04, position[2] - halfZ],
    [position[0] + halfX, surfaceY + 0.04, position[2] - halfZ],
    [position[0] + halfX, surfaceY + 0.04, position[2] + halfZ],
    [position[0] - halfX, surfaceY + 0.04, position[2] + halfZ]
  ];
}

function getCentroid(points) {
  return points.reduce(
    (sum, point) => {
      sum.x += point.x;
      sum.y += point.y;
      return sum;
    },
    { x: 0, y: 0 }
  );
}

export function createColliderGizmoOverlay({ mount } = {}) {
  if (!(mount instanceof HTMLElement)) {
    throw new Error("Collider gizmo overlay requires a valid mount element.");
  }

  const layer = document.createElement("div");
  layer.className = "collider-gizmo-overlay";
  layer.hidden = true;

  const banner = document.createElement("div");
  banner.className = "collider-gizmo-overlay__banner";
  banner.textContent = "COLLIDER GIZMOS OFF";

  const svg = createSvgElement("svg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.setAttribute("preserveAspectRatio", "none");

  layer.append(svg, banner);
  mount.append(layer);

  const markerPool = [];
  const state = {
    active: false,
    colliders: []
  };

  function ensureMarker(index) {
    if (!markerPool[index]) {
      markerPool[index] = createColliderMarker();
      svg.append(markerPool[index].group);
    }

    return markerPool[index];
  }

  function hideUnusedMarkers(startIndex) {
    for (let index = startIndex; index < markerPool.length; index += 1) {
      markerPool[index].group.setAttribute("display", "none");
    }
  }

  function hide() {
    state.active = false;
    state.colliders = [];
    layer.hidden = true;
    hideUnusedMarkers(0);
  }

  function show({ colliders = [] } = {}) {
    state.active = true;
    state.colliders = Array.isArray(colliders) ? colliders : [];
    layer.hidden = false;
    banner.textContent = `COLLIDER GIZMOS ON: ${state.colliders.length}`;
  }

  function update(camera, viewportWidth, viewportHeight) {
    if (!state.active) {
      return;
    }

    layer.hidden = false;
    svg.setAttribute("viewBox", `0 0 ${viewportWidth} ${viewportHeight}`);

    let visibleCount = 0;

    state.colliders.forEach((collider, index) => {
      const marker = ensureMarker(index);
      const projectedCorners = getColliderTopCorners(collider).map((corner) => {
        return camera.project(corner, viewportWidth, viewportHeight);
      });

      if (projectedCorners.every((point) => point.depth > 1)) {
        marker.group.setAttribute("display", "none");
        return;
      }

      const points = projectedCorners
        .map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
        .join(" ");
      const centroid = getCentroid(projectedCorners);
      const labelX = centroid.x / projectedCorners.length;
      const labelY = centroid.y / projectedCorners.length;

      marker.halo.setAttribute("points", points);
      marker.outline.setAttribute("points", points);
      marker.label.setAttribute("x", labelX.toFixed(2));
      marker.label.setAttribute("y", labelY.toFixed(2));
      marker.label.textContent = collider?.id || "COLLIDER";
      marker.group.removeAttribute("display");
      visibleCount += 1;
    });

    hideUnusedMarkers(state.colliders.length);
    banner.textContent = `COLLIDER GIZMOS ON: ${visibleCount}/${state.colliders.length}`;
  }

  return {
    hide,
    isVisible() {
      return state.active;
    },
    show,
    update
  };
}
