import {
  BUILDABLE_SOURCE_TYPES,
  listWorkbenchBuildables
} from "./buildableCatalog.js";
import { GRID_PLACEABLE_IDS } from "./gridBuildingSystem.js";
import {
  getHouseKitPlacementReadiness,
  getHouseKitProgressState,
  getSolarStationProgressState,
  getTrainHouseProgressState,
  HOUSE_KIT_PROGRESS_STATE,
  SOLAR_STATION_PROGRESS_STATE,
  TRAIN_HOUSE_PROGRESS_STATE
} from "../story/progressionContracts.js";
import { SANDBOTS_ITEM_NAMES } from "../story/sandbotsLexicon.js";

export const WORKBENCH_PROTOCOL_CATEGORY = Object.freeze({
  POWER: "Power",
  WATER: "Water",
  SOIL: "Soil",
  SHELTER: "Shelter",
  BOTS: "Bots",
  TOOLS: "Tools",
  MATERIALS: "Materials"
});

export const WORKBENCH_PROTOCOL_CATEGORY_ORDER = Object.freeze([
  WORKBENCH_PROTOCOL_CATEGORY.POWER,
  WORKBENCH_PROTOCOL_CATEGORY.WATER,
  WORKBENCH_PROTOCOL_CATEGORY.SOIL,
  WORKBENCH_PROTOCOL_CATEGORY.SHELTER,
  WORKBENCH_PROTOCOL_CATEGORY.BOTS,
  WORKBENCH_PROTOCOL_CATEGORY.TOOLS,
  WORKBENCH_PROTOCOL_CATEGORY.MATERIALS
]);

export const WORKBENCH_PROTOCOL_STATE = Object.freeze({
  LOCKED: "locked",
  CAN_ISSUE: "can-issue",
  READY_TO_PLACE: "ready-to-place",
  PLACED: "placed",
  BUILT: "built"
});

export const WORKBENCH_PROTOCOL_ACTION = Object.freeze({
  ISSUE: "issue",
  PLACE: "place",
  NONE: "none"
});

export const WORKBENCH_PROTOCOL_BLOCKED_REASON = Object.freeze({
  MISSING_PROTOCOL: "missing-protocol",
  NEEDS_SOLAR_STATION: "needs-solar-station",
  ALREADY_PLACED: "already-placed",
  ALREADY_BUILT: "already-built",
  UNKNOWN_BUILDABLE: "unknown-buildable"
});

const WORKBENCH_PROTOCOL_META = Object.freeze({
  [GRID_PLACEABLE_IDS.TRAIN_HOUSE]: Object.freeze({
    category: WORKBENCH_PROTOCOL_CATEGORY.POWER,
    issueLabel: `Prepare ${SANDBOTS_ITEM_NAMES.thermalCabin}`,
    placeLabel: `Place ${SANDBOTS_ITEM_NAMES.thermalCabin}`,
    lockedLabel: "Plan unavailable"
  }),
  [GRID_PLACEABLE_IDS.SOLAR_STATION]: Object.freeze({
    category: WORKBENCH_PROTOCOL_CATEGORY.WATER,
    issueLabel: "Prepare Solar Station",
    placeLabel: "Place Solar Station",
    lockedLabel: "Plan unavailable"
  }),
  [GRID_PLACEABLE_IDS.LEAF_DEN]: Object.freeze({
    category: WORKBENCH_PROTOCOL_CATEGORY.SHELTER,
    issueLabel: "Prepare House Kit",
    placeLabel: "Place House Kit",
    lockedLabel: "Needs habitat viability"
  })
});

function getProtocolMeta(buildableId) {
  return WORKBENCH_PROTOCOL_META[buildableId] || Object.freeze({
    category: "Unknown",
    issueLabel: "Prepare",
    placeLabel: "Place",
    lockedLabel: "Plan unavailable"
  });
}

function createBaseEntry(buildable, progressState) {
  const meta = getProtocolMeta(buildable?.id);

  return {
    id: buildable?.id || null,
    label: buildable?.label || "Unknown Plan",
    category: meta.category,
    sourceType: buildable?.sourceType || null,
    inventoryItemId: buildable?.inventoryItemId || null,
    recipeId: buildable?.recipeId || buildable?.workbenchRecipe?.id || null,
    buildable,
    progressState,
    state: WORKBENCH_PROTOCOL_STATE.LOCKED,
    action: WORKBENCH_PROTOCOL_ACTION.NONE,
    actionLabel: null,
    canIssue: false,
    canStartPlacement: false,
    blockedReason: WORKBENCH_PROTOCOL_BLOCKED_REASON.MISSING_PROTOCOL,
    status: meta.lockedLabel,
    usesCurrency: false
  };
}

function withIssue(entry) {
  const meta = getProtocolMeta(entry.id);
  return {
    ...entry,
    state: WORKBENCH_PROTOCOL_STATE.CAN_ISSUE,
    action: WORKBENCH_PROTOCOL_ACTION.ISSUE,
    actionLabel: meta.issueLabel,
    canIssue: true,
    canStartPlacement: false,
    blockedReason: null,
    status: "Ready to prepare"
  };
}

