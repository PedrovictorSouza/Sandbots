import { describe, expect, it } from "vitest";
import {
  GAME_INPUT_ACTION_CATEGORY,
  GAME_INPUT_ACTION_IDS,
  GAME_INPUT_ACTION_REGISTRY,
  GAME_INPUT_BINDINGS,
  GAMEPAD_BUTTONS,
  getGameInputAction,
  KEYBOARD_CONTROL_ACTIONS,
  listGameInputActions,
  validateGameInputActionRegistry
} from "../input/gameInputBindings.js";

describe("game input action registry", () => {
  it("lists logical actions with categories and default bindings", () => {
    expect(listGameInputActions().map((action) => action.id)).toEqual([
      GAME_INPUT_ACTION_IDS.MOVE_UP,
      GAME_INPUT_ACTION_IDS.MOVE_LEFT,
      GAME_INPUT_ACTION_IDS.MOVE_DOWN,
      GAME_INPUT_ACTION_IDS.MOVE_RIGHT,
      GAME_INPUT_ACTION_IDS.PRIMARY_ACTION,
      GAME_INPUT_ACTION_IDS.INTERACT,
      GAME_INPUT_ACTION_IDS.JUMP,
      GAME_INPUT_ACTION_IDS.RUN,
      GAME_INPUT_ACTION_IDS.CAMERA_ZOOM_CYCLE,
      GAME_INPUT_ACTION_IDS.PAUSE,
      GAME_INPUT_ACTION_IDS.POKEDEX,
      GAME_INPUT_ACTION_IDS.SETTINGS,
      GAME_INPUT_ACTION_IDS.BAG,
      GAME_INPUT_ACTION_IDS.DESTROY_ACTION,
      GAME_INPUT_ACTION_IDS.FOLLOWER_CALL,
      GAME_INPUT_ACTION_IDS.PREVIOUS_MOVE,
      GAME_INPUT_ACTION_IDS.NEXT_MOVE
    ]);

    expect(getGameInputAction(GAME_INPUT_ACTION_IDS.PRIMARY_ACTION)).toMatchObject({
      label: "Primary / Place",
      category: GAME_INPUT_ACTION_CATEGORY.FIELD_TOOL,
      defaultKeyboardCode: "Enter",
      defaultGamepadButton: GAMEPAD_BUTTONS.LT,
      promptAction: "place"
    });
    expect(getGameInputAction(GAME_INPUT_ACTION_IDS.SETTINGS)).toMatchObject({
      label: "Settings",
      category: GAME_INPUT_ACTION_CATEGORY.MENU,
      keyboardRebindable: false,
      defaultKeyboardCode: "",
      defaultGamepadButton: GAMEPAD_BUTTONS.SELECT
    });
  });

  it("filters actions by category and keyboard rebinding support", () => {
    expect(listGameInputActions({
      category: GAME_INPUT_ACTION_CATEGORY.MOVEMENT
    }).map((action) => action.id)).toEqual([
      GAME_INPUT_ACTION_IDS.MOVE_UP,
      GAME_INPUT_ACTION_IDS.MOVE_LEFT,
      GAME_INPUT_ACTION_IDS.MOVE_DOWN,
      GAME_INPUT_ACTION_IDS.MOVE_RIGHT,
      GAME_INPUT_ACTION_IDS.RUN
    ]);

    expect(listGameInputActions({ keyboardRebindable: false }).map((action) => action.id)).toEqual([
      GAME_INPUT_ACTION_IDS.SETTINGS
    ]);
  });

  it("keeps keyboard controls backed by registry entries", () => {
    for (const action of KEYBOARD_CONTROL_ACTIONS) {
      expect(getGameInputAction(action.id)).toMatchObject({
        id: action.id,
        label: action.label,
        keyboardRebindable: true
      });
    }
  });

  it("validates the default action registry", () => {
    expect(validateGameInputActionRegistry()).toEqual({
      valid: true,
      errors: []
    });
  });

  it("reports duplicate actions and missing bindings", () => {
    const actions = [
      GAME_INPUT_ACTION_REGISTRY[0],
      {
        ...GAME_INPUT_ACTION_REGISTRY[0],
        label: "",
        category: "missing-category"
      },
      {
        id: "customAction",
        label: "Custom Action",
        category: GAME_INPUT_ACTION_CATEGORY.GAMEPLAY
      }
    ];
    const bindings = {
      ...GAME_INPUT_BINDINGS
    };

    expect(validateGameInputActionRegistry({ actions, bindings }).errors).toEqual([
      { code: "duplicate-action-id", actionId: GAME_INPUT_ACTION_IDS.MOVE_UP },
      { code: "missing-action-label", actionId: GAME_INPUT_ACTION_IDS.MOVE_UP },
      { code: "invalid-action-category", actionId: GAME_INPUT_ACTION_IDS.MOVE_UP },
      { code: "missing-action-binding", actionId: "customAction" }
    ]);
  });
});
