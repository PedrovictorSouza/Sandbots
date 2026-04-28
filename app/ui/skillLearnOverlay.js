const DEFAULT_DURATION_MS = 2300;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function createSpark(index) {
  const spark = document.createElement("span");
  spark.className = "skill-learn-overlay__spark";
  spark.style.setProperty("--spark-index", String(index));
  spark.style.setProperty("--spark-angle", `${index * 32}deg`);
  spark.style.setProperty("--spark-distance", `${120 + (index % 4) * 32}px`);
  spark.style.setProperty("--spark-delay", `${(index % 5) * 0.045}s`);
  return spark;
}

export function createSkillLearnOverlay({
  root,
  durationMs = DEFAULT_DURATION_MS,
  clearGameFlowInput = () => {}
} = {}) {
  if (!(root instanceof HTMLElement)) {
    throw new Error("Skill learn overlay requires a valid root element.");
  }

  const state = {
    active: false,
    timeoutId: 0
  };

  function clearTimer() {
    if (!state.timeoutId) {
      return;
    }

    clearTimeout(state.timeoutId);
    state.timeoutId = 0;
  }

  function hide() {
    clearTimer();
    state.active = false;
    root.hidden = true;
    root.dataset.active = "false";
    root.innerHTML = "";
  }

  function play({
    title = "YOU LEARNED",
    skillName = "WATER GUN!",
    note = "Hold X to restore the island's dry ground."
  } = {}) {
    hide();
    clearGameFlowInput();
    state.active = true;
    root.hidden = false;
    root.dataset.active = "true";
    root.innerHTML = `
      <div class="skill-learn-overlay__environment" aria-hidden="true">
        <span class="skill-learn-overlay__ring skill-learn-overlay__ring--outer"></span>
        <span class="skill-learn-overlay__ring skill-learn-overlay__ring--inner"></span>
        <span class="skill-learn-overlay__player-burst"></span>
      </div>
      <div class="skill-learn-overlay__card" role="status" aria-live="assertive">
        <span class="skill-learn-overlay__eyebrow">${escapeHtml(title)}</span>
        <strong>${escapeHtml(skillName)}</strong>
        <span class="skill-learn-overlay__note">${escapeHtml(note)}</span>
      </div>
    `;

    const environment = root.querySelector(".skill-learn-overlay__environment");
    for (let index = 0; index < 18; index += 1) {
      environment?.append(createSpark(index));
    }

    return new Promise((resolve) => {
      state.timeoutId = setTimeout(() => {
        hide();
        resolve();
      }, durationMs);
    });
  }

  hide();

  return {
    hide,
    isActive() {
      return state.active;
    },
    play
  };
}
