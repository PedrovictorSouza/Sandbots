import { describe, expect, it, vi } from "vitest";
import { createSceneDirector } from "../app/scene/sceneDirector.js";

function createFlowController(initialSceneId = "start") {
  let currentSceneId = initialSceneId;
  const transitions = new Map([
    ["start", new Set(["intro"])],
    ["intro", new Set(["gameplay"])],
    ["gameplay", new Set()]
  ]);

  return {
    getCurrent() {
      return currentSceneId;
    },
    is(sceneId) {
      return currentSceneId === sceneId;
    },
    canTransition(sceneId) {
      return sceneId === currentSceneId || transitions.get(currentSceneId)?.has(sceneId) === true;
    },
    transition(sceneId) {
      currentSceneId = sceneId;
      return currentSceneId;
    }
  };
}

describe("createSceneDirector", () => {
  it("enters the initial scene immediately", () => {
    const startEnter = vi.fn();
    createSceneDirector({
      flowController: createFlowController("start"),
      scenes: {
        start: { enter: startEnter },
        intro: {},
        gameplay: {}
      }
    });

    expect(startEnter).toHaveBeenCalledWith(expect.objectContaining({
      previousSceneId: null,
      reason: "initial"
    }));
  });

  it("runs scene exit and enter hooks through transitions", () => {
    const startExit = vi.fn();
    const introEnter = vi.fn();
    const director = createSceneDirector({
      flowController: createFlowController("start"),
      scenes: {
        start: { exit: startExit },
        intro: { enter: introEnter },
        gameplay: {}
      }
    });

    director.transition("intro", { reason: "user-action" });

    expect(startExit).toHaveBeenCalledWith(expect.objectContaining({
      nextSceneId: "intro",
      reason: "user-action"
    }));
    expect(introEnter).toHaveBeenCalledWith(expect.objectContaining({
      previousSceneId: "start",
      reason: "user-action"
    }));
    expect(director.is("intro")).toBe(true);
  });
});
