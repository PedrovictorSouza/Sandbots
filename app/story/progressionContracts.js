import {
  CAMPFIRE_ITEM_ID,
  LEAF_DEN_KIT_ITEM_ID,
  STRAW_BED_ITEM_ID
} from "../../gameplayContent.js";
import { FIELD_TASK_IDS } from "./storyBeatData.js";
import { SANDBOTS_ITEM_NAMES } from "./sandbotsLexicon.js";

export const TRAIN_HOUSE_PROGRESS_STATE = Object.freeze({
  LOCKED: "locked",
  CRAFTABLE: "craftable",
  READY_TO_PLACE: "ready-to-place",
  PLACED: "placed"
});

export const SOLAR_STATION_PROGRESS_STATE = Object.freeze({
  LOCKED: "locked",
  CRAFTABLE: "craftable",
  READY_TO_PLACE: "ready-to-place",
  PLACED: "placed"
});

export const HOUSE_KIT_PROGRESS_STATE = Object.freeze({
  LOCKED: "locked",
  CRAFTABLE: "craftable",
  READY_TO_PLACE: "ready-to-place",
  PLACED: "placed",
  BUILT: "built"
});

function getFlags(storyStateOrFlags = {}) {
  return storyStateOrFlags.flags || storyStateOrFlags || {};
}

function hasInventoryItem(inventory = {}, itemId) {
  return Number(inventory?.[itemId] || 0) > 0;
}

export function hasCharmanderProgressStarted(storyStateOrFlags = {}) {
  const flags = getFlags(storyStateOrFlags);

  return Boolean(
    flags.charmanderRustlingGrassCellId ||
    flags.charmanderRevealed ||
    flags.charmanderFollowing
  );
}

export function getTrainHouseProgressState({
  storyState = {},
  flags: explicitFlags = null,
  inventory = {}
} = {}) {
  const flags = explicitFlags || getFlags(storyState);
  const recipeKnown = Boolean(flags.workbenchDiyRecipesReceived);
  const crafted = Boolean(flags.campfireCrafted);
  const placed = Boolean(flags.campfireSpatOut);
  const inBag = hasInventoryItem(inventory, CAMPFIRE_ITEM_ID);

  if (placed) {
    return {
      state: TRAIN_HOUSE_PROGRESS_STATE.PLACED,
      recipeKnown,
      crafted,
      placed,
      inBag,
      disabled: true,
      status: "Placed",
      actionLabel: null
    };
  }

  if (crafted && inBag) {
    return {
      state: TRAIN_HOUSE_PROGRESS_STATE.READY_TO_PLACE,
      recipeKnown,
      crafted,
      placed,
      inBag,
      disabled: false,
      status: "Ready to place",
      actionLabel: `X Place ${SANDBOTS_ITEM_NAMES.thermalCabin}`
    };
  }

  if (recipeKnown) {
    return {
      state: TRAIN_HOUSE_PROGRESS_STATE.CRAFTABLE,
      recipeKnown,
      crafted,
      placed,
      inBag,
      disabled: false,
      status: null,
      actionLabel: null
    };
  }

  return {
    state: TRAIN_HOUSE_PROGRESS_STATE.LOCKED,
    recipeKnown,
    crafted,
    placed,
    inBag,
    disabled: true,
    status: null,
    actionLabel: null
  };
}

export function getSolarStationProgressState({
  storyState = {},
  flags: explicitFlags = null,
  inventory = {}
} = {}) {
  const flags = explicitFlags || getFlags(storyState);
  const recipeKnown = Boolean(flags.strawBedRecipeUnlocked);
  const crafted = Boolean(flags.strawBedCrafted);
  const placed = Boolean(flags.strawBedPlacedInBulbasaurHabitat);
  const inBag = hasInventoryItem(inventory, STRAW_BED_ITEM_ID);

  if (placed) {
    return {
      state: SOLAR_STATION_PROGRESS_STATE.PLACED,
      recipeKnown,
      crafted,
      placed,
      inBag,
      disabled: true,
      status: "Placed",
      actionLabel: null
    };
  }

  if (crafted && inBag) {
    return {
      state: SOLAR_STATION_PROGRESS_STATE.READY_TO_PLACE,
      recipeKnown,
      crafted,
      placed,
      inBag,
      disabled: false,
      status: "Ready to place",
      actionLabel: "X Place Solar Station"
    };
  }

  if (recipeKnown) {
    return {
      state: SOLAR_STATION_PROGRESS_STATE.CRAFTABLE,
      recipeKnown,
      crafted,
      placed,
      inBag,
      disabled: false,
      status: null,
      actionLabel: null
    };
  }

  return {
    state: SOLAR_STATION_PROGRESS_STATE.LOCKED,
    recipeKnown,
    crafted,
    placed,
    inBag,
    disabled: true,
    status: null,
    actionLabel: null
  };
}

