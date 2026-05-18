import { FIELD_ABILITY_COSTS } from "../gameplay/content/fieldAbilityCosts.ts";
import { FIELD_TASK_IDS, SMALL_ISLAND_FIELD_TASKS } from "./storyBeatData.js";
import { QUEST_EVENT } from "../quest/questData.js";
import { STORY_QUESTS } from "../../gameplayContent.js";

export const PROGRESSION_DIAGNOSTIC_WARNING = Object.freeze({
  DETACHED_SYSTEM_QUEST_ACTIVE: "detached-system-quest-active",
  PARALLEL_HYDRO_QUESTS: "parallel-hydro-quests",
  QUEST_COPY_ACTION_MISMATCH: "quest-copy-action-mismatch",
  WATERGUN_UNLOCKED_HYDRO_ACTIVE: "watergun-unlocked-hydro-active",
  FIELD_ABILITY_COST_DISCONNECTED: "field-ability-cost-disconnected",
  DUPLICATE_DRY_GRASS_TRACKING: "duplicate-dry-grass-tracking",
});

const HYDRO_SYSTEM_QUEST_IDS = new Set([
  "gather-first-supplies",
  "open-the-water-route",
]);

const HYDRO_LEGACY_QUEST_IDS = new Set(["findPokemon"]);

const DEFAULT_RUNTIME_FIELD_ABILITY_COST_KINDS = Object.freeze({
  fire: "materialCharges",
  leafage: "none",
  waterGun: "stamina",
});

function getFlags(storyState = {}) {
  return storyState.flags && typeof storyState.flags === "object" ? storyState.flags : {};
}

function resolveSystemQuest({ systemQuest = null, questSystem = null } = {}) {
  if (systemQuest) return systemQuest;
  if (questSystem && typeof questSystem.getActiveQuest === "function") {
    return questSystem.getActiveQuest();
  }
  return null;
}

function resolveLegacyQuest(storyState = {}, legacyQuests = STORY_QUESTS) {
  const questIndex = Number.isFinite(storyState.questIndex) ? storyState.questIndex : 0;
  const quest = legacyQuests[questIndex] ?? null;
  if (!quest) return null;
  return {
    id: quest.id,
    title: quest.title,
    index: questIndex,
  };
}

function isFieldTaskComplete(storyState, task) {
  const flags = getFlags(storyState);
  if (task?.completeFlag && flags[task.completeFlag]) return true;
  if (typeof task?.isComplete === "function") return Boolean(task.isComplete(storyState));
  return false;
}

function listActiveFieldTasks(storyState = {}, fieldTasks = SMALL_ISLAND_FIELD_TASKS) {
  const flags = getFlags(storyState);
  const trackedTaskIds = Array.isArray(flags.trackedTaskIds) ? flags.trackedTaskIds : [];
  const taskList = Array.isArray(fieldTasks) ? fieldTasks : Object.values(fieldTasks ?? {});

  return trackedTaskIds
    .map((taskId) => taskList.find((task) => task.id === taskId))
    .filter(Boolean)
    .map((task) => ({
      id: task.id,
      title: task.title,
      done: isFieldTaskComplete(storyState, task),
    }))
    .filter((task) => !task.done);
}

function listUnlockedSkills(playerSkills = {}) {
  return Object.entries(playerSkills)
    .filter(([, unlocked]) => Boolean(unlocked))
    .map(([skillId]) => skillId)
    .sort();
}

function summarizeQuest(quest) {
  if (!quest) return null;
  return {
    id: quest.id,
    title: quest.title,
    detached: Boolean(quest.detached),
    status: quest.status ?? null,
  };
}

