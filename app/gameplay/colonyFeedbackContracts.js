export const COLONY_FEEDBACK_IDS = Object.freeze({
  HABITAT_CHECK_COMPLETE: "habitat-check-complete",
  HOUSE_KIT_ISSUED: "house-kit-issued",
  HOUSE_KIT_LOCKED: "house-kit-locked",
  HOUSE_KIT_PLACEMENT_NEEDS_POWER_RADIUS: "house-kit-placement-needs-power-radius",
  HOUSE_KIT_PLACEMENT_VALID: "house-kit-placement-valid",
  HOUSE_KIT_READY_NEEDS_SOLAR_STATION: "house-kit-ready-needs-solar-station",
  HOUSE_KIT_READY_TO_PLACE: "house-kit-ready-to-place",
  HOUSE_KIT_SELECTED: "house-kit-selected",
  ISSUE_HOUSE_KIT_ACTION: "issue-house-kit-action",
  LOG_VIABILITY_ACTION: "log-viability-action",
  PLACEMENT_BLOCKED_BY_OBJECTS: "placement-blocked-by-objects",
  SOLAR_STATION_PLACED: "solar-station-placed",
  SOLAR_STATION_PLACEMENT_VALID: "solar-station-placement-valid",
  SOLAR_STATION_READY_MOVE_TO_OPEN_TERRAIN: "solar-station-ready-move-to-open-terrain",
  SOLAR_STATION_READY_TO_PLACE: "solar-station-ready-to-place",
  WORLD_PROMPT_BLOCKED: "world-prompt-blocked",
  WORLD_PROMPT_MOVE_TO_OPEN_TERRAIN: "world-prompt-move-to-open-terrain",
  WORLD_PROMPT_NEEDS_POWER: "world-prompt-needs-power",
  WORLD_PROMPT_NEEDS_SOLAR_STATION: "world-prompt-needs-solar-station",
  WORLD_PROMPT_PLACE: "world-prompt-place"
});

export const COLONY_REWARD_TIER = Object.freeze({
  TINY_ACTION: "tiny-action",
  USEFUL_ACTION: "useful-action",
  MILESTONE: "milestone",
  MAJOR_SCENE: "major-scene"
});

export const COLONY_REWARD_TIER_CONTRACTS = Object.freeze({
  [COLONY_REWARD_TIER.TINY_ACTION]: Object.freeze({
    id: COLONY_REWARD_TIER.TINY_ACTION,
    label: "Tiny action",
    expectedChannels: Object.freeze(["prompt", "worldPrompt", "groundHighlight"]),
    guidance: "Use immediate low-noise feedback for reversible input, blocked spots, and small state nudges."
  }),
  [COLONY_REWARD_TIER.USEFUL_ACTION]: Object.freeze({
    id: COLONY_REWARD_TIER.USEFUL_ACTION,
    label: "Useful action",
    expectedChannels: Object.freeze(["notice", "worldPrompt", "inventory"]),
    guidance: "Use a clear notice or persistent prompt when the player gains an actionable next step."
  }),
  [COLONY_REWARD_TIER.MILESTONE]: Object.freeze({
    id: COLONY_REWARD_TIER.MILESTONE,
    label: "Milestone",
    expectedChannels: Object.freeze(["notice", "questPulse", "taskPop"]),
    guidance: "Use stronger feedback for progress that changes the colony state or resolves a tutorial beat."
  }),
  [COLONY_REWARD_TIER.MAJOR_SCENE]: Object.freeze({
    id: COLONY_REWARD_TIER.MAJOR_SCENE,
    label: "Major scene",
    expectedChannels: Object.freeze(["cinematic", "notice", "questPulse", "autosave"]),
    guidance: "Use a authored scene when the world visibly changes or a major bot/system comes online."
  })
});

export const COLONY_REWARD_EVENT_IDS = Object.freeze({
  BOT_AWAKENED: "bot-awakened",
  HABITAT_COMPLETED: "habitat-completed",
  KIT_PLACED: "kit-placed",
  TILE_RESTORED: "tile-restored",
  TOOL_LEARNED: "tool-learned"
});

