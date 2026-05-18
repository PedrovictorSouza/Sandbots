import { describe, expect, it } from "vitest";
import {
  PLACEMENT_CONSUMPTION_REASON,
  resolvePlacementConsumptionDecision
} from "../app/gameplay/placementConsumptionContract.js";

describe("placement consumption contract", () => {
  it("consumes a kit only when the preview is active, ready, valid, and owned", () => {
    expect(resolvePlacementConsumptionDecision({
      preview: {
        active: true,
        readyForConfirm: true,
        valid: true
      },
      inventory: { leafDenKit: 1 },
      itemId: "leafDenKit"
    })).toEqual({
      shouldConsume: true,
      reason: PLACEMENT_CONSUMPTION_REASON.READY
    });
  });

  it("blocks consumption for inactive, unpositioned, invalid, or missing-item previews", () => {
    expect(resolvePlacementConsumptionDecision({
      preview: null,
      inventory: { leafDenKit: 1 },
      itemId: "leafDenKit"
    })).toMatchObject({
      shouldConsume: false,
      reason: PLACEMENT_CONSUMPTION_REASON.INACTIVE_PREVIEW
    });

    expect(resolvePlacementConsumptionDecision({
      preview: { active: true, readyForConfirm: false, valid: true },
      inventory: { leafDenKit: 1 },
      itemId: "leafDenKit"
    })).toMatchObject({
      shouldConsume: false,
      reason: PLACEMENT_CONSUMPTION_REASON.PREVIEW_NOT_READY
    });

    expect(resolvePlacementConsumptionDecision({
      preview: { active: true, readyForConfirm: true, valid: false },
      inventory: { leafDenKit: 1 },
      itemId: "leafDenKit"
    })).toMatchObject({
      shouldConsume: false,
      reason: PLACEMENT_CONSUMPTION_REASON.INVALID_PLACEMENT
    });

    expect(resolvePlacementConsumptionDecision({
      preview: { active: true, readyForConfirm: true, valid: true },
      inventory: { leafDenKit: 0 },
      itemId: "leafDenKit"
    })).toMatchObject({
      shouldConsume: false,
      reason: PLACEMENT_CONSUMPTION_REASON.MISSING_ITEM
    });
  });
});
