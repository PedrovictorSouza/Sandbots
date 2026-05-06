# Early-Game UX Design Notes

## Scope

This design document defines the intended shape of the first-run UX. It does not
implement runtime behavior. Camera, input, scene flow and persistence changes are
high risk and should be implemented only through focused follow-up tasks.

## Autosave

Autosave is an event-driven service owned by progression state, not by random UI
handlers. Gameplay systems should emit or report meaningful progression events;
the save layer decides whether an autosave is needed.

Initial autosave trigger types:

- Main task completed.
- New ability learned.
- Robot reactivated.
- First required use of a taught ability completed.
- Player name confirmed.
- Major system unlocked, including FieldDex, Settings or first station.
- Tutorial or story step advanced.

The first visual feedback is a small text indicator in the upper-left corner:

```txt
Saving...
```

The indicator should be temporary, non-blocking and lower priority than dialogue
or critical prompts. A future state may add "Saved" or failure feedback, but the
initial requirement is a clear in-progress autosave signal.

## First Chopper Cinematic

Before the first Chopper conversation, the game should fade out to black,
reposition the camera to frame Chopper and the player, then fade in with the
dialogue ready. This should be modeled as a narrow scene-transition state, not as
manual camera changes scattered through dialogue logic.

The cinematic should only run once per new game unless a future debug or replay
mode explicitly requests it.

## FieldDex Discovery

FieldDex/Pokedex is a discovered tool. It should be introduced by the story:
Chopper detects or identifies an old field device, damaged archive or linked Bill
tool. The player learns it exists because it helps explain something happening in
the world, not because the UI advertises it first.

The first FieldDex unlock should:

- Set an explicit progression flag.
- Add a short Chopper line or world event.
- Surface a small control hint only after the story beat.
- Avoid pausing the player with a long manual.

## Player Name

During the first Chopper interaction, Chopper asks the player's name. The game
opens a traditional name-entry screen with:

- A virtual keyboard.
- Cursor movement by keyboard and gamepad.
- Letter selection.
- Backspace/delete.
- Confirm.
- Cancel behavior that either returns to dialogue or keeps the current default
  name, depending on final implementation decision.

After confirmation, the name is stored in persistent player profile state. NPC
dialogue should interpolate the name from state and fall back to a safe neutral
term when no name exists.

## Settings

Settings must be available from Select from the beginning of the game. The first
implementation can be a shell, but the architecture should support:

- Camera options.
- Volume options.
- Language options.
- Accessibility options.

Settings should be represented as structured data with defaults, labels and value
types so future menus can expand without rewriting input handling.

## Freedom Window

After the first required taught action, the game should not immediately force the
next system. Example: after the player restores the required 3 tiles, they may
restore a few more tiles freely before Chopper advances.

The window should be state-based:

- Required action count reached.
- A short optional over-completion allowance or time/interaction window begins.
- Chopper advances only after the window closes or the player explicitly checks
  in.

The window should not hide the next objective forever. It should make the opening
feel less mechanical while still keeping the player guided.

## Robot Reactivation Narrative

Early robots should be treated as dormant island infrastructure. Discovery paths
may include:

- Chopper detects an old signal.
- The player finds a damaged unit near old infrastructure.
- The unit is repaired by restoring nearby ground, collecting parts or using a
  station.
- Reactivation produces a clear animation, sound, dialogue or task completion.

No helper robot should silently appear as a reward without a discovery or
reactivation beat.

