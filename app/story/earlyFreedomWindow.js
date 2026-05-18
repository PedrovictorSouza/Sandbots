export const FIRST_TAUGHT_ACTION_IDS = Object.freeze({
  WATER_DRY_GRASS: "water-dry-grass"
});

export const EARLY_FREEDOM_WINDOW_DEFAULTS = Object.freeze({
  durationMs: 25000,
  overCompletionAllowance: 5
});

function getFlags(storyState = {}) {
  storyState.flags ||= {};
  return storyState.flags;
}

export function startFirstTaughtActionFreedomWindow(storyState, {
  actionId = FIRST_TAUGHT_ACTION_IDS.WATER_DRY_GRASS,
  now = null,
  durationMs = EARLY_FREEDOM_WINDOW_DEFAULTS.durationMs
} = {}) {
  const flags = getFlags(storyState);

  flags.firstRequiredTaughtActionComplete = true;
  flags.firstRequiredTaughtActionId = actionId;

  if (flags.firstRequiredTaughtActionFreedomWindowEnded) {
    return false;
  }

  flags.firstRequiredTaughtActionFreedomWindowActive = true;
  flags.firstRequiredTaughtActionFreedomWindowActionId = actionId;
  flags.firstRequiredTaughtActionFreedomWindowOverCompletion = 0;

  if (Number.isFinite(now)) {
    flags.firstRequiredTaughtActionFreedomWindowStartedAt = now;
    flags.firstRequiredTaughtActionFreedomWindowExpiresAt = now + durationMs;
  }

  return true;
}

export function endFirstTaughtActionFreedomWindow(storyState, {
  reason = "completed"
} = {}) {
  const flags = getFlags(storyState);

  if (!flags.firstRequiredTaughtActionFreedomWindowActive) {
    return false;
  }

  flags.firstRequiredTaughtActionFreedomWindowActive = false;
  flags.firstRequiredTaughtActionFreedomWindowEnded = true;
  flags.firstRequiredTaughtActionFreedomWindowEndReason = reason;
  return true;
}

export function recordFirstTaughtActionFreedomUse(storyState, {
  actionId = FIRST_TAUGHT_ACTION_IDS.WATER_DRY_GRASS,
  allowance = EARLY_FREEDOM_WINDOW_DEFAULTS.overCompletionAllowance
} = {}) {
  const flags = getFlags(storyState);

  if (
    !flags.firstRequiredTaughtActionFreedomWindowActive ||
    flags.firstRequiredTaughtActionFreedomWindowActionId !== actionId
  ) {
    return false;
  }

  flags.firstRequiredTaughtActionFreedomWindowOverCompletion =
    Number(flags.firstRequiredTaughtActionFreedomWindowOverCompletion || 0) + 1;

  if (flags.firstRequiredTaughtActionFreedomWindowOverCompletion >= allowance) {
    endFirstTaughtActionFreedomWindow(storyState, {
      reason: "over-completion"
    });
  }

  return true;
}

export function syncFirstTaughtActionFreedomWindow(storyState, {
  now,
  durationMs = EARLY_FREEDOM_WINDOW_DEFAULTS.durationMs
} = {}) {
  const flags = getFlags(storyState);

  if (!flags.firstRequiredTaughtActionFreedomWindowActive) {
    return {
      active: false,
      ended: Boolean(flags.firstRequiredTaughtActionFreedomWindowEnded)
    };
  }

  if (Number.isFinite(now) && !Number.isFinite(flags.firstRequiredTaughtActionFreedomWindowExpiresAt)) {
    flags.firstRequiredTaughtActionFreedomWindowStartedAt = now;
    flags.firstRequiredTaughtActionFreedomWindowExpiresAt = now + durationMs;
  }

  if (
    Number.isFinite(now) &&
    Number.isFinite(flags.firstRequiredTaughtActionFreedomWindowExpiresAt) &&
    now >= flags.firstRequiredTaughtActionFreedomWindowExpiresAt
  ) {
    endFirstTaughtActionFreedomWindow(storyState, {
      reason: "timeout"
    });
  }

  return {
    active: Boolean(flags.firstRequiredTaughtActionFreedomWindowActive),
    ended: Boolean(flags.firstRequiredTaughtActionFreedomWindowEnded)
  };
}

export function isFirstTaughtActionFreedomWindowActive(storyState = {}) {
  return Boolean(storyState.flags?.firstRequiredTaughtActionFreedomWindowActive);
}
