import { describe, expect, it } from "vitest";
import {
  createInputModalityTracker,
  GAMEPAD_LAYOUT,
  INPUT_DEVICE,
  resolveGamepadLayout
} from "../input/inputModality.js";

describe("input modality", () => {
  it("starts in keyboard and mouse mode", () => {
    const tracker = createInputModalityTracker({ now: () => 10 });

    expect(tracker.getState()).toEqual({
      device: INPUT_DEVICE.KEYBOARD_MOUSE,
      gamepadLayout: GAMEPAD_LAYOUT.GENERIC,
      gamepadId: "",
      lastInputAt: 0
    });
  });

  it("records keyboard, pointer, and gamepad input", () => {
    let clock = 0;
    const tracker = createInputModalityTracker({ now: () => {
      clock += 1;
      return clock;
    } });

    tracker.recordGamepadInput({ id: "Xbox Wireless Controller" });
    expect(tracker.getState()).toMatchObject({
      device: INPUT_DEVICE.GAMEPAD,
      gamepadLayout: GAMEPAD_LAYOUT.XBOX,
      gamepadId: "Xbox Wireless Controller",
      lastInputAt: 1
    });

    tracker.recordKeyboardInput();
    expect(tracker.getState()).toMatchObject({
      device: INPUT_DEVICE.KEYBOARD_MOUSE,
      gamepadLayout: GAMEPAD_LAYOUT.XBOX,
      gamepadId: "Xbox Wireless Controller",
      lastInputAt: 2
    });

    tracker.recordPointerInput();
    expect(tracker.getState()).toMatchObject({
      device: INPUT_DEVICE.KEYBOARD_MOUSE,
      lastInputAt: 3
    });
  });

  it("detects common gamepad layouts from ids", () => {
    expect(resolveGamepadLayout("Nintendo Switch Pro Controller")).toBe(GAMEPAD_LAYOUT.NINTENDO);
    expect(resolveGamepadLayout("Joy-Con R")).toBe(GAMEPAD_LAYOUT.NINTENDO);
    expect(resolveGamepadLayout("XInput STANDARD GAMEPAD")).toBe(GAMEPAD_LAYOUT.XBOX);
    expect(resolveGamepadLayout("Unknown Controller")).toBe(GAMEPAD_LAYOUT.GENERIC);
  });
});
