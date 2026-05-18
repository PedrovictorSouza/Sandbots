import { QUEST_EVENT, QUEST_STATUS } from "./questData.js";

export const IMMUTABLE_FIRST_QUEST = Object.freeze({
  id: "learn-to-move",
  objectiveType: QUEST_EVENT.MOVE,
  targetId: "player",
  required: 1
});

export function assertImmutableFirstQuest(quests) {
  const firstQuest = Array.isArray(quests) ? quests[0] : null;

  if (!firstQuest) {
    throw new Error("Quest flow requires an immutable first movement task.");
  }

  if (firstQuest.id !== IMMUTABLE_FIRST_QUEST.id) {
    throw new Error(`Quest flow must start with ${IMMUTABLE_FIRST_QUEST.id}.`);
  }

  if (firstQuest.status !== QUEST_STATUS.ACTIVE) {
    throw new Error(`${IMMUTABLE_FIRST_QUEST.id} must start active.`);
  }

  const movementObjective = firstQuest.objectives?.[0];
  if (
    movementObjective?.type !== IMMUTABLE_FIRST_QUEST.objectiveType ||
    movementObjective?.targetId !== IMMUTABLE_FIRST_QUEST.targetId ||
    movementObjective?.required !== IMMUTABLE_FIRST_QUEST.required
  ) {
    throw new Error(`${IMMUTABLE_FIRST_QUEST.id} must require moving the player exactly once.`);
  }

  const otherActiveQuest = quests.find((quest, index) => {
    return index > 0 && quest.status === QUEST_STATUS.ACTIVE;
  });

  if (otherActiveQuest) {
    throw new Error(`Only ${IMMUTABLE_FIRST_QUEST.id} can start active.`);
  }
}

export function getQuestFlowReachability(quests) {
  const questById = new Map((quests || []).map((quest) => [quest.id, quest]));
  const reachableQuestIds = new Set();
  const missingNextQuestIds = [];
  let loopQuestId = null;
  let currentQuestId = quests?.[0]?.id || null;

  while (currentQuestId) {
    if (reachableQuestIds.has(currentQuestId)) {
      loopQuestId = currentQuestId;
      break;
    }

    const quest = questById.get(currentQuestId);
    if (!quest) {
      break;
    }

    reachableQuestIds.add(currentQuestId);
    if (!quest.nextQuestId) {
      break;
    }

    if (!questById.has(quest.nextQuestId)) {
      missingNextQuestIds.push({
        questId: quest.id,
        nextQuestId: quest.nextQuestId
      });
      break;
    }

    currentQuestId = quest.nextQuestId;
  }

  const unreachableQuestIds = [];
  const detachedQuestIds = [];
  for (const quest of quests || []) {
    if (reachableQuestIds.has(quest.id)) {
      continue;
    }

    if (quest.detached) {
      detachedQuestIds.push(quest.id);
    } else {
      unreachableQuestIds.push(quest.id);
    }
  }

  return {
    reachableQuestIds: [...reachableQuestIds],
    detachedQuestIds,
    unreachableQuestIds,
    missingNextQuestIds,
    loopQuestId
  };
}

export function assertReachableQuestFlow(quests) {
  const reachability = getQuestFlowReachability(quests);

  if (reachability.loopQuestId) {
    throw new Error(`Quest flow contains a nextQuestId loop at ${reachability.loopQuestId}.`);
  }

  if (reachability.missingNextQuestIds.length > 0) {
    const missing = reachability.missingNextQuestIds
      .map((entry) => `${entry.questId} -> ${entry.nextQuestId}`)
      .join(", ");
    throw new Error(`Quest flow points to missing quest(s): ${missing}.`);
  }

  if (reachability.unreachableQuestIds.length > 0) {
    throw new Error(`Unreachable quest(s) must be connected or marked detached: ${reachability.unreachableQuestIds.join(", ")}.`);
  }
}

export function isImmutableFirstQuestCompleted(state, quests) {
  const firstQuestId = quests?.[0]?.id;
  const firstQuest = firstQuestId ? state?.quests?.[firstQuestId] : null;
  const movementObjective = firstQuest?.objectives?.[0];

  return firstQuest?.status === QUEST_STATUS.COMPLETED &&
    movementObjective?.type === IMMUTABLE_FIRST_QUEST.objectiveType &&
    movementObjective?.targetId === IMMUTABLE_FIRST_QUEST.targetId &&
    movementObjective.current >= movementObjective.required;
}

export function shouldResetToImmutableFirstQuest(state, quests) {
  return !isImmutableFirstQuestCompleted(state, quests);
}
