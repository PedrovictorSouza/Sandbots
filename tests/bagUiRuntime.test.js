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
  it("shows onboarding once and restores quest visibility when the bag is inspected", () => {
    const {
      bagDetails,
      bagOnboarding,
      gameplayUiVisibility,
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

    expect(bagDetails.setItem).not.toHaveBeenCalled();
    expect(gameplayUiVisibility.isSectionVisible("bagOnboarding")).toBe(false);
    expect(gameplayUiVisibility.isSectionVisible("bagDetails")).toBe(false);
    expect(gameplayUiVisibility.isSectionVisible("inventory")).toBe(true);
    expect(gameplayUiVisibility.isSectionVisible("quest")).toBe(true);

    runtime.inspect();

    expect(gameplayUiVisibility.isSectionVisible("bagDetails")).toBe(false);
    expect(gameplayUiVisibility.isSectionVisible("quest")).toBe(true);
  });

  it("tracks the first available bag item without opening a details panel", () => {
    const { bagDetails, runtime } = createRuntime({
      inventory: {
        wood: 0,
        berry: 2
      }
    });

    runtime.inspect();

    expect(runtime.getSelectedItemId()).toBe("berry");
    expect(runtime.isDetailsOpen()).toBe(false);
    expect(bagDetails.setItem).not.toHaveBeenCalled();
  });

  it("uses field-use priority when choosing the tracked bag item", () => {
    const bagDetails = {
      setItem: vi.fn()
    };
    const itemDefs = {
      wood: {
        id: "wood",
        bagDetailsEligible: true,
        label: "Wood",
        slotRole: "material"
      },
      campfire: {
        id: "campfire",
        bagDetailsEligible: true,
        label: "Campfire",
        slotRole: "placeable"
      }
    };
    const runtime = createBagUiRuntime({
      bagOnboarding: {
        setHint: vi.fn()
      },
      bagDetails,
      gameplayUiVisibility: createGameplayUiVisibility(["quest"]),
      inventory: {
        wood: 3,
        campfire: 1
      },
      inventoryOrder: ["wood", "campfire"],
      itemDefs,
      isBagDetailItemId: (itemId) => Boolean(itemDefs[itemId]?.bagDetailsEligible)
    });

    runtime.inspect();

    expect(runtime.getSelectedItemId()).toBe("campfire");
    expect(runtime.isDetailsOpen()).toBe(false);
    expect(bagDetails.setItem).not.toHaveBeenCalled();
  });

  it("updates the tracked bag item when a new eligible item is collected", () => {
    const { bagDetails, runtime, storyState } = createRuntime({
      storyState: {
        flags: {
          bagOnboardingSeen: true
        }
      }
    });

    runtime.inspect();
    runtime.handleItemCollected("berry", storyState);

    expect(runtime.getSelectedItemId()).toBe("berry");
    expect(runtime.isDetailsOpen()).toBe(false);
    expect(bagDetails.setItem).not.toHaveBeenCalled();
  });

  it("reports the selected detail item", () => {
    const { runtime } = createRuntime();

    expect(runtime.getSelectedItemId()).toBe("wood");

    runtime.selectItem("berry");

    expect(runtime.getSelectedItemId()).toBe("berry");
  });
});
