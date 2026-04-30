import { QUEST_STATUS } from "./questData.js";
import {
  assertImmutableFirstQuest,
  shouldResetToImmutableFirstQuest
} from "./questFlowGuards.js";

const DEFAULT_STORAGE_KEY = "small-island.quest-state.v6";

function cloneObjective(objective) {
  return {
    ...objective,
    current: Math.max(0, Number(objective.current || 0))
  };
}

function cloneQuest(quest) {
  return {
    ...quest,
    objectives: (quest.objectives || []).map(cloneObjective),
    rewards: {
      unlocks: [...(quest.rewards?.unlocks || [])],
      items: [...(quest.rewards?.items || [])]
    }
  };
}

function createInitialState(quests) {
  const questState = {};
  for (const quest of quests) {
    questState[quest.id] = cloneQuest(quest);
  }

  const activeQuest =
    Object.values(questState).find((quest) => quest.status === QUEST_STATUS.ACTIVE) ||
    Object.values(questState).find((quest) => quest.status === QUEST_STATUS.AVAILABLE);

  if (activeQuest && activeQuest.status === QUEST_STATUS.AVAILABLE) {
    activeQuest.status = QUEST_STATUS.ACTIVE;
  }

  return {
    activeQuestId: activeQuest?.id || null,
    eventTotals: {},
    unlocked: [],
    completedQuestIds: [],
    quests: questState
  };
}

