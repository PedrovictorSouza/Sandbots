import { createFrameSnapshotController } from "./frameSnapshotController.js";
import { createCameraZoomPresetController } from "./cameraZoomPresetController.js";
import { updatePlayerDustParticles } from "../session/playerDustParticles.js";
import {
  getSnowstormBillboards,
  getSnowstormFogIntensity,
  updateSnowstormParticleField
} from "../session/snowstormParticleField.js";
import { ACT_TWO_PLAYER_SPEED } from "../session/configurePlayerSpawner.js";
import {
  getNatureRevivalBillboards,
  getNatureRevivalScale,
  updateNatureRevivalEffects
} from "../session/natureRevivalEffects.js";
import { getColliderGizmoBillboards } from "../session/colliderGizmos.js";
import { updateIntroRoomFrame } from "../scenes/introRoom/introRoomSequence.js";
import { updateChopperNpcActor } from "../session/chopperNpcActor.js";
import { createGameplayCameraDirector } from "./gameplayCameraDirector.js";
import { createGameplayOpeningImpactEffect } from "./gameplayOpeningImpactEffect.js";
import {
  appendGameplayOpeningShipBillboards,
  consumeGameplayOpeningShipEvents,
  GAMEPLAY_OPENING_SHIP_EVENTS,
  getGameplayOpeningShipSceneObjects
} from "../session/gameplayOpeningShip.js";
import {
  CARBON_ITEM_ID,
  LEAVES_ITEM_ID,
  LEPPA_BERRY_ITEM_ID,
  LOG_CHAIR_ITEM_ID,
  RUINED_POKEMON_CENTER_GUIDE_POSITION,
  WORKBENCH_INTERACT_DISTANCE,
  WORKBENCH_POSITION
} from "../../gameplayContent.js";
import {
  BULBASAUR_TALK_INTERACT_DISTANCE,
  buildLogChairPlacement,
  getLeppaTreeSurroundingGroundCells,
  validateBuildingKitPlacement
} from "../../world/islandWorld.js";
import {
  canUseCharmanderFireWithCarbon,
  CHARMANDER_FIRE_CARBON_USES_FLAG,
  CHARMANDER_FIRE_USES_PER_CARBON
} from "../../world/gameplayInteractions.js";
import {
  BULBASAUR_IDLE_PATROL_RADIUS,
  SQUIRTLE_IDLE_PATROL_RADIUS
} from "./robotPatrolConfig.js";
import { resolveTransientNoticeRoute } from "./contextualPromptNotice.js";
import { syncFirstTaughtActionFreedomWindow } from "../story/earlyFreedomWindow.js";

const WATER_DROP_SFX_URL = new URL("../soundFx/water-drop..mp3", import.meta.url).href;
const PLAYER_DRIVING_SFX_URL = new URL("../soundFx/driving.mp3", import.meta.url).href;
const SHIP_IMPACT_SFX_URL = new URL("../soundFx/impact.mp3", import.meta.url).href;
const SHIP_FALL_SFX_URL = new URL("../soundFx/cartoon-fall.mp3", import.meta.url).href;
const WOOD_GRAB_SFX_URL = new URL("../soundFx/grab.mp3", import.meta.url).href;
const INSTANCE_OBJECT_SFX_URL = new URL("../soundFx/instance-object.mp3", import.meta.url).href;
const TRAIN_HOUSE_MUSIC_URL = new URL("../soundFx/train-house-music.mp3", import.meta.url).href;
const FIRE_FLAME_SFX_URL = new URL("../soundFx/fireflame.mp3", import.meta.url).href;
const TREE_BIRTH_SFX_URL = new URL("../soundFx/tree-birth.mp3", import.meta.url).href;
const GAMEPLAY_OPENING_HUD_REVEAL_DELAY_MS = 1500;
const LOG_CHAIR_PLACEMENT_PREVIEW_ALPHA = 0.42;
const BULBASAUR_DRY_GRASS_MISSION_RESTORE_COUNT = 10;
const SOLAR_STATION_PLACEMENT_PREVIEW_SPEED = 4.1;
const SOLAR_STATION_PLACEMENT_PREVIEW_FOOTPRINT = [2.2, 2.2];
const LEAF_DEN_KIT_PLACEMENT_PREVIEW_SPEED = 4.1;
const LEAF_DEN_KIT_PLACEMENT_PREVIEW_FOOTPRINT = [1.95, 1.45];
const LEAF_DEN_BUILT_ROTATION_FOOTPRINT = [
  LEAF_DEN_KIT_PLACEMENT_PREVIEW_FOOTPRINT[0] * 2,
  LEAF_DEN_KIT_PLACEMENT_PREVIEW_FOOTPRINT[1] * 2
];
const PLACEMENT_ROTATION_STEP = Math.PI * 0.5;
const WORKBENCH_OBJECT_ROTATE_DISTANCE = 3.2;
const LEAF_DEN_KIT_SOLAR_STATION_RADIUS_MULTIPLIER = 3;
const LEAF_DEN_CONSTRUCTION_CLOUD_COUNT = 18;
const LEAF_DEN_CONSTRUCTION_STAR_COUNT = 12;
const CONSTRUCTION_CLOUD_BURST_MAX_EFFECTS = 3;
const CONSTRUCTION_CLOUD_BURST_CLOUD_COUNT = 14;
const CONSTRUCTION_CLOUD_BURST_STAR_COUNT = 10;
const LEAF_DEN_CONSTRUCTION_CLOUD_RADIUS_X = 1.48;
const LEAF_DEN_CONSTRUCTION_CLOUD_RADIUS_Z = 1.08;
const LEAF_DEN_CONSTRUCTION_CLOUD_BASE_Y = 0.42;
const LEAF_DEN_CONSTRUCTION_CLOUD_BOB = 0.3;
const LEAF_DEN_CONSTRUCTION_BAR_WIDTH = 2.5;
const LEAF_DEN_CONSTRUCTION_BAR_HEIGHT = 0.2;
const LEAF_DEN_CONSTRUCTION_BAR_Y = 2.55;
const LEAF_DEN_BUSY_NOTICE = "im busy, boss...";
const SOLAR_STATION_FIELD_MARKED_TILE_LIMIT = 81;
const BULBASAUR_WORKBENCH_GUIDE_START = [8.55, 0.02, -5.7];
const BULBASAUR_WORKBENCH_GUIDE_SPEED = 2.4;
const BULBASAUR_WORKBENCH_GUIDE_WAYPOINT_DISTANCE = 0.08;
const BULBASAUR_WORKBENCH_GUIDE_RAMP_COLLIDER_ID = "workbench-ramp-collider";
const BULBASAUR_WORKBENCH_GUIDE_RAMP_APPROACH_MARGIN = 0.92;
const BULBASAUR_WORKBENCH_GUIDE_SIDE_APPROACH_MARGIN = 1.22;
const CHOPPER_BULBASAUR_REPAIR_BOX_INVESTIGATION_OFFSET = [-1.12, 0, -0.86];
const CHOPPER_BULBASAUR_REPAIR_BOX_SPEECH = "What is this?";
const BEE_FIELD_FLOWER_GROUP_ID = "water-gun-flower-field-0";
const BEE_FIELD_REPAIR_BOX_LOCKED_ALPHA = 0.5;
const BEE_FIELD_BEE_COUNT = 10;
const BEE_FIELD_BEE_SCALE = 0.15;
const BEE_FIELD_BEE_PATROL_RADIUS_X = 5.8;
const BEE_FIELD_BEE_PATROL_RADIUS_Z = 4.3;
const BEE_FIELD_BEE_BASE_HEIGHT = 1.04;
const BEE_FIELD_BEE_BOB_HEIGHT = 0.22;
const BEE_MODEL_FACE_YAW_OFFSET = Math.PI;
const CHARMANDER_FOLLOW_SPEED = ACT_TWO_PLAYER_SPEED;
const CHARMANDER_FOLLOW_DISTANCE = 1.28;
const CHARMANDER_CAMPFIRE_LIGHT_DISTANCE = 1.9;
const TIMBURR_FOLLOW_SPEED = ACT_TWO_PLAYER_SPEED;
const TIMBURR_FOLLOW_DISTANCE = 1.62;
const SQUIRTLE_FOLLOW_SPEED = ACT_TWO_PLAYER_SPEED;
const SQUIRTLE_FOLLOW_DISTANCE = 1.18;
const BULBASAUR_FOLLOW_SPEED = ACT_TWO_PLAYER_SPEED;
const BULBASAUR_FOLLOW_DISTANCE = 1.46;
const ACTIVE_MOVE_COMPANION_FOLLOW_DISTANCE = 1.12;
const INACTIVE_MOVE_COMPANION_FOLLOW_DISTANCE = 2.28;
const COMPANION_FOLLOW_FORMATION_ORDER = Object.freeze(["squirtle", "bulbasaur", "charmander", "timburr"]);
const COMPANION_FOLLOW_ACTIVE_MOVE_COMPANIONS = Object.freeze({
  waterGun: "squirtle",
  leafage: "bulbasaur",
  fire: "charmander"
});
const COMPANION_FOLLOW_LINE_FIRST_DISTANCE = 1.18;
const COMPANION_FOLLOW_LINE_SLOT_SPACING = 1.18;
const COMPANION_FOLLOW_SLOT_ARRIVE_DISTANCE = 0.08;
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
const SQUIRTLE_WATER_GUN_SFX_VOLUME = 0.638;
const SQUIRTLE_WATER_GUN_USE_COUNT_FLAG = "squirtleWaterGunUseCount";
const SQUIRTLE_WATER_GUN_BASE_LEVEL = 11;
const SQUIRTLE_WATER_GUN_USES_PER_LEVEL = 3;
const SQUIRTLE_WATER_GUN_EVOLUTION_MAX_USES = 24;
const SQUIRTLE_WATER_GUN_MAX_SPEED_MULTIPLIER = 1.7;
const SQUIRTLE_WATER_GUN_MIN_SPRAY_DURATION = 0.46;
const SQUIRTLE_WATER_GUN_MIN_IMPACT_TIME = 0.18;
const PLAYER_DRIVING_SFX_VOLUME = 0.528;
const SHIP_IMPACT_SFX_VOLUME = 0.814;
const SHIP_FALL_SFX_VOLUME = 0.55;
const WOOD_GRAB_SFX_VOLUME = 0.748;
const INSTANCE_OBJECT_SFX_VOLUME = 0.726;
const FIELD_MOVE_INVALID_SFX_VOLUME = 0.34;
const FIRE_FLAME_SFX_VOLUME = 0.78;
const TREE_BIRTH_SFX_VOLUME = 0.74;
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
const CHARMANDER_CARBON_BAR_WIDTH = 1.72;
const CHARMANDER_CARBON_BAR_HEIGHT = 0.2;
const CHARMANDER_CARBON_BAR_Y_OFFSET = 1.18;
const CHARMANDER_CARBON_BAR_FILL_DEPTH_OFFSET = 0.035;
const CHARMANDER_CARBON_VISUAL_DECREASE_DURATION = 0.24;
const CHARMANDER_CARBON_VISUAL_INCREASE_DURATION = 0.18;
const SQUIRTLE_CHARGING_PARTICLE_COUNT = 14;
const SQUIRTLE_CHARGING_PARTICLE_RADIUS = 0.72;
const SQUIRTLE_CHARGING_PARTICLE_DURATION = 1.15;
const CHARMANDER_FIRE_SPEED = 4.2;
const CHARMANDER_FIRE_STAND_DISTANCE = 1.72;
const CHARMANDER_FIRE_ARRIVE_DISTANCE = 0.08;
const CHARMANDER_FIRE_SPRAY_DURATION = 1.44;
const CHARMANDER_FIRE_IMPACT_TIME = 0.56;
const CHARMANDER_FIRE_VISUAL_SCALE = 3;
const CHARMANDER_FIRE_ARC_HEIGHT = 0.42 * CHARMANDER_FIRE_VISUAL_SCALE;
const CHARMANDER_FIRE_PARTICLE_COUNT = 30;
const CHARMANDER_FIRE_PARTICLE_LIFETIME_MIN = 0.2;
const CHARMANDER_FIRE_PARTICLE_LIFETIME_MAX = 1;
const CHARMANDER_FIRE_PARTICLE_SIZE_MIN = 0.2 * CHARMANDER_FIRE_VISUAL_SCALE;
const CHARMANDER_FIRE_PARTICLE_SIZE_MAX = 0.4 * CHARMANDER_FIRE_VISUAL_SCALE;
const CHARMANDER_FIRE_CONE_RADIUS = 0.1813 * CHARMANDER_FIRE_VISUAL_SCALE;
const CHARMANDER_FIRE_NOISE_STRENGTH = 0.09 * CHARMANDER_FIRE_VISUAL_SCALE;
const CHARMANDER_FIRE_NOISE_POSITION_AMOUNT = 0.191 * CHARMANDER_FIRE_VISUAL_SCALE;
const CHARMANDER_FIRE_NOISE_ROTATION_AMOUNT = 1.677;
const CHARMANDER_FIRE_BURST_PARTICLE_COUNT = 16;
const CHARMANDER_FIRE_BURST_DURATION = 0.84;
const CHARMANDER_FIRE_BURST_RADIUS = 0.74 * CHARMANDER_FIRE_VISUAL_SCALE;
const WATER_GUN_FIRST_USE_PROMPT_FLAG = "waterGunFirstUsePromptDismissed";
const WATER_GUN_FIRST_USE_PROMPT_TEXT = "Press LT to use Squirtle";
const LEAFAGE_SWITCH_PROMPT_TEXT = "Press LT on dry ground, then ← / → to select Bulbasaur";
const SNOWSTORM_FOG_MAX_OPACITY = 0.54;
const SNOWSTORM_FOG_OPACITY_EASE = 6.2;
const LEAFAGE_USE_PROMPT_TEXT = "Use LT on green ground";
const LEAFAGE_INVALID_TARGET_PROMPT_TEXT = "CHOOSE SQUIRTLE TO DRY FIRST";
const LEAFAGE_INVALID_TARGET_PROMPT_DURATION_MS = 1600;
const FIRE_INVALID_TARGET_PROMPT_TEXT = "USE FIRE ON WHITE GROUND";
const FIRE_INVALID_TARGET_PROMPT_DURATION_MS = 1600;
const GROUND_ACTION_FEEDBACK_DURATION_MS = 520;
const TREE_REVIVAL_LEAF_BURST_COUNT = 18;
const TREE_REVIVAL_LEAF_BURST_DURATION = 1.65;
const TREE_REVIVAL_LEAF_BURST_BASE_HEIGHT = 1.16;
const TREE_REVIVAL_LEAF_BURST_HEIGHT_RANGE = 0.86;
const TREE_REVIVAL_LEAF_BURST_GRAVITY = 0.54;
const TREE_REVIVAL_LEAF_BURST_DRIFT = 0.68;
const TREE_REVIVAL_LEAF_BURST_SIZE_MIN = 0.22;
const TREE_REVIVAL_LEAF_BURST_SIZE_MAX = 0.42;
const LANDSCAPE_CUT_EFFECT_DURATION = 0.46;
const LANDSCAPE_CUT_EFFECT_LERP_PORTION = 0.62;
const LANDSCAPE_CUT_EFFECT_LIFT = 0.13;
const LANDSCAPE_CUT_EFFECT_POP_SCALE = 1.18;
const FIELD_MOVE_INVALID_GROUND_CELL_RADIUS_FACTOR = 0.82;
const PLAYER_COUNTER_PROMPT_DURATION_MS = 1500;
const LEAF_RESOURCE_BILLBOARD_SIZE = Object.freeze([0.72, 0.72]);
const LEAF_RESOURCE_BILLBOARD_Y_OFFSET = 0.32;
const CAMPFIRE_WOOD_PILE_SIZE = Object.freeze([0.52, 0.38]);
const TRAIN_HOUSE_MUSIC_FULL_DISTANCE = 1.25;
const TRAIN_HOUSE_MUSIC_FADE_DISTANCE = 16.4;
const TRAIN_HOUSE_MUSIC_MAX_VOLUME = 0.74;
const TRAIN_HOUSE_DANCE_SIDE_SWAY = 0.055;
const TRAIN_HOUSE_DANCE_FORWARD_SWAY = 0.025;
const TRAIN_HOUSE_DANCE_SCALE_PULSE = 0.045;
const TRAIN_HOUSE_DANCE_YAW_SWAY = 0.06;
const TRAIN_HOUSE_DANCE_TOP_SWAY = 0.08;
const INTERACTION_INFO_ICON_SIZE = Object.freeze([0.72, 0.72]);
const WORKBENCH_INFO_ICON_OFFSET = Object.freeze([1.42, 1.34, -0.42]);
const POKEMON_CENTER_PC_INFO_ICON_OFFSET = Object.freeze([0.82, 1.22, 0.04]);
const CAMPFIRE_WOOD_PILE_OFFSETS = Object.freeze([
  [-0.36, 0.02, -0.16, -0.48],
  [0.34, 0.025, -0.12, 0.48],
  [-0.18, 0.03, 0.22, 0.08],
  [0.18, 0.035, 0.2, -0.16],
  [0, 0.045, -0.01, 0.82]
]);
const BULBASAUR_INTERACTION_GIZMO_DOT_COUNT = 36;
const BULBASAUR_INTERACTION_GIZMO_DOT_SIZE = 0.16;
const COMPANION_LOST_HINT_INITIAL_DELAY_MS = 5200;
const COMPANION_LOST_HINT_REPEAT_MS = 13000;
const COMPANION_LOST_HINT_DURATION_MS = 3400;
const SQUIRTLE_WATER_GUN_HINT_TEXT = "Press LT to use Water Gun.";
const BULBASAUR_SWITCH_TO_SQUIRTLE_HINT_TEXT = "Press Left to change to Squirtle.";
const SQUIRTLE_REASSEMBLY_PART_SCALE = 0.5;
const SQUIRTLE_MODEL_FACE_YAW_OFFSET = Math.PI;
const BULBASAUR_MODEL_FACE_YAW_OFFSET = Math.PI;
const CHARMANDER_MODEL_FACE_YAW_OFFSET = Math.PI;
const ROBOT_MODEL_SCALE = 0.5;
const BULBASAUR_ROBOT_MODEL_SCALE = ROBOT_MODEL_SCALE * 1.3;
const CHARMANDER_MODEL_SCALE = 0.75;
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
const BULBASAUR_REVEAL_FLASH_PEAK_OPACITY = 0.86;
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

export function resolveCompanionFollowDistance({
  companionId,
  activeMoveId,
  defaultDistance,
  formationIndex = null
} = {}) {
  if (Number.isFinite(formationIndex)) {
    return COMPANION_FOLLOW_LINE_FIRST_DISTANCE +
      Math.max(0, Math.floor(formationIndex)) * COMPANION_FOLLOW_LINE_SLOT_SPACING;
  }

  if (activeMoveId === "waterGun") {
    if (companionId === "squirtle") {
      return ACTIVE_MOVE_COMPANION_FOLLOW_DISTANCE;
    }

    if (companionId === "bulbasaur") {
      return INACTIVE_MOVE_COMPANION_FOLLOW_DISTANCE;
    }
  }

  if (activeMoveId === "leafage") {
    if (companionId === "bulbasaur") {
      return ACTIVE_MOVE_COMPANION_FOLLOW_DISTANCE;
    }

    if (companionId === "squirtle") {
      return INACTIVE_MOVE_COMPANION_FOLLOW_DISTANCE;
    }
  }

  return defaultDistance;
}

export function resolveCompanionFollowSpeed() {
  return ACT_TWO_PLAYER_SPEED;
}

export function resolveTrainHouseMusicVolume({
  playerPosition,
  trainHousePosition,
  fullDistance = TRAIN_HOUSE_MUSIC_FULL_DISTANCE,
  fadeDistance = TRAIN_HOUSE_MUSIC_FADE_DISTANCE,
  maxVolume = TRAIN_HOUSE_MUSIC_MAX_VOLUME
} = {}) {
  if (!Array.isArray(playerPosition) || !Array.isArray(trainHousePosition)) {
    return 0;
  }

  const distance = Math.hypot(
    playerPosition[0] - trainHousePosition[0],
    playerPosition[2] - trainHousePosition[2]
  );
  if (!Number.isFinite(distance) || distance >= fadeDistance) {
    return 0;
  }

  if (distance <= fullDistance) {
    return maxVolume;
  }

  const proximity = 1 - ((distance - fullDistance) / Math.max(0.001, fadeDistance - fullDistance));
  const easedProximity = clamp01(proximity) * clamp01(proximity) * (3 - 2 * clamp01(proximity));
  return maxVolume * easedProximity;
}

export function applyTrainHouseDance(instance, placementPosition, nowSeconds = 0, placementYaw = 0) {
  if (!instance || !Array.isArray(placementPosition)) {
    return false;
  }

  const baseScale = instance.trainHouseBaseScale ?? Number(instance.scale || 1);
  const baseYaw = instance.trainHouseBaseYaw ?? Number(instance.yaw || 0);
  const groundY = instance.trainHouseGroundY ?? Number(instance.offset?.[1] ?? placementPosition[1] ?? 0.02);
  instance.trainHouseBaseScale = baseScale;
  instance.trainHouseBaseYaw = baseYaw;
  instance.trainHouseGroundY = groundY;

  const beat = Number.isFinite(nowSeconds) ? nowSeconds : 0;
  instance.offset = [
    placementPosition[0] + Math.sin(beat * 3.4) * TRAIN_HOUSE_DANCE_SIDE_SWAY,
    groundY,
    placementPosition[2] + Math.sin(beat * 4.8 + 1.1) * TRAIN_HOUSE_DANCE_FORWARD_SWAY
  ];
  instance.scale = baseScale * (1 + Math.sin(beat * 5.2) * TRAIN_HOUSE_DANCE_SCALE_PULSE);
  instance.yaw =
    baseYaw +
    Number(placementYaw || 0) +
    Math.sin(beat * 3.1 + 0.4) * TRAIN_HOUSE_DANCE_YAW_SWAY;
  instance.swayStrength = Math.sin(beat * 4.4 + 0.6) * TRAIN_HOUSE_DANCE_TOP_SWAY;
  instance.active = true;
  return true;
}

function createInteractionInfoBillboard(texture, basePosition, offset, uvRect) {
  if (!texture || !Array.isArray(basePosition) || !Array.isArray(offset)) {
    return null;
  }

  return {
    texture,
    position: [
      basePosition[0] + offset[0],
      basePosition[1] + offset[1],
      basePosition[2] + offset[2]
    ],
    size: INTERACTION_INFO_ICON_SIZE,
    uvRect
  };
}

