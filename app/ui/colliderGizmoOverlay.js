const SVG_NS = "http://www.w3.org/2000/svg";
const COLLIDER_GIZMO_SCREEN_MARGIN = 72;
const MAX_RENDERED_COLLIDER_GIZMOS = 320;
const MAX_COLLIDER_GIZMO_LABELS = 40;

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

function getAveragePoint(points) {
  const centroid = getCentroid(points);
  return {
    x: centroid.x / points.length,
    y: centroid.y / points.length
  };
}

function isProjectedPolygonOffscreen(points, viewportWidth, viewportHeight) {
  const margin = COLLIDER_GIZMO_SCREEN_MARGIN;
  return (
    points.every((point) => point.x < -margin) ||
    points.every((point) => point.x > viewportWidth + margin) ||
    points.every((point) => point.y < -margin) ||
    points.every((point) => point.y > viewportHeight + margin)
  );
}

function getScreenPriority(points, viewportWidth, viewportHeight) {
  const center = getAveragePoint(points);
  const dx = center.x - viewportWidth * 0.5;
  const dy = center.y - viewportHeight * 0.5;
  return dx * dx + dy * dy;
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

    const visibleEntries = [];

    state.colliders.forEach((collider, index) => {
      const projectedCorners = getColliderTopCorners(collider).map((corner) => {
        return camera.project(corner, viewportWidth, viewportHeight);
      });

      if (
        projectedCorners.every((point) => point.depth > 1) ||
        isProjectedPolygonOffscreen(projectedCorners, viewportWidth, viewportHeight)
      ) {
        return;
      }

      visibleEntries.push({
        collider,
        index,
        projectedCorners,
        priority: getScreenPriority(projectedCorners, viewportWidth, viewportHeight)
      });
    });

    visibleEntries.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.index - b.index;
    });

    const renderedEntries = visibleEntries.slice(0, MAX_RENDERED_COLLIDER_GIZMOS);

    renderedEntries.forEach(({ collider, projectedCorners }, renderIndex) => {
      const marker = ensureMarker(renderIndex);

      const points = projectedCorners
        .map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
        .join(" ");
      const { x: labelX, y: labelY } = getAveragePoint(projectedCorners);

      marker.halo.setAttribute("points", points);
      marker.outline.setAttribute("points", points);
      if (renderIndex < MAX_COLLIDER_GIZMO_LABELS) {
        marker.label.setAttribute("x", labelX.toFixed(2));
        marker.label.setAttribute("y", labelY.toFixed(2));
        marker.label.textContent = collider?.id || "COLLIDER";
        marker.label.removeAttribute("display");
      } else {
        marker.label.setAttribute("display", "none");
      }
      marker.group.removeAttribute("display");
    });

    hideUnusedMarkers(renderedEntries.length);
    banner.textContent = `COLLIDERS: ${renderedEntries.length}/${visibleEntries.length}/${state.colliders.length}`;
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
