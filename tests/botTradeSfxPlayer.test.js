// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { createBotTradeSfxPlayer } from "../app/bootstrap/createApplicationRuntime.js";

describe("createBotTradeSfxPlayer", () => {
  it("restarts and plays the bot trade sound", () => {
    const audio = {
      currentTime: 1.2,
      play: vi.fn(() => Promise.resolve()),
      preload: "",
      volume: 0
    };
    const Audio = vi.fn(() => audio);
    const player = createBotTradeSfxPlayer({
      windowRef: { Audio },
      src: "/soundFx/bot-trade.mp3",
      volume: 0.42
    });

    expect(player.play()).toBe(true);
    expect(Audio).toHaveBeenCalledWith("/soundFx/bot-trade.mp3");
    expect(audio.preload).toBe("auto");
    expect(audio.currentTime).toBe(0);
    expect(audio.volume).toBe(0.42);
    expect(audio.play).toHaveBeenCalledTimes(1);
  });

  it("does nothing when Audio is unavailable", () => {
    const player = createBotTradeSfxPlayer({ windowRef: {} });

    expect(player.play()).toBe(false);
  });
});
