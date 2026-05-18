import { createDialogueTypewriter } from "./dialogueTypewriter.js";
import { normalizeSandbotsVisibleText } from "../story/sandbotsTerminologyNormalizer.js";

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
const GAMEPLAY_DIALOGUE_COMMANDS = Object.freeze({
  ADVANCE: "advance",
  CONSUME: "consume",
  IGNORE: "ignore"
});
const GAMEPLAY_DIALOGUE_KEY_COMMANDS = Object.freeze({
  Enter: GAMEPLAY_DIALOGUE_COMMANDS.ADVANCE,
  KeyE: GAMEPLAY_DIALOGUE_COMMANDS.ADVANCE,
  KeyX: GAMEPLAY_DIALOGUE_COMMANDS.ADVANCE,
  ArrowLeft: GAMEPLAY_DIALOGUE_COMMANDS.CONSUME,
  ArrowRight: GAMEPLAY_DIALOGUE_COMMANDS.CONSUME,
  Escape: GAMEPLAY_DIALOGUE_COMMANDS.CONSUME,
  KeyM: GAMEPLAY_DIALOGUE_COMMANDS.CONSUME,
  Space: GAMEPLAY_DIALOGUE_COMMANDS.CONSUME
});
const GAMEPLAY_DIALOGUE_KEYUP_CONSUME_CODES = new Set([
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "Backspace"
]);
const NAME_KEYBOARD_ROWS = Object.freeze([
  Object.freeze(["#", "[", "]", "$", "%", "^", "&", "*", "(", ")", "_"]),
  Object.freeze(["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "@"]),
  Object.freeze(["A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "\""]),
  Object.freeze(["Z", "X", "C", "V", "B", "N", "M", "<", ">", "+", "="])
]);
const NAME_KEYBOARD_ACTION_DEFINITIONS = Object.freeze([
  Object.freeze({ id: "space", label: "Space", requiresText: false, className: "" }),
  Object.freeze({ id: "delete", label: "Delete", requiresText: false, className: "" }),
  Object.freeze({ id: "submit", label: "OK", requiresText: true, className: "name-entry__action--ok" })
]);
const NAME_KEYBOARD_ACTIONS = Object.freeze(NAME_KEYBOARD_ACTION_DEFINITIONS.map((action) => action.id));
const NAME_KEYBOARD_ACTIONS_BY_ID = Object.freeze(Object.fromEntries(
  NAME_KEYBOARD_ACTION_DEFINITIONS.map((action) => [action.id, action])
));
const DIALOGUE_AI_EDIT_EVENT = "sandbots:dialogue-ai-edit-request";

function getEventKey(event) {
  return String(event?.key || "").toLowerCase();
}

export function resolveGameplayDialogueCommand(eventOrCode) {
  const code = typeof eventOrCode === "string" ? eventOrCode : eventOrCode?.code;
  const key = typeof eventOrCode === "string" ? "" : getEventKey(eventOrCode);
  if (isMovementKey(key)) {
    return GAMEPLAY_DIALOGUE_COMMANDS.CONSUME;
  }

  return GAMEPLAY_DIALOGUE_KEY_COMMANDS[code] || GAMEPLAY_DIALOGUE_COMMANDS.IGNORE;
}

function shouldConsumeGameplayDialogueKeyup(event) {
  const code = event?.code;
  return resolveGameplayDialogueCommand(event) !== GAMEPLAY_DIALOGUE_COMMANDS.IGNORE ||
    GAMEPLAY_DIALOGUE_KEYUP_CONSUME_CODES.has(code);
}

function normalizeDialogueSpeakerLabel(speaker) {
  return normalizeSandbotsVisibleText(speaker);
}

function isTruthyFlag(value) {
  return ["1", "true", "yes", "on"].includes(String(value || "").trim().toLowerCase());
}

function isDialogueAiEditorEnabledByDefault() {
  const envDev = Boolean(import.meta.env?.DEV);
  const location = globalThis.location;
  const searchParams = new URLSearchParams(location?.search || "");
  const hashParams = new URLSearchParams(String(location?.hash || "").replace(/^#/, ""));

  return envDev ||
    isTruthyFlag(searchParams.get("dialogueEditor")) ||
    isTruthyFlag(searchParams.get("dialogueAiEditor")) ||
    isTruthyFlag(hashParams.get("dialogueEditor")) ||
    isTruthyFlag(hashParams.get("dialogueAiEditor"));
}

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

export function getNameKeyboardActionDefinition(actionId) {
  return NAME_KEYBOARD_ACTIONS_BY_ID[actionId] || null;
}

function isNameKeyboardActionEnabled(actionId, canSubmit) {
  const action = getNameKeyboardActionDefinition(actionId);
  return Boolean(action && (!action.requiresText || canSubmit));
}

function buildDialogueAiInstruction({
  currentLine,
  lineIndex,
  originalText,
  proposedText
}) {
  const speaker = normalizeDialogueSpeakerLabel(currentLine?.speaker) || "Narration";

  return [
    "Please update this Sandbots gameplay dialogue line in the source code.",
    "",
    `Speaker: ${speaker}`,
    `Line index in current runtime conversation: ${lineIndex}`,
    "",
    "Current text:",
    originalText || "",
    "",
    "Requested text:",
    proposedText || "",
    "",
    "Implementation notes:",
    "- Find the matching dialogue content in the repo.",
    "- Preserve Sandbots terminology, tone, quest logic, and tests.",
    "- Update only the smallest necessary content definition and related tests."
  ].join("\n");
}

export function createGameplayDialogueController({
  uiLayer,
  clearGameFlowInput = () => {},
  onBeforeComplete = () => {},
  enableAiTextEditor = isDialogueAiEditorEnabledByDefault(),
  onAiTextEditInstruction = null
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
  const beforeCompleteListeners = new Set();
  if (typeof onBeforeComplete === "function") {
    beforeCompleteListeners.add(onBeforeComplete);
  }

  const state = {
    active: false,
    mode: "dialogue",
    lines: [],
    lineIndex: 0,
    onComplete: () => {},
    onLineChange: () => {},
    visibleText: "",
    aiEditor: {
      open: false,
      draftText: "",
      originalText: "",
      status: "",
      instruction: ""
    },
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

  function notifyBeforeComplete() {
    for (const listener of beforeCompleteListeners) {
      listener();
    }
  }

  function subscribeBeforeComplete(listener) {
    if (typeof listener !== "function") {
      return () => {};
    }

    beforeCompleteListeners.add(listener);
    return () => {
      beforeCompleteListeners.delete(listener);
    };
  }

  function resetAiEditor() {
    state.aiEditor.open = false;
    state.aiEditor.draftText = "";
    state.aiEditor.originalText = "";
    state.aiEditor.status = "";
    state.aiEditor.instruction = "";
  }

  function openAiEditor() {
    const currentLine = getCurrentLine();
    if (!enableAiTextEditor || !currentLine) {
      return;
    }

    if (!typewriter.isComplete()) {
      typewriter.complete();
    }

    state.aiEditor.open = true;
    state.aiEditor.draftText = currentLine.text || "";
    state.aiEditor.originalText = currentLine.text || "";
    state.aiEditor.status = "";
    state.aiEditor.instruction = "";
    render();
  }

  function applyAiEditorPreview() {
    const currentLine = getCurrentLine();
    if (!currentLine || !state.aiEditor.open) {
      return;
    }

    currentLine.text = state.aiEditor.draftText;
    typewriter.start(currentLine.text || "");
    typewriter.complete();
    state.aiEditor.status = "Preview applied";
    state.aiEditor.instruction = "";
    render();
  }

  function emitAiTextEditInstruction() {
    const currentLine = getCurrentLine();
    if (!currentLine || !state.aiEditor.open) {
      return;
    }

    const instruction = buildDialogueAiInstruction({
      currentLine,
      lineIndex: state.lineIndex,
      originalText: state.aiEditor.originalText,
      proposedText: state.aiEditor.draftText
    });
    const payload = {
      instruction,
      speaker: normalizeDialogueSpeakerLabel(currentLine.speaker),
      lineIndex: state.lineIndex,
      originalText: state.aiEditor.originalText,
      proposedText: state.aiEditor.draftText
    };

    if (typeof onAiTextEditInstruction === "function") {
      onAiTextEditInstruction(payload);
    }

    root.dispatchEvent(new CustomEvent(DIALOGUE_AI_EDIT_EVENT, {
      bubbles: true,
      composed: true,
      detail: payload
    }));

    if (globalThis.navigator?.clipboard?.writeText) {
      void globalThis.navigator.clipboard.writeText(instruction).catch(() => {});
    }

    state.aiEditor.instruction = instruction;
    state.aiEditor.status = "AI instruction ready below";
    render();
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
        ${currentLine.speaker ? `<div class="act-two-dialogue__speaker">${escapeHtml(normalizeDialogueSpeakerLabel(currentLine.speaker))}</div>` : ""}
        <div class="act-two-dialogue__body" data-speakerless="${currentLine.speaker ? "false" : "true"}">
          ${enableAiTextEditor ? `
            <button class="act-two-dialogue__edit-button" type="button" data-dialogue-ai-edit-toggle="true">
              Edit
            </button>
          ` : ""}
          <p class="act-two-dialogue__text">${escapeHtml(state.visibleText)}</p>
          ${enableAiTextEditor && state.aiEditor.open ? `
            <div class="act-two-dialogue__ai-editor" data-dialogue-ai-editor="true">
              <label class="act-two-dialogue__ai-label" for="dialogue-ai-editor-text">Dialogue draft</label>
              <textarea
                id="dialogue-ai-editor-text"
                class="act-two-dialogue__ai-textarea"
                data-dialogue-ai-editor-text="true"
                rows="3"
              >${escapeHtml(state.aiEditor.draftText)}</textarea>
              <div class="act-two-dialogue__ai-actions">
                <button type="button" data-dialogue-ai-apply="true">Preview</button>
                <button type="button" data-dialogue-ai-send="true">Send AI instruction</button>
                <button type="button" data-dialogue-ai-close="true">Close</button>
              </div>
              ${state.aiEditor.status ? `<span class="act-two-dialogue__ai-status">${escapeHtml(state.aiEditor.status)}</span>` : ""}
              ${state.aiEditor.instruction ? `
                <label class="act-two-dialogue__ai-label" for="dialogue-ai-instruction-text">Generated instruction</label>
                <textarea
                  id="dialogue-ai-instruction-text"
                  class="act-two-dialogue__ai-textarea act-two-dialogue__ai-textarea--instruction"
                  data-dialogue-ai-instruction-text="true"
                  rows="5"
                  readonly
                >${escapeHtml(state.aiEditor.instruction)}</textarea>
              ` : ""}
            </div>
          ` : ""}
          <div class="act-two-dialogue__hint">
            <span>X / Enter</span>
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

    root.hidden = false;
    root.innerHTML = `
      <div class="name-entry">
        <div class="name-entry__scrim"></div>
        <div class="name-entry__shell">
          <div class="name-entry__prompt">
            <strong>What should Chopper call you?</strong>
            <span>The colony will remember this name.</span>
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
            ${NAME_KEYBOARD_ACTIONS.map((actionId, colIndex) => {
              const action = getNameKeyboardActionDefinition(actionId);
              return `
              <button
                class="name-entry__action ${action?.className || ""}"
                type="button"
                data-name-action="${actionId}"
                data-name-row="${NAME_KEYBOARD_ROWS.length}"
                data-name-col="${colIndex}"
                data-enabled="${isNameKeyboardActionEnabled(actionId, canSubmit) ? "true" : "false"}"
                data-selected="${state.nameEntry.selectedRow === NAME_KEYBOARD_ROWS.length && state.nameEntry.selectedCol === colIndex ? "true" : "false"}"
              >
                ${escapeHtml(action?.label || actionId)}
              </button>
            `;
            }).join("")}
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
    resetAiEditor();
    typewriter.stop();
    syncDialogueLayerState();
    render();

    if (completed) {
      notifyBeforeComplete();
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
      resetAiEditor();
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
    resetAiEditor();
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
    resetAiEditor();
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
    if (!state.active) {
      return;
    }

    const editToggle = event.target.closest("[data-dialogue-ai-edit-toggle]");
    if (editToggle) {
      openAiEditor();
      return;
    }

    if (event.target.closest("[data-dialogue-ai-apply]")) {
      applyAiEditorPreview();
      return;
    }

    if (event.target.closest("[data-dialogue-ai-send]")) {
      emitAiTextEditInstruction();
      return;
    }

    if (event.target.closest("[data-dialogue-ai-close]")) {
      resetAiEditor();
      render();
      return;
    }

    if (state.mode !== "name-entry") {
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

  root.addEventListener("input", (event) => {
    if (!state.active || !state.aiEditor.open) {
      return;
    }

    const textarea = event.target.closest("[data-dialogue-ai-editor-text]");
    if (textarea) {
      state.aiEditor.draftText = textarea.value;
      state.aiEditor.status = "";
      state.aiEditor.instruction = "";
    }
  });

  function handleAiEditorKeydown(event) {
    if ((event.ctrlKey || event.metaKey) && event.code === "Enter") {
      emitAiTextEditInstruction();
      event.preventDefault();
      return true;
    }

    if (event.code === "Escape") {
      resetAiEditor();
      render();
      event.preventDefault();
      return true;
    }

    return true;
  }

  function handleNameEntryKeydown(event) {
    const key = getEventKey(event);

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

  function handleConversationKeydown(event) {
    const command = resolveGameplayDialogueCommand(event);
    if (command === GAMEPLAY_DIALOGUE_COMMANDS.ADVANCE) {
      if (!event.repeat) {
        advance();
      }
      event.preventDefault();
      return true;
    }

    if (command === GAMEPLAY_DIALOGUE_COMMANDS.CONSUME) {
      event.preventDefault();
      return true;
    }

    return false;
  }

  function handleKeydown(event) {
    if (!state.active) {
      return false;
    }

    if (event.target?.closest?.("[data-dialogue-ai-editor]")) {
      return handleAiEditorKeydown(event);
    }

    if (state.mode === "name-entry") {
      return handleNameEntryKeydown(event);
    }

    return handleConversationKeydown(event);
  }

  function handleKeyup(event) {
    if (!state.active) {
      return false;
    }

    if (shouldConsumeGameplayDialogueKeyup(event)) {
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
      beforeCompleteListeners.clear();
      if (typeof handler === "function") {
        beforeCompleteListeners.add(handler);
      }
    },
    subscribeBeforeComplete,
    openConversation,
    openNameEntry
  };
}
