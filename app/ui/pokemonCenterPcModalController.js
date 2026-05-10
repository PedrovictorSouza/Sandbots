const EMPTY_MISSION = Object.freeze({
  id: "empty",
  title: "????",
  description: "No mission records found.",
  status: "locked",
  source: "pc"
});

const STATUS_LABELS = Object.freeze({
  active: "Active",
  available: "Available",
  completed: "Complete",
  locked: "????"
});
const STATUS_PALETTES = Object.freeze({
  completed: {
    border: "#89ff00",
    background: "#113820",
    label: "#9cffb1",
    copy: "#d9ffe3"
  },
  todo: {
    border: "#ffd66d",
    background: "#3c300c",
    label: "#ffe28a",
    copy: "#fff0bd"
  },
  locked: {
    border: "#5d6470",
    background: "#181b22",
    label: "#9aa1ad",
    copy: "#aeb6c2"
  }
});
const CENTER_COMPUTER_MUSIC_URL = new URL("../soundFx/center-computer.mp3", import.meta.url).href;
const CENTER_COMPUTER_MUSIC_VOLUME = 0.64;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function createElement(documentRef, tagName, className = "", text = "") {
  const element = documentRef.createElement(tagName);
  if (className) {
    element.className = className;
  }
  if (text) {
    element.textContent = text;
  }
  return element;
}

function normalizeMissions(missions = []) {
  const normalized = Array.isArray(missions) ? missions.filter(Boolean) : [];
  return normalized.length ? normalized : [EMPTY_MISSION];
}

function getMissionPalette(status) {
  if (status === "completed") {
    return STATUS_PALETTES.completed;
  }

  if (status === "locked") {
    return STATUS_PALETTES.locked;
  }

  return STATUS_PALETTES.todo;
}

function getMissionStatusLabel(mission) {
  if (mission?.status === "locked") {
    return "Locked";
  }

  if (mission?.status === "completed") {
    return "Complete";
  }

  if (mission?.actionId) {
    return mission.actionLabel ? "Reward Ready" : "Ready";
  }

  return STATUS_LABELS[mission?.status] || mission?.status || "Available";
}

function getMissionGuidance(mission) {
  if (mission?.status === "locked") {
    return "Recover more mission data to reveal this request.";
  }

  if (mission?.actionId && mission?.actionLabel) {
    return `Press X to ${mission.actionLabel}.`;
  }

  if (mission?.status === "completed") {
    return "Completed and archived in the PC.";
  }

  if (mission?.progress) {
    return `Progress: ${mission.progress}.`;
  }

  return "Follow this request in the world.";
}

function getMissionStats(missions = []) {
  return missions.reduce((stats, mission) => {
    if (mission?.status === "completed") {
      stats.completed += 1;
    } else if (mission?.status === "locked") {
      stats.locked += 1;
    } else if (mission?.actionId) {
      stats.ready += 1;
    } else {
      stats.todo += 1;
    }

    return stats;
  }, {
    completed: 0,
    ready: 0,
    todo: 0,
    locked: 0
  });
}

function getMissionImageSrc(mission) {
  return mission?.imageSrc || mission?.imageUrl || mission?.thumbnailUrl || mission?.artUrl || "";
}

