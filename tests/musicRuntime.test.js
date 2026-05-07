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
  });
});
