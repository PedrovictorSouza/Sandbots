// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { createActTwoSequence } from "../actTwoSequence.js";

function createSequence() {
  const root = document.createElement("section");
  const uiLayer = document.createElement("div");
  const camera = {
    setPose: vi.fn()
  };
  const onComplete = vi.fn();
  const sequence = createActTwoSequence({
    root,
    uiLayer,
    camera,
    onComplete
  });

  return {
    camera,
    onComplete,
    root,
    sequence,
    uiLayer
  };
}

function keyEvent(code, key = code) {
  return {
    code,
    key,
    repeat: false,
    preventDefault: vi.fn()
  };
}

describe("createActTwoSequence", () => {
  it("shows a skip prompt when the player presses a blocked cinematic action", () => {
    const { root, sequence } = createSequence();
    sequence.start();

    const event = keyEvent("KeyE", "e");
    expect(sequence.handleKeydown(event)).toBe(true);

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(root.textContent).toContain("Hold X / Enter to skip");
    expect(root.querySelector(".cinematic-shell__skip-prompt").style.opacity).toBe("1");
  });

  it("skips the cinematic after holding a skip action", () => {
    const { onComplete, root, sequence, uiLayer } = createSequence();
    sequence.start();

    const event = keyEvent("KeyX", "x");
    expect(sequence.handleKeydown(event)).toBe(true);
    sequence.update(0.66);

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(sequence.isActive()).toBe(false);
    expect(root.hidden).toBe(true);
    expect(uiLayer.dataset.mode).toBe("game");
  });

  it("keeps the cinematic running when the skip action is released early", () => {
    const { onComplete, sequence } = createSequence();
    sequence.start();

    sequence.handleKeydown(keyEvent("Enter", "Enter"));
    sequence.update(0.2);
    sequence.handleKeyup(keyEvent("Enter", "Enter"));
    sequence.update(0.5);

    expect(onComplete).not.toHaveBeenCalled();
    expect(sequence.isActive()).toBe(true);
  });
});
