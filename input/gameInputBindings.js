export const GAMEPAD_BUTTONS = Object.freeze({
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  SELECT: 8,
  START: 9,
  LT: 6,
  RT: 7,
  DPAD_UP: 12,
  DPAD_DOWN: 13,
  DPAD_RIGHT: 15,
  DPAD_LEFT: 14
});

export const GAME_INPUT_ACTION_IDS = Object.freeze({
  MOVE_UP: "moveUp",
  MOVE_LEFT: "moveLeft",
  MOVE_DOWN: "moveDown",
  MOVE_RIGHT: "moveRight",
  PRIMARY_ACTION: "primaryAction",
  INTERACT: "interact",
  JUMP: "jump",
  RUN: "run",
  CAMERA_ZOOM_CYCLE: "cameraZoomCycle",
  PAUSE: "pause",
  POKEDEX: "pokedex",
  SETTINGS: "settings",
  BAG: "bag",
  DESTROY_ACTION: "destroyAction",
  FOLLOWER_CALL: "followerCall",
  PREVIOUS_MOVE: "previousMove",
  NEXT_MOVE: "nextMove"
});

export const GAME_INPUT_ACTION_CATEGORY = Object.freeze({
  MOVEMENT: "movement",
  GAMEPLAY: "gameplay",
  FIELD_TOOL: "field-tool",
  CAMERA: "camera",
  MENU: "menu",
  INVENTORY: "inventory"
});

