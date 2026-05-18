// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import {
  createGameplayDialogueController,
  getNameKeyboardActionDefinition,
  resolveGameplayDialogueCommand
} from "../app/ui/gameplayDialogueController.js";

describe("createGameplayDialogueController", () => {
  it("defines name-entry keyboard actions as editable type objects", () => {
    expect(getNameKeyboardActionDefinition("space")).toMatchObject({
      label: "Space",
      requiresText: false
    });
    expect(getNameKeyboardActionDefinition("delete")).toMatchObject({
      label: "Delete",
      requiresText: false
    });
    expect(getNameKeyboardActionDefinition("submit")).toMatchObject({
      label: "OK",
      requiresText: true,
      className: "name-entry__action--ok"
    });
    expect(getNameKeyboardActionDefinition("missing")).toBeNull();
  });

  it("resolves gameplay dialogue keys into logical commands", () => {
    expect(resolveGameplayDialogueCommand("KeyX")).toBe("advance");
    expect(resolveGameplayDialogueCommand("KeyE")).toBe("advance");
    expect(resolveGameplayDialogueCommand("Enter")).toBe("advance");
    expect(resolveGameplayDialogueCommand("Space")).toBe("consume");
    expect(resolveGameplayDialogueCommand("Escape")).toBe("consume");
    expect(resolveGameplayDialogueCommand(new KeyboardEvent("keydown", { code: "KeyW", key: "w" }))).toBe("consume");
    expect(resolveGameplayDialogueCommand("KeyQ")).toBe("ignore");
  });

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
    expect(uiLayer.textContent).toContain("X / Enter");

    controller.handleKeydown(new KeyboardEvent("keydown", { code: "KeyX", key: "x" }));
    expect(uiLayer.textContent).not.toContain("Line two.");

    controller.handleKeydown(new KeyboardEvent("keydown", { code: "KeyX", key: "x" }));
    expect(uiLayer.textContent).toContain("Line two.");

    controller.handleKeydown(new KeyboardEvent("keydown", { code: "KeyX", key: "x" }));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(controller.isActive()).toBe(false);
  });

  it("uses confirm to complete the typewriter before advancing dialogue lines", () => {
    const uiLayer = document.createElement("div");
    const onComplete = vi.fn();
    const controller = createGameplayDialogueController({ uiLayer });

    controller.openConversation({
      lines: [
        { speaker: "Guide", text: "First line." },
        { speaker: "Guide", text: "Second line." }
      ],
      onComplete
    });

    controller.handleKeydown(new KeyboardEvent("keydown", { code: "Enter", key: "Enter" }));
    expect(uiLayer.textContent).toContain("First line.");
    expect(uiLayer.textContent).not.toContain("Second line.");

    controller.handleKeydown(new KeyboardEvent("keydown", { code: "Enter", key: "Enter" }));
    expect(uiLayer.textContent).not.toContain("Second line.");

    controller.handleKeydown(new KeyboardEvent("keydown", { code: "Enter", key: "Enter" }));
    expect(uiLayer.textContent).toContain("Second line.");

    controller.handleKeydown(new KeyboardEvent("keydown", { code: "Enter", key: "Enter" }));
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

  it("normalizes legacy speaker names before rendering gameplay dialogue", () => {
    const uiLayer = document.createElement("div");
    const controller = createGameplayDialogueController({ uiLayer });

    controller.openConversation({
      lines: [{ speaker: "Bulbasaur", text: "Water... please." }]
    });

    controller.handleKeydown(new KeyboardEvent("keydown", { code: "KeyX", key: "x" }));

    expect(uiLayer.textContent).toContain("Grow Bot");
    expect(uiLayer.textContent).not.toContain("Bulbasaur");
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

  it("notifies removable before-complete observers before conversation completion", () => {
    const uiLayer = document.createElement("div");
    const order = [];
    const controller = createGameplayDialogueController({ uiLayer });

    const unsubscribeKept = controller.subscribeBeforeComplete(() => {
      order.push("kept-observer");
    });
    const unsubscribeRemoved = controller.subscribeBeforeComplete(() => {
      order.push("removed-observer");
    });
    unsubscribeRemoved();

    controller.openConversation({
      lines: [{ speaker: "Guide", text: "Done." }],
      onComplete: () => {
        order.push("complete");
      }
    });

    controller.handleKeydown(new KeyboardEvent("keydown", { code: "KeyX", key: "x" }));
    controller.handleKeydown(new KeyboardEvent("keydown", { code: "KeyX", key: "x" }));

    expect(order).toEqual(["kept-observer", "complete"]);

    unsubscribeKept();
  });

  it("creates an AI edit instruction from a runtime dialogue draft", () => {
    const uiLayer = document.createElement("div");
    const onAiTextEditInstruction = vi.fn();
    let eventDetail = null;
    uiLayer.addEventListener("sandbots:dialogue-ai-edit-request", (event) => {
      eventDetail = event.detail;
    });
    const controller = createGameplayDialogueController({
      uiLayer,
      enableAiTextEditor: true,
      onAiTextEditInstruction
    });

    controller.openConversation({
      lines: [{ speaker: "Chopper", text: "Old runtime line." }]
    });

    uiLayer.querySelector("[data-dialogue-ai-edit-toggle]")?.dispatchEvent(new MouseEvent("click", {
      bubbles: true
    }));

    const textarea = uiLayer.querySelector("[data-dialogue-ai-editor-text]");
    textarea.value = "Better Sandbots line.";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));

    uiLayer.querySelector("[data-dialogue-ai-apply]")?.dispatchEvent(new MouseEvent("click", {
      bubbles: true
    }));

    expect(uiLayer.textContent).toContain("Better Sandbots line.");

    uiLayer.querySelector("[data-dialogue-ai-send]")?.dispatchEvent(new MouseEvent("click", {
      bubbles: true
    }));

    expect(onAiTextEditInstruction).toHaveBeenCalledWith(expect.objectContaining({
      speaker: "Chopper",
      lineIndex: 0,
      originalText: "Old runtime line.",
      proposedText: "Better Sandbots line.",
      instruction: expect.stringContaining("Please update this Sandbots gameplay dialogue line")
    }));
    expect(uiLayer.querySelector("[data-dialogue-ai-instruction-text]")?.value).toContain(
      "Requested text:\nBetter Sandbots line."
    );
    expect(eventDetail).toMatchObject({
      speaker: "Chopper",
      originalText: "Old runtime line.",
      proposedText: "Better Sandbots line."
    });
  });

  it("opens a name-entry keyboard with typing, delete, navigation and confirm", () => {
    const uiLayer = document.createElement("div");
    const onComplete = vi.fn();
    const controller = createGameplayDialogueController({ uiLayer });

    controller.openNameEntry({ onComplete });

    expect(uiLayer.textContent).toContain("What should Chopper call you?");
    expect(uiLayer.textContent).toContain("The colony will remember this name.");

    controller.handleKeydown(new KeyboardEvent("keydown", { code: "KeyA", key: "a" }));
    controller.handleKeydown(new KeyboardEvent("keydown", { code: "KeyD", key: "d" }));
    controller.handleKeydown(new KeyboardEvent("keydown", { code: "Backspace", key: "Backspace" }));
    controller.handleKeydown(new KeyboardEvent("keydown", { code: "KeyA", key: "a" }));

    expect(uiLayer.textContent).toContain("AA");

    controller.handleKeydown(new KeyboardEvent("keydown", { code: "ArrowDown", key: "ArrowDown" }));
    controller.handleKeydown(new KeyboardEvent("keydown", { code: "ArrowDown", key: "ArrowDown" }));
    controller.handleKeydown(new KeyboardEvent("keydown", { code: "ArrowDown", key: "ArrowDown" }));
    controller.handleKeydown(new KeyboardEvent("keydown", { code: "ArrowRight", key: "ArrowRight" }));
    controller.handleKeydown(new KeyboardEvent("keydown", { code: "ArrowRight", key: "ArrowRight" }));
    controller.handleKeydown(new KeyboardEvent("keydown", { code: "KeyX", key: "x" }));

    expect(onComplete).toHaveBeenCalledWith({
      playerName: "AA",
      nameConfirmation: "yes"
    });
    expect(controller.isActive()).toBe(false);
  });
});
