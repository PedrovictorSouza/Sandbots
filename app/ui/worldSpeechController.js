export function createWorldSpeechController({ mount } = {}) {
  if (!(mount instanceof HTMLElement)) {
    throw new Error("World speech controller requires a valid mount element.");
  }

  const layer = document.createElement("div");
  layer.dataset.worldSpeechLayer = "true";
  layer.hidden = true;
  Object.assign(layer.style, {
    position: "absolute",
    inset: "0",
    overflow: "hidden",
    pointerEvents: "none",
    zIndex: "18"
  });

  function createSpeechElement(variant) {
    const speechElement = document.createElement("div");
    speechElement.className = "act-two-tutorial__speech";
    speechElement.dataset.worldSpeechVariant = variant;

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

  const speech = npcSpeech.speech;
  const bubble = npcSpeech.bubble;
  layer.append(speech);
  layer.append(playerPrompt.speech);
  mount.append(layer);

  const state = {
    active: false,
    anchorHeight: 2.35,
    worldPosition: [0, 0, 0],
    promptActive: false,
    promptAnchorHeight: 1.95,
    promptWorldPosition: [0, 0, 0]
  };

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
    layer.hidden = !state.promptActive;
  }

  function showPrompt({ text, worldPosition, anchorHeight = 1.95 } = {}) {
    state.promptActive = true;
    state.promptAnchorHeight = anchorHeight;
    state.promptWorldPosition = worldPosition ? [...worldPosition] : [0, 0, 0];
    playerPrompt.bubble.textContent = text || "";
    playerPrompt.speech.hidden = false;
    layer.hidden = false;
  }

  function hidePrompt() {
    state.promptActive = false;
    playerPrompt.speech.hidden = true;
    layer.hidden = !state.active;
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

  function updateSpeechElement({
    camera,
    viewportWidth,
    viewportHeight,
    worldPosition,
    anchorHeight,
    speechElement
  }) {
    const projected = camera.project(
      [
        worldPosition[0],
        worldPosition[1] + anchorHeight,
        worldPosition[2]
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

  return {
    hide,
    hidePrompt,
    isVisible() {
      return state.active;
    },
    isPromptVisible() {
      return state.promptActive;
    },
    setPromptWorldPosition,
    setWorldPosition,
    show,
    showPrompt,
    updatePrompt,
    update
  };
}
