# biome-progression-data Specification

## ADDED Requirements

### Requirement: Macro-Biome Catalog Is Explicit

The game SHALL expose a pure data catalog for the four player-facing macro-biomes.

#### Scenario: Macro-biomes are listed

- **GIVEN** the macro-biome catalog is read
- **WHEN** ids are inspected
- **THEN** it MUST contain exactly `ash-wilds`, `tidefall-coast`,
  `granite-ridge` and `skyforge-spires`.

### Requirement: Intermediate Biomes Unlock In Parallel

The water/beach and ridge/crafting macro-biomes SHALL both depend on the starting
macro-biome token.

#### Scenario: Starting token is earned

- **GIVEN** `root-signal` is complete
- **WHEN** entry requirements are evaluated
- **THEN** `tidefall-coast` and `granite-ridge` MUST both be enterable.

### Requirement: Final Biome Requires Both Intermediate Tokens

The final macro-biome SHALL require both intermediate completion tokens.

#### Scenario: One intermediate token is missing

- **GIVEN** the player has only one of `tide-signal` or `forge-signal`
- **WHEN** `skyforge-spires` entry is evaluated
- **THEN** the final macro-biome MUST remain locked
- **AND** the missing token helper MUST identify the absent token.

### Requirement: Credits Require All Macro-Biome Signals

Credits readiness SHALL require all four macro-biome completion tokens.

#### Scenario: Final signal is missing

- **GIVEN** `root-signal`, `tide-signal` and `forge-signal` are complete
- **WHEN** credits readiness is evaluated
- **THEN** credits MUST not be ready until `sky-signal` is also complete.
