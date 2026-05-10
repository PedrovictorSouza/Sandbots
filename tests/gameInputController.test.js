// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { GAMEPAD_BUTTONS } from "../input/gameInputBindings.js";
import { createGameInputController } from "../input/gameInputController.js";

const GAMEPAD_LB = 4;
const GAMEPAD_RB = 5;

function createController(overrides = {}) {
  const requestPokedexOpen = vi.fn();
  const requestSettingsOpen = vi.fn();
  const requestInteract = vi.fn();
  const requestHarvest = vi.fn();
  const requestFollowerCall = vi.fn();
  const requestMoveCycle = vi.fn();
  const inspectBag = vi.fn();
  const controller = createGameInputController({
    pressedKeys: new Set(),
    cameraTurnKeys: new Set(),
    clearGameFlowInput: vi.fn(),
    isPokedexOpen: () => false,
    isSettingsOpen: () => false,
    pokedexEntry: {
      handleKeydown: vi.fn(() => false)
    },
    handleSettingsKeydown: vi.fn(() => false),
    sceneDirector: {
      blocksGameplayInput: () => false,
      handleKeydown: vi.fn(() => false),
      handleKeyup: vi.fn(() => false)
    },
    isBuilderPanelOpen: () => false,
    setBuilderPanelOpen: vi.fn(),
    requestHarvest,
    requestInteract,
    requestPauseToggle: vi.fn(),
    requestPokedexOpen,
    requestSettingsOpen,
    requestFollowerCall,
    requestMoveCycle,
    inspectBag,
    windowRef: null,
    ...overrides
  });

  return {
    controller,
    inspectBag,
    requestFollowerCall,
    requestHarvest,
    requestInteract,
    requestMoveCycle,
    requestPokedexOpen,
    requestSettingsOpen
  };
}

function createKeyboardEvent(code) {
  return {
    code,
    key: "",
    repeat: false,
    target: document.body,
    preventDefault: vi.fn()
  };
}

function createGamepad(overrides = {}) {
  return {
    id: "",
    mapping: "standard",
    buttons: Array.from({ length: 16 }, () => ({ pressed: false, value: 0 })),
    axes: [0, 0, 0, 0],
    ...overrides
  };
}

