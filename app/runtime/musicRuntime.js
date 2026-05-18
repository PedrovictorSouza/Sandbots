export const MUSIC_TRACK_IDS = Object.freeze({
  MAIN_THEME: "main-theme",
  MAIN_THEME_B: "main-theme-b"
});

export const DEFAULT_MUSIC_TRACKS = Object.freeze({
  [MUSIC_TRACK_IDS.MAIN_THEME]: "/Soundtrack/main-theme.mp3",
  [MUSIC_TRACK_IDS.MAIN_THEME_B]: "/Soundtrack/main-theme-b.mp3"
});

const DEFAULT_MUSIC_VOLUME = 0.576;
const DEFAULT_OBJECT_MUSIC_DUCK_FACTOR = 0.18;
const DEFAULT_OBJECT_MUSIC_RESUME_DELAY_SECONDS = 30;
const DEFAULT_MUSIC_FADE_SPEED = 2.4;

function clampVolume(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return DEFAULT_MUSIC_VOLUME;
  }

  return Math.max(0, Math.min(1, numericValue));
}

function clampRandomUnit(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.max(0, Math.min(1, numericValue));
}

function createDefaultAudio(src) {
  if (typeof Audio !== "function") {
    return null;
  }

  return new Audio(src);
}

export function createMusicRuntime({
  tracks = DEFAULT_MUSIC_TRACKS,
  audioFactory = createDefaultAudio,
  initialVolume = DEFAULT_MUSIC_VOLUME,
  random = Math.random,
  soundtrackTrackIds = [MUSIC_TRACK_IDS.MAIN_THEME, MUSIC_TRACK_IDS.MAIN_THEME_B],
  objectMusicDuckFactor = DEFAULT_OBJECT_MUSIC_DUCK_FACTOR,
  objectMusicResumeDelaySeconds = DEFAULT_OBJECT_MUSIC_RESUME_DELAY_SECONDS,
  fadeSpeed = DEFAULT_MUSIC_FADE_SPEED
} = {}) {
  const audioByTrackId = new Map();
  let volume = clampVolume(initialVolume);
  let effectiveVolume = volume;
  let pendingGesturePlay = null;
  let activeTrackId = null;
  let backgroundResumeEnabled = false;
  let lastObjectMusicActiveAt = Number.NEGATIVE_INFINITY;
  let objectMusicActive = false;

  const normalizedSoundtrackTrackIds = soundtrackTrackIds
    .filter((trackId) => typeof trackId === "string" && tracks[trackId]);
  const duckFactor = clampVolume(objectMusicDuckFactor);
  const resumeDelaySeconds = Math.max(0, Number(objectMusicResumeDelaySeconds) || 0);
  const volumeFadeSpeed = Math.max(0.001, Number(fadeSpeed) || DEFAULT_MUSIC_FADE_SPEED);

  function applyEffectiveVolume(nextVolume = effectiveVolume) {
    effectiveVolume = clampVolume(nextVolume);

    for (const audio of audioByTrackId.values()) {
      audio.volume = effectiveVolume;
    }

    return effectiveVolume;
  }

  function getAudio(trackId) {
    if (!trackId || !tracks[trackId]) {
      return null;
    }

    if (audioByTrackId.has(trackId)) {
      return audioByTrackId.get(trackId);
    }

    const audio = audioFactory(tracks[trackId]);
    if (!audio) {
      return null;
    }

    audio.loop = true;
    audio.volume = effectiveVolume;
    audioByTrackId.set(trackId, audio);
    return audio;
  }

  function setVolume(nextVolume) {
    volume = clampVolume(nextVolume);
    applyEffectiveVolume(volume);

    return volume;
  }

  function play(trackId, { restart = false } = {}) {
    const audio = getAudio(trackId);
    if (!audio) {
      return false;
    }

    audio.loop = true;
    audio.volume = effectiveVolume;

    if (restart) {
      try {
        audio.currentTime = 0;
      } catch {
        // Some browser audio objects disallow seeking before metadata is ready.
      }
    }

    const playResult = audio.play?.();
    activeTrackId = trackId;
    if (normalizedSoundtrackTrackIds.includes(trackId)) {
      backgroundResumeEnabled = true;
    }
    if (playResult?.catch) {
      playResult.catch((error) => {
        if (error?.name === "NotAllowedError") {
          pendingGesturePlay = { trackId };
        }
      });
    }

    return true;
  }

  function stop(trackId = null) {
    const entries = trackId ?
      [[trackId, audioByTrackId.get(trackId)]] :
      [...audioByTrackId.entries()];
    let stopped = false;

    for (const [entryTrackId, audio] of entries) {
      if (!audio) {
        continue;
      }

      audio.pause?.();
      try {
        audio.currentTime = 0;
      } catch {
        // Some browser audio objects disallow seeking before metadata is ready.
      }

      if (!trackId || pendingGesturePlay?.trackId === entryTrackId) {
        pendingGesturePlay = null;
      }
      if (!trackId || activeTrackId === entryTrackId) {
        activeTrackId = null;
      }
      stopped = true;
    }

    return stopped;
  }

  function pickRandomSoundtrackTrackId() {
    if (!normalizedSoundtrackTrackIds.length) {
      return null;
    }

    const safeRandomValue = clampRandomUnit(
      typeof random === "function" ? random() : Math.random()
    );
    const index = Math.max(
      0,
      Math.min(
        normalizedSoundtrackTrackIds.length - 1,
        Math.floor(safeRandomValue * normalizedSoundtrackTrackIds.length)
      )
    );
    return normalizedSoundtrackTrackIds[index];
  }

  function playRandomSoundtrack({ restart = false } = {}) {
    const trackId = pickRandomSoundtrackTrackId();
    if (!trackId) {
      return {
        played: false,
        trackId: null
      };
    }

    backgroundResumeEnabled = true;
    return {
      played: play(trackId, { restart }),
      trackId
    };
  }

  function stopBackgroundSoundtrack() {
    let stopped = false;

    for (const trackId of normalizedSoundtrackTrackIds) {
      stopped = stop(trackId) || stopped;
    }

    return stopped;
  }

  function reportObjectMusicActivity({
    active,
    nowSeconds = 0
  } = {}) {
    objectMusicActive = Boolean(active);

    if (objectMusicActive) {
      const numericNow = Number(nowSeconds);
      lastObjectMusicActiveAt = Number.isFinite(numericNow) ? numericNow : 0;
    }

    return {
      objectMusicActive,
      lastObjectMusicActiveAt
    };
  }

  function update(deltaSeconds = 0, { nowSeconds = 0 } = {}) {
    const numericDelta = Number(deltaSeconds);
    const safeDelta = Number.isFinite(numericDelta) ? Math.max(0, numericDelta) : 0;
    const numericNow = Number(nowSeconds);
    const safeNow = Number.isFinite(numericNow) ? numericNow : 0;
    const waitingForObjectMusicCooldown =
      Number.isFinite(lastObjectMusicActiveAt) &&
      safeNow - lastObjectMusicActiveAt < resumeDelaySeconds;
    const shouldDuck = objectMusicActive || waitingForObjectMusicCooldown;
    const targetVolume = volume * (shouldDuck ? duckFactor : 1);

    if (!shouldDuck && !activeTrackId && backgroundResumeEnabled) {
      playRandomSoundtrack();
    }

    const fadeAmount = Math.min(1, safeDelta * volumeFadeSpeed);
    const nextEffectiveVolume =
      fadeAmount >= 1 ?
        targetVolume :
        effectiveVolume + ((targetVolume - effectiveVolume) * fadeAmount);
    applyEffectiveVolume(
      Math.abs(nextEffectiveVolume - targetVolume) < 0.001 ?
        targetVolume :
        nextEffectiveVolume
    );

    return {
      objectMusicActive,
      waitingForObjectMusicCooldown,
      targetVolume,
      effectiveVolume
    };
  }

  function startOnFirstGesture(target) {
    if (!target?.addEventListener) {
      return () => {};
    }

    let active = true;
    const handleGesture = () => {
      if (!active || !pendingGesturePlay) {
        return;
      }

      const pending = pendingGesturePlay;
      pendingGesturePlay = null;
      play(pending.trackId);
    };

    target.addEventListener("pointerdown", handleGesture);
    target.addEventListener("keydown", handleGesture);
    target.addEventListener("touchstart", handleGesture);

    return () => {
      active = false;
      target.removeEventListener?.("pointerdown", handleGesture);
      target.removeEventListener?.("keydown", handleGesture);
      target.removeEventListener?.("touchstart", handleGesture);
    };
  }

  return {
    getVolume() {
      return volume;
    },
    getEffectiveVolume() {
      return effectiveVolume;
    },
    setVolume,
    play,
    playRandomSoundtrack,
    stop,
    stopBackgroundSoundtrack,
    reportObjectMusicActivity,
    update,
    startOnFirstGesture
  };
}
