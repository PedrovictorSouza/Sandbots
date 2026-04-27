import { describe, expect, it } from "vitest";
import { GAME_FLOW } from "../gameFlow.js";
import { LAUNCH_MODE } from "../app/runtime/launchMode.js";
import {
  resolveActiveSceneWorkbench,
  resolveSceneWorkbench
} from "../app/scene/sceneWorkbench.js";

describe("sceneWorkbench", () => {
  it("boots into the start screen workbench with the normal cinematic handoff", () => {
    expect(resolveSceneWorkbench()).toEqual({
      initialSceneId: GAME_FLOW.START,
      launchMode: LAUNCH_MODE.DEFAULT,
      postCinematicSceneId: null
    });
  });

  it("can be disabled explicitly", () => {
    expect(
      resolveSceneWorkbench({
        enabled: false
      })
    ).toBeNull();
  });

  it("drops the cinematic workbench when an explicit launch mode is requested", () => {
    expect(resolveActiveSceneWorkbench(LAUNCH_MODE.HANDBOOK)).toBeNull();
    expect(resolveActiveSceneWorkbench(LAUNCH_MODE.GAMEPLAY)).toBeNull();
    expect(resolveActiveSceneWorkbench(LAUNCH_MODE.DEFAULT)).toEqual(resolveSceneWorkbench());
  });
});
