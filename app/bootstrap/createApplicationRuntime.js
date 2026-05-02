import "../../styles/app.css";
import "../../styles/introDialogueBox.css";
import "../../styles/render-frame.css";
import "../../styles/pragt-overrides.css";
import {
  ACT_TWO_PLAYER_CAMERA_ZOOM_PRESETS
} from "../../actTwoSceneConfig.js";
import {
  SQUIRTLE_POKEDEX_ENTRY_ID
} from "../../pokedexEntries.js";
import { GAME_FLOW } from "../../gameFlow.js";
import {
  CAMPFIRE_ITEM_ID,
  DITTO_FLAG_ITEM_ID,
  INVENTORY_ORDER,
  ITEM_DEFS,
  LEAF_DEN_BUILD_DURATION_MS,
  LEAF_DEN_BUILD_REQUIREMENTS,
  LEAF_DEN_KIT_ITEM_ID,
  LEPPA_BERRY_ITEM_ID,
  LIFE_COINS_ITEM_ID,
  LOG_CHAIR_ITEM_ID,
  NPC_PROFILES,
  PLACEHOLDER_RECIPES,
  RUINED_POKEMON_CENTER_GUIDE_POSITION,
  RUINED_POKEMON_CENTER_POSITION,
  SIMPLE_WOODEN_DIY_RECIPES_ITEM_ID,
  STRAW_BED_ITEM_ID,
  STRAW_BED_RECIPE_ITEM_ID,
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
import { createDialogueSystem } from "../dialogue/createDialogueSystem.js";
import { SMALL_ISLAND_DIALOGUES } from "../dialogue/dialogueData.js";
import { createQuestSystem } from "../quest/createQuestSystem.js";
import { QUEST_EVENT, SMALL_ISLAND_QUESTS } from "../quest/questData.js";
import { createStoryBeatSystem } from "../story/createStoryBeatSystem.js";
import { STORY_BEAT_IDS } from "../story/storyBeatData.js";
import { createHabitatSystem } from "../sandbox/createHabitatSystem.js";
import { HABITAT_EVENT, SMALL_ISLAND_HABITATS } from "../sandbox/habitatData.js";
import {
  findNearbyGroundCell,
  purifyGroundCell,
  reviveGroundFlower,
  reviveGroundGrass
} from "../../groundGrid.js";
import { createGameInputController } from "../../input/gameInputController.js";
import {
  buildNearbyPrompt,
  buildCampfirePlacement,
  buildLeafDenKitPlacement,
  buildLogChairPlacement,
  buildStrawBedPlacement,
  collectLeppaBerryDrops as collectLeppaBerryDropItems,
  collectWoodDrops,
  findNearbyHarvestTarget,
  findNearbyInteractable,
  isInteractableActive,
  isNpcActive,
  isResourceNodeActive,
  syncLeppaTreeState,
  strikeNearbyPalm,
  updateBulbasaurStrawBedChallengeCompletion,
  waterNearbyPalm,
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
  "hud",
  "builder"
]);
const CHOPPER_BILL_CUTAWAY_START_TEXT =
  "Our human, Bill, waited as long as he could. Very patient man. Very limited warranty.";
