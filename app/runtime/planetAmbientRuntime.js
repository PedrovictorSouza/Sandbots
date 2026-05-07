export const PLANET_AMBIENT_INTENSITY = Object.freeze({
  OPENING: "opening",
  CALM: "calm"
});

const WIND_AMBIENT_URL = new URL("../soundFx/windblow.mp3", import.meta.url).href;
const DEFAULT_MASTER_VOLUME = 1;
const WIND_INTENSITY_PROFILES = Object.freeze({
  [PLANET_AMBIENT_INTENSITY.OPENING]: {
    volume: 0.24,
    variance: 0.06,
    intervalMs: 5200
  },
  [PLANET_AMBIENT_INTENSITY.CALM]: {
    volume: 0.08,
    variance: 0.025,
    intervalMs: 7600
  }
});

function clampVolume(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return DEFAULT_MASTER_VOLUME;
  }

  return Math.max(0, Math.min(1, numericValue));
}

function createDefaultAudio(src) {
  if (typeof Audio !== "function") {
    return null;
  }

  return new Audio(src);
}

function getTimerApi() {
  if (typeof globalThis === "undefined") {
    return null;
  }

  return {
    setTimeout: globalThis.setTimeout?.bind(globalThis),
    clearTimeout: globalThis.clearTimeout?.bind(globalThis)
  };
}

function resolveIntensityProfile(intensity) {
  return WIND_INTENSITY_PROFILES[intensity] ||
    WIND_INTENSITY_PROFILES[PLANET_AMBIENT_INTENSITY.CALM];
}

export function createPlanetAmbientRuntime({
  windSrc = WIND_AMBIENT_URL,
  audioFactory = createDefaultAudio,
  timerApi = getTimerApi(),
  random = Math.random,
  initialVolume = DEFAULT_MASTER_VOLUME,
  initialIntensity = PLANET_AMBIENT_INTENSITY.OPENING
} = {}) {
  let audio = null;
  let masterVolume = clampVolume(initialVolume);
  let intensity = initialIntensity;
  let modulationTimer = null;

  function getAudio() {
    if (audio) {
      return audio;
    }

    audio = audioFactory(windSrc);
    if (!audio) {
      return null;
    }

    audio.loop = true;
    audio.volume = 0;
    return audio;
  }

  function getModulatedVolume() {
    const profile = resolveIntensityProfile(intensity);
    const randomOffset = ((typeof random === "function" ? random() : 0.5) - 0.5) * profile.variance;
    return clampVolume((profile.volume + randomOffset) * masterVolume);
  }

  function applyVolume() {
    const nextAudio = getAudio();
    if (!nextAudio) {
      return 0;
    }

    const nextVolume = getModulatedVolume();
    nextAudio.volume = nextVolume;
    return nextVolume;
  }

  function clearModulationTimer() {
    if (modulationTimer !== null && typeof timerApi?.clearTimeout === "function") {
      timerApi.clearTimeout(modulationTimer);
    }
    modulationTimer = null;
  }

  function scheduleModulation() {
    clearModulationTimer();
    const profile = resolveIntensityProfile(intensity);

    if (typeof timerApi?.setTimeout !== "function") {
      return;
    }

    modulationTimer = timerApi.setTimeout(() => {
      modulationTimer = null;
      applyVolume();
      scheduleModulation();
    }, profile.intervalMs);
  }

  function setIntensity(nextIntensity) {
    intensity = resolveIntensityProfile(nextIntensity) === WIND_INTENSITY_PROFILES[nextIntensity] ?
      nextIntensity :
      PLANET_AMBIENT_INTENSITY.CALM;
    applyVolume();
    scheduleModulation();
    return intensity;
  }

  function setVolume(nextVolume) {
    masterVolume = clampVolume(nextVolume);
    applyVolume();
    return masterVolume;
  }

  function start({ intensity: nextIntensity = null } = {}) {
    if (nextIntensity) {
      intensity = resolveIntensityProfile(nextIntensity) === WIND_INTENSITY_PROFILES[nextIntensity] ?
        nextIntensity :
        PLANET_AMBIENT_INTENSITY.CALM;
    }

    const nextAudio = getAudio();
    if (!nextAudio) {
      return false;
    }

    nextAudio.loop = true;
    applyVolume();
    scheduleModulation();
    const playResult = nextAudio.play?.();
    if (playResult?.catch) {
      playResult.catch(() => {});
    }
    return true;
  }

  function stop() {
    clearModulationTimer();
    audio?.pause?.();
  }

  function startOnFirstGesture(target, options = {}) {
    if (!target?.addEventListener) {
      return () => {};
    }

    let active = true;
    const handleGesture = () => {
      if (!active) {
        return;
      }

      active = false;
      target.removeEventListener?.("pointerdown", handleGesture);
      target.removeEventListener?.("keydown", handleGesture);
      target.removeEventListener?.("touchstart", handleGesture);
      start(options);
    };

    target.addEventListener("pointerdown", handleGesture, { once: true });
    target.addEventListener("keydown", handleGesture, { once: true });
    target.addEventListener("touchstart", handleGesture, { once: true });

    return () => {
      active = false;
      target.removeEventListener?.("pointerdown", handleGesture);
      target.removeEventListener?.("keydown", handleGesture);
      target.removeEventListener?.("touchstart", handleGesture);
    };
  }

  return {
    getIntensity() {
      return intensity;
    },
    getVolume() {
      return masterVolume;
    },
    setIntensity,
    setVolume,
    start,
    startOnFirstGesture,
    stop
  };
}
