import { describe, expect, it } from "vitest";
import {
  LIFE_COINS_ITEM_ID,
  LEAF_DEN_KIT_ITEM_ID,
  LEAVES_ITEM_ID,
  NITROGEN_ITEM_ID,
  WATER_GUN_POWER_ITEM_ID
} from "../gameplayContent.js";
import {
  COLONY_CACHE_ID,
  COLONY_CACHE_ITEM_GROUP,
  createColonyCacheState,
  validateColonyCacheState
} from "../app/gameplay/colonyCacheContract.js";

describe("colony cache contract", () => {
  it("summarizes inventory as colony supplies without consuming anything", () => {
    const inventory = {
      wood: 3,
      [LEAVES_ITEM_ID]: 2,
      [NITROGEN_ITEM_ID]: 1,
      [WATER_GUN_POWER_ITEM_ID]: 1,
      [LEAF_DEN_KIT_ITEM_ID]: 1,
      [LIFE_COINS_ITEM_ID]: 99
    };
    const cache = createColonyCacheState({ inventory });

    expect(cache).toMatchObject({
      id: COLONY_CACHE_ID,
      label: "Colony Cache",
      totalItems: 8
    });
    expect(inventory[LIFE_COINS_ITEM_ID]).toBe(99);
    expect(cache.storedItems.map((item) => item.itemId)).toEqual([
      "wood",
      LEAVES_ITEM_ID,
      NITROGEN_ITEM_ID,
      WATER_GUN_POWER_ITEM_ID,
      LEAF_DEN_KIT_ITEM_ID
    ]);
    expect(cache.storedItems.find((item) => item.itemId === "wood")).toMatchObject({
      group: COLONY_CACHE_ITEM_GROUP.MATERIALS,
      purposes: ["build", "comfort"]
    });
    expect(cache.storedItems.find((item) => item.itemId === WATER_GUN_POWER_ITEM_ID)).toMatchObject({
      group: COLONY_CACHE_ITEM_GROUP.TOOLS,
      purposeText: "Powers Hydro Jet so dry ground can be restored."
    });
    expect(validateColonyCacheState(cache)).toEqual([]);
  });

  it("groups placeables, tools, materials, and story supplies separately", () => {
    const cache = createColonyCacheState({
      inventory: {
        wood: 1,
        [WATER_GUN_POWER_ITEM_ID]: 1,
        [LEAF_DEN_KIT_ITEM_ID]: 1,
        simpleWoodenDiyRecipes: 1
      }
    });

    expect(cache.groupCounts).toMatchObject({
      [COLONY_CACHE_ITEM_GROUP.MATERIALS]: 1,
      [COLONY_CACHE_ITEM_GROUP.TOOLS]: 1,
      [COLONY_CACHE_ITEM_GROUP.PLACEABLES]: 1,
      [COLONY_CACHE_ITEM_GROUP.STORY]: 1
    });
    expect(Object.isFrozen(cache.storedItems)).toBe(true);
    expect(Object.isFrozen(cache.storedItems[0])).toBe(true);
  });

  it("validates malformed cache state", () => {
    expect(validateColonyCacheState({
      id: "wrong",
      storedItems: [
        { itemId: "wood", label: "Wood", quantity: 1, group: COLONY_CACHE_ITEM_GROUP.MATERIALS },
        { itemId: "wood", label: "", quantity: 0, group: "currency" },
        { label: "No id", quantity: 1, group: COLONY_CACHE_ITEM_GROUP.OTHER }
      ]
    })).toEqual([
      { type: "invalid-cache-id", cacheId: "wrong" },
      { type: "duplicate-item-id", itemId: "wood", index: 1 },
      { type: "missing-item-label", itemId: "wood", index: 1 },
      { type: "invalid-item-quantity", itemId: "wood", quantity: 0, index: 1 },
      { type: "unknown-item-group", itemId: "wood", group: "currency", index: 1 },
      { type: "missing-item-id", index: 2 }
    ]);
  });
});
