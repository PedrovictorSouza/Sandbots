const UI_CLICK_SFX_URL = new URL("../soundFx/grab.mp3", import.meta.url).href;
const UI_CONFIRM_SFX_URL = new URL("../soundFx/center-computer.mp3", import.meta.url).href;
const UI_SUCCESS_SFX_URL = new URL("../soundFx/mission-complete.mp3", import.meta.url).href;
const BOT_SIGNAL_SFX_URL = new URL("../soundFx/bot-trade.mp3", import.meta.url).href;
const PLACE_OBJECT_SFX_URL = new URL("../soundFx/instance-object.mp3", import.meta.url).href;
const IMPACT_SFX_URL = new URL("../soundFx/impact.mp3", import.meta.url).href;
const WATER_SFX_URL = new URL("../soundFx/water-drop..mp3", import.meta.url).href;

export const SOUND_EVENT_DOM_EVENT = "sandbots:sound-event";

export const SOUND_EVENT_IDS = Object.freeze({
  UI_CLICK: "ui.click",
  UI_CONFIRM: "ui.confirm",
  UI_CANCEL: "ui.cancel",
  UI_NAVIGATE: "ui.navigate",
  UI_CHANGE: "ui.change",
  UI_NOTICE: "ui.notice",
  GAMEPLAY_COLLECT: "gameplay.collect",
  GAMEPLAY_PLACE: "gameplay.place",
  GAMEPLAY_SUCCESS: "gameplay.success",
  GAMEPLAY_IMPACT: "gameplay.impact",
  GAMEPLAY_WATER: "gameplay.water",
  BOT_SIGNAL: "bot.signal"
});

export const DEFAULT_SOUND_EVENT_REGISTRY = Object.freeze({
  [SOUND_EVENT_IDS.UI_CLICK]: {
    src: UI_CLICK_SFX_URL,
    volume: 0.34,
    cooldownMs: 70
  },
  [SOUND_EVENT_IDS.UI_CONFIRM]: {
    src: UI_CONFIRM_SFX_URL,
    volume: 0.22,
    cooldownMs: 120
  },
  [SOUND_EVENT_IDS.UI_CANCEL]: {
    src: UI_CLICK_SFX_URL,
    volume: 0.22,
    cooldownMs: 120
  },
  [SOUND_EVENT_IDS.UI_NAVIGATE]: {
    src: UI_CLICK_SFX_URL,
    volume: 0.2,
    cooldownMs: 60
  },
  [SOUND_EVENT_IDS.UI_CHANGE]: {
    src: UI_CLICK_SFX_URL,
    volume: 0.18,
    cooldownMs: 90
  },
  [SOUND_EVENT_IDS.UI_NOTICE]: {
    src: UI_CONFIRM_SFX_URL,
    volume: 0.16,
    cooldownMs: 180
  },
  [SOUND_EVENT_IDS.GAMEPLAY_COLLECT]: {
    src: UI_CLICK_SFX_URL,
    volume: 0.48,
    cooldownMs: 40
  },
  [SOUND_EVENT_IDS.GAMEPLAY_PLACE]: {
    src: PLACE_OBJECT_SFX_URL,
    volume: 0.55,
    cooldownMs: 80
  },
  [SOUND_EVENT_IDS.GAMEPLAY_SUCCESS]: {
    src: UI_SUCCESS_SFX_URL,
    volume: 0.6,
    cooldownMs: 180
  },
  [SOUND_EVENT_IDS.GAMEPLAY_IMPACT]: {
    src: IMPACT_SFX_URL,
    volume: 0.72,
    cooldownMs: 140
  },
  [SOUND_EVENT_IDS.GAMEPLAY_WATER]: {
    src: WATER_SFX_URL,
    volume: 0.54,
    cooldownMs: 55
  },
  [SOUND_EVENT_IDS.BOT_SIGNAL]: {
    src: BOT_SIGNAL_SFX_URL,
    volume: 0.56,
    cooldownMs: 120
  }
});

const INTERACTIVE_SELECTOR = [
  "button",
  "a[href]",
  "input",
  "select",
  "textarea",
  "summary",
  "[role='button']",
  "[role='menuitem']",
  "[role='option']",
  "[role='switch']",
  "[role='tab']",
  "[data-sound-event]"
].join(",");

const CHANGE_SELECTOR = [
  "input",
  "select",
  "textarea",
  "[role='switch']"
].join(",");

const NAVIGATION_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight"
]);

const CONFIRM_KEYS = new Set([
  "Enter",
  "Space",
  "NumpadEnter",
  "KeyX"
]);

const CANCEL_KEYS = new Set([
  "Escape",
  "KeyB"
]);

function clamp01(value, fallback = 1) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.max(0, Math.min(1, numeric));
}

function getClosestElement(target, selector) {
  if (!target?.closest) {
    return null;
  }
  return target.closest(selector);
}

function isDisabledElement(element) {
  return Boolean(
    element?.disabled ||
      element?.getAttribute?.("aria-disabled") === "true" ||
      element?.dataset?.disabled === "true"
  );
}

function resolveElementSoundEvent(target, fallbackEventId) {
  const soundElement = getClosestElement(target, "[data-sound-event]");
  const explicitEventId = soundElement?.dataset?.soundEvent;
  if (explicitEventId) {
    return explicitEventId;
  }

  const interactiveElement = getClosestElement(target, INTERACTIVE_SELECTOR);
  if (!interactiveElement || isDisabledElement(interactiveElement)) {
    return null;
  }

  const changeElement = getClosestElement(target, CHANGE_SELECTOR);
  if (changeElement && !isDisabledElement(changeElement)) {
    return SOUND_EVENT_IDS.UI_CHANGE;
  }

  return fallbackEventId;
}

