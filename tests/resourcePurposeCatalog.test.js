import { describe, expect, it } from "vitest";
import {
  CARBON_ITEM_ID,
  LEAF_DEN_KIT_ITEM_ID,
  LEAVES_ITEM_ID,
  NITROGEN_ITEM_ID,
  PHOSPHORUS_ITEM_ID,
  POTASSIUM_ITEM_ID,
  STRAW_BED_ITEM_ID
} from "../gameplayContent.js";
import {
  EARLY_RESOURCE_PURPOSE_ITEM_IDS,
  RESOURCE_PURPOSE,
  getResourcePurposeByItemId,
  listEarlyResourcePurposes,
  validateResourcePurposeCatalog
} from "../app/story/resourcePurposeCatalog.js";

describe("resource purpose catalog", () => {
  it("classifies the current early inventory resources in stable order", () => {
    expect(listEarlyResourcePurposes().map((entry) => entry.itemId)).toEqual(
      EARLY_RESOURCE_PURPOSE_ITEM_IDS
    );
    expect(Object.isFrozen(listEarlyResourcePurposes())).toBe(true);
    expect(Object.isFrozen(listEarlyResourcePurposes()[0])).toBe(true);
  });

  it("connects early materials to colony purposes instead of generic pickups", () => {
    expect(getResourcePurposeByItemId("wood")).toMatchObject({
      purposes: [RESOURCE_PURPOSE.BUILD, RESOURCE_PURPOSE.COMFORT],
      playerFacingPurpose: expect.stringContaining("first shelter")
    });
    expect(getResourcePurposeByItemId(LEAVES_ITEM_ID)).toMatchObject({
      purposes: [RESOURCE_PURPOSE.BUILD, RESOURCE_PURPOSE.RESTORATION]
    });
    expect(getResourcePurposeByItemId(CARBON_ITEM_ID)).toMatchObject({
      purposes: [RESOURCE_PURPOSE.FUEL]
    });
    expect(getResourcePurposeByItemId(LEAF_DEN_KIT_ITEM_ID)).toMatchObject({
      purposes: [RESOURCE_PURPOSE.BUILD, RESOURCE_PURPOSE.SHELTER]
    });
    expect(getResourcePurposeByItemId(STRAW_BED_ITEM_ID)).toMatchObject({
      purposes: [RESOURCE_PURPOSE.BUILD, RESOURCE_PURPOSE.RESTORATION]
    });
  });

  it("keeps nutrient materials grouped as restoration charges", () => {
    [NITROGEN_ITEM_ID, PHOSPHORUS_ITEM_ID, POTASSIUM_ITEM_ID].forEach((itemId) => {
      expect(getResourcePurposeByItemId(itemId)).toMatchObject({
        purposes: [RESOURCE_PURPOSE.RESTORATION]
      });
    });
  });

  it("validates missing ids, duplicate ids, missing defs, unknown purposes and missing purpose copy", () => {
    expect(validateResourcePurposeCatalog()).toEqual([]);

    expect(validateResourcePurposeCatalog({
      requiredItemIds: ["wood", "unknownRequired"],
      itemDefs: { wood: { id: "wood" } },
      catalog: [
        { itemId: "wood", purposes: [RESOURCE_PURPOSE.BUILD], playerFacingPurpose: "Builds." },
        { itemId: "wood", purposes: ["currency"], playerFacingPurpose: "" },
        { itemId: "ghost", purposes: [], playerFacingPurpose: "Nice shiny thing." },
        { purposes: [RESOURCE_PURPOSE.STORY], playerFacingPurpose: "No id." }
      ]
    })).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "duplicate-item-id", itemId: "wood" }),
      expect.objectContaining({ type: "unknown-purpose", itemId: "wood", purpose: "currency" }),
      expect.objectContaining({ type: "missing-player-facing-purpose", itemId: "wood" }),
      expect.objectContaining({ type: "player-facing-purpose-too-vague", itemId: "wood" }),
      expect.objectContaining({
        type: "player-facing-purpose-missing-colony-consequence",
        itemId: "ghost"
      }),
      expect.objectContaining({ type: "missing-item-def", itemId: "ghost" }),
      expect.objectContaining({ type: "missing-purpose", itemId: "ghost" }),
      expect.objectContaining({ type: "missing-item-id" }),
      expect.objectContaining({ type: "missing-required-resource-purpose", itemId: "unknownRequired" })
    ]));
  });
});
