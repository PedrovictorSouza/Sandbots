const DEFAULT_CELL_SIZE = 1;
const DEFAULT_GRID_WIDTH = 1;
const DEFAULT_GRID_HEIGHT = 1;

export const GRID_PLACEABLE_IDS = Object.freeze({
  TRAIN_HOUSE: "trainHouse",
  SOLAR_STATION: "solarStation",
  LEAF_DEN_KIT: "leafDenKit",
  LEAF_DEN: "leafDen",
  LOG_CHAIR: "logChair",
  STRAW_BED_FURNITURE: "strawBedFurniture",
  FLOOR_PLACEHOLDER: "floorPlaceholder"
});

export const GRID_PLACEMENT_TYPES = Object.freeze({
  OBJECT: "object",
  FLOOR: "floor",
  BUILDING_KIT: "buildingKit",
  FURNITURE: "furniture"
});

export const GRID_BUILD_CATEGORIES = Object.freeze({
  WORKBENCH: "workbench",
  BUILDING_KIT: "building-kit",
  FURNITURE: "furniture",
  FLOOR: "floor"
});

export const GRID_INPUT_EVENTS = Object.freeze({
  PRIMARY_ACTION: "primaryAction",
  CANCEL_EXIT: "cancelExit",
  SELECTED_CELL_CHANGED: "selectedCellChanged"
});

export const DEFAULT_PLACEABLE_OBJECTS = Object.freeze([
  Object.freeze({
    id: GRID_PLACEABLE_IDS.TRAIN_HOUSE,
    name: "Train House",
    prefabKey: "trainHouseModel",
    footprint: Object.freeze({ width: 3, height: 3 }),
    placementType: GRID_PLACEMENT_TYPES.OBJECT,
    buildCategory: GRID_BUILD_CATEGORIES.WORKBENCH,
    sourceItemId: "campfire"
  }),
  Object.freeze({
    id: GRID_PLACEABLE_IDS.SOLAR_STATION,
    name: "Solar Station",
    prefabKey: "solarStationModel",
    footprint: Object.freeze({ width: 4, height: 4 }),
    placementType: GRID_PLACEMENT_TYPES.OBJECT,
    buildCategory: GRID_BUILD_CATEGORIES.WORKBENCH,
    sourceItemId: "strawBed"
  }),
  Object.freeze({
    id: GRID_PLACEABLE_IDS.LEAF_DEN_KIT,
    name: "House Kit",
    prefabKey: "leafDenKit",
    footprint: Object.freeze({ width: 3, height: 3 }),
    placementType: GRID_PLACEMENT_TYPES.BUILDING_KIT,
    buildCategory: GRID_BUILD_CATEGORIES.BUILDING_KIT,
    sourceItemId: "leafDenKit"
  }),
  Object.freeze({
    id: GRID_PLACEABLE_IDS.LEAF_DEN,
    name: "House",
    prefabKey: "leafDenModel",
    footprint: Object.freeze({ width: 3, height: 3 }),
    placementType: GRID_PLACEMENT_TYPES.OBJECT,
    buildCategory: GRID_BUILD_CATEGORIES.BUILDING_KIT,
    sourceItemId: "leafDenKit"
  }),
  Object.freeze({
    id: GRID_PLACEABLE_IDS.LOG_CHAIR,
    name: "Log Chair",
    prefabKey: "logChair",
    footprint: Object.freeze({ width: 1, height: 1 }),
    placementType: GRID_PLACEMENT_TYPES.FURNITURE,
    buildCategory: GRID_BUILD_CATEGORIES.FURNITURE,
    sourceItemId: "logChair"
  }),
  Object.freeze({
    id: GRID_PLACEABLE_IDS.STRAW_BED_FURNITURE,
    name: "Solar Station Furniture",
    prefabKey: "strawBedFurniture",
    footprint: Object.freeze({ width: 2, height: 1 }),
    placementType: GRID_PLACEMENT_TYPES.FURNITURE,
    buildCategory: GRID_BUILD_CATEGORIES.FURNITURE,
    sourceItemId: "strawBed"
  }),
  Object.freeze({
    id: GRID_PLACEABLE_IDS.FLOOR_PLACEHOLDER,
    name: "Floor",
    prefabKey: "floorPlaceholder",
    footprint: Object.freeze({ width: 1, height: 1 }),
    placementType: GRID_PLACEMENT_TYPES.FLOOR,
    buildCategory: GRID_BUILD_CATEGORIES.FLOOR
  })
]);

