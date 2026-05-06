export const PLACEHOLDER_STATE = Object.freeze({
  PLANNED: "planned",
  PROTOTYPE: "prototype",
  STUB: "stub",
  TEMPORARY_ART: "temporary-art",
  FINAL: "final"
});

const PLACEHOLDER_STATES = Object.freeze(Object.values(PLACEHOLDER_STATE));

const HIGH_RISK_PLACEHOLDER_CHANGE_SYSTEMS = Object.freeze([
  "camera",
  "input",
  "render frame",
  "stage",
  "scene flow"
]);

const ALLOWED_PLACEHOLDER_REPLACEMENT_SCOPES = Object.freeze([
  "data",
  "asset reference",
  "local model orientation metadata"
]);

export function listPlaceholderStates() {
  return PLACEHOLDER_STATES;
}

export function listPlaceholderHighRiskChangeSystems() {
  return HIGH_RISK_PLACEHOLDER_CHANGE_SYSTEMS;
}

export function listPlaceholderReplacementScopes() {
  return ALLOWED_PLACEHOLDER_REPLACEMENT_SCOPES;
}

export function canPlaceholderBlockRequiredProgress(placeholder = {}) {
  if (placeholder.state === PLACEHOLDER_STATE.FINAL) {
    return true;
  }

  if (placeholder.state === PLACEHOLDER_STATE.TEMPORARY_ART) {
    return Boolean(placeholder.progressionAllowed);
  }

  if (placeholder.state === PLACEHOLDER_STATE.PROTOTYPE) {
    return Boolean(placeholder.progressionAllowed);
  }

  return false;
}

export function getPlaceholderValidationErrors(placeholder = {}) {
  const errors = [];

  if (!PLACEHOLDER_STATES.includes(placeholder.state)) {
    errors.push("state must be one of planned, prototype, stub, temporary-art or final");
  }

  if (placeholder.state !== PLACEHOLDER_STATE.FINAL) {
    if (!placeholder.owner) {
      errors.push("owner is required");
    }
    if (!placeholder.purpose) {
      errors.push("purpose is required");
    }
    if (!placeholder.replacementCondition) {
      errors.push("replacementCondition is required");
    }
    if (typeof placeholder.playerVisible !== "boolean") {
      errors.push("playerVisible must be explicit");
    }
    if (typeof placeholder.progressionAllowed !== "boolean") {
      errors.push("progressionAllowed must be explicit");
    }
    if (
      placeholder.state === PLACEHOLDER_STATE.TEMPORARY_ART &&
      placeholder.progressionAllowed &&
      !placeholder.replacementTask
    ) {
      errors.push("replacementTask is required for required temporary art or audio");
    }
  }

  return errors;
}

export function getPlaceholderRegressionGuardErrors(change = {}) {
  const errors = [];

  if (change.renamesExistingId && !change.migrationSpecId) {
    errors.push("migrationSpecId is required before renaming existing placeholder ids");
  }

  const changedSystems = Array.isArray(change.changedSystems) ? change.changedSystems : [];
  if (
    changedSystems.some((system) => HIGH_RISK_PLACEHOLDER_CHANGE_SYSTEMS.includes(system))
  ) {
    errors.push("placeholder changes must not affect camera, input, render frame, stage or scene flow");
  }

  if (change.optionalContent && change.creditsRequired) {
    errors.push("optional placeholder content must not be required for credits");
  }

  if (
    change.replacementScope &&
    !ALLOWED_PLACEHOLDER_REPLACEMENT_SCOPES.includes(change.replacementScope)
  ) {
    errors.push("placeholder replacements must stay scoped to data, asset reference or local model orientation metadata");
  }

  return errors;
}
