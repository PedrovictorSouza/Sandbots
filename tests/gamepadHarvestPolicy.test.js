import { describe, expect, it } from "vitest";

import { shouldGamepadSourceHarvestTarget } from "../app/runtime/gamepadHarvestPolicy.js";

describe("gamepad harvest policy", () => {
  it("keeps the X button from triggering selected field moves", () => {
    expect(shouldGamepadSourceHarvestTarget({
      source: "gamepadBag",
      activeHarvestTarget: { groundCell: { id: "dry-ground" } }
    })).toBe(false);
    expect(shouldGamepadSourceHarvestTarget({
      source: "gamepadBag",
      activeHarvestTarget: { leafageGroundCell: { id: "restored-ground" } }
    })).toBe(false);
    expect(shouldGamepadSourceHarvestTarget({
      source: "gamepadBag",
      activeHarvestTarget: { palm: { id: "tree" } }
    })).toBe(false);
  });

  it("still lets X place selected objects from the bag", () => {
    expect(shouldGamepadSourceHarvestTarget({
      source: "gamepadBag",
      activeHarvestTarget: { logChairPlacement: true }
    })).toBe(true);
    expect(shouldGamepadSourceHarvestTarget({
      source: "gamepadBag",
      activeHarvestTarget: { leafDenFurniturePlacement: true }
    })).toBe(true);
  });

  it("keeps the primary gamepad action available for field moves", () => {
    expect(shouldGamepadSourceHarvestTarget({
      source: "gamepadPrimary",
      activeHarvestTarget: { groundCell: { id: "dry-ground" } }
    })).toBe(true);
  });
});
