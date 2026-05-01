// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { createGameScenes } from "../app/scene/gameScenes.js";

describe("createGameScenes", () => {
  it("marks the first gameplay opening instead of spawning immediately", () => {
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
      previousSceneId: "start"
    });

    expect(session.spawnActTwoPlayer).not.toHaveBeenCalled();
    expect(session.gameplayOpeningRequested).toBe(true);
    expect(gameplayDialogue.close).toHaveBeenCalled();
    expect(gameplayUiVisibility.hideAll).toHaveBeenCalled();
    expect(gameplayUiVisibility.showSections).toHaveBeenCalledWith(["hud"]);
  });

  it("does not re-arm the opening when gameplay already has a player", () => {
    const uiLayer = document.createElement("div");
    const gameplayUiVisibility = {
      hideAll: vi.fn(),
      showSections: vi.fn()
    };
    const gameplayDialogue = {
      close: vi.fn()
    };
    const session = {
      spawnActTwoPlayer: vi.fn(),
      playerCharacter: {}
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
      previousSceneId: "start"
    });

    expect(session.spawnActTwoPlayer).toHaveBeenCalledWith({
      preserveCamera: false
    });
    expect(session.gameplayOpeningRequested).toBeUndefined();
  });
});