function withPlacement(entry, blockedReason = null) {
  const meta = getProtocolMeta(entry.id);
  const canStartPlacement = !blockedReason;

  return {
    ...entry,
    state: WORKBENCH_PROTOCOL_STATE.READY_TO_PLACE,
    action: canStartPlacement ? WORKBENCH_PROTOCOL_ACTION.PLACE : WORKBENCH_PROTOCOL_ACTION.NONE,
    actionLabel: canStartPlacement ? meta.placeLabel : null,
    canIssue: false,
    canStartPlacement,
    blockedReason,
    status: canStartPlacement ? "Ready to place" : entry.status
  };
}

function withPlaced(entry, built = false) {
  return {
    ...entry,
    state: built ? WORKBENCH_PROTOCOL_STATE.BUILT : WORKBENCH_PROTOCOL_STATE.PLACED,
    action: WORKBENCH_PROTOCOL_ACTION.NONE,
    actionLabel: null,
    canIssue: false,
    canStartPlacement: false,
    blockedReason: built ?
      WORKBENCH_PROTOCOL_BLOCKED_REASON.ALREADY_BUILT :
      WORKBENCH_PROTOCOL_BLOCKED_REASON.ALREADY_PLACED,
    status: built ? "Built" : "Placed"
  };
}

function resolveTrainHouseEntry(buildable, context) {
  const progressState = getTrainHouseProgressState(context);
  const entry = createBaseEntry(buildable, progressState);

  if (progressState.state === TRAIN_HOUSE_PROGRESS_STATE.PLACED) {
    return withPlaced(entry);
  }

  if (progressState.state === TRAIN_HOUSE_PROGRESS_STATE.READY_TO_PLACE) {
    return withPlacement(entry);
  }

  if (progressState.state === TRAIN_HOUSE_PROGRESS_STATE.CRAFTABLE) {
    return withIssue(entry);
  }

  return entry;
}

function resolveSolarStationEntry(buildable, context) {
  const progressState = getSolarStationProgressState(context);
  const entry = createBaseEntry(buildable, progressState);

  if (progressState.state === SOLAR_STATION_PROGRESS_STATE.PLACED) {
    return withPlaced(entry);
  }

  if (progressState.state === SOLAR_STATION_PROGRESS_STATE.READY_TO_PLACE) {
    return withPlacement(entry);
  }

  if (progressState.state === SOLAR_STATION_PROGRESS_STATE.CRAFTABLE) {
    return withIssue(entry);
  }

  return entry;
}

function resolveHouseKitEntry(buildable, context) {
  const progressState = getHouseKitProgressState(context);
  const entry = createBaseEntry(buildable, progressState);

  if (progressState.state === HOUSE_KIT_PROGRESS_STATE.BUILT) {
    return withPlaced(entry, true);
  }

  if (progressState.state === HOUSE_KIT_PROGRESS_STATE.PLACED) {
    return withPlaced(entry);
  }

  if (progressState.state === HOUSE_KIT_PROGRESS_STATE.READY_TO_PLACE) {
    const readiness = getHouseKitPlacementReadiness(context);
    return withPlacement(entry, readiness.blockedReason || null);
  }

  if (progressState.state === HOUSE_KIT_PROGRESS_STATE.CRAFTABLE) {
    return withIssue(entry);
  }

  return entry;
}

export function resolveWorkbenchProtocolEntry(buildable, context = {}) {
  if (!buildable) {
    return {
      ...createBaseEntry(null, null),
      blockedReason: WORKBENCH_PROTOCOL_BLOCKED_REASON.UNKNOWN_BUILDABLE
    };
  }

  if (buildable.id === GRID_PLACEABLE_IDS.TRAIN_HOUSE) {
    return resolveTrainHouseEntry(buildable, context);
  }

  if (buildable.id === GRID_PLACEABLE_IDS.SOLAR_STATION) {
    return resolveSolarStationEntry(buildable, context);
  }

  if (buildable.id === GRID_PLACEABLE_IDS.LEAF_DEN) {
    return resolveHouseKitEntry(buildable, context);
  }

  return createBaseEntry(buildable, null);
}

export function resolveWorkbenchContainerState({
  storyState = {},
  inventory = {},
  buildables = listWorkbenchBuildables()
} = {}) {
  const context = { storyState, inventory };
  const entries = buildables.map((buildable) => resolveWorkbenchProtocolEntry(buildable, context));

  return {
    stationId: "workbench",
    entries,
    canIssueAny: entries.some((entry) => entry.canIssue),
    canStartAnyPlacement: entries.some((entry) => entry.canStartPlacement),
    categoryOrder: WORKBENCH_PROTOCOL_CATEGORY_ORDER,
    categories: [...new Set(entries.map((entry) => entry.category))]
  };
}

export function getWorkbenchProtocolEntryById(containerState, protocolId) {
  return containerState?.entries?.find((entry) => entry.id === protocolId) || null;
}

export function listWorkbenchProtocolCategories() {
  return WORKBENCH_PROTOCOL_CATEGORY_ORDER;
}
