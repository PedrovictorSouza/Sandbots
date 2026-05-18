import {
  SANDBOTS_BOT_NAMES,
  SANDBOTS_ITEM_NAMES
} from "../story/sandbotsLexicon.js";

export const COLONY_STATUS_SYSTEM_ID = Object.freeze({
  POWER: "power",
  WATER: "water",
  SOIL: "soil",
  SHELTER: "shelter"
});

export const COLONY_STATUS_STATE = Object.freeze({
  OFFLINE: "offline",
  AVAILABLE: "available",
  READY: "ready",
  ACTIVE: "active",
  COMPLETE: "complete"
});

const ACTIVE_MOVE_STATUS = Object.freeze({
  waterGun: Object.freeze({
    bot: SANDBOTS_BOT_NAMES.hydro,
    tool: SANDBOTS_ITEM_NAMES.hydroTool
  }),
  leafage: Object.freeze({
    bot: SANDBOTS_BOT_NAMES.grow,
    tool: SANDBOTS_ITEM_NAMES.growTool
  }),
  fire: Object.freeze({
    bot: SANDBOTS_BOT_NAMES.thermal,
    tool: SANDBOTS_ITEM_NAMES.thermalTool
  })
});

const SOIL_RESTORATION_SAMPLE_TARGET = 10;

function flagsFrom(storyState) {
  return storyState?.flags || {};
}

function hasInventoryItem(inventory, itemId) {
  return Number(inventory?.[itemId] || 0) > 0;
}

function createSystemStatus(id, label, state, detail, value = null) {
  return Object.freeze({ id, label, state, detail, value });
}

function resolvePowerStatus(flags, inventory) {
  if (flags.strawBedPlacedInBulbasaurHabitat) {
    return createSystemStatus(
      COLONY_STATUS_SYSTEM_ID.POWER,
      "Power",
      COLONY_STATUS_STATE.ACTIVE,
      "Solar Station online."
    );
  }

  if (flags.strawBedCrafted || hasInventoryItem(inventory, "strawBed")) {
    return createSystemStatus(
      COLONY_STATUS_SYSTEM_ID.POWER,
      "Power",
      COLONY_STATUS_STATE.READY,
      "Solar Station ready to place."
    );
  }

  if (flags.strawBedRecipeUnlocked) {
    return createSystemStatus(
      COLONY_STATUS_SYSTEM_ID.POWER,
      "Power",
      COLONY_STATUS_STATE.AVAILABLE,
      "Solar Station plans ready."
    );
  }

  return createSystemStatus(
    COLONY_STATUS_SYSTEM_ID.POWER,
    "Power",
    COLONY_STATUS_STATE.OFFLINE,
    "No colony power source."
  );
}

function resolveWaterStatus({ flags, inventory, playerSkills, activeMoveId }) {
  const hasHydroTool = Boolean(playerSkills?.waterGun) || hasInventoryItem(inventory, "waterGunTotem");

  if (activeMoveId === "waterGun" && hasHydroTool) {
    return createSystemStatus(
      COLONY_STATUS_SYSTEM_ID.WATER,
      "Water",
      COLONY_STATUS_STATE.ACTIVE,
      "Hydro Jet selected."
    );
  }

  if (hasHydroTool || flags.hydroBotReactivated || flags.squirtleHelped) {
    return createSystemStatus(
      COLONY_STATUS_SYSTEM_ID.WATER,
      "Water",
      COLONY_STATUS_STATE.READY,
      "Hydro Jet available."
    );
  }

  return createSystemStatus(
    COLONY_STATUS_SYSTEM_ID.WATER,
    "Water",
    COLONY_STATUS_STATE.OFFLINE,
    "Hydro systems dormant."
  );
}

