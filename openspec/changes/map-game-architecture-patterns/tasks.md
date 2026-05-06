# Tasks: Map game architecture patterns

## 1. Architecture Contract

- [x] Define major game systems.
- [x] Map each system to an architecture or game design pattern.
- [x] Define ownership boundaries.
- [x] Define high-risk systems that require separate specs.
- [x] Keep this change documentation-only.

## 2. Future Implementation Tasks

- [x] Add an architecture pattern data reference module if future tooling needs it.
- [x] Add tests that new content catalogs stay immutable.
- [x] Add tests that scenario gates use biome/token data instead of input handlers.
- [x] Add tests that UI presenters do not mutate quest state.
- [x] Use the architecture graph report before broad refactors.

## 3. Validation

- [x] Confirm this OpenSpec change exists under
  `openspec/changes/map-game-architecture-patterns`.
- [x] Confirm no runtime/source files are changed by this contract.
