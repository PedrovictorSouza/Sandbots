import { QUEST_EVENT } from "../quest/questData.js";
import { AUTOSAVE_EVENT } from "../runtime/autosaveRuntime.js";

export const COLONY_PROGRESS_EVENT = Object.freeze({
  PLAYER_MOVED: "player-moved",
  BOT_TALKED: "bot-talked",
  RESOURCE_COLLECTED: "resource-collected",
  TOOL_UNLOCKED: "tool-unlocked",
  RESTORATION_APPLIED: "restoration-applied",
  BUILDABLE_PLACED: "buildable-placed",
  TERMINAL_LOGGED: "terminal-logged",
  BOT_REACTIVATED: "bot-reactivated",
  HABITAT_CREATED: "habitat-created"
});

export const COLONY_MILESTONE = Object.freeze({
  MOVEMENT_CONFIRMED: "movement-confirmed",
  GUIDE_CONTACTED: "guide-contacted",
  HYDRO_BOT_REACTIVATED: "hydro-bot-reactivated",
  WATER_TOOL_ONLINE: "water-tool-online",
  SOIL_RESTORATION_PROGRESS: "soil-restoration-progress",
  FIRST_SHELTER_SITE_MARKED: "first-shelter-site-marked",
  VIABILITY_LOGGED: "viability-logged",
  FIRST_HABITAT_CREATED: "first-habitat-created"
});

export const COLONY_PROGRESS_TRIGGERS = Object.freeze([
  {
    id: "movement-confirmed",
    eventType: COLONY_PROGRESS_EVENT.PLAYER_MOVED,
    questEvent: {
      type: QUEST_EVENT.MOVE,
      targetId: "player"
    },
    milestoneIds: [COLONY_MILESTONE.MOVEMENT_CONFIRMED]
  },
  {
    id: "guide-contacted",
    eventType: COLONY_PROGRESS_EVENT.BOT_TALKED,
    match: {
      botId: "chopper"
    },
    questEvent: {
      type: QUEST_EVENT.TALK,
      targetId: "tangrowth"
    },
    milestoneIds: [COLONY_MILESTONE.GUIDE_CONTACTED],
    autosaveType: AUTOSAVE_EVENT.STORY_STEP_ADVANCED
  },
  {
    id: "hydro-tool-online",
    eventType: COLONY_PROGRESS_EVENT.TOOL_UNLOCKED,
    match: {
      toolId: "waterGun"
    },
    questEvent: {
      type: QUEST_EVENT.UNLOCK,
      targetId: "waterGun"
    },
    milestoneIds: [
      COLONY_MILESTONE.HYDRO_BOT_REACTIVATED,
      COLONY_MILESTONE.WATER_TOOL_ONLINE
    ],
    autosaveType: AUTOSAVE_EVENT.NEW_ABILITY_LEARNED
  },
  {
    id: "dry-grass-restored",
    eventType: COLONY_PROGRESS_EVENT.RESTORATION_APPLIED,
    match: {
      targetId: "dry-grass",
      toolId: "waterGun"
    },
    questEvent: {
      type: QUEST_EVENT.BUILD,
      targetId: "revived-grass"
    },
    milestoneIds: [COLONY_MILESTONE.SOIL_RESTORATION_PROGRESS]
  },
  {
    id: "first-shelter-site-marked",
    eventType: COLONY_PROGRESS_EVENT.BUILDABLE_PLACED,
    match: {
      buildableId: "leafDenKit"
    },
    questEvent: {
      type: QUEST_EVENT.PLACE,
      targetId: "leafy-home-patch"
    },
    milestoneIds: [COLONY_MILESTONE.FIRST_SHELTER_SITE_MARKED],
    autosaveType: AUTOSAVE_EVENT.TASK_COMPLETED
  },
  {
    id: "viability-logged",
    eventType: COLONY_PROGRESS_EVENT.TERMINAL_LOGGED,
    match: {
      reportId: "boulder-shaded-tall-grass"
    },
    milestoneIds: [COLONY_MILESTONE.VIABILITY_LOGGED],
    autosaveType: AUTOSAVE_EVENT.MAJOR_SYSTEM_UNLOCKED
  },
  {
    id: "first-habitat-created",
    eventType: COLONY_PROGRESS_EVENT.HABITAT_CREATED,
    match: {
      habitatId: "first-habitat"
    },
    questEvent: {
      type: QUEST_EVENT.BUILD,
      targetId: "revived-habitat"
    },
    milestoneIds: [COLONY_MILESTONE.FIRST_HABITAT_CREATED],
    autosaveType: AUTOSAVE_EVENT.TASK_COMPLETED
  }
]);

