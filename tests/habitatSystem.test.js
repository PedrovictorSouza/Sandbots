import { describe, expect, it, vi } from "vitest";
import { createHabitatSystem } from "../app/sandbox/createHabitatSystem.js";
import { HABITAT_EVENT, SMALL_ISLAND_HABITATS } from "../app/sandbox/habitatData.js";

describe("createHabitatSystem", () => {
  it("ignores loose patch events for grouped habitats", () => {
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

    habitatSystem.recordEvent({
      type: HABITAT_EVENT.REVIVE_PATCH,
      targetId: "flower"
    });

    expect(habitatSystem.getDiscoveredLabels()).toEqual([]);
    expect(onDiscover).not.toHaveBeenCalled();
  });

  it("discovers tall grass from a restored habitat event instead of loose grass patches", () => {
    const onDiscover = vi.fn();
    const storyState = { flags: {} };
    const habitatSystem = createHabitatSystem({
      habitats: SMALL_ISLAND_HABITATS,
      storyState,
      onDiscover
    });

    for (let index = 0; index < 4; index += 1) {
      habitatSystem.recordEvent({
        type: HABITAT_EVENT.REVIVE_PATCH,
        targetId: "grass"
      });
    }

    expect(habitatSystem.getDiscoveredLabels()).toEqual([]);

    habitatSystem.recordEvent({
      type: HABITAT_EVENT.RESTORE_HABITAT,
      targetId: "tall-grass"
    });

    expect(habitatSystem.getDiscoveredLabels()).toEqual(["Tall Grass"]);
    expect(storyState.flags.tallGrassDiscovered).toBe(true);
  });

  it("discovers pretty flower bed from a restored flower habitat event", () => {
    const onDiscover = vi.fn();
    const storyState = { flags: {} };
    const habitatSystem = createHabitatSystem({
      habitats: SMALL_ISLAND_HABITATS,
      storyState,
      onDiscover
    });

    habitatSystem.recordEvent({
      type: HABITAT_EVENT.RESTORE_HABITAT,
      targetId: "pretty-flower-bed"
    });

    expect(habitatSystem.getDiscoveredLabels()).toEqual(["Pretty Flower Bed"]);
    expect(onDiscover).toHaveBeenCalledWith({
      habitat: expect.objectContaining({ id: "pretty-flower-bed" }),
      discoveredHabitats: [
        expect.objectContaining({ id: "pretty-flower-bed" })
      ],
      context: {
        event: {
          type: HABITAT_EVENT.RESTORE_HABITAT,
          targetId: "pretty-flower-bed"
        }
      }
    });
  });

  it("discovers Boulder-shaded Tall Grass from its challenge habitat event", () => {
    const onDiscover = vi.fn();
    const storyState = { flags: {} };
    const habitatSystem = createHabitatSystem({
      habitats: SMALL_ISLAND_HABITATS,
      storyState,
      onDiscover
    });

    habitatSystem.recordEvent({
      type: HABITAT_EVENT.RESTORE_HABITAT,
      targetId: "boulder-shaded-tall-grass"
    });

    expect(habitatSystem.getDiscoveredLabels()).toEqual(["Boulder-shaded Tall Grass"]);
    expect(storyState.flags.boulderShadedTallGrassDiscovered).toBe(true);
  });
});
