// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { createGameScenes } from "../app/scene/gameScenes.js";

describe("createGameScenes", () => {
  it("reveals the core HUD panels when gameplay starts", () => {
    const uiLayer = document.createElement("div");
    const gameplayUiVisibility = {
      hideAll: vi.fn(),
      showSections: vi.fn()
    };
    const gameplayDialogue = {
      close: vi.fn()
    };
    const session = {
      spawnActTwoPlayer: vi.fn()
    };

    const scenes = createGameScenes({
      gameFlowValues: {
        START: "start",
        INTRO: "intro",
        CINEMATIC: "cinematic",
        TUTORIAL: "tutorial",
        GAMEPLAY: "gameplay"
      },
      uiLayer,
      gameplayUiVisibility,
      gameplayDialogue,
      startScreen: {},
      introSequence: {},
      actTwoSequence: {},
      actTwoTutorial: {},
      getGameSession: () => session,
      tutorialConfig: {}
    });

    scenes.gameplay.enter({
      previousSceneId: "cinematic"
    });

    expect(session.spawnActTwoPlayer).toHaveBeenCalledWith({
      preserveCamera: true
    });
    expect(gameplayDialogue.close).toHaveBeenCalled();
    expect(gameplayUiVisibility.hideAll).toHaveBeenCalled();
    expect(gameplayUiVisibility.showSections).toHaveBeenCalledWith(["hud"]);
  });
});
