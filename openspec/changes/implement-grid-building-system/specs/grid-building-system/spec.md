# Grid Building System Specification

## ADDED Requirements

### Requirement: Grid Coordinates Are The Source Of Truth

The game MUST use grid cell coordinates as the source of truth for build placement.

#### Scenario: Convert pointer world position to cell

- **GIVEN** the player points at the buildable ground
- **WHEN** the pointer position is resolved to world space
- **THEN** the system MUST convert the world position into a grid cell
- **AND** the selected cell MUST be deterministic
- **AND** the same world position MUST resolve to the same cell until the grid config changes

#### Scenario: Convert cell back to world position

- **GIVEN** a selected grid cell
- **WHEN** the system places or previews an object
- **THEN** the object MUST use the grid cell converted back into world space
- **AND** the object MUST align to the grid origin

#### Scenario: Grid origin moves

- **GIVEN** the grid origin has been moved from world zero
- **WHEN** the player selects a cell
- **THEN** the selected cell, preview, overlay, and placed object MUST remain aligned

### Requirement: Build Mode Shows Grid Visualization

The game MUST show a grid overlay only while the player is in build mode.

#### Scenario: Enter build mode

- **GIVEN** the player enters build mode
- **WHEN** build mode becomes active
- **THEN** the grid overlay MUST become visible
- **AND** the overlay MUST align with the logical grid cells

#### Scenario: Exit build mode

- **GIVEN** the player exits build mode
- **WHEN** no build state is active
- **THEN** the grid overlay MUST be hidden
- **AND** no placement preview MUST remain visible

#### Scenario: Visual style remains consistent

- **GIVEN** the game uses a PSX/pixel-art visual style
- **WHEN** the grid overlay is rendered
- **THEN** the overlay MUST remain subtle
- **AND** it MUST NOT look like a modern editor/debug overlay unless debug mode is enabled

### Requirement: Cell Indicator Snaps To Selected Cell

The game MUST display a cell indicator that snaps to the selected grid cell during placement.

#### Scenario: Pointer moves within same cell

- **GIVEN** the pointer moves inside the currently selected cell
- **WHEN** the resolved grid cell does not change
- **THEN** the cell indicator MUST NOT perform unnecessary updates

#### Scenario: Pointer moves to another cell

- **GIVEN** the pointer moves to a different grid cell
- **WHEN** the selected cell changes
- **THEN** the cell indicator MUST move to the new cell

#### Scenario: Selected object is larger than one cell

- **GIVEN** the selected object has a footprint larger than 1x1
- **WHEN** the object is previewed
- **THEN** the cell indicator MUST scale to the full footprint size

### Requirement: Placement Database Defines Buildable Objects

The game MUST use a placement database to define buildable objects.

#### Scenario: Select build object

- **GIVEN** the player selects a build item by id
- **WHEN** the id exists in the placement database
- **THEN** the system MUST enter placement mode for that object

#### Scenario: Select invalid build object

- **GIVEN** the player selects a build item by id
- **WHEN** the id does not exist in the placement database
- **THEN** the system MUST reject the selection
- **AND** it MUST NOT enter placement mode
- **AND** it SHOULD log a clear development error

#### Scenario: Object has footprint

- **GIVEN** a placeable object exists in the database
- **WHEN** it is loaded by the placement system
- **THEN** it MUST expose its footprint size
- **AND** the footprint MUST be used for preview and occupancy validation

### Requirement: Placement Preview Shows Validity

The game MUST show a non-final preview before placing an object.

#### Scenario: Preview valid placement

- **GIVEN** the selected object can fit in the selected cells
- **WHEN** the preview is shown
- **THEN** the preview MUST use the valid visual state
- **AND** confirming placement MUST create the real object

#### Scenario: Preview invalid placement

- **GIVEN** any target cell is occupied or outside the grid
- **WHEN** the preview is shown
- **THEN** the preview MUST use the invalid visual state
- **AND** confirming placement MUST NOT create the real object

#### Scenario: Switch selected object

- **GIVEN** a preview is currently visible
- **WHEN** the player selects another object
- **THEN** the old preview MUST be destroyed or recycled
- **AND** the new preview MUST match the new object footprint and visual

