// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { GAMEPAD_BUTTONS } from "../input/gameInputBindings.js";
import { createGameInputController } from "../input/gameInputController.js";

function createController(overrides = {}) {
  const requestPokedexOpen = vi.fn();
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
    pokedexEntry: {
      handleKeydown: vi.fn(() => false)
    },
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
    requestPokedexOpen
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

function createGamepad() {
  return {
    buttons: Array.from({ length: 16 }, () => ({ pressed: false, value: 0 })),
    axes: [0, 0, 0, 0]
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

  it("opens the Pokedesk once per Select button press", () => {
    const gamepad = createGamepad();
    const windowRef = {
      navigator: {
        getGamepads: () => [gamepad]
      }
    };
    const { controller, requestPokedexOpen } = createController({ windowRef });

    gamepad.buttons[GAMEPAD_BUTTONS.SELECT] = { pressed: true, value: 1 };
    controller.updateGamepads(1 / 60);
    controller.updateGamepads(1 / 60);

    expect(requestPokedexOpen).toHaveBeenCalledTimes(1);

    gamepad.buttons[GAMEPAD_BUTTONS.SELECT] = { pressed: false, value: 0 };
    controller.updateGamepads(1 / 60);
    gamepad.buttons[GAMEPAD_BUTTONS.SELECT] = { pressed: true, value: 1 };
    controller.updateGamepads(1 / 60);

    expect(requestPokedexOpen).toHaveBeenCalledTimes(2);
  });

  it("requests contextual interaction once per A button press", () => {
    const gamepad = createGamepad();
    const windowRef = {
      navigator: {
        getGamepads: () => [gamepad]
      }
    };
    const { controller, requestInteract } = createController({ windowRef });

    gamepad.buttons[GAMEPAD_BUTTONS.A] = { pressed: true, value: 1 };
    controller.updateGamepads(1 / 60);
    controller.updateGamepads(1 / 60);

    expect(requestInteract).toHaveBeenCalledTimes(1);

    gamepad.buttons[GAMEPAD_BUTTONS.A] = { pressed: false, value: 0 };
    controller.updateGamepads(1 / 60);
    gamepad.buttons[GAMEPAD_BUTTONS.A] = { pressed: true, value: 1 };
    controller.updateGamepads(1 / 60);

    expect(requestInteract).toHaveBeenCalledTimes(2);
  });

  it("uses the gamepad A button for nearby field actions", () => {
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

    expect(shouldGamepadButtonHarvest).toHaveBeenCalledTimes(1);
    expect(requestHarvest).toHaveBeenCalledTimes(1);
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

  it("requests primary harvest from the right trigger", () => {
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

    expect(requestHarvest).toHaveBeenCalledTimes(1);
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