const COLONY_PROGRESS_EVENT_VALUES = new Set(Object.values(COLONY_PROGRESS_EVENT));

function clonePayload(payload = {}) {
  return Object.fromEntries(
    Object.entries(payload || {}).map(([key, value]) => [
      key,
      Array.isArray(value) ? [...value] : value
    ])
  );
}

function normalizeProgressEvent(eventOrType, payload = {}) {
  if (typeof eventOrType === "string") {
    return {
      type: eventOrType,
      payload: clonePayload(payload)
    };
  }

  if (eventOrType && typeof eventOrType === "object") {
    return {
      type: eventOrType.type,
      payload: clonePayload(eventOrType.payload || payload)
    };
  }

  return {
    type: null,
    payload: {}
  };
}

function matchesPayload(expected = {}, actual = {}) {
  return Object.entries(expected).every(([key, value]) => actual[key] === value);
}

function createQuestEvent(trigger, event) {
  if (!trigger.questEvent) return null;

  const amount = Math.max(1, Number(event.payload.amount || 1));
  return {
    ...trigger.questEvent,
    amount
  };
}

export function validateColonyProgressEvent(eventOrType, payload = {}) {
  const event = normalizeProgressEvent(eventOrType, payload);
  const errors = [];

  if (!COLONY_PROGRESS_EVENT_VALUES.has(event.type)) {
    errors.push({
      code: "unknown-progress-event",
      message: `Unknown colony progress event: ${event.type || "null"}.`
    });
  }

  if (!event.payload || typeof event.payload !== "object") {
    errors.push({
      code: "invalid-progress-payload",
      message: "Colony progress event payload must be an object."
    });
  }

  return {
    valid: errors.length === 0,
    event,
    errors
  };
}

export function resolveColonyProgressTriggers(
  eventOrType,
  payload = {},
  triggers = COLONY_PROGRESS_TRIGGERS
) {
  const validation = validateColonyProgressEvent(eventOrType, payload);
  if (!validation.valid) {
    return {
      event: validation.event,
      triggers: [],
      questEvents: [],
      milestoneIds: [],
      autosaveEvents: [],
      errors: validation.errors
    };
  }

  const matchedTriggers = triggers.filter((trigger) =>
    trigger.eventType === validation.event.type &&
    matchesPayload(trigger.match, validation.event.payload)
  );

  const questEvents = matchedTriggers
    .map((trigger) => createQuestEvent(trigger, validation.event))
    .filter(Boolean);
  const milestoneIds = [
    ...new Set(matchedTriggers.flatMap((trigger) => trigger.milestoneIds || []))
  ];
  const autosaveEvents = matchedTriggers
    .filter((trigger) => trigger.autosaveType)
    .map((trigger) => ({
      type: trigger.autosaveType,
      payload: {
        triggerId: trigger.id,
        ...validation.event.payload
      }
    }));

  return {
    event: validation.event,
    triggers: matchedTriggers,
    questEvents,
    milestoneIds,
    autosaveEvents,
    errors: []
  };
}

export function getNewColonyMilestoneIds(existingMilestoneIds = [], resolvedTriggers = {}) {
  const existing = new Set(existingMilestoneIds);
  return (resolvedTriggers.milestoneIds || []).filter((milestoneId) => !existing.has(milestoneId));
}

export function emitColonyProgressQuestEvents({
  questSystem = null,
  eventType,
  payload = {},
  triggers = COLONY_PROGRESS_TRIGGERS
} = {}) {
  const resolved = resolveColonyProgressTriggers(eventType, payload, triggers);
  const questResults = resolved.questEvents.map((questEvent) => {
    return questSystem?.emit?.(questEvent) || { changed: false, completedQuestIds: [] };
  });

  return {
    ...resolved,
    questResults
  };
}
