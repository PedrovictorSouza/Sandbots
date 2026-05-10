# Building System Specification

## ADDED Requirements

### Requirement: Building Kits Can Be Placed In The World

The player MUST be able to place building kits in valid world locations.

#### Scenario: Player places a building kit

- **GIVEN** the player owns a building kit
- **WHEN** the player selects a valid location
- **THEN** the game MUST create a construction site
- **AND** the construction site MUST display an interaction marker
- **AND** the building MUST remain incomplete

#### Scenario: Player tries to place a kit in an invalid location

- **GIVEN** the player is placing a building kit
- **WHEN** the target location is blocked, occupied, too steep, or invalid
- **THEN** the game MUST prevent placement
- **AND** the game MUST show placement feedback

---

### Requirement: Construction Sites Show Required Materials

The construction site MUST show which materials are required and how many the player currently owns.

#### Scenario: Player inspects construction requirements

- **GIVEN** a construction site exists
- **WHEN** the player interacts with its construction box
- **THEN** the game MUST show every required material
- **AND** the game MUST show required quantity
- **AND** the game MUST show current inventory quantity
- **AND** the game MUST show already deposited quantity

#### Scenario: Player lacks required materials

- **GIVEN** a construction site requires materials
- **AND** the player does not have enough materials
- **WHEN** the player attempts to start construction
- **THEN** the game MUST block construction
- **AND** the game MUST identify missing materials

---

### Requirement: Player Can Deposit Materials Gradually Or All At Once

The player MUST be able to deposit construction materials using different contribution actions.

#### Scenario: Player deposits one item

- **GIVEN** the player has at least one required material
- **WHEN** the player chooses `deposit one`
- **THEN** one unit MUST be moved from inventory to the construction site

#### Scenario: Player deposits a stack

- **GIVEN** the player has multiple units of a required material
- **WHEN** the player chooses `deposit stack`
- **THEN** the game MUST deposit as many units as needed or available
- **AND** excess materials MUST remain in inventory

#### Scenario: Player deposits all required materials

- **GIVEN** the player has every required material
- **WHEN** the player chooses `deposit all`
- **THEN** the game MUST deposit all missing required materials
- **AND** unrelated inventory items MUST remain untouched

---

### Requirement: Construction Requires Creature Specialties

Some buildings MUST require creatures with specific specialties before construction can begin.

#### Scenario: Building requires build specialty

- **GIVEN** a construction site requires the `build` specialty
- **WHEN** the player attempts to start construction
- **THEN** at least one nearby or following creature with `build` MUST be present

#### Scenario: Building requires multiple specialties

- **GIVEN** a construction site requires multiple creature specialties
- **WHEN** the player opens the construction UI
- **THEN** the game MUST show each required specialty
- **AND** the game MUST show whether each requirement is satisfied

#### Scenario: Required creature is missing

- **GIVEN** a construction site requires a creature specialty
- **AND** no nearby or following creature has that specialty
- **WHEN** the player attempts to start construction
- **THEN** the game MUST block construction
- **AND** explain which specialty is missing

---

### Requirement: Creatures Can Follow The Player

The player MUST be able to make friendly creatures follow them.

#### Scenario: Player uses follow interaction

- **GIVEN** the player is near a friendly creature
- **WHEN** the player selects `follow me`
- **THEN** the creature MUST start following the player

#### Scenario: Player uses call emote

- **GIVEN** friendly creatures are nearby
- **WHEN** the player uses the call emote
- **THEN** eligible nearby creatures SHOULD start following the player
- **AND** the follower limit MUST be respected

#### Scenario: Follower limit is reached

- **GIVEN** the player already has 5 active followers
- **WHEN** another creature attempts to follow
- **THEN** the game MUST prevent the new follower from joining
- **AND** the game MUST show feedback that the party is full

---

### Requirement: Construction Takes Time

Construction MUST use a timed process instead of completing instantly.

#### Scenario: Construction starts

- **GIVEN** all materials are deposited
- **AND** all required creature specialties are present
- **WHEN** the player confirms construction
- **THEN** the construction site MUST enter the `building` state
- **AND** a completion timer MUST begin

#### Scenario: Construction finishes

- **GIVEN** a construction site is in the `building` state
- **WHEN** its build timer completes
- **THEN** the construction site MUST be replaced by the completed building
- **AND** the game MUST show completion feedback

#### Scenario: Different buildings have different durations

- **GIVEN** multiple building kit types exist
- **WHEN** each building starts construction
- **THEN** each building MUST use its own configured build duration

---

### Requirement: Completed Buildings Require Furniture To Become Homes

A completed building MUST require a minimum amount of furniture before it counts as a valid home.

#### Scenario: Building has fewer than three furniture items

- **GIVEN** a completed building exists
- **AND** fewer than 3 valid furniture items are placed inside
- **WHEN** the player inspects the building
- **THEN** the building MUST not count as a valid home
- **AND** the game MUST tell the player more furniture is needed

#### Scenario: Building has at least three furniture items

- **GIVEN** a completed building exists
- **WHEN** the player places at least 3 valid furniture items inside
- **THEN** the building MUST become a valid home
- **AND** the game MUST show home completion feedback

---

### Requirement: Creatures Can Use Functional Specialties Near Objects

Creatures following the player MUST be able to activate compatible world objects using their specialties.

#### Scenario: Burn creature lights a campfire

- **GIVEN** a creature with `burn` is following the player
- **AND** a lightable campfire is nearby
- **WHEN** the campfire is activated
- **THEN** the creature MUST light the campfire
- **AND** the campfire state MUST change to `lit`

#### Scenario: Required specialty is absent

- **GIVEN** an object requires a creature specialty
- **AND** no following creature has that specialty
- **WHEN** the player attempts to activate the object
- **THEN** the game MUST block activation
- **AND** explain which specialty is required

---

### Requirement: Creatures Can Move Into Valid Homes

The player MUST be able to assign a friendly creature to a completed, furnished home.

#### Scenario: Player invites creature to move in

- **GIVEN** a building is a valid home
- **AND** the player is interacting with a friendly creature
- **WHEN** the player selects `move in`
- **THEN** the creature MUST be assigned to that home
- **AND** the assignment MUST persist in save data

#### Scenario: Creature already has a home

- **GIVEN** a creature already has a home
- **WHEN** the player assigns it to a new home
- **THEN** the previous home assignment MUST be cleared
- **AND** the new home assignment MUST be saved

---

### Requirement: Creature Profiles Show Habitat Preferences

The game MUST show each creature's ideal habitat.

#### Scenario: Player opens creature profile

- **GIVEN** the player has discovered a creature
- **WHEN** the player opens its profile
- **THEN** the game MUST show its ideal habitat

#### Scenario: Creature lives in matching habitat

- **GIVEN** a creature has an ideal habitat
- **AND** the creature is assigned to a home
- **WHEN** the home habitat matches the creature preference
- **THEN** the creature SHOULD be considered properly housed

---

### Requirement: Creatures Show Cozy Idle Behavior In Homes

Creatures assigned to homes MUST support simple idle behavior hooks.

#### Scenario: Creature rests inside its home

- **GIVEN** a creature is assigned to a home
- **WHEN** the creature is idle
- **THEN** it SHOULD be able to sleep, sit, wander, or interact with furniture

#### Scenario: Creature chooses unexpected furniture

- **GIVEN** multiple valid furniture items exist inside the home
- **WHEN** the creature enters an idle behavior
- **THEN** it MAY choose any valid cozy object
- **AND** the game MUST not require the creature to use only the most optimal item
