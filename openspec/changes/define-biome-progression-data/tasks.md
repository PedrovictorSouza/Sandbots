# Tasks: Define biome progression data

## 1. Implementation

- [x] Add pure macro-biome data module.
- [x] Add constants for four macro-biome ids.
- [x] Add constants for four completion token ids.
- [x] Add helper to list macro-biomes.
- [x] Add helper to get macro-biome by id.
- [x] Add helper to evaluate entry requirements.
- [x] Add helper to report missing entry tokens.
- [x] Add helper to evaluate credits signal readiness.

## 2. Tests

- [x] Add test for exactly four macro-biomes.
- [x] Add test for parallel intermediate biome unlock.
- [x] Add test that final biome requires both intermediate tokens.
- [x] Add test that credits require all four tokens.
- [x] Add immutability test.

## 3. Validation

- [x] Run `npm run test -- tests/biomeProgressionData.test.js`.
- [x] Keep runtime integration out of this change.