export function getHouseKitProgressState({
  storyState = {},
  flags: explicitFlags = null,
  inventory = {}
} = {}) {
  const flags = explicitFlags || getFlags(storyState);
  const purchaseAvailable = Boolean(flags.leafDenKitPurchaseAvailable);
  const buildAvailable = Boolean(flags.leafDenBuildAvailable);
  const purchased = Boolean(flags.leafDenKitPurchased);
  const selected = Boolean(flags.leafDenKitSelected);
  const placed = Boolean(flags.leafDenKitPlaced);
  const built = Boolean(flags.leafDenBuilt);
  const inBag = hasInventoryItem(inventory, LEAF_DEN_KIT_ITEM_ID);
  const unlocked = Boolean(
    purchaseAvailable ||
    buildAvailable ||
    purchased ||
    selected ||
    placed ||
    built ||
    inBag
  );

  if (built) {
    return {
      state: HOUSE_KIT_PROGRESS_STATE.BUILT,
      unlocked,
      purchased,
      selected,
      placed,
      built,
      inBag,
      disabled: false,
      status: null,
      actionLabel: null
    };
  }

  if (placed) {
    return {
      state: HOUSE_KIT_PROGRESS_STATE.PLACED,
      unlocked,
      purchased,
      selected,
      placed,
      built,
      inBag,
      disabled: false,
      status: null,
      actionLabel: null
    };
  }

  if (inBag) {
    return {
      state: HOUSE_KIT_PROGRESS_STATE.READY_TO_PLACE,
      unlocked,
      purchased,
      selected,
      placed,
      built,
      inBag,
      disabled: false,
      status: "Ready to place",
      actionLabel: "X Place House Kit"
    };
  }

  if (unlocked) {
    return {
      state: HOUSE_KIT_PROGRESS_STATE.CRAFTABLE,
      unlocked,
      purchased,
      selected,
      placed,
      built,
      inBag,
      disabled: false,
      status: null,
      actionLabel: null
    };
  }

  return {
    state: HOUSE_KIT_PROGRESS_STATE.LOCKED,
    unlocked,
    purchased,
    selected,
    placed,
    built,
    inBag,
    disabled: true,
    status: "Locked",
    actionLabel: null
  };
}

export function getHouseKitPlacementReadiness({
  storyState = {},
  flags: explicitFlags = null,
  inventory = {},
  hasSolarStationPower = null
} = {}) {
  const flags = explicitFlags || getFlags(storyState);
  const inBag = hasInventoryItem(inventory, LEAF_DEN_KIT_ITEM_ID);
  const solarPowerReady = hasSolarStationPower ?? Boolean(flags.strawBedPlacedInBulbasaurHabitat);

  if (!inBag) {
    return {
      canPlace: false,
      reason: "You need a House Kit before you can place it.",
      blockedReason: "missing-house-kit"
    };
  }

  if (!solarPowerReady) {
    return {
      canPlace: false,
      reason: "Place the Solar Station before placing the House Kit.",
      blockedReason: "needs-solar-station"
    };
  }

  return {
    canPlace: true,
    reason: null,
    blockedReason: null
  };
}

export function getCharmanderPrerequisiteTaskId(storyStateOrFlags = {}) {
  const flags = getFlags(storyStateOrFlags);
  const trainHouseState = getTrainHouseProgressState({ flags });

  if (!trainHouseState.recipeKnown || !trainHouseState.crafted) {
    return FIELD_TASK_IDS.WORKBENCH_CAMPFIRE;
  }

  if (!trainHouseState.placed) {
    return FIELD_TASK_IDS.SPIT_OUT_CAMPFIRE;
  }

  return null;
}

export function getCharmanderDerivedTaskId(storyStateOrFlags = {}) {
  const flags = getFlags(storyStateOrFlags);
  const charmanderProgressStarted = hasCharmanderProgressStarted(flags);
  const prerequisiteTaskId = getCharmanderPrerequisiteTaskId(flags);

  if (charmanderProgressStarted && prerequisiteTaskId) {
    return prerequisiteTaskId;
  }

  if (
    !flags.charmanderCampfireLit &&
    (flags.campfireSpatOut || charmanderProgressStarted)
  ) {
    return FIELD_TASK_IDS.CHARMANDER_TALL_GRASS;
  }

  return null;
}

export function shouldHideTrackedTaskForProgressionPrerequisite(taskId, storyStateOrFlags = {}) {
  return Boolean(
    taskId === FIELD_TASK_IDS.CHARMANDER_TALL_GRASS &&
    getCharmanderPrerequisiteTaskId(storyStateOrFlags)
  );
}
