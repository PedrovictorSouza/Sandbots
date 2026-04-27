import { GAME_INPUT_BINDINGS } from "./gameInputBindings.js";

function isTypingTarget(target) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName;
  return (
    target.isContentEditable ||
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT"
  );
}

function isMovementKey(key) {
  return key === "w" || key === "a" || key === "s" || key === "d";
}

const POINTER_YAW_SENSITIVITY = 0.0032;
const POINTER_PITCH_SENSITIVITY = 0.0024;
const GAMEPAD_LOOK_SPEED = 2.35;
const GAMEPAD_DEADZONE = 0.16;

function applyDeadzone(value) {
  const magnitude = Math.abs(value);

  if (magnitude < GAMEPAD_DEADZONE) {
    return 0;
  }

  return Math.sign(value) * ((magnitude - GAMEPAD_DEADZONE) / (1 - GAMEPAD_DEADZONE));
}

export function createGameInputController({
  pressedKeys,
  cameraTurnKeys,
  clearGameFlowInput,
  isPokedexOpen,
  pokedexEntry,
  sceneDirector,
  isBuilderPanelOpen,
  setBuilderPanelOpen,
  requestHarvest,
  requestInteract,
  requestPauseToggle,
  inspectBag = () => {},
  windowRef = null
}) {
  const cameraLookDelta = {
    yaw: 0,
    pitch: 0
  };
  const gamepadMovement = {
    x: 0,
    y: 0
  };
  let gamepadActionButtonPressed = false;
  let gamepadRunButtonPressed = false;
  let gamepadJumpButtonPressed = false;
  let gamepadCameraZoomButtonPressed = false;
  let gamepadPauseButtonPressed = false;
  let primaryActionPressed = false;
  let cameraZoomCycleRequests = 0;
  let jumpRequests = 0;

  function createPrimaryButtonEvent() {
    return {
      code: GAME_INPUT_BINDINGS.primaryAction.keyboardCode,
      key: "Enter",
      repeat: false,
      target: null,
      preventDefault() {}
    };
  }

  function shouldIgnoreLookInput(target) {
    return (
      isPokedexOpen() ||
      sceneDirector.blocksGameplayInput() ||
      isBuilderPanelOpen() ||
      isTypingTarget(target)
    );
  }

  function isRunKey(event) {
    return GAME_INPUT_BINDINGS.run.keyboardCodes.includes(event.code);
  }

  function isCameraZoomCycleKey(event) {
    return event.code === GAME_INPUT_BINDINGS.cameraZoomCycle.keyboardCode;
  }

  function isPauseKey(event) {
    return event.code === GAME_INPUT_BINDINGS.pause.keyboardCode;
  }

  function isJumpKey(event) {
    return event.code === GAME_INPUT_BINDINGS.jump.keyboardCode;
  }

  function handleKeydown(event) {
    const key = event.key.toLowerCase();
    const typingTarget = isTypingTarget(event.target);
    const builderPanelOpen = isBuilderPanelOpen();

    if (isPauseKey(event) && !typingTarget) {
      if (!event.repeat) {
        requestPauseToggle?.();
      }
      event.preventDefault();
      return;
    }

    if (isPokedexOpen()) {
      clearGameFlowInput();
      if (pokedexEntry.handleKeydown(event)) {
        return;
      }

      event.preventDefault();
      return;
    }

    if (sceneDirector.blocksGameplayInput()) {
      clearGameFlowInput();
      sceneDirector.handleKeydown(event);
      return;
    }

    if (sceneDirector.handleKeydown(event)) {
      return;
    }

    if (!typingTarget && !builderPanelOpen && (event.code === "ArrowLeft" || event.code === "ArrowRight")) {
      cameraTurnKeys.add(event.code);
      event.preventDefault();
      return;
    }

    if (event.code === "Escape" && builderPanelOpen) {
      setBuilderPanelOpen(false);
      event.preventDefault();
      return;
    }

    if (event.code === "KeyM" && !typingTarget) {
      if (!event.repeat) {
        setBuilderPanelOpen(!builderPanelOpen);
      }
      event.preventDefault();
      return;
    }

    if (event.code === "KeyX" && !typingTarget) {
      if (!event.repeat) {
        inspectBag();
      }
      event.preventDefault();
      return;
    }

    if (builderPanelOpen) {
      if (!typingTarget && (
        event.code === GAME_INPUT_BINDINGS.primaryAction.keyboardCode ||
        isJumpKey(event) ||
        event.code === "KeyE" ||
        isMovementKey(key) ||
        isRunKey(event) ||
        isCameraZoomCycleKey(event) ||
        isPauseKey(event)
      )) {
        event.preventDefault();
      }
      return;
    }

    if (isJumpKey(event) && !typingTarget) {
      if (!event.repeat) {
        jumpRequests += 1;
      }
      event.preventDefault();
      return;
    }

    if (isCameraZoomCycleKey(event) && !typingTarget) {
      if (!event.repeat) {
        cameraZoomCycleRequests += 1;
      }
      event.preventDefault();
      return;
    }

    if (isRunKey(event) && !typingTarget) {
      pressedKeys.add("shift");
      event.preventDefault();
      return;
    }

    if (event.code === GAME_INPUT_BINDINGS.primaryAction.keyboardCode) {
      primaryActionPressed = true;
      if (!event.repeat) {
        requestHarvest();
      }
      event.preventDefault();
      return;
    }

    if (event.code === "KeyE") {
      if (!event.repeat) {
        requestInteract();
      }
      event.preventDefault();
      return;
    }

    if (!isMovementKey(key)) {
      return;
    }

    pressedKeys.add(key);
    event.preventDefault();
  }

  function handleKeyup(event) {
    const key = event.key.toLowerCase();

    if (event.code === GAME_INPUT_BINDINGS.primaryAction.keyboardCode) {
      primaryActionPressed = false;
    }

    if (isPokedexOpen()) {
      clearGameFlowInput();
      event.preventDefault();
      return;
    }

    if (sceneDirector.blocksGameplayInput()) {
      clearGameFlowInput();
      sceneDirector.handleKeyup(event);
      return;
    }

    if (sceneDirector.handleKeyup(event)) {
      return;
    }

    if (isBuilderPanelOpen()) {
      if (!isTypingTarget(event.target) && (isMovementKey(key) || isRunKey(event) || isCameraZoomCycleKey(event))) {
        pressedKeys.delete(key);
        if (isRunKey(event)) {
          pressedKeys.delete("shift");
        }
        event.preventDefault();
      }
      return;
    }

    if (isRunKey(event)) {
      pressedKeys.delete("shift");
      event.preventDefault();
      return;
    }

    if (isJumpKey(event)) {
      event.preventDefault();
      return;
    }

    if (event.code === "KeyX") {
      event.preventDefault();
      return;
    }

    if (event.code === "ArrowLeft" || event.code === "ArrowRight") {
      cameraTurnKeys.delete(event.code);
      event.preventDefault();
      return;
    }

    if (!isMovementKey(key)) {
      return;
    }

    pressedKeys.delete(key);
    event.preventDefault();
  }

  function handlePointerMove(event) {
    if (shouldIgnoreLookInput(event.target)) {
      return;
    }

    const movementX = Number(event.movementX || 0);
    const movementY = Number(event.movementY || 0);

    if (movementX === 0 && movementY === 0) {
      return;
    }

    cameraLookDelta.yaw += movementX * POINTER_YAW_SENSITIVITY;
    cameraLookDelta.pitch -= movementY * POINTER_PITCH_SENSITIVITY;
  }

  function updateGamepads(deltaTime) {
    gamepadMovement.x = 0;
    gamepadMovement.y = 0;
    let actionButtonPressed = false;
    let runButtonPressed = false;
    let jumpButtonPressed = false;
    let zoomButtonPressed = false;
    let pauseButtonPressed = false;

    const navigatorRef = windowRef?.navigator;
    const gamepads = navigatorRef?.getGamepads?.();

    if (!gamepads) {
      gamepadActionButtonPressed = false;
      gamepadRunButtonPressed = false;
      gamepadJumpButtonPressed = false;
      gamepadCameraZoomButtonPressed = false;
      gamepadPauseButtonPressed = false;
      return;
    }

    for (const gamepad of gamepads) {
      if (!gamepad) {
        continue;
      }

      actionButtonPressed = actionButtonPressed ||
        Boolean(gamepad.buttons?.[GAME_INPUT_BINDINGS.primaryAction.gamepadButton]?.pressed);
      runButtonPressed = runButtonPressed ||
        Boolean(gamepad.buttons?.[GAME_INPUT_BINDINGS.run.gamepadButton]?.pressed);
      jumpButtonPressed = jumpButtonPressed ||
        Boolean(gamepad.buttons?.[GAME_INPUT_BINDINGS.jump.gamepadButton]?.pressed);
      zoomButtonPressed = zoomButtonPressed ||
        Boolean(gamepad.buttons?.[GAME_INPUT_BINDINGS.cameraZoomCycle.gamepadButton]?.pressed) ||
        Number(gamepad.buttons?.[GAME_INPUT_BINDINGS.cameraZoomCycle.gamepadButton]?.value || 0) > 0.55;
      pauseButtonPressed = pauseButtonPressed ||
        Boolean(gamepad.buttons?.[GAME_INPUT_BINDINGS.pause.gamepadButton]?.pressed);

      const moveX = applyDeadzone(Number(gamepad.axes?.[0] || 0));
      const moveY = applyDeadzone(Number(gamepad.axes?.[1] || 0));
      const lookX = applyDeadzone(Number(gamepad.axes?.[2] || 0));
      const lookY = applyDeadzone(Number(gamepad.axes?.[3] || 0));

      if (moveX !== 0 || moveY !== 0) {
        gamepadMovement.x = moveX;
        gamepadMovement.y = moveY;
      }

      if (!shouldIgnoreLookInput(null)) {
        cameraLookDelta.yaw += lookX * GAMEPAD_LOOK_SPEED * deltaTime;
        cameraLookDelta.pitch -= lookY * GAMEPAD_LOOK_SPEED * deltaTime;
      }

      if (moveX !== 0 || moveY !== 0 || lookX !== 0 || lookY !== 0) {
        continue;
      }
    }

    gamepadRunButtonPressed = runButtonPressed;
    primaryActionPressed = actionButtonPressed;

    if (jumpButtonPressed && !gamepadJumpButtonPressed) {
      jumpRequests += 1;
    }

    gamepadJumpButtonPressed = jumpButtonPressed;

    if (zoomButtonPressed && !gamepadCameraZoomButtonPressed && !isPokedexOpen() && !isBuilderPanelOpen()) {
      cameraZoomCycleRequests += 1;
    }

    gamepadCameraZoomButtonPressed = zoomButtonPressed;

    if (pauseButtonPressed && !gamepadPauseButtonPressed) {
      requestPauseToggle?.();
    }

    gamepadPauseButtonPressed = pauseButtonPressed;

    if (actionButtonPressed && !gamepadActionButtonPressed) {
      const primaryEvent = createPrimaryButtonEvent();

      if (isPokedexOpen()) {
        clearGameFlowInput();
        pokedexEntry.handleKeydown(primaryEvent);
      } else if (!sceneDirector.handleKeydown(primaryEvent) && !isBuilderPanelOpen()) {
        requestHarvest();
      }
    }

    gamepadActionButtonPressed = actionButtonPressed;
  }

  function consumeCameraZoomCycleRequest() {
    if (cameraZoomCycleRequests <= 0) {
      return false;
    }

    cameraZoomCycleRequests -= 1;
    return true;
  }

  function consumeJumpRequest() {
    if (jumpRequests <= 0) {
      return false;
    }

    jumpRequests -= 1;
    return true;
  }

  function consumeCameraLookDelta() {
    const consumed = {
      yaw: cameraLookDelta.yaw,
      pitch: cameraLookDelta.pitch
    };

    cameraLookDelta.yaw = 0;
    cameraLookDelta.pitch = 0;

    return consumed;
  }

  function clearCameraLookInput() {
    cameraLookDelta.yaw = 0;
    cameraLookDelta.pitch = 0;
  }

  function getAnalogMovement() {
    return {
      x: gamepadMovement.x,
      y: gamepadMovement.y
    };
  }

  function isRunActive() {
    return pressedKeys.has("shift") || gamepadRunButtonPressed;
  }

  function isPrimaryActionActive() {
    return primaryActionPressed;
  }

  return {
    handleKeydown,
    handleKeyup,
    handlePointerMove,
    updateGamepads,
    consumeCameraLookDelta,
    clearCameraLookInput,
    consumeCameraZoomCycleRequest,
    consumeJumpRequest,
    getAnalogMovement,
    isRunActive,
    isPrimaryActionActive
  };
}
