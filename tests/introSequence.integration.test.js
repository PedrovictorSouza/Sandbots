// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createIntroSequence } from "../intro/index.js";
import { INTRO_STEPS } from "../intro/introSteps.js";

function click(element) {
  if (!element) {
    throw new Error("Expected clickable element.");
  }

  element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
}

function pressSpace(sequence) {
  const event = {
    code: "Space",
    key: " ",
    repeat: false,
    preventDefault: vi.fn(),
  };

  const handled = sequence.handleKeydown(event);
  expect(handled).toBe(true);
  expect(event.preventDefault).toHaveBeenCalled();
}

describe("createIntroSequence integration", () => {
  let root;
  let uiLayer;
  let onComplete;

  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = "";
    root = document.createElement("section");
    uiLayer = document.createElement("div");
    document.body.append(root, uiLayer);
    onComplete = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("walks through the intro flow and returns the configured trainer payload", () => {
    const sequence = createIntroSequence({ root, uiLayer, onComplete });

    expect(sequence.isActive()).toBe(true);
    expect(uiLayer.dataset.mode).toBe("intro");
    expect(root.querySelector("[data-intro-dialogue-text]")?.dataset.introDialogueText).toContain("Impact confirmed");
    expect(INTRO_STEPS.findIndex((step) => step.type === "gender")).toBeLessThanOrEqual(2);

    for (let index = 0; index < 4; index += 1) {
      pressSpace(sequence);
    }

    click(root.querySelector('[data-intro-action="gender"][data-intro-value="feminino"]'));
    const confirmDialog = root.querySelector(".intro-confirm-card");
    expect(confirmDialog?.getAttribute("role")).toBe("dialog");
    expect(confirmDialog?.getAttribute("aria-modal")).toBe("true");
    expect(confirmDialog?.getAttribute("aria-labelledby")).toBe("intro-confirm-frame-label intro-confirm-title");
    expect(root.querySelector("#intro-confirm-frame-label")?.textContent).toBe("Builder B");
    expect(confirmDialog?.textContent).toContain("Start as this Builder");
    expect(confirmDialog?.textContent).toContain("Choose another look");

    click(root.querySelector('[data-intro-action="confirm"][data-intro-value="yes"]'));
    expect(root.querySelector(".trainer-editor__gender-chip")?.textContent).toBe("Builder B");
    expect(root.querySelector('[data-intro-action="finish"]')?.textContent).toBe("Start mission");

    const summaryText = root.querySelector(".trainer-editor__summary")?.textContent || "";
    expect(summaryText).toContain("Twin Puff");
    expect(summaryText).toContain("Berry");
    expect(summaryText).toContain("Rose");

    click(root.querySelector('[data-intro-action="tab"][data-intro-value="outfit"]'));
    click(root.querySelector('[data-intro-action="option"][data-intro-value="2"]'));
    click(root.querySelector('[data-intro-action="finish"]'));

    expect(root.querySelector(".intro-shell")?.className).toContain("intro-shell--fading");

    vi.advanceTimersByTime(820);

    expect(onComplete).toHaveBeenCalledWith({
      gender: "feminino",
      confirmation: "yes",
      trainer: {
        skinTone: "skin-1",
        hairStyle: "twin-puff",
        hairColor: "hair-2",
        outfit: "outfit-3",
      },
    });
    expect(sequence.isActive()).toBe(false);
    expect(root.hidden).toBe(true);
    expect(uiLayer.dataset.mode).toBe("game");
  });

  it("can stay dormant until the start screen hands control over", () => {
    const sequence = createIntroSequence({ root, uiLayer, onComplete, autoStart: false });

    expect(sequence.isActive()).toBe(false);
    expect(root.hidden).toBe(true);
    expect(uiLayer.dataset.mode).toBe("game");

    sequence.start();

    expect(sequence.isActive()).toBe(true);
    expect(root.hidden).toBe(false);
    expect(uiLayer.dataset.mode).toBe("intro");
    expect(root.querySelector(".intro-shell")).not.toBeNull();
  });
});