describe("createGameInputController", () => {
  it("opens the Pokedesk with Tab", () => {
    const { controller, requestPokedexOpen } = createController();
    const event = createKeyboardEvent("Tab");

    controller.handleKeydown(event);

    expect(requestPokedexOpen).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it("opens Settings once per Select button press", () => {
    const gamepad = createGamepad();
    const windowRef = {
      navigator: {
        getGamepads: () => [gamepad]
      }
    };
    const { controller, requestSettingsOpen } = createController({ windowRef });

    gamepad.buttons[GAMEPAD_BUTTONS.SELECT] = { pressed: true, value: 1 };
    controller.updateGamepads(1 / 60);
    controller.updateGamepads(1 / 60);

    expect(requestSettingsOpen).toHaveBeenCalledTimes(1);

    gamepad.buttons[GAMEPAD_BUTTONS.SELECT] = { pressed: false, value: 0 };
    controller.updateGamepads(1 / 60);
    gamepad.buttons[GAMEPAD_BUTTONS.SELECT] = { pressed: true, value: 1 };
    controller.updateGamepads(1 / 60);

    expect(requestSettingsOpen).toHaveBeenCalledTimes(2);
  });

  it("routes keyboard and gamepad input to the open Settings menu", () => {
    const gamepad = createGamepad();
    const handleSettingsKeydown = vi.fn(() => true);
    const windowRef = {
      navigator: {
        getGamepads: () => [gamepad]
      }
    };
    const { controller, requestHarvest } = createController({
      windowRef,
      isSettingsOpen: () => true,
      handleSettingsKeydown
    });
    const closeEvent = createKeyboardEvent("KeyB");

    controller.handleKeydown(closeEvent);

    expect(handleSettingsKeydown).toHaveBeenCalledWith(closeEvent);
    expect(closeEvent.preventDefault).toHaveBeenCalledTimes(1);

    gamepad.buttons[GAMEPAD_BUTTONS.B] = { pressed: true, value: 1 };
    controller.updateGamepads(1 / 60);

    expect(handleSettingsKeydown).toHaveBeenCalledWith(expect.objectContaining({
      code: "KeyB"
    }));
    expect(requestHarvest).not.toHaveBeenCalled();

    handleSettingsKeydown.mockClear();
    gamepad.buttons[GAMEPAD_BUTTONS.B] = { pressed: false, value: 0 };
    controller.updateGamepads(1 / 60);
    gamepad.buttons[GAMEPAD_BUTTONS.LT] = { pressed: true, value: 1 };
    controller.updateGamepads(1 / 60);

    expect(handleSettingsKeydown).toHaveBeenCalledWith(expect.objectContaining({
      code: "Enter"
    }));
    expect(requestHarvest).not.toHaveBeenCalled();
  });

  it("routes gamepad up and down to the open Settings menu", () => {
    const gamepad = createGamepad();
    const handleSettingsKeydown = vi.fn(() => true);
    const windowRef = {
      navigator: {
        getGamepads: () => [gamepad]
      }
    };
    const { controller, requestFollowerCall } = createController({
      windowRef,
      isSettingsOpen: () => true,
      handleSettingsKeydown
    });

    gamepad.buttons[GAMEPAD_BUTTONS.DPAD_UP] = { pressed: true, value: 1 };
    controller.updateGamepads(1 / 60);

    expect(handleSettingsKeydown).toHaveBeenCalledWith(expect.objectContaining({
      code: "ArrowUp"
    }));
    expect(requestFollowerCall).not.toHaveBeenCalled();

    handleSettingsKeydown.mockClear();
    gamepad.buttons[GAMEPAD_BUTTONS.DPAD_UP] = { pressed: false, value: 0 };
    controller.updateGamepads(1 / 60);
    gamepad.buttons[GAMEPAD_BUTTONS.DPAD_DOWN] = { pressed: true, value: 1 };
    controller.updateGamepads(1 / 60);

    expect(handleSettingsKeydown).toHaveBeenCalledWith(expect.objectContaining({
      code: "ArrowDown"
    }));
    expect(requestFollowerCall).not.toHaveBeenCalled();
  });

  it("routes analog vertical movement to the open Settings menu once per tilt", () => {
    const gamepad = createGamepad();
    const handleSettingsKeydown = vi.fn(() => true);
    const windowRef = {
      navigator: {
        getGamepads: () => [gamepad]
      }
    };
    const { controller, requestFollowerCall } = createController({
      windowRef,
      isSettingsOpen: () => true,
      handleSettingsKeydown
    });

    gamepad.axes[1] = 1;
    controller.updateGamepads(1 / 60);
    controller.updateGamepads(1 / 60);

    expect(handleSettingsKeydown).toHaveBeenCalledTimes(1);
    expect(handleSettingsKeydown).toHaveBeenLastCalledWith(expect.objectContaining({
      code: "ArrowDown"
    }));

    handleSettingsKeydown.mockClear();
    gamepad.axes[1] = 0;
    controller.updateGamepads(1 / 60);
    gamepad.axes[1] = -1;
    controller.updateGamepads(1 / 60);

    expect(handleSettingsKeydown).toHaveBeenCalledTimes(1);
    expect(handleSettingsKeydown).toHaveBeenLastCalledWith(expect.objectContaining({
      code: "ArrowUp"
    }));
    expect(requestFollowerCall).not.toHaveBeenCalled();
    expect(controller.getAnalogMovement()).toEqual({ x: 0, y: 0 });
  });

  it("routes gamepad LB and RB to Settings tabs while the menu is open", () => {
    const gamepad = createGamepad();
    const handleSettingsKeydown = vi.fn(() => true);
    const windowRef = {
      navigator: {
        getGamepads: () => [gamepad]
      }
    };
    const { controller } = createController({
      windowRef,
      isSettingsOpen: () => true,
      handleSettingsKeydown
    });

    gamepad.buttons[GAMEPAD_RB] = { pressed: true, value: 1 };
    controller.updateGamepads(1 / 60);

    expect(handleSettingsKeydown).toHaveBeenCalledWith(expect.objectContaining({
      code: "PageDown"
    }));

    handleSettingsKeydown.mockClear();
    gamepad.buttons[GAMEPAD_RB] = { pressed: false, value: 0 };
    controller.updateGamepads(1 / 60);
    gamepad.buttons[GAMEPAD_LB] = { pressed: true, value: 1 };
    controller.updateGamepads(1 / 60);

    expect(handleSettingsKeydown).toHaveBeenCalledWith(expect.objectContaining({
      code: "PageUp"
    }));
  });

  it("keeps the gamepad A button as run-only input", () => {
    const gamepad = createGamepad();
    const windowRef = {
      navigator: {
        getGamepads: () => [gamepad]
      }
    };
    const shouldGamepadButtonHarvest = vi.fn(() => true);
    const { controller, requestHarvest, requestInteract } = createController({
      windowRef,
      shouldGamepadButtonHarvest
    });

    gamepad.buttons[GAMEPAD_BUTTONS.A] = { pressed: true, value: 1 };
    controller.updateGamepads(1 / 60);
    controller.updateGamepads(1 / 60);

    expect(controller.isRunActive()).toBe(true);
    expect(shouldGamepadButtonHarvest).not.toHaveBeenCalled();
    expect(requestHarvest).not.toHaveBeenCalled();
    expect(requestInteract).not.toHaveBeenCalled();

    gamepad.buttons[GAMEPAD_BUTTONS.A] = { pressed: false, value: 0 };
    controller.updateGamepads(1 / 60);

    expect(controller.isRunActive()).toBe(false);
  });

  it("does not use the gamepad A button for nearby field actions", () => {
    const gamepad = createGamepad();
    const windowRef = {
      navigator: {
        getGamepads: () => [gamepad]
      }
    };
    const shouldGamepadButtonHarvest = vi.fn(() => true);
    const { controller, requestHarvest, requestInteract } = createController({
      windowRef,
      shouldGamepadButtonHarvest
    });

    gamepad.buttons[GAMEPAD_BUTTONS.A] = { pressed: true, value: 1 };
    controller.updateGamepads(1 / 60);
    controller.updateGamepads(1 / 60);

    expect(shouldGamepadButtonHarvest).not.toHaveBeenCalled();
    expect(requestHarvest).not.toHaveBeenCalled();
    expect(requestInteract).not.toHaveBeenCalled();
  });

  it("opens the bag once per X button press", () => {
    const gamepad = createGamepad();
    const windowRef = {
      navigator: {
        getGamepads: () => [gamepad]
      }
    };
    const { controller, inspectBag, requestHarvest } = createController({ windowRef });

    gamepad.buttons[GAMEPAD_BUTTONS.X] = { pressed: true, value: 1 };
    controller.updateGamepads(1 / 60);
    controller.updateGamepads(1 / 60);

    expect(inspectBag).toHaveBeenCalledTimes(1);
    expect(requestHarvest).not.toHaveBeenCalled();

    gamepad.buttons[GAMEPAD_BUTTONS.X] = { pressed: false, value: 0 };
    controller.updateGamepads(1 / 60);
    gamepad.buttons[GAMEPAD_BUTTONS.X] = { pressed: true, value: 1 };
    controller.updateGamepads(1 / 60);

    expect(inspectBag).toHaveBeenCalledTimes(2);
  });

  it("uses X as contextual interaction when the bag button should interact", () => {
    const shouldBagButtonInteract = vi.fn(() => true);
    const { controller, inspectBag, requestInteract } = createController({
      shouldBagButtonInteract
    });
    const event = createKeyboardEvent("KeyX");

    controller.handleKeydown(event);

    expect(shouldBagButtonInteract).toHaveBeenCalledTimes(1);
    expect(requestInteract).toHaveBeenCalledTimes(1);
    expect(inspectBag).not.toHaveBeenCalled();
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it("uses the gamepad X button as contextual interaction when needed", () => {
    const gamepad = createGamepad();
    const windowRef = {
      navigator: {
        getGamepads: () => [gamepad]
      }
    };
    const shouldBagButtonInteract = vi.fn(() => true);
    const { controller, inspectBag, requestInteract } = createController({
      windowRef,
      shouldBagButtonInteract
    });

    gamepad.buttons[GAMEPAD_BUTTONS.X] = { pressed: true, value: 1 };
    controller.updateGamepads(1 / 60);
    controller.updateGamepads(1 / 60);

    expect(shouldBagButtonInteract).toHaveBeenCalledTimes(1);
    expect(requestInteract).toHaveBeenCalledTimes(1);
    expect(inspectBag).not.toHaveBeenCalled();
  });

  it("uses the gamepad X button for nearby field actions before opening the bag", () => {
    const gamepad = createGamepad();
    const windowRef = {
      navigator: {
        getGamepads: () => [gamepad]
      }
    };
    const shouldGamepadButtonHarvest = vi.fn(() => true);
    const { controller, inspectBag, requestHarvest, requestInteract } = createController({
      windowRef,
      shouldGamepadButtonHarvest
    });

    gamepad.buttons[GAMEPAD_BUTTONS.X] = { pressed: true, value: 1 };
    controller.updateGamepads(1 / 60);
    controller.updateGamepads(1 / 60);

    expect(shouldGamepadButtonHarvest).toHaveBeenCalledTimes(1);
    expect(requestHarvest).toHaveBeenCalledTimes(1);
    expect(requestInteract).not.toHaveBeenCalled();
    expect(inspectBag).not.toHaveBeenCalled();
  });

  it("routes keyboard X and B to the open Workbench modal", () => {
    const handleWorkbenchModalKeydown = vi.fn(() => true);
    const { controller, inspectBag, requestHarvest } = createController({
      isWorkbenchModalOpen: () => true,
      handleWorkbenchModalKeydown
    });
    const confirmEvent = createKeyboardEvent("KeyX");
    const closeEvent = createKeyboardEvent("KeyB");

    controller.handleKeydown(confirmEvent);
    controller.handleKeydown(closeEvent);

    expect(handleWorkbenchModalKeydown).toHaveBeenNthCalledWith(1, confirmEvent);
    expect(handleWorkbenchModalKeydown).toHaveBeenNthCalledWith(2, closeEvent);
    expect(inspectBag).not.toHaveBeenCalled();
    expect(requestHarvest).not.toHaveBeenCalled();
    expect(confirmEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(closeEvent.preventDefault).toHaveBeenCalledTimes(1);
  });

  it("routes gamepad X and B to the open Workbench modal", () => {
    const gamepad = createGamepad();
    const windowRef = {
      navigator: {
        getGamepads: () => [gamepad]
      }
    };
    const handleWorkbenchModalKeydown = vi.fn(() => true);
    const { controller, inspectBag, requestHarvest } = createController({
      windowRef,
      isWorkbenchModalOpen: () => true,
      handleWorkbenchModalKeydown
    });

    gamepad.buttons[GAMEPAD_BUTTONS.X] = { pressed: true, value: 1 };
    controller.updateGamepads(1 / 60);
    gamepad.buttons[GAMEPAD_BUTTONS.X] = { pressed: false, value: 0 };
    controller.updateGamepads(1 / 60);
    gamepad.buttons[GAMEPAD_BUTTONS.B] = { pressed: true, value: 1 };
    controller.updateGamepads(1 / 60);

    expect(handleWorkbenchModalKeydown).toHaveBeenNthCalledWith(1, expect.objectContaining({
      code: "KeyX"
    }));
    expect(handleWorkbenchModalKeydown).toHaveBeenNthCalledWith(2, expect.objectContaining({
      code: "Space"
    }));
    expect(inspectBag).not.toHaveBeenCalled();
    expect(requestHarvest).not.toHaveBeenCalled();
  });

  it("routes gamepad D-pad navigation to the open Workbench modal", () => {
    const gamepad = createGamepad();
    const windowRef = {
      navigator: {
        getGamepads: () => [gamepad]
      }
    };
    const handleWorkbenchModalKeydown = vi.fn(() => true);
    const { controller } = createController({
      windowRef,
      isWorkbenchModalOpen: () => true,
      handleWorkbenchModalKeydown
    });

    gamepad.buttons[GAMEPAD_BUTTONS.DPAD_RIGHT] = { pressed: true, value: 1 };
    controller.updateGamepads(1 / 60);

    expect(handleWorkbenchModalKeydown).toHaveBeenCalledWith(expect.objectContaining({
      code: "ArrowRight"
    }));
  });

  it("lets the active scene consume the gamepad X button before opening the bag", () => {
    const gamepad = createGamepad();
    const windowRef = {
      navigator: {
        getGamepads: () => [gamepad]
      }
    };
    const handleKeydown = vi.fn((event) => event.code === "KeyX");
    const { controller, inspectBag, requestInteract } = createController({
      windowRef,
      sceneDirector: {
        blocksGameplayInput: () => false,
        handleKeydown,
        handleKeyup: vi.fn(() => false)
      }
    });

    gamepad.buttons[GAMEPAD_BUTTONS.X] = { pressed: true, value: 1 };
    controller.updateGamepads(1 / 60);
    controller.updateGamepads(1 / 60);

    expect(handleKeydown).toHaveBeenCalledWith(expect.objectContaining({
      code: "KeyX",
      key: "x"
    }));
    expect(requestInteract).not.toHaveBeenCalled();
    expect(inspectBag).not.toHaveBeenCalled();
  });

  it("routes the gamepad X button to scenes that block gameplay input", () => {
    const gamepad = createGamepad();
    const windowRef = {
      navigator: {
        getGamepads: () => [gamepad]
      }
    };
    const handleKeydown = vi.fn(() => true);
    const { controller, inspectBag, requestHarvest, requestInteract } = createController({
      windowRef,
      sceneDirector: {
        blocksGameplayInput: () => true,
        handleKeydown,
        handleKeyup: vi.fn(() => false)
      }
    });

    gamepad.buttons[GAMEPAD_BUTTONS.X] = { pressed: true, value: 1 };
    controller.updateGamepads(1 / 60);
    controller.updateGamepads(1 / 60);

    expect(handleKeydown).toHaveBeenCalledTimes(1);
    expect(handleKeydown).toHaveBeenCalledWith(expect.objectContaining({
      code: "KeyX",
      key: "x"
    }));
    expect(requestHarvest).not.toHaveBeenCalled();
    expect(requestInteract).not.toHaveBeenCalled();
    expect(inspectBag).not.toHaveBeenCalled();
  });

  it("routes the gamepad X button to the open Pokedesk instead of the bag", () => {
    const gamepad = createGamepad();
    const windowRef = {
      navigator: {
        getGamepads: () => [gamepad]
      }
    };
    const handleKeydown = vi.fn(() => true);
    const { controller, inspectBag, requestInteract } = createController({
      windowRef,
      isPokedexOpen: () => true,
      pokedexEntry: {
        handleKeydown
      }
    });

    gamepad.buttons[GAMEPAD_BUTTONS.X] = { pressed: true, value: 1 };
    controller.updateGamepads(1 / 60);
    controller.updateGamepads(1 / 60);

    expect(handleKeydown).toHaveBeenCalledTimes(1);
    expect(handleKeydown).toHaveBeenCalledWith(expect.objectContaining({
      code: "KeyX",
      key: "x"
    }));
    expect(requestInteract).not.toHaveBeenCalled();
    expect(inspectBag).not.toHaveBeenCalled();
  });

  it("routes D-pad left and right to the open Pokedesk pages", () => {
    const gamepad = createGamepad();
    const windowRef = {
      navigator: {
        getGamepads: () => [gamepad]
      }
    };
    const handleKeydown = vi.fn(() => true);
    const { controller, requestMoveCycle } = createController({
      windowRef,
      isPokedexOpen: () => true,
      pokedexEntry: {
        handleKeydown
      }
    });

    gamepad.buttons[GAMEPAD_BUTTONS.DPAD_LEFT] = { pressed: true, value: 1 };
    controller.updateGamepads(1 / 60);
    controller.updateGamepads(1 / 60);
    gamepad.buttons[GAMEPAD_BUTTONS.DPAD_LEFT] = { pressed: false, value: 0 };
    controller.updateGamepads(1 / 60);
    gamepad.buttons[GAMEPAD_BUTTONS.DPAD_RIGHT] = { pressed: true, value: 1 };
    controller.updateGamepads(1 / 60);

    expect(handleKeydown).toHaveBeenNthCalledWith(1, expect.objectContaining({
      code: "ArrowLeft",
      key: "ArrowLeft"
    }));
    expect(handleKeydown).toHaveBeenNthCalledWith(2, expect.objectContaining({
      code: "ArrowRight",
      key: "ArrowRight"
    }));
    expect(requestMoveCycle).not.toHaveBeenCalled();
  });

  it("routes gamepad navigation and confirm buttons to active gameplay dialogue", () => {
    const gamepad = createGamepad();
    const windowRef = {
      navigator: {
        getGamepads: () => [gamepad]
      }
    };
    const sceneDirector = {
      blocksGameplayInput: () => false,
      handleKeydown: vi.fn(() => true),
      handleKeyup: vi.fn(() => false)
    };
    const { controller, inspectBag, requestFollowerCall, requestHarvest, requestMoveCycle } = createController({
      windowRef,
      isGameplayDialogueActive: () => true,
      sceneDirector
    });

    gamepad.buttons[GAMEPAD_BUTTONS.DPAD_UP] = { pressed: true, value: 1 };
    controller.updateGamepads(1 / 60);
    gamepad.buttons[GAMEPAD_BUTTONS.DPAD_UP] = { pressed: false, value: 0 };
    controller.updateGamepads(1 / 60);
    gamepad.buttons[GAMEPAD_BUTTONS.DPAD_DOWN] = { pressed: true, value: 1 };
    controller.updateGamepads(1 / 60);
    gamepad.buttons[GAMEPAD_BUTTONS.DPAD_DOWN] = { pressed: false, value: 0 };
    controller.updateGamepads(1 / 60);
    gamepad.buttons[GAMEPAD_BUTTONS.X] = { pressed: true, value: 1 };
    controller.updateGamepads(1 / 60);
    gamepad.buttons[GAMEPAD_BUTTONS.X] = { pressed: false, value: 0 };
    controller.updateGamepads(1 / 60);
    gamepad.buttons[GAMEPAD_BUTTONS.LT] = { pressed: true, value: 1 };
    controller.updateGamepads(1 / 60);

    expect(sceneDirector.handleKeydown).toHaveBeenNthCalledWith(1, expect.objectContaining({
      code: "ArrowUp"
    }));
    expect(sceneDirector.handleKeydown).toHaveBeenNthCalledWith(2, expect.objectContaining({
      code: "ArrowDown"
    }));
    expect(sceneDirector.handleKeydown).toHaveBeenNthCalledWith(3, expect.objectContaining({
      code: "KeyX"
    }));
    expect(sceneDirector.handleKeydown).toHaveBeenNthCalledWith(4, expect.objectContaining({
      code: "Enter"
    }));
    expect(requestFollowerCall).not.toHaveBeenCalled();
    expect(requestMoveCycle).not.toHaveBeenCalled();
    expect(requestHarvest).not.toHaveBeenCalled();
    expect(inspectBag).not.toHaveBeenCalled();
  });

  it("routes left-stick navigation to active gameplay dialogue without moving the player", () => {
    const gamepad = createGamepad();
    const windowRef = {
      navigator: {
        getGamepads: () => [gamepad]
      }
    };
    const sceneDirector = {
      blocksGameplayInput: () => false,
      handleKeydown: vi.fn(() => true),
      handleKeyup: vi.fn(() => false)
    };
    const { controller } = createController({
      windowRef,
      isGameplayDialogueActive: () => true,
      sceneDirector
    });

    gamepad.axes[0] = 1;
    controller.updateGamepads(1 / 60);
    gamepad.axes[0] = 0;
    controller.updateGamepads(1 / 60);
    gamepad.axes[1] = -1;
    controller.updateGamepads(1 / 60);

    expect(sceneDirector.handleKeydown).toHaveBeenNthCalledWith(1, expect.objectContaining({
      code: "ArrowRight"
    }));
    expect(sceneDirector.handleKeydown).toHaveBeenNthCalledWith(2, expect.objectContaining({
      code: "ArrowUp"
    }));
    expect(controller.getAnalogMovement()).toEqual({
      x: 0,
      y: 0
    });
  });

  it("requests primary harvest from the left trigger", () => {
    const gamepad = createGamepad();
    const windowRef = {
      navigator: {
        getGamepads: () => [gamepad]
      }
    };
    const { controller, requestHarvest } = createController({ windowRef });

    gamepad.buttons[GAMEPAD_BUTTONS.LT] = { pressed: true, value: 1 };
    controller.updateGamepads(1 / 60);
    controller.updateGamepads(1 / 60);

    expect(requestHarvest).toHaveBeenCalledTimes(1);
  });

  it("requests primary harvest from Xbox left trigger when only analog value is reported", () => {
    const gamepad = createGamepad({
      id: "Xbox Wireless Controller"
    });
    const windowRef = {
      navigator: {
        getGamepads: () => [gamepad]
      }
    };
    const { controller, requestHarvest } = createController({ windowRef });

    gamepad.buttons[GAMEPAD_BUTTONS.LT] = { pressed: false, value: 1 };
    controller.updateGamepads(1 / 60);
    controller.updateGamepads(1 / 60);

    expect(requestHarvest).toHaveBeenCalledTimes(1);
    expect(requestHarvest).toHaveBeenCalledWith({ source: "gamepadPrimary" });
    expect(controller.isPrimaryActionActive()).toBe(true);
  });

  it("requests destroy action from keyboard Y", () => {
    const { controller } = createController();
    const event = createKeyboardEvent("KeyY");

    controller.handleKeydown(event);

    expect(controller.consumeDestroyActionRequest()).toBe(true);
    expect(controller.consumeDestroyActionRequest()).toBe(false);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
  });

  it("requests destroy action from gamepad Y once per press", () => {
    const gamepad = createGamepad();
    const windowRef = {
      navigator: {
        getGamepads: () => [gamepad]
      }
    };
    const { controller } = createController({ windowRef });

    gamepad.buttons[GAMEPAD_BUTTONS.Y] = { pressed: true, value: 1 };
    controller.updateGamepads(1 / 60);
    controller.updateGamepads(1 / 60);

    expect(controller.consumeDestroyActionRequest()).toBe(true);
    expect(controller.consumeDestroyActionRequest()).toBe(false);
  });

  it("requests destroy action from Xbox Series Y when the browser reports only button value", () => {
    const gamepad = createGamepad({
      id: "Xbox Wireless Controller"
    });
    const windowRef = {
      navigator: {
        getGamepads: () => [gamepad]
      }
    };
    const { controller } = createController({ windowRef });

    gamepad.buttons[GAMEPAD_BUTTONS.Y] = { pressed: false, value: 1 };
    controller.updateGamepads(1 / 60);

    expect(controller.consumeDestroyActionRequest()).toBe(true);
    expect(controller.consumeDestroyActionRequest()).toBe(false);
  });

  it("maps Nintendo-style physical Y to destroy action", () => {
    const gamepad = createGamepad({
      id: "Nintendo Switch Pro Controller"
    });
    const windowRef = {
      navigator: {
        getGamepads: () => [gamepad]
      }
    };
    const { controller, inspectBag } = createController({ windowRef });

    gamepad.buttons[GAMEPAD_BUTTONS.X] = { pressed: true, value: 1 };
    controller.updateGamepads(1 / 60);

    expect(controller.consumeDestroyActionRequest()).toBe(true);
    expect(inspectBag).not.toHaveBeenCalled();
  });

  it("maps Nintendo-style physical X to bag action", () => {
    const gamepad = createGamepad({
      id: "Nintendo Switch Pro Controller"
    });
    const windowRef = {
      navigator: {
        getGamepads: () => [gamepad]
      }
    };
    const { controller, inspectBag } = createController({ windowRef });

    gamepad.buttons[GAMEPAD_BUTTONS.Y] = { pressed: true, value: 1 };
    controller.updateGamepads(1 / 60);

    expect(inspectBag).toHaveBeenCalledTimes(1);
    expect(controller.consumeDestroyActionRequest()).toBe(false);
  });

  it("uses the right trigger for camera zoom instead of field moves", () => {
    const gamepad = createGamepad();
    const windowRef = {
      navigator: {
        getGamepads: () => [gamepad]
      }
    };
    const { controller, requestHarvest } = createController({ windowRef });

    gamepad.buttons[GAMEPAD_BUTTONS.RT] = { pressed: true, value: 1 };
    controller.updateGamepads(1 / 60);
    controller.updateGamepads(1 / 60);

    expect(controller.consumeCameraZoomCycleRequest()).toBe(true);
    expect(controller.consumeCameraZoomCycleRequest()).toBe(false);
    expect(requestHarvest).not.toHaveBeenCalled();
  });

  it("requests follower call from D-pad Up and Arrow Up", () => {
    const gamepad = createGamepad();
    const windowRef = {
      navigator: {
        getGamepads: () => [gamepad]
      }
    };
    const { controller, requestFollowerCall } = createController({ windowRef });
    const arrowEvent = createKeyboardEvent("ArrowUp");

    controller.handleKeydown(arrowEvent);

    expect(requestFollowerCall).toHaveBeenCalledTimes(1);
    expect(arrowEvent.preventDefault).toHaveBeenCalledTimes(1);

    gamepad.buttons[GAMEPAD_BUTTONS.DPAD_UP] = { pressed: true, value: 1 };
    controller.updateGamepads(1 / 60);
    controller.updateGamepads(1 / 60);

    expect(requestFollowerCall).toHaveBeenCalledTimes(2);
  });

  it("cycles moves with Arrow Left and Arrow Right", () => {
    const { controller, requestMoveCycle } = createController();
    const leftEvent = createKeyboardEvent("ArrowLeft");
    const rightEvent = createKeyboardEvent("ArrowRight");

    controller.handleKeydown(leftEvent);
    controller.handleKeydown(rightEvent);

    expect(requestMoveCycle).toHaveBeenNthCalledWith(1, -1);
    expect(requestMoveCycle).toHaveBeenNthCalledWith(2, 1);
    expect(leftEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(rightEvent.preventDefault).toHaveBeenCalledTimes(1);
  });

  it("only rotates the camera with mouse movement while right dragging", () => {
    const { controller } = createController();

    controller.handlePointerMove({
      buttons: 0,
      movementX: 50,
      movementY: -20,
      target: document.body
    });

    expect(controller.consumeCameraLookDelta()).toEqual({
      yaw: 0,
      pitch: 0
    });

    controller.handlePointerMove({
      buttons: 2,
      movementX: 50,
      movementY: -20,
      target: document.body
    });

    const lookDelta = controller.consumeCameraLookDelta();
    expect(lookDelta.yaw).toBeGreaterThan(0);
    expect(lookDelta.pitch).toBeGreaterThan(0);
  });

  it("cycles moves with D-pad left and right without using analog axes", () => {
    const gamepad = createGamepad();
    const windowRef = {
      navigator: {
        getGamepads: () => [gamepad]
      }
    };
    const { controller, requestMoveCycle } = createController({ windowRef });

    gamepad.axes[0] = -1;
    controller.updateGamepads(1 / 60);
    expect(requestMoveCycle).not.toHaveBeenCalled();

    gamepad.axes[0] = 0;
    gamepad.buttons[GAMEPAD_BUTTONS.DPAD_LEFT] = { pressed: true, value: 1 };
    controller.updateGamepads(1 / 60);
    controller.updateGamepads(1 / 60);

    gamepad.buttons[GAMEPAD_BUTTONS.DPAD_LEFT] = { pressed: false, value: 0 };
    controller.updateGamepads(1 / 60);
    gamepad.buttons[GAMEPAD_BUTTONS.DPAD_RIGHT] = { pressed: true, value: 1 };
    controller.updateGamepads(1 / 60);

    expect(requestMoveCycle).toHaveBeenNthCalledWith(1, -1);
    expect(requestMoveCycle).toHaveBeenNthCalledWith(2, 1);
  });
});