### Requirement: Occupancy Store Prevents Overlap

The game MUST maintain an occupancy store for all placed objects and known world blockers.

#### Scenario: Place object in empty cells

- **GIVEN** all cells required by the selected object are empty
- **WHEN** the player confirms placement
- **THEN** the object MUST be spawned
- **AND** every occupied cell MUST be registered in the occupancy store

#### Scenario: Place object over occupied cell

- **GIVEN** at least one required cell is already occupied
- **WHEN** the player confirms placement
- **THEN** the system MUST reject placement
- **AND** no object MUST be spawned
- **AND** occupancy data MUST remain unchanged

#### Scenario: Multi-cell object occupies multiple cells

- **GIVEN** an object has a 2x2 footprint
- **WHEN** it is placed at origin cell X
- **THEN** the occupancy store MUST mark all four covered cells
- **AND** querying any covered cell MUST return the same placed object record

#### Scenario: Existing world blocker occupies cells

- **GIVEN** a mountain, tree, building, prop, or legacy placed object already occupies buildable terrain
- **WHEN** the build occupancy store is initialized
- **THEN** its occupied cells MUST be registered as blocked
- **AND** new placement MUST be rejected if it overlaps those cells

### Requirement: Object Placement Uses Grid Origin Alignment

Placed objects MUST align to the grid according to their origin cell.

#### Scenario: Place 1x1 object

- **GIVEN** a 1x1 object is selected
- **WHEN** the player places it
- **THEN** its world position MUST match the selected cell origin

#### Scenario: Place larger object

- **GIVEN** a larger object is selected
- **WHEN** the player places it
- **THEN** its world position MUST match the origin cell
- **AND** its visual footprint MUST cover the same cells registered in occupancy

### Requirement: Removal State Frees Occupied Cells

The game MUST allow previously placed objects to be removed.

#### Scenario: Remove object from origin cell

- **GIVEN** a placed object exists at the selected cell
- **WHEN** the player confirms removal
- **THEN** the object MUST be removed from the scene
- **AND** all cells occupied by that object MUST be freed

#### Scenario: Remove object from non-origin occupied cell

- **GIVEN** a multi-cell object occupies the selected cell
- **WHEN** the player confirms removal from any occupied cell
- **THEN** the whole object MUST be removed
- **AND** all cells occupied by that object MUST be freed

#### Scenario: Remove from empty cell

- **GIVEN** the selected cell has no placed object
- **WHEN** the player confirms removal
- **THEN** the system MUST do nothing
- **AND** it MUST NOT throw an error

### Requirement: Build States Separate Placement And Removal

The game MUST separate build behaviors using explicit build states.

#### Scenario: Placement state active

- **GIVEN** the player selected a placeable object
- **WHEN** placement state is active
- **THEN** confirm input MUST attempt object placement
- **AND** cancel input MUST exit placement state

#### Scenario: Removal state active

- **GIVEN** the player selected remove mode
- **WHEN** removal state is active
- **THEN** confirm input MUST attempt object removal
- **AND** cancel input MUST exit removal state

#### Scenario: Switching states

- **GIVEN** one build state is active
- **WHEN** another build state starts
- **THEN** the previous state MUST clean up its preview, listeners, and temporary visuals
- **AND** only the new state MUST receive build input

### Requirement: Floor Placement Supports Box Selection

The game MUST support rectangular floor placement by selecting a start and end cell.

#### Scenario: Drag floor area

- **GIVEN** floor placement mode is active
- **WHEN** the player selects a start cell and drags to an end cell
- **THEN** the system SHOULD calculate all floor cells inside the rectangle
- **AND** the preview SHOULD show the full selected area

#### Scenario: Drag in reverse direction

- **GIVEN** the player starts at a higher/right cell
- **WHEN** the player drags toward a lower/left cell
- **THEN** the system SHOULD still calculate a valid rectangle
- **AND** floor placement SHOULD not offset away from the first selected cell

#### Scenario: Floor tile has larger footprint

