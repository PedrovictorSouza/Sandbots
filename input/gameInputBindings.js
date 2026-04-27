export const GAMEPAD_BUTTONS = Object.freeze({
  A: 0,
  B: 1,
  X: 2,
  START: 9,
  LT: 6
});

export const GAME_INPUT_BINDINGS = Object.freeze({
  primaryAction: {
    keyboardCode: "Enter",
    gamepadButton: GAMEPAD_BUTTONS.X
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
    gamepadButton: GAMEPAD_BUTTONS.LT
  },
  pause: {
    keyboardCode: "KeyP",
    gamepadButton: GAMEPAD_BUTTONS.START
  }
});
