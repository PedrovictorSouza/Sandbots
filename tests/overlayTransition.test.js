// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearOverlayTransition,
  createOverlayVeil,
  playOverlayTransition
} from "../app/ui/overlayTransition.js";

describe("playOverlayTransition", () => {
  beforeEach(() => {
    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      value: (callback) => {
        callback(performance.now());
        return 1;
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("applies the exit class and waits for the transition end event", async () => {
    const element = document.createElement("section");
    let resolved = false;

    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      transitionDuration: "120ms",
      transitionDelay: "0s",
      animationName: "none",
      animationDuration: "0s",
      animationDelay: "0s"
    });

    const transitionPromise = playOverlayTransition(element, {
      direction: "exit"
    }).then(() => {
      resolved = true;
    });

    await Promise.resolve();

    expect(element.classList.contains("overlay-transition")).toBe(true);
    expect(element.classList.contains("overlay-transition--active")).toBe(true);
    expect(element.classList.contains("overlay-transition--exit")).toBe(true);
    expect(resolved).toBe(false);

    element.dispatchEvent(new Event("transitionend"));
    await transitionPromise;

    expect(resolved).toBe(true);
    expect(element.classList.contains("overlay-transition--active")).toBe(false);
    expect(element.classList.contains("overlay-transition--exit")).toBe(true);
  });

  it("resolves immediately when there is no active CSS motion", async () => {
    const element = document.createElement("section");

    await playOverlayTransition(element, {
      direction: "enter"
    });

    expect(element.classList.contains("overlay-transition--enter")).toBe(true);
    expect(element.classList.contains("overlay-transition--active")).toBe(false);

    clearOverlayTransition(element);

    expect(element.className).toBe("");
  });

  it("keeps the veil mounted between show and hide", async () => {
    const element = document.createElement("div");
    element.hidden = true;

    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      transitionDuration: "120ms",
      transitionDelay: "0s",
      animationName: "none",
      animationDuration: "0s",
      animationDelay: "0s"
    });

    const veil = createOverlayVeil({
      root: element
    });
    const showPromise = veil.show();
    await Promise.resolve();

    expect(element.hidden).toBe(false);
    expect(element.classList.contains("overlay-transition--enter")).toBe(true);

    element.dispatchEvent(new Event("transitionend"));
    await showPromise;

    expect(element.hidden).toBe(false);
    expect(element.classList.contains("overlay-transition--enter")).toBe(true);
    expect(element.classList.contains("overlay-transition--active")).toBe(false);

    const hidePromise = veil.hide();
    await Promise.resolve();

    expect(element.classList.contains("overlay-transition--exit")).toBe(true);

    element.dispatchEvent(new Event("transitionend"));
    await hidePromise;

    expect(element.hidden).toBe(true);
    expect(element.className).toBe("");
  });
});
