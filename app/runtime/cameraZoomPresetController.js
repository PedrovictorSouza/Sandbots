export function createCameraZoomPresetController({
  camera,
  presets = []
} = {}) {
  let presetIndex = 0;

  function getPreset(index) {
    return presets[index] || presets[0] || null;
  }

  function applyPreset(index) {
    const preset = getPreset(index);

    if (!camera || !preset) {
      return;
    }

    if (typeof preset.zoom === "number") {
      camera.setZoom(preset.zoom);
    }

    if (typeof preset.distance === "number") {
      camera.setDistance(preset.distance);
    }
  }

  return {
    cycle() {
      if (!presets.length) {
        return 0;
      }

      presetIndex = (presetIndex + 1) % presets.length;
      applyPreset(presetIndex);
      return presetIndex;
    },
    getIndex() {
      return presetIndex;
    },
    reset() {
      presetIndex = 0;
      applyPreset(presetIndex);
    }
  };
}