function getQuestVisibleCopy(quest) {
  return [
    quest?.title,
    quest?.description,
    quest?.guidance,
    quest?.errandQuest?.hudText,
    quest?.errandQuest?.instructionText
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function hasOnlyWaterGunUnlockObjective(quest) {
  const objectives = Array.isArray(quest?.objectives) ? quest.objectives : [];
  return (
    objectives.length > 0 &&
    objectives.every(
      (objective) =>
        objective?.type === QUEST_EVENT.UNLOCK && objective.targetId === "waterGun",
    )
  );
}

function createWarning(code, message, details = {}) {
  return {
    code,
    severity: "warning",
    message,
    details,
  };
}

function collectFieldAbilityCostWarnings({
  fieldAbilityCosts = FIELD_ABILITY_COSTS,
  runtimeAbilityCostKinds = DEFAULT_RUNTIME_FIELD_ABILITY_COST_KINDS,
} = {}) {
  return Object.entries(runtimeAbilityCostKinds)
    .map(([abilityId, runtimeKind]) => {
      const declaredKind = fieldAbilityCosts?.[abilityId]?.cost?.kind ?? "none";
      if (declaredKind === runtimeKind) return null;
      return createWarning(
        PROGRESSION_DIAGNOSTIC_WARNING.FIELD_ABILITY_COST_DISCONNECTED,
        `${abilityId} has a data cost of ${declaredKind}, but runtime behavior appears to use ${runtimeKind}.`,
        { abilityId, declaredKind, runtimeKind },
      );
    })
    .filter(Boolean);
}

export function createProgressionDiagnostics({
  systemQuest = null,
  questSystem = null,
  storyState = {},
  playerSkills = {},
  fieldAbilityCosts = FIELD_ABILITY_COSTS,
  runtimeAbilityCostKinds = DEFAULT_RUNTIME_FIELD_ABILITY_COST_KINDS,
  legacyQuests = STORY_QUESTS,
  fieldTasks = SMALL_ISLAND_FIELD_TASKS,
} = {}) {
  const resolvedSystemQuest = resolveSystemQuest({ systemQuest, questSystem });
  const legacyQuest = resolveLegacyQuest(storyState, legacyQuests);
  const activeFieldTasks = listActiveFieldTasks(storyState, fieldTasks);
  const unlockedSkills = listUnlockedSkills(playerSkills);

  const warnings = [];

  if (resolvedSystemQuest?.detached) {
    warnings.push(
      createWarning(
        PROGRESSION_DIAGNOSTIC_WARNING.DETACHED_SYSTEM_QUEST_ACTIVE,
        `${resolvedSystemQuest.title} is marked detached but is currently active.`,
        { questId: resolvedSystemQuest.id },
      ),
    );
  }

  if (
    HYDRO_SYSTEM_QUEST_IDS.has(resolvedSystemQuest?.id) &&
    HYDRO_LEGACY_QUEST_IDS.has(legacyQuest?.id)
  ) {
    warnings.push(
      createWarning(
        PROGRESSION_DIAGNOSTIC_WARNING.PARALLEL_HYDRO_QUESTS,
        "Hydro progression is represented by both the system quest chain and the legacy questIndex chain.",
        {
          systemQuestId: resolvedSystemQuest.id,
          legacyQuestId: legacyQuest.id,
        },
      ),
    );
  }

  if (resolvedSystemQuest?.id === "gather-first-supplies") {
    const visibleCopy = getQuestVisibleCopy(resolvedSystemQuest);
    const mentionsOldTask =
      visibleCopy.includes("scan") ||
      visibleCopy.includes("warm wood") ||
      visibleCopy.includes("heat signature");

    if (mentionsOldTask && hasOnlyWaterGunUnlockObjective(resolvedSystemQuest)) {
      warnings.push(
        createWarning(
          PROGRESSION_DIAGNOSTIC_WARNING.QUEST_COPY_ACTION_MISMATCH,
          "Wake Up Hydro still describes scanning or warm wood, but its objective resolves from Hydro Jet unlock.",
          { questId: resolvedSystemQuest.id },
        ),
      );
    }

    if (playerSkills?.waterGun) {
      warnings.push(
        createWarning(
          PROGRESSION_DIAGNOSTIC_WARNING.WATERGUN_UNLOCKED_HYDRO_ACTIVE,
          "Hydro Jet is already unlocked while Wake Up Hydro is still active.",
          { questId: resolvedSystemQuest.id, skillId: "waterGun" },
        ),
      );
    }
  }

  if (
    resolvedSystemQuest?.id === "water-dry-grass" &&
    activeFieldTasks.some((task) => task.id === FIELD_TASK_IDS.WATER_DRY_TALL_GRASS)
  ) {
    warnings.push(
      createWarning(
        PROGRESSION_DIAGNOSTIC_WARNING.DUPLICATE_DRY_GRASS_TRACKING,
        "Dry grass restoration is tracked by both the quest chain and field task HUD data.",
        {
          questId: resolvedSystemQuest.id,
          fieldTaskId: FIELD_TASK_IDS.WATER_DRY_TALL_GRASS,
        },
      ),
    );
  }

  warnings.push(
    ...collectFieldAbilityCostWarnings({
      fieldAbilityCosts,
      runtimeAbilityCostKinds,
    }),
  );

  return {
    systemQuest: summarizeQuest(resolvedSystemQuest),
    legacyQuest,
    activeFieldTasks,
    unlockedSkills,
    warnings,
  };
}

export function getProgressionDiagnosticWarningCodes(diagnostics) {
  return (diagnostics?.warnings ?? []).map((warning) => warning.code);
}
