import { GAME_FLOW } from "../../gameFlow.js";

export const PSX_DISTANCE_FOG_PRESET_ID = Object.freeze({
  OFF: "off",
  GAMEPLAY_DEFAULT: "gameplay-default",
  CRASH_MIST: "crash-mist"
});

export const DEFAULT_PSX_DISTANCE_FOG_PRESET_ID = PSX_DISTANCE_FOG_PRESET_ID.OFF;

function freezePreset(preset) {
  return Object.freeze({
    ...preset,
    color: Object.freeze([...preset.color])
  });
}

export const PSX_DISTANCE_FOG_PRESETS = Object.freeze({
  [PSX_DISTANCE_FOG_PRESET_ID.OFF]: freezePreset({
    id: PSX_DISTANCE_FOG_PRESET_ID.OFF,
    enabled: false,
    color: [0, 0, 0],
    near: 0,
    far: 1,
    intensity: 0,
    renderCullDistance: 0
  }),
  [PSX_DISTANCE_FOG_PRESET_ID.GAMEPLAY_DEFAULT]: freezePreset({
    id: PSX_DISTANCE_FOG_PRESET_ID.GAMEPLAY_DEFAULT,
    enabled: true,
    color: [0.72, 0.78, 0.82],
    near: 26,
    far: 64,
    intensity: 0.58,
    renderCullDistance: 68
  }),
  [PSX_DISTANCE_FOG_PRESET_ID.CRASH_MIST]: freezePreset({
    id: PSX_DISTANCE_FOG_PRESET_ID.CRASH_MIST,
    enabled: true,
    color: [0.68, 0.72, 0.74],
    near: 18,
    far: 64,
    intensity: 0.78,
    renderCullDistance: 0
  })
});

export const PSX_DISTANCE_FOG_SCENE_PRESETS = Object.freeze({
  [GAME_FLOW.CINEMATIC]: Object.freeze({
    presetId: PSX_DISTANCE_FOG_PRESET_ID.CRASH_MIST
  }),
  [GAME_FLOW.GAMEPLAY]: Object.freeze({
    presetId: PSX_DISTANCE_FOG_PRESET_ID.GAMEPLAY_DEFAULT
  }),
  [GAME_FLOW.INTRO]: Object.freeze({
    presetId: PSX_DISTANCE_FOG_PRESET_ID.OFF
  }),
  [GAME_FLOW.START]: Object.freeze({
    presetId: PSX_DISTANCE_FOG_PRESET_ID.OFF
  })
});

export const PSX_DISTANCE_FOG_READABILITY_TARGET = Object.freeze({
  PLAYER: "player",
  ACTIVE_NPC: "active-npc",
  OBJECTIVE_MARKER: "objective-marker",
  INTERACTION_PROMPT: "interaction-prompt",
  ABILITY_TARGET: "ability-target"
});

export const PSX_DISTANCE_FOG_READABILITY_LIMITS = Object.freeze({
  [PSX_DISTANCE_FOG_READABILITY_TARGET.PLAYER]: Object.freeze({
    maxReadableDistance: 9,
    maxFogBlend: 0.16
  }),
  [PSX_DISTANCE_FOG_READABILITY_TARGET.ACTIVE_NPC]: Object.freeze({
    maxReadableDistance: 7,
    maxFogBlend: 0.18
  }),
  [PSX_DISTANCE_FOG_READABILITY_TARGET.OBJECTIVE_MARKER]: Object.freeze({
    maxReadableDistance: 24,
    maxFogBlend: 0.38
  }),
  [PSX_DISTANCE_FOG_READABILITY_TARGET.INTERACTION_PROMPT]: Object.freeze({
    maxReadableDistance: 6,
    maxFogBlend: 0.12
  }),
  [PSX_DISTANCE_FOG_READABILITY_TARGET.ABILITY_TARGET]: Object.freeze({
    maxReadableDistance: 14,
    maxFogBlend: 0.28
  })
});

function clamp01(value, fallback = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(1, Math.max(0, number));
}

function normalizeDistance(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : fallback;
}

function normalizeColor(color, fallback) {
  if (!Array.isArray(color) || color.length < 3) {
    return [...fallback];
  }

  return [
    clamp01(color[0], fallback[0]),
    clamp01(color[1], fallback[1]),
    clamp01(color[2], fallback[2])
  ];
}

export function getPsxDistanceFogPreset(presetId = DEFAULT_PSX_DISTANCE_FOG_PRESET_ID) {
  return PSX_DISTANCE_FOG_PRESETS[presetId] ||
    PSX_DISTANCE_FOG_PRESETS[DEFAULT_PSX_DISTANCE_FOG_PRESET_ID];
}

export function resolvePsxDistanceFogSettings({
  sceneId = GAME_FLOW.GAMEPLAY,
  presetId = null,
  override = null
} = {}) {
  const scenePresetId = PSX_DISTANCE_FOG_SCENE_PRESETS[sceneId]?.presetId;
  const basePreset = getPsxDistanceFogPreset(
    presetId || override?.presetId || scenePresetId || DEFAULT_PSX_DISTANCE_FOG_PRESET_ID
  );
  const color = normalizeColor(override?.color, basePreset.color);
  const near = normalizeDistance(override?.near, basePreset.near);
  const far = Math.max(near + 0.01, normalizeDistance(override?.far, basePreset.far));

  return Object.freeze({
    id: override?.id || basePreset.id,
    sourcePresetId: basePreset.id,
    enabled: typeof override?.enabled === "boolean" ? override.enabled : basePreset.enabled,
    color: Object.freeze(color),
    near,
    far,
    intensity: clamp01(override?.intensity, basePreset.intensity),
    renderCullDistance: normalizeDistance(
      override?.renderCullDistance,
      basePreset.renderCullDistance ?? 0
    )
  });
}

export function getPsxDistanceFogBlendAtDistance(settings = getPsxDistanceFogPreset(), distance = 0) {
  if (!settings?.enabled) {
    return 0;
  }

  const near = normalizeDistance(settings.near, 0);
  const far = Math.max(near + 0.01, normalizeDistance(settings.far, near + 0.01));
  const normalizedDistance = normalizeDistance(distance, 0);
  const progress = clamp01((normalizedDistance - near) / (far - near));
  const smoothProgress = progress * progress * (3 - 2 * progress);

  return clamp01(smoothProgress * clamp01(settings.intensity, 0));
}

export function resolvePsxDistanceFogReadability({
  settings = resolvePsxDistanceFogSettings(),
  target = PSX_DISTANCE_FOG_READABILITY_TARGET.PLAYER,
  distance = 0
} = {}) {
  const limits = PSX_DISTANCE_FOG_READABILITY_LIMITS[target] ||
    PSX_DISTANCE_FOG_READABILITY_LIMITS[PSX_DISTANCE_FOG_READABILITY_TARGET.PLAYER];
  const checkedDistance = Math.min(
    normalizeDistance(distance, 0),
    limits.maxReadableDistance
  );
  const fogBlend = getPsxDistanceFogBlendAtDistance(settings, checkedDistance);

  return Object.freeze({
    target,
    checkedDistance,
    fogBlend,
    readable: fogBlend <= limits.maxFogBlend,
    maxFogBlend: limits.maxFogBlend
  });
}
