export const INPUT_DEVICE = Object.freeze({
  KEYBOARD_MOUSE: "keyboardMouse",
  GAMEPAD: "gamepad"
});

export const GAMEPAD_LAYOUT = Object.freeze({
  XBOX: "xbox",
  NINTENDO: "nintendo",
  GENERIC: "generic"
});

const DEFAULT_INPUT_MODALITY_STATE = Object.freeze({
  device: INPUT_DEVICE.KEYBOARD_MOUSE,
  gamepadLayout: GAMEPAD_LAYOUT.GENERIC,
  gamepadId: "",
  lastInputAt: 0
});

function getDefaultNow() {
  return Number(globalThis.performance?.now?.() || Date.now());
}

function cloneState(state) {
  return Object.freeze({ ...state });
}

export function resolveGamepadLayout(gamepadOrId = "") {
  const id = String(typeof gamepadOrId === "string" ? gamepadOrId : gamepadOrId?.id || "")
    .toLowerCase();

  if (
    id.includes("nintendo") ||
    id.includes("switch") ||
    id.includes("joy-con") ||
    id.includes("joycon")
  ) {
    return GAMEPAD_LAYOUT.NINTENDO;
  }

  if (id.includes("xbox") || id.includes("xinput")) {
    return GAMEPAD_LAYOUT.XBOX;
  }

  return GAMEPAD_LAYOUT.GENERIC;
}

export function createInputModalityTracker({ now = getDefaultNow } = {}) {
  let state = DEFAULT_INPUT_MODALITY_STATE;

  function setState(nextState) {
    state = Object.freeze({
      ...state,
      ...nextState,
      lastInputAt: Number(now()) || 0
    });
    return cloneState(state);
  }

  function recordKeyboardInput() {
    return setState({
      device: INPUT_DEVICE.KEYBOARD_MOUSE
    });
  }

  function recordPointerInput() {
    return setState({
      device: INPUT_DEVICE.KEYBOARD_MOUSE
    });
  }

  function recordGamepadInput(gamepad = null) {
    return setState({
      device: INPUT_DEVICE.GAMEPAD,
      gamepadLayout: resolveGamepadLayout(gamepad),
      gamepadId: String(gamepad?.id || "")
    });
  }

  function getState() {
    return cloneState(state);
  }

  return {
    recordKeyboardInput,
    recordPointerInput,
    recordGamepadInput,
    getState
  };
}
