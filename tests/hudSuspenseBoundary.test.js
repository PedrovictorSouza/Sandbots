// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { createHudSuspenseBoundary } from "../app/ui/hudSuspenseBoundary.js";

function createElement(tagName, id) {
  const element = document.createElement(tagName);
  if (id) {
    element.id = id;
  }
  return element;
}

describe("createHudSuspenseBoundary", () => {
  it("renders a local fallback while the HUD module is loading", () => {
    const uiLayer = createElement("div");
    const hudElement = createElement("div");
    const questPanelElement = createElement("aside");
    const missionsPanelElement = createElement("aside");
    const inventoryPanelElement = createElement("div");
    const skillsPanelElement = createElement("div");
    const statusElement = createElement("div", "status");
    const hudInstructionsElement = createElement("span", "hud-instructions");
    const hudMetaElement = createElement("span", "hud-meta");
    const missionsStackElement = createElement("div", "missions-stack");
    const inventoryGridElement = createElement("div", "inventory-grid");
    const questTitleElement = createElement("div", "quest-focus-title");
    const questBodyElement = createElement("div", "quest-focus-body");
    const nearbyHabitatsValueElement = createElement("div", "nearby-habitats-value");

    const boundary = createHudSuspenseBoundary({
      uiLayer,
      hudElement,
      questPanelElement,
      missionsPanelElement,
      inventoryPanelElement,
      skillsPanelElement,
      statusElement,
      hudInstructionsElement,
      hudMetaElement,
      missionsStackElement,
      inventoryGridElement,
      questTitleElement,
      questBodyElement,
      nearbyHabitatsValueElement
    });

    boundary.setLoading(true);

    expect(uiLayer.dataset.hudLoading).toBe("true");
    expect(statusElement.textContent).toBe("Carregando HUD...");
    expect(statusElement.getAttribute("aria-busy")).toBe("true");
    expect(hudInstructionsElement.textContent).toContain("Preparando comandos");
    expect(missionsStackElement.querySelectorAll(".mission-card--skeleton")).toHaveLength(3);
    expect(inventoryGridElement.querySelectorAll(".inventory-slot--skeleton")).toHaveLength(5);
  });

  it("clears fallback markup once the HUD runtime is ready", () => {
    const uiLayer = createElement("div");
    const statusElement = createElement("div", "status");
    const hudInstructionsElement = createElement("span", "hud-instructions");
    const hudMetaElement = createElement("span", "hud-meta");
    const missionsStackElement = createElement("div", "missions-stack");
    const inventoryGridElement = createElement("div", "inventory-grid");

    const boundary = createHudSuspenseBoundary({
      uiLayer,
      statusElement,
      hudInstructionsElement,
      hudMetaElement,
      missionsStackElement,
      inventoryGridElement
    });

    boundary.setLoading(true);
    boundary.setLoading(false);

    expect(uiLayer.dataset.hudLoading).toBe("false");
    expect(statusElement.getAttribute("aria-busy")).toBe("false");
    expect(missionsStackElement.innerHTML).toBe("");
    expect(inventoryGridElement.innerHTML).toBe("");
    expect(hudInstructionsElement.textContent).toBe("");
    expect(hudMetaElement.textContent).toBe("");
  });

  it("can surface an immediate fallback status without waiting for the lazy runtime", () => {
    const statusElement = createElement("div", "status");
    const boundary = createHudSuspenseBoundary({
      statusElement
    });

    boundary.setStatus("Falha ao carregar o HUD.", true);

    expect(statusElement.textContent).toBe("Falha ao carregar o HUD.");
    expect(statusElement.dataset.error).toBe("true");
  });
});
