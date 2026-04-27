// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createGuidePanel } from "../guidePanel.js";

function click(element) {
  if (!element) {
    throw new Error("Expected clickable element.");
  }

  element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
}

function typeInto(element, value) {
  if (!element) {
    throw new Error("Expected input element.");
  }

  element.value = value;
  element.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("createGuidePanel integration", () => {
  let root;
  let onClose;
  let onTrackRecipe;

  beforeEach(() => {
    document.body.innerHTML = "";
    root = document.createElement("section");
    document.body.append(root);
    onClose = vi.fn();
    onTrackRecipe = vi.fn();
  });

  it("filters the unified database and syncs tracked recipes into the pinned panel", { timeout: 30000 }, () => {
    createGuidePanel({ root, onClose, onTrackRecipe });

    click(root.querySelector('[data-guide-view="database"]'));
    expect(root.querySelector("#guide-title")?.textContent).toBe("Unified Recipe Index");

    click(root.querySelector('[data-guide-filter="cooking"]'));
    typeInto(root.querySelector("#guide-search-input"), "roasted chanterelle");

    const rows = [...root.querySelectorAll("tbody tr")];
    expect(rows).toHaveLength(1);
    expect(root.querySelector(".database-row-button")?.textContent).toContain("Roasted Chanterelle");
    expect(root.querySelector(".detail-title")?.textContent).toBe("Roasted Chanterelle");

    click(root.querySelector('[data-track-recipe="roasted-chanterelle"]'));
    expect(onTrackRecipe).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: "roasted-chanterelle",
        name: "Roasted Chanterelle",
      })
    );
    expect(root.querySelector("#guide-pinned strong")?.textContent).toBe("Roasted Chanterelle");
    expect(root.querySelector('[data-track-recipe="roasted-chanterelle"]')?.textContent).toContain("Remover do HUD");

    click(root.querySelector('[data-track-recipe="roasted-chanterelle"]'));
    expect(onTrackRecipe).toHaveBeenLastCalledWith(null);
    expect(root.querySelector("#guide-pinned strong")?.textContent).toBe("None");
  });

  it("follows cross-view quick actions between articles and guides", { timeout: 30000 }, () => {
    createGuidePanel({ root, onClose, onTrackRecipe });

    click(root.querySelector('[data-guide-view="articles"]'));
    expect(root.querySelector("#guide-title")?.textContent).toBe("Walkthroughs & Survival Reads");
    expect(root.querySelector(".detail-title")?.textContent).toBe(
      "Winter Burrow Walkthrough - Complete Story Guide & Key Quests"
    );

    click(root.querySelector('[data-toolkit-action-type="guide"][data-toolkit-action-target="expedition-planner"]'));
    expect(root.querySelector("#guide-title")?.textContent).toBe("Winter Burrow Guides");
    expect(root.querySelector(".detail-title")?.textContent).toBe("Optimal Expedition Planner");

    click(root.querySelector('[data-toolkit-action-type="article"][data-toolkit-action-target="complete-story-guide"]'));
    expect(root.querySelector("#guide-title")?.textContent).toBe("Walkthroughs & Survival Reads");
    expect(root.querySelector(".detail-title")?.textContent).toBe(
      "Winter Burrow Walkthrough - Complete Story Guide & Key Quests"
    );
  });
});
