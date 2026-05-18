import {
  GAME_INPUT_ACTION_IDS,
  GAME_INPUT_BINDINGS,
  GAMEPAD_BUTTONS,
  getKeyboardBindingCode,
  normalizeKeyboardControls
} from "./gameInputBindings.js";
import {
  createInputModalityTracker,
  GAMEPAD_LAYOUT,
  resolveGamepadLayout
} from "./inputModality.js";

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

const POINTER_YAW_SENSITIVITY = 0.0032;
const POINTER_PITCH_SENSITIVITY = 0.0024;
const GAMEPAD_LOOK_SPEED = 2.35;
const GAMEPAD_DEADZONE = 0.16;
const GAMEPAD_SETTINGS_ANALOG_NAVIGATION_THRESHOLD = 0.45;
const GAMEPAD_DIALOGUE_ANALOG_NAVIGATION_THRESHOLD = 0.45;
const GAMEPAD_LEFT_SHOULDER_BUTTON = 4;
const GAMEPAD_RIGHT_SHOULDER_BUTTON = 5;
const GAMEPAD_FACE_BUTTON_PRESS_THRESHOLD = 0.55;
const CINEMATIC_SKIP_KEY_CODES = new Set(["Enter", "KeyX", "Space", "Escape"]);

function applyDeadzone(value) {
  const magnitude = Math.abs(value);

  if (magnitude < GAMEPAD_DEADZONE) {
    return 0;
  }

  return Math.sign(value) * ((magnitude - GAMEPAD_DEADZONE) / (1 - GAMEPAD_DEADZONE));
}

function isNintendoStyleGamepad(gamepad) {
  return resolveGamepadLayout(gamepad) === GAMEPAD_LAYOUT.NINTENDO;
}

function resolveLogicalFaceButton(gamepad, button) {
  if (!isNintendoStyleGamepad(gamepad)) {
    return button;
  }

  if (button === GAMEPAD_BUTTONS.X) {
    return GAMEPAD_BUTTONS.Y;
  }

  if (button === GAMEPAD_BUTTONS.Y) {
    return GAMEPAD_BUTTONS.X;
  }

  return button;
}

function isLogicalGamepadButtonPressed(gamepad, button) {
  const resolvedButton = resolveLogicalFaceButton(gamepad, button);
  const buttonState = gamepad?.buttons?.[resolvedButton];
  return Boolean(buttonState?.pressed) ||
    Number(buttonState?.value || 0) > GAMEPAD_FACE_BUTTON_PRESS_THRESHOLD;
}

