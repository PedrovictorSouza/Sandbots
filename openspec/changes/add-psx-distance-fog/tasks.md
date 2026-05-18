# Tasks: Add PSX Distance Fog

## 1. Proposal Scope

- [x] Create OpenSpec change under `openspec/changes/add-psx-distance-fog`.
- [x] Define PSX distance fog as a rendering-atmosphere feature.
- [x] Identify renderer, scene configuration and gameplay readability as the
  owning risk areas.
- [x] Keep this proposal documentation-only.

## 2. Fog Configuration Slice

- [x] Add named fog preset ids and data objects.
- [x] Define default gameplay fog settings.
- [x] Define at least one fog-enabled scene preset or scene override.
- [x] Add focused tests for preset fallback and override resolution.

## 3. Renderer Integration Slice

- [x] Apply fog only to world geometry rendering.
- [x] Keep HUD, dialogue, quest tracker, prompts and menus visually unaffected.
- [x] Avoid expensive volumetric lighting or multi-pass atmospheric systems.
- [x] Add focused tests or renderer-state assertions for world-only fog.

## 4. Gameplay Readability Slice

- [x] Verify player character readability at normal camera distance.
- [x] Verify active NPC readability at interaction distance.
- [x] Verify objective markers and interaction prompts remain clear.
- [x] Verify valid ability targets remain readable while fog is active.

## 5. Visual Tuning Slice

- [x] Tune default fog for cold, mysterious, PSX-style atmosphere.
- [x] Confirm default gameplay does not feel like full horror mode.
- [x] Confirm distant geometry fades smoothly without abrupt pop.
- [x] Keep fog color, near distance, far distance and intensity in named data.

## 6. Validation

- [x] Run focused fog configuration tests.
- [x] Run focused world-renderer fog integration tests.
- [x] Run `npm run build`.
- [x] Run browser/manual visual smoke in a fog-enabled scene.
- [ ] Capture or document before/after readability checks.
