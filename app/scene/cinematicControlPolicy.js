export const DEFAULT_CINEMATIC_SKIP_HOLD_DURATION = 0.65;
export const DEFAULT_CINEMATIC_SKIP_PROMPT_VISIBLE_FOR = 1.6;

const DEFAULT_SKIP_KEY_CODES = Object.freeze(["Enter", "KeyX", "Space", "Escape"]);
const DEFAULT_FEEDBACK_KEY_CODES = Object.freeze([
  "Enter",
  "KeyX",
  "Space",
  "KeyE",
  "KeyM",
  "Escape"
]);
const DEFAULT_FEEDBACK_KEYS = Object.freeze(["w", "a", "s", "d"]);

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function normalizeKey(event) {
  return String(event?.key || "").toLowerCase();
}

export function createCinematicControlState({
  holdDuration = DEFAULT_CINEMATIC_SKIP_HOLD_DURATION,
  promptVisibleFor = DEFAULT_CINEMATIC_SKIP_PROMPT_VISIBLE_FOR,
  skipKeyCodes = DEFAULT_SKIP_KEY_CODES,
  feedbackKeyCodes = DEFAULT_FEEDBACK_KEY_CODES,
  feedbackKeys = DEFAULT_FEEDBACK_KEYS
} = {}) {
  return {
    holdDuration,
    promptVisibleFor,
    skipKeyCodes: new Set(skipKeyCodes),
    feedbackKeyCodes: new Set(feedbackKeyCodes),
    feedbackKeys: new Set(feedbackKeys),
    skipHoldActive: false,
    skipHoldElapsed: 0,
    skipPromptUntil: 0
  };
}

export function resetCinematicControlState(state) {
  if (!state) {
    return;
  }

  state.skipHoldActive = false;
  state.skipHoldElapsed = 0;
  state.skipPromptUntil = 0;
}

export function isCinematicSkipEvent(state, event) {
  return Boolean(state?.skipKeyCodes?.has?.(event?.code));
}

export function isCinematicFeedbackEvent(state, event) {
  return Boolean(
    isCinematicSkipEvent(state, event) ||
    state?.feedbackKeyCodes?.has?.(event?.code) ||
    state?.feedbackKeys?.has?.(normalizeKey(event))
  );
}

export function showCinematicSkipPrompt(state, elapsed = 0) {
  if (!state) {
    return;
  }

  state.skipPromptUntil = Math.max(
    state.skipPromptUntil,
    Number(elapsed || 0) + state.promptVisibleFor
  );
}

export function handleCinematicControlKeydown(state, event, elapsed = 0) {
  if (!isCinematicFeedbackEvent(state, event)) {
    return {
      handled: false,
      skipStarted: false
    };
  }

  showCinematicSkipPrompt(state, elapsed);
  const skipStarted = isCinematicSkipEvent(state, event) && !event?.repeat;

  if (skipStarted) {
    state.skipHoldActive = true;
    state.skipHoldElapsed = 0;
  }

  return {
    handled: true,
    skipStarted
  };
}

export function handleCinematicControlKeyup(state, event, elapsed = 0) {
  if (!isCinematicFeedbackEvent(state, event)) {
    return {
      handled: false,
      skipCancelled: false
    };
  }

  const skipCancelled = isCinematicSkipEvent(state, event);
  if (skipCancelled) {
    state.skipHoldActive = false;
    state.skipHoldElapsed = 0;
  }

  showCinematicSkipPrompt(state, elapsed);

  return {
    handled: true,
    skipCancelled
  };
}

export function setCinematicSkipHoldActive(state, active, elapsed = 0) {
  if (!state) {
    return;
  }

  if (active) {
    showCinematicSkipPrompt(state, elapsed);
    state.skipHoldActive = true;
    return;
  }

  state.skipHoldActive = false;
  state.skipHoldElapsed = 0;
}

export function updateCinematicControlState(state, deltaTime = 0) {
  if (!state?.skipHoldActive) {
    return {
      skipCompleted: false
    };
  }

  state.skipHoldElapsed = Math.min(
    state.holdDuration,
    state.skipHoldElapsed + Math.max(0, Number(deltaTime || 0))
  );

  return {
    skipCompleted: state.skipHoldElapsed >= state.holdDuration
  };
}

export function getCinematicControlViewState(state, elapsed = 0) {
  if (!state) {
    return {
      promptVisible: false,
      skipProgress: 0
    };
  }

  return {
    promptVisible: state.skipHoldActive || Number(elapsed || 0) < state.skipPromptUntil,
    skipProgress: clamp01(state.skipHoldElapsed / state.holdDuration)
  };
}
