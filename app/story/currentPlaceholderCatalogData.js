import {
  COMPANION_ABILITY_STATUS,
  listCompanionAbilities
} from "../gameplay/content/companionAbilities.js";
import { HABITAT_STATUS, SMALL_ISLAND_HABITATS } from "../sandbox/habitatData.js";
import { MOVE_STATUS, SMALL_ISLAND_MOVES } from "../sandbox/moveData.js";
import {
  getPlaceholderValidationErrors,
  PLACEHOLDER_STATE
} from "./placeholderPolicyData.js";

const OWNER_SYSTEM = Object.freeze({
  HABITAT_CATALOG: "Flyweight Habitat Catalog",
  MOVE_CATALOG: "Move/Ability Catalog",
  COMPANION_ABILITY_CATALOG: "Companion Ability Catalog"
});

function deepFreeze(value) {
  if (!value || typeof value !== "object") {
    return value;
  }

  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

function stateFromAvailabilityStatus(status) {
  if (status === HABITAT_STATUS.ACTIVE || status === MOVE_STATUS.ACTIVE) {
    return PLACEHOLDER_STATE.FINAL;
  }

  if (status === MOVE_STATUS.PARTIAL) {
    return PLACEHOLDER_STATE.PROTOTYPE;
  }

  return PLACEHOLDER_STATE.PLANNED;
}

function buildMetadata({
  id,
  label,
  owner,
  purpose,
  replacementCondition,
  status
}) {
  const state = stateFromAvailabilityStatus(status);
  const isFinal = state === PLACEHOLDER_STATE.FINAL;

  return {
    id,
    label,
    state,
    sourceStatus: status,
    owner,
    purpose,
    replacementCondition,
    playerVisible: isFinal,
    progressionAllowed: isFinal
  };
}

const CURRENT_HABITAT_PLACEHOLDERS = deepFreeze(SMALL_ISLAND_HABITATS.map((habitat) => {
  return buildMetadata({
    id: habitat.id,
    label: habitat.label,
    status: habitat.status,
    owner: OWNER_SYSTEM.HABITAT_CATALOG,
    purpose: habitat.notes || "Catalogs a habitat recipe for current or future discovery.",
    replacementCondition: habitat.status === HABITAT_STATUS.ACTIVE
      ? "Playable habitat discovery is covered by current habitat tests."
      : "Promote through a focused habitat discovery spec before required progression uses it."
  });
}));

const CURRENT_MOVE_PLACEHOLDERS = deepFreeze(SMALL_ISLAND_MOVES.map((move) => {
  return buildMetadata({
    id: move.id,
    label: move.label,
    status: move.status,
    owner: OWNER_SYSTEM.MOVE_CATALOG,
    purpose: move.notes || "Catalogs a current or future player move.",
    replacementCondition: move.status === MOVE_STATUS.ACTIVE
      ? "Playable move guidance and presentation are covered by current move tests."
      : "Promote through a focused ability progression spec before required gates use it."
  });
}));

const CURRENT_COMPANION_ABILITY_PLACEHOLDERS = deepFreeze(
  listCompanionAbilities().map((ability) => {
    return buildMetadata({
      id: ability.id,
      label: ability.label,
      status: ability.status,
      owner: OWNER_SYSTEM.COMPANION_ABILITY_CATALOG,
      purpose: ability.notes || "Catalogs a current or future companion ability.",
      replacementCondition: ability.status === COMPANION_ABILITY_STATUS.ACTIVE
        ? "Playable companion ability is covered by current ability and move tests."
        : "Promote through a focused companion ability spec before required gates use it."
    });
  })
);

function getById(entries, id) {
  return entries.find((entry) => entry.id === id) || null;
}

function collectGaps(entries) {
  return entries
    .map((entry) => ({
      id: entry.id,
      missing: getPlaceholderValidationErrors(entry)
    }))
    .filter((entry) => entry.missing.length > 0);
}

export function listCurrentHabitatPlaceholders() {
  return CURRENT_HABITAT_PLACEHOLDERS;
}

export function getCurrentHabitatPlaceholderById(id) {
  return getById(CURRENT_HABITAT_PLACEHOLDERS, id);
}

export function listCurrentMovePlaceholders() {
  return CURRENT_MOVE_PLACEHOLDERS;
}

export function getCurrentMovePlaceholderById(id) {
  return getById(CURRENT_MOVE_PLACEHOLDERS, id);
}

export function listCurrentCompanionAbilityPlaceholders() {
  return CURRENT_COMPANION_ABILITY_PLACEHOLDERS;
}

export function getCurrentCompanionAbilityPlaceholderById(id) {
  return getById(CURRENT_COMPANION_ABILITY_PLACEHOLDERS, id);
}

export function getCurrentPlaceholderCatalogGaps() {
  return {
    habitats: collectGaps(CURRENT_HABITAT_PLACEHOLDERS),
    moves: collectGaps(CURRENT_MOVE_PLACEHOLDERS),
    companionAbilities: collectGaps(CURRENT_COMPANION_ABILITY_PLACEHOLDERS)
  };
}
