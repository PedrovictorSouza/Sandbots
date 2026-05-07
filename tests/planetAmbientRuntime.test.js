import { describe, expect, it, vi } from "vitest";
import {
  PLANET_AMBIENT_INTENSITY,
  createPlanetAmbientRuntime
} from "../app/runtime/planetAmbientRuntime.js";

describe("createPlanetAmbientRuntime", () => {
  it("loops wind ambience and lowers intensity when asked to calm down", () => {
    const audio = {
      loop: false,
      volume: 0,
      play: vi.fn(() => Promise.resolve()),
      pause: vi.fn()
    };
    const timerApi = {
      setTimeout: vi.fn(() => 1),
      clearTimeout: vi.fn()
    };
    const audioFactory = vi.fn(() => audio);
    const ambient = createPlanetAmbientRuntime({
      windSrc: "/soundFx/windblow.mp3",
      audioFactory,
      timerApi,
      random: () => 0.5
    });

    expect(ambient.start({
      intensity: PLANET_AMBIENT_INTENSITY.OPENING
    })).toBe(true);
    expect(audioFactory).toHaveBeenCalledWith("/soundFx/windblow.mp3");
    expect(audio.loop).toBe(true);
    expect(audio.volume).toBe(0.24);
    expect(audio.play).toHaveBeenCalledTimes(1);

    expect(ambient.setIntensity(PLANET_AMBIENT_INTENSITY.CALM)).toBe(PLANET_AMBIENT_INTENSITY.CALM);
    expect(audio.volume).toBe(0.08);

    expect(ambient.setVolume(0.5)).toBe(0.5);
    expect(audio.volume).toBe(0.04);

    ambient.stop();
    expect(audio.pause).toHaveBeenCalledTimes(1);
  });

  it("can start from a deferred user gesture for browser autoplay recovery", () => {
    const listeners = new Map();
    const target = {
      addEventListener: vi.fn((eventName, handler) => {
        listeners.set(eventName, handler);
      }),
      removeEventListener: vi.fn()
    };
    const audio = {
      loop: false,
      volume: 0,
      play: vi.fn(() => Promise.resolve())
    };
    const ambient = createPlanetAmbientRuntime({
      windSrc: "/soundFx/windblow.mp3",
      audioFactory: () => audio,
      timerApi: null,
      random: () => 0.5
    });

    ambient.startOnFirstGesture(target, {
      intensity: PLANET_AMBIENT_INTENSITY.OPENING
    });
    listeners.get("keydown")();

    expect(audio.play).toHaveBeenCalledTimes(1);
    expect(target.removeEventListener).toHaveBeenCalledWith("pointerdown", expect.any(Function));
    expect(target.removeEventListener).toHaveBeenCalledWith("keydown", expect.any(Function));
    expect(target.removeEventListener).toHaveBeenCalledWith("touchstart", expect.any(Function));
  });
});
