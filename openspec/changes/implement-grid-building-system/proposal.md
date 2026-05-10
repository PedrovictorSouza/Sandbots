# Change: implement-grid-building-system

## Summary

Implement a grid-based building system for the game, allowing the player to select cells, preview placement, place objects, place floor areas, optionally place walls along paths, and remove previously placed structures.

This system must be adapted to our current WebGL/PSX-style game architecture. Do not copy Unity-specific APIs directly. Use the referenced Unity workflow only as a conceptual model.

## Problem

The game needs a reliable construction layer where objects can be placed intentionally on a fixed grid instead of being positioned freely in world space.

Right now, object placement risks becoming inconsistent because there is no unified system for:

- converting pointer position into grid cells;
- visualizing the current build grid;
- previewing what will be placed;
- validating whether a cell is occupied;
- supporting multi-cell objects;
- storing placed objects for deletion, saving, and rebuilding;
- separating placement behavior from removal behavior.

## Goals

- Add a grid system with world-to-cell and cell-to-world conversion.
- Add grid visualization that appears only during build mode.
- Add a cursor/cell indicator that snaps to the selected grid cell.
- Add object placement using a database of placeable items.
- Add preview objects with valid/invalid placement feedback.
- Prevent invalid placement on occupied cells.
- Support objects larger than 1x1 cells.
- Store placed objects in a grid occupancy registry.
- Allow placed objects to be removed.
- Structure the system using explicit build states, such as placement state and removal state.
- Keep the system compatible with the game's fixed-resolution PSX/pixel-art presentation.

## Non-Goals

- Do not implement full Sims-like house building polish in this change.
- Do not implement inventory costs yet.
- Do not introduce Unity-specific dependencies.
- Do not make the game responsive or change the existing camera/rendering strategy.
- Do not redesign the HUD beyond the minimum controls needed for build mode.

## Design Notes

The system should be split into small modules:

- `GridSystem`
- `GridInput`
- `GridOverlay`
- `PlacementDatabase`
- `PlacementPreview`
- `OccupancyStore`
- `ObjectPlacer`
- `BuildStateController`
- `PlacementState`
- `RemovalState`

The grid should be the single source of truth for build placement. Visuals, preview, validation, removal, and persistence should all use the same cell coordinates.

The first playable integration should replace current placement flows for Workbench objects, Solar Station, Train House, and Leaf Den with the shared grid placement system, while preserving current PSX camera, fixed stage scale, and existing interaction feel.

## Expected Result

When the player enters build mode, the grid appears over the playable ground. Moving the pointer or gamepad cursor highlights the nearest valid grid cell. Selecting a build item shows a transparent preview. If the target cells are free, the preview appears valid. If blocked, the preview appears invalid. Confirming places the object only when valid. Cancel exits placement. Switching to remove mode lets the player delete existing placed objects from the grid.
