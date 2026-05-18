export const ERRAND_QUEST_ELEMENT = Object.freeze({
  HOOK: "hook",
  VISIBLE_REWARD: "visibleReward",
  MICRO_EVENTS: "microEvents",
  PLAYER_CHOICE: "playerChoice",
  FAST_RESOLUTION: "fastResolution"
});

const REQUIRED_WARNING_DEFINITIONS = Object.freeze([
  Object.freeze({
    code: "missing-hook",
    element: ERRAND_QUEST_ELEMENT.HOOK,
    message: "Errand quest needs a curiosity hook before travel."
  }),
  Object.freeze({
    code: "missing-visible-reward",
    element: ERRAND_QUEST_ELEMENT.VISIBLE_REWARD,
    message: "Errand quest needs a visible useful, narrative, or emotional reward."
  }),
  Object.freeze({
    code: "missing-micro-event",
    element: ERRAND_QUEST_ELEMENT.MICRO_EVENTS,
    message: "Errand quest needs at least one micro-event during the route."
  }),
  Object.freeze({
    code: "missing-choice",
    element: ERRAND_QUEST_ELEMENT.PLAYER_CHOICE,
    message: "Errand quest needs at least one route, method, helper, or order choice."
  }),
  Object.freeze({
    code: "missing-fast-resolution",
    element: ERRAND_QUEST_ELEMENT.FAST_RESOLUTION,
    message: "Errand quest needs fast resolution when the objective completes away from base."
  })
]);

const TRAVEL_OR_FETCH_TERMS = Object.freeze([
  "activate",
  "bring",
  "collect",
  "deliver",
  "fetch",
  "find",
  "gather",
  "go to",
  "investigate",
  "reach",
  "return",
  "scan",
  "travel",
  "walk"
]);

const EXPLICIT_TRAVEL_OR_FETCH_TYPES = Object.freeze([
  "activation",
  "collection",
  "delivery",
  "fetch",
  "investigation",
  "scan",
  "travel"
]);

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeComparableText(value) {
  return hasText(value) ? value.trim().replace(/\s+/g, " ").toLocaleLowerCase() : "";
}

function isDuplicateQuestCopy(value, quest = null) {
  const text = normalizeComparableText(value);
  if (!text) {
    return false;
  }

  return [
    quest?.title,
    quest?.description
  ].some((candidate) => normalizeComparableText(candidate) === text);
}

function getQuestCopyDuplicationWarnings(quest = null) {
  const warnings = [];
  const title = normalizeComparableText(quest?.title);
  const hudText = normalizeComparableText(quest?.errandQuest?.hudText);

  [
    ["description", quest?.description],
    ["guidance", quest?.guidance],
    ["instructionText", quest?.errandQuest?.instructionText]
  ].forEach(([field, value]) => {
    const text = normalizeComparableText(value);
    if (!text) {
      return;
    }

    if (title && text === title) {
      warnings.push({
        questId: quest?.id,
        code: "quest-copy-duplicates-title",
        field,
        message: "Quest support copy should add guidance, consequence, or context instead of repeating the title."
      });
      return;
    }

    if (hudText && text === hudText) {
      warnings.push({
        questId: quest?.id,
        code: "quest-copy-duplicates-hud-text",
        field,
        message: "Quest support copy should not repeat the HUD objective without adding orientation."
      });
    }
  });

  if (title && hudText.startsWith(`${title}:`)) {
    warnings.push({
      questId: quest?.id,
      code: "hud-text-contains-guidance",
      field: "errandQuest.hudText",
      message: "Errand HUD text should stay as the short objective; put guidance in guidance or instructionText."
    });
  }

  return warnings;
}

function hasErrandHook(errandQuest) {
  return hasText(errandQuest?.hook?.short) || hasText(errandQuest?.hook?.setup);
}

function hasVisibleReward(errandQuest) {
  return hasText(errandQuest?.visibleReward?.description) || hasText(errandQuest?.visibleReward);
}

function hasMicroEvents(errandQuest) {
  return Array.isArray(errandQuest?.microEvents) && errandQuest.microEvents.some((event) => (
    hasText(event?.feedback) || hasText(event?.description)
  ));
}

function hasPlayerChoice(errandQuest) {
  return Array.isArray(errandQuest?.approachChoices) && errandQuest.approachChoices.some((choice) => (
    hasText(choice?.label) && (hasText(choice?.tradeoff) || hasText(choice?.description))
  ));
}

function hasFastResolution(errandQuest) {
  return hasText(errandQuest?.fastResolution?.type) ||
    hasText(errandQuest?.fastResolution?.description) ||
    hasText(errandQuest?.fastResolution);
}

function getErrandQuestDesignText(quest = null) {
  return [
    quest?.title,
    quest?.description,
    quest?.guidance,
    quest?.errandQuest?.hudText,
    quest?.errandQuest?.hook?.short,
    quest?.errandQuest?.hook?.setup
  ]
    .filter(hasText)
    .join(" ")
    .toLocaleLowerCase();
}

function isTravelOrFetchErrand(quest = null) {
  const explicitType = quest?.errandQuest?.taskType || quest?.errandQuest?.type || quest?.errandQuest?.pattern;
  if (EXPLICIT_TRAVEL_OR_FETCH_TYPES.includes(explicitType)) {
    return true;
  }

  const designText = getErrandQuestDesignText(quest);
  return TRAVEL_OR_FETCH_TERMS.some((term) => designText.includes(term));
}