function resolveSoilStatus({ flags, playerSkills }) {
  if (flags.leafageTallGrassHabitatCreated) {
    return createSystemStatus(
      COLONY_STATUS_SYSTEM_ID.SOIL,
      "Soil",
      COLONY_STATUS_STATE.COMPLETE,
      "First green colony patch stable.",
      1
    );
  }

  const restoredGrassCount = Math.max(0, Number(flags.restoredGrassCount || 0));
  if (restoredGrassCount > 0) {
    return createSystemStatus(
      COLONY_STATUS_SYSTEM_ID.SOIL,
      "Soil",
      COLONY_STATUS_STATE.ACTIVE,
      `${Math.min(restoredGrassCount, SOIL_RESTORATION_SAMPLE_TARGET)}/${SOIL_RESTORATION_SAMPLE_TARGET} dry grass restored.`,
      Math.min(1, restoredGrassCount / SOIL_RESTORATION_SAMPLE_TARGET)
    );
  }

  if (playerSkills?.waterGun) {
    return createSystemStatus(
      COLONY_STATUS_SYSTEM_ID.SOIL,
      "Soil",
      COLONY_STATUS_STATE.READY,
      "Dry ground can be restored."
    );
  }

  return createSystemStatus(
    COLONY_STATUS_SYSTEM_ID.SOIL,
    "Soil",
    COLONY_STATUS_STATE.OFFLINE,
    "Ground restoration unavailable."
  );
}

function resolveShelterStatus(flags, inventory) {
  if (flags.leafDenBuilt) {
    return createSystemStatus(
      COLONY_STATUS_SYSTEM_ID.SHELTER,
      "Shelter",
      COLONY_STATUS_STATE.COMPLETE,
      "First human-ready home built."
    );
  }

  if (flags.leafDenKitPlaced) {
    return createSystemStatus(
      COLONY_STATUS_SYSTEM_ID.SHELTER,
      "Shelter",
      COLONY_STATUS_STATE.ACTIVE,
      "House Kit placed."
    );
  }

  if (flags.leafDenBuildAvailable || hasInventoryItem(inventory, "leafDenKit")) {
    return createSystemStatus(
      COLONY_STATUS_SYSTEM_ID.SHELTER,
      "Shelter",
      COLONY_STATUS_STATE.READY,
      "House Kit ready."
    );
  }

  return createSystemStatus(
    COLONY_STATUS_SYSTEM_ID.SHELTER,
    "Shelter",
    COLONY_STATUS_STATE.OFFLINE,
    "No human shelter yet."
  );
}

export function createColonyStatusModel({
  storyState = {},
  inventory = {},
  playerSkills = {},
  activeMoveId = null
} = {}) {
  const flags = flagsFrom(storyState);
  const activeMove = ACTIVE_MOVE_STATUS[activeMoveId] || null;
  const systems = Object.freeze([
    resolvePowerStatus(flags, inventory),
    resolveWaterStatus({ flags, inventory, playerSkills, activeMoveId }),
    resolveSoilStatus({ flags, playerSkills }),
    resolveShelterStatus(flags, inventory)
  ]);

  return Object.freeze({
    systems,
    activeBot: activeMove?.bot || null,
    activeTool: activeMove?.tool || null
  });
}

export function validateColonyStatusModel(model) {
  const errors = [];
  const ids = new Set();
  const knownStates = new Set(Object.values(COLONY_STATUS_STATE));

  if (!Array.isArray(model?.systems)) {
    return Object.freeze([{ type: "missing-systems" }]);
  }

  model.systems.forEach((system, index) => {
    if (!system?.id) {
      errors.push({ type: "missing-system-id", index });
      return;
    }

    if (ids.has(system.id)) {
      errors.push({ type: "duplicate-system-id", systemId: system.id, index });
    }
    ids.add(system.id);

    if (!knownStates.has(system.state)) {
      errors.push({ type: "unknown-system-state", systemId: system.id, state: system.state, index });
    }

    if (!system.label) {
      errors.push({ type: "missing-system-label", systemId: system.id, index });
    }

    if (!system.detail) {
      errors.push({ type: "missing-system-detail", systemId: system.id, index });
    }
  });

  return Object.freeze(errors.map((error) => Object.freeze(error)));
}
