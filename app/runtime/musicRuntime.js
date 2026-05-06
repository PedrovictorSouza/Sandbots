export const MUSIC_TRACK_IDS = Object.freeze({
  FIRST_TREE_REVIVED: "first-tree-revived"
});

export const DEFAULT_MUSIC_TRACKS = Object.freeze({
  [MUSIC_TRACK_IDS.FIRST_TREE_REVIVED]: "/Soundtrack/SoundTheme-1.mp3"
});

const DEFAULT_MUSIC_VOLUME = 0.72;

function clampVolume(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return DEFAULT_MUSIC_VOLUME;
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
  initialVolume = DEFAULT_MUSIC_VOLUME
} = {}) {
  const audioByTrackId = new Map();
  let volume = clampVolume(initialVolume);

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
    audio.volume = volume;
    audioByTrackId.set(trackId, audio);
    return audio;
  }

  function setVolume(nextVolume) {
    volume = clampVolume(nextVolume);

    for (const audio of audioByTrackId.values()) {
      audio.volume = volume;
    }

    return volume;
  }

  function play(trackId, { restart = false } = {}) {
    const audio = getAudio(trackId);
    if (!audio) {
      return false;
    }

    audio.loop = true;
    audio.volume = volume;

    if (restart) {
      try {
        audio.currentTime = 0;
      } catch {
        // Some browser audio objects disallow seeking before metadata is ready.
      }
    }

    const playResult = audio.play?.();
    if (playResult?.catch) {
      playResult.catch(() => {});
    }

    return true;
  }

  return {
    getVolume() {
      return volume;
    },
    setVolume,
    play
  };
}
