import { describe, expect, it } from "vitest";
import {
  SETTINGS_STORAGE_KEY,
  SETTINGS_GROUP_IDS,
  SETTINGS_SCHEMA,
  createDefaultSettingsState,
  loadSettingsState,
  saveSettingsState
} from "../app/settings/settingsState.js";

describe("settingsState", () => {
  it("defines expandable settings groups for camera, volume, language and accessibility", () => {
    expect(SETTINGS_GROUP_IDS).toEqual({
      CAMERA: "camera",
      VOLUME: "volume",
      LANGUAGE: "language",
      ACCESSIBILITY: "accessibility"
    });
    expect(SETTINGS_SCHEMA.map((group) => group.id)).toEqual([
      "camera",
      "volume",
      "language",
      "accessibility"
    ]);
  });

  it("creates default settings state from the schema", () => {
    expect(createDefaultSettingsState()).toEqual({
      camera: {
        followStrength: 0.72,
        invertLookX: false,
        invertLookY: false
      },
      volume: {
        master: 0.8,
        music: 0.68,
        ambience: 0.42,
        sfx: 0.82
      },
      language: {
        locale: "en"
      },
      accessibility: {
        reduceMotion: false,
        highContrastHud: false,
        holdToConfirm: false
      }
    });
  });

  it("returns a fresh mutable state object on every call", () => {
    const firstState = createDefaultSettingsState();
    const secondState = createDefaultSettingsState();

    firstState.volume.master = 0.1;

    expect(secondState.volume.master).toBe(0.8);
  });

  it("loads persisted settings onto the current schema defaults", () => {
    const storage = {
      getItem: (key) => key === SETTINGS_STORAGE_KEY ?
        JSON.stringify({
          volume: { master: 0.25 },
          accessibility: { reduceMotion: true },
          staleGroup: { old: true }
        }) :
        null
    };

    expect(loadSettingsState(storage)).toEqual({
      camera: {
        followStrength: 0.72,
        invertLookX: false,
        invertLookY: false
      },
      volume: {
        master: 0.25,
        music: 0.68,
        ambience: 0.42,
        sfx: 0.82
      },
      language: {
        locale: "en"
      },
      accessibility: {
        reduceMotion: true,
        highContrastHud: false,
        holdToConfirm: false
      }
    });
  });

  it("saves settings state to storage", () => {
    const writes = [];
    const storage = {
      setItem(key, value) {
        writes.push([key, JSON.parse(value)]);
      }
    };

    expect(saveSettingsState(storage, {
      volume: { master: 0.5 }
    })).toBe(true);
    expect(writes).toEqual([
      [
        SETTINGS_STORAGE_KEY,
        {
          version: 1,
          settings: {
            volume: { master: 0.5 }
          }
        }
      ]
    ]);
  });
});
