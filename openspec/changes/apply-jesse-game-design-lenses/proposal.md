# Change: Apply Jesse Game Design Lenses

## Why

Sandbots needs faster game-design iteration without drifting into disconnected
features. The local Jesse Schell material and the current extracted design notes
in `docs/game-design-principles.md` are useful because they focus on lenses:
questions that expose whether a mechanic is understandable, rewarding,
surprising, fair, readable and worth the player's time.

The goal is not to quote or implement the book literally. The goal is to turn
the lenses into a practical Sandbots backlog where each change improves the
first playable colony-restoration arc.

## Source Notes From Current Reading

The PDF itself is present at:

`material/Jesse Schell - The Art of Game Design A Book of Lenses  (1).pdf`

The current environment does not have `pdftotext` or `pdfinfo`, so this pass uses
the already extracted and translated local notes in
`docs/game-design-principles.md`. The relevant game-design lenses already
captured there are:

- A game needs a visible concept lighthouse.
- The player should learn by acting, not by reading long instructions.
- Important input must respond with action or useful feedback.
- Rewards should match the deed and be visible in the world.
- Repeated work can be satisfying when it changes the world and reduces future
  friction.
- Randomness should add life, not decide required progress.
- Abilities should have strengths, limits and synergy.
- Onboarding should be gentle without over-controlling the player.
- Every line of UI/dialogue should teach, reveal, characterize, advance or earn
  its place as a strong joke.
- The camera target is a design tool, not a point glued to the character.
- Player time is a cost; transitions, errands and cinematics must earn it.
- Game design must fit the actual platform, camera, input and performance.

## Sandbots Translation

Jesse-style lenses become Sandbots implementation filters:

| Lens Theme | Sandbots Translation |
| --- | --- |
| Essential experience | Bots restoring a damaged tiny planet for future humans. |
| Goal clarity | Every objective says what system improves and why it matters. |
| Meaningful feedback | Restoration, construction and bot wakeups change world state visibly. |
| Player agency | Required tasks teach one path, then allow limited valid choices. |
| Reward proportionality | Bigger repairs get stronger visual/audio/UI response. |
| Flow and onboarding | First uses are safe, short and immediately playable. |
| Curiosity | Errands begin with a contradiction, mystery, useful promise or joke. |
| Economy | Progress is viability, tools, bots, habitats and restored systems, not money. |
| Words per minute | UI and dialogue lines must carry mechanical or world meaning. |
| Camera as design | Camera framing should reveal targets, motion and consequences. |
| Platform reality | Effects, markers and UI must remain readable at actual gameplay scale. |

## What Changes

- Define a spec-driven design backlog for Sandbots based on Jesse-style lenses.
- Add requirements that future gameplay changes must pass goal, feedback,
  reward, agency, onboarding, copy and readability checks.
- Prioritize small, playable improvements over broad architecture rewrites.
- Keep each implementation slice small enough to test independently.

## Non-Goals

- Do not implement all lenses in one change.
- Do not redesign the whole quest, camera, HUD, dialogue or ability system.
- Do not add abstract scores, currencies, combat, failure states or full
  simulation layers just because a lens mentions them.
- Do not copy another game's structure. The lenses must translate into
  Sandbots' colony-restoration world.
- Do not make Hydro Bot the center of this backlog.

## Preflight

- Objective: create an implementation-ready OpenSpec task list from the Jesse
  game-design material already extracted into local notes.
- Likely files involved in this pass: OpenSpec documentation only.
- Smallest safe change: add a new change with proposal, tasks and spec.
- Files not to touch: runtime, camera, input, render frame, scene flow, HUD,
  quest data, dialogue data and workbench code.
- Risk: turning lenses into generic advice instead of concrete Sandbots tasks.
- Size: small documentation slice.

## Recommended Implementation Order

1. Add `Objective Consequence Copy v1`.
2. Add `Action Feedback Contract v1`.
3. Add `First-Use Ability Checklist v1`.
4. Add `Visible Reward Tier v1`.
5. Add `Invalid Action Help v1`.
6. Add `Errand Hook Validator v2`.
7. Add `Dialogue Line Utility Validator v1`.
8. Add `Ability Strength/Limit Table v1`.
9. Add `Camera Framing Intent Notes v1`.
10. Add `Player Time Audit v1`.
11. Add `Readability At Gameplay Scale Audit v1`.
12. Add `Jesse Lens Review Checklist` to future specs.
