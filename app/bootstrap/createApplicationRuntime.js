import "../../styles/app.css";
import "../../styles/introDialogueBox.css";
import "../../styles/render-frame.css";
import "../../styles/pragt-overrides.css";
import {
  ACT_TWO_PLAYER_CAMERA_ZOOM_PRESETS
} from "../../actTwoSceneConfig.js";
import {
  BULBASAUR_POKEDEX_ENTRY_ID,
  SQUIRTLE_POKEDEX_ENTRY_ID
} from "../../pokedexEntries.js";
import { GAME_FLOW } from "../../gameFlow.js";
import {
  INVENTORY_ORDER,
  ITEM_DEFS,
  NPC_PROFILES,
  PLACEHOLDER_RECIPES,
  TANGROWTH_OPENING_LINE,
  WATER_GUN_POWER_ITEM_ID,
  createInitialInventory,
  getItemLabel
} from "../../gameplayContent.js";
import {
  addItems,
  buildQuestProgressCopy,
  consumeItems,
  createStoryState,
  formatDifficulty,
  formatRequirementSummary,
  getActiveQuest,
  getQuestProgressDescriptor,
  getRegionForPosition,
  hasItems
} from "../../story/progression.js";
import {
  BULBASAUR_HABITAT_DISCOVERY_DIALOGUE,
  SQUIRTLE_DISCOVERY_DIALOGUE,
  TANGROWTH_FLOWER_RECOVERY_DIALOGUE,
  TANGROWTH_ONBOARDING_DIALOGUE,
  TANGROWTH_TALL_GRASS_RETURN_DIALOGUE
} from "../../dialogue/gameplayDialogueContent.js";
import { createDialogueSystem } from "../dialogue/createDialogueSystem.js";
import { SMALL_ISLAND_DIALOGUES } from "../dialogue/dialogueData.js";
import { createQuestSystem } from "../quest/createQuestSystem.js";
import { QUEST_EVENT, SMALL_ISLAND_QUESTS } from "../quest/questData.js";
import { createHabitatSystem } from "../sandbox/createHabitatSystem.js";
import { SMALL_ISLAND_HABITATS } from "../sandbox/habitatData.js";
import {
  findNearbyGroundCell,
  purifyGroundCell,
  reviveGroundFlower,
  reviveGroundGrass
} from "../../groundGrid.js";
import { createGameInputController } from "../../input/gameInputController.js";
import {
  buildNearbyPrompt,
  collectWoodDrops,
  findNearbyHarvestTarget,
  findNearbyInteractable,
  isInteractableActive,
  isNpcActive,
  isResourceNodeActive,
  strikeNearbyPalm,
  updatePalmShake,
  updateResourceNodes
} from "../../world/islandWorld.js";
import { createGameplayInteractions } from "../../world/gameplayInteractions.js";
import { createGameSession } from "../gameSession.js";
import { startNatureRevivalEffect } from "../session/natureRevivalEffects.js";
import { startChopperNpcFlight } from "../session/chopperNpcActor.js";
import { createEngineRuntime } from "../runtime/createEngineRuntime.js";
import { createDialogueCameraController } from "../runtime/dialogueCameraController.js";
import { createGameAppController } from "../runtime/gameAppController.js";
import { startGameLoop } from "../runtime/gameLoop.js";
import { createUiRuntime } from "../runtime/createUiRuntime.js";
import { createSceneFlowRuntime } from "../scene/createSceneFlowRuntime.js";
import {
  LAUNCH_MODE,
  LAUNCH_MODE_STORAGE_KEY,
  applyLaunchModeRuntime,
  getInitialGameFlowForLaunchMode,
  resolveLaunchMode,
  shouldUseNoopWebGlForLaunchMode
} from "../runtime/launchMode.js";
import { resolveActiveSceneWorkbench } from "../scene/sceneWorkbench.js";
import {
  DEV_SCENE,
  SKIP_START_SCREEN_STORAGE_KEY,
  resolveRuntimeFlags
} from "../runtime/runtimeFlags.js";
import {
  markAppReady
} from "./runtimeBootstrap.js";
import { resolveDomElements } from "./resolveDomElements.js";
import { createGameShell } from "../ui/createGameShell.js";

