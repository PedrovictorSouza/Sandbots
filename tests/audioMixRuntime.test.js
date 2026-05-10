import { describe, expect, it, vi } from "vitest";
import { createAudioMixRuntime, resolveAudioMix } from "../app/runtime/audioMixRuntime.js";

describe("audioMixRuntime", () => {
  it("resolves master, music, ambience and sfx volume scales from settings", () => {
    expect(resolveAudioMix({
      volume: {
        master: 0.5,
        music: 0.8,
        ambience: 0.4,
        sfx: 0.25
      }
    })).toEqual({
      master: 0.5,
      music: 0.4,
      ambience: 0.2,
      sfx: 0.125
    });
  });

  it("applies settings changes to music and ambience runtimes", () => {
    const musicRuntime = { setVolume: vi.fn() };
    const planetAmbientRuntime = { setVolume: vi.fn() };
    const settingsState = {
      volume: {
        master: 1,
        music: 0.5,
        ambience: 0.25,
        sfx: 0.75
      }
    };
    const runtime = createAudioMixRuntime({
      settingsState,
      musicRuntime,
      planetAmbientRuntime
    });

    settingsState.volume.master = 0.4;
    settingsState.volume.music = 0.5;
    settingsState.volume.ambience = 0.8;
    settingsState.volume.sfx = 0.25;
    runtime.updateFromSettings(settingsState);

    expect(musicRuntime.setVolume).toHaveBeenLastCalledWith(0.2);
    expect(planetAmbientRuntime.setVolume.mock.calls.at(-1)?.[0]).toBeCloseTo(0.32);
    expect(runtime.scaleSfxVolume(0.5)).toBe(0.05);
  });
});
