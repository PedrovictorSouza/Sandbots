import {
  MACRO_BIOME_COMPLETION_TOKENS,
  MACRO_BIOME_IDS,
  REQUIRED_CREDITS_TOKEN_IDS
} from "./biomeProgressionData.js";
import { CHARACTER_ARC_IDS } from "./characterArcData.js";
import {
  ECONOMY_TIER,
  PROGRESSION_ROLE
} from "./recipeItemTaxonomyData.js";
import { REQUEST_KIND } from "./requestTaxonomyData.js";

export const FINAL_COMPLETION_FLAG = "creditsComplete";

export const FINAL_STORY_STATE = Object.freeze({
  NOT_READY: "not-ready",
  READY_FOR_CREDITS: "ready-for-credits",
  CREDITS_PLAYBACK: "credits-playback",
  POST_STORY_SANDBOX: "post-story-sandbox"
});

function deepFreeze(value) {
  if (!value || typeof value !== "object") {
    return value;
  }

  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

const FINAL_GOAL_LABELS_BY_TOKEN_ID = Object.freeze({
  [MACRO_BIOME_COMPLETION_TOKENS.ROOT_SIGNAL]: "Restore the Ash Wilds root signal",
  [MACRO_BIOME_COMPLETION_TOKENS.TIDE_SIGNAL]: "Restore the Tidefall Coast signal",
  [MACRO_BIOME_COMPLETION_TOKENS.FORGE_SIGNAL]: "Restore the Granite Ridge forge signal",
  [MACRO_BIOME_COMPLETION_TOKENS.SKY_SIGNAL]: "Restore the Skyforge Spires sky signal"
});

const FINAL_REQUIRED_GOALS = deepFreeze(REQUIRED_CREDITS_TOKEN_IDS.map((tokenId) => ({
  id: `signal:${tokenId}`,
  type: "macro-biome-signal",
  tokenId,
  label: FINAL_GOAL_LABELS_BY_TOKEN_ID[tokenId],
  ownerSystem: "Quest State Machine / Scenario System"
})));

const FINAL_REQUIRED_IMPORTANT_REQUESTS = deepFreeze([
  {
    id: "important:ash-wilds-root-signal",
    kind: REQUEST_KIND.IMPORTANT,
    macroBiomeId: MACRO_BIOME_IDS.ASH_WILDS,
    completionTokenId: MACRO_BIOME_COMPLETION_TOKENS.ROOT_SIGNAL,
    label: FINAL_GOAL_LABELS_BY_TOKEN_ID[MACRO_BIOME_COMPLETION_TOKENS.ROOT_SIGNAL]
  },
  {
    id: "important:tidefall-coast-signal",
    kind: REQUEST_KIND.IMPORTANT,
    macroBiomeId: MACRO_BIOME_IDS.TIDEFALL_COAST,
    completionTokenId: MACRO_BIOME_COMPLETION_TOKENS.TIDE_SIGNAL,
    label: FINAL_GOAL_LABELS_BY_TOKEN_ID[MACRO_BIOME_COMPLETION_TOKENS.TIDE_SIGNAL]
  },
  {
    id: "important:granite-ridge-forge-signal",
    kind: REQUEST_KIND.IMPORTANT,
    macroBiomeId: MACRO_BIOME_IDS.GRANITE_RIDGE,
    completionTokenId: MACRO_BIOME_COMPLETION_TOKENS.FORGE_SIGNAL,
    label: FINAL_GOAL_LABELS_BY_TOKEN_ID[MACRO_BIOME_COMPLETION_TOKENS.FORGE_SIGNAL]
  },
  {
    id: "important:skyforge-spires-sky-signal",
    kind: REQUEST_KIND.IMPORTANT,
    macroBiomeId: MACRO_BIOME_IDS.SKYFORGE_SPIRES,
    completionTokenId: MACRO_BIOME_COMPLETION_TOKENS.SKY_SIGNAL,
    label: FINAL_GOAL_LABELS_BY_TOKEN_ID[MACRO_BIOME_COMPLETION_TOKENS.SKY_SIGNAL]
  }
]);

const FINAL_REQUEST_CREDITS_POLICY = deepFreeze({
  requiredKind: REQUEST_KIND.IMPORTANT,
  generalRequestsBlockCreditsByDefault: false,
  optionalRequestsBlockCreditsByDefault: false,
  requiredComfortThreshold: null,
  requiredEnvironmentLevelThreshold: null
});

const FINAL_RECIPE_CREDITS_POLICY = deepFreeze({
  optionalProgressionRoles: [
    PROGRESSION_ROLE.COMFORT_ITEM,
    PROGRESSION_ROLE.DECORATION_FLAVOR,
    PROGRESSION_ROLE.POST_STORY_COLLECTIBLE
  ],
  rareCompletionRewardTier: ECONOMY_TIER.RARE_POST_STORY,
  rareRecipesBlockCredits: false
});

const FINAL_INTERACTION = deepFreeze({
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

const FINAL_MISSING_GOAL_FEEDBACK = deepFreeze({
  ownerSystem: "UI Presenter",
  mentorArcId: CHARACTER_ARC_IDS.CHOPPER,
  fallbackArcId: CHARACTER_ARC_IDS.TOVA,
  reminderIntro: "The beacon still needs these signals:",
  readyText: "The beacon is ready. Meet Tova at Skyforge Beacon."
});

const ENDING_STORY_CONTEXT = deepFreeze({
  cutscenePayoff: "The restored beacon gathers every regional signal and proves the island can guide itself again.",
  postStoryFiction: "After credits, the island remains open because restoration becomes daily care rather than a crisis.",
  repeatablePostStoryActivities: [
    "general requests",
    "optional requests",
    "habitat mastery",
    "decorating",
    "collection",
    "exploration"
  ]
});

export function listFinalRequiredGoals() {
  return FINAL_REQUIRED_GOALS;
}

export function listFinalRequiredImportantRequests() {
  return FINAL_REQUIRED_IMPORTANT_REQUESTS;
}

export function getFinalRequestCreditsPolicy() {
  return FINAL_REQUEST_CREDITS_POLICY;
}

export function getFinalRecipeCreditsPolicy() {
  return FINAL_RECIPE_CREDITS_POLICY;
}

export function getFinalInteraction() {
  return FINAL_INTERACTION;
}

export function getEndingStoryContext() {
  return ENDING_STORY_CONTEXT;
}

export function getMissingFinalGoalIds(completedTokenIds = []) {
  const completedTokens = new Set(completedTokenIds);

  return FINAL_REQUIRED_GOALS
    .filter((goal) => !completedTokens.has(goal.tokenId))
    .map((goal) => goal.id);
}

export function canTriggerCredits(completedTokenIds = []) {
  return getMissingFinalGoalIds(completedTokenIds).length === 0;
}

export function getFinalMissingGoalFeedback(completedTokenIds = []) {
  const missingGoalIds = getMissingFinalGoalIds(completedTokenIds);
  const missingGoals = FINAL_REQUIRED_GOALS.filter((goal) => missingGoalIds.includes(goal.id));

  return Object.freeze({
    ...FINAL_MISSING_GOAL_FEEDBACK,
    text: missingGoals.length === 0 ?
      FINAL_MISSING_GOAL_FEEDBACK.readyText :
      `${FINAL_MISSING_GOAL_FEEDBACK.reminderIntro} ${missingGoals.map((goal) => goal.label).join("; ")}`,
    missingGoalIds,
    missingGoalLabels: missingGoals.map((goal) => goal.label)
  });
}

export function getFinalCreditsStateTransition() {
  return Object.freeze({
    from: FINAL_STORY_STATE.READY_FOR_CREDITS,
    during: FINAL_STORY_STATE.CREDITS_PLAYBACK,
    to: FINAL_STORY_STATE.POST_STORY_SANDBOX,
    setsFlag: FINAL_COMPLETION_FLAG
  });
}

export function getFinalReadiness({ completedTokenIds = [] } = {}) {
  const missingGoalIds = getMissingFinalGoalIds(completedTokenIds);

  return Object.freeze({
    state: missingGoalIds.length === 0 ?
      FINAL_STORY_STATE.READY_FOR_CREDITS :
      FINAL_STORY_STATE.NOT_READY,
    missingGoalIds,
    requiredGoalIds: FINAL_REQUIRED_GOALS.map((goal) => goal.id),
    completionFlag: FINAL_COMPLETION_FLAG
  });
}

export function getPostStorySandboxState(flags = {}) {
  const available = Boolean(flags[FINAL_COMPLETION_FLAG]);

  return Object.freeze({
    state: available ?
      FINAL_STORY_STATE.POST_STORY_SANDBOX :
      FINAL_STORY_STATE.READY_FOR_CREDITS,
    available
  });
}
