import { describe, expect, it } from "vitest";
import { GAME_FLOW } from "../gameFlow.js";
import {
  DEFAULT_PSX_DISTANCE_FOG_PRESET_ID,
  getPsxDistanceFogPreset,
  getPsxDistanceFogBlendAtDistance,
  PSX_DISTANCE_FOG_PRESET_ID,
  PSX_DISTANCE_FOG_PRESETS,
  PSX_DISTANCE_FOG_READABILITY_TARGET,
  resolvePsxDistanceFogReadability,
  resolvePsxDistanceFogSettings
} from "../app/rendering/psxDistanceFogConfig.js";

describe("psx distance fog config", () => {
  it("declares named fog presets with stable inspectable values", () => {
    expect(Object.keys(PSX_DISTANCE_FOG_PRESETS)).toEqual([
      PSX_DISTANCE_FOG_PRESET_ID.OFF,
      PSX_DISTANCE_FOG_PRESET_ID.GAMEPLAY_DEFAULT,
      PSX_DISTANCE_FOG_PRESET_ID.CRASH_MIST
    ]);

    expect(getPsxDistanceFogPreset(PSX_DISTANCE_FOG_PRESET_ID.GAMEPLAY_DEFAULT)).toMatchObject({
      id: PSX_DISTANCE_FOG_PRESET_ID.GAMEPLAY_DEFAULT,
      enabled: true,
      color: [0.72, 0.78, 0.82],
      near: 26,
      far: 64,
      intensity: 0.58,
      renderCullDistance: 68
    });
    expect(Object.isFrozen(getPsxDistanceFogPreset().color)).toBe(true);
  });

  it("falls back to fog off for unknown presets or scenes", () => {
    expect(getPsxDistanceFogPreset("missing-preset").id).toBe(DEFAULT_PSX_DISTANCE_FOG_PRESET_ID);

    expect(resolvePsxDistanceFogSettings({
      sceneId: "unknown-scene"
    })).toMatchObject({
      id: DEFAULT_PSX_DISTANCE_FOG_PRESET_ID,
      sourcePresetId: DEFAULT_PSX_DISTANCE_FOG_PRESET_ID,
      enabled: false
    });
  });

  it("resolves scene presets and explicit overrides without mutating source presets", () => {
    const cinematicFog = resolvePsxDistanceFogSettings({
      sceneId: GAME_FLOW.CINEMATIC
    });
    const overriddenFog = resolvePsxDistanceFogSettings({
      sceneId: GAME_FLOW.GAMEPLAY,
      presetId: PSX_DISTANCE_FOG_PRESET_ID.GAMEPLAY_DEFAULT,
      override: {
        id: "cold-dawn-test",
        color: [1.2, 0.5, -1],
        near: 12,
        far: 9,
        intensity: 2
      }
    });

    expect(cinematicFog).toMatchObject({
      id: PSX_DISTANCE_FOG_PRESET_ID.CRASH_MIST,
      sourcePresetId: PSX_DISTANCE_FOG_PRESET_ID.CRASH_MIST,
      enabled: true
    });
    expect(overriddenFog).toEqual({
      id: "cold-dawn-test",
      sourcePresetId: PSX_DISTANCE_FOG_PRESET_ID.GAMEPLAY_DEFAULT,
      enabled: true,
      color: [1, 0.5, 0],
      near: 12,
      far: 12.01,
      intensity: 1,
      renderCullDistance: 68
    });
    expect(getPsxDistanceFogPreset(PSX_DISTANCE_FOG_PRESET_ID.GAMEPLAY_DEFAULT).color)
      .toEqual([0.72, 0.78, 0.82]);
  });

  it("keeps fog distance blend smooth and bounded", () => {
    const settings = resolvePsxDistanceFogSettings({
      presetId: PSX_DISTANCE_FOG_PRESET_ID.GAMEPLAY_DEFAULT
    });

    expect(getPsxDistanceFogBlendAtDistance(settings, 0)).toBe(0);
    expect(getPsxDistanceFogBlendAtDistance(settings, settings.near)).toBe(0);
    expect(getPsxDistanceFogBlendAtDistance(settings, 50))
      .toBeGreaterThan(getPsxDistanceFogBlendAtDistance(settings, 35));
    expect(getPsxDistanceFogBlendAtDistance(settings, settings.far + 20))
      .toBe(settings.intensity);
  });

  it("keeps player, active NPCs, prompts, and ability targets readable near gameplay range", () => {
    const settings = resolvePsxDistanceFogSettings({
      presetId: PSX_DISTANCE_FOG_PRESET_ID.GAMEPLAY_DEFAULT
    });

    expect(resolvePsxDistanceFogReadability({
      settings,
      target: PSX_DISTANCE_FOG_READABILITY_TARGET.PLAYER,
      distance: 8.2
    })).toMatchObject({
      readable: true
    });
    expect(resolvePsxDistanceFogReadability({
      settings,
      target: PSX_DISTANCE_FOG_READABILITY_TARGET.ACTIVE_NPC,
      distance: 5.4
    })).toMatchObject({
      readable: true
    });
    expect(resolvePsxDistanceFogReadability({
      settings,
      target: PSX_DISTANCE_FOG_READABILITY_TARGET.INTERACTION_PROMPT,
      distance: 5.4
    })).toMatchObject({
      readable: true
    });
    expect(resolvePsxDistanceFogReadability({
      settings,
      target: PSX_DISTANCE_FOG_READABILITY_TARGET.ABILITY_TARGET,
      distance: 12
    })).toMatchObject({
      readable: true
    });
    expect(resolvePsxDistanceFogReadability({
      settings,
      target: PSX_DISTANCE_FOG_READABILITY_TARGET.OBJECTIVE_MARKER,
      distance: 24
    })).toMatchObject({
      readable: true
    });
  });
});