const RESOURCE_HARVEST_PROMPT = "Enter action";
const INTERACT_PROMPT = "E talk";
const ENABLE_GAMEPLAY_DEV_BOOT = true;
const ENABLE_QUEST_PERSISTENCE = false;
const DEFAULT_DEV_SCENE = DEV_SCENE.GAMEPLAY;
const GAMEPLAY_DEFAULT_UI_SECTIONS = Object.freeze([
  "hud"
]);
const PLAYER_SKILL_DEFS = {
  transform: {
    id: "transform",
    label: "Transform",
    shortLabel: "Morph",
    glyph: "T",
    color: "#f0c96a",
    ink: "#2b2006"
  },
  waterGun: {
    id: "waterGun",
    label: "Water Gun",
    shortLabel: "Water",
    glyph: "W",
    color: "#65c7ff",
    ink: "#081f33"
  },
  leafage: {
    id: "leafage",
    label: "Leafage",
    shortLabel: "Leaf",
    glyph: "L",
    color: "#7ed36d",
    ink: "#0b2610"
  }
};
const PLAYER_SKILL_ORDER = ["transform", "waterGun", "leafage"];
const QUEST_COMPLETION_POP_DURATION_MS = 2400;
const QUEST_COMPLETION_POP_MESSAGES = Object.freeze({
  "learn-to-move": "YOU TOOK YOUR FIRST STEPS!",
  "wake-guide": "YOU MET CHOPPER!",
  "gather-first-supplies": "YOU GATHERED SUPPLIES!",
  "shape-a-living-patch": "YOU RESTORED A PATCH!",
  "record-a-memory": "YOU RECORDED A MEMORY!",
  "open-the-water-route": "YOU LEARNED WATER GUN!",
  "water-dry-grass": "YOU RESTORED THE TALL GRASS!",
  "inspect-rustling-grass": "YOU MET A NEW HELPER!",
  "grow-a-home-patch": "YOU GREW A HOME PATCH!",
  "chopper-first-habitat-report": "YOU REPORTED BACK!"
});
const CHOPPER_SECOND_TALK_APPROACH_DURATION = 1.05;
const CHOPPER_SECOND_TALK_STOP_DISTANCE = 1.45;

function scheduleIdleTask(windowRef, callback, timeout = 1200) {
  if (typeof windowRef.requestIdleCallback === "function") {
    windowRef.requestIdleCallback(callback, { timeout });
    return;
  }

  windowRef.setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining() {
        return 0;
      }
    });
  }, 1);
}

