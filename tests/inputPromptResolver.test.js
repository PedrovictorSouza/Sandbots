import { describe, expect, it } from "vitest";
import { GAMEPAD_LAYOUT, INPUT_DEVICE } from "../input/inputModality.js";
import {
  resolveInitialHudGuide,
  resolveInputPrompt,
  resolvePlacementPreviewPrompt,
  resolvePlacementReadyPrompt,
  resolveWorkbenchRotationPrompt,
  UI_PROMPT_ACTION
} from "../app/ui/inputPromptResolver.js";

describe("input prompt resolver", () => {
  it("returns keyboard and mouse prompts by default", () => {
    expect(resolveInputPrompt(UI_PROMPT_ACTION.PLACE)).toBe("X / Enter Place");
    expect(resolveInputPrompt(UI_PROMPT_ACTION.CANCEL)).toBe("Space Cancel");
    expect(resolvePlacementPreviewPrompt("Move House Kit preview")).toBe(
      "Move House Kit preview  X / Enter Place  Space Cancel"
    );
  });

  it("uses custom keyboard controls when resolving keyboard prompts", () => {
    const modalityState = {
      keyboardControls: {
        bag: "KeyZ",
        primaryAction: "KeyF",
        jump: "KeyC"
      }
    };

    expect(resolveInputPrompt(UI_PROMPT_ACTION.PLACE, modalityState)).toBe("Z / F Place");
    expect(resolveInputPrompt(UI_PROMPT_ACTION.CANCEL, modalityState)).toBe("C Cancel");
  });

  it("returns Xbox style prompts for gamepad mode", () => {
    const modalityState = {
      device: INPUT_DEVICE.GAMEPAD,
      gamepadLayout: GAMEPAD_LAYOUT.XBOX
    };

    expect(resolvePlacementReadyPrompt("House Kit ready", modalityState)).toBe(
      "House Kit ready  X Place"
    );
    expect(resolvePlacementPreviewPrompt("Move House Kit preview", modalityState)).toBe(
      "Move House Kit preview  X Place  B Cancel  LB/RB Rotate"
    );
    expect(resolveWorkbenchRotationPrompt(modalityState)).toBe("X Confirm  LB/RB Rotate  B Cancel");
  });

  it("swaps X/Y labels for Nintendo style gamepads", () => {
    const modalityState = {
      device: INPUT_DEVICE.GAMEPAD,
      gamepadLayout: GAMEPAD_LAYOUT.NINTENDO
    };

    expect(resolveInputPrompt(UI_PROMPT_ACTION.PLACE, modalityState)).toBe("Y Place");
    expect(resolveInputPrompt(UI_PROMPT_ACTION.OPEN_BAG, modalityState)).toBe("Y Bag");
    expect(resolvePlacementPreviewPrompt("Move Solar Station preview", modalityState)).toBe(
      "Move Solar Station preview  Y Place  B Cancel  L/R Rotate"
    );
  });

  it("returns a modality-aware initial HUD guide", () => {
    expect(resolveInitialHudGuide()).toBe(
      "Use WASD to reach Chopper. He will point out the first repair."
    );
    expect(resolveInitialHudGuide({
      device: INPUT_DEVICE.GAMEPAD,
      gamepadLayout: GAMEPAD_LAYOUT.GENERIC
    })).toBe(
      "Use the left stick to reach Chopper. He will point out the first repair."
    );
  });
});
