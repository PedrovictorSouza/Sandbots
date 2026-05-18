import { describe, expect, it } from "vitest";
import {
  COLONY_FEEDBACK_IDS,
  COLONY_REWARD_EVENT_IDS,
  COLONY_REWARD_EVENT_TIERS,
  COLONY_REWARD_TIER,
  getColonyFeedbackActionLabel,
  getColonyFeedbackContract,
  getColonyFeedbackNotice,
  getColonyFeedbackPrompt,
  getColonyFeedbackRewardTier,
  getColonyFeedbackTaskPop,
  getColonyRewardEventTier,
  getColonyRewardTierContract
} from "../app/gameplay/colonyFeedbackContracts.js";

describe("colony feedback contracts", () => {
  it("centralizes terminal action labels", () => {
    expect(getColonyFeedbackActionLabel(COLONY_FEEDBACK_IDS.LOG_VIABILITY_ACTION)).toBe("Log Viability");
    expect(getColonyFeedbackActionLabel(COLONY_FEEDBACK_IDS.ISSUE_HOUSE_KIT_ACTION)).toBe("Issue Kit");
  });

  it("centralizes House Kit readiness notices and prompts", () => {
    expect(getColonyFeedbackNotice(COLONY_FEEDBACK_IDS.HOUSE_KIT_READY_NEEDS_SOLAR_STATION)).toBe(
      "House Kit ready. Place the Solar Station first."
    );
    expect(getColonyFeedbackPrompt(COLONY_FEEDBACK_IDS.HOUSE_KIT_READY_TO_PLACE)).toBe(
      "House Kit ready  X / Enter Place"
    );
  });

  it("centralizes placement preview prompts", () => {
    expect(getColonyFeedbackPrompt(COLONY_FEEDBACK_IDS.SOLAR_STATION_PLACEMENT_VALID)).toBe(
      "Move Solar Station preview  X / Enter Place  B Cancel  LB/RB Rotate"
    );
    expect(getColonyFeedbackPrompt(COLONY_FEEDBACK_IDS.HOUSE_KIT_PLACEMENT_NEEDS_POWER_RADIUS)).toBe(
      "Needs blue support zone  B Cancel  LB/RB Rotate"
    );
    expect(getColonyFeedbackPrompt(COLONY_FEEDBACK_IDS.PLACEMENT_BLOCKED_BY_OBJECTS)).toBe(
      "Blocked  Move away from objects  B Cancel  LB/RB Rotate"
    );
  });

  it("explains what Solar Station placement enables", () => {
    expect(getColonyFeedbackNotice(COLONY_FEEDBACK_IDS.SOLAR_STATION_PLACED)).toBe(
      "Solar Station online. Blue cells mark the human habitat support zone."
    );
    expect(getColonyFeedbackContract(COLONY_FEEDBACK_IDS.SOLAR_STATION_PLACED)).toMatchObject({
      rewardTier: COLONY_REWARD_TIER.MILESTONE,
      channels: ["notice", "groundHighlight"]
    });
  });

  it("centralizes concise world prompt copy", () => {
    expect(getColonyFeedbackPrompt(COLONY_FEEDBACK_IDS.WORLD_PROMPT_PLACE)).toBe("X / Enter Place");
    expect(getColonyFeedbackPrompt(COLONY_FEEDBACK_IDS.WORLD_PROMPT_NEEDS_POWER)).toBe(
      "Move inside blue zone"
    );
    expect(getColonyFeedbackPrompt(COLONY_FEEDBACK_IDS.WORLD_PROMPT_MOVE_TO_OPEN_TERRAIN)).toBe(
      "Move to open terrain"
    );
    expect(getColonyFeedbackPrompt(COLONY_FEEDBACK_IDS.WORLD_PROMPT_BLOCKED)).toBe(
      "Move away from objects"
    );
  });

  it("keeps player goal and channels with the copy", () => {
    expect(getColonyFeedbackContract(COLONY_FEEDBACK_IDS.HOUSE_KIT_SELECTED)).toMatchObject({
      playerGoal: "Place the House Kit in a clear powered area.",
      channels: ["notice", "worldPrompt", "groundHighlight"],
      notice: "House Kit selected."
    });
  });

  it("supports contextual bot names", () => {
    expect(getColonyFeedbackNotice(COLONY_FEEDBACK_IDS.HABITAT_CHECK_COMPLETE, {
      growBotName: "Grow Bot"
    })).toBe("First habitat check complete. Talk to Grow Bot.");
  });

  it("defines reward tiers with proportional feedback expectations", () => {
    expect(getColonyRewardTierContract(COLONY_REWARD_TIER.TINY_ACTION)).toMatchObject({
      label: "Tiny action",
      expectedChannels: ["prompt", "worldPrompt", "groundHighlight"]
    });
    expect(getColonyRewardTierContract(COLONY_REWARD_TIER.MILESTONE)).toMatchObject({
      label: "Milestone",
      expectedChannels: ["notice", "questPulse", "taskPop"]
    });
  });

  it("maps current colony reward events to known tiers", () => {
    const knownTiers = new Set(Object.values(COLONY_REWARD_TIER));
    for (const eventContract of Object.values(COLONY_REWARD_EVENT_TIERS)) {
      expect(knownTiers.has(eventContract.rewardTier)).toBe(true);
    }

    expect(getColonyRewardEventTier(COLONY_REWARD_EVENT_IDS.TILE_RESTORED)).toBe(
      COLONY_REWARD_TIER.TINY_ACTION
    );
    expect(getColonyRewardEventTier(COLONY_REWARD_EVENT_IDS.TOOL_LEARNED)).toBe(
      COLONY_REWARD_TIER.USEFUL_ACTION
    );
    expect(getColonyRewardEventTier(COLONY_REWARD_EVENT_IDS.BOT_AWAKENED)).toBe(
      COLONY_REWARD_TIER.MAJOR_SCENE
    );
    expect(getColonyRewardEventTier(COLONY_REWARD_EVENT_IDS.KIT_PLACED)).toBe(
      COLONY_REWARD_TIER.MILESTONE
    );
    expect(getColonyRewardEventTier(COLONY_REWARD_EVENT_IDS.HABITAT_COMPLETED)).toBe(
      COLONY_REWARD_TIER.MILESTONE
    );
  });

  it("gives the habitat check milestone stronger feedback than a tiny prompt", () => {
    expect(getColonyFeedbackRewardTier(COLONY_FEEDBACK_IDS.HABITAT_CHECK_COMPLETE)).toBe(
      COLONY_REWARD_TIER.MILESTONE
    );
    expect(getColonyFeedbackContract(COLONY_FEEDBACK_IDS.HABITAT_CHECK_COMPLETE)).toMatchObject({
      channels: ["notice", "questPulse", "taskPop"]
    });
    expect(getColonyFeedbackTaskPop(COLONY_FEEDBACK_IDS.HABITAT_CHECK_COMPLETE)).toBe(
      "Habitat viability confirmed."
    );
    expect(getColonyFeedbackRewardTier(COLONY_FEEDBACK_IDS.WORLD_PROMPT_PLACE)).toBe(
      COLONY_REWARD_TIER.TINY_ACTION
    );
  });
});
