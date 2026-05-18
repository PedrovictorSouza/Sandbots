import {
  FIELD_TASK_IDS,
  SMALL_ISLAND_FIELD_TASKS
} from "../story/storyBeatData.js";
import {
  getCharmanderDerivedTaskId,
  shouldHideTrackedTaskForProgressionPrerequisite
} from "../story/progressionContracts.js";
import {
  getErrandQuestHudText,
  getErrandQuestInstructionText
} from "../quest/errandQuestDesign.js";
import { SANDBOTS_ITEM_NAMES } from "../story/sandbotsLexicon.js";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatQuestObjective(objective) {
  const current = Math.min(objective.current || 0, objective.required || 1);
  return `${current}/${objective.required}`;
}

function formatObjectiveLabel(objective) {
  const actionLabels = {
    MOVE: "Move",
    TALK: "Talk",
    COLLECT: "Collect",
    PLACE: "Place",
    BUILD: "Build",
    PHOTO: "Photo",
    UNLOCK: "Unlock"
  };
  const targetLabels = {
    player: "Player",
    tangrowth: "Chopper",
    wood: "Wood",
    "revived-habitat": "Restored patch",
    "first-memory": "Memory photo",
    waterGun: SANDBOTS_ITEM_NAMES.hydroTool,
    "revived-grass": "Dry Tall Grass",
    "leaf-helper": "Leaf helper",
    "leafy-home-patch": "Leafy home patch"
  };

  return `${actionLabels[objective.type] || objective.type}: ${targetLabels[objective.targetId] || objective.targetId || "Any"}`;
}

function formatQuestSummary(quest) {
  return `${quest.title}. ${getQuestSummaryCopy(quest)}`;
}

function getQuestSummaryCopy(quest) {
  return quest?.errandQuest ?
    getErrandQuestInstructionText(quest) || getErrandQuestHudText(quest) :
    quest?.description || "";
}

function getQuestSubtitleCopy(quest) {
  if (!quest) {
    return "";
  }

  if (quest.errandQuest) {
    return quest.errandQuest.hudSubtitle || quest.errandQuest.subtitle || "";
  }

  return quest.description || "";
}

function renderQuestSummaryHtml(quest) {
  if (!quest) {
    return `
      <div class="hud-task-title">Free Roam</div>
      <div class="hud-task-subtitle">Keep restoring the island and checking in with helpers.</div>
    `;
  }

  const subtitle = getQuestSubtitleCopy(quest);

  return `
    <div class="hud-task-title">${escapeHtml(quest.title)}</div>
    ${subtitle ? `<div class="hud-task-subtitle">${escapeHtml(subtitle)}</div>` : ""}
  `;
}

function renderObjectiveHintHtml(objective) {
  if (objective.type !== "MOVE") {
    return "";
  }

  return `
    <div class="hud-control-hint" aria-label="Movement controls">
      <span class="hud-control-key">W</span>
      <span class="hud-control-key">A</span>
      <span class="hud-control-key">S</span>
      <span class="hud-control-key">D</span>
      <span class="hud-control-stick">Left stick</span>
    </div>
  `;
}

function getHudObjectives(quest) {
  return (quest?.objectives || []).filter((objective) => !objective.hiddenFromHud);
}

function isQuestObjectiveComplete(quest) {
  return (quest?.objectives || []).every((objective) => (
    Number(objective.current || 0) >= Number(objective.required || 1)
  ));
}

function renderErrandHudChecklistHtml(quest) {
  if (!quest?.errandQuest?.hudText) {
    return "";
  }

  return `
    <div
      class="hud-checklist__item"
      data-done="${isQuestObjectiveComplete(quest) ? "true" : "false"}"
      data-objective-type="ERRAND"
    >
      <span class="hud-checklist__box" aria-hidden="true"></span>
      <span class="hud-checklist__content">
        ${escapeHtml(getErrandQuestHudText(quest))}
      </span>
    </div>
  `;
}

function renderErrandChoiceMetaHtml(quest) {
  if (!Array.isArray(quest?.errandQuest?.approachChoices)) {
    return "";
  }

  return quest.errandQuest.approachChoices.map((choice) => {
    const tradeoff = choice.tradeoff || choice.description || "";
    const copy = tradeoff ? `Approach: ${choice.label}: ${tradeoff}` : `Approach: ${choice.label}`;
    return `<span>${escapeHtml(copy)}</span>`;
  }).join("");
}

