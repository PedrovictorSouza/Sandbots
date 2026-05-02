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
    lines: [],
    lineIndex: 0,
    onComplete: () => {},
    onBeforeComplete,
    onLineChange: () => {},
    visibleText: ""
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

  function close({ completed = false } = {}) {
    const onComplete = state.onComplete;
    state.active = false;
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

  function handleKeydown(event) {
    if (!state.active) {
      return false;
    }

    const key = event.key.toLowerCase();

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
    openConversation
  };
}
