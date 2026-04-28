import { describe, expect, it, vi } from "vitest";
import { createHabitatSystem } from "../app/sandbox/createHabitatSystem.js";
import { HABITAT_EVENT, SMALL_ISLAND_HABITATS } from "../app/sandbox/habitatData.js";

describe("createHabitatSystem", () => {
  it("ignores planned habitats without event requirements when recording Water Gun events", () => {
    const onDiscover = vi.fn();
    const storyState = { flags: {} };
    const habitatSystem = createHabitatSystem({
      habitats: SMALL_ISLAND_HABITATS,
      storyState,
      onDiscover
    });

    expect(() => {
      habitatSystem.recordEvent({
        type: HABITAT_EVENT.REVIVE_PATCH,
        targetId: "grass"
      });
    }).not.toThrow();

    expect(habitatSystem.getDiscoveredLabels()).toEqual(["Pretty Flower Bed"]);
    expect(onDiscover).toHaveBeenCalledTimes(1);
  });
});
