import { describe, expect, it } from "vitest";
import {
  CREATURE_SPECIALTY,
  LEAF_DEN_BUILD_REQUIREMENTS,
  LEAVES_ITEM_ID
} from "../gameplayContent.js";
import {
  COZY_IDLE_BEHAVIOR,
  chooseCreatureCozyIdleBehavior,
  consumeItems,
  depositConstructionMaterialsAll,
  depositConstructionMaterialStack,
  depositOneConstructionMaterial,
  formatConstructionMaterialsSummary,
  getConstructionMaterialRows,
  getCreatureCozyIdleOptions,
  getCreatureComfortBonusContext,
  getCreatureHomeIdleTarget,
  getCreatureHomePreferenceStatus,
  validateConstructionMaterialsReady,
  validateCreatureSpecialtiesReady
} from "../story/progression.js";

describe("progression inventory helpers", () => {
  it("consumes House repair materials once and refuses a duplicate turn-in", () => {
    const inventory = {
      wood: LEAF_DEN_BUILD_REQUIREMENTS.wood,
      [LEAVES_ITEM_ID]: LEAF_DEN_BUILD_REQUIREMENTS[LEAVES_ITEM_ID]
    };

    expect(consumeItems(inventory, LEAF_DEN_BUILD_REQUIREMENTS)).toBe(true);
    expect(inventory).toEqual({
      wood: 0,
      [LEAVES_ITEM_ID]: 0
    });

    expect(consumeItems(inventory, LEAF_DEN_BUILD_REQUIREMENTS)).toBe(false);
    expect(inventory).toEqual({
      wood: 0,
      [LEAVES_ITEM_ID]: 0
    });
  });

  it("formats ConstructionSite material requirements by construction name", () => {
    expect(formatConstructionMaterialsSummary(
      "House",
      LEAF_DEN_BUILD_REQUIREMENTS,
      {
        wood: 1,
        [LEAVES_ITEM_ID]: 0
      }
    )).toBe("House materials: Wood 1/3 · Leaves 0/3");
  });

  it("exposes each ConstructionSite material required amount", () => {
    expect(getConstructionMaterialRows(LEAF_DEN_BUILD_REQUIREMENTS, {
      wood: 1,
      [LEAVES_ITEM_ID]: 0
    })).toEqual([
      {
        itemId: "wood",
        label: "Wood",
        current: 1,
        deposited: 0,
        required: 3
      },
      {
        itemId: LEAVES_ITEM_ID,
        label: "Leaves",
        current: 0,
        deposited: 0,
        required: 3
      }
    ]);
  });

  it("exposes each ConstructionSite material current inventory amount", () => {
    const rows = getConstructionMaterialRows(LEAF_DEN_BUILD_REQUIREMENTS, {
      wood: 2,
      [LEAVES_ITEM_ID]: 1
    });

    expect(rows.map(({ itemId, current }) => ({ itemId, current }))).toEqual([
      {
        itemId: "wood",
        current: 2
      },
      {
        itemId: LEAVES_ITEM_ID,
        current: 1
      }
    ]);
  });

  it("exposes each ConstructionSite material deposited amount", () => {
    const rows = getConstructionMaterialRows(
      LEAF_DEN_BUILD_REQUIREMENTS,
      {
        wood: 1,
        [LEAVES_ITEM_ID]: 0
      },
      {
        wood: 2,
        [LEAVES_ITEM_ID]: 1
      }
    );

    expect(rows.map(({ itemId, deposited }) => ({ itemId, deposited }))).toEqual([
      {
        itemId: "wood",
        deposited: 2
      },
      {
        itemId: LEAVES_ITEM_ID,
        deposited: 1
      }
    ]);
    expect(formatConstructionMaterialsSummary(
      "House",
      LEAF_DEN_BUILD_REQUIREMENTS,
      {
        wood: 1,
        [LEAVES_ITEM_ID]: 0
      },
      {
        wood: 2,
        [LEAVES_ITEM_ID]: 1
      }
    )).toBe("House materials: Wood 1/3, deposited 2/3 · Leaves 0/3, deposited 1/3");
  });

  it("deposits one ConstructionSite material from inventory", () => {
    const inventory = {
      wood: 2,
      [LEAVES_ITEM_ID]: 1
    };
    const depositedMaterials = {
      wood: 1
    };

    expect(depositOneConstructionMaterial(
      inventory,
      depositedMaterials,
      LEAF_DEN_BUILD_REQUIREMENTS,
      "wood"
    )).toEqual({
      ok: true,
      reason: "deposited",
      itemId: "wood",
      current: 1,
      deposited: 2,
      required: 3
    });
    expect(inventory).toEqual({
      wood: 1,
      [LEAVES_ITEM_ID]: 1
    });
    expect(depositedMaterials).toEqual({
      wood: 2
    });
  });

  it("does not deposit one ConstructionSite material when requirement is complete", () => {
    const inventory = {
      wood: 2
    };
    const depositedMaterials = {
      wood: LEAF_DEN_BUILD_REQUIREMENTS.wood
    };

    expect(depositOneConstructionMaterial(
      inventory,
      depositedMaterials,
      LEAF_DEN_BUILD_REQUIREMENTS,
      "wood"
    )).toEqual({
      ok: false,
      reason: "already-complete",
      itemId: "wood"
    });
    expect(inventory).toEqual({
      wood: 2
    });
    expect(depositedMaterials).toEqual({
      wood: LEAF_DEN_BUILD_REQUIREMENTS.wood
    });
  });

  it("deposits a ConstructionSite material stack up to the missing requirement", () => {
    const inventory = {
      wood: 5
    };
    const depositedMaterials = {
      wood: 1
    };

    expect(depositConstructionMaterialStack(
      inventory,
      depositedMaterials,
      LEAF_DEN_BUILD_REQUIREMENTS,
      "wood"
    )).toEqual({
      ok: true,
      reason: "deposited",
      itemId: "wood",
      amount: 2,
      current: 3,
      deposited: 3,
      required: 3
    });
    expect(inventory).toEqual({
      wood: 3
    });
    expect(depositedMaterials).toEqual({
      wood: 3
    });
  });

  it("deposits a partial ConstructionSite material stack when inventory is short", () => {
    const inventory = {
      [LEAVES_ITEM_ID]: 1
    };
    const depositedMaterials = {};

    expect(depositConstructionMaterialStack(
      inventory,
      depositedMaterials,
      LEAF_DEN_BUILD_REQUIREMENTS,
      LEAVES_ITEM_ID
    )).toEqual({
      ok: true,
      reason: "deposited",
      itemId: LEAVES_ITEM_ID,
      amount: 1,
      current: 0,
      deposited: 1,
      required: 3
    });
    expect(inventory).toEqual({
      [LEAVES_ITEM_ID]: 0
    });
    expect(depositedMaterials).toEqual({
      [LEAVES_ITEM_ID]: 1
    });
  });

  it("deposits all missing ConstructionSite materials at once", () => {
    const inventory = {
      wood: 2,
      [LEAVES_ITEM_ID]: 3,
      unrelated: 7
    };
    const depositedMaterials = {
      wood: 1
    };

    expect(depositConstructionMaterialsAll(
      inventory,
      depositedMaterials,
      LEAF_DEN_BUILD_REQUIREMENTS
    )).toEqual({
      ok: true,
      reason: "deposited",
      amount: 5,
      depositedItems: [
        {
          itemId: "wood",
          amount: 2,
          current: 0,
          deposited: 3,
          required: 3
        },
        {
          itemId: LEAVES_ITEM_ID,
          amount: 3,
          current: 0,
          deposited: 3,
          required: 3
        }
      ]
    });
    expect(inventory).toEqual({
      wood: 0,
      [LEAVES_ITEM_ID]: 0,
      unrelated: 7
    });
    expect(depositedMaterials).toEqual({
      wood: 3,
      [LEAVES_ITEM_ID]: 3
    });
  });

  it("does not deposit all ConstructionSite materials when any material is missing", () => {
    const inventory = {
      wood: 2,
      [LEAVES_ITEM_ID]: 2
    };
    const depositedMaterials = {
      wood: 1
    };

    expect(depositConstructionMaterialsAll(
      inventory,
      depositedMaterials,
      LEAF_DEN_BUILD_REQUIREMENTS
    )).toEqual({
      ok: false,
      reason: "missing-materials",
      missingMaterials: [
        {
          itemId: LEAVES_ITEM_ID,
          current: 2,
          missing: 3,
          deposited: 0,
          required: 3
        }
      ]
    });
    expect(inventory).toEqual({
      wood: 2,
      [LEAVES_ITEM_ID]: 2
    });
    expect(depositedMaterials).toEqual({
      wood: 1
    });
  });

  it("blocks construction start while deposited materials are incomplete", () => {
    expect(validateConstructionMaterialsReady(LEAF_DEN_BUILD_REQUIREMENTS, {
      wood: 3,
      [LEAVES_ITEM_ID]: 1
    })).toEqual({
      ok: false,
      reason: "missing-materials",
      missingMaterials: [
        {
          itemId: LEAVES_ITEM_ID,
          deposited: 1,
          missing: 2,
          required: 3
        }
      ]
    });
  });

  it("allows construction start when all required materials are deposited", () => {
    expect(validateConstructionMaterialsReady(LEAF_DEN_BUILD_REQUIREMENTS, {
      wood: 3,
      [LEAVES_ITEM_ID]: 3
    })).toEqual({
      ok: true,
      reason: "ready"
    });
  });

  it("accepts required creature specialties from following or nearby creatures", () => {
    expect(validateCreatureSpecialtiesReady(
      [
        CREATURE_SPECIALTY.BUILD,
        CREATURE_SPECIALTY.BURN
      ],
      {
        followingCreatureIds: ["charmander"],
        nearbyCreatureIds: ["timburr"]
      }
    )).toEqual({
      ok: true,
      reason: "ready",
      satisfiedSpecialties: [
        {
          specialty: CREATURE_SPECIALTY.BUILD,
          creatureId: "timburr",
          source: "nearby"
        },
        {
          specialty: CREATURE_SPECIALTY.BURN,
          creatureId: "charmander",
          source: "following"
        }
      ],
      missingSpecialties: []
    });
  });

  it("reports missing creature specialties when no nearby or following creature matches", () => {
    expect(validateCreatureSpecialtiesReady(
      [
        CREATURE_SPECIALTY.BUILD,
        CREATURE_SPECIALTY.BURN
      ],
      {
        followingCreatureIds: ["timburr"],
        nearbyCreatureIds: ["bulbasaur"]
      }
    )).toEqual({
      ok: false,
      reason: "missing-specialties",
      satisfiedSpecialties: [
        {
          specialty: CREATURE_SPECIALTY.BUILD,
          creatureId: "timburr",
          source: "following"
        }
      ],
      missingSpecialties: [
        {
          specialty: CREATURE_SPECIALTY.BURN
        }
      ]
    });
  });

  it("blocks construction start when required creature specialties are absent", () => {
    expect(validateCreatureSpecialtiesReady(
      [
        CREATURE_SPECIALTY.BUILD,
        CREATURE_SPECIALTY.BURN
      ],
      {
        followingCreatureIds: [],
        nearbyCreatureIds: []
      }
    )).toMatchObject({
      ok: false,
      reason: "missing-specialties",
      missingSpecialties: [
        {
          specialty: CREATURE_SPECIALTY.BUILD
        },
        {
          specialty: CREATURE_SPECIALTY.BURN
        }
      ]
    });
  });

  it("resolves a creature home as its idle target", () => {
    expect(getCreatureHomeIdleTarget(
      {
        flags: {
          creatureHomeAssignments: {
            charmander: "leafDen"
          }
        }
      },
      "charmander",
      {
        leafDen: {
          position: [4, 0.02, 6]
        }
      }
    )).toEqual({
      creatureId: "charmander",
      homeId: "leafDen",
      position: [4, 0.02, 6]
    });
  });

  it("does not resolve an idle home target when a creature has no assigned home", () => {
    expect(getCreatureHomeIdleTarget(
      {
        flags: {
          creatureHomeAssignments: {}
        }
      },
      "charmander",
      {
        leafDen: {
          position: [4, 0.02, 6]
        }
      }
    )).toBeNull();
  });

  it("compares a creature home habitat against its preference", () => {
    expect(getCreatureHomePreferenceStatus(
      {
        flags: {
          creatureHomeAssignments: {
            bulbasaur: "leafDen"
          }
        }
      },
      "bulbasaur"
    )).toEqual({
      ok: true,
      reason: "matching-habitat",
      creatureId: "bulbasaur",
      currentHomeId: "leafDen",
      homeHabitat: "leafy",
      idealHabitat: "leafy"
    });
  });

  it("reports when a creature home does not match its habitat preference", () => {
    expect(getCreatureHomePreferenceStatus(
      {
        flags: {
          creatureHomeAssignments: {
            charmander: "leafDen"
          }
        }
      },
      "charmander"
    )).toEqual({
      ok: false,
      reason: "mismatched-habitat",
      creatureId: "charmander",
      currentHomeId: "leafDen",
      homeHabitat: "leafy",
      idealHabitat: "warm"
    });
  });

  it("prepares comfort bonus context from habitat matching", () => {
    expect(getCreatureComfortBonusContext(
      {
        flags: {
          creatureHomeAssignments: {
            bulbasaur: "leafDen"
          }
        }
      },
      "bulbasaur"
    )).toEqual({
      creatureId: "bulbasaur",
      currentHomeId: "leafDen",
      idealHabitat: "leafy",
      homeHabitat: "leafy",
      bonusEligible: true,
      bonusReason: "matching-habitat"
    });
  });

  it("creates cozy idle options for beds, chairs, floor and campfires", () => {
    expect(getCreatureCozyIdleOptions({
      furnitureItems: [
        { id: "bed-1", kind: "bed" },
        { id: "chair-1", kind: "chair" },
        { id: "campfire-1", kind: "campfire" }
      ]
    })).toEqual([
      {
        behavior: COZY_IDLE_BEHAVIOR.WANDER,
        targetKind: "floor",
        targetId: null
      },
      {
        behavior: COZY_IDLE_BEHAVIOR.SLEEP,
        targetKind: "bed",
        targetId: "bed-1"
      },
      {
        behavior: COZY_IDLE_BEHAVIOR.SIT,
        targetKind: "chair",
        targetId: "chair-1"
      },
      {
        behavior: COZY_IDLE_BEHAVIOR.STAY_NEAR,
        targetKind: "campfire",
        targetId: "campfire-1"
      }
    ]);
  });

  it("lets a creature choose any available cozy object instead of forcing the optimal one", () => {
    expect(chooseCreatureCozyIdleBehavior({
      creatureId: "charmander",
      furnitureItems: [
        { id: "bed-1", kind: "bed" },
        { id: "chair-1", kind: "chair" }
      ],
      random: () => 0.8
    })).toEqual({
      creatureId: "charmander",
      behavior: COZY_IDLE_BEHAVIOR.SIT,
      targetKind: "chair",
      targetId: "chair-1"
    });
  });
});
