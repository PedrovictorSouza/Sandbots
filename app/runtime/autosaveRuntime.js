export const AUTOSAVE_EVENT = Object.freeze({
  TASK_COMPLETED: "task-completed",
  NEW_ABILITY_LEARNED: "new-ability-learned",
  ROBOT_REACTIVATED: "robot-reactivated",
  FIRST_REQUIRED_ABILITY_USE: "first-required-ability-use",
  PLAYER_NAME_CONFIRMED: "player-name-confirmed",
  MAJOR_SYSTEM_UNLOCKED: "major-system-unlocked",
  STORY_STEP_ADVANCED: "story-step-advanced"
});

const AUTOSAVE_EVENT_VALUES = new Set(Object.values(AUTOSAVE_EVENT));

function clonePayload(payload) {
  return Object.fromEntries(
    Object.entries(payload || {}).map(([key, value]) => [
      key,
      Array.isArray(value) ? [...value] : value
    ])
  );
}

export function createAutosaveEvent(type, payload = {}) {
  if (!AUTOSAVE_EVENT_VALUES.has(type)) {
    return null;
  }

  return {
    type,
    payload: clonePayload(payload)
  };
}

export function shouldAutosaveForEvent(event) {
  return Boolean(event?.type && AUTOSAVE_EVENT_VALUES.has(event.type));
}

export function createAutosaveRuntime({
  save = () => false,
  onSaving = () => {},
  onSaved = () => {}
} = {}) {
  function trigger(type, payload = {}) {
    const event = typeof type === "string" ?
      createAutosaveEvent(type, payload) :
      createAutosaveEvent(type?.type, type?.payload || {});

    if (!shouldAutosaveForEvent(event)) {
      return false;
    }

    onSaving(event);
    const saved = Boolean(save(event));
    onSaved(event, saved);
    return saved;
  }

  return {
    trigger
  };
}
