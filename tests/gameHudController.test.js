// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createGameHudController,
  formatColonyCacheHudText,
  formatColonyStatusHudText
} from "../app/ui/gameHudController.js";
import {
  DEFAULT_GAME_HUD_INITIAL_STATUS,
  resolveGameHudInitialStatus
} from "../app/ui/gameHudControllerConfig.ts";
import { renderInventoryCountHtml } from "../app/ui/uiTextValue.ts";
import {
  GAMEPAD_LAYOUT,
  INPUT_DEVICE
} from "../input/inputModality.js";

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
    document.body.innerHTML = "";
  });

  it("renders typed inventory count values without any", () => {
    expect(renderInventoryCountHtml({ value: 3 })).toBe('<span class="inventory-count">3</span>');
    expect(renderInventoryCountHtml({ value: "+2" })).toBe('<span class="inventory-count">+2</span>');
    expect(renderInventoryCountHtml({ value: null })).toBe("");
  });

  it("uses a default initial status when the optional prop is omitted", () => {
    expect(resolveGameHudInitialStatus()).toBe(DEFAULT_GAME_HUD_INITIAL_STATUS);
    expect(resolveGameHudInitialStatus({})).toBe(DEFAULT_GAME_HUD_INITIAL_STATUS);
    expect(resolveGameHudInitialStatus({ initialStatus: "Ready" })).toBe("Ready");
  });

  it("shows tracked workbench plans in colony language", () => {
    const statusElement = document.createElement("div");
    const controller = createGameHudController({
      statusElement,
      initialStatus: "Colony systems online."
    });

    controller.setTrackedRecipe({
      name: "Bridge Repair Kit",
      ingredients: [
        { amount: 4, name: "Wood" },
        { amount: 2, name: "Flax Fiber" }
      ]
    });

    expect(statusElement.textContent).toBe(
      "Colony systems online. | Plan: Bridge Repair Kit | 4 Wood, 2 Flax Fiber"
    );
  });

  it("formats colony status as compact HUD meta instead of quest copy", () => {
    expect(formatColonyStatusHudText({
      activeTool: "Hydro Jet",
      systems: [
        { label: "Power", state: "active", detail: "Solar Station online." },
        { label: "Water", state: "active", detail: "Hydro Jet selected." },
        { label: "Soil", state: "active", detail: "4/10 dry grass restored." },
        { label: "Shelter", state: "ready", detail: "House Kit ready." }
      ]
    })).toBe("Tool Hydro Jet • Power online • Water online • Soil 4/10 • Shelter ready");
  });

  it("formats colony cache supply counts for the HUD meta", () => {
    expect(formatColonyCacheHudText({
      totalItems: 0,
      groupCounts: {}
    })).toBe("");

    expect(formatColonyCacheHudText({
      totalItems: 4,
      groupCounts: {
        materials: 3
      }
    })).toBe("Cache build-ready: 4 supplies, 3 materials");
  });

  it("renders colony status into the existing HUD meta element", () => {
    const hudMetaElement = document.createElement("span");
    const controller = createGameHudController({
      hudMetaElement
    });

    controller.syncSkillsUi({ waterGun: true }, "waterGun", {
      flags: {
        restoredGrassCount: 4
      }
    });
    controller.syncHudMeta({
      flags: {
        strawBedPlacedInBulbasaurHabitat: true,
        restoredGrassCount: 4,
        leafDenBuildAvailable: true
      }
    }, {
      waterGunTotem: 1,
      leafDenKit: 1
    });

    expect(hudMetaElement.textContent).toBe(
      "Tool Hydro Jet • Power online • Water online • Soil 4/10 • Shelter ready • Cache stocked: 2 supplies"
    );
    expect(hudMetaElement.dataset.colonyStatus).toBe("visible");
  });

  it("shows immediate prompts as the current action instead of repeating quest copy", () => {
    const {
      controller,
      currentActionElement,
      instructionsElement
    } = createController();

    controller.syncHudInstructions({}, "[Enter] Mark dry ground for Hydro Bot \u2022 1 queued");

    expect(instructionsElement.textContent).toBe("[Enter] Mark dry ground for Hydro Bot \u2022 1 queued");
    expect(currentActionElement.dataset.actionKind).toBe("water");
  });

  it("classifies Sandbots bot names as talk actions when no stronger action term exists", () => {
    const {
      controller,
      currentActionElement,
      instructionsElement
    } = createController();

    controller.syncHudInstructions({}, "Talk to Grow Bot");

    expect(instructionsElement.textContent).toBe("Talk to Grow Bot");
    expect(currentActionElement.dataset.actionKind).toBe("talk");
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

  it("uses errand quest HUD text before generic guidance", () => {
    const instructionsElement = document.createElement("span");
    const controller = createGameHudController({
      hudInstructionsElement: instructionsElement,
      questSystem: {
        getActiveQuest: () => ({
          id: "gather-first-supplies",
          description: "Wake Hydro Bot.",
          guidance: "Follow Chopper's marker.",
          errandQuest: {
            hudText: "Wake up Hydro Bot"
          }
        })
      }
    });

    controller.syncHudInstructions({}, "");

    expect(instructionsElement.textContent).toBe(
      "Wake up Hydro Bot"
    );
  });

  it("does not repeat the active quest title in the current-action instructions", () => {
    const instructionsElement = document.createElement("span");
    const controller = createGameHudController({
      hudInstructionsElement: instructionsElement,
      questSystem: {
        getActiveQuest: () => ({
          id: "gather-first-supplies",
          title: "Wake up Hydro Bot",
          description: "Bring Hydro Bot back online.",
          guidance: "Follow Chopper's marker to Hydro Bot, then interact when the prompt appears.",
          errandQuest: {
            hudText: "Wake up Hydro Bot"
          }
        })
      }
    });

    controller.syncHudInstructions({}, "");

    expect(instructionsElement.textContent).toBe(
      "Follow Chopper's marker to Hydro Bot, then interact when the prompt appears."
    );
  });

  it("uses the input modality for the initial HUD guide", () => {
    const instructionsElement = document.createElement("span");
    const controller = createGameHudController({
      hudInstructionsElement: instructionsElement,
      getActiveQuest: () => null
    });

    controller.syncHudInstructions({}, "", {
      device: INPUT_DEVICE.GAMEPAD,
      gamepadLayout: GAMEPAD_LAYOUT.GENERIC
    });

    expect(instructionsElement.textContent).toBe(
      "Use the left stick to reach Chopper. He will point out the first repair."
    );
  });

  it("treats invalid nearby habitat values as an empty list", () => {
    const hudChecklistElement = document.createElement("div");
    const activeQuest = {
      id: "makingHabitats",
      title: "Making colony zones",
      objectives: []
    };
    const controller = createGameHudController({
      hudChecklistElement,
      getActiveQuest: () => activeQuest
    });
    const storyState = { flags: {} };

    expect(() => controller.setNearbyHabitats(null)).not.toThrow();
    expect(() => controller.setNearbyHabitats("Tall Grass")).not.toThrow();
    controller.syncQuestFocus(storyState);

    let checklistItems = [...hudChecklistElement.querySelectorAll(".hud-checklist__item")];
    expect(checklistItems.map((item) => item.textContent.replace(/\s+/g, " ").trim())).toEqual([
      "Use Hydro Jet on a dry object",
      "Find a restored habitat",
      "Discover the tall grass clue"
    ]);
    expect(checklistItems[1]?.dataset.done).toBe("false");

    controller.setNearbyHabitats(["Tall Grass", null, "Flower Bed"]);
    controller.syncQuestFocus(storyState);

    checklistItems = [...hudChecklistElement.querySelectorAll(".hud-checklist__item")];
    expect(checklistItems[1]?.dataset.done).toBe("true");
  });

  it("renders the visible inventory as a field-use belt", () => {
    const inventoryGridElement = document.createElement("div");
    const controller = createGameHudController({
      inventoryGridElement,
      inventoryOrder: [
        "waterGunTotem",
        "simpleWoodenDiyRecipes",
        "lifeCoins",
        "wood",
        "campfire",
        "leppaBerry"
      ],
      itemDefs: {
        waterGunTotem: {
          shortLabel: "Totem",
          glyph: "T",
          color: "#65c7ff",
          ink: "#081f33",
          slotRole: "key"
        },
        simpleWoodenDiyRecipes: {
          shortLabel: "DIY",
          glyph: "D",
          color: "#d2a36a",
          ink: "#2a1809",
          slotRole: "recipe"
        },
        lifeCoins: {
          shortLabel: "Log",
          glyph: "V",
          color: "#7bc7ff",
          ink: "#0b1f32",
          slotRole: "key",
          hiddenFromInventory: true
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
      simpleWoodenDiyRecipes: 1,
      lifeCoins: 10,
      wood: 3,
      campfire: 1,
      leppaBerry: 1
    });

    const slots = [...inventoryGridElement.querySelectorAll(".inventory-slot[data-filled='true']")];
    expect(inventoryGridElement.querySelector(".inventory-slot__label")).toBeNull();
    expect(inventoryGridElement.querySelector(".inventory-slot__role")).toBeNull();
    expect(slots.some((slot) => slot.dataset.slotRole === "key")).toBe(false);
    expect(slots.some((slot) => slot.dataset.slotRole === "recipe")).toBe(false);
    expect(slots.some((slot) => slot.dataset.slotRole === "currency")).toBe(false);
    expect(inventoryGridElement.textContent).not.toContain("V");
    expect(inventoryGridElement.textContent).not.toContain("T");
    expect(inventoryGridElement.textContent).not.toContain("D");

    const woodSlot = slots.find((slot) => {
      return slot.dataset.slotRole === "material";
    });

    expect(woodSlot?.dataset.iconKind).toBe("image");
    expect(woodSlot?.dataset.itemId).toBe("wood");
    expect(woodSlot?.querySelector(".inventory-slot__image")?.getAttribute("src")).toContain("Objects/wood.png");
  });

  it("queues pickup fly animations only for visible supplies slots", () => {
    const inventoryGridElement = document.createElement("div");
    document.body.appendChild(inventoryGridElement);
    const controller = createGameHudController({
      inventoryGridElement,
      inventoryOrder: ["waterGunTotem", "wood"],
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
        }
      }
    });

    controller.syncInventoryUi({
      waterGunTotem: 1,
      wood: 2
    });

    expect(controller.queueSupplyPickupFlyToSlot({
      itemId: "waterGunTotem",
      origin: { x: 12, y: 18 }
    })).toBe(false);
    expect(controller.queueSupplyPickupFlyToSlot({
      itemId: "wood",
      origin: { x: 12, y: 18 }
    })).toBe(true);

    const flyElement = document.body.querySelector(".supply-pickup-fly");
    expect(flyElement?.dataset.itemId).toBe("wood");
    expect(document.body.querySelector(".supply-pickup-fly-layer")).not.toBeNull();
    expect(inventoryGridElement.querySelector(".inventory-slot[data-item-id='wood']")).not.toBeNull();
  });

  it("keeps companion move information out of the persistent supplies HUD", () => {
    const uiLayerElement = document.createElement("div");
    const inventoryPanelElement = document.createElement("div");
    inventoryPanelElement.className = "inventory";
    const inventoryTitleElement = document.createElement("strong");
    inventoryTitleElement.textContent = "Supplies";
    const inventoryGridElement = document.createElement("div");
    inventoryPanelElement.append(inventoryTitleElement, inventoryGridElement);
    uiLayerElement.append(inventoryPanelElement);
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

    const companionHudElement = uiLayerElement.querySelector(".active-companion-hud");
    expect(inventoryPanelElement.querySelector(".inventory-header strong")?.textContent).toBe("Supplies");
    expect(inventoryPanelElement.querySelector(".active-companion-hud")).toBeNull();
    expect(companionHudElement?.parentElement).toBe(uiLayerElement);
    expect(companionHudElement?.hidden).toBe(false);
    expect(companionHudElement?.dataset.companionId).toBe("squirtle");
    expect(
      companionHudElement
        ?.querySelector(".active-companion-hud__portrait-image")
        ?.getAttribute("src")
    ).toContain("Robot-1-thumb.png");
    expect(companionHudElement?.querySelectorAll(".active-companion-hud__portrait-image")).toHaveLength(1);
    expect(companionHudElement?.querySelector(".active-companion-hud__switch-button")).toBeNull();
    expect(companionHudElement?.querySelector(".active-companion-hud__switch-icon")).toBeNull();
    expect(companionHudElement?.textContent).toContain("Water");
    expect(companionHudElement?.textContent).toContain("Hydro Bot");
    expect(companionHudElement?.getAttribute("aria-label")).toContain("Hydro Bot: Hydro Jet selected");
    expect(
      companionHudElement
        ?.querySelector(".active-companion-hud__hint-image")
        ?.getAttribute("alt")
    ).toContain("mark dry ground");

    controller.syncHudInstructions({
      flags: {
        firstGrassRestored: true
      }
    });

    expect(companionHudElement?.textContent).not.toContain("Hydro Bot will move over and restore it");
    expect(
      companionHudElement
        ?.querySelector(".active-companion-hud__hint-image")
        ?.getAttribute("src")
    ).toContain("Lt-thumb.png");

    controller.syncSkillsUi(unlockedSkills, "leafage", {
      flags: {}
    });

    expect(companionHudElement?.hidden).toBe(false);
    expect(companionHudElement?.dataset.companionId).toBe("bulbasaur");
    expect(
      companionHudElement
        ?.querySelector(".active-companion-hud__portrait-image")
        ?.getAttribute("src")
    ).toContain("Robot-2-thumb.png");
    expect(companionHudElement?.querySelectorAll(".active-companion-hud__portrait-image")).toHaveLength(1);
    expect(companionHudElement?.textContent).toContain("Leaf");
    expect(companionHudElement?.textContent).toContain("Grow Bot");
    expect(
      companionHudElement
        ?.querySelector(".active-companion-hud__hint-image")
        ?.getAttribute("alt")
    ).toContain("restored ground");

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
    expect(hudChecklistElement.innerHTML).toContain("Making colony zones");
    expect(controller.getNoticeMessage()).toBe("");

    storyState.flags.makingHabitatsComplete = true;
    nowSpy.mockReturnValue(1500);
    controller.renderMissionCards(storyState, {}, "");
    controller.syncQuestFocus(storyState);

    expect(missionsStackElement.innerHTML).toContain('data-task-flashing="true"');
    expect(hudChecklistElement.innerHTML).toContain('data-task-flashing="true"');
    expect(hudChecklistElement.innerHTML).toContain("Making colony zones");
    expect(controller.getNoticeMessage()).toBe("Task complete: Making colony zones.");

    nowSpy.mockReturnValue(4601);
    controller.renderMissionCards(storyState, {}, "");
    controller.syncQuestFocus(storyState);

    expect(missionsStackElement.innerHTML).not.toContain('data-task-id="making-habitats"');
    expect(hudChecklistElement.innerHTML).not.toContain("Making colony zones");
    expect(controller.getNoticeMessage()).toBe("Task complete: Making colony zones.");
  });

  it("queues rapid notices instead of overwriting current feedback", () => {
    const controller = createGameHudController({});

    controller.pushNotice("+1 Wood", 1);
    controller.pushNotice("New Workbench protocol available: Power.", 1);

    expect(controller.getNoticeMessage()).toBe("+1 Wood");

    controller.updateTransientNotice(1);

    expect(controller.getNoticeMessage()).toBe("New Workbench protocol available: Power.");
  });
});
