import {
  GAMEPAD_LAYOUT,
  INPUT_DEVICE
} from "../../input/inputModality.js";
import {
  formatKeyboardCodeLabel,
  GAME_INPUT_ACTION_IDS,
  getKeyboardBindingCode
} from "../../input/gameInputBindings.js";

export const UI_PROMPT_ACTION = Object.freeze({
  PLACE: "place",
  CANCEL: "cancel",
  ROTATE: "rotate",
  CONFIRM: "confirm",
  OPEN_BAG: "openBag",
  INTERACT: "interact"
});

const KEYBOARD_MOUSE_PROMPTS = Object.freeze({
  [UI_PROMPT_ACTION.ROTATE]: "",
});

const GAMEPAD_PROMPTS = Object.freeze({
  [GAMEPAD_LAYOUT.XBOX]: Object.freeze({
    [UI_PROMPT_ACTION.PLACE]: "X Place",
    [UI_PROMPT_ACTION.CANCEL]: "B Cancel",
    [UI_PROMPT_ACTION.ROTATE]: "LB/RB Rotate",
    [UI_PROMPT_ACTION.CONFIRM]: "X Confirm",
    [UI_PROMPT_ACTION.OPEN_BAG]: "X Bag",
    [UI_PROMPT_ACTION.INTERACT]: "LT Interact"
  }),
  [GAMEPAD_LAYOUT.NINTENDO]: Object.freeze({
    [UI_PROMPT_ACTION.PLACE]: "Y Place",
    [UI_PROMPT_ACTION.CANCEL]: "B Cancel",
    [UI_PROMPT_ACTION.ROTATE]: "L/R Rotate",
    [UI_PROMPT_ACTION.CONFIRM]: "Y Confirm",
    [UI_PROMPT_ACTION.OPEN_BAG]: "Y Bag",
    [UI_PROMPT_ACTION.INTERACT]: "ZL Interact"
  }),
  [GAMEPAD_LAYOUT.GENERIC]: Object.freeze({
    [UI_PROMPT_ACTION.PLACE]: "X Place",
    [UI_PROMPT_ACTION.CANCEL]: "B Cancel",
    [UI_PROMPT_ACTION.ROTATE]: "LB/RB Rotate",
    [UI_PROMPT_ACTION.CONFIRM]: "X Confirm",
    [UI_PROMPT_ACTION.OPEN_BAG]: "X Bag",
    [UI_PROMPT_ACTION.INTERACT]: "LT Interact"
  })
});

function resolvePromptMap(modalityState = {}) {
  if (modalityState.device !== INPUT_DEVICE.GAMEPAD) {
    return KEYBOARD_MOUSE_PROMPTS;
  }

  return GAMEPAD_PROMPTS[modalityState.gamepadLayout] || GAMEPAD_PROMPTS[GAMEPAD_LAYOUT.GENERIC];
}

function resolveKeyboardActionLabel(actionId, keyboardControls = {}) {
  return formatKeyboardCodeLabel(getKeyboardBindingCode(keyboardControls, actionId));
}

function resolveKeyboardPlaceLabel(keyboardControls = {}) {
  const bagLabel = resolveKeyboardActionLabel(GAME_INPUT_ACTION_IDS.BAG, keyboardControls);
  const primaryLabel = resolveKeyboardActionLabel(
    GAME_INPUT_ACTION_IDS.PRIMARY_ACTION,
    keyboardControls
  );
  const labels = [...new Set([bagLabel, primaryLabel].filter((label) => label !== "Unassigned"))];
  const inputLabel = labels.length ? labels.join(" / ") : "Unassigned";

  return `${inputLabel} Place`;
}

function resolveKeyboardPrompt(actionId, modalityState = {}) {
  const keyboardControls = modalityState.keyboardControls || {};

  if (actionId === UI_PROMPT_ACTION.PLACE) {
    return resolveKeyboardPlaceLabel(keyboardControls);
  }

  if (actionId === UI_PROMPT_ACTION.CANCEL) {
    return `${resolveKeyboardActionLabel(GAME_INPUT_ACTION_IDS.JUMP, keyboardControls)} Cancel`;
  }

  if (actionId === UI_PROMPT_ACTION.CONFIRM) {
    return `${resolveKeyboardActionLabel(GAME_INPUT_ACTION_IDS.PRIMARY_ACTION, keyboardControls)} Confirm`;
  }

  if (actionId === UI_PROMPT_ACTION.OPEN_BAG) {
    return `${resolveKeyboardActionLabel(GAME_INPUT_ACTION_IDS.BAG, keyboardControls)} Bag`;
  }

  if (actionId === UI_PROMPT_ACTION.INTERACT) {
    return `${resolveKeyboardActionLabel(GAME_INPUT_ACTION_IDS.INTERACT, keyboardControls)} Interact`;
  }

  return KEYBOARD_MOUSE_PROMPTS[actionId] || "";
}

export function resolveInputPrompt(actionId, modalityState = {}) {
  if (modalityState.device !== INPUT_DEVICE.GAMEPAD) {
    return resolveKeyboardPrompt(actionId, modalityState);
  }

  return resolvePromptMap(modalityState)[actionId] || "";
}

function joinPromptParts(parts) {
  return parts.filter(Boolean).join("  ");
}

export function resolvePlacementPreviewPrompt(prefix, modalityState = {}, {
  includePlace = true
} = {}) {
  return joinPromptParts([
    prefix,
    includePlace ? resolveInputPrompt(UI_PROMPT_ACTION.PLACE, modalityState) : "",
    resolveInputPrompt(UI_PROMPT_ACTION.CANCEL, modalityState),
    resolveInputPrompt(UI_PROMPT_ACTION.ROTATE, modalityState)
  ]);
}

export function resolvePlacementReadyPrompt(prefix, modalityState = {}) {
  return joinPromptParts([
    prefix,
    resolveInputPrompt(UI_PROMPT_ACTION.PLACE, modalityState)
  ]);
}

export function resolveWorkbenchRotationPrompt(modalityState = {}) {
  return joinPromptParts([
    resolveInputPrompt(UI_PROMPT_ACTION.CONFIRM, modalityState),
    resolveInputPrompt(UI_PROMPT_ACTION.ROTATE, modalityState),
    resolveInputPrompt(UI_PROMPT_ACTION.CANCEL, modalityState)
  ]);
}

export function resolveInitialHudGuide(modalityState = {}) {
  if (modalityState.device === INPUT_DEVICE.GAMEPAD) {
    return "Use the left stick to reach Chopper. He will point out the first repair.";
  }

  return "Use WASD to reach Chopper. He will point out the first repair.";
}
