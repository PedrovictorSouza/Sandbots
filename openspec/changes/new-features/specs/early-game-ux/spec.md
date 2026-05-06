# early-game-ux Specification

## ADDED Requirements

### Requirement: Autosave Occurs At Key Progression Points

The game SHALL autosave automatically at important progression points during the
early game.

#### Scenario: Main task completes

- **GIVEN** the player completes a main task
- **WHEN** the quest/progression state records completion
- **THEN** an autosave MUST be requested.

#### Scenario: New ability is learned

- **GIVEN** the player earns a new ability
- **WHEN** the ability becomes available in player state
- **THEN** an autosave MUST be requested once for that unlock.

#### Scenario: Robot is reactivated

- **GIVEN** a dormant helper robot is repaired or reactivated
- **WHEN** the robot becomes available to the player
- **THEN** an autosave MUST be requested.

#### Scenario: Required first use completes

- **GIVEN** the player is asked to perform a required first use of an ability
- **WHEN** that first use objective completes
- **THEN** an autosave MUST be requested.

#### Scenario: Player name is confirmed

- **GIVEN** the name-entry screen is open
- **WHEN** the player confirms a valid name
- **THEN** the name MUST be persisted in player profile state
- **AND** an autosave MUST be requested.

#### Scenario: Major system unlocks

- **GIVEN** a major system such as FieldDex, Settings or the first station
  becomes available
- **WHEN** the unlock flag is recorded
- **THEN** an autosave MUST be requested.

### Requirement: Autosave Indicator Is Visible And Non-Blocking

The game SHALL show a discreet autosave indicator when autosave is in progress.

#### Scenario: Autosave starts

- **GIVEN** an autosave request begins
- **WHEN** the HUD is visible
- **THEN** the upper-left area MUST show the text `Saving...`
- **AND** the indicator MUST NOT block player movement or dialogue progression.

#### Scenario: Multiple autosave events occur close together

- **GIVEN** two autosave-worthy events occur close together
- **WHEN** the first autosave indicator is already visible
- **THEN** the indicator MAY remain visible or refresh its duration
- **AND** duplicate saves MUST NOT corrupt the saved state.

### Requirement: First Chopper Interaction Uses A One-Shot Cinematic Transition

The first Chopper conversation SHALL be preceded by a one-shot fade and camera
framing transition.

#### Scenario: Player reaches first Chopper dialogue

- **GIVEN** a new game has not yet played the first Chopper cinematic
- **WHEN** the player reaches the first Chopper interaction
- **THEN** the game MUST fade out to black
- **AND** reposition the camera for the Chopper/player scene
- **AND** fade in before opening the first dialogue line.

#### Scenario: First Chopper cinematic has already played

- **GIVEN** the first Chopper cinematic flag is already complete
- **WHEN** the player talks to Chopper again
- **THEN** the normal interaction flow MUST run without replaying that cinematic.

### Requirement: FieldDex Is Discovered Through Story

FieldDex/Pokedex SHALL be introduced as an in-world discovery before becoming a
normal player system.

#### Scenario: FieldDex is discovered

- **GIVEN** the player reaches the FieldDex discovery beat
- **WHEN** Chopper or the world event identifies the device
- **THEN** the FieldDex unlock flag MUST be recorded
- **AND** the player MAY receive a short control hint.

#### Scenario: FieldDex is not discovered yet

- **GIVEN** the FieldDex unlock flag is not recorded
- **WHEN** the player presses the FieldDex control
- **THEN** the game MUST keep the system unavailable or show contextual locked
  feedback
- **AND** it MUST NOT open the full FieldDex interface.

### Requirement: Player Name Is Chosen During First Chopper Dialogue

The game SHALL ask the player's name during the first Chopper interaction and use
that name in later NPC dialogue.

#### Scenario: Chopper asks for the player name

- **GIVEN** the first Chopper dialogue reaches the identity beat
- **WHEN** Chopper asks for the player's name
- **THEN** a traditional virtual keyboard input screen MUST open.

#### Scenario: Player confirms a name

- **GIVEN** the virtual keyboard is open
- **WHEN** the player enters and confirms a valid name
- **THEN** the name MUST be stored in profile/progression state
- **AND** later NPC copy that addresses the player MUST use the confirmed name.

#### Scenario: No confirmed name exists

- **GIVEN** dialogue copy asks for the player display name
- **WHEN** no confirmed name exists
- **THEN** the dialogue MUST use a safe fallback label instead of rendering an
  empty or placeholder token.

### Requirement: Settings Are Available From The Start

Settings SHALL be accessible from Select at the beginning of the game.

#### Scenario: Player presses Select before tutorial completion

- **GIVEN** the player has control in the opening
- **WHEN** the player presses Select
- **THEN** the Settings menu MUST open.

#### Scenario: Settings menu opens

- **GIVEN** the Settings menu is open
- **WHEN** settings are rendered
- **THEN** the menu MUST be structured for camera, volume, language and
  accessibility settings
- **AND** unimplemented options MAY be disabled or represented by safe defaults.

#### Scenario: Settings are changed

- **GIVEN** an implemented setting is changed
- **WHEN** the player closes Settings
- **THEN** the selected value MUST be stored in settings state
- **AND** future sessions SHOULD restore that value when persistence is available.

### Requirement: First Required Action Allows A Short Freedom Window

After the first required taught action completes, the game SHALL allow a short
window of same-system experimentation before pushing the next tutorial step.

#### Scenario: Required count is reached

- **GIVEN** the first taught action requires a target count
- **WHEN** the player reaches that required count
- **THEN** the game MUST mark the required action complete
- **AND** start a small freedom window before forcing the next tutorial step.

#### Scenario: Player keeps experimenting

- **GIVEN** the freedom window is active
- **WHEN** the player performs more of the same action
- **THEN** the game MUST allow the action if the target is valid
- **AND** it MUST NOT immediately interrupt with the next system.

#### Scenario: Freedom window ends

- **GIVEN** the freedom window is active
- **WHEN** the window expires or the player checks in with Chopper
- **THEN** the next tutorial or story step MUST become available.

### Requirement: Helper Robots Are Reactivated, Not Spawned Magically

Early helper robots SHALL become available through detection, discovery, repair
or reactivation beats.

#### Scenario: Dormant robot is detected

- **GIVEN** a helper robot is part of early-game progression
- **WHEN** the player reaches its discovery beat
- **THEN** the game MUST present a signal, damaged unit, old infrastructure clue
  or Chopper detection event.

#### Scenario: Robot becomes available

- **GIVEN** the player completes the robot's repair or reactivation requirement
- **WHEN** the helper robot becomes active
- **THEN** the robot availability MUST be tied to explicit reactivation state
- **AND** the player MUST receive visual, dialogue or task feedback.

#### Scenario: Robot reward is revisited

- **GIVEN** a helper robot has already been reactivated
- **WHEN** the player revisits the related dialogue or task
- **THEN** the robot MUST remain available
- **AND** duplicate reactivation rewards MUST NOT be granted.

### Requirement: High-Risk Systems Are Implemented In Focused Slices

This feature package SHALL be split when implementation touches high-risk game
systems.

#### Scenario: Feature implementation expands across systems

- **GIVEN** an implementation step needs camera, input, stage, render frame,
  scene-flow, persistence format or runtime boot changes
- **WHEN** the scope is reviewed
- **THEN** the change MUST be reduced to a focused slice with targeted tests
- **AND** unrelated early-game features MUST remain out of that coding pass.

