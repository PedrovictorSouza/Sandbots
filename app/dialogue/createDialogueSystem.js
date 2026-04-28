function resolveSpeaker(line, dialogue) {
  if (Object.prototype.hasOwnProperty.call(line, "speaker")) {
    return line.speaker;
  }

  const speakerId = Object.prototype.hasOwnProperty.call(line, "speakerId") ?
    line.speakerId :
    dialogue.speakerId;

  if (!speakerId) {
    return "";
  }

  return speakerId
    .split("-")
    .map((part) => part ? part[0].toUpperCase() + part.slice(1) : "")
    .join(" ");
}

function conditionMatches(condition, questSystem) {
  if (!condition) {
    return true;
  }

  if (condition.questStatus) {
    const quest = questSystem?.getQuest?.(condition.questId);
    return quest?.status === condition.questStatus;
  }

  if (condition.unlocked) {
    return Boolean(questSystem?.hasUnlocked?.(condition.unlocked));
  }

  return true;
}

export function createDialogueSystem({
  dialogues,
  questSystem = null
} = {}) {
  if (!dialogues || typeof dialogues !== "object") {
    throw new Error("DialogueSystem requires a dialogue data object.");
  }

  function getDialogue(dialogueId) {
    return dialogues[dialogueId] || null;
  }

  function getConversation(dialogueId) {
    const dialogue = getDialogue(dialogueId);
    if (!dialogue) {
      return [];
    }

    return dialogue.lines
      .filter((line) => conditionMatches(line.condition, questSystem))
      .map((line) => ({
        ...line,
        speaker: resolveSpeaker(line, dialogue)
      }));
  }

  return {
    getConversation,
    getDialogue
  };
}
