# ending-post-story Specification

## ADDED Requirements

### Requirement: Credits Trigger Only From Final Readiness

Credits SHALL trigger only after all required macro-biome signals are present and
the final interaction is performed.

#### Scenario: Required goals are missing

- **GIVEN** one or more required macro-biome signals are missing
- **WHEN** the player reaches or attempts the final interaction
- **THEN** credits MUST NOT play
- **AND** UI or mentor feedback MUST name the missing required goals.

#### Scenario: Final interaction is ready

- **GIVEN** all required macro-biome signals are present
- **WHEN** the player performs the final Skyforge Beacon interaction
- **THEN** credits playback MAY start
- **AND** the final completion flag MUST be set exactly once.

### Requirement: Missing-Goal Feedback Is Presenter-Owned

Missing-goal feedback SHALL be derived from final readiness state and rendered by a
presenter, not owned by input or low-level runtime handlers.

#### Scenario: Mentor reminder is requested

- **GIVEN** the player asks for final guidance
- **WHEN** final readiness has missing goals
- **THEN** the presenter MUST name each missing macro-biome signal
- **AND** quest state MUST remain unchanged.

#### Scenario: Final readiness is complete

- **GIVEN** all final goals are complete
- **WHEN** final guidance is requested
- **THEN** the presenter MUST point the player to the final interaction
- **AND** it MUST NOT trigger credits without the final interaction.

### Requirement: Credits Playback Transitions To Post-Story

Credits playback SHALL transition to a persistent post-story sandbox state.

#### Scenario: Credits finish

- **GIVEN** credits playback has completed
- **WHEN** final completion is recorded
- **THEN** the game MUST enter post-story sandbox state
- **AND** the final completion flag MUST remain set.

#### Scenario: Player returns after credits

- **GIVEN** the final completion flag is set
- **WHEN** the player returns to gameplay
- **THEN** the island MUST remain playable
- **AND** optional requests, habitats, collection, decorating and exploration MUST
  remain available where their own unlock rules allow them.

### Requirement: Optional Content Does Not Block Credits

General requests, optional requests, decorative recipes, rare post-story recipes and
post-story collectibles SHALL not block credits unless a future spec explicitly
promotes them into required important content.

#### Scenario: Optional content is incomplete

- **GIVEN** all required macro-biome signals are present
- **AND** optional requests or decorative recipes remain incomplete
- **WHEN** final readiness is evaluated
- **THEN** credits readiness MUST still pass.

### Requirement: Final Completion Has A Scripted Smoke Path

The ending implementation SHALL include a smoke test or scripted state path that
reaches final completion without requiring manual playthrough.

#### Scenario: Smoke reaches completion

- **GIVEN** scripted state marks all required macro-biome signals complete
- **WHEN** the final interaction flow runs
- **THEN** the smoke test MUST observe credits readiness, final completion flag and
  post-story sandbox availability.

### Requirement: High-Risk Systems Stay Out Of This Slice

This slice SHALL not change camera, stage, render frame, input ownership, scene
flow or runtime boot unless a separate high-risk spec covers that presentation work.

#### Scenario: Credits presentation needs high-risk changes

- **GIVEN** credits or ending presentation appears to need camera, stage,
  render-frame, input or scene-flow changes
- **WHEN** the implementation scope is reviewed
- **THEN** that work MUST be split into a separate high-risk spec
- **AND** this slice MUST remain focused on readiness state, final interaction,
  presenters, completion state and smoke verification.
