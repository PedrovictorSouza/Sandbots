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

  it("supports custom role labels for repair kits", () => {
    expect(getInventorySlotRoleLabel({
      slotRole: "placeable",
      slotRoleLabel: "Repair"
    })).toBe("Repair");
  });
});
