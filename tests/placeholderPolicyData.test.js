import { describe, expect, it } from "vitest";
import {
  canPlaceholderBlockRequiredProgress,
  getPlaceholderRegressionGuardErrors,
  getPlaceholderValidationErrors,
  listPlaceholderStates,
  PLACEHOLDER_STATE
} from "../app/story/placeholderPolicyData.js";

describe("placeholder policy data", () => {
  it("exposes the allowed placeholder lifecycle states", () => {
    expect(listPlaceholderStates()).toEqual([
      PLACEHOLDER_STATE.PLANNED,
      PLACEHOLDER_STATE.PROTOTYPE,
      PLACEHOLDER_STATE.STUB,
      PLACEHOLDER_STATE.TEMPORARY_ART,
      PLACEHOLDER_STATE.FINAL
    ]);
  });

  it("keeps planned and stub placeholders out of required progression", () => {
    expect(canPlaceholderBlockRequiredProgress({
      state: PLACEHOLDER_STATE.PLANNED
    })).toBe(false);

    expect(canPlaceholderBlockRequiredProgress({
      state: PLACEHOLDER_STATE.STUB
    })).toBe(false);
  });

  it("allows prototype placeholders to block progress only when explicitly allowed", () => {
    expect(canPlaceholderBlockRequiredProgress({
      state: PLACEHOLDER_STATE.PROTOTYPE
    })).toBe(false);

    expect(canPlaceholderBlockRequiredProgress({
      state: PLACEHOLDER_STATE.PROTOTYPE,
      progressionAllowed: true
    })).toBe(true);
  });

  it("requires replacement metadata for non-final placeholders", () => {
    expect(getPlaceholderValidationErrors({
      id: "temporary-beacon-model",
      state: PLACEHOLDER_STATE.TEMPORARY_ART,
      owner: "asset-catalog",
      purpose: "Stand in for final beacon model.",
      replacementCondition: "Final beacon asset approved.",
      replacementTask: "replace-temporary-beacon-model",
      playerVisible: true,
      progressionAllowed: true
    })).toEqual([]);

    expect(getPlaceholderValidationErrors({
      id: "planned-coast-request",
      state: PLACEHOLDER_STATE.PLANNED
    })).toEqual([
      "owner is required",
      "purpose is required",
      "replacementCondition is required",
      "playerVisible must be explicit",
      "progressionAllowed must be explicit"
    ]);
  });

  it("requires replacement task links for required temporary art or audio", () => {
    expect(getPlaceholderValidationErrors({
      id: "temporary-required-chime",
      state: PLACEHOLDER_STATE.TEMPORARY_ART,
      owner: "audio-catalog",
      purpose: "Stand in for final shrine chime.",
      replacementCondition: "Final audio pass approved.",
      playerVisible: true,
      progressionAllowed: true
    })).toContain("replacementTask is required for required temporary art or audio");
  });

  it("guards placeholder additions from id renames and high-risk system changes", () => {
    expect(getPlaceholderRegressionGuardErrors({
      renamesExistingId: true,
      changedSystems: ["camera", "asset reference"]
    })).toEqual([
      "migrationSpecId is required before renaming existing placeholder ids",
      "placeholder changes must not affect camera, input, render frame, stage or scene flow"
    ]);
  });

  it("keeps optional content out of credits and replacements scoped to data or assets", () => {
    expect(getPlaceholderRegressionGuardErrors({
      optionalContent: true,
      creditsRequired: true,
      replacementScope: "game loop"
    })).toEqual([
      "optional placeholder content must not be required for credits",
      "placeholder replacements must stay scoped to data, asset reference or local model orientation metadata"
    ]);

    expect(getPlaceholderRegressionGuardErrors({
      renamesExistingId: true,
      migrationSpecId: "migrate-placeholder-beacon-ids",
      changedSystems: ["asset reference"],
      replacementScope: "local model orientation metadata"
    })).toEqual([]);
  });
});
