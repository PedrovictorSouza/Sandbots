// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
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
  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it("shows the companion robot for the selected field move beside supplies", () => {
    const inventoryPanelElement = document.createElement("div");
    inventoryPanelElement.className = "inventory";
    const inventoryTitleElement = document.createElement("strong");
    inventoryTitleElement.textContent = "Supplies";
    const inventoryGridElement = document.createElement("div");
    inventoryPanelElement.append(inventoryTitleElement, inventoryGridElement);
    const skillsPanelElement = document.createElement("div");
    const skillsGridElement = document.createElement("div");
    const hudInstructionsElement = document.createElement("span");
    const controller = createGameHudController({
      hudInstructionsElement,
      inventoryGridElement,
      skillsPanelElement,
      skillsGridElement,
      questSystem: {
        getActiveQuest: () => ({
          id: "makingHabitats",
          guidance: "Restore one nearby patch."
        })
      },
      playerSkillOrder: ["waterGun", "leafage"],
      playerSkillDefs: {
        waterGun: {
          shortLabel: "Water",
          glyph: "W",
          color: "#65c7ff",
          ink: "#081f33"
        },
        leafage: {
          shortLabel: "Leaf",
          glyph: "L",
          color: "#7ed36d",
          ink: "#0b2610"
        }
      }
    });
    const unlockedSkills = { waterGun: true, leafage: true };

    controller.syncSkillsUi(unlockedSkills, "waterGun", {
      flags: {}
    });

    const companionHudElement = inventoryPanelElement.querySelector(".active-companion-hud");
    expect(inventoryPanelElement.querySelector(".inventory-header strong")?.textContent).toBe("Supplies");
    expect(companionHudElement?.hidden).toBe(false);
    expect(companionHudElement?.dataset.companionId).toBe("squirtle");
    expect(companionHudElement?.textContent).toContain("Water");
    expect(companionHudElement?.textContent).toContain("Squirtle");
    expect(companionHudElement?.textContent).toContain("mark dry ground");

    controller.syncHudInstructions({
      flags: {
        firstGrassRestored: true
      }
    });

    expect(companionHudElement?.textContent).not.toContain("Squirtle will move over and restore it");
    expect(companionHudElement?.textContent).toContain("mark dry ground for Squirtle to restore");

    controller.syncSkillsUi(unlockedSkills, "leafage", {
      flags: {}
    });

    expect(companionHudElement?.dataset.companionId).toBe("bulbasaur");
    expect(companionHudElement?.textContent).toContain("Leaf");
    expect(companionHudElement?.textContent).toContain("Bulbasaur");
    expect(companionHudElement?.textContent).toContain("restored ground");

    controller.syncSkillsUi({ waterGun: true, leafage: false }, "leafage");

    expect(companionHudElement?.hidden).toBe(true);
  });

  it("flashes completed tracked tasks for 3 seconds before removing them from the HUD stack", () => {
    const missionsStackElement = document.createElement("div");
    const hudChecklistElement = document.createElement("div");
    const hudContextElement = document.createElement("div");
    const activeQuest = {
      id: "water-dry-grass",
      status: "active",
      title: "Gather first supplies",
      description: "Collect simple wood so Chopper can test your field rhythm.",
      guidance: "Water dry tall grass.",
      objectives: []
    };
    const nowSpy = vi.spyOn(performance, "now").mockReturnValue(1000);
    const controller = createGameHudController({
      missionsStackElement,
      hudChecklistElement,
      hudContextElement,
      questSystem: {
        getActiveQuest: () => activeQuest,
        getQuestLog: () => [activeQuest]
      }
    });
    const storyState = {
      flags: {
        trackedTaskIds: ["making-habitats"]
      }
    };

    controller.renderMissionCards(storyState, {}, "");
    controller.syncQuestFocus(storyState);

    expect(missionsStackElement.innerHTML).toContain('data-task-id="making-habitats"');
    expect(hudChecklistElement.innerHTML).toContain("Making habitats");
    expect(controller.getNoticeMessage()).toBe("");

    storyState.flags.makingHabitatsComplete = true;
    nowSpy.mockReturnValue(1500);
    controller.renderMissionCards(storyState, {}, "");
    controller.syncQuestFocus(storyState);

    expect(missionsStackElement.innerHTML).toContain('data-task-flashing="true"');
    expect(hudChecklistElement.innerHTML).toContain('data-task-flashing="true"');
    expect(hudChecklistElement.innerHTML).toContain("Making habitats");
    expect(controller.getNoticeMessage()).toBe("Task complete: Making habitats.");

    nowSpy.mockReturnValue(4601);
    controller.renderMissionCards(storyState, {}, "");
    controller.syncQuestFocus(storyState);

    expect(missionsStackElement.innerHTML).not.toContain('data-task-id="making-habitats"');
    expect(hudChecklistElement.innerHTML).not.toContain("Making habitats");
    expect(controller.getNoticeMessage()).toBe("Task complete: Making habitats.");
  });
});