- **GIVEN** the floor tile footprint is larger than 1x1
- **WHEN** the system calculates selected floor positions
- **THEN** it SHOULD step through cells using the tile footprint size
- **AND** it SHOULD only include positions where the full tile fits

### Requirement: Wall Placement Uses Edge Records

The game MUST represent wall placement using edge records when wall placement is enabled.

#### Scenario: Place wall path

- **GIVEN** wall placement mode is active
- **WHEN** the player selects a start cell and an end cell
- **THEN** the system MAY generate a Manhattan-style path
- **AND** the path SHOULD prefer straight room-like segments

#### Scenario: Store wall edge

- **GIVEN** a wall segment exists between two cell vertices
- **WHEN** the wall is registered
- **THEN** the system MAY store the edge using an ordered deterministic key
- **AND** the same edge MUST NOT be duplicated

#### Scenario: Wall intersects occupied object

- **GIVEN** an object blocks the wall path
- **WHEN** the player attempts to place a wall through that object
- **THEN** the wall placement MUST be rejected or clipped before the blocked cell

### Requirement: Pointer Over UI Does Not Build

The game MUST not place or remove objects when the pointer is over UI.

#### Scenario: Click build button

- **GIVEN** the pointer is over a UI button
- **WHEN** the player clicks
- **THEN** the build system MUST treat the click as UI interaction
- **AND** it MUST NOT place or remove an object on the grid

### Requirement: Gamepad Build Controls Use The Same Grid State

The game MUST support gamepad build placement through the same selected cell and build state used by pointer placement.

#### Scenario: Move selected cell with gamepad

- **GIVEN** placement state is active
- **WHEN** the player moves the gamepad cursor
- **THEN** the selected cell MUST update through the grid system
- **AND** the preview and indicator MUST update to that cell

#### Scenario: Confirm and cancel with gamepad

- **GIVEN** a build state is active
- **WHEN** the player presses confirm or cancel
- **THEN** the active build state MUST receive the matching action
- **AND** behavior MUST match pointer confirm/cancel semantics

### Requirement: Placed Grid Objects Persist In Save Data

The game MUST save and restore placed grid objects.

#### Scenario: Save placed grid object

- **GIVEN** the player places a build object on the grid
- **WHEN** the game writes a save point
- **THEN** the placed object id, source database id, origin cell, and occupied cells MUST be saved

#### Scenario: Restore placed grid object

- **GIVEN** save data contains placed grid objects
- **WHEN** the game session boots
- **THEN** each saved grid object MUST be restored through the placement system
- **AND** its occupied cells MUST be registered again

#### Scenario: Load old save with legacy placeables

- **GIVEN** an old save contains legacy Train House, Solar Station, Leaf Den, or furniture placement data
- **WHEN** the grid building system initializes
- **THEN** the game SHOULD migrate or mirror those legacy placeables into occupancy records
- **AND** old saves MUST remain playable

### Requirement: Workbench Objects Use Grid Placement

Workbench-created structures and building kits MUST use the shared grid placement system.

#### Scenario: Place Train House from Workbench

- **GIVEN** the player crafted Train House at the Workbench
- **WHEN** the player starts placement
- **THEN** placement MUST use the grid preview
- **AND** confirmation MUST register Train House in the occupancy store

#### Scenario: Place Solar Station from Workbench

- **GIVEN** the player crafted Solar Station at the Workbench
- **WHEN** the player starts placement
- **THEN** placement MUST use the grid preview
- **AND** confirmation MUST register Solar Station in the occupancy store

#### Scenario: Place Leaf Den Kit

- **GIVEN** the player owns the Leaf Den Kit
- **WHEN** the player starts placement
- **THEN** placement MUST use the grid preview
- **AND** confirmation MUST register Leaf Den Kit in the occupancy store

### Requirement: Build Mode Is Re-Entrant

The player MUST be able to enter and exit build mode repeatedly without stale state.

#### Scenario: Enter and exit repeatedly

- **GIVEN** the player enters and exits build mode multiple times
- **WHEN** each mode exits
- **THEN** previews MUST be cleaned up
- **AND** event listeners MUST not accumulate
- **AND** the next build mode session MUST behave normally
