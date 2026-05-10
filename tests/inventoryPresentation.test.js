import { describe, expect, it } from "vitest";
import {
  getInventoryPresentationOrder,
  getInventorySlotRoleLabel
} from "../app/ui/inventoryPresentation.js";

describe("inventoryPresentation", () => {
  it("prioritizes field-use items before passive resources", () => {
    const inventory = {
      waterGunTotem: 1,
      wood: 5,
      campfire: 1,
      leppaBerry: 1,
      lifeCoins: 10
    };
    const inventoryOrder = ["waterGunTotem", "wood", "leppaBerry", "campfire", "lifeCoins"];
    const itemDefs = {
      waterGunTotem: { slotRole: "key" },
      wood: { slotRole: "material" },
      leppaBerry: { slotRole: "gift" },
      campfire: { slotRole: "placeable" },
      lifeCoins: { slotRole: "currency" }
    };

    expect(getInventoryPresentationOrder(inventory, inventoryOrder, itemDefs)).toEqual([
      "campfire",
      "wood",
      "leppaBerry",
      "lifeCoins",
      "waterGunTotem"
    ]);
  });

  it("keeps follower state out of supplies while showing leaves", () => {
    const inventory = {
      wood: 2,
      leaves: 3,
      bulbasaurFollowing: 1,
      charmander: 1
    };
    const inventoryOrder = ["bulbasaurFollowing", "wood", "leaves", "charmander"];
    const itemDefs = {
      wood: { slotRole: "material" },
      leaves: { slotRole: "material" },
      charmander: { slotRole: "companion" }
    };

    expect(getInventoryPresentationOrder(inventory, inventoryOrder, itemDefs)).toEqual([
      "wood",
      "leaves"
    ]);
  });

  it("can hide non-supply roles from the Supplies HUD", () => {
    const inventory = {
      waterGunTotem: 1,
      simpleWoodenDiyRecipes: 1,
      lifeCoins: 10,
      wood: 5,
      leaves: 3
    };
    const inventoryOrder = [
      "waterGunTotem",
      "simpleWoodenDiyRecipes",
      "lifeCoins",
      "wood",
      "leaves"
    ];
    const itemDefs = {
      waterGunTotem: { slotRole: "key" },
      simpleWoodenDiyRecipes: { slotRole: "recipe" },
      lifeCoins: { slotRole: "currency" },
      wood: { slotRole: "material" },
      leaves: { slotRole: "material" }
    };

    expect(getInventoryPresentationOrder(inventory, inventoryOrder, itemDefs, {
      excludedRoles: ["key", "recipe", "currency"]
    })).toEqual([
      "wood",
      "leaves"
    ]);
  });

  it("supports custom role labels for repair kits", () => {
    expect(getInventorySlotRoleLabel({
      slotRole: "placeable",
      slotRoleLabel: "Repair"
    })).toBe("Repair");
  });
});
