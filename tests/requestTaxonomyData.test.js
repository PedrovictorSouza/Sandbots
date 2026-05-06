import { describe, expect, it } from "vitest";
import {
  canRequestBlockCredits,
  getRequestTaxonomyValidationErrors,
  listRequestArchetypes,
  listRequestKinds,
  REQUEST_ARCHETYPE,
  REQUEST_KIND
} from "../app/story/requestTaxonomyData.js";

describe("request taxonomy data", () => {
  it("exposes the canonical request kinds and archetypes", () => {
    expect(listRequestKinds()).toEqual([
      REQUEST_KIND.IMPORTANT,
      REQUEST_KIND.GENERAL,
      REQUEST_KIND.TUTORIAL,
      REQUEST_KIND.OPTIONAL,
      REQUEST_KIND.DEBUG
    ]);

    expect(listRequestArchetypes()).toEqual([
      REQUEST_ARCHETYPE.MAJOR_REPAIR,
      REQUEST_ARCHETYPE.ENVIRONMENTAL_RESTORATION,
      REQUEST_ARCHETYPE.INITIATION_CHALLENGE,
      REQUEST_ARCHETYPE.CELEBRATION_MOOD,
      REQUEST_ARCHETYPE.ABILITY_UNLOCK,
      REQUEST_ARCHETYPE.HABITAT_HOME,
      REQUEST_ARCHETYPE.CRAFTING_COOKING,
      REQUEST_ARCHETYPE.ESCORT_FOLLOW,
      REQUEST_ARCHETYPE.DELIVERY_SHOW_ITEM,
      REQUEST_ARCHETYPE.COLLECTION,
      REQUEST_ARCHETYPE.DEBUG
    ]);
  });

  it("allows only important final requests to block credits by default", () => {
    expect(canRequestBlockCredits({
      kind: REQUEST_KIND.IMPORTANT,
      placeholderState: "final"
    })).toBe(true);

    for (const kind of [REQUEST_KIND.GENERAL, REQUEST_KIND.TUTORIAL, REQUEST_KIND.OPTIONAL, REQUEST_KIND.DEBUG]) {
      expect(canRequestBlockCredits({
        kind,
        placeholderState: "final"
      })).toBe(false);
    }
  });

  it("keeps planned requests out of credits blockers", () => {
    expect(canRequestBlockCredits({
      kind: REQUEST_KIND.IMPORTANT,
      placeholderState: "planned"
    })).toBe(false);
  });

  it("requires required requests to map to story context", () => {
    expect(getRequestTaxonomyValidationErrors({
      id: "repair-root-hub",
      kind: REQUEST_KIND.IMPORTANT,
      archetype: REQUEST_ARCHETYPE.MAJOR_REPAIR,
      macroBiomeId: "ash-wilds",
      characterArcId: "chopper",
      placeholderState: "final",
      blocksCredits: true
    })).toEqual([]);

    expect(getRequestTaxonomyValidationErrors({
      id: "missing-story-context",
      kind: REQUEST_KIND.IMPORTANT,
      archetype: REQUEST_ARCHETYPE.MAJOR_REPAIR,
      placeholderState: "final",
      blocksCredits: true
    })).toEqual([
      "macroBiomeId is required for required requests",
      "characterArcId is required for required requests"
    ]);
  });

  it("requires token-granting requests to be important and playable", () => {
    expect(getRequestTaxonomyValidationErrors({
      id: "coast-token",
      kind: REQUEST_KIND.GENERAL,
      archetype: REQUEST_ARCHETYPE.ENVIRONMENTAL_RESTORATION,
      macroBiomeId: "tidefall-coast",
      characterArcId: "nami",
      placeholderState: "final",
      grantsCompletionTokenId: "tide-signal"
    })).toEqual([
      "completion token requests must be important"
    ]);

    expect(getRequestTaxonomyValidationErrors({
      id: "planned-token",
      kind: REQUEST_KIND.IMPORTANT,
      archetype: REQUEST_ARCHETYPE.ENVIRONMENTAL_RESTORATION,
      macroBiomeId: "tidefall-coast",
      characterArcId: "nami",
      placeholderState: "planned",
      grantsCompletionTokenId: "tide-signal"
    })).toEqual([
      "planned requests cannot grant required completion tokens"
    ]);
  });
});