function renderErrandRewardMetaHtml(quest) {
  const reward = quest?.errandQuest?.visibleReward;
  const rewardCopy = reward?.hudText || reward?.description || "";
  return rewardCopy ? `<span>${escapeHtml(`Reward: ${rewardCopy}`)}</span>` : "";
}

function renderErrandNextHookMetaHtml(quest) {
  const nextHook = quest?.errandQuest?.nextHook || "";
  return nextHook ? `<span>${escapeHtml(`Next signal: ${nextHook}`)}</span>` : "";
}

function renderErrandQuestMetaHtml(quest) {
  return [
    renderErrandChoiceMetaHtml(quest),
    renderErrandRewardMetaHtml(quest),
    renderErrandNextHookMetaHtml(quest)
  ].filter(Boolean).join("");
}

function getDerivedTrackedTaskIds(storyState = {}) {
  const flags = storyState.flags || {};
  const derivedTaskIds = [];
  const dryGrassTaskDone = isTrackedTaskDone(
    storyState,
    SMALL_ISLAND_FIELD_TASKS[FIELD_TASK_IDS.WATER_DRY_TALL_GRASS]
  );
  const openingLeppaTreeRequestPending =
    flags.bulbasaurRevealed &&
    flags.squirtleLeppaRequestAvailable &&
    !flags.leppaTreeRevived &&
    !flags.bulbasaurDryGrassMissionAccepted;

  if (openingLeppaTreeRequestPending) {
    derivedTaskIds.push(FIELD_TASK_IDS.REVIVE_LEPPA_TREE);
  } else if (
    flags.bulbasaurRevealed &&
    !flags.bulbasaurDryGrassMissionAccepted
  ) {
    derivedTaskIds.push(FIELD_TASK_IDS.BULBASAUR_DRY_GRASS_REQUEST);
  } else if (
    flags.bulbasaurDryGrassMissionAccepted &&
    !dryGrassTaskDone
  ) {
    derivedTaskIds.push(FIELD_TASK_IDS.WATER_DRY_TALL_GRASS);
  } else if (
    flags.bulbasaurDryGrassMissionAccepted &&
    dryGrassTaskDone &&
    !flags.bulbasaurDryGrassRequestTurnedIn
  ) {
    derivedTaskIds.push(FIELD_TASK_IDS.BULBASAUR_LEAFAGE_REWARD);
  }

  if (
    flags.bulbasaurDryGrassRequestTurnedIn &&
    !flags.leafageTallGrassHabitatCreated
  ) {
    derivedTaskIds.push(FIELD_TASK_IDS.BULBASAUR_GREEN_CORNER_PLAY_SEED);
  }

  if (
    flags.bulbasaurDryGrassRequestTurnedIn &&
    flags.squirtleLeppaRequestAvailable &&
    !flags.leppaBerryGiftComplete
  ) {
    derivedTaskIds.push(FIELD_TASK_IDS.GIVE_LEPPA_BERRY);
  }

  const charmanderTaskId = getCharmanderDerivedTaskId(storyState);
  if (charmanderTaskId) {
    derivedTaskIds.push(charmanderTaskId);
  }

  return derivedTaskIds;
}

function getTrackedTaskEntries(storyState = {}) {
  const taskIds = Array.isArray(storyState.flags?.trackedTaskIds) ?
    storyState.flags.trackedTaskIds :
    [];
  const flags = storyState.flags || {};
  const trackedTaskIds = taskIds.filter((taskId) => (
    !shouldHideTrackedTaskForProgressionPrerequisite(taskId, flags)
  ));

  for (const taskId of getDerivedTrackedTaskIds(storyState)) {
    if (!trackedTaskIds.includes(taskId)) {
      trackedTaskIds.push(taskId);
    }
  }

  return trackedTaskIds
    .map((taskId, index) => ({
      index,
      taskId,
      task: SMALL_ISLAND_FIELD_TASKS[taskId]
    }))
    .filter((entry) => Boolean(entry.task));
}

function isTrackedTaskDone(storyState = {}, task) {
  return Boolean(
    (typeof task?.isComplete === "function" && task.isComplete(storyState)) ||
    (task?.completeFlag && storyState.flags?.[task.completeFlag])
  );
}

function getTaskIdSet(taskIds) {
  if (taskIds instanceof Set) {
    return taskIds;
  }

  if (Array.isArray(taskIds)) {
    return new Set(taskIds);
  }

  return new Set();
}

