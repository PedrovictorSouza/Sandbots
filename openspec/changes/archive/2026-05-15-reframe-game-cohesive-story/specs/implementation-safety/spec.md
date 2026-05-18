# implementation-safety Specification

## ADDED Requirements

### Requirement: Refactoring Must Be Prioritized Before Expansion

The implementation MUST prioritize code clarity, separation of concerns and
scalability before adding large new mechanics or large new content.

#### Scenario: Content is hardcoded inside rendering or scene logic

- **GIVEN** narrative, dialogue, quest or progression content is hardcoded inside
  rendering, input, scene or animation logic
- **WHEN** the content is modified
- **THEN** the content SHOULD be moved into a structured content layer
- **AND** behavior logic SHOULD remain separate from text/data definitions.

#### Scenario: A new quest is needed

- **GIVEN** a new quest is required for the reframe
- **WHEN** it is implemented
- **THEN** the agent MUST add it through the quest/content structure
- **AND** MUST NOT scatter unrelated hardcoded strings across the codebase.

### Requirement: Agent Must Only Make Fully Understood Changes

The implementation agent MUST avoid changes when the behavior, dependency or side
effect is ambiguous.

#### Scenario: A system is unclear

- **GIVEN** the agent finds a function, file, scene or system it does not fully
  understand
- **WHEN** a change is needed
- **THEN** the agent MUST inspect nearby references first
- **AND** prefer small adapters or isolated content changes
- **AND** MUST NOT perform broad speculative rewrites.

#### Scenario: Rename may break references

- **GIVEN** a symbol is referenced across multiple systems
- **WHEN** the agent wants to rename it
- **THEN** the agent MUST map all references first
- **AND** only rename when the update is safe
- **AND** otherwise preserve the internal symbol while changing user-facing text.

### Requirement: Changes Must Be Incremental And Reversible

The implementation MUST be done in small, understandable vertical slices.

#### Scenario: Migrating old content

- **GIVEN** old content needs to be replaced
- **WHEN** the migration begins
- **THEN** the agent MUST first centralize or map the content
- **AND** then replace visible output
- **AND** then clean internal identifiers only when safe.

### Requirement: Code Must Become Cleaner After The Change

The reframe MUST improve maintainability.

#### Scenario: Final review

- **GIVEN** the implementation is complete
- **WHEN** the code is reviewed
- **THEN** narrative data, quest data, rendering logic, scene control and asset
  loading SHOULD be more clearly separated than before
- **AND** duplicated strings or duplicated quest logic SHOULD be reduced
- **AND** future content additions SHOULD be easier.
