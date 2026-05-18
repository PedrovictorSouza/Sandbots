# Tasks: Apply Jesse Game Design Lenses

## 1. Reading Ledger

- [x] Locate the Jesse Schell PDF in `material/`.
- [x] Confirm direct PDF extraction is unavailable in the current shell.
- [x] Use the local extracted translation in `docs/game-design-principles.md`.
- [x] Identify actionable lenses already captured in the design notes.
- [x] Translate the lenses into Sandbots-specific gameplay tasks.
- [ ] Continue reading directly from the PDF if extraction tooling becomes
  available.
- [x] Append new tasks only when tied to a concrete lens and a Sandbots gameplay
  problem.

## 2. Objective Consequence Copy v1

Source lens: clear goals and every word must work.

- [x] Audit first-arc objective titles and subtitles.
- [x] Ensure each objective states the world/system consequence when space allows.
- [x] Remove subtitles that only repeat the title.
- [x] Preserve short HUD text; do not turn objectives into paragraphs.
- [x] Test that mission title/subtitle duplication remains blocked.

## 3. Action Feedback Contract v1

Source lens: important input must respond.

- [x] List required early actions: interact, use field tool, place kit, cancel,
  confirm and open menu.
- [x] Define valid response, blocked response and no-target response for each.
- [x] Add a small helper contract before expanding individual interactions.
- [x] Convert one early silent failure into a clear in-world or HUD response.
- [x] Test the converted response.

## 4. First-Use Ability Checklist v1

Source lens: onboarding should teach by doing.

- [x] Define a first-use checklist for every ability: target, prompt, safe
  failure, feedback, reward and next hook.
- [x] Apply the checklist to Hydro Jet and Bio-Grow without changing their core
  mechanics.
- [x] Add a development-only validator for missing first-use fields.
- [x] Test that each unlocked ability has a first-use definition.

## 5. Visible Reward Tier v1

Source lens: reward should match the deed.

- [x] Define reward tiers: tiny action, useful action, milestone, major scene.
- [x] Map current events to tiers: tile restored, tool learned, bot awakened,
  kit placed, habitat completed.
- [x] Ensure each tier has proportional feedback expectations.
- [x] Convert one under-rewarded milestone to use stronger feedback.
- [x] Test the selected milestone state/result.

## 6. Invalid Action Help v1

Source lens: assistance without humiliation.

- [x] Find one early action where pressing the expected button too soon fails
  silently.
- [x] Add a gentle reason or nearby target hint.
- [x] Avoid global hint spam.
- [x] Keep hints short and contextual.
- [x] Test that valid actions still take priority over help text.

## 7. Errand Hook Validator v2

Source lens: curiosity and player time.

- [x] Extend the current errand quest validator to require a hook, visible
  reward and fast resolution for fetch/collection tasks.
- [x] Add a warning for travel-only objectives with no micro-event.
- [x] Ensure validation messages speak in design terms, not implementation
  jargon.
- [x] Test one valid errand and one intentionally weak errand.

## 8. Dialogue Line Utility Validator v1

Source lens: games have few words per minute.

- [x] Define allowed line functions: instruction, world, character,
  relationship, plot, joke, feedback or hint.
- [x] Add optional metadata support for dialogue lines where content is already
  structured.
- [x] Warn in development when structured dialogue lacks a line function.
- [x] Do not block unstructured legacy dialogue yet.
- [x] Test the validator with small fixtures.

## 9. Ability Strength/Limit Table v1

Source lens: strengths, weaknesses and synergy.

- [x] Define a small data table for current abilities.
- [x] Capture benefit, limit, valid target, first safe use and feedback.
- [x] Keep it read-only at first; do not route gameplay through it yet.
- [x] Use the table for validation/documentation before runtime integration.
- [x] Test that Hydro Jet and Bio-Grow have distinct roles.

## 10. Camera Framing Intent Notes v1

Source lens: camera target is not the character.

- [x] List current camera modes: gameplay follow, dialogue, crash opening,
  repair box reveal and object focus.
- [x] Add intent notes for each mode: what the player must see and why.
- [x] Do not change camera movement in this documentation slice.
- [x] Use these notes before future camera edits.
- [x] Add a test or review checklist only if camera config becomes data-driven.

## 11. Player Time Audit v1

Source lens: player time is a cost.

- [x] Audit first-arc waits, fades, cinematic holds, repeated prompts and forced
  returns.
- [x] Mark each delay as `teaches`, `rewards`, `sells impact`, `loads`, or
  `waste`.
- [ ] Shorten one wasteful delay in a separate high-risk-approved slice.
- [x] Preserve emotional beats that earn their duration.
- [ ] Test affected timing if changed.

## 12. Readability At Gameplay Scale Audit v1

Source lens: design for the actual platform.

- [x] Check default gameplay camera readability for dry/restored ground,
  ability targets, NPCs, prompts and active objectives.
- [x] Identify states that rely on color alone.
- [x] Add shape, outline, marker, motion or text where one small fix is enough.
- [x] Avoid broad art direction changes.
- [x] Smoke test the affected scene.

## 13. Validation

- [x] Validate this OpenSpec change with `openspec validate
  apply-jesse-game-design-lenses --strict`.
- [x] Before implementing any task above, reduce it to a small vertical slice.
- [x] Each implementation slice should touch no more than three files unless a
  new preflight justifies a larger scope.

## 14. Effect Scale Contract v1

Source lens: effect scale should match the deed.

- [x] Append this task only after tying it to a concrete Jesse lens and Sandbots
  gameplay problem.
- [x] Map current motion presets to proportional scale: tile restore, Hydro Jet,
  bot bump, crafting, task completion and crash.
- [x] Add design intent metadata before routing future events through presets.
- [x] Test that the crash remains larger than routine feedback.
- [x] Test that missing motion design metadata is caught before runtime use.

## 15. Cosmetic Randomness Bounds v1

Source lens: randomness should add variety without unfair or broken outcomes.

- [x] Use randomness only for cosmetic spark, dust and soundtrack variation in
  this slice.
- [x] Clamp injected random values before they affect position, duration,
  drift or size.
- [x] Preserve deterministic tests through injectable random sources.
- [x] Test that out-of-range random values still produce finite bounded sparks.
- [x] Test that out-of-range random values still produce finite bounded dust.
- [x] Test that out-of-range random values still choose a known soundtrack.
