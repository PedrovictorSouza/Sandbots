# recipe-item-taxonomy Specification

## ADDED Requirements

### Requirement: Recipe And Item Metadata Is Explicit

Future recipe and item definitions SHALL declare category, unlock source,
progression role, economy tier and placeholder state.

#### Scenario: Recipe is added

- **GIVEN** a future recipe is added
- **WHEN** the recipe is reviewed
- **THEN** it MUST declare an allowed item category, unlock source, progression
  role, economy tier and placeholder state.

### Requirement: Required Recipes Have Story Context

Recipes that affect required progression SHALL declare where and why they matter.

#### Scenario: Required story recipe is reviewed

- **GIVEN** a recipe has progression role `required-story-item`, `repair-material`
  or `traversal-utility`
- **WHEN** the recipe is reviewed
- **THEN** it MUST declare macro-biome id or `global`
- **AND** it MUST NOT be marked `planned`.

### Requirement: Optional Recipes Do Not Block Credits

Decorative, comfort and post-story recipes SHALL not block credits by default.

#### Scenario: Decorative recipe exists

- **GIVEN** a recipe has progression role `decoration-flavor`
- **WHEN** credits readiness is evaluated
- **THEN** the recipe MUST NOT be required for credits.

#### Scenario: Post-story recipe exists

- **GIVEN** a recipe has progression role `post-story-collectible`
- **WHEN** credits readiness is evaluated
- **THEN** the recipe MUST NOT be required before credits.

### Requirement: Placeholder Recipes Follow Placeholder Policy

Planned recipe and item placeholders SHALL not be used as required progression.

#### Scenario: Planned recipe is cataloged

- **GIVEN** a recipe is marked `planned`
- **WHEN** macro-biome or credits readiness is evaluated
- **THEN** the recipe MUST NOT block required progression
- **AND** it MUST be promoted with TDD before becoming required.
