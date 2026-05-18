import { describe, expect, it } from "vitest";
import {
  HABITAT_SITE_CRITERION,
  HABITAT_SITE_REASON_STATE,
  evaluateHabitatSiteChoice
} from "../app/gameplay/habitatSiteChoiceContract.js";

describe("habitat site choice contract", () => {
  it("returns readable positive reasons for a clear powered habitat site", () => {
    const result = evaluateHabitatSiteChoice({
      position: [40, 0.02, -18],
      footprint: [3, 3],
      groundState: "restored",
      requiresPower: true,
      solarStationPosition: [38, 0.02, -17],
      workbenchPosition: [38, 0.02, -17],
      blockers: []
    });

    expect(result.valid).toBe(true);
    expect(result.blockingReasons).toEqual([]);
    expect(result.positiveReasons.map((reason) => reason.criterion)).toEqual([
      HABITAT_SITE_CRITERION.CLEAR,
      HABITAT_SITE_CRITERION.STABLE_GROUND,
      HABITAT_SITE_CRITERION.POWERED,
      HABITAT_SITE_CRITERION.NEAR_WORKBENCH,
      HABITAT_SITE_CRITERION.EXPANDABLE
    ]);
  });

  it("returns blocking reasons for overlap, unstable ground, and missing power", () => {
    const result = evaluateHabitatSiteChoice({
      position: [10, 0.02, 10],
      footprint: [3, 3],
      groundState: "dry",
      requiresPower: true,
      solarStationPosition: [100, 0.02, 100],
      blockers: [
        {
          id: "house",
          kind: "house",
          position: [10.5, 0.02, 10],
          size: [3, 3]
        }
      ]
    });

    expect(result.valid).toBe(false);
    expect(result.blockingReasons).toEqual([
      expect.objectContaining({
        criterion: HABITAT_SITE_CRITERION.CLEAR,
        state: HABITAT_SITE_REASON_STATE.FAIL
      }),
      expect.objectContaining({
        criterion: HABITAT_SITE_CRITERION.STABLE_GROUND,
        state: HABITAT_SITE_REASON_STATE.FAIL
      }),
      expect.objectContaining({
        criterion: HABITAT_SITE_CRITERION.POWERED,
        state: HABITAT_SITE_REASON_STATE.FAIL
      })
    ]);
  });

  it("allows far or tight sites as warnings instead of hard blockers", () => {
    const result = evaluateHabitatSiteChoice({
      position: [100, 0.02, 100],
      footprint: [3, 3],
      groundState: "stable",
      workbenchPosition: [0, 0.02, 0],
      blockers: [
        {
          id: "station",
          kind: "solarStation",
          position: [104, 0.02, 100],
          size: [2, 2]
        }
      ]
    });

    expect(result.valid).toBe(true);
    expect(result.warningReasons).toEqual([
      expect.objectContaining({
        criterion: HABITAT_SITE_CRITERION.NEAR_WORKBENCH,
        state: HABITAT_SITE_REASON_STATE.WARN
      }),
      expect.objectContaining({
        criterion: HABITAT_SITE_CRITERION.EXPANDABLE,
        state: HABITAT_SITE_REASON_STATE.WARN
      })
    ]);
  });
});
