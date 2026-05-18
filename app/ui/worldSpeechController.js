import {
  curveWorldPosition,
  resolveWorldCurvatureOrigin
} from "../../rendering/worldCurvature.js";

const LARGE_TASK_POP_MESSAGES = new Set([
  "HYDRO BOT IS ONLINE!",
  "HYDRO JET ONLINE!",
  "BIO-GROW ONLINE!",
  "YOU TOOK YOUR FIRST STEPS!",
  "YOU RESTORED THE TALL GRASS!"
]);
const FIELD_MOVE_SWITCH_CARD_MARKER = "data-field-move-switch-card";
const PLAYER_PROMPT_EXIT_MOTION_MS = 260;

export function createWorldSpeechController({ mount } = {}) {
  if (!(mount instanceof HTMLElement)) {
    throw new Error("World speech controller requires a valid mount element.");
  }
  const windowRef = mount.ownerDocument?.defaultView || globalThis;

  const layer = document.createElement("div");
  layer.dataset.worldSpeechLayer = "true";
  layer.hidden = true;
  Object.assign(layer.style, {
    position: "absolute",
    inset: "0",
    overflow: "hidden",
    pointerEvents: "none",
    zIndex: "1"
  });

  function createSpeechElement(variant) {
    const speechElement = document.createElement("div");
    speechElement.className = "act-two-tutorial__speech";
    speechElement.dataset.worldSpeechVariant = variant;
    speechElement.hidden = true;

    const bubbleElement = document.createElement("div");
    bubbleElement.className = "act-two-tutorial__speech-bubble";

    speechElement.append(bubbleElement);
    return {
      speech: speechElement,
      bubble: bubbleElement
    };
  }

  const npcSpeech = createSpeechElement("npc");
  const playerPrompt = createSpeechElement("player-prompt");
  const taskPop = createSpeechElement("task-pop");

  const speech = npcSpeech.speech;
  const bubble = npcSpeech.bubble;
  layer.append(speech);
  layer.append(playerPrompt.speech);
  layer.append(taskPop.speech);
  mount.append(layer);
  let playerPromptExitTimeout = null;

  const state = {
    active: false,
    anchorHeight: 2.35,
    worldPosition: [0, 0, 0],
    promptActive: false,
    promptAnchorHeight: 1.95,
    promptWorldPosition: [0, 0, 0],
    taskPopActive: false,
    taskPopAnchorHeight: 2.68,
    taskPopWorldPosition: [0, 0, 0]
  };

  function clearPlayerPromptExitTimeout() {
    if (playerPromptExitTimeout === null) {
      return;
    }

    windowRef.clearTimeout?.(playerPromptExitTimeout);
    playerPromptExitTimeout = null;
  }

  function finishPromptHide() {
    clearPlayerPromptExitTimeout();
    playerPrompt.speech.hidden = true;
    playerPrompt.speech.dataset.worldPromptKind = "text";
    delete playerPrompt.speech.dataset.promptMotion;
    playerPrompt.speech.style.transform = "";
    playerPrompt.speech.style.transformOrigin = "";
    playerPrompt.bubble.textContent = "";
    layer.hidden = !state.active && !state.taskPopActive;
  }

  function show({ text, worldPosition, anchorHeight = 2.35 } = {}) {
    state.active = true;
    state.anchorHeight = anchorHeight;
    state.worldPosition = worldPosition ? [...worldPosition] : [0, 0, 0];
    bubble.textContent = text || "";
    speech.hidden = false;
    layer.hidden = false;
  }

  function hide() {
    state.active = false;
    speech.hidden = true;
    layer.hidden = playerPrompt.speech.hidden && !state.taskPopActive;
  }

  function showPrompt({ text, worldPosition, anchorHeight = 1.95 } = {}) {
    const promptText = text || "";
    const isFieldMoveSwitchCard = String(promptText).includes(FIELD_MOVE_SWITCH_CARD_MARKER);

    clearPlayerPromptExitTimeout();
    state.promptActive = true;
    state.promptAnchorHeight = anchorHeight;
    state.promptWorldPosition = worldPosition ? [...worldPosition] : [0, 0, 0];
    playerPrompt.speech.dataset.worldPromptKind = isFieldMoveSwitchCard ? "field-move-switch" : "text";
    playerPrompt.speech.dataset.promptMotion = isFieldMoveSwitchCard ? "none" : "enter";
    playerPrompt.speech.style.transform = isFieldMoveSwitchCard ?
      "translate(104px, -58%) scale(calc(var(--overlay-scale) * 0.625))" :
      "";
    playerPrompt.speech.style.transformOrigin = isFieldMoveSwitchCard ? "center center" : "";

    if (isFieldMoveSwitchCard) {
      playerPrompt.bubble.innerHTML = promptText;
    } else {
      playerPrompt.bubble.textContent = promptText;
    }
    playerPrompt.speech.hidden = false;
    layer.hidden = false;

    if (!isFieldMoveSwitchCard) {
      void playerPrompt.bubble.offsetWidth;
      playerPrompt.speech.dataset.promptMotion = "enter";
    }
  }

  function hidePrompt() {
    const promptKind = playerPrompt.speech.dataset.worldPromptKind || "text";

    state.promptActive = false;
    if (promptKind !== "text" || playerPrompt.speech.hidden) {
      finishPromptHide();
      return;
    }

    playerPrompt.speech.dataset.promptMotion = "exit";
    layer.hidden = false;
    playerPromptExitTimeout = windowRef.setTimeout?.(
      finishPromptHide,
      PLAYER_PROMPT_EXIT_MOTION_MS
    ) ?? null;

    if (playerPromptExitTimeout === null) {
      finishPromptHide();
    }
  }

  function showTaskPop({ text, worldPosition, anchorHeight = 2.68 } = {}) {
    const message = text || "";
    state.taskPopActive = true;
    state.taskPopAnchorHeight = anchorHeight;
    state.taskPopWorldPosition = worldPosition ? [...worldPosition] : [0, 0, 0];
    taskPop.bubble.textContent = message;
    taskPop.speech.dataset.taskPopSize =
      LARGE_TASK_POP_MESSAGES.has(message.toUpperCase()) ? "large" : "default";
    taskPop.speech.hidden = false;
    layer.hidden = false;

    taskPop.bubble.style.animation = "none";
    void taskPop.bubble.offsetWidth;
    taskPop.bubble.style.animation = "";
  }

  function hideTaskPop() {
    state.taskPopActive = false;
    taskPop.speech.hidden = true;
    layer.hidden = !state.active && playerPrompt.speech.hidden;
  }

  function setWorldPosition(worldPosition) {
    if (!worldPosition) {
      return;
    }

    state.worldPosition = [...worldPosition];
  }

  function setPromptWorldPosition(worldPosition) {
    if (!worldPosition) {
      return;
    }

    state.promptWorldPosition = [...worldPosition];
  }

  function setTaskPopWorldPosition(worldPosition) {
    if (!worldPosition) {
      return;
    }

    state.taskPopWorldPosition = [...worldPosition];
  }

  function updateSpeechElement({
    camera,
    viewportWidth,
    viewportHeight,
    worldPosition,
    anchorHeight,
    speechElement
  }) {
    const cameraTarget = camera.getPose?.()?.target || [0, 0, 0];
    const curvatureOrigin = resolveWorldCurvatureOrigin(cameraTarget);
    const curvedWorldPosition = curveWorldPosition(worldPosition, curvatureOrigin);
    const projected = camera.project(
      [
        curvedWorldPosition[0],
        curvedWorldPosition[1] + anchorHeight,
        curvedWorldPosition[2]
      ],
      viewportWidth,
      viewportHeight
    );

    speechElement.style.left = `${projected.x}px`;
    speechElement.style.top = `${projected.y}px`;
    speechElement.style.opacity = projected.depth > 1 ? "0" : "1";
  }

  function update(camera, viewportWidth, viewportHeight) {
    if (!state.active) {
      return;
    }

    updateSpeechElement({
      camera,
      viewportWidth,
      viewportHeight,
      worldPosition: state.worldPosition,
      anchorHeight: state.anchorHeight,
      speechElement: speech
    });
  }

  function updatePrompt(camera, viewportWidth, viewportHeight) {
    if (!state.promptActive) {
      return;
    }

    updateSpeechElement({
      camera,
      viewportWidth,
      viewportHeight,
      worldPosition: state.promptWorldPosition,
      anchorHeight: state.promptAnchorHeight,
      speechElement: playerPrompt.speech
    });
  }

  function updateTaskPop(camera, viewportWidth, viewportHeight) {
    if (!state.taskPopActive) {
      return;
    }

    updateSpeechElement({
      camera,
      viewportWidth,
      viewportHeight,
      worldPosition: state.taskPopWorldPosition,
      anchorHeight: state.taskPopAnchorHeight,
      speechElement: taskPop.speech
    });
  }

  return {
    hide,
    hideTaskPop,
    hidePrompt,
    isVisible() {
      return state.active;
    },
    isPromptVisible() {
      return state.promptActive;
    },
    isTaskPopVisible() {
      return state.taskPopActive;
    },
    setPromptWorldPosition,
    setTaskPopWorldPosition,
    setWorldPosition,
    show,
    showTaskPop,
    showPrompt,
    updateTaskPop,
    updatePrompt,
    update
  };
}
