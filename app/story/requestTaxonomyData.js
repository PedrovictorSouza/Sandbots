import { REQUIRED_CREDITS_TOKEN_IDS } from "./biomeProgressionData.js";

export const REQUEST_KIND = Object.freeze({
  IMPORTANT: "important",
  GENERAL: "general",
  TUTORIAL: "tutorial",
  OPTIONAL: "optional",
  DEBUG: "debug"
});

export const REQUEST_ARCHETYPE = Object.freeze({
  MAJOR_REPAIR: "major-repair",
  ENVIRONMENTAL_RESTORATION: "environmental-restoration",
  INITIATION_CHALLENGE: "initiation-challenge",
  CELEBRATION_MOOD: "celebration-mood",
  BOT_FUNCTION_UNLOCK: "bot-function-unlock",
  ABILITY_UNLOCK: "bot-function-unlock",
  HABITAT_HOME: "habitat-home",
  CRAFTING_COOKING: "crafting-cooking",
  ESCORT_FOLLOW: "escort-follow",
  DELIVERY_SHOW_ITEM: "delivery-show-item",
  COLLECTION: "collection",
  DEBUG: "debug"
});

const REQUEST_KINDS = Object.freeze(Object.values(REQUEST_KIND));
const REQUEST_ARCHETYPES = Object.freeze([...new Set(Object.values(REQUEST_ARCHETYPE))]);
const REQUIRED_CREDITS_TOKEN_SET = new Set(REQUIRED_CREDITS_TOKEN_IDS);

export function listRequestKinds() {
  return REQUEST_KINDS;
}

export function listRequestArchetypes() {
  return REQUEST_ARCHETYPES;
}

export function canRequestBlockCredits(request = {}) {
  return request.kind === REQUEST_KIND.IMPORTANT && request.placeholderState !== "planned";
}

function isRequiredRequest(request) {
  return Boolean(
    request.blocksCredits ||
    request.grantsCompletionTokenId ||
    canRequestBlockCredits(request)
  );
}

export function getRequestTaxonomyValidationErrors(request = {}) {
  const errors = [];

  if (!REQUEST_KINDS.includes(request.kind)) {
    errors.push("kind must be one of important, general, tutorial, optional or debug");
  }

  if (!REQUEST_ARCHETYPES.includes(request.archetype)) {
    errors.push("archetype is required");
  }

  if (isRequiredRequest(request)) {
    if (!request.macroBiomeId) {
      errors.push("macroBiomeId is required for required requests");
    }
    if (!request.characterArcId) {
      errors.push("characterArcId is required for required requests");
    }
  }

  if (REQUIRED_CREDITS_TOKEN_SET.has(request.grantsCompletionTokenId)) {
    if (request.kind !== REQUEST_KIND.IMPORTANT) {
      errors.push("completion token requests must be important");
    }
    if (request.placeholderState === "planned") {
      errors.push("planned requests cannot grant required completion tokens");
    }
  }

  return errors;
}
