function setUiLayerMode(uiLayer, mode) {
  if (uiLayer instanceof HTMLElement) {
    uiLayer.dataset.mode = mode;
  }
}

const GAMEPLAY_DEFAULT_UI_SECTIONS = Object.freeze([
  "hud"
]);

export function createGameScenes({
  gameFlowValues,
  uiLayer,
  gameplayUiVisibility,
  gameplayDialogue,
  startScreen,
  introSequence,
  introRoomDebugPanel,
  activateIntroRoomScene,
  scheduleIntroSequenceStart,
  cancelIntroSequenceStart,
  camera,
  cameraOrbit,
  actTwoSequence,
  actTwoTutorial,
  getGameSession,
  tutorialConfig
}) {
  return {
    [gameFlowValues.START]: {
      blocksGameplayInput: true,
      enter() {
        startScreen.start();
      },
      exit() {
        startScreen.dismiss();
      },
      handleKeydown(event) {
        return startScreen.handleKeydown(event);
      },
      handleKeyup(event) {
        return startScreen.handleKeyup(event);
      }
    },
    [gameFlowValues.INTRO]: {
      blocksGameplayInput: true,
      enter() {
        const introRoomScene = getGameSession()?.introRoomScene;

        if (activateIntroRoomScene) {
          activateIntroRoomScene(introRoomScene);
        } else {
          introRoomScene?.enter?.({
            camera,
            cameraOrbit
          });
          introRoomDebugPanel?.show?.(introRoomScene);
        }
        if (scheduleIntroSequenceStart && introRoomScene) {
          scheduleIntroSequenceStart(introRoomScene);
        } else if (!scheduleIntroSequenceStart) {
          introSequence.start();
        }
      },
      exit() {
        cancelIntroSequenceStart?.();
        introRoomDebugPanel?.hide?.();
        getGameSession()?.introRoomScene?.exit?.();
        introSequence.dismiss();
      },
      handleKeydown(event) {
        return introSequence.handleKeydown(event);
      },
      handleKeyup(event) {
        return introSequence.handleKeyup(event);
      }
    },
    [gameFlowValues.CINEMATIC]: {
      blocksGameplayInput: true,
      enter() {
        actTwoSequence.start();
      },
      handleKeydown(event) {
        return actTwoSequence.handleKeydown(event);
      },
      handleKeyup(event) {
        return actTwoSequence.handleKeyup(event);
      }
    },
    [gameFlowValues.TUTORIAL]: {
      blocksGameplayInput: false,
      enter() {
        const session = getGameSession();

        session?.spawnActTwoPlayer?.();
        if (session?.actTwoSquirtle && session.squirtleTexture) {
          session.actTwoSquirtle.texture = session.squirtleTexture;
        }

        actTwoTutorial.start(tutorialConfig);
      },
      handleKeydown(event) {
        return actTwoTutorial.handleKeydown(event);
      },
      handleKeyup(event) {
        return actTwoTutorial.handleKeyup(event);
      }
    },
    [gameFlowValues.GAMEPLAY]: {
      blocksGameplayInput: false,
      enter({ previousSceneId } = {}) {
        const session = getGameSession();

        introRoomDebugPanel?.hide?.();
        session?.introRoomScene?.exit?.();
        gameplayDialogue?.close?.();
        session?.spawnActTwoPlayer?.({
          preserveCamera: previousSceneId === gameFlowValues.CINEMATIC
        });
        setUiLayerMode(uiLayer, "game");
        gameplayUiVisibility?.hideAll?.();
        gameplayUiVisibility?.showSections?.(GAMEPLAY_DEFAULT_UI_SECTIONS);
      },
      handleKeydown(event) {
        return gameplayDialogue?.handleKeydown?.(event);
      },
      handleKeyup(event) {
        return gameplayDialogue?.handleKeyup?.(event);
      }
    }
  };
}
