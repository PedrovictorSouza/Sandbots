export const GAMEPAD_BUTTONS = Object.freeze({
  A: 0,
  B: 1,
  X: 2,
  SELECT: 8,
  START: 9,
  LT: 6,
  RT: 7,
  DPAD_UP: 12,
  DPAD_RIGHT: 15,
  DPAD_LEFT: 14
});

export const GAME_INPUT_BINDINGS = Object.freeze({
  primaryAction: {
    keyboardCode: "Enter",
    gamepadButton: GAMEPAD_BUTTONS.LT
  },
  jump: {
    keyboardCode: "Space",
    gamepadButton: GAMEPAD_BUTTONS.B
  },
  run: {
    keyboardCodes: ["ShiftLeft", "ShiftRight"],
    gamepadButton: GAMEPAD_BUTTONS.A
  },
  cameraZoomCycle: {
    keyboardCode: "KeyR",
    gamepadButton: GAMEPAD_BUTTONS.RT
  },
  pause: {
    keyboardCode: "KeyP",
    gamepadButton: GAMEPAD_BUTTONS.START
  },
  pokedex: {
    keyboardCode: "Tab",
    gamepadButton: GAMEPAD_BUTTONS.SELECT
  },
  bag: {
    keyboardCode: "KeyX",
    gamepadButton: GAMEPAD_BUTTONS.X
  },
  followerCall: {
    keyboardCode: "ArrowUp",
    gamepadButton: GAMEPAD_BUTTONS.DPAD_UP
  },
  previousMove: {
    keyboardCode: "ArrowLeft",
    gamepadButton: GAMEPAD_BUTTONS.DPAD_LEFT
  },
  nextMove: {
    keyboardCode: "ArrowRight",
    gamepadButton: GAMEPAD_BUTTONS.DPAD_RIGHT
  }
});