function getSortedTrackedTaskEntries(storyState = {}) {
  return getTrackedTaskEntries(storyState)
    .sort((left, right) => {
      const leftDone = isTrackedTaskDone(storyState, left.task);
      const rightDone = isTrackedTaskDone(storyState, right.task);

      if (leftDone !== rightDone) {
        return leftDone ? 1 : -1;
      }

      const leftBackground = Boolean(left.task.background);
      const rightBackground = Boolean(right.task.background);

      if (leftBackground !== rightBackground) {
        return leftBackground ? 1 : -1;
      }

      return right.index - left.index;
    });
}

function getTrackedTaskStates(storyState = {}) {
  return getSortedTrackedTaskEntries(storyState)
    .map((entry) => ({
      ...entry,
      done: isTrackedTaskDone(storyState, entry.task)
    }));
}

function getTrackedTaskRenderEntries(storyState = {}, options = {}) {
  const flashingTaskIds = getTaskIdSet(options.flashingTaskIds);
  const hideCompletedTrackedTasks = Boolean(options.hideCompletedTrackedTasks);

  return getTrackedTaskStates(storyState)
    .map((entry) => ({
      ...entry,
      flashing: entry.done && flashingTaskIds.has(entry.taskId)
    }))
    .filter((entry) => !entry.done || !hideCompletedTrackedTasks || entry.flashing);
}

function getTrackedTaskDescription(storyState = {}, task) {
  if (typeof task?.description === "function") {
    return task.description(storyState);
  }

  return task?.description || "";
}

function getTrackedTaskSubtasks(storyState = {}, task) {
  if (typeof task?.subtasks !== "function") {
    return [];
  }

  const subtasks = task.subtasks(storyState);
  return Array.isArray(subtasks) ? subtasks.filter(Boolean) : [];
}

function renderTrackedTaskSubtasksHtml(storyState = {}, task) {
  const subtasks = getTrackedTaskSubtasks(storyState, task);
  if (!subtasks.length) {
    return "";
  }

  return `
    <span class="hud-checklist__subtasks" style="display:grid;gap:4px;margin-top:7px;">
      ${subtasks.map((subtask) => `
        <span
          class="hud-checklist__subtask"
          data-subtask-id="${escapeHtml(subtask.id || subtask.label || "")}"
          data-done="${subtask.done ? "true" : "false"}"
          style="display:grid;grid-template-columns:14px minmax(0, 1fr);gap:6px;align-items:start;color:${subtask.done ? "#9cffb1" : "var(--game-ui-muted)"};"
        >
          <span
            class="hud-checklist__subtask-box"
            aria-hidden="true"
            style="width:12px;height:12px;margin-top:2px;border:2px solid ${subtask.done ? "#9cffb1" : "#f5c16a"};background:${subtask.done ? "#2a8f45" : "transparent"};box-shadow:0 0 0 2px rgba(0,0,0,.22);"
          ></span>
          <span class="hud-checklist__subtask-copy" style="min-width:0;font-size:16px;line-height:1.08;text-transform:none;">
            ${escapeHtml(subtask.label || "")}${subtask.progress ? ` · ${escapeHtml(subtask.progress)}` : ""}
          </span>
        </span>
      `).join("")}
    </span>
  `;
}

function renderTrackedTaskChecklistHtml(storyState = {}, options = {}) {
  return getTrackedTaskRenderEntries(storyState, options).map((entry) => {
    const description = getTrackedTaskDescription(storyState, entry.task);
    const subtasksHtml = renderTrackedTaskSubtasksHtml(storyState, entry.task);

    return `
      <div
        class="hud-checklist__item hud-checklist__item--tracked"
        data-done="${entry.done ? "true" : "false"}"
        data-objective-type="TRACKED_TASK"
        data-task-flashing="${entry.flashing ? "true" : "false"}"
      >
        <span class="hud-checklist__box" aria-hidden="true"></span>
        <span class="hud-checklist__content">
          <strong class="hud-checklist__task-title">${escapeHtml(entry.task.title)}</strong>
          <span class="hud-checklist__task-copy">${escapeHtml(description)}</span>
          ${subtasksHtml}
        </span>
      </div>
    `;
  }).join("");
}