function resolveKeySoundEvent(event) {
  if (event.repeat) {
    return null;
  }

  const target = event.target;
  const interactiveElement = getClosestElement(target, INTERACTIVE_SELECTOR);
  if (!interactiveElement || isDisabledElement(interactiveElement)) {
    return null;
  }

  if (CANCEL_KEYS.has(event.code)) {
    return SOUND_EVENT_IDS.UI_CANCEL;
  }

  if (CONFIRM_KEYS.has(event.code)) {
    return SOUND_EVENT_IDS.UI_CONFIRM;
  }

  if (NAVIGATION_KEYS.has(event.code)) {
    return SOUND_EVENT_IDS.UI_NAVIGATE;
  }

  return null;
}

function createDefaultAudioFactory(windowRef) {
  return (src) => {
    if (typeof windowRef?.Audio !== "function") {
      return null;
    }
    return new windowRef.Audio(src);
  };
}

export function createSoundEventRuntime({
  windowRef = typeof window !== "undefined" ? window : null,
  root = null,
  audioFactory = createDefaultAudioFactory(windowRef),
  volumeScale = () => 1,
  registry = DEFAULT_SOUND_EVENT_REGISTRY,
  now = () => windowRef?.performance?.now?.() ?? Date.now()
} = {}) {
  const audioBySrc = new Map();
  const lastPlayedAtByEvent = new Map();
  const detachHandlers = [];

  function getEffectiveVolume(config, overrideVolume) {
    const baseVolume = overrideVolume ?? config.volume ?? 1;
    const scale = typeof volumeScale === "function" ? volumeScale() : volumeScale;
    return clamp01(clamp01(baseVolume) * clamp01(scale));
  }

  function getAudio(config) {
    if (!config?.src) {
      return null;
    }

    if (audioBySrc.has(config.src)) {
      return audioBySrc.get(config.src);
    }

    const audio = audioFactory?.(config.src) || null;
    if (!audio) {
      return null;
    }

    audio.preload = "auto";
    audioBySrc.set(config.src, audio);
    return audio;
  }

  function play(eventId, options = {}) {
    const config = registry?.[eventId];
    if (!config) {
      return false;
    }

    const currentTime = now();
    const cooldownMs = options.cooldownMs ?? config.cooldownMs ?? 0;
    const lastPlayedAt = lastPlayedAtByEvent.get(eventId);
    if (Number.isFinite(lastPlayedAt) && currentTime - lastPlayedAt < cooldownMs) {
      return false;
    }

    const audio = getAudio(config);
    if (!audio) {
      return false;
    }

    audio.volume = getEffectiveVolume(config, options.volume);
    try {
      audio.currentTime = 0;
    } catch {
      // Browser audio objects may reject seeking before metadata is available.
    }

    try {
      const playResult = audio.play?.();
      if (playResult?.catch) {
        playResult.catch(() => {});
      }
    } catch {
      return false;
    }

    lastPlayedAtByEvent.set(eventId, currentTime);
    return true;
  }

  function handleClick(event) {
    const eventId = resolveElementSoundEvent(event.target, SOUND_EVENT_IDS.UI_CLICK);
    if (eventId) {
      play(eventId);
    }
  }

  function handleInputChange(event) {
    const changeElement = getClosestElement(event.target, CHANGE_SELECTOR);
    if (!changeElement || isDisabledElement(changeElement)) {
      return;
    }
    play(SOUND_EVENT_IDS.UI_CHANGE);
  }

  function handleKeydown(event) {
    const eventId = resolveKeySoundEvent(event);
    if (eventId) {
      play(eventId);
    }
  }

  function handleRequestedSoundEvent(event) {
    const eventId = event?.detail?.id || event?.detail?.eventId;
    if (eventId) {
      play(eventId, event.detail);
    }
  }

  function attachUiEventDelegates(nextRoot = root) {
    if (!nextRoot?.addEventListener) {
      return () => {};
    }

    nextRoot.addEventListener("click", handleClick, true);
    nextRoot.addEventListener("input", handleInputChange, true);
    nextRoot.addEventListener("change", handleInputChange, true);
    nextRoot.addEventListener(SOUND_EVENT_DOM_EVENT, handleRequestedSoundEvent);
    windowRef?.addEventListener?.("keydown", handleKeydown, true);
    windowRef?.addEventListener?.(SOUND_EVENT_DOM_EVENT, handleRequestedSoundEvent);

    const detach = () => {
      nextRoot.removeEventListener("click", handleClick, true);
      nextRoot.removeEventListener("input", handleInputChange, true);
      nextRoot.removeEventListener("change", handleInputChange, true);
      nextRoot.removeEventListener(SOUND_EVENT_DOM_EVENT, handleRequestedSoundEvent);
      windowRef?.removeEventListener?.("keydown", handleKeydown, true);
      windowRef?.removeEventListener?.(SOUND_EVENT_DOM_EVENT, handleRequestedSoundEvent);
    };

    detachHandlers.push(detach);
    return detach;
  }

  function dispose() {
    while (detachHandlers.length > 0) {
      detachHandlers.pop()?.();
    }
    audioBySrc.clear();
    lastPlayedAtByEvent.clear();
  }

  return {
    attachUiEventDelegates,
    dispose,
    getRegisteredEventIds: () => Object.keys(registry || {}),
    play
  };
}
