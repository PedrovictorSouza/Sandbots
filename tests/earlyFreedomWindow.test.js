import { describe, expect, it } from "vitest";
import {
  FIRST_TAUGHT_ACTION_IDS,
  recordFirstTaughtActionFreedomUse,
  startFirstTaughtActionFreedomWindow,
  syncFirstTaughtActionFreedomWindow
} from "../app/story/earlyFreedomWindow.js";

describe("early freedom window", () => {
  it("marks the first required taught action and starts a short window", () => {
    const storyState = { flags: {} };

    expect(startFirstTaughtActionFreedomWindow(storyState, {
      actionId: FIRST_TAUGHT_ACTION_IDS.WATER_DRY_GRASS,
      now: 1000,
      durationMs: 5000
    })).toBe(true);

    expect(storyState.flags).toMatchObject({
      firstRequiredTaughtActionComplete: true,
      firstRequiredTaughtActionId: FIRST_TAUGHT_ACTION_IDS.WATER_DRY_GRASS,
      firstRequiredTaughtActionFreedomWindowActive: true,
      firstRequiredTaughtActionFreedomWindowExpiresAt: 6000
    });
  });

  it("allows a few extra matching actions before ending", () => {
    const storyState = { flags: {} };
    startFirstTaughtActionFreedomWindow(storyState);

    expect(recordFirstTaughtActionFreedomUse(storyState, { allowance: 2 })).toBe(true);
    expect(storyState.flags.firstRequiredTaughtActionFreedomWindowActive).toBe(true);

    expect(recordFirstTaughtActionFreedomUse(storyState, { allowance: 2 })).toBe(true);
    expect(storyState.flags.firstRequiredTaughtActionFreedomWindowActive).toBe(false);
    expect(storyState.flags.firstRequiredTaughtActionFreedomWindowEndReason).toBe("over-completion");
  });

  it("ends by timeout so progression cannot stall permanently", () => {
    const storyState = { flags: {} };
    startFirstTaughtActionFreedomWindow(storyState, {
      now: 1000,
      durationMs: 5000
    });

    expect(syncFirstTaughtActionFreedomWindow(storyState, { now: 7000 }).active).toBe(false);
    expect(storyState.flags.firstRequiredTaughtActionFreedomWindowEndReason).toBe("timeout");
  });
});
