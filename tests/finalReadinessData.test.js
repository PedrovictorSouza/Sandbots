import { describe, expect, it } from "vitest";
import {
  MACRO_BIOME_COMPLETION_TOKENS,
  REQUIRED_CREDITS_TOKEN_IDS
} from "../app/story/biomeProgressionData.js";
import {
  FINAL_COMPLETION_FLAG,
  FINAL_STORY_STATE,
  canTriggerCredits,
  getEndingStoryContext,
  getFinalCreditsStateTransition,
  getFinalInteraction,
  getFinalMissingGoalFeedback,
  getFinalRecipeCreditsPolicy,
  getFinalReadiness,
  getFinalRequestCreditsPolicy,
  getMissingFinalGoalIds,
  getPostStorySandboxState,
  listFinalRequiredImportantRequests,
  listFinalRequiredGoals
} from "../app/story/finalReadinessData.js";
import { CHARACTER_ARC_IDS } from "../app/story/characterArcData.js";
import { MACRO_BIOME_IDS } from "../app/story/biomeProgressionData.js";
import {
  ECONOMY_TIER,
  PROGRESSION_ROLE
} from "../app/story/recipeItemTaxonomyData.js";
import { REQUEST_KIND } from "../app/story/requestTaxonomyData.js";

describe("final readiness data", () => {
  it("does not allow credits before every required macro-biome signal is present", () => {
    const partialTokens = ["root-signal", "tide-signal", "forge-signal"];
    const readiness = getFinalReadiness({ completedTokenIds: partialTokens });

    expect(canTriggerCredits(partialTokens)).toBe(false);
    expect(readiness.state).toBe(FINAL_STORY_STATE.NOT_READY);
    expect(readiness.missingGoalIds).toEqual(["signal:sky-signal"]);
  });

  it("allows credits after all required goals are complete", () => {
    const readiness = getFinalReadiness({ completedTokenIds: REQUIRED_CREDITS_TOKEN_IDS });

    expect(canTriggerCredits(REQUIRED_CREDITS_TOKEN_IDS)).toBe(true);
    expect(readiness).toMatchObject({
      state: FINAL_STORY_STATE.READY_FOR_CREDITS,
      missingGoalIds: [],
      completionFlag: FINAL_COMPLETION_FLAG
    });
  });

  it("keeps required final goals in immutable catalog data", () => {
    const goals = listFinalRequiredGoals();

    expect(goals.map((goal) => goal.tokenId)).toEqual(REQUIRED_CREDITS_TOKEN_IDS);
    expect(Object.isFrozen(goals)).toBe(true);
    expect(Object.isFrozen(goals[0])).toBe(true);
  });

  it("reports missing goals as ids that a presenter can turn into feedback", () => {
    expect(getMissingFinalGoalIds(["root-signal"])).toEqual([
      "signal:tide-signal",
      "signal:forge-signal",
      "signal:sky-signal"
    ]);

    expect(getFinalMissingGoalFeedback(["root-signal"])).toMatchObject({
      ownerSystem: "UI Presenter",
      mentorArcId: CHARACTER_ARC_IDS.CHOPPER,
      missingGoalIds: [
        "signal:tide-signal",
        "signal:forge-signal",
        "signal:sky-signal"
      ],
      missingGoalLabels: [
        "Restore the Tidefall Coast signal",
        "Restore the Granite Ridge forge signal",
        "Restore the Skyforge Spires sky signal"
      ]
    });
  });

  it("separates post-story sandbox availability from credits readiness", () => {
    expect(getPostStorySandboxState({ [FINAL_COMPLETION_FLAG]: false })).toEqual({
      state: FINAL_STORY_STATE.READY_FOR_CREDITS,
      available: false
    });
    expect(getPostStorySandboxState({ [FINAL_COMPLETION_FLAG]: true })).toEqual({
      state: FINAL_STORY_STATE.POST_STORY_SANDBOX,
      available: true
    });
  });

  it("defines final important requests and keeps general requests optional by default", () => {
    expect(listFinalRequiredImportantRequests()).toEqual([
      expect.objectContaining({
        id: "important:ash-wilds-root-signal",
        kind: REQUEST_KIND.IMPORTANT,
        macroBiomeId: MACRO_BIOME_IDS.ASH_WILDS,
        completionTokenId: "root-signal"
      }),
      expect.objectContaining({
        id: "important:tidefall-coast-signal",
        kind: REQUEST_KIND.IMPORTANT,
        macroBiomeId: MACRO_BIOME_IDS.TIDEFALL_COAST,
        completionTokenId: "tide-signal"
      }),
      expect.objectContaining({
        id: "important:granite-ridge-forge-signal",
        kind: REQUEST_KIND.IMPORTANT,
        macroBiomeId: MACRO_BIOME_IDS.GRANITE_RIDGE,
        completionTokenId: "forge-signal"
      }),
      expect.objectContaining({
        id: "important:skyforge-spires-sky-signal",
        kind: REQUEST_KIND.IMPORTANT,
        macroBiomeId: MACRO_BIOME_IDS.SKYFORGE_SPIRES,
        completionTokenId: "sky-signal"
      })
    ]);

    expect(getFinalRequestCreditsPolicy()).toEqual({
      requiredKind: REQUEST_KIND.IMPORTANT,
      generalRequestsBlockCreditsByDefault: false,
      optionalRequestsBlockCreditsByDefault: false,
      requiredComfortThreshold: null,
      requiredEnvironmentLevelThreshold: null
    });
  });

  it("maps Tidefall Coast major completion to the tide-signal final-biome token", () => {
    expect(listFinalRequiredImportantRequests()).toContainEqual(expect.objectContaining({
      id: "important:tidefall-coast-signal",
      kind: REQUEST_KIND.IMPORTANT,
      macroBiomeId: MACRO_BIOME_IDS.TIDEFALL_COAST,
      completionTokenId: MACRO_BIOME_COMPLETION_TOKENS.TIDE_SIGNAL,
      label: "Restore the Tidefall Coast signal"
    }));

    expect(listFinalRequiredGoals()).toContainEqual(expect.objectContaining({
      id: "signal:tide-signal",
      type: "macro-biome-signal",
      tokenId: MACRO_BIOME_COMPLETION_TOKENS.TIDE_SIGNAL,
      label: "Restore the Tidefall Coast signal",
      ownerSystem: "Quest State Machine / Scenario System"
    }));
  });

  it("keeps optional and rare recipes out of credits blockers", () => {
    expect(getFinalRecipeCreditsPolicy()).toEqual({
      optionalProgressionRoles: [
        PROGRESSION_ROLE.COMFORT_ITEM,
        PROGRESSION_ROLE.DECORATION_FLAVOR,
        PROGRESSION_ROLE.POST_STORY_COLLECTIBLE
      ],
      rareCompletionRewardTier: ECONOMY_TIER.RARE_POST_STORY,
      rareRecipesBlockCredits: false
    });
  });

  it("defines the final interaction and credits state transition", () => {
    expect(getFinalInteraction()).toMatchObject({
      id: "skyforge-beacon-final-repair",
      locationId: "skyforge-beacon",
      macroBiomeId: MACRO_BIOME_IDS.SKYFORGE_SPIRES,
      characterArcIds: [
        CHARACTER_ARC_IDS.TOVA,
        CHARACTER_ARC_IDS.CHOPPER
      ],
      requiredState: FINAL_STORY_STATE.READY_FOR_CREDITS,
      playbackState: FINAL_STORY_STATE.CREDITS_PLAYBACK,
      completionFlag: FINAL_COMPLETION_FLAG
    });

    expect(getFinalCreditsStateTransition()).toEqual({
      from: FINAL_STORY_STATE.READY_FOR_CREDITS,
      during: FINAL_STORY_STATE.CREDITS_PLAYBACK,
      to: FINAL_STORY_STATE.POST_STORY_SANDBOX,
      setsFlag: FINAL_COMPLETION_FLAG
    });
  });

  it("defines the ending payoff and repeatable post-story activities", () => {
    expect(getEndingStoryContext()).toMatchObject({
      cutscenePayoff: expect.stringContaining("restored beacon"),
      postStoryFiction: expect.stringContaining("restoration becomes daily care"),
      repeatablePostStoryActivities: [
        "general requests",
        "optional requests",
        "habitat mastery",
        "decorating",
        "collection",
        "exploration"
      ]
    });
  });
});
