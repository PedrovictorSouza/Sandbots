import { describe, expect, it } from "vitest";
import {
  BUILDING_KIT_ITEM_KIND,
  CREATURE_DEFS,
  CREATURE_SPECIALTY,
  getCreatureById,
  getHomeById,
  getBuildingKitByItemId,
  HOME_DEFS,
  ITEM_DEFS,
  LEAF_DEN_BUILD_DURATION_MS,
  LEAF_DEN_BUILD_REQUIREMENTS,
  LEAF_DEN_KIT_ITEM_ID,
  LEAVES_ITEM_ID,
  listHomes,
  listCreatures,
  listBuildingKits
} from "../gameplayContent.js";

describe("building kit data", () => {
  it("marks the House Kit inventory item as a BuildingKit", () => {
    expect(ITEM_DEFS[LEAF_DEN_KIT_ITEM_ID]).toMatchObject({
      itemKind: BUILDING_KIT_ITEM_KIND,
      buildingKitId: LEAF_DEN_KIT_ITEM_ID,
      slotRole: "placeable"
    });
  });

  it("exposes the House Kit as the first building kit definition", () => {
    expect(getBuildingKitByItemId(LEAF_DEN_KIT_ITEM_ID)).toMatchObject({
      id: LEAF_DEN_KIT_ITEM_ID,
      itemId: LEAF_DEN_KIT_ITEM_ID,
      name: "House Kit",
      previewModelId: "leafDenKit",
      completedModelId: "leafDen",
      requiredSpecialties: [
        CREATURE_SPECIALTY.BUILD,
        CREATURE_SPECIALTY.BURN
      ],
      buildDurationSeconds: LEAF_DEN_BUILD_DURATION_MS / 1000,
      minFurnitureRequired: 3
    });
  });

  it("keeps building kit material requirements aligned with existing House construction", () => {
    expect(getBuildingKitByItemId(LEAF_DEN_KIT_ITEM_ID).requiredMaterials).toEqual([
      { itemId: "wood", quantity: LEAF_DEN_BUILD_REQUIREMENTS.wood },
      { itemId: LEAVES_ITEM_ID, quantity: LEAF_DEN_BUILD_REQUIREMENTS[LEAVES_ITEM_ID] }
    ]);
  });

  it("exposes building kit definitions as immutable catalog data", () => {
    const kits = listBuildingKits();

    expect(Object.isFrozen(kits)).toBe(true);
    expect(Object.isFrozen(kits[0])).toBe(true);
    expect(Object.isFrozen(kits[0].requiredMaterials)).toBe(true);
    expect(getBuildingKitByItemId("missing-kit")).toBeNull();
  });

  it("adds specialties to helper creature definitions", () => {
    expect(Object.keys(CREATURE_DEFS)).toEqual([
      "squirtle",
      "bulbasaur",
      "charmander",
      "timburr"
    ]);
    expect(getCreatureById("charmander")).toMatchObject({
      id: "charmander",
      label: "Charmander",
      currentHomeId: null,
      idealHabitat: "warm",
      specialties: [
        CREATURE_SPECIALTY.BURN
      ]
    });
    expect(getCreatureById("timburr")).toMatchObject({
      id: "timburr",
      label: "Timburr",
      currentHomeId: null,
      idealHabitat: "workshop",
      specialties: [
        CREATURE_SPECIALTY.BUILD
      ]
    });
    expect(getCreatureById("bulbasaur")?.specialties).toEqual([]);
    expect(getCreatureById("squirtle")?.specialties).toEqual([]);
    expect(getCreatureById("missing-creature")).toBeNull();
  });

  it("exposes creature definitions as immutable catalog data", () => {
    const creatures = listCreatures();

    expect(Object.isFrozen(creatures)).toBe(true);
    expect(Object.isFrozen(creatures[0])).toBe(true);
    expect(Object.isFrozen(creatures[0].specialties)).toBe(true);
  });

  it("associates homes with habitat types", () => {
    expect(HOME_DEFS.leafDen).toEqual({
      id: "leafDen",
      label: "House",
      habitatType: "leafy"
    });
    expect(getHomeById("leafDen")).toBe(HOME_DEFS.leafDen);
    expect(getHomeById("missing-home")).toBeNull();
    expect(Object.isFrozen(listHomes())).toBe(true);
  });
});