function safeReadStorage(storage, key) {
  try {
    const raw = storage?.getItem?.(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function safeWriteStorage(storage, key, state) {
  try {
    storage?.setItem?.(key, JSON.stringify(state));
  } catch {
    // Persistence is optional; gameplay should keep running if storage is unavailable.
  }
}

function objectiveMatchesEvent(objective, event) {
  return objective.type === event.type &&
    (!objective.targetId || objective.targetId === event.targetId);
}

function isQuestComplete(quest) {
  return quest.objectives.every((objective) => objective.current >= objective.required);
}

function enforceFirstQuestInvariant(state, quests) {
  if (!shouldResetToImmutableFirstQuest(state, quests)) {
    return state;
  }

  return createInitialState(quests);
}

function mergePersistedState(baseState, persistedState, quests) {
  if (!persistedState?.quests) {
    return baseState;
  }

  const nextState = {
    ...baseState,
    activeQuestId: persistedState.activeQuestId || baseState.activeQuestId,
    eventTotals: persistedState.eventTotals && typeof persistedState.eventTotals === "object" ?
      { ...persistedState.eventTotals } :
      {},
    unlocked: Array.isArray(persistedState.unlocked) ? [...persistedState.unlocked] : [],
    completedQuestIds: Array.isArray(persistedState.completedQuestIds) ?
      [...persistedState.completedQuestIds] :
      []
  };

  for (const [questId, persistedQuest] of Object.entries(persistedState.quests)) {
    const baseQuest = nextState.quests[questId];
    if (!baseQuest) {
      continue;
    }

    nextState.quests[questId] = {
      ...baseQuest,
      status: persistedQuest.status || baseQuest.status,
      objectives: baseQuest.objectives.map((objective, index) => ({
        ...objective,
        current: Math.min(
          objective.required,
          Math.max(0, Number(persistedQuest.objectives?.[index]?.current || 0))
        )
      }))
    };
  }

  return enforceFirstQuestInvariant(nextState, quests);
}

export function createQuestSystem({
  quests,
  storage = null,
  storageKey = DEFAULT_STORAGE_KEY,
  transitionDelayMs = 0,
  onChange = () => {}
} = {}) {
  if (!Array.isArray(quests) || quests.length === 0) {
    throw new Error("QuestSystem requires at least one quest.");
  }
  assertImmutableFirstQuest(quests);

  let state = mergePersistedState(
    createInitialState(quests),
    safeReadStorage(storage, storageKey),
    quests
  );
  let pendingTransitionTimer = null;

  function persist() {
    safeWriteStorage(storage, storageKey, state);
  }

  function notify(reason, payload = {}) {
    persist();
    onChange({
      reason,
      payload,
      activeQuest: getActiveQuest(),
      questLog: getQuestLog()
    });
  }

  function getQuest(id) {
    return state.quests[id] || null;
  }

  function getActiveQuest() {
    return state.activeQuestId ? getQuest(state.activeQuestId) : null;
  }

  function getQuestLog() {
    return Object.values(state.quests);
  }

  function getEventKey(event) {
    return `${event.type}:${event.targetId || "*"}`;
  }

  function rememberEvent(event) {
    const key = getEventKey(event);
    const amount = Math.max(1, Number(event.amount || 1));
    state.eventTotals[key] = (state.eventTotals[key] || 0) + amount;
  }

  function getRememberedAmountForObjective(objective) {
    return state.eventTotals[`${objective.type}:${objective.targetId || "*"}`] || 0;
  }

  function applyRememberedEvents(quest) {
    let changed = false;

    for (const objective of quest.objectives) {
      if (objective.acceptsRememberedProgress !== true) {
        continue;
      }

      const rememberedAmount = getRememberedAmountForObjective(objective);
      if (rememberedAmount <= objective.current) {
        continue;
      }

      objective.current = Math.min(objective.required, rememberedAmount);
      changed = true;
    }

    return changed;
  }

  function activateQuest(questId) {
    const quest = getQuest(questId);
    if (!quest || quest.status === QUEST_STATUS.COMPLETED) {
      return false;
    }

    const currentActive = getActiveQuest();
    if (currentActive && currentActive.id !== questId && currentActive.status === QUEST_STATUS.ACTIVE) {
      currentActive.status = QUEST_STATUS.AVAILABLE;
    }

    quest.status = QUEST_STATUS.ACTIVE;
    state.activeQuestId = quest.id;
    applyRememberedEvents(quest);
    if (isQuestComplete(quest)) {
      completeQuest(quest);
    }
    return true;
  }

  function clearPendingTransition() {
    if (!pendingTransitionTimer) {
      return;
    }

    clearTimeout(pendingTransitionTimer);
    pendingTransitionTimer = null;
  }

  function activateNextQuestAfterCompletion(completedQuest) {
    if (!completedQuest.nextQuestId) {
      state.activeQuestId = null;
      return;
    }

    if (transitionDelayMs <= 0) {
      activateQuest(completedQuest.nextQuestId);
      return;
    }

    clearPendingTransition();
    state.activeQuestId = completedQuest.id;
    pendingTransitionTimer = setTimeout(() => {
      pendingTransitionTimer = null;
      if (state.activeQuestId !== completedQuest.id) {
        return;
      }

      activateQuest(completedQuest.nextQuestId);
      notify("quest-activated", {
        previousQuestId: completedQuest.id,
        activeQuestId: completedQuest.nextQuestId
      });
    }, transitionDelayMs);
  }

  function completeQuest(quest) {
    quest.status = QUEST_STATUS.COMPLETED;
    if (!state.completedQuestIds.includes(quest.id)) {
      state.completedQuestIds.push(quest.id);
    }

    for (const unlockId of quest.rewards?.unlocks || []) {
      if (!state.unlocked.includes(unlockId)) {
        state.unlocked.push(unlockId);
      }
    }

    activateNextQuestAfterCompletion(quest);
  }

  function applyEventToQuest(quest, event, amount) {
    let questChanged = false;

    for (const objective of quest.objectives) {
      if (!objectiveMatchesEvent(objective, event) || objective.current >= objective.required) {
        continue;
      }

      objective.current = Math.min(objective.required, objective.current + amount);
      questChanged = true;
    }

    return questChanged;
  }

  function emit(event) {
    if (!event?.type) {
      return { changed: false, completedQuestIds: [] };
    }

    const amount = Math.max(1, Number(event.amount || 1));
    const completedQuestIds = [];
    let changed = false;
    rememberEvent({ ...event, amount });

    for (let guard = 0; guard < quests.length; guard += 1) {
      const quest = getActiveQuest();
      if (!quest) {
        break;
      }

      if (quest.status !== QUEST_STATUS.ACTIVE) {
        const nextQuest = quest.status === QUEST_STATUS.COMPLETED && quest.nextQuestId ?
          getQuest(quest.nextQuestId) :
          null;

        if (nextQuest && nextQuest.status === QUEST_STATUS.LOCKED) {
          const nextQuestChanged = applyEventToQuest(nextQuest, event, amount);
          changed = nextQuestChanged || changed;
        }

        break;
      }

      const questChanged = applyEventToQuest(quest, event, amount);
      changed = questChanged || changed;

      if (!questChanged || !isQuestComplete(quest)) {
        break;
      }

      completedQuestIds.push(quest.id);
      completeQuest(quest);
      changed = true;
    }

    if (changed) {
      notify(completedQuestIds.length ? "quest-progress-completed" : "quest-progress", {
        event,
        completedQuestIds
      });
    } else {
      persist();
    }

    return { changed, completedQuestIds };
  }

  function reset() {
    clearPendingTransition();
    state = createInitialState(quests);
    notify("reset");
  }

  return {
    activateQuest,
    emit,
    getActiveQuest,
    getQuest,
    getQuestLog,
    getState() {
      return state;
    },
    hasUnlocked(unlockId) {
      return state.unlocked.includes(unlockId);
    },
    reset
  };
}
