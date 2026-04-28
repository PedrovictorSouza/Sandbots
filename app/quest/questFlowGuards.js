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
