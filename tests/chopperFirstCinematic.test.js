import { describe, expect, it, vi } from "vitest";
import {
  FIRST_CHOPPER_CINEMATIC_FLAG,
  playFirstChopperCinematic,
  shouldPlayFirstChopperCinematic
} from "../app/scene/chopperFirstCinematic.js";

describe("chopperFirstCinematic", () => {
  it("plays only once for the first Chopper onboarding dialogue", async () => {
    const storyState = { flags: {} };
    const calls = [];
    const transitionVeil = {
      show: vi.fn(async () => {
        calls.push("fade-out");
      }),
      hide: vi.fn(async () => {
        calls.push("fade-in");
      })
    };
    const focusConversation = vi.fn(() => {
      calls.push("focus");
    });
    const openConversation = vi.fn(() => {
      calls.push("dialogue");
      return true;
    });

    expect(shouldPlayFirstChopperCinematic(storyState, {
      targetId: "tangrowth",
      dialogueId: "onboarding"
    })).toBe(true);

    await playFirstChopperCinematic({
      storyState,
      targetId: "tangrowth",
      dialogueId: "onboarding",
      transitionVeil,
      focusConversation,
      openConversation,
      clearGameFlowInput: vi.fn()
    });

    expect(storyState.flags[FIRST_CHOPPER_CINEMATIC_FLAG]).toBe(true);
    expect(calls).toEqual(["fade-out", "focus", "fade-in", "dialogue"]);

    await playFirstChopperCinematic({
      storyState,
      targetId: "tangrowth",
      dialogueId: "onboarding",
      transitionVeil,
      focusConversation,
      openConversation
    });

    expect(transitionVeil.show).toHaveBeenCalledTimes(1);
    expect(openConversation).toHaveBeenCalledTimes(2);
  });

  it("does not run for non-onboarding Chopper dialogue", () => {
    expect(shouldPlayFirstChopperCinematic(
      { flags: {} },
      {
        targetId: "tangrowth",
        dialogueId: "firstHabitatReport"
      }
    )).toBe(false);
  });
});
