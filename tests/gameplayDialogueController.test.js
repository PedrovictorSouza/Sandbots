// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { createGameplayDialogueController } from "../app/ui/gameplayDialogueController.js";

describe("createGameplayDialogueController", () => {
  it("renders a dialogue line and advances to completion with E", () => {
    const uiLayer = document.createElement("div");
    const clearGameFlowInput = vi.fn();
    const onComplete = vi.fn();
    const controller = createGameplayDialogueController({
      uiLayer,
      clearGameFlowInput
    });

    const opened = controller.openConversation({
      lines: [
        { speaker: "Tangrowth", text: "Line one." },
        { speaker: "Tangrowth", text: "Line two." }
      ],
      onComplete
    });

    expect(opened).toBe(true);
    expect(clearGameFlowInput).toHaveBeenCalled();
    expect(uiLayer.textContent).not.toContain("Line one.");

    controller.handleKeydown(new KeyboardEvent("keydown", { code: "KeyE", key: "e" }));
    expect(uiLayer.textContent).toContain("Line one.");

    controller.handleKeydown(new KeyboardEvent("keydown", { code: "KeyE", key: "e" }));
    expect(uiLayer.textContent).not.toContain("Line two.");

    controller.handleKeydown(new KeyboardEvent("keydown", { code: "KeyE", key: "e" }));
    expect(uiLayer.textContent).toContain("Line two.");

    controller.handleKeydown(new KeyboardEvent("keydown", { code: "KeyE", key: "e" }));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(controller.isActive()).toBe(false);
  });

  it("consumes movement input while the dialogue is active", () => {
    const uiLayer = document.createElement("div");
    const controller = createGameplayDialogueController({ uiLayer });

    controller.openConversation({
      lines: [{ speaker: "Tangrowth", text: "Hold on." }]
    });

    const event = new KeyboardEvent("keydown", { code: "KeyW", key: "w" });
    expect(controller.handleKeydown(event)).toBe(true);
  });
});
