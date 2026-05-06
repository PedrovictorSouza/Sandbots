import { describe, expect, it } from "vitest";
import {
  REQUIRED_CREDITS_TOKEN_IDS
} from "../app/story/biomeProgressionData.js";
import {
  FINAL_COMPLETION_FLAG,
  FINAL_STORY_STATE,
  canTriggerCredits,
  getFinalCreditsStateTransition,
  getFinalInteraction,
  getFinalReadiness,
  getPostStorySandboxState
} from "../app/story/finalReadinessData.js";

function completeCreditsThroughScriptedState(existingFlags = {}) {
  const transition = getFinalCreditsStateTransition();

  return {
    stateDuringCredits: transition.during,
    stateAfterCredits: transition.to,
    flags: {
      ...existingFlags,
      [transition.setsFlag]: true
    }
  };
}

describe("final completion smoke", () => {
  it("reaches post-story sandbox through the scripted final completion state", () => {
    const readiness = getFinalReadiness({
      completedTokenIds: REQUIRED_CREDITS_TOKEN_IDS
    });
    const finalInteraction = getFinalInteraction();

    expect(canTriggerCredits(REQUIRED_CREDITS_TOKEN_IDS)).toBe(true);
    expect(readiness).toMatchObject({
      state: FINAL_STORY_STATE.READY_FOR_CREDITS,
      missingGoalIds: [],
      completionFlag: FINAL_COMPLETION_FLAG
    });
    expect(finalInteraction.requiredState).toBe(readiness.state);
    expect(finalInteraction.playbackState).toBe(FINAL_STORY_STATE.CREDITS_PLAYBACK);

    const scriptedCompletion = completeCreditsThroughScriptedState();

    expect(scriptedCompletion).toMatchObject({
      stateDuringCredits: FINAL_STORY_STATE.CREDITS_PLAYBACK,
      stateAfterCredits: FINAL_STORY_STATE.POST_STORY_SANDBOX,
      flags: {
        [FINAL_COMPLETION_FLAG]: true
      }
    });
    expect(getPostStorySandboxState(scriptedCompletion.flags)).toEqual({
      state: FINAL_STORY_STATE.POST_STORY_SANDBOX,
      available: true
    });
  });
});
