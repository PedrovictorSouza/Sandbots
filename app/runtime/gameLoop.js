import { createFrameSnapshotController } from "./frameSnapshotController.js";
import { createCameraZoomPresetController } from "./cameraZoomPresetController.js";
import {
  getPlayerDustBillboards,
  updatePlayerDustParticles
} from "../session/playerDustParticles.js";
import {
  getNatureRevivalBillboards,
  getNatureRevivalScale,
  updateNatureRevivalEffects
} from "../session/natureRevivalEffects.js";
import { getColliderGizmoBillboards } from "../session/colliderGizmos.js";
import { updateIntroRoomFrame } from "../scenes/introRoom/introRoomSequence.js";
import { updateChopperNpcActor } from "../session/chopperNpcActor.js";
import { createGameplayCameraDirector } from "./gameplayCameraDirector.js";

const BULBASAUR_DRY_GRASS_MISSION_RESTORE_COUNT = 10;
const BULBASAUR_WORKBENCH_GUIDE_START = [8.55, 0.02, -5.7];
const BULBASAUR_WORKBENCH_GUIDE_TARGET = [10.72, 0.02, 3.38];
const BULBASAUR_WORKBENCH_GUIDE_SPEED = 2.4;
const CHARMANDER_FOLLOW_SPEED = 2.65;
const CHARMANDER_FOLLOW_DISTANCE = 1.28;
const CHARMANDER_CAMPFIRE_LIGHT_DISTANCE = 1.9;
const TIMBURR_FOLLOW_SPEED = 2.45;
const TIMBURR_FOLLOW_DISTANCE = 1.62;
const TALL_GRASS_MIN_FOOTPRINT = 1.28;
const SQUIRTLE_WATER_GUN_SPEED = 4.8;
const SQUIRTLE_WATER_GUN_STAND_DISTANCE = 1.18;
const SQUIRTLE_WATER_GUN_ARRIVE_DISTANCE = 0.08;
const SQUIRTLE_WATER_GUN_SPRAY_DURATION = 0.82;
const SQUIRTLE_WATER_GUN_IMPACT_TIME = 0.34;
const SQUIRTLE_WATER_GUN_ARC_HEIGHT = 0.86;
const SQUIRTLE_WATER_GUN_PARTICLE_COUNT = 9;
const CAMERA_DEBUG_ENABLED = (() => {
  try {
    return new URLSearchParams(globalThis.location?.search || "").get("cameraDebug") === "1";
  } catch {
    return false;
  }
})();

function getTallGrassInstanceScale(tallGrassModel, groundGrassPatch, revivalScale) {
  const modelFootprint = Math.max(
    tallGrassModel?.size?.[0] || 0,
    tallGrassModel?.size?.[2] || 0
  );

  if (!(modelFootprint > 0)) {
    return revivalScale;
  }

  const targetFootprint = Math.max(
    groundGrassPatch?.size?.[0] || 0,
    TALL_GRASS_MIN_FOOTPRINT
  );
  return (targetFootprint / modelFootprint) * revivalScale;
}

function getTallGrassYaw(groundGrassPatch) {
  const seed = `${groundGrassPatch?.cellId || ""}:${groundGrassPatch?.id || ""}`;
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  const quarterTurn = (hash % 4) * Math.PI * 0.5;
  const smallTurn = ((hash % 13) - 6) * 0.035;
  return quarterTurn + smallTurn;
}

function getTallGrassSway(groundGrassPatch, shouldRustle, now) {
  const position = groundGrassPatch?.position || [0, 0, 0];
  const ambient = Math.sin(now * 0.0018 + position[0] * 0.63 + position[2] * 0.41) * 0.018;
  const rustle = shouldRustle ? Math.sin(now * 0.024) * 0.09 : 0;
  return ambient + rustle;
}

