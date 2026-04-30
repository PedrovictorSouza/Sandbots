import { describe, expect, it, vi } from "vitest";
import { createQuestSystem } from "../app/quest/createQuestSystem.js";
import { QUEST_EVENT, QUEST_STATUS, SMALL_ISLAND_QUESTS } from "../app/quest/questData.js";

function createMemoryStorage(initial = {}) {
  const store = { ...initial };
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    setItem(key, value) {
      store[key] = value;
    },
    getStore() {
      return store;
    }
  };
}

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

describe("createQuestSystem", () => {
  it("refuses to boot if the immutable first movement task is not first", () => {
    const quests = cloneQuests();
    const [firstQuest] = quests.splice(0, 1);
    quests.push(firstQuest);

    expect(() => createQuestSystem({
      quests,
      storage: createMemoryStorage()
    })).toThrow("Quest flow must start with learn-to-move.");
  });

  it("refuses to boot if the first movement task is not the only active start task", () => {
    const quests = cloneQuests();
    quests[1].status = QUEST_STATUS.ACTIVE;

    expect(() => createQuestSystem({
      quests,
      storage: createMemoryStorage()
    })).toThrow("Only learn-to-move can start active.");
  });

  it("always keeps movement as the first task until the player actually moves", () => {
    const questSystem = createQuestSystem({
      quests: SMALL_ISLAND_QUESTS,
      storage: createMemoryStorage()
    });

    expect(SMALL_ISLAND_QUESTS[0].id).toBe("learn-to-move");
    expect(questSystem.getActiveQuest().id).toBe("learn-to-move");

    questSystem.emit({ type: QUEST_EVENT.TALK, targetId: "tangrowth" });
    questSystem.emit({ type: QUEST_EVENT.COLLECT, targetId: "wood", amount: 99 });
    questSystem.emit({ type: QUEST_EVENT.UNLOCK, targetId: "waterGun" });
    questSystem.emit({ type: QUEST_EVENT.BUILD, targetId: "revived-grass", amount: 99 });
    questSystem.emit({ type: QUEST_EVENT.TALK, targetId: "leaf-helper" });

    expect(questSystem.getActiveQuest().id).toBe("learn-to-move");
    expect(questSystem.getActiveQuest().objectives[0].current).toBe(0);

    questSystem.emit({ type: QUEST_EVENT.MOVE, targetId: "player" });

    expect(questSystem.getQuest("learn-to-move").status).toBe("completed");
  });

  it("does not replay future onboarding events into tasks that become active later", () => {
    const questSystem = createQuestSystem({
      quests: SMALL_ISLAND_QUESTS,
      storage: createMemoryStorage()
    });

    questSystem.emit({ type: QUEST_EVENT.COLLECT, targetId: "wood", amount: 3 });
    questSystem.emit({ type: QUEST_EVENT.TALK, targetId: "tangrowth" });

    expect(questSystem.getActiveQuest().id).toBe("learn-to-move");
    expect(questSystem.getQuest("wake-guide").status).toBe("locked");
    expect(questSystem.getQuest("gather-first-supplies").objectives[0].current).toBe(0);

    questSystem.emit({ type: QUEST_EVENT.MOVE, targetId: "player" });
    expect(questSystem.getActiveQuest().id).toBe("wake-guide");

    questSystem.emit({ type: QUEST_EVENT.TALK, targetId: "tangrowth" });
    expect(questSystem.getActiveQuest().id).toBe("gather-first-supplies");
    expect(questSystem.getQuest("gather-first-supplies").objectives[0].current).toBe(0);
  });

  it("rejects persisted progress that tries to skip the immutable first movement task", () => {
    const staleStorageKey = "quest-test.stale-skip";
    const storage = createMemoryStorage({
      [staleStorageKey]: JSON.stringify({
        activeQuestId: "inspect-rustling-grass",
        eventTotals: {
          "TALK:leaf-helper": 1
        },
        completedQuestIds: [],
        quests: {
          "learn-to-move": {
            status: "active",
            objectives: [
              { current: 0 }
            ]
          },
          "inspect-rustling-grass": {
            status: "active",
            objectives: [
              { current: 1 }
            ]
          }
        }
      })
    });

    const questSystem = createQuestSystem({
      quests: SMALL_ISLAND_QUESTS,
      storage,
      storageKey: staleStorageKey
    });

    expect(questSystem.getActiveQuest().id).toBe("learn-to-move");
    expect(questSystem.getQuest("learn-to-move").objectives[0].current).toBe(0);
    expect(questSystem.getQuest("inspect-rustling-grass").status).toBe("locked");

    questSystem.emit({ type: QUEST_EVENT.TALK, targetId: "leaf-helper" });

    expect(questSystem.getActiveQuest().id).toBe("learn-to-move");
    expect(questSystem.getQuest("learn-to-move").objectives[0].current).toBe(0);
  });

  it("can hold a completed quest before activating the next task", () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    const questSystem = createQuestSystem({
      quests: SMALL_ISLAND_QUESTS,
      storage: createMemoryStorage(),
      transitionDelayMs: 3000,
      onChange
    });

    questSystem.emit({ type: QUEST_EVENT.MOVE, targetId: "player" });

    expect(questSystem.getActiveQuest().id).toBe("learn-to-move");
    expect(questSystem.getActiveQuest().status).toBe("completed");
    expect(questSystem.getQuest("wake-guide").status).toBe("locked");

    vi.advanceTimersByTime(2999);
    expect(questSystem.getActiveQuest().id).toBe("learn-to-move");

    vi.advanceTimersByTime(1);
    expect(questSystem.getActiveQuest().id).toBe("wake-guide");
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        reason: "quest-activated",
        activeQuest: expect.objectContaining({ id: "wake-guide" })
      })
    );

    vi.useRealTimers();
  });

  it("counts restoration progress that happens during the next-task transition", () => {
    vi.useFakeTimers();
    const questSystem = createQuestSystem({
      quests: SMALL_ISLAND_QUESTS,
      storage: createMemoryStorage(),
      transitionDelayMs: 3000
    });

    questSystem.activateQuest("open-the-water-route");
    questSystem.emit({ type: QUEST_EVENT.UNLOCK, targetId: "waterGun" });

    expect(questSystem.getActiveQuest().id).toBe("open-the-water-route");
    expect(questSystem.getActiveQuest().status).toBe("completed");

    questSystem.emit({ type: QUEST_EVENT.BUILD, targetId: "revived-grass" });

    expect(questSystem.getQuest("water-dry-grass").status).toBe("locked");
    expect(questSystem.getQuest("water-dry-grass").objectives[0].current).toBe(1);

    vi.advanceTimersByTime(3000);

    expect(questSystem.getActiveQuest().id).toBe("water-dry-grass");
    expect(questSystem.getActiveQuest().objectives[0].current).toBe(1);

    vi.useRealTimers();
  });

  it("advances the vertical slice through gameplay events", () => {
    const questSystem = createQuestSystem({
      quests: SMALL_ISLAND_QUESTS,
      storage: createMemoryStorage()
    });

    expect(questSystem.getActiveQuest().id).toBe("learn-to-move");

    questSystem.emit({ type: QUEST_EVENT.MOVE, targetId: "player" });
    expect(questSystem.getActiveQuest().id).toBe("wake-guide");
    questSystem.emit({ type: QUEST_EVENT.TALK, targetId: "tangrowth" });
    expect(questSystem.getActiveQuest().id).toBe("gather-first-supplies");

    questSystem.emit({ type: QUEST_EVENT.COLLECT, targetId: "wood", amount: 2 });
    expect(questSystem.getActiveQuest().id).toBe("gather-first-supplies");
    questSystem.emit({ type: QUEST_EVENT.COLLECT, targetId: "wood", amount: 1 });
    expect(questSystem.getActiveQuest().id).toBe("shape-a-living-patch");

    questSystem.emit({ type: QUEST_EVENT.BUILD, targetId: "revived-habitat" });
    expect(questSystem.getActiveQuest().id).toBe("record-a-memory");

    questSystem.emit({ type: QUEST_EVENT.PHOTO, targetId: "first-memory" });
    expect(questSystem.getActiveQuest().id).toBe("open-the-water-route");

    questSystem.emit({ type: QUEST_EVENT.UNLOCK, targetId: "waterGun" });
    expect(questSystem.getActiveQuest().id).toBe("water-dry-grass");
    expect(questSystem.hasUnlocked("water-restoration")).toBe(true);

    questSystem.emit({ type: QUEST_EVENT.BUILD, targetId: "revived-grass", amount: 10 });
    expect(questSystem.getActiveQuest().id).toBe("inspect-rustling-grass");
    expect(questSystem.hasUnlocked("dry-grass-request-complete")).toBe(true);
    expect(questSystem.hasUnlocked("leafage")).toBe(false);

    questSystem.emit({ type: QUEST_EVENT.TALK, targetId: "leaf-helper" });
    expect(questSystem.getActiveQuest().id).toBe("grow-a-home-patch");
    expect(questSystem.hasUnlocked("leafage")).toBe(true);

    questSystem.emit({ type: QUEST_EVENT.PLACE, targetId: "leafy-home-patch" });
    expect(questSystem.getActiveQuest().id).toBe("chopper-first-habitat-report");
    expect(questSystem.hasUnlocked("first-helper-home")).toBe(true);

    questSystem.emit({ type: QUEST_EVENT.TALK, targetId: "chopper-first-habitat-report" });
    expect(questSystem.getActiveQuest()).toBeNull();
    expect(questSystem.hasUnlocked("first-habitat-path")).toBe(true);
  });

  it("can opt a later objective into remembered progress when the quest explicitly allows it", () => {
    const quests = cloneQuests();
    quests[1] = {
      ...quests[1],
      id: "optional-remembered-wood",
      objectives: [
        {
          type: QUEST_EVENT.COLLECT,
          targetId: "wood",
          required: 3,
          current: 0,
          acceptsRememberedProgress: true
        }
      ],
      nextQuestId: null
    };
    quests[0] = {
      ...quests[0],
      nextQuestId: "optional-remembered-wood"
    };

    const questSystem = createQuestSystem({
      quests,
      storage: createMemoryStorage()
    });

    questSystem.emit({ type: QUEST_EVENT.COLLECT, targetId: "wood", amount: 3 });
    questSystem.emit({ type: QUEST_EVENT.MOVE, targetId: "player" });

    expect(questSystem.getActiveQuest()).toBeNull();
    expect(questSystem.getQuest("optional-remembered-wood").status).toBe("completed");
  });

  it("loads persisted quest state", () => {
    const storage = createMemoryStorage();
    const firstSystem = createQuestSystem({
      quests: SMALL_ISLAND_QUESTS,
      storage
    });

    firstSystem.emit({ type: QUEST_EVENT.MOVE, targetId: "player" });

    const onChange = vi.fn();
    const secondSystem = createQuestSystem({
      quests: SMALL_ISLAND_QUESTS,
      storage,
      onChange
    });

    expect(secondSystem.getActiveQuest().id).toBe("wake-guide");
    expect(secondSystem.getQuest("learn-to-move").status).toBe("completed");
    expect(onChange).not.toHaveBeenCalled();
  });
});
