# rendering-atmosphere Specification

## ADDED Requirements

### Requirement: PSX Distance Fog

The game MUST support a configurable PSX-style distance fog effect for world
rendering.

#### Scenario: Fog fades distant world geometry

- **GIVEN** the player is in a fog-enabled scene
- **WHEN** the world is rendered
- **THEN** nearby geometry MUST remain mostly clear
- **AND** mid-distance geometry SHOULD begin blending into the fog
- **AND** far-distance geometry MUST fade heavily into the fog
- **AND** distant geometry MUST NOT pop abruptly in or out

### Requirement: Fog Preserves Gameplay Readability

The fog MUST not hide information required for normal play.

#### Scenario: Important gameplay elements remain readable

- **GIVEN** the fog is active during gameplay
- **WHEN** the player approaches a gameplay-critical object
- **THEN** the player character MUST remain readable
- **AND** active NPCs MUST remain readable
- **AND** objective markers MUST remain readable
- **AND** interaction prompts MUST remain readable
- **AND** valid ability targets MUST remain readable

### Requirement: Fog Does Not Affect UI

The fog MUST apply to the rendered world only, not to interface layers.

#### Scenario: HUD remains clear

- **GIVEN** the fog is active
- **WHEN** the HUD, dialogue UI, quest tracker, prompts, or menus are visible
- **THEN** these UI elements MUST remain visually unaffected by fog
- **AND** their contrast MUST remain at least as readable as before the fog
  change

### Requirement: Fog Is Scene Tunable

Fog settings MUST be configurable per scene or preset.

#### Scenario: Scene chooses fog preset

- **GIVEN** a scene is loaded
- **WHEN** the scene has a fog preset configured
- **THEN** the renderer MUST use that preset
- **AND** the preset SHOULD define enabled, color, near distance, far distance,
  and intensity
- **AND** scenes without a fog preset SHOULD fall back to the default gameplay
  fog settings

### Requirement: Fog Matches Retro PSX Direction

The fog MUST feel like a stylized PSX-era distance fog rather than modern
volumetric fog.

#### Scenario: Fog reads as retro

- **GIVEN** the player moves the camera through a fog-enabled area
- **WHEN** distant objects fade into the environment
- **THEN** the effect SHOULD look simple, dense, and stylized
- **AND** it SHOULD support the low-poly/PSX presentation
- **AND** it SHOULD NOT rely on expensive volumetric lighting

### Requirement: Fog Supports Small Island Tone

The fog MUST support mystery and atmosphere without overriding the cozy
reconstruction identity.

#### Scenario: Fog is atmospheric but not oppressive

- **GIVEN** the player explores the island
- **WHEN** default gameplay fog is active
- **THEN** the world SHOULD feel more atmospheric and retro
- **AND** it SHOULD NOT feel like a full horror-mode visual rewrite
- **AND** it SHOULD preserve the practical, readable, playful tone of the game

### Requirement: Fog Values Are Stable And Testable

Fog tuning MUST use named values or data-driven configuration.

#### Scenario: Fog constants are inspectable

- **GIVEN** fog is implemented
- **WHEN** a developer reviews the fog configuration
- **THEN** fog color, near distance, far distance, and intensity MUST be defined
  in named constants or data objects
- **AND** these values MUST NOT be hidden as unexplained magic numbers inside
  render logic
