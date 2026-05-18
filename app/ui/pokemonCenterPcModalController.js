const EMPTY_MISSION = Object.freeze({
  id: "empty",
  title: "????",
  description: "No habitat check records found.",
  status: "locked",
  source: "terminal"
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
const TERMINAL_MISSION_STATUS_TYPES = Object.freeze({
  active: Object.freeze({
    confirmHint: "Read only",
    guidance: "Follow this check in the world.",
    label: "Active",
    palette: STATUS_PALETTES.todo,
    placeholderLabel: "!"
  }),
  available: Object.freeze({
    confirmHint: "Read only",
    guidance: "Follow this check in the world.",
    label: "Available",
    palette: STATUS_PALETTES.todo,
    placeholderLabel: "!"
  }),
  completed: Object.freeze({
    confirmHint: "Read only",
    guidance: "Completed and archived in the terminal.",
    label: "Complete",
    palette: STATUS_PALETTES.completed,
    placeholderLabel: "OK"
  }),
  locked: Object.freeze({
    confirmHint: "Locked",
    guidance: "Recover more terminal data to reveal this check.",
    label: "Locked",
    palette: STATUS_PALETTES.locked,
    placeholderLabel: "?"
  }),
  default: Object.freeze({
    confirmHint: "Read only",
    guidance: "Follow this check in the world.",
    label: "Available",
    palette: STATUS_PALETTES.todo,
    placeholderLabel: "!"
  })
});
const TERMINAL_STATUS_SUMMARY_ITEMS = Object.freeze([
  Object.freeze({ key: "completed", label: "Complete", color: STATUS_PALETTES.completed.label }),
  Object.freeze({ key: "ready", label: "Ready", color: STATUS_PALETTES.todo.label }),
  Object.freeze({ key: "todo", label: "To Do", color: "#fff0bd" }),
  Object.freeze({ key: "locked", label: "Locked", color: STATUS_PALETTES.locked.label })
]);
const TERMINAL_STATUS_LEGEND_ITEMS = Object.freeze([
  Object.freeze({ label: "Green complete", color: STATUS_PALETTES.completed.label }),
  Object.freeze({ label: "Yellow ready/to do", color: STATUS_PALETTES.todo.label }),
  Object.freeze({ label: "Dark locked", color: STATUS_PALETTES.locked.label })
]);
const TERMINAL_MODAL_COMMANDS = Object.freeze({
  NEXT: "next",
  PREVIOUS: "previous",
  CONFIRM: "confirm",
  CLOSE: "close",
  CONSUME: "consume"
});
const TERMINAL_MODAL_KEY_COMMANDS = Object.freeze({
  ArrowDown: TERMINAL_MODAL_COMMANDS.NEXT,
  ArrowRight: TERMINAL_MODAL_COMMANDS.NEXT,
  ArrowLeft: TERMINAL_MODAL_COMMANDS.PREVIOUS,
  ArrowUp: TERMINAL_MODAL_COMMANDS.PREVIOUS,
  Enter: TERMINAL_MODAL_COMMANDS.CONFIRM,
  KeyX: TERMINAL_MODAL_COMMANDS.CONFIRM,
  Escape: TERMINAL_MODAL_COMMANDS.CLOSE,
  KeyB: TERMINAL_MODAL_COMMANDS.CLOSE,
  Space: TERMINAL_MODAL_COMMANDS.CLOSE
});
const TERMINAL_MODAL_POINTER_COMMANDS = Object.freeze({
  next: TERMINAL_MODAL_COMMANDS.NEXT,
  previous: TERMINAL_MODAL_COMMANDS.PREVIOUS
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

function normalizeBuilderCallsign(value) {
  return String(value || "").trim().slice(0, 24);
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

function createSilentTerminalAudio() {
  return {
    currentTime: 0,
    loop: false,
    pause() {},
    play() {},
    preload: "",
    volume: 0
  };
}

export function resolveTerminalModalCommand(eventOrCode) {
  const code = typeof eventOrCode === "string" ? eventOrCode : eventOrCode?.code;
  return TERMINAL_MODAL_KEY_COMMANDS[code] || TERMINAL_MODAL_COMMANDS.CONSUME;
}

export function resolveTerminalModalPointerCommand(actionId) {
  return TERMINAL_MODAL_POINTER_COMMANDS[actionId] || TERMINAL_MODAL_COMMANDS.CONSUME;
}

export function getTerminalStatusLegendItems() {
  return TERMINAL_STATUS_LEGEND_ITEMS;
}

export function getTerminalMissionStatusType(status) {
  return TERMINAL_MISSION_STATUS_TYPES[status] || TERMINAL_MISSION_STATUS_TYPES.default;
}

function normalizeMissions(missions = []) {
  const normalized = Array.isArray(missions) ? missions.filter(Boolean) : [];
  return normalized.length ? normalized : [EMPTY_MISSION];
}

function getMissionPalette(status) {
  return getTerminalMissionStatusType(status).palette;
}

function getMissionStatusLabel(mission) {
  if (mission?.status === "locked") {
    return getTerminalMissionStatusType("locked").label;
  }

  if (mission?.status === "completed") {
    return getTerminalMissionStatusType("completed").label;
  }

  if (mission?.actionId) {
    return mission.actionLabel ? "Reward Ready" : "Ready";
  }

  const statusType = getTerminalMissionStatusType(mission?.status);
  return statusType === TERMINAL_MISSION_STATUS_TYPES.default && mission?.status ?
    mission.status :
    statusType.label;
}

function getMissionGuidance(mission) {
  if (mission?.status === "locked") {
    return getTerminalMissionStatusType("locked").guidance;
  }

  if (mission?.actionId && mission?.actionLabel) {
    return `Press X / Enter to ${mission.actionLabel}.`;
  }

  if (mission?.status === "completed") {
    return getTerminalMissionStatusType("completed").guidance;
  }

  if (mission?.progress) {
    return `Progress: ${mission.progress}.`;
  }

  return getTerminalMissionStatusType(mission?.status).guidance;
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

function renderTerminalStatusSummary(stats) {
  return TERMINAL_STATUS_SUMMARY_ITEMS
    .map((item) => `<span style="color:${item.color};">${escapeHtml(item.label)} ${stats[item.key] || 0}</span>`)
    .join("");
}

function renderTerminalStatusLegend() {
  return TERMINAL_STATUS_LEGEND_ITEMS
    .map((item) => `<span style="color:${item.color};">${escapeHtml(item.label)}</span>`)
    .join("");
}

function renderTerminalModalHeader({ builderCallsign, stats, selectedMissionIndex, totalMissions }) {
  const callsign = normalizeBuilderCallsign(builderCallsign);
  return `
    <header style="display:grid;grid-template-columns:minmax(0, 1fr) auto;gap:14px;align-items:start;margin-bottom:14px;">
      <div style="display:grid;gap:7px;min-width:0;">
        <strong style="font-size:26px;line-height:1;color:#ffffff;">Colony Terminal</strong>
        ${callsign ? `
          <span style="font-size:13px;line-height:1;color:#eaf8ff;">Builder ${escapeHtml(callsign)}</span>
        ` : ""}
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:15px;line-height:1;color:#9fdcff;">
          ${renderTerminalStatusSummary(stats)}
        </div>
      </div>
      <div style="display:grid;gap:4px;text-align:right;">
        <span style="font-size:13px;color:#9fdcff;">Selected</span>
        <strong style="font-size:24px;line-height:1;color:#ffffff;">${selectedMissionIndex + 1}/${totalMissions}</strong>
      </div>
    </header>
  `;
}

function renderTerminalModalBody({ cardColumns, selectedMissionIndex, visibleMissionCards }) {
  return `
    <div style="display:grid;grid-template-columns:46px minmax(0, 1fr) 46px;gap:12px;align-items:stretch;">
      <button
        class="pokemon-center-pc-modal__nav"
        type="button"
        data-pc-action="previous"
        aria-label="Previous habitat check"
        style="border:3px solid #7bc7ff;background:#0d2c45;color:#ffffff;font:inherit;font-size:24px;cursor:pointer;min-height:48px;"
      >&lt;</button>
      <div
        class="pokemon-center-pc-modal__cards"
        role="listbox"
        aria-label="Habitat checks"
        aria-activedescendant="pokemon-center-pc-card-${selectedMissionIndex}"
        style="display:grid;grid-template-columns:${cardColumns || "minmax(0, 1fr)"};gap:12px;align-items:stretch;min-width:0;"
      >${visibleMissionCards}</div>
      <button
        class="pokemon-center-pc-modal__nav"
        type="button"
        data-pc-action="next"
        aria-label="Next habitat check"
        style="border:3px solid #7bc7ff;background:#0d2c45;color:#ffffff;font:inherit;font-size:24px;cursor:pointer;min-height:48px;"
      >&gt;</button>
    </div>
  `;
}

function renderTerminalModalFooter({ actionHint, actionReady, dotsHtml }) {
  return `
    <footer style="display:grid;grid-template-columns:minmax(0, 1fr) auto;gap:12px;align-items:center;margin-top:14px;">
      <div style="display:grid;gap:7px;min-width:0;">
        <div class="pokemon-center-pc-modal__dots" aria-label="Habitat check timeline" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;max-height:44px;overflow:auto;padding:2px 2px 5px 2px;">${dotsHtml}</div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:12px;line-height:1;color:#9fdcff;">
          ${renderTerminalStatusLegend()}
        </div>
      </div>
      <p style="margin:0;display:flex;gap:8px;align-items:center;justify-content:flex-end;flex-wrap:wrap;color:#ffffff;font-size:17px;line-height:1;">
        <span style="color:#9fdcff;">Left/Right Browse</span>
        <span style="color:${actionReady ? "#ffe28a" : "#9aa1ad"};">${escapeHtml(actionHint)}</span>
        <span style="color:#ff6a6a;">B / Esc Close</span>
      </p>
    </footer>
  `;
}

function getMissionImageSrc(mission) {
  return mission?.imageSrc || mission?.imageUrl || mission?.thumbnailUrl || mission?.artUrl || "";
}

function getMissionConfirmHint(mission) {
  if (mission?.actionLabel) {
    return `X / Enter ${mission.actionLabel}`;
  }

  if (mission?.status === "locked") {
    return getTerminalMissionStatusType("locked").confirmHint;
  }

  return getTerminalMissionStatusType(mission?.status).confirmHint;
}

function getMissionPlaceholderLabel(mission) {
  if (mission?.status === "completed" || mission?.status === "locked") {
    return getTerminalMissionStatusType(mission.status).placeholderLabel;
  }

  if (mission?.actionId) {
    return "GO";
  }

  return getTerminalMissionStatusType(mission?.status).placeholderLabel;
}

export function createTerminalMissionCardViewModel(mission = EMPTY_MISSION, index = 0, selectedMissionIndex = 0) {
  const selected = index === selectedMissionIndex;

  return {
    cardMode: selected ? "detail" : "summary",
    detailRows: [
      mission?.progress,
      mission?.actionLabel ? `X / Enter ${mission.actionLabel}` : ""
    ].filter(Boolean),
    guidance: getMissionGuidance(mission),
    imageAlt: mission?.imageAlt || mission?.title || "",
    imageSrc: getMissionImageSrc(mission),
    missionSource: mission?.source || "terminal",
    palette: getMissionPalette(mission?.status),
    placeholderLabel: getMissionPlaceholderLabel(mission),
    selected,
    statusLabel: getMissionStatusLabel(mission)
  };
}

export function getWrappedTerminalMissionIndex(index = 0, totalMissions = 0) {
  if (totalMissions <= 0) {
    return 0;
  }

  return (index + totalMissions) % totalMissions;
}

export function getInitialTerminalMissionIndex(missions = []) {
  const actionableIndex = missions.findIndex((mission) => mission?.actionId);
  if (actionableIndex >= 0) {
    return actionableIndex;
  }

  const readableIndex = missions.findIndex((mission) => mission?.status !== "locked");
  return readableIndex >= 0 ? readableIndex : 0;
}

export function getVisibleTerminalMissionIndexes({
  selectedMissionIndex = 0,
  totalMissions = 0,
  visibleCount = 3
} = {}) {
  const count = Math.min(visibleCount, totalMissions);
  if (count <= 0) {
    return [];
  }

  if (totalMissions <= count) {
    return Array.from({ length: totalMissions }, (_, index) => index);
  }

  if (selectedMissionIndex <= 0) {
    return [0, 1, 2];
  }

  if (selectedMissionIndex >= totalMissions - 1) {
    return [
      totalMissions - 3,
      totalMissions - 2,
      totalMissions - 1
    ];
  }

  return [
    selectedMissionIndex - 1,
    selectedMissionIndex,
    selectedMissionIndex + 1
  ];
}

export function createTerminalModalMusicController({
  musicSrc = CENTER_COMPUTER_MUSIC_URL,
  musicVolume = CENTER_COMPUTER_MUSIC_VOLUME,
  audioFactory = (src) => {
    if (typeof Audio !== "function") {
      return null;
    }

    return new Audio(src);
  }
} = {}) {
  let musicAudio = null;

  function getAudio() {
    if (musicAudio) {
      return musicAudio;
    }

    musicAudio = musicSrc ? audioFactory(musicSrc) || createSilentTerminalAudio() : createSilentTerminalAudio();
    musicAudio.preload = "auto";
    musicAudio.loop = true;
    musicAudio.volume = musicVolume;
    return musicAudio;
  }

  return {
    play() {
      const audio = getAudio();

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
    },
    stop() {
      const audio = getAudio();

      audio.pause?.();
      try {
        audio.currentTime = 0;
      } catch {
        // Some browser audio objects disallow seeking before metadata is ready.
      }
    }
  };
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
  let open = false;
  let missions = [EMPTY_MISSION];
  let selectedMissionIndex = 0;
  let onConfirm = null;
  let builderCallsign = "";
  let renderDirty = true;
  const musicController = createTerminalModalMusicController({
    audioFactory,
    musicSrc,
    musicVolume
  });

  function ensureRoot() {
    if (root || !mount || !documentRef?.createElement) {
      return root;
    }

    root = createElement(documentRef, "section", "pokemon-center-pc-modal");
    root.hidden = true;
    root.setAttribute("aria-label", "Colony Terminal habitat checks");
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
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
    const previousIndex = selectedMissionIndex;
    selectedMissionIndex = getWrappedTerminalMissionIndex(index, missions.length);

    if (selectedMissionIndex !== previousIndex) {
      renderDirty = true;
    }
  }

  function moveSelection(direction) {
    selectMissionIndex(selectedMissionIndex + direction);
    renderIfDirty();
  }

  function selectInitialMission() {
    selectedMissionIndex = getInitialTerminalMissionIndex(missions);
  }

  function getVisibleMissionIndexes() {
    return getVisibleTerminalMissionIndexes({
      selectedMissionIndex,
      totalMissions: missions.length
    });
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
    musicController.stop();
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

  const commandHandlers = Object.freeze({
    [TERMINAL_MODAL_COMMANDS.NEXT]: () => moveSelection(1),
    [TERMINAL_MODAL_COMMANDS.PREVIOUS]: () => moveSelection(-1),
    [TERMINAL_MODAL_COMMANDS.CONFIRM]: () => confirmSelectedMission(),
    [TERMINAL_MODAL_COMMANDS.CLOSE]: () => close()
  });

  function handleCommand(command) {
    const handler = commandHandlers[command];
    if (!handler) {
      return false;
    }

    handler();
    return true;
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
          aria-label="Habitat check ${index + 1}: ${escapeHtml(mission.title)}"
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
    const {
      cardMode,
      detailRows,
      guidance,
      imageAlt,
      imageSrc,
      missionSource,
      palette,
      placeholderLabel,
      selected,
      statusLabel
    } = createTerminalMissionCardViewModel(mission, index, selectedMissionIndex);
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
        style="display:grid;place-items:center;width:100%;height:100%;color:${palette.label};font-size:${selected ? "28px" : "17px"};line-height:1;letter-spacing:0;"
      >${escapeHtml(placeholderLabel)}</span>`;

    return `
      <button
        class="pokemon-center-pc-modal__card"
        id="pokemon-center-pc-card-${index}"
        type="button"
        data-pc-mission-index="${index}"
        data-pc-mission-id="${escapeHtml(mission.id)}"
        data-pc-mission-status="${escapeHtml(mission.status || "available")}"
        data-selected="${selected ? "true" : "false"}"
        data-pc-card-mode="${cardMode}"
        role="option"
        aria-selected="${selected ? "true" : "false"}"
        aria-label="Habitat check ${index + 1}, ${escapeHtml(statusLabel)}: ${escapeHtml(mission.title)}"
        style="
          min-height:${selected ? "258px" : "192px"};
          border:${selected ? "4px solid #ffffff" : `3px solid ${palette.border}`};
          box-shadow:${selected ? `0 0 0 3px ${palette.border}, 0 10px 0 rgba(0, 0, 0, 0.22)` : "0 4px 0 rgba(0, 0, 0, 0.22)"};
          background:linear-gradient(180deg, ${palette.background} 0%, rgba(5, 8, 18, 0.92) 100%);
          color:#ffffff;
          padding:${selected ? "14px" : "11px"};
          display:grid;
          grid-template-columns:minmax(0, 1fr) ${selected ? "minmax(136px, 168px)" : "62px"};
          gap:${selected ? "16px" : "10px"};
          align-content:stretch;
          text-align:left;
          font:inherit;
          cursor:pointer;
          opacity:${selected ? "1" : mission.status === "locked" ? "0.72" : "0.92"};
        "
      >
        <div style="display:grid;grid-template-rows:auto auto minmax(0, 1fr) auto;align-content:start;gap:${selected ? "9px" : "7px"};min-width:0;overflow:hidden;">
          <div style="display:grid;grid-template-columns:minmax(0, 1fr) auto;gap:8px;align-items:start;min-width:0;">
            <span style="min-width:0;overflow-wrap:anywhere;font-size:${selected ? "14px" : "12px"};line-height:1.08;color:${palette.copy};">Check ${index + 1} · ${escapeHtml(missionSource)}</span>
            <span style="flex:0 0 auto;border:2px solid ${palette.border};background:rgba(5, 8, 18, 0.42);padding:${selected ? "4px 6px" : "3px 5px"};font-size:${selected ? "13px" : "11px"};line-height:1;color:${palette.label};">${escapeHtml(statusLabel)}</span>
          </div>
          <h2 style="margin:0;color:#ffffff;font-size:${selected ? "28px" : "20px"};line-height:1.02;overflow-wrap:anywhere;">${escapeHtml(mission.title)}</h2>
          <p style="margin:0;color:${palette.copy};font-size:${selected ? "16px" : "13px"};line-height:${selected ? "1.18" : "1.12"};text-transform:none;overflow-wrap:anywhere;">${escapeHtml(mission.description)}</p>
          ${selected ? `
            <p style="margin:0;border:2px solid ${palette.border};background:rgba(5, 8, 18, 0.34);padding:8px;color:${palette.label};font-size:14px;line-height:1.14;text-transform:none;overflow-wrap:anywhere;">${escapeHtml(guidance)}</p>
          ` : ""}
          ${detailRows.length ? `
            <div style="display:grid;gap:5px;color:${palette.label};font-size:${selected ? "14px" : "12px"};line-height:1.08;overflow-wrap:anywhere;">
              ${detailRows.map((detail) => `<span>${escapeHtml(detail)}</span>`).join("")}
            </div>
          ` : ""}
        </div>
        <div
          class="pokemon-center-pc-modal__card-image-frame"
          data-pc-mission-image-slot="true"
          style="
            min-height:${selected ? "184px" : "58px"};
            min-width:${selected ? "156px" : "58px"};
            border:3px solid ${palette.border};
            background:rgba(5, 8, 18, 0.32);
            overflow:hidden;
            align-self:${selected ? "stretch" : "start"};
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
    const actionHint = getMissionConfirmHint(mission);
    const dotsHtml = renderDots();
    const visibleMissionIndexes = getVisibleMissionIndexes();
    const visibleMissionCards = visibleMissionIndexes
      .map((missionIndex) => renderMissionCard(missions[missionIndex] || EMPTY_MISSION, missionIndex))
      .join("");
    const cardColumns = visibleMissionIndexes
      .map((missionIndex) => {
        return missionIndex === selectedMissionIndex ?
          "minmax(0, 1.42fr)" :
          "minmax(220px, 0.82fr)";
      })
      .join(" ");

    currentRoot.replaceChildren();

    const panel = createElement(documentRef, "article", "pokemon-center-pc-modal__panel");
    Object.assign(panel.style, {
      width: "96%",
      maxWidth: "1180px",
      minHeight: "360px",
      border: "4px solid #7bc7ff",
      boxShadow: "0 0 0 4px #0b1f32, 0 18px 0 rgba(0, 0, 0, 0.28)",
      background: "#071525",
      color: "#eaf8ff",
      padding: "20px 22px",
      fontFamily: "var(--game-ui-font, monospace)",
      textTransform: "uppercase"
    });

    panel.innerHTML = `
      ${renderTerminalModalHeader({
        builderCallsign,
        stats,
        selectedMissionIndex,
        totalMissions: missions.length
      })}
      ${renderTerminalModalBody({
        cardColumns,
        selectedMissionIndex,
        visibleMissionCards
      })}
      ${renderTerminalModalFooter({
        actionHint,
        actionReady: Boolean(mission.actionLabel),
        dotsHtml
      })}
    `;

    panel.addEventListener("click", (event) => {
      const actionControl = event.target?.closest?.("[data-pc-action]");
      if (actionControl && panel.contains(actionControl)) {
        const command = resolveTerminalModalPointerCommand(actionControl.dataset.pcAction);
        handleCommand(command);
        event.preventDefault();
        return;
      }

      const missionControl = event.target?.closest?.("[data-pc-mission-index]");
      if (missionControl && panel.contains(missionControl)) {
        selectMissionIndex(Number(missionControl.dataset.pcMissionIndex || 0));
        renderIfDirty();
        event.preventDefault();
      }
    });

    currentRoot.append(panel);
    renderDirty = false;
  }

  function renderIfDirty() {
    if (!renderDirty) {
      return;
    }

    render();
  }

  return {
    open({ builderCallsign: nextBuilderCallsign = "", missions: nextMissions = [], onConfirm: nextOnConfirm = null } = {}) {
      missions = normalizeMissions(nextMissions);
      onConfirm = nextOnConfirm;
      builderCallsign = normalizeBuilderCallsign(nextBuilderCallsign);
      renderDirty = true;
      selectInitialMission();
      open = true;
      renderIfDirty();
      if (root) {
        root.hidden = false;
        root.style.display = "grid";
      }
      musicController.play();
      clearGameFlowInput();
      return true;
    },
    close,
    handleKeydown(event) {
      if (!open) {
        return false;
      }

      const command = resolveTerminalModalCommand(event);
      handleCommand(command);
      event.preventDefault?.();
      return true;
    },
    isOpen() {
      return open;
    }
  };
}
