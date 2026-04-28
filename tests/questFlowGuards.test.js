import { describe, expect, it } from "vitest";
import { assertImmutableFirstQuest, IMMUTABLE_FIRST_QUEST } from "../app/quest/questFlowGuards.js";
import { QUEST_EVENT, QUEST_STATUS, SMALL_ISLAND_QUESTS } from "../app/quest/questData.js";

function cloneQuests() {
  return SMALL_ISLAND_QUESTS.map((quest) => ({
    ...quest,
    objectives: quest.objectives.map((objective) => ({ ...objective })),
    rewards: {
      unlocks: [...(quest.rewards?.unlocks || [])],
      items: [...(quest.rewards?.items || [])]
    }
  }));
}

describe("questFlowGuards", () => {
  it("locks the first task contract to player movement", () => {
    expect(IMMUTABLE_FIRST_QUEST).toEqual({
      id: "learn-to-move",
      objectiveType: QUEST_EVENT.MOVE,
      targetId: "player",
      required: 1
    });
    expect(() => assertImmutableFirstQuest(SMALL_ISLAND_QUESTS)).not.toThrow();
  });

  it("fails if any quest is moved before the movement task", () => {
    const quests = cloneQuests();
    quests.reverse();

    expect(() => assertImmutableFirstQuest(quests)).toThrow("Quest flow must start with learn-to-move.");
  });

  it("fails if the movement task is no longer the only active starting task", () => {
    const quests = cloneQuests();
    quests[1].status = QUEST_STATUS.ACTIVE;

    expect(() => assertImmutableFirstQuest(quests)).toThrow("Only learn-to-move can start active.");
  });

  it("fails if the first objective stops being player movement", () => {
    const quests = cloneQuests();
    quests[0].objectives[0] = {
      type: QUEST_EVENT.COLLECT,
      targetId: "wood",
      required: 3,
      current: 0
    };

    expect(() => assertImmutableFirstQuest(quests)).toThrow(
      "learn-to-move must require moving the player exactly once."
    );
  });
});