export const COLONY_REWARD_EVENT_TIERS = Object.freeze({
  [COLONY_REWARD_EVENT_IDS.TILE_RESTORED]: Object.freeze({
    id: COLONY_REWARD_EVENT_IDS.TILE_RESTORED,
    rewardTier: COLONY_REWARD_TIER.TINY_ACTION,
    feedbackExpectation: "Show the tile state change immediately; avoid interrupting movement."
  }),
  [COLONY_REWARD_EVENT_IDS.TOOL_LEARNED]: Object.freeze({
    id: COLONY_REWARD_EVENT_IDS.TOOL_LEARNED,
    rewardTier: COLONY_REWARD_TIER.USEFUL_ACTION,
    feedbackExpectation: "Name the new field tool and show the first safe target."
  }),
  [COLONY_REWARD_EVENT_IDS.BOT_AWAKENED]: Object.freeze({
    id: COLONY_REWARD_EVENT_IDS.BOT_AWAKENED,
    rewardTier: COLONY_REWARD_TIER.MAJOR_SCENE,
    feedbackExpectation: "Use camera, light, sound, dialogue, and autosave because a colony actor changed state."
  }),
  [COLONY_REWARD_EVENT_IDS.KIT_PLACED]: Object.freeze({
    id: COLONY_REWARD_EVENT_IDS.KIT_PLACED,
    rewardTier: COLONY_REWARD_TIER.MILESTONE,
    feedbackExpectation: "Confirm the placed structure, update the task chain, and show what it enables."
  }),
  [COLONY_REWARD_EVENT_IDS.HABITAT_COMPLETED]: Object.freeze({
    id: COLONY_REWARD_EVENT_IDS.HABITAT_COMPLETED,
    rewardTier: COLONY_REWARD_TIER.MILESTONE,
    feedbackExpectation: "Pulse the objective, show a clear notice, and point to the next colony action."
  })
});