function isGamepadButtonPressed(gamepad, button) {
  const buttonState = gamepad?.buttons?.[button];
  return Boolean(buttonState?.pressed) ||
    Number(buttonState?.value || 0) > GAMEPAD_FACE_BUTTON_PRESS_THRESHOLD;
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
  requestSettingsOpen = () => {},
  requestFollowerCall = () => {},
  requestMoveCycle = () => {},
  shouldBagButtonInteract = () => false,
  shouldGamepadButtonHarvest = () => false,
  isWorkbenchModalOpen = () => false,
  handleWorkbenchModalKeydown = () => false,
  isSettingsOpen = () => false,
  handleSettingsKeydown = () => false,
  isGameplayDialogueActive = () => false,
  isGameplayCinematicInputActive = () => false,
  inspectBag = () => {},
  getKeyboardControls = () => null,
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
  const inputModality = createInputModalityTracker();
  let gamepadActionButtonPressed = false;
  let gamepadRunButtonPressed = false;
  let gamepadJumpButtonPressed = false;
  let gamepadCameraZoomButtonPressed = false;
  let gamepadPauseButtonPressed = false;
  let gamepadPokedexButtonPressed = false;
  let gamepadSettingsButtonPressed = false;
  let gamepadBagButtonPressed = false;
  let gamepadDestroyActionButtonPressed = false;
  let gamepadFollowerCallButtonPressed = false;
  let gamepadSettingsPreviousTabButtonPressed = false;
  let gamepadSettingsNextTabButtonPressed = false;
  let gamepadSettingsNavigateDownButtonPressed = false;
  let gamepadSettingsNavigateLeftAxisPressed = false;
  let gamepadSettingsNavigateRightAxisPressed = false;
  let gamepadSettingsNavigateUpAxisPressed = false;
  let gamepadSettingsNavigateDownAxisPressed = false;
  let gamepadDialogueNavigateLeftAxisPressed = false;
  let gamepadDialogueNavigateRightAxisPressed = false;
  let gamepadDialogueNavigateUpAxisPressed = false;
  let gamepadDialogueNavigateDownAxisPressed = false;
  let gamepadPreviousMoveButtonPressed = false;
  let gamepadNextMoveButtonPressed = false;
  let primaryActionPressed = false;
  const cinematicSkipKeysDown = new Set();
  let cameraZoomCycleRequests = 0;
  let jumpRequests = 0;
  let placementRotationRequests = 0;
  let destroyActionRequests = 0;

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

  function createJumpButtonEvent() {
    return {
      code: GAME_INPUT_BINDINGS.jump.keyboardCode,
      key: " ",
      repeat: false,
      target: null,
      preventDefault() {}
    };
  }

  function createPokedexPageButtonEvent(direction) {
    const code = direction < 0 ?
      GAME_INPUT_BINDINGS.previousMove.keyboardCode :
      GAME_INPUT_BINDINGS.nextMove.keyboardCode;

    return {
      code,
      key: code,
      repeat: false,
      target: null,
      preventDefault() {}
    };
  }

  function createSettingsCancelButtonEvent() {
    return {
      code: "KeyB",
      key: "b",
      repeat: false,
      target: null,
      preventDefault() {}
    };
  }

  function createSettingsNavigationButtonEvent(direction) {
    const code = direction < 0 ? "ArrowUp" : "ArrowDown";

    return {
      code,
      key: code,
      repeat: false,
      target: null,
      preventDefault() {}
    };
  }

  function createSettingsHorizontalButtonEvent(direction) {
    const code = direction < 0 ? "ArrowLeft" : "ArrowRight";

    return {
      code,
      key: code,
      repeat: false,
      target: null,
      preventDefault() {}
    };
  }

  function createSettingsTabButtonEvent(direction) {
    const code = direction < 0 ? "PageUp" : "PageDown";

    return {
      code,
      key: code,
      repeat: false,
      target: null,
      preventDefault() {}
    };
  }

  function shouldIgnoreLookInput(target) {
    return (
      isWorkbenchModalOpen() ||
      isSettingsOpen() ||
      isGameplayDialogueActive() ||
      isGameplayCinematicInputActive() ||
      isPokedexOpen() ||
      sceneDirector.blocksGameplayInput() ||
      isBuilderPanelOpen() ||
      isTypingTarget(target)
    );
  }

  function getEffectiveKeyboardControls() {
    return normalizeKeyboardControls(getKeyboardControls?.());
  }

  function isKeyboardActionKey(event, actionId) {
    const code = getKeyboardBindingCode(getEffectiveKeyboardControls(), actionId);
    return Boolean(code) && event.code === code;
  }

  function getMovementLogicalKey(event) {
    const controls = getEffectiveKeyboardControls();

    if (event.code === getKeyboardBindingCode(controls, GAME_INPUT_ACTION_IDS.MOVE_UP)) {
      return "w";
    }

    if (event.code === getKeyboardBindingCode(controls, GAME_INPUT_ACTION_IDS.MOVE_LEFT)) {
      return "a";
    }

    if (event.code === getKeyboardBindingCode(controls, GAME_INPUT_ACTION_IDS.MOVE_DOWN)) {
      return "s";
    }

    if (event.code === getKeyboardBindingCode(controls, GAME_INPUT_ACTION_IDS.MOVE_RIGHT)) {
      return "d";
    }

    return "";
  }

  function isRunKey(event) {
    const runCode = getKeyboardBindingCode(getEffectiveKeyboardControls(), GAME_INPUT_ACTION_IDS.RUN);
    if (runCode === "ShiftLeft" || runCode === "ShiftRight") {
      return event.code === "ShiftLeft" || event.code === "ShiftRight";
    }
    return event.code === runCode;
  }

  function isCameraZoomCycleKey(event) {
    return isKeyboardActionKey(event, GAME_INPUT_ACTION_IDS.CAMERA_ZOOM_CYCLE);
  }

  function isPauseKey(event) {
    return isKeyboardActionKey(event, GAME_INPUT_ACTION_IDS.PAUSE);
  }

  function isPokedexKey(event) {
    return isKeyboardActionKey(event, GAME_INPUT_ACTION_IDS.POKEDEX);
  }

  function isBagKey(event) {
    return isKeyboardActionKey(event, GAME_INPUT_ACTION_IDS.BAG);
  }

  function isDestroyActionKey(event) {
    return isKeyboardActionKey(event, GAME_INPUT_ACTION_IDS.DESTROY_ACTION);
  }

  function isFollowerCallKey(event) {
    return isKeyboardActionKey(event, GAME_INPUT_ACTION_IDS.FOLLOWER_CALL);
  }

  function isPreviousMoveKey(event) {
    return isKeyboardActionKey(event, GAME_INPUT_ACTION_IDS.PREVIOUS_MOVE);
  }

  function isNextMoveKey(event) {
    return isKeyboardActionKey(event, GAME_INPUT_ACTION_IDS.NEXT_MOVE);
  }

  function isJumpKey(event) {
    return isKeyboardActionKey(event, GAME_INPUT_ACTION_IDS.JUMP);
  }

  function isCinematicSkipKey(event) {
    return CINEMATIC_SKIP_KEY_CODES.has(event?.code);
  }

  function isActiveGamepadInput(gamepad) {
    const hasActiveButton = Array.from(gamepad?.buttons || []).some((button) => (
      Boolean(button?.pressed) ||
      Number(button?.value || 0) > GAMEPAD_FACE_BUTTON_PRESS_THRESHOLD
    ));

    if (hasActiveButton) {
      return true;
    }

    return Array.from(gamepad?.axes || []).some((axis) => (
      Math.abs(Number(axis || 0)) >= GAMEPAD_DEADZONE
    ));
  }

  function handleKeydown(event) {
    if (!event.repeat) {
      inputModality.recordKeyboardInput();
    }

    const movementKey = getMovementLogicalKey(event);
    const typingTarget = isTypingTarget(event.target);
    const builderPanelOpen = isBuilderPanelOpen();

    if (!event.repeat && isCinematicSkipKey(event)) {
      cinematicSkipKeysDown.add(event.code);
    }

    if (!typingTarget && isWorkbenchModalOpen()) {
      clearGameFlowInput();
      handleWorkbenchModalKeydown(event);
      event.preventDefault();
      return;
    }

    if (!typingTarget && isSettingsOpen()) {
      clearGameFlowInput();
      handleSettingsKeydown(event);
      event.preventDefault();
      return;
    }

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

    if (!typingTarget && isGameplayCinematicInputActive()) {
      clearGameFlowInput();
      if (
        isCinematicSkipKey(event) ||
        movementKey ||
        isKeyboardActionKey(event, GAME_INPUT_ACTION_IDS.INTERACT) ||
        isBagKey(event) ||
        isDestroyActionKey(event) ||
        isFollowerCallKey(event) ||
        isJumpKey(event) ||
        isCameraZoomCycleKey(event)
      ) {
        event.preventDefault();
        return;
      }
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
        } else if (shouldGamepadButtonHarvest({ source: "gamepadBag" })) {
          requestHarvest({ source: "gamepadBag" });
        } else {
          inspectBag();
        }
      }
      event.preventDefault();
      return;
    }

    if (isDestroyActionKey(event) && !typingTarget && !builderPanelOpen) {
      if (!event.repeat) {
        destroyActionRequests += 1;
      }
      event.preventDefault();
      return;
    }

    if (builderPanelOpen) {
      if (!typingTarget && (
        isKeyboardActionKey(event, GAME_INPUT_ACTION_IDS.PRIMARY_ACTION) ||
        isBagKey(event) ||
        isDestroyActionKey(event) ||
        isFollowerCallKey(event) ||
        isJumpKey(event) ||
        isKeyboardActionKey(event, GAME_INPUT_ACTION_IDS.INTERACT) ||
        movementKey ||
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

    if (isKeyboardActionKey(event, GAME_INPUT_ACTION_IDS.PRIMARY_ACTION)) {
      primaryActionPressed = true;
      if (!event.repeat) {
        requestHarvest({ source: "keyboardPrimary" });
      }
      event.preventDefault();
      return;
    }

    if (isKeyboardActionKey(event, GAME_INPUT_ACTION_IDS.INTERACT)) {
      if (!event.repeat) {
        requestInteract();
      }
      event.preventDefault();
      return;
    }

    if (!movementKey) {
      return;
    }

    pressedKeys.add(movementKey);
    event.preventDefault();
  }

  function handleKeyup(event) {
    if (!event.repeat) {
      inputModality.recordKeyboardInput();
    }

    const movementKey = getMovementLogicalKey(event);

    if (isCinematicSkipKey(event)) {
      cinematicSkipKeysDown.delete(event.code);
    }

    if (isKeyboardActionKey(event, GAME_INPUT_ACTION_IDS.PRIMARY_ACTION)) {
      primaryActionPressed = false;
    }

    if (!isTypingTarget(event.target) && isGameplayCinematicInputActive()) {
      clearGameFlowInput();
      if (isCinematicSkipKey(event) || movementKey) {
        event.preventDefault();
        return;
      }
    }

    if (isPokedexOpen()) {
      clearGameFlowInput();
      event.preventDefault();
      return;
    }

    if (isWorkbenchModalOpen()) {
      clearGameFlowInput();
      event.preventDefault();
      return;
    }

    if (isSettingsOpen()) {
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
      if (!isTypingTarget(event.target) && (movementKey || isRunKey(event) || isCameraZoomCycleKey(event))) {
        if (movementKey) {
          pressedKeys.delete(movementKey);
        }
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

    if (!movementKey) {
      return;
    }

    pressedKeys.delete(movementKey);
    event.preventDefault();
  }

  function handlePointerMove(event) {
    const pointerButtons = Number(event.buttons || 0);
    const movementX = Number(event.movementX || 0);
    const movementY = Number(event.movementY || 0);

    if (pointerButtons !== 0 || movementX !== 0 || movementY !== 0) {
      inputModality.recordPointerInput();
    }

    if (shouldIgnoreLookInput(event.target)) {
      return;
    }

    const secondaryButtonHeld = (pointerButtons & 2) === 2;
    if (!secondaryButtonHeld) {
      return;
    }

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
    let settingsButtonPressed = false;
    let bagButtonPressed = false;
    let destroyActionButtonPressed = false;
    let followerCallButtonPressed = false;
    let settingsPreviousTabButtonPressed = false;
    let settingsNextTabButtonPressed = false;
    let settingsNavigateDownButtonPressed = false;
    let settingsNavigateAxisX = 0;
    let settingsNavigateAxisY = 0;
    let dialogueNavigateAxisX = 0;
    let dialogueNavigateAxisY = 0;
    let previousMoveButtonPressed = false;
    let nextMoveButtonPressed = false;
    const settingsOpen = isSettingsOpen();
    const gameplayDialogueActive = isGameplayDialogueActive();

    const navigatorRef = windowRef?.navigator;
    const gamepads = navigatorRef?.getGamepads?.();

    if (!gamepads) {
      gamepadActionButtonPressed = false;
      gamepadRunButtonPressed = false;
      gamepadJumpButtonPressed = false;
      gamepadCameraZoomButtonPressed = false;
      gamepadPauseButtonPressed = false;
      gamepadPokedexButtonPressed = false;
      gamepadSettingsButtonPressed = false;
      gamepadBagButtonPressed = false;
      gamepadDestroyActionButtonPressed = false;
      gamepadFollowerCallButtonPressed = false;
      gamepadSettingsPreviousTabButtonPressed = false;
      gamepadSettingsNextTabButtonPressed = false;
      gamepadSettingsNavigateDownButtonPressed = false;
      gamepadSettingsNavigateLeftAxisPressed = false;
      gamepadSettingsNavigateRightAxisPressed = false;
      gamepadSettingsNavigateUpAxisPressed = false;
      gamepadSettingsNavigateDownAxisPressed = false;
      gamepadDialogueNavigateLeftAxisPressed = false;
      gamepadDialogueNavigateRightAxisPressed = false;
      gamepadDialogueNavigateUpAxisPressed = false;
      gamepadDialogueNavigateDownAxisPressed = false;
      gamepadPreviousMoveButtonPressed = false;
      gamepadNextMoveButtonPressed = false;
      return;
    }

    for (const gamepad of gamepads) {
      if (!gamepad) {
        continue;
      }

      if (isActiveGamepadInput(gamepad)) {
        inputModality.recordGamepadInput(gamepad);
      }

      actionButtonPressed = actionButtonPressed ||
        isGamepadButtonPressed(gamepad, GAME_INPUT_BINDINGS.primaryAction.gamepadButton);
      runButtonPressed = runButtonPressed ||
        Boolean(gamepad.buttons?.[GAME_INPUT_BINDINGS.run.gamepadButton]?.pressed);
      jumpButtonPressed = jumpButtonPressed ||
        Boolean(gamepad.buttons?.[GAME_INPUT_BINDINGS.jump.gamepadButton]?.pressed);
      zoomButtonPressed = zoomButtonPressed ||
        Boolean(gamepad.buttons?.[GAME_INPUT_BINDINGS.cameraZoomCycle.gamepadButton]?.pressed) ||
        Number(gamepad.buttons?.[GAME_INPUT_BINDINGS.cameraZoomCycle.gamepadButton]?.value || 0) > 0.55;
      pauseButtonPressed = pauseButtonPressed ||
        Boolean(gamepad.buttons?.[GAME_INPUT_BINDINGS.pause.gamepadButton]?.pressed);
      if (Number.isInteger(GAME_INPUT_BINDINGS.pokedex.gamepadButton)) {
        pokedexButtonPressed = pokedexButtonPressed ||
          Boolean(gamepad.buttons?.[GAME_INPUT_BINDINGS.pokedex.gamepadButton]?.pressed);
      }
      if (Number.isInteger(GAME_INPUT_BINDINGS.settings.gamepadButton)) {
        settingsButtonPressed = settingsButtonPressed ||
          Boolean(gamepad.buttons?.[GAME_INPUT_BINDINGS.settings.gamepadButton]?.pressed);
      }
      bagButtonPressed = bagButtonPressed ||
        isLogicalGamepadButtonPressed(gamepad, GAME_INPUT_BINDINGS.bag.gamepadButton);
      destroyActionButtonPressed = destroyActionButtonPressed ||
        isLogicalGamepadButtonPressed(gamepad, GAME_INPUT_BINDINGS.destroyAction.gamepadButton);
      followerCallButtonPressed = followerCallButtonPressed ||
        Boolean(gamepad.buttons?.[GAME_INPUT_BINDINGS.followerCall.gamepadButton]?.pressed);
      settingsPreviousTabButtonPressed = settingsPreviousTabButtonPressed ||
        Boolean(gamepad.buttons?.[GAMEPAD_LEFT_SHOULDER_BUTTON]?.pressed);
      settingsNextTabButtonPressed = settingsNextTabButtonPressed ||
        Boolean(gamepad.buttons?.[GAMEPAD_RIGHT_SHOULDER_BUTTON]?.pressed);
      settingsNavigateDownButtonPressed = settingsNavigateDownButtonPressed ||
        Boolean(gamepad.buttons?.[GAMEPAD_BUTTONS.DPAD_DOWN]?.pressed);
      previousMoveButtonPressed = previousMoveButtonPressed ||
        Boolean(gamepad.buttons?.[GAME_INPUT_BINDINGS.previousMove.gamepadButton]?.pressed);
      nextMoveButtonPressed = nextMoveButtonPressed ||
        Boolean(gamepad.buttons?.[GAME_INPUT_BINDINGS.nextMove.gamepadButton]?.pressed);

      if (isWorkbenchModalOpen()) {
        continue;
      }

      const moveX = applyDeadzone(Number(gamepad.axes?.[0] || 0));
      const moveY = applyDeadzone(Number(gamepad.axes?.[1] || 0));
      const lookX = applyDeadzone(Number(gamepad.axes?.[2] || 0));
      const lookY = applyDeadzone(Number(gamepad.axes?.[3] || 0));

      if (settingsOpen) {
        if (Math.abs(moveX) > Math.abs(settingsNavigateAxisX)) {
          settingsNavigateAxisX = moveX;
        }
        if (Math.abs(moveY) > Math.abs(settingsNavigateAxisY)) {
          settingsNavigateAxisY = moveY;
        }
      } else if (gameplayDialogueActive) {
        if (Math.abs(moveX) > Math.abs(dialogueNavigateAxisX)) {
          dialogueNavigateAxisX = moveX;
        }
        if (Math.abs(moveY) > Math.abs(dialogueNavigateAxisY)) {
          dialogueNavigateAxisY = moveY;
        }
      } else if (moveX !== 0 || moveY !== 0) {
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

    if (isWorkbenchModalOpen()) {
      clearGameFlowInput();

      if (bagButtonPressed && !gamepadBagButtonPressed) {
        handleWorkbenchModalKeydown(createBagButtonEvent());
      }

      if (jumpButtonPressed && !gamepadJumpButtonPressed) {
        handleWorkbenchModalKeydown(createJumpButtonEvent());
      }

      if (previousMoveButtonPressed && !gamepadPreviousMoveButtonPressed) {
        handleWorkbenchModalKeydown(createPokedexPageButtonEvent(-1));
      }

      if (nextMoveButtonPressed && !gamepadNextMoveButtonPressed) {
        handleWorkbenchModalKeydown(createPokedexPageButtonEvent(1));
      }

      if (followerCallButtonPressed && !gamepadFollowerCallButtonPressed) {
        handleWorkbenchModalKeydown(createSettingsNavigationButtonEvent(-1));
      }

      if (settingsNavigateDownButtonPressed && !gamepadSettingsNavigateDownButtonPressed) {
        handleWorkbenchModalKeydown(createSettingsNavigationButtonEvent(1));
      }

      gamepadActionButtonPressed = actionButtonPressed;
      gamepadRunButtonPressed = runButtonPressed;
      gamepadJumpButtonPressed = jumpButtonPressed;
      gamepadCameraZoomButtonPressed = zoomButtonPressed;
      gamepadPauseButtonPressed = pauseButtonPressed;
      gamepadPokedexButtonPressed = pokedexButtonPressed;
      gamepadSettingsButtonPressed = settingsButtonPressed;
      gamepadBagButtonPressed = bagButtonPressed;
      gamepadDestroyActionButtonPressed = destroyActionButtonPressed;
      gamepadFollowerCallButtonPressed = followerCallButtonPressed;
      gamepadSettingsPreviousTabButtonPressed = settingsPreviousTabButtonPressed;
      gamepadSettingsNextTabButtonPressed = settingsNextTabButtonPressed;
      gamepadSettingsNavigateDownButtonPressed = settingsNavigateDownButtonPressed;
      gamepadSettingsNavigateUpAxisPressed = false;
      gamepadSettingsNavigateDownAxisPressed = false;
      gamepadDialogueNavigateLeftAxisPressed = false;
      gamepadDialogueNavigateRightAxisPressed = false;
      gamepadDialogueNavigateUpAxisPressed = false;
      gamepadDialogueNavigateDownAxisPressed = false;
      gamepadPreviousMoveButtonPressed = previousMoveButtonPressed;
      gamepadNextMoveButtonPressed = nextMoveButtonPressed;
      primaryActionPressed = false;
      return;
    }

    if (isGameplayCinematicInputActive()) {
      clearGameFlowInput();
      gamepadMovement.x = 0;
      gamepadMovement.y = 0;
      cameraLookDelta.yaw = 0;
      cameraLookDelta.pitch = 0;
      gamepadActionButtonPressed = actionButtonPressed;
      gamepadRunButtonPressed = runButtonPressed;
      gamepadJumpButtonPressed = jumpButtonPressed;
      gamepadCameraZoomButtonPressed = zoomButtonPressed;
      gamepadPauseButtonPressed = pauseButtonPressed;
      gamepadPokedexButtonPressed = pokedexButtonPressed;
      gamepadSettingsButtonPressed = settingsButtonPressed;
      gamepadBagButtonPressed = bagButtonPressed;
      gamepadDestroyActionButtonPressed = destroyActionButtonPressed;
      gamepadFollowerCallButtonPressed = followerCallButtonPressed;
      gamepadSettingsPreviousTabButtonPressed = settingsPreviousTabButtonPressed;
      gamepadSettingsNextTabButtonPressed = settingsNextTabButtonPressed;
      gamepadSettingsNavigateDownButtonPressed = settingsNavigateDownButtonPressed;
      gamepadSettingsNavigateUpAxisPressed = false;
      gamepadSettingsNavigateDownAxisPressed = false;
      gamepadDialogueNavigateLeftAxisPressed = false;
      gamepadDialogueNavigateRightAxisPressed = false;
      gamepadDialogueNavigateUpAxisPressed = false;
      gamepadDialogueNavigateDownAxisPressed = false;
      gamepadPreviousMoveButtonPressed = previousMoveButtonPressed;
      gamepadNextMoveButtonPressed = nextMoveButtonPressed;
      primaryActionPressed = actionButtonPressed;
      return;
    }

    if (settingsOpen) {
      const settingsNavigateLeftAxisPressed =
        settingsNavigateAxisX <= -GAMEPAD_SETTINGS_ANALOG_NAVIGATION_THRESHOLD;
      const settingsNavigateRightAxisPressed =
        settingsNavigateAxisX >= GAMEPAD_SETTINGS_ANALOG_NAVIGATION_THRESHOLD;
      const settingsNavigateUpAxisPressed =
        settingsNavigateAxisY <= -GAMEPAD_SETTINGS_ANALOG_NAVIGATION_THRESHOLD;
      const settingsNavigateDownAxisPressed =
        settingsNavigateAxisY >= GAMEPAD_SETTINGS_ANALOG_NAVIGATION_THRESHOLD;
      clearGameFlowInput();

      if (jumpButtonPressed && !gamepadJumpButtonPressed) {
        handleSettingsKeydown(createSettingsCancelButtonEvent());
      }

      if (actionButtonPressed && !gamepadActionButtonPressed) {
        handleSettingsKeydown(createPrimaryButtonEvent());
      }

      if (runButtonPressed && !gamepadRunButtonPressed) {
        handleSettingsKeydown(createPrimaryButtonEvent());
      }

      if (settingsPreviousTabButtonPressed && !gamepadSettingsPreviousTabButtonPressed) {
        handleSettingsKeydown(createSettingsTabButtonEvent(-1));
      }

      if (settingsNextTabButtonPressed && !gamepadSettingsNextTabButtonPressed) {
        handleSettingsKeydown(createSettingsTabButtonEvent(1));
      }

      if (
        (
          previousMoveButtonPressed &&
          !gamepadPreviousMoveButtonPressed
        ) ||
        (
          settingsNavigateLeftAxisPressed &&
          !gamepadSettingsNavigateLeftAxisPressed
        )
      ) {
        handleSettingsKeydown(createSettingsHorizontalButtonEvent(-1));
      }

      if (
        (
          nextMoveButtonPressed &&
          !gamepadNextMoveButtonPressed
        ) ||
        (
          settingsNavigateRightAxisPressed &&
          !gamepadSettingsNavigateRightAxisPressed
        )
      ) {
        handleSettingsKeydown(createSettingsHorizontalButtonEvent(1));
      }

      if (
        (
          followerCallButtonPressed &&
          !gamepadFollowerCallButtonPressed
        ) ||
        (
          settingsNavigateUpAxisPressed &&
          !gamepadSettingsNavigateUpAxisPressed
        )
      ) {
        handleSettingsKeydown(createSettingsNavigationButtonEvent(-1));
      }

      if (
        (
          settingsNavigateDownButtonPressed &&
          !gamepadSettingsNavigateDownButtonPressed
        ) ||
        (
          settingsNavigateDownAxisPressed &&
          !gamepadSettingsNavigateDownAxisPressed
        )
      ) {
        handleSettingsKeydown(createSettingsNavigationButtonEvent(1));
      }

      gamepadActionButtonPressed = actionButtonPressed;
      gamepadRunButtonPressed = runButtonPressed;
      gamepadJumpButtonPressed = jumpButtonPressed;
      gamepadCameraZoomButtonPressed = zoomButtonPressed;
      gamepadPauseButtonPressed = pauseButtonPressed;
      gamepadPokedexButtonPressed = pokedexButtonPressed;
      gamepadSettingsButtonPressed = settingsButtonPressed;
      gamepadBagButtonPressed = bagButtonPressed;
      gamepadDestroyActionButtonPressed = destroyActionButtonPressed;
      gamepadFollowerCallButtonPressed = followerCallButtonPressed;
      gamepadSettingsPreviousTabButtonPressed = settingsPreviousTabButtonPressed;
      gamepadSettingsNextTabButtonPressed = settingsNextTabButtonPressed;
      gamepadSettingsNavigateDownButtonPressed = settingsNavigateDownButtonPressed;
      gamepadSettingsNavigateLeftAxisPressed = settingsNavigateLeftAxisPressed;
      gamepadSettingsNavigateRightAxisPressed = settingsNavigateRightAxisPressed;
      gamepadSettingsNavigateUpAxisPressed = settingsNavigateUpAxisPressed;
      gamepadSettingsNavigateDownAxisPressed = settingsNavigateDownAxisPressed;
      gamepadDialogueNavigateLeftAxisPressed = false;
      gamepadDialogueNavigateRightAxisPressed = false;
      gamepadDialogueNavigateUpAxisPressed = false;
      gamepadDialogueNavigateDownAxisPressed = false;
      gamepadPreviousMoveButtonPressed = previousMoveButtonPressed;
      gamepadNextMoveButtonPressed = nextMoveButtonPressed;
      primaryActionPressed = false;
      return;
    }

    if (gameplayDialogueActive) {
      const dialogueNavigateLeftAxisPressed =
        dialogueNavigateAxisX <= -GAMEPAD_DIALOGUE_ANALOG_NAVIGATION_THRESHOLD;
      const dialogueNavigateRightAxisPressed =
        dialogueNavigateAxisX >= GAMEPAD_DIALOGUE_ANALOG_NAVIGATION_THRESHOLD;
      const dialogueNavigateUpAxisPressed =
        dialogueNavigateAxisY <= -GAMEPAD_DIALOGUE_ANALOG_NAVIGATION_THRESHOLD;
      const dialogueNavigateDownAxisPressed =
        dialogueNavigateAxisY >= GAMEPAD_DIALOGUE_ANALOG_NAVIGATION_THRESHOLD;
      clearGameFlowInput();

      if (jumpButtonPressed && !gamepadJumpButtonPressed) {
        sceneDirector.handleKeydown(createJumpButtonEvent());
      }

      if (actionButtonPressed && !gamepadActionButtonPressed) {
        sceneDirector.handleKeydown(createPrimaryButtonEvent());
      }

      if (bagButtonPressed && !gamepadBagButtonPressed) {
        sceneDirector.handleKeydown(createBagButtonEvent());
      }

      if (
        (
          previousMoveButtonPressed &&
          !gamepadPreviousMoveButtonPressed
        ) ||
        (
          dialogueNavigateLeftAxisPressed &&
          !gamepadDialogueNavigateLeftAxisPressed
        )
      ) {
        sceneDirector.handleKeydown(createPokedexPageButtonEvent(-1));
      }

      if (
        (
          nextMoveButtonPressed &&
          !gamepadNextMoveButtonPressed
        ) ||
        (
          dialogueNavigateRightAxisPressed &&
          !gamepadDialogueNavigateRightAxisPressed
        )
      ) {
        sceneDirector.handleKeydown(createPokedexPageButtonEvent(1));
      }

      if (
        (
          followerCallButtonPressed &&
          !gamepadFollowerCallButtonPressed
        ) ||
        (
          dialogueNavigateUpAxisPressed &&
          !gamepadDialogueNavigateUpAxisPressed
        )
      ) {
        sceneDirector.handleKeydown(createSettingsNavigationButtonEvent(-1));
      }

      if (
        (
          settingsNavigateDownButtonPressed &&
          !gamepadSettingsNavigateDownButtonPressed
        ) ||
        (
          dialogueNavigateDownAxisPressed &&
          !gamepadDialogueNavigateDownAxisPressed
        )
      ) {
        sceneDirector.handleKeydown(createSettingsNavigationButtonEvent(1));
      }

      gamepadActionButtonPressed = actionButtonPressed;
      gamepadRunButtonPressed = runButtonPressed;
      gamepadJumpButtonPressed = jumpButtonPressed;
      gamepadCameraZoomButtonPressed = zoomButtonPressed;
      gamepadPauseButtonPressed = pauseButtonPressed;
      gamepadPokedexButtonPressed = pokedexButtonPressed;
      gamepadSettingsButtonPressed = settingsButtonPressed;
      gamepadBagButtonPressed = bagButtonPressed;
      gamepadDestroyActionButtonPressed = destroyActionButtonPressed;
      gamepadFollowerCallButtonPressed = followerCallButtonPressed;
      gamepadSettingsPreviousTabButtonPressed = settingsPreviousTabButtonPressed;
      gamepadSettingsNextTabButtonPressed = settingsNextTabButtonPressed;
      gamepadSettingsNavigateDownButtonPressed = settingsNavigateDownButtonPressed;
      gamepadSettingsNavigateUpAxisPressed = false;
      gamepadSettingsNavigateDownAxisPressed = false;
      gamepadDialogueNavigateLeftAxisPressed = dialogueNavigateLeftAxisPressed;
      gamepadDialogueNavigateRightAxisPressed = dialogueNavigateRightAxisPressed;
      gamepadDialogueNavigateUpAxisPressed = dialogueNavigateUpAxisPressed;
      gamepadDialogueNavigateDownAxisPressed = dialogueNavigateDownAxisPressed;
      gamepadPreviousMoveButtonPressed = previousMoveButtonPressed;
      gamepadNextMoveButtonPressed = nextMoveButtonPressed;
      primaryActionPressed = false;
      return;
    }

    if (
      previousMoveButtonPressed &&
      !gamepadPreviousMoveButtonPressed
    ) {
      if (isPokedexOpen()) {
        clearGameFlowInput();
        pokedexEntry.handleKeydown(createPokedexPageButtonEvent(-1));
      } else if (
        !sceneDirector.blocksGameplayInput() &&
        !isBuilderPanelOpen()
      ) {
        requestMoveCycle(-1);
      }
    }

    gamepadPreviousMoveButtonPressed = previousMoveButtonPressed;

    if (
      nextMoveButtonPressed &&
      !gamepadNextMoveButtonPressed
    ) {
      if (isPokedexOpen()) {
        clearGameFlowInput();
        pokedexEntry.handleKeydown(createPokedexPageButtonEvent(1));
      } else if (
        !sceneDirector.blocksGameplayInput() &&
        !isBuilderPanelOpen()
      ) {
        requestMoveCycle(1);
      }
    }

    gamepadNextMoveButtonPressed = nextMoveButtonPressed;

    if (
      settingsPreviousTabButtonPressed &&
      !gamepadSettingsPreviousTabButtonPressed &&
      !sceneDirector.blocksGameplayInput() &&
      !isBuilderPanelOpen()
    ) {
      placementRotationRequests -= 1;
    }

    if (
      settingsNextTabButtonPressed &&
      !gamepadSettingsNextTabButtonPressed &&
      !sceneDirector.blocksGameplayInput() &&
      !isBuilderPanelOpen()
    ) {
      placementRotationRequests += 1;
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
      settingsButtonPressed &&
      !gamepadSettingsButtonPressed &&
      !isSettingsOpen() &&
      !sceneDirector.blocksGameplayInput()
    ) {
      requestSettingsOpen();
    }

    gamepadSettingsButtonPressed = settingsButtonPressed;

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
      sceneDirector.blocksGameplayInput()
    ) {
      clearGameFlowInput();
      sceneDirector.handleKeydown(createBagButtonEvent());
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
      destroyActionButtonPressed &&
      !gamepadDestroyActionButtonPressed &&
      !isPokedexOpen() &&
      !sceneDirector.blocksGameplayInput() &&
      !isBuilderPanelOpen()
    ) {
      destroyActionRequests += 1;
    }

    gamepadDestroyActionButtonPressed = destroyActionButtonPressed;

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
    gamepadSettingsPreviousTabButtonPressed = settingsPreviousTabButtonPressed;
    gamepadSettingsNextTabButtonPressed = settingsNextTabButtonPressed;
    gamepadSettingsNavigateDownButtonPressed = settingsNavigateDownButtonPressed;
    gamepadSettingsNavigateUpAxisPressed = false;
    gamepadSettingsNavigateDownAxisPressed = false;

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

  function consumePlacementRotationRequest() {
    const requests = placementRotationRequests;
    placementRotationRequests = 0;
    return requests;
  }

  function consumeDestroyActionRequest() {
    if (destroyActionRequests <= 0) {
      return false;
    }

    destroyActionRequests -= 1;
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

  function isCinematicSkipActionActive() {
    return Boolean(
      primaryActionPressed ||
      cinematicSkipKeysDown.size > 0 ||
      gamepadBagButtonPressed ||
      gamepadJumpButtonPressed
    );
  }

  function getInputModalityState() {
    return {
      ...inputModality.getState(),
      keyboardControls: getEffectiveKeyboardControls()
    };
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
    consumePlacementRotationRequest,
    consumeDestroyActionRequest,
    getAnalogMovement,
    getInputModalityState,
    isRunActive,
    isPrimaryActionActive,
    isCinematicSkipActionActive
  };
}
