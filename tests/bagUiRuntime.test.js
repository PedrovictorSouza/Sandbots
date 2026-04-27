// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { createBagUiRuntime } from "../app/runtime/bagUiRuntime.js";

function createGameplayUiVisibility(initialSections = []) {
  const visibleSections = new Set(initialSections);

  return {
    visibleSections,
    hideSections(sections) {
      for (const section of sections) {
        visibleSections.delete(section);
      }
    },
    isSectionVisible(section) {
      return visibleSections.has(section);
    },
    showSections(sections) {
      for (const section of sections) {
        visibleSections.add(section);
      }
    }
  };
}

function createRuntime({
  inventory = {
    wood: 1,
    berry: 1
  },
  initialSections = ["quest"],
  storyState = {
    flags: {}
  }
} = {}) {
  const bagDetails = {
    setItem: vi.fn()
  };
  const bagOnboarding = {
    setHint: vi.fn()
  };
  const gameplayUiVisibility = createGameplayUiVisibility(initialSections);
  const itemDefs = {
    wood: {
      id: "wood",
      bagDetailsEligible: true,
      label: "Wood"
    },
    berry: {
      id: "berry",
      bagDetailsEligible: true,
      label: "Berry"
    }
  };
  const runtime = createBagUiRuntime({
    bagOnboarding,
    bagDetails,
    gameplayUiVisibility,
    inventory,
    inventoryOrder: ["wood", "berry"],
    itemDefs,
    isBagDetailItemId: (itemId) => Boolean(itemDefs[itemId]?.bagDetailsEligible)
  });

  return {
    bagDetails,
    bagOnboarding,
    gameplayUiVisibility,
    itemDefs,
    runtime,
    storyState
  };
}

describe("createBagUiRuntime", () => {
  it("shows onboarding once and restores quest visibility after details close", () => {
    const {
      bagDetails,
      bagOnboarding,
      gameplayUiVisibility,
      itemDefs,
      runtime,
      storyState
    } = createRuntime();

    runtime.handleItemCollected("wood", storyState);

    expect(storyState.flags.bagOnboardingSeen).toBe(true);
    expect(bagOnboarding.setHint).toHaveBeenCalledWith(expect.objectContaining({
      title: "Your Bag"
    }));
    expect(gameplayUiVisibility.isSectionVisible("quest")).toBe(false);
    expect(gameplayUiVisibility.isSectionVisible("bagOnboarding")).toBe(true);
    expect(gameplayUiVisibility.isSectionVisible("inventory")).toBe(true);

    runtime.inspect();

    expect(bagDetails.setItem).toHaveBeenCalledWith(itemDefs.wood, 1);
    expect(gameplayUiVisibility.isSectionVisible("bagOnboarding")).toBe(false);
    expect(gameplayUiVisibility.isSectionVisible("bagDetails")).toBe(true);
    expect(gameplayUiVisibility.isSectionVisible("quest")).toBe(false);

    runtime.inspect();

    expect(gameplayUiVisibility.isSectionVisible("bagDetails")).toBe(false);
    expect(gameplayUiVisibility.isSectionVisible("quest")).toBe(true);
  });

  it("uses the first available detail item when no selection is active", () => {
    const { bagDetails, itemDefs, runtime } = createRuntime({
      inventory: {
        wood: 0,
        berry: 2
      }
    });

    runtime.inspect();

    expect(bagDetails.setItem).toHaveBeenCalledWith(itemDefs.berry, 2);
  });

  it("refreshes details when a collected item becomes selected while details are open", () => {
    const { bagDetails, itemDefs, runtime, storyState } = createRuntime({
      storyState: {
        flags: {
          bagOnboardingSeen: true
        }
      }
    });

    runtime.inspect();
    runtime.handleItemCollected("berry", storyState);

    expect(bagDetails.setItem).toHaveBeenLastCalledWith(itemDefs.berry, 1);
  });
});
