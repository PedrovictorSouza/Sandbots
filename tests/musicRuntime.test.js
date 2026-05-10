import { describe, expect, it, vi } from "vitest";
import {
  MUSIC_TRACK_IDS,
  createMusicRuntime
} from "../app/runtime/musicRuntime.js";

describe("createMusicRuntime", () => {
  it("loops named tracks and updates volume through the runtime API", () => {
    const audio = {
      loop: false,
      volume: 0,
      currentTime: 4,
      pause: vi.fn(),
      play: vi.fn(() => Promise.resolve())
    };
    const audioFactory = vi.fn(() => audio);
    const music = createMusicRuntime({
      audioFactory,
      initialVolume: 0.4
    });

    expect(music.play(MUSIC_TRACK_IDS.MAIN_THEME, { restart: true })).toBe(true);
    expect(audioFactory).toHaveBeenCalledWith("/Soundtrack/main-theme.mp3");
    expect(audio.loop).toBe(true);
    expect(audio.volume).toBe(0.4);
    expect(audio.currentTime).toBe(0);
    expect(audio.play).toHaveBeenCalledTimes(1);

    expect(music.setVolume(0.2)).toBe(0.2);
    expect(audio.volume).toBe(0.2);
    expect(music.stop(MUSIC_TRACK_IDS.MAIN_THEME)).toBe(true);
    expect(audio.pause).toHaveBeenCalledTimes(1);
    expect(audio.currentTime).toBe(0);
  });

  it("retries a blocked music play on the next user gesture", async () => {
    const listeners = new Map();
    const target = {
      addEventListener: vi.fn((eventName, handler) => {
        listeners.set(eventName, handler);
      }),
      removeEventListener: vi.fn()
    };
    const blockedError = Object.assign(new Error("Autoplay blocked"), {
      name: "NotAllowedError"
    });
    const audio = {
      loop: false,
      volume: 0,
      currentTime: 0,
      play: vi.fn()
        .mockRejectedValueOnce(blockedError)
        .mockResolvedValueOnce()
    };
    const music = createMusicRuntime({
      audioFactory: () => audio,
      initialVolume: 0.4
    });

    music.startOnFirstGesture(target);
    expect(music.play(MUSIC_TRACK_IDS.MAIN_THEME)).toBe(true);
    await Promise.resolve();

    listeners.get("keydown")();
    await Promise.resolve();

    expect(audio.play).toHaveBeenCalledTimes(2);
    expect(audio.volume).toBe(0.4);
  });

  it("plays a random background soundtrack from the configured pool", () => {
    const audioA = {
      loop: false,
      volume: 0,
      currentTime: 0,
      play: vi.fn(() => Promise.resolve())
    };
    const audioB = {
      loop: false,
      volume: 0,
      currentTime: 0,
      play: vi.fn(() => Promise.resolve())
    };
    const audioFactory = vi.fn((src) => src.includes("main-theme-b") ? audioB : audioA);
    const music = createMusicRuntime({
      audioFactory,
      initialVolume: 0.5,
      random: () => 0.8
    });

    expect(music.playRandomSoundtrack({ restart: true })).toEqual({
      played: true,
      trackId: MUSIC_TRACK_IDS.MAIN_THEME_B
    });
    expect(audioFactory).toHaveBeenCalledWith("/Soundtrack/main-theme-b.mp3");
    expect(audioB.play).toHaveBeenCalledTimes(1);
    expect(audioB.volume).toBe(0.5);
  });

  it("ducks background music while object music is active and resumes after cooldown", () => {
    const audio = {
      loop: false,
      volume: 0,
      currentTime: 0,
      play: vi.fn(() => Promise.resolve()),
      pause: vi.fn()
    };
    const music = createMusicRuntime({
      audioFactory: () => audio,
      initialVolume: 0.5,
      objectMusicDuckFactor: 0.2,
      objectMusicResumeDelaySeconds: 30,
      fadeSpeed: 10
    });

    music.play(MUSIC_TRACK_IDS.MAIN_THEME);
    expect(audio.volume).toBe(0.5);

    music.reportObjectMusicActivity({ active: true, nowSeconds: 10 });
    expect(music.update(1, { nowSeconds: 10 })).toMatchObject({
      objectMusicActive: true,
      targetVolume: 0.1,
      effectiveVolume: 0.1
    });
    expect(audio.volume).toBe(0.1);

    music.reportObjectMusicActivity({ active: false, nowSeconds: 11 });
    expect(music.update(1, { nowSeconds: 20 })).toMatchObject({
      waitingForObjectMusicCooldown: true,
      targetVolume: 0.1
    });
    expect(audio.volume).toBe(0.1);

    expect(music.update(1, { nowSeconds: 41 })).toMatchObject({
      waitingForObjectMusicCooldown: false,
      targetVolume: 0.5,
      effectiveVolume: 0.5
    });
    expect(audio.volume).toBe(0.5);
  });

  it("does not auto-start background music before a soundtrack has been enabled", () => {
    const audio = {
      loop: false,
      volume: 0,
      currentTime: 0,
      play: vi.fn(() => Promise.resolve())
    };
    const music = createMusicRuntime({
      audioFactory: () => audio,
      initialVolume: 0.5,
      random: () => 0
    });

    music.update(1, { nowSeconds: 60 });

    expect(audio.play).not.toHaveBeenCalled();
  });
});
