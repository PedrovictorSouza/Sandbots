// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createStartScreen } from "../startScreen.js";

describe("createStartScreen integration", () => {
  let root;
  let uiLayer;
  let onStart;

  beforeEach(() => {
    document.body.innerHTML = "";
    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      value: (callback) => {
        callback(performance.now());
        return 1;
      }
    });
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      transitionDuration: "260ms",
      transitionDelay: "0s",
      animationName: "none",
      animationDuration: "0s",
      animationDelay: "0s"
    });
    root = document.createElement("section");
    uiLayer = document.createElement("div");
    document.body.append(root, uiLayer);
    onStart = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the title screen first and starts on space after the exit transition", async () => {
    const prepareExitTransition = vi.fn(() => Promise.resolve());
    const startScreen = createStartScreen({
      root,
      uiLayer,
      prepareExitTransition,
      onStart
    });

    expect(startScreen.isActive()).toBe(true);
    expect(uiLayer.dataset.mode).toBe("start");
    expect(root.querySelector(".start-card__title-image")?.getAttribute("alt")).toBe("Small Island");

    const event = {
      code: "Space",
      key: " ",
      preventDefault: vi.fn(),
    };

    const handled = startScreen.handleKeydown(event);
    await Promise.resolve();
    await Promise.resolve();

    expect(handled).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(prepareExitTransition).toHaveBeenCalledTimes(1);
    expect(onStart).not.toHaveBeenCalled();
    expect(root.hidden).toBe(false);
    expect(root.classList.contains("overlay-transition--exit")).toBe(true);
    expect(uiLayer.dataset.mode).toBe("start");

    root.dispatchEvent(new Event("transitionend"));
    await Promise.resolve();
    await Promise.resolve();

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(startScreen.isActive()).toBe(false);
    expect(root.hidden).toBe(true);
    expect(uiLayer.dataset.mode).toBe("game");
  });
});
