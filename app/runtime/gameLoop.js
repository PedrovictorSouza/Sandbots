import { createFrameSnapshotController } from "./frameSnapshotController.js";
import { createCameraZoomPresetController } from "./cameraZoomPresetController.js";
import { updatePlayerDustParticles } from "../session/playerDustParticles.js";
import {
  getNatureRevivalBillboards,
  getNatureRevivalScale,
  updateNatureRevivalEffects
} from "../session/natureRevivalEffects.js";
import { getColliderGizmoBillboards } from "../session/colliderGizmos.js";
import { updateIntroRoomFrame } from "../scenes/introRoom/introRoomSequence.js";
import { updateChopperNpcActor } from "../session/chopperNpcActor.js";
import { createGameplayCameraDirector } from "./gameplayCameraDirector.js";
import {
  appendGameplayOpeningShipBillboards,
  consumeGameplayOpeningShipEvents,
  GAMEPLAY_OPENING_SHIP_EVENTS,
  getGameplayOpeningShipSceneObjects
} from "../session/gameplayOpeningShip.js";
import {
  RUINED_POKEMON_CENTER_GUIDE_POSITION,
  WORKBENCH_INTERACT_DISTANCE,
  WORKBENCH_POSITION
} from "../../gameplayContent.js";
import { getLeppaTreeSurroundingGroundCells } from "../../world/islandWorld.js";
import {
  BULBASAUR_IDLE_PATROL_RADIUS,
  SQUIRTLE_IDLE_PATROL_RADIUS
} from "./robotPatrolConfig.js";
import { resolveTransientNoticeRoute } from "./contextualPromptNotice.js";

const WATER_DROP_SFX_URL = new URL("../soundFx/water-drop..mp3", import.meta.url).href;
const PLAYER_DRIVING_SFX_URL = new URL("../soundFx/driving.mp3", import.meta.url).href;
const SHIP_IMPACT_SFX_URL = new URL("../soundFx/impact.mp3", import.meta.url).href;
const SHIP_FALL_SFX_URL = new URL("../soundFx/cartoon-fall.mp3", import.meta.url).href;
const WOOD_GRAB_SFX_URL = new URL("../soundFx/grab.mp3", import.meta.url).href;
const INSTANCE_OBJECT_SFX_URL = new URL("../soundFx/instance-object.mp3", import.meta.url).href;
const GAMEPLAY_OPENING_HUD_REVEAL_DELAY_MS = 1500;
const BULBASAUR_DRY_GRASS_MISSION_RESTORE_COUNT = 10;
const BULBASAUR_WORKBENCH_GUIDE_START = [8.55, 0.02, -5.7];
const BULBASAUR_WORKBENCH_GUIDE_SPEED = 2.4;
const BULBASAUR_WORKBENCH_GUIDE_WAYPOINT_DISTANCE = 0.08;
const BULBASAUR_WORKBENCH_GUIDE_RAMP_COLLIDER_ID = "workbench-ramp-collider";
const BULBASAUR_WORKBENCH_GUIDE_RAMP_APPROACH_MARGIN = 0.92;
const BULBASAUR_WORKBENCH_GUIDE_SIDE_APPROACH_MARGIN = 1.22;
const BEE_FIELD_FLOWER_GROUP_ID = "water-gun-flower-field-0";
const BEE_FIELD_REPAIR_BOX_LOCKED_ALPHA = 0.5;
const BEE_FIELD_BEE_COUNT = 10;
const BEE_FIELD_BEE_SCALE = 0.15;
const BEE_FIELD_BEE_PATROL_RADIUS_X = 5.8;
const BEE_FIELD_BEE_PATROL_RADIUS_Z = 4.3;
const BEE_FIELD_BEE_BASE_HEIGHT = 1.04;
const BEE_FIELD_BEE_BOB_HEIGHT = 0.22;
const BEE_MODEL_FACE_YAW_OFFSET = Math.PI;
const CHARMANDER_FOLLOW_SPEED = 2.65;
const CHARMANDER_FOLLOW_DISTANCE = 1.28;
const CHARMANDER_CAMPFIRE_LIGHT_DISTANCE = 1.9;
const TIMBURR_FOLLOW_SPEED = 2.45;
const TIMBURR_FOLLOW_DISTANCE = 1.62;
const SQUIRTLE_FOLLOW_SPEED = 2.65;
const SQUIRTLE_FOLLOW_DISTANCE = 1.18;
const BULBASAUR_FOLLOW_SPEED = 2.45;
const BULBASAUR_FOLLOW_DISTANCE = 1.46;
const TALL_GRASS_MIN_FOOTPRINT = 1.28;
const SQUIRTLE_WATER_GUN_SPEED = 4.8;
const SQUIRTLE_WATER_GUN_STAND_DISTANCE = 1.18;
const SQUIRTLE_WATER_GUN_ARRIVE_DISTANCE = 0.08;
const SQUIRTLE_WATER_GUN_SPRAY_DURATION = 0.82;
const SQUIRTLE_WATER_GUN_IMPACT_TIME = 0.34;
const SQUIRTLE_WATER_GUN_ARC_HEIGHT = 0.86;
const SQUIRTLE_WATER_GUN_PARTICLE_COUNT = 24;
const SQUIRTLE_WATER_GUN_STREAM_LANE_COUNT = 5;
const SQUIRTLE_WATER_GUN_STREAM_WIDTH = 0.05;
const SQUIRTLE_WATER_GUN_SPLASH_PARTICLE_COUNT = 18;
const SQUIRTLE_WATER_GUN_SPLASH_DURATION = 0.52;
const SQUIRTLE_WATER_GUN_SPLASH_RADIUS = 0.86;
const SQUIRTLE_WATER_GUN_SFX_INTERVAL = 0.3;
const SQUIRTLE_WATER_GUN_SFX_VOLUME = 0.58;
const SQUIRTLE_WATER_GUN_USE_COUNT_FLAG = "squirtleWaterGunUseCount";
const SQUIRTLE_WATER_GUN_EVOLUTION_MAX_USES = 24;
const SQUIRTLE_WATER_GUN_MAX_SPEED_MULTIPLIER = 1.7;
const SQUIRTLE_WATER_GUN_MIN_SPRAY_DURATION = 0.46;
const SQUIRTLE_WATER_GUN_MIN_IMPACT_TIME = 0.18;
const PLAYER_DRIVING_SFX_VOLUME = 0.48;
const SHIP_IMPACT_SFX_VOLUME = 0.74;
const SHIP_FALL_SFX_VOLUME = 0.5;
const WOOD_GRAB_SFX_VOLUME = 0.68;
const INSTANCE_OBJECT_SFX_VOLUME = 0.66;
const WOOD_COLLECT_POP_DURATION = 0.34;
const WOOD_COLLECT_POP_LIFT = 0.24;
const WOOD_COLLECT_POP_SCALE = 1.65;
const SQUIRTLE_WATER_STAMINA_MAX = 3;
const SQUIRTLE_WATER_STAMINA_COST = 1;
const SQUIRTLE_WATER_STAMINA_RECHARGE_DURATION = 3.2;
const SQUIRTLE_WATER_STAMINA_BAR_WIDTH = 1.72;
const SQUIRTLE_WATER_STAMINA_BAR_HEIGHT = 0.2;
const SQUIRTLE_WATER_STAMINA_VISUAL_DECREASE_DURATION = 0.28;
const SQUIRTLE_WATER_STAMINA_VISUAL_INCREASE_DURATION = 0.16;
const SQUIRTLE_CHARGING_PARTICLE_COUNT = 14;
const SQUIRTLE_CHARGING_PARTICLE_RADIUS = 0.72;
const SQUIRTLE_CHARGING_PARTICLE_DURATION = 1.15;
const WATER_GUN_FIRST_USE_PROMPT_FLAG = "waterGunFirstUsePromptDismissed";
const WATER_GUN_FIRST_USE_PROMPT_TEXT = "Press LT to use Squirtle";
const SQUIRTLE_REASSEMBLY_PART_SCALE = 0.5;
const SQUIRTLE_MODEL_FACE_YAW_OFFSET = Math.PI;
const BULBASAUR_MODEL_FACE_YAW_OFFSET = Math.PI;
const ROBOT_MODEL_SCALE = 0.5;
const BULBASAUR_ROBOT_MODEL_SCALE = ROBOT_MODEL_SCALE * 1.3;
const ROBOT_REPAIR_BOX_FLOAT_HEIGHT = 0.74;
const ROBOT_REPAIR_BOX_BOB_HEIGHT = 0.06;
const ROBOT_REPAIR_BOX_BOB_SPEED = 2.2;
const ROBOT_REPAIR_BOX_SPIN_SPEED = Math.PI * 0.826;
const ROBOT_REPAIR_BOX_MODEL_PITCH_OFFSET = 0;
const ROBOT_REPAIR_BOX_OPEN_PITCH = Math.PI * 0.58;
const ROBOT_REPAIR_BOX_OPEN_ROLL = Math.PI * 0.08;
const ROBOT_REPAIR_BOX_OPEN_LIFT = 0.18;
const ROBOT_REPAIR_BOX_OPEN_BACKSTEP = 0.28;
const BULBASAUR_REVEAL_BOX_DURATION = 1.15;
const BULBASAUR_REVEAL_VISIBLE_PROGRESS = 0.56;
const REPAIR_BOX_PROMPT_DISTANCE = 2.8;
const REPAIR_BOX_ACTIVE_TINT = Object.freeze([0.38, 1.72, 0.42]);
const REPAIR_BOX_ACTIVE_TINT_STRENGTH = 0.68;
const REPAIR_BOX_INACTIVE_ALPHA = 0.5;
const ROBOT_IDLE_PATROL_SPEED = 0.82;
const ROBOT_IDLE_PATROL_PAUSE_DURATION = 0.75;
const ROBOT_IDLE_PATROL_ARRIVE_DISTANCE = 0.08;
const BULBASAUR_LEAFAGE_SPEED = 2.25;
const BULBASAUR_LEAFAGE_STAND_DISTANCE = 1.04;
const BULBASAUR_LEAFAGE_ARRIVE_DISTANCE = 0.08;
const BULBASAUR_LEAFAGE_CAST_DURATION = 0.58;
const BULBASAUR_LEAFAGE_IMPACT_TIME = 0.22;
const PLAYER_MODEL_SCALE = 0.75;
const PLAYER_MODEL_TURN_SPEED = 14;
const GRASS_PLAYER_BEND_RADIUS = 0.92;
const GRASS_PLAYER_BEND_OFFSET = 0.14;
const GRASS_PLAYER_BEND_SWAY = 0.18;
const GRASS_OBJECT_COLLISION_ALPHA = 0.5;
const GRASS_OBJECT_COLLISION_BASE_RADIUS = 0.58;
const FLOWER_ARRANGEMENT_OFFSETS = Object.freeze([
  [-0.34, -0.24, 0.82],
  [-0.16, 0.08, 0.66],
  [-0.06, -0.34, 0.58],
  [0.12, -0.08, 0.9],
  [0.24, 0.22, 0.72],
  [0.38, -0.18, 0.64],
  [0.02, 0.3, 0.78]
]);
const FLOWER_PLAYER_REACT_RADIUS = 1.26;
const FLOWER_PLAYER_REACT_OFFSET = 0.34;
const FLOWER_PLAYER_REACT_SCALE = 0.34;
const FLOWER_AMBIENT_WOBBLE = 0.055;
const LEPPA_TREE_DANCE_SWAY = 0.28;
const LEPPA_TREE_DANCE_SPEED = 0.0056;
const LEPPA_TREE_MUSIC_NOTE_EMIT_INTERVAL = 0.36;
const LEPPA_TREE_MUSIC_NOTE_MAX_PARTICLES = 12;
const LEPPA_TREE_MUSIC_NOTE_BURST_COUNT = 3;
const LEPPA_TREE_MUSIC_NOTE_DURATION = 2.45;
const LEPPA_TREE_MUSIC_NOTE_BASE_HEIGHT = 1.72;
const LEPPA_TREE_MUSIC_NOTE_IMAGE_ASPECTS = Object.freeze([
  190 / 235,
  97 / 227,
  130 / 247
]);
const LEPPA_TREE_MISSION_PARTICLE_COUNT = 9;
const LEPPA_TREE_MISSION_PARTICLE_RADIUS = 0.72;
const LEPPA_TREE_MISSION_PARTICLE_BASE_HEIGHT = 0.62;
const LEPPA_TREE_MISSION_PARTICLE_HEIGHT = 1.64;
const SAVE_POINT_STAR_PARTICLE_COUNT = 10;
const SAVE_POINT_STAR_PARTICLE_RADIUS = 0.64;
const SAVE_POINT_STAR_PARTICLE_HEIGHT = 1.18;
const SAVE_POINT_STAR_PARTICLE_DURATION = 1.9;
const FPS_PANEL_UPDATE_INTERVAL = 0.25;
const CAMERA_DEBUG_ENABLED = (() => {
  try {
    return new URLSearchParams(globalThis.location?.search || "").get("cameraDebug") === "1";
  } catch {
    return false;
  }
})();

function createFpsPanelController(fpsPanelElement) {
  let elapsed = 0;
  let frames = 0;

  function classifyFps(fps) {
    if (fps < 30) {
      return "low";
    }

    if (fps < 50) {
      return "mid";
    }

    return "good";
  }

  return {
    update(rawDeltaTime) {
      if (!fpsPanelElement || !(rawDeltaTime > 0)) {
        return;
      }

      elapsed += rawDeltaTime;
      frames += 1;

      if (elapsed < FPS_PANEL_UPDATE_INTERVAL) {
        return;
      }

      const fps = Math.round(frames / elapsed);
      fpsPanelElement.textContent = `FPS ${fps}`;
      fpsPanelElement.dataset.fpsQuality = classifyFps(fps);
      elapsed = 0;
      frames = 0;
    }
  };
}

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
  const hash = getStableHash(seed);
  const quarterTurn = (hash % 4) * Math.PI * 0.5;
  const smallTurn = ((hash % 13) - 6) * 0.035;
  return quarterTurn + smallTurn;
}