export const GAME_INPUT_BINDINGS = Object.freeze({
  moveUp: {
    keyboardCode: "KeyW",
    gamepadButton: null
  },
  moveLeft: {
    keyboardCode: "KeyA",
    gamepadButton: null
  },
  moveDown: {
    keyboardCode: "KeyS",
    gamepadButton: null
  },
  moveRight: {
    keyboardCode: "KeyD",
    gamepadButton: null
  },
  primaryAction: {
    keyboardCode: "Enter",
    gamepadButton: GAMEPAD_BUTTONS.LT
  },
  interact: {
    keyboardCode: "KeyE",
    gamepadButton: null
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
    gamepadButton: null
  },
  settings: {
    keyboardCode: null,
    gamepadButton: GAMEPAD_BUTTONS.SELECT
  },
  bag: {
    keyboardCode: "KeyX",
    gamepadButton: GAMEPAD_BUTTONS.X
  },
  destroyAction: {
    keyboardCode: "KeyY",
    gamepadButton: GAMEPAD_BUTTONS.Y
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

function createActionRegistryEntry({
  id,
  label,
  category,
  keyboardRebindable = true,
  gamepadRebindable = false,
  promptAction = null
}) {
  const binding = GAME_INPUT_BINDINGS[id] || {};

  return Object.freeze({
    id,
    label,
    category,
    keyboardRebindable,
    gamepadRebindable,
    promptAction,
    defaultKeyboardCode: binding.keyboardCode || binding.keyboardCodes?.[0] || "",
    defaultKeyboardCodes: Object.freeze([...(binding.keyboardCodes || (binding.keyboardCode ? [binding.keyboardCode] : []))]),
    defaultGamepadButton: Number.isInteger(binding.gamepadButton) ? binding.gamepadButton : null
  });
}

export const GAME_INPUT_ACTION_REGISTRY = Object.freeze([
  createActionRegistryEntry({
    id: GAME_INPUT_ACTION_IDS.MOVE_UP,
    label: "Move Up",
    category: GAME_INPUT_ACTION_CATEGORY.MOVEMENT
  }),
  createActionRegistryEntry({
    id: GAME_INPUT_ACTION_IDS.MOVE_LEFT,
    label: "Move Left",
    category: GAME_INPUT_ACTION_CATEGORY.MOVEMENT
  }),
  createActionRegistryEntry({
    id: GAME_INPUT_ACTION_IDS.MOVE_DOWN,
    label: "Move Down",
    category: GAME_INPUT_ACTION_CATEGORY.MOVEMENT
  }),
  createActionRegistryEntry({
    id: GAME_INPUT_ACTION_IDS.MOVE_RIGHT,
    label: "Move Right",
    category: GAME_INPUT_ACTION_CATEGORY.MOVEMENT
  }),
  createActionRegistryEntry({
    id: GAME_INPUT_ACTION_IDS.PRIMARY_ACTION,
    label: "Primary / Place",
    category: GAME_INPUT_ACTION_CATEGORY.FIELD_TOOL,
    promptAction: "place"
  }),
  createActionRegistryEntry({
    id: GAME_INPUT_ACTION_IDS.INTERACT,
    label: "Interact",
    category: GAME_INPUT_ACTION_CATEGORY.GAMEPLAY,
    promptAction: "interact"
  }),
  createActionRegistryEntry({
    id: GAME_INPUT_ACTION_IDS.JUMP,
    label: "Jump / Cancel",
    category: GAME_INPUT_ACTION_CATEGORY.GAMEPLAY,
    promptAction: "cancel"
  }),
  createActionRegistryEntry({
    id: GAME_INPUT_ACTION_IDS.RUN,
    label: "Run",
    category: GAME_INPUT_ACTION_CATEGORY.MOVEMENT
  }),
  createActionRegistryEntry({
    id: GAME_INPUT_ACTION_IDS.CAMERA_ZOOM_CYCLE,
    label: "Camera Zoom",
    category: GAME_INPUT_ACTION_CATEGORY.CAMERA
  }),
  createActionRegistryEntry({
    id: GAME_INPUT_ACTION_IDS.PAUSE,
    label: "Pause",
    category: GAME_INPUT_ACTION_CATEGORY.MENU
  }),
  createActionRegistryEntry({
    id: GAME_INPUT_ACTION_IDS.POKEDEX,
    label: "Colony Codex",
    category: GAME_INPUT_ACTION_CATEGORY.MENU
  }),
  createActionRegistryEntry({
    id: GAME_INPUT_ACTION_IDS.SETTINGS,
    label: "Settings",
    category: GAME_INPUT_ACTION_CATEGORY.MENU,
    keyboardRebindable: false
  }),
  createActionRegistryEntry({
    id: GAME_INPUT_ACTION_IDS.BAG,
    label: "Bag / Build",
    category: GAME_INPUT_ACTION_CATEGORY.INVENTORY,
    promptAction: "openBag"
  }),
  createActionRegistryEntry({
    id: GAME_INPUT_ACTION_IDS.DESTROY_ACTION,
    label: "Destroy",
    category: GAME_INPUT_ACTION_CATEGORY.FIELD_TOOL
  }),
  createActionRegistryEntry({
    id: GAME_INPUT_ACTION_IDS.FOLLOWER_CALL,
    label: "Call Bot",
    category: GAME_INPUT_ACTION_CATEGORY.GAMEPLAY
  }),
  createActionRegistryEntry({
    id: GAME_INPUT_ACTION_IDS.PREVIOUS_MOVE,
    label: "Previous Ability",
    category: GAME_INPUT_ACTION_CATEGORY.FIELD_TOOL,
    promptAction: "rotate"
  }),
  createActionRegistryEntry({
    id: GAME_INPUT_ACTION_IDS.NEXT_MOVE,
    label: "Next Ability",
    category: GAME_INPUT_ACTION_CATEGORY.FIELD_TOOL,
    promptAction: "rotate"
  })
]);

export const KEYBOARD_CONTROL_ACTIONS = Object.freeze([
  Object.freeze({ id: GAME_INPUT_ACTION_IDS.MOVE_UP, label: "Move Up" }),
  Object.freeze({ id: GAME_INPUT_ACTION_IDS.MOVE_LEFT, label: "Move Left" }),
  Object.freeze({ id: GAME_INPUT_ACTION_IDS.MOVE_DOWN, label: "Move Down" }),
  Object.freeze({ id: GAME_INPUT_ACTION_IDS.MOVE_RIGHT, label: "Move Right" }),
  Object.freeze({ id: GAME_INPUT_ACTION_IDS.PRIMARY_ACTION, label: "Primary / Place" }),
  Object.freeze({ id: GAME_INPUT_ACTION_IDS.INTERACT, label: "Interact" }),
  Object.freeze({ id: GAME_INPUT_ACTION_IDS.JUMP, label: "Jump / Cancel" }),
  Object.freeze({ id: GAME_INPUT_ACTION_IDS.RUN, label: "Run" }),
  Object.freeze({ id: GAME_INPUT_ACTION_IDS.CAMERA_ZOOM_CYCLE, label: "Camera Zoom" }),
  Object.freeze({ id: GAME_INPUT_ACTION_IDS.PAUSE, label: "Pause" }),
  Object.freeze({ id: GAME_INPUT_ACTION_IDS.POKEDEX, label: "Colony Codex" }),
  Object.freeze({ id: GAME_INPUT_ACTION_IDS.BAG, label: "Bag / Build" }),
  Object.freeze({ id: GAME_INPUT_ACTION_IDS.DESTROY_ACTION, label: "Destroy" }),
  Object.freeze({ id: GAME_INPUT_ACTION_IDS.FOLLOWER_CALL, label: "Call Bot" }),
  Object.freeze({ id: GAME_INPUT_ACTION_IDS.PREVIOUS_MOVE, label: "Previous Ability" }),
  Object.freeze({ id: GAME_INPUT_ACTION_IDS.NEXT_MOVE, label: "Next Ability" })
]);

export function listGameInputActions({ category = null, keyboardRebindable = null } = {}) {
  return GAME_INPUT_ACTION_REGISTRY.filter((action) => (
    (!category || action.category === category) &&
    (keyboardRebindable === null || action.keyboardRebindable === keyboardRebindable)
  ));
}

export function getGameInputAction(actionId) {
  return GAME_INPUT_ACTION_REGISTRY.find((action) => action.id === actionId) || null;
}

export function validateGameInputActionRegistry({
  actions = GAME_INPUT_ACTION_REGISTRY,
  bindings = GAME_INPUT_BINDINGS,
  categories = GAME_INPUT_ACTION_CATEGORY
} = {}) {
  const errors = [];
  const ids = new Set();
  const categoryValues = new Set(Object.values(categories));

  for (const action of actions || []) {
    if (!action?.id) {
      errors.push({ code: "missing-action-id", actionId: action?.id || null });
      continue;
    }

    if (ids.has(action.id)) {
      errors.push({ code: "duplicate-action-id", actionId: action.id });
    }
    ids.add(action.id);

    if (!action.label) {
      errors.push({ code: "missing-action-label", actionId: action.id });
    }

    if (!categoryValues.has(action.category)) {
      errors.push({ code: "invalid-action-category", actionId: action.id });
    }

    if (!bindings[action.id]) {
      errors.push({ code: "missing-action-binding", actionId: action.id });
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

const KEYBOARD_CODE_LABELS = Object.freeze({
  ArrowUp: "Up",
  ArrowDown: "Down",
  ArrowLeft: "Left",
  ArrowRight: "Right",
  Backquote: "`",
  Backslash: "\\",
  BracketLeft: "[",
  BracketRight: "]",
  Comma: ",",
  Enter: "Enter",
  Equal: "=",
  Escape: "Esc",
  Minus: "-",
  Period: ".",
  Quote: "'",
  Semicolon: ";",
  ShiftLeft: "Shift",
  ShiftRight: "Shift",
  Slash: "/",
  Space: "Space",
  Tab: "Tab"
});

export function createDefaultKeyboardControls() {
  return Object.fromEntries(
    KEYBOARD_CONTROL_ACTIONS.map((action) => [
      action.id,
      GAME_INPUT_BINDINGS[action.id]?.keyboardCode ||
        GAME_INPUT_BINDINGS[action.id]?.keyboardCodes?.[0] ||
        ""
    ])
  );
}

export function normalizeKeyboardControls(keyboardControls = {}) {
  const defaults = createDefaultKeyboardControls();
  const normalized = { ...defaults };

  for (const action of KEYBOARD_CONTROL_ACTIONS) {
    const code = keyboardControls?.[action.id];
    if (typeof code === "string") {
      normalized[action.id] = code;
    }
  }

  return normalized;
}

export function assignKeyboardControl(keyboardControls = {}, actionId, keyboardCode) {
  const normalized = normalizeKeyboardControls(keyboardControls);
  const nextCode = typeof keyboardCode === "string" ? keyboardCode : "";

  if (!KEYBOARD_CONTROL_ACTIONS.some((action) => action.id === actionId)) {
    return normalized;
  }

  if (nextCode) {
    for (const action of KEYBOARD_CONTROL_ACTIONS) {
      if (action.id !== actionId && normalized[action.id] === nextCode) {
        normalized[action.id] = "";
      }
    }
  }

  normalized[actionId] = nextCode;
  return normalized;
}

export function getKeyboardBindingCode(keyboardControls = {}, actionId) {
  return normalizeKeyboardControls(keyboardControls)[actionId] || "";
}

export function formatKeyboardCodeLabel(keyboardCode = "") {
  const code = String(keyboardCode || "");
  if (!code) {
    return "Unassigned";
  }

  if (KEYBOARD_CODE_LABELS[code]) {
    return KEYBOARD_CODE_LABELS[code];
  }

  if (/^Key[A-Z]$/.test(code)) {
    return code.slice(3);
  }

  if (/^Digit[0-9]$/.test(code)) {
    return code.slice(5);
  }

  if (/^Numpad[0-9]$/.test(code)) {
    return `Num ${code.slice(6)}`;
  }

  return code.replace(/([a-z])([A-Z])/g, "$1 $2");
}
