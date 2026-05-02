// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { createGameplayDialogueController } from "../app/ui/gameplayDialogueController.js";

describe("createGameplayDialogueController", () => {
  it("renders a dialogue line and advances to completion with X", () => {
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

    controller.handleKeydown(new KeyboardEvent("keydown", { code: "KeyX", key: "x" }));
    expect(uiLayer.textContent).toContain("Line one.");

    controller.handleKeydown(new KeyboardEvent("keydown", { code: "KeyX", key: "x" }));
    expect(uiLayer.textContent).not.toContain("Line two.");

    controller.handleKeydown(new KeyboardEvent("keydown", { code: "KeyX", key: "x" }));
    expect(uiLayer.textContent).toContain("Line two.");

    controller.handleKeydown(new KeyboardEvent("keydown", { code: "KeyX", key: "x" }));
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

  it("runs the default completion hook before a conversation-specific completion", () => {
    const uiLayer = document.createElement("div");
    const order = [];
    const controller = createGameplayDialogueController({
      uiLayer,
      onBeforeComplete: () => {
        order.push("restore-camera");
      }
    });

    controller.openConversation({
      lines: [{ speaker: "Bulbasaur", text: "Water... please." }],
      onComplete: () => {
        order.push("quest-effects");
      }
    });

    controller.handleKeydown(new KeyboardEvent("keydown", { code: "KeyX", key: "x" }));
    controller.handleKeydown(new KeyboardEvent("keydown", { code: "KeyX", key: "x" }));

    expect(order).toEqual(["restore-camera", "quest-effects"]);

    controller.setBeforeComplete(() => {
      order.push("restore-camera-again");
    });
    controller.openConversation({
      lines: [{ speaker: "Squirtle", text: "Ready." }],
      onComplete: () => {
        order.push("next-effects");
      }
    });

    controller.handleKeydown(new KeyboardEvent("keydown", { code: "KeyX", key: "x" }));
    controller.handleKeydown(new KeyboardEvent("keydown", { code: "KeyX", key: "x" }));

    expect(order).toEqual([
      "restore-camera",
      "quest-effects",
      "restore-camera-again",
      "next-effects"
    ]);
  });
});
