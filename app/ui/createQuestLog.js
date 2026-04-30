import {
  FIELD_TASK_IDS,
  SMALL_ISLAND_FIELD_TASKS
} from "../story/storyBeatData.js";

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
    waterGun: "Water Gun",
    "revived-grass": "Dry Tall Grass",
    "leaf-helper": "Leaf helper",
    "leafy-home-patch": "Leafy home patch"
  };

  return `${actionLabels[objective.type] || objective.type}: ${targetLabels[objective.targetId] || objective.targetId || "Any"}`;
}

function formatQuestSummary(quest) {
  const guidance = quest.guidance ? ` Next: ${quest.guidance}` : "";
  return `${quest.title}. ${quest.description}${guidance}`;
}

function renderQuestSummaryHtml(quest) {
  if (!quest) {
    return `
      <div class="hud-task-title">Free Roam</div>
      <div class="hud-task-subtitle">Keep restoring the island and checking in with helpers.</div>
    `;
  }

  return `
    <div class="hud-task-title">${escapeHtml(quest.title)}</div>
    <div class="hud-task-subtitle">${escapeHtml(quest.description)}</div>
    ${quest.guidance ? `<div class="hud-task-guidance">Next: ${escapeHtml(quest.guidance)}</div>` : ""}
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

function getDerivedTrackedTaskIds(storyState = {}) {
  const flags = storyState.flags || {};
  const derivedTaskIds = [];

  if (
    flags.bulbasaurRevealed &&
    !flags.bulbasaurDryGrassMissionAccepted
  ) {
    derivedTaskIds.push(FIELD_TASK_IDS.BULBASAUR_DRY_GRASS_REQUEST);
  } else if (
    flags.bulbasaurDryGrassMissionAccepted &&
    !flags.bulbasaurDryGrassMissionComplete
  ) {
    derivedTaskIds.push(FIELD_TASK_IDS.WATER_DRY_TALL_GRASS);
  } else if (
    flags.bulbasaurDryGrassMissionAccepted &&
    flags.bulbasaurDryGrassMissionComplete &&
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
    flags.squirtleLeppaRequestAvailable &&
    !flags.leppaBerryGiftComplete
  ) {
    derivedTaskIds.push(FIELD_TASK_IDS.GIVE_LEPPA_BERRY);
  }

  return derivedTaskIds;
}

function getTrackedTaskEntries(storyState = {}) {
  const taskIds = Array.isArray(storyState.flags?.trackedTaskIds) ?
    storyState.flags.trackedTaskIds :
    [];
  const trackedTaskIds = [...taskIds];

  for (const taskId of getDerivedTrackedTaskIds(storyState)) {
    if (!trackedTaskIds.includes(taskId)) {
      trackedTaskIds.push(taskId);
    }
  }

  return trackedTaskIds
    .map((taskId, index) => ({
      index,
      task: SMALL_ISLAND_FIELD_TASKS[taskId]
    }))
    .filter((entry) => Boolean(entry.task));
}

function isTrackedTaskDone(storyState = {}, task) {
  return Boolean(task?.completeFlag && storyState.flags?.[task.completeFlag]);
}

function getTrackedTasks(storyState = {}) {
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
    })
    .map((entry) => entry.task);
}

function getTrackedTaskDescription(storyState = {}, task) {
  if (typeof task?.description === "function") {
    return task.description(storyState);
  }

  return task?.description || "";
}

function renderTrackedTaskChecklistHtml(storyState = {}) {
  return getTrackedTasks(storyState).map((task) => {
    const done = isTrackedTaskDone(storyState, task);
    const description = getTrackedTaskDescription(storyState, task);

    return `
      <div
        class="hud-checklist__item hud-checklist__item--tracked"
        data-done="${done ? "true" : "false"}"
        data-objective-type="TRACKED_TASK"
      >
        <span class="hud-checklist__box" aria-hidden="true"></span>
        <span class="hud-checklist__content">
          <strong class="hud-checklist__task-title">${escapeHtml(task.title)}</strong>
          <span class="hud-checklist__task-copy">${escapeHtml(description)}</span>
        </span>
      </div>
    `;
  }).join("");
}

function renderMissionCardHtml({ eyebrow, title, copy, metaHtml = "", done = false, taskId = "" }) {
  return `
    <article
      class="mission-card"
      data-task-done="${done ? "true" : "false"}"
      ${taskId ? `data-task-id="${escapeHtml(taskId)}"` : ""}
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

  return renderMissionCardHtml({
    eyebrow: quest.status,
    title: quest.title,
    copy: formatQuestSummary(quest),
    done,
    taskId: quest.id,
    metaHtml: quest.objectives.map((objective) => `
      <span>${escapeHtml(formatObjectiveLabel(objective))} ${escapeHtml(formatQuestObjective(objective))}</span>
    `).join("")
  });
}

function renderTrackedTaskCardHtml(storyState = {}, task) {
  return renderMissionCardHtml({
    eyebrow: task.eyebrow || (task.background ? "field note" : "tracked"),
    title: task.title,
    copy: getTrackedTaskDescription(storyState, task),
    done: isTrackedTaskDone(storyState, task),
    taskId: task.id
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

  function renderChecklistHtml(storyState = {}) {
    const quest = getActiveQuest();
    const activeQuestHtml = quest ? quest.objectives.map((objective) => {
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
    }).join("") : "";

    return `${activeQuestHtml}${renderTrackedTaskChecklistHtml(storyState)}`;
  }

  function renderLogHtml(storyState = {}) {
    if (!questSystem?.getQuestLog) {
      return "";
    }

    const questLog = questSystem.getQuestLog();
    const activeQuest = getActiveQuest();
    const activeQuestCardsHtml = activeQuest ? renderQuestMissionCardHtml(activeQuest) : "";
    const remainingQuestCardsHtml = questLog
      .filter((quest) => quest.id !== activeQuest?.id)
      .map(renderQuestMissionCardHtml)
      .join("");
    const trackedCardsHtml = getTrackedTasks(storyState)
      .map((task) => renderTrackedTaskCardHtml(storyState, task))
      .join("");

    return `${activeQuestCardsHtml}${trackedCardsHtml}${remainingQuestCardsHtml}`;
  }

  return {
    renderActiveSummary,
    renderActiveSummaryHtml,
    renderChecklistHtml,
    renderLogHtml
  };
}
