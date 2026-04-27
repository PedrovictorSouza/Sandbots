// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { createGameplayUiVisibilityController } from "../app/ui/gameplayUiVisibilityController.js";

describe("createGameplayUiVisibilityController", () => {
  it("starts with every gameplay panel hidden when requested", () => {
    const uiLayer = document.createElement("div");
    const controller = createGameplayUiVisibilityController({
      uiLayer,
      initialVisibility: "hidden"
    });

    expect(uiLayer.dataset.gameplayUiState).toBe("hidden");
    expect(uiLayer.dataset.gameplayUiHud).toBe("hidden");
    expect(uiLayer.dataset.gameplayUiQuest).toBe("hidden");
    expect(uiLayer.dataset.gameplayUiBagOnboarding).toBe("hidden");
    expect(uiLayer.dataset.gameplayUiBagDetails).toBe("hidden");
    expect(uiLayer.dataset.gameplayUiMissions).toBe("hidden");
    expect(uiLayer.dataset.gameplayUiNearbyHabitats).toBe("hidden");
    expect(uiLayer.dataset.gameplayUiSkills).toBe("hidden");
    expect(uiLayer.dataset.gameplayUiInventory).toBe("hidden");
    expect(uiLayer.dataset.gameplayUiStatus).toBe("hidden");
    expect(uiLayer.dataset.gameplayUiBuilder).toBe("hidden");
    expect(controller.isSectionVisible("hud")).toBe(false);
  });

  it("can reveal individual panels without showing everything", () => {
    const uiLayer = document.createElement("div");
    const controller = createGameplayUiVisibilityController({
      uiLayer,
      initialVisibility: "hidden"
    });

    controller.showSections(["status"]);

    expect(uiLayer.dataset.gameplayUiState).toBe("custom");
    expect(uiLayer.dataset.gameplayUiStatus).toBe("visible");
    expect(uiLayer.dataset.gameplayUiHud).toBe("hidden");
    expect(controller.isSectionVisible("status")).toBe(true);
  });

  it("can reveal the bag onboarding panel independently", () => {
    const uiLayer = document.createElement("div");
    const controller = createGameplayUiVisibilityController({
      uiLayer,
      initialVisibility: "hidden"
    });

    controller.showSections(["bagOnboarding", "inventory"]);

    expect(uiLayer.dataset.gameplayUiState).toBe("custom");
    expect(uiLayer.dataset.gameplayUiBagOnboarding).toBe("visible");
    expect(uiLayer.dataset.gameplayUiInventory).toBe("visible");
    expect(uiLayer.dataset.gameplayUiQuest).toBe("hidden");
    expect(controller.isSectionVisible("bagOnboarding")).toBe(true);
  });

  it("can reveal the bag details panel independently", () => {
    const uiLayer = document.createElement("div");
    const controller = createGameplayUiVisibilityController({
      uiLayer,
      initialVisibility: "hidden"
    });

    controller.showSections(["bagDetails", "inventory"]);

    expect(uiLayer.dataset.gameplayUiState).toBe("custom");
    expect(uiLayer.dataset.gameplayUiBagDetails).toBe("visible");
    expect(uiLayer.dataset.gameplayUiInventory).toBe("visible");
    expect(uiLayer.dataset.gameplayUiQuest).toBe("hidden");
    expect(controller.isSectionVisible("bagDetails")).toBe(true);
  });

  it("can reveal the habitat discovery panels independently", () => {
    const uiLayer = document.createElement("div");
    const controller = createGameplayUiVisibilityController({
      uiLayer,
      initialVisibility: "hidden"
    });

    controller.showSections(["quest", "nearbyHabitats"]);

    expect(uiLayer.dataset.gameplayUiQuest).toBe("visible");
    expect(uiLayer.dataset.gameplayUiNearbyHabitats).toBe("visible");
    expect(uiLayer.dataset.gameplayUiInventory).toBe("hidden");
    expect(controller.isSectionVisible("quest")).toBe(true);
    expect(controller.isSectionVisible("nearbyHabitats")).toBe(true);
  });
});
