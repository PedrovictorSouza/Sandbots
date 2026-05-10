import { describe, expect, it, vi } from "vitest";
import { LEAVES_ITEM_ID } from "../gameplayContent.js";
import { createEmptySession } from "../app/session/createEmptySession.js";
import { initializeGameplayState } from "../app/session/initializeGameplatState.js";

describe("gameplay field resource drops", () => {
  it("starts the planet with a smaller readable supply of sturdy sticks and leaf piles", () => {
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
    expect(session.woodDrops.length).toBeGreaterThanOrEqual(30);
    expect(session.woodDrops.length).toBeLessThanOrEqual(35);
    expect(new Set(session.woodDrops.map((drop) => drop.id)).size).toBe(session.woodDrops.length);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(180);
    expect(Math.max(...zs) - Math.min(...zs)).toBeGreaterThan(80);
    expect(session.woodDrops.every((drop) => drop.collected === false)).toBe(true);
    expect(leafNodes.length).toBe(5);
    expect(new Set(leafNodes.map((node) => node.id)).size).toBe(leafNodes.length);
  });
});
