import { describe, expect, it } from "vitest";
import {
  getCharmanderDerivedTaskId,
  getHouseKitPlacementReadiness,
  getHouseKitProgressState,
  getSolarStationProgressState,
  getTrainHouseProgressState,
  HOUSE_KIT_PROGRESS_STATE,
  SOLAR_STATION_PROGRESS_STATE,
  TRAIN_HOUSE_PROGRESS_STATE
} from "../app/story/progressionContracts.js";
import { FIELD_TASK_IDS } from "../app/story/storyBeatData.js";
import {
  CAMPFIRE_ITEM_ID,
  LEAF_DEN_KIT_ITEM_ID,
  STRAW_BED_ITEM_ID
} from "../gameplayContent.js";

describe("progression contracts", () => {
  it("models Thermal Cabin states from recipe to placed object", () => {
    expect(getTrainHouseProgressState({
      storyState: { flags: {} },
      inventory: {}
    })).toMatchObject({
      state: TRAIN_HOUSE_PROGRESS_STATE.LOCKED,
      disabled: true
    });

    expect(getTrainHouseProgressState({
      storyState: { flags: { workbenchDiyRecipesReceived: true } },
      inventory: {}
    })).toMatchObject({
      state: TRAIN_HOUSE_PROGRESS_STATE.CRAFTABLE,
      disabled: false
    });

    expect(getTrainHouseProgressState({
      storyState: {
        flags: {
          workbenchDiyRecipesReceived: true,
          campfireCrafted: true
        }
      },
      inventory: { [CAMPFIRE_ITEM_ID]: 1 }
    })).toMatchObject({
      state: TRAIN_HOUSE_PROGRESS_STATE.READY_TO_PLACE,
      status: "Ready to place",
      actionLabel: "X Place Thermal Cabin"
    });

    expect(getTrainHouseProgressState({
      storyState: { flags: { campfireSpatOut: true } },
      inventory: {}
    })).toMatchObject({
      state: TRAIN_HOUSE_PROGRESS_STATE.PLACED,
      disabled: true,
      status: "Placed"
    });
  });

  it("keeps Thermal Bot follow-up behind Thermal Cabin prerequisites", () => {
    expect(getCharmanderDerivedTaskId({
      flags: {
        charmanderFollowing: true
      }
    })).toBe(FIELD_TASK_IDS.WORKBENCH_CAMPFIRE);

    expect(getCharmanderDerivedTaskId({
      flags: {
        charmanderFollowing: true,
        workbenchDiyRecipesReceived: true,
        campfireCrafted: true
      }
    })).toBe(FIELD_TASK_IDS.SPIT_OUT_CAMPFIRE);

    expect(getCharmanderDerivedTaskId({
      flags: {
        charmanderFollowing: true,
        workbenchDiyRecipesReceived: true,
        campfireCrafted: true,
        campfireSpatOut: true
      }
    })).toBe(FIELD_TASK_IDS.CHARMANDER_TALL_GRASS);
  });

  it("models Solar Station as craftable, ready to place, and placed", () => {
    expect(getSolarStationProgressState({
      storyState: { flags: { strawBedRecipeUnlocked: true } },
      inventory: {}
    })).toMatchObject({
      state: SOLAR_STATION_PROGRESS_STATE.CRAFTABLE,
      disabled: false
    });

    expect(getSolarStationProgressState({
      storyState: {
        flags: {
          strawBedRecipeUnlocked: true,
          strawBedCrafted: true
        }
      },
      inventory: { [STRAW_BED_ITEM_ID]: 1 }
    })).toMatchObject({
      state: SOLAR_STATION_PROGRESS_STATE.READY_TO_PLACE,
      status: "Ready to place",
      actionLabel: "X Place Solar Station"
    });

    expect(getSolarStationProgressState({
      storyState: { flags: { strawBedPlacedInBulbasaurHabitat: true } },
      inventory: {}
    })).toMatchObject({
      state: SOLAR_STATION_PROGRESS_STATE.PLACED,
      disabled: true,
      status: "Placed"
    });
  });

  it("models House Kit as ready to place when it exists in the bag", () => {
    expect(getHouseKitProgressState({
      storyState: { flags: {} },
      inventory: {}
    })).toMatchObject({
      state: HOUSE_KIT_PROGRESS_STATE.LOCKED,
      disabled: true
    });

    expect(getHouseKitProgressState({
      storyState: { flags: { leafDenBuildAvailable: true } },
      inventory: { [LEAF_DEN_KIT_ITEM_ID]: 1 }
    })).toMatchObject({
      state: HOUSE_KIT_PROGRESS_STATE.READY_TO_PLACE,
      status: "Ready to place",
      actionLabel: "X Place House Kit"
    });

    expect(getHouseKitProgressState({
      storyState: { flags: { leafDenKitPlaced: true } },
      inventory: {}
    })).toMatchObject({
      state: HOUSE_KIT_PROGRESS_STATE.PLACED
    });
  });

  it("blocks House Kit placement until the kit and Solar Station are ready", () => {
    expect(getHouseKitPlacementReadiness({
      storyState: { flags: { strawBedPlacedInBulbasaurHabitat: true } },
      inventory: {}
    })).toMatchObject({
      canPlace: false,
      blockedReason: "missing-house-kit"
    });

    expect(getHouseKitPlacementReadiness({
      storyState: { flags: { strawBedPlacedInBulbasaurHabitat: false } },
      inventory: { [LEAF_DEN_KIT_ITEM_ID]: 1 }
    })).toMatchObject({
      canPlace: false,
      blockedReason: "needs-solar-station"
    });

    expect(getHouseKitPlacementReadiness({
      storyState: { flags: { strawBedPlacedInBulbasaurHabitat: true } },
      inventory: { [LEAF_DEN_KIT_ITEM_ID]: 1 }
    })).toMatchObject({
      canPlace: true,
      blockedReason: null
    });
  });
});
