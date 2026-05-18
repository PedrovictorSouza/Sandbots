# Camera Framing Intent Notes

Sandbots treats the camera target as a design choice, not as a point that is
always glued to the player. Use this note before changing camera code.

## Narrative Camera Beats

- Source: `app/camera/narrativeCameraSystem.js`.
- Intent: keep authored camera moments driven by narrative importance, not by
  isolated quest or cinematic branches.
- Player question: "What changed in the colony, and why should I care?"
- Flow: gameplay emits a beat, the narrative camera director resolves an intent,
  and the cinematographer adapter executes it through existing camera APIs.
- Grammar:
  - `follow`: player explores.
  - `focus`: player should notice an actionable object.
  - `reveal`: something wakes up, appears, or changes state.
  - `confirm`: an action produced a visible consequence.
  - `establish`: a new area or structure needs spatial context.
  - `conversation`: player and bot relationship matters.
  - `return`: control must come back to normal gameplay.
- High-importance locked beats need a short `maxDuration`. Reveal beats should
  end in `conversation` or `return`.

## Gameplay Follow

- Source: `app/camera/gameCamera.js`, `app/runtime/gameLoop.js`.
- Intent: keep the player readable while preserving nearby targets, prompts,
  restored tiles, bots, and interactable machines.
- Player question: "Where am I, what can I touch, and what changed?"
- Do not use this mode for authored reveals. If an object must be centered,
  move into a scripted focus first.

## Crash Opening

- Source: `app/runtime/gameplayCameraDirector.js`.
- Intent: sell impact, ship fall, smoke, and player exit before releasing to
  normal follow.
- Player question: "What just happened, and where did I land?"
- Preserve the skip contract and the return to follow. Do not extend this beat
  unless it gives the player new information.

## Dialogue Conversation

- Source: `app/runtime/dialogueCameraController.js`.
- Intent: frame the player and speaking bot as a relationship, with the midpoint
  as target.
- Player question: "Who is talking to me, and what do they need?"
- This mode may use exact scripted targets because comprehension matters more
  than movement freedom during dialogue.

## World Point Focus

- Source: `app/runtime/dialogueCameraController.js`.
- Intent: point at a machine, box, route, habitat patch, or other actionable
  world object.
- Player question: "What object should I notice next?"
- Use for short cutaways only. The focused object should be relevant to the next
  player action.

## Repair Box Reveal

- Source: `app/bootstrap/createApplicationRuntime.js`.
- Intent: make the repair box feel authored before Grow Bot appears.
- Player question: "Why did this box matter, and what changed after it opened?"
- Preserve the center framing during the reveal and restore normal control after
  the automatic dialogue begins.

## Future Camera Changes

- Name the player question before changing a pose.
- Keep HUD visible when testing readability.
- Avoid changing global follow behavior to fix one cinematic shot.
- If vertical motion becomes important, reduce vertical target follow instead
  of locking the target directly to the character height.
