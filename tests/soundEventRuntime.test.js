// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import {
  SOUND_EVENT_DOM_EVENT,
  SOUND_EVENT_IDS,
  createSoundEventRuntime
} from "../app/runtime/soundEventRuntime.js";

function createFakeAudio() {
  return {
    currentTime: 0,
    pause: vi.fn(),
    play: vi.fn(() => Promise.resolve()),
    preload: "",
    volume: 1
  };
}

describe("createSoundEventRuntime", () => {
  it("plays a delegated UI click sound and respects SFX volume scale", () => {
    const root = document.createElement("div");
    const button = document.createElement("button");
    const audio = createFakeAudio();
    const audioFactory = vi.fn(() => audio);
    const runtime = createSoundEventRuntime({
      root,
      audioFactory,
      volumeScale: () => 0.5,
      now: () => 1000
    });

    root.append(button);
    runtime.attachUiEventDelegates();
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(audioFactory).toHaveBeenCalledTimes(1);
    expect(audioFactory.mock.calls[0][0]).toContain("grab.mp3");
    expect(audio.preload).toBe("auto");
    expect(audio.volume).toBeCloseTo(0.17);
    expect(audio.play).toHaveBeenCalledTimes(1);

    runtime.dispose();
  });

  it("plays explicit sound events for gameplay systems", () => {
    const root = document.createElement("div");
    const audio = createFakeAudio();
    const audioFactory = vi.fn(() => audio);
    const runtime = createSoundEventRuntime({
      root,
      audioFactory,
      now: () => 1000
    });

    runtime.attachUiEventDelegates();
    root.dispatchEvent(new CustomEvent(SOUND_EVENT_DOM_EVENT, {
      bubbles: true,
      detail: {
        id: SOUND_EVENT_IDS.GAMEPLAY_PLACE
      }
    }));

    expect(audioFactory).toHaveBeenCalledTimes(1);
    expect(audioFactory.mock.calls[0][0]).toContain("instance-object.mp3");
    expect(audio.play).toHaveBeenCalledTimes(1);

    runtime.dispose();
  });

  it("throttles rapid UI changes so sliders and steppers do not spam audio", () => {
    const root = document.createElement("div");
    const input = document.createElement("input");
    const audio = createFakeAudio();
    let now = 1000;
    const runtime = createSoundEventRuntime({
      root,
      audioFactory: () => audio,
      now: () => now
    });

    root.append(input);
    runtime.attachUiEventDelegates();

    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    now += 120;
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));

    expect(audio.play).toHaveBeenCalledTimes(2);

    runtime.dispose();
  });

  it("maps keyboard confirm, cancel and navigation on focused UI controls", () => {
    const root = document.createElement("div");
    const button = document.createElement("button");
    const sounds = [];
    const runtime = createSoundEventRuntime({
      root,
      audioFactory: (src) => {
        const audio = createFakeAudio();
        audio.play = vi.fn(() => {
          sounds.push(src);
          return Promise.resolve();
        });
        return audio;
      },
      now: () => sounds.length * 200
    });

    document.body.append(root);
    root.append(button);
    runtime.attachUiEventDelegates();

    button.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, code: "Enter" }));
    button.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, code: "Escape" }));
    button.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, code: "ArrowDown" }));

    expect(sounds).toHaveLength(3);
    expect(sounds[0]).toContain("center-computer.mp3");
    expect(sounds[1]).toContain("grab.mp3");
    expect(sounds[2]).toContain("grab.mp3");

    runtime.dispose();
    root.remove();
  });

  it("does not play after disposal", () => {
    const root = document.createElement("div");
    const button = document.createElement("button");
    const audio = createFakeAudio();
    const runtime = createSoundEventRuntime({
      root,
      audioFactory: () => audio,
      now: () => 1000
    });

    root.append(button);
    runtime.attachUiEventDelegates();
    runtime.dispose();

    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(audio.play).not.toHaveBeenCalled();
  });
});