const CHOPPER_BILL_CUTAWAY_END_TEXT =
  "Anyway, you're promoted. Mostly because everyone else is dust.";
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
const ACTIVE_FIELD_MOVE_ORDER = ["waterGun", "leafage"];
const QUEST_COMPLETION_POP_DURATION_MS = 2400;
const QUEST_COMPLETION_POP_MESSAGES = Object.freeze({
  "learn-to-move": "YOU TOOK YOUR FIRST STEPS!",
  "wake-guide": "YOU MET CHOPPER!",
  "shape-a-living-patch": "YOU RESTORED A PATCH!",
  "record-a-memory": "YOU RECORDED A MEMORY!",
  "open-the-water-route": "YOU LEARNED WATER GUN!",
  "water-dry-grass": "YOU RESTORED THE TALL GRASS!",
  "inspect-rustling-grass": "YOU LEARNED LEAFAGE!",
  "grow-a-home-patch": "YOU GREW A HOME PATCH!",
  "chopper-first-habitat-report": "YOU REPORTED BACK!"
});
const CHOPPER_SECOND_TALK_APPROACH_DURATION = 1.05;
const CHOPPER_SECOND_TALK_STOP_DISTANCE = 1.45;
const SQUIRTLE_DIALOGUE_MIN_PLAYER_DISTANCE = 1.55;
const TALL_GRASS_MEMORY_APPROACH_DURATION = 1.05;
const POKEMON_CENTER_GUIDE_FLIGHT_DURATION = 2.8;
const LEAF_DEN_KIT_LIFE_COIN_COST = 10;

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
  let harvestRequestSource = null;
  let interactRequested = false;
  let gamePaused = false;
  let builderPanelOpen = false;
  let gameSession = null;
  let uiRuntime = null;
  let sceneFlowRuntime = null;
  let storyBeats = null;
  let questCompletionPop = null;
  let scriptedInteractionActive = false;
  let followerCallRequested = false;
  let activeFieldMoveId = null;

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

  function setBillCameoVisible(visible) {
    if (gameSession?.billCameo) {
      gameSession.billCameo.visible = visible;
    }
  }

  function focusBillCameo() {
    const position = gameSession?.billCameo?.position;

    if (!position) {
      return false;
    }

    setBillCameoVisible(true);
    dialogueCamera?.focusWorldPoint({
      position,
      height: 1.05
    });
    return true;
  }

  function refocusChopperConversation() {
    const latestPlayerPosition = gameSession?.playerCharacter?.getPosition?.();

    if (!latestPlayerPosition) {
      return false;
    }

    dialogueCamera?.focusNpcConversation({
      targetId: "tangrowth",
      playerPosition: latestPlayerPosition,
      npcActors: gameSession?.npcActors || [],
      interactables: gameSession?.interactables || []
    });
    return true;
  }

  function revealDismantledSquirtle() {
    const squirtle = gameSession?.actTwoSquirtle;

    if (!squirtle) {
      return false;
    }

    squirtle.visible = true;
    if (!squirtle.recovered && squirtle.assemblyState !== "assembled") {
      squirtle.assemblyState = squirtle.reassembly?.active ? "reassembling" : "dismantled";
    }
    if (squirtle.modelInstance && squirtle.assemblyState !== "assembled") {
      squirtle.modelInstance.active = false;
    }
    return true;
  }

  function focusActTwoSquirtle({ defer = false } = {}) {
    const position = gameSession?.actTwoSquirtle?.position;

    if (!position) {
      return false;
    }

    const focus = () => {
      dialogueCamera?.focusWorldPoint({
        position,
        height: 1.05
      });
    };

    if (defer && typeof windowRef.requestAnimationFrame === "function") {
      windowRef.requestAnimationFrame(focus);
    } else {
      focus();
    }
    return true;
  }

  function focusActTwoSquirtleConversation({ defer = false } = {}) {
    const position = gameSession?.actTwoSquirtle?.position;
    const playerPosition = gameSession?.playerCharacter?.getPosition?.();

    if (!position || !playerPosition) {
      return focusActTwoSquirtle({ defer });
    }

    const focus = () => {
      const latestPlayerPosition = gameSession?.playerCharacter?.getPosition?.() || playerPosition;

      dialogueCamera?.focusNpcConversation({
        targetId: "squirtle",
        playerPosition: latestPlayerPosition,
        npcActors: gameSession?.npcActors || [],
        interactables: gameSession?.interactables || [],
        targetPosition: position
      });
    };

    if (defer && typeof windowRef.requestAnimationFrame === "function") {
      windowRef.requestAnimationFrame(focus);
    } else {
      focus();
    }
    return true;
  }

  function movePlayerAwayFromSquirtleForDialogue() {
    const squirtlePosition = gameSession?.actTwoSquirtle?.position;
    const playerCharacter = gameSession?.playerCharacter;
    const playerPosition = playerCharacter?.getPosition?.();

    if (!Array.isArray(squirtlePosition) || !Array.isArray(playerPosition)) {
      return false;
    }

    let deltaX = playerPosition[0] - squirtlePosition[0];
    let deltaZ = playerPosition[2] - squirtlePosition[2];
    let distance = Math.hypot(deltaX, deltaZ);

    if (distance >= SQUIRTLE_DIALOGUE_MIN_PLAYER_DISTANCE) {
      playerCharacter.faceToward?.(squirtlePosition);
      return false;
    }

    if (distance < 0.001) {
      deltaX = 0;
      deltaZ = 1;
      distance = 1;
    }

    const nextPosition = [
      squirtlePosition[0] + (deltaX / distance) * SQUIRTLE_DIALOGUE_MIN_PLAYER_DISTANCE,
      playerPosition[1],
      squirtlePosition[2] + (deltaZ / distance) * SQUIRTLE_DIALOGUE_MIN_PLAYER_DISTANCE
    ];

    playerCharacter.setPosition?.(nextPosition);
    playerCharacter.faceToward?.(squirtlePosition);
    return true;
  }

  function startSquirtleReassemblyBeforeDialogue(onComplete) {
    const squirtle = gameSession?.actTwoSquirtle;

    if (!squirtle || squirtle.recovered || squirtle.assemblyState === "assembled") {
      return false;
    }

    revealDismantledSquirtle();
    focusActTwoSquirtle({ defer: true });

    if (squirtle.reassembly?.active) {
      return true;
    }

    scriptedInteractionActive = true;
    clearGameFlowInput();
    squirtle.assemblyState = "reassembling";
    squirtle.visible = true;
    squirtle.reassembly = {
      active: true,
      elapsed: 0,
      duration: squirtle.reassembly?.duration || 1.25,
      progress: 0,
      onComplete: () => {
        scriptedInteractionActive = false;
        squirtle.visible = true;
        squirtle.assemblyState = "assembled";
        movePlayerAwayFromSquirtleForDialogue();
        focusActTwoSquirtleConversation();
        onComplete?.();
      }
    };

    return true;
  }

  function handleChopperOnboardingLineChange(line) {
    if (line?.text === CHOPPER_BILL_CUTAWAY_START_TEXT) {
      focusBillCameo();
      return;
    }

    if (line?.text === CHOPPER_BILL_CUTAWAY_END_TEXT) {
      setBillCameoVisible(false);
      refocusChopperConversation();
      return;
    }

    if (line?.id === "notice-squirtle-sound") {
      setBillCameoVisible(false);
      revealDismantledSquirtle();
      focusActTwoSquirtle();
    }
  }

  function syncQuestPanels() {
    uiRuntime?.syncQuestFocus(storyState);
    uiRuntime?.syncHudInstructions(storyState);
    uiRuntime?.renderMissionCards(storyState, inventory, uiRuntime.getNoticeMessage());
  }

  function trackFieldTask(taskId) {
    storyState.flags.trackedTaskIds ||= [];

    if (storyState.flags.trackedTaskIds.includes(taskId)) {
      return false;
    }

    storyState.flags.trackedTaskIds.push(taskId);
    syncQuestPanels();
    return true;
  }

  function recordBulbasaurSturdyStickChallengeProgress(amount) {
    const flags = storyState.flags;

    if (
      !flags.bulbasaurStrawBedChallengeAvailable ||
      flags.strawBedRecipeUnlocked ||
      amount <= 0
    ) {
      return false;
    }

    flags.sturdySticksGatheredForChallenge = Math.min(
      10,
      (flags.sturdySticksGatheredForChallenge || 0) + amount
    );

    const completed = updateBulbasaurStrawBedChallengeCompletion(storyState);

    if (completed) {
      flags.bulbasaurStrawBedChallengeCompletionNoticePending = true;
    }

    syncQuestPanels();
    return true;
  }

  function inspectBag() {
    const shouldSelectCampfireForTangrowth =
      storyState.flags.campfireCrafted &&
      !storyState.flags.campfireSpatOut &&
      hasItems(inventory, { [CAMPFIRE_ITEM_ID]: 1 });

    if (shouldSelectCampfireForTangrowth) {
      uiRuntime.bagUiRuntime.selectItem(CAMPFIRE_ITEM_ID);

      if (!storyState.flags.campfireSelectedForTangrowth) {
        storyState.flags.campfireSelectedForTangrowth = true;
        uiRuntime.pushNotice("Campfire selected.");
        syncQuestPanels();
      }
    }

    const shouldSelectStrawBedForBulbasaur =
      storyState.flags.strawBedCrafted &&
      !storyState.flags.strawBedPlacedInBulbasaurHabitat &&
      hasItems(inventory, { [STRAW_BED_ITEM_ID]: 1 });

    if (shouldSelectStrawBedForBulbasaur) {
      uiRuntime.bagUiRuntime.selectItem(STRAW_BED_ITEM_ID);

      if (!storyState.flags.strawBedSelectedForBulbasaur) {
        storyState.flags.strawBedSelectedForBulbasaur = true;
        uiRuntime.pushNotice("Straw Bed selected.");
        syncQuestPanels();
      }
    }

    const shouldSelectLeafDenKit =
      storyState.flags.leafDenBuildAvailable &&
      !storyState.flags.leafDenKitPlaced &&
      hasItems(inventory, { [LEAF_DEN_KIT_ITEM_ID]: 1 });

    if (shouldSelectLeafDenKit) {
      uiRuntime.bagUiRuntime.selectItem(LEAF_DEN_KIT_ITEM_ID);

      if (!storyState.flags.leafDenKitSelected) {
        storyState.flags.leafDenKitSelected = true;
        uiRuntime.pushNotice("Leaf Den Kit selected.");
        syncQuestPanels();
      }
    }

    const shouldSelectDittoFlagForHouse =
      storyState.flags.dittoFlagReceived &&
      !storyState.flags.dittoFlagPlacedOnHouse &&
      hasItems(inventory, { [DITTO_FLAG_ITEM_ID]: 1 });

    if (shouldSelectDittoFlagForHouse) {
      uiRuntime.bagUiRuntime.selectItem(DITTO_FLAG_ITEM_ID);

      if (!storyState.flags.dittoFlagSelectedForHouse) {
        storyState.flags.dittoFlagSelectedForHouse = true;
        uiRuntime.pushNotice("Ditto Flag selected.");
        syncQuestPanels();
      }
    }

    uiRuntime.inspectBag();
  }

  function shouldBagButtonInteractWithNearbyCharacter() {
    if (
      !gameSession?.playerCharacter ||
      !sceneFlowRuntime?.sceneDirector?.is?.(GAME_FLOW.GAMEPLAY) ||
      uiRuntime?.pokedexUiState?.open ||
      builderPanelOpen ||
      gamePaused
    ) {
      return false;
    }

    const playerPosition = gameSession.playerCharacter.getPosition();
    const nearbyInteractable = findNearbyInteractable(
      playerPosition,
      gameSession.npcActors,
      gameSession.interactables,
      storyState,
      gameSession.groundGrassPatches,
      gameSession.logChair,
      gameSession.leafDen,
      gameSession.timburrEncounter,
      gameSession.charmanderEncounter
    );

    const target = nearbyInteractable?.target;
    const characterInteractionKinds = new Set([
      "grassEncounter",
      "charmanderGrassEncounter",
      "timburrGrassEncounter",
      "bulbasaurMission",
      "bulbasaurRequestComplete",
      "bulbasaurStrawBedRecipe",
      "bulbasaurStrawBedComplete",
      "leppaBerryGift",
      "timburrLeafDenFurnitureComplete",
      "charmanderCelebrationRequest"
    ]);

    if (target?.id === "squirtle" || characterInteractionKinds.has(target?.kind)) {
      return true;
    }

    if (target?.id !== "tangrowth") {
      return false;
    }

    const activeQuest = getActiveQuest(storyState);

    return (
      activeQuest?.id === "meetTangrowth" ||
      (
        storyState.flags.tallGrassDiscovered &&
        !storyState.flags.tangrowthTallGrassCommentSeen
      ) ||
      (
        storyState.flags.tangrowthLogChairRequestAvailable &&
        !storyState.flags.logChairReceived
      ) ||
      (
        storyState.flags.tangrowthHouseTalkAvailable &&
        !storyState.flags.tangrowthHouseTalkComplete
      ) ||
      (
        storyState.flags.charmanderCelebrationSuggested &&
        !storyState.flags.charmanderCelebrationComplete
      )
    );
  }

  function shouldGamepadButtonHarvestNearbyFieldAction({ source = null } = {}) {
    if (
      !gameSession?.playerCharacter ||
      !sceneFlowRuntime?.sceneDirector?.is?.(GAME_FLOW.GAMEPLAY) ||
      uiRuntime?.pokedexUiState?.open ||
      uiRuntime?.skillLearnOverlay?.isActive?.() ||
      scriptedInteractionActive ||
      builderPanelOpen ||
      gamePaused
    ) {
      return false;
    }

    if (shouldBagButtonInteractWithNearbyCharacter()) {
      return false;
    }

    const playerPosition = gameSession.playerCharacter.getPosition();
    const activeHarvestTarget = findNearbyActionTarget({
      playerPosition,
      palmModel: gameSession.palmModel,
      palmInstances: gameSession.palmInstances,
      resourceNodes: gameSession.resourceNodes,
      leppaTree: gameSession.leppaTree,
      leafDen: gameSession.leafDen,
      storyState,
      inventory,
      groundDeadInstances: gameSession.groundDeadInstances,
      groundPurifiedInstances: gameSession.groundPurifiedInstances,
      groundGrassPatches: gameSession.groundGrassPatches,
      groundFlowerPatches: gameSession.groundFlowerPatches,
      canPurifyGround: playerSkills.waterGun && activeFieldMoveId === "waterGun",
      canUseLeafage: playerSkills.leafage && activeFieldMoveId === "leafage"
    });

    if (activeHarvestTarget?.logChairPlacement) {
      return source === "gamepadBag";
    }

    return Boolean(activeHarvestTarget);
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

  function getRestoredGrassHabitatPosition(restoredGrassHabitat, fallbackPosition) {
    const patches = Array.isArray(restoredGrassHabitat?.patches) ?
      restoredGrassHabitat.patches.filter((patch) => Array.isArray(patch?.position)) :
      [];

    if (!patches.length) {
      return fallbackPosition;
    }

    const center = patches.reduce((sum, patch) => [
      sum[0] + patch.position[0],
      sum[1] + patch.position[1],
      sum[2] + patch.position[2]
    ], [0, 0, 0]);

    return [
      center[0] / patches.length,
      center[1] / patches.length,
      center[2] / patches.length
    ];
  }

  function playTallGrassMemorySequence({
    groundCell = null,
    restoredGrassHabitat = null,
    newlyDiscoveredHabitats = []
  } = {}) {
    if (storyBeats?.hasCompleted(STORY_BEAT_IDS.CHOPPER_TALL_GRASS_MEMORY)) {
      storyBeats.complete(STORY_BEAT_IDS.CHOPPER_TALL_GRASS_MEMORY, {
        discoveredHabitats: newlyDiscoveredHabitats
      });
      return;
    }

    const chopperActor = gameSession?.chopperNpcActor;
    const playerPosition = gameSession?.playerCharacter?.getPosition?.();
    const chopperPosition = getChopperNpcPosition() || playerPosition;

    if (!playerPosition || !chopperPosition) {
      storyBeats?.complete(STORY_BEAT_IDS.CHOPPER_TALL_GRASS_MEMORY, {
        discoveredHabitats: newlyDiscoveredHabitats
      });
      return;
    }

    const restoredHabitatPosition = getRestoredGrassHabitatPosition(
      restoredGrassHabitat,
      groundCell?.offset || playerPosition
    );

    const openMemoryConversation = () => {
      const latestPlayerPosition = gameSession?.playerCharacter?.getPosition?.() || playerPosition;
      const latestChopperPosition = getChopperNpcPosition() || chopperPosition;
      chopperActor?.npcActor?.character?.faceToward?.(latestPlayerPosition);
      if (chopperActor?.npcActor) {
        chopperActor.npcActor.faceYaw = getYawToward(latestChopperPosition, latestPlayerPosition);
      }
      dialogueCamera?.focusNpcConversation({
        targetId: "tangrowth",
        playerPosition: latestPlayerPosition,
        npcActors: gameSession?.npcActors || [],
        interactables: gameSession?.interactables || []
      });
      storyBeats.playDialogue(STORY_BEAT_IDS.CHOPPER_TALL_GRASS_MEMORY, {
        context: {
          discoveredHabitats: newlyDiscoveredHabitats
        },
        onBeforeCompleteEffects: () => {
          scriptedInteractionActive = false;
          dialogueCamera?.restoreGameplayCamera();
        }
      });
    };

    storyBeats?.markCompleted(STORY_BEAT_IDS.CHOPPER_TALL_GRASS_MEMORY);
    scriptedInteractionActive = true;
    clearGameFlowInput();
    dialogueCamera?.focusWorldPoint({
      position: restoredHabitatPosition,
      height: 1.55
    });

    const targetPosition = buildChopperApproachTarget(restoredHabitatPosition, chopperPosition);
    const flightStarted = startChopperNpcFlight(chopperActor, {
      targetPosition,
      duration: TALL_GRASS_MEMORY_APPROACH_DURATION,
      onComplete: openMemoryConversation
    });

    if (!flightStarted) {
      openMemoryConversation();
    }
  }

  function startRuinedPokemonCenterGuide() {
    if (
      storyState.flags.pokemonCenterGuideFlightStarted ||
      storyState.flags.challengesUnlocked
    ) {
      syncQuestPanels();
      return;
    }

    storyState.flags.pokemonCenterGuideFlightStarted = true;
    uiRuntime?.pushNotice(
      "Follow Professor Tangrowth to the destroyed Pokemon Center.",
      4.8
    );

    const chopperActor = gameSession?.chopperNpcActor;
    const flightStarted = startChopperNpcFlight(chopperActor, {
      targetPosition: RUINED_POKEMON_CENTER_GUIDE_POSITION,
      duration: POKEMON_CENTER_GUIDE_FLIGHT_DURATION,
      onComplete() {
        const chopperPosition = getChopperNpcPosition();

        if (!chopperPosition || !chopperActor?.npcActor) {
          return;
        }

        chopperActor.npcActor.faceYaw = getYawToward(
          chopperPosition,
          RUINED_POKEMON_CENTER_POSITION
        );
      }
    });

    if (!flightStarted) {
      storyState.flags.pokemonCenterGuideFlightStarted = false;
    }

    syncQuestPanels();
  }

  function getLeafDenConstructionNow() {
    return windowRef.Date?.now?.() ?? Date.now();
  }

  function getDistance2d(fromPosition, toPosition) {
    if (!Array.isArray(fromPosition) || !Array.isArray(toPosition)) {
      return Infinity;
    }

    return Math.hypot(
      fromPosition[0] - toPosition[0],
      fromPosition[2] - toPosition[2]
    );
  }

  function getLeafDenHelperStatus() {
    const leafDenPosition = gameSession?.leafDen?.position;
    const timburrPosition = gameSession?.timburrEncounter?.position;
    const charmanderPosition = gameSession?.charmanderEncounter?.position;
    const maxDistance = 2.85;

    const timburrReady =
      storyState.flags.timburrRevealed &&
      storyState.flags.timburrFollowing &&
      gameSession?.timburrEncounter?.visible &&
      getDistance2d(timburrPosition, leafDenPosition) <= maxDistance;
    const charmanderReady =
      storyState.flags.charmanderRevealed &&
      storyState.flags.charmanderFollowing &&
      gameSession?.charmanderEncounter?.visible &&
      getDistance2d(charmanderPosition, leafDenPosition) <= maxDistance;

    return {
      timburrReady,
      otherReady: charmanderReady
    };
  }

  function isCharmanderNearTangrowthForCelebration() {
    const charmanderPosition = gameSession?.charmanderEncounter?.position;
    const tangrowthPosition = getChopperNpcPosition();

    return (
      storyState.flags.charmanderRevealed &&
      storyState.flags.charmanderFollowing &&
      gameSession?.charmanderEncounter?.visible &&
      getDistance2d(charmanderPosition, tangrowthPosition) <= 3.2
    );
  }

  function completeLeafDenConstructionIfReady() {
    if (
      !storyState.flags.leafDenConstructionStarted ||
      storyState.flags.leafDenBuilt
    ) {
      return false;
    }

    const completesAt = Number(storyState.flags.leafDenConstructionCompletesAt || 0);
    if (!completesAt || getLeafDenConstructionNow() < completesAt) {
      return false;
    }

    storyBeats.playDialogue(STORY_BEAT_IDS.LEAF_DEN_COMPLETE, {
      onComplete: syncQuestPanels
    });
    return true;
  }

  function buildLeafDenFurniturePlacement(index) {
    const anchor = gameSession?.leafDen?.position || [0, 0.02, 0];
    const offsets = [
      [-0.72, 0, 0.62],
      [0.58, 0, 0.58],
      [0.04, 0, -0.52]
    ];
    const offset = offsets[index % offsets.length];

    return {
      id: `leaf-den-furniture-${index}`,
      kind: index === 0 ? "logChair" : index === 1 ? "strawBed" : "campfire",
      position: [
        anchor[0] + offset[0],
        0.025,
        anchor[2] + offset[2]
      ],
      size: index === 1 ? [1.24, 0.86] : [1.05, 0.92],
      uvRect: [0, 0, 1, 1]
    };
  }

  function buildDittoFlagPlacement() {
    const anchor = gameSession?.leafDen?.position || [0, 0.02, 0];

    return {
      id: "ditto-flag-0",
      position: [
        anchor[0] + 0.9,
        0.04,
        anchor[2] - 0.42
      ],
      size: [0.68, 1.18],
      uvRect: [0, 0, 1, 1]
    };
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
    onDiscover({ habitat, discoveredHabitats, context }) {
      uiRuntime?.setNearbyHabitats(discoveredHabitats.map((entry) => entry.label));
      const discoveryEvent = context?.event;
      const isRestoredTallGrassHabitat =
        discoveryEvent?.type === HABITAT_EVENT.RESTORE_HABITAT &&
        discoveryEvent?.targetId === "tall-grass";
      const hasSpecificRestoreNotice =
        discoveryEvent?.type === HABITAT_EVENT.RESTORE_HABITAT &&
        (discoveryEvent.targetId === "tall-grass" ||
          discoveryEvent.targetId === "pretty-flower-bed" ||
          discoveryEvent.targetId === "boulder-shaded-tall-grass");

      if (discoveryEvent?.type === HABITAT_EVENT.RESTORE_HABITAT) {
        storyState.flags.makingHabitatsComplete = true;
        syncQuestPanels();
      }

      if (!hasSpecificRestoreNotice) {
        uiRuntime?.pushNotice(`Habitat discovered: ${habitat.label}.`);
      }

      if (habitat.pokedexEntryId && !isRestoredTallGrassHabitat) {
        storyBeats?.openPokedexEntry(habitat.pokedexEntryId);
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
    followerCallRequested = false;
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

  function getUnlockedFieldMoveIds() {
    return ACTIVE_FIELD_MOVE_ORDER.filter((skillId) => playerSkills[skillId]);
  }

  function syncSkillsUi() {
    uiRuntime?.syncSkillsUi(playerSkills, activeFieldMoveId);
  }

  function setActiveFieldMove(skillId, { notify = false } = {}) {
    if (!ACTIVE_FIELD_MOVE_ORDER.includes(skillId) || !playerSkills[skillId]) {
      return false;
    }

    if (activeFieldMoveId === skillId) {
      return true;
    }

    activeFieldMoveId = skillId;
    syncSkillsUi();

    if (notify) {
      uiRuntime?.pushNotice(`${PLAYER_SKILL_DEFS[skillId].label} selected.`);
    }

    return true;
  }

  function ensureActiveFieldMove() {
    if (activeFieldMoveId && playerSkills[activeFieldMoveId]) {
      return;
    }

    activeFieldMoveId = getUnlockedFieldMoveIds()[0] || null;
    syncSkillsUi();
  }

  function cycleActiveFieldMove(direction = 1) {
    const unlockedFieldMoveIds = getUnlockedFieldMoveIds();

    if (unlockedFieldMoveIds.length === 0) {
      return;
    }

    if (unlockedFieldMoveIds.length === 1) {
      setActiveFieldMove(unlockedFieldMoveIds[0], { notify: true });
      return;
    }

    const currentIndex = Math.max(0, unlockedFieldMoveIds.indexOf(activeFieldMoveId));
    const step = direction < 0 ? -1 : 1;
    const nextIndex =
      (currentIndex + step + unlockedFieldMoveIds.length) % unlockedFieldMoveIds.length;

    setActiveFieldMove(unlockedFieldMoveIds[nextIndex], { notify: true });
  }

  function unlockPlayerSkill(skillId, { silent = false } = {}) {
    if (!PLAYER_SKILL_DEFS[skillId] || playerSkills[skillId]) {
      return;
    }

    playerSkills[skillId] = true;
    if (ACTIVE_FIELD_MOVE_ORDER.includes(skillId)) {
      activeFieldMoveId = skillId;
    } else {
      ensureActiveFieldMove();
    }
    syncSkillsUi();
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
  storyBeats = createStoryBeatSystem({
    dialogueSystem,
    gameplayDialogue: uiRuntime.gameplayDialogue,
    storyState,
    questSystem,
    pokedexRuntime: uiRuntime.pokedexRuntime,
    trackFieldTask,
    unlockPlayerSkill,
    pushNotice: uiRuntime.pushNotice
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
          return storyBeats.playDialogue(STORY_BEAT_IDS.CHOPPER_ONBOARDING, {
            onLineChange(line) {
              handleChopperOnboardingLineChange(line);
            },
            onComplete: () => {
              setBillCameoVisible(false);
              restoreCameraOnComplete();
            }
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
        return storyBeats.playDialogue(STORY_BEAT_IDS.CHOPPER_TALL_GRASS_RETURN, {
          onComplete: () => {
            dialogueCamera.restoreGameplayCamera();
          }
        });
      }

      if (targetId === "tangrowth" && dialogueId === "firstHabitatReport") {
        return storyBeats.playDialogue(STORY_BEAT_IDS.CHOPPER_FIRST_HABITAT_REPORT, {
          onComplete: () => {
            dialogueCamera.restoreGameplayCamera();
          }
        });
      }

      if (targetId === "tangrowth" && dialogueId === "logChairGift") {
        return storyBeats.playDialogue(STORY_BEAT_IDS.CHOPPER_LOG_CHAIR_GIFT, {
          onBeforeCompleteEffects: () => {
            addItems(inventory, { [LOG_CHAIR_ITEM_ID]: 1 });
            uiRuntime.syncInventoryUi(inventory);
            uiRuntime.bagUiRuntime.handleItemCollected(LOG_CHAIR_ITEM_ID, storyState);
            syncQuestPanels();
          },
          onComplete: () => {
            dialogueCamera.restoreGameplayCamera();
            syncQuestPanels();
          }
        });
      }

      if (targetId === "squirtle" && dialogueId === "discovery") {
        const playDiscoveryDialogue = () => storyBeats.playDialogue(STORY_BEAT_IDS.SQUIRTLE_DISCOVERY, {
          onComplete: restoreCameraOnComplete
        });

        if (startSquirtleReassemblyBeforeDialogue(playDiscoveryDialogue)) {
          return true;
        }

        return playDiscoveryDialogue();
      }

      return false;
    },
    unlockPlayerAbility: unlockPlayerSkill,
    unlockPokedexReward() {
      if (gameSession?.actTwoSquirtle) {
        gameSession.actTwoSquirtle.recovered = true;
        gameSession.actTwoSquirtle.visible = true;
        gameSession.actTwoSquirtle.assemblyState = "assembled";
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
      storyBeats.playDialogue(STORY_BEAT_IDS.CHOPPER_FLOWER_RECOVERY);
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

      const openChopperEncouragement = () => {
        const playerPosition = gameSession?.playerCharacter?.getPosition?.();
        const chopperPosition = getChopperNpcPosition();

        if (playerPosition && chopperPosition) {
          gameSession?.chopperNpcActor?.npcActor?.character?.faceToward?.(playerPosition);
          if (gameSession?.chopperNpcActor?.npcActor) {
            gameSession.chopperNpcActor.npcActor.faceYaw = getYawToward(chopperPosition, playerPosition);
          }
          dialogueCamera?.focusNpcConversation({
            targetId: "tangrowth",
            playerPosition,
            npcActors: gameSession?.npcActors || [],
            interactables: gameSession?.interactables || []
          });
        }

        storyBeats.playDialogue(STORY_BEAT_IDS.CHOPPER_BULBASAUR_ENCOURAGEMENT, {
          onBeforeCompleteEffects: () => {
            dialogueCamera?.restoreGameplayCamera();
          }
        });
      };

      storyBeats.playDialogue(STORY_BEAT_IDS.BULBASAUR_HABITAT_DISCOVERY, {
        onComplete: openChopperEncouragement
      });
    },
    onBulbasaurDryGrassMissionAccepted() {
      storyBeats.playDialogue(STORY_BEAT_IDS.BULBASAUR_DRY_GRASS_REQUEST);
    },
    onBulbasaurDryGrassRequestCompleted() {
      storyBeats.playDialogue(STORY_BEAT_IDS.BULBASAUR_LEAFAGE_REWARD);
    },
    onBulbasaurStrawBedRecipeRequested() {
      storyBeats.playDialogue(STORY_BEAT_IDS.BULBASAUR_STRAW_BED_RECIPE, {
        onBeforeCompleteEffects: () => {
          if (!hasItems(inventory, { [STRAW_BED_RECIPE_ITEM_ID]: 1 })) {
            addItems(inventory, { [STRAW_BED_RECIPE_ITEM_ID]: 1 });
          }
          uiRuntime.syncInventoryUi(inventory);
          uiRuntime.bagUiRuntime.handleItemCollected(STRAW_BED_RECIPE_ITEM_ID, storyState);
          syncQuestPanels();
        },
        onComplete: syncQuestPanels
      });
    },
    onCharmanderRevealed({ cellId }) {
      const rustlingGrassPatch = gameSession?.groundGrassPatches?.find((groundGrassPatch) => {
        return groundGrassPatch.cellId === cellId;
      });
      const encounter = gameSession?.charmanderEncounter;

      if (rustlingGrassPatch && encounter) {
        encounter.visible = true;
        encounter.position = [
          rustlingGrassPatch.position[0] + 0.72,
          rustlingGrassPatch.position[1] + 0.02,
          rustlingGrassPatch.position[2] - 0.18
        ];
        encounter.targetPosition = [...encounter.position];
      }

      storyBeats.playDialogue(STORY_BEAT_IDS.CHARMANDER_DISCOVERY, {
        onComplete: syncQuestPanels
      });
    },
    onTimburrRevealed({ cellId }) {
      const rustlingGrassPatch = gameSession?.groundGrassPatches?.find((groundGrassPatch) => {
        return groundGrassPatch.cellId === cellId;
      });
      const encounter = gameSession?.timburrEncounter;

      if (rustlingGrassPatch && encounter) {
        encounter.visible = true;
        encounter.position = [
          rustlingGrassPatch.position[0] + 0.58,
          rustlingGrassPatch.position[1] + 0.02,
          rustlingGrassPatch.position[2] - 0.28
        ];
      }

      storyBeats.playDialogue(STORY_BEAT_IDS.TIMBURR_DISCOVERY, {
        onComplete: syncQuestPanels
      });
    },
    onLeppaBerryGiftRequested({ targetId = "bulbasaur" } = {}) {
      if (!hasItems(inventory, { [LEPPA_BERRY_ITEM_ID]: 1 })) {
        uiRuntime.pushNotice("You need a Leppa Berry to show them.");
        return;
      }

      storyBeats.playDialogue(STORY_BEAT_IDS.LEPPA_BERRY_DELIVERY, {
        context: {
          targetId
        },
        onBeforeCompleteEffects: () => {
          consumeItems(inventory, { [LEPPA_BERRY_ITEM_ID]: 1 });
          uiRuntime.syncInventoryUi(inventory);
          syncQuestPanels();
        },
        onComplete: syncQuestPanels
      });
    },
    onChopperLogChairGiftRequested() {
      addItems(inventory, { [LOG_CHAIR_ITEM_ID]: 1 });
      storyState.flags.logChairReceived = true;
      uiRuntime.syncInventoryUi(inventory);
      uiRuntime.bagUiRuntime.handleItemCollected(LOG_CHAIR_ITEM_ID, storyState);
      uiRuntime.pushNotice("You got a Log Chair.");
      syncQuestPanels();
    },
    onTangrowthHouseTalkRequested() {
      storyBeats.playDialogue(STORY_BEAT_IDS.TANGROWTH_HOUSE_BUILDING_TALK, {
        onComplete: () => {
          dialogueCamera.restoreGameplayCamera();
          syncQuestPanels();
        }
      });
    },
    onLeafDenKitPlacementRequested({ playerPosition }) {
      if (!hasItems(inventory, { [LEAF_DEN_KIT_ITEM_ID]: 1 })) {
        uiRuntime.pushNotice("You need a Leaf Den Kit before you can place it.");
        return;
      }

      gameSession.leafDen = buildLeafDenKitPlacement(playerPosition);
      consumeItems(inventory, { [LEAF_DEN_KIT_ITEM_ID]: 1 });
      storyState.flags.leafDenKitPlaced = true;
      storyState.flags.leafDenKitSelected = false;
      uiRuntime.syncInventoryUi(inventory);
      uiRuntime.pushNotice("You placed the Leaf Den Kit.");
      syncQuestPanels();
    },
    onLeafDenConstructionRequested() {
      if (!storyState.flags.leafDenKitPlaced || !gameSession?.leafDen) {
        uiRuntime.pushNotice("Place the Leaf Den Kit first.");
        return;
      }

      if (storyState.flags.leafDenConstructionStarted) {
        if (completeLeafDenConstructionIfReady()) {
          return;
        }

        uiRuntime.pushNotice("Leaf Den construction is still underway.");
        syncQuestPanels();
        return;
      }

      if (!hasItems(inventory, LEAF_DEN_BUILD_REQUIREMENTS)) {
        uiRuntime.pushNotice(`Missing: ${formatRequirementSummary(LEAF_DEN_BUILD_REQUIREMENTS, inventory)}`);
        syncQuestPanels();
        return;
      }

      const helperStatus = getLeafDenHelperStatus();
      if (!helperStatus.timburrReady || !helperStatus.otherReady) {
        uiRuntime.pushNotice("Call Timburr and Charmander with D-Pad Up or Arrow Up, then lead them to the Leaf Den Kit.");
        syncQuestPanels();
        return;
      }

      storyBeats.playDialogue(STORY_BEAT_IDS.LEAF_DEN_CONSTRUCTION_STARTED, {
        onBeforeCompleteEffects: () => {
          const now = getLeafDenConstructionNow();
          consumeItems(inventory, LEAF_DEN_BUILD_REQUIREMENTS);
          storyState.flags.leafDenConstructionStartedAt = now;
          storyState.flags.leafDenConstructionCompletesAt = now + LEAF_DEN_BUILD_DURATION_MS;
          storyState.flags.timburrFollowing = false;
          storyState.flags.charmanderFollowing = false;
          uiRuntime.syncInventoryUi(inventory);
          syncQuestPanels();
        },
        onComplete: syncQuestPanels
      });
    },
    onLeafDenEnterRequested() {
      if (!storyState.flags.leafDenBuilt) {
        uiRuntime.pushNotice("The Leaf Den is not ready yet.");
        return;
      }

      storyState.flags.leafDenInteriorEntered = true;
      uiRuntime.pushNotice("You entered the Leaf Den.");
      syncQuestPanels();
    },
    onLeafDenFurniturePlacementRequested() {
      if (!storyState.flags.leafDenInteriorEntered) {
        uiRuntime.pushNotice("Enter the Leaf Den first.");
        return;
      }

      const current = Math.min(3, Number(storyState.flags.leafDenFurniturePlacedCount || 0));
      if (current >= 3) {
        uiRuntime.pushNotice("The Leaf Den already has enough furniture. Talk to Timburr.");
        return;
      }

      gameSession.leafDenFurniture ||= [];
      gameSession.leafDenFurniture.push(buildLeafDenFurniturePlacement(current));
      storyState.flags.leafDenFurniturePlacedCount = current + 1;
      uiRuntime.pushNotice(
        storyState.flags.leafDenFurniturePlacedCount >= 3 ?
          "All furniture is placed. Talk to Timburr." :
          `Furniture placed inside the Leaf Den. ${storyState.flags.leafDenFurniturePlacedCount}/3.`
      );
      syncQuestPanels();
    },
    onTimburrLeafDenFurnitureCompleteRequested() {
      if (Number(storyState.flags.leafDenFurniturePlacedCount || 0) < 3) {
        uiRuntime.pushNotice("Place 3 furniture pieces inside the Leaf Den first.");
        return;
      }

      storyBeats.playDialogue(STORY_BEAT_IDS.TIMBURR_LEAF_DEN_FURNITURE_COMPLETE, {
        onComplete: syncQuestPanels
      });
    },
    onCharmanderCelebrationSuggested() {
      storyBeats.playDialogue(STORY_BEAT_IDS.CHARMANDER_CELEBRATION_SUGGESTION, {
        onComplete: syncQuestPanels
      });
    },
    onCharmanderCelebrationTangrowthRequested() {
      if (!storyState.flags.charmanderCelebrationSuggested) {
        uiRuntime.pushNotice("Talk to Charmander about the celebration first.");
        dialogueCamera.restoreGameplayCamera();
        return;
      }

      if (!isCharmanderNearTangrowthForCelebration()) {
        uiRuntime.pushNotice("Bring Charmander closer to Professor Tangrowth first.");
        dialogueCamera.restoreGameplayCamera();
        syncQuestPanels();
        return;
      }

      storyBeats.playDialogue(STORY_BEAT_IDS.CHARMANDER_CELEBRATION_CUTSCENE, {
        onBeforeCompleteEffects: () => {
          if (!storyState.flags.dittoFlagReceived && !hasItems(inventory, { [DITTO_FLAG_ITEM_ID]: 1 })) {
            addItems(inventory, { [DITTO_FLAG_ITEM_ID]: 1 });
          }
          storyState.flags.charmanderFollowing = false;
          uiRuntime.syncInventoryUi(inventory);
          uiRuntime.bagUiRuntime.handleItemCollected(DITTO_FLAG_ITEM_ID, storyState);
          syncQuestPanels();
        },
        onComplete: () => {
          dialogueCamera.restoreGameplayCamera();
          syncQuestPanels();
        }
      });
    },
    onDittoFlagPlacementRequested() {
      if (!storyState.flags.dittoFlagSelectedForHouse) {
        uiRuntime.pushNotice("Open the bag with X and select the Ditto Flag first.");
        return;
      }

      if (!storyState.flags.leafDenBuilt || !gameSession?.leafDen) {
        uiRuntime.pushNotice("The Leaf Den needs to be complete before you can mark it.");
        return;
      }

      if (!hasItems(inventory, { [DITTO_FLAG_ITEM_ID]: 1 })) {
        uiRuntime.pushNotice("You need a Ditto Flag in your bag.");
        return;
      }

      gameSession.dittoFlag = buildDittoFlagPlacement();
      consumeItems(inventory, { [DITTO_FLAG_ITEM_ID]: 1 });
      storyState.flags.dittoFlagSelectedForHouse = false;
      uiRuntime.syncInventoryUi(inventory);
      storyBeats.complete(STORY_BEAT_IDS.DITTO_FLAG_PLACED_ON_HOUSE);
      syncQuestPanels();
    },
    onLogChairPlacementRequested({ playerPosition }) {
      if (!hasItems(inventory, { [LOG_CHAIR_ITEM_ID]: 1 })) {
        uiRuntime.pushNotice("You need a Log Chair before you can place it.");
        return;
      }

      gameSession.logChair = buildLogChairPlacement(playerPosition);
      consumeItems(inventory, { [LOG_CHAIR_ITEM_ID]: 1 });
      storyState.flags.logChairPlaced = true;
      uiRuntime.syncInventoryUi(inventory);
      uiRuntime.pushNotice("You placed the Log Chair.");
      syncQuestPanels();
    },
    onLogChairSitRequested() {
      storyBeats.playDialogue(STORY_BEAT_IDS.LOG_CHAIR_REST, {
        onComplete: syncQuestPanels
      });
    },
    onWorkbenchRecipesRequested() {
      storyBeats.playDialogue(STORY_BEAT_IDS.WORKBENCH_DIY_RECIPES, {
        onBeforeCompleteEffects: () => {
          if (!hasItems(inventory, { [SIMPLE_WOODEN_DIY_RECIPES_ITEM_ID]: 1 })) {
            addItems(inventory, { [SIMPLE_WOODEN_DIY_RECIPES_ITEM_ID]: 1 });
          }
          uiRuntime.syncInventoryUi(inventory);
          uiRuntime.bagUiRuntime.handleItemCollected(SIMPLE_WOODEN_DIY_RECIPES_ITEM_ID, storyState);
          syncQuestPanels();
        },
        onComplete: syncQuestPanels
      });
    },
    onCampfireCrafted() {
      uiRuntime.bagUiRuntime.handleItemCollected(CAMPFIRE_ITEM_ID, storyState);
      storyBeats.complete(STORY_BEAT_IDS.CAMPFIRE_CREATED);
      syncQuestPanels();
    },
    onStrawBedCrafted() {
      uiRuntime.bagUiRuntime.handleItemCollected(STRAW_BED_ITEM_ID, storyState);
      storyBeats.complete(STORY_BEAT_IDS.STRAW_BED_CREATED);
      syncQuestPanels();
    },
    onStrawBedPlacementRequested({ placementTarget }) {
      if (!hasItems(inventory, { [STRAW_BED_ITEM_ID]: 1 })) {
        uiRuntime.pushNotice("You need a Straw Bed in your bag.");
        return;
      }

      if (!placementTarget?.center) {
        uiRuntime.pushNotice("Move closer to Bulbasaur's restored tall grass habitat.");
        return;
      }

      gameSession.strawBed = buildStrawBedPlacement(placementTarget.center);
      consumeItems(inventory, { [STRAW_BED_ITEM_ID]: 1 });
      storyState.flags.strawBedPlacedInBulbasaurHabitat = true;
      uiRuntime.syncInventoryUi(inventory);
      uiRuntime.pushNotice("You placed the Straw Bed in Bulbasaur's habitat.");
      syncQuestPanels();
    },
    onBulbasaurStrawBedRequestCompleted() {
      storyBeats.playDialogue(STORY_BEAT_IDS.BULBASAUR_STRAW_BED_REQUEST_COMPLETE, {
        onComplete: syncQuestPanels
      });
    },
    onCampfireSpitOutRequested() {
      if (!storyState.flags.campfireSelectedForTangrowth) {
        uiRuntime.pushNotice("Open the bag with X and select the Campfire first.");
        return;
      }

      if (!hasItems(inventory, { [CAMPFIRE_ITEM_ID]: 1 })) {
        uiRuntime.pushNotice("You need a Campfire in your bag.");
        return;
      }

      storyBeats.playDialogue(STORY_BEAT_IDS.CAMPFIRE_SPIT_OUT, {
        onBeforeCompleteEffects: () => {
          const playerPosition = gameSession?.playerCharacter?.getPosition?.() || getChopperNpcPosition();
          gameSession.campfire = buildCampfirePlacement(playerPosition);
          consumeItems(inventory, { [CAMPFIRE_ITEM_ID]: 1 });
          uiRuntime.syncInventoryUi(inventory);
          syncQuestPanels();
        },
        onComplete: syncQuestPanels
      });
    },
    onRuinedPokemonCenterInspectRequested() {
      storyBeats.playDialogue(STORY_BEAT_IDS.RUINED_POKEMON_CENTER_INSPECTED, {
        onComplete: () => {
          dialogueCamera.restoreGameplayCamera();
          syncQuestPanels();
        }
      });
    },
    onPokemonCenterPcCheckRequested() {
      if (
        storyState.flags.challengesUnlocked &&
        storyState.flags.boulderChallengeRewardReady &&
        !storyState.flags.boulderChallengeRewardClaimed
      ) {
        storyBeats.playDialogue(STORY_BEAT_IDS.BOULDER_CHALLENGE_REWARD, {
          onBeforeCompleteEffects: () => {
            addItems(inventory, { [LIFE_COINS_ITEM_ID]: 10 });
            uiRuntime.syncInventoryUi(inventory);
            uiRuntime.bagUiRuntime.handleItemCollected(LIFE_COINS_ITEM_ID, storyState);
            syncQuestPanels();
          },
          onComplete: () => {
            dialogueCamera.restoreGameplayCamera();
            syncQuestPanels();
          }
        });
        return;
      }

      if (
        storyState.flags.newPcChallengesAvailable &&
        !storyState.flags.newPcChallengesChecked
      ) {
        storyBeats.playDialogue(STORY_BEAT_IDS.NEW_PC_CHALLENGES, {
          onComplete: () => {
            dialogueCamera.restoreGameplayCamera();
            syncQuestPanels();
          }
        });
        return;
      }

      if (
        storyState.flags.leafDenKitPurchaseAvailable &&
        !storyState.flags.leafDenKitPurchased
      ) {
        if (!hasItems(inventory, { [LIFE_COINS_ITEM_ID]: LEAF_DEN_KIT_LIFE_COIN_COST })) {
          uiRuntime.pushNotice(`You need ${LEAF_DEN_KIT_LIFE_COIN_COST} ${getItemLabel(LIFE_COINS_ITEM_ID)} to purchase the Leaf Den Kit.`);
          dialogueCamera.restoreGameplayCamera();
          syncQuestPanels();
          return;
        }

        storyBeats.playDialogue(STORY_BEAT_IDS.LEAF_DEN_KIT_PURCHASED, {
          onBeforeCompleteEffects: () => {
            consumeItems(inventory, { [LIFE_COINS_ITEM_ID]: LEAF_DEN_KIT_LIFE_COIN_COST });
            addItems(inventory, { [LEAF_DEN_KIT_ITEM_ID]: 1 });
            uiRuntime.syncInventoryUi(inventory);
            uiRuntime.bagUiRuntime.handleItemCollected(LEAF_DEN_KIT_ITEM_ID, storyState);
            syncQuestPanels();
          },
          onComplete: () => {
            dialogueCamera.restoreGameplayCamera();
            syncQuestPanels();
          }
        });
        return;
      }

      if (storyState.flags.challengesUnlocked) {
        uiRuntime.pushNotice("No completed Challenges to claim right now.");
        dialogueCamera.restoreGameplayCamera();
        return;
      }

      storyBeats.playDialogue(STORY_BEAT_IDS.CHALLENGES_UNLOCKED, {
        onComplete: () => {
          dialogueCamera.restoreGameplayCamera();
          syncQuestPanels();
        }
      });
    },
    onGroundItemCollected({ itemId }) {
      uiRuntime.bagUiRuntime.handleItemCollected(itemId, storyState);
    },
    questSystem,
    habitatSystem,
    onTallGrassHabitatRestored({
      groundCell = null,
      restoredGrassHabitat = null,
      newlyDiscoveredHabitats = []
    } = {}) {
      playTallGrassMemorySequence({
        groundCell,
        restoredGrassHabitat,
        newlyDiscoveredHabitats
      });
    },
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
    waterNearbyPalm,
    syncInventoryUi: uiRuntime.syncInventoryUi,
    pushNotice: uiRuntime.pushNotice
  });
  const dialogueCamera = createDialogueCameraController({
    camera: engine.camera,
    cameraOrbit: engine.cameraOrbit
  });
  uiRuntime.gameplayDialogue.setBeforeComplete?.(() => {
    dialogueCamera.restoreGameplayCamera();
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
    requestHarvest: ({ source = null } = {}) => {
      harvestRequested = true;
      harvestRequestSource = source;
    },
    requestInteract: () => {
      interactRequested = true;
    },
    requestPauseToggle: toggleGamePaused,
    requestPokedexOpen: () => {
      uiRuntime.pokedexRuntime.setOpen(true);
    },
    requestFollowerCall: () => {
      followerCallRequested = true;
    },
    requestMoveCycle: cycleActiveFieldMove,
    shouldBagButtonInteract: shouldBagButtonInteractWithNearbyCharacter,
    shouldGamepadButtonHarvest: shouldGamepadButtonHarvestNearbyFieldAction,
    inspectBag,
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
        shouldBagButtonInteract: shouldBagButtonInteractWithNearbyCharacter,
        getActiveMoveId: () => activeFieldMoveId,
        inventory,
        playerSkills,
        storyState,
        isBuilderPanelOpen: () => builderPanelOpen,
        clearPendingActions() {
          harvestRequested = false;
          harvestRequestSource = null;
          interactRequested = false;
          followerCallRequested = false;
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
          const source = harvestRequestSource;
          harvestRequestSource = null;
          return { source };
        },
        consumeInteractRequest() {
          if (!interactRequested) {
            return false;
          }

          interactRequested = false;
          return true;
        },
        consumeFollowerCallRequest() {
          if (!followerCallRequested) {
            return false;
          }

          followerCallRequested = false;
          return true;
        },
        onCharmanderCampfireLit() {
          storyBeats.playDialogue(STORY_BEAT_IDS.CHARMANDER_CAMPFIRE_LIT, {
            onComplete: () => {
              startRuinedPokemonCenterGuide();
              syncQuestPanels();
            }
          });
        },
        consumeCameraZoomCycleRequest: gameInput.consumeCameraZoomCycleRequest
      },
      cameraOrbit: engine.cameraOrbitConfig,
      cameraZoomPresets: ACT_TWO_PLAYER_CAMERA_ZOOM_PRESETS,
      gameplay: {
        buildNearbyPrompt,
        collectLeppaBerryDrops(playerPosition, leppaBerryDrops, inventoryState) {
          const collectedLeppaBerryCount = collectLeppaBerryDropItems(
            playerPosition,
            leppaBerryDrops,
            inventoryState,
            storyState
          );

          if (collectedLeppaBerryCount > 0) {
            uiRuntime.bagUiRuntime.handleItemCollected(LEPPA_BERRY_ITEM_ID, storyState);
            questSystem.emit({
              type: QUEST_EVENT.COLLECT,
              targetId: LEPPA_BERRY_ITEM_ID,
              amount: collectedLeppaBerryCount
            });
            syncQuestPanels();
          }

          return collectedLeppaBerryCount;
        },
        collectWoodDrops(playerPosition, woodDrops, inventoryState) {
          const collectedWoodCount = collectWoodDrops(playerPosition, woodDrops, inventoryState);

          if (collectedWoodCount > 0) {
            uiRuntime.bagUiRuntime.handleItemCollected("wood", storyState);
            questSystem.emit({
              type: QUEST_EVENT.COLLECT,
              targetId: "wood",
              amount: collectedWoodCount
            });
            recordBulbasaurSturdyStickChallengeProgress(collectedWoodCount);
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
        syncLeppaTreeState,
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
      gameplayUiVisibility: uiRuntime.gameplayUiVisibility,
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
          session.actTwoSquirtle.visible = false;
          session.actTwoSquirtle.assemblyState = "hidden";
          if (session.actTwoSquirtle.reassembly) {
            session.actTwoSquirtle.reassembly.active = false;
            session.actTwoSquirtle.reassembly.elapsed = 0;
            session.actTwoSquirtle.reassembly.progress = 0;
            session.actTwoSquirtle.reassembly.onComplete = null;
          }
        }
      }
      if (sceneFlowRuntime.sceneDirector.is(GAME_FLOW.GAMEPLAY)) {
        const shouldDelayGameplayHud = !session.playerCharacter;
        if (!session.playerCharacter) {
          session.gameplayOpeningRequested = true;
        }
        if (dom.uiLayer instanceof HTMLElement) {
          dom.uiLayer.dataset.mode = "game";
        }
        uiRuntime.gameplayDialogue.close?.();
        uiRuntime.gameplayUiVisibility.hideAll?.();
        uiRuntime.gameplayUiVisibility.showSections?.(
          shouldDelayGameplayHud ?
            GAMEPLAY_DEFAULT_UI_SECTIONS.filter((sectionId) => sectionId !== "hud") :
            GAMEPLAY_DEFAULT_UI_SECTIONS
        );
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
