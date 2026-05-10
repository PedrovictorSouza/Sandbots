import { createDialogueTypewriter } from "./dialogueTypewriter.js";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isMovementKey(key) {
  return key === "w" || key === "a" || key === "s" || key === "d";
}

const NAME_CHAR_LIMIT = 12;
const NAME_KEYBOARD_ROWS = Object.freeze([
  Object.freeze(["#", "[", "]", "$", "%", "^", "&", "*", "(", ")", "_"]),
  Object.freeze(["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "@"]),
  Object.freeze(["A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "\""]),
  Object.freeze(["Z", "X", "C", "V", "B", "N", "M", "<", ">", "+", "="])
]);
const NAME_KEYBOARD_ACTIONS = Object.freeze(["space", "delete", "submit"]);

function normalizeNameChar(key) {
  if (!key || key.length !== 1) {
    return "";
  }

  if (/^[a-zA-Z]$/.test(key)) {
    return key.toUpperCase();
  }

  if (/^[#\[\]\$%\^&*()_@;"<>+=-]$/.test(key)) {
    return key;
  }

  if (key === "'" || key === ".") {
    return key;
  }

  return "";
}

function clampIndex(index, length) {
  return Math.max(0, Math.min(length - 1, index));
}

export function createGameplayDialogueController({
  uiLayer,
  clearGameFlowInput = () => {},
  onBeforeComplete = () => {}
} = {}) {
  if (!(uiLayer instanceof HTMLElement)) {
    throw new Error("Gameplay dialogue controller requires a valid uiLayer.");
  }

  const root = document.createElement("div");
  root.dataset.gameplayDialogue = "true";
  root.hidden = true;
  Object.assign(root.style, {
    position: "absolute",
    inset: "0",
    pointerEvents: "none",
    zIndex: "24"
  });
  uiLayer.append(root);

  const state = {
    active: false,
    mode: "dialogue",
    lines: [],
    lineIndex: 0,
    onComplete: () => {},
    onBeforeComplete,
    onLineChange: () => {},
    visibleText: "",
    nameEntry: {
      playerName: "",
      selectedRow: 1,
      selectedCol: 0,
      onComplete: () => {}
    }
  };
  const typewriter = createDialogueTypewriter({
    onTick: ({ visibleText }) => {
      state.visibleText = visibleText;
      render();
    }
  });
  syncDialogueLayerState();

  function syncDialogueLayerState() {
    uiLayer.dataset.gameplayDialogueActive = state.active ? "true" : "false";
    root.style.pointerEvents = state.active ? "auto" : "none";
  }

  function getCurrentLine() {
    return state.lines[state.lineIndex] || null;
  }

  function render() {
    if (!state.active) {
      root.hidden = true;
      root.innerHTML = "";
      return;
    }

    const currentLine = getCurrentLine();
    if (state.mode === "name-entry") {
      renderNameEntry();
      return;
    }

    if (!currentLine) {
      root.hidden = true;
      root.innerHTML = "";
      return;
    }

    root.hidden = false;
    root.innerHTML = `
      <div class="act-two-dialogue" aria-live="polite">
        ${currentLine.speaker ? `<div class="act-two-dialogue__speaker">${escapeHtml(currentLine.speaker)}</div>` : ""}
        <div class="act-two-dialogue__body" data-speakerless="${currentLine.speaker ? "false" : "true"}">
          <p class="act-two-dialogue__text">${escapeHtml(state.visibleText)}</p>
          <div class="act-two-dialogue__hint">
            <span>X</span>
            <span>Continue</span>
          </div>
        </div>
      </div>
    `;
  }

  function getNameSelectionRow(rowIndex = state.nameEntry.selectedRow) {
    return rowIndex < NAME_KEYBOARD_ROWS.length ?
      NAME_KEYBOARD_ROWS[rowIndex] :
      NAME_KEYBOARD_ACTIONS;
  }

  function setNameSelection(rowIndex, colIndex) {
    const selectedRow = clampIndex(rowIndex, NAME_KEYBOARD_ROWS.length + 1);
    const selectedCol = clampIndex(colIndex, getNameSelectionRow(selectedRow).length);

    state.nameEntry.selectedRow = selectedRow;
    state.nameEntry.selectedCol = selectedCol;
    render();
  }

  function moveNameSelection(deltaRow, deltaCol) {
    const nextRow = clampIndex(
      state.nameEntry.selectedRow + deltaRow,
      NAME_KEYBOARD_ROWS.length + 1
    );
    const nextCol = clampIndex(
      state.nameEntry.selectedCol + deltaCol,
      getNameSelectionRow(nextRow).length
    );

    setNameSelection(nextRow, nextCol);
  }

  function appendNameChar(character) {
    if (state.mode !== "name-entry" || state.nameEntry.playerName.length >= NAME_CHAR_LIMIT) {
      return;
    }

    if (character === " ") {
      if (!state.nameEntry.playerName.length || state.nameEntry.playerName.endsWith(" ")) {
        return;
      }
      state.nameEntry.playerName = `${state.nameEntry.playerName} `;
      render();
      return;
    }

    state.nameEntry.playerName = `${state.nameEntry.playerName}${character}`.slice(0, NAME_CHAR_LIMIT);
    render();
  }

  function deleteNameChar() {
    if (state.mode !== "name-entry" || !state.nameEntry.playerName.length) {
      return;
    }

    state.nameEntry.playerName = state.nameEntry.playerName.slice(0, -1);
    render();
  }

  function completeNameEntry() {
    if (state.mode !== "name-entry") {
      return false;
    }

    const trimmedName = state.nameEntry.playerName.trim();
    if (!trimmedName) {
      return false;
    }

    const onComplete = state.nameEntry.onComplete;
    state.active = false;
    state.mode = "dialogue";
    state.nameEntry.playerName = "";
    state.nameEntry.selectedRow = 1;
    state.nameEntry.selectedCol = 0;
    state.nameEntry.onComplete = () => {};
    syncDialogueLayerState();
    render();
    onComplete({
      playerName: trimmedName,
      nameConfirmation: "yes"
    });
    return true;
  }

  function applyNameAction(action) {
    if (action === "space") {
      appendNameChar(" ");
      return true;
    }

    if (action === "delete") {
      deleteNameChar();
      return true;
    }

    if (action === "submit") {
      return completeNameEntry();
    }

    return false;
  }

  function selectNameEntryKey() {
    const selected = getNameSelectionRow()[state.nameEntry.selectedCol];

    if (state.nameEntry.selectedRow < NAME_KEYBOARD_ROWS.length) {
      appendNameChar(selected);
      return true;
    }

    return applyNameAction(selected);
  }

  function renderNameEntry() {
    const displayName = state.nameEntry.playerName || "";
    const count = `${displayName.length}/${NAME_CHAR_LIMIT}`;
    const canSubmit = displayName.trim().length > 0;
    const actionLabels = {
      space: "Space",
      delete: "Delete",
      submit: "OK"
    };

    root.hidden = false;
    root.innerHTML = `
      <div class="name-entry">
        <div class="name-entry__scrim"></div>
        <div class="name-entry__shell">
          <div class="name-entry__prompt">
            <strong>What's your name?</strong>
            <span>Chopper will use this when talking to you.</span>
          </div>
          <div class="name-entry__field" data-empty="${displayName.length === 0 ? "true" : "false"}">
            <div class="name-entry__value">
              ${displayName ? `<span>${escapeHtml(displayName)}</span>` : ""}
              ${displayName.length < NAME_CHAR_LIMIT ? '<span class="name-entry__caret" aria-hidden="true"></span>' : ""}
            </div>
            <span class="name-entry__count">${count}</span>
          </div>
        </div>
        <div class="name-entry__keyboard">
          <div class="name-entry__rows">
            ${NAME_KEYBOARD_ROWS.map((row, rowIndex) => `
              <div class="name-entry__row">
                ${row.map((key, colIndex) => `
                  <button
                    class="name-entry__key"
                    type="button"
                    data-name-key="${escapeHtml(key)}"
                    data-name-row="${rowIndex}"
                    data-name-col="${colIndex}"
                    data-selected="${state.nameEntry.selectedRow === rowIndex && state.nameEntry.selectedCol === colIndex ? "true" : "false"}"
                  >
                    ${escapeHtml(key)}
                  </button>
                `).join("")}
              </div>
            `).join("")}
          </div>
          <div class="name-entry__actions">
            ${NAME_KEYBOARD_ACTIONS.map((action, colIndex) => `
              <button
                class="name-entry__action ${action === "submit" ? "name-entry__action--ok" : ""}"
                type="button"
                data-name-action="${action}"
                data-name-row="${NAME_KEYBOARD_ROWS.length}"
                data-name-col="${colIndex}"
                data-enabled="${action === "submit" && canSubmit ? "true" : action === "submit" ? "false" : "true"}"
                data-selected="${state.nameEntry.selectedRow === NAME_KEYBOARD_ROWS.length && state.nameEntry.selectedCol === colIndex ? "true" : "false"}"
              >
                ${actionLabels[action]}
              </button>
            `).join("")}
          </div>
        </div>
      </div>
    `;
  }

  function close({ completed = false } = {}) {
    const onComplete = state.onComplete;
    state.active = false;
    state.mode = "dialogue";
    state.lines = [];
    state.lineIndex = 0;
    state.onComplete = () => {};
    state.onLineChange = () => {};
    state.visibleText = "";
    typewriter.stop();
    syncDialogueLayerState();
    render();

    if (completed) {
      state.onBeforeComplete();
      onComplete();
    }
  }

  function advance() {
    if (!state.active) {
      return;
    }

    if (!typewriter.isComplete()) {
      typewriter.complete();
      return;
    }

    if (state.lineIndex < state.lines.length - 1) {
      state.lineIndex += 1;
      typewriter.start(getCurrentLine()?.text || "");
      state.onLineChange(getCurrentLine(), state.lineIndex);
      render();
      return;
    }

    close({ completed: true });
  }

  function openConversation({ lines, onComplete = () => {}, onLineChange = () => {} } = {}) {
    if (!Array.isArray(lines) || lines.length === 0) {
      return false;
    }

    clearGameFlowInput();
    state.active = true;
    state.mode = "dialogue";
    state.lines = lines.map((line) => ({ ...line }));
    state.lineIndex = 0;
    state.onComplete = onComplete;
    state.onLineChange = onLineChange;
    typewriter.start(getCurrentLine()?.text || "");
    syncDialogueLayerState();
    state.onLineChange(getCurrentLine(), state.lineIndex);
    render();
    return true;
  }

  function openNameEntry({ initialName = "", onComplete = () => {} } = {}) {
    clearGameFlowInput();
    state.active = true;
    state.mode = "name-entry";
    state.lines = [];
    state.lineIndex = 0;
    state.onComplete = () => {};
    state.onLineChange = () => {};
    state.visibleText = "";
    state.nameEntry.playerName = String(initialName || "").trim().slice(0, NAME_CHAR_LIMIT);
    state.nameEntry.selectedRow = 1;
    state.nameEntry.selectedCol = 0;
    state.nameEntry.onComplete = onComplete;
    typewriter.stop();
    syncDialogueLayerState();
    render();
    return true;
  }

  root.addEventListener("click", (event) => {
    if (!state.active || state.mode !== "name-entry") {
      return;
    }

    const keyButton = event.target.closest("[data-name-key]");
    if (keyButton) {
      setNameSelection(
        Number(keyButton.dataset.nameRow),
        Number(keyButton.dataset.nameCol)
      );
      appendNameChar(keyButton.dataset.nameKey || "");
      return;
    }

    const actionButton = event.target.closest("[data-name-action]");
    if (actionButton) {
      setNameSelection(
        Number(actionButton.dataset.nameRow),
        Number(actionButton.dataset.nameCol)
      );
      applyNameAction(actionButton.dataset.nameAction);
    }
  });

  function handleKeydown(event) {
    if (!state.active) {
      return false;
    }

    const key = event.key.toLowerCase();

    if (state.mode === "name-entry") {
      if (event.code === "ArrowUp") {
        moveNameSelection(-1, 0);
        event.preventDefault();
        return true;
      }

      if (event.code === "ArrowDown") {
        moveNameSelection(1, 0);
        event.preventDefault();
        return true;
      }

      if (event.code === "ArrowLeft") {
        moveNameSelection(0, -1);
        event.preventDefault();
        return true;
      }

      if (event.code === "ArrowRight") {
        moveNameSelection(0, 1);
        event.preventDefault();
        return true;
      }

      if (event.code === "Backspace") {
        deleteNameChar();
        event.preventDefault();
        return true;
      }

      if (event.code === "KeyX" || event.code === "Enter") {
        selectNameEntryKey();
        event.preventDefault();
        return true;
      }

      if (event.code === "Space") {
        appendNameChar(" ");
        event.preventDefault();
        return true;
      }

      if (!event.ctrlKey && !event.metaKey && !event.altKey) {
        const normalized = normalizeNameChar(event.key);
        if (normalized) {
          appendNameChar(normalized);
          event.preventDefault();
          return true;
        }

        if (event.key.length === 1) {
          event.preventDefault();
          return true;
        }
      }

      if (
        event.code === "Escape" ||
        event.code === "KeyM" ||
        isMovementKey(key)
      ) {
        event.preventDefault();
        return true;
      }

      return false;
    }

    if (
      event.code === "KeyX" ||
      event.code === "KeyE" ||
      event.code === "Enter"
    ) {
      if (!event.repeat) {
        advance();
      }
      event.preventDefault();
      return true;
    }

    if (
      event.code === "Space" ||
      event.code === "Escape" ||
      event.code === "KeyM" ||
      event.code === "ArrowLeft" ||
      event.code === "ArrowRight" ||
      isMovementKey(key)
    ) {
      event.preventDefault();
      return true;
    }

    return false;
  }

  function handleKeyup(event) {
    if (!state.active) {
      return false;
    }

    const key = event.key.toLowerCase();
    if (
      event.code === "KeyE" ||
      event.code === "KeyX" ||
      event.code === "Enter" ||
      event.code === "Space" ||
      event.code === "Escape" ||
      event.code === "KeyM" ||
      event.code === "Backspace" ||
      event.code === "ArrowUp" ||
      event.code === "ArrowDown" ||
      event.code === "ArrowLeft" ||
      event.code === "ArrowRight" ||
      isMovementKey(key)
    ) {
      event.preventDefault();
      return true;
    }

    return false;
  }

  return {
    close,
    handleKeydown,
    handleKeyup,
    isActive() {
      return state.active;
    },
    setBeforeComplete(handler = () => {}) {
      state.onBeforeComplete = typeof handler === "function" ? handler : () => {};
    },
    openConversation,
    openNameEntry
  };
}