function syncCarbonOreResourceInstances(resourceNodes = [], storyState = {}) {
  for (const resourceNode of resourceNodes) {
    if (resourceNode?.itemId !== CARBON_ITEM_ID || !resourceNode.usesModelInstance) {
      continue;
    }

    resourceNode.offset = Array.isArray(resourceNode.position) ?
      [...resourceNode.position] :
      resourceNode.offset;
    resourceNode.active =
      Number(resourceNode.cooldown || 0) <= 0 &&
      (typeof resourceNode.activeWhen !== "function" || resourceNode.activeWhen(storyState));
  }
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getPlacementRect(position, size = [1, 1]) {
  const width = Math.max(0.01, Number(size?.[0]) || 1);
  const depth = Math.max(0.01, Number(size?.[1]) || 1);

  return {
    minX: position[0] - width * 0.5,
    maxX: position[0] + width * 0.5,
    minZ: position[2] - depth * 0.5,
    maxZ: position[2] + depth * 0.5
  };
}

function doPlacementRectsOverlap(a, b, gutter = 0.12) {
  return !(
    a.maxX - gutter <= b.minX + gutter ||
    a.minX + gutter >= b.maxX - gutter ||
    a.maxZ - gutter <= b.minZ + gutter ||
    a.minZ + gutter >= b.maxZ - gutter
  );
}

function getPlacementCollisionSize(placement, fallbackSize = [1, 1]) {
  if (
    Array.isArray(placement?.size) &&
    Number(placement.size[0]) > 0 &&
    Number(placement.size[1]) > 0
  ) {
    return placement.size;
  }

  return fallbackSize;
}

function normalizePlacementYaw(yaw = 0) {
  const tau = Math.PI * 2;
  return ((Number(yaw || 0) % tau) + tau) % tau;
}

function getRotatedPlacementSize(size = [1, 1], yaw = 0) {
  const width = Math.max(0.01, Number(size?.[0]) || 1);
  const depth = Math.max(0.01, Number(size?.[1]) || 1);
  const quarterTurn = Math.round(normalizePlacementYaw(yaw) / PLACEMENT_ROTATION_STEP) % 4;
  return quarterTurn % 2 === 1 ? [depth, width] : [width, depth];
}

function hasFinitePlacementBounds(bounds) {
  return Boolean(
    bounds &&
    Number.isFinite(bounds.minX) &&
    Number.isFinite(bounds.maxX) &&
    Number.isFinite(bounds.minZ) &&
    Number.isFinite(bounds.maxZ)
  );
}

function buildSolarStationFieldMarkedGroundCells(placementTarget) {
  const bounds = placementTarget?.bounds;

  if (placementTarget?.showField === false || !hasFinitePlacementBounds(bounds)) {
    return [];
  }

  const gridStep = Math.max(0.25, Number(placementTarget?.gridStep) || 1.425);
  const cells = [];
  let rowIndex = 0;

  for (
    let z = bounds.minZ;
    z <= bounds.maxZ + gridStep * 0.25 && cells.length < SOLAR_STATION_FIELD_MARKED_TILE_LIMIT;
    z += gridStep
  ) {
    let columnIndex = 0;

    for (
      let x = bounds.minX;
      x <= bounds.maxX + gridStep * 0.25 && cells.length < SOLAR_STATION_FIELD_MARKED_TILE_LIMIT;
      x += gridStep
    ) {
      cells.push({
        id: `solar-station-field-${columnIndex}-${rowIndex}`,
        offset: [
          Number(x.toFixed(3)),
          0.02,
          Number(z.toFixed(3))
        ],
        surfaceY: 0.02,
        tileSpan: gridStep
      });
      columnIndex += 1;
    }

    rowIndex += 1;
  }

  return cells;
}

function getSolarStationPlacementBlockers(session, storyState) {
  const blockers = [];

  if (session.logChair?.position && storyState.flags.logChairPlaced) {
    blockers.push({
      position: session.logChair.position,
      size: getPlacementCollisionSize(session.logChair)
    });
  }

  if (session.leafDen?.position && storyState.flags.leafDenKitPlaced) {
    blockers.push({
      position: session.leafDen.position,
      size: storyState.flags.leafDenBuilt ? [2.55, 1.85] : getPlacementCollisionSize(session.leafDen)
    });
  }

  for (const playerHouse of session.playerHouses || []) {
    if (!Array.isArray(playerHouse?.position)) {
      continue;
    }

    blockers.push({
      position: playerHouse.position,
      size: LEAF_DEN_BUILT_ROTATION_FOOTPRINT
    });
  }

  if (session.campfire?.position && storyState.flags.campfireSpatOut) {
    blockers.push({
      position: session.campfire.position,
      size: getPlacementCollisionSize(session.campfire, [1.7, 1.45])
    });
  }

  if (session.dittoFlag?.position && storyState.flags.dittoFlagPlacedOnHouse) {
    blockers.push({
      position: session.dittoFlag.position,
      size: getPlacementCollisionSize(session.dittoFlag)
    });
  }

  if (session.challengeBoulder?.position && storyState.flags.boulderChallengeAvailable) {
    blockers.push({
      position: session.challengeBoulder.position,
      size: getPlacementCollisionSize(session.challengeBoulder, [1.82, 1.42])
    });
  }

  if (storyState.flags.leafDenInteriorEntered) {
    for (const furniture of session.leafDenFurniture || []) {
      if (!Array.isArray(furniture?.position)) {
        continue;
      }

      blockers.push({
        position: furniture.position,
        size: getPlacementCollisionSize(furniture)
      });
    }
  }

  return blockers;
}

function getTerrainColliderPlacementRect(collider) {
  if (!collider?.blocksPlayer || !Array.isArray(collider.position)) {
    return null;
  }

  const padding = Number(collider.padding || 0);
  const width = Math.max(0.01, Number(collider.size?.[0]) || 1) + padding * 2;
  const depth = Math.max(0.01, Number(collider.size?.[2]) || 1) + padding * 2;
  return getPlacementRect(collider.position, [width, depth]);
}

function doesPlacementOverlapTerrainCollider(placementRect, collider) {
  const colliderRect = getTerrainColliderPlacementRect(collider);
  return colliderRect ? doPlacementRectsOverlap(placementRect, colliderRect, 0) : false;
}

function isSolarStationPlacementBlocked(session, storyState, placementRect) {
  const hasObjectCollision = getSolarStationPlacementBlockers(session, storyState)
    .some((blocker) => {
      return doPlacementRectsOverlap(
        placementRect,
        getPlacementRect(blocker.position, blocker.size)
      );
    });

  if (hasObjectCollision) {
    return true;
  }

  return (session.elevatedTerrainColliders || [])
    .some((collider) => doesPlacementOverlapTerrainCollider(placementRect, collider));
}

function getSolarStationPowerPosition(session, storyState) {
  if (
    !storyState?.flags?.strawBedPlacedInBulbasaurHabitat ||
    !Array.isArray(session?.strawBed?.position)
  ) {
    return null;
  }

  return session.strawBed.position;
}

function getSolarStationPowerRadius(session) {
  const modelScale = Number(
    session?.strawBedModelInstance?.solarStationFinalScale ||
    session?.strawBedModelInstance?.scale
  );

  if (Number.isFinite(modelScale) && modelScale > 0) {
    return modelScale * LEAF_DEN_KIT_SOLAR_STATION_RADIUS_MULTIPLIER;
  }

  const fallbackSize = getPlacementCollisionSize(
    session?.strawBed,
    SOLAR_STATION_PLACEMENT_PREVIEW_FOOTPRINT
  );
  return Math.max(fallbackSize[0], fallbackSize[1]) * LEAF_DEN_KIT_SOLAR_STATION_RADIUS_MULTIPLIER;
}

function isInsideSolarStationPowerRadius(session, storyState, position) {
  const solarStationPosition = getSolarStationPowerPosition(session, storyState);
  if (!solarStationPosition || !Array.isArray(position)) {
    return false;
  }

  const distance = Math.hypot(
    position[0] - solarStationPosition[0],
    position[2] - solarStationPosition[2]
  );
  return distance <= getSolarStationPowerRadius(session);
}

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

function hashUnit(seed) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
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

  function play(nextVolume = volume) {
    const loopAudio = getAudio();
    if (!loopAudio) {
      return;
    }

    loopAudio.loop = true;
    loopAudio.volume = nextVolume;
    if (activeLastFrame) {
      return;
    }

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
    update({ active, volume: nextVolume = volume }) {
      if (active) {
        play(nextVolume);
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
  let snowstormFogOverlayElement = null;
  let snowstormFogOpacity = 0;
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
  const gameplayOpeningImpactEffect = createGameplayOpeningImpactEffect({
    mount,
    canvasWidth: worldCanvas?.width,
    canvasHeight: worldCanvas?.height
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
  const trainHouseMusicController = createLoopingSfxController({
    src: TRAIN_HOUSE_MUSIC_URL,
    volume: TRAIN_HOUSE_MUSIC_MAX_VOLUME
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
  const fieldMoveInvalidSfxController = createRepeatingSfxController({
    src: SHIP_IMPACT_SFX_URL,
    interval: 0.14,
    volume: FIELD_MOVE_INVALID_SFX_VOLUME
  });
  const fireFlameSfxController = createRepeatingSfxController({
    src: FIRE_FLAME_SFX_URL,
    interval: Number.POSITIVE_INFINITY,
    volume: FIRE_FLAME_SFX_VOLUME
  });
  const treeBirthSfxController = createRepeatingSfxController({
    src: TREE_BIRTH_SFX_URL,
    interval: 0,
    volume: TREE_BIRTH_SFX_VOLUME
  });
  const woodCollectPopEffects = [];
  let repairBoxElapsed = 0;
  let waterGunSfxBurstUntilSeconds = 0;
  let repairBoxRevealFlashElement = null;
  let companionLostHintKey = null;
  let companionLostHintNextAt = 0;
  let companionLostHintActiveUntil = 0;
  let companionLostHintActive = null;
  let leafageInvalidTargetPromptUntil = 0;
  let fireInvalidTargetPromptUntil = 0;
  let groundActionFeedback = null;
  let playerCounterPrompt = null;
  let companionFollowDirection = null;
  let workbenchRotationSelection = null;
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

  function playFieldMoveInvalidSfx() {
    fieldMoveInvalidSfxController.update({
      active: true,
      nowSeconds: getRuntimeNowSeconds()
    });
  }

  function playTreeBirthSfx() {
    treeBirthSfxController.update({
      active: true,
      nowSeconds: getRuntimeNowSeconds()
    });
  }

  function getSnappedSolarStationPreviewPosition(preview) {
    const bounds = preview?.bounds;
    const position = Array.isArray(preview?.position) ?
      preview.position :
      [0, 0.02, 0];
    const gridStep = Math.max(0.25, Number(preview?.gridStep) || 1.425);

    if (!hasFinitePlacementBounds(bounds)) {
      return [position[0], 0.02, position[2]];
    }

    const snapAxis = (value, min, max) => {
      const snapped = min + Math.round((value - min) / gridStep) * gridStep;
      return clampNumber(snapped, min, max);
    };

    return [
      snapAxis(position[0], bounds.minX, bounds.maxX),
      0.02,
      snapAxis(position[2], bounds.minZ, bounds.maxZ)
    ];
  }

  function updateSolarStationPlacementPreview(deltaTime) {
    const preview = session.strawBedPlacementPreview;
    if (!preview?.active) {
      if (
        session.strawBedModelInstance &&
        !controls.storyState.flags.strawBedPlacedInBulbasaurHabitat
      ) {
        session.strawBedModelInstance.active = false;
      }
      return null;
    }

    const movementInput = controls.getPlacementMovementInput?.() || { horizontal: 0, vertical: 0 };
    const movementAxes = camera.getMovementAxes();
    let moveX =
      movementAxes.right[0] * Number(movementInput.horizontal || 0) +
      movementAxes.up[0] * Number(movementInput.vertical || 0);
    let moveZ =
      movementAxes.right[2] * Number(movementInput.horizontal || 0) +
      movementAxes.up[2] * Number(movementInput.vertical || 0);
    const moveLength = Math.hypot(moveX, moveZ);

    if (moveLength > 0.001) {
      moveX /= moveLength;
      moveZ /= moveLength;
      preview.position = Array.isArray(preview.position) ?
        [...preview.position] :
        [0, 0.02, 0];
      preview.position[0] += moveX * SOLAR_STATION_PLACEMENT_PREVIEW_SPEED * deltaTime;
      preview.position[2] += moveZ * SOLAR_STATION_PLACEMENT_PREVIEW_SPEED * deltaTime;

      if (hasFinitePlacementBounds(preview.bounds)) {
        preview.position[0] = clampNumber(preview.position[0], preview.bounds.minX, preview.bounds.maxX);
        preview.position[2] = clampNumber(preview.position[2], preview.bounds.minZ, preview.bounds.maxZ);
      }
    }

    const snappedPosition = getSnappedSolarStationPreviewPosition(preview);
    const previewRect = getPlacementRect(snappedPosition, SOLAR_STATION_PLACEMENT_PREVIEW_FOOTPRINT);
    const hasCollision = isSolarStationPlacementBlocked(
      session,
      controls.storyState,
      previewRect
    );

    preview.snappedPosition = snappedPosition;
    preview.valid = !hasCollision;
    preview.readyForConfirm = true;

    if (session.strawBedModelInstance) {
      const baseYaw =
        session.strawBedModelInstance.solarStationBaseYaw ??
        Number(session.strawBedModelInstance.yaw || 0);
      session.strawBedModelInstance.solarStationBaseYaw = baseYaw;
      session.strawBedModelInstance.offset = [
        snappedPosition[0],
        session.strawBedModelInstance.offset?.[1] ?? 0.02,
        snappedPosition[2]
      ];
      session.strawBedModelInstance.yaw = baseYaw + Number(preview.yaw || 0);
      session.strawBedModelInstance.active = true;
      session.strawBedModelInstance.alpha = preview.valid ? 0.66 : 0.58;
      session.strawBedModelInstance.tint = preview.valid ? [0.55, 1, 0.46] : [1, 0.04, 0.02];
      session.strawBedModelInstance.tintStrength = preview.valid ? 0.22 : 0.82;
    }

    return preview;
  }

  function cancelSolarStationPlacementPreview() {
    if (!session.strawBedPlacementPreview?.active) {
      return false;
    }

    session.strawBedPlacementPreview = null;

    if (
      session.strawBedModelInstance &&
      !controls.storyState.flags.strawBedPlacedInBulbasaurHabitat
    ) {
      session.strawBedModelInstance.active = false;
      session.strawBedModelInstance.alpha = 1;
      session.strawBedModelInstance.tintStrength = 0;
    }

    hud?.pushNotice?.("Solar Station placement canceled.");
    return true;
  }

  function cancelLeafDenKitPlacementPreview() {
    if (!session.leafDenKitPlacementPreview?.active) {
      return false;
    }

    session.leafDenKitPlacementPreview = null;

    if (session.leafDenPlacementPreviewModelInstance) {
      session.leafDenPlacementPreviewModelInstance.active = false;
      session.leafDenPlacementPreviewModelInstance.alpha = 1;
      session.leafDenPlacementPreviewModelInstance.tintStrength = 0;
    }

    if (
      session.leafDenModelInstance &&
      !controls.storyState.flags.leafDenKitPlaced
    ) {
      session.leafDenModelInstance.active = false;
      session.leafDenModelInstance.alpha = 1;
      session.leafDenModelInstance.tintStrength = 0;
    }

    hud?.pushNotice?.("House Kit placement canceled.");
    return true;
  }

  function rotateActivePlacementPreview(direction) {
    const steps = Math.trunc(Number(direction || 0));
    if (steps === 0) {
      return false;
    }

    let rotated = false;
    const rotatePreview = (preview) => {
      if (!preview?.active) {
        return;
      }

      preview.yaw = normalizePlacementYaw(Number(preview.yaw || 0) + steps * PLACEMENT_ROTATION_STEP);
      preview.readyForConfirm = false;
      rotated = true;
    };

    rotatePreview(session.strawBedPlacementPreview);
    rotatePreview(session.leafDenKitPlacementPreview);

    if (rotated) {
      hud?.pushNotice?.("Preview rotated.");
    }

    return rotated;
  }

  function getRotatableWorkbenchPlacementCandidates() {
    const flags = controls.storyState?.flags || {};
    const candidates = [];

    if (session.strawBed?.position && flags.strawBedPlacedInBulbasaurHabitat) {
      candidates.push({
        kind: "solarStation",
        label: "Solar Station",
        placement: session.strawBed,
        fallbackSize: SOLAR_STATION_PLACEMENT_PREVIEW_FOOTPRINT,
        rotateSize: false
      });
    }

    if (session.campfire?.position && flags.campfireSpatOut) {
      candidates.push({
        kind: "trainHouse",
        label: "Train House",
        placement: session.campfire,
        fallbackSize: [1.7, 1.45],
        rotateSize: true
      });
    }

    if (session.leafDen?.position && (flags.leafDenKitPlaced || flags.leafDenBuilt)) {
      const houseSize = flags.leafDenBuilt ?
        LEAF_DEN_BUILT_ROTATION_FOOTPRINT :
        LEAF_DEN_KIT_PLACEMENT_PREVIEW_FOOTPRINT;
      candidates.push({
        kind: "house",
        label: "House",
        placement: session.leafDen,
        fallbackSize: houseSize,
        sizeOverride: houseSize,
        rotateSize: true
      });
    }

    for (const playerHouse of session.playerHouses || []) {
      if (!Array.isArray(playerHouse?.position)) {
        continue;
      }

      candidates.push({
        kind: `playerHouse:${playerHouse.id}`,
        label: "House",
        placement: playerHouse,
        fallbackSize: LEAF_DEN_BUILT_ROTATION_FOOTPRINT,
        sizeOverride: LEAF_DEN_BUILT_ROTATION_FOOTPRINT,
        rotateSize: true
      });
    }

    return candidates;
  }

  function getWorkbenchRotationTargetSize(target) {
    if (Array.isArray(target?.sizeOverride)) {
      return [...target.sizeOverride];
    }

    return getPlacementCollisionSize(target?.placement, target?.fallbackSize || [1, 1]);
  }

  function getWorkbenchRotationTargetDistance(playerPosition, target) {
    const position = target?.placement?.position;
    if (!Array.isArray(playerPosition) || !Array.isArray(position)) {
      return Number.POSITIVE_INFINITY;
    }

    const size = getWorkbenchRotationTargetSize(target);
    const halfX = Math.max(0.01, Number(size[0]) || 1) * 0.5;
    const halfZ = Math.max(0.01, Number(size[1]) || 1) * 0.5;
    const dx = Math.max(0, Math.abs(playerPosition[0] - position[0]) - halfX);
    const dz = Math.max(0, Math.abs(playerPosition[2] - position[2]) - halfZ);
    return Math.hypot(dx, dz);
  }

  function getNearestRotatableWorkbenchPlacement() {
    const playerPosition = session.playerCharacter?.getPosition?.();
    if (!Array.isArray(playerPosition)) {
      return null;
    }

    const candidates = getRotatableWorkbenchPlacementCandidates();
    return candidates.reduce((nearest, candidate) => {
      const position = candidate.placement?.position;
      if (!Array.isArray(position)) {
        return nearest;
      }

      const distance = getWorkbenchRotationTargetDistance(playerPosition, candidate);
      if (!Number.isFinite(distance) || distance > WORKBENCH_OBJECT_ROTATE_DISTANCE) {
        return nearest;
      }
      if (!nearest || distance < nearest.distance) {
        return { ...candidate, distance };
      }
      return nearest;
    }, null);
  }

  function getSelectedRotatableWorkbenchPlacement() {
    const selectedKind = workbenchRotationSelection?.kind;
    if (!selectedKind) {
      return null;
    }

    const selected = getRotatableWorkbenchPlacementCandidates()
      .find((candidate) => candidate.kind === selectedKind) || null;
    if (!selected) {
      workbenchRotationSelection = null;
      return null;
    }

    const playerPosition = session.playerCharacter?.getPosition?.();
    const position = selected.placement?.position;
    if (Array.isArray(playerPosition) && Array.isArray(position)) {
      const distance = getWorkbenchRotationTargetDistance(playerPosition, selected);
      if (Number.isFinite(distance) && distance > WORKBENCH_OBJECT_ROTATE_DISTANCE * 1.6) {
        workbenchRotationSelection = null;
        return null;
      }
    }

    return selected;
  }

  function getWorkbenchRotationSelectionForKind(kind) {
    return workbenchRotationSelection?.kind === kind ? workbenchRotationSelection : null;
  }

  function getWorkbenchRotationPreviewYaw(target) {
    const selection = getWorkbenchRotationSelectionForKind(target?.kind);
    return Number(selection?.pendingYaw ?? target?.placement?.yaw ?? 0);
  }

  function getWorkbenchRotationPreviewSize(target) {
    const selection = getWorkbenchRotationSelectionForKind(target?.kind);
    if (Array.isArray(selection?.pendingSize)) {
      return selection.pendingSize;
    }

    return getWorkbenchRotationTargetSize(target);
  }

  function applyWorkbenchRotationSelectionTint(kind, instance, nowSeconds = getRuntimeNowSeconds()) {
    if (!instance || workbenchRotationSelection?.kind !== kind) {
      return false;
    }

    const pulse = (Math.sin(nowSeconds * 5.4) + 1) * 0.5;
    instance.tint = [0.35, 1.2, 0.35];
    instance.tintStrength = 0.38 + pulse * 0.24;
    instance.alpha = 1;
    return true;
  }

  function selectWorkbenchConstructionForRotation(target) {
    if (!target?.kind) {
      return false;
    }

    workbenchRotationSelection = {
      kind: target.kind,
      originalYaw: Number(target.placement?.yaw || 0),
      pendingYaw: Number(target.placement?.yaw || 0),
      originalSize: getWorkbenchRotationTargetSize(target),
      pendingSize: getWorkbenchRotationTargetSize(target)
    };
    hud?.pushNotice?.(`${target.label} selected. LB/RB rotate, X confirm, B cancel.`);
    return true;
  }

  function clearWorkbenchConstructionRotationSelection() {
    if (!workbenchRotationSelection) {
      return false;
    }

    workbenchRotationSelection = null;
    hud?.pushNotice?.("Rotation canceled.");
    return true;
  }

  function confirmWorkbenchConstructionRotationSelection() {
    const target = getSelectedRotatableWorkbenchPlacement();
    if (!target?.placement || !workbenchRotationSelection) {
      workbenchRotationSelection = null;
      return false;
    }

    target.placement.yaw = normalizePlacementYaw(Number(workbenchRotationSelection.pendingYaw || 0));
    if (target.rotateSize !== false && Array.isArray(workbenchRotationSelection.pendingSize)) {
      target.placement.size = [...workbenchRotationSelection.pendingSize];
    }

    if (target.kind === "solarStation") {
      syncSolarStationPlacementYaw(target.placement);
    }

    workbenchRotationSelection = null;
    hud?.pushNotice?.(`${target.label} rotation set.`);
    return true;
  }

  function syncSolarStationPlacementYaw(placement) {
    const instance = session.strawBedModelInstance;
    if (!instance || !Array.isArray(placement?.position)) {
      return;
    }

    const baseYaw =
      instance.solarStationBaseYaw ??
      Number(instance.yaw || 0);
    instance.solarStationBaseYaw = baseYaw;
    instance.yaw = baseYaw + Number(placement.yaw || 0);
  }

  function syncSolarStationWorkbenchRotationVisual(nowSeconds = getRuntimeNowSeconds()) {
    const instance = session.strawBedModelInstance;
    if (
      !instance ||
      session.strawBedPlacementPreview?.active ||
      !session.strawBed?.position ||
      !controls.storyState.flags.strawBedPlacedInBulbasaurHabitat
    ) {
      return;
    }

    const target = {
      kind: "solarStation",
      placement: session.strawBed
    };
    const baseYaw =
      instance.solarStationBaseYaw ??
      Number(instance.yaw || 0);
    instance.solarStationBaseYaw = baseYaw;
    instance.yaw = baseYaw + getWorkbenchRotationPreviewYaw(target);

    if (!applyWorkbenchRotationSelectionTint("solarStation", instance, nowSeconds) && !instance.solarStationSpawnEffect) {
      instance.alpha = 1;
      instance.tintStrength = 0;
    }
  }

  function rotateNearbyWorkbenchConstruction(direction) {
    const steps = Math.trunc(Number(direction || 0));
    if (steps === 0) {
      return false;
    }

    const target = getSelectedRotatableWorkbenchPlacement();
    if (!target?.placement) {
      return false;
    }

    workbenchRotationSelection.pendingYaw = normalizePlacementYaw(
      Number(workbenchRotationSelection.pendingYaw || target.placement.yaw || 0) +
      steps * PLACEMENT_ROTATION_STEP
    );

    if (target.rotateSize !== false) {
      const currentSize = Array.isArray(workbenchRotationSelection.pendingSize) ?
        workbenchRotationSelection.pendingSize :
        getPlacementCollisionSize(target.placement, target.fallbackSize || [1, 1]);
      workbenchRotationSelection.pendingSize = getRotatedPlacementSize(
        currentSize,
        steps * PLACEMENT_ROTATION_STEP
      );
    }

    hud?.pushNotice?.(`${target.label} preview rotated. X confirm.`);
    return true;
  }

  function getWorkbenchRotationGroundCell(target) {
    const placement = target?.placement;
    const position = placement?.position;
    if (!Array.isArray(position)) {
      return null;
    }

    const size = getWorkbenchRotationPreviewSize(target);
    return {
      id: `workbench-rotation-${target.kind}`,
      offset: position,
      surfaceY: position[1] || 0.02,
      tileSpan: Math.max(size[0], size[1]) + 0.36,
      highlightTargetState: "valid",
      highlightAbilityId: "leafage"
    };
  }

  function updateLeafDenKitPlacementPreview(deltaTime) {
    const preview = session.leafDenKitPlacementPreview;
    if (!preview?.active) {
      return null;
    }

    const movementInput = controls.getPlacementMovementInput?.() || { horizontal: 0, vertical: 0 };
    const movementAxes = camera.getMovementAxes();
    let moveX =
      movementAxes.right[0] * Number(movementInput.horizontal || 0) +
      movementAxes.up[0] * Number(movementInput.vertical || 0);
    let moveZ =
      movementAxes.right[2] * Number(movementInput.horizontal || 0) +
      movementAxes.up[2] * Number(movementInput.vertical || 0);
    const moveLength = Math.hypot(moveX, moveZ);

    if (moveLength > 0.001) {
      moveX /= moveLength;
      moveZ /= moveLength;
      preview.position = Array.isArray(preview.position) ?
        [...preview.position] :
        [0, 0.02, 0];
      preview.position[0] += moveX * LEAF_DEN_KIT_PLACEMENT_PREVIEW_SPEED * deltaTime;
      preview.position[2] += moveZ * LEAF_DEN_KIT_PLACEMENT_PREVIEW_SPEED * deltaTime;

      if (hasFinitePlacementBounds(preview.bounds)) {
        preview.position[0] = clampNumber(preview.position[0], preview.bounds.minX, preview.bounds.maxX);
        preview.position[2] = clampNumber(preview.position[2], preview.bounds.minZ, preview.bounds.maxZ);
      }
    }

    const snappedPosition = getSnappedSolarStationPreviewPosition(preview);
    const previewSize = getRotatedPlacementSize(
      Array.isArray(preview.size) ?
        preview.size :
        LEAF_DEN_KIT_PLACEMENT_PREVIEW_FOOTPRINT,
      preview.yaw
    );
    const validation = validateBuildingKitPlacement({
      position: snappedPosition,
      size: previewSize,
      blockers: getSolarStationPlacementBlockers(session, controls.storyState)
    });
    const insideSolarStationPowerRadius = validation.valid ?
      isInsideSolarStationPowerRadius(session, controls.storyState, snappedPosition) :
      false;

    preview.snappedPosition = snappedPosition;
    preview.effectiveSize = previewSize;
    preview.valid = validation.valid && insideSolarStationPowerRadius;
    preview.invalidReason = preview.valid ?
      null :
      validation.valid ? "outside-solar-station-radius" : validation.reason;
    preview.readyForConfirm = true;

    if (session.leafDenPlacementPreviewModelInstance) {
      const instance = session.leafDenPlacementPreviewModelInstance;
      const groundY = instance.leafDenGroundY ?? Number(instance.offset?.[1] ?? snappedPosition[1] ?? 0.02);
      const baseScale = instance.leafDenBaseScale ?? Number(instance.scale || 1);
      const baseYaw = instance.leafDenBaseYaw ?? Number(instance.yaw || 0);
      instance.leafDenGroundY = groundY;
      instance.leafDenBaseScale = baseScale;
      instance.leafDenBaseYaw = baseYaw;
      instance.offset = [
        snappedPosition[0],
        groundY,
        snappedPosition[2]
      ];
      instance.scale = baseScale;
      instance.yaw = baseYaw + Number(preview.yaw || 0);
      instance.alpha = preview.valid ? 0.66 : 0.58;
      instance.tint = preview.valid ? [0.55, 1, 0.46] : [1, 0.04, 0.02];
      instance.tintStrength = preview.valid ? 0.22 : 0.82;
      instance.active = true;
    }

    return preview;
  }

  function updateSolarStationSpawnEffect(deltaTime) {
    const instance = session.strawBedModelInstance;
    const effect = instance?.solarStationSpawnEffect;

    if (!effect || instance.active === false) {
      return;
    }

    effect.elapsed = Math.min(effect.duration, Number(effect.elapsed || 0) + deltaTime);
    const progress = easeOutCubic(effect.elapsed / Math.max(0.001, effect.duration));
    const groundY = Number.isFinite(effect.groundY) ? effect.groundY : Number(instance.offset?.[1] || 0.02);

    instance.scale = lerp(effect.fromScale, effect.toScale, progress);
    instance.alpha = lerp(effect.fromAlpha, effect.toAlpha, progress);
    instance.offset = [
      instance.offset?.[0] || 0,
      groundY + lerp(effect.fromYOffset, effect.toYOffset, progress),
      instance.offset?.[2] || 0
    ];
    instance.tint = [1, 1.14, 0.72];
    instance.tintStrength = lerp(0.34, 0, progress);

    if (progress >= 1) {
      instance.scale = effect.toScale;
      instance.alpha = effect.toAlpha;
      instance.offset[1] = groundY;
      instance.tintStrength = 0;
      instance.solarStationSpawnEffect = null;
    }
  }

  function advancePlayerPlacementSpawnEffect(placement, deltaTime) {
    const effect = placement?.spawnEffect;
    if (!effect) {
      return null;
    }

    effect.elapsed = Math.min(
      Number(effect.duration || 0.82),
      Number(effect.elapsed || 0) + Math.max(0, Number(deltaTime) || 0)
    );

    const duration = Math.max(0.001, Number(effect.duration || 0.82));
    const progress = easeOutCubic(effect.elapsed / duration);
    const pose = {
      progress,
      scale: lerp(Number(effect.fromScale ?? 0.18), Number(effect.toScale ?? 1), progress),
      yOffset: lerp(Number(effect.fromYOffset ?? 0.54), Number(effect.toYOffset ?? 0), progress),
      alpha: lerp(Number(effect.fromAlpha ?? 0.08), Number(effect.toAlpha ?? 1), progress)
    };

    if (progress >= 1) {
      placement.spawnEffect = null;
    }

    return pose;
  }

  function applyPlayerPlacementSpawnToBillboard(placement, billboard, deltaTime) {
    const pose = advancePlayerPlacementSpawnEffect(placement, deltaTime);
    if (!pose || !billboard) {
      return billboard;
    }

    return {
      ...billboard,
      position: [
        billboard.position[0],
        billboard.position[1] + pose.yOffset,
        billboard.position[2]
      ],
      size: Array.isArray(billboard.size) ?
        [
          billboard.size[0] * pose.scale,
          billboard.size[1] * pose.scale
        ] :
        billboard.size,
      alpha: (billboard.alpha ?? billboard.opacity ?? 1) * pose.alpha
    };
  }

  function applyPlayerPlacementSpawnToModelInstance(placement, instance, {
    baseScale,
    groundY,
    deltaTime
  } = {}) {
    const pose = advancePlayerPlacementSpawnEffect(placement, deltaTime);
    if (!pose || !instance) {
      return false;
    }

    const resolvedGroundY = Number.isFinite(groundY) ? groundY : Number(instance.offset?.[1] || 0.02);
    const resolvedBaseScale = Number.isFinite(baseScale) ? baseScale : Number(instance.scale || 1);
    instance.scale = resolvedBaseScale * pose.scale;
    instance.offset = [
      instance.offset?.[0] || 0,
      resolvedGroundY + pose.yOffset,
      instance.offset?.[2] || 0
    ];
    instance.alpha = pose.alpha;
    instance.tint = [1, 1.14, 0.72];
    instance.tintStrength = lerp(0.34, 0, pose.progress);
    return true;
  }

  function hasCharmanderFireCarbon() {
    if (!canUseCharmanderFireWithCarbon({
      storyState: controls.storyState,
      inventory: controls.inventory
    })) {
      hud.pushNotice("Charmander needs Carbon to use Fire.");
      return false;
    }

    return true;
  }

  function triggerWaterGunSfxBurst(duration = SQUIRTLE_WATER_GUN_SPRAY_DURATION) {
    const nowSeconds = getRuntimeNowSeconds();
    waterGunSfxBurstUntilSeconds = Math.max(
      waterGunSfxBurstUntilSeconds,
      nowSeconds + duration
    );
  }

  function triggerGroundActionFeedback(groundCell, abilityId, now) {
    if (!groundCell) {
      return;
    }

    groundActionFeedback = {
      groundCell,
      abilityId,
      startedAt: now,
      expiresAt: now + GROUND_ACTION_FEEDBACK_DURATION_MS
    };
  }

  function triggerInvalidFieldMoveFeedback(groundCell, now) {
    if (!groundCell) {
      return;
    }

    triggerGroundActionFeedback(groundCell, "invalid", now);
    playFieldMoveInvalidSfx();
  }

  function triggerGameplayOpeningShipImpactEffect(shipEvent, now) {
    const canvasWidth = worldCanvas?.width || 426;
    const canvasHeight = worldCanvas?.height || 240;
    let projectedOrigin = null;

    if (
      Array.isArray(shipEvent?.position) &&
      typeof camera.project === "function"
    ) {
      const projected = camera.project(
        [
          shipEvent.position[0],
          shipEvent.position[1] + 0.36,
          shipEvent.position[2]
        ],
        canvasWidth,
        canvasHeight
      );

      if (projected && projected.depth <= 1) {
        projectedOrigin = [projected.x, projected.y];
      }
    }

    gameplayOpeningImpactEffect.trigger({
      origin: projectedOrigin,
      width: canvasWidth,
      height: canvasHeight,
      now
    });
  }

  function getGroundActionFeedback(now) {
    if (!groundActionFeedback || groundActionFeedback.expiresAt <= now) {
      groundActionFeedback = null;
      return null;
    }

    const progress = clamp01(
      (now - groundActionFeedback.startedAt) / GROUND_ACTION_FEEDBACK_DURATION_MS
    );

    return {
      groundCell: groundActionFeedback.groundCell,
      abilityId: groundActionFeedback.abilityId,
      pulsePhase: Math.sin(progress * Math.PI)
    };
  }

  function getLeafResourceBillboards(resourceNodes, texture, uvRect, storyState) {
    if (!texture || !Array.isArray(resourceNodes)) {
      return [];
    }

    const isResourceNodeActive = typeof rendering.isResourceNodeActive === "function" ?
      rendering.isResourceNodeActive :
      () => true;

    return resourceNodes
      .filter((resourceNode) => (
        resourceNode?.itemId === LEAVES_ITEM_ID &&
        isResourceNodeActive(resourceNode, storyState)
      ))
      .map((resourceNode) => ({
        texture,
        position: [
          resourceNode.position[0],
          resourceNode.position[1] + LEAF_RESOURCE_BILLBOARD_Y_OFFSET,
          resourceNode.position[2]
        ],
        size: LEAF_RESOURCE_BILLBOARD_SIZE,
        uvRect
      }));
  }

  function getLeafDropBillboards(fieldDrops, texture, uvRect) {
    if (!texture || !Array.isArray(fieldDrops)) {
      return [];
    }

    return fieldDrops
      .filter((drop) => drop?.itemId === LEAVES_ITEM_ID && !drop.collected)
      .map((drop) => ({
        texture,
        position: drop.position,
        size: drop.size,
        uvRect: drop.uvRect || uvRect
      }));
  }

  function triggerPlayerCounterPrompt(text, now) {
    if (!text) {
      return;
    }

    playerCounterPrompt = {
      text,
      expiresAt: now + PLAYER_COUNTER_PROMPT_DURATION_MS
    };
  }

  function triggerQuestCounterPrompt({ count, total, label, now }) {
    const safeTotal = Math.max(1, Number(total || 1));
    const safeCount = Math.min(safeTotal, Math.max(0, Number(count || 0)));
    if (safeCount <= 0) {
      return;
    }

    triggerPlayerCounterPrompt(`${safeCount}/${safeTotal} ${label}`, now);
  }

  function getSupplyCounterSnapshot(inventory = {}) {
    return Object.fromEntries(
      Object.keys(inventory || {}).map((itemId) => [
        itemId,
        Number(inventory?.[itemId] || 0)
      ])
    );
  }

  function getSupplyCounterPromptLabel(itemId) {
    const label = gameplay.getItemLabel?.(itemId) || itemId;
    return typeof label === "string" && label.trim() ? label : itemId;
  }

  function triggerSupplyCounterPrompt(itemId, inventory = {}, now) {
    const label = getSupplyCounterPromptLabel(itemId);
    const count = Number(inventory?.[itemId] || 0);
    if (!label || count <= 0) {
      return false;
    }

    triggerPlayerCounterPrompt(`${label} x${count}`, now);
    return true;
  }

  function triggerChangedSupplyCounterPrompt(previousCounts, inventory = {}, now) {
    for (const itemId of Object.keys(inventory || {})) {
      const nextCount = Number(inventory?.[itemId] || 0);
      if (nextCount > Number(previousCounts?.[itemId] || 0)) {
        return triggerSupplyCounterPrompt(itemId, inventory, now);
      }
    }

    return false;
  }

  function getPlayerCounterPrompt(now) {
    if (!playerCounterPrompt || playerCounterPrompt.expiresAt <= now) {
      playerCounterPrompt = null;
      return null;
    }

    return playerCounterPrompt.text;
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

  function getRepairBoxRevealFlashElement() {
    if (
      repairBoxRevealFlashElement ||
      typeof HTMLElement === "undefined" ||
      !(mount instanceof HTMLElement) ||
      typeof document === "undefined"
    ) {
      return repairBoxRevealFlashElement;
    }

    repairBoxRevealFlashElement = document.createElement("div");
    repairBoxRevealFlashElement.dataset.repairBoxRevealFlash = "true";
    repairBoxRevealFlashElement.hidden = true;
    repairBoxRevealFlashElement.style.cssText = [
      "position:absolute",
      "inset:0",
      "z-index:11",
      "opacity:0",
      "pointer-events:none",
      "mix-blend-mode:screen",
      "will-change:opacity,background",
      "background:#fff"
    ].join(";");
    mount.append(repairBoxRevealFlashElement);
    return repairBoxRevealFlashElement;
  }

  function getRepairBoxRevealFlashOrigin(encounter) {
    const repairBoxPosition = getEncounterRepairBoxPosition(encounter);

    if (!Array.isArray(repairBoxPosition) || !worldCanvas?.width || !worldCanvas?.height) {
      return "50% 55%";
    }

    const projected = camera.project(
      [
        repairBoxPosition[0],
        repairBoxPosition[1] + ROBOT_REPAIR_BOX_FLOAT_HEIGHT,
        repairBoxPosition[2]
      ],
      worldCanvas.width,
      worldCanvas.height
    );

    if (!projected || projected.depth > 1) {
      return "50% 55%";
    }

    const originX = clamp01(projected.x / worldCanvas.width) * 100;
    const originY = clamp01(projected.y / worldCanvas.height) * 100;
    return `${originX.toFixed(2)}% ${originY.toFixed(2)}%`;
  }

  function setRepairBoxRevealFlashOpacity(opacity, encounter) {
    const normalizedOpacity = clamp01(opacity);

    if (normalizedOpacity <= 0.01) {
      if (repairBoxRevealFlashElement) {
        repairBoxRevealFlashElement.hidden = true;
        repairBoxRevealFlashElement.style.opacity = "0";
      }
      return;
    }

    const element = getRepairBoxRevealFlashElement();
    if (!element) {
      return;
    }

    const origin = getRepairBoxRevealFlashOrigin(encounter);
    element.hidden = false;
    element.style.opacity = normalizedOpacity.toFixed(3);
    element.style.background = [
      `radial-gradient(circle at ${origin}, rgba(255,255,255,1) 0%, rgba(255,255,255,0.98) 18%, rgba(255,255,255,0.76) 38%, rgba(255,255,255,0.34) 62%, rgba(255,255,255,0) 84%)`,
      "linear-gradient(180deg, rgba(255,255,255,0.24), rgba(255,255,255,0.42))"
    ].join(",");
  }

  function updateRepairBoxRevealFlash(opening, encounter) {
    const flashDuration = Number(opening?.flashDuration || 0);
    const flashStart = Number(opening?.flashStart || 0);

    if (!opening?.active || flashDuration <= 0) {
      setRepairBoxRevealFlashOpacity(0);
      return;
    }

    const flashProgress = (Number(opening.elapsed || 0) - flashStart) / flashDuration;
    if (flashProgress < 0 || flashProgress > 1) {
      setRepairBoxRevealFlashOpacity(0);
      return;
    }

    const pulse = Math.sin(clamp01(flashProgress) * Math.PI);
    setRepairBoxRevealFlashOpacity(pulse * BULBASAUR_REVEAL_FLASH_PEAK_OPACITY, encounter);
  }

  function getSnowstormFogOverlayElement() {
    if (
      snowstormFogOverlayElement ||
      typeof HTMLElement === "undefined" ||
      !(mount instanceof HTMLElement) ||
      typeof document === "undefined"
    ) {
      return snowstormFogOverlayElement;
    }

    snowstormFogOverlayElement = document.createElement("div");
    snowstormFogOverlayElement.dataset.snowstormFog = "true";
    snowstormFogOverlayElement.hidden = true;
    snowstormFogOverlayElement.style.cssText = [
      "position:absolute",
      "left:50%",
      "top:50%",
      "width:var(--game-stage-width)",
      "height:var(--game-stage-height)",
      "transform:translate(-50%, -50%) scale(var(--render-frame-scale))",
      "transform-origin:center center",
      "z-index:2",
      "opacity:0",
      "pointer-events:none",
      "image-rendering:pixelated",
      "will-change:opacity,background-position",
      "background-blend-mode:normal,screen,screen",
      `background:${[
        "radial-gradient(circle at 50% 52%, rgba(236,244,246,0.2) 0%, rgba(208,222,226,0.28) 30%, rgba(170,188,196,0.58) 72%, rgba(138,154,164,0.76) 100%)",
        "repeating-linear-gradient(0deg, rgba(255,255,255,0.12) 0 2px, rgba(255,255,255,0) 2px 9px)",
        "repeating-linear-gradient(90deg, rgba(218,236,242,0.1) 0 3px, rgba(218,236,242,0) 3px 12px)"
      ].join(",")}`
    ].join(";");
    mount.append(snowstormFogOverlayElement);
    return snowstormFogOverlayElement;
  }

  function setSnowstormFogOpacity(opacity, elapsed = 0) {
    const normalizedOpacity = clamp01(opacity);

    if (normalizedOpacity <= 0.01) {
      if (snowstormFogOverlayElement) {
        snowstormFogOverlayElement.hidden = true;
        snowstormFogOverlayElement.style.opacity = "0";
      }
      return;
    }

    const element = getSnowstormFogOverlayElement();
    if (!element) {
      return;
    }

    element.hidden = false;
    element.style.opacity = normalizedOpacity.toFixed(3);
    element.style.backgroundPosition = [
      "center center",
      `0 ${Math.round(elapsed * 8)}px`,
      `${Math.round(elapsed * -5)}px 0`
    ].join(",");
  }

  function updateSnowstormFogOverlay(deltaTime) {
    const playerPosition = session.playerCharacter?.getPosition?.() || null;
    const fogIntensity = session.snowstorm?.fogIntensity ??
      getSnowstormFogIntensity(session.snowstorm, playerPosition);
    const targetOpacity = fogIntensity * SNOWSTORM_FOG_MAX_OPACITY;
    const easedAmount = 1 - Math.exp(-SNOWSTORM_FOG_OPACITY_EASE * Math.max(deltaTime, 0));

    snowstormFogOpacity += (targetOpacity - snowstormFogOpacity) * easedAmount;
    setSnowstormFogOpacity(snowstormFogOpacity, session.snowstorm?.elapsed || 0);
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

  function getCharmanderLogicalFacingYaw() {
    return (session.charmanderEncounter?.modelInstance?.yaw || 0) - CHARMANDER_MODEL_FACE_YAW_OFFSET;
  }

  function getGroundCellCenterPosition(groundCell) {
    const offset = groundCell?.offset || [0, 0, 0];
    return [
      offset[0] || 0,
      (offset[1] || 0) + 0.04,
      offset[2] || 0
    ];
  }

  function findNearbyFeedbackGroundCell(playerPosition, groundCells = []) {
    if (!Array.isArray(playerPosition) || !Array.isArray(groundCells)) {
      return null;
    }

    let nearestGroundCell = null;
    let nearestDistance = Infinity;

    for (const groundCell of groundCells) {
      if (
        !groundCell ||
        groundCell.active === false ||
        !Array.isArray(groundCell.offset)
      ) {
        continue;
      }

      const deltaX = playerPosition[0] - groundCell.offset[0];
      const deltaZ = playerPosition[2] - groundCell.offset[2];
      const distance = Math.hypot(deltaX, deltaZ);
      const interactDistance =
        (groundCell.tileSpan || groundCell.size?.[0] || 1) *
        FIELD_MOVE_INVALID_GROUND_CELL_RADIUS_FACTOR;

      if (distance <= interactDistance && distance < nearestDistance) {
        nearestGroundCell = groundCell;
        nearestDistance = distance;
      }
    }

    return nearestGroundCell;
  }

  function hasGroundPatchForCellId(cellId) {
    if (typeof cellId !== "string") {
      return false;
    }

    return [
      ...(session.groundGrassPatches || []),
      ...(session.groundFlowerPatches || [])
    ].some((patch) => patch?.cellId === cellId);
  }

  function findAlreadyResolvedFieldMoveGroundCell(playerPosition, {
    waterGunEquipped = false,
    leafageEquipped = false,
    fireEquipped = false
  } = {}) {
    if (waterGunEquipped) {
      return findNearbyFeedbackGroundCell(
        playerPosition,
        session.groundPurifiedInstances
      );
    }

    if (leafageEquipped) {
      return findNearbyFeedbackGroundCell(
        playerPosition,
        (session.groundPurifiedInstances || []).filter((groundCell) => {
          return hasGroundPatchForCellId(groundCell?.id);
        })
      );
    }

    if (fireEquipped) {
      return findNearbyFeedbackGroundCell(
        playerPosition,
        session.groundDeadInstances
      );
    }

    return null;
  }

  function getGroundCellIdKey(groundCells = []) {
    return Array.isArray(groundCells) ?
      groundCells
        .map((groundCell) => groundCell?.id)
        .filter((id) => typeof id === "string")
        .sort()
        .join("|") :
      "";
  }

  function getPatchCellIdKey(patches = []) {
    return Array.isArray(patches) ?
      patches
        .map((patch) => patch?.cellId)
        .filter((cellId) => typeof cellId === "string")
        .sort()
        .join("|") :
      "";
  }

  function getAlivePatchCellIdKey(patches = []) {
    return Array.isArray(patches) ?
      patches
        .filter((patch) => patch?.state === "alive")
        .map((patch) => patch?.cellId)
        .filter((cellId) => typeof cellId === "string")
        .sort()
        .join("|") :
      "";
  }

  function getGardenProgressSnapshot() {
    return [
      getGroundCellIdKey(session.groundDeadInstances),
      getGroundCellIdKey(session.iceGroundInstances),
      getGroundCellIdKey(session.groundPurifiedInstances),
      getPatchCellIdKey(session.groundGrassPatches),
      getAlivePatchCellIdKey(session.groundGrassPatches),
      getAlivePatchCellIdKey(session.groundFlowerPatches),
      Number(controls.storyState?.flags?.wateredTreeCount || 0)
    ].join(";");
  }

  function getTreeRevivalSnapshot() {
    return {
      palmAliveById: new Map(
        (session.palmInstances || []).map((palmInstance) => [
          palmInstance?.id,
          Boolean(palmInstance?.alive)
        ])
      ),
      leppaTreeRevived: Boolean(
        session.leppaTree?.revived ||
        controls.storyState?.flags?.leppaTreeRevived
      )
    };
  }

  function queueTreeRevivalLeafBurst(position, sourceId = "tree") {
    if (!Array.isArray(position)) {
      return;
    }

    session.treeRevivalLeafBursts ||= [];
    const burstId = `tree-revival-leaves-${sourceId}-${session.treeRevivalLeafBursts.length}`;
    const leaves = [];

    for (let index = 0; index < TREE_REVIVAL_LEAF_BURST_COUNT; index += 1) {
      const angle =
        (index / TREE_REVIVAL_LEAF_BURST_COUNT) * Math.PI * 2 +
        (Math.random() - 0.5) * 0.72;
      const distance = 0.16 + Math.random() * 0.78;
      const speed = TREE_REVIVAL_LEAF_BURST_DRIFT * (0.55 + Math.random() * 0.75);
      const size = lerp(
        TREE_REVIVAL_LEAF_BURST_SIZE_MIN,
        TREE_REVIVAL_LEAF_BURST_SIZE_MAX,
        Math.random()
      );

      leaves.push({
        age: 0,
        duration: TREE_REVIVAL_LEAF_BURST_DURATION * (0.72 + Math.random() * 0.42),
        position: [
          position[0] + Math.cos(angle) * distance,
          position[1] + TREE_REVIVAL_LEAF_BURST_BASE_HEIGHT +
            Math.random() * TREE_REVIVAL_LEAF_BURST_HEIGHT_RANGE,
          position[2] + Math.sin(angle) * distance
        ],
        velocity: [
          Math.cos(angle) * speed,
          0.34 + Math.random() * 0.46,
          Math.sin(angle) * speed
        ],
        size,
        phase: Math.random() * Math.PI * 2,
        spin: (Math.random() < 0.5 ? -1 : 1) * (3.2 + Math.random() * 5.6),
        flipSpeed: 7.2 + Math.random() * 7.6,
        driftPhase: Math.random() * Math.PI * 2
      });
    }

    session.treeRevivalLeafBursts.push({
      id: burstId,
      leaves
    });
  }

  function queueTreeRevivalLeafBurstsForNewlyRevivedTrees(snapshot) {
    if (!snapshot) {
      return;
    }

    for (const palmInstance of session.palmInstances || []) {
      const wasAlive = snapshot.palmAliveById?.get(palmInstance?.id);
      if (!wasAlive && palmInstance?.alive && Array.isArray(palmInstance.offset)) {
        queueTreeRevivalLeafBurst(palmInstance.offset, palmInstance.id);
      }
    }

    const leppaTreeRevived = Boolean(
      session.leppaTree?.revived ||
      controls.storyState?.flags?.leppaTreeRevived
    );
    if (
      !snapshot.leppaTreeRevived &&
      leppaTreeRevived &&
      Array.isArray(session.leppaTree?.position)
    ) {
      queueTreeRevivalLeafBurst(session.leppaTree.position, session.leppaTree.id || "leppa-tree");
    }
  }

  function updateTreeRevivalLeafBursts(deltaTime) {
    if (!Array.isArray(session.treeRevivalLeafBursts) || !session.treeRevivalLeafBursts.length) {
      return;
    }

    session.treeRevivalLeafBursts = session.treeRevivalLeafBursts.filter((burst) => {
      burst.leaves = (burst.leaves || []).filter((leaf) => {
        leaf.age += deltaTime;
        leaf.velocity[1] -= TREE_REVIVAL_LEAF_BURST_GRAVITY * deltaTime;
        leaf.position[0] += leaf.velocity[0] * deltaTime;
        leaf.position[1] += leaf.velocity[1] * deltaTime;
        leaf.position[2] += leaf.velocity[2] * deltaTime;
        leaf.position[0] += Math.sin(leaf.age * 6.1 + leaf.driftPhase) * 0.08 * deltaTime;
        leaf.position[2] += Math.cos(leaf.age * 5.4 + leaf.driftPhase) * 0.08 * deltaTime;

        return leaf.age < leaf.duration;
      });

      return burst.leaves.length > 0;
    });
  }

  function appendTreeRevivalLeafBurstBillboards(nextFrame) {
    const texture =
      session.leavesTexture ||
      session.greenGrassTexture ||
      session.natureRevivalSparkTexture;

    if (
      !texture ||
      !Array.isArray(session.treeRevivalLeafBursts) ||
      !session.treeRevivalLeafBursts.length
    ) {
      return;
    }

    for (const burst of session.treeRevivalLeafBursts) {
      for (const leaf of burst.leaves || []) {
        const progress = clamp01(leaf.age / Math.max(0.001, leaf.duration));
        const fadeProgress = clamp01((progress - 0.48) / 0.52);
        const alpha = 1 - easeOutCubic(fadeProgress);
        const flip = Math.abs(Math.cos(leaf.age * leaf.flipSpeed + leaf.phase));
        const width = leaf.size * lerp(0.18, 1, flip);
        const height = leaf.size * lerp(0.86, 1.18, 1 - flip);

        nextFrame.render.genericBillboards.push({
          texture,
          position: leaf.position,
          size: [width, height],
          uvRect: rendering.fullUvRect,
          alpha,
          rotation: leaf.phase + leaf.spin * leaf.age
        });
      }
    }
  }

  function performGameplayHarvestAction(options, autosaveContext = {}) {
    const treeRevivalSnapshot = getTreeRevivalSnapshot();
    const beforeGardenProgress = getGardenProgressSnapshot();
    const result = gameplay.performHarvestAction(options);
    const afterGardenProgress = getGardenProgressSnapshot();

    if (result) {
      queueTreeRevivalLeafBurstsForNewlyRevivedTrees(treeRevivalSnapshot);
    }

    if (result && afterGardenProgress !== beforeGardenProgress) {
      const groundCell =
        autosaveContext.groundCell ||
        options?.forcedHarvestTarget?.groundCell ||
        options?.forcedHarvestTarget?.leafageGroundCell ||
        options?.forcedHarvestTarget?.fireGroundCell ||
        null;

      controls.onGardenProgressChanged?.({
        actionType: autosaveContext.actionType || null,
        groundCellId: typeof groundCell?.id === "string" ? groundCell.id : null
      });
    }

    return result;
  }

  function cloneGroundGrassPatchForCutEffect(patch) {
    if (!patch || !Array.isArray(patch.position)) {
      return null;
    }

    return {
      ...patch,
      position: [...patch.position],
      size: Array.isArray(patch.size) ? [...patch.size] : [1.18, 0.96]
    };
  }

  function findDestroyableLandscapePatchByTarget(target) {
    if (target?.action !== "destroyInstantiatedObject") {
      return null;
    }

    return [
      ...(session.groundGrassPatches || []),
      ...(session.groundFlowerPatches || [])
    ].find((patch) => {
      return patch?.id === target.id || (target.cellId && patch?.cellId === target.cellId);
    }) || null;
  }

  function getDestroyableLandscapePatchForInteractOptions(options = {}) {
    const nearbyTarget = gameplay.findNearbyInteractable(
      options.playerPosition,
      options.npcActors,
      options.interactables,
      options.storyState,
      [
        ...(options.groundGrassPatches || []),
        ...(options.groundFlowerPatches || [])
      ],
      options.logChair,
      options.leafDen,
      options.timburrEncounter,
      options.charmanderEncounter,
      options.leppaTree,
      options.bulbasaurEncounter
    );

    return cloneGroundGrassPatchForCutEffect(
      findDestroyableLandscapePatchByTarget(nearbyTarget?.target)
    );
  }

  function queueLandscapeCutEffect(patch) {
    const effectPatch = cloneGroundGrassPatchForCutEffect(patch);
    if (!effectPatch) {
      return;
    }

    session.landscapeCutEffects ||= [];
    session.landscapeCutEffects.push({
      id: `landscape-cut-${effectPatch.id || effectPatch.cellId || session.landscapeCutEffects.length}-${performance.now().toFixed(1)}`,
      patch: effectPatch,
      elapsed: 0,
      duration: LANDSCAPE_CUT_EFFECT_DURATION
    });
  }

  function performGameplayInteractAction(options) {
    const cutEffectPatch = getDestroyableLandscapePatchForInteractOptions(options);
    const beforeGardenProgress = getGardenProgressSnapshot();
    const result = gameplay.performInteractAction(options);
    const afterGardenProgress = getGardenProgressSnapshot();

    if (result && cutEffectPatch && afterGardenProgress !== beforeGardenProgress) {
      queueLandscapeCutEffect(cutEffectPatch);
      controls.onGardenProgressChanged?.({
        actionType: "destroyLandscape",
        groundCellId: typeof cutEffectPatch.cellId === "string" ? cutEffectPatch.cellId : null
      });
    }

    return result;
  }

  function updateLandscapeCutEffects(deltaTime) {
    if (!Array.isArray(session.landscapeCutEffects) || !session.landscapeCutEffects.length) {
      return;
    }

    session.landscapeCutEffects = session.landscapeCutEffects.filter((effect) => {
      effect.elapsed = Math.min(
        Number(effect.duration || LANDSCAPE_CUT_EFFECT_DURATION),
        Number(effect.elapsed || 0) + deltaTime
      );
      return effect.elapsed < Number(effect.duration || LANDSCAPE_CUT_EFFECT_DURATION);
    });
  }

  function getLandscapeCutEffectPose(effect) {
    const duration = Number(effect?.duration || LANDSCAPE_CUT_EFFECT_DURATION);
    const progress = clamp01(Number(effect?.elapsed || 0) / Math.max(0.001, duration));

    if (progress < LANDSCAPE_CUT_EFFECT_LERP_PORTION) {
      const lerpProgress = easeOutCubic(progress / LANDSCAPE_CUT_EFFECT_LERP_PORTION);
      return {
        alpha: 1,
        scale: lerp(1, 0.72, lerpProgress),
        yOffset: lerp(0, LANDSCAPE_CUT_EFFECT_LIFT * 0.45, lerpProgress)
      };
    }

    const popProgress = easeOutCubic(
      (progress - LANDSCAPE_CUT_EFFECT_LERP_PORTION) /
      Math.max(0.001, 1 - LANDSCAPE_CUT_EFFECT_LERP_PORTION)
    );

    return {
      alpha: 1 - popProgress,
      scale: lerp(0.72, LANDSCAPE_CUT_EFFECT_POP_SCALE, popProgress),
      yOffset: lerp(
        LANDSCAPE_CUT_EFFECT_LIFT * 0.45,
        LANDSCAPE_CUT_EFFECT_LIFT,
        popProgress
      )
    };
  }

  function appendLandscapeCutEffectRenderables(nextFrame) {
    if (!Array.isArray(session.landscapeCutEffects) || !session.landscapeCutEffects.length) {
      return;
    }

    for (const effect of session.landscapeCutEffects) {
      const groundGrassPatch = effect.patch;
      if (!groundGrassPatch || !Array.isArray(groundGrassPatch.position)) {
        continue;
      }

      const pose = getLandscapeCutEffectPose(effect);
      if (pose.alpha <= 0.01) {
        continue;
      }

      const offset = [
        groundGrassPatch.position[0],
        groundGrassPatch.position[1] + pose.yOffset,
        groundGrassPatch.position[2]
      ];
      const yaw = getTallGrassYaw(groundGrassPatch);
      const isLeafageGarden =
        groundGrassPatch.state === "alive" &&
        groundGrassPatch.leafageObjectId === "garden1";
      const isTallGrass =
        groundGrassPatch.state === "alive" &&
        groundGrassPatch.leafageObjectId !== "garden1";

      if (
        isLeafageGarden &&
        session.leafageGardenModel &&
        Array.isArray(session.leafageGardenInstances)
      ) {
        session.leafageGardenInstances.push({
          id: `${effect.id}-garden`,
          offset,
          scale: getTallGrassInstanceScale(
            session.leafageGardenModel,
            groundGrassPatch,
            pose.scale
          ) * (session.leafageGardenModelScale || 1),
          alpha: pose.alpha,
          yaw: yaw + (session.leafageGardenModelFaceYawOffset || 0),
          swayStrength: 0
        });
      } else if (
        isTallGrass &&
        session.tallGrassModel &&
        Array.isArray(session.tallGrassInstances)
      ) {
        session.tallGrassInstances.push({
          id: `${effect.id}-tall-grass`,
          offset,
          scale: getTallGrassInstanceScale(
            session.tallGrassModel,
            groundGrassPatch,
            pose.scale
          ),
          alpha: pose.alpha,
          yaw,
          swayStrength: 0
        });
      } else if (
        session.deadGrassModel &&
        Array.isArray(session.deadGrassInstances)
      ) {
        session.deadGrassInstances.push({
          id: `${effect.id}-dead-grass`,
          offset,
          scale: getTallGrassInstanceScale(
            session.deadGrassModel,
            groundGrassPatch,
            pose.scale
          ),
          alpha: pose.alpha,
          yaw,
          swayStrength: 0
        });
      } else {
        nextFrame.render.grassBillboards.push({
          texture: groundGrassPatch.state === "alive" ?
            session.greenGrassTexture :
            session.deadGrassTexture,
          position: offset,
          size: groundGrassPatch.size.map((value) => value * pose.scale),
          alpha: pose.alpha
        });
      }
    }
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
    const revealBoxOpening = encounter.revealBoxOpening;
    const hideBoxAfterReveal = Boolean(
      revealBoxOpening?.hideBoxWhenVisible &&
      revealBoxOpening?.bulbasaurVisible
    );

    syncRepairBoxInstance(
      encounter.repairModuleInstance,
      getEncounterRepairBoxPosition(encounter),
      !hideBoxAfterReveal && (openingProgress > 0 || !encounter.visible),
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

  function syncCharmanderModelInstance() {
    const encounter = session.charmanderEncounter;

    if (!encounter?.modelInstance) {
      syncDismantledEncounterModule(encounter);
      return;
    }

    syncDismantledEncounterModule(encounter);
    encounter.modelInstance.active = Boolean(encounter.visible && Array.isArray(encounter.position));
    encounter.modelInstance.scale = CHARMANDER_MODEL_SCALE;

    if (Array.isArray(encounter.position)) {
      encounter.modelInstance.offset = [...encounter.position];
    }
  }

  function syncCompanionRepairModules() {
    syncCharmanderModelInstance();
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

  function isBulbasaurRepairBoxRustlingActive() {
    const flags = controls.storyState?.flags || {};
    const rustlingGrassCellId = flags.rustlingGrassCellId;

    if (
      !rustlingGrassCellId ||
      flags.bulbasaurRevealed ||
      !session.bulbasaurEncounter?.repairModuleInstance?.active
    ) {
      return false;
    }

    return (session.groundGrassPatches || []).some((groundGrassPatch) => {
      return groundGrassPatch?.cellId === rustlingGrassCellId &&
        groundGrassPatch.state === "alive";
    });
  }

  function getBulbasaurRepairBoxInvestigationTarget() {
    if (!isBulbasaurRepairBoxRustlingActive()) {
      return null;
    }

    const repairBoxPosition = getEncounterRepairBoxPosition(session.bulbasaurEncounter);

    if (!Array.isArray(repairBoxPosition)) {
      return null;
    }

    return {
      position: [
        repairBoxPosition[0] + CHOPPER_BULBASAUR_REPAIR_BOX_INVESTIGATION_OFFSET[0],
        repairBoxPosition[1] + CHOPPER_BULBASAUR_REPAIR_BOX_INVESTIGATION_OFFSET[1],
        repairBoxPosition[2] + CHOPPER_BULBASAUR_REPAIR_BOX_INVESTIGATION_OFFSET[2]
      ],
      lookAtPosition: [...repairBoxPosition]
    };
  }

  function isPlayerNearWorldPosition(worldPosition, distance) {
    const playerPosition = session.playerCharacter?.getPosition?.();

    if (!Array.isArray(playerPosition) || !Array.isArray(worldPosition)) {
      return false;
    }

    return Math.hypot(
      playerPosition[0] - worldPosition[0],
      playerPosition[2] - worldPosition[2]
    ) <= distance;
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

  function updateCompanionFollowDirection(deltaX, deltaZ) {
    const distance = Math.hypot(deltaX, deltaZ);
    if (distance <= 0.0005) {
      return;
    }

    companionFollowDirection = [deltaX / distance, deltaZ / distance];
  }

  function getCompanionFollowDirection() {
    if (companionFollowDirection) {
      return companionFollowDirection;
    }

    const playerYaw = Number(session.playerModelInstance?.yaw);
    if (Number.isFinite(playerYaw)) {
      return [Math.cos(playerYaw), Math.sin(playerYaw)];
    }

    return [0, -1];
  }

  function getCompanionFollowTargetPosition(followDistance) {
    const playerPosition = session.playerCharacter?.getPosition?.();
    if (!Array.isArray(playerPosition)) {
      return null;
    }

    const [directionX, directionZ] = getCompanionFollowDirection();
    return [
      playerPosition[0] - directionX * followDistance,
      0.04,
      playerPosition[2] - directionZ * followDistance
    ];
  }

  function isCompanionInFollowFormation(companionId) {
    const flags = controls.storyState?.flags || {};

    if (companionId === "squirtle") {
      const squirtle = session.actTwoSquirtle;
      return Boolean(
        flags.squirtleFollowing &&
        squirtle?.recovered &&
        squirtle.assemblyState === "assembled" &&
        !session.squirtleWaterGunAction &&
        getSquirtleWaterGunQueue().length === 0
      );
    }

    if (companionId === "bulbasaur") {
      const encounter = session.bulbasaurEncounter;
      return Boolean(
        flags.bulbasaurFollowing &&
        encounter?.visible &&
        Array.isArray(encounter.position) &&
        !session.bulbasaurLeafageAction &&
        !encounter.revealBoxOpening?.active &&
        !isBulbasaurWorkbenchGuideActive()
      );
    }

    if (companionId === "charmander") {
      return Boolean(
        flags.charmanderFollowing &&
        flags.charmanderRevealed &&
        session.charmanderEncounter?.visible &&
        !session.charmanderFireAction &&
        !flags.leafDenConstructionStarted
      );
    }

    if (companionId === "timburr") {
      return Boolean(
        flags.timburrFollowing &&
        flags.timburrRevealed &&
        session.timburrEncounter?.visible &&
        !flags.leafDenConstructionStarted
      );
    }

    return false;
  }

  function getCompanionFollowFormationIds(activeMoveId = null) {
    const activeCompanionId = COMPANION_FOLLOW_ACTIVE_MOVE_COMPANIONS[activeMoveId] || null;
    const orderedIds = activeCompanionId ?
      [
        activeCompanionId,
        ...COMPANION_FOLLOW_FORMATION_ORDER.filter((companionId) => companionId !== activeCompanionId)
      ] :
      COMPANION_FOLLOW_FORMATION_ORDER;

    return orderedIds.filter(isCompanionInFollowFormation);
  }

  function getCompanionFollowFormationIndex(companionId, activeMoveId = null) {
    const formationIds = getCompanionFollowFormationIds(activeMoveId);
    const index = formationIds.indexOf(companionId);
    return index >= 0 ? index : 0;
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

    const targetPosition = getCompanionFollowTargetPosition(followDistance);
    if (!targetPosition) {
      return false;
    }

    const deltaX = targetPosition[0] - companion.position[0];
    const deltaZ = targetPosition[2] - companion.position[2];
    const distance = Math.hypot(deltaX, deltaZ);

    companion.patrol = null;

    if (distance <= COMPANION_FOLLOW_SLOT_ARRIVE_DISTANCE || distance <= 0.001) {
      return true;
    }

    const travel = Math.min(speed * deltaTime, distance);
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

  function updateSquirtleIdlePatrol(deltaTime, { active, activeMoveId = null }) {
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
      const formationIndex = getCompanionFollowFormationIndex("squirtle", activeMoveId);
      moveGroundCompanionTowardPlayer(squirtle, {
        deltaTime,
        speed: SQUIRTLE_FOLLOW_SPEED,
        followDistance: resolveCompanionFollowDistance({
          companionId: "squirtle",
          activeMoveId,
          defaultDistance: SQUIRTLE_FOLLOW_DISTANCE,
          formationIndex
        }),
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

  function updateBulbasaurIdlePatrol(deltaTime, { active, activeMoveId = null }) {
    const encounter = session.bulbasaurEncounter;
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
      !isBulbasaurWorkbenchGuideActive() &&
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
      const formationIndex = getCompanionFollowFormationIndex("bulbasaur", activeMoveId);
      moveGroundCompanionTowardPlayer(encounter, {
        deltaTime,
        speed: BULBASAUR_FOLLOW_SPEED,
        followDistance: resolveCompanionFollowDistance({
          companionId: "bulbasaur",
          activeMoveId,
          defaultDistance: BULBASAUR_FOLLOW_DISTANCE,
          formationIndex
        }),
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

  function getCharmanderFireApproachPosition(targetPosition, playerPosition = null) {
    const charmanderPosition =
      session.charmanderEncounter?.position ||
      session.charmanderEncounter?.modelInstance?.offset ||
      playerPosition ||
      [0, 0.04, 0];
    let deltaX = charmanderPosition[0] - targetPosition[0];
    let deltaZ = charmanderPosition[2] - targetPosition[2];
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
      targetPosition[0] + (deltaX / distance) * CHARMANDER_FIRE_STAND_DISTANCE,
      0.04,
      targetPosition[2] + (deltaZ / distance) * CHARMANDER_FIRE_STAND_DISTANCE
    ];
  }

  function startCharmanderFireAction({ groundCell, playerPosition }) {
    const charmander = session.charmanderEncounter;
    if (!groundCell) {
      return "unavailable";
    }

    if (isLeafDenConstructionActive()) {
      hud?.pushNotice?.(LEAF_DEN_BUSY_NOTICE);
      return "busy";
    }

    if (session.charmanderFireAction) {
      return "busy";
    }

    if (
      !charmander?.modelInstance ||
      !charmander.visible ||
      !Array.isArray(charmander.position)
    ) {
      return "unavailable";
    }

    if (!hasCharmanderFireCarbon()) {
      return "no-carbon";
    }

    const targetPosition = getGroundCellCenterPosition(groundCell);
    const approachPosition = getCharmanderFireApproachPosition(
      targetPosition,
      playerPosition
    );

    session.charmanderFireAction = {
      phase: "approach",
      groundCell,
      targetPosition,
      approachPosition,
      sprayElapsed: 0,
      impactApplied: false
    };
    charmander.modelInstance.active = true;
    charmander.modelInstance.yaw = getRobotModelYawToward(
      charmander.position,
      targetPosition,
      CHARMANDER_MODEL_FACE_YAW_OFFSET
    );
    syncCharmanderModelInstance();

    return "started";
  }

  function applyCharmanderFireImpact(action) {
    const result = performGameplayHarvestAction({
      playerPosition: action.approachPosition,
      palmModel: session.palmModel,
      palmInstances: session.palmInstances,
      resourceNodes: session.resourceNodes,
      leppaTree: session.leppaTree,
      inventory: controls.inventory,
      canPurifyGround: false,
      groundDeadInstances: session.groundDeadInstances,
      iceGroundInstances: session.iceGroundInstances,
      groundFlowerPatches: session.groundFlowerPatches,
      groundGrassPatches: session.groundGrassPatches,
      groundPurifiedInstances: session.groundPurifiedInstances,
      storyState: controls.storyState,
      leafDen: session.leafDen,
      woodDrops: session.woodDrops,
      leppaBerryDrops: session.leppaBerryDrops,
      canUseLeafage: false,
      canUseFire: true,
      useFire: true,
      forcedHarvestTarget: {
        fireGroundCell: action.groundCell,
        distance: 0
      }
    }, {
      actionType: "fire",
      groundCell: action.groundCell
    });

    if (result) {
      hud.syncInventoryUi(controls.inventory);
      triggerSupplyCounterPrompt(CARBON_ITEM_ID, controls.inventory, performance.now());
    }

    return result;
  }

  function updateCharmanderFireAction(deltaTime) {
    const action = session.charmanderFireAction;
    const charmander = session.charmanderEncounter;

    if (!action || !charmander?.modelInstance) {
      return;
    }

    if (!Array.isArray(charmander.position)) {
      charmander.position = [...(charmander.modelInstance.offset || action.approachPosition)];
    }

    if (action.phase === "approach") {
      const deltaX = action.approachPosition[0] - charmander.position[0];
      const deltaZ = action.approachPosition[2] - charmander.position[2];
      const distance = Math.hypot(deltaX, deltaZ);
      const travel = Math.min(CHARMANDER_FIRE_SPEED * deltaTime, distance);

      if (distance > CHARMANDER_FIRE_ARRIVE_DISTANCE && travel > 0) {
        charmander.position = [
          charmander.position[0] + (deltaX / distance) * travel,
          0.04,
          charmander.position[2] + (deltaZ / distance) * travel
        ];
      } else {
        charmander.position = [...action.approachPosition];
        action.phase = "spray";
        action.sprayElapsed = 0;
      }

      charmander.modelInstance.yaw = getRobotModelYawToward(
        charmander.position,
        action.targetPosition,
        CHARMANDER_MODEL_FACE_YAW_OFFSET
      );
      syncCharmanderModelInstance();
      return;
    }

    if (action.phase !== "spray") {
      session.charmanderFireAction = null;
      return;
    }

    action.sprayElapsed += deltaTime;
    charmander.modelInstance.yaw = getRobotModelYawToward(
      charmander.position,
      action.targetPosition,
      CHARMANDER_MODEL_FACE_YAW_OFFSET
    );
    syncCharmanderModelInstance();

    if (!action.impactApplied && action.sprayElapsed >= CHARMANDER_FIRE_IMPACT_TIME) {
      action.impactApplied = true;
      applyCharmanderFireImpact(action);
    }

    if (action.sprayElapsed >= CHARMANDER_FIRE_SPRAY_DURATION) {
      session.charmanderFireAction = null;
    }
  }

  function startBulbasaurLeafageAction({ groundCell, playerPosition }) {
    const bulbasaur = session.bulbasaurEncounter;
    if (!groundCell) {
      return "unavailable";
    }

    if (isBulbasaurWorkbenchGuideActive()) {
      return "busy";
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
    const hadLeafagePatch = hasGroundPatchForCellId(action.groundCell?.id);
    const result = performGameplayHarvestAction({
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
    }, {
      actionType: "leafage",
      groundCell: action.groundCell
    });

    if (result && !hadLeafagePatch && hasGroundPatchForCellId(action.groundCell?.id)) {
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

  function getSquirtleWaterGunLevel() {
    return SQUIRTLE_WATER_GUN_BASE_LEVEL +
      Math.floor(getSquirtleWaterGunUseCount() / SQUIRTLE_WATER_GUN_USES_PER_LEVEL);
  }

  function getSquirtleWaterStaminaMax() {
    return SQUIRTLE_WATER_STAMINA_MAX +
      Math.max(0, getSquirtleWaterGunLevel() - SQUIRTLE_WATER_GUN_BASE_LEVEL);
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
    const staminaMax = getSquirtleWaterStaminaMax();

    if (!session.squirtleWaterStamina) {
      session.squirtleWaterStamina = {
        current: staminaMax,
        visualCurrent: staminaMax,
        max: staminaMax,
        charging: false,
        chargeElapsed: 0
      };
    }

    const previousMax = Math.max(
      1,
      Number(session.squirtleWaterStamina.max || staminaMax)
    );
    const maxIncrease = Math.max(0, staminaMax - previousMax);
    session.squirtleWaterStamina.max = staminaMax;
    session.squirtleWaterStamina.current = Math.min(
      staminaMax,
      Math.max(0, Number(session.squirtleWaterStamina.current || 0)) + maxIncrease
    );
    session.squirtleWaterStamina.visualCurrent = Math.min(
      staminaMax,
      Math.max(
        0,
        Number.isFinite(session.squirtleWaterStamina.visualCurrent) ?
          session.squirtleWaterStamina.visualCurrent :
          session.squirtleWaterStamina.current
      ) + maxIncrease
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

  function getCharmanderCarbonUseCount() {
    const uses = Math.floor(Number(
      controls.storyState?.flags?.[CHARMANDER_FIRE_CARBON_USES_FLAG] || 0
    ));
    return Math.min(
      CHARMANDER_FIRE_USES_PER_CARBON - 1,
      Math.max(0, uses)
    );
  }

  function getCharmanderCarbonEnergyRatio() {
    const carbonCount = Math.max(0, Math.floor(Number(controls.inventory?.[CARBON_ITEM_ID] || 0)));

    if (carbonCount <= 0) {
      return 0;
    }

    const availableUses = Math.max(
      0,
      carbonCount * CHARMANDER_FIRE_USES_PER_CARBON - getCharmanderCarbonUseCount()
    );
    return clamp01(availableUses / CHARMANDER_FIRE_USES_PER_CARBON);
  }

  function getCharmanderCarbonEnergyState() {
    const current = getCharmanderCarbonEnergyRatio();

    if (!session.charmanderCarbonEnergy) {
      session.charmanderCarbonEnergy = {
        current,
        visualCurrent: current
      };
    }

    session.charmanderCarbonEnergy.current = current;
    session.charmanderCarbonEnergy.visualCurrent = clamp01(
      Number.isFinite(session.charmanderCarbonEnergy.visualCurrent) ?
        session.charmanderCarbonEnergy.visualCurrent :
        current
    );
    return session.charmanderCarbonEnergy;
  }

  function updateCharmanderCarbonEnergy(deltaTime) {
    const energy = getCharmanderCarbonEnergyState();
    const visualDuration =
      energy.current < energy.visualCurrent ?
        CHARMANDER_CARBON_VISUAL_DECREASE_DURATION :
        CHARMANDER_CARBON_VISUAL_INCREASE_DURATION;
    const maxVisualStep = deltaTime / Math.max(0.001, visualDuration);
    energy.visualCurrent = moveValueToward(
      energy.visualCurrent,
      energy.current,
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
    const result = performGameplayHarvestAction({
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
    }, {
      actionType: "waterGun",
      groundCell: action.groundCell
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

  function getCharmanderMouthPosition() {
    const charmander = session.charmanderEncounter;
    const position = charmander?.position || charmander?.modelInstance?.offset || [0, 0, 0];
    const yaw = getCharmanderLogicalFacingYaw();

    return [
      position[0] + Math.sin(yaw) * 0.28,
      (position[1] || 0) + 0.58,
      position[2] + Math.cos(yaw) * 0.28
    ];
  }

  function getCharmanderFireBillboards(action, texture, uvRect) {
    if (!action || action.phase !== "spray" || !texture) {
      return [];
    }

    const progress = clamp01(action.sprayElapsed / CHARMANDER_FIRE_SPRAY_DURATION);
    const elapsedSeconds = Math.max(0, action.sprayElapsed);
    const mouthPosition = getCharmanderMouthPosition();
    const targetPosition = action.targetPosition;
    const streamDirectionX = targetPosition[0] - mouthPosition[0];
    const streamDirectionZ = targetPosition[2] - mouthPosition[2];
    const streamLength = Math.hypot(streamDirectionX, streamDirectionZ) || 1;
    const sideX = -streamDirectionZ / streamLength;
    const sideZ = streamDirectionX / streamLength;
    const forwardX = streamDirectionX / streamLength;
    const forwardZ = streamDirectionZ / streamLength;
    const billboards = [];

    for (let index = 0; index < CHARMANDER_FIRE_PARTICLE_COUNT; index += 1) {
      const seed = index + 1;
      const lifetime = lerp(
        CHARMANDER_FIRE_PARTICLE_LIFETIME_MIN,
        CHARMANDER_FIRE_PARTICLE_LIFETIME_MAX,
        hashUnit(seed + 0.11)
      );
      const life = ((elapsedSeconds + hashUnit(seed + 0.23) * lifetime) % lifetime) /
        lifetime;
      const pathProgress = clamp01(life * (1.08 + hashUnit(seed + 0.37) * 0.22));
      const opacityCurve = clamp01(life / 0.12) * (1 - life);
      const sizeCurve = Math.sin(life * Math.PI);
      const impactStretch = clamp01((pathProgress - 0.68) / 0.32);
      const coneRadius = CHARMANDER_FIRE_CONE_RADIUS * (0.44 + impactStretch * 0.72);
      const noiseTime = elapsedSeconds * 11.2 + seed * 1.91;
      const noiseSide = (
        Math.sin(noiseTime) * CHARMANDER_FIRE_NOISE_STRENGTH +
        Math.sin(noiseTime * 0.57 + seed) * CHARMANDER_FIRE_NOISE_POSITION_AMOUNT
      ) * (0.22 + pathProgress * 0.78);
      const sideOffset = (hashUnit(seed + 0.49) - 0.5) * coneRadius + noiseSide;
      const forwardOffset = (hashUnit(seed + 0.61) - 0.5) *
        CHARMANDER_FIRE_NOISE_POSITION_AMOUNT *
        impactStretch;
      const baseSize = lerp(
        CHARMANDER_FIRE_PARTICLE_SIZE_MIN,
        CHARMANDER_FIRE_PARTICLE_SIZE_MAX,
        hashUnit(seed + 0.73)
      ) * Math.max(0.08, sizeCurve);
      const arcY = mouthPosition[1] +
        (targetPosition[1] - mouthPosition[1]) * pathProgress +
        Math.sin(pathProgress * Math.PI) * CHARMANDER_FIRE_ARC_HEIGHT * 0.32;
      const gravityDrop = pathProgress * pathProgress * 0.08 * CHARMANDER_FIRE_VISUAL_SCALE;
      const y = Math.max(
        targetPosition[1] + 0.06,
        arcY - gravityDrop + (hashUnit(seed + 0.83) - 0.5) * coneRadius * 0.36
      );

      billboards.push({
        texture,
        position: [
          mouthPosition[0] +
            (targetPosition[0] - mouthPosition[0]) * pathProgress +
            sideX * sideOffset +
            forwardX * forwardOffset,
          y,
          mouthPosition[2] +
            (targetPosition[2] - mouthPosition[2]) * pathProgress +
            sideZ * sideOffset +
            forwardZ * forwardOffset
        ],
        size: [
          baseSize * (0.72 + impactStretch * 0.46),
          baseSize * (1.12 + sizeCurve * 0.32)
        ],
        alpha: opacityCurve * (0.84 + hashUnit(seed + 0.97) * 0.16),
        rotation: (hashUnit(seed + 1.09) - 0.5) * Math.PI * 2 +
          Math.sin(noiseTime * 0.42) * CHARMANDER_FIRE_NOISE_ROTATION_AMOUNT +
          lerp(-0.7, 0.7, hashUnit(seed + 1.17)) * life,
        uvRect
      });
    }

    const burstElapsed = action.sprayElapsed - CHARMANDER_FIRE_IMPACT_TIME;

    if (burstElapsed >= 0) {
      const burstProgress = clamp01(burstElapsed / CHARMANDER_FIRE_BURST_DURATION);
      const burstRadius = easeOutCubic(burstProgress) * CHARMANDER_FIRE_BURST_RADIUS;
      const fade = 1 - burstProgress;

      for (let index = 0; index < CHARMANDER_FIRE_BURST_PARTICLE_COUNT; index += 1) {
        const angle = index * 2.39996 + progress * 2.2;
        const radius = burstRadius * (0.28 + (index % 5) * 0.16);
        const size = (0.22 + (index % 3) * 0.045) *
          CHARMANDER_FIRE_VISUAL_SCALE;

        billboards.push({
          texture,
          position: [
            targetPosition[0] + Math.cos(angle) * radius,
            targetPosition[1] + 0.08 + Math.sin(burstProgress * Math.PI) * 0.18,
            targetPosition[2] + Math.sin(angle) * radius
          ],
          size: [
            size * (1.1 + burstProgress * 1.5),
            size * (1.35 + burstProgress * 1.1)
          ],
          alpha: fade * 0.9,
          rotation: angle + burstProgress * 1.2,
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

  function getCharmanderWorldPosition() {
    const charmander = session.charmanderEncounter;
    return charmander?.position || charmander?.modelInstance?.offset || null;
  }

  function resetCompanionLostHintSchedule() {
    companionLostHintKey = null;
    companionLostHintNextAt = 0;
    companionLostHintActiveUntil = 0;
    companionLostHintActive = null;
  }

  function resolveWaterGunCompanionLostHint(activeQuest, activeMoveId) {
    const flags = controls.storyState?.flags || {};
    const restoredGrassCount = Number(flags.restoredGrassCount || 0);
    const activeDryGrassQuest = activeQuest?.id === "water-dry-grass";
    const activeBulbasaurDryGrassRequest =
      flags.bulbasaurDryGrassMissionAccepted &&
      !flags.bulbasaurDryGrassMissionComplete &&
      restoredGrassCount < BULBASAUR_DRY_GRASS_MISSION_RESTORE_COUNT;
    const needsWaterGun =
      controls.playerSkills?.waterGun &&
      (
        activeDryGrassQuest ||
        activeBulbasaurDryGrassRequest
      );

    if (!needsWaterGun) {
      return null;
    }

    if (activeMoveId === "leafage" && Array.isArray(session.bulbasaurEncounter?.position)) {
      return {
        key: "bulbasaur-switch-to-squirtle",
        text: BULBASAUR_SWITCH_TO_SQUIRTLE_HINT_TEXT,
        worldPosition: session.bulbasaurEncounter.position
      };
    }

    const squirtlePosition = getSquirtleWorldPosition();

    if (!Array.isArray(squirtlePosition)) {
      return null;
    }

    return {
      key: "squirtle-use-water-gun",
      text: SQUIRTLE_WATER_GUN_HINT_TEXT,
      worldPosition: squirtlePosition
    };
  }

  function getPeriodicCompanionLostHint({
    activeQuest,
    activeMoveId,
    now
  }) {
    const hint = resolveWaterGunCompanionLostHint(activeQuest, activeMoveId);

    if (!hint) {
      resetCompanionLostHintSchedule();
      return null;
    }

    if (hint.key !== companionLostHintKey) {
      companionLostHintKey = hint.key;
      companionLostHintNextAt = now + COMPANION_LOST_HINT_INITIAL_DELAY_MS;
      companionLostHintActiveUntil = 0;
      companionLostHintActive = null;
      return null;
    }

    if (companionLostHintActive && now < companionLostHintActiveUntil) {
      return {
        ...companionLostHintActive,
        worldPosition: hint.worldPosition
      };
    }

    if (now < companionLostHintNextAt) {
      return null;
    }

    companionLostHintActive = hint;
    companionLostHintActiveUntil = now + COMPANION_LOST_HINT_DURATION_MS;
    companionLostHintNextAt = now + COMPANION_LOST_HINT_REPEAT_MS;
    return hint;
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

  function offsetTowardCamera(position, amount) {
    const direction = camera.getPose?.()?.direction;
    if (!Array.isArray(direction)) {
      return position;
    }

    return [
      position[0] + direction[0] * amount,
      position[1] + direction[1] * amount,
      position[2] + direction[2] * amount
    ];
  }

  function getCharmanderCarbonBillboards({ fillTexture, backTexture, uvRect }) {
    const position = getCharmanderWorldPosition();

    if (!Array.isArray(position) || !fillTexture) {
      return [];
    }

    const energy = getCharmanderCarbonEnergyState();
    const ratio = clamp01(energy.visualCurrent);
    const barPosition = [
      position[0],
      (position[1] || 0) + CHARMANDER_CARBON_BAR_Y_OFFSET,
      position[2]
    ];
    const billboards = [];

    if (backTexture) {
      billboards.push({
        texture: backTexture,
        position: barPosition,
        size: [CHARMANDER_CARBON_BAR_WIDTH, CHARMANDER_CARBON_BAR_HEIGHT],
        uvRect,
        alpha: 0.88
      });
    }

    if (ratio > 0.02) {
      const fillWidth = CHARMANDER_CARBON_BAR_WIDTH * ratio;
      const quadRight = camera.getBillboardAxes?.()?.right || [1, 0, 0];
      const fillCenterOffset = -(CHARMANDER_CARBON_BAR_WIDTH * 0.5) + (fillWidth * 0.5);
      const fillUvRect = [
        uvRect[0],
        uvRect[1],
        uvRect[0] + ((uvRect[2] - uvRect[0]) * ratio),
        uvRect[3]
      ];

      billboards.push({
        texture: fillTexture,
        position: offsetTowardCamera([
          barPosition[0] + (quadRight[0] * fillCenterOffset),
          barPosition[1] + ((quadRight[1] || 0) * fillCenterOffset),
          barPosition[2] + (quadRight[2] * fillCenterOffset)
        ], CHARMANDER_CARBON_BAR_FILL_DEPTH_OFFSET),
        size: [fillWidth, CHARMANDER_CARBON_BAR_HEIGHT],
        uvRect: fillUvRect,
        alpha: 0.96
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

  function snapshotCollectibleSources(collectibles = [], predicate = () => true) {
    const snapshots = new Map();

    for (const collectible of collectibles || []) {
      if (!collectible || !predicate(collectible)) {
        continue;
      }

      snapshots.set(collectible, {
        active: collectible.active !== false,
        collected: Boolean(collectible.collected),
        cooldown: Number(collectible.cooldown || 0),
        position: Array.isArray(collectible.position) ? [...collectible.position] : null,
        yield: Math.max(1, Number(collectible.yield || 1))
      });
    }

    return snapshots;
  }

  function getNewlyCollectedDropPositions(dropSnapshots) {
    const positions = [];

    for (const [drop, snapshot] of dropSnapshots) {
      if (!snapshot.collected && drop.collected && Array.isArray(snapshot.position)) {
        positions.push(snapshot.position);
      }
    }

    return positions;
  }

  function getNewlyCollectedResourcePositions(resourceSnapshots) {
    const positions = [];

    for (const [resourceNode, snapshot] of resourceSnapshots) {
      if (
        snapshot.active &&
        resourceNode.active === false &&
        Number(resourceNode.cooldown || 0) > snapshot.cooldown &&
        Array.isArray(snapshot.position)
      ) {
        for (let copyIndex = 0; copyIndex < snapshot.yield; copyIndex += 1) {
          positions.push(snapshot.position);
        }
      }
    }

    return positions;
  }

  function projectWorldPositionToViewport(position) {
    if (
      !Array.isArray(position) ||
      typeof camera.project !== "function" ||
      !worldCanvas
    ) {
      return null;
    }

    const canvasWidth = worldCanvas.width || 0;
    const canvasHeight = worldCanvas.height || 0;

    if (canvasWidth <= 0 || canvasHeight <= 0) {
      return null;
    }

    const projected = camera.project(
      [position[0], (position[1] || 0) + 0.5, position[2]],
      canvasWidth,
      canvasHeight
    );

    if (!projected || projected.depth > 1) {
      return null;
    }

    const rect = worldCanvas.getBoundingClientRect?.();

    if (!rect || rect.width <= 0 || rect.height <= 0) {
      return { x: projected.x, y: projected.y };
    }

    return {
      x: rect.left + projected.x * (rect.width / canvasWidth),
      y: rect.top + projected.y * (rect.height / canvasHeight)
    };
  }

  function queueSupplyPickupFlyItems(itemId, sourcePositions = []) {
    if (typeof hud.queueSupplyPickupFlyToSlot !== "function") {
      return;
    }

    const pickupCount = Math.max(1, sourcePositions.length);
    for (let index = 0; index < pickupCount; index += 1) {
      hud.queueSupplyPickupFlyToSlot({ itemId });
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

  function getCampfireWoodPileBillboards(campfire, texture, uvRect) {
    if (!campfire?.position || !texture) {
      return [];
    }

    return CAMPFIRE_WOOD_PILE_OFFSETS.map(([offsetX, offsetY, offsetZ, rotation]) => ({
      texture,
      position: [
        campfire.position[0] + offsetX,
        campfire.position[1] + offsetY,
        campfire.position[2] + offsetZ
      ],
      size: CAMPFIRE_WOOD_PILE_SIZE,
      uvRect,
      rotation
    }));
  }

  function syncCampfireTrainHouseModelInstance(nowSeconds = getRuntimeNowSeconds(), deltaTime = 0) {
    const instance = session.campfireTrainHouseModelInstance;
    if (!instance) {
      return;
    }

    if (!session.campfire?.position || !controls.storyState.flags.campfireSpatOut) {
      instance.active = false;
      return;
    }

    applyTrainHouseDance(
      instance,
      session.campfire.position,
      nowSeconds,
      getWorkbenchRotationPreviewYaw({
        kind: "trainHouse",
        placement: session.campfire
      })
    );
    const spawnApplied = applyPlayerPlacementSpawnToModelInstance(session.campfire, instance, {
      baseScale: instance.trainHouseBaseScale,
      groundY: instance.trainHouseGroundY,
      deltaTime
    });
    if (!spawnApplied) {
      instance.alpha = 1;
      instance.tintStrength = 0;
    }
    applyWorkbenchRotationSelectionTint("trainHouse", instance, nowSeconds);
  }

  function getLeafDenConstructionNowMs() {
    return Date.now();
  }

  function isLeafDenConstructionActive() {
    return Boolean(
      controls.storyState?.flags?.leafDenConstructionStarted &&
      !controls.storyState?.flags?.leafDenBuilt &&
      session.leafDen?.position
    );
  }

  function isLeafDenBusyCompanionTarget(target) {
    return Boolean(
      isLeafDenConstructionActive() &&
      target?.kind === "pokemonCompanion" &&
      (target.id === "charmander" || target.id === "timburr")
    );
  }

  function getLeafDenConstructionProgress(nowMs = getLeafDenConstructionNowMs()) {
    const flags = controls.storyState?.flags || {};
    const startedAt = Number(flags.leafDenConstructionStartedAt || 0);
    const completesAt = Number(flags.leafDenConstructionCompletesAt || 0);

    if (!startedAt || !completesAt || completesAt <= startedAt) {
      return 0;
    }

    return clamp01((nowMs - startedAt) / (completesAt - startedAt));
  }

  function ensureLeafDenConstructionCloudInstances() {
    if (!Array.isArray(session.leafDenConstructionCloudInstances)) {
      session.leafDenConstructionCloudInstances = Array.from(
        { length: LEAF_DEN_CONSTRUCTION_CLOUD_COUNT },
        (_, index) => ({
          id: `leaf-den-construction-cloud-${index}`,
          offset: [0, 0, 0],
          scale: 1,
          yaw: 0,
          pitch: 0,
          roll: 0,
          active: false
        })
      );

      if (Array.isArray(session.cloudAtmosphere?.cloudInstances)) {
        session.cloudAtmosphere.cloudInstances.push(...session.leafDenConstructionCloudInstances);
      }
    }

    return session.leafDenConstructionCloudInstances;
  }

  function getActiveConstructionCloudBursts(nowMs = getLeafDenConstructionNowMs()) {
    if (!Array.isArray(session.constructionCloudBursts)) {
      return [];
    }

    const activeBursts = session.constructionCloudBursts
      .map((effect) => {
        const startedAt = Number(effect?.startedAt || 0);
        const durationMs = Number(effect?.durationMs || 0);
        const progress = durationMs > 0 ? clamp01((nowMs - startedAt) / durationMs) : 1;

        return {
          ...effect,
          progress
        };
      })
      .filter((effect) => {
        return (
          Array.isArray(effect?.position) &&
          Number(effect.startedAt || 0) > 0 &&
          Number(effect.durationMs || 0) > 0 &&
          effect.progress < 1
        );
      })
      .slice(-CONSTRUCTION_CLOUD_BURST_MAX_EFFECTS);

    session.constructionCloudBursts = activeBursts.map(({ progress, ...effect }) => effect);
    return activeBursts;
  }

  function ensureConstructionCloudBurstInstances() {
    const requiredCount = CONSTRUCTION_CLOUD_BURST_MAX_EFFECTS * CONSTRUCTION_CLOUD_BURST_CLOUD_COUNT;

    if (!Array.isArray(session.constructionCloudBurstInstances)) {
      session.constructionCloudBurstInstances = [];
    }

    while (session.constructionCloudBurstInstances.length < requiredCount) {
      const index = session.constructionCloudBurstInstances.length;
      session.constructionCloudBurstInstances.push({
        id: `construction-cloud-burst-${index}`,
        offset: [0, 0, 0],
        scale: 1,
        yaw: 0,
        pitch: 0,
        roll: 0,
        active: false
      });
    }

    if (
      Array.isArray(session.cloudAtmosphere?.cloudInstances) &&
      !session.constructionCloudBurstInstancesRegistered
    ) {
      session.cloudAtmosphere.cloudInstances.push(...session.constructionCloudBurstInstances);
      session.constructionCloudBurstInstancesRegistered = true;
    }

    return session.constructionCloudBurstInstances;
  }

  function syncConstructionCloudBurstEffects(nowSeconds = getRuntimeNowSeconds()) {
    const bursts = getActiveConstructionCloudBursts();
    const instances = ensureConstructionCloudBurstInstances();

    for (const instance of instances) {
      instance.active = false;
    }

    bursts.forEach((burst, burstIndex) => {
      const position = burst.position;
      const effectAlpha = Math.sin(Math.PI * clamp01(burst.progress));

      for (let index = 0; index < CONSTRUCTION_CLOUD_BURST_CLOUD_COUNT; index += 1) {
        const instance = instances[(burstIndex * CONSTRUCTION_CLOUD_BURST_CLOUD_COUNT) + index];
        if (!instance) {
          continue;
        }

        const angle = index * 2.399 + nowSeconds * (3.2 + (index % 4) * 0.36);
        const wobble = Math.sin(nowSeconds * 6.1 + index * 1.7);
        const radiusPulse = 0.65 + effectAlpha * 0.55 + Math.sin(nowSeconds * 4.2 + index) * 0.14;
        instance.active = true;
        instance.offset = [
          position[0] + Math.cos(angle) * LEAF_DEN_CONSTRUCTION_CLOUD_RADIUS_X * radiusPulse,
          LEAF_DEN_CONSTRUCTION_CLOUD_BASE_Y + Math.abs(wobble) * LEAF_DEN_CONSTRUCTION_CLOUD_BOB,
          position[2] + Math.sin(angle * 1.08) * LEAF_DEN_CONSTRUCTION_CLOUD_RADIUS_Z * radiusPulse
        ];
        instance.scale = (0.24 + (index % 5) * 0.045 + Math.abs(wobble) * 0.08) * Math.max(0.12, effectAlpha);
        instance.yaw = angle;
        instance.pitch = Math.sin(nowSeconds * 3.7 + index) * 0.24;
        instance.roll = Math.cos(nowSeconds * 4.6 + index * 0.5) * 0.3;
      }
    });
  }

  function syncLeafDenConstructionClouds(nowSeconds = getRuntimeNowSeconds()) {
    const instances = ensureLeafDenConstructionCloudInstances();
    const active = isLeafDenConstructionActive();
    const position = session.leafDen?.position;

    for (let index = 0; index < instances.length; index += 1) {
      const instance = instances[index];
      instance.active = active;

      if (!active || !Array.isArray(position)) {
        continue;
      }

      const angle = index * 2.399 + nowSeconds * (2.4 + (index % 4) * 0.28);
      const wobble = Math.sin(nowSeconds * 4.4 + index * 1.7);
      const radiusPulse = 1 + Math.sin(nowSeconds * 3.1 + index) * 0.18;
      instance.offset = [
        position[0] + Math.cos(angle) * LEAF_DEN_CONSTRUCTION_CLOUD_RADIUS_X * radiusPulse,
        LEAF_DEN_CONSTRUCTION_CLOUD_BASE_Y + Math.abs(wobble) * LEAF_DEN_CONSTRUCTION_CLOUD_BOB,
        position[2] + Math.sin(angle * 1.08) * LEAF_DEN_CONSTRUCTION_CLOUD_RADIUS_Z * radiusPulse
      ];
      instance.scale = 0.34 + (index % 5) * 0.055 + Math.abs(wobble) * 0.08;
      instance.yaw = angle;
      instance.pitch = Math.sin(nowSeconds * 2.7 + index) * 0.22;
      instance.roll = Math.cos(nowSeconds * 3.6 + index * 0.5) * 0.26;
    }
  }

  function getLeafDenConstructionBillboards(uvRect, nowSeconds = getRuntimeNowSeconds()) {
    if (!isLeafDenConstructionActive() || !Array.isArray(session.leafDen?.position)) {
      return [];
    }

    const position = session.leafDen.position;
    const progress = getLeafDenConstructionProgress();
    const billboards = [];
    const barY = position[1] + LEAF_DEN_CONSTRUCTION_BAR_Y;
    const barBackTexture = session.squirtleWaterStaminaBackTexture;
    const barFillTexture = session.charmanderCarbonFillTexture || session.squirtleWaterStaminaBackTexture;

    if (barBackTexture) {
      billboards.push({
        texture: barBackTexture,
        position: [position[0], barY, position[2]],
        size: [LEAF_DEN_CONSTRUCTION_BAR_WIDTH, LEAF_DEN_CONSTRUCTION_BAR_HEIGHT],
        uvRect
      });
    }

    if (barFillTexture && progress > 0) {
      const fillWidth = Math.max(0.08, LEAF_DEN_CONSTRUCTION_BAR_WIDTH * 0.9 * progress);
      billboards.push({
        texture: barFillTexture,
        position: [
          position[0] - LEAF_DEN_CONSTRUCTION_BAR_WIDTH * 0.45 + fillWidth * 0.5,
          barY + 0.01,
          position[2] - 0.015
        ],
        size: [fillWidth, LEAF_DEN_CONSTRUCTION_BAR_HEIGHT * 0.68],
        uvRect
      });
    }

    const starTexture = session.logChairStarTexture || session.natureRevivalSparkTexture;
    if (!starTexture) {
      return billboards;
    }

    for (let index = 0; index < LEAF_DEN_CONSTRUCTION_STAR_COUNT; index += 1) {
      const angle = index * 2.141 + nowSeconds * (1.8 + (index % 3) * 0.24);
      const pop = 0.5 + 0.5 * Math.sin(nowSeconds * 7.2 + index);
      const radius = 0.8 + (index % 4) * 0.2;
      billboards.push({
        texture: starTexture,
        position: [
          position[0] + Math.cos(angle) * radius,
          position[1] + 0.72 + pop * 0.95,
          position[2] + Math.sin(angle * 1.16) * (radius * 0.72)
        ],
        size: [0.2 + pop * 0.18, 0.2 + pop * 0.18],
        uvRect,
        rotation: angle
      });
    }

    return billboards;
  }

  function getConstructionCloudBurstBillboards(uvRect, nowSeconds = getRuntimeNowSeconds()) {
    const bursts = getActiveConstructionCloudBursts();
    const starTexture = session.logChairStarTexture || session.natureRevivalSparkTexture;
    if (!starTexture || bursts.length <= 0) {
      return [];
    }

    const billboards = [];
    for (const burst of bursts) {
      const position = burst.position;
      const effectAlpha = Math.sin(Math.PI * clamp01(burst.progress));

      for (let index = 0; index < CONSTRUCTION_CLOUD_BURST_STAR_COUNT; index += 1) {
        const angle = index * 2.141 + nowSeconds * (2.6 + (index % 3) * 0.28);
        const pop = 0.5 + 0.5 * Math.sin(nowSeconds * 8.6 + index);
        const radius = (0.54 + (index % 4) * 0.17) * (0.7 + effectAlpha * 0.5);
        billboards.push({
          texture: starTexture,
          position: [
            position[0] + Math.cos(angle) * radius,
            position[1] + 0.54 + pop * 0.88,
            position[2] + Math.sin(angle * 1.16) * (radius * 0.72)
          ],
          size: [
            (0.14 + pop * 0.2) * Math.max(0.12, effectAlpha),
            (0.14 + pop * 0.2) * Math.max(0.12, effectAlpha)
          ],
          uvRect,
          rotation: angle
        });
      }
    }

    return billboards;
  }

  function syncLeafDenModelInstance(deltaTime = 0) {
    const instance = session.leafDenModelInstance;
    if (!instance) {
      return;
    }

    if (session.leafDenPlacementPreviewModelInstance && !session.leafDenKitPlacementPreview?.active) {
      session.leafDenPlacementPreviewModelInstance.active = false;
      session.leafDenPlacementPreviewModelInstance.alpha = 1;
      session.leafDenPlacementPreviewModelInstance.tintStrength = 0;
    }

    if (session.leafDenKitPlacementPreview?.active) {
      return;
    }

    if (
      !session.leafDen?.position ||
      !controls.storyState.flags.leafDenKitPlaced ||
      !controls.storyState.flags.leafDenBuilt
    ) {
      instance.active = false;
      return;
    }

    const groundY = instance.leafDenGroundY ?? Number(instance.offset?.[1] ?? 0.02);
    const baseScale = instance.leafDenBaseScale ?? Number(instance.scale || 1);
    const baseYaw = instance.leafDenBaseYaw ?? Number(instance.yaw || 0);
    instance.leafDenGroundY = groundY;
    instance.leafDenBaseScale = baseScale;
    instance.leafDenBaseYaw = baseYaw;
    instance.offset = [
      session.leafDen.position[0],
      groundY,
      session.leafDen.position[2]
    ];
    instance.scale = baseScale;
    instance.yaw = baseYaw + getWorkbenchRotationPreviewYaw({
      kind: "house",
      placement: session.leafDen
    });
    instance.alpha = 1;
    instance.tintStrength = 0;
    instance.active = true;
    applyPlayerPlacementSpawnToModelInstance(session.leafDen, instance, {
      baseScale,
      groundY,
      deltaTime
    });
    applyWorkbenchRotationSelectionTint("house", instance);
  }

  function ensurePlayerHouseModelInstances() {
    session.playerHouses ||= [];
    session.playerHouseModelInstances ||= [];
    session.leafDenModelInstances ||= [
      session.leafDenModelInstance,
      session.leafDenPlacementPreviewModelInstance
    ].filter(Boolean);

    while (session.playerHouseModelInstances.length < session.playerHouses.length) {
      const houseIndex = session.playerHouseModelInstances.length;
      const house = session.playerHouses[houseIndex] || {};
      const baseScale =
        session.leafDenModelInstance?.leafDenBaseScale ??
        session.leafDenModelInstance?.scale ??
        1;
      const baseYaw =
        session.leafDenModelInstance?.leafDenBaseYaw ??
        session.leafDenModelInstance?.yaw ??
        0;
      const groundY =
        session.leafDenModelInstance?.leafDenGroundY ??
        session.leafDenModelInstance?.offset?.[1] ??
        0.02;
      const instance = {
        id: `${house.id || `player-house-${houseIndex}`}-model`,
        offset: Array.isArray(house.position) ?
          [house.position[0], groundY, house.position[2]] :
          [0, groundY, 0],
        scale: baseScale,
        yaw: baseYaw + Number(house.yaw || 0),
        active: false,
        leafDenGroundY: groundY,
        leafDenBaseScale: baseScale,
        leafDenBaseYaw: baseYaw
      };
      session.playerHouseModelInstances.push(instance);
      session.leafDenModelInstances.push(instance);
    }

    if (session.playerHouseModelInstances.length > session.playerHouses.length) {
      for (let index = session.playerHouses.length; index < session.playerHouseModelInstances.length; index += 1) {
        session.playerHouseModelInstances[index].active = false;
      }
    }

    return session.playerHouseModelInstances;
  }

  function syncPlayerHouseModelInstances(deltaTime = 0) {
    const instances = ensurePlayerHouseModelInstances();

    for (let index = 0; index < instances.length; index += 1) {
      const instance = instances[index];
      const house = session.playerHouses?.[index] || null;
      if (!instance || !Array.isArray(house?.position)) {
        if (instance) {
          instance.active = false;
        }
        continue;
      }

      const groundY = instance.leafDenGroundY ?? Number(instance.offset?.[1] ?? 0.02);
      const baseScale = instance.leafDenBaseScale ?? Number(instance.scale || 1);
      const baseYaw = instance.leafDenBaseYaw ?? Number(instance.yaw || 0);
      instance.leafDenGroundY = groundY;
      instance.leafDenBaseScale = baseScale;
      instance.leafDenBaseYaw = baseYaw;
      instance.offset = [
        house.position[0],
        groundY,
        house.position[2]
      ];
      instance.scale = baseScale;
      instance.yaw = baseYaw + getWorkbenchRotationPreviewYaw({
        kind: `playerHouse:${house.id}`,
        placement: house
      });
      instance.alpha = 1;
      instance.tintStrength = 0;
      instance.active = true;
      applyPlayerPlacementSpawnToModelInstance(house, instance, {
        baseScale,
        groundY,
        deltaTime
      });
      applyWorkbenchRotationSelectionTint(`playerHouse:${house.id}`, instance);
    }
  }

  function updateTrainHouseMusic(nowSeconds = 0) {
    const playerPosition = session.playerCharacter?.getPosition?.() || null;
    const trainHousePosition =
      session.campfire?.position && controls.storyState.flags.campfireSpatOut ?
        session.campfire.position :
        null;
    const nextVolume = resolveTrainHouseMusicVolume({
      playerPosition,
      trainHousePosition
    });

    trainHouseMusicController.update({
      active: nextVolume > 0.002,
      volume: nextVolume
    });
    gameplay.musicRuntime?.reportObjectMusicActivity?.({
      active: nextVolume > 0.002,
      nowSeconds
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
      setRepairBoxRevealFlashOpacity(0);
      return false;
    }

    if (!Array.isArray(encounter.repairPosition)) {
      opening.active = false;
      setRepairBoxRevealFlashOpacity(0);
      return false;
    }

    opening.duration = Number(opening.duration || BULBASAUR_REVEAL_BOX_DURATION);
    opening.elapsed = Math.min(opening.duration, Number(opening.elapsed || 0) + deltaTime);
    const progress = clamp01(opening.elapsed / opening.duration);
    updateRepairBoxRevealFlash(opening, encounter);

    if (progress >= BULBASAUR_REVEAL_VISIBLE_PROGRESS && !opening.bulbasaurVisible) {
      revealBulbasaurAtRepairPosition(encounter);
      opening.bulbasaurVisible = true;
      if (opening.hideBoxWhenVisible && encounter.repairModuleInstance) {
        encounter.repairModuleInstance.active = false;
      }
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
      setRepairBoxRevealFlashOpacity(0);
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

  function isBulbasaurWorkbenchGuideActive() {
    const flags = controls.storyState?.flags || {};
    return Boolean(
      flags.bulbasaurWorkbenchGuideAvailable &&
      !flags.workbenchDiyRecipesReceived &&
      session.bulbasaurEncounter
    );
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

  function moveConstructionHelperToLeafDen(encounter, {
    offset = [0, 0, 0],
    modelFaceYawOffset = 0,
    nowSeconds = getRuntimeNowSeconds()
  } = {}) {
    if (!encounter || !Array.isArray(session.leafDen?.position)) {
      return false;
    }

    const anchor = session.leafDen.position;
    const squash = Math.sin(nowSeconds * 9 + offset[0] * 3 + offset[2]) * 0.045;
    encounter.visible = true;
    encounter.position = [
      anchor[0] + offset[0] + Math.sin(nowSeconds * 5.5 + offset[2]) * 0.08,
      0.04,
      anchor[2] + offset[2] + Math.cos(nowSeconds * 4.8 + offset[0]) * 0.06
    ];

    if (encounter.modelInstance) {
      encounter.modelInstance.yaw = getRobotModelYawToward(
        encounter.position,
        anchor,
        modelFaceYawOffset
      );
      encounter.modelInstance.scale = Math.max(0.1, Number(encounter.modelInstance.scale || 1) + squash);
    }

    return true;
  }

  function updateCharmanderEncounter(deltaTime, { activeMoveId = null } = {}) {
    const encounter = session.charmanderEncounter;

    if (!encounter || !controls.storyState?.flags?.charmanderRevealed) {
      return;
    }

    encounter.visible = true;

    if (!encounter.position) {
      encounter.position = session.playerCharacter?.getPosition?.() || [0, 0.02, 0];
    }

    if (isLeafDenConstructionActive()) {
      moveConstructionHelperToLeafDen(encounter, {
        offset: [-1.08, 0, 0.82],
        modelFaceYawOffset: CHARMANDER_MODEL_FACE_YAW_OFFSET
      });
      syncCharmanderModelInstance();
      return;
    }

    if (
      controls.storyState.flags.charmanderFollowing &&
      session.playerCharacter &&
      !session.charmanderFireAction &&
      !isLeafDenConstructionActive()
    ) {
      const formationIndex = getCompanionFollowFormationIndex("charmander", activeMoveId);
      moveGroundCompanionTowardPlayer(encounter, {
        deltaTime,
        speed: CHARMANDER_FOLLOW_SPEED,
        followDistance: resolveCompanionFollowDistance({
          companionId: "charmander",
          activeMoveId,
          defaultDistance: CHARMANDER_FOLLOW_DISTANCE,
          formationIndex
        }),
        modelFaceYawOffset: CHARMANDER_MODEL_FACE_YAW_OFFSET
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

    syncCharmanderModelInstance();
  }

  function updateTimburrEncounter(deltaTime, { activeMoveId = null } = {}) {
    const encounter = session.timburrEncounter;

    if (!encounter || !controls.storyState?.flags?.timburrRevealed) {
      return;
    }

    encounter.visible = true;

    if (!encounter.position) {
      encounter.position = session.playerCharacter?.getPosition?.() || [0, 0.02, 0];
    }

    if (isLeafDenConstructionActive()) {
      moveConstructionHelperToLeafDen(encounter, {
        offset: [1.04, 0, -0.76]
      });
      return;
    }

    if (
      controls.storyState.flags.timburrFollowing &&
      session.playerCharacter &&
      !isLeafDenConstructionActive()
    ) {
      const formationIndex = getCompanionFollowFormationIndex("timburr", activeMoveId);
      moveGroundCompanionTowardPlayer(encounter, {
        deltaTime,
        speed: TIMBURR_FOLLOW_SPEED,
        followDistance: resolveCompanionFollowDistance({
          companionId: "timburr",
          activeMoveId,
          defaultDistance: TIMBURR_FOLLOW_DISTANCE,
          formationIndex
        })
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

  function getBulbasaurInteractionRadiusGizmoBillboards(encounter, texture, uvRect, now) {
    if (!encounter?.visible || !Array.isArray(encounter.position) || !texture) {
      return [];
    }

    const [centerX, centerY, centerZ] = encounter.position;
    const time = now * 0.001;

    return Array.from({ length: BULBASAUR_INTERACTION_GIZMO_DOT_COUNT }, (_, index) => {
      const angle = (index / BULBASAUR_INTERACTION_GIZMO_DOT_COUNT) * Math.PI * 2;
      const pulse = 0.82 + Math.sin(time * 4 + index * 0.71) * 0.18;
      const size = BULBASAUR_INTERACTION_GIZMO_DOT_SIZE * pulse;

      return {
        texture,
        position: [
          centerX + Math.cos(angle) * BULBASAUR_TALK_INTERACT_DISTANCE,
          centerY + 0.14,
          centerZ + Math.sin(angle) * BULBASAUR_TALK_INTERACT_DISTANCE
        ],
        size: [size, size],
        uvRect,
        alpha: 0.74,
        rotation: angle + time * 0.25
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
      gameplayOpeningHudHidden = false;
      gameplayOpeningHudRevealAt = null;
      gameplayUiVisibility?.showSections?.(["hud", "inventory"]);
    }

    const gameplayOpeningCameraActive =
      gameplayCameraDirector.beginFrame({
        now,
        gameplayActive: isGameFlow(gameFlowValues.GAMEPLAY)
      });
    const solarStationPlacementPreviewActive = Boolean(session.strawBedPlacementPreview?.active);
    const leafDenKitPlacementPreviewActive = Boolean(session.leafDenKitPlacementPreview?.active);
    const movementBlocked = Boolean(
      gameplayOpeningCameraActive ||
      tutorialMovementLocked ||
      pokedexModalOpen ||
      dialogueActive ||
      skillLearnActive ||
      scriptedInteractionActive ||
      solarStationPlacementPreviewActive ||
      leafDenKitPlacementPreviewActive
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

    const placementRotationRequest = controls.consumePlacementRotationRequest?.() || 0;
    if (placementRotationRequest) {
      const rotatedPreview = rotateActivePlacementPreview(placementRotationRequest);
      if (!rotatedPreview) {
        rotateNearbyWorkbenchConstruction(placementRotationRequest);
      }
    }

    const placementCancelRequested = controls.consumeJumpRequest?.() || false;
    if (
      placementCancelRequested &&
      workbenchRotationSelection
    ) {
      clearWorkbenchConstructionRotationSelection();
    } else if (
      placementCancelRequested &&
      (
        session.strawBedPlacementPreview?.active ||
        session.leafDenKitPlacementPreview?.active
      )
    ) {
      cancelSolarStationPlacementPreview();
      cancelLeafDenKitPlacementPreview();
    }

    let solarStationPlacementPreview = updateSolarStationPlacementPreview(deltaTime);
    let leafDenKitPlacementPreview = updateLeafDenKitPlacementPreview(deltaTime);
    updateSolarStationSpawnEffect(deltaTime);
    syncSolarStationWorkbenchRotationVisual(now * 0.001);
    let playerMovedThisFrame = false;

    if (
      session.playerCharacter &&
      !cinematicActive &&
      !tutorialMovementLocked &&
      !pokedexModalOpen &&
      !skillLearnActive &&
      !scriptedInteractionActive &&
      !dialogueActive &&
      !solarStationPlacementPreview &&
      !leafDenKitPlacementPreview
    ) {
      const previousPlayerPosition = session.playerCharacter.getPosition();
      session.playerCharacter.update(deltaTime);
      const nextPlayerPosition = session.playerCharacter.getPosition();
      const movedDistance = Math.hypot(
        nextPlayerPosition[0] - previousPlayerPosition[0],
        nextPlayerPosition[2] - previousPlayerPosition[2]
      );
      playerMovedThisFrame = movedDistance > 0.0005;
      updateCompanionFollowDirection(
        nextPlayerPosition[0] - previousPlayerPosition[0],
        nextPlayerPosition[2] - previousPlayerPosition[2]
      );
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
        !dialogueActive &&
        !solarStationPlacementPreview &&
        !leafDenKitPlacementPreview
    });
    updateNatureRevivalEffects(session.natureRevivalEffects, deltaTime);
    updateTreeRevivalLeafBursts(deltaTime);
    updateWoodCollectPopEffects(deltaTime);

    const activeMoveId = controls.getActiveMoveId?.() || null;
    const firstTaughtActionFreedomWindow = syncFirstTaughtActionFreedomWindow(
      controls.storyState,
      { now }
    );
    const waterGunEquipped = Boolean(
      controls.playerSkills?.waterGun &&
      activeMoveId === "waterGun"
    );
    const bulbasaurWorkbenchGuideActive = isBulbasaurWorkbenchGuideActive();
    const leafageEquipped = Boolean(
      controls.playerSkills?.leafage &&
      activeMoveId === "leafage" &&
      !bulbasaurWorkbenchGuideActive
    );
    const fireEquipped = Boolean(
      controls.playerSkills?.fire &&
      activeMoveId === "fire"
    );
    const isWaterGunTreeTarget = (target) => Boolean(
      waterGunEquipped &&
      target?.palm
    );

    function performHarvestAction(playerPosition, options = {}) {
      const previousWateredTreeCount = Number(controls.storyState.flags.wateredTreeCount || 0);
      const previousRestoredGrassCount = Number(controls.storyState.flags.restoredGrassCount || 0);
      const previousSupplyCounts = getSupplyCounterSnapshot(controls.inventory);
      const result = performGameplayHarvestAction({
        playerPosition,
        palmModel: session.palmModel,
        palmInstances: session.palmInstances,
        resourceNodes: session.resourceNodes,
        leppaTree: session.leppaTree,
        inventory: controls.inventory,
        canPurifyGround: waterGunEquipped,
        groundDeadInstances: session.groundDeadInstances,
        iceGroundInstances: session.iceGroundInstances,
        groundFlowerPatches: session.groundFlowerPatches,
        groundGrassPatches: session.groundGrassPatches,
        groundPurifiedInstances: session.groundPurifiedInstances,
        storyState: controls.storyState,
        leafDen: session.leafDen,
        woodDrops: session.woodDrops,
        leppaBerryDrops: session.leppaBerryDrops,
        canUseLeafage: leafageEquipped,
        canUseFire: fireEquipped,
        useWaterGun: Boolean(options.useWaterGun),
        useFire: Boolean(options.useFire),
        forcedHarvestTarget: options.forcedHarvestTarget || null,
        allowPlacement: options.allowPlacement !== false
      }, {
        actionType: options.useWaterGun ? "waterGun" : options.useFire ? "fire" : leafageEquipped ? "leafage" : "harvest"
      });

      const nextWateredTreeCount = Number(controls.storyState.flags.wateredTreeCount || 0);
      const nextRestoredGrassCount = Number(controls.storyState.flags.restoredGrassCount || 0);
      if (
        result &&
        options.useWaterGun &&
        nextRestoredGrassCount > previousRestoredGrassCount
      ) {
        triggerQuestCounterPrompt({
          count: nextRestoredGrassCount,
          total: BULBASAUR_DRY_GRASS_MISSION_RESTORE_COUNT,
          label: "dry grass",
          now
        });
      } else if (
        result &&
        options.useWaterGun &&
        nextWateredTreeCount > previousWateredTreeCount
      ) {
        playTreeBirthSfx();
        triggerQuestCounterPrompt({
          count: nextWateredTreeCount,
          total: 5,
          label: "trees",
          now
        });
      } else if (result) {
        triggerChangedSupplyCounterPrompt(previousSupplyCounts, controls.inventory, now);
      }

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
        iceGroundInstances: session.iceGroundInstances,
        groundPurifiedInstances: session.groundPurifiedInstances,
        groundGrassPatches: session.groundGrassPatches,
        groundFlowerPatches: session.groundFlowerPatches,
        canPurifyGround: waterGunEquipped,
        canUseLeafage: leafageEquipped,
        canUseFire: fireEquipped,
        allowPlacement: !gamepadPrimaryMoveRequested
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
        (leafageEquipped && primaryActionTarget?.leafageGroundCell) ||
        (fireEquipped && primaryActionTarget?.fireGroundCell)
      );
      const primaryActionWantsFieldMove =
        harvestRequestSource === "gamepadPrimary" ||
        harvestRequestSource === "keyboardPrimary";
      const leafageAutoWaterGunTarget =
        leafageEquipped &&
        primaryActionWantsFieldMove &&
        controls.playerSkills?.waterGun &&
        !primaryActionPlacementTarget &&
        !primaryActionTarget?.leafageGroundCell ?
          gameplay.findNearbyActionTarget({
            playerPosition,
            palmModel: session.palmModel,
            palmInstances: session.palmInstances,
            resourceNodes: session.resourceNodes,
            leppaTree: session.leppaTree,
            leafDen: session.leafDen,
            storyState: controls.storyState,
            inventory: controls.inventory,
            groundDeadInstances: session.groundDeadInstances,
            iceGroundInstances: session.iceGroundInstances,
            groundPurifiedInstances: session.groundPurifiedInstances,
            groundGrassPatches: session.groundGrassPatches,
            groundFlowerPatches: session.groundFlowerPatches,
            canPurifyGround: true,
            canUseLeafage: false,
            canUseFire: false,
            allowPlacement: false
          }) :
          null;
      const primaryActionInvalidLeafageUse = Boolean(
        leafageEquipped &&
        primaryActionWantsFieldMove &&
        !primaryActionPlacementTarget &&
        !primaryActionTarget?.leafageGroundCell &&
        !leafageAutoWaterGunTarget?.groundCell
      );
      const primaryActionInvalidFireUse = Boolean(
        fireEquipped &&
        primaryActionWantsFieldMove &&
        !primaryActionPlacementTarget &&
        !primaryActionTarget?.fireGroundCell
      );
      const primaryActionAlreadyResolvedGroundCell =
        primaryActionWantsFieldMove &&
        !primaryActionPlacementTarget &&
        !primaryActionIsMove &&
        !leafageAutoWaterGunTarget?.groundCell ?
          findAlreadyResolvedFieldMoveGroundCell(playerPosition, {
            waterGunEquipped,
            leafageEquipped,
            fireEquipped
          }) :
          null;
      const primaryActionRepeatedFieldMove = Boolean(primaryActionAlreadyResolvedGroundCell);
      const primaryActionConfirmsRotation = Boolean(getSelectedRotatableWorkbenchPlacement());
      const primaryActionPlacementCanYieldToRotation = Boolean(
        !primaryActionPlacementTarget ||
        primaryActionTarget?.leafDenKitPlacement ||
        primaryActionTarget?.leafDenFurniturePlacement ||
        primaryActionTarget?.dittoFlagPlacement
      );
      const primaryActionRotationTarget =
        !primaryActionConfirmsRotation &&
        !dialogueActive &&
        primaryActionPlacementCanYieldToRotation &&
        !primaryActionIsMove &&
        !leafageAutoWaterGunTarget?.groundCell ?
          getNearestRotatableWorkbenchPlacement() :
          null;
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
        !primaryActionWantsFieldMove &&
        !primaryActionIsPlacement &&
        !primaryActionIsMove &&
        !leafageAutoWaterGunTarget?.groundCell &&
        !primaryActionRepeatedFieldMove &&
        !primaryActionInvalidLeafageUse &&
        !primaryActionInvalidFireUse ?
          gameplay.findNearbyInteractable(
          playerPosition,
          session.npcActors,
          session.interactables,
          controls.storyState,
          [
            ...(session.groundGrassPatches || []),
            ...(session.groundFlowerPatches || [])
          ],
          session.logChair,
            session.leafDen,
            session.timburrEncounter,
            session.charmanderEncounter,
            session.leppaTree,
            session.bulbasaurEncounter
          ) :
          null;

      if (primaryActionConfirmsRotation) {
        confirmWorkbenchConstructionRotationSelection();
      } else if (primaryActionRotationTarget) {
        selectWorkbenchConstructionForRotation(primaryActionRotationTarget);
      } else if (leafageAutoWaterGunTarget?.groundCell) {
        leafageInvalidTargetPromptUntil = 0;
        controls.setActiveMoveId?.("waterGun");
        controls.storyState.flags[WATER_GUN_FIRST_USE_PROMPT_FLAG] = true;
        triggerGroundActionFeedback(leafageAutoWaterGunTarget.groundCell, "waterGun", now);
        const squirtleWaterGunResult = startSquirtleWaterGunAction({
          groundCell: leafageAutoWaterGunTarget.groundCell,
          playerPosition
        });

        if (squirtleWaterGunResult === "unavailable") {
          triggerWaterGunSfxBurst();
          performHarvestAction(playerPosition, {
            useWaterGun: true,
            forcedHarvestTarget: leafageAutoWaterGunTarget
          });
        }
      } else if (primaryActionRepeatedFieldMove) {
        triggerInvalidFieldMoveFeedback(primaryActionAlreadyResolvedGroundCell, now);
      } else if (primaryActionInvalidLeafageUse) {
        leafageInvalidTargetPromptUntil = now + LEAFAGE_INVALID_TARGET_PROMPT_DURATION_MS;
      } else if (primaryActionInvalidFireUse) {
        fireInvalidTargetPromptUntil = now + FIRE_INVALID_TARGET_PROMPT_DURATION_MS;
      } else if (primaryActionPlacementBlocked) {
        // The trigger is reserved for the selected move. Placements use Enter or gamepad X.
      } else if (primaryActionIsPlacement) {
        performHarvestAction(playerPosition);
      } else if (primaryActionIsMove && !dialogueActive) {
        if (waterGunEquipped && primaryActionTarget?.groundCell) {
          triggerGroundActionFeedback(primaryActionTarget.groundCell, "waterGun", now);
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
          leafageInvalidTargetPromptUntil = 0;
          triggerGroundActionFeedback(primaryActionTarget.leafageGroundCell, "leafage", now);
          const bulbasaurLeafageResult = startBulbasaurLeafageAction({
            groundCell: primaryActionTarget.leafageGroundCell,
            playerPosition
          });

          if (bulbasaurLeafageResult === "unavailable") {
            performHarvestAction(playerPosition, {
              forcedHarvestTarget: primaryActionTarget
            });
          }
        } else if (fireEquipped && primaryActionTarget?.fireGroundCell) {
          fireInvalidTargetPromptUntil = 0;
          triggerGroundActionFeedback(primaryActionTarget.fireGroundCell, "fire", now);
          const charmanderFireResult = startCharmanderFireAction({
            groundCell: primaryActionTarget.fireGroundCell,
            playerPosition
          });

          if (charmanderFireResult === "unavailable") {
            performHarvestAction(playerPosition, {
              useFire: true,
              forcedHarvestTarget: primaryActionTarget
            });
          }
        }
      } else if (isLeafDenBusyCompanionTarget(primaryInteractTarget?.target)) {
        hud?.pushNotice?.(LEAF_DEN_BUSY_NOTICE);
      } else if (primaryInteractTarget?.target) {
        performGameplayInteractAction({
          playerPosition,
          npcActors: session.npcActors,
          interactables: session.interactables,
          storyState: controls.storyState,
          inventory: controls.inventory,
          groundGrassPatches: session.groundGrassPatches,
          groundFlowerPatches: session.groundFlowerPatches,
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
      } else if (!dialogueActive && !primaryActionWantsFieldMove) {
        performHarvestAction(playerPosition, {
          allowPlacement: !gamepadPrimaryMoveRequested
        });
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
        canUseLeafage: false,
        allowPlacement: false
      });

      if (waterGunTarget?.groundCell) {
        const squirtleWaterGunResult = startSquirtleWaterGunAction({
          groundCell: waterGunTarget.groundCell,
          playerPosition
        });

        if (
          squirtleWaterGunResult === "started" ||
          squirtleWaterGunResult === "queued" ||
          squirtleWaterGunResult === "unavailable"
        ) {
          triggerGroundActionFeedback(waterGunTarget.groundCell, "waterGun", now);
        }

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
      performGameplayInteractAction({
        playerPosition: session.playerCharacter.getPosition(),
        npcActors: session.npcActors,
        interactables: session.interactables,
        storyState: controls.storyState,
        inventory: controls.inventory,
        groundGrassPatches: session.groundGrassPatches,
        groundFlowerPatches: session.groundFlowerPatches,
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
    updateLandscapeCutEffects(deltaTime);
    syncCarbonOreResourceInstances(session.resourceNodes, controls.storyState);
    session.updateCloudAtmosphere?.(deltaTime);
    updateSnowstormParticleField(session.snowstorm, {
      deltaTime,
      playerPosition: session.playerCharacter?.getPosition?.() || null
    });
    updateSnowstormFogOverlay(deltaTime);
    gameplay.syncLeppaTreeState?.(session.leppaTree, controls.storyState);
    updateLeppaTreeDance(now);
    updateLeppaTreeMusicNotes(deltaTime);
    const chopperBulbasaurRepairBoxInvestigationTarget =
      getBulbasaurRepairBoxInvestigationTarget();
    updateChopperNpcActor(session.chopperNpcActor, {
      deltaTime,
      storyState: controls.storyState,
      isNpcActive: rendering.isNpcActive,
      isDialogueActive: () => gameplayDialogue.isActive(),
      guidePosition: RUINED_POKEMON_CENTER_GUIDE_POSITION,
      investigationTarget: chopperBulbasaurRepairBoxInvestigationTarget
    });
    updateBulbasaurEncounter(deltaTime);
    updateCharmanderEncounter(deltaTime, { activeMoveId });
    updateCharmanderFireAction(deltaTime);
    fireFlameSfxController.update({
      active: session.charmanderFireAction?.phase === "spray",
      nowSeconds: now * 0.001
    });
    updateTimburrEncounter(deltaTime, { activeMoveId });
    syncCompanionRepairModules();
    syncBeeFieldRepairBox();
    syncBeeFieldBees(deltaTime);
    updateSquirtleReassembly(deltaTime);
    updateSquirtleWaterStamina(deltaTime);
    updateCharmanderCarbonEnergy(deltaTime);
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
      active: robotIdlePatrolActive,
      activeMoveId
    });
    updateBulbasaurIdlePatrol(deltaTime, {
      active: robotIdlePatrolActive,
      activeMoveId
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
          const collectedWoodPositions = getNewlyCollectedDropPositions(woodDropSnapshots);
          for (let woodIndex = 0; woodIndex < collectedWoodCount; woodIndex += 1) {
            woodGrabSfxController.update({
              active: true,
              nowSeconds: (now * 0.001) + woodIndex * 0.025
            });
          }
          hud.syncInventoryUi(controls.inventory);
          queueSupplyPickupFlyItems("wood", collectedWoodPositions);
          hud.pushNotice(`+${collectedWoodCount} Wood`);
          triggerSupplyCounterPrompt("wood", controls.inventory, now);

          if (controls.storyState.flags.bulbasaurStrawBedChallengeCompletionNoticePending) {
            controls.storyState.flags.bulbasaurStrawBedChallengeCompletionNoticePending = false;
            hud.pushNotice("First set of challenges complete. Talk to Bulbasaur.");
          }
        }

        const leafPlayerPosition = session.playerCharacter.getPosition();
        const leafDropSnapshots = snapshotCollectibleSources(
          session.woodDrops,
          (drop) => drop.itemId === LEAVES_ITEM_ID && !drop.collected
        );
        const leafResourceSnapshots = snapshotCollectibleSources(
          session.resourceNodes,
          (resourceNode) => resourceNode.itemId === LEAVES_ITEM_ID
        );
        const collectedLeafDropCount = gameplay.collectLeafDrops?.(
          leafPlayerPosition,
          session.woodDrops,
          controls.inventory
        ) || 0;
        const collectedLeafResourceCount = gameplay.collectLeafResourceNodes?.(
          leafPlayerPosition,
          session.resourceNodes,
          controls.inventory
        ) || 0;
        const collectedLeafCount = collectedLeafDropCount + collectedLeafResourceCount;

        if (collectedLeafCount > 0) {
          const collectedLeafPositions = [
            ...getNewlyCollectedDropPositions(leafDropSnapshots),
            ...getNewlyCollectedResourcePositions(leafResourceSnapshots)
          ];
          for (let leafIndex = 0; leafIndex < collectedLeafCount; leafIndex += 1) {
            woodGrabSfxController.update({
              active: true,
              nowSeconds: (now * 0.001) + leafIndex * 0.025
            });
          }
          hud.syncInventoryUi(controls.inventory);
          queueSupplyPickupFlyItems(LEAVES_ITEM_ID, collectedLeafPositions);
          hud.pushNotice(`+${collectedLeafCount} Leaves`);
          triggerSupplyCounterPrompt(LEAVES_ITEM_ID, controls.inventory, now);
        }

        const carbonResourceSnapshots = snapshotCollectibleSources(
          session.resourceNodes,
          (resourceNode) => resourceNode.itemId === CARBON_ITEM_ID
        );
        const collectedCarbonCount = gameplay.collectCarbonResourceNodes?.(
          leafPlayerPosition,
          session.resourceNodes,
          controls.inventory
        ) || 0;

        if (collectedCarbonCount > 0) {
          const collectedCarbonPositions = getNewlyCollectedResourcePositions(carbonResourceSnapshots);
          for (let carbonIndex = 0; carbonIndex < collectedCarbonCount; carbonIndex += 1) {
            woodGrabSfxController.update({
              active: true,
              nowSeconds: (now * 0.001) + carbonIndex * 0.025
            });
          }
          hud.syncInventoryUi(controls.inventory);
          queueSupplyPickupFlyItems(CARBON_ITEM_ID, collectedCarbonPositions);
          hud.pushNotice(`+${collectedCarbonCount} Carbon`);
          triggerSupplyCounterPrompt(CARBON_ITEM_ID, controls.inventory, now);
        }

        const leppaBerrySnapshots = snapshotCollectibleSources(
          session.leppaBerryDrops,
          (drop) => !drop.collected
        );
        const collectedLeppaBerryCount = gameplay.collectLeppaBerryDrops?.(
          session.playerCharacter.getPosition(),
          session.leppaBerryDrops,
          controls.inventory
        ) || 0;

        if (collectedLeppaBerryCount > 0) {
          const collectedLeppaBerryPositions = getNewlyCollectedDropPositions(leppaBerrySnapshots);
          hud.syncInventoryUi(controls.inventory);
          queueSupplyPickupFlyItems(LEPPA_BERRY_ITEM_ID, collectedLeppaBerryPositions);
          hud.pushNotice(`+${collectedLeppaBerryCount} Leppa Berry`);
          triggerSupplyCounterPrompt(LEPPA_BERRY_ITEM_ID, controls.inventory, now);
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
        triggerGameplayOpeningShipImpactEffect(shipEvent, now);
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
    const nowSeconds = now * 0.001;
    updateTrainHouseMusic(nowSeconds);
    gameplay.musicRuntime?.update?.(deltaTime, { nowSeconds });

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
          iceGroundInstances: session.iceGroundInstances,
          groundPurifiedInstances: session.groundPurifiedInstances,
          groundGrassPatches: session.groundGrassPatches,
          groundFlowerPatches: session.groundFlowerPatches,
          canPurifyGround: waterGunEquipped,
          canUseLeafage: leafageEquipped,
          canUseFire: fireEquipped
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
        (waterGunEquipped && !nearbyHarvestTarget?.groundCell) ||
        (fireEquipped && !nearbyHarvestTarget?.fireGroundCell)
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
          iceGroundInstances: session.iceGroundInstances,
          groundPurifiedInstances: session.groundPurifiedInstances,
          groundGrassPatches: session.groundGrassPatches,
          groundFlowerPatches: session.groundFlowerPatches,
          canPurifyGround: leafageEquipped,
          canUseLeafage: waterGunEquipped,
          canUseFire: false
        }) :
        null;
    const invalidMoveGroundCell = leafageEquipped ?
      nearbyInvalidMoveTarget?.groundCell :
      waterGunEquipped ?
        nearbyInvalidMoveTarget?.leafageGroundCell :
        fireEquipped ?
          null :
        null;
    const highlightedGroundCell =
      nearbyHarvestTarget?.groundCell ||
      nearbyHarvestTarget?.leafageGroundCell ||
      nearbyHarvestTarget?.fireGroundCell ||
      invalidMoveGroundCell ||
      null;
    const highlightedGroundCellTargetState =
      highlightedGroundCell && highlightedGroundCell === invalidMoveGroundCell ?
        "invalid" :
        "valid";
    const highlightedGroundCellAbilityId =
      leafageEquipped ?
        "leafage" :
        waterGunEquipped ?
          "waterGun" :
          fireEquipped ?
            "fire" :
          null;
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
          [
            ...(session.groundGrassPatches || []),
            ...(session.groundFlowerPatches || [])
          ],
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
    const activeFireGroundCell =
      !gameplayOpeningCameraActive &&
      !gameplayOpeningHudHidden &&
      !cinematicActive &&
      !tutorialActive &&
      !pokedexModalOpen &&
      !skillLearnActive &&
      !scriptedInteractionActive &&
      session.charmanderFireAction?.groundCell &&
      !session.charmanderFireAction.impactApplied ?
        {
          ...session.charmanderFireAction.groundCell,
          highlightTargetState: "valid",
          highlightAbilityId: "fire"
        } :
        null;
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
    const solarStationFieldMarkedGroundCells =
      nearbyHarvestTarget?.strawBedPlacement &&
      !controls.storyState.flags.strawBedPlacedInBulbasaurHabitat ?
        buildSolarStationFieldMarkedGroundCells(nearbyHarvestTarget.strawBedPlacement) :
        [];
    const markedActionGroundCells = [
      ...new Set([
        ...leppaTreeMissionGroundCells,
        ...pendingWaterGunGroundCells,
        ...activeLeafageGroundCells,
        ...solarStationFieldMarkedGroundCells
      ])
    ];
    if (!session.strawBedPlacementPreview?.active) {
      solarStationPlacementPreview = null;
    }
    if (!session.leafDenKitPlacementPreview?.active) {
      leafDenKitPlacementPreview = null;
    }
    const transientNoticeRoute = resolveTransientNoticeRoute(hud.getNoticeMessage());
    const playerCounterPromptText = getPlayerCounterPrompt(now);
    const solarStationPlacementPrompt = solarStationPlacementPreview ?
      (
        solarStationPlacementPreview.valid ?
          "Move Solar Station preview  X / Enter Place  B Cancel  LB/RB Rotate" :
          "Blocked  Move away from objects  B Cancel  LB/RB Rotate"
      ) :
      "";
    const leafDenKitPlacementPrompt = leafDenKitPlacementPreview ?
      (
        leafDenKitPlacementPreview.valid ?
          "Move House Kit preview  X / Enter Place  B Cancel  LB/RB Rotate" :
          leafDenKitPlacementPreview.invalidReason === "outside-solar-station-radius" ?
            "Needs Solar Station power radius  B Cancel  LB/RB Rotate" :
            "Blocked  Move away from objects  B Cancel  LB/RB Rotate"
      ) :
      "";
    const selectedWorkbenchRotationTarget =
      !solarStationPlacementPreview &&
      !leafDenKitPlacementPreview ?
        getSelectedRotatableWorkbenchPlacement() :
        null;
    const nearbyWorkbenchRotationTarget =
      !selectedWorkbenchRotationTarget &&
      !solarStationPlacementPreview &&
      !leafDenKitPlacementPreview &&
      session.playerCharacter &&
      !gameplayOpeningCameraActive &&
      !cinematicActive &&
      !tutorialActive &&
      !skillLearnActive &&
      !scriptedInteractionActive ?
        getNearestRotatableWorkbenchPlacement() :
        null;
    const workbenchRotationPrompt = selectedWorkbenchRotationTarget ?
      "X Confirm  LB/RB Rotate  B Cancel" :
      nearbyWorkbenchRotationTarget ?
        "Press X" :
        "";
    const promptCopy =
      gameplayOpeningCameraActive ||
      cinematicActive ||
      tutorialActive ||
      skillLearnActive ||
      scriptedInteractionActive ?
      "" :
      solarStationPlacementPrompt ||
      leafDenKitPlacementPrompt ||
      workbenchRotationPrompt ||
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
    const solarStationPlacementGroundCell =
      solarStationPlacementPreview?.snappedPosition ?
        {
          id: "solar-station-placement-preview",
          offset: solarStationPlacementPreview.snappedPosition,
          surfaceY: solarStationPlacementPreview.snappedPosition[1],
          tileSpan: Math.max(
            SOLAR_STATION_PLACEMENT_PREVIEW_FOOTPRINT[0],
            SOLAR_STATION_PLACEMENT_PREVIEW_FOOTPRINT[1]
          ),
          highlightTargetState: solarStationPlacementPreview.valid ? "valid" : "invalid"
        } :
        null;
    const leafDenKitPlacementGroundCell =
      leafDenKitPlacementPreview?.snappedPosition ?
        {
          id: "leaf-den-kit-placement-preview",
          offset: leafDenKitPlacementPreview.snappedPosition,
          surfaceY: leafDenKitPlacementPreview.snappedPosition[1],
          tileSpan: Math.max(
            leafDenKitPlacementPreview.effectiveSize?.[0] ||
              leafDenKitPlacementPreview.size?.[0] ||
              LEAF_DEN_KIT_PLACEMENT_PREVIEW_FOOTPRINT[0],
            leafDenKitPlacementPreview.effectiveSize?.[1] ||
              leafDenKitPlacementPreview.size?.[1] ||
              LEAF_DEN_KIT_PLACEMENT_PREVIEW_FOOTPRINT[1]
          ),
          highlightTargetState: leafDenKitPlacementPreview.valid ? "valid" : "invalid"
        } :
        null;
    const workbenchRotationGroundCell = selectedWorkbenchRotationTarget ?
      getWorkbenchRotationGroundCell(selectedWorkbenchRotationTarget) :
      null;
    const groundActionFeedbackFrame = getGroundActionFeedback(now);

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
    syncCampfireTrainHouseModelInstance(now * 0.001, deltaTime);
    if (isLeafDenConstructionActive()) {
      controls.completeLeafDenConstructionIfReady?.({ playDialogue: false });
    }
    syncLeafDenConstructionClouds(now * 0.001);
    syncConstructionCloudBurstEffects(now * 0.001);
    syncLeafDenModelInstance(deltaTime);
    syncPlayerHouseModelInstances(deltaTime);
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
      false;
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
    const shouldShowChopperBulbasaurRepairBoxSpeech =
      !shouldShowTangrowthSpeech &&
      !shouldShowTangrowthLogChairSpeech &&
      !shouldShowTangrowthCampfireSpeech &&
      !shouldShowTangrowthPokemonCenterSpeech &&
      !shouldShowTangrowthHouseSpeech &&
      !shouldShowTangrowthCelebrationSpeech &&
      canShowWorldSpaceUi &&
      session.playerCharacter &&
      chopperBulbasaurRepairBoxInvestigationTarget &&
      tangrowthPosition &&
      !isPlayerNearWorldPosition(
        chopperBulbasaurRepairBoxInvestigationTarget.lookAtPosition,
        REPAIR_BOX_PROMPT_DISTANCE
      );
    const shouldShowBulbasaurMissionSpeech =
      !shouldShowTangrowthSpeech &&
      !shouldShowTangrowthLogChairSpeech &&
      !shouldShowTangrowthCampfireSpeech &&
      !shouldShowTangrowthPokemonCenterSpeech &&
      !shouldShowTangrowthHouseSpeech &&
      !shouldShowTangrowthCelebrationSpeech &&
      !shouldShowChopperBulbasaurRepairBoxSpeech &&
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
      !shouldShowChopperBulbasaurRepairBoxSpeech &&
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
      !shouldShowChopperBulbasaurRepairBoxSpeech &&
      !shouldShowBulbasaurMissionSpeech &&
      !shouldShowBulbasaurWorkbenchGuideSpeech &&
      canShowWorldSpaceUi &&
      Boolean(session.bulbasaurEncounter?.visible) &&
      Boolean(session.bulbasaurEncounter?.position) &&
      controls.storyState.flags.bulbasaurRevealed &&
      controls.storyState.flags.bulbasaurDryGrassMissionAccepted &&
      !controls.storyState.flags.bulbasaurDryGrassRequestTurnedIn &&
      !firstTaughtActionFreedomWindow.active &&
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
      !shouldShowChopperBulbasaurRepairBoxSpeech &&
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
      !shouldShowChopperBulbasaurRepairBoxSpeech &&
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
      !shouldShowChopperBulbasaurRepairBoxSpeech &&
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
      !shouldShowChopperBulbasaurRepairBoxSpeech &&
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
    const shouldShowLeafageFirstUsePrompt =
      canShowWorldSpaceUi &&
      session.playerCharacter &&
      controls.playerSkills?.leafage &&
      !controls.storyState.flags.leafageTallGrassCount &&
      !controls.storyState.flags.leafageTallGrassHabitatCreated &&
      !controls.isPrimaryActionActive?.();
    const squirtleChargingPosition = getSquirtleWorldPosition();
    const shouldShowSquirtleChargingPrompt =
      canShowWorldSpaceUi &&
      isSquirtleWaterCharging() &&
      Array.isArray(squirtleChargingPosition);
    const shouldShowInvalidLeafageUsePrompt =
      canShowWorldSpaceUi &&
      session.playerCharacter &&
      leafageInvalidTargetPromptUntil > now;
    const shouldShowInvalidFireUsePrompt =
      canShowWorldSpaceUi &&
      session.playerCharacter &&
      fireInvalidTargetPromptUntil > now;
    const fieldMoveSwitchPrompt = controls.getFieldMoveSwitchPrompt?.(now) || null;
    const shouldShowFieldMoveSwitchPrompt =
      canShowWorldSpaceUi &&
      session.playerCharacter &&
      Boolean(fieldMoveSwitchPrompt?.html);
    const shouldShowSolarStationPlacementPrompt =
      canShowWorldSpaceUi &&
      Boolean(solarStationPlacementPreview?.snappedPosition);
    const shouldShowLeafDenKitPlacementPrompt =
      canShowWorldSpaceUi &&
      Boolean(leafDenKitPlacementPreview?.snappedPosition);
    const shouldShowWorkbenchRotationPrompt =
      canShowWorldSpaceUi &&
      session.playerCharacter &&
      Boolean(workbenchRotationPrompt);
    const shouldShowTransientWorldPrompt =
      canShowWorldSpaceUi &&
      session.playerCharacter &&
      transientNoticeRoute.worldPromptMessage;
    const shouldShowPlayerCounterPrompt =
      canShowWorldSpaceUi &&
      session.playerCharacter &&
      Boolean(playerCounterPromptText);

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

    if (shouldShowChopperBulbasaurRepairBoxSpeech) {
      nextFrame.worldSpeech.visible = true;
      nextFrame.worldSpeech.text = CHOPPER_BULBASAUR_REPAIR_BOX_SPEECH;
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

    const companionLostHint =
      !nextFrame.worldSpeech.visible ?
        getPeriodicCompanionLostHint({
          activeQuest,
          activeMoveId,
          now
        }) :
        null;

    if (companionLostHint) {
      nextFrame.worldSpeech.visible = true;
      nextFrame.worldSpeech.text = companionLostHint.text;
      nextFrame.worldSpeech.worldPosition = companionLostHint.worldPosition;
    }

    if (shouldShowSolarStationPlacementPrompt) {
      nextFrame.worldPrompt.visible = true;
      nextFrame.worldPrompt.text = solarStationPlacementPreview.valid ?
        "X / Enter Place" :
        "Blocked";
      nextFrame.worldPrompt.worldPosition = solarStationPlacementPreview.snappedPosition;
    } else if (shouldShowLeafDenKitPlacementPrompt) {
      nextFrame.worldPrompt.visible = true;
      nextFrame.worldPrompt.text = leafDenKitPlacementPreview.valid ?
        "X / Enter Place" :
        leafDenKitPlacementPreview.invalidReason === "outside-solar-station-radius" ?
          "Needs power" :
          "Blocked";
      nextFrame.worldPrompt.worldPosition = leafDenKitPlacementPreview.snappedPosition;
    } else if (shouldShowWorkbenchRotationPrompt) {
      nextFrame.worldPrompt.visible = true;
      nextFrame.worldPrompt.text = workbenchRotationPrompt;
      nextFrame.worldPrompt.worldPosition = session.playerCharacter.getPosition();
    } else if (shouldShowPlayerCounterPrompt) {
      nextFrame.worldPrompt.visible = true;
      nextFrame.worldPrompt.text = playerCounterPromptText;
      nextFrame.worldPrompt.worldPosition = session.playerCharacter.getPosition();
    } else if (shouldShowFieldMoveSwitchPrompt) {
      nextFrame.worldPrompt.visible = true;
      nextFrame.worldPrompt.text = fieldMoveSwitchPrompt.html;
      nextFrame.worldPrompt.worldPosition = session.playerCharacter.getPosition();
    } else if (shouldShowSquirtleChargingPrompt) {
      nextFrame.worldPrompt.visible = true;
      nextFrame.worldPrompt.text = "charging";
      nextFrame.worldPrompt.worldPosition = squirtleChargingPosition;
    } else if (shouldShowInvalidLeafageUsePrompt) {
      nextFrame.worldPrompt.visible = true;
      nextFrame.worldPrompt.text = LEAFAGE_INVALID_TARGET_PROMPT_TEXT;
      nextFrame.worldPrompt.worldPosition = session.playerCharacter.getPosition();
    } else if (shouldShowInvalidFireUsePrompt) {
      nextFrame.worldPrompt.visible = true;
      nextFrame.worldPrompt.text = FIRE_INVALID_TARGET_PROMPT_TEXT;
      nextFrame.worldPrompt.worldPosition = session.playerCharacter.getPosition();
    } else if (shouldShowTransientWorldPrompt) {
      nextFrame.worldPrompt.visible = true;
      nextFrame.worldPrompt.text = transientNoticeRoute.worldPromptMessage;
      nextFrame.worldPrompt.worldPosition = session.playerCharacter.getPosition();
    } else if (shouldShowRepairBoxPrompt) {
      nextFrame.worldPrompt.visible = true;
      nextFrame.worldPrompt.text = nearbyRepairBoxPrompt.text;
      nextFrame.worldPrompt.worldPosition = nearbyRepairBoxPrompt.worldPosition;
    } else if (shouldShowLeafageFirstUsePrompt) {
      nextFrame.worldPrompt.visible = true;
      nextFrame.worldPrompt.text = leafageEquipped ? LEAFAGE_USE_PROMPT_TEXT : LEAFAGE_SWITCH_PROMPT_TEXT;
      nextFrame.worldPrompt.worldPosition = session.playerCharacter.getPosition();
    } else if (shouldShowWaterGunFirstUsePrompt) {
      nextFrame.worldPrompt.visible = true;
      nextFrame.worldPrompt.text = WATER_GUN_FIRST_USE_PROMPT_TEXT;
      nextFrame.worldPrompt.worldPosition = session.playerCharacter.getPosition();
    }

    if (solarStationPlacementGroundCell) {
      nextFrame.groundCellHighlight.visible = true;
      nextFrame.groundCellHighlight.groundCell = solarStationPlacementGroundCell;
    } else if (leafDenKitPlacementGroundCell) {
      nextFrame.groundCellHighlight.visible = true;
      nextFrame.groundCellHighlight.groundCell = leafDenKitPlacementGroundCell;
    } else if (workbenchRotationGroundCell) {
      nextFrame.groundCellHighlight.visible = true;
      nextFrame.groundCellHighlight.groundCell = workbenchRotationGroundCell;
    } else if (activeFireGroundCell) {
      nextFrame.groundCellHighlight.visible = true;
      nextFrame.groundCellHighlight.groundCell = activeFireGroundCell;
    } else if (shouldShowGroundCellHighlight) {
      nextFrame.groundCellHighlight.visible = true;
      nextFrame.groundCellHighlight.groundCell = {
        ...highlightedGroundCell,
        highlightTargetState: highlightedGroundCellTargetState,
        highlightAbilityId: highlightedGroundCellAbilityId
      };
    }

    if (markedActionGroundCells.length) {
      nextFrame.groundCellHighlight.visible = true;
      nextFrame.groundCellHighlight.markedGroundCells.push(...markedActionGroundCells);
      nextFrame.groundCellHighlight.pulsePhase = markedGroundCellPulsePhase;
    }

    if (groundActionFeedbackFrame) {
      nextFrame.groundCellHighlight.visible = true;
      nextFrame.groundCellHighlight.actionPulseGroundCell = {
        ...groundActionFeedbackFrame.groundCell,
        highlightAbilityId: groundActionFeedbackFrame.abilityId
      };
      nextFrame.groundCellHighlight.actionPulsePhase = groundActionFeedbackFrame.pulsePhase;
      nextFrame.groundCellHighlight.actionPulseAbilityId = groundActionFeedbackFrame.abilityId;
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
    if (Array.isArray(session.leafageGardenInstances)) {
      session.leafageGardenInstances.length = 0;
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
        groundGrassPatch.leafageObjectId !== "garden1" &&
        session.tallGrassModel &&
        Array.isArray(session.tallGrassInstances)
      );
      const leafageGardenModelAvailable = Boolean(
        groundGrassPatch.state === "alive" &&
        groundGrassPatch.leafageObjectId === "garden1" &&
        session.leafageGardenModel &&
        Array.isArray(session.leafageGardenInstances)
      );
      const deadGrassModelAvailable = Boolean(
        groundGrassPatch.state !== "alive" &&
        session.deadGrassModel &&
        Array.isArray(session.deadGrassInstances)
      );

      if (leafageGardenModelAvailable) {
        session.leafageGardenInstances.push({
          id: `leafage-garden-${groundGrassPatch.id}`,
          offset: [
            groundGrassPatch.position[0] + rustleOffset,
            groundGrassPatch.position[1],
            groundGrassPatch.position[2]
          ],
          scale: getTallGrassInstanceScale(
            session.leafageGardenModel,
            groundGrassPatch,
            grassRevivalScale
          ) * (session.leafageGardenModelScale || 1),
          alpha: grassAlpha,
          yaw: getTallGrassYaw(groundGrassPatch) + (session.leafageGardenModelFaceYawOffset || 0),
          swayStrength: 0
        });
      } else if (aliveGrassModelAvailable) {
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

    appendLandscapeCutEffectRenderables(nextFrame);

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
    nextFrame.render.woodDrops = session.woodDrops.filter((drop) => {
      return drop?.itemId !== LEAVES_ITEM_ID;
    });
    nextFrame.render.genericBillboards.push(
      ...getWoodCollectPopBillboards(session.woodTexture, rendering.fullUvRect)
    );
    nextFrame.render.genericBillboards.push(
      ...getLeafDropBillboards(
        session.woodDrops,
        session.leavesTexture,
        rendering.fullUvRect
      )
    );
    nextFrame.render.genericBillboards.push(
      ...getLeafResourceBillboards(
        session.resourceNodes,
        session.leavesTexture,
        rendering.fullUvRect,
        controls.storyState
      )
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
    nextFrame.render.genericBillboards.push(
      ...getSnowstormBillboards(
        session.snowstorm,
        session.snowflakeTexture,
        rendering.fullUvRect
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
    const workbenchInfoBillboard = createInteractionInfoBillboard(
      session.markerTextures?.workbench,
      WORKBENCH_POSITION,
      WORKBENCH_INFO_ICON_OFFSET,
      rendering.fullUvRect
    );
    if (workbenchInfoBillboard) {
      nextFrame.render.genericBillboards.push(workbenchInfoBillboard);
    }
    if (
      session.playerCharacter &&
      session.logChairTexture &&
      controls.storyState.flags.logChairReceived &&
      !controls.storyState.flags.logChairPlaced &&
      (controls.inventory?.[LOG_CHAIR_ITEM_ID] || 0) > 0
    ) {
      const logChairPreview = buildLogChairPlacement(session.playerCharacter.getPosition());
      nextFrame.render.genericBillboards.push({
        texture: session.logChairTexture,
        position: logChairPreview.position,
        size: logChairPreview.size,
        uvRect: rendering.fullUvRect,
        alpha: LOG_CHAIR_PLACEMENT_PREVIEW_ALPHA
      });
    }
    if (session.logChair && controls.storyState.flags.logChairPlaced) {
      nextFrame.render.genericBillboards.push(
        applyPlayerPlacementSpawnToBillboard(session.logChair, {
          texture: session.logChairTexture,
          position: session.logChair.position,
          size: session.logChair.size,
          uvRect: rendering.fullUvRect
        }, deltaTime)
      );
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
    if (
      session.campfire &&
      controls.storyState.flags.campfireSpatOut &&
      !session.campfireTrainHouseModelInstance
    ) {
      if (controls.storyState.flags.charmanderCampfireLit) {
        nextFrame.render.genericBillboards.push({
          texture: session.campfireTexture,
          position: session.campfire.position,
          size: session.campfire.size,
          uvRect: rendering.fullUvRect
        });
      } else {
        nextFrame.render.genericBillboards.push(
          ...getCampfireWoodPileBillboards(
            session.campfire,
            session.woodTexture,
            rendering.fullUvRect
          )
        );
      }
    }
    if (session.leafDen && controls.storyState.flags.leafDenKitPlaced) {
      const leafDenBuilt = Boolean(controls.storyState.flags.leafDenBuilt);
      const shouldRenderLeafDenBillboard = !leafDenBuilt || !session.leafDenModelInstance;

      if (shouldRenderLeafDenBillboard) {
        nextFrame.render.genericBillboards.push(
          applyPlayerPlacementSpawnToBillboard(session.leafDen, {
            texture: leafDenBuilt ?
              session.leafDenTexture :
              session.leafDenKitTexture,
            position: session.leafDen.position,
            size: leafDenBuilt ?
              [2.55, 1.85] :
              session.leafDen.size,
            uvRect: rendering.fullUvRect,
            rotation: Number(session.leafDen.yaw || 0)
          }, deltaTime)
        );
      }
      if (
        !leafDenBuilt &&
        session.leafDen?.interactionBox?.offset
      ) {
        const interactionBoxBillboard = createInteractionInfoBillboard(
          session.markerTextures?.[session.leafDen.interactionBox.markerKey] ||
            session.markerTextures?.workbench,
          session.leafDen.position,
          session.leafDen.interactionBox.offset,
          rendering.fullUvRect
        );
        if (interactionBoxBillboard) {
          nextFrame.render.genericBillboards.push(interactionBoxBillboard);
        }
      }
      nextFrame.render.genericBillboards.push(
        ...getLeafDenConstructionBillboards(rendering.fullUvRect, now * 0.001)
      );
    }
    nextFrame.render.genericBillboards.push(
      ...getConstructionCloudBurstBillboards(rendering.fullUvRect, now * 0.001)
    );
    if (session.dittoFlag && controls.storyState.flags.dittoFlagPlacedOnHouse) {
      nextFrame.render.genericBillboards.push(
        applyPlayerPlacementSpawnToBillboard(session.dittoFlag, {
          texture: session.dittoFlagTexture,
          position: session.dittoFlag.position,
          size: session.dittoFlag.size,
          uvRect: rendering.fullUvRect
        }, deltaTime)
      );
    }
    if (controls.storyState.flags.leafDenInteriorEntered) {
      nextFrame.render.genericBillboards.push(
        ...(session.leafDenFurniture || []).map((furniture) => (
          applyPlayerPlacementSpawnToBillboard(furniture, {
            texture: furniture.kind === "strawBed" ?
              session.strawBedTexture :
              furniture.kind === "campfire" ?
                session.campfireTexture :
                session.logChairTexture,
            position: furniture.position,
            size: furniture.size,
            uvRect: rendering.fullUvRect
          }, deltaTime)
        ))
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
      const pokemonCenterPcInfoBillboard = createInteractionInfoBillboard(
        session.markerTextures?.pokemonCenterPc,
        session.pokemonCenterPc.position,
        POKEMON_CENTER_PC_INFO_ICON_OFFSET,
        rendering.fullUvRect
      );
      if (pokemonCenterPcInfoBillboard) {
        nextFrame.render.genericBillboards.push(pokemonCenterPcInfoBillboard);
      }
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
    const squirtleWaterStamina = getSquirtleWaterStaminaState();
    const shouldShowSquirtleStamina =
      controls.playerSkills?.waterGun &&
      (
        activeMoveId === "waterGun" ||
        session.squirtleWaterGunAction ||
        isSquirtleWaterCharging() ||
        squirtleWaterStamina.current < squirtleWaterStamina.max
      );
    if (shouldShowSquirtleStamina) {
      nextFrame.render.genericBillboards.push(
        ...getSquirtleStaminaBillboards(
          session.squirtleWaterStaminaFillTexture,
          rendering.fullUvRect
        )
      );
    }
    const charmanderCarbonEnergy = getCharmanderCarbonEnergyState();
    const shouldShowCharmanderCarbon =
      controls.playerSkills?.fire &&
      (
        activeMoveId === "fire" ||
        session.charmanderFireAction ||
        charmanderCarbonEnergy.current < 1 ||
        charmanderCarbonEnergy.visualCurrent < 1
      );
    if (shouldShowCharmanderCarbon) {
      nextFrame.render.genericBillboards.push(
        ...getCharmanderCarbonBillboards({
          fillTexture: session.charmanderCarbonFillTexture,
          backTexture: session.squirtleWaterStaminaBackTexture,
          uvRect: rendering.fullUvRect
        })
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
      ...getCharmanderFireBillboards(
        session.charmanderFireAction,
        session.charmanderFireTexture || session.campfireTexture,
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
    nextFrame.render.genericBillboards.push(
      ...getBulbasaurInteractionRadiusGizmoBillboards(
        session.bulbasaurEncounter,
        session.natureRevivalSparkTexture,
        rendering.fullUvRect,
        now
      )
    );
    if (!session.charmanderEncounter?.modelInstance) {
      nextFrame.render.genericBillboards.push({
        texture: session.charmanderEncounter?.visible ? session.charmanderEncounter.texture : null,
        position: session.charmanderEncounter?.visible ? session.charmanderEncounter.position : null,
        size: session.charmanderEncounter?.visible ? session.charmanderEncounter.size : null,
        uvRect: rendering.fullUvRect
      });
    }
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
    appendTreeRevivalLeafBurstBillboards(nextFrame);
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
