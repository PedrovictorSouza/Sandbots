# Tasks

## 1. Grid Foundation

- [x] Create `GridSystem`.
- [x] Add grid config:
  - [x] cell size;
  - [x] grid origin;
  - [x] grid width;
  - [x] grid height;
  - [x] optional visual offset above ground.
- [x] Implement `worldToCell(worldPosition)`.
- [x] Implement `cellToWorld(cellPosition)`.
- [x] Implement `isInsideGrid(cellPosition)`.
- [x] Ensure the grid works even if the grid origin is moved.

## 2. Pointer And Gamepad To Grid Detection

- [x] Create `GridInput`.
- [x] Convert screen/pointer position into a world-space hit point on the build plane.
- [x] Convert that world-space point into a grid cell.
- [x] Support gamepad cursor movement on the same selected cell model.
- [x] Cache the last valid selected cell.
- [x] Ignore pointer interaction when the pointer is over UI.
- [x] Emit events for:
  - [x] primary action;
  - [x] cancel/exit;
  - [x] selected cell changed.

## 3. Grid Visualization

- [x] Create `GridOverlay`.
- [x] Render a visible grid over the buildable ground only during build mode.
- [x] Keep the overlay aligned with `GridSystem`.
- [x] Support configurable:
  - [x] line thickness;
  - [x] opacity;
  - [x] color;
  - [x] cell size;
  - [x] grid offset.
- [x] Ensure the grid overlay does not break the existing PSX/pixel-art look.

## 4. Cell Indicator

- [x] Create a snapped cell indicator.
- [x] Move the indicator only when selected cell changes.
- [x] Scale the indicator to match the selected object footprint.
- [x] Hide the indicator outside build mode.
- [x] Show invalid state when placement is blocked.

## 5. Placement Database

- [x] Create `PlacementDatabase`.
- [x] Define `PlaceableObjectData` with:
  - [x] id;
  - [x] name;
  - [x] prefab/entity key;
  - [x] footprint size;
  - [x] placement type;
  - [x] optional rotation rules;
  - [x] optional build category.
- [x] Add initial entries for:
  - [x] Solar Station;
  - [x] Train House;
  - [x] Leaf Den Kit;
  - [x] Leaf Den;
  - [x] furniture;
  - [x] floor placeholder.
- [x] Validate that object IDs are unique.

## 6. Occupancy Store

- [x] Create `OccupancyStore`.
- [x] Track occupied cells using a deterministic key format.
- [x] Store placed object data:
  - [x] placed object id;
  - [x] source database id;
  - [x] origin cell;
  - [x] occupied cells;
  - [x] runtime entity reference.
- [x] Implement `canPlace(originCell, size)`.
- [x] Implement `addPlacedObject(record)`.
- [x] Implement `removePlacedObjectAt(cell)`.
- [x] Implement `getObjectAt(cell)`.
- [x] Ensure multi-cell objects occupy every cell in their footprint.
- [x] Support pre-registering existing world blockers such as mountains, trees, buildings, props, and legacy placed objects.

## 7. Object Placement

- [x] Create `ObjectPlacer`.
- [x] Instantiate/spawn the selected object at `cellToWorld(originCell)`.
- [x] Align object origin to bottom-left/grid-origin placement.
- [x] Return a placed object record/index.
- [x] Register occupied cells in `OccupancyStore`.
- [x] Prevent placement when cells are occupied or outside grid bounds.

## 8. Placement Preview

- [x] Create `PlacementPreview`.
- [x] Spawn a non-interactive preview of the selected object.
- [x] Apply transparent/ghost material or visual treatment.
- [x] Use one visual state for valid placement.
- [x] Use another visual state for invalid placement.
- [x] Update preview position only when selected cell changes.
- [x] Destroy/hide preview when placement mode ends.
- [x] Preview must not be registered as an actual placed object.

## 9. Placement State

- [x] Create `BuildStateController`.
- [x] Create an interface/protocol for build states:
  - [x] `enter()`;
  - [x] `exit()`;
  - [x] `update(cell)`;
  - [x] `confirm(cell)`;
  - [x] `cancel()`.
- [x] Create `PlacementState`.
- [x] Start placement state when player selects a placeable object.
- [x] Show grid overlay, preview, and cell indicator.
- [x] On confirm, place object only if valid.
- [x] On cancel, clear preview and leave build mode.

## 10. Removal State

- [x] Create `RemovalState`.
- [x] Show grid overlay and cell indicator.
- [x] Detect placed object under selected cell.
- [x] Show removable feedback when an object exists.
- [x] On confirm, remove the object and free all occupied cells.
- [x] Do not remove objects that were not registered through `OccupancyStore`.

## 11. Floor Box Selection

- [x] Add floor placement mode.
- [x] On first click, store start cell.
- [x] On pointer move, calculate rectangular selection from start cell to current cell.
- [x] Respect floor tile size.
- [x] Preview all cells that will receive floor placement.
- [x] On confirm, place floor tiles only in valid cells.
- [x] Support dragging in all directions without offset errors.

## 12. Optional Wall Path Placement

- [x] Add wall placement mode only if current architecture can support it cleanly.
- [x] Represent wall occupancy as edges between cells, not normal cell occupancy.
- [x] Create deterministic edge keys using ordered vertices.
- [x] Generate wall paths using Manhattan-style paths.
- [x] Avoid diagonal/organic paths that do not feel room-like.
- [x] Prevent walls from passing through blocked object cells.
- [x] Allow wall-adjacent object rules later.

## 13. Persistence

- [x] Add placed grid object records to the existing save format.
- [x] Restore placed grid objects on session boot.
- [x] Preserve compatibility with existing save fields for Train House, Solar Station, Leaf Den, and furniture while migrating their placement to grid records.
- [x] Add migration/default behavior for old saves with legacy placeable flags.

## 14. Integration With Game UI

- [ ] Add temporary build controls to existing HUD or debug menu.
- [ ] Allow selecting:
  - [ ] floor;
  - [ ] object;
  - [ ] remove mode.
- [ ] Connect Workbench recipes to the shared grid placement mode.
- [ ] Replace current placement flows for Solar Station, Train House, and Leaf Den with grid placement.
- [ ] Do not redesign the main game HUD in this change.
- [ ] Do not make the build UI visually final unless already easy to do.

## 15. Testing

- [x] Test pointer-to-cell snapping.
- [x] Test gamepad cell movement.
- [x] Test placement on empty cell.
- [x] Test blocked placement on occupied cell.
- [x] Test blocked placement on existing world blockers.
- [x] Test multi-cell object placement.
- [x] Test removing multi-cell object from any occupied cell.
- [x] Test grid origin offset.
- [x] Test canceling placement.
- [x] Test pointer over UI does not place object.
- [x] Test preview cleanup when switching modes.
- [x] Test floor box selection in all drag directions.
- [x] Test save and restore of placed grid objects.

## 16. Validation

- [x] Run project lint/build/typecheck.
- [ ] Run existing game smoke test.
- [ ] Confirm no regression in normal gameplay mode.
- [ ] Confirm build mode can be entered and exited repeatedly.