const COLONY_FEEDBACK_CONTRACTS = Object.freeze({
  [COLONY_FEEDBACK_IDS.HABITAT_CHECK_COMPLETE]: Object.freeze({
    id: COLONY_FEEDBACK_IDS.HABITAT_CHECK_COMPLETE,
    rewardTier: COLONY_REWARD_TIER.MILESTONE,
    playerGoal: "Talk to the Grow Bot after proving the habitat can support colony work.",
    channels: Object.freeze(["notice", "questPulse", "taskPop"]),
    notice: ({ growBotName = "Grow Bot" } = {}) => `First habitat check complete. Talk to ${growBotName}.`,
    taskPop: "Habitat viability confirmed."
  }),
  [COLONY_FEEDBACK_IDS.HOUSE_KIT_ISSUED]: Object.freeze({
    id: COLONY_FEEDBACK_IDS.HOUSE_KIT_ISSUED,
    rewardTier: COLONY_REWARD_TIER.USEFUL_ACTION,
    playerGoal: "Place the prepared House Kit in a clear powered area.",
    channels: Object.freeze(["notice", "inventory"]),
    notice: "House Kit prepared."
  }),
  [COLONY_FEEDBACK_IDS.HOUSE_KIT_LOCKED]: Object.freeze({
    id: COLONY_FEEDBACK_IDS.HOUSE_KIT_LOCKED,
    rewardTier: COLONY_REWARD_TIER.TINY_ACTION,
    playerGoal: "Restore enough planetary viability to authorize a House Kit.",
    channels: Object.freeze(["notice"]),
    notice: "House is still locked."
  }),
  [COLONY_FEEDBACK_IDS.HOUSE_KIT_PLACEMENT_NEEDS_POWER_RADIUS]: Object.freeze({
    id: COLONY_FEEDBACK_IDS.HOUSE_KIT_PLACEMENT_NEEDS_POWER_RADIUS,
    rewardTier: COLONY_REWARD_TIER.TINY_ACTION,
    playerGoal: "Move the House Kit preview into the blue Solar Station support zone.",
    channels: Object.freeze(["prompt", "worldPrompt", "groundHighlight"]),
    prompt: "Needs blue support zone  B Cancel  LB/RB Rotate"
  }),
  [COLONY_FEEDBACK_IDS.HOUSE_KIT_PLACEMENT_VALID]: Object.freeze({
    id: COLONY_FEEDBACK_IDS.HOUSE_KIT_PLACEMENT_VALID,
    rewardTier: COLONY_REWARD_TIER.TINY_ACTION,
    playerGoal: "Confirm the House Kit placement or rotate/cancel the preview.",
    channels: Object.freeze(["prompt", "worldPrompt", "groundHighlight"]),
    prompt: "Move House Kit preview  X / Enter Place  B Cancel  LB/RB Rotate"
  }),
  [COLONY_FEEDBACK_IDS.HOUSE_KIT_READY_NEEDS_SOLAR_STATION]: Object.freeze({
    id: COLONY_FEEDBACK_IDS.HOUSE_KIT_READY_NEEDS_SOLAR_STATION,
    rewardTier: COLONY_REWARD_TIER.USEFUL_ACTION,
    playerGoal: "Place the Solar Station before placing the House Kit.",
    channels: Object.freeze(["notice", "worldPrompt"]),
    notice: "House Kit ready. Place the Solar Station first.",
    prompt: "House Kit ready  Place Solar Station first"
  }),
  [COLONY_FEEDBACK_IDS.HOUSE_KIT_READY_TO_PLACE]: Object.freeze({
    id: COLONY_FEEDBACK_IDS.HOUSE_KIT_READY_TO_PLACE,
    rewardTier: COLONY_REWARD_TIER.USEFUL_ACTION,
    playerGoal: "Move into the world and start House Kit placement.",
    channels: Object.freeze(["notice", "worldPrompt"]),
    notice: "House Kit ready. Move into the world and press X / Enter.",
    prompt: "House Kit ready  X / Enter Place"
  }),
  [COLONY_FEEDBACK_IDS.HOUSE_KIT_SELECTED]: Object.freeze({
    id: COLONY_FEEDBACK_IDS.HOUSE_KIT_SELECTED,
    rewardTier: COLONY_REWARD_TIER.USEFUL_ACTION,
    playerGoal: "Place the House Kit in a clear powered area.",
    channels: Object.freeze(["notice", "worldPrompt", "groundHighlight"]),
    notice: "House Kit selected."
  }),
  [COLONY_FEEDBACK_IDS.ISSUE_HOUSE_KIT_ACTION]: Object.freeze({
    id: COLONY_FEEDBACK_IDS.ISSUE_HOUSE_KIT_ACTION,
    rewardTier: COLONY_REWARD_TIER.TINY_ACTION,
    playerGoal: "Issue the authorized House Kit from the Colony Terminal.",
    channels: Object.freeze(["terminalAction"]),
    actionLabel: "Issue Kit"
  }),
  [COLONY_FEEDBACK_IDS.LOG_VIABILITY_ACTION]: Object.freeze({
    id: COLONY_FEEDBACK_IDS.LOG_VIABILITY_ACTION,
    rewardTier: COLONY_REWARD_TIER.TINY_ACTION,
    playerGoal: "Log the completed habitat viability report at the Colony Terminal.",
    channels: Object.freeze(["terminalAction"]),
    actionLabel: "Log Viability"
  }),
  [COLONY_FEEDBACK_IDS.PLACEMENT_BLOCKED_BY_OBJECTS]: Object.freeze({
    id: COLONY_FEEDBACK_IDS.PLACEMENT_BLOCKED_BY_OBJECTS,
    rewardTier: COLONY_REWARD_TIER.TINY_ACTION,
    playerGoal: "Move the placement preview away from blocking objects.",
    channels: Object.freeze(["prompt", "worldPrompt", "groundHighlight"]),
    prompt: "Blocked  Move away from objects  B Cancel  LB/RB Rotate"
  }),
  [COLONY_FEEDBACK_IDS.SOLAR_STATION_PLACED]: Object.freeze({
    id: COLONY_FEEDBACK_IDS.SOLAR_STATION_PLACED,
    rewardTier: COLONY_REWARD_TIER.MILESTONE,
    playerGoal: "Use the powered support zone to plan the first House placement.",
    channels: Object.freeze(["notice", "groundHighlight"]),
    notice: "Solar Station online. Blue cells mark the human habitat support zone."
  }),
  [COLONY_FEEDBACK_IDS.SOLAR_STATION_PLACEMENT_VALID]: Object.freeze({
    id: COLONY_FEEDBACK_IDS.SOLAR_STATION_PLACEMENT_VALID,
    rewardTier: COLONY_REWARD_TIER.TINY_ACTION,
    playerGoal: "Confirm the Solar Station placement or rotate/cancel the preview.",
    channels: Object.freeze(["prompt", "worldPrompt", "groundHighlight"]),
    prompt: "Move Solar Station preview  X / Enter Place  B Cancel  LB/RB Rotate"
  }),
  [COLONY_FEEDBACK_IDS.SOLAR_STATION_READY_MOVE_TO_OPEN_TERRAIN]: Object.freeze({
    id: COLONY_FEEDBACK_IDS.SOLAR_STATION_READY_MOVE_TO_OPEN_TERRAIN,
    rewardTier: COLONY_REWARD_TIER.USEFUL_ACTION,
    playerGoal: "Move to open terrain before placing the Solar Station.",
    channels: Object.freeze(["prompt", "worldPrompt"]),
    prompt: "Solar Station ready  Move to open terrain"
  }),
  [COLONY_FEEDBACK_IDS.SOLAR_STATION_READY_TO_PLACE]: Object.freeze({
    id: COLONY_FEEDBACK_IDS.SOLAR_STATION_READY_TO_PLACE,
    rewardTier: COLONY_REWARD_TIER.USEFUL_ACTION,
    playerGoal: "Start Solar Station placement in valid open terrain.",
    channels: Object.freeze(["prompt", "worldPrompt"]),
    prompt: "Solar Station ready  X / Enter Place"
  }),
  [COLONY_FEEDBACK_IDS.WORLD_PROMPT_BLOCKED]: Object.freeze({
    id: COLONY_FEEDBACK_IDS.WORLD_PROMPT_BLOCKED,
    rewardTier: COLONY_REWARD_TIER.TINY_ACTION,
    playerGoal: "Move away from the blocked placement spot.",
    channels: Object.freeze(["worldPrompt"]),
    prompt: "Move away from objects"
  }),
  [COLONY_FEEDBACK_IDS.WORLD_PROMPT_MOVE_TO_OPEN_TERRAIN]: Object.freeze({
    id: COLONY_FEEDBACK_IDS.WORLD_PROMPT_MOVE_TO_OPEN_TERRAIN,
    rewardTier: COLONY_REWARD_TIER.TINY_ACTION,
    playerGoal: "Move to open terrain.",
    channels: Object.freeze(["worldPrompt"]),
    prompt: "Move to open terrain"
  }),
  [COLONY_FEEDBACK_IDS.WORLD_PROMPT_NEEDS_POWER]: Object.freeze({
    id: COLONY_FEEDBACK_IDS.WORLD_PROMPT_NEEDS_POWER,
    rewardTier: COLONY_REWARD_TIER.TINY_ACTION,
    playerGoal: "Move into the Solar Station support zone.",
    channels: Object.freeze(["worldPrompt"]),
    prompt: "Move inside blue zone"
  }),
  [COLONY_FEEDBACK_IDS.WORLD_PROMPT_NEEDS_SOLAR_STATION]: Object.freeze({
    id: COLONY_FEEDBACK_IDS.WORLD_PROMPT_NEEDS_SOLAR_STATION,
    rewardTier: COLONY_REWARD_TIER.TINY_ACTION,
    playerGoal: "Place a Solar Station first.",
    channels: Object.freeze(["worldPrompt"]),
    prompt: "Needs Solar Station"
  }),
  [COLONY_FEEDBACK_IDS.WORLD_PROMPT_PLACE]: Object.freeze({
    id: COLONY_FEEDBACK_IDS.WORLD_PROMPT_PLACE,
    rewardTier: COLONY_REWARD_TIER.TINY_ACTION,
    playerGoal: "Confirm placement.",
    channels: Object.freeze(["worldPrompt"]),
    prompt: "X / Enter Place"
  })
});

export function getColonyFeedbackContract(id) {
  return COLONY_FEEDBACK_CONTRACTS[id] || null;
}

export function getColonyRewardTierContract(tier) {
  return COLONY_REWARD_TIER_CONTRACTS[tier] || null;
}

export function getColonyRewardEventTier(id) {
  return COLONY_REWARD_EVENT_TIERS[id]?.rewardTier || null;
}

export function getColonyFeedbackRewardTier(id) {
  return getColonyFeedbackContract(id)?.rewardTier || null;
}

function resolveCopy(value, context) {
  return typeof value === "function" ? value(context) : value || "";
}

export function getColonyFeedbackNotice(id, context = {}) {
  return resolveCopy(getColonyFeedbackContract(id)?.notice, context);
}

export function getColonyFeedbackPrompt(id, context = {}) {
  return resolveCopy(getColonyFeedbackContract(id)?.prompt, context);
}

export function getColonyFeedbackActionLabel(id, context = {}) {
  return resolveCopy(getColonyFeedbackContract(id)?.actionLabel, context);
}

export function getColonyFeedbackTaskPop(id, context = {}) {
  return resolveCopy(getColonyFeedbackContract(id)?.taskPop, context);
}
