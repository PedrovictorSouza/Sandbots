# motion-readability Specification

## ADDED Requirements

### Requirement: Motion Impact Presets Are Data-Driven

The game SHALL define short motion impact reactions as named data presets.

#### Scenario: Water Gun impact preset exists

- **GIVEN** motion readability presets are loaded
- **WHEN** the Water Gun hit preset is requested
- **THEN** the system MUST return a preset with duration, freeze, anticipation
  and recovery timings
- **AND** it MUST include position jolt, rotation jolt, scale pulse, blend and
  silhouette metadata.

#### Scenario: Preset values are owned by named constants

- **GIVEN** a preset is added or adjusted
- **WHEN** timing or intensity values are changed
- **THEN** those values MUST be represented by named constants in the motion
  preset ownership area.

### Requirement: Motion Impact Controller Uses Delta Time

The game SHALL update motion impact reactions through delta time rather than
frame counts.

#### Scenario: Impact starts

- **GIVEN** a valid target id and preset id
- **WHEN** the controller triggers the reaction
- **THEN** the first frame MUST use the extreme impact pose.

#### Scenario: Impact freeze window is active

- **GIVEN** a reaction has just triggered
- **WHEN** elapsed time is within the preset freeze window
- **THEN** the reaction MUST remain in the extreme impact pose.

#### Scenario: Impact recovers

- **GIVEN** a reaction is past the freeze window
- **WHEN** the controller advances by delta time
- **THEN** position, rotation and scale offsets MUST move toward idle.

#### Scenario: Impact ends

- **GIVEN** a reaction reaches its duration
- **WHEN** the controller updates
- **THEN** the frame MUST return to idle offsets.

### Requirement: Motion Layer Does Not Own Gameplay Objects

The motion impact layer SHALL avoid direct gameplay-object mutation.

#### Scenario: Target has an adapter

- **GIVEN** a target exposes `applyMotionImpact(frame)`
- **WHEN** the controller triggers or updates a reaction
- **THEN** it MAY call that adapter with the computed frame.

#### Scenario: Target stores gameplay position

- **GIVEN** a target object has gameplay position or state fields
- **WHEN** a motion impact reaction updates
- **THEN** the motion layer MUST NOT directly mutate those gameplay fields.

### Requirement: Unknown Presets Fail Safely

The controller SHALL ignore unsupported preset ids.

#### Scenario: Unknown preset is triggered

- **GIVEN** a caller requests a missing preset id
- **WHEN** the controller attempts to trigger the reaction
- **THEN** it MUST return no frame
- **AND** it MUST NOT throw.
