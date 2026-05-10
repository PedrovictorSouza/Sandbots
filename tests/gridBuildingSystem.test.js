import { describe, expect, it, vi } from "vitest";
import {
  calculateFloorBoxSelection,
  buildManhattanWallPath,
  cellKey,
  createBuildStateController,
  createCellIndicator,
  createDefaultPlacementDatabase,
  createFloorPlacementState,
  createGridPlacementSaveSnapshot,
  createGridOverlay,
  createGridSystem,
  createGridInput,
  createOccupancyStore,
  createObjectPlacer,
  createPlacementState,
  createPlacementPreview,
  createPlacementDatabase,
  createRemovalState,
  createWallEdgeStore,
  createWallPlacementState,
  migrateLegacyPlaceablesToGridRecords,
  restoreGridPlacementSaveSnapshot,
  wallEdgeKey,
  GRID_INPUT_EVENTS
} from "../app/gameplay/gridBuildingSystem.js";

describe("grid building system foundation", () => {
  it("converts world positions to cells and cells back to world positions using a moved origin", () => {
    const grid = createGridSystem({
      cellSize: 2,
      origin: { x: -10, y: 1, z: 4 },
      width: 8,
      height: 6,
      visualOffsetY: 0.08
    });

    expect(grid.worldToCell({ x: -9.9, z: 4.1 })).toEqual({ x: 0, y: 0 });
    expect(grid.worldToCell({ x: -4.1, z: 8.2 })).toEqual({ x: 2, y: 2 });
    expect(grid.cellToWorld({ x: 2, y: 2 })).toEqual({ x: -6, y: 1, z: 8 });
    expect(grid.cellToWorld({ x: 2, y: 2 }, { center: true, includeVisualOffset: true })).toEqual({
      x: -5,
      y: 1.08,
      z: 9
    });
    expect(grid.isInsideGrid({ x: 7, y: 5 })).toBe(true);
    expect(grid.isInsideGrid({ x: 8, y: 5 })).toBe(false);
  });

  it("creates deterministic cell keys", () => {
    expect(cellKey({ x: 3, y: 9 })).toBe("3:9");
    expect(cellKey({ col: 3, row: 9 })).toBe("3:9");
  });

  it("converts pointer hits into selected cells and emits changes only when the cell changes", () => {
    const grid = createGridSystem({
      cellSize: 2,
      origin: { x: -4, y: 0, z: 10 },
      width: 6,
      height: 6
    });
    const resolvePointerWorldPosition = vi.fn((pointer) => pointer.world);
    const input = createGridInput({
      gridSystem: grid,
      resolvePointerWorldPosition
    });
    const changed = [];
    input.on(GRID_INPUT_EVENTS.SELECTED_CELL_CHANGED, (event) => {
      changed.push(event);
    });

    expect(input.handlePointerMove({
      world: { x: -1.1, y: 0, z: 13.9 }
    })).toMatchObject({
      selected: true,
      changed: true,
      cell: { x: 1, y: 1 }
    });
    expect(input.getSelectedCell()).toEqual({ x: 1, y: 1 });

    expect(input.handlePointerMove({
      world: { x: -0.2, y: 0, z: 13.2 }
    })).toMatchObject({
      selected: true,
      changed: false,
      cell: { x: 1, y: 1 }
    });

    expect(changed).toEqual([
      {
        cell: { x: 1, y: 1 },
        previousCell: null,
        source: "pointer",
        worldPosition: { x: -1.1, y: 0, z: 13.9 }
      }
    ]);
    expect(resolvePointerWorldPosition).toHaveBeenCalledTimes(2);
  });

  it("ignores pointer interaction over UI and keeps the last valid selected cell", () => {
    const grid = createGridSystem({ cellSize: 1, width: 4, height: 4 });
    const resolvePointerWorldPosition = vi.fn((pointer) => pointer.world);
    const isPointerOverUi = vi.fn((pointer) => pointer.overUi);
    const input = createGridInput({
      gridSystem: grid,
      initialCell: { x: 1, y: 1 },
      resolvePointerWorldPosition,
      isPointerOverUi
    });

    expect(input.handlePointerMove({
      overUi: true,
      world: { x: 2, z: 2 }
    })).toEqual({
      selected: false,
      changed: false,
      reason: "pointer-over-ui",
      cell: { x: 1, y: 1 }
    });
    expect(resolvePointerWorldPosition).not.toHaveBeenCalled();
    expect(input.getSelectedCell()).toEqual({ x: 1, y: 1 });

    expect(input.handlePointerMove({
      overUi: false,
      world: { x: 9, z: 9 }
    })).toEqual({
      selected: false,
      changed: false,
      reason: "outside-grid",
      cell: { x: 1, y: 1 }
    });
    expect(input.getSelectedCell()).toEqual({ x: 1, y: 1 });
  });

  it("uses gamepad movement and emits primary/cancel events from the selected cell", () => {
    const grid = createGridSystem({ cellSize: 1, width: 3, height: 3 });
    const input = createGridInput({
      gridSystem: grid,
      initialCell: { x: 1, y: 1 }
    });
    const primaryActions = [];
    const cancelActions = [];
    input.on(GRID_INPUT_EVENTS.PRIMARY_ACTION, (event) => {
      primaryActions.push(event);
    });
    input.on(GRID_INPUT_EVENTS.CANCEL_EXIT, (event) => {
      cancelActions.push(event);
    });

    expect(input.moveGamepadCell({ dx: 1, dy: 0 })).toMatchObject({
      selected: true,
      changed: true,
      cell: { x: 2, y: 1 }
    });
    expect(input.moveGamepadCell({ dx: 1, dy: 0 })).toEqual({
      selected: false,
      changed: false,
      reason: "outside-grid",
      cell: { x: 2, y: 1 }
    });
    expect(input.handlePrimaryAction({ source: "gamepad" })).toEqual({
      emitted: true,
      reason: null,
      cell: { x: 2, y: 1 }
    });
    expect(input.handleCancelAction({ source: "gamepad" })).toEqual({
      emitted: true,
      cell: { x: 2, y: 1 }
    });
    expect(primaryActions).toEqual([
      { cell: { x: 2, y: 1 }, source: "gamepad" }
    ]);
    expect(cancelActions).toEqual([
      { cell: { x: 2, y: 1 }, source: "gamepad" }
    ]);
  });

  it("creates a configurable grid overlay aligned to grid coordinates", () => {
    const grid = createGridSystem({
      cellSize: 2,
      origin: { x: -2, y: 0.1, z: 4 },
      width: 2,
      height: 1,
      visualOffsetY: 0.05
    });
    const overlay = createGridOverlay({
      gridSystem: grid,
      lineThickness: 0.04,
      opacity: 0.32,
      color: [1, 0, 0]
    });

    expect(overlay.isVisible()).toBe(false);
    expect(overlay.getLineSegments()).toEqual([]);
    expect(overlay.getConfig()).toEqual({
      lineThickness: 0.04,
      opacity: 0.32,
      color: [1, 0, 0],
      cellSize: 2,
      gridOffset: 0.05
    });

    overlay.show();
    const segments = overlay.getLineSegments();
    expect(segments).toHaveLength(5);
    expect(segments[0]).toEqual({
      start: { x: -2, y: 0.15, z: 4 },
      end: { x: -2, y: 0.15, z: 6 },
      thickness: 0.04,
      opacity: 0.32,
      color: [1, 0, 0]
    });
    expect(segments.at(-1)).toEqual({
      start: { x: -2, y: 0.15, z: 6 },
      end: { x: 2, y: 0.15, z: 6 },
      thickness: 0.04,
      opacity: 0.32,
      color: [1, 0, 0]
    });

    overlay.hide();
    expect(overlay.getLineSegments()).toEqual([]);
  });

  it("creates a snapped cell indicator with footprint and invalid state", () => {
    const grid = createGridSystem({
      cellSize: 1.5,
      origin: { x: 3, y: 0.2, z: -6 },
      width: 8,
      height: 8,
      visualOffsetY: 0.03
    });
    const indicator = createCellIndicator({ gridSystem: grid });

    indicator.show();
    expect(indicator.update({
      cell: { x: 2, y: 4 },
      footprint: { width: 3, height: 2 },
      valid: false
    })).toEqual({
      changed: true,
      descriptor: {
        visible: true,
        originCell: { x: 2, y: 4 },
        footprint: { width: 3, height: 2 },
        worldPosition: { x: 6, y: 0.23, z: 0 },
        worldSize: { width: 4.5, height: 3 },
        state: "invalid"
      }
    });
    expect(indicator.update({
      cell: { x: 2, y: 4 },
      footprint: { width: 3, height: 2 },
      valid: false
    }).changed).toBe(false);
    expect(indicator.update({
      cell: { x: 3, y: 4 },
      footprint: { width: 3, height: 2 },
      valid: true
    })).toMatchObject({
      changed: true,
      descriptor: {
        originCell: { x: 3, y: 4 },
        state: "valid"
      }
    });

    indicator.hide();
    expect(indicator.getDescriptor()).toMatchObject({
      visible: false,
      originCell: { x: 3, y: 4 }
    });
  });

  it("tracks placement preview validity without registering a real object", () => {
    const grid = createGridSystem({ cellSize: 1, width: 5, height: 5 });
    const database = createDefaultPlacementDatabase();
    const store = createOccupancyStore({ gridSystem: grid });
    const placer = createObjectPlacer({
      gridSystem: grid,
      placementDatabase: database,
      occupancyStore: store
    });
    const preview = createPlacementPreview();

    expect(preview.show({ placeableId: "logChair" })).toMatchObject({
      active: true,
      placeableId: "logChair",
      state: "pending"
    });

    const validCandidate = placer.getPlacementCandidate("logChair", { x: 1, y: 1 });
    expect(preview.update(validCandidate)).toEqual({
      changed: true,
      descriptor: {
        active: true,
        placeableId: "logChair",
        state: "valid",
        reason: null,
        originCell: { x: 1, y: 1 },
        worldPosition: { x: 1, y: 0, z: 1 },
        footprint: { width: 1, height: 1 },
        visual: { alpha: 0.64, tint: [0.55, 1, 0.46], tintStrength: 0.22 }
      }
    });
    expect(store.getObjectAt({ x: 1, y: 1 })).toBeNull();
    expect(preview.update(validCandidate).changed).toBe(false);

    store.addPlacedObject({
      sourceDatabaseId: "logChair",
      originCell: { x: 1, y: 1 },
      size: { width: 1, height: 1 }
    });
    const invalidCandidate = placer.getPlacementCandidate("logChair", { x: 1, y: 1 });
    expect(preview.update(invalidCandidate)).toMatchObject({
      changed: true,
      descriptor: {
        active: true,
        placeableId: "logChair",
        state: "invalid",
        reason: "blocked-or-outside-grid",
        visual: { alpha: 0.42, tint: [1, 0.04, 0.02], tintStrength: 0.82 }
      }
    });

    preview.hide();
    expect(preview.getDescriptor()).toMatchObject({
      active: false,
      state: "invalid"
    });
    preview.destroy();
    expect(preview.getDescriptor()).toBeNull();
    expect(preview.update(validCandidate)).toEqual({
      changed: false,
      descriptor: null
    });
  });

  it("calculates floor box selections in every drag direction", () => {
    const grid = createGridSystem({ cellSize: 1, width: 12, height: 12 });

    const forward = calculateFloorBoxSelection({
      startCell: { x: 1, y: 1 },
      endCell: { x: 4, y: 3 },
      tileSize: { width: 1, height: 1 },
      gridSystem: grid
    });
    expect(forward.origins).toEqual([
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 4, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 4, y: 2 },
      { x: 1, y: 3 },
      { x: 2, y: 3 },
      { x: 3, y: 3 },
      { x: 4, y: 3 }
    ]);

    const reverse = calculateFloorBoxSelection({
      startCell: { x: 4, y: 3 },
      endCell: { x: 1, y: 1 },
      tileSize: { width: 1, height: 1 },
      gridSystem: grid
    });
    expect(reverse.origins).toEqual(forward.origins);
    expect(reverse.startCell).toEqual({ x: 4, y: 3 });
    expect(reverse.endCell).toEqual({ x: 1, y: 1 });

    const largeTile = calculateFloorBoxSelection({
      startCell: { x: 5, y: 5 },
      endCell: { x: 0, y: 0 },
      tileSize: { width: 2, height: 2 },
      gridSystem: grid
    });
    expect(largeTile.origins).toEqual([
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 4, y: 0 },
      { x: 0, y: 2 },
      { x: 2, y: 2 },
      { x: 4, y: 2 },
      { x: 0, y: 4 },
      { x: 2, y: 4 },
      { x: 4, y: 4 }
    ]);
    expect(largeTile.coveredCells).toContainEqual({ x: 5, y: 5 });
  });

  it("runs floor placement as a two-step box selection and places only valid floor tiles", () => {
    const grid = createGridSystem({ cellSize: 1, width: 5, height: 5 });
    const database = createDefaultPlacementDatabase([
      {
        id: "largeFloor",
        name: "Large Floor",
        prefabKey: "largeFloor",
        footprint: { width: 2, height: 2 },
        placementType: "floor",
        buildCategory: "floor"
      }
    ]);
    const store = createOccupancyStore({ gridSystem: grid });
    store.addBlockedFootprint({
      placedObjectId: "rock-blocker",
      sourceDatabaseId: "rock",
      originCell: { x: 2, y: 2 },
      size: { width: 1, height: 1 }
    });
    const placer = createObjectPlacer({
      gridSystem: grid,
      placementDatabase: database,
      occupancyStore: store
    });
    const preview = {
      show: vi.fn(),
      update: vi.fn(),
      hide: vi.fn(),
      destroy: vi.fn()
    };
    const floorState = createFloorPlacementState({
      floorPlaceableId: "largeFloor",
      objectPlacer: placer,
      preview
    });
    const controller = createBuildStateController();

    controller.start(floorState);
    expect(preview.show).toHaveBeenCalledWith({ placeableId: "largeFloor" });

    const startResult = controller.confirm({ x: 0, y: 0 });
    expect(startResult).toMatchObject({
      started: true,
      placed: false,
      selection: {
        origins: [],
        valid: false
      }
    });

    const previewSelection = controller.update({ x: 4, y: 4 });
    expect(previewSelection.origins).toEqual([
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 2 },
      { x: 2, y: 2 }
    ]);
    expect(previewSelection.validCandidates.map((candidate) => candidate.originCell)).toEqual([
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 2 }
    ]);
    expect(previewSelection.invalidCandidates.map((candidate) => candidate.originCell)).toEqual([
      { x: 2, y: 2 }
    ]);

    const placeResult = controller.confirm({ x: 4, y: 4 }, {
      placedObjectId: "floor"
    });
    expect(placeResult.placed).toBe(true);
    expect(placeResult.placedRecords).toHaveLength(3);
    expect(placeResult.rejected.map((candidate) => candidate.originCell)).toEqual([
      { x: 2, y: 2 }
    ]);
    expect(store.getObjectAt({ x: 0, y: 0 })?.sourceDatabaseId).toBe("largeFloor");
    expect(store.getObjectAt({ x: 3, y: 1 })?.sourceDatabaseId).toBe("largeFloor");
    expect(store.getObjectAt({ x: 1, y: 3 })?.sourceDatabaseId).toBe("largeFloor");
    expect(store.getObjectAt({ x: 2, y: 2 })?.sourceDatabaseId).toBe("rock");

    expect(controller.cancel()).toEqual({
      canceled: true,
      stateId: "floor-placement"
    });
    expect(preview.hide).toHaveBeenCalledTimes(1);
    expect(preview.destroy).toHaveBeenCalledTimes(1);
  });

  it("uses deterministic wall edge keys independent of direction", () => {
    expect(wallEdgeKey({ x: 2, y: 1 }, { x: 2, y: 2 })).toBe("2:1|2:2");
    expect(wallEdgeKey({ x: 2, y: 2 }, { x: 2, y: 1 })).toBe("2:1|2:2");
  });

  it("stores wall edges without duplicating the same edge", () => {
    const store = createWallEdgeStore();
    const first = store.addEdge({ x: 0, y: 0 }, { x: 1, y: 0 }, {
      sourceDatabaseId: "woodWall"
    });
    const duplicate = store.addEdge({ x: 1, y: 0 }, { x: 0, y: 0 }, {
      sourceDatabaseId: "woodWall"
    });

    expect(first).toEqual({
      id: "0:0|1:0",
      key: "0:0|1:0",
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
      sourceDatabaseId: "woodWall"
    });
    expect(duplicate).toBe(first);
    expect(store.size).toBe(1);
    expect(store.hasEdge({ x: 1, y: 0 }, { x: 0, y: 0 })).toBe(true);
    expect(store.removeEdge({ x: 0, y: 0 }, { x: 1, y: 0 })).toBe(first);
    expect(store.size).toBe(0);
  });

  it("builds Manhattan wall paths and rejects paths through occupied cells", () => {
    const grid = createGridSystem({ cellSize: 1, width: 8, height: 8 });
    const occupancyStore = createOccupancyStore({ gridSystem: grid });
    const blocker = occupancyStore.addBlockedFootprint({
      placedObjectId: "object-blocker",
      sourceDatabaseId: "largeObject",
      originCell: { x: 2, y: 0 },
      size: { width: 1, height: 1 }
    });

    const blockedPath = buildManhattanWallPath({
      startCell: { x: 0, y: 0 },
      endCell: { x: 3, y: 2 },
      occupancyStore
    });

    expect(blockedPath).toMatchObject({
      startCell: { x: 0, y: 0 },
      endCell: { x: 3, y: 2 },
      vertices: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 3, y: 0 },
        { x: 3, y: 1 },
        { x: 3, y: 2 }
      ],
      edges: [
        { start: { x: 0, y: 0 }, end: { x: 1, y: 0 }, key: "0:0|1:0" },
        { start: { x: 1, y: 0 }, end: { x: 2, y: 0 }, key: "1:0|2:0" },
        { start: { x: 2, y: 0 }, end: { x: 3, y: 0 }, key: "2:0|3:0" },
        { start: { x: 3, y: 0 }, end: { x: 3, y: 1 }, key: "3:0|3:1" },
        { start: { x: 3, y: 1 }, end: { x: 3, y: 2 }, key: "3:1|3:2" }
      ],
      valid: false
    });
    expect(blockedPath.blockedCells).toEqual([
      { cell: { x: 2, y: 0 }, record: blocker }
    ]);

    const clearPath = buildManhattanWallPath({
      startCell: { x: 0, y: 3 },
      endCell: { x: 2, y: 4 },
      occupancyStore
    });
    expect(clearPath.valid).toBe(true);
    expect(clearPath.edges.map((edge) => edge.key)).toEqual([
      "0:3|1:3",
      "1:3|2:3",
      "2:3|2:4"
    ]);
  });

  it("runs wall placement as a two-step path state", () => {
    const grid = createGridSystem({ cellSize: 1, width: 8, height: 8 });
    const occupancyStore = createOccupancyStore({ gridSystem: grid });
    occupancyStore.addBlockedFootprint({
      placedObjectId: "tree-blocker",
      sourceDatabaseId: "tree",
      originCell: { x: 2, y: 0 },
      size: { width: 1, height: 1 }
    });
    const wallEdgeStore = createWallEdgeStore();
    const preview = {
      show: vi.fn(),
      update: vi.fn(),
      hide: vi.fn(),
      destroy: vi.fn()
    };
    const wallState = createWallPlacementState({
      wallEdgeStore,
      occupancyStore,
      preview,
      sourceDatabaseId: "woodWall"
    });
    const controller = createBuildStateController();

    controller.start(wallState);
    expect(preview.show).toHaveBeenCalledWith({ sourceDatabaseId: "woodWall" });
    expect(controller.confirm({ x: 0, y: 0 })).toMatchObject({
      started: true,
      placed: false,
      path: { valid: true, edges: [] }
    });

    const blocked = controller.confirm({ x: 3, y: 0 });
    expect(blocked).toMatchObject({
      started: false,
      placed: false,
      path: { valid: false },
      edges: []
    });
    expect(wallEdgeStore.size).toBe(0);

    const placed = controller.confirm({ x: 0, y: 3 });
    expect(placed).toMatchObject({
      started: false,
      placed: true,
      path: { valid: true }
    });
    expect(placed.edges.map((edge) => edge.key)).toEqual([
      "0:0|0:1",
      "0:1|0:2",
      "0:2|0:3"
    ]);
    expect(wallEdgeStore.size).toBe(3);
    expect(controller.cancel()).toEqual({
      canceled: true,
      stateId: "wall-placement"
    });
    expect(preview.hide).toHaveBeenCalledTimes(1);
    expect(preview.destroy).toHaveBeenCalledTimes(1);
  });

  it("saves and restores placed grid objects through the object placer", () => {
    const grid = createGridSystem({ cellSize: 1, width: 8, height: 8 });
    const database = createDefaultPlacementDatabase();
    const store = createOccupancyStore({ gridSystem: grid });
    const placer = createObjectPlacer({
      gridSystem: grid,
      placementDatabase: database,
      occupancyStore: store
    });

    placer.placeObject("logChair", { x: 1, y: 1 }, {
      placedObjectId: "chair-1"
    });
    placer.placeObject("trainHouse", { x: 3, y: 3 }, {
      placedObjectId: "train-house-1"
    });

    const snapshot = createGridPlacementSaveSnapshot({ occupancyStore: store });
    expect(snapshot).toEqual({
      schemaVersion: 1,
      placedObjects: [
        {
          placedObjectId: "chair-1",
          sourceDatabaseId: "logChair",
          originCell: { x: 1, y: 1 },
          size: { width: 1, height: 1 },
          occupiedCells: [{ x: 1, y: 1 }]
        },
        {
          placedObjectId: "train-house-1",
          sourceDatabaseId: "trainHouse",
          originCell: { x: 3, y: 3 },
          size: { width: 3, height: 3 },
          occupiedCells: [
            { x: 3, y: 3 },
            { x: 4, y: 3 },
            { x: 5, y: 3 },
            { x: 3, y: 4 },
            { x: 4, y: 4 },
            { x: 5, y: 4 },
            { x: 3, y: 5 },
            { x: 4, y: 5 },
            { x: 5, y: 5 }
          ]
        }
      ]
    });

    const restoredStore = createOccupancyStore({ gridSystem: grid });
    const restoredPlacer = createObjectPlacer({
      gridSystem: grid,
      placementDatabase: database,
      occupancyStore: restoredStore
    });
    const restoreResult = restoreGridPlacementSaveSnapshot({
      snapshot,
      objectPlacer: restoredPlacer
    });

    expect(restoreResult.rejected).toEqual([]);
    expect(restoreResult.restored.map((record) => record.placedObjectId)).toEqual([
      "chair-1",
      "train-house-1"
    ]);
    expect(restoredStore.getObjectAt({ x: 1, y: 1 })?.sourceDatabaseId).toBe("logChair");
    expect(restoredStore.getObjectAt({ x: 5, y: 5 })?.sourceDatabaseId).toBe("trainHouse");
  });

  it("migrates legacy placeables into grid records using the current placement database", () => {
    const grid = createGridSystem({
      cellSize: 2,
      origin: { x: -4, y: 0, z: 8 },
      width: 20,
      height: 20
    });
    const database = createDefaultPlacementDatabase();
    const records = migrateLegacyPlaceablesToGridRecords({
      gridSystem: grid,
      placementDatabase: database,
      placeables: {
        strawBed: {
          kind: "solarStation",
          position: [0.2, 0, 12.6],
          size: [0, 0]
        },
        campfire: {
          kind: "trainHouse",
          position: [4.1, 0, 16.3],
          size: [1.7, 1.45]
        },
        leafDen: {
          position: [8, 0, 20],
          size: [2.55, 1.85]
        },
        leafDenFurniture: [
          {
            kind: "logChair",
            position: [10, 0, 22],
            size: [0.8, 0.8]
          }
        ]
      }
    });

    expect(records).toEqual([
      {
        placedObjectId: "legacy-strawBed",
        sourceDatabaseId: "solarStation",
        originCell: { x: 2, y: 2 },
        size: { width: 4, height: 4 },
        legacyKey: "strawBed"
      },
      {
        placedObjectId: "legacy-campfire",
        sourceDatabaseId: "trainHouse",
        originCell: { x: 4, y: 4 },
        size: { width: 3, height: 3 },
        legacyKey: "campfire"
      },
      {
        placedObjectId: "legacy-leafDen",
        sourceDatabaseId: "leafDen",
        originCell: { x: 6, y: 6 },
        size: { width: 3, height: 3 },
        legacyKey: "leafDen"
      },
      {
        placedObjectId: "legacy-logChair-0",
        sourceDatabaseId: "logChair",
        originCell: { x: 7, y: 7 },
        size: { width: 1, height: 1 },
        legacyKey: "logChair"
      }
    ]);
  });

  it("validates placement database entries and rejects duplicate ids", () => {
    const database = createPlacementDatabase([
      {
        id: "solar-station",
        name: "Solar Station",
        prefabKey: "solarStation",
        footprint: { width: 3, height: 3 },
        placementType: "object",
        buildCategory: "workbench"
      },
      {
        id: "leaf-den-kit",
        name: "House Kit",
        prefabKey: "leafDenKit",
        footprint: { width: 2, height: 2 }
      }
    ]);

    expect(database.has("solar-station")).toBe(true);
    expect(database.get("solar-station")).toMatchObject({
      id: "solar-station",
      footprint: { width: 3, height: 3 },
      buildCategory: "workbench"
    });
    expect(database.get("leaf-den-kit")).toMatchObject({
      id: "leaf-den-kit",
      placementType: "object",
      buildCategory: "objects"
    });
    expect(database.list()).toHaveLength(2);
    expect(() => createPlacementDatabase([
      { id: "train-house" },
      { id: "train-house" }
    ])).toThrow(/Duplicate placeable object id/);
  });

  it("exposes initial placeables for workbench objects, leaf den, furniture, and floor", () => {
    const database = createDefaultPlacementDatabase();

    expect(database.list().map((entry) => entry.id)).toEqual([
      "trainHouse",
      "solarStation",
      "leafDenKit",
      "leafDen",
      "logChair",
      "strawBedFurniture",
      "floorPlaceholder"
    ]);
    expect(database.get("trainHouse")).toMatchObject({
      name: "Train House",
      prefabKey: "trainHouseModel",
      placementType: "object",
      buildCategory: "workbench",
      footprint: { width: 3, height: 3 },
      sourceItemId: "campfire"
    });
    expect(database.get("solarStation")).toMatchObject({
      name: "Solar Station",
      prefabKey: "solarStationModel",
      placementType: "object",
      buildCategory: "workbench",
      footprint: { width: 4, height: 4 },
      sourceItemId: "strawBed"
    });
    expect(database.get("leafDenKit")).toMatchObject({
      placementType: "buildingKit",
      footprint: { width: 3, height: 3 },
      sourceItemId: "leafDenKit"
    });
    expect(database.get("floorPlaceholder")).toMatchObject({
      placementType: "floor",
      buildCategory: "floor",
      footprint: { width: 1, height: 1 }
    });
  });

  it("registers multi-cell occupancy and rejects overlapping placement", () => {
    const grid = createGridSystem({ cellSize: 1, width: 6, height: 6 });
    const store = createOccupancyStore({ gridSystem: grid });
    const record = store.addPlacedObject({
      sourceDatabaseId: "train-house",
      originCell: { x: 1, y: 2 },
      size: { width: 2, height: 2 }
    });

    expect(record).toMatchObject({
      sourceDatabaseId: "train-house",
      originCell: { x: 1, y: 2 },
      occupiedCells: [
        { x: 1, y: 2 },
        { x: 2, y: 2 },
        { x: 1, y: 3 },
        { x: 2, y: 3 }
      ]
    });
    expect(store.getObjectAt({ x: 2, y: 3 })).toBe(record);
    expect(store.canPlace({ x: 2, y: 3 }, { width: 1, height: 1 })).toBe(false);
    expect(store.addPlacedObject({
      sourceDatabaseId: "solar-station",
      originCell: { x: 2, y: 3 },
      size: { width: 1, height: 1 }
    })).toBeNull();
    expect(store.canPlace({ x: 5, y: 5 }, { width: 2, height: 1 })).toBe(false);
  });

  it("removes a multi-cell object from any occupied cell", () => {
    const grid = createGridSystem({ cellSize: 1, width: 6, height: 6 });
    const store = createOccupancyStore({ gridSystem: grid });
    const record = store.addPlacedObject({
      sourceDatabaseId: "leaf-den",
      originCell: { x: 3, y: 1 },
      size: { width: 2, height: 2 }
    });

    expect(store.removePlacedObjectAt({ x: 4, y: 2 })).toBe(record);
    expect(store.getObjectAt({ x: 3, y: 1 })).toBeNull();
    expect(store.getObjectAt({ x: 4, y: 2 })).toBeNull();
    expect(store.canPlace({ x: 3, y: 1 }, { width: 2, height: 2 })).toBe(true);
    expect(store.removePlacedObjectAt({ x: 4, y: 2 })).toBeNull();
  });

  it("supports non-removable world blockers and serializes only placed objects", () => {
    const grid = createGridSystem({ cellSize: 1, width: 8, height: 8 });
    const store = createOccupancyStore({ gridSystem: grid });
    const blocker = store.addBlockedFootprint({
      placedObjectId: "mountain-blocker",
      sourceDatabaseId: "mountain",
      originCell: { x: 0, y: 0 },
      size: { width: 3, height: 2 }
    });
    const placed = store.addPlacedObject({
      placedObjectId: "solar-station-1",
      sourceDatabaseId: "solar-station",
      originCell: { x: 4, y: 4 },
      size: { width: 2, height: 2 },
      runtimeEntity: { id: "runtime-only" }
    });

    expect(blocker?.removable).toBe(false);
    expect(store.canPlace({ x: 2, y: 1 }, { width: 1, height: 1 })).toBe(false);
    expect(store.removePlacedObjectAt({ x: 1, y: 1 })).toBeNull();
    expect(store.getObjectAt({ x: 1, y: 1 })).toBe(blocker);
    expect(store.serializePlacedObjects()).toEqual([
      {
        placedObjectId: "solar-station-1",
        sourceDatabaseId: "solar-station",
        originCell: { x: 4, y: 4 },
        size: { width: 2, height: 2 },
        occupiedCells: placed?.occupiedCells
      }
    ]);
  });

  it("places objects through the object placer at the selected cell origin", () => {
    const grid = createGridSystem({
      cellSize: 2,
      origin: { x: -4, y: 0.25, z: 8 },
      width: 10,
      height: 10
    });
    const database = createDefaultPlacementDatabase();
    const store = createOccupancyStore({ gridSystem: grid });
    const spawned = [];
    const placer = createObjectPlacer({
      gridSystem: grid,
      placementDatabase: database,
      occupancyStore: store,
      spawnObject(payload) {
        const entity = {
          id: `${payload.placeable.id}-runtime`,
          prefabKey: payload.placeable.prefabKey,
          position: payload.worldPosition
        };
        spawned.push(payload);
        return entity;
      }
    });

    const result = placer.placeObject("trainHouse", { x: 2, y: 3 }, {
      placedObjectId: "train-house-1"
    });

    expect(result.placed).toBe(true);
    expect(result.candidate.worldPosition).toEqual({ x: 0, y: 0.25, z: 14 });
    expect(result.record).toMatchObject({
      placedObjectId: "train-house-1",
      sourceDatabaseId: "trainHouse",
      originCell: { x: 2, y: 3 },
      size: { width: 3, height: 3 },
      runtimeEntity: {
        id: "trainHouse-runtime",
        prefabKey: "trainHouseModel",
        position: { x: 0, y: 0.25, z: 14 }
      }
    });
    expect(spawned).toHaveLength(1);
    expect(store.getObjectAt({ x: 4, y: 5 })).toBe(result.record);
  });

  it("rejects unknown, blocked, and outside-grid object placement without spawning", () => {
    const grid = createGridSystem({ cellSize: 1, width: 5, height: 5 });
    const database = createDefaultPlacementDatabase();
    const store = createOccupancyStore({ gridSystem: grid });
    const spawnObject = vi.fn();
    const placer = createObjectPlacer({
      gridSystem: grid,
      placementDatabase: database,
      occupancyStore: store,
      spawnObject
    });

    expect(placer.placeObject("missing-object", { x: 0, y: 0 })).toMatchObject({
      placed: false,
      reason: "unknown-placeable"
    });

    expect(placer.placeObject("logChair", { x: 1, y: 1 }).placed).toBe(true);
    expect(placer.placeObject("logChair", { x: 1, y: 1 })).toMatchObject({
      placed: false,
      reason: "blocked-or-outside-grid"
    });
    expect(placer.placeObject("solarStation", { x: 3, y: 3 })).toMatchObject({
      placed: false,
      reason: "blocked-or-outside-grid"
    });
    expect(spawnObject).toHaveBeenCalledTimes(1);
  });

  it("runs placement state through the build state controller", () => {
    const grid = createGridSystem({ cellSize: 1, width: 8, height: 8 });
    const database = createDefaultPlacementDatabase();
    const store = createOccupancyStore({ gridSystem: grid });
    const placer = createObjectPlacer({
      gridSystem: grid,
      placementDatabase: database,
      occupancyStore: store
    });
    const preview = {
      show: vi.fn(),
      update: vi.fn(),
      hide: vi.fn(),
      destroy: vi.fn()
    };
    const overlay = createGridOverlay({ gridSystem: grid });
    const indicator = createCellIndicator({ gridSystem: grid });
    const placementState = createPlacementState({
      placeableId: "logChair",
      objectPlacer: placer,
      preview,
      overlay,
      indicator
    });
    const controller = createBuildStateController();

    controller.start(placementState);
    expect(controller.getActiveStateId()).toBe("placement");
    expect(preview.show).toHaveBeenCalledWith({ placeableId: "logChair" });
    expect(overlay.isVisible()).toBe(true);
    expect(indicator.isVisible()).toBe(true);

    const candidate = controller.update({ x: 2, y: 2 });
    expect(candidate).toMatchObject({
      valid: true,
      placeable: { id: "logChair" },
      originCell: { x: 2, y: 2 }
    });
    expect(indicator.getDescriptor()).toMatchObject({
      originCell: { x: 2, y: 2 },
      footprint: { width: 1, height: 1 },
      state: "valid"
    });
    controller.update({ x: 2, y: 2 });
    expect(preview.update).toHaveBeenCalledTimes(1);

    const placeResult = controller.confirm({ x: 2, y: 2 }, {
      placedObjectId: "chair-1"
    });
    expect(placeResult).toMatchObject({
      placed: true,
      record: {
        placedObjectId: "chair-1",
        sourceDatabaseId: "logChair"
      }
    });
    expect(store.getObjectAt({ x: 2, y: 2 })).toBe(placeResult.record);

    const blockedResult = controller.confirm({ x: 2, y: 2 });
    expect(blockedResult).toMatchObject({
      placed: false,
      reason: "blocked-or-outside-grid"
    });
    expect(preview.update).toHaveBeenCalledTimes(2);
    expect(indicator.getDescriptor()).toMatchObject({
      originCell: { x: 2, y: 2 },
      state: "invalid"
    });

    expect(controller.cancel()).toEqual({
      canceled: true,
      stateId: "placement"
    });
    expect(preview.hide).toHaveBeenCalledTimes(1);
    expect(preview.destroy).toHaveBeenCalledTimes(1);
    expect(overlay.isVisible()).toBe(false);
    expect(indicator.isVisible()).toBe(false);
    expect(controller.getActiveStateId()).toBeNull();
  });

  it("cleans up the previous build state when switching states", () => {
    const controller = createBuildStateController();
    const firstState = {
      id: "first",
      enter: vi.fn(),
      exit: vi.fn()
    };
    const secondState = {
      id: "second",
      enter: vi.fn(),
      exit: vi.fn()
    };

    controller.start(firstState);
    controller.start(secondState);

    expect(firstState.enter).toHaveBeenCalledTimes(1);
    expect(firstState.exit).toHaveBeenCalledTimes(1);
    expect(secondState.enter).toHaveBeenCalledTimes(1);
    expect(controller.getActiveStateId()).toBe("second");
  });

  it("runs removal state without removing non-removable blockers", () => {
    const grid = createGridSystem({ cellSize: 1, width: 8, height: 8 });
    const store = createOccupancyStore({ gridSystem: grid });
    const removedRecords = [];
    const placed = store.addPlacedObject({
      placedObjectId: "leaf-den-1",
      sourceDatabaseId: "leafDen",
      originCell: { x: 2, y: 2 },
      size: { width: 2, height: 2 }
    });
    const blocker = store.addBlockedFootprint({
      placedObjectId: "tree-blocker",
      sourceDatabaseId: "tree",
      originCell: { x: 5, y: 5 },
      size: { width: 1, height: 1 }
    });
    const overlay = createGridOverlay({ gridSystem: grid });
    const indicator = createCellIndicator({ gridSystem: grid });
    const removalState = createRemovalState({
      occupancyStore: store,
      overlay,
      indicator,
      onRemove(record) {
        removedRecords.push(record);
      }
    });
    const controller = createBuildStateController();

    controller.start(removalState);
    expect(overlay.isVisible()).toBe(true);
    expect(indicator.isVisible()).toBe(true);
    expect(controller.update({ x: 3, y: 3 })).toEqual({
      cell: { x: 3, y: 3 },
      record: placed,
      removable: true,
      feedback: "removable"
    });
    expect(indicator.getDescriptor()).toMatchObject({
      originCell: { x: 3, y: 3 },
      footprint: { width: 2, height: 2 },
      state: "valid"
    });
    expect(controller.confirm({ x: 3, y: 3 })).toEqual({
      removed: true,
      record: placed
    });
    expect(removedRecords).toEqual([placed]);
    expect(store.getObjectAt({ x: 2, y: 2 })).toBeNull();

    expect(controller.update({ x: 5, y: 5 })).toEqual({
      cell: { x: 5, y: 5 },
      record: blocker,
      removable: false,
      feedback: "locked"
    });
    expect(indicator.getDescriptor()).toMatchObject({
      originCell: { x: 5, y: 5 },
      state: "invalid"
    });
    expect(controller.confirm({ x: 5, y: 5 })).toEqual({
      removed: false,
      record: null
    });
    expect(store.getObjectAt({ x: 5, y: 5 })).toBe(blocker);
    expect(controller.confirm({ x: 0, y: 0 })).toEqual({
      removed: false,
      record: null
    });
    expect(controller.cancel()).toEqual({
      canceled: true,
      stateId: "removal"
    });
    expect(overlay.isVisible()).toBe(false);
    expect(indicator.isVisible()).toBe(false);
  });
});