function renderMissionCardHtml({ eyebrow, title, copy, metaHtml = "", done = false, taskId = "", flashing = false }) {
  const statusCopy = done ? "Complete" : eyebrow;
  const ariaLabel = [statusCopy, title, copy].filter(Boolean).join(": ");
  return `
    <article
      class="mission-card"
      data-task-done="${done ? "true" : "false"}"
      data-task-flashing="${flashing ? "true" : "false"}"
      ${taskId ? `data-task-id="${escapeHtml(taskId)}"` : ""}
      aria-label="${escapeHtml(ariaLabel)}"
    >
      <div class="mission-card__eyebrow">${escapeHtml(eyebrow)}</div>
      <div class="mission-card__header">
        <span class="mission-card__check" aria-hidden="true"></span>
        <div class="mission-card__title">${escapeHtml(title)}</div>
      </div>
      <div class="mission-card__copy">${escapeHtml(copy)}</div>
      ${metaHtml ? `<div class="mission-card__meta">${metaHtml}</div>` : ""}
    </article>
  `;
}

function renderQuestMissionCardHtml(quest) {
  const done = quest.status === "completed";
  const objectiveMetaHtml = getHudObjectives(quest).map((objective) => `
    <span>${escapeHtml(formatObjectiveLabel(objective))} ${escapeHtml(formatQuestObjective(objective))}</span>
  `).join("");

  return renderMissionCardHtml({
    eyebrow: quest.status,
    title: quest.title,
    copy: formatQuestSummary(quest),
    done,
    taskId: quest.id,
    metaHtml: objectiveMetaHtml || renderErrandQuestMetaHtml(quest)
  });
}

function shouldRenderQuestLogCard(quest, activeQuest) {
  if (!quest) {
    return false;
  }

  if (quest.id === activeQuest?.id) {
    return true;
  }

  return !(quest.id === "learn-to-move" && quest.status === "completed");
}

function renderTrackedTaskCardHtml(storyState = {}, entry) {
  return renderMissionCardHtml({
    eyebrow: entry.task.eyebrow || (entry.task.background ? "field note" : "tracked"),
    title: entry.task.title,
    copy: getTrackedTaskDescription(storyState, entry.task),
    done: entry.done,
    flashing: entry.flashing,
    taskId: entry.task.id
  });
}

export function createQuestLog({
  questSystem
} = {}) {
  function getActiveQuest() {
    return questSystem?.getActiveQuest?.() || null;
  }

  function renderActiveSummary() {
    const quest = getActiveQuest();
    if (!quest) {
      return "Free roam. Keep restoring the island and checking in with helpers.";
    }

    return formatQuestSummary(quest);
  }

  function renderActiveSummaryHtml() {
    return renderQuestSummaryHtml(getActiveQuest());
  }

  function renderChecklistHtml(storyState = {}, options = {}) {
    const quest = getActiveQuest();
    const hudObjectives = getHudObjectives(quest);
    const activeQuestHtml = quest && hudObjectives.length > 0 ? hudObjectives.map((objective) => {
      const done = (objective.current || 0) >= objective.required;
      return `
        <div
          class="hud-checklist__item"
          data-done="${done ? "true" : "false"}"
          data-objective-type="${escapeHtml(objective.type)}"
        >
          <span class="hud-checklist__box" aria-hidden="true"></span>
          <span class="hud-checklist__content">
            ${escapeHtml(formatObjectiveLabel(objective))} ${escapeHtml(formatQuestObjective(objective))}
            ${renderObjectiveHintHtml(objective)}
          </span>
        </div>
      `;
    }).join("") : renderErrandHudChecklistHtml(quest);

    return `${activeQuestHtml}${renderTrackedTaskChecklistHtml(storyState, options)}`;
  }

  function renderLogHtml(storyState = {}, options = {}) {
    if (!questSystem?.getQuestLog) {
      return "";
    }

    const questLog = questSystem.getQuestLog();
    const activeQuest = getActiveQuest();
    const activeQuestCardsHtml = shouldRenderQuestLogCard(activeQuest, activeQuest) ?
      renderQuestMissionCardHtml(activeQuest) :
      "";
    const remainingQuestCardsHtml = questLog
      .filter((quest) => quest.id !== activeQuest?.id && shouldRenderQuestLogCard(quest, activeQuest))
      .map(renderQuestMissionCardHtml)
      .join("");
    const trackedCardsHtml = getTrackedTaskRenderEntries(storyState, options)
      .map((entry) => renderTrackedTaskCardHtml(storyState, entry))
      .join("");

    return `${activeQuestCardsHtml}${trackedCardsHtml}${remainingQuestCardsHtml}`;
  }

  return {
    renderActiveSummary,
    renderActiveSummaryHtml,
    renderChecklistHtml,
    renderLogHtml,
    getTrackedTaskStates
  };
}
