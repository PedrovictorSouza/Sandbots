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

  function renderChecklistHtml() {
    const quest = getActiveQuest();
    if (!quest) {
      return "";
    }

    return quest.objectives.map((objective) => {
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
    }).join("");
  }

  function renderLogHtml() {
    if (!questSystem?.getQuestLog) {
      return "";
    }

    return questSystem.getQuestLog().map((quest) => `
      <article
        class="mission-card"
        data-quest-status="${escapeHtml(quest.status)}"
        data-quest-id="${escapeHtml(quest.id)}"
      >
        <div class="mission-card__eyebrow">${escapeHtml(quest.status)}</div>
        <div class="mission-card__title">${escapeHtml(quest.title)}</div>
        <div class="mission-card__copy">${escapeHtml(formatQuestSummary(quest))}</div>
        <div class="mission-card__meta">
          ${quest.objectives.map((objective) => `
            <span>${escapeHtml(formatObjectiveLabel(objective))} ${escapeHtml(formatQuestObjective(objective))}</span>
          `).join("")}
        </div>
      </article>
    `).join("");
  }

  return {
    renderActiveSummary,
    renderActiveSummaryHtml,
    renderChecklistHtml,
    renderLogHtml
  };
}