export function startGameLoop({
  camera,
  mount,
  worldCanvas,
  worldRenderer,
  worldSpeech,
  colliderGizmos,
  groundCellHighlight,
  gameplayDialogue,
  dialogueCamera,
  gameFlowValues,
  isGameFlow,
  actTwoSequence,
  actTwoTutorial,
  session,
  pokedexUiState,
  controls,
  cameraOrbit,
  cameraZoomPresets = [],
  gameplay,
  hud,
  rendering
}) {
  let previousTime = performance.now();
  let movementQuestReported = false;
  let movementQuestDistance = 0;
  const frameSnapshotController = createFrameSnapshotController({
    camera,
    mount,
    worldRenderer,
    worldSpeech,
    colliderGizmos,
    groundCellHighlight,
    actTwoTutorial,
    hud
  });
  const cameraZoomPresetController = createCameraZoomPresetController({
    camera,
    presets: cameraZoomPresets
  });
  const gameplayCameraDirector = createGameplayCameraDirector({
    camera,
    cameraOrbit
  });
  let cameraDebugElement = null;
  const cameraDebugErrors = [];

  function pushCameraDebugError(message) {
    cameraDebugErrors.push({
      at: Math.round(performance.now()),
      message
    });

    if (cameraDebugErrors.length > 4) {
      cameraDebugErrors.shift();
    }
  }

  if (CAMERA_DEBUG_ENABLED && typeof globalThis.addEventListener === "function") {
    globalThis.addEventListener("error", (event) => {
      pushCameraDebugError(event?.message || "Unknown window error");
    });
    globalThis.addEventListener("unhandledrejection", (event) => {
      pushCameraDebugError(String(event?.reason?.message || event?.reason || "Unhandled rejection"));
    });
  }

  function updateCameraDebugOverlay(debugState) {
    if (!CAMERA_DEBUG_ENABLED || typeof document === "undefined") {
      return;
    }

    if (!cameraDebugElement) {
      cameraDebugElement = document.createElement("pre");
      cameraDebugElement.style.cssText = [
        "position:absolute",
        "right:12px",
        "top:12px",
        "z-index:9999",
        "margin:0",
        "padding:10px",
        "max-width:360px",
        "background:rgba(0,0,0,0.78)",
        "color:#7dff9a",
        "font:12px/1.35 monospace",
        "pointer-events:none",
        "white-space:pre-wrap"
      ].join(";");
      mount.append(cameraDebugElement);
    }

    cameraDebugElement.textContent = JSON.stringify(debugState, null, 2);
  }

  function getYawToward(fromPosition, toPosition) {
    const deltaX = toPosition[0] - fromPosition[0];
    const deltaZ = toPosition[2] - fromPosition[2];
    return Math.atan2(deltaX, deltaZ);
  }

  function getGroundCellCenterPosition(groundCell) {
    const offset = groundCell?.offset || [0, 0, 0];
    return [
      offset[0] || 0,
      (offset[1] || 0) + 0.04,
      offset[2] || 0
    ];
  }

  function syncSquirtleModelInstance() {
    if (!session.actTwoSquirtle?.modelInstance || !Array.isArray(session.actTwoSquirtle.position)) {
      return;
    }

    session.actTwoSquirtle.modelInstance.offset = [...session.actTwoSquirtle.position];
  }

  function getSquirtleWaterGunApproachPosition(targetPosition, playerPosition = null) {
    const squirtlePosition =
      session.actTwoSquirtle?.position ||
      session.actTwoSquirtle?.modelInstance?.offset ||
      playerPosition ||
      [0, 0.04, 0];
    let deltaX = squirtlePosition[0] - targetPosition[0];
    let deltaZ = squirtlePosition[2] - targetPosition[2];
    let distance = Math.hypot(deltaX, deltaZ);

    if (distance < 0.001 && playerPosition) {
      deltaX = playerPosition[0] - targetPosition[0];
      deltaZ = playerPosition[2] - targetPosition[2];
      distance = Math.hypot(deltaX, deltaZ);
    }

    if (distance < 0.001) {
      deltaX = 0;
      deltaZ = 1;
      distance = 1;
    }

    return [
      targetPosition[0] + (deltaX / distance) * SQUIRTLE_WATER_GUN_STAND_DISTANCE,
      0.04,
      targetPosition[2] + (deltaZ / distance) * SQUIRTLE_WATER_GUN_STAND_DISTANCE
    ];
  }

  function getSquirtleWaterGunQueue() {
    if (!Array.isArray(session.squirtleWaterGunQueue)) {
      session.squirtleWaterGunQueue = [];
    }

    return session.squirtleWaterGunQueue;
  }

  function isSquirtleWaterGunCellPending(groundCell) {
    if (!groundCell?.id) {
      return false;
    }

    if (session.squirtleWaterGunAction?.groundCell?.id === groundCell.id) {
      return true;
    }

    return getSquirtleWaterGunQueue().some((queuedAction) => {
      return queuedAction?.groundCell?.id === groundCell.id;
    });
  }

  function enqueueSquirtleWaterGunAction({ groundCell, playerPosition }) {
    if (!groundCell) {
      return "unavailable";
    }

    if (isSquirtleWaterGunCellPending(groundCell)) {
      return "duplicate";
    }

    const targetPosition = getGroundCellCenterPosition(groundCell);
    getSquirtleWaterGunQueue().push({
      groundCell,
      targetPosition,
      playerPosition: playerPosition ? [...playerPosition] : null
    });

    return "queued";
  }

  function startSquirtleWaterGunAction({ groundCell, playerPosition }) {
    if (!groundCell) {
      return "unavailable";
    }

    if (session.squirtleWaterGunAction) {
      return enqueueSquirtleWaterGunAction({
        groundCell,
        playerPosition
      });
    }

    const squirtle = session.actTwoSquirtle;
    if (!squirtle?.modelInstance || !squirtle.recovered) {
      return "unavailable";
    }

    if (!Array.isArray(squirtle.position)) {
      squirtle.position = [...(squirtle.modelInstance.offset || playerPosition || [0, 0.04, 0])];
    }

    const targetPosition = getGroundCellCenterPosition(groundCell);
    const approachPosition = getSquirtleWaterGunApproachPosition(
      targetPosition,
      playerPosition
    );

    session.squirtleWaterGunAction = {
      phase: "approach",
      groundCell,
      targetPosition,
      approachPosition,
      sprayElapsed: 0,
      impactApplied: false
    };
    squirtle.modelInstance.active = true;
    squirtle.modelInstance.yaw = getYawToward(squirtle.position, targetPosition);
    syncSquirtleModelInstance();

    return "started";
  }

  function startNextQueuedSquirtleWaterGunAction() {
    if (session.squirtleWaterGunAction) {
      return;
    }

    const queue = getSquirtleWaterGunQueue();
    while (queue.length) {
      const nextAction = queue.shift();
      if (!nextAction?.groundCell) {
        continue;
      }

      if (!session.groundDeadInstances?.includes(nextAction.groundCell)) {
        continue;
      }

      startSquirtleWaterGunAction({
        groundCell: nextAction.groundCell,
        playerPosition: nextAction.playerPosition || session.playerCharacter?.getPosition?.() || null
      });
      return;
    }
  }

  function getPendingSquirtleWaterGunGroundCells() {
    const pendingGroundCells = [];

    if (
      session.squirtleWaterGunAction?.phase === "approach" &&
      session.squirtleWaterGunAction.groundCell
    ) {
      pendingGroundCells.push(session.squirtleWaterGunAction.groundCell);
    }

    for (const queuedAction of getSquirtleWaterGunQueue()) {
      if (
        queuedAction?.groundCell &&
        session.groundDeadInstances?.includes(queuedAction.groundCell)
      ) {
        pendingGroundCells.push(queuedAction.groundCell);
      }
    }

    return pendingGroundCells;
  }

  function applySquirtleWaterGunImpact(action) {
    return gameplay.performHarvestAction({
      playerPosition: action.approachPosition,
      palmModel: session.palmModel,
      palmInstances: session.palmInstances,
      resourceNodes: session.resourceNodes,
      leppaTree: session.leppaTree,
      inventory: controls.inventory,
      canPurifyGround: true,
      groundDeadInstances: session.groundDeadInstances,
      groundFlowerPatches: session.groundFlowerPatches,
      groundGrassPatches: session.groundGrassPatches,
      groundPurifiedInstances: session.groundPurifiedInstances,
      storyState: controls.storyState,
      leafDen: session.leafDen,
      woodDrops: session.woodDrops,
      leppaBerryDrops: session.leppaBerryDrops,
      canUseLeafage: false,
      useWaterGun: true,
      forcedHarvestTarget: {
        groundCell: action.groundCell,
        distance: 0
      }
    });
  }

  function updateSquirtleWaterGunAction(deltaTime) {
    const action = session.squirtleWaterGunAction;
    const squirtle = session.actTwoSquirtle;

    if (!action || !squirtle?.modelInstance) {
      return;
    }

    if (!Array.isArray(squirtle.position)) {
      squirtle.position = [...(squirtle.modelInstance.offset || action.approachPosition)];
    }

    if (action.phase === "approach") {
      const deltaX = action.approachPosition[0] - squirtle.position[0];
      const deltaZ = action.approachPosition[2] - squirtle.position[2];
      const distance = Math.hypot(deltaX, deltaZ);
      const travel = Math.min(SQUIRTLE_WATER_GUN_SPEED * deltaTime, distance);

      if (distance > SQUIRTLE_WATER_GUN_ARRIVE_DISTANCE && travel > 0) {
        squirtle.position = [
          squirtle.position[0] + (deltaX / distance) * travel,
          0.04,
          squirtle.position[2] + (deltaZ / distance) * travel
        ];
      } else {
        squirtle.position = [...action.approachPosition];
        action.phase = "spray";
        action.sprayElapsed = 0;
      }

      squirtle.modelInstance.yaw = getYawToward(squirtle.position, action.targetPosition);
      syncSquirtleModelInstance();
      return;
    }

    if (action.phase !== "spray") {
      session.squirtleWaterGunAction = null;
      return;
    }

    action.sprayElapsed += deltaTime;
    squirtle.modelInstance.yaw = getYawToward(squirtle.position, action.targetPosition);
    syncSquirtleModelInstance();

    if (!action.impactApplied && action.sprayElapsed >= SQUIRTLE_WATER_GUN_IMPACT_TIME) {
      action.impactApplied = true;
      applySquirtleWaterGunImpact(action);
    }

    if (action.sprayElapsed >= SQUIRTLE_WATER_GUN_SPRAY_DURATION) {
      session.squirtleWaterGunAction = null;
      startNextQueuedSquirtleWaterGunAction();
    }
  }

  function getSquirtleMouthPosition() {
    const squirtle = session.actTwoSquirtle;
    const position = squirtle?.position || squirtle?.modelInstance?.offset || [0, 0, 0];
    const yaw = squirtle?.modelInstance?.yaw || 0;

    return [
      position[0] + Math.sin(yaw) * 0.34,
      (position[1] || 0) + 0.66,
      position[2] + Math.cos(yaw) * 0.34
    ];
  }

  function getSquirtleWaterGunBillboards(action, texture, uvRect) {
    if (!action || action.phase !== "spray" || !texture) {
      return [];
    }

    const progress = Math.min(
      1,
      Math.max(0, action.sprayElapsed / SQUIRTLE_WATER_GUN_SPRAY_DURATION)
    );
    const mouthPosition = getSquirtleMouthPosition();
    const targetPosition = action.targetPosition;
    const streamDirectionX = targetPosition[0] - mouthPosition[0];
    const streamDirectionZ = targetPosition[2] - mouthPosition[2];
    const streamLength = Math.hypot(streamDirectionX, streamDirectionZ) || 1;
    const sideX = -streamDirectionZ / streamLength;
    const sideZ = streamDirectionX / streamLength;
    const billboards = [];

    for (let index = 0; index < SQUIRTLE_WATER_GUN_PARTICLE_COUNT; index += 1) {
      const pathProgress = (progress * 1.55 + index * 0.105) % 1;
      const wobble = Math.sin(progress * 18 + index * 1.7) * 0.035;
      const size = 0.095 + (index % 3) * 0.018;

      billboards.push({
        texture,
        position: [
          mouthPosition[0] + (targetPosition[0] - mouthPosition[0]) * pathProgress + sideX * wobble,
          mouthPosition[1] +
            (targetPosition[1] - mouthPosition[1]) * pathProgress +
            Math.sin(pathProgress * Math.PI) * SQUIRTLE_WATER_GUN_ARC_HEIGHT,
          mouthPosition[2] + (targetPosition[2] - mouthPosition[2]) * pathProgress + sideZ * wobble
        ],
        size: [size, size],
        uvRect
      });
    }

    return billboards;
  }

  function faceInteractionTargetTowardPlayer({
    targetId,
    playerPosition,
    npcActors = [],
    interactables = []
  } = {}) {
    const npcActor = npcActors.find((actor) => actor.id === targetId);
    if (npcActor?.character?.faceToward) {
      const npcPosition = npcActor.character.getPosition();
      npcActor.character.faceToward(playerPosition);
      npcActor.faceYaw = getYawToward(npcPosition, playerPosition);
      return;
    }

    const interactable = interactables.find((entry) => entry.id === targetId);
    if (
      interactable?.id === "squirtle" &&
      session.actTwoSquirtle?.modelInstance &&
      playerPosition
    ) {
      session.actTwoSquirtle.modelInstance.yaw = getYawToward(
        session.actTwoSquirtle.position,
        playerPosition
      );
    }
  }

  function normalizeMarkerTargetId(targetId) {
    if (targetId === "chopper" || targetId === "chopper-first-habitat-report") {
      return "tangrowth";
    }

    return targetId;
  }

  function getQuestAttentionTargetIds({ systemQuest, storyQuest, storyState }) {
    const targetIds = new Set();

    for (const objective of systemQuest?.objectives || []) {
      if (objective.type === "TALK") {
        targetIds.add(normalizeMarkerTargetId(objective.targetId));
      }
    }

    if (storyQuest?.targetId) {
      targetIds.add(normalizeMarkerTargetId(storyQuest.targetId));
    }

    if (storyState?.flags?.pokemonCenterGuideStarted && !storyState.flags.ruinedPokemonCenterInspected) {
      targetIds.add("ruinedPokemonCenter");
    }

    if (storyState?.flags?.ruinedPokemonCenterInspected && !storyState.flags.challengesUnlocked) {
      targetIds.add("pokemonCenterPc");
    }

    if (storyState?.flags?.boulderChallengeRewardReady && !storyState.flags.boulderChallengeRewardClaimed) {
      targetIds.add("pokemonCenterPc");
    }

    if (storyState?.flags?.newPcChallengesAvailable && !storyState.flags.newPcChallengesChecked) {
      targetIds.add("pokemonCenterPc");
    }

    if (storyState?.flags?.tangrowthHouseTalkAvailable && !storyState.flags.tangrowthHouseTalkComplete) {
      targetIds.add("tangrowth");
    }

    if (storyState?.flags?.leafDenKitPurchaseAvailable && !storyState.flags.leafDenKitPurchased) {
      targetIds.add("pokemonCenterPc");
    }

    if (storyState?.flags?.charmanderCelebrationSuggested && !storyState.flags.charmanderCelebrationComplete) {
      targetIds.add("tangrowth");
    }

    if (storyState?.flags?.strawBedRecipeUnlocked && !storyState.flags.strawBedCrafted) {
      targetIds.add("workbench");
    }

    targetIds.delete(undefined);
    targetIds.delete(null);
    targetIds.delete("");
    return [...targetIds];
  }

  function updateBulbasaurEncounter(deltaTime) {
    const encounter = session.bulbasaurEncounter;

    if (
      controls.storyState?.flags?.bulbasaurWorkbenchGuideAvailable &&
      !controls.storyState?.flags?.workbenchDiyRecipesReceived &&
      encounter
    ) {
      const currentPosition =
        encounter.position ||
        encounter.landingPosition ||
        BULBASAUR_WORKBENCH_GUIDE_START;
      const deltaX = BULBASAUR_WORKBENCH_GUIDE_TARGET[0] - currentPosition[0];
      const deltaZ = BULBASAUR_WORKBENCH_GUIDE_TARGET[2] - currentPosition[2];
      const distance = Math.hypot(deltaX, deltaZ);
      const step = BULBASAUR_WORKBENCH_GUIDE_SPEED * deltaTime;

      encounter.visible = true;
      encounter.jumpTimer = 0;
      encounter.originPosition = null;
      encounter.landingPosition = null;
      encounter.position = distance <= step || distance <= 0.001 ?
        [...BULBASAUR_WORKBENCH_GUIDE_TARGET] :
        [
          currentPosition[0] + (deltaX / distance) * step,
          BULBASAUR_WORKBENCH_GUIDE_TARGET[1],
          currentPosition[2] + (deltaZ / distance) * step
        ];
      return;
    }

    if (!encounter?.visible || !encounter.position) {
      return;
    }

    if (encounter.jumpTimer <= 0 || !encounter.originPosition || !encounter.landingPosition) {
      encounter.jumpTimer = 0;
      encounter.position = encounter.landingPosition ? [...encounter.landingPosition] : encounter.position;
      return;
    }

    encounter.jumpTimer = Math.max(0, encounter.jumpTimer - deltaTime);
    const progress = 1 - encounter.jumpTimer / encounter.jumpDuration;
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    const arcHeight = Math.sin(progress * Math.PI) * 0.92;

    encounter.position = [
      encounter.originPosition[0] +
        (encounter.landingPosition[0] - encounter.originPosition[0]) * easedProgress,
      encounter.originPosition[1] +
        (encounter.landingPosition[1] - encounter.originPosition[1]) * progress +
        arcHeight,
      encounter.originPosition[2] +
        (encounter.landingPosition[2] - encounter.originPosition[2]) * easedProgress
    ];
  }

  function updateCharmanderEncounter(deltaTime) {
    const encounter = session.charmanderEncounter;

    if (!encounter || !controls.storyState?.flags?.charmanderRevealed) {
      return;
    }

    encounter.visible = true;

    if (!encounter.position) {
      encounter.position = session.playerCharacter?.getPosition?.() || [0, 0.02, 0];
    }

    if (
      controls.storyState.flags.charmanderFollowing &&
      session.playerCharacter &&
      (
        !controls.storyState.flags.charmanderCampfireLit ||
        (
          controls.storyState.flags.leafDenKitPlaced &&
          !controls.storyState.flags.leafDenConstructionStarted
        ) ||
        (
          controls.storyState.flags.charmanderCelebrationSuggested &&
          !controls.storyState.flags.charmanderCelebrationComplete
        )
      )
    ) {
      const playerPosition = session.playerCharacter.getPosition();
      const deltaX = playerPosition[0] - encounter.position[0];
      const deltaZ = playerPosition[2] - encounter.position[2];
      const distance = Math.hypot(deltaX, deltaZ);
      const step = CHARMANDER_FOLLOW_SPEED * deltaTime;

      if (distance > CHARMANDER_FOLLOW_DISTANCE && distance > 0.001) {
        const travel = Math.min(step, distance - CHARMANDER_FOLLOW_DISTANCE);
        encounter.position = [
          encounter.position[0] + (deltaX / distance) * travel,
          0.04,
          encounter.position[2] + (deltaZ / distance) * travel
        ];
      }
    }

    if (
      session.campfire?.position &&
      controls.storyState.flags.charmanderFollowing &&
      !controls.storyState.flags.charmanderCampfireLit
    ) {
      const campfireDistance = Math.hypot(
        encounter.position[0] - session.campfire.position[0],
        encounter.position[2] - session.campfire.position[2]
      );

      if (campfireDistance <= CHARMANDER_CAMPFIRE_LIGHT_DISTANCE) {
        encounter.litCampfire = true;
        controls.storyState.flags.charmanderCampfireLit = true;
        controls.storyState.flags.charmanderFollowing = false;
        controls.onCharmanderCampfireLit?.();
      }
    }
  }

  function updateTimburrEncounter(deltaTime) {
    const encounter = session.timburrEncounter;

    if (!encounter || !controls.storyState?.flags?.timburrRevealed) {
      return;
    }

    encounter.visible = true;

    if (!encounter.position) {
      encounter.position = session.playerCharacter?.getPosition?.() || [0, 0.02, 0];
    }

    if (
      controls.storyState.flags.timburrFollowing &&
      session.playerCharacter &&
      !controls.storyState.flags.leafDenConstructionStarted
    ) {
      const playerPosition = session.playerCharacter.getPosition();
      const deltaX = playerPosition[0] - encounter.position[0];
      const deltaZ = playerPosition[2] - encounter.position[2];
      const distance = Math.hypot(deltaX, deltaZ);
      const step = TIMBURR_FOLLOW_SPEED * deltaTime;

      if (distance > TIMBURR_FOLLOW_DISTANCE && distance > 0.001) {
        const travel = Math.min(step, distance - TIMBURR_FOLLOW_DISTANCE);
        encounter.position = [
          encounter.position[0] + (deltaX / distance) * travel,
          0.04,
          encounter.position[2] + (deltaZ / distance) * travel
        ];
      }
    }
  }

  function updateRustlingGrassEvent(deltaTime, canAdvance) {
    const flags = controls.storyState?.flags;

    if (
      !canAdvance ||
      !flags?.pendingRustlingGrassCellId ||
      flags.rustlingGrassCellId ||
      flags.bulbasaurRevealed
    ) {
      return;
    }

    const nextDelay = Math.max(0, Number(flags.rustlingGrassDelay || 0) - deltaTime);
    flags.rustlingGrassDelay = nextDelay;

    if (nextDelay > 0) {
      return;
    }

    flags.rustlingGrassCellId = flags.pendingRustlingGrassCellId;
    delete flags.pendingRustlingGrassCellId;
    delete flags.rustlingGrassDelay;
  }

  function getRustlingGrassParticleBillboards(groundGrassPatch, texture, now, uvRect) {
    if (!texture) {
      return [];
    }

    const time = now * 0.001;

    return [0, 1, 2, 3, 4].map((index) => {
      const cycle = (time * 0.58 + index * 0.19) % 1;
      const angle = time * 1.7 + index * 1.38;
      const radius = 0.18 + (index % 3) * 0.08;
      const size = (0.13 + (index % 2) * 0.025) * (1 - cycle * 0.28);

      return {
        texture,
        position: [
          groundGrassPatch.position[0] + Math.cos(angle) * radius,
          groundGrassPatch.position[1] + 0.38 + cycle * 0.58,
          groundGrassPatch.position[2] + Math.sin(angle) * radius
        ],
        size: [size, size],
        uvRect
      };
    });
  }

  function frame(now) {
    const nextFrame = frameSnapshotController.beginFrame();
    const deltaTime = Math.min(0.033, (now - previousTime) / 1000);
    previousTime = now;
    let cinematicActive = isGameFlow(gameFlowValues.CINEMATIC);
    const introActive = isGameFlow(gameFlowValues.INTRO);
    let tutorialActive = isGameFlow(gameFlowValues.TUTORIAL);
    const tutorialMovementLocked = tutorialActive ? actTwoTutorial.isMovementLocked() : false;
    const pokedexModalOpen = pokedexUiState.open;
    const dialogueActive = gameplayDialogue.isActive();
    const skillLearnActive = Boolean(controls.isSkillLearnActive?.());
    const scriptedInteractionActive = Boolean(controls.isScriptedInteractionActive?.());
    const tutorialCameraFocus = tutorialActive ? actTwoTutorial.getCameraFocusTarget() : null;

    if (session.actTwoRepairPlant && actTwoTutorial.isRepairPlantFixed()) {
      session.actTwoRepairPlant.fixed = true;
    }

    controls.updateGamepads?.(deltaTime);

    if (controls.isPaused?.()) {
      controls.clearPendingActions();
      controls.clearMovementInput();
      requestAnimationFrame(frame);
      return;
    }

    camera.resizeCanvases();
    camera.update(deltaTime);
    const gameplayOpeningCameraActive =
      gameplayCameraDirector.beginFrame({
        now,
        gameplayActive: isGameFlow(gameFlowValues.GAMEPLAY),
        hasPlayer: Boolean(session.playerCharacter)
      });
    const movementBlocked = Boolean(
      tutorialMovementLocked ||
      pokedexModalOpen ||
      dialogueActive ||
      skillLearnActive ||
      scriptedInteractionActive
    );
    const cameraTransitionActive = camera.isTargetTransitionActive();

    if (CAMERA_DEBUG_ENABLED) {
      updateCameraDebugOverlay({
        frame: Math.round(now),
        flow: {
          gameplay: isGameFlow(gameFlowValues.GAMEPLAY),
          cinematic: cinematicActive,
          intro: introActive,
          tutorial: tutorialActive
        },
        blockers: {
          movementBlocked,
          tutorialMovementLocked,
          pokedexModalOpen,
          dialogueActive,
          skillLearnActive,
          scriptedInteractionActive,
          paused: Boolean(controls.isPaused?.())
        },
        camera: {
          ...gameplayCameraDirector.getState(now),
          openingCameraActiveForInput: gameplayOpeningCameraActive,
          transitionActive: cameraTransitionActive,
          pose: camera.getPose?.() || null
        },
        quest: {
          system: gameplay.getActiveSystemQuest?.()?.id || null,
          ui: gameplay.getActiveQuest?.(controls.storyState)?.id || null
        },
        errors: cameraDebugErrors,
        player: session.playerCharacter?.getPosition?.() || null
      });
    }

    if (
      introActive &&
      updateIntroRoomFrame({
        introRoomScene: session.introRoomScene,
        camera,
        worldCanvas,
        frame: nextFrame,
        deltaTime
      })
    ) {
      frameSnapshotController.commitFrame();
      requestAnimationFrame(frame);
      return;
    }

    if (tutorialActive || pokedexModalOpen || skillLearnActive || scriptedInteractionActive) {
      controls.clearPendingActions();
    }

    if (
      tutorialMovementLocked ||
      pokedexModalOpen ||
      dialogueActive ||
      skillLearnActive ||
      scriptedInteractionActive
    ) {
      controls.clearMovementInput();
    }

    updateRustlingGrassEvent(deltaTime, !(
      cinematicActive ||
      tutorialActive ||
      pokedexModalOpen ||
      dialogueActive ||
      skillLearnActive ||
      scriptedInteractionActive
    ));

    const canRotateCamera =
      session.playerCharacter &&
      !cinematicActive &&
      !gameplayOpeningCameraActive &&
      !controls.isBuilderPanelOpen() &&
      !pokedexModalOpen &&
      !skillLearnActive &&
      !scriptedInteractionActive &&
      !dialogueActive &&
      actTwoTutorial.allowsCameraLook();
    const canCycleCameraZoom =
      session.playerCharacter &&
      !cinematicActive &&
      !tutorialActive &&
      !gameplayOpeningCameraActive &&
      !controls.isBuilderPanelOpen() &&
      !pokedexModalOpen &&
      !skillLearnActive &&
      !scriptedInteractionActive &&
      !dialogueActive;

    while (controls.consumeCameraZoomCycleRequest?.()) {
      if (canCycleCameraZoom) {
        cameraZoomPresetController.cycle();
      }
    }

    const cameraTurnDirection =
      (controls.cameraTurnKeys.has("ArrowRight") ? 1 : 0) -
      (controls.cameraTurnKeys.has("ArrowLeft") ? 1 : 0);
    const cameraLookDelta = controls.consumeCameraLookDelta?.() || { yaw: 0, pitch: 0 };
    const keyboardCameraYaw = cameraTurnDirection * deltaTime * cameraOrbit.turnSpeed;
    const hasCameraLookInput =
      keyboardCameraYaw !== 0 ||
      Math.abs(cameraLookDelta.yaw) > 0.0001 ||
      Math.abs(cameraLookDelta.pitch) > 0.0001;

    if (canRotateCamera && hasCameraLookInput) {
      cameraOrbit.rotate(keyboardCameraYaw + cameraLookDelta.yaw, cameraLookDelta.pitch);
      if (tutorialActive) {
        actTwoTutorial.registerCameraLook();
      }
    } else if (!canRotateCamera) {
      controls.clearCameraLookInput?.();
    }

    if (
      session.playerCharacter &&
      !cinematicActive &&
      !tutorialMovementLocked &&
      !pokedexModalOpen &&
      !skillLearnActive &&
      !scriptedInteractionActive &&
      !dialogueActive
    ) {
      const previousPlayerPosition = session.playerCharacter.getPosition();
      session.playerCharacter.update(deltaTime);
      const nextPlayerPosition = session.playerCharacter.getPosition();
      const movedDistance = Math.hypot(
        nextPlayerPosition[0] - previousPlayerPosition[0],
        nextPlayerPosition[2] - previousPlayerPosition[2]
      );

      if (
        !movementQuestReported &&
        gameplay.getActiveSystemQuest?.()?.id === "learn-to-move" &&
        movedDistance > 0.0005
      ) {
        movementQuestDistance += movedDistance;
        if (movementQuestDistance >= 0.04) {
          const movementResult = gameplay.recordQuestEvent?.({
            type: "MOVE",
            targetId: "player"
          });
          movementQuestReported = Boolean(
            movementResult?.changed ||
            movementResult?.completedQuestIds?.length
          );
        }
      }
    }

    updatePlayerDustParticles(session.playerDust, {
      deltaTime,
      playerPosition: session.playerCharacter?.getPosition?.() || null,
      active: Boolean(session.playerCharacter) &&
        !cinematicActive &&
        !tutorialMovementLocked &&
        !pokedexModalOpen &&
        !skillLearnActive &&
        !scriptedInteractionActive &&
        !dialogueActive
    });
    updateNatureRevivalEffects(session.natureRevivalEffects, deltaTime);

    const activeMoveId = controls.getActiveMoveId?.() || null;
    const waterGunEquipped = Boolean(
      controls.playerSkills?.waterGun &&
      activeMoveId === "waterGun"
    );
    const leafageEquipped = Boolean(
      controls.playerSkills?.leafage &&
      activeMoveId === "leafage"
    );

    function performHarvestAction(playerPosition, options = {}) {
      return gameplay.performHarvestAction({
        playerPosition,
        palmModel: session.palmModel,
        palmInstances: session.palmInstances,
        resourceNodes: session.resourceNodes,
        leppaTree: session.leppaTree,
        inventory: controls.inventory,
        canPurifyGround: waterGunEquipped,
        groundDeadInstances: session.groundDeadInstances,
        groundFlowerPatches: session.groundFlowerPatches,
        groundGrassPatches: session.groundGrassPatches,
        groundPurifiedInstances: session.groundPurifiedInstances,
        storyState: controls.storyState,
        leafDen: session.leafDen,
        woodDrops: session.woodDrops,
        leppaBerryDrops: session.leppaBerryDrops,
        canUseLeafage: leafageEquipped,
        useWaterGun: Boolean(options.useWaterGun),
        forcedHarvestTarget: options.forcedHarvestTarget || null
      });
    }

    const harvestRequested = controls.consumeHarvestRequest();

    if (
      harvestRequested &&
      session.playerCharacter &&
      !cinematicActive &&
      !tutorialActive &&
      !skillLearnActive &&
      !scriptedInteractionActive
    ) {
      const playerPosition = session.playerCharacter.getPosition();
      const primaryActionTarget = gameplay.findNearbyActionTarget({
        playerPosition,
        palmModel: session.palmModel,
        palmInstances: session.palmInstances,
        resourceNodes: session.resourceNodes,
        leppaTree: session.leppaTree,
        leafDen: session.leafDen,
        storyState: controls.storyState,
        inventory: controls.inventory,
        groundDeadInstances: session.groundDeadInstances,
        groundPurifiedInstances: session.groundPurifiedInstances,
        groundGrassPatches: session.groundGrassPatches,
        groundFlowerPatches: session.groundFlowerPatches,
        canPurifyGround: waterGunEquipped,
        canUseLeafage: leafageEquipped
      });
      const primaryActionIsPlacement = Boolean(
        primaryActionTarget?.logChairPlacement ||
        primaryActionTarget?.strawBedPlacement ||
        primaryActionTarget?.leafDenKitPlacement ||
        primaryActionTarget?.leafDenFurniturePlacement ||
        primaryActionTarget?.dittoFlagPlacement
      );
      const primaryInteractTarget =
        !dialogueActive &&
        !primaryActionIsPlacement ?
          gameplay.findNearbyInteractable(
            playerPosition,
            session.npcActors,
            session.interactables,
            controls.storyState,
            session.groundGrassPatches,
            session.logChair,
            session.leafDen,
            session.timburrEncounter,
            session.charmanderEncounter
          ) :
          null;

      if (primaryActionIsPlacement) {
        performHarvestAction(playerPosition);
      } else if (primaryInteractTarget?.target) {
        gameplay.performInteractAction({
          playerPosition,
          npcActors: session.npcActors,
          interactables: session.interactables,
          storyState: controls.storyState,
          inventory: controls.inventory,
          groundGrassPatches: session.groundGrassPatches,
          logChair: session.logChair,
          leafDen: session.leafDen,
          timburrEncounter: session.timburrEncounter,
          charmanderEncounter: session.charmanderEncounter,
          onNpcInteractionStart({ targetId, playerPosition, npcActors, interactables }) {
            faceInteractionTargetTowardPlayer({
              targetId,
              playerPosition,
              npcActors,
              interactables
            });
            if (controls.isScriptedInteractionActive?.()) {
              return;
            }
            dialogueCamera?.focusNpcConversation({
              targetId,
              playerPosition,
              npcActors,
              interactables
            });
          }
        });
      } else if (!dialogueActive) {
        if (waterGunEquipped && primaryActionTarget?.groundCell) {
          const squirtleWaterGunResult = startSquirtleWaterGunAction({
            groundCell: primaryActionTarget.groundCell,
            playerPosition
          });

          if (squirtleWaterGunResult === "unavailable") {
            performHarvestAction(playerPosition, {
              useWaterGun: true,
              forcedHarvestTarget: primaryActionTarget
            });
          }
        } else {
          performHarvestAction(playerPosition);
        }
      }
    } else if (
      controls.isPrimaryActionActive?.() &&
      waterGunEquipped &&
      session.playerCharacter &&
      !cinematicActive &&
      !tutorialActive &&
      !pokedexModalOpen &&
      !skillLearnActive &&
      !scriptedInteractionActive &&
      !dialogueActive
    ) {
      const playerPosition = session.playerCharacter.getPosition();
      const waterGunTarget = gameplay.findNearbyActionTarget({
        playerPosition,
        palmModel: session.palmModel,
        palmInstances: session.palmInstances,
        resourceNodes: session.resourceNodes,
        leppaTree: session.leppaTree,
        storyState: controls.storyState,
        inventory: controls.inventory,
        leafDen: session.leafDen,
        groundDeadInstances: session.groundDeadInstances,
        groundPurifiedInstances: session.groundPurifiedInstances,
        groundGrassPatches: session.groundGrassPatches,
        groundFlowerPatches: session.groundFlowerPatches,
        canPurifyGround: true,
        canUseLeafage: false
      });

      if (waterGunTarget?.groundCell) {
        const squirtleWaterGunResult = startSquirtleWaterGunAction({
          groundCell: waterGunTarget.groundCell,
          playerPosition
        });

        if (squirtleWaterGunResult === "unavailable") {
          performHarvestAction(playerPosition, {
            useWaterGun: true,
            forcedHarvestTarget: waterGunTarget
          });
        }
      } else if (
        waterGunTarget?.leppaTree?.action === "water" ||
        (
          waterGunTarget?.palm &&
          controls.storyState.flags.bulbasaurStrawBedChallengeAvailable &&
          !controls.storyState.flags.bulbasaurStrawBedChallengeComplete &&
          !controls.storyState.flags.strawBedRecipeUnlocked
        )
      ) {
        performHarvestAction(playerPosition, {
          useWaterGun: true
        });
      }
    }

    if (
      controls.consumeInteractRequest() &&
      session.playerCharacter &&
      !cinematicActive &&
      !tutorialActive &&
      !skillLearnActive &&
      !scriptedInteractionActive &&
      !dialogueActive
    ) {
      gameplay.performInteractAction({
        playerPosition: session.playerCharacter.getPosition(),
        npcActors: session.npcActors,
        interactables: session.interactables,
        storyState: controls.storyState,
        inventory: controls.inventory,
        groundGrassPatches: session.groundGrassPatches,
        logChair: session.logChair,
        leafDen: session.leafDen,
        timburrEncounter: session.timburrEncounter,
        charmanderEncounter: session.charmanderEncounter,
        onNpcInteractionStart({ targetId, playerPosition, npcActors, interactables }) {
          faceInteractionTargetTowardPlayer({
            targetId,
            playerPosition,
            npcActors,
            interactables
          });
          if (controls.isScriptedInteractionActive?.()) {
            return;
          }
          dialogueCamera?.focusNpcConversation({
            targetId,
            playerPosition,
            npcActors,
            interactables
          });
        }
      });
    }

    if (controls.consumeFollowerCallRequest?.()) {
      const leafDenHelpCall =
        controls.storyState.flags.leafDenKitPlaced &&
        !controls.storyState.flags.leafDenConstructionStarted;

      if (leafDenHelpCall) {
        const called = [];
        if (controls.storyState.flags.timburrRevealed) {
          controls.storyState.flags.timburrFollowing = true;
          called.push("Timburr");
        }
        if (controls.storyState.flags.charmanderRevealed) {
          controls.storyState.flags.charmanderFollowing = true;
          called.push("Charmander");
        }
        hud.pushNotice(called.length ?
          `${called.join(" and ")} are following you.` :
          "No Pokemon are ready to help with construction yet.");
      } else if (
        controls.storyState.flags.charmanderRevealed &&
        !controls.storyState.flags.charmanderCampfireLit &&
        session.campfire
      ) {
        controls.storyState.flags.charmanderFollowing = true;
        hud.pushNotice("Charmander is following you.");
      } else if (
        controls.storyState.flags.charmanderCelebrationSuggested &&
        !controls.storyState.flags.charmanderCelebrationComplete &&
        controls.storyState.flags.charmanderRevealed
      ) {
        controls.storyState.flags.charmanderFollowing = true;
        hud.pushNotice("Charmander is following you.");
      }
    }

    hud.updateTransientNotice(deltaTime);
    gameplay.updatePalmShake(deltaTime, session.palmInstances);
    gameplay.updateResourceNodes(deltaTime, session.resourceNodes);
    gameplay.syncLeppaTreeState?.(session.leppaTree, controls.storyState);
    updateChopperNpcActor(session.chopperNpcActor, {
      deltaTime,
      storyState: controls.storyState,
      isNpcActive: rendering.isNpcActive
    });
    updateBulbasaurEncounter(deltaTime);
    updateCharmanderEncounter(deltaTime);
    updateTimburrEncounter(deltaTime);
    updateSquirtleWaterGunAction(deltaTime);

    if (cinematicActive) {
      actTwoSequence.update(deltaTime);
      cinematicActive = isGameFlow(gameFlowValues.CINEMATIC);
      tutorialActive = isGameFlow(gameFlowValues.TUTORIAL);
    }

    if (session.playerCharacter && !cinematicActive) {
      if (!tutorialActive && !pokedexModalOpen && !skillLearnActive && !scriptedInteractionActive) {
        const collectedWoodCount = gameplay.collectWoodDrops(
          session.playerCharacter.getPosition(),
          session.woodDrops,
          controls.inventory
        );

        if (collectedWoodCount > 0) {
          hud.syncInventoryUi(controls.inventory);
          hud.pushNotice(`+${collectedWoodCount} Wood`);

          if (controls.storyState.flags.bulbasaurStrawBedChallengeCompletionNoticePending) {
            controls.storyState.flags.bulbasaurStrawBedChallengeCompletionNoticePending = false;
            hud.pushNotice("First set of challenges complete. Talk to Bulbasaur.");
          }
        }

        const collectedLeppaBerryCount = gameplay.collectLeppaBerryDrops?.(
          session.playerCharacter.getPosition(),
          session.leppaBerryDrops,
          controls.inventory
        ) || 0;

        if (collectedLeppaBerryCount > 0) {
          hud.syncInventoryUi(controls.inventory);
          hud.pushNotice(`+${collectedLeppaBerryCount} Leppa Berry`);
        }
      }

      if (tutorialCameraFocus) {
        camera.setPose({
          target: [tutorialCameraFocus[0], 1.25, tutorialCameraFocus[2]],
          direction: cameraOrbit.getDirection(),
          zoom: 3.95,
          distance: 7.35
        });
      } else if (isGameFlow(gameFlowValues.GAMEPLAY)) {
        gameplayCameraDirector.update({
          now,
          gameplayActive: true,
          playerPosition: session.playerCharacter.getPosition(),
          canFollow: !dialogueActive && !camera.isTargetTransitionActive()
        });
      } else if (!dialogueActive && !camera.isTargetTransitionActive()) {
        camera.follow(session.playerCharacter.getPosition());
      }
    }

    const nearbyHarvestTarget =
      session.playerCharacter && !cinematicActive && !tutorialActive && !skillLearnActive && !scriptedInteractionActive ?
        gameplay.findNearbyActionTarget({
          playerPosition: session.playerCharacter.getPosition(),
          palmModel: session.palmModel,
          palmInstances: session.palmInstances,
          resourceNodes: session.resourceNodes,
          leppaTree: session.leppaTree,
          leafDen: session.leafDen,
          storyState: controls.storyState,
          inventory: controls.inventory,
          groundDeadInstances: session.groundDeadInstances,
          groundPurifiedInstances: session.groundPurifiedInstances,
          groundGrassPatches: session.groundGrassPatches,
          groundFlowerPatches: session.groundFlowerPatches,
          canPurifyGround: waterGunEquipped,
          canUseLeafage: leafageEquipped
        }) :
        null;
    const nearbyInteractable =
      session.playerCharacter && !cinematicActive && !tutorialActive && !skillLearnActive && !scriptedInteractionActive ?
        gameplay.findNearbyInteractable(
          session.playerCharacter.getPosition(),
          session.npcActors,
          session.interactables,
          controls.storyState,
          session.groundGrassPatches,
          session.logChair,
          session.leafDen,
          session.timburrEncounter,
          session.charmanderEncounter
        ) :
        null;
    const activeQuest = gameplay.getActiveQuest(controls.storyState);
    const activeSystemQuest = gameplay.getActiveSystemQuest?.() || null;
    const pendingWaterGunGroundCells =
      !cinematicActive &&
      !tutorialActive &&
      !pokedexModalOpen &&
      !skillLearnActive &&
      !scriptedInteractionActive ?
        getPendingSquirtleWaterGunGroundCells() :
        [];
    const promptCopy = cinematicActive || tutorialActive || skillLearnActive || scriptedInteractionActive ?
      "" :
      gameplay.buildNearbyPrompt({
        harvestTarget: nearbyHarvestTarget,
        interactTarget: nearbyInteractable,
        quest: activeQuest,
        transientMessage: hud.getNoticeMessage(),
        getItemLabel: gameplay.getItemLabel,
        storyState: controls.storyState,
        activeMoveId,
        pendingWaterGunCount: pendingWaterGunGroundCells.length
      });
    const shouldShowGroundCellHighlight =
      !cinematicActive &&
      !tutorialActive &&
      !pokedexModalOpen &&
      !skillLearnActive &&
      !scriptedInteractionActive &&
      !gameplayDialogue.isActive() &&
      Boolean(nearbyHarvestTarget?.groundCell || nearbyHarvestTarget?.leafageGroundCell);

    if (!cinematicActive && !tutorialActive && !pokedexModalOpen && !skillLearnActive) {
      nextFrame.hud.active = true;
      nextFrame.hud.storyState = controls.storyState;
      nextFrame.hud.inventory = controls.inventory;
      nextFrame.hud.playerPosition = session.playerCharacter?.getPosition() || [0, 0, 0];
      nextFrame.hud.promptCopy = promptCopy;
      nextFrame.hud.statusMessage = promptCopy;
    }

    const followedViewProjection = camera.getViewProjection(
      worldCanvas.width,
      worldCanvas.height
    );
    nextFrame.render.viewProjection = followedViewProjection;
    nextFrame.render.sceneObjects = session.sceneObjects;
    nextFrame.render.skyTexture = session.skyTexture;

    const tangrowthActor = session.npcActors.find((npcActor) => npcActor.id === "tangrowth");
    const tangrowthPosition =
      tangrowthActor?.character?.getPosition?.() ||
      null;
    const shouldShowTangrowthSpeech =
      !cinematicActive &&
      !tutorialActive &&
      !pokedexModalOpen &&
      !skillLearnActive &&
      !gameplayDialogue.isActive() &&
      activeQuest?.id === "meetTangrowth" &&
      tangrowthPosition;
    const shouldShowTangrowthLogChairSpeech =
      !shouldShowTangrowthSpeech &&
      !cinematicActive &&
      !tutorialActive &&
      !pokedexModalOpen &&
      !skillLearnActive &&
      !gameplayDialogue.isActive() &&
      controls.storyState.flags.tangrowthLogChairRequestAvailable &&
      !controls.storyState.flags.logChairReceived &&
      tangrowthPosition;
    const shouldShowTangrowthCampfireSpeech =
      !shouldShowTangrowthSpeech &&
      !shouldShowTangrowthLogChairSpeech &&
      !cinematicActive &&
      !tutorialActive &&
      !pokedexModalOpen &&
      !skillLearnActive &&
      !gameplayDialogue.isActive() &&
      controls.storyState.flags.campfireCrafted &&
      !controls.storyState.flags.campfireSpatOut &&
      tangrowthPosition;
    const shouldShowTangrowthPokemonCenterSpeech =
      !shouldShowTangrowthSpeech &&
      !shouldShowTangrowthLogChairSpeech &&
      !shouldShowTangrowthCampfireSpeech &&
      !cinematicActive &&
      !tutorialActive &&
      !pokedexModalOpen &&
      !skillLearnActive &&
      !gameplayDialogue.isActive() &&
      controls.storyState.flags.pokemonCenterGuideStarted &&
      !controls.storyState.flags.ruinedPokemonCenterInspected &&
      tangrowthPosition;
    const shouldShowTangrowthHouseSpeech =
      !shouldShowTangrowthSpeech &&
      !shouldShowTangrowthLogChairSpeech &&
      !shouldShowTangrowthCampfireSpeech &&
      !shouldShowTangrowthPokemonCenterSpeech &&
      !cinematicActive &&
      !tutorialActive &&
      !pokedexModalOpen &&
      !skillLearnActive &&
      !gameplayDialogue.isActive() &&
      controls.storyState.flags.tangrowthHouseTalkAvailable &&
      !controls.storyState.flags.tangrowthHouseTalkComplete &&
      tangrowthPosition;
    const shouldShowTangrowthCelebrationSpeech =
      !shouldShowTangrowthSpeech &&
      !shouldShowTangrowthLogChairSpeech &&
      !shouldShowTangrowthCampfireSpeech &&
      !shouldShowTangrowthPokemonCenterSpeech &&
      !shouldShowTangrowthHouseSpeech &&
      !cinematicActive &&
      !tutorialActive &&
      !pokedexModalOpen &&
      !skillLearnActive &&
      !gameplayDialogue.isActive() &&
      controls.storyState.flags.charmanderCelebrationSuggested &&
      !controls.storyState.flags.charmanderCelebrationComplete &&
      tangrowthPosition;
    const shouldShowBulbasaurMissionSpeech =
      !shouldShowTangrowthSpeech &&
      !shouldShowTangrowthLogChairSpeech &&
      !shouldShowTangrowthCampfireSpeech &&
      !shouldShowTangrowthPokemonCenterSpeech &&
      !shouldShowTangrowthHouseSpeech &&
      !shouldShowTangrowthCelebrationSpeech &&
      !cinematicActive &&
      !tutorialActive &&
      !pokedexModalOpen &&
      !skillLearnActive &&
      !gameplayDialogue.isActive() &&
      Boolean(session.bulbasaurEncounter?.visible) &&
      Boolean(session.bulbasaurEncounter?.position) &&
      controls.storyState.flags.bulbasaurRevealed &&
      !controls.storyState.flags.bulbasaurDryGrassMissionAccepted;
    const shouldShowBulbasaurWorkbenchGuideSpeech =
      !shouldShowTangrowthSpeech &&
      !shouldShowTangrowthLogChairSpeech &&
      !shouldShowTangrowthCampfireSpeech &&
      !shouldShowTangrowthPokemonCenterSpeech &&
      !shouldShowTangrowthHouseSpeech &&
      !shouldShowTangrowthCelebrationSpeech &&
      !shouldShowBulbasaurMissionSpeech &&
      !cinematicActive &&
      !tutorialActive &&
      !pokedexModalOpen &&
      !skillLearnActive &&
      !gameplayDialogue.isActive() &&
      Boolean(session.bulbasaurEncounter?.visible) &&
      Boolean(session.bulbasaurEncounter?.position) &&
      controls.storyState.flags.bulbasaurWorkbenchGuideAvailable &&
      !controls.storyState.flags.workbenchDiyRecipesReceived;
    const shouldShowBulbasaurRequestReadySpeech =
      !shouldShowTangrowthSpeech &&
      !shouldShowTangrowthLogChairSpeech &&
      !shouldShowTangrowthCampfireSpeech &&
      !shouldShowTangrowthPokemonCenterSpeech &&
      !shouldShowTangrowthHouseSpeech &&
      !shouldShowTangrowthCelebrationSpeech &&
      !shouldShowBulbasaurMissionSpeech &&
      !shouldShowBulbasaurWorkbenchGuideSpeech &&
      !cinematicActive &&
      !tutorialActive &&
      !pokedexModalOpen &&
      !skillLearnActive &&
      !gameplayDialogue.isActive() &&
      Boolean(session.bulbasaurEncounter?.visible) &&
      Boolean(session.bulbasaurEncounter?.position) &&
      controls.storyState.flags.bulbasaurRevealed &&
      controls.storyState.flags.bulbasaurDryGrassMissionAccepted &&
      !controls.storyState.flags.bulbasaurDryGrassRequestTurnedIn &&
      (
        controls.storyState.flags.bulbasaurDryGrassMissionComplete ||
        (controls.storyState.flags.restoredGrassCount || 0) >= BULBASAUR_DRY_GRASS_MISSION_RESTORE_COUNT
      );
    const shouldShowCharmanderFollowSpeech =
      !shouldShowTangrowthSpeech &&
      !shouldShowTangrowthLogChairSpeech &&
      !shouldShowTangrowthCampfireSpeech &&
      !shouldShowTangrowthPokemonCenterSpeech &&
      !shouldShowTangrowthHouseSpeech &&
      !shouldShowTangrowthCelebrationSpeech &&
      !shouldShowBulbasaurMissionSpeech &&
      !shouldShowBulbasaurWorkbenchGuideSpeech &&
      !shouldShowBulbasaurRequestReadySpeech &&
      !(
        Boolean(session.bulbasaurEncounter?.visible) &&
        Boolean(session.bulbasaurEncounter?.position) &&
        (
          (
            controls.storyState.flags.bulbasaurStrawBedChallengeComplete &&
            !controls.storyState.flags.strawBedRecipeUnlocked
          ) ||
          (
            controls.storyState.flags.strawBedPlacedInBulbasaurHabitat &&
            !controls.storyState.flags.bulbasaurStrawBedRequestComplete
          )
        )
      ) &&
      !cinematicActive &&
      !tutorialActive &&
      !pokedexModalOpen &&
      !skillLearnActive &&
      !gameplayDialogue.isActive() &&
      Boolean(session.charmanderEncounter?.visible) &&
      Boolean(session.charmanderEncounter?.position) &&
      controls.storyState.flags.charmanderRevealed &&
      !controls.storyState.flags.charmanderCampfireLit;
    const shouldShowBulbasaurStrawBedSpeech =
      !shouldShowTangrowthSpeech &&
      !shouldShowTangrowthLogChairSpeech &&
      !shouldShowTangrowthCampfireSpeech &&
      !shouldShowTangrowthPokemonCenterSpeech &&
      !shouldShowTangrowthHouseSpeech &&
      !shouldShowTangrowthCelebrationSpeech &&
      !shouldShowBulbasaurMissionSpeech &&
      !shouldShowBulbasaurWorkbenchGuideSpeech &&
      !shouldShowBulbasaurRequestReadySpeech &&
      !cinematicActive &&
      !tutorialActive &&
      !pokedexModalOpen &&
      !skillLearnActive &&
      !gameplayDialogue.isActive() &&
      Boolean(session.bulbasaurEncounter?.visible) &&
      Boolean(session.bulbasaurEncounter?.position) &&
      controls.storyState.flags.bulbasaurStrawBedChallengeComplete &&
      !controls.storyState.flags.strawBedRecipeUnlocked;
    const shouldShowBulbasaurStrawBedCompleteSpeech =
      !shouldShowTangrowthSpeech &&
      !shouldShowTangrowthLogChairSpeech &&
      !shouldShowTangrowthCampfireSpeech &&
      !shouldShowTangrowthPokemonCenterSpeech &&
      !shouldShowTangrowthHouseSpeech &&
      !shouldShowTangrowthCelebrationSpeech &&
      !shouldShowBulbasaurMissionSpeech &&
      !shouldShowBulbasaurWorkbenchGuideSpeech &&
      !shouldShowBulbasaurRequestReadySpeech &&
      !shouldShowBulbasaurStrawBedSpeech &&
      !cinematicActive &&
      !tutorialActive &&
      !pokedexModalOpen &&
      !skillLearnActive &&
      !gameplayDialogue.isActive() &&
      Boolean(session.bulbasaurEncounter?.visible) &&
      Boolean(session.bulbasaurEncounter?.position) &&
      controls.storyState.flags.strawBedPlacedInBulbasaurHabitat &&
      !controls.storyState.flags.bulbasaurStrawBedRequestComplete;
    const shouldShowCharmanderCelebrationSpeech =
      !shouldShowTangrowthSpeech &&
      !shouldShowTangrowthLogChairSpeech &&
      !shouldShowTangrowthCampfireSpeech &&
      !shouldShowTangrowthPokemonCenterSpeech &&
      !shouldShowTangrowthHouseSpeech &&
      !shouldShowTangrowthCelebrationSpeech &&
      !shouldShowBulbasaurMissionSpeech &&
      !shouldShowBulbasaurWorkbenchGuideSpeech &&
      !shouldShowBulbasaurRequestReadySpeech &&
      !shouldShowCharmanderFollowSpeech &&
      !shouldShowBulbasaurStrawBedSpeech &&
      !shouldShowBulbasaurStrawBedCompleteSpeech &&
      !cinematicActive &&
      !tutorialActive &&
      !pokedexModalOpen &&
      !skillLearnActive &&
      !gameplayDialogue.isActive() &&
      Boolean(session.charmanderEncounter?.visible) &&
      Boolean(session.charmanderEncounter?.position) &&
      controls.storyState.flags.charmanderCelebrationRequestAvailable &&
      !controls.storyState.flags.charmanderCelebrationSuggested &&
      !controls.storyState.flags.charmanderCelebrationComplete;

    if (shouldShowTangrowthSpeech) {
      nextFrame.worldSpeech.visible = true;
      nextFrame.worldSpeech.text = gameplay.tangrowthOpeningLine;
      nextFrame.worldSpeech.worldPosition = tangrowthPosition;
    }

    if (shouldShowTangrowthLogChairSpeech) {
      nextFrame.worldSpeech.visible = true;
      nextFrame.worldSpeech.text = "I made something for you.";
      nextFrame.worldSpeech.worldPosition = tangrowthPosition;
    }

    if (shouldShowTangrowthCampfireSpeech) {
      nextFrame.worldSpeech.visible = true;
      nextFrame.worldSpeech.text = controls.storyState.flags.campfireSelectedForTangrowth ?
        "Bring it here and spit it out." :
        "Open your bag and choose the Campfire.";
      nextFrame.worldSpeech.worldPosition = tangrowthPosition;
    }

    if (shouldShowTangrowthPokemonCenterSpeech) {
      nextFrame.worldSpeech.visible = true;
      nextFrame.worldSpeech.text = "This way. The old Pokemon Center is ahead.";
      nextFrame.worldSpeech.worldPosition = tangrowthPosition;
    }

    if (shouldShowTangrowthHouseSpeech) {
      nextFrame.worldSpeech.visible = true;
      nextFrame.worldSpeech.text = "Let's talk about houses.";
      nextFrame.worldSpeech.worldPosition = tangrowthPosition;
    }

    if (shouldShowTangrowthCelebrationSpeech) {
      nextFrame.worldSpeech.visible = true;
      nextFrame.worldSpeech.text = "Bring Charmander here.";
      nextFrame.worldSpeech.worldPosition = tangrowthPosition;
    }

    if (shouldShowBulbasaurMissionSpeech) {
      nextFrame.worldSpeech.visible = true;
      nextFrame.worldSpeech.text = "This is no good...";
      nextFrame.worldSpeech.worldPosition = session.bulbasaurEncounter.position;
    }

    if (shouldShowBulbasaurWorkbenchGuideSpeech) {
      nextFrame.worldSpeech.visible = true;
      nextFrame.worldSpeech.text = "This way! The Workbench is over here!";
      nextFrame.worldSpeech.worldPosition = session.bulbasaurEncounter.position;
    }

    if (shouldShowBulbasaurRequestReadySpeech) {
      nextFrame.worldSpeech.visible = true;
      nextFrame.worldSpeech.text = "You did it!";
      nextFrame.worldSpeech.worldPosition = session.bulbasaurEncounter.position;
    }

    if (shouldShowBulbasaurStrawBedSpeech) {
      nextFrame.worldSpeech.visible = true;
      nextFrame.worldSpeech.text = "I thought of something!";
      nextFrame.worldSpeech.worldPosition = session.bulbasaurEncounter.position;
    }

    if (shouldShowBulbasaurStrawBedCompleteSpeech) {
      nextFrame.worldSpeech.visible = true;
      nextFrame.worldSpeech.text = "That looks so cozy!";
      nextFrame.worldSpeech.worldPosition = session.bulbasaurEncounter.position;
    }

    if (shouldShowCharmanderFollowSpeech) {
      nextFrame.worldSpeech.visible = true;
      nextFrame.worldSpeech.text = controls.storyState.flags.charmanderFollowing ?
        "I'll follow you to the fire!" :
        "Call me when you're ready.";
      nextFrame.worldSpeech.worldPosition = session.charmanderEncounter.position;
    }

    if (shouldShowCharmanderCelebrationSpeech) {
      nextFrame.worldSpeech.visible = true;
      nextFrame.worldSpeech.text = "Let's celebrate!";
      nextFrame.worldSpeech.worldPosition = session.charmanderEncounter.position;
    }

    if (
      shouldShowTangrowthSpeech &&
      nearbyInteractable?.target?.id === "tangrowth" &&
      session.playerCharacter
    ) {
      nextFrame.worldPrompt.visible = true;
      nextFrame.worldPrompt.text = "Press X";
      nextFrame.worldPrompt.worldPosition = session.playerCharacter.getPosition();
    }

    if (shouldShowGroundCellHighlight) {
      nextFrame.groundCellHighlight.visible = true;
      nextFrame.groundCellHighlight.groundCell =
        nearbyHarvestTarget.groundCell || nearbyHarvestTarget.leafageGroundCell;
    }

    if (pendingWaterGunGroundCells.length) {
      nextFrame.groundCellHighlight.visible = true;
      nextFrame.groundCellHighlight.markedGroundCells.push(...pendingWaterGunGroundCells);
      nextFrame.groundCellHighlight.pulsePhase = (Math.sin(now * 0.012) + 1) * 0.5;
    }

    const questCompletionPop = gameplay.getQuestCompletionPop?.();
    if (
      questCompletionPop?.text &&
      session.playerCharacter &&
      !cinematicActive &&
      !tutorialActive &&
      !pokedexModalOpen
    ) {
      nextFrame.taskPop.visible = true;
      nextFrame.taskPop.text = questCompletionPop.text;
      nextFrame.taskPop.worldPosition = session.playerCharacter.getPosition();
    }

    if (Array.isArray(session.tallGrassInstances)) {
      session.tallGrassInstances.length = 0;
    }

    for (const groundGrassPatch of session.groundGrassPatches) {
      const shouldRustle =
        groundGrassPatch.state === "alive" &&
        (
          (
            groundGrassPatch.cellId === controls.storyState.flags.rustlingGrassCellId &&
            !controls.storyState.flags.bulbasaurRevealed
          ) ||
          (
            groundGrassPatch.cellId === controls.storyState.flags.charmanderRustlingGrassCellId &&
            !controls.storyState.flags.charmanderRevealed
          ) ||
          (
            groundGrassPatch.cellId === controls.storyState.flags.timburrRustlingGrassCellId &&
            !controls.storyState.flags.timburrRevealed
          )
        );
      const rustleOffset = shouldRustle ? Math.sin(now * 0.024) * 0.11 : 0;
      const grassRevivalScale = getNatureRevivalScale(
        session.natureRevivalEffects,
        groundGrassPatch.id
      );

      if (
        groundGrassPatch.state === "alive" &&
        session.tallGrassModel &&
        Array.isArray(session.tallGrassInstances)
      ) {
        session.tallGrassInstances.push({
          id: `tall-grass-${groundGrassPatch.id}`,
          offset: [
            groundGrassPatch.position[0] + rustleOffset,
            groundGrassPatch.position[1],
            groundGrassPatch.position[2]
          ],
          scale: getTallGrassInstanceScale(
            session.tallGrassModel,
            groundGrassPatch,
            grassRevivalScale
          ),
          yaw: getTallGrassYaw(groundGrassPatch),
          swayStrength: getTallGrassSway(groundGrassPatch, shouldRustle, now)
        });
      } else {
        nextFrame.render.grassBillboards.push({
          texture: groundGrassPatch.state === "alive" ?
            session.greenGrassTexture :
            session.deadGrassTexture,
          position: [
            groundGrassPatch.position[0] + rustleOffset,
            groundGrassPatch.position[1],
            groundGrassPatch.position[2]
          ],
          size: groundGrassPatch.size.map((value) => value * grassRevivalScale)
        });
      }

      if (shouldRustle) {
        nextFrame.render.genericBillboards.push(
          ...getRustlingGrassParticleBillboards(
            groundGrassPatch,
            session.natureRevivalSparkTexture,
            now,
            rendering.fullUvRect
          )
        );
      }
    }

    for (const groundFlowerPatch of session.groundFlowerPatches) {
      const flowerRevivalScale = getNatureRevivalScale(
        session.natureRevivalEffects,
        groundFlowerPatch.id
      );
      nextFrame.render.flowerBillboards.push({
        texture: groundFlowerPatch.state === "alive" ?
          session.greenFlowerTexture :
          session.deadFlowerTexture,
        position: groundFlowerPatch.position,
        size: groundFlowerPatch.size.map((value) => value * flowerRevivalScale)
      });
    }

    if (!cinematicActive && !tutorialActive) {
      nextFrame.render.worldMarkers = {
        storyState: controls.storyState,
        resourceNodes: session.resourceNodes,
        npcActors: session.npcActors,
        interactables: session.interactables,
        markerTextures: session.markerTextures,
        worldMarkerHeight: rendering.worldMarkerHeight,
        worldMarkerSize: rendering.worldMarkerSize,
        npcMarkerOffset: rendering.npcMarkerOffset,
        npcMarkerSize: rendering.npcMarkerSize,
        fullUvRect: rendering.fullUvRect,
        attentionTargetIds: getQuestAttentionTargetIds({
          systemQuest: activeSystemQuest,
          storyQuest: activeQuest,
          storyState: controls.storyState
        }),
        isNpcActive: rendering.isNpcActive,
        isInteractableActive: rendering.isInteractableActive,
        isResourceNodeActive: rendering.isResourceNodeActive
      };
    }

    nextFrame.render.woodTexture = session.woodTexture;
    nextFrame.render.woodDrops = session.woodDrops;
    nextFrame.render.genericBillboards.push(
      ...(session.leppaBerryDrops || [])
        .filter((leppaBerryDrop) => !leppaBerryDrop.collected)
        .map((leppaBerryDrop) => ({
          texture: session.leppaBerryTexture,
          position: leppaBerryDrop.position,
          size: leppaBerryDrop.size,
          uvRect: rendering.fullUvRect
        }))
    );
    if (session.logChair && controls.storyState.flags.logChairPlaced) {
      nextFrame.render.genericBillboards.push({
        texture: session.logChairTexture,
        position: session.logChair.position,
        size: session.logChair.size,
        uvRect: rendering.fullUvRect
      });
    }
    if (session.strawBed && controls.storyState.flags.strawBedPlacedInBulbasaurHabitat) {
      nextFrame.render.genericBillboards.push({
        texture: session.strawBedTexture,
        position: session.strawBed.position,
        size: session.strawBed.size,
        uvRect: rendering.fullUvRect
      });
    }
    if (session.campfire && controls.storyState.flags.campfireSpatOut) {
      nextFrame.render.genericBillboards.push({
        texture: session.campfireTexture,
        position: session.campfire.position,
        size: session.campfire.size,
        uvRect: rendering.fullUvRect
      });
    }
    if (session.leafDen && controls.storyState.flags.leafDenKitPlaced) {
      nextFrame.render.genericBillboards.push({
        texture: controls.storyState.flags.leafDenBuilt ?
          session.leafDenTexture :
          session.leafDenKitTexture,
        position: session.leafDen.position,
        size: controls.storyState.flags.leafDenBuilt ?
          [2.55, 1.85] :
          session.leafDen.size,
        uvRect: rendering.fullUvRect
      });
    }
    if (session.dittoFlag && controls.storyState.flags.dittoFlagPlacedOnHouse) {
      nextFrame.render.genericBillboards.push({
        texture: session.dittoFlagTexture,
        position: session.dittoFlag.position,
        size: session.dittoFlag.size,
        uvRect: rendering.fullUvRect
      });
    }
    if (controls.storyState.flags.leafDenInteriorEntered) {
      nextFrame.render.genericBillboards.push(
        ...(session.leafDenFurniture || []).map((furniture) => ({
          texture: furniture.kind === "strawBed" ?
            session.strawBedTexture :
            furniture.kind === "campfire" ?
              session.campfireTexture :
              session.logChairTexture,
          position: furniture.position,
          size: furniture.size,
          uvRect: rendering.fullUvRect
        }))
      );
    }
    if (
      session.pokemonCenterPc &&
      controls.storyState.flags.ruinedPokemonCenterInspected
    ) {
      nextFrame.render.genericBillboards.push({
        texture: session.pokemonCenterPc.texture,
        position: session.pokemonCenterPc.position,
        size: session.pokemonCenterPc.size,
        uvRect: rendering.fullUvRect
      });
    }
    if (session.challengeBoulder && controls.storyState.flags.boulderChallengeAvailable) {
      nextFrame.render.genericBillboards.push({
        texture: session.challengeBoulder.texture,
        position: session.challengeBoulder.position,
        size: session.challengeBoulder.size,
        uvRect: rendering.fullUvRect
      });
    }
    nextFrame.render.genericBillboards.push({
      texture: session.actTwoPokedexCache?.texture || null,
      position: session.actTwoPokedexCache?.position || null,
      size: session.actTwoPokedexCache?.size || null,
      uvRect: rendering.fullUvRect
    });

    if (session.actTwoRepairPlant) {
      const repairPlantTexture = session.actTwoRepairPlant.fixed ?
        session.repairPlantFixedTexture :
        session.repairPlantBrokenTexture;

      nextFrame.render.genericBillboards.push({
        texture: repairPlantTexture,
        position: session.actTwoRepairPlant.position,
        size: session.actTwoRepairPlant.size,
        uvRect: rendering.fullUvRect
      });
    }

    const visibleActTwoSquirtle =
      actTwoTutorial.hasStarted() || controls.storyState.questIndex >= 1 ?
        session.actTwoSquirtle :
        null;
    if (session.actTwoSquirtle?.modelInstance) {
      syncSquirtleModelInstance();
      session.actTwoSquirtle.modelInstance.active = Boolean(
        visibleActTwoSquirtle || session.squirtleWaterGunAction
      );
    }
    nextFrame.render.genericBillboards.push(
      ...getSquirtleWaterGunBillboards(
        session.squirtleWaterGunAction,
        session.squirtleWaterSprayTexture,
        rendering.fullUvRect
      )
    );
    nextFrame.render.genericBillboards.push({
      texture: session.bulbasaurEncounter?.visible ? session.bulbasaurEncounter.texture : null,
      position: session.bulbasaurEncounter?.visible ? session.bulbasaurEncounter.position : null,
      size: session.bulbasaurEncounter?.visible ? session.bulbasaurEncounter.size : null,
      uvRect: rendering.fullUvRect
    });
    nextFrame.render.genericBillboards.push({
      texture: session.charmanderEncounter?.visible ? session.charmanderEncounter.texture : null,
      position: session.charmanderEncounter?.visible ? session.charmanderEncounter.position : null,
      size: session.charmanderEncounter?.visible ? session.charmanderEncounter.size : null,
      uvRect: rendering.fullUvRect
    });
    nextFrame.render.genericBillboards.push({
      texture: session.timburrEncounter?.visible ? session.timburrEncounter.texture : null,
      position: session.timburrEncounter?.visible ? session.timburrEncounter.position : null,
      size: session.timburrEncounter?.visible ? session.timburrEncounter.size : null,
      uvRect: rendering.fullUvRect
    });
    nextFrame.render.genericBillboards.push(
      ...getPlayerDustBillboards(session.playerDust, session.playerDustTexture, rendering.fullUvRect)
    );
    nextFrame.render.genericBillboards.push(
      ...getNatureRevivalBillboards(
        session.natureRevivalEffects,
        session.natureRevivalSparkTexture,
        rendering.fullUvRect
      )
    );
    if (rendering.debugColliders) {
      nextFrame.colliderGizmos.visible = true;
      nextFrame.colliderGizmos.colliders = session.elevatedTerrainColliders || [];
      nextFrame.render.genericBillboards.push(
        ...getColliderGizmoBillboards({
          colliders: session.elevatedTerrainColliders,
          textures: session.colliderGizmoTextures
        })
      );
    }
    nextFrame.render.characters = {
      storyState: controls.storyState,
      playerCharacter: session.playerCharacter,
      npcActors: session.npcActors,
      characterTextures: session.characterTextures,
      isNpcActive: rendering.isNpcActive
    };

    nextFrame.tutorial.active = true;
    nextFrame.tutorial.playerPosition = session.playerCharacter?.getPosition() || null;
    nextFrame.tutorial.deltaTime = deltaTime;
    frameSnapshotController.commitFrame();
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