function readLocalStorageItem(windowRef, key) {
  try {
    return windowRef.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function createApplicationRuntime({
  documentRef = document,
  windowRef = window,
  isDev = import.meta.env.DEV
} = {}) {
  createGameShell({ documentRef });
  const dom = resolveDomElements(documentRef);
  const { appRoot, status } = dom;
  const launchParams = new URLSearchParams(windowRef.location.search);
  const storedLaunchMode = readLocalStorageItem(windowRef, LAUNCH_MODE_STORAGE_KEY);
  const storedSkipStartScreen = readLocalStorageItem(windowRef, SKIP_START_SCREEN_STORAGE_KEY);
  const launchMode = resolveLaunchMode({
    searchParams: launchParams,
    hash: windowRef.location.hash,
    storedLaunchMode
  }, {
    isDev
  });
  const sceneWorkbench = resolveActiveSceneWorkbench(launchMode);
  const effectiveLaunchMode = sceneWorkbench?.launchMode || launchMode;
  const runtimeFlags = resolveRuntimeFlags({
    searchParams: launchParams,
    hash: windowRef.location.hash,
    storedSkipStartScreen
  });
  const devSceneOverride =
    isDev &&
    ENABLE_GAMEPLAY_DEV_BOOT &&
    !runtimeFlags.scene &&
    !runtimeFlags.introRoom &&
    !runtimeFlags.skipStartScreen ?
      DEFAULT_DEV_SCENE :
      runtimeFlags.scene;
  const launchInitialGameFlow = getInitialGameFlowForLaunchMode(effectiveLaunchMode);
  const devSceneInitialGameFlow =
    devSceneOverride === DEV_SCENE.GAMEPLAY ? GAME_FLOW.GAMEPLAY :
    devSceneOverride === DEV_SCENE.INTRO ? GAME_FLOW.INTRO :
    devSceneOverride === DEV_SCENE.TUTORIAL ? GAME_FLOW.TUTORIAL :
    null;
  const initialSceneId =
    devSceneInitialGameFlow ||
    (
      (runtimeFlags.skipStartScreen || runtimeFlags.introRoom) && launchInitialGameFlow === GAME_FLOW.START ?
        GAME_FLOW.INTRO :
        sceneWorkbench?.initialSceneId ||
        launchInitialGameFlow
    );

  markAppReady(appRoot, "loading", effectiveLaunchMode);

  const pressedKeys = new Set();
  const inventory = createInitialInventory();
  const storyState = createStoryState();
  const playerMemory = {
    gender: null,
    confirmation: null,
    trainer: null,
    humanClaim: null,
    pokedexReaction: null,
    pokedexChoice: null,
    foundPokedex: false,
    trainerLookChoice: null,
    playerName: "",
    nameConfirmation: null,
    worldQuestion: null
  };
  const playerSkills = {
    transform: false,
    waterGun: false,
    leafage: false
  };
  let harvestRequested = false;
  let interactRequested = false;
  let gamePaused = false;
  let builderPanelOpen = false;
  let gameSession = null;
  let uiRuntime = null;
  let sceneFlowRuntime = null;
  let questCompletionPop = null;
  let scriptedInteractionActive = false;

  function getRuntimeNow() {
    return windowRef.performance?.now?.() ?? Date.now();
  }

  function buildQuestTransitionNotice(completedQuestIds = [], activeQuest = null) {
    const completedQuest = questSystem.getQuest(completedQuestIds.at(-1));
    const nextQuest = completedQuest?.nextQuestId ?
      questSystem.getQuest(completedQuest.nextQuestId) :
      activeQuest;
    const completedCopy = completedQuest ? `Task complete: ${completedQuest.title}.` : "Task complete.";
    const nextCopy = nextQuest ?
      `Next: ${nextQuest.title}. ${nextQuest.guidance || nextQuest.description}` :
      "Free roam: keep restoring the island and checking in with helpers.";
    return `${completedCopy} ${nextCopy}`;
  }

  function buildQuestCompletionPopText(completedQuestIds = []) {
    const completedQuestId = completedQuestIds.at(-1);
    const completedQuest = completedQuestId ? questSystem.getQuest(completedQuestId) : null;

    return QUEST_COMPLETION_POP_MESSAGES[completedQuestId] ||
      `YOU COMPLETED ${completedQuest?.title?.toUpperCase?.() || "THE TASK"}!`;
  }

  function showQuestCompletionPop(completedQuestIds = []) {
    questCompletionPop = {
      text: buildQuestCompletionPopText(completedQuestIds),
      expiresAt: getRuntimeNow() + QUEST_COMPLETION_POP_DURATION_MS
    };
  }

  function getQuestCompletionPop() {
    if (!questCompletionPop) {
      return null;
    }

    if (questCompletionPop.expiresAt <= getRuntimeNow()) {
      questCompletionPop = null;
      return null;
    }

    return questCompletionPop;
  }

  function getYawToward(fromPosition, toPosition) {
    const deltaX = toPosition[0] - fromPosition[0];
    const deltaZ = toPosition[2] - fromPosition[2];
    return Math.atan2(deltaX, deltaZ);
  }

  function getChopperNpcPosition() {
    return gameSession?.chopperNpcActor?.npcActor?.character?.getPosition?.() || null;
  }

  function buildChopperApproachTarget(playerPosition, chopperPosition) {
    const toPlayer = [
      playerPosition[0] - chopperPosition[0],
      playerPosition[2] - chopperPosition[2]
    ];
    const distance = Math.hypot(toPlayer[0], toPlayer[1]);
    const direction = distance > 0.001 ?
      [toPlayer[0] / distance, toPlayer[1] / distance] :
      [0, 1];

    return [
      playerPosition[0] - direction[0] * CHOPPER_SECOND_TALK_STOP_DISTANCE,
      playerPosition[1],
      playerPosition[2] - direction[1] * CHOPPER_SECOND_TALK_STOP_DISTANCE
    ];
  }

  function shouldPlayChopperSecondTalkApproach({ targetId, dialogueId }) {
    const firstMovementComplete = questSystem.getQuest("learn-to-move")?.status === "completed";

    return targetId === "tangrowth" &&
      dialogueId === "onboarding" &&
      firstMovementComplete &&
      !storyState.flags.chopperSecondTalkApproachSeen &&
      Boolean(gameSession?.chopperNpcActor) &&
      Boolean(gameSession?.playerCharacter);
  }

  const questSystem = createQuestSystem({
    quests: SMALL_ISLAND_QUESTS,
    storage: ENABLE_QUEST_PERSISTENCE ? windowRef.localStorage : null,
    transitionDelayMs: 3000,
    onChange({ reason, payload, activeQuest }) {
      uiRuntime?.syncQuestFocus(storyState);
      uiRuntime?.syncHudInstructions(storyState);
      uiRuntime?.renderMissionCards(storyState, inventory, uiRuntime.getNoticeMessage());

      if (reason === "quest-progress-completed" && payload?.completedQuestIds?.length) {
        showQuestCompletionPop(payload.completedQuestIds);
        uiRuntime?.pushNotice(
          buildQuestTransitionNotice(payload.completedQuestIds, activeQuest),
          5.2
        );

        if (payload.completedQuestIds.includes("inspect-rustling-grass")) {
          unlockPlayerSkill("leafage", {
            silent: true
          });
          uiRuntime?.pushNotice("You learned Leafage.");
        }
      }
    }
  });
  const dialogueSystem = createDialogueSystem({
    dialogues: SMALL_ISLAND_DIALOGUES,
    questSystem
  });
  const habitatSystem = createHabitatSystem({
    habitats: SMALL_ISLAND_HABITATS,
    storyState,
    onDiscover({ habitat, discoveredHabitats }) {
      uiRuntime?.setNearbyHabitats(discoveredHabitats.map((entry) => entry.label));
      uiRuntime?.pushNotice(`Habitat discovered: ${habitat.label}.`);
      if (habitat.pokedexEntryId) {
        uiRuntime?.pokedexRuntime.setOpen(true, {
          markSeen: true,
          entryId: habitat.pokedexEntryId
        });
      }
    }
  });

  function setStatusFallback(message, isError = false) {
    if (!status) {
      return;
    }

    status.textContent = message;
    status.dataset.error = isError ? "true" : "false";
  }

  function reportStatus(message, isError = false) {
    if (uiRuntime?.setStatus) {
      uiRuntime.setStatus(message, isError);
      return;
    }

    setStatusFallback(message, isError);
  }

  function clearGameFlowInput() {
    pressedKeys.clear();
    engine.cameraTurnKeys.clear();
    harvestRequested = false;
    interactRequested = false;
  }

  function setGamePaused(paused) {
    gamePaused = Boolean(paused);

    if (dom.pauseOverlay) {
      dom.pauseOverlay.hidden = !gamePaused;
      dom.pauseOverlay.dataset.active = gamePaused ? "true" : "false";
    }

    if (gamePaused) {
      clearGameFlowInput();
    }
  }

  function toggleGamePaused() {
    if (!sceneFlowRuntime?.sceneDirector?.is?.(sceneFlowRuntime.gameFlowValues.GAMEPLAY)) {
      return;
    }

    setGamePaused(!gamePaused);
  }

  function isBagDetailItemId(itemId) {
    return Boolean(ITEM_DEFS[itemId]?.bagDetailsEligible);
  }

  function unlockPlayerSkill(skillId, { silent = false } = {}) {
    if (!PLAYER_SKILL_DEFS[skillId] || playerSkills[skillId]) {
      return;
    }

    playerSkills[skillId] = true;
    uiRuntime.syncSkillsUi(playerSkills);
    if (!silent) {
      questSystem.emit({
        type: QUEST_EVENT.UNLOCK,
        targetId: skillId
      });
    }

    if (skillId === "waterGun") {
      inventory[WATER_GUN_POWER_ITEM_ID] = 1;
      uiRuntime.syncInventoryUi(inventory);
      uiRuntime.gameplayUiVisibility.showSections(["inventory"]);
    }
  }

  function setBuilderPanelOpen(open) {
    if (open && !uiRuntime.gameplayUiVisibility.isSectionVisible("builder")) {
      return;
    }

    builderPanelOpen = open;
    if (dom.builderPanel) {
      dom.builderPanel.hidden = !open;
    }

    pressedKeys.clear();
    harvestRequested = false;
    interactRequested = false;

    if (open) {
      windowRef.requestAnimationFrame(() => {
        uiRuntime.guidePanel.focusSearch();
      });
    }
  }

  const engine = createEngineRuntime({
    dom,
    launchMode: effectiveLaunchMode,
    shouldUseNoopWebGlForLaunchMode,
    windowRef,
    onWebGlUnavailable() {
      if (status) {
        status.textContent = "WebGL nao disponivel neste navegador.";
        status.dataset.error = "true";
      }
      markAppReady(appRoot, "error", effectiveLaunchMode);
    }
  });

  windowRef.addEventListener("error", (event) => {
    if (event.error && event.error.message) {
      reportStatus(event.error.message, true);
    }
  });

  windowRef.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason && event.reason.message ?
      event.reason.message :
      "Erro inesperado ao carregar o viewer.";
    reportStatus(reason, true);
  });

  uiRuntime = createUiRuntime({
    dom,
    inventory,
    storyState,
    playerSkills,
    inventoryOrder: INVENTORY_ORDER,
    itemDefs: ITEM_DEFS,
    playerSkillDefs: PLAYER_SKILL_DEFS,
    playerSkillOrder: PLAYER_SKILL_ORDER,
    npcProfiles: NPC_PROFILES,
    placeholderRecipes: PLACEHOLDER_RECIPES,
    getActiveQuest,
    getQuestProgressDescriptor,
    buildQuestProgressCopy,
    formatRequirementSummary,
    formatDifficulty,
    getRegionForPosition,
    resourceHarvestPrompt: RESOURCE_HARVEST_PROMPT,
    interactPrompt: INTERACT_PROMPT,
    questSystem,
    isBagDetailItemId,
    clearGameFlowInput,
    isBuilderPanelOpen: () => builderPanelOpen,
    setBuilderPanelOpen,
    onPokedexScriptedClose: () => {
      sceneFlowRuntime?.actTwoTutorial.notifyPokedexClosed();
    }
  });

  const {
    findNearbyActionTarget,
    performHarvestAction,
    performInteractAction,
    resetRuntimeState: resetGameplayRuntimeState
  } = createGameplayInteractions({
    npcProfiles: NPC_PROFILES,
    placeholderRecipes: PLACEHOLDER_RECIPES,
    startDialogue({ targetId, dialogueId, onComplete }) {
      const restoreCameraOnComplete = () => {
        onComplete?.();
        dialogueCamera.restoreGameplayCamera();
      };

      if (targetId === "tangrowth" && dialogueId === "onboarding") {
        const openOnboardingConversation = () => {
          return uiRuntime.gameplayDialogue.openConversation({
            lines: dialogueSystem.getConversation("chopperOnboarding") || TANGROWTH_ONBOARDING_DIALOGUE,
            onLineChange(line) {
              if (line?.id !== "notice-squirtle-sound") {
                return;
              }

              dialogueCamera?.focusWorldPoint({
                position: gameSession?.actTwoSquirtle?.position
              });
            },
            onComplete: restoreCameraOnComplete
          });
        };

        if (shouldPlayChopperSecondTalkApproach({ targetId, dialogueId })) {
          const chopperActor = gameSession.chopperNpcActor;
          const playerPosition = gameSession.playerCharacter.getPosition();
          const chopperPosition = getChopperNpcPosition() || playerPosition;
          const targetPosition = buildChopperApproachTarget(playerPosition, chopperPosition);

          storyState.flags.chopperSecondTalkApproachSeen = true;
          scriptedInteractionActive = true;
          clearGameFlowInput();
          dialogueCamera?.focusWorldPoint({
            position: chopperPosition,
            height: 1.55
          });

          const flightStarted = startChopperNpcFlight(chopperActor, {
            targetPosition,
            duration: CHOPPER_SECOND_TALK_APPROACH_DURATION,
            onComplete() {
              const latestPlayerPosition = gameSession?.playerCharacter?.getPosition?.() || playerPosition;
              const latestChopperPosition = getChopperNpcPosition() || targetPosition;

              chopperActor.npcActor.character?.faceToward?.(latestPlayerPosition);
              chopperActor.npcActor.faceYaw = getYawToward(latestChopperPosition, latestPlayerPosition);
              scriptedInteractionActive = false;
              dialogueCamera?.focusNpcConversation({
                targetId,
                playerPosition: latestPlayerPosition,
                npcActors: gameSession?.npcActors || [],
                interactables: gameSession?.interactables || []
              });
              openOnboardingConversation();
            }
          });

          if (!flightStarted) {
            scriptedInteractionActive = false;
            return openOnboardingConversation();
          }

          return true;
        }

        return openOnboardingConversation();
      }

      if (targetId === "tangrowth" && dialogueId === "tallGrassReturn") {
        return uiRuntime.gameplayDialogue.openConversation({
          lines: dialogueSystem.getConversation("chopperTallGrassReturn") || TANGROWTH_TALL_GRASS_RETURN_DIALOGUE,
          onComplete: restoreCameraOnComplete
        });
      }

      if (targetId === "tangrowth" && dialogueId === "firstHabitatReport") {
        return uiRuntime.gameplayDialogue.openConversation({
          lines: dialogueSystem.getConversation("chopperFirstHabitatReport"),
          onComplete: restoreCameraOnComplete
        });
      }

      if (targetId === "squirtle" && dialogueId === "discovery") {
        return uiRuntime.gameplayDialogue.openConversation({
          lines: dialogueSystem.getConversation("strandedHelperDiscovery") || SQUIRTLE_DISCOVERY_DIALOGUE,
          onComplete: restoreCameraOnComplete
        });
      }

      return false;
    },
    unlockPlayerAbility: unlockPlayerSkill,
    unlockPokedexReward() {
      if (gameSession?.actTwoSquirtle) {
        gameSession.actTwoSquirtle.recovered = true;
      }

      playerMemory.foundPokedex = true;
      uiRuntime.pokedexRuntime.unlock();
      questSystem.emit({
        type: QUEST_EVENT.PHOTO,
        targetId: "first-memory"
      });

      void uiRuntime.skillLearnOverlay.play({
        title: "YOU LEARNED",
        skillName: "WATER GUN!",
        note: "Hold X to restore dry ground."
      }).then(() => {
        uiRuntime.pokedexRuntime.setOpen(true, {
          markSeen: true,
          scripted: true,
          entryId: SQUIRTLE_POKEDEX_ENTRY_ID
        });
      });
    },
    onFirstGrassRestored() {
      questSystem.emit({
        type: QUEST_EVENT.PLACE,
        targetId: "revived-habitat"
      });
      questSystem.emit({
        type: QUEST_EVENT.BUILD,
        targetId: "revived-habitat"
      });
      uiRuntime.setNearbyHabitats(habitatSystem.getDiscoveredLabels());
      uiRuntime.syncQuestFocus(storyState);
    },
    onFlowersRecovered() {
      uiRuntime.gameplayDialogue.openConversation({
        lines: dialogueSystem.getConversation("chopperFlowerRecovery") || TANGROWTH_FLOWER_RECOVERY_DIALOGUE
      });
    },
    onBulbasaurRevealed({ cellId }) {
      const rustlingGrassPatch = gameSession?.groundGrassPatches?.find((groundGrassPatch) => {
        return groundGrassPatch.cellId === cellId;
      });
      const encounter = gameSession?.bulbasaurEncounter;

      if (!rustlingGrassPatch || !encounter) {
        return;
      }

      const originPosition = [
        rustlingGrassPatch.position[0],
        rustlingGrassPatch.position[1] + 0.06,
        rustlingGrassPatch.position[2]
      ];
      const landingPosition = [
        rustlingGrassPatch.position[0] + 0.82,
        rustlingGrassPatch.position[1] + 0.02,
        rustlingGrassPatch.position[2] - 0.24
      ];

      encounter.visible = true;
      encounter.jumpTimer = encounter.jumpDuration;
      encounter.originPosition = originPosition;
      encounter.landingPosition = landingPosition;
      encounter.position = [...originPosition];
      uiRuntime.gameplayDialogue.openConversation({
        lines: dialogueSystem.getConversation("leafHelperHabitat") || BULBASAUR_HABITAT_DISCOVERY_DIALOGUE,
        onComplete: () => {
          questSystem.emit({
            type: QUEST_EVENT.TALK,
            targetId: "leaf-helper"
          });
          uiRuntime.pokedexRuntime.setOpen(true, {
            markSeen: true,
            entryId: BULBASAUR_POKEDEX_ENTRY_ID
          });
        }
      });
    },
    onGroundItemCollected({ itemId }) {
      uiRuntime.bagUiRuntime.handleItemCollected(itemId, storyState);
    },
    questSystem,
    habitatSystem,
    onNaturePatchRevived({ patch, type }) {
      if (!gameSession?.natureRevivalEffects || !patch) {
        return;
      }

      startNatureRevivalEffect(gameSession.natureRevivalEffects, {
        patch,
        type
      });
    },
    getActiveQuest,
    hasItems,
    consumeItems,
    addItems,
    formatRequirementSummary,
    getItemLabel,
    findNearbyInteractable,
    findNearbyHarvestTarget,
    findNearbyGroundCell,
    purifyGroundCell,
    reviveGroundFlower,
    reviveGroundGrass,
    strikeNearbyPalm,
    syncInventoryUi: uiRuntime.syncInventoryUi,
    pushNotice: uiRuntime.pushNotice
  });
  const dialogueCamera = createDialogueCameraController({
    camera: engine.camera,
    cameraOrbit: engine.cameraOrbit
  });

  sceneFlowRuntime = createSceneFlowRuntime({
    dom,
    appRoot,
    initialSceneId,
    sceneWorkbench,
    uiLayer: dom.uiLayer,
    gameplayUiVisibility: uiRuntime.gameplayUiVisibility,
    gameplayDialogue: uiRuntime.gameplayDialogue,
    camera: engine.camera,
    cameraOrbit: engine.cameraOrbit,
    createLazyUiModule: uiRuntime.createLazyUiModule,
    getGameSession: () => gameSession,
    playerMemory,
    pushNotice: uiRuntime.pushNotice,
    unlockPlayerSkill,
    unlockPokedexUi: uiRuntime.pokedexRuntime.unlock,
    setPokedexOverlayOpen: uiRuntime.pokedexRuntime.setOpen
  });

  const gameInput = createGameInputController({
    pressedKeys,
    cameraTurnKeys: engine.cameraTurnKeys,
    clearGameFlowInput,
    isPokedexOpen: () => uiRuntime.pokedexUiState.open,
    pokedexEntry: uiRuntime.pokedexEntry,
    sceneDirector: sceneFlowRuntime.sceneDirector,
    isBuilderPanelOpen: () => builderPanelOpen,
    setBuilderPanelOpen,
    requestHarvest: () => {
      harvestRequested = true;
    },
    requestInteract: () => {
      interactRequested = true;
    },
    requestPauseToggle: toggleGamePaused,
    inspectBag: uiRuntime.inspectBag,
    windowRef
  });

  windowRef.addEventListener("keydown", gameInput.handleKeydown);
  windowRef.addEventListener("keyup", gameInput.handleKeyup);
  windowRef.addEventListener("pointermove", gameInput.handlePointerMove);

  const gameAppController = createGameAppController({
    createGameSession,
    sessionConfig: {
      gl: engine.gl,
      setStatus: uiRuntime.setStatus,
      camera: engine.camera,
      cameraOrbit: engine.cameraOrbit,
      worldTextureFactory: engine.worldTextureFactory,
      pressedKeys,
      getAnalogMovement: gameInput.getAnalogMovement,
      isRunActive: gameInput.isRunActive,
      consumeJumpRequest: gameInput.consumeJumpRequest,
      storyState,
      inventory,
      resetGameplayRuntimeState,
      syncInventoryUi: uiRuntime.syncInventoryUi,
      syncHudMeta: uiRuntime.syncHudMeta,
      syncHudInstructions: uiRuntime.syncHudInstructions,
      renderMissionCards: uiRuntime.renderMissionCards,
      clearGameFlowInput,
      launchMode: effectiveLaunchMode,
      initialSceneId,
      startScreen: sceneFlowRuntime.startScreen,
      introSequence: sceneFlowRuntime.introSequence
    },
    startGameLoop,
    loopConfig: {
      camera: engine.camera,
      mount: dom.renderFrame,
      worldCanvas: dom.worldCanvas,
      worldRenderer: engine.worldRenderer,
      worldSpeech: uiRuntime.worldSpeech,
      colliderGizmos: uiRuntime.colliderGizmos,
      groundCellHighlight: uiRuntime.groundCellHighlight,
      gameplayDialogue: uiRuntime.gameplayDialogue,
      dialogueCamera,
      gameFlowValues: sceneFlowRuntime.gameFlowValues,
      isGameFlow: sceneFlowRuntime.sceneDirector.is.bind(sceneFlowRuntime.sceneDirector),
      actTwoSequence: sceneFlowRuntime.actTwoSequence,
      actTwoTutorial: sceneFlowRuntime.actTwoTutorial,
      pokedexUiState: uiRuntime.pokedexUiState,
      controls: {
        cameraTurnKeys: engine.cameraTurnKeys,
        consumeCameraLookDelta: gameInput.consumeCameraLookDelta,
        clearCameraLookInput: gameInput.clearCameraLookInput,
        updateGamepads: gameInput.updateGamepads,
        isPaused: () => gamePaused,
        isSkillLearnActive: () => uiRuntime.skillLearnOverlay.isActive(),
        isScriptedInteractionActive: () => scriptedInteractionActive,
        isPrimaryActionActive: gameInput.isPrimaryActionActive,
        inventory,
        playerSkills,
        storyState,
        isBuilderPanelOpen: () => builderPanelOpen,
        clearPendingActions() {
          harvestRequested = false;
          interactRequested = false;
        },
        clearMovementInput() {
          pressedKeys.clear();
          engine.cameraTurnKeys.clear();
          gameInput.clearCameraLookInput();
        },
        consumeHarvestRequest() {
          if (!harvestRequested) {
            return false;
          }

          harvestRequested = false;
          return true;
        },
        consumeInteractRequest() {
          if (!interactRequested) {
            return false;
          }

          interactRequested = false;
          return true;
        },
        consumeCameraZoomCycleRequest: gameInput.consumeCameraZoomCycleRequest
      },
      cameraOrbit: engine.cameraOrbitConfig,
      cameraZoomPresets: ACT_TWO_PLAYER_CAMERA_ZOOM_PRESETS,
      gameplay: {
        buildNearbyPrompt,
        collectWoodDrops(playerPosition, woodDrops, inventoryState) {
          const collectedWoodCount = collectWoodDrops(playerPosition, woodDrops, inventoryState);

          if (collectedWoodCount > 0) {
            uiRuntime.bagUiRuntime.handleItemCollected("wood", storyState);
            questSystem.emit({
              type: QUEST_EVENT.COLLECT,
              targetId: "wood",
              amount: collectedWoodCount
            });
          }

          return collectedWoodCount;
        },
        findNearbyActionTarget,
        findNearbyInteractable,
        getActiveQuest,
        getActiveSystemQuest() {
          return questSystem.getActiveQuest();
        },
        getQuestCompletionPop,
        getItemLabel,
        performHarvestAction,
        performInteractAction,
        recordQuestEvent(event) {
          return questSystem.emit(event);
        },
        tangrowthOpeningLine: TANGROWTH_OPENING_LINE,
        updatePalmShake,
        updateResourceNodes
      },
      hud: {
        getNoticeMessage: uiRuntime.getNoticeMessage,
        pushNotice: uiRuntime.pushNotice,
        renderMissionCards: uiRuntime.renderMissionCards,
        setStatus: uiRuntime.setStatus,
        syncQuestFocus: uiRuntime.syncQuestFocus,
        syncHudInstructions: uiRuntime.syncHudInstructions,
        syncHudMeta: uiRuntime.syncHudMeta,
        syncInventoryUi: uiRuntime.syncInventoryUi,
        updateTransientNotice: uiRuntime.updateTransientNotice
      },
      rendering: {
        ...engine.rendering,
        debugColliders: runtimeFlags.debugColliders,
        isNpcActive,
        isInteractableActive,
        isResourceNodeActive
      }
    },
    onSessionReady(session) {
      gameSession = session;
      if (sceneFlowRuntime.sceneDirector.is(GAME_FLOW.INTRO)) {
        sceneFlowRuntime.activateIntroRoomScene(session.introRoomScene);
        sceneFlowRuntime.scheduleIntroSequenceStart(session.introRoomScene);
      }
      if (sceneFlowRuntime.sceneDirector.is(GAME_FLOW.TUTORIAL)) {
        session.spawnActTwoPlayer?.();
        if (session.actTwoSquirtle) {
          session.actTwoSquirtle.recovered = false;
        }
      }
      if (sceneFlowRuntime.sceneDirector.is(GAME_FLOW.GAMEPLAY)) {
        session.spawnActTwoPlayer?.();
        if (dom.uiLayer instanceof HTMLElement) {
          dom.uiLayer.dataset.mode = "game";
        }
        uiRuntime.gameplayDialogue.close?.();
        uiRuntime.gameplayUiVisibility.hideAll?.();
        uiRuntime.gameplayUiVisibility.showSections?.(GAMEPLAY_DEFAULT_UI_SECTIONS);
        if (runtimeFlags.debugColliders) {
          uiRuntime.pushNotice("Collider gizmos enabled.");
        }
      }
      applyLaunchModeRuntime(effectiveLaunchMode, {
        session,
        startScreen: sceneFlowRuntime.startScreen,
        introSequence: sceneFlowRuntime.introSequence,
        clearGameFlowInput,
        unlockPlayerSkill,
        unlockPokedexUi: uiRuntime.pokedexRuntime.unlock,
        setPokedexSeen: uiRuntime.pokedexRuntime.setSeen,
        playerMemory
      });
    }
  });

  function warmDeferredUiModules() {
    if (effectiveLaunchMode === LAUNCH_MODE.HANDBOOK) {
      scheduleIdleTask(windowRef, () => {
        void uiRuntime.guidePanel.preload();
      }, 400);
    }

    scheduleIdleTask(windowRef, () => {
      void uiRuntime.pokedexEntry.preload();
    }, 900);

    if (initialSceneId === GAME_FLOW.GAMEPLAY) {
      return;
    }

    scheduleIdleTask(windowRef, () => {
      void sceneFlowRuntime.introSequence.preload();
    }, 1100);
    scheduleIdleTask(windowRef, () => {
      void sceneFlowRuntime.actTwoSequence.preload();
    }, 1500);
    scheduleIdleTask(windowRef, () => {
      void sceneFlowRuntime.actTwoTutorial.preload();
    }, 1900);
  }

  return {
    async start() {
      try {
        await gameAppController.start();
        if (
          sceneFlowRuntime.sceneDirector?.is(GAME_FLOW.START) &&
          sceneFlowRuntime.startScreen.isActive()
        ) {
          sceneFlowRuntime.startScreen.start();
        }
        markAppReady(appRoot, "ready", effectiveLaunchMode);
        warmDeferredUiModules();
      } catch (error) {
        console.error(error);
        reportStatus(error.message || "Falha ao carregar a cena.", true);
        markAppReady(appRoot, "error", effectiveLaunchMode);
      }
    }
  };
}
