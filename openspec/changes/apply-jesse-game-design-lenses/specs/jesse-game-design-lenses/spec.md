# jesse-game-design-lenses Specification

## ADDED Requirements

### Requirement: Objectives Must Communicate Consequence

Early objectives SHALL tell the player what they are doing and why it matters to
the colony, planet, bot, tool or habitat.

#### Scenario: Player receives an early objective

- **GIVEN** an objective is shown in the HUD during the first playable arc
- **WHEN** the objective includes a subtitle or hint
- **THEN** the text SHOULD communicate a consequence, benefit, mystery or next
  system
- **AND** it MUST NOT merely duplicate the title unless no subtitle is shown.

### Requirement: Important Inputs Must Respond

Required early-game inputs SHALL either perform the expected action or explain
why the action cannot happen yet.

#### Scenario: Player presses an expected action button near a relevant target

- **GIVEN** the player is near an object, bot, workbench, target tile or
  placement preview
- **WHEN** they press a logical action such as interact, confirm, cancel, place
  or use tool
- **THEN** the game SHOULD respond with action, blocked-state feedback or a
  short contextual hint
- **AND** it SHOULD avoid silent failure for required tutorial interactions.

### Requirement: First Uses Must Teach By Doing

New required abilities, tools and workbench protocols SHALL be introduced through
a small playable use before asking for mastery.

#### Scenario: A required ability is unlocked

- **GIVEN** the player unlocks a new required ability or tool
- **WHEN** the first-use objective begins
- **THEN** the game SHOULD provide a visible target
- **AND** a clear prompt
- **AND** a safe failure message or fallback
- **AND** visible feedback when the action succeeds
- **AND** a next hook that explains why the ability matters.

### Requirement: Rewards Must Match Deeds

Gameplay rewards SHALL be proportional to the action's importance.

#### Scenario: Player completes a milestone

- **GIVEN** the player completes a meaningful action such as waking a bot,
  restoring a system, placing a habitat or finishing an errand
- **WHEN** the game resolves the action
- **THEN** the result SHOULD include a visible world, audio, HUD, dialogue or
  progression response proportional to the accomplishment
- **AND** small repeated actions SHOULD receive smaller feedback than major
  milestones.

### Requirement: Help Must Preserve Player Dignity

The game SHALL guide confused players with gentle, contextual assistance instead
of punitive or humiliating failure language.

#### Scenario: Player attempts an action too early

- **GIVEN** the player presses the expected button near a target before meeting
  the requirement
- **WHEN** the action is blocked
- **THEN** the game SHOULD explain the missing condition in world terms
- **AND** it SHOULD not shame, rank, mock or over-punish the player.

### Requirement: Errands Must Earn Travel Time

Collection, delivery, repair, scan and activation objectives SHALL avoid empty
travel by providing curiosity, micro-progress, visible result or fast
resolution.

#### Scenario: Player receives a travel objective

- **GIVEN** a task sends the player away from the base or current interaction
- **WHEN** the task appears
- **THEN** it SHOULD include a hook, practical benefit, contradiction, risk or
  joke
- **AND** it SHOULD include at least one micro-event, visible reward, choice,
  shortcut, radio completion or immediate next beat.

### Requirement: Dialogue Lines Must Have A Job

Structured dialogue, prompts and instructional copy SHALL avoid throwaway lines.

#### Scenario: A new structured dialogue line is added

- **GIVEN** a dialogue line, bark, prompt, notification or objective copy is
  added to structured content
- **WHEN** the line is reviewed or validated
- **THEN** it SHOULD serve at least one function: instruction, world detail,
  character, relationship, plot, joke, feedback or hint
- **AND** purely filler lines SHOULD be rewritten, removed or left out.

### Requirement: Abilities Must Have Strengths And Limits

Bot abilities SHALL remain distinct by benefit, target type, limit, timing,
range, cost, feedback or synergy.

#### Scenario: A bot ability is defined

- **GIVEN** an ability is available or planned
- **WHEN** its design data is reviewed
- **THEN** it SHOULD declare a benefit
- **AND** a limit
- **AND** a valid target type
- **AND** first-use guidance
- **AND** feedback identity
- **AND** it SHOULD not collapse into a universal all-purpose action.

### Requirement: Camera Work Must Declare Intent

Camera framing for gameplay, dialogue and cinematics SHALL support what the
player needs to understand, not only follow an actor mechanically.

#### Scenario: A camera mode or scripted camera beat is added

- **GIVEN** a camera behavior is introduced or modified
- **WHEN** the behavior is specified
- **THEN** it SHOULD declare what object, consequence, route, target or emotion
  it is making readable
- **AND** it SHOULD preserve player orientation when returning to gameplay.

### Requirement: Player Time Must Be Earned

The game SHALL treat waiting, walking, transitions, repeated prompts and
cinematics as costs that must provide comprehension, control, impact or reward.

#### Scenario: A first-arc delay or repeated action is introduced

- **GIVEN** a feature makes the player wait, repeat an action, walk back, watch a
  scene or pass through a transition
- **WHEN** the timing is reviewed
- **THEN** the delay SHOULD be justified as teaching, reward, impact, loading,
  comedy or pacing
- **AND** avoidable dead time SHOULD be shortened, skipped or filled with
  meaningful play or information.

### Requirement: Gameplay Readability Must Fit The Real Camera

Important gameplay states SHALL be readable from the actual gameplay camera and
screen scale.

#### Scenario: A visual gameplay state is added or changed

- **GIVEN** a state such as valid target, invalid target, restored ground,
  blocked placement, active bot, objective marker or completion feedback is
  displayed
- **WHEN** the player sees it from the default gameplay camera with HUD visible
- **THEN** the state SHOULD be readable by more than color alone
- **AND** it SHOULD use shape, value, outline, icon, motion or text when color
  is insufficient.

### Requirement: Jesse Lenses Are Design Filters, Not Feature Requests

Jesse-derived design notes SHALL be translated into Sandbots' specific
restoration fantasy and implementation constraints.

#### Scenario: A future task cites this change

- **GIVEN** a future feature references a Jesse-style lens
- **WHEN** the task is implemented
- **THEN** it MUST state the Sandbots translation of the lens
- **AND** it MUST fit bots, restoration, colony viability, readable camera,
  existing input and current performance constraints
- **AND** it MUST NOT become a broad unrelated system without a separate spec.