function getStableHash(seed) {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function getTallGrassSway(groundGrassPatch, shouldRustle, now) {
  const position = groundGrassPatch?.position || [0, 0, 0];
  const ambient = Math.sin(now * 0.0018 + position[0] * 0.63 + position[2] * 0.41) * 0.018;
  const rustle = shouldRustle ? Math.sin(now * 0.024) * 0.09 : 0;
  return ambient + rustle;
}

function getFlowerArrangementBillboards({
  groundFlowerPatch,
  texture,
  playerPosition,
  revivalScale,
  now
}) {
  if (!groundFlowerPatch?.position || !texture) {
    return [];
  }

  const [patchX, patchY, patchZ] = groundFlowerPatch.position;
  const seedHash = getStableHash(`${groundFlowerPatch.cellId || ""}:${groundFlowerPatch.id || ""}`);
  const playerDeltaX = Array.isArray(playerPosition) ? patchX - playerPosition[0] : 0;
  const playerDeltaZ = Array.isArray(playerPosition) ? patchZ - playerPosition[2] : 0;
  const playerDistance = Array.isArray(playerPosition) ?
    Math.hypot(playerDeltaX, playerDeltaZ) :
    Infinity;
  const playerDirectionX = playerDistance > 0.001 ? playerDeltaX / playerDistance : 0;
  const playerDirectionZ = playerDistance > 0.001 ? playerDeltaZ / playerDistance : 1;
  const playerReact = Math.max(
    0,
    1 - playerDistance / FLOWER_PLAYER_REACT_RADIUS
  );
  const playerReactStrength = playerReact * playerReact;

  return FLOWER_ARRANGEMENT_OFFSETS.map(([offsetX, offsetZ, scale], index) => {
    const jitterHash = getStableHash(`${seedHash}:${index}`);
    const jitterX = (((jitterHash % 11) - 5) / 5) * 0.045;
    const jitterZ = ((((jitterHash >> 4) % 11) - 5) / 5) * 0.045;
    const phase = (seedHash % 97) * 0.09 + index * 1.47;
    const wobble = Math.sin(now * 0.0042 + phase) * FLOWER_AMBIENT_WOBBLE;
    const scatter = FLOWER_PLAYER_REACT_OFFSET * playerReactStrength * (0.68 + scale * 0.28);
    const lift = Math.sin(playerReactStrength * Math.PI) * 0.08;
    const arrangementScale = scale * revivalScale * (1 + FLOWER_PLAYER_REACT_SCALE * playerReactStrength);

    return {
      texture,
      position: [
        patchX + offsetX + jitterX + playerDirectionX * scatter,
        patchY + lift + index * 0.002,
        patchZ + offsetZ + jitterZ + playerDirectionZ * scatter
      ],
      size: groundFlowerPatch.size.map((value) => value * arrangementScale),
      rotation: wobble + playerReactStrength * 0.26 * (index % 2 === 0 ? 1 : -1)
    };
  });
}

function getGrassPlayerBend(groundGrassPatch, playerPosition) {
  if (!Array.isArray(groundGrassPatch?.position) || !Array.isArray(playerPosition)) {
    return {
      offsetX: 0,
      offsetZ: 0,
      swayStrength: 0
    };
  }

  let deltaX = groundGrassPatch.position[0] - playerPosition[0];
  let deltaZ = groundGrassPatch.position[2] - playerPosition[2];
  let distance = Math.hypot(deltaX, deltaZ);

  if (distance >= GRASS_PLAYER_BEND_RADIUS) {
    return {
      offsetX: 0,
      offsetZ: 0,
      swayStrength: 0
    };
  }

  if (distance < 0.001) {
    deltaX = 1;
    deltaZ = 0;
    distance = 0.001;
  }

  const proximity = 1 - distance / GRASS_PLAYER_BEND_RADIUS;
  const strength = proximity * proximity;
  const directionX = deltaX / distance;
  const directionZ = deltaZ / distance;

  return {
    offsetX: directionX * GRASS_PLAYER_BEND_OFFSET * strength,
    offsetZ: directionZ * GRASS_PLAYER_BEND_OFFSET * strength,
    swayStrength: directionX * GRASS_PLAYER_BEND_SWAY * strength
  };
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function easeOutCubic(value) {
  const progress = clamp01(value);
  return 1 - Math.pow(1 - progress, 3);
}

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

function moveValueToward(current, target, maxStep) {
  if (Math.abs(target - current) <= maxStep) {
    return target;
  }

  return current + Math.sign(target - current) * maxStep;
}

function isOpeningLeppaTreeRequestActive(storyState) {
  return Boolean(
    storyState?.flags?.squirtleLeppaRequestAvailable &&
    !storyState.flags.leppaTreeRevived
  );
}

function getShortestAngleDelta(fromAngle, toAngle) {
  return Math.atan2(Math.sin(toAngle - fromAngle), Math.cos(toAngle - fromAngle));
}

function rotateAngleToward(fromAngle, toAngle, maxStep) {
  const delta = getShortestAngleDelta(fromAngle, toAngle);

  if (Math.abs(delta) <= maxStep) {
    return toAngle;
  }

  return fromAngle + Math.sign(delta) * maxStep;
}

function createRepeatingSfxController({
  src,
  interval = SQUIRTLE_WATER_GUN_SFX_INTERVAL,
  volume = SQUIRTLE_WATER_GUN_SFX_VOLUME
} = {}) {
  const audioPool = [];
  let nextPlayAt = 0;

  function createAudio() {
    if (!src || typeof Audio !== "function") {
      return null;
    }

    const audio = new Audio(src);
    audio.preload = "auto";
    audio.volume = volume;
    return audio;
  }

  function getAudio() {
    const availableAudio = audioPool.find((audio) => {
      return audio.paused || audio.ended;
    });

    if (availableAudio) {
      return availableAudio;
    }

    const audio = createAudio();
    if (!audio) {
      return null;
    }

    audioPool.push(audio);
    return audio;
  }

  function playOnce() {
    const audio = getAudio();
    if (!audio) {
      return;
    }

    audio.loop = false;
    audio.volume = volume;

    try {
      audio.currentTime = 0;
    } catch {
      // Some browser audio objects disallow seeking before metadata is ready.
    }

    const playResult = audio.play?.();
    if (playResult?.catch) {
      playResult.catch(() => {});
    }
  }

  return {
    update({ active, nowSeconds }) {
      if (!active) {
        nextPlayAt = 0;
        return;
      }

      if (nowSeconds < nextPlayAt) {
        return;
      }

      playOnce();
      nextPlayAt = nowSeconds + interval;
    }
  };
}

function createLoopingSfxController({
  src,
  volume = PLAYER_DRIVING_SFX_VOLUME
} = {}) {
  let audio = null;
  let activeLastFrame = false;

  function getAudio() {
    if (audio || !src || typeof Audio !== "function") {
      return audio;
    }

    audio = new Audio(src);
    audio.preload = "auto";
    audio.loop = true;
    audio.volume = volume;
    return audio;
  }

  function play() {
    const loopAudio = getAudio();
    if (!loopAudio || activeLastFrame) {
      return;
    }

    loopAudio.loop = true;
    loopAudio.volume = volume;
    const playResult = loopAudio.play?.();
    if (playResult?.catch) {
      playResult.catch(() => {});
    }
  }

  function stop() {
    if (!audio || !activeLastFrame) {
      return;
    }

    audio.pause?.();
    try {
      audio.currentTime = 0;
    } catch {
      // Some browser audio objects disallow seeking before metadata is ready.
    }
  }

  return {
    update({ active }) {
      if (active) {
        play();
      } else {
        stop();
      }

      activeLastFrame = Boolean(active);
    }
  };
}

export function startGameLoop({
  camera,
  mount,
  fpsPanel = null,
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
  gameplayUiVisibility = null,
  rendering
}) {
  let previousTime = performance.now();
  let movementQuestReported = false;
  let movementQuestDistance = 0;
  let gameplayOpeningHudHidden = false;
  let gameplayOpeningHudRevealAt = null;
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
  const fpsPanelController = createFpsPanelController(fpsPanel);
  const waterGunSfxController = createRepeatingSfxController({
    src: WATER_DROP_SFX_URL
  });
  const playerDrivingSfxController = createLoopingSfxController({
    src: PLAYER_DRIVING_SFX_URL,
    volume: PLAYER_DRIVING_SFX_VOLUME
  });
  const shipFallSfxController = createLoopingSfxController({
    src: SHIP_FALL_SFX_URL,
    volume: SHIP_FALL_SFX_VOLUME
  });
  const shipImpactSfxController = createRepeatingSfxController({
    src: SHIP_IMPACT_SFX_URL,
    interval: Number.POSITIVE_INFINITY,
    volume: SHIP_IMPACT_SFX_VOLUME
  });
  const woodGrabSfxController = createRepeatingSfxController({
    src: WOOD_GRAB_SFX_URL,
    interval: 0,
    volume: WOOD_GRAB_SFX_VOLUME
  });
  const instanceObjectSfxController = createRepeatingSfxController({
    src: INSTANCE_OBJECT_SFX_URL,
    interval: 0,
    volume: INSTANCE_OBJECT_SFX_VOLUME
  });
  const woodCollectPopEffects = [];
  let repairBoxElapsed = 0;
  let waterGunSfxBurstUntilSeconds = 0;
  let cameraDebugElement = null;
  const cameraDebugErrors = [];

  function getRuntimeNowSeconds() {
    const nowMs =
      typeof performance !== "undefined" && typeof performance.now === "function" ?
        performance.now() :
        Date.now();
    return nowMs * 0.001;
  }

  function playInstanceObjectSfx() {
    instanceObjectSfxController.update({
      active: true,
      nowSeconds: getRuntimeNowSeconds()
    });
  }

  function triggerWaterGunSfxBurst(duration = SQUIRTLE_WATER_GUN_SPRAY_DURATION) {
    const nowSeconds = getRuntimeNowSeconds();
    waterGunSfxBurstUntilSeconds = Math.max(
      waterGunSfxBurstUntilSeconds,
      nowSeconds + duration
    );
  }

  function restoreActiveZoomPresetOnMovement(playerPosition) {
    if (!Array.isArray(playerPosition) || !camera.isTargetTransitionActive()) {
      return;
    }

    const currentPose = camera.getPose?.() || {};
    const activePreset = cameraZoomPresetController.getCurrentPreset?.() || {};

    camera.setPose({
      target: currentPose.target || playerPosition,
      direction: cameraOrbit.getDirection?.() || currentPose.direction,
      zoom: activePreset.zoom,
      distance: activePreset.distance
    });
    cameraZoomPresetController.applyCurrent?.();
    camera.follow(playerPosition);
  }

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

  function getSquirtleModelYawToward(fromPosition, toPosition) {
    return getYawToward(fromPosition, toPosition) + SQUIRTLE_MODEL_FACE_YAW_OFFSET;
  }

  function getRobotModelYawToward(fromPosition, toPosition, modelFaceYawOffset) {
    return getYawToward(fromPosition, toPosition) + modelFaceYawOffset;
  }

  function getSquirtleLogicalFacingYaw() {
    return (session.actTwoSquirtle?.modelInstance?.yaw || 0) - SQUIRTLE_MODEL_FACE_YAW_OFFSET;
  }

  function getGroundCellCenterPosition(groundCell) {
    const offset = groundCell?.offset || [0, 0, 0];
    return [
      offset[0] || 0,
      (offset[1] || 0) + 0.04,
      offset[2] || 0
    ];
  }

  function findGrassPatchForGroundCell(groundCell) {
    if (!groundCell?.id || !Array.isArray(session.groundGrassPatches)) {
      return null;
    }

    return session.groundGrassPatches.find((patch) => patch?.cellId === groundCell.id) || null;
  }

  function isAliveGrassPatchForGroundCell(groundCell) {
    return findGrassPatchForGroundCell(groundCell)?.state === "alive";
  }

  function syncSquirtleModelInstance() {
    if (!session.actTwoSquirtle?.modelInstance || !Array.isArray(session.actTwoSquirtle.position)) {
      return;
    }

    session.actTwoSquirtle.modelInstance.offset = [...session.actTwoSquirtle.position];
    session.actTwoSquirtle.modelInstance.scale = ROBOT_MODEL_SCALE;
    if (session.actTwoSquirtle.repairModuleInstance) {
      syncRepairBoxInstance(
        session.actTwoSquirtle.repairModuleInstance,
        session.actTwoSquirtle.position,
        Boolean(
          !session.actTwoSquirtle.recovered &&
          session.actTwoSquirtle.assemblyState !== "assembled" &&
          !session.actTwoSquirtle.reassembly?.active
        )
      );
    }
    syncInteractablePosition("squirtle", session.actTwoSquirtle.position);
  }

  function getRepairBoxFloatOffset(position) {
    const bob = Math.sin(repairBoxElapsed * ROBOT_REPAIR_BOX_BOB_SPEED) * ROBOT_REPAIR_BOX_BOB_HEIGHT;
    return [
      position[0],
      position[1] + ROBOT_REPAIR_BOX_FLOAT_HEIGHT + bob,
      position[2]
    ];
  }

  function getEncounterRepairBoxPosition(encounter) {
    return encounter?.repairBoxPosition || encounter?.repairPosition || null;
  }

  function getEncounterRepairBoxOpeningProgress(encounter) {
    const revealBoxOpening = encounter?.revealBoxOpening;

    if (!revealBoxOpening?.active) {
      return 0;
    }

    return clamp01(Number(revealBoxOpening.elapsed || 0) / Number(revealBoxOpening.duration || 1));
  }

  function syncRepairBoxInstance(instance, basePosition, active, { openingProgress = 0 } = {}) {
    if (!instance || !Array.isArray(basePosition)) {
      return;
    }

    const opened = easeOutCubic(openingProgress);

    instance.baseOffset = [...basePosition];
    instance.offset = getRepairBoxFloatOffset(basePosition);
    instance.repairBoxBaseYaw ??= Number(instance.yaw || 0);
    instance.repairBoxBaseScale ??= Number(instance.scale || 1);
    instance.scale = instance.repairBoxBaseScale;
    instance.yaw = instance.repairBoxBaseYaw + repairBoxElapsed * ROBOT_REPAIR_BOX_SPIN_SPEED;
    instance.pitch = ROBOT_REPAIR_BOX_MODEL_PITCH_OFFSET;
    instance.roll = 0;

    if (opened > 0) {
      instance.repairBoxOpenYaw ??= instance.yaw;
      instance.yaw = instance.repairBoxOpenYaw;
      instance.pitch = ROBOT_REPAIR_BOX_MODEL_PITCH_OFFSET - ROBOT_REPAIR_BOX_OPEN_PITCH * opened;
      instance.roll = ROBOT_REPAIR_BOX_OPEN_ROLL * opened;
      instance.offset = [
        instance.offset[0],
        instance.offset[1] + ROBOT_REPAIR_BOX_OPEN_LIFT * opened,
        instance.offset[2] + ROBOT_REPAIR_BOX_OPEN_BACKSTEP * opened
      ];
      instance.scale = instance.repairBoxBaseScale * (1 - 0.08 * opened);
    } else {
      instance.repairBoxOpenYaw = null;
    }

    instance.active = Boolean(active);
  }

  function syncDismantledEncounterModule(encounter) {
    if (!encounter?.repairModuleInstance) {
      return;
    }

    const openingProgress = getEncounterRepairBoxOpeningProgress(encounter);

    syncRepairBoxInstance(
      encounter.repairModuleInstance,
      getEncounterRepairBoxPosition(encounter),
      openingProgress > 0 || !encounter.visible,
      { openingProgress }
    );
  }

  function syncBulbasaurModelInstance() {
    const encounter = session.bulbasaurEncounter;

    if (!encounter?.modelInstance) {
      syncDismantledEncounterModule(encounter);
      return;
    }

    syncDismantledEncounterModule(encounter);
    encounter.modelInstance.active = Boolean(encounter.visible && Array.isArray(encounter.position));
    encounter.modelInstance.scale = BULBASAUR_ROBOT_MODEL_SCALE;

    if (Array.isArray(encounter.position)) {
      encounter.modelInstance.offset = [...encounter.position];
    }
  }

  function syncCompanionRepairModules() {
    syncDismantledEncounterModule(session.charmanderEncounter);
    syncDismantledEncounterModule(session.timburrEncounter);
  }

  function isBeeFieldRestored() {
    return (controls.storyState?.flags?.restoredFlowerBedHabitatIds || [])
      .includes(BEE_FIELD_FLOWER_GROUP_ID);
  }

  function syncBeeFieldRepairBox() {
    const beeFieldRepairBox = session.beeFieldRepairBox;

    if (!beeFieldRepairBox) {
      return;
    }

    const basePosition = beeFieldRepairBox.baseOffset || beeFieldRepairBox.offset;
    const unlocked = isBeeFieldRestored();
    const opened = Boolean(controls.storyState?.flags?.beeFieldRepairBoxOpened);

    syncRepairBoxInstance(
      beeFieldRepairBox,
      basePosition,
      true,
      { openingProgress: opened ? 1 : 0 }
    );
    syncInteractablePosition("beeFieldRepairBox", basePosition);
    beeFieldRepairBox.alpha = unlocked ? 1 : BEE_FIELD_REPAIR_BOX_LOCKED_ALPHA;
    beeFieldRepairBox.tint = unlocked && !opened ? REPAIR_BOX_ACTIVE_TINT : null;
    beeFieldRepairBox.tintStrength = unlocked && !opened ? REPAIR_BOX_ACTIVE_TINT_STRENGTH : 0;
  }

  function getBeeFieldCenterPosition() {
    const repairBox = session.beeFieldRepairBox;

    if (Array.isArray(repairBox?.baseOffset)) {
      return repairBox.baseOffset;
    }

    if (Array.isArray(repairBox?.offset)) {
      return repairBox.offset;
    }

    const patches = (session.groundFlowerPatches || [])
      .filter((patch) => {
        return patch.habitatGroupId === BEE_FIELD_FLOWER_GROUP_ID &&
          Array.isArray(patch.position);
      });

    if (patches.length === 0) {
      return null;
    }

    const total = patches.reduce((sum, patch) => {
      sum[0] += patch.position[0];
      sum[1] += patch.position[1] || 0;
      sum[2] += patch.position[2];
      return sum;
    }, [0, 0, 0]);

    return [
      total[0] / patches.length,
      total[1] / patches.length,
      total[2] / patches.length
    ];
  }

  function createBeeFieldBeeInstance(index) {
    return {
      id: `bee-field-bee-${index}`,
      offset: [0, 0, 0],
      scale: BEE_FIELD_BEE_SCALE,
      yaw: BEE_MODEL_FACE_YAW_OFFSET,
      pitch: 0,
      roll: 0,
      active: true,
      patrolAngle: (index / BEE_FIELD_BEE_COUNT) * Math.PI * 2,
      patrolRadiusScale: 0.62 + (index % 5) * 0.09,
      angularSpeed: 0.42 + (index % 4) * 0.055,
      bobPhase: index * 1.71,
      bobSpeed: 1.7 + (index % 3) * 0.18
    };
  }

  function syncBeeFieldBees(deltaTime) {
    if (!Array.isArray(session.beeInstances)) {
      return;
    }

    const opened = Boolean(controls.storyState?.flags?.beeFieldRepairBoxOpened);
    const center = getBeeFieldCenterPosition();

    if (!opened || !session.beeModel || !center) {
      session.beeInstances.length = 0;
      return;
    }

    session.beePatrolState ||= { elapsed: 0 };
    session.beePatrolState.elapsed += Math.max(0, Number(deltaTime) || 0);

    while (session.beeInstances.length < BEE_FIELD_BEE_COUNT) {
      session.beeInstances.push(createBeeFieldBeeInstance(session.beeInstances.length));
    }

    if (session.beeInstances.length > BEE_FIELD_BEE_COUNT) {
      session.beeInstances.length = BEE_FIELD_BEE_COUNT;
    }

    const elapsed = session.beePatrolState.elapsed;

    session.beeInstances.forEach((bee, index) => {
      const angle = bee.patrolAngle + elapsed * bee.angularSpeed;
      const radiusScale = bee.patrolRadiusScale || 1;
      const wobble = Math.sin(elapsed * 1.3 + bee.bobPhase) * 0.28;
      const x = center[0] + Math.cos(angle) * BEE_FIELD_BEE_PATROL_RADIUS_X * radiusScale +
        Math.sin(angle * 2 + bee.bobPhase) * 0.26;
      const z = center[2] + Math.sin(angle) * BEE_FIELD_BEE_PATROL_RADIUS_Z * radiusScale +
        Math.cos(angle * 2 + bee.bobPhase) * 0.18;
      const y = (center[1] || 0) + BEE_FIELD_BEE_BASE_HEIGHT +
        Math.sin(elapsed * bee.bobSpeed + bee.bobPhase) * BEE_FIELD_BEE_BOB_HEIGHT;

      bee.active = true;
      bee.offset[0] = x;
      bee.offset[1] = y;
      bee.offset[2] = z;
      bee.scale = BEE_FIELD_BEE_SCALE * (0.9 + (index % 3) * 0.06);
      bee.yaw = angle + Math.PI * 0.5 + BEE_MODEL_FACE_YAW_OFFSET;
      bee.pitch = Math.sin(elapsed * 1.8 + bee.bobPhase) * 0.04;
      bee.roll = wobble * 0.08;
    });
  }

  function appendGrassCollisionObject(objects, position, radius = GRASS_OBJECT_COLLISION_BASE_RADIUS) {
    if (!Array.isArray(position) || position.length < 3) {
      return;
    }

    const x = Number(position[0]);
    const z = Number(position[2]);

    if (!Number.isFinite(x) || !Number.isFinite(z)) {
      return;
    }

    objects.push({
      position,
      radius
    });
  }

  function getGrassCollisionObjects() {
    const objects = [];

    if (session.playerCharacter) {
      appendGrassCollisionObject(objects, session.playerCharacter.getPosition?.(), 0.52);
    }

    appendGrassCollisionObject(objects, session.chopperNpcActor?.bodyInstance?.offset, 0.54);

    if (session.actTwoSquirtle?.modelInstance?.active) {
      appendGrassCollisionObject(
        objects,
        session.actTwoSquirtle.position || session.actTwoSquirtle.modelInstance.offset,
        0.48
      );
    }

    if (session.bulbasaurEncounter?.visible) {
      appendGrassCollisionObject(
        objects,
        session.bulbasaurEncounter.position || session.bulbasaurEncounter.modelInstance?.offset,
        0.66
      );
    }

    if (session.charmanderEncounter?.visible) {
      appendGrassCollisionObject(objects, session.charmanderEncounter.position, 0.54);
    }

    if (session.timburrEncounter?.visible) {
      appendGrassCollisionObject(objects, session.timburrEncounter.position, 0.56);
    }

    for (const repairModuleInstance of session.robotRepairModuleInstances || []) {
      if (repairModuleInstance?.active !== false) {
        appendGrassCollisionObject(
          objects,
          repairModuleInstance.baseOffset || repairModuleInstance.offset,
          0.62
        );
      }
    }

    return objects;
  }

  function getGrassObjectCollisionAlpha(groundGrassPatch, objects) {
    if (!Array.isArray(groundGrassPatch?.position) || !objects.length) {
      return 1;
    }

    const patchRadius = Math.max(
      groundGrassPatch.size?.[0] || TALL_GRASS_MIN_FOOTPRINT,
      groundGrassPatch.size?.[1] || TALL_GRASS_MIN_FOOTPRINT
    ) * 0.42;

    for (const object of objects) {
      const radius = patchRadius + object.radius;
      const deltaX = groundGrassPatch.position[0] - object.position[0];
      const deltaZ = groundGrassPatch.position[2] - object.position[2];

      if (deltaX * deltaX + deltaZ * deltaZ <= radius * radius) {
        return GRASS_OBJECT_COLLISION_ALPHA;
      }
    }

    return 1;
  }

  function syncActiveRepairBoxHighlight() {
    const repairModuleInstances = [
      session.actTwoSquirtle?.repairModuleInstance,
      session.bulbasaurEncounter?.repairModuleInstance,
      session.charmanderEncounter?.repairModuleInstance,
      session.timburrEncounter?.repairModuleInstance
    ];
    let highlighted = false;

    for (const repairModuleInstance of repairModuleInstances) {
      if (!repairModuleInstance) {
        continue;
      }

      if (!highlighted && repairModuleInstance.active) {
        repairModuleInstance.tint = REPAIR_BOX_ACTIVE_TINT;
        repairModuleInstance.tintStrength = REPAIR_BOX_ACTIVE_TINT_STRENGTH;
        repairModuleInstance.alpha = 1;
        highlighted = true;
        continue;
      }

      repairModuleInstance.tint = null;
      repairModuleInstance.tintStrength = 0;
      repairModuleInstance.alpha = repairModuleInstance.active ? REPAIR_BOX_INACTIVE_ALPHA : 1;
    }
  }

  function getSelectedRepairBoxParticleTarget() {
    const repairModuleInstances = [
      session.actTwoSquirtle?.repairModuleInstance,
      session.bulbasaurEncounter?.repairModuleInstance,
      session.charmanderEncounter?.repairModuleInstance,
      session.timburrEncounter?.repairModuleInstance
    ];
    const selectedRepairModule = repairModuleInstances.find((instance) => {
      return instance?.active && Array.isArray(instance.offset);
    });

    return selectedRepairModule ?
      {
        id: `${selectedRepairModule.id}-rustling-particles`,
        position: [...selectedRepairModule.offset]
      } :
      null;
  }

  function getRepairBoxPromptPosition(encounter) {
    const basePosition =
      getEncounterRepairBoxPosition(encounter) ||
      encounter?.repairModuleInstance?.baseOffset ||
      encounter?.repairModuleInstance?.offset;

    return Array.isArray(basePosition) ? [...basePosition] : null;
  }

  function getNearbyRepairBoxPrompt(playerPosition) {
    if (!Array.isArray(playerPosition)) {
      return null;
    }

    const repairBoxTargets = [
      {
        name: "Squirtle",
        encounter: session.actTwoSquirtle
      },
      {
        name: "Bulbasaur",
        encounter: session.bulbasaurEncounter
      },
      {
        name: "Charmander",
        encounter: session.charmanderEncounter
      },
      {
        name: "Timburr",
        encounter: session.timburrEncounter
      }
    ];
    let nearestPrompt = null;
    let nearestDistance = Infinity;

    for (const repairBoxTarget of repairBoxTargets) {
      if (!repairBoxTarget?.encounter?.repairModuleInstance?.active) {
        continue;
      }

      const worldPosition = getRepairBoxPromptPosition(repairBoxTarget.encounter);

      if (!worldPosition) {
        continue;
      }

      const distance = Math.hypot(
        playerPosition[0] - worldPosition[0],
        playerPosition[2] - worldPosition[2]
      );

      if (distance <= REPAIR_BOX_PROMPT_DISTANCE && distance < nearestDistance) {
        nearestPrompt = {
          text: repairBoxTarget.name,
          worldPosition
        };
        nearestDistance = distance;
      }
    }

    return nearestPrompt;
  }

  function syncInteractablePosition(interactableId, position) {
    if (!Array.isArray(position) || !Array.isArray(session.interactables)) {
      return;
    }

    const interactable = session.interactables.find((entry) => entry.id === interactableId);
    if (interactable) {
      interactable.position = [...position];
    }
  }

  function syncWorkbenchInteractable() {
    syncInteractablePosition("workbench", WORKBENCH_POSITION);
    const workbench = session.interactables?.find((entry) => entry.id === "workbench");
    if (workbench) {
      workbench.interactDistance = WORKBENCH_INTERACT_DISTANCE;
    }
  }

  function syncPokemonCenterWorkshopVisualState() {
    const assembled = Boolean(controls.storyState?.flags?.challengesUnlocked);

    if (session.pokemonCenterWorkshopAssembledInstance) {
      session.pokemonCenterWorkshopAssembledInstance.active = assembled;
    }

    for (const instance of session.pokemonCenterWorkshopDismantledInstances || []) {
      instance.active = !assembled;
    }
  }

  function getPlayerModelYawFromMovement(deltaX, deltaZ) {
    return Math.atan2(deltaZ, deltaX);
  }

  function syncPlayerModelInstance(deltaTime, movementDelta = null) {
    if (!session.playerModelInstance || !session.playerCharacter) {
      return;
    }

    session.playerModelInstance.offset = session.playerCharacter.getPosition();
    session.playerModelInstance.scale = PLAYER_MODEL_SCALE;

    if (movementDelta) {
      const [deltaX, deltaZ] = movementDelta;
      if (Math.hypot(deltaX, deltaZ) > 0.0005) {
        const targetYaw = getPlayerModelYawFromMovement(deltaX, deltaZ);
        session.playerModelInstance.yaw = rotateAngleToward(
          session.playerModelInstance.yaw || 0,
          targetYaw,
          PLAYER_MODEL_TURN_SPEED * deltaTime
        );
      }
    }

    session.playerModelInstance.active = true;
  }

  function createPrimitiveModel(model, primitive) {
    return {
      ...model,
      primitives: [primitive]
    };
  }

  function getSquirtleAssemblyPartPose(index, progress) {
    const scatterProgress = easeOutCubic(progress);
    const angle = index * 1.78;
    const radius = 0.42 + (index % 4) * 0.14;
    const lifted = 0.04 + (index % 3) * 0.035;
    const startX = Math.cos(angle) * radius;
    const startZ = Math.sin(angle) * radius;

    return {
      offset: [
        lerp(startX, 0, scatterProgress),
        lerp(lifted, 0, scatterProgress),
        lerp(startZ, 0, scatterProgress)
      ],
      yaw: lerp(((index % 5) - 2) * 0.62, 0, scatterProgress),
      pitch: lerp(((index % 3) - 1) * 0.42, 0, scatterProgress),
      roll: lerp(((index % 4) - 1.5) * 0.54, 0, scatterProgress)
    };
  }

  function updateSquirtleReassembly(deltaTime) {
    const squirtle = session.actTwoSquirtle;
    const reassembly = squirtle?.reassembly;

    if (!reassembly?.active) {
      return;
    }

    const duration = Math.max(0.01, reassembly.duration || 1.25);
    reassembly.elapsed = Math.min(duration, (reassembly.elapsed || 0) + deltaTime);
    reassembly.progress = clamp01(reassembly.elapsed / duration);

    if (reassembly.progress < 1) {
      return;
    }

    const onComplete = reassembly.onComplete;
    reassembly.active = false;
    reassembly.onComplete = null;
    squirtle.visible = true;
    squirtle.assemblyState = "assembled";
    syncSquirtleModelInstance();

    if (typeof onComplete === "function") {
      onComplete();
    }
  }

  function createRobotPatrolState(origin, radius) {
    return {
      origin: [...origin],
      waypointIndex: 0,
      pauseTimer: ROBOT_IDLE_PATROL_PAUSE_DURATION,
      points: [
        [origin[0] - radius * 0.72, origin[1], origin[2] - radius * 0.34],
        [origin[0] + radius * 0.66, origin[1], origin[2] - radius * 0.48],
        [origin[0] + radius * 0.58, origin[1], origin[2] + radius * 0.42],
        [origin[0] - radius * 0.64, origin[1], origin[2] + radius * 0.52]
      ]
    };
  }

  function updateRobotIdlePatrol(robot, {
    deltaTime,
    radius,
    modelFaceYawOffset
  }) {
    if (!robot?.modelInstance || !Array.isArray(robot.position)) {
      return;
    }

    if (
      !robot.patrol ||
      Math.hypot(
        robot.position[0] - robot.patrol.origin[0],
        robot.position[2] - robot.patrol.origin[2]
      ) > radius * 1.8
    ) {
      robot.patrol = createRobotPatrolState(robot.position, radius);
    }

    if (robot.patrol.pauseTimer > 0) {
      robot.patrol.pauseTimer = Math.max(0, robot.patrol.pauseTimer - deltaTime);
      return;
    }

    const targetPosition = robot.patrol.points[robot.patrol.waypointIndex];
    const deltaX = targetPosition[0] - robot.position[0];
    const deltaZ = targetPosition[2] - robot.position[2];
    const distance = Math.hypot(deltaX, deltaZ);

    if (distance <= ROBOT_IDLE_PATROL_ARRIVE_DISTANCE) {
      robot.patrol.waypointIndex = (robot.patrol.waypointIndex + 1) % robot.patrol.points.length;
      robot.patrol.pauseTimer = ROBOT_IDLE_PATROL_PAUSE_DURATION;
      return;
    }

    const step = Math.min(distance, ROBOT_IDLE_PATROL_SPEED * deltaTime);
    robot.position = [
      robot.position[0] + (deltaX / distance) * step,
      targetPosition[1],
      robot.position[2] + (deltaZ / distance) * step
    ];
    robot.modelInstance.yaw = getRobotModelYawToward(
      robot.position,
      targetPosition,
      modelFaceYawOffset
    );
  }

  function moveGroundCompanionTowardPlayer(companion, {
    deltaTime,
    speed,
    followDistance,
    modelFaceYawOffset = null
  }) {
    if (
      !companion ||
      !session.playerCharacter ||
      !Array.isArray(companion.position)
    ) {
      return false;
    }

    const playerPosition = session.playerCharacter.getPosition();
    const deltaX = playerPosition[0] - companion.position[0];
    const deltaZ = playerPosition[2] - companion.position[2];
    const distance = Math.hypot(deltaX, deltaZ);

    companion.patrol = null;

    if (distance <= followDistance || distance <= 0.001) {
      return true;
    }

    const travel = Math.min(speed * deltaTime, distance - followDistance);
    const previousPosition = [...companion.position];
    companion.position = [
      companion.position[0] + (deltaX / distance) * travel,
      0.04,
      companion.position[2] + (deltaZ / distance) * travel
    ];

    if (companion.modelInstance && modelFaceYawOffset !== null) {
      companion.modelInstance.yaw = getRobotModelYawToward(
        previousPosition,
        companion.position,
        modelFaceYawOffset
      );
    }

    return true;
  }

  function updateSquirtleIdlePatrol(deltaTime, { active }) {
    const squirtle = session.actTwoSquirtle;
    const canMove = Boolean(
      active &&
      squirtle?.recovered &&
      squirtle.assemblyState === "assembled" &&
      !session.squirtleWaterGunAction &&
      getSquirtleWaterGunQueue().length === 0
    );

    if (!canMove) {
      if (squirtle) {
        squirtle.patrol = null;
      }
      syncSquirtleModelInstance();
      return;
    }

    if (controls.storyState?.flags?.squirtleFollowing) {
      moveGroundCompanionTowardPlayer(squirtle, {
        deltaTime,
        speed: SQUIRTLE_FOLLOW_SPEED,
        followDistance: SQUIRTLE_FOLLOW_DISTANCE,
        modelFaceYawOffset: SQUIRTLE_MODEL_FACE_YAW_OFFSET
      });
      syncSquirtleModelInstance();
      return;
    }

    updateRobotIdlePatrol(squirtle, {
      deltaTime,
      radius: SQUIRTLE_IDLE_PATROL_RADIUS,
      modelFaceYawOffset: SQUIRTLE_MODEL_FACE_YAW_OFFSET
    });
    syncSquirtleModelInstance();
  }

  function updateBulbasaurIdlePatrol(deltaTime, { active }) {
    const encounter = session.bulbasaurEncounter;
    const flags = controls.storyState?.flags || {};
    const workbenchGuideActive =
      flags.bulbasaurWorkbenchGuideAvailable &&
      !flags.workbenchDiyRecipesReceived;
    const jumpActive = Boolean(
      encounter?.jumpTimer > 0 &&
      encounter.originPosition &&
      encounter.landingPosition
    );
    const canPatrol = Boolean(
      active &&
      encounter?.visible &&
      Array.isArray(encounter.position) &&
      !session.bulbasaurLeafageAction &&
      !encounter.revealBoxOpening?.active &&
      !workbenchGuideActive &&
      !jumpActive
    );

    if (!canPatrol) {
      if (encounter) {
        encounter.patrol = null;
      }
      syncBulbasaurModelInstance();
      return;
    }

    if (controls.storyState?.flags?.bulbasaurFollowing) {
      moveGroundCompanionTowardPlayer(encounter, {
        deltaTime,
        speed: BULBASAUR_FOLLOW_SPEED,
        followDistance: BULBASAUR_FOLLOW_DISTANCE,
        modelFaceYawOffset: BULBASAUR_MODEL_FACE_YAW_OFFSET
      });
      syncBulbasaurModelInstance();
      return;
    }

    updateRobotIdlePatrol(encounter, {
      deltaTime,
      radius: BULBASAUR_IDLE_PATROL_RADIUS,
      modelFaceYawOffset: BULBASAUR_MODEL_FACE_YAW_OFFSET
    });
    syncBulbasaurModelInstance();
  }

  function getSquirtleAssemblySceneObjects(sceneObjects, squirtle) {
    if (
      !squirtle?.visible ||
      squirtle.assemblyState === "hidden" ||
      squirtle.assemblyState === "assembled" ||
      !squirtle.model?.primitives?.length
    ) {
      return sceneObjects;
    }

    const progress = squirtle.reassembly?.active ?
      clamp01(squirtle.reassembly.progress || 0) :
      0;
    const origin = squirtle.position || squirtle.modelInstance?.offset || [0, 0, 0];
    const partObjects = squirtle.model.primitives.map((primitive, index) => {
      const pose = getSquirtleAssemblyPartPose(index, progress);
      return {
        model: createPrimitiveModel(squirtle.model, primitive),
        brightness: 1,
        instances: [{
          offset: [
            origin[0] + pose.offset[0],
            (origin[1] || 0) + pose.offset[1],
            origin[2] + pose.offset[2]
          ],
          scale: SQUIRTLE_REASSEMBLY_PART_SCALE,
          yaw: pose.yaw,
          pitch: pose.pitch,
          roll: pose.roll,
          active: true
        }]
      };
    });

    return [...sceneObjects, ...partObjects];
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

  function getBulbasaurLeafageApproachPosition(targetPosition, playerPosition = null) {
    const bulbasaurPosition =
      session.bulbasaurEncounter?.position ||
      session.bulbasaurEncounter?.modelInstance?.offset ||
      playerPosition ||
      [0, 0.04, 0];
    let deltaX = bulbasaurPosition[0] - targetPosition[0];
    let deltaZ = bulbasaurPosition[2] - targetPosition[2];
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
      targetPosition[0] + (deltaX / distance) * BULBASAUR_LEAFAGE_STAND_DISTANCE,
      0.04,
      targetPosition[2] + (deltaZ / distance) * BULBASAUR_LEAFAGE_STAND_DISTANCE
    ];
  }

  function startBulbasaurLeafageAction({ groundCell, playerPosition }) {
    const bulbasaur = session.bulbasaurEncounter;
    if (!groundCell) {
      return "unavailable";
    }

    if (session.bulbasaurLeafageAction) {
      return "busy";
    }

    if (
      !bulbasaur?.modelInstance ||
      !bulbasaur.visible ||
      !Array.isArray(bulbasaur.position)
    ) {
      return "unavailable";
    }

    const targetPosition = getGroundCellCenterPosition(groundCell);
    const approachPosition = getBulbasaurLeafageApproachPosition(
      targetPosition,
      playerPosition
    );

    session.bulbasaurLeafageAction = {
      phase: "approach",
      groundCell,
      targetPosition,
      approachPosition,
      castElapsed: 0,
      impactApplied: false
    };
    bulbasaur.modelInstance.active = true;
    bulbasaur.modelInstance.yaw = getRobotModelYawToward(
      bulbasaur.position,
      targetPosition,
      BULBASAUR_MODEL_FACE_YAW_OFFSET
    );
    syncBulbasaurModelInstance();

    return "started";
  }

  function applyBulbasaurLeafageImpact(action) {
    const hadGrassPatch = Boolean(findGrassPatchForGroundCell(action.groundCell));
    const result = gameplay.performHarvestAction({
      playerPosition: action.approachPosition,
      palmModel: session.palmModel,
      palmInstances: session.palmInstances,
      resourceNodes: session.resourceNodes,
      leppaTree: session.leppaTree,
      inventory: controls.inventory,
      canPurifyGround: false,
      groundDeadInstances: session.groundDeadInstances,
      groundFlowerPatches: session.groundFlowerPatches,
      groundGrassPatches: session.groundGrassPatches,
      groundPurifiedInstances: session.groundPurifiedInstances,
      storyState: controls.storyState,
      leafDen: session.leafDen,
      woodDrops: session.woodDrops,
      leppaBerryDrops: session.leppaBerryDrops,
      canUseLeafage: true,
      forcedHarvestTarget: {
        leafageGroundCell: action.groundCell,
        distance: 0
      }
    });

    if (result && !hadGrassPatch && findGrassPatchForGroundCell(action.groundCell)) {
      playInstanceObjectSfx();
    }

    return result;
  }

  function updateBulbasaurLeafageAction(deltaTime) {
    const action = session.bulbasaurLeafageAction;
    const bulbasaur = session.bulbasaurEncounter;

    if (!action || !bulbasaur?.modelInstance) {
      return;
    }

    if (!Array.isArray(bulbasaur.position)) {
      bulbasaur.position = [...(bulbasaur.modelInstance.offset || action.approachPosition)];
    }

    if (action.phase === "approach") {
      const deltaX = action.approachPosition[0] - bulbasaur.position[0];
      const deltaZ = action.approachPosition[2] - bulbasaur.position[2];
      const distance = Math.hypot(deltaX, deltaZ);
      const travel = Math.min(BULBASAUR_LEAFAGE_SPEED * deltaTime, distance);

      if (distance > BULBASAUR_LEAFAGE_ARRIVE_DISTANCE && travel > 0) {
        bulbasaur.position = [
          bulbasaur.position[0] + (deltaX / distance) * travel,
          0.04,
          bulbasaur.position[2] + (deltaZ / distance) * travel
        ];
      } else {
        bulbasaur.position = [...action.approachPosition];
        action.phase = "cast";
        action.castElapsed = 0;
      }

      bulbasaur.modelInstance.yaw = getRobotModelYawToward(
        bulbasaur.position,
        action.targetPosition,
        BULBASAUR_MODEL_FACE_YAW_OFFSET
      );
      syncBulbasaurModelInstance();
      return;
    }

    if (action.phase !== "cast") {
      session.bulbasaurLeafageAction = null;
      return;
    }

    action.castElapsed += deltaTime;
    bulbasaur.modelInstance.yaw = getRobotModelYawToward(
      bulbasaur.position,
      action.targetPosition,
      BULBASAUR_MODEL_FACE_YAW_OFFSET
    );
    syncBulbasaurModelInstance();

    if (!action.impactApplied && action.castElapsed >= BULBASAUR_LEAFAGE_IMPACT_TIME) {
      action.impactApplied = true;
      applyBulbasaurLeafageImpact(action);
    }

    if (action.castElapsed >= BULBASAUR_LEAFAGE_CAST_DURATION) {
      session.bulbasaurLeafageAction = null;
    }
  }

  function getSquirtleWaterGunQueue() {
    if (!Array.isArray(session.squirtleWaterGunQueue)) {
      session.squirtleWaterGunQueue = [];
    }

    return session.squirtleWaterGunQueue;
  }

  function getSquirtleWaterGunUseCount() {
    return Math.max(
      0,
      Math.floor(Number(controls.storyState?.flags?.[SQUIRTLE_WATER_GUN_USE_COUNT_FLAG] || 0))
    );
  }

  function getSquirtleWaterGunSpeedMultiplier() {
    const progress = clamp01(getSquirtleWaterGunUseCount() / SQUIRTLE_WATER_GUN_EVOLUTION_MAX_USES);
    return 1 + (SQUIRTLE_WATER_GUN_MAX_SPEED_MULTIPLIER - 1) * progress;
  }

  function getSquirtleWaterGunSprayDuration(speedMultiplier = getSquirtleWaterGunSpeedMultiplier()) {
    return Math.max(
      SQUIRTLE_WATER_GUN_MIN_SPRAY_DURATION,
      SQUIRTLE_WATER_GUN_SPRAY_DURATION / Math.max(1, speedMultiplier)
    );
  }

  function getSquirtleWaterGunImpactTime(speedMultiplier = getSquirtleWaterGunSpeedMultiplier()) {
    return Math.max(
      SQUIRTLE_WATER_GUN_MIN_IMPACT_TIME,
      SQUIRTLE_WATER_GUN_IMPACT_TIME / Math.max(1, speedMultiplier)
    );
  }

  function recordSquirtleWaterGunUse() {
    if (!controls.storyState) {
      return;
    }

    controls.storyState.flags ||= {};
    controls.storyState.flags[SQUIRTLE_WATER_GUN_USE_COUNT_FLAG] =
      getSquirtleWaterGunUseCount() + 1;
  }

  function getSquirtleWaterStaminaState() {
    if (!session.squirtleWaterStamina) {
      session.squirtleWaterStamina = {
        current: SQUIRTLE_WATER_STAMINA_MAX,
        visualCurrent: SQUIRTLE_WATER_STAMINA_MAX,
        max: SQUIRTLE_WATER_STAMINA_MAX,
        charging: false,
        chargeElapsed: 0
      };
    }

    session.squirtleWaterStamina.max = SQUIRTLE_WATER_STAMINA_MAX;
    session.squirtleWaterStamina.current = Math.min(
      SQUIRTLE_WATER_STAMINA_MAX,
      Math.max(0, Number(session.squirtleWaterStamina.current || 0))
    );
    session.squirtleWaterStamina.visualCurrent = Math.min(
      SQUIRTLE_WATER_STAMINA_MAX,
      Math.max(
        0,
        Number.isFinite(session.squirtleWaterStamina.visualCurrent) ?
          session.squirtleWaterStamina.visualCurrent :
          session.squirtleWaterStamina.current
      )
    );
    return session.squirtleWaterStamina;
  }

  function isSquirtleWaterCharging() {
    return Boolean(getSquirtleWaterStaminaState().charging);
  }

  function beginSquirtleWaterRecharge() {
    const stamina = getSquirtleWaterStaminaState();
    if (stamina.charging) {
      return;
    }

    stamina.current = 0;
    stamina.charging = true;
    stamina.chargeElapsed = 0;
  }

  function consumeSquirtleWaterStamina() {
    const stamina = getSquirtleWaterStaminaState();
    if (stamina.charging || stamina.current <= 0) {
      beginSquirtleWaterRecharge();
      return false;
    }

    stamina.current = Math.max(0, stamina.current - SQUIRTLE_WATER_STAMINA_COST);
    return true;
  }

  function consumeSquirtleWaterStaminaForInstantAction() {
    if (!consumeSquirtleWaterStamina()) {
      return false;
    }

    if (getSquirtleWaterStaminaState().current <= 0) {
      beginSquirtleWaterRecharge();
    }

    return true;
  }

  function updateSquirtleWaterStamina(deltaTime) {
    const stamina = getSquirtleWaterStaminaState();

    if (stamina.charging) {
      stamina.chargeElapsed += deltaTime;
      const progress = clamp01(stamina.chargeElapsed / SQUIRTLE_WATER_STAMINA_RECHARGE_DURATION);
      stamina.current = stamina.max * progress;

      if (progress >= 1) {
        stamina.current = stamina.max;
        stamina.charging = false;
        stamina.chargeElapsed = 0;
        startNextQueuedSquirtleWaterGunAction();
      }
    }

    const visualDuration =
      stamina.current < stamina.visualCurrent ?
        SQUIRTLE_WATER_STAMINA_VISUAL_DECREASE_DURATION :
        SQUIRTLE_WATER_STAMINA_VISUAL_INCREASE_DURATION;
    const maxVisualStep = (stamina.max * deltaTime) / Math.max(0.001, visualDuration);
    stamina.visualCurrent = moveValueToward(
      stamina.visualCurrent,
      stamina.current,
      maxVisualStep
    );
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

    if (isSquirtleWaterCharging()) {
      return "charging";
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

    const stamina = getSquirtleWaterStaminaState();
    if (stamina.charging || stamina.current <= 0) {
      beginSquirtleWaterRecharge();
      return "charging";
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
    const speedMultiplier = getSquirtleWaterGunSpeedMultiplier();

    session.squirtleWaterGunAction = {
      phase: "approach",
      groundCell,
      targetPosition,
      approachPosition,
      speedMultiplier,
      sprayDuration: getSquirtleWaterGunSprayDuration(speedMultiplier),
      impactTime: getSquirtleWaterGunImpactTime(speedMultiplier),
      sprayElapsed: 0,
      impactApplied: false
    };
    squirtle.modelInstance.active = true;
    squirtle.modelInstance.yaw = getSquirtleModelYawToward(squirtle.position, targetPosition);
    syncSquirtleModelInstance();

    return "started";
  }

  function startNextQueuedSquirtleWaterGunAction() {
    if (session.squirtleWaterGunAction) {
      return;
    }

    const stamina = getSquirtleWaterStaminaState();
    if (stamina.charging) {
      return;
    }

    if (stamina.current <= 0) {
      beginSquirtleWaterRecharge();
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
    const grassPatchWasDry =
      Boolean(findGrassPatchForGroundCell(action.groundCell)) &&
      !isAliveGrassPatchForGroundCell(action.groundCell);
    const result = gameplay.performHarvestAction({
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

    if (result && grassPatchWasDry && isAliveGrassPatchForGroundCell(action.groundCell)) {
      playInstanceObjectSfx();
    }

    if (result) {
      recordSquirtleWaterGunUse();
    }

    return result;
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
      const speedMultiplier = Number(action.speedMultiplier) > 0 ?
        action.speedMultiplier :
        getSquirtleWaterGunSpeedMultiplier();
      const travel = Math.min(SQUIRTLE_WATER_GUN_SPEED * speedMultiplier * deltaTime, distance);

      if (distance > SQUIRTLE_WATER_GUN_ARRIVE_DISTANCE && travel > 0) {
        squirtle.position = [
          squirtle.position[0] + (deltaX / distance) * travel,
          0.04,
          squirtle.position[2] + (deltaZ / distance) * travel
        ];
      } else {
        if (!consumeSquirtleWaterStamina()) {
          session.squirtleWaterGunAction = null;
          return;
        }

        squirtle.position = [...action.approachPosition];
        action.phase = "spray";
        action.sprayElapsed = 0;
      }

      squirtle.modelInstance.yaw = getSquirtleModelYawToward(
        squirtle.position,
        action.targetPosition
      );
      syncSquirtleModelInstance();
      return;
    }

    if (action.phase !== "spray") {
      session.squirtleWaterGunAction = null;
      return;
    }

    action.sprayElapsed += deltaTime;
    const speedMultiplier = Number(action.speedMultiplier) > 0 ?
      action.speedMultiplier :
      getSquirtleWaterGunSpeedMultiplier();
    const impactTime = Number(action.impactTime) > 0 ?
      action.impactTime :
      getSquirtleWaterGunImpactTime(speedMultiplier);
    const sprayDuration = Number(action.sprayDuration) > 0 ?
      action.sprayDuration :
      getSquirtleWaterGunSprayDuration(speedMultiplier);
    squirtle.modelInstance.yaw = getSquirtleModelYawToward(
      squirtle.position,
      action.targetPosition
    );
    syncSquirtleModelInstance();

    if (!action.impactApplied && action.sprayElapsed >= impactTime) {
      action.impactApplied = true;
      applySquirtleWaterGunImpact(action);
    }

    if (action.sprayElapsed >= sprayDuration) {
      session.squirtleWaterGunAction = null;
      if (getSquirtleWaterStaminaState().current <= 0) {
        beginSquirtleWaterRecharge();
      } else {
        startNextQueuedSquirtleWaterGunAction();
      }
    }
  }

  function getSquirtleMouthPosition() {
    const squirtle = session.actTwoSquirtle;
    const position = squirtle?.position || squirtle?.modelInstance?.offset || [0, 0, 0];
    const yaw = getSquirtleLogicalFacingYaw();

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

    const sprayDuration = Number(action.sprayDuration) > 0 ?
      action.sprayDuration :
      SQUIRTLE_WATER_GUN_SPRAY_DURATION;
    const impactTime = Number(action.impactTime) > 0 ?
      action.impactTime :
      SQUIRTLE_WATER_GUN_IMPACT_TIME;
    const progress = Math.min(
      1,
      Math.max(0, action.sprayElapsed / sprayDuration)
    );
    const mouthPosition = getSquirtleMouthPosition();
    const targetPosition = action.targetPosition;
    const streamDirectionX = targetPosition[0] - mouthPosition[0];
    const streamDirectionZ = targetPosition[2] - mouthPosition[2];
    const streamLength = Math.hypot(streamDirectionX, streamDirectionZ) || 1;
    const sideX = -streamDirectionZ / streamLength;
    const sideZ = streamDirectionX / streamLength;
    const forwardX = streamDirectionX / streamLength;
    const forwardZ = streamDirectionZ / streamLength;
    const billboards = [];

    for (let index = 0; index < SQUIRTLE_WATER_GUN_PARTICLE_COUNT; index += 1) {
      const pathProgress = (progress * 1.72 + index * 0.047) % 1;
      const lane = (index % SQUIRTLE_WATER_GUN_STREAM_LANE_COUNT) -
        (SQUIRTLE_WATER_GUN_STREAM_LANE_COUNT - 1) * 0.5;
      const impactStretch = clamp01((pathProgress - 0.74) / 0.26);
      const wobble = Math.sin(progress * 22 + index * 1.7) * 0.045;
      const laneOffset = lane * SQUIRTLE_WATER_GUN_STREAM_WIDTH;
      const splashSide = (index % 2 === 0 ? -1 : 1) *
        impactStretch *
        (0.11 + (index % 4) * 0.035);
      const splashForward = ((index % 5) - 2) * impactStretch * 0.035;
      const baseSize = 0.14 + (index % 4) * 0.018;
      const arcY = mouthPosition[1] +
        (targetPosition[1] - mouthPosition[1]) * pathProgress +
        Math.sin(pathProgress * Math.PI) * SQUIRTLE_WATER_GUN_ARC_HEIGHT;
      const groundY = targetPosition[1] + 0.045 + (index % 2) * 0.012;
      const y = lerp(arcY, groundY, impactStretch * impactStretch);

      billboards.push({
        texture,
        position: [
          mouthPosition[0] +
            (targetPosition[0] - mouthPosition[0]) * pathProgress +
            sideX * (wobble + laneOffset + splashSide) +
            forwardX * splashForward,
          y,
          mouthPosition[2] +
            (targetPosition[2] - mouthPosition[2]) * pathProgress +
            sideZ * (wobble + laneOffset + splashSide) +
            forwardZ * splashForward
        ],
        size: [
          baseSize * (1.08 + impactStretch * 2.35),
          baseSize * (0.96 - impactStretch * 0.48)
        ],
        uvRect
      });
    }

    const splashElapsed = action.sprayElapsed - impactTime;

    if (splashElapsed >= 0) {
      const splashProgress = clamp01(splashElapsed / SQUIRTLE_WATER_GUN_SPLASH_DURATION);
      const splashRadius = easeOutCubic(splashProgress) * SQUIRTLE_WATER_GUN_SPLASH_RADIUS;
      const splashLift = Math.sin(splashProgress * Math.PI) * 0.075 * (1 - splashProgress * 0.35);

      for (let index = 0; index < SQUIRTLE_WATER_GUN_SPLASH_PARTICLE_COUNT; index += 1) {
        const angle = index * 2.39996 + progress * 1.6;
        const radius = splashRadius * (0.36 + (index % 4) * 0.18);
        const size = 0.16 + (index % 3) * 0.035;

        billboards.push({
          texture,
          position: [
            targetPosition[0] + Math.cos(angle) * radius,
            targetPosition[1] + 0.05 + splashLift + (index % 2) * 0.012,
            targetPosition[2] + Math.sin(angle) * radius
          ],
          size: [
            size * (1.45 + splashProgress * 1.85),
            size * (0.48 - splashProgress * 0.18)
          ],
          uvRect
        });
      }
    }

    return billboards;
  }

  function getSquirtleWorldPosition() {
    const squirtle = session.actTwoSquirtle;
    return squirtle?.position || squirtle?.modelInstance?.offset || null;
  }

  function getSquirtleStaminaBillboards(fillTexture, uvRect) {
    const position = getSquirtleWorldPosition();
    if (!Array.isArray(position) || !fillTexture) {
      return [];
    }

    const stamina = getSquirtleWaterStaminaState();
    const ratio = clamp01(stamina.visualCurrent / stamina.max);
    const barPosition = [
      position[0],
      (position[1] || 0) + 1.25,
      position[2]
    ];
    const billboards = [];

    if (ratio > 0.02) {
      const fillWidth = SQUIRTLE_WATER_STAMINA_BAR_WIDTH * ratio;
      const quadRight = camera.getBillboardAxes?.()?.right || [1, 0, 0];
      const fillCenterOffset = -(SQUIRTLE_WATER_STAMINA_BAR_WIDTH * 0.5) + (fillWidth * 0.5);
      const fillUvRect = [
        uvRect[0],
        uvRect[1],
        uvRect[0] + ((uvRect[2] - uvRect[0]) * ratio),
        uvRect[3]
      ];

      billboards.push({
        texture: fillTexture,
        position: [
          barPosition[0] + (quadRight[0] * fillCenterOffset),
          barPosition[1] + ((quadRight[1] || 0) * fillCenterOffset),
          barPosition[2] + (quadRight[2] * fillCenterOffset)
        ],
        size: [fillWidth, SQUIRTLE_WATER_STAMINA_BAR_HEIGHT],
        uvRect: fillUvRect,
        alpha: 0.95
      });
    }

    return billboards;
  }

  function getSquirtleChargingBillboards(texture, uvRect, now) {
    const position = getSquirtleWorldPosition();
    if (!isSquirtleWaterCharging() || !Array.isArray(position) || !texture) {
      return [];
    }

    const time = now * 0.001;
    const billboards = [];
    for (let index = 0; index < SQUIRTLE_CHARGING_PARTICLE_COUNT; index += 1) {
      const cycle = (time / SQUIRTLE_CHARGING_PARTICLE_DURATION + index / SQUIRTLE_CHARGING_PARTICLE_COUNT) % 1;
      const inward = easeOutCubic(cycle);
      const radius = SQUIRTLE_CHARGING_PARTICLE_RADIUS * (1 - inward);
      const angle = index * 2.39996 + time * 0.72;
      const size = 0.09 + (index % 3) * 0.022;
      const alpha = Math.sin(cycle * Math.PI) * 0.88;

      billboards.push({
        texture,
        position: [
          position[0] + Math.cos(angle) * radius,
          (position[1] || 0) + lerp(1.68 + (index % 4) * 0.08, 0.66, inward),
          position[2] + Math.sin(angle) * radius
        ],
        size: [size, size],
        uvRect,
        alpha
      });
    }

    return billboards;
  }

  function snapshotAvailableWoodDrops(woodDrops = []) {
    const snapshots = new Map();

    for (const woodDrop of woodDrops) {
      if (!woodDrop || woodDrop.collected) {
        continue;
      }

      snapshots.set(woodDrop, {
        position: [...woodDrop.position],
        size: [...woodDrop.size],
        uvRect: woodDrop.uvRect || [0, 0, 1, 1]
      });
    }

    return snapshots;
  }

  function triggerWoodCollectPopEffects(woodDropSnapshots) {
    for (const [woodDrop, snapshot] of woodDropSnapshots) {
      if (!woodDrop.collected) {
        continue;
      }

      woodCollectPopEffects.push({
        ...snapshot,
        age: 0,
        duration: WOOD_COLLECT_POP_DURATION
      });
    }
  }

  function updateWoodCollectPopEffects(deltaTime) {
    for (let index = woodCollectPopEffects.length - 1; index >= 0; index -= 1) {
      const effect = woodCollectPopEffects[index];
      effect.age += deltaTime;

      if (effect.age >= effect.duration) {
        woodCollectPopEffects.splice(index, 1);
      }
    }
  }

  function getWoodCollectPopBillboards(texture, fallbackUvRect) {
    if (!texture || woodCollectPopEffects.length === 0) {
      return [];
    }

    return woodCollectPopEffects.map((effect) => {
      const progress = clamp01(effect.age / effect.duration);
      const popScale = 1 + Math.sin(progress * Math.PI) * (WOOD_COLLECT_POP_SCALE - 1);
      const fade = clamp01((1 - progress) / 0.42);
      const lift = Math.sin(progress * Math.PI) * WOOD_COLLECT_POP_LIFT;

      return {
        texture,
        position: [
          effect.position[0],
          effect.position[1] + lift,
          effect.position[2]
        ],
        size: [
          effect.size[0] * popScale,
          effect.size[1] * popScale
        ],
        uvRect: effect.uvRect || fallbackUvRect,
        alpha: fade
      };
    });
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
      session.actTwoSquirtle.modelInstance.yaw = getSquirtleModelYawToward(
        session.actTwoSquirtle.position,
        playerPosition
      );
    }
  }

  function focusNpcConversationWhenDialogueOpens({
    targetId,
    playerPosition,
    npcActors,
    interactables,
    targetPosition
  }) {
    const focusIfDialogueOpened = () => {
      if (
        !gameplayDialogue.isActive?.() ||
        controls.isScriptedInteractionActive?.()
      ) {
        return;
      }

      dialogueCamera?.focusNpcConversation({
        targetId,
        playerPosition,
        npcActors,
        interactables,
        targetPosition
      });
    };

    if (typeof queueMicrotask === "function") {
      queueMicrotask(focusIfDialogueOpened);
    } else {
      Promise.resolve().then(focusIfDialogueOpened);
    }
  }

  function revealBulbasaurAtRepairPosition(encounter) {
    if (!encounter || !Array.isArray(encounter.repairPosition)) {
      return false;
    }

    encounter.visible = true;
    encounter.jumpTimer = 0;
    encounter.originPosition = null;
    encounter.landingPosition = null;
    encounter.position = [...encounter.repairPosition];
    return true;
  }

  function updateBulbasaurRevealBoxOpening(deltaTime, encounter) {
    const opening = encounter?.revealBoxOpening;

    if (!opening?.active) {
      return false;
    }

    if (!Array.isArray(encounter.repairPosition)) {
      opening.active = false;
      return false;
    }

    opening.duration = Number(opening.duration || BULBASAUR_REVEAL_BOX_DURATION);
    opening.elapsed = Math.min(opening.duration, Number(opening.elapsed || 0) + deltaTime);
    const progress = clamp01(opening.elapsed / opening.duration);

    if (progress >= BULBASAUR_REVEAL_VISIBLE_PROGRESS && !opening.bulbasaurVisible) {
      revealBulbasaurAtRepairPosition(encounter);
      opening.bulbasaurVisible = true;
    }

    if (progress >= 1) {
      revealBulbasaurAtRepairPosition(encounter);
      if (encounter.repairModuleInstance) {
        encounter.repairModuleInstance.active = false;
      }
      opening.active = false;
      const onComplete = opening.onComplete;
      opening.onComplete = null;
      encounter.revealBoxOpening = null;
      syncBulbasaurModelInstance();
      if (typeof onComplete === "function") {
        onComplete();
      }
      return true;
    }

    syncBulbasaurModelInstance();
    return true;
  }

  function getWorkbenchRampCollider() {
    return (session.elevatedTerrainColliders || [])
      .find((collider) => collider?.id === BULBASAUR_WORKBENCH_GUIDE_RAMP_COLLIDER_ID) || null;
  }

  function getBulbasaurWorkbenchGuidePath() {
    const rampCollider = getWorkbenchRampCollider();

    if (!rampCollider?.position || !rampCollider?.size) {
      return [[...WORKBENCH_POSITION]];
    }

    const padding = rampCollider.padding ?? 0;
    const halfX = (rampCollider.size[0] || 0) * 0.5 + padding;
    const halfZ = (rampCollider.size[2] || 0) * 0.5 + padding;
    const groundY = WORKBENCH_POSITION[1];
    const rampY = rampCollider.surfaceY ?? groundY;
    const approachX =
      rampCollider.position[0] - halfX - BULBASAUR_WORKBENCH_GUIDE_SIDE_APPROACH_MARGIN;
    const approachZ =
      rampCollider.position[2] - halfZ - BULBASAUR_WORKBENCH_GUIDE_RAMP_APPROACH_MARGIN;

    return [
      [approachX, groundY, approachZ],
      [rampCollider.position[0], groundY, approachZ],
      [rampCollider.position[0], rampY, rampCollider.position[2]]
    ];
  }

  function advanceBulbasaurAlongWorkbenchGuide(deltaTime, encounter) {
    const path = getBulbasaurWorkbenchGuidePath();
    const waypointIndex = Math.min(
      Math.max(0, encounter.workbenchGuideWaypointIndex || 0),
      path.length - 1
    );
    const currentPosition =
      encounter.position ||
      encounter.landingPosition ||
      BULBASAUR_WORKBENCH_GUIDE_START;
    const targetPosition = path[waypointIndex];
    const deltaX = targetPosition[0] - currentPosition[0];
    const deltaZ = targetPosition[2] - currentPosition[2];
    const distance = Math.hypot(deltaX, deltaZ);
    const step = BULBASAUR_WORKBENCH_GUIDE_SPEED * deltaTime;

    encounter.visible = true;
    encounter.jumpTimer = 0;
    encounter.originPosition = null;
    encounter.landingPosition = null;

    if (distance <= step || distance <= BULBASAUR_WORKBENCH_GUIDE_WAYPOINT_DISTANCE) {
      encounter.position = [...targetPosition];
      if (waypointIndex < path.length - 1) {
        encounter.workbenchGuideWaypointIndex = waypointIndex + 1;
      }
    } else {
      const progress = step / distance;
      encounter.position = [
        currentPosition[0] + deltaX * progress,
        currentPosition[1] + (targetPosition[1] - currentPosition[1]) * progress,
        currentPosition[2] + deltaZ * progress
      ];
      encounter.workbenchGuideWaypointIndex = waypointIndex;
    }

    if (encounter.modelInstance && distance > 0.001) {
      encounter.modelInstance.yaw = getRobotModelYawToward(
        currentPosition,
        targetPosition,
        BULBASAUR_MODEL_FACE_YAW_OFFSET
      );
    }
  }

  function updateBulbasaurEncounter(deltaTime) {
    const encounter = session.bulbasaurEncounter;

    if (updateBulbasaurRevealBoxOpening(deltaTime, encounter)) {
      return;
    }

    if (
      controls.storyState?.flags?.bulbasaurRevealed &&
      encounter &&
      !encounter.visible &&
      Array.isArray(encounter.repairPosition)
    ) {
      revealBulbasaurAtRepairPosition(encounter);
      if (encounter.repairModuleInstance) {
        encounter.repairModuleInstance.active = false;
      }
    }

    if (
      controls.storyState?.flags?.bulbasaurWorkbenchGuideAvailable &&
      !controls.storyState?.flags?.workbenchDiyRecipesReceived &&
      encounter
    ) {
      advanceBulbasaurAlongWorkbenchGuide(deltaTime, encounter);
      syncBulbasaurModelInstance();
      return;
    }

    if (encounter) {
      encounter.workbenchGuideWaypointIndex = 0;
    }

    if (!encounter?.visible || !encounter.position) {
      syncBulbasaurModelInstance();
      return;
    }

    if (encounter.jumpTimer <= 0 || !encounter.originPosition || !encounter.landingPosition) {
      encounter.jumpTimer = 0;
      if (encounter.originPosition && encounter.landingPosition) {
        encounter.position = [...encounter.landingPosition];
        encounter.originPosition = null;
        encounter.landingPosition = null;
      }
      syncBulbasaurModelInstance();
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
    if (encounter.modelInstance) {
      encounter.modelInstance.yaw = getRobotModelYawToward(
        encounter.position,
        encounter.landingPosition,
        BULBASAUR_MODEL_FACE_YAW_OFFSET
      );
    }
    syncBulbasaurModelInstance();
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
      !controls.storyState.flags.leafDenConstructionStarted
    ) {
      moveGroundCompanionTowardPlayer(encounter, {
        deltaTime,
        speed: CHARMANDER_FOLLOW_SPEED,
        followDistance: CHARMANDER_FOLLOW_DISTANCE
      });
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
      moveGroundCompanionTowardPlayer(encounter, {
        deltaTime,
        speed: TIMBURR_FOLLOW_SPEED,
        followDistance: TIMBURR_FOLLOW_DISTANCE
      });
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

  function updateLeppaTreeDance(now) {
    const leppaTree = session.leppaTree;
    const deadInstance = leppaTree?.deadInstance;

    if (!deadInstance) {
      return;
    }

    if (!leppaTree.revived) {
      deadInstance.swayStrength = 0;
      return;
    }

    deadInstance.swayStrength = Math.sin(now * LEPPA_TREE_DANCE_SPEED) * LEPPA_TREE_DANCE_SWAY;
  }

  function createLeppaTreeMusicNoteParticle(leppaTree, textureCount) {
    const state = leppaTree.musicNotes;
    const index = state.nextIndex % textureCount;
    state.nextIndex += 1;

    const angle = Math.random() * Math.PI * 2;
    const radius = 0.24 + Math.random() * 0.58;
    const height = LEPPA_TREE_MUSIC_NOTE_BASE_HEIGHT + Math.random() * 0.54;
    const lateralSpeed = 0.12 + Math.random() * 0.1;

    return {
      age: 0,
      duration: LEPPA_TREE_MUSIC_NOTE_DURATION * (0.86 + Math.random() * 0.28),
      textureIndex: index,
      position: [
        leppaTree.position[0] + Math.cos(angle) * radius,
        leppaTree.position[1] + height,
        leppaTree.position[2] + Math.sin(angle) * radius
      ],
      drift: [
        Math.cos(angle) * lateralSpeed,
        0.54 + Math.random() * 0.28,
        Math.sin(angle) * lateralSpeed
      ],
      size: 0.42 + Math.random() * 0.16,
      rotation: (Math.random() - 0.5) * 0.32,
      rotationSpeed: (Math.random() - 0.5) * 0.42,
      phase: Math.random() * Math.PI * 2
    };
  }

  function resetLeppaTreeMusicNotes(leppaTree) {
    if (!leppaTree?.musicNotes) {
      return;
    }

    leppaTree.musicNotes.active = false;
    leppaTree.musicNotes.emitTimer = 0;
    leppaTree.musicNotes.particles.length = 0;
  }

  function updateLeppaTreeMusicNotes(deltaTime) {
    const leppaTree = session.leppaTree;
    const textures = session.leppaTreeMusicalNoteTextures || [];

    if (!leppaTree?.revived || !Array.isArray(leppaTree.position) || textures.length === 0) {
      resetLeppaTreeMusicNotes(leppaTree);
      return;
    }

    leppaTree.musicNotes ||= {
      active: false,
      emitTimer: 0,
      nextIndex: 0,
      particles: []
    };

    if (!leppaTree.musicNotes.active) {
      leppaTree.musicNotes.active = true;
      for (let index = 0; index < LEPPA_TREE_MUSIC_NOTE_BURST_COUNT; index += 1) {
        leppaTree.musicNotes.particles.push(
          createLeppaTreeMusicNoteParticle(leppaTree, textures.length)
        );
      }
    }

    leppaTree.musicNotes.emitTimer += deltaTime;
    while (
      leppaTree.musicNotes.emitTimer >= LEPPA_TREE_MUSIC_NOTE_EMIT_INTERVAL &&
      leppaTree.musicNotes.particles.length < LEPPA_TREE_MUSIC_NOTE_MAX_PARTICLES
    ) {
      leppaTree.musicNotes.emitTimer -= LEPPA_TREE_MUSIC_NOTE_EMIT_INTERVAL;
      leppaTree.musicNotes.particles.push(
        createLeppaTreeMusicNoteParticle(leppaTree, textures.length)
      );
    }
    leppaTree.musicNotes.emitTimer = Math.min(
      leppaTree.musicNotes.emitTimer,
      LEPPA_TREE_MUSIC_NOTE_EMIT_INTERVAL
    );

    for (let index = leppaTree.musicNotes.particles.length - 1; index >= 0; index -= 1) {
      const particle = leppaTree.musicNotes.particles[index];
      particle.age += deltaTime;

      if (particle.age >= particle.duration) {
        leppaTree.musicNotes.particles.splice(index, 1);
        continue;
      }

      particle.position[0] += particle.drift[0] * deltaTime;
      particle.position[1] += particle.drift[1] * deltaTime;
      particle.position[2] += particle.drift[2] * deltaTime;
      particle.rotation += particle.rotationSpeed * deltaTime;
    }
  }

  function getLeppaTreeMusicNoteBillboards(leppaTree, textures, uvRect, now) {
    if (!leppaTree?.revived || !Array.isArray(textures) || textures.length === 0) {
      return [];
    }

    const particles = leppaTree.musicNotes?.particles || [];

    return particles.map((particle) => {
      const progress = clamp01(particle.age / particle.duration);
      const textureIndex = particle.textureIndex % textures.length;
      const aspect = LEPPA_TREE_MUSIC_NOTE_IMAGE_ASPECTS[textureIndex] || 1;
      const height = particle.size * (1 + progress * 0.22);
      const fadeIn = clamp01(progress / 0.18);
      const fadeOut = clamp01((1 - progress) / 0.32);
      const floatWobble = Math.sin(now * 0.0024 + particle.phase) * 0.045;

      return {
        texture: textures[textureIndex],
        position: [
          particle.position[0] + Math.sin(now * 0.0016 + particle.phase) * 0.045,
          particle.position[1],
          particle.position[2] + Math.cos(now * 0.0014 + particle.phase) * 0.045
        ],
        size: [height * aspect, height],
        uvRect,
        alpha: fadeIn * fadeOut,
        rotation: particle.rotation + floatWobble
      };
    });
  }

  function getLeppaTreeMissionParticleBillboards(leppaTree, texture, uvRect, now, storyState) {
    if (
      !isOpeningLeppaTreeRequestActive(storyState) ||
      !Array.isArray(leppaTree?.position) ||
      !texture
    ) {
      return [];
    }

    const time = now * 0.001;
    const [treeX, treeY, treeZ] = leppaTree.position;

    return Array.from({ length: LEPPA_TREE_MISSION_PARTICLE_COUNT }, (_, index) => {
      const cycle = (time * 0.38 + index * 0.137) % 1;
      const angle = time * (0.68 + (index % 3) * 0.08) + index * 2.399;
      const radius =
        LEPPA_TREE_MISSION_PARTICLE_RADIUS *
        (0.54 + (index % 4) * 0.12 + Math.sin(time * 1.7 + index) * 0.035);
      const fadeIn = clamp01(cycle / 0.22);
      const fadeOut = clamp01((1 - cycle) / 0.28);
      const pulse = 0.82 + Math.sin(time * 5.2 + index * 1.31) * 0.18;
      const size = (0.15 + (index % 3) * 0.024) * pulse * (1 - cycle * 0.18);

      return {
        texture,
        position: [
          treeX + Math.cos(angle) * radius,
          treeY + LEPPA_TREE_MISSION_PARTICLE_BASE_HEIGHT + cycle * LEPPA_TREE_MISSION_PARTICLE_HEIGHT,
          treeZ + Math.sin(angle) * radius
        ],
        size: [size, size],
        uvRect,
        alpha: fadeIn * fadeOut,
        rotation: angle * 0.18
      };
    });
  }

  function getSavePointStarBillboards(logChair, texture, uvRect, now) {
    if (!Array.isArray(logChair?.position) || !texture) {
      return [];
    }

    const time = now * 0.001;
    const [saveX, saveY, saveZ] = logChair.position;

    return Array.from({ length: SAVE_POINT_STAR_PARTICLE_COUNT }, (_, index) => {
      const cycle =
        (time / SAVE_POINT_STAR_PARTICLE_DURATION + index / SAVE_POINT_STAR_PARTICLE_COUNT) % 1;
      const angle = time * (0.84 + (index % 3) * 0.11) + index * 2.39996;
      const radius = SAVE_POINT_STAR_PARTICLE_RADIUS * (0.34 + cycle * 0.66);
      const fadeIn = clamp01(cycle / 0.16);
      const fadeOut = clamp01((1 - cycle) / 0.28);
      const pulse = 0.78 + Math.sin(time * 7.2 + index * 1.37) * 0.16;
      const size = (0.12 + (index % 3) * 0.024) * pulse * (1 + cycle * 0.18);

      return {
        texture,
        position: [
          saveX + Math.cos(angle) * radius,
          saveY + 0.24 + cycle * SAVE_POINT_STAR_PARTICLE_HEIGHT,
          saveZ + Math.sin(angle) * radius
        ],
        size: [size, size],
        uvRect,
        alpha: fadeIn * fadeOut,
        rotation: angle * 0.22 + time * 0.45
      };
    });
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
    const rawDeltaTime = Math.max(0, (now - previousTime) / 1000);
    const deltaTime = Math.min(0.033, rawDeltaTime);
    previousTime = now;
    fpsPanelController.update(rawDeltaTime);
    repairBoxElapsed += deltaTime;
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
    syncWorkbenchInteractable();
    syncPokemonCenterWorkshopVisualState();
    if (session.gameplayOpeningRequested) {
      gameplayCameraDirector.requestOpening();
      session.gameplayOpeningRequested = false;
      gameplayOpeningHudHidden = true;
      gameplayOpeningHudRevealAt = null;
      gameplayUiVisibility?.hideSections?.(["hud"]);
    }

    const gameplayOpeningCameraActive =
      gameplayCameraDirector.beginFrame({
        now,
        gameplayActive: isGameFlow(gameFlowValues.GAMEPLAY)
      });
    const movementBlocked = Boolean(
      gameplayOpeningCameraActive ||
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
        player: session.playerCharacter?.getPosition?.() || null,
        ship: session.gameplayOpeningShip?.visible ?
          session.gameplayOpeningShip.position :
          null
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

    if (
      gameplayOpeningCameraActive ||
      tutorialActive ||
      pokedexModalOpen ||
      skillLearnActive ||
      scriptedInteractionActive
    ) {
      controls.clearPendingActions();
    }

    if (
      gameplayOpeningCameraActive ||
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

    let playerMovedThisFrame = false;

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
      playerMovedThisFrame = movedDistance > 0.0005;
      syncPlayerModelInstance(deltaTime, [
        nextPlayerPosition[0] - previousPlayerPosition[0],
        nextPlayerPosition[2] - previousPlayerPosition[2]
      ]);

      if (
        movedDistance > 0.0005 &&
        !tutorialActive &&
        !gameplayOpeningCameraActive
      ) {
        restoreActiveZoomPresetOnMovement(nextPlayerPosition);
      }

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
    } else {
      syncPlayerModelInstance(deltaTime);
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
    updateWoodCollectPopEffects(deltaTime);

    const activeMoveId = controls.getActiveMoveId?.() || null;
    const waterGunEquipped = Boolean(
      controls.playerSkills?.waterGun &&
      activeMoveId === "waterGun"
    );
    const leafageEquipped = Boolean(
      controls.playerSkills?.leafage &&
      activeMoveId === "leafage"
    );
    const isWaterGunTreeTarget = (target) => Boolean(
      waterGunEquipped &&
      target?.palm
    );

    function performHarvestAction(playerPosition, options = {}) {
      const result = gameplay.performHarvestAction({
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

      if (result && options.useWaterGun) {
        recordSquirtleWaterGunUse();
      }

      return result;
    }

    const harvestRequest = controls.consumeHarvestRequest();
    const harvestRequested = Boolean(harvestRequest);
    const harvestRequestSource = typeof harvestRequest === "object" && harvestRequest !== null ?
      harvestRequest.source :
      null;
    const gamepadPrimaryMoveRequested = harvestRequestSource === "gamepadPrimary";

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
      const primaryActionPlacementTarget = Boolean(
        primaryActionTarget?.logChairPlacement ||
        primaryActionTarget?.strawBedPlacement ||
        primaryActionTarget?.leafDenKitPlacement ||
        primaryActionTarget?.leafDenFurniturePlacement ||
        primaryActionTarget?.dittoFlagPlacement
      );
      const primaryActionIsPlacement = primaryActionPlacementTarget && !gamepadPrimaryMoveRequested;
      const primaryActionPlacementBlocked = primaryActionPlacementTarget && gamepadPrimaryMoveRequested;
      const primaryActionIsMove = Boolean(
        (waterGunEquipped && primaryActionTarget?.groundCell) ||
        isWaterGunTreeTarget(primaryActionTarget) ||
        (leafageEquipped && primaryActionTarget?.leafageGroundCell)
      );
      if (
        waterGunEquipped &&
        (
          harvestRequestSource === "gamepadPrimary" ||
          harvestRequestSource === "keyboardPrimary"
        )
      ) {
        controls.storyState.flags[WATER_GUN_FIRST_USE_PROMPT_FLAG] = true;
      }
      const primaryInteractTarget =
        !dialogueActive &&
        !primaryActionIsPlacement &&
        !primaryActionIsMove ?
          gameplay.findNearbyInteractable(
            playerPosition,
            session.npcActors,
            session.interactables,
            controls.storyState,
            session.groundGrassPatches,
            session.logChair,
            session.leafDen,
            session.timburrEncounter,
            session.charmanderEncounter,
            session.leppaTree,
            session.bulbasaurEncounter
          ) :
          null;

      if (primaryActionPlacementBlocked) {
        // The trigger is reserved for the selected move. Placements use Enter or gamepad X.
      } else if (primaryActionIsPlacement) {
        performHarvestAction(playerPosition);
      } else if (primaryActionIsMove && !dialogueActive) {
        if (waterGunEquipped && primaryActionTarget?.groundCell) {
          const squirtleWaterGunResult = startSquirtleWaterGunAction({
            groundCell: primaryActionTarget.groundCell,
            playerPosition
          });

          if (squirtleWaterGunResult === "unavailable") {
            triggerWaterGunSfxBurst();
            performHarvestAction(playerPosition, {
              useWaterGun: true,
              forcedHarvestTarget: primaryActionTarget
            });
          }
        } else if (isWaterGunTreeTarget(primaryActionTarget)) {
          if (consumeSquirtleWaterStaminaForInstantAction()) {
            triggerWaterGunSfxBurst();
            performHarvestAction(playerPosition, {
              useWaterGun: true,
              forcedHarvestTarget: primaryActionTarget
            });
          }
        } else if (leafageEquipped && primaryActionTarget?.leafageGroundCell) {
          const bulbasaurLeafageResult = startBulbasaurLeafageAction({
            groundCell: primaryActionTarget.leafageGroundCell,
            playerPosition
          });

          if (bulbasaurLeafageResult === "unavailable") {
            performHarvestAction(playerPosition, {
              forcedHarvestTarget: primaryActionTarget
            });
          }
        }
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
          leppaTree: session.leppaTree,
          leppaBerryDrops: session.leppaBerryDrops,
          timburrEncounter: session.timburrEncounter,
          charmanderEncounter: session.charmanderEncounter,
          bulbasaurEncounter: session.bulbasaurEncounter,
          onNpcInteractionStart({
            targetId,
            playerPosition,
            npcActors,
            interactables,
            targetPosition
          }) {
            faceInteractionTargetTowardPlayer({
              targetId,
              playerPosition,
              npcActors,
              interactables
            });
            if (controls.isScriptedInteractionActive?.()) {
              return;
            }
            focusNpcConversationWhenDialogueOpens({
              targetId,
              playerPosition,
              npcActors,
              interactables,
              targetPosition
            });
          }
        });
      } else if (!dialogueActive) {
        performHarvestAction(playerPosition);
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
          triggerWaterGunSfxBurst();
          performHarvestAction(playerPosition, {
            useWaterGun: true,
            forcedHarvestTarget: waterGunTarget
          });
        }
      } else if (
        waterGunTarget?.leppaTree?.action === "water" ||
        waterGunTarget?.leppaTree?.action === "headbutt" ||
        (
          waterGunTarget?.palm
        )
      ) {
        if (consumeSquirtleWaterStaminaForInstantAction()) {
          triggerWaterGunSfxBurst();
          performHarvestAction(playerPosition, {
            forcedHarvestTarget: waterGunTarget,
            useWaterGun: true
          });
        }
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
        leppaTree: session.leppaTree,
        leppaBerryDrops: session.leppaBerryDrops,
        timburrEncounter: session.timburrEncounter,
        charmanderEncounter: session.charmanderEncounter,
        bulbasaurEncounter: session.bulbasaurEncounter,
        onNpcInteractionStart({
          targetId,
          playerPosition,
          npcActors,
          interactables,
          targetPosition
        }) {
          faceInteractionTargetTowardPlayer({
            targetId,
            playerPosition,
            npcActors,
            interactables
          });
          if (controls.isScriptedInteractionActive?.()) {
            return;
          }
          focusNpcConversationWhenDialogueOpens({
            targetId,
            playerPosition,
            npcActors,
            interactables,
            targetPosition
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
    session.updateCloudAtmosphere?.(deltaTime);
    gameplay.syncLeppaTreeState?.(session.leppaTree, controls.storyState);
    updateLeppaTreeDance(now);
    updateLeppaTreeMusicNotes(deltaTime);
    updateChopperNpcActor(session.chopperNpcActor, {
      deltaTime,
      storyState: controls.storyState,
      isNpcActive: rendering.isNpcActive,
      guidePosition: RUINED_POKEMON_CENTER_GUIDE_POSITION
    });
    updateBulbasaurEncounter(deltaTime);
    updateCharmanderEncounter(deltaTime);
    updateTimburrEncounter(deltaTime);
    syncCompanionRepairModules();
    syncBeeFieldRepairBox();
    syncBeeFieldBees(deltaTime);
    updateSquirtleReassembly(deltaTime);
    updateSquirtleWaterStamina(deltaTime);
    updateSquirtleWaterGunAction(deltaTime);
    waterGunSfxController.update({
      active: session.squirtleWaterGunAction?.phase === "spray" ||
        (now * 0.001) < waterGunSfxBurstUntilSeconds,
      nowSeconds: now * 0.001
    });
    updateBulbasaurLeafageAction(deltaTime);
    const robotIdlePatrolActive = Boolean(
      isGameFlow(gameFlowValues.GAMEPLAY) &&
      !gameplayOpeningCameraActive &&
      !cinematicActive &&
      !tutorialActive &&
      !pokedexModalOpen &&
      !dialogueActive &&
      !skillLearnActive &&
      !scriptedInteractionActive
    );
    updateSquirtleIdlePatrol(deltaTime, {
      active: robotIdlePatrolActive
    });
    updateBulbasaurIdlePatrol(deltaTime, {
      active: robotIdlePatrolActive
    });

    if (cinematicActive) {
      actTwoSequence.update(deltaTime);
      cinematicActive = isGameFlow(gameFlowValues.CINEMATIC);
      tutorialActive = isGameFlow(gameFlowValues.TUTORIAL);
    }

    if (session.playerCharacter && !cinematicActive) {
      if (!tutorialActive && !pokedexModalOpen && !skillLearnActive && !scriptedInteractionActive) {
        const woodDropSnapshots = snapshotAvailableWoodDrops(session.woodDrops);
        const collectedWoodCount = gameplay.collectWoodDrops(
          session.playerCharacter.getPosition(),
          session.woodDrops,
          controls.inventory
        );

        if (collectedWoodCount > 0) {
          triggerWoodCollectPopEffects(woodDropSnapshots);
          for (let woodIndex = 0; woodIndex < collectedWoodCount; woodIndex += 1) {
            woodGrabSfxController.update({
              active: true,
              nowSeconds: (now * 0.001) + woodIndex * 0.025
            });
          }
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
    }

    let gameplayOpeningCameraFrame = null;

    if (!cinematicActive) {
      if (tutorialCameraFocus && session.playerCharacter) {
        camera.setPose({
          target: [tutorialCameraFocus[0], 1.25, tutorialCameraFocus[2]],
          direction: cameraOrbit.getDirection(),
          zoom: 3.95,
          distance: 7.35
        });
      } else if (isGameFlow(gameFlowValues.GAMEPLAY)) {
        gameplayOpeningCameraFrame = gameplayCameraDirector.update({
          now,
          gameplayActive: true,
          playerPosition: session.playerCharacter?.getPosition?.() || null,
          canFollow: !dialogueActive && !cameraTransitionActive && !scriptedInteractionActive,
          spawnPlayer(spawnPosition) {
            session.spawnActTwoPlayer?.({
              configureCamera: false,
              position: spawnPosition
            });
            return session.playerCharacter?.getPosition?.() || null;
          },
          movePlayer(playerPosition) {
            session.playerCharacter?.setPosition?.(playerPosition);
          },
          ship: session.gameplayOpeningShip
        });
      } else if (session.playerCharacter && !dialogueActive && !camera.isTargetTransitionActive()) {
        camera.follow(session.playerCharacter.getPosition());
      }
    }

    for (const shipEvent of consumeGameplayOpeningShipEvents(session.gameplayOpeningShip)) {
      if (shipEvent.type === GAMEPLAY_OPENING_SHIP_EVENTS.FALL_STARTED) {
        shipFallSfxController.update({
          active: true
        });
      }

      if (shipEvent.type === GAMEPLAY_OPENING_SHIP_EVENTS.IMPACT) {
        shipFallSfxController.update({
          active: false
        });
        shipImpactSfxController.update({
          active: true,
          nowSeconds: now * 0.001
        });
      }

      if (shipEvent.type === GAMEPLAY_OPENING_SHIP_EVENTS.SETTLED) {
        shipFallSfxController.update({
          active: false
        });
      }
    }

    playerDrivingSfxController.update({
      active: playerMovedThisFrame || gameplayOpeningCameraFrame?.phase === "player-exit"
    });

    if (gameplayOpeningCameraFrame?.released && gameplayOpeningHudHidden) {
      gameplayOpeningHudRevealAt = now + GAMEPLAY_OPENING_HUD_REVEAL_DELAY_MS;
    }

    if (
      gameplayOpeningHudHidden &&
      gameplayOpeningHudRevealAt !== null &&
      now >= gameplayOpeningHudRevealAt &&
      isGameFlow(gameFlowValues.GAMEPLAY)
    ) {
      gameplayUiVisibility?.showSections?.(["hud"]);
      gameplayOpeningHudHidden = false;
      gameplayOpeningHudRevealAt = null;
    }

    const nearbyHarvestTarget =
      session.playerCharacter &&
      !gameplayOpeningCameraActive &&
      !cinematicActive &&
      !tutorialActive &&
      !skillLearnActive &&
      !scriptedInteractionActive ?
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
    const nearbyInvalidMoveTarget =
      session.playerCharacter &&
      !gameplayOpeningCameraActive &&
      !cinematicActive &&
      !tutorialActive &&
      !skillLearnActive &&
      !scriptedInteractionActive &&
      (
        (leafageEquipped && !nearbyHarvestTarget?.leafageGroundCell) ||
        (waterGunEquipped && !nearbyHarvestTarget?.groundCell)
      ) ?
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
          canPurifyGround: leafageEquipped,
          canUseLeafage: waterGunEquipped
        }) :
        null;
    const invalidMoveGroundCell = leafageEquipped ?
      nearbyInvalidMoveTarget?.groundCell :
      waterGunEquipped ?
        nearbyInvalidMoveTarget?.leafageGroundCell :
        null;
    const highlightedGroundCell =
      nearbyHarvestTarget?.groundCell ||
      nearbyHarvestTarget?.leafageGroundCell ||
      invalidMoveGroundCell ||
      null;
    const highlightedGroundCellTargetState =
      highlightedGroundCell && highlightedGroundCell === invalidMoveGroundCell ?
        "invalid" :
        "valid";
    const nearbyInteractable =
      session.playerCharacter &&
      !gameplayOpeningCameraActive &&
      !cinematicActive &&
      !tutorialActive &&
      !skillLearnActive &&
      !scriptedInteractionActive ?
        gameplay.findNearbyInteractable(
          session.playerCharacter.getPosition(),
          session.npcActors,
          session.interactables,
          controls.storyState,
          session.groundGrassPatches,
          session.logChair,
          session.leafDen,
          session.timburrEncounter,
          session.charmanderEncounter,
          session.leppaTree,
          session.bulbasaurEncounter
        ) :
        null;
    const activeQuest = gameplay.getActiveQuest(controls.storyState);
    const activeSystemQuest = gameplay.getActiveSystemQuest?.() || null;
    const pendingWaterGunGroundCells =
      !gameplayOpeningCameraActive &&
      !gameplayOpeningHudHidden &&
      !cinematicActive &&
      !tutorialActive &&
      !pokedexModalOpen &&
      !skillLearnActive &&
      !scriptedInteractionActive ?
        getPendingSquirtleWaterGunGroundCells() :
        [];
    const activeLeafageGroundCells =
      !gameplayOpeningCameraActive &&
      !gameplayOpeningHudHidden &&
      !cinematicActive &&
      !tutorialActive &&
      !pokedexModalOpen &&
      !skillLearnActive &&
      !scriptedInteractionActive &&
      session.bulbasaurLeafageAction?.groundCell ?
        [session.bulbasaurLeafageAction.groundCell] :
        [];
    const leppaTreeMissionGroundCells =
      !gameplayOpeningCameraActive &&
      !gameplayOpeningHudHidden &&
      !cinematicActive &&
      !tutorialActive &&
      !pokedexModalOpen &&
      !skillLearnActive &&
      !scriptedInteractionActive &&
      !gameplayDialogue.isActive() &&
      isOpeningLeppaTreeRequestActive(controls.storyState) ?
        getLeppaTreeSurroundingGroundCells(
          session.leppaTree,
          session.groundDeadInstances
        ) :
        [];
    const leppaTreeTileHintFlashing = Boolean(gameplay.isLeppaTreeTileHintFlashing?.());
    const markedGroundCellPulsePhase = leppaTreeTileHintFlashing ?
      (Math.sin(now * 0.035) + 1) * 0.5 :
      (Math.sin(now * 0.012) + 1) * 0.5;
    const markedActionGroundCells = [
      ...new Set([
        ...leppaTreeMissionGroundCells,
        ...pendingWaterGunGroundCells,
        ...activeLeafageGroundCells
      ])
    ];
    const transientNoticeRoute = resolveTransientNoticeRoute(hud.getNoticeMessage());
    const promptCopy =
      gameplayOpeningCameraActive ||
      cinematicActive ||
      tutorialActive ||
      skillLearnActive ||
      scriptedInteractionActive ?
      "" :
      gameplay.buildNearbyPrompt({
        harvestTarget: nearbyHarvestTarget,
        interactTarget: nearbyInteractable,
        quest: activeQuest,
        transientMessage: transientNoticeRoute.hudMessage,
        getItemLabel: gameplay.getItemLabel,
        storyState: controls.storyState,
        activeMoveId,
        pendingWaterGunCount: pendingWaterGunGroundCells.length
      });
    const shouldShowGroundCellHighlight =
      !gameplayOpeningCameraActive &&
      !cinematicActive &&
      !tutorialActive &&
      !pokedexModalOpen &&
      !skillLearnActive &&
      !scriptedInteractionActive &&
      !gameplayDialogue.isActive() &&
      Boolean(highlightedGroundCell);

    if (
      !gameplayOpeningCameraActive &&
      !gameplayOpeningHudHidden &&
      !cinematicActive &&
      !tutorialActive &&
      !pokedexModalOpen &&
      !skillLearnActive
    ) {
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
    syncActiveRepairBoxHighlight();
    nextFrame.render.viewProjection = followedViewProjection;
    nextFrame.render.sceneObjects = getSquirtleAssemblySceneObjects(
      getGameplayOpeningShipSceneObjects(
        session.sceneObjects,
        session.gameplayOpeningShip
      ),
      session.actTwoSquirtle
    );
    nextFrame.render.skyTexture = session.skyTexture;

    const tangrowthActor = session.npcActors.find((npcActor) => npcActor.id === "tangrowth");
    const tangrowthPosition =
      tangrowthActor?.character?.getPosition?.() ||
      null;
    const canShowWorldSpaceUi =
      !gameplayOpeningCameraActive &&
      !cinematicActive &&
      !tutorialActive &&
      !pokedexModalOpen &&
      !skillLearnActive &&
      !gameplayDialogue.isActive();
    const shouldShowTangrowthSpeech =
      canShowWorldSpaceUi &&
      activeQuest?.id === "meetTangrowth" &&
      tangrowthPosition;
    const shouldShowTangrowthLogChairSpeech =
      !shouldShowTangrowthSpeech &&
      canShowWorldSpaceUi &&
      controls.storyState.flags.tangrowthLogChairRequestAvailable &&
      !controls.storyState.flags.logChairReceived &&
      tangrowthPosition;
    const shouldShowTangrowthCampfireSpeech =
      !shouldShowTangrowthSpeech &&
      !shouldShowTangrowthLogChairSpeech &&
      canShowWorldSpaceUi &&
      controls.storyState.flags.campfireCrafted &&
      !controls.storyState.flags.campfireSpatOut &&
      tangrowthPosition;
    const shouldShowTangrowthPokemonCenterSpeech =
      !shouldShowTangrowthSpeech &&
      !shouldShowTangrowthLogChairSpeech &&
      !shouldShowTangrowthCampfireSpeech &&
      canShowWorldSpaceUi &&
      controls.storyState.flags.pokemonCenterGuideStarted &&
      !controls.storyState.flags.ruinedPokemonCenterInspected &&
      tangrowthPosition;
    const shouldShowTangrowthHouseSpeech =
      !shouldShowTangrowthSpeech &&
      !shouldShowTangrowthLogChairSpeech &&
      !shouldShowTangrowthCampfireSpeech &&
      !shouldShowTangrowthPokemonCenterSpeech &&
      canShowWorldSpaceUi &&
      controls.storyState.flags.tangrowthHouseTalkAvailable &&
      !controls.storyState.flags.tangrowthHouseTalkComplete &&
      tangrowthPosition;
    const shouldShowTangrowthCelebrationSpeech =
      !shouldShowTangrowthSpeech &&
      !shouldShowTangrowthLogChairSpeech &&
      !shouldShowTangrowthCampfireSpeech &&
      !shouldShowTangrowthPokemonCenterSpeech &&
      !shouldShowTangrowthHouseSpeech &&
      canShowWorldSpaceUi &&
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
      canShowWorldSpaceUi &&
      Boolean(session.bulbasaurEncounter?.visible) &&
      Boolean(session.bulbasaurEncounter?.position) &&
      controls.storyState.flags.bulbasaurRevealed &&
      !isOpeningLeppaTreeRequestActive(controls.storyState) &&
      !controls.storyState.flags.bulbasaurDryGrassMissionAccepted;
    const shouldShowBulbasaurWorkbenchGuideSpeech =
      !shouldShowTangrowthSpeech &&
      !shouldShowTangrowthLogChairSpeech &&
      !shouldShowTangrowthCampfireSpeech &&
      !shouldShowTangrowthPokemonCenterSpeech &&
      !shouldShowTangrowthHouseSpeech &&
      !shouldShowTangrowthCelebrationSpeech &&
      !shouldShowBulbasaurMissionSpeech &&
      canShowWorldSpaceUi &&
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
      canShowWorldSpaceUi &&
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
      canShowWorldSpaceUi &&
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
      canShowWorldSpaceUi &&
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
      canShowWorldSpaceUi &&
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
      canShowWorldSpaceUi &&
      Boolean(session.charmanderEncounter?.visible) &&
      Boolean(session.charmanderEncounter?.position) &&
      controls.storyState.flags.charmanderCelebrationRequestAvailable &&
      !controls.storyState.flags.charmanderCelebrationSuggested &&
      !controls.storyState.flags.charmanderCelebrationComplete;
    const nearbyRepairBoxPrompt = getNearbyRepairBoxPrompt(
      session.playerCharacter?.getPosition?.()
    );
    const shouldShowRepairBoxPrompt =
      canShowWorldSpaceUi &&
      Boolean(nearbyRepairBoxPrompt);
    const shouldShowWaterGunFirstUsePrompt =
      canShowWorldSpaceUi &&
      session.playerCharacter &&
      controls.playerSkills?.waterGun &&
      activeMoveId === "waterGun" &&
      !controls.storyState.flags[WATER_GUN_FIRST_USE_PROMPT_FLAG] &&
      !controls.isPrimaryActionActive?.();
    const squirtleChargingPosition = getSquirtleWorldPosition();
    const shouldShowSquirtleChargingPrompt =
      canShowWorldSpaceUi &&
      isSquirtleWaterCharging() &&
      Array.isArray(squirtleChargingPosition);
    const shouldShowCharacterWorldPrompt =
      canShowWorldSpaceUi &&
      !shouldShowRepairBoxPrompt &&
      session.playerCharacter &&
      nearbyInteractable?.target &&
      controls.shouldBagButtonInteract?.();
    const shouldShowTransientWorldPrompt =
      canShowWorldSpaceUi &&
      session.playerCharacter &&
      transientNoticeRoute.worldPromptMessage;

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

    if (shouldShowSquirtleChargingPrompt) {
      nextFrame.worldPrompt.visible = true;
      nextFrame.worldPrompt.text = "charging";
      nextFrame.worldPrompt.worldPosition = squirtleChargingPosition;
    } else if (shouldShowTransientWorldPrompt) {
      nextFrame.worldPrompt.visible = true;
      nextFrame.worldPrompt.text = transientNoticeRoute.worldPromptMessage;
      nextFrame.worldPrompt.worldPosition = session.playerCharacter.getPosition();
    } else if (shouldShowRepairBoxPrompt) {
      nextFrame.worldPrompt.visible = true;
      nextFrame.worldPrompt.text = nearbyRepairBoxPrompt.text;
      nextFrame.worldPrompt.worldPosition = nearbyRepairBoxPrompt.worldPosition;
    } else if (shouldShowWaterGunFirstUsePrompt) {
      nextFrame.worldPrompt.visible = true;
      nextFrame.worldPrompt.text = WATER_GUN_FIRST_USE_PROMPT_TEXT;
      nextFrame.worldPrompt.worldPosition = session.playerCharacter.getPosition();
    } else if (shouldShowCharacterWorldPrompt) {
      nextFrame.worldPrompt.visible = true;
      nextFrame.worldPrompt.text = "Press X";
      nextFrame.worldPrompt.worldPosition = session.playerCharacter.getPosition();
    }

    if (shouldShowGroundCellHighlight) {
      nextFrame.groundCellHighlight.visible = true;
      nextFrame.groundCellHighlight.groundCell = {
        ...highlightedGroundCell,
        highlightTargetState: highlightedGroundCellTargetState
      };
    }

    if (markedActionGroundCells.length) {
      nextFrame.groundCellHighlight.visible = true;
      nextFrame.groundCellHighlight.markedGroundCells.push(...markedActionGroundCells);
      nextFrame.groundCellHighlight.pulsePhase = markedGroundCellPulsePhase;
    }

    const questCompletionPop = gameplay.getQuestCompletionPop?.();
    if (
      questCompletionPop?.text &&
      session.playerCharacter &&
      !gameplayOpeningCameraActive &&
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
    if (Array.isArray(session.deadGrassInstances)) {
      session.deadGrassInstances.length = 0;
    }

    const grassBendPlayerPosition =
      session.playerCharacter && !cinematicActive ?
        session.playerCharacter.getPosition() :
        null;
    const grassCollisionObjects = getGrassCollisionObjects();
    const selectedRepairBoxParticleTarget = getSelectedRepairBoxParticleTarget();
    let shouldShowRepairBoxRustlingParticles = false;

    for (const groundGrassPatch of session.groundGrassPatches) {
      const hasRustlingEncounter =
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
      const shouldRustleGrass = false;
      const rustleOffset = shouldRustleGrass ? Math.sin(now * 0.024) * 0.11 : 0;
      const playerBend = getGrassPlayerBend(groundGrassPatch, grassBendPlayerPosition);
      const grassRevivalScale = getNatureRevivalScale(
        session.natureRevivalEffects,
        groundGrassPatch.id
      );
      const grassAlpha = getGrassObjectCollisionAlpha(
        groundGrassPatch,
        grassCollisionObjects
      );

      const aliveGrassModelAvailable = Boolean(
        groundGrassPatch.state === "alive" &&
        session.tallGrassModel &&
        Array.isArray(session.tallGrassInstances)
      );
      const deadGrassModelAvailable = Boolean(
        groundGrassPatch.state !== "alive" &&
        session.deadGrassModel &&
        Array.isArray(session.deadGrassInstances)
      );

      if (aliveGrassModelAvailable) {
        session.tallGrassInstances.push({
          id: `tall-grass-${groundGrassPatch.id}`,
          offset: [
            groundGrassPatch.position[0] + rustleOffset + playerBend.offsetX,
            groundGrassPatch.position[1],
            groundGrassPatch.position[2] + playerBend.offsetZ
          ],
          scale: getTallGrassInstanceScale(
            session.tallGrassModel,
            groundGrassPatch,
            grassRevivalScale
          ),
          alpha: grassAlpha,
          yaw: getTallGrassYaw(groundGrassPatch),
          swayStrength: getTallGrassSway(groundGrassPatch, shouldRustleGrass, now) + playerBend.swayStrength
        });
      } else if (deadGrassModelAvailable) {
        session.deadGrassInstances.push({
          id: `dead-grass-${groundGrassPatch.id}`,
          offset: [
            groundGrassPatch.position[0] + rustleOffset + playerBend.offsetX,
            groundGrassPatch.position[1],
            groundGrassPatch.position[2] + playerBend.offsetZ
          ],
          scale: getTallGrassInstanceScale(
            session.deadGrassModel,
            groundGrassPatch,
            grassRevivalScale
          ),
          alpha: grassAlpha,
          yaw: getTallGrassYaw(groundGrassPatch),
          swayStrength: playerBend.swayStrength
        });
      } else {
        nextFrame.render.grassBillboards.push({
          texture: groundGrassPatch.state === "alive" ?
            session.greenGrassTexture :
            session.deadGrassTexture,
          position: [
            groundGrassPatch.position[0] + rustleOffset + playerBend.offsetX,
            groundGrassPatch.position[1],
            groundGrassPatch.position[2] + playerBend.offsetZ
          ],
          size: groundGrassPatch.size.map((value) => value * grassRevivalScale),
          alpha: grassAlpha
        });
      }

      if (hasRustlingEncounter) {
        shouldShowRepairBoxRustlingParticles = true;
      }
    }

    if (shouldShowRepairBoxRustlingParticles && selectedRepairBoxParticleTarget) {
      nextFrame.render.genericBillboards.push(
        ...getRustlingGrassParticleBillboards(
          selectedRepairBoxParticleTarget,
          session.natureRevivalSparkTexture,
          now,
          rendering.fullUvRect
        )
      );
    }

    for (const groundFlowerPatch of session.groundFlowerPatches) {
      const flowerRevivalScale = getNatureRevivalScale(
        session.natureRevivalEffects,
        groundFlowerPatch.id
      );

      if (groundFlowerPatch.state === "alive") {
        nextFrame.render.flowerBillboards.push(
          ...getFlowerArrangementBillboards({
            groundFlowerPatch,
            texture: session.greenFlowerTexture,
            playerPosition: grassBendPlayerPosition,
            revivalScale: flowerRevivalScale,
            now
          })
        );
        continue;
      }

      nextFrame.render.flowerBillboards.push({
        texture: session.deadFlowerTexture,
        position: groundFlowerPatch.position,
        size: groundFlowerPatch.size.map((value) => value * flowerRevivalScale)
      });
    }

    nextFrame.render.woodTexture = session.woodTexture;
    nextFrame.render.woodDrops = session.woodDrops;
    nextFrame.render.genericBillboards.push(
      ...getWoodCollectPopBillboards(session.woodTexture, rendering.fullUvRect)
    );
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
    nextFrame.render.genericBillboards.push(
      ...getLeppaTreeMusicNoteBillboards(
        session.leppaTree,
        session.leppaTreeMusicalNoteTextures,
        rendering.fullUvRect,
        now
      )
    );
    nextFrame.render.genericBillboards.push(
      ...getLeppaTreeMissionParticleBillboards(
        session.leppaTree,
        session.natureRevivalSparkTexture,
        rendering.fullUvRect,
        now,
        controls.storyState
      )
    );
    appendGameplayOpeningShipBillboards({
      billboards: nextFrame.render.genericBillboards,
      ship: session.gameplayOpeningShip,
      fallbackTexture: session.gameplayOpeningShipTexture,
      dustTexture: session.playerDustTexture,
      smokeTexture: session.gameplayOpeningShipSmokeTexture,
      flashTexture: session.gameplayOpeningShipFlashTexture,
      fullUvRect: rendering.fullUvRect
    });
    if (session.logChair && controls.storyState.flags.logChairPlaced) {
      nextFrame.render.genericBillboards.push({
        texture: session.logChairTexture,
        position: session.logChair.position,
        size: session.logChair.size,
        uvRect: rendering.fullUvRect
      });
      nextFrame.render.genericBillboards.push(
        ...getSavePointStarBillboards(
          session.logChair,
          session.logChairStarTexture,
          rendering.fullUvRect,
          now
        )
      );
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
    if (session.billCameo?.visible) {
      nextFrame.render.genericBillboards.push({
        texture: session.billCameo.texture,
        position: session.billCameo.position,
        size: session.billCameo.size,
        uvRect: rendering.fullUvRect
      });
    }
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

    if (session.actTwoSquirtle?.modelInstance) {
      const squirtle = session.actTwoSquirtle;
      const visibleActTwoSquirtle =
        squirtle.visible ||
        squirtle.recovered ||
        actTwoTutorial.hasStarted() ||
        controls.storyState.questIndex >= 1;
      const assembledActTwoSquirtle =
        squirtle.recovered || squirtle.assemblyState === "assembled";
      syncSquirtleModelInstance();
      squirtle.modelInstance.active = Boolean(
        (visibleActTwoSquirtle && assembledActTwoSquirtle) ||
        session.squirtleWaterGunAction ||
        isSquirtleWaterCharging()
      );
    }
    const shouldShowSquirtleStamina =
      controls.playerSkills?.waterGun &&
      (
        activeMoveId === "waterGun" ||
        session.squirtleWaterGunAction ||
        isSquirtleWaterCharging() ||
        getSquirtleWaterStaminaState().current < SQUIRTLE_WATER_STAMINA_MAX
      );
    if (shouldShowSquirtleStamina) {
      nextFrame.render.genericBillboards.push(
        ...getSquirtleStaminaBillboards(
          session.squirtleWaterStaminaFillTexture,
          rendering.fullUvRect
        )
      );
    }
    nextFrame.render.genericBillboards.push(
      ...getSquirtleWaterGunBillboards(
        session.squirtleWaterGunAction,
        session.squirtleWaterSprayTexture,
        rendering.fullUvRect
      )
    );
    nextFrame.render.genericBillboards.push(
      ...getSquirtleChargingBillboards(
        session.squirtleChargingParticleTexture,
        rendering.fullUvRect,
        now
      )
    );
    if (!session.bulbasaurEncounter?.modelInstance) {
      nextFrame.render.genericBillboards.push({
        texture: session.bulbasaurEncounter?.visible ? session.bulbasaurEncounter.texture : null,
        position: session.bulbasaurEncounter?.visible ? session.bulbasaurEncounter.position : null,
        size: session.bulbasaurEncounter?.visible ? session.bulbasaurEncounter.size : null,
        uvRect: rendering.fullUvRect
      });
    }
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
