import { describe, expect, it, vi } from "vitest";
import { LEAVES_ITEM_ID } from "../gameplayContent.js";
import { createEmptySession } from "../app/session/createEmptySession.js";
import { initializeGameplayState } from "../app/session/initializeGameplatState.js";
import {
  collectWoodDrops,
  updateResourceNodes
} from "../world/islandWorld.js";

describe("gameplay field resource drops", () => {
  it("starts the planet with an exploration-sized supply of sturdy sticks and leaf piles", () => {
    const session = createEmptySession();

    initializeGameplayState(session, {
      storyState: {},
      inventory: {},
      resetGameplayRuntimeState: vi.fn(),
      syncInventoryUi: vi.fn(),
      syncHudMeta: vi.fn(),
      renderMissionCards: vi.fn()
    });

    const positions = session.woodDrops.map((drop) => drop.position);
    const xs = positions.map((position) => position[0]);
    const zs = positions.map((position) => position[2]);
    const leafNodes = session.resourceNodes.filter((node) => node.itemId === LEAVES_ITEM_ID);
    expect(session.woodDrops.length).toBeGreaterThanOrEqual(14);
    expect(session.woodDrops.length).toBeLessThanOrEqual(18);
    expect(new Set(session.woodDrops.map((drop) => drop.id)).size).toBe(session.woodDrops.length);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(180);
    expect(Math.max(...zs) - Math.min(...zs)).toBeGreaterThan(80);
    expect(positions.every((position) => Math.hypot(position[0] - 1.42, position[2] - 62.48) >= 18)).toBe(true);
    expect(positions.every((position) => Math.hypot(position[0] - 12, position[2] + 3.5) >= 20)).toBe(true);
    expect(session.woodDrops.every((drop) => drop.collected === false)).toBe(true);
    expect(leafNodes.length).toBe(5);
    expect(new Set(leafNodes.map((node) => node.id)).size).toBe(leafNodes.length);
  });

  it("respawns collected wood drops after their ecosystem cooldown", () => {
    const woodDrops = [
      {
        id: "wood-1",
        position: [0, 0.02, 0],
        size: [0.78, 0.78],
        pickupRadius: 0.64,
        collected: false,
        respawnDuration: 3
      }
    ];
    const inventory = { wood: 0 };

    expect(collectWoodDrops([0, 0, 0], woodDrops, inventory)).toBe(1);
    expect(inventory.wood).toBe(1);
    expect(woodDrops[0].collected).toBe(true);
    expect(woodDrops[0].cooldown).toBe(3);

    updateResourceNodes(2, woodDrops);
    expect(woodDrops[0].collected).toBe(true);
    expect(woodDrops[0].cooldown).toBe(1);

    updateResourceNodes(1, woodDrops);
    expect(woodDrops[0].collected).toBe(false);
    expect(woodDrops[0].cooldown).toBe(0);
  });
});