export function getErrandQuestElements(errandQuest = null) {
  const elements = new Set();

  if (hasErrandHook(errandQuest)) {
    elements.add(ERRAND_QUEST_ELEMENT.HOOK);
  }
  if (hasVisibleReward(errandQuest)) {
    elements.add(ERRAND_QUEST_ELEMENT.VISIBLE_REWARD);
  }
  if (hasMicroEvents(errandQuest)) {
    elements.add(ERRAND_QUEST_ELEMENT.MICRO_EVENTS);
  }
  if (hasPlayerChoice(errandQuest)) {
    elements.add(ERRAND_QUEST_ELEMENT.PLAYER_CHOICE);
  }
  if (hasFastResolution(errandQuest)) {
    elements.add(ERRAND_QUEST_ELEMENT.FAST_RESOLUTION);
  }

  return [...elements];
}

export function getErrandQuestHudText(quest = null) {
  return quest?.errandQuest?.hudText || quest?.guidance || quest?.description || "";
}

export function getErrandQuestInstructionText(quest = null) {
  const hudText = quest?.errandQuest?.hudText || "";
  if (hasText(hudText) && !isDuplicateQuestCopy(hudText, quest)) {
    return hudText;
  }

  if (hasText(quest?.guidance)) {
    return quest.guidance;
  }

  return isDuplicateQuestCopy(quest?.description, quest) ? "" : quest?.description || "";
}

export function getErrandQuestPokedeskReward(quest = null) {
  const visibleReward = quest?.errandQuest?.visibleReward;
  if (!hasText(visibleReward?.pokedeskEntryId)) {
    return null;
  }

  return {
    entryId: visibleReward.pokedeskEntryId,
    label: visibleReward.pokedeskEntryLabel || visibleReward.label || "New diagnostic"
  };
}

export function unlockErrandQuestPokedeskReward({
  quest = null,
  completed = false,
  pokedexRuntime = null
} = {}) {
  if (!completed) {
    return null;
  }

  const pokedeskReward = getErrandQuestPokedeskReward(quest);
  if (!pokedeskReward) {
    return null;
  }

  pokedexRuntime?.unlock?.();
  pokedexRuntime?.setSeen?.(false);
  return pokedeskReward;
}

export function getErrandQuestProgressFeedback(quest = null, {
  previousProgress = 0,
  nextProgress = 0,
  completed = false
} = {}) {
  const errandQuest = quest?.errandQuest;
  if (!errandQuest) {
    return [];
  }

  const feedback = [];
  for (const microEvent of errandQuest.microEvents || []) {
    const progressAt = Math.max(1, Number(microEvent.progressAt || 1));
    if (
      Number(previousProgress || 0) < progressAt &&
      Number(nextProgress || 0) >= progressAt &&
      hasText(microEvent.feedback)
    ) {
      feedback.push(microEvent.feedback);
    }
  }

  if (completed) {
    if (hasText(errandQuest.fastResolution?.description)) {
      feedback.push(errandQuest.fastResolution.description);
    }
    if (hasText(errandQuest.visibleReward?.description)) {
      feedback.push(errandQuest.visibleReward.description);
    }
    const pokedeskReward = getErrandQuestPokedeskReward(quest);
    if (pokedeskReward) {
      feedback.push(`Colony Codex entry unlocked: ${pokedeskReward.label}.`);
    }
    if (hasText(errandQuest.nextHook)) {
      feedback.push(errandQuest.nextHook);
    }
  }

  return feedback;
}

export function validateErrandQuestDesign(quest = null) {
  if (!quest?.errandQuest) {
    return [];
  }

  const elements = new Set(getErrandQuestElements(quest.errandQuest));
  const warnings = [...getQuestCopyDuplicationWarnings(quest)];

  for (const warningDefinition of REQUIRED_WARNING_DEFINITIONS) {
    if (!elements.has(warningDefinition.element)) {
      warnings.push({
        questId: quest.id,
        code: warningDefinition.code,
        message: warningDefinition.message
      });
    }
  }

  if (elements.size < 3) {
    warnings.push({
      questId: quest.id,
      code: "too-few-errand-elements",
      message: "Errand quest must contain at least three anti-busywork elements."
    });
  }

  if (isTravelOrFetchErrand(quest) && !elements.has(ERRAND_QUEST_ELEMENT.MICRO_EVENTS)) {
    warnings.push({
      questId: quest.id,
      code: "travel-without-micro-event",
      message: "Travel, fetch, scan, or collection errands should add at least one route beat so the trip is not empty."
    });
  }

  return warnings;
}

export function validateErrandQuestSet(quests = []) {
  return quests.flatMap((quest) => validateErrandQuestDesign(quest));
}

export function warnInvalidErrandQuestDesign({
  quests = [],
  enabled = false,
  consoleRef = globalThis.console
} = {}) {
  const warnings = validateErrandQuestSet(quests);

  if (!enabled || warnings.length === 0) {
    return warnings;
  }

  for (const warning of warnings) {
    consoleRef?.warn?.(
      `[errand-quest-design] ${warning.questId}: ${warning.code} - ${warning.message}`
    );
  }

  return warnings;
}
