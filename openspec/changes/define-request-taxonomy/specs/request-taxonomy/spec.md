# request-taxonomy Specification

## ADDED Requirements

### Requirement: Request Kinds Are Explicit

Every future request definition SHALL declare one canonical request kind.

Allowed kinds are `important`, `general`, `tutorial`, `optional` and `debug`.

#### Scenario: Request is added

- **GIVEN** a future request is added to a quest or request catalog
- **WHEN** the request is reviewed
- **THEN** it MUST declare one allowed kind
- **AND** the kind MUST determine default progression impact.

### Requirement: Credits Blockers Are Restricted

Only requests that are explicitly allowed to block credits SHALL be included in
credits readiness.

#### Scenario: Important request is credits relevant

- **GIVEN** a request is classified as `important`
- **WHEN** it is marked as credits relevant
- **THEN** it MAY block credits
- **AND** it MUST expose missing-goal guidance and completion state.

#### Scenario: General request is skipped

- **GIVEN** a request is classified as `general`
- **WHEN** the player skips it
- **THEN** credits readiness MUST NOT depend on it unless a later spec promotes it
  to `important`.

#### Scenario: Optional or debug request exists

- **GIVEN** a request is classified as `optional` or `debug`
- **WHEN** credits readiness is evaluated
- **THEN** the request MUST NOT count as required.

### Requirement: Planned Requests Do Not Block Progress

Requests with placeholder state `planned` SHALL stay out of required macro-biome
completion and credits readiness.

#### Scenario: Planned important request is cataloged

- **GIVEN** a future important request is known but not playable
- **WHEN** it is marked as `planned`
- **THEN** it MUST NOT block credits or macro-biome completion
- **AND** it MUST be promoted to prototype or final with tests before it can block
  progression.

### Requirement: Required Requests Map To Story Context

Every required request SHALL map to one macro-biome and one character arc unless it
is explicitly global.

#### Scenario: Required request is reviewed

- **GIVEN** a request may block macro-biome completion or credits
- **WHEN** its metadata is inspected
- **THEN** it MUST define macro-biome id or `global`
- **AND** it MUST define character arc id or `system`.

### Requirement: Token-Granting Requests Are Important

Any request that grants a required macro-biome completion token SHALL be important.

#### Scenario: Request grants completion token

- **GIVEN** a request grants `root-signal`, `tide-signal`, `forge-signal` or
  `sky-signal`
- **WHEN** the request metadata is validated
- **THEN** its kind MUST be `important`
- **AND** it MUST not be marked `planned`.
