// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { createGameHudController } from "../app/ui/gameHudController.js";

function createController() {
  const currentActionElement = document.createElement("section");
  currentActionElement.className = "hud-current-action";
  const instructionsElement = document.createElement("span");
  currentActionElement.appendChild(instructionsElement);

  const controller = createGameHudController({
    hudInstructionsElement: instructionsElement,
    questSystem: {
      getActiveQuest: () => ({
        id: "makingHabitats",
        description: "Arrange restored items into a habitat.",
        guidance: "Restore one nearby patch."
      })
    }
  });

  return {
    controller,
    currentActionElement,
    instructionsElement
  };
}

describe("createGameHudController", () => {
  it("shows immediate prompts as the current action instead of repeating quest copy", () => {
    const {
      controller,
      currentActionElement,
      instructionsElement
    } = createController();

    controller.syncHudInstructions({}, "[Enter] Mark dry ground for Squirtle \u2022 1 queued");

    expect(instructionsElement.textContent).toBe("[Enter] Mark dry ground for Squirtle \u2022 1 queued");
    expect(currentActionElement.dataset.actionKind).toBe("water");
  });

  it("falls back to quest guidance when no immediate prompt is available", () => {
    const {
      controller,
      currentActionElement,
      instructionsElement
    } = createController();

    controller.syncHudInstructions({}, "");

    expect(instructionsElement.textContent).toBe("Restore one nearby patch.");
    expect(currentActionElement.dataset.actionKind).toBe("water");
  });

  it("renders the visible inventory as a field-use belt", () => {
    const inventoryGridElement = document.createElement("div");
    const controller = createGameHudController({
      inventoryGridElement,
      inventoryOrder: ["waterGunTotem", "wood", "campfire", "leppaBerry"],
      itemDefs: {
        waterGunTotem: {
          shortLabel: "Totem",
          glyph: "T",
          color: "#65c7ff",
          ink: "#081f33",
          slotRole: "key"
        },
        wood: {
          shortLabel: "Wood",
          glyph: "W",
          color: "#8c5a34",
          ink: "#fff1e8",
          slotRole: "material"
        },
        campfire: {
          shortLabel: "Fire",
          glyph: "F",
          color: "#f07d38",
          ink: "#2a1205",
          slotRole: "placeable"
        },
        leppaBerry: {
          shortLabel: "Leppa",
          glyph: "L",
          color: "#e85e50",
          ink: "#fff7de",
          slotRole: "gift"
        }
      }
    });

    controller.syncInventoryUi({
      waterGunTotem: 1,
      wood: 3,
      campfire: 1,
      leppaBerry: 1
    });

    const slots = [...inventoryGridElement.querySelectorAll(".inventory-slot[data-filled='true']")];
    expect(slots.map((slot) => slot.querySelector(".inventory-slot__label")?.textContent)).toEqual([
      "Fire",
      "Wood",
      "Leppa",
      "Totem"
    ]);
    expect(slots.map((slot) => slot.querySelector(".inventory-slot__role")?.textContent)).toEqual([
      "Place",
      "Mat",
      "Gift",
      "Key"
    ]);
  });
});