export function createPokemonCenterPcModalController({
  mount,
  clearGameFlowInput = () => {},
  musicSrc = CENTER_COMPUTER_MUSIC_URL,
  musicVolume = CENTER_COMPUTER_MUSIC_VOLUME,
  audioFactory = (src) => {
    if (typeof Audio !== "function") {
      return null;
    }

    return new Audio(src);
  }
} = {}) {
  const documentRef = mount?.ownerDocument || globalThis.document;
  let root = null;
  let musicAudio = null;
  let open = false;
  let missions = [EMPTY_MISSION];
  let selectedMissionIndex = 0;
  let onConfirm = null;

  function getMusicAudio() {
    if (musicAudio || !musicSrc) {
      return musicAudio;
    }

    musicAudio = audioFactory(musicSrc);
    if (!musicAudio) {
      return null;
    }

    musicAudio.preload = "auto";
    musicAudio.loop = true;
    musicAudio.volume = musicVolume;
    return musicAudio;
  }

  function playMusic() {
    const audio = getMusicAudio();
    if (!audio) {
      return;
    }

    audio.loop = true;
    audio.volume = musicVolume;
    try {
      audio.currentTime = 0;
    } catch {
      // Some browser audio objects disallow seeking before metadata is ready.
    }

    const playResult = audio.play?.();
    if (playResult?.catch) {
      playResult.catch(() => {});
    }
  }

  function stopMusic() {
    if (!musicAudio) {
      return;
    }

    musicAudio.pause?.();
    try {
      musicAudio.currentTime = 0;
    } catch {
      // Some browser audio objects disallow seeking before metadata is ready.
    }
  }

  function ensureRoot() {
    if (root || !mount || !documentRef?.createElement) {
      return root;
    }

    root = createElement(documentRef, "section", "pokemon-center-pc-modal");
    root.hidden = true;
    root.setAttribute("aria-label", "Pokemon Center PC missions");
    root.setAttribute("role", "dialog");
    Object.assign(root.style, {
      position: "absolute",
      inset: "0",
      zIndex: "19",
      display: "none",
      placeItems: "center",
      pointerEvents: "auto",
      background: "rgba(5, 8, 18, 0.44)",
      imageRendering: "pixelated"
    });
    mount.append(root);
    return root;
  }

  function selectMissionIndex(index) {
    if (!missions.length) {
      selectedMissionIndex = 0;
      return;
    }

    selectedMissionIndex = (index + missions.length) % missions.length;
  }

  function moveSelection(direction) {
    selectMissionIndex(selectedMissionIndex + direction);
    render();
  }

  function selectInitialMission() {
    const actionableIndex = missions.findIndex((mission) => mission.actionId);
    if (actionableIndex >= 0) {
      selectedMissionIndex = actionableIndex;
      return;
    }

    const readableIndex = missions.findIndex((mission) => mission.status !== "locked");
    selectedMissionIndex = readableIndex >= 0 ? readableIndex : 0;
  }

  function getVisibleMissionIndexes() {
    const visibleCount = Math.min(3, missions.length);
    if (visibleCount <= 0) {
      return [];
    }

    if (missions.length <= visibleCount) {
      return missions.map((_, index) => index);
    }

    if (selectedMissionIndex <= 0) {
      return [0, 1, 2];
    }

    if (selectedMissionIndex >= missions.length - 1) {
      return [
        missions.length - 3,
        missions.length - 2,
        missions.length - 1
      ];
    }

    return [
      selectedMissionIndex - 1,
      selectedMissionIndex,
      selectedMissionIndex + 1
    ];
  }

  function close() {
    if (!root) {
      return false;
    }

    root.hidden = true;
    root.style.display = "none";
    root.replaceChildren();
    open = false;
    onConfirm = null;
    stopMusic();
    clearGameFlowInput();
    return true;
  }

  function confirmSelectedMission() {
    const mission = missions[selectedMissionIndex];
    if (!open || !mission?.actionId || typeof onConfirm !== "function") {
      return false;
    }

    const handled = onConfirm(mission.actionId, mission) !== false;
    if (handled) {
      close();
    }
    return handled;
  }

  function renderDots() {
    return missions.map((mission, index) => {
      const selected = index === selectedMissionIndex;
      const palette = getMissionPalette(mission.status);
      const fillColor = selected ?
        "#ffffff" :
        mission.status === "locked" ?
          "#252b35" :
          palette.border;
      return `
        <button
          class="pokemon-center-pc-modal__dot"
          type="button"
          data-pc-mission-index="${index}"
          data-selected="${selected ? "true" : "false"}"
          aria-label="Mission ${index + 1}: ${escapeHtml(mission.title)}"
          style="
            width:${selected ? "18px" : "12px"};height:12px;border:2px solid ${selected ? "#ffffff" : palette.border};
            background:${fillColor};
            padding:0;cursor:pointer;
            opacity:${mission.status === "locked" ? "0.7" : "1"};
          "
        ></button>
      `;
    }).join("");
  }

  function renderMissionCard(mission, index) {
    const selected = index === selectedMissionIndex;
    const palette = getMissionPalette(mission.status);
    const statusLabel = getMissionStatusLabel(mission);
    const guidance = getMissionGuidance(mission);
    const detailRows = [
      mission.progress,
      mission.actionLabel ? `X ${mission.actionLabel}` : ""
    ].filter(Boolean);
    const imageSrc = getMissionImageSrc(mission);
    const imageAlt = mission.imageAlt || mission.title || "";
    const illustrationHtml = imageSrc ?
      `<img
        class="pokemon-center-pc-modal__card-image"
        src="${escapeHtml(imageSrc)}"
        alt="${escapeHtml(imageAlt)}"
        decoding="async"
        style="width:100%;height:100%;display:block;object-fit:cover;image-rendering:pixelated;"
      >` :
      `<span
        class="pokemon-center-pc-modal__card-image-placeholder"
        aria-hidden="true"
        style="display:grid;place-items:center;width:100%;height:100%;color:${palette.label};font-size:34px;line-height:1;"
      >i</span>`;

    return `
      <button
        class="pokemon-center-pc-modal__card"
        type="button"
        data-pc-mission-index="${index}"
        data-pc-mission-id="${escapeHtml(mission.id)}"
        data-pc-mission-status="${escapeHtml(mission.status || "available")}"
        data-selected="${selected ? "true" : "false"}"
        aria-label="Mission ${index + 1}: ${escapeHtml(mission.title)}"
        style="
          min-height:${selected ? "246px" : "210px"};
          border:${selected ? "4px solid #ffffff" : `3px solid ${palette.border}`};
          box-shadow:${selected ? `0 0 0 3px ${palette.border}` : "none"};
          background:${palette.background};
          color:#ffffff;
          padding:12px;
          display:grid;
          grid-template-columns:minmax(0, 1fr) ${selected ? "minmax(124px, 152px)" : "124px"};
          gap:14px;
          align-content:stretch;
          text-align:left;
          font:inherit;
          cursor:pointer;
          opacity:${selected ? "1" : mission.status === "locked" ? "0.72" : "0.92"};
        "
      >
        <div style="display:grid;grid-template-rows:auto auto minmax(0, 1fr) auto;align-content:start;gap:8px;min-width:0;overflow:hidden;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;min-width:0;">
            <span style="min-width:0;overflow-wrap:anywhere;font-size:${selected ? "15px" : "13px"};color:${palette.copy};">Mission ${index + 1} · ${escapeHtml(mission.source || "mission")}</span>
            <span style="flex:0 0 auto;border:2px solid ${palette.border};background:rgba(5, 8, 18, 0.34);padding:3px 5px;font-size:${selected ? "14px" : "12px"};line-height:1;color:${palette.label};">${escapeHtml(statusLabel)}</span>
          </div>
          <h2 style="margin:0;color:#ffffff;font-size:${selected ? "29px" : "22px"};line-height:1;overflow-wrap:anywhere;">${escapeHtml(mission.title)}</h2>
          <p style="margin:0;color:${palette.copy};font-size:${selected ? "17px" : "14px"};line-height:1.14;text-transform:none;overflow-wrap:anywhere;">${escapeHtml(mission.description)}</p>
          ${selected ? `
            <p style="margin:0;border:2px solid ${palette.border};background:rgba(5, 8, 18, 0.28);padding:7px;color:${palette.label};font-size:15px;line-height:1.08;text-transform:none;overflow-wrap:anywhere;">${escapeHtml(guidance)}</p>
          ` : ""}
          ${detailRows.length ? `
            <div style="display:grid;gap:5px;color:${palette.label};font-size:15px;line-height:1.08;overflow-wrap:anywhere;">
              ${detailRows.map((detail) => `<span>${escapeHtml(detail)}</span>`).join("")}
            </div>
          ` : ""}
        </div>
        <div
          class="pokemon-center-pc-modal__card-image-frame"
          data-pc-mission-image-slot="true"
          style="
            min-height:${selected ? "178px" : "150px"};
            min-width:${selected ? "152px" : "124px"};
            border:3px solid ${palette.border};
            background:rgba(5, 8, 18, 0.26);
            overflow:hidden;
            align-self:stretch;
          "
        >
          ${illustrationHtml}
        </div>
      </button>
    `;
  }

  function render() {
    const currentRoot = ensureRoot();
    if (!currentRoot) {
      return;
    }

    const mission = missions[selectedMissionIndex] || EMPTY_MISSION;
    const stats = getMissionStats(missions);
    const actionHint = mission.actionLabel ?
      `X ${mission.actionLabel}` :
      mission.status === "locked" ?
        "Locked" :
        "Left/Right Browse";
    const visibleMissionIndexes = getVisibleMissionIndexes();
    const visibleMissionCards = visibleMissionIndexes
      .map((missionIndex) => renderMissionCard(missions[missionIndex] || EMPTY_MISSION, missionIndex))
      .join("");
    const cardColumns = visibleMissionIndexes
      .map((missionIndex) => {
        return missionIndex === selectedMissionIndex ?
          "minmax(0, 1.5fr)" :
          "minmax(0, 0.82fr)";
      })
      .join(" ");

    currentRoot.replaceChildren();

    const panel = createElement(documentRef, "article", "pokemon-center-pc-modal__panel");
    Object.assign(panel.style, {
      width: "96%",
      maxWidth: "1120px",
      minHeight: "330px",
      border: "4px solid #7bc7ff",
      boxShadow: "0 0 0 4px #0b1f32, 0 18px 0 rgba(0, 0, 0, 0.28)",
      background: "#071525",
      color: "#eaf8ff",
      padding: "18px 20px",
      fontFamily: "var(--game-ui-font, monospace)",
      textTransform: "uppercase"
    });

    panel.innerHTML = `
      <header style="display:grid;grid-template-columns:minmax(0, 1fr) auto;gap:14px;align-items:start;margin-bottom:14px;">
        <div style="display:grid;gap:7px;min-width:0;">
          <strong style="font-size:26px;line-height:1;color:#ffffff;">Pokemon Center PC</strong>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:15px;line-height:1;color:#9fdcff;">
            <span style="color:#9cffb1;">Complete ${stats.completed}</span>
            <span style="color:#ffe28a;">Ready ${stats.ready}</span>
            <span style="color:#fff0bd;">To Do ${stats.todo}</span>
            <span style="color:#9aa1ad;">Locked ${stats.locked}</span>
          </div>
        </div>
        <div style="display:grid;gap:4px;text-align:right;">
          <span style="font-size:13px;color:#9fdcff;">Selected</span>
          <strong style="font-size:24px;line-height:1;color:#ffffff;">${selectedMissionIndex + 1}/${missions.length}</strong>
        </div>
      </header>
      <div style="display:grid;grid-template-columns:40px minmax(0, 1fr) 40px;gap:10px;align-items:stretch;">
        <button
          class="pokemon-center-pc-modal__nav"
          type="button"
          data-pc-action="previous"
          aria-label="Previous mission"
          style="border:3px solid #7bc7ff;background:#0d2c45;color:#ffffff;font:inherit;font-size:22px;cursor:pointer;"
        >&lt;</button>
        <div
          class="pokemon-center-pc-modal__cards"
          style="display:grid;grid-template-columns:${cardColumns || "minmax(0, 1fr)"};gap:10px;align-items:stretch;"
        >${visibleMissionCards}</div>
        <button
          class="pokemon-center-pc-modal__nav"
          type="button"
          data-pc-action="next"
          aria-label="Next mission"
          style="border:3px solid #7bc7ff;background:#0d2c45;color:#ffffff;font:inherit;font-size:22px;cursor:pointer;"
        >&gt;</button>
      </div>
      <footer style="display:grid;grid-template-columns:minmax(0, 1fr) auto;gap:12px;align-items:center;margin-top:14px;">
        <div style="display:grid;gap:7px;min-width:0;">
          <div class="pokemon-center-pc-modal__dots" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">${renderDots()}</div>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:12px;line-height:1;color:#9fdcff;">
            <span style="color:#9cffb1;">Green complete</span>
            <span style="color:#ffe28a;">Yellow ready/to do</span>
            <span style="color:#9aa1ad;">Dark locked</span>
          </div>
        </div>
        <p style="margin:0;display:flex;gap:8px;align-items:center;justify-content:flex-end;flex-wrap:wrap;color:#ffffff;font-size:17px;line-height:1;">
          <span style="color:#9fdcff;">Left/Right Browse</span>
          <span style="color:${mission.actionLabel ? "#ffe28a" : "#9aa1ad"};">${escapeHtml(actionHint)}</span>
          <span style="color:#ff6a6a;">B Close</span>
        </p>
      </footer>
    `;

    panel.querySelector('[data-pc-action="previous"]')?.addEventListener("click", () => {
      moveSelection(-1);
    });
    panel.querySelector('[data-pc-action="next"]')?.addEventListener("click", () => {
      moveSelection(1);
    });
    for (const dot of panel.querySelectorAll("[data-pc-mission-index]")) {
      dot.addEventListener("click", () => {
        selectMissionIndex(Number(dot.dataset.pcMissionIndex || 0));
        render();
      });
    }

    currentRoot.append(panel);
  }

  return {
    open({ missions: nextMissions = [], onConfirm: nextOnConfirm = null } = {}) {
      missions = normalizeMissions(nextMissions);
      onConfirm = nextOnConfirm;
      selectInitialMission();
      open = true;
      render();
      if (root) {
        root.hidden = false;
        root.style.display = "grid";
      }
      playMusic();
      clearGameFlowInput();
      return true;
    },
    close,
    handleKeydown(event) {
      if (!open) {
        return false;
      }

      if (event.code === "ArrowRight" || event.code === "ArrowDown") {
        moveSelection(1);
        event.preventDefault?.();
        return true;
      }

      if (event.code === "ArrowLeft" || event.code === "ArrowUp") {
        moveSelection(-1);
        event.preventDefault?.();
        return true;
      }

      if (event.code === "KeyX" || event.code === "Enter") {
        confirmSelectedMission();
        event.preventDefault?.();
        return true;
      }

      if (event.code === "KeyB" || event.code === "Space" || event.code === "Escape") {
        close();
        event.preventDefault?.();
        return true;
      }

      event.preventDefault?.();
      return true;
    },
    isOpen() {
      return open;
    }
  };
}
