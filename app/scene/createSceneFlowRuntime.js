import {
  ACT_TWO_MONSTER_POSITION
} from "../../actTwoSceneConfig.js";
import { createGameFlowController, GAME_FLOW } from "../../gameFlow.js";
import {
  ACT_TWO_POKEDEX_CACHE_POSITION,
  ACT_TWO_REPAIR_PLANT_POSITION,
  ACT_TWO_SQUIRTLE_POSITION
} from "../../rendering/worldAssets.js";
import { createStartScreen } from "../../startScreen.js";
import { createIntroRoomDebugPanel } from "../scenes/introRoom/createIntroRoomDebugPanel.js";
import { createOverlayVeil } from "../ui/overlayTransition.js";
import { createGameScenes } from "./gameScenes.js";
import { createSceneDirector } from "./sceneDirector.js";

const ENABLE_INTRO_ROOM_DEBUG = true;

export function createSceneFlowRuntime({
  dom,
  appRoot,
  initialSceneId,
  sceneWorkbench,
  uiLayer,
  gameplayUiVisibility,
  gameplayDialogue,
  camera,
  cameraOrbit,
  createLazyUiModule,
  getGameSession,
  playerMemory,
  pushNotice,
  unlockPlayerSkill,
  unlockPokedexUi,
  setPokedexOverlayOpen
}) {
  let sceneDirector = null;
  let introRoomDebugPanelInstance = null;
  let introEntryPromise = Promise.resolve();
  let introSequenceStartTimer = null;
  const transitionVeil = createOverlayVeil({
    root: dom.sceneTransitionVeil
  });

  const gameFlow = createGameFlowController({
    initialFlow: initialSceneId,
    onChange: ({ current }) => {
      appRoot.dataset.gameFlow = current;
    }
  });
  const startScreen = createStartScreen({
    root: dom.startOverlay,
    uiLayer,
    initiallyActive: false,
    prepareExitTransition: () => transitionVeil.show(),
    onStart: () => {
      sceneDirector?.transition(GAME_FLOW.INTRO);
      void introEntryPromise
        .catch(() => {})
        .then(() => transitionVeil.hide());
    }
  });
  const introSequenceModule = createLazyUiModule(async () => {
    const { createIntroSequence } = await import("../../intro/index.js");
    return createIntroSequence({
      root: dom.introOverlay,
      uiLayer,
      autoStart: false,
      onComplete: (profile) => {
        playerMemory.gender = profile.gender;
        playerMemory.confirmation = profile.confirmation;
        playerMemory.trainer = profile.trainer;
        pushNotice(
          profile.gender === "feminino" ?
            "Memoria da treinadora recuperada." :
            "Memoria do treinador recuperada.",
          4.5
        );
        sceneDirector?.transition(GAME_FLOW.CINEMATIC);
      }
    });
  });
  const introSequence = {
    preload() {
      return introSequenceModule.preload();
    },
    start() {
      introEntryPromise = introSequenceModule.preload()
        .then((introSequenceInstance) => introSequenceInstance?.start?.());
      return introEntryPromise;
    },
    dismiss() {
      return introSequenceModule.invoke("dismiss", [], {
        replayIfUnloaded: true
      });
    },
    handleKeydown(event) {
      return introSequenceModule.invoke("handleKeydown", [event], {
        defaultValue: false
      });
    },
    handleKeyup(event) {
      return introSequenceModule.invoke("handleKeyup", [event], {
        defaultValue: false
      });
    }
  };
  const introRoomDebugPanel = {
    show(introRoomScene) {
      if (!ENABLE_INTRO_ROOM_DEBUG || !dom.introRoomDebugRoot || !introRoomScene) {
        return;
      }

      if (!introRoomDebugPanelInstance) {
        introRoomDebugPanelInstance = createIntroRoomDebugPanel({
          root: dom.introRoomDebugRoot,
          introRoomScene,
          camera,
          cameraOrbit
        });
      } else {
        introRoomDebugPanelInstance.setIntroRoomScene(introRoomScene);
      }

      introRoomDebugPanelInstance.show();
    },

    hide() {
      introRoomDebugPanelInstance?.hide?.();
    }
  };
  function activateIntroRoomScene(introRoomScene) {
    introRoomScene?.enter?.({
      camera,
      cameraOrbit
    });
    introRoomDebugPanel.show(introRoomScene);
  }

  function cancelIntroSequenceStart() {
    if (introSequenceStartTimer !== null) {
      globalThis.clearTimeout(introSequenceStartTimer);
      introSequenceStartTimer = null;
    }
  }

  function scheduleIntroSequenceStart(introRoomScene) {
    cancelIntroSequenceStart();

    if (!introRoomScene) {
      return introSequence.start();
    }

    const delayMs = Math.max(0, introRoomScene.getIntroUiDelayMs?.() || 0);

    introSequenceStartTimer = globalThis.setTimeout(() => {
      introSequenceStartTimer = null;
      void introSequence.start();
    }, delayMs);

    return introSequenceStartTimer;
  }
  const actTwoSequenceModule = createLazyUiModule(async () => {
    const { createActTwoSequence } = await import("../../actTwoSequence.js");
    return createActTwoSequence({
      root: dom.cinematicOverlay,
      uiLayer,
      camera,
      onComplete: () => {
        sceneDirector?.transition(sceneWorkbench?.postCinematicSceneId || GAME_FLOW.TUTORIAL);
      }
    });
  });
  const actTwoSequence = {
    preload() {
      return actTwoSequenceModule.preload();
    },
    start() {
      return actTwoSequenceModule.invoke("start", [], {
        replayIfUnloaded: true
      });
    },
    update(deltaTime) {
      return actTwoSequenceModule.invoke("update", [deltaTime]);
    },
    handleKeydown(event) {
      return actTwoSequenceModule.invoke("handleKeydown", [event], {
        defaultValue: false
      });
    },
    handleKeyup(event) {
      return actTwoSequenceModule.invoke("handleKeyup", [event], {
        defaultValue: false
      });
    }
  };
  const actTwoTutorialModule = createLazyUiModule(async () => {
    const { createActTwoTutorial } = await import("../../actTwoTutorial.js");
    return createActTwoTutorial({
      root: dom.tutorialOverlay,
      uiLayer,
      onAbilityUnlock: (abilityId) => {
        unlockPlayerSkill(abilityId);
      },
      onSquirtleHeal: () => {
        const session = getGameSession();

        if (session?.actTwoSquirtle && session.squirtleRecoveredTexture) {
          session.actTwoSquirtle.texture = session.squirtleRecoveredTexture;
        }
      },
      onPokedexReveal: () => {
        setPokedexOverlayOpen(true, {
          force: true,
          markSeen: true,
          scripted: true
        });
      },
      onComplete: (result) => {
        const session = getGameSession();

        playerMemory.humanClaim = result.humanClaim;
        playerMemory.pokedexReaction = result.pokedexReaction;
        playerMemory.pokedexChoice = result.pokedexChoice;
        playerMemory.foundPokedex = Boolean(result.foundPokedex);
        playerMemory.trainerLookChoice = result.trainerLookChoice;
        playerMemory.playerName = result.playerName || "";
        playerMemory.nameConfirmation = result.nameConfirmation;
        playerMemory.worldQuestion = result.worldQuestion;
        if (result.foundPokedex && !result.repairPlantFixed) {
          unlockPokedexUi();
          pushNotice("The Pokedex still works.", 3.6);
        }
        if (result.repairPlantFixed && session?.actTwoRepairPlant) {
          session.actTwoRepairPlant.fixed = true;
          unlockPokedexUi();
          pushNotice("The plant is online again. The Pokedex is reacting.", 4.2);
        }
        if (result.learnedWaterGun) {
          unlockPlayerSkill("transform");
          unlockPlayerSkill("waterGun");
          if (session?.actTwoSquirtle && session.squirtleRecoveredTexture) {
            session.actTwoSquirtle.texture = session.squirtleRecoveredTexture;
          }
        }
        sceneDirector?.transition(GAME_FLOW.GAMEPLAY);
      }
    });
  });
  let actTwoTutorialPendingStart = false;
  const actTwoTutorial = {
    preload() {
      return actTwoTutorialModule.preload();
    },
    isActive() {
      return actTwoTutorialModule.invoke("isActive", [], {
        defaultValue: actTwoTutorialPendingStart
      });
    },
    isMovementLocked() {
      return actTwoTutorialModule.invoke("isMovementLocked", [], {
        defaultValue: actTwoTutorialPendingStart
      });
    },
    hasStarted() {
      return actTwoTutorialModule.invoke("hasStarted", [], {
        defaultValue: actTwoTutorialPendingStart
      });
    },
    allowsCameraLook() {
      return actTwoTutorialModule.invoke("allowsCameraLook", [], {
        defaultValue: !actTwoTutorialPendingStart
      });
    },
    getMonsterPosition() {
      return actTwoTutorialModule.invoke("getMonsterPosition", [], {
        defaultValue: () => [...ACT_TWO_MONSTER_POSITION]
      });
    },
    getCameraFocusTarget() {
      return actTwoTutorialModule.invoke("getCameraFocusTarget", [], {
        defaultValue: null
      });
    },
    isRepairPlantFixed() {
      return actTwoTutorialModule.invoke("isRepairPlantFixed", [], {
        defaultValue: false
      });
    },
    registerCameraLook() {
      return actTwoTutorialModule.invoke("registerCameraLook", []);
    },
    start(config) {
      actTwoTutorialPendingStart = true;
      void actTwoTutorialModule.preload().finally(() => {
        actTwoTutorialPendingStart = false;
      });
      return actTwoTutorialModule.invoke("start", [config], {
        replayIfUnloaded: true
      });
    },
    update(cameraRef, viewportWidth, viewportHeight, playerPosition, deltaTime = 0) {
      return actTwoTutorialModule.invoke("update", [
        cameraRef,
        viewportWidth,
        viewportHeight,
        playerPosition,
        deltaTime
      ]);
    },
    handleKeydown(event) {
      return actTwoTutorialModule.invoke("handleKeydown", [event], {
        defaultValue: false
      });
    },
    notifyPokedexClosed() {
      return actTwoTutorialModule.invoke("notifyPokedexClosed", [], {
        replayIfUnloaded: true
      });
    },
    handleKeyup(event) {
      return actTwoTutorialModule.invoke("handleKeyup", [event], {
        defaultValue: false
      });
    }
  };

  sceneDirector = createSceneDirector({
    flowController: gameFlow,
    scenes: createGameScenes({
      gameFlowValues: GAME_FLOW,
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
      tutorialConfig: {
        monsterPosition: ACT_TWO_MONSTER_POSITION,
        squirtlePosition: ACT_TWO_SQUIRTLE_POSITION,
        inspectablePosition: ACT_TWO_POKEDEX_CACHE_POSITION,
        repairPlantPosition: ACT_TWO_REPAIR_PLANT_POSITION
      }
    })
  });

  return {
    actTwoSequence,
    actTwoTutorial,
    gameFlow,
    gameFlowValues: GAME_FLOW,
    sceneDirector,
    activateIntroRoomScene,
    scheduleIntroSequenceStart,
    cancelIntroSequenceStart,
    startScreen,
    introSequence
  };
}