function assertFiniteNumber(value, name) {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number`);
  }
}

function assertPositiveInteger(value, name) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new TypeError(`${name} must be a positive integer`);
  }
}

export function normalizeWorldPosition(position = {}) {
  if (Array.isArray(position)) {
    return {
      x: Number(position[0] || 0),
      y: Number(position[1] || 0),
      z: Number(position[2] || 0)
    };
  }

  return {
    x: Number(position.x || 0),
    y: Number(position.y || 0),
    z: Number(Number.isFinite(position.z) ? position.z : 0)
  };
}

export function normalizeCell(cell = {}) {
  return {
    x: Number.isFinite(cell.x) ? Math.trunc(cell.x) : Math.trunc(Number.isFinite(cell.col) ? cell.col : 0),
    y: Number.isFinite(cell.y) ? Math.trunc(cell.y) : Math.trunc(Number.isFinite(cell.row) ? cell.row : 0)
  };
}

export function normalizeFootprintSize(size = {}) {
  const width = Number.isFinite(size.width) ? Math.trunc(size.width) : Math.trunc(size.x || 1);
  const height = Number.isFinite(size.height) ? Math.trunc(size.height) : Math.trunc(size.y || size.depth || 1);
  assertPositiveInteger(width, "footprint width");
  assertPositiveInteger(height, "footprint height");
  return { width, height };
}

export function cellKey(cell) {
  const normalizedCell = normalizeCell(cell);
  return `${normalizedCell.x}:${normalizedCell.y}`;
}

export function createGridSystem({
  cellSize = DEFAULT_CELL_SIZE,
  origin = { x: 0, y: 0, z: 0 },
  width = DEFAULT_GRID_WIDTH,
  height = DEFAULT_GRID_HEIGHT,
  visualOffsetY = 0
} = {}) {
  assertFiniteNumber(cellSize, "cellSize");
  assertPositiveInteger(width, "grid width");
  assertPositiveInteger(height, "grid height");

  if (cellSize <= 0) {
    throw new TypeError("cellSize must be greater than zero");
  }

  const gridOrigin = normalizeWorldPosition(origin);
  assertFiniteNumber(gridOrigin.x, "origin.x");
  assertFiniteNumber(gridOrigin.y, "origin.y");
  assertFiniteNumber(gridOrigin.z, "origin.z");
  assertFiniteNumber(visualOffsetY, "visualOffsetY");

  function worldToCell(worldPosition) {
    const position = normalizeWorldPosition(worldPosition);
    return {
      x: Math.floor((position.x - gridOrigin.x) / cellSize),
      y: Math.floor((position.z - gridOrigin.z) / cellSize)
    };
  }

  function cellToWorld(cell, { center = false, includeVisualOffset = false } = {}) {
    const normalizedCell = normalizeCell(cell);
    const offset = center ? cellSize * 0.5 : 0;
    return {
      x: gridOrigin.x + normalizedCell.x * cellSize + offset,
      y: gridOrigin.y + (includeVisualOffset ? visualOffsetY : 0),
      z: gridOrigin.z + normalizedCell.y * cellSize + offset
    };
  }

  function isInsideGrid(cell) {
    const normalizedCell = normalizeCell(cell);
    return normalizedCell.x >= 0 &&
      normalizedCell.y >= 0 &&
      normalizedCell.x < width &&
      normalizedCell.y < height;
  }

  function getFootprintCells(originCell, size = { width: 1, height: 1 }) {
    const originCellNormalized = normalizeCell(originCell);
    const footprintSize = normalizeFootprintSize(size);
    const cells = [];

    for (let y = 0; y < footprintSize.height; y += 1) {
      for (let x = 0; x < footprintSize.width; x += 1) {
        cells.push({
          x: originCellNormalized.x + x,
          y: originCellNormalized.y + y
        });
      }
    }

    return cells;
  }

  return Object.freeze({
    cellSize,
    origin: Object.freeze({ ...gridOrigin }),
    width,
    height,
    visualOffsetY,
    worldToCell,
    cellToWorld,
    isInsideGrid,
    getFootprintCells
  });
}

function cloneCell(cell) {
  return cell ? { x: cell.x, y: cell.y } : null;
}

function cellsEqual(a, b) {
  return Boolean(a && b && a.x === b.x && a.y === b.y);
}

function roundGridWorldValue(value) {
  return Number(value.toFixed(6));
}

export function createGridInput({
  gridSystem,
  resolvePointerWorldPosition = null,
  isPointerOverUi = null,
  initialCell = null
} = {}) {
  if (!gridSystem || typeof gridSystem.worldToCell !== "function") {
    throw new TypeError("gridSystem is required");
  }

  const listeners = new Map(Object.values(GRID_INPUT_EVENTS).map((eventName) => [eventName, new Set()]));
  let selectedCell = initialCell && gridSystem.isInsideGrid(initialCell) ? normalizeCell(initialCell) : null;

  function emit(eventName, payload) {
    const eventListeners = listeners.get(eventName);

    if (!eventListeners) {
      return;
    }

    for (const listener of eventListeners) {
      listener(payload);
    }
  }

  function on(eventName, listener) {
    const eventListeners = listeners.get(eventName);

    if (!eventListeners || typeof listener !== "function") {
      return () => {};
    }

    eventListeners.add(listener);
    return () => {
      eventListeners.delete(listener);
    };
  }

  function setSelectedCell(cell, { source = "manual", worldPosition = null } = {}) {
    const nextCell = normalizeCell(cell);

    if (!gridSystem.isInsideGrid(nextCell)) {
      return {
        selected: false,
        changed: false,
        reason: "outside-grid",
        cell: cloneCell(selectedCell)
      };
    }

    const previousCell = cloneCell(selectedCell);
    const changed = !cellsEqual(selectedCell, nextCell);
    selectedCell = nextCell;

    if (changed) {
      emit(GRID_INPUT_EVENTS.SELECTED_CELL_CHANGED, {
        cell: cloneCell(selectedCell),
        previousCell,
        source,
        worldPosition: worldPosition ? { ...worldPosition } : null
      });
    }

    return {
      selected: true,
      changed,
      reason: null,
      cell: cloneCell(selectedCell)
    };
  }

  function resolvePointerCell(pointerInput, context = {}) {
    if (typeof isPointerOverUi === "function" && isPointerOverUi(pointerInput, context)) {
      return {
        selected: false,
        changed: false,
        reason: "pointer-over-ui",
        cell: cloneCell(selectedCell)
      };
    }

    if (typeof resolvePointerWorldPosition !== "function") {
      return {
        selected: false,
        changed: false,
        reason: "missing-pointer-resolver",
        cell: cloneCell(selectedCell)
      };
    }

    const worldPosition = resolvePointerWorldPosition(pointerInput, context);

    if (!worldPosition) {
      return {
        selected: false,
        changed: false,
        reason: "no-build-plane-hit",
        cell: cloneCell(selectedCell)
      };
    }

    return setSelectedCell(gridSystem.worldToCell(worldPosition), {
      source: "pointer",
      worldPosition: normalizeWorldPosition(worldPosition)
    });
  }

  function moveGamepadCell(delta = {}, { source = "gamepad" } = {}) {
    const current = selectedCell || { x: 0, y: 0 };
    const dx = Number.isFinite(delta.x) ? Math.trunc(delta.x) : Math.trunc(delta.dx || 0);
    const dy = Number.isFinite(delta.y) ? Math.trunc(delta.y) : Math.trunc(delta.dy || 0);

    return setSelectedCell({
      x: current.x + dx,
      y: current.y + dy
    }, { source });
  }

  function emitPrimaryAction({ source = "pointer" } = {}) {
    if (!selectedCell) {
      return {
        emitted: false,
        reason: "no-selected-cell",
        cell: null
      };
    }

    const payload = {
      cell: cloneCell(selectedCell),
      source
    };
    emit(GRID_INPUT_EVENTS.PRIMARY_ACTION, payload);
    return {
      emitted: true,
      reason: null,
      cell: cloneCell(selectedCell)
    };
  }

  function emitCancelExit({ source = "input" } = {}) {
    const payload = {
      cell: cloneCell(selectedCell),
      source
    };
    emit(GRID_INPUT_EVENTS.CANCEL_EXIT, payload);
    return {
      emitted: true,
      cell: cloneCell(selectedCell)
    };
  }

  return Object.freeze({
    on,
    getSelectedCell() {
      return cloneCell(selectedCell);
    },
    setSelectedCell,
    handlePointerMove: resolvePointerCell,
    handlePrimaryAction: emitPrimaryAction,
    handleCancelAction: emitCancelExit,
    moveGamepadCell
  });
}

export function createGridOverlay({
  gridSystem,
  lineThickness = 0.035,
  opacity = 0.28,
  color = [0.62, 1, 0.48],
  visualOffsetY = null
} = {}) {
  if (!gridSystem || typeof gridSystem.cellToWorld !== "function") {
    throw new TypeError("gridSystem is required");
  }

  assertFiniteNumber(lineThickness, "lineThickness");
  assertFiniteNumber(opacity, "opacity");

  let visible = false;
  const overlayColor = Array.isArray(color) ? [...color] : color;
  const gridVisualOffsetY = Number.isFinite(visualOffsetY) ? visualOffsetY : gridSystem.visualOffsetY;

  function getWorldPoint(cell) {
    const point = gridSystem.cellToWorld(cell, {
      includeVisualOffset: true
    });
    return {
      x: roundGridWorldValue(point.x),
      y: roundGridWorldValue(gridSystem.origin.y + gridVisualOffsetY),
      z: roundGridWorldValue(point.z)
    };
  }

  function buildLineSegments() {
    if (!visible) {
      return [];
    }

    const segments = [];

    for (let x = 0; x <= gridSystem.width; x += 1) {
      segments.push({
        start: getWorldPoint({ x, y: 0 }),
        end: getWorldPoint({ x, y: gridSystem.height }),
        thickness: lineThickness,
        opacity,
        color: Array.isArray(overlayColor) ? [...overlayColor] : overlayColor
      });
    }

    for (let y = 0; y <= gridSystem.height; y += 1) {
      segments.push({
        start: getWorldPoint({ x: 0, y }),
        end: getWorldPoint({ x: gridSystem.width, y }),
        thickness: lineThickness,
        opacity,
        color: Array.isArray(overlayColor) ? [...overlayColor] : overlayColor
      });
    }

    return segments;
  }

  return Object.freeze({
    show() {
      visible = true;
    },
    hide() {
      visible = false;
    },
    isVisible() {
      return visible;
    },
    getLineSegments: buildLineSegments,
    getConfig() {
      return {
        lineThickness,
        opacity,
        color: Array.isArray(overlayColor) ? [...overlayColor] : overlayColor,
        cellSize: gridSystem.cellSize,
        gridOffset: gridVisualOffsetY
      };
    }
  });
}

export function createCellIndicator({
  gridSystem
} = {}) {
  if (!gridSystem || typeof gridSystem.cellToWorld !== "function") {
    throw new TypeError("gridSystem is required");
  }

  let visible = false;
  let descriptor = null;

  function makeDescriptor(cell, footprint, valid) {
    const originCell = normalizeCell(cell);
    const footprintSize = normalizeFootprintSize(footprint || { width: 1, height: 1 });
    return {
      visible,
      originCell,
      footprint: footprintSize,
      worldPosition: gridSystem.cellToWorld(originCell, {
        includeVisualOffset: true
      }),
      worldSize: {
        width: footprintSize.width * gridSystem.cellSize,
        height: footprintSize.height * gridSystem.cellSize
      },
      state: valid ? "valid" : "invalid"
    };
  }

  function descriptorChanged(nextDescriptor) {
    return !descriptor ||
      descriptor.visible !== nextDescriptor.visible ||
      descriptor.state !== nextDescriptor.state ||
      descriptor.originCell.x !== nextDescriptor.originCell.x ||
      descriptor.originCell.y !== nextDescriptor.originCell.y ||
      descriptor.footprint.width !== nextDescriptor.footprint.width ||
      descriptor.footprint.height !== nextDescriptor.footprint.height;
  }

  return Object.freeze({
    show() {
      visible = true;
      if (descriptor) {
        descriptor = { ...descriptor, visible };
      }
    },
    hide() {
      visible = false;
      descriptor = descriptor ? { ...descriptor, visible } : null;
    },
    isVisible() {
      return visible;
    },
    update({ cell, footprint = { width: 1, height: 1 }, valid = true } = {}) {
      const nextDescriptor = makeDescriptor(cell, footprint, valid);
      const changed = descriptorChanged(nextDescriptor);
      descriptor = nextDescriptor;
      return {
        changed,
        descriptor: { ...descriptor }
      };
    },
    getDescriptor() {
      return descriptor ? { ...descriptor } : null;
    }
  });
}

export function createPlacementPreview({
  validVisual = { alpha: 0.64, tint: [0.55, 1, 0.46], tintStrength: 0.22 },
  invalidVisual = { alpha: 0.42, tint: [1, 0.04, 0.02], tintStrength: 0.82 }
} = {}) {
  let active = false;
  let destroyed = false;
  let descriptor = null;

  function makeVisual(valid) {
    const visual = valid ? validVisual : invalidVisual;
    return {
      ...visual,
      tint: Array.isArray(visual.tint) ? [...visual.tint] : visual.tint
    };
  }

  function descriptorChanged(nextDescriptor) {
    return !descriptor ||
      descriptor.active !== nextDescriptor.active ||
      descriptor.state !== nextDescriptor.state ||
      descriptor.placeableId !== nextDescriptor.placeableId ||
      descriptor.originCell?.x !== nextDescriptor.originCell?.x ||
      descriptor.originCell?.y !== nextDescriptor.originCell?.y ||
      descriptor.footprint?.width !== nextDescriptor.footprint?.width ||
      descriptor.footprint?.height !== nextDescriptor.footprint?.height;
  }

  return Object.freeze({
    show({ placeableId } = {}) {
      active = true;
      destroyed = false;
      descriptor = {
        active,
        placeableId: placeableId || null,
        state: "pending",
        originCell: null,
        worldPosition: null,
        footprint: null,
        visual: makeVisual(true)
      };
      return { ...descriptor };
    },
    update(candidate = {}) {
      if (destroyed) {
        return {
          changed: false,
          descriptor: null
        };
      }

      active = true;
      const valid = Boolean(candidate.valid);
      const placeable = candidate.placeable || null;
      const nextDescriptor = {
        active,
        placeableId: placeable?.id || descriptor?.placeableId || null,
        state: valid ? "valid" : "invalid",
        reason: candidate.reason || null,
        originCell: candidate.originCell ? { ...candidate.originCell } : null,
        worldPosition: candidate.worldPosition ? { ...candidate.worldPosition } : null,
        footprint: placeable?.footprint ? { ...placeable.footprint } : null,
        visual: makeVisual(valid)
      };
      const changed = descriptorChanged(nextDescriptor);
      descriptor = nextDescriptor;
      return {
        changed,
        descriptor: { ...descriptor }
      };
    },
    hide() {
      active = false;
      if (descriptor) {
        descriptor = {
          ...descriptor,
          active
        };
      }
    },
    destroy() {
      active = false;
      destroyed = true;
      descriptor = null;
    },
    isActive() {
      return active;
    },
    getDescriptor() {
      return descriptor ? { ...descriptor } : null;
    }
  });
}

export function calculateFloorBoxSelection({
  startCell,
  endCell,
  tileSize = { width: 1, height: 1 },
  gridSystem = null
} = {}) {
  const start = normalizeCell(startCell);
  const end = normalizeCell(endCell);
  const footprint = normalizeFootprintSize(tileSize);
  const minX = Math.min(start.x, end.x);
  const maxX = Math.max(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const maxY = Math.max(start.y, end.y);
  const origins = [];
  const coveredCells = [];

  for (let y = minY; y <= maxY - footprint.height + 1; y += footprint.height) {
    for (let x = minX; x <= maxX - footprint.width + 1; x += footprint.width) {
      const origin = { x, y };
      const cells = gridSystem?.getFootprintCells ?
        gridSystem.getFootprintCells(origin, footprint) :
        Array.from({ length: footprint.height }, (_, cellY) => (
          Array.from({ length: footprint.width }, (__, cellX) => ({
            x: origin.x + cellX,
            y: origin.y + cellY
          }))
        )).flat();

      origins.push(origin);
      coveredCells.push(...cells);
    }
  }

  return {
    startCell: start,
    endCell: end,
    minCell: { x: minX, y: minY },
    maxCell: { x: maxX, y: maxY },
    tileSize: footprint,
    origins,
    coveredCells
  };
}

export function createFloorPlacementState({
  floorPlaceableId = GRID_PLACEABLE_IDS.FLOOR_PLACEHOLDER,
  objectPlacer,
  preview = null
} = {}) {
  if (!objectPlacer || typeof objectPlacer.getPlacementCandidate !== "function") {
    throw new TypeError("objectPlacer is required");
  }

  let startCell = null;
  let lastSelection = null;
  let exited = false;

  function getFloorFootprint(cell) {
    const candidate = objectPlacer.getPlacementCandidate(floorPlaceableId, cell || { x: 0, y: 0 });
    return candidate.placeable?.footprint || { width: 1, height: 1 };
  }

  function buildSelection(currentCell) {
    if (!startCell) {
      return null;
    }

    const tileSize = getFloorFootprint(startCell);
    const selection = calculateFloorBoxSelection({
      startCell,
      endCell: currentCell,
      tileSize
    });
    const candidates = selection.origins.map((origin) => objectPlacer.getPlacementCandidate(
      floorPlaceableId,
      origin
    ));
    const validCandidates = candidates.filter((candidate) => candidate.valid);
    const invalidCandidates = candidates.filter((candidate) => !candidate.valid);

    return {
      ...selection,
      placeableId: floorPlaceableId,
      candidates,
      validCandidates,
      invalidCandidates,
      valid: invalidCandidates.length === 0 && validCandidates.length > 0
    };
  }

  function updatePreview(selection) {
    if (!selection) {
      return;
    }

    preview?.update?.(selection);
  }

  function clearPreview() {
    if (exited) {
      return;
    }

    exited = true;
    preview?.hide?.();
    preview?.destroy?.();
  }

  return {
    id: "floor-placement",
    floorPlaceableId,
    enter() {
      exited = false;
      startCell = null;
      lastSelection = null;
      preview?.show?.({ placeableId: floorPlaceableId });
    },
    update(cell) {
      if (!startCell) {
        return null;
      }

      lastSelection = buildSelection(cell);
      updatePreview(lastSelection);
      return lastSelection;
    },
    confirm(cell, options = {}) {
      const normalizedCell = normalizeCell(cell);

      if (!startCell) {
        startCell = normalizedCell;
        lastSelection = buildSelection(normalizedCell);
        updatePreview(lastSelection);
        return {
          started: true,
          placed: false,
          selection: lastSelection
        };
      }

      const selection = buildSelection(normalizedCell);
      const placedRecords = [];
      const rejected = [];

      for (const candidate of selection.candidates) {
        if (!candidate.valid) {
          rejected.push(candidate);
          continue;
        }

        const result = objectPlacer.placeObject(floorPlaceableId, candidate.originCell, {
          ...options,
          placedObjectId: options.placedObjectId ?
            `${options.placedObjectId}-${placedRecords.length}` :
            undefined
        });

        if (result.placed) {
          placedRecords.push(result.record);
        } else {
          rejected.push(result.candidate);
        }
      }

      lastSelection = selection;
      updatePreview(selection);
      return {
        started: false,
        placed: placedRecords.length > 0,
        selection,
        placedRecords,
        rejected
      };
    },
    cancel() {
      clearPreview();
      return {
        canceled: true,
        stateId: "floor-placement"
      };
    },
    exit() {
      clearPreview();
    }
  };
}

function vertexKey(vertex) {
  const normalizedVertex = normalizeCell(vertex);
  return `${normalizedVertex.x}:${normalizedVertex.y}`;
}

export function wallEdgeKey(a, b) {
  const vertexA = normalizeCell(a);
  const vertexB = normalizeCell(b);
  const keyA = vertexKey(vertexA);
  const keyB = vertexKey(vertexB);
  return keyA < keyB ? `${keyA}|${keyB}` : `${keyB}|${keyA}`;
}

export function createWallEdgeStore() {
  const edges = new Map();

  return Object.freeze({
    hasEdge(a, b) {
      return edges.has(wallEdgeKey(a, b));
    },
    addEdge(a, b, record = {}) {
      const start = normalizeCell(a);
      const end = normalizeCell(b);

      if (start.x === end.x && start.y === end.y) {
        return null;
      }

      const key = wallEdgeKey(start, end);

      if (edges.has(key)) {
        return edges.get(key);
      }

      const edgeRecord = {
        id: record.id || key,
        key,
        start,
        end,
        sourceDatabaseId: record.sourceDatabaseId || "wall"
      };
      edges.set(key, edgeRecord);
      return edgeRecord;
    },
    removeEdge(a, b) {
      const key = wallEdgeKey(a, b);
      const edge = edges.get(key) || null;
      edges.delete(key);
      return edge;
    },
    listEdges() {
      return [...edges.values()];
    },
    get size() {
      return edges.size;
    }
  });
}

export function buildManhattanWallPath({
  startCell,
  endCell,
  occupancyStore = null
} = {}) {
  const start = normalizeCell(startCell);
  const end = normalizeCell(endCell);
  const vertices = [{ ...start }];
  const edges = [];
  const blockedCells = [];
  const cursor = { ...start };

  function stepToward(axis, targetValue) {
    while (cursor[axis] !== targetValue) {
      const previous = { ...cursor };
      cursor[axis] += cursor[axis] < targetValue ? 1 : -1;
      const next = { ...cursor };
      const blockedRecord = occupancyStore?.getObjectAt?.(next) || null;

      if (blockedRecord) {
        blockedCells.push({
          cell: next,
          record: blockedRecord
        });
      }

      vertices.push(next);
      edges.push({
        start: previous,
        end: next,
        key: wallEdgeKey(previous, next)
      });
    }
  }

  stepToward("x", end.x);
  stepToward("y", end.y);

  return {
    startCell: start,
    endCell: end,
    vertices,
    edges,
    blockedCells,
    valid: blockedCells.length === 0
  };
}

export function createWallPlacementState({
  wallEdgeStore,
  occupancyStore = null,
  preview = null,
  sourceDatabaseId = "wall"
} = {}) {
  if (!wallEdgeStore || typeof wallEdgeStore.addEdge !== "function") {
    throw new TypeError("wallEdgeStore is required");
  }

  let startCell = null;
  let lastPath = null;
  let exited = false;

  function updatePreview(path) {
    if (!path) {
      return;
    }

    preview?.update?.(path);
  }

  function clearPreview() {
    if (exited) {
      return;
    }

    exited = true;
    preview?.hide?.();
    preview?.destroy?.();
  }

  return {
    id: "wall-placement",
    enter() {
      exited = false;
      startCell = null;
      lastPath = null;
      preview?.show?.({ sourceDatabaseId });
    },
    update(cell) {
      if (!startCell) {
        return null;
      }

      lastPath = buildManhattanWallPath({
        startCell,
        endCell: cell,
        occupancyStore
      });
      updatePreview(lastPath);
      return lastPath;
    },
    confirm(cell) {
      const normalizedCell = normalizeCell(cell);

      if (!startCell) {
        startCell = normalizedCell;
        lastPath = buildManhattanWallPath({
          startCell,
          endCell: normalizedCell,
          occupancyStore
        });
        updatePreview(lastPath);
        return {
          started: true,
          placed: false,
          path: lastPath
        };
      }

      const path = buildManhattanWallPath({
        startCell,
        endCell: normalizedCell,
        occupancyStore
      });

      if (!path.valid) {
        lastPath = path;
        updatePreview(path);
        return {
          started: false,
          placed: false,
          path,
          edges: []
        };
      }

      const edges = path.edges.map((edge) => wallEdgeStore.addEdge(edge.start, edge.end, {
        sourceDatabaseId
      })).filter(Boolean);
      lastPath = path;
      updatePreview(path);
      return {
        started: false,
        placed: edges.length > 0,
        path,
        edges
      };
    },
    cancel() {
      clearPreview();
      return {
        canceled: true,
        stateId: "wall-placement"
      };
    },
    exit() {
      clearPreview();
    }
  };
}

export function createGridPlacementSaveSnapshot({ occupancyStore } = {}) {
  if (!occupancyStore || typeof occupancyStore.serializePlacedObjects !== "function") {
    throw new TypeError("occupancyStore is required");
  }

  return {
    schemaVersion: 1,
    placedObjects: occupancyStore.serializePlacedObjects()
  };
}

export function restoreGridPlacementSaveSnapshot({
  snapshot,
  objectPlacer
} = {}) {
  if (!objectPlacer || typeof objectPlacer.placeObject !== "function") {
    throw new TypeError("objectPlacer is required");
  }

  const placedObjects = Array.isArray(snapshot?.placedObjects) ? snapshot.placedObjects : [];
  const restored = [];
  const rejected = [];

  for (const record of placedObjects) {
    const result = objectPlacer.placeObject(record.sourceDatabaseId, record.originCell, {
      placedObjectId: record.placedObjectId
    });

    if (result.placed) {
      restored.push(result.record);
    } else {
      rejected.push({
        savedRecord: record,
        result
      });
    }
  }

  return {
    restored,
    rejected
  };
}

export const LEGACY_PLACEABLE_GRID_SOURCE_IDS = Object.freeze({
  strawBed: GRID_PLACEABLE_IDS.SOLAR_STATION,
  campfire: GRID_PLACEABLE_IDS.TRAIN_HOUSE,
  leafDen: GRID_PLACEABLE_IDS.LEAF_DEN,
  logChair: GRID_PLACEABLE_IDS.LOG_CHAIR,
  strawBedFurniture: GRID_PLACEABLE_IDS.STRAW_BED_FURNITURE,
  campfireFurniture: GRID_PLACEABLE_IDS.STRAW_BED_FURNITURE
});

export function migrateLegacyPlaceablesToGridRecords({
  placeables = {},
  gridSystem,
  placementDatabase = null
} = {}) {
  if (!gridSystem || typeof gridSystem.worldToCell !== "function") {
    throw new TypeError("gridSystem is required");
  }

  const records = [];

  function addLegacyPlacement(legacyKey, placement, index = null) {
    if (!placement || !Array.isArray(placement.position)) {
      return;
    }

    const kind = placement.kind || legacyKey;
    const sourceDatabaseId =
      LEGACY_PLACEABLE_GRID_SOURCE_IDS[kind] ||
      LEGACY_PLACEABLE_GRID_SOURCE_IDS[legacyKey] ||
      kind;
    const placeable = placementDatabase?.get?.(sourceDatabaseId);

    records.push({
      placedObjectId: index === null ? `legacy-${legacyKey}` : `legacy-${legacyKey}-${index}`,
      sourceDatabaseId,
      originCell: gridSystem.worldToCell(placement.position),
      size: placeable?.footprint || normalizeFootprintSize(placement.size || { width: 1, height: 1 }),
      legacyKey
    });
  }

  addLegacyPlacement("strawBed", placeables.strawBed);
  addLegacyPlacement("campfire", placeables.campfire);
  addLegacyPlacement("leafDen", placeables.leafDen);

  if (Array.isArray(placeables.leafDenFurniture)) {
    placeables.leafDenFurniture.forEach((placement, index) => {
      addLegacyPlacement(placement?.kind || "leafDenFurniture", placement, index);
    });
  }

  return records;
}

export function createPlacementDatabase(entries = []) {
  const records = new Map();

  for (const entry of entries) {
    if (!entry || typeof entry.id !== "string" || !entry.id.trim()) {
      throw new TypeError("placeable object id is required");
    }

    if (records.has(entry.id)) {
      throw new Error(`Duplicate placeable object id: ${entry.id}`);
    }

    const footprint = normalizeFootprintSize(entry.footprint || entry.footprintSize || { width: 1, height: 1 });
    records.set(entry.id, Object.freeze({
      ...entry,
      id: entry.id,
      name: entry.name || entry.id,
      footprint,
      placementType: entry.placementType || "object",
      buildCategory: entry.buildCategory || "objects"
    }));
  }

  return Object.freeze({
    has(id) {
      return records.has(id);
    },
    get(id) {
      return records.get(id) || null;
    },
    list() {
      return [...records.values()];
    }
  });
}

export function createDefaultPlacementDatabase(extraEntries = []) {
  return createPlacementDatabase([
    ...DEFAULT_PLACEABLE_OBJECTS,
    ...extraEntries
  ]);
}

export function createOccupancyStore({ gridSystem } = {}) {
  if (!gridSystem || typeof gridSystem.isInsideGrid !== "function") {
    throw new TypeError("gridSystem is required");
  }

  const occupiedCells = new Map();
  const records = new Map();
  let nextPlacedObjectSequence = 1;

  function getOccupiedCells(originCell, size) {
    return gridSystem.getFootprintCells(originCell, size);
  }

  function canPlace(originCell, size = { width: 1, height: 1 }) {
    const cells = getOccupiedCells(originCell, size);

    for (const cell of cells) {
      if (!gridSystem.isInsideGrid(cell)) {
        return false;
      }

      if (occupiedCells.has(cellKey(cell))) {
        return false;
      }
    }

    return true;
  }

  function normalizeRecord(record, { removable = true } = {}) {
    const sourceId = record.sourceDatabaseId || record.sourceId || record.databaseId || record.placeableId;
    const originCell = normalizeCell(record.originCell);
    const size = normalizeFootprintSize(record.size || record.footprint || { width: 1, height: 1 });
    const occupied = getOccupiedCells(originCell, size);
    const id = record.placedObjectId || record.id || `placed-${nextPlacedObjectSequence++}`;

    return {
      placedObjectId: id,
      sourceDatabaseId: sourceId || id,
      originCell,
      size,
      occupiedCells: occupied,
      runtimeEntity: record.runtimeEntity || null,
      removable: record.removable ?? removable
    };
  }

  function addPlacedObject(record = {}) {
    const normalizedRecord = normalizeRecord(record);

    if (records.has(normalizedRecord.placedObjectId)) {
      return null;
    }

    if (!canPlace(normalizedRecord.originCell, normalizedRecord.size)) {
      return null;
    }

    records.set(normalizedRecord.placedObjectId, normalizedRecord);

    for (const cell of normalizedRecord.occupiedCells) {
      occupiedCells.set(cellKey(cell), normalizedRecord.placedObjectId);
    }

    return normalizedRecord;
  }

  function addBlockedFootprint(record = {}) {
    const normalizedRecord = normalizeRecord({
      ...record,
      removable: false
    }, { removable: false });

    if (records.has(normalizedRecord.placedObjectId)) {
      return null;
    }

    if (!canPlace(normalizedRecord.originCell, normalizedRecord.size)) {
      return null;
    }

    records.set(normalizedRecord.placedObjectId, normalizedRecord);

    for (const cell of normalizedRecord.occupiedCells) {
      occupiedCells.set(cellKey(cell), normalizedRecord.placedObjectId);
    }

    return normalizedRecord;
  }

  function getObjectAt(cell) {
    const placedObjectId = occupiedCells.get(cellKey(cell));
    return placedObjectId ? records.get(placedObjectId) || null : null;
  }

  function removePlacedObjectAt(cell) {
    const record = getObjectAt(cell);

    if (!record || record.removable === false) {
      return null;
    }

    for (const occupiedCell of record.occupiedCells) {
      occupiedCells.delete(cellKey(occupiedCell));
    }

    records.delete(record.placedObjectId);
    return record;
  }

  function serializePlacedObjects() {
    return [...records.values()]
      .filter((record) => record.removable !== false)
      .map((record) => ({
        placedObjectId: record.placedObjectId,
        sourceDatabaseId: record.sourceDatabaseId,
        originCell: { ...record.originCell },
        size: { ...record.size },
        occupiedCells: record.occupiedCells.map((cell) => ({ ...cell }))
      }));
  }

  return Object.freeze({
    canPlace,
    addPlacedObject,
    addBlockedFootprint,
    removePlacedObjectAt,
    getObjectAt,
    getOccupiedCells,
    serializePlacedObjects,
    get size() {
      return records.size;
    }
  });
}

export function createObjectPlacer({
  gridSystem,
  occupancyStore,
  placementDatabase,
  spawnObject = null
} = {}) {
  if (!gridSystem || typeof gridSystem.cellToWorld !== "function") {
    throw new TypeError("gridSystem is required");
  }

  if (!occupancyStore || typeof occupancyStore.canPlace !== "function") {
    throw new TypeError("occupancyStore is required");
  }

  if (!placementDatabase || typeof placementDatabase.get !== "function") {
    throw new TypeError("placementDatabase is required");
  }

  function getPlacementCandidate(placeableId, originCell) {
    const placeable = placementDatabase.get(placeableId);

    if (!placeable) {
      return {
        valid: false,
        reason: "unknown-placeable",
        placeable: null,
        originCell: normalizeCell(originCell),
        worldPosition: null,
        occupiedCells: []
      };
    }

    const normalizedOriginCell = normalizeCell(originCell);
    const occupiedCells = occupancyStore.getOccupiedCells(normalizedOriginCell, placeable.footprint);
    const valid = occupancyStore.canPlace(normalizedOriginCell, placeable.footprint);

    return {
      valid,
      reason: valid ? null : "blocked-or-outside-grid",
      placeable,
      originCell: normalizedOriginCell,
      worldPosition: gridSystem.cellToWorld(normalizedOriginCell),
      occupiedCells
    };
  }

  function placeObject(placeableId, originCell, options = {}) {
    const candidate = getPlacementCandidate(placeableId, originCell);

    if (!candidate.valid) {
      return {
        placed: false,
        reason: candidate.reason,
        candidate,
        record: null
      };
    }

    const runtimeEntity = typeof spawnObject === "function" ?
      spawnObject({
        placeable: candidate.placeable,
        originCell: { ...candidate.originCell },
        worldPosition: { ...candidate.worldPosition },
        options
      }) :
      null;

    const record = occupancyStore.addPlacedObject({
      placedObjectId: options.placedObjectId,
      sourceDatabaseId: candidate.placeable.id,
      originCell: candidate.originCell,
      size: candidate.placeable.footprint,
      runtimeEntity
    });

    if (!record) {
      return {
        placed: false,
        reason: "occupancy-rejected",
        candidate,
        record: null
      };
    }

    return {
      placed: true,
      reason: null,
      candidate,
      record
    };
  }

  return Object.freeze({
    getPlacementCandidate,
    placeObject
  });
}

function callStateMethod(state, methodName, ...args) {
  if (!state || typeof state[methodName] !== "function") {
    return null;
  }

  return state[methodName](...args);
}

export function createBuildStateController() {
  let activeState = null;

  function exitActiveState() {
    const exitedState = activeState;

    if (exitedState) {
      callStateMethod(exitedState, "exit");
    }

    activeState = null;
    return exitedState;
  }

  return Object.freeze({
    getActiveState() {
      return activeState;
    },
    getActiveStateId() {
      return activeState?.id || null;
    },
    start(state, context = {}) {
      if (!state || typeof state !== "object") {
        throw new TypeError("build state is required");
      }

      if (activeState && activeState !== state) {
        exitActiveState();
      }

      activeState = state;
      callStateMethod(activeState, "enter", context);
      return activeState;
    },
    update(cell, context = {}) {
      return callStateMethod(activeState, "update", cell, context);
    },
    confirm(cell, context = {}) {
      return callStateMethod(activeState, "confirm", cell, context);
    },
    cancel(context = {}) {
      const result = callStateMethod(activeState, "cancel", context);
      exitActiveState();
      return result;
    },
    clear() {
      return exitActiveState();
    }
  });
}

export function createPlacementState({
  placeableId,
  objectPlacer,
  preview = null,
  overlay = null,
  indicator = null
} = {}) {
  if (!placeableId) {
    throw new TypeError("placeableId is required");
  }

  if (!objectPlacer || typeof objectPlacer.getPlacementCandidate !== "function") {
    throw new TypeError("objectPlacer is required");
  }

  let lastCell = null;
  let lastCandidate = null;
  let exited = false;

  function updateIndicator(cell, candidate) {
    indicator?.update?.({
      cell,
      footprint: candidate?.placeable?.footprint || { width: 1, height: 1 },
      valid: Boolean(candidate?.valid)
    });
  }

  function clearVisuals() {
    if (exited) {
      return;
    }

    exited = true;
    overlay?.hide?.();
    indicator?.hide?.();
    preview?.hide?.();
    preview?.destroy?.();
  }

  return {
    id: "placement",
    placeableId,
    enter() {
      exited = false;
      overlay?.show?.();
      indicator?.show?.();
      preview?.show?.({ placeableId });
    },
    update(cell) {
      const normalizedCell = normalizeCell(cell);

      if (lastCell && lastCell.x === normalizedCell.x && lastCell.y === normalizedCell.y) {
        return lastCandidate;
      }

      lastCell = normalizedCell;
      lastCandidate = objectPlacer.getPlacementCandidate(placeableId, normalizedCell);
      preview?.update?.(lastCandidate);
      updateIndicator(normalizedCell, lastCandidate);
      return lastCandidate;
    },
    confirm(cell, options = {}) {
      const normalizedCell = normalizeCell(cell);
      const result = objectPlacer.placeObject(placeableId, normalizedCell, options);

      if (!result.placed) {
        lastCandidate = result.candidate;
        preview?.update?.(lastCandidate);
        updateIndicator(normalizedCell, lastCandidate);
      }

      return result;
    },
    cancel() {
      clearVisuals();
      return {
        canceled: true,
        stateId: "placement"
      };
    },
    exit() {
      clearVisuals();
    }
  };
}

export function createRemovalState({
  occupancyStore,
  onRemove = null,
  overlay = null,
  indicator = null
} = {}) {
  if (!occupancyStore || typeof occupancyStore.getObjectAt !== "function") {
    throw new TypeError("occupancyStore is required");
  }

  let lastCell = null;
  let lastTarget = null;

  return {
    id: "removal",
    enter() {
      overlay?.show?.();
      indicator?.show?.();
    },
    update(cell) {
      const normalizedCell = normalizeCell(cell);

      if (lastCell && lastCell.x === normalizedCell.x && lastCell.y === normalizedCell.y) {
        return lastTarget;
      }

      const record = occupancyStore.getObjectAt(normalizedCell);
      lastCell = normalizedCell;
      lastTarget = {
        cell: normalizedCell,
        record,
        removable: Boolean(record && record.removable !== false),
        feedback: record ?
          (record.removable === false ? "locked" : "removable") :
          "empty"
      };
      indicator?.update?.({
        cell: normalizedCell,
        footprint: record?.size || { width: 1, height: 1 },
        valid: lastTarget.removable
      });
      return lastTarget;
    },
    confirm(cell) {
      const removed = occupancyStore.removePlacedObjectAt(cell);

      if (removed && typeof onRemove === "function") {
        onRemove(removed);
      }

      return {
        removed: Boolean(removed),
        record: removed
      };
    },
    cancel() {
      return {
        canceled: true,
        stateId: "removal"
      };
    },
    exit() {
      overlay?.hide?.();
      indicator?.hide?.();
    }
  };
}
