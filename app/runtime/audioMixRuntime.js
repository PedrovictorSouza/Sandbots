const DEFAULT_AUDIO_GROUP = Object.freeze({
  master: 1,
  music: 1,
  ambience: 1,
  sfx: 1
});

function clampVolume(value, fallback = 1) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.max(0, Math.min(1, numericValue));
}

export function resolveAudioMix(settingsState = {}) {
  const volume = {
    ...DEFAULT_AUDIO_GROUP,
    ...(settingsState?.volume || {})
  };
  const master = clampVolume(volume.master);

  return {
    master,
    music: master * clampVolume(volume.music),
    ambience: master * clampVolume(volume.ambience),
    sfx: master * clampVolume(volume.sfx)
  };
}

export function createAudioMixRuntime({
  settingsState,
  musicRuntime = null,
  planetAmbientRuntime = null
} = {}) {
  let mix = resolveAudioMix(settingsState);

  function apply() {
    musicRuntime?.setVolume?.(mix.music);
    planetAmbientRuntime?.setVolume?.(mix.ambience);
    return mix;
  }

  function updateFromSettings(nextSettingsState = settingsState) {
    mix = resolveAudioMix(nextSettingsState);
    return apply();
  }

  function scaleMusicVolume(baseVolume = 1) {
    return clampVolume(baseVolume, 1) * mix.music;
  }

  function scaleSfxVolume(baseVolume = 1) {
    return clampVolume(baseVolume, 1) * mix.sfx;
  }

  apply();

  return {
    getMix: () => ({ ...mix }),
    getMusicVolumeScale: () => mix.music,
    getSfxVolumeScale: () => mix.sfx,
    getAmbienceVolumeScale: () => mix.ambience,
    scaleMusicVolume,
    scaleSfxVolume,
    updateFromSettings
  };
}
