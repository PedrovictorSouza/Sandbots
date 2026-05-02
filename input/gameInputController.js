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
  requestPokedexOpen = () => {},
  requestFollowerCall = () => {},
  requestMoveCycle = () => {},
  shouldBagButtonInteract = () => false,
  shouldGamepadButtonHarvest = () => false,
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
  let gamepadPokedexButtonPressed = false;
  let gamepadBagButtonPressed = false;
  let gamepadFollowerCallButtonPressed = false;
  let gamepadPreviousMoveButtonPressed = false;
  let gamepadNextMoveButtonPressed = false;
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

  function createBagButtonEvent() {
    return {
      code: GAME_INPUT_BINDINGS.bag.keyboardCode,
      key: "x",
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

  function isPokedexKey(event) {
    return event.code === GAME_INPUT_BINDINGS.pokedex.keyboardCode;
  }

  function isBagKey(event) {
    return event.code === GAME_INPUT_BINDINGS.bag.keyboardCode;
  }

  function isFollowerCallKey(event) {
    return event.code === GAME_INPUT_BINDINGS.followerCall.keyboardCode;
  }

  function isPreviousMoveKey(event) {
    return event.code === GAME_INPUT_BINDINGS.previousMove.keyboardCode;
  }

  function isNextMoveKey(event) {
    return event.code === GAME_INPUT_BINDINGS.nextMove.keyboardCode;
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

    if (!typingTarget && !builderPanelOpen && (isPreviousMoveKey(event) || isNextMoveKey(event))) {
      if (!event.repeat) {
        requestMoveCycle(isPreviousMoveKey(event) ? -1 : 1);
      }
      event.preventDefault();
      return;
    }

    if (event.code === "Escape" && builderPanelOpen) {
      setBuilderPanelOpen(false);
      event.preventDefault();
      return;
    }

    if (isPokedexKey(event) && !typingTarget) {
      if (!event.repeat) {
        requestPokedexOpen();
      }
      event.preventDefault();
      return;
    }

    if (isFollowerCallKey(event) && !typingTarget && !builderPanelOpen) {
      if (!event.repeat) {
        requestFollowerCall();
      }
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

    if (isBagKey(event) && !typingTarget) {
      if (!event.repeat) {
        if (shouldBagButtonInteract()) {
          requestInteract();
        } else {
          inspectBag();
        }
      }
      event.preventDefault();
      return;
    }

    if (builderPanelOpen) {
      if (!typingTarget && (
        event.code === GAME_INPUT_BINDINGS.primaryAction.keyboardCode ||
        isBagKey(event) ||
        isFollowerCallKey(event) ||
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
        requestHarvest({ source: "keyboardPrimary" });
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

    if (isBagKey(event)) {
      event.preventDefault();
      return;
    }

    if (isFollowerCallKey(event)) {
      event.preventDefault();
      return;
    }

    if (isPokedexKey(event)) {
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
    let pokedexButtonPressed = false;
    let bagButtonPressed = false;
    let followerCallButtonPressed = false;
    let previousMoveButtonPressed = false;
    let nextMoveButtonPressed = false;

    const navigatorRef = windowRef?.navigator;
    const gamepads = navigatorRef?.getGamepads?.();

    if (!gamepads) {
      gamepadActionButtonPressed = false;
      gamepadRunButtonPressed = false;
      gamepadJumpButtonPressed = false;
      gamepadCameraZoomButtonPressed = false;
      gamepadPauseButtonPressed = false;
      gamepadPokedexButtonPressed = false;
      gamepadBagButtonPressed = false;
      gamepadFollowerCallButtonPressed = false;
      gamepadPreviousMoveButtonPressed = false;
      gamepadNextMoveButtonPressed = false;
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
      pokedexButtonPressed = pokedexButtonPressed ||
        Boolean(gamepad.buttons?.[GAME_INPUT_BINDINGS.pokedex.gamepadButton]?.pressed);
      bagButtonPressed = bagButtonPressed ||
        Boolean(gamepad.buttons?.[GAME_INPUT_BINDINGS.bag.gamepadButton]?.pressed);
      followerCallButtonPressed = followerCallButtonPressed ||
        Boolean(gamepad.buttons?.[GAME_INPUT_BINDINGS.followerCall.gamepadButton]?.pressed);
      previousMoveButtonPressed = previousMoveButtonPressed ||
        Boolean(gamepad.buttons?.[GAME_INPUT_BINDINGS.previousMove.gamepadButton]?.pressed);
      nextMoveButtonPressed = nextMoveButtonPressed ||
        Boolean(gamepad.buttons?.[GAME_INPUT_BINDINGS.nextMove.gamepadButton]?.pressed);

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

    if (
      previousMoveButtonPressed &&
      !gamepadPreviousMoveButtonPressed &&
      !isPokedexOpen() &&
      !sceneDirector.blocksGameplayInput() &&
      !isBuilderPanelOpen()
    ) {
      requestMoveCycle(-1);
    }

    gamepadPreviousMoveButtonPressed = previousMoveButtonPressed;

    if (
      nextMoveButtonPressed &&
      !gamepadNextMoveButtonPressed &&
      !isPokedexOpen() &&
      !sceneDirector.blocksGameplayInput() &&
      !isBuilderPanelOpen()
    ) {
      requestMoveCycle(1);
    }

    gamepadNextMoveButtonPressed = nextMoveButtonPressed;

    if (
      runButtonPressed &&
      !gamepadRunButtonPressed &&
      !isPokedexOpen() &&
      !sceneDirector.blocksGameplayInput() &&
      !isBuilderPanelOpen()
    ) {
      if (shouldGamepadButtonHarvest({ source: "gamepadRun" })) {
        requestHarvest({ source: "gamepadRun" });
      } else {
        requestInteract();
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

    if (
      pokedexButtonPressed &&
      !gamepadPokedexButtonPressed &&
      !isPokedexOpen() &&
      !sceneDirector.blocksGameplayInput()
    ) {
      requestPokedexOpen();
    }

    gamepadPokedexButtonPressed = pokedexButtonPressed;

    if (
      bagButtonPressed &&
      !gamepadBagButtonPressed &&
      isPokedexOpen()
    ) {
      clearGameFlowInput();
      pokedexEntry.handleKeydown(createBagButtonEvent());
    } else if (
      bagButtonPressed &&
      !gamepadBagButtonPressed &&
      !sceneDirector.blocksGameplayInput() &&
      !isBuilderPanelOpen()
    ) {
      const bagEvent = createBagButtonEvent();
      if (sceneDirector.handleKeydown(bagEvent)) {
        // The active gameplay scene consumed X, usually to advance dialogue.
      } else if (shouldGamepadButtonHarvest({ source: "gamepadBag" })) {
        requestHarvest({ source: "gamepadBag" });
      } else if (shouldBagButtonInteract()) {
        requestInteract();
      } else {
        inspectBag();
      }
    }

    gamepadBagButtonPressed = bagButtonPressed;

    if (
      followerCallButtonPressed &&
      !gamepadFollowerCallButtonPressed &&
      !isPokedexOpen() &&
      !sceneDirector.blocksGameplayInput() &&
      !isBuilderPanelOpen()
    ) {
      requestFollowerCall();
    }

    gamepadFollowerCallButtonPressed = followerCallButtonPressed;

    if (actionButtonPressed && !gamepadActionButtonPressed) {
      const primaryEvent = createPrimaryButtonEvent();

      if (isPokedexOpen()) {
        clearGameFlowInput();
        pokedexEntry.handleKeydown(primaryEvent);
      } else if (!sceneDirector.handleKeydown(primaryEvent) && !isBuilderPanelOpen()) {
        requestHarvest({ source: "gamepadPrimary" });
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
