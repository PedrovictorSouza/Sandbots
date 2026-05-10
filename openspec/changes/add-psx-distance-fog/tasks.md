# Tasks: Add PSX Distance Fog

## 1. Proposal Scope

- [x] Create OpenSpec change under `openspec/changes/add-psx-distance-fog`.
- [x] Define PSX distance fog as a rendering-atmosphere feature.
- [x] Identify renderer, scene configuration and gameplay readability as the
  owning risk areas.
- [x] Keep this proposal documentation-only.

## 2. Fog Configuration Slice

- [ ] Add named fog preset ids and data objects.
- [ ] Define default gameplay fog settings.
- [ ] Define at least one fog-enabled scene preset or scene override.
- [ ] Add focused tests for preset fallback and override resolution.

## 3. Renderer Integration Slice

- [ ] Apply fog only to world geometry rendering.
- [ ] Keep HUD, dialogue, quest tracker, prompts and menus visually unaffected.
- [ ] Avoid expensive volumetric lighting or multi-pass atmospheric systems.
- [ ] Add focused tests or renderer-state assertions for world-only fog.

## 4. Gameplay Readability Slice

- [ ] Verify player character readability at normal camera distance.
- [ ] Verify active NPC readability at interaction distance.
- [ ] Verify objective markers and interaction prompts remain clear.
- [ ] Verify valid ability targets remain readable while fog is active.

## 5. Visual Tuning Slice

- [ ] Tune default fog for cold, mysterious, PSX-style atmosphere.
- [ ] Confirm default gameplay does not feel like full horror mode.
- [ ] Confirm distant geometry fades smoothly without abrupt pop.
- [ ] Keep fog color, near distance, far distance and intensity in named data.

## 6. Validation

- [ ] Run focused fog configuration tests.
- [ ] Run `npm run build`.
- [ ] Run browser/manual visual smoke in a fog-enabled scene.
- [ ] Capture or document before/after readability checks.
