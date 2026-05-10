export const SETTINGS_GROUP_IDS = Object.freeze({
  CAMERA: "camera",
  VOLUME: "volume",
  LANGUAGE: "language",
  ACCESSIBILITY: "accessibility"
});

export const SETTINGS_STORAGE_KEY = "small-island.settings.v1";

export const SETTINGS_CONTROL_TYPES = Object.freeze({
  RANGE: "range",
  TOGGLE: "toggle",
  SELECT: "select"
});

export const DEFAULT_CAMERA_FOLLOW_STRENGTH = 0.72;
export const DEFAULT_MASTER_VOLUME = 0.8;
export const DEFAULT_MUSIC_VOLUME = 0.68;
export const DEFAULT_AMBIENCE_VOLUME = 0.42;
export const DEFAULT_SFX_VOLUME = 0.82;
export const DEFAULT_LOCALE = "en";

function freezeSetting(setting) {
  return Object.freeze({
    ...setting,
    options: setting.options ? Object.freeze([...setting.options]) : undefined
  });
}

function freezeGroup(group) {
  return Object.freeze({
    ...group,
    settings: Object.freeze(group.settings.map(freezeSetting))
  });
}

export const SETTINGS_SCHEMA = Object.freeze([
  freezeGroup({
    id: SETTINGS_GROUP_IDS.CAMERA,
    label: "Camera",
    settings: [
      {
        id: "followStrength",
        label: "Follow Strength",
        type: SETTINGS_CONTROL_TYPES.RANGE,
        min: 0.3,
        max: 1,
        step: 0.02,
        defaultValue: DEFAULT_CAMERA_FOLLOW_STRENGTH
      },
      {
        id: "invertLookX",
        label: "Invert Look X",
        type: SETTINGS_CONTROL_TYPES.TOGGLE,
        defaultValue: false
      },
      {
        id: "invertLookY",
        label: "Invert Look Y",
        type: SETTINGS_CONTROL_TYPES.TOGGLE,
        defaultValue: false
      }
    ]
  }),
  freezeGroup({
    id: SETTINGS_GROUP_IDS.VOLUME,
    label: "Volume",
    settings: [
      {
        id: "master",
        label: "Master",
        type: SETTINGS_CONTROL_TYPES.RANGE,
        min: 0,
        max: 1,
        step: 0.02,
        defaultValue: DEFAULT_MASTER_VOLUME
      },
      {
        id: "music",
        label: "Music",
        type: SETTINGS_CONTROL_TYPES.RANGE,
        min: 0,
        max: 1,
        step: 0.02,
        defaultValue: DEFAULT_MUSIC_VOLUME
      },
      {
        id: "ambience",
        label: "Ambience",
        type: SETTINGS_CONTROL_TYPES.RANGE,
        min: 0,
        max: 1,
        step: 0.02,
        defaultValue: DEFAULT_AMBIENCE_VOLUME
      },
      {
        id: "sfx",
        label: "SFX",
        type: SETTINGS_CONTROL_TYPES.RANGE,
        min: 0,
        max: 1,
        step: 0.02,
        defaultValue: DEFAULT_SFX_VOLUME
      }
    ]
  }),
  freezeGroup({
    id: SETTINGS_GROUP_IDS.LANGUAGE,
    label: "Language",
    settings: [
      {
        id: "locale",
        label: "Language",
        type: SETTINGS_CONTROL_TYPES.SELECT,
        options: ["en", "pt-BR"],
        defaultValue: DEFAULT_LOCALE
      }
    ]
  }),
  freezeGroup({
    id: SETTINGS_GROUP_IDS.ACCESSIBILITY,
    label: "Accessibility",
    settings: [
      {
        id: "reduceMotion",
        label: "Reduce Motion",
        type: SETTINGS_CONTROL_TYPES.TOGGLE,
        defaultValue: false
      },
      {
        id: "highContrastHud",
        label: "High Contrast HUD",
        type: SETTINGS_CONTROL_TYPES.TOGGLE,
        defaultValue: false
      },
      {
        id: "holdToConfirm",
        label: "Hold To Confirm",
        type: SETTINGS_CONTROL_TYPES.TOGGLE,
        defaultValue: false
      }
    ]
  })
]);

export function createDefaultSettingsState(schema = SETTINGS_SCHEMA) {
  return Object.fromEntries(
    schema.map((group) => [
      group.id,
      Object.fromEntries(
        group.settings.map((setting) => [setting.id, setting.defaultValue])
      )
    ])
  );
}

export function cloneSettingsState(settingsState = {}) {
  return Object.fromEntries(
    Object.entries(settingsState).map(([groupId, groupState]) => [
      groupId,
      { ...(groupState || {}) }
    ])
  );
}

export function mergeSettingsState(persistedSettings = {}, schema = SETTINGS_SCHEMA) {
  const defaults = createDefaultSettingsState(schema);

  for (const group of schema) {
    const persistedGroup = persistedSettings?.[group.id];
    if (!persistedGroup || typeof persistedGroup !== "object") {
      continue;
    }

    for (const setting of group.settings) {
      if (Object.hasOwn(persistedGroup, setting.id)) {
        defaults[group.id][setting.id] = persistedGroup[setting.id];
      }
    }
  }

  return defaults;
}

export function loadSettingsState(storage, schema = SETTINGS_SCHEMA) {
  try {
    const raw = storage?.getItem?.(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return createDefaultSettingsState(schema);
    }

    const parsed = JSON.parse(raw);
    return mergeSettingsState(parsed?.settings || parsed, schema);
  } catch {
    return createDefaultSettingsState(schema);
  }
}

export function saveSettingsState(storage, settingsState) {
  try {
    storage?.setItem?.(SETTINGS_STORAGE_KEY, JSON.stringify({
      version: 1,
      settings: cloneSettingsState(settingsState)
    }));
    return true;
  } catch {
    return false;
  }
}
