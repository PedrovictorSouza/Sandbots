import {
  CARBON_ITEM_ID,
  LEAF_DEN_KIT_ITEM_ID,
  LEAVES_ITEM_ID,
  LEPPA_BERRY_ITEM_ID,
  LEPPA_TREE_DROP_OFFSET,
  POKEMON_TALK_INTERACT_DISTANCE,
  RESOURCE_NODE_DEFS,
  TANGROWTH_CAMPFIRE_ANCHOR_POSITION,
  WORLD_LIMIT
} from "../gameplayContent.js";
import {
  formatActiveMoveGuidanceByAbilityId,
  formatMoveTargetPromptByAbilityId
} from "../app/sandbox/moveData.js";
import { isFirstTaughtActionFreedomWindowActive } from "../app/story/earlyFreedomWindow.js";
import {
  SANDBOTS_BOT_NAMES,
  SANDBOTS_ITEM_NAMES
} from "../app/story/sandbotsLexicon.js";
import { normalizeSandbotsVisibleText } from "../app/story/sandbotsTerminologyNormalizer.js";
import { createSpatialHashIndex } from "./spatialHash.js";

const WOOD_DROP_HEIGHT = 0.78;
const WOOD_PICKUP_RADIUS = 0.64;
const WOOD_DROP_RESPAWN_DURATION = 28;
const LEAF_DROP_HEIGHT = 0.66;
const LEAF_PICKUP_RADIUS = 0.64;
const LEPPA_DROP_HEIGHT = 0.72;
const LEPPA_PICKUP_RADIUS = 0.68;
const LEPPA_TREE_INTERACT_DISTANCE = 4.2;
const LEPPA_TREE_WATERED_TILE_MIN_RADIUS_FACTOR = 0.35;
const LEPPA_TREE_WATERED_TILE_MAX_RADIUS_FACTOR = 1.65;
const LOG_CHAIR_INTERACT_DISTANCE = 2.35;
const LEAF_DEN_INTERACT_DISTANCE = 4.4;
const INSTANTIATED_OBJECT_INTERACT_DISTANCE = 2.2;
export const HELPER_BOT_TALK_INTERACT_DISTANCE = 8.2;
export const BULBASAUR_TALK_INTERACT_DISTANCE = HELPER_BOT_TALK_INTERACT_DISTANCE;
const INTERACTABLE_OBJECT_REACH_MIN = 2.55;
const PALM_SHAKE_DURATION = 0.42;
const BULBASAUR_DRY_GRASS_MISSION_RESTORE_COUNT = 10;
const BULBASAUR_STRAW_BED_TREE_TARGET_COUNT = 5;
const BULBASAUR_STRAW_BED_STICK_TARGET_COUNT = 10;
const TERRAIN_COLLIDER_INDEX_MIN_SIZE = 128;
const TERRAIN_COLLIDER_INDEX_CELL_SIZE = 8;
const DEAD_TREE_MODEL_FACE_YAW_OFFSET = 0;
const POKEMON_FOLLOW_FLAGS = Object.freeze({
  bulbasaur: "bulbasaurFollowing",
  charmander: "charmanderFollowing",
  timburr: "timburrFollowing"
});
const ACTIVE_RUSTLING_PATCH_FLAG_BY_POKEMON = Object.freeze([
  ["rustlingGrassCellId", "bulbasaurRevealed"],
  ["charmanderRustlingGrassCellId", "charmanderRevealed"],
  ["timburrRustlingGrassCellId", "timburrRevealed"]
]);
const LEPPA_TREE_REVIVED_TINT = Object.freeze([1.82, 1.72, 1.24]);
const LEPPA_TREE_REVIVED_TINT_STRENGTH = 0.76;
const terrainColliderIndexCache = new WeakMap();

export function normalizeWorldPromptCopy(value) {
  return normalizeSandbotsVisibleText(value);
}

export function createFacingStaticController(facing) {
  return {
    getIntent() {
      return {
        movement: [0, 0, 0],
        moving: false,
        facing
      };
    }
  };
}

export function createResourceNodes() {
  return RESOURCE_NODE_DEFS.map((node) => ({
    ...node,
    cooldown: 0
  }));
}

function overlapsHouse(houseModel, treeModel, instance) {
  const houseHalfX = houseModel.size[0] * 0.5 + 0.7;
  const houseHalfZ = houseModel.size[2] * 0.5 + 0.7;
  const treeHalfX = treeModel.size[0] * instance.scale * 0.5;
  const treeHalfZ = treeModel.size[2] * instance.scale * 0.5;

  return (
    Math.abs(instance.offset[0]) < houseHalfX + treeHalfX &&
    Math.abs(instance.offset[2]) < houseHalfZ + treeHalfZ
  );
}

export function treeFootprint(treeModel, instance) {
  return Math.max(treeModel.size[0], treeModel.size[2]) * instance.scale;
}

function isInsideColliderFootprint(x, z, collider) {
  const halfX = (collider.size?.[0] || 0) * 0.5;
  const halfZ = (collider.size?.[2] || 0) * 0.5;
  const padding = collider.padding ?? 0.42;
  return (
    Math.abs(x - collider.position[0]) < halfX + padding &&
    Math.abs(z - collider.position[2]) < halfZ + padding
  );
}

function getTerrainColliderBounds(collider) {
  const halfX = (collider.size?.[0] || 0) * 0.5 + (collider.padding ?? 0.42);
  const halfZ = (collider.size?.[2] || 0) * 0.5 + (collider.padding ?? 0.42);

  return {
    minX: collider.position[0] - halfX,
    maxX: collider.position[0] + halfX,
    minZ: collider.position[2] - halfZ,
    maxZ: collider.position[2] + halfZ
  };
}

function getTerrainColliderCandidates(position, colliders) {
  if (!Array.isArray(colliders) || colliders.length < TERRAIN_COLLIDER_INDEX_MIN_SIZE) {
    return colliders || [];
  }

  const cached = terrainColliderIndexCache.get(colliders);
  let index = cached?.length === colliders.length ? cached.index : null;

  if (!index) {
    index = createSpatialHashIndex(colliders, {
      cellSize: TERRAIN_COLLIDER_INDEX_CELL_SIZE,
      getBounds: getTerrainColliderBounds
    });
    terrainColliderIndexCache.set(colliders, {
      length: colliders.length,
      index
    });
  }

  return index.queryPoint(position);
}

function overlapsTreeSpacing(treeModel, placed, candidate) {
  const placedFootprint = treeFootprint(treeModel, placed);
  const candidateFootprint = treeFootprint(treeModel, candidate);
  const minimumGap = Math.max(placedFootprint, candidateFootprint);
  const minimumCenterDistance =
    placedFootprint * 0.5 +
    candidateFootprint * 0.5 +
    minimumGap;

  const deltaX = placed.offset[0] - candidate.offset[0];
  const deltaZ = placed.offset[2] - candidate.offset[2];
  return Math.hypot(deltaX, deltaZ) < minimumCenterDistance;
}

function createTreeVisualInstance(instance, { active, swayStrength, yawOffset = 0 }) {
  return {
    ...instance,
    yaw: (instance.yaw || 0) + yawOffset,
    active,
    swayStrength
  };
}

export function syncPalmTreeVisualState(instance) {
  if (!instance) {
    return instance;
  }

  const alive = Boolean(instance.alive);
  const active = instance.active !== false;

  if (instance.deadInstance) {
    instance.deadInstance.active = active && !alive;
    instance.deadInstance.swayStrength = instance.swayStrength || 0;
  }

  if (instance.aliveInstance) {
    instance.aliveInstance.active = active && alive;
    instance.aliveInstance.swayStrength = instance.swayStrength || 0;
  }

  return instance;
}

export function buildPalmInstances(houseModel, treeModel, candidates) {
  const placed = [];

  for (const candidate of candidates) {
    if (overlapsHouse(houseModel, treeModel, candidate)) {
      continue;
    }

    if (placed.some((instance) => overlapsTreeSpacing(treeModel, instance, candidate))) {
      continue;
    }

    placed.push(candidate);
  }

  return placed.map((instance, index) => {
    const palmInstance = {
      ...instance,
      id: `palm-${index}`,
      active: true,
      alive: false,
      hitCount: 0,
      shakeTimer: 0,
      shakeDuration: PALM_SHAKE_DURATION,
      swayStrength: 0
    };

    palmInstance.deadInstance = createTreeVisualInstance(palmInstance, {
      active: true,
      swayStrength: 0,
      yawOffset: DEAD_TREE_MODEL_FACE_YAW_OFFSET
    });
    palmInstance.aliveInstance = createTreeVisualInstance(palmInstance, {
      active: false,
      swayStrength: 0
    });

    return syncPalmTreeVisualState(palmInstance);
  });
}

export function findNearbyPalm(playerPosition, treeModel, palmInstances) {
  if (!treeModel || !Array.isArray(palmInstances)) {
    return null;
  }

  let nearestPalm = null;
  let nearestDistance = Infinity;

  for (const instance of palmInstances) {
    if (instance.active === false) {
      continue;
    }

    const dx = playerPosition[0] - instance.offset[0];
    const dz = playerPosition[2] - instance.offset[2];
    const distance = Math.hypot(dx, dz);
    const interactDistance = treeFootprint(treeModel, instance) * 0.5 + 1.15;

    if (distance <= interactDistance && distance < nearestDistance) {
      nearestPalm = instance;
      nearestDistance = distance;
    }
  }

  return nearestPalm;
}

export function updateBulbasaurStrawBedChallengeCompletion(storyState) {
  const flags = storyState?.flags;

  if (
    !flags?.bulbasaurStrawBedChallengeAvailable ||
    flags.strawBedRecipeUnlocked
  ) {
    return false;
  }

  const complete =
    (flags.wateredTreeCount || 0) >= BULBASAUR_STRAW_BED_TREE_TARGET_COUNT &&
    (flags.sturdySticksGatheredForChallenge || 0) >= BULBASAUR_STRAW_BED_STICK_TARGET_COUNT;

  if (!complete || flags.bulbasaurStrawBedChallengeComplete) {
    return false;
  }

  flags.bulbasaurStrawBedChallengeComplete = true;
  return true;
}

function buildLeafDrops(treeModel, palmInstance) {
  const dropRadius = treeFootprint(treeModel, palmInstance) * 0.34 + 0.36;
  const localOffsets = [
    [0.08, -0.78]
  ];
  const sine = Math.sin(palmInstance.yaw || 0);
  const cosine = Math.cos(palmInstance.yaw || 0);

  return localOffsets.map(([localX, localZ], index) => {
    const offsetX = localX * dropRadius;
    const offsetZ = localZ * dropRadius;
    const rotatedX = offsetX * cosine - offsetZ * sine;
    const rotatedZ = offsetX * sine + offsetZ * cosine;

    return {
      id: `leaf-${palmInstance.id || "tree"}-${index + 1}`,
      itemId: LEAVES_ITEM_ID,
      position: [
        palmInstance.offset[0] + rotatedX,
        0.03,
        palmInstance.offset[2] + rotatedZ
      ],
      size: [LEAF_DROP_HEIGHT, LEAF_DROP_HEIGHT],
      uvRect: [0, 0, 1, 1],
      pickupRadius: LEAF_PICKUP_RADIUS,
      collected: false
    };
  });
}

export function waterNearbyPalm(playerPosition, treeModel, palmInstances, storyState, fieldDrops = null) {
  const nearestPalm = findNearbyPalm(playerPosition, treeModel, palmInstances);

  if (!nearestPalm) {
    return {
      hit: false,
      counted: false,
      challengeComplete: false,
      palm: null
    };
  }

  nearestPalm.shakeTimer = nearestPalm.shakeDuration || PALM_SHAKE_DURATION;
  const revived = !nearestPalm.alive;
  nearestPalm.alive = true;
  syncPalmTreeVisualState(nearestPalm);

  let leafDrops = [];
  if (revived && Array.isArray(fieldDrops) && !nearestPalm.leafDropsSpawned) {
    leafDrops = buildLeafDrops(treeModel, nearestPalm);
    fieldDrops.push(...leafDrops);
    nearestPalm.leafDropsSpawned = true;
  }

  const challengeActive = Boolean(
    storyState?.flags?.bulbasaurStrawBedChallengeAvailable &&
    !storyState.flags.strawBedRecipeUnlocked
  );

  if (!challengeActive) {
    return {
      hit: true,
      counted: false,
      challengeComplete: false,
      palm: nearestPalm,
      revived,
      leafDrops
    };
  }

  if (nearestPalm.wateredForBulbasaurChallenge) {
    return {
      hit: true,
      counted: false,
      challengeComplete: false,
      palm: nearestPalm,
      revived,
      leafDrops
    };
  }

  nearestPalm.wateredForBulbasaurChallenge = true;
  storyState.flags.wateredTreeCount = Math.min(
    BULBASAUR_STRAW_BED_TREE_TARGET_COUNT,
    (storyState.flags.wateredTreeCount || 0) + 1
  );

  return {
    hit: true,
    counted: true,
    challengeComplete: updateBulbasaurStrawBedChallengeCompletion(storyState),
    palm: nearestPalm,
    revived,
    leafDrops
  };
}

function buildWoodDrops(treeModel, palmInstance, nextWoodDropId) {
  const dropRadius = treeFootprint(treeModel, palmInstance) * 0.36 + 0.42;
  const localOffsets = [
    [1, 0],
    [-0.5, 0.86],
    [-0.5, -0.86]
  ];
  const sine = Math.sin(palmInstance.yaw);
  const cosine = Math.cos(palmInstance.yaw);
  const drops = [];
  let currentId = nextWoodDropId;

  for (const [localX, localZ] of localOffsets) {
    const offsetX = localX * dropRadius;
    const offsetZ = localZ * dropRadius;
    const rotatedX = offsetX * cosine - offsetZ * sine;
    const rotatedZ = offsetX * sine + offsetZ * cosine;

    drops.push({
      id: `wood-${currentId++}`,
      position: [
        palmInstance.offset[0] + rotatedX,
        0.02,
        palmInstance.offset[2] + rotatedZ
      ],
      size: [WOOD_DROP_HEIGHT, WOOD_DROP_HEIGHT],
      uvRect: [0, 0, 1, 1],
      pickupRadius: WOOD_PICKUP_RADIUS,
      collected: false
    });
  }

  return {
    drops,
    nextWoodDropId: currentId
  };
}

export function strikeNearbyPalm(
  playerPosition,
  treeModel,
  palmInstances,
  woodDrops,
  nextWoodDropId
) {
  const nearestPalm = findNearbyPalm(playerPosition, treeModel, palmInstances);

  if (!nearestPalm) {
    return {
      hit: false,
      felled: false,
      palm: null,
      nextWoodDropId
    };
  }

  nearestPalm.shakeTimer = nearestPalm.shakeDuration;
  nearestPalm.hitCount += 1;

  if (nearestPalm.hitCount < 5) {
    return {
      hit: true,
      felled: false,
      palm: nearestPalm,
      nextWoodDropId
    };
  }

  nearestPalm.active = false;
  nearestPalm.swayStrength = 0;
  nearestPalm.shakeTimer = 0;
  syncPalmTreeVisualState(nearestPalm);

  const dropBatch = buildWoodDrops(treeModel, nearestPalm, nextWoodDropId);
  woodDrops.push(...dropBatch.drops);

  return {
    hit: true,
    felled: true,
    palm: nearestPalm,
    nextWoodDropId: dropBatch.nextWoodDropId
  };
}

export function updatePalmShake(deltaTime, palmInstances) {
  for (const instance of palmInstances) {
    if (instance.active === false || instance.shakeTimer <= 0) {
      instance.shakeTimer = 0;
      instance.swayStrength = 0;
      syncPalmTreeVisualState(instance);
      continue;
    }

    instance.shakeTimer = Math.max(0, instance.shakeTimer - deltaTime);
    const progress = 1 - instance.shakeTimer / instance.shakeDuration;
    const envelope = instance.shakeTimer / instance.shakeDuration;
    instance.swayStrength = Math.sin(progress * Math.PI * 5.5) * 0.22 * envelope;
    syncPalmTreeVisualState(instance);
  }
}

export function collectWoodDrops(playerPosition, woodDrops, inventory) {
  let collectedThisFrame = 0;

  for (const woodDrop of woodDrops) {
    if (woodDrop.collected || woodDrop.itemId === LEAVES_ITEM_ID) {
      continue;
    }

    const dx = playerPosition[0] - woodDrop.position[0];
    const dz = playerPosition[2] - woodDrop.position[2];
    if (Math.hypot(dx, dz) > woodDrop.pickupRadius) {
      continue;
    }

    woodDrop.collected = true;
    woodDrop.respawnDuration = Number(woodDrop.respawnDuration || WOOD_DROP_RESPAWN_DURATION);
    woodDrop.cooldown = woodDrop.respawnDuration;
    inventory.wood += 1;
    collectedThisFrame += 1;
  }

  return collectedThisFrame;
}

export function collectLeafDrops(playerPosition, fieldDrops, inventory) {
  let collectedThisFrame = 0;

  for (const drop of fieldDrops) {
    if (drop.collected || drop.itemId !== LEAVES_ITEM_ID) {
      continue;
    }

    const dx = playerPosition[0] - drop.position[0];
    const dz = playerPosition[2] - drop.position[2];
    if (Math.hypot(dx, dz) > drop.pickupRadius) {
      continue;
    }

    drop.collected = true;
    inventory[LEAVES_ITEM_ID] = (inventory[LEAVES_ITEM_ID] || 0) + 1;
    collectedThisFrame += 1;
  }

  return collectedThisFrame;
}

function collectResourceNodesByItemId(
  playerPosition,
  resourceNodes,
  storyState,
  inventory,
  itemId,
  fallbackPickupRadius = LEAF_PICKUP_RADIUS
) {
  let collectedThisFrame = 0;

  for (const resourceNode of resourceNodes || []) {
    if (
      resourceNode.itemId !== itemId ||
      !isResourceNodeActive(resourceNode, storyState)
    ) {
      continue;
    }

    const dx = playerPosition[0] - resourceNode.position[0];
    const dz = playerPosition[2] - resourceNode.position[2];
    const pickupRadius = resourceNode.pickupRadius || resourceNode.interactDistance || fallbackPickupRadius;

    if (Math.hypot(dx, dz) > pickupRadius) {
      continue;
    }

    const collectedAmount = Math.max(1, resourceNode.yield || 1);
    inventory[itemId] = (inventory[itemId] || 0) + collectedAmount;
    resourceNode.cooldown = resourceNode.respawnDuration || 0;
    resourceNode.active = false;
    collectedThisFrame += collectedAmount;
  }

  return collectedThisFrame;
}

export function collectLeafResourceNodes(playerPosition, resourceNodes, storyState, inventory) {
  return collectResourceNodesByItemId(
    playerPosition,
    resourceNodes,
    storyState,
    inventory,
    LEAVES_ITEM_ID
  );
}

export function collectCarbonResourceNodes(playerPosition, resourceNodes, storyState, inventory) {
  return collectResourceNodesByItemId(
    playerPosition,
    resourceNodes,
    storyState,
    inventory,
    CARBON_ITEM_ID
  );
}

function isLeppaTreeRequestActive(storyState) {
  return Boolean(
    storyState?.flags?.squirtleLeppaRequestAvailable &&
    !storyState?.flags?.leppaBerryGiftComplete
  );
}

export function syncLeppaTreeState(leppaTree, storyState) {
  if (!leppaTree) {
    return null;
  }

  const requestActive = isLeppaTreeRequestActive(storyState);
  const revived = Boolean(storyState?.flags?.leppaTreeRevived || leppaTree.revived);
  leppaTree.revived = revived;

  if (leppaTree.deadInstance) {
    leppaTree.deadInstance.active = requestActive || revived;
    leppaTree.deadInstance.tint = revived ? LEPPA_TREE_REVIVED_TINT : null;
    leppaTree.deadInstance.tintStrength = revived ? LEPPA_TREE_REVIVED_TINT_STRENGTH : 0;
  }

  if (leppaTree.aliveInstance) {
    leppaTree.aliveInstance.active = false;
  }

  return leppaTree;
}

export function findNearbyLeppaTree(playerPosition, leppaTree, storyState) {
  if (!leppaTree?.position) {
    return null;
  }

  const distance = Math.hypot(
    playerPosition[0] - leppaTree.position[0],
    playerPosition[2] - leppaTree.position[2]
  );

  if (distance > LEPPA_TREE_INTERACT_DISTANCE) {
    return null;
  }

  const revived = Boolean(storyState?.flags?.leppaTreeRevived || leppaTree.revived);
  const berryDropped = Boolean(storyState?.flags?.leppaBerryDropped || leppaTree.berryDropped);
  const requestActive = isLeppaTreeRequestActive(storyState);

  if (!revived) {
    return null;
  }

  if (requestActive && !berryDropped) {
    return {
      leppaTree,
      action: "headbutt",
      distance
    };
  }

  if (
    berryDropped ||
    storyState?.flags?.leppaBerryCollected ||
    storyState?.flags?.leppaBerryGiftComplete
  ) {
    return {
      leppaTree,
      action: "leafageOptions",
      distance
    };
  }

  return null;
}

export function reviveLeppaTree(leppaTree, storyState) {
  if (!leppaTree || !isLeppaTreeRequestActive(storyState)) {
    return false;
  }

  if (storyState?.flags?.leppaTreeRevived || leppaTree.revived) {
    return false;
  }

  leppaTree.revived = true;
  storyState.flags.leppaTreeRevived = true;
  syncLeppaTreeState(leppaTree, storyState);
  return true;
}

function getGroundCellOffset(groundCell) {
  return groundCell?.offset || groundCell?.position || null;
}

export function getLeppaTreeSurroundingGroundCells(leppaTree, groundCells = []) {
  if (!leppaTree?.position) {
    return [];
  }

  const surroundingGroundCells = [];
  const groundCellKeys = new Set();
  for (const groundCell of groundCells) {
    if (!groundCell || groundCell.active === false) {
      continue;
    }

    const offset = getGroundCellOffset(groundCell);
    if (!offset) {
      continue;
    }

    const tileSpan = Number(groundCell.tileSpan || 1.425);
    const dx = offset[0] - leppaTree.position[0];
    const dz = offset[2] - leppaTree.position[2];
    const distance = Math.hypot(dx, dz);
    const minDistance = tileSpan * LEPPA_TREE_WATERED_TILE_MIN_RADIUS_FACTOR;
    const maxDistance = tileSpan * LEPPA_TREE_WATERED_TILE_MAX_RADIUS_FACTOR;

    if (distance < minDistance || distance > maxDistance) {
      continue;
    }

    const groundCellKey = groundCell.id || `${offset[0].toFixed(2)}:${offset[2].toFixed(2)}`;
    if (groundCellKeys.has(groundCellKey)) {
      continue;
    }

    groundCellKeys.add(groundCellKey);
    surroundingGroundCells.push(groundCell);
  }

  return surroundingGroundCells;
}

export function hasWateredLeppaTreeSurroundings(leppaTree, groundPurifiedInstances = []) {
  return getLeppaTreeSurroundingGroundCells(leppaTree, groundPurifiedInstances).length >= 4;
}

export function reviveLeppaTreeFromWateredTiles(
  leppaTree,
  storyState,
  groundPurifiedInstances = []
) {
  if (!hasWateredLeppaTreeSurroundings(leppaTree, groundPurifiedInstances)) {
    return false;
  }

  return reviveLeppaTree(leppaTree, storyState);
}

export function dropLeppaBerryFromTree(leppaTree, leppaBerryDrops = [], storyState = null) {
  if (!leppaTree?.position || leppaTree.berryDropped) {
    return null;
  }

  const drop = {
    id: "leppa-berry-0",
    itemId: LEPPA_BERRY_ITEM_ID,
    position: [
      leppaTree.position[0] + LEPPA_TREE_DROP_OFFSET[0],
      leppaTree.position[1] + LEPPA_TREE_DROP_OFFSET[1],
      leppaTree.position[2] + LEPPA_TREE_DROP_OFFSET[2]
    ],
    size: [LEPPA_DROP_HEIGHT, LEPPA_DROP_HEIGHT],
    uvRect: [0, 0, 1, 1],
    pickupRadius: LEPPA_PICKUP_RADIUS,
    collected: false
  };

  leppaTree.berryDropped = true;
  leppaBerryDrops.push(drop);

  if (storyState?.flags) {
    storyState.flags.leppaBerryDropped = true;
  }

  return drop;
}

export function collectLeppaBerryDrops(playerPosition, leppaBerryDrops, inventory, storyState = null) {
  let collectedThisFrame = 0;

  for (const leppaBerryDrop of leppaBerryDrops) {
    if (leppaBerryDrop.collected) {
      continue;
    }

    const dx = playerPosition[0] - leppaBerryDrop.position[0];
    const dz = playerPosition[2] - leppaBerryDrop.position[2];
    if (Math.hypot(dx, dz) > leppaBerryDrop.pickupRadius) {
      continue;
    }

    leppaBerryDrop.collected = true;
    inventory[LEPPA_BERRY_ITEM_ID] = (inventory[LEPPA_BERRY_ITEM_ID] || 0) + 1;
    collectedThisFrame += 1;
  }

  if (collectedThisFrame > 0 && storyState?.flags) {
    storyState.flags.leppaBerryCollected = true;
  }

  return collectedThisFrame;
}

export function buildLogChairPlacement(playerPosition) {
  return {
    id: "log-chair-0",
    position: [
      playerPosition[0] + 0.92,
      0.02,
      playerPosition[2] + 0.42
    ],
    size: [1.18, 1.18],
    uvRect: [0, 0, 1, 1]
  };
}

export function buildStrawBedPlacement(anchorPosition) {
  return {
    id: "straw-bed-0",
    position: [
      anchorPosition[0],
      0.02,
      anchorPosition[2]
    ],
    size: [1.55, 1.02],
    uvRect: [0, 0, 1, 1]
  };
}

export function buildCampfirePlacement(anchorPosition = TANGROWTH_CAMPFIRE_ANCHOR_POSITION) {
  return {
    id: "campfire-0",
    position: [
      anchorPosition[0] + 0.92,
      0.02,
      anchorPosition[2] + 0.42
    ],
    size: [1.34, 1.18],
    uvRect: [0, 0, 1, 1]
  };
}

export function buildLeafDenKitPlacement(playerPosition) {
  return {
    id: "leaf-den-0",
    kind: "constructionSite",
    constructionSiteId: "leaf-den-0",
    buildingKitId: LEAF_DEN_KIT_ITEM_ID,
    constructionName: "House",
    constructionStatus: "incomplete",
    interactionBox: {
      id: "leaf-den-0-interaction-box",
      markerKey: "workbench",
      offset: [1.02, 1.18, -0.42]
    },
    position: [
      playerPosition[0] + 1.15,
      0.02,
      playerPosition[2] + 0.35
    ],
    size: [1.95, 1.45],
    uvRect: [0, 0, 1, 1]
  };
}

export function getPlacementFootprintRect(position, size = [1, 1]) {
  if (!Array.isArray(position) || position.length < 3) {
    return null;
  }

  const x = Number(position[0]);
  const z = Number(position[2]);
  const width = Math.max(0.01, Number(size?.[0]) || 1);
  const depth = Math.max(0.01, Number(size?.[1]) || 1);

  if (!Number.isFinite(x) || !Number.isFinite(z)) {
    return null;
  }

  return {
    minX: x - width * 0.5,
    maxX: x + width * 0.5,
    minZ: z - depth * 0.5,
    maxZ: z + depth * 0.5
  };
}

export function doPlacementFootprintsOverlap(a, b, gutter = 0.12) {
  if (!a || !b) {
    return false;
  }

  return !(
    a.maxX - gutter <= b.minX + gutter ||
    a.minX + gutter >= b.maxX - gutter ||
    a.maxZ - gutter <= b.minZ + gutter ||
    a.minZ + gutter >= b.maxZ - gutter
  );
}

export function validateBuildingKitPlacement({
  position,
  size = [1, 1],
  blockers = [],
  worldLimit = WORLD_LIMIT,
  gutter = 0.12
} = {}) {
  const rect = getPlacementFootprintRect(position, size);
  if (!rect) {
    return {
      valid: false,
      reason: "invalid-position"
    };
  }

  if (
    rect.minX < -worldLimit ||
    rect.maxX > worldLimit ||
    rect.minZ < -worldLimit ||
    rect.maxZ > worldLimit
  ) {
    return {
      valid: false,
      reason: "invalid-terrain"
    };
  }

  for (const blocker of blockers || []) {
    const blockerRect = getPlacementFootprintRect(blocker?.position, blocker?.size);
    if (doPlacementFootprintsOverlap(rect, blockerRect, gutter)) {
      return {
        valid: false,
        reason: "occupied-space",
        blocker
      };
    }
  }

  return {
    valid: true,
    reason: "valid"
  };
}

export function findNearbyLogChair(playerPosition, logChair, storyState) {
  if (
    !storyState?.flags?.logChairPlaced ||
    !logChair?.position
  ) {
    return null;
  }

  const distance = Math.hypot(
    playerPosition[0] - logChair.position[0],
    playerPosition[2] - logChair.position[2]
  );

  if (distance > LOG_CHAIR_INTERACT_DISTANCE) {
    return null;
  }

  return {
    logChair,
    distance
  };
}

export function findNearbyLeafDen(playerPosition, leafDen, storyState) {
  if (
    !storyState?.flags?.leafDenKitPlaced ||
    !leafDen?.position
  ) {
    return null;
  }

  const distance = Math.hypot(
    playerPosition[0] - leafDen.position[0],
    playerPosition[2] - leafDen.position[2]
  );

  if (distance > LEAF_DEN_INTERACT_DISTANCE) {
    return null;
  }

  return {
    leafDen,
    distance
  };
}

function isActiveRustlingPatch(groundGrassPatch, storyState) {
  return ACTIVE_RUSTLING_PATCH_FLAG_BY_POKEMON.some(([cellFlag, revealedFlag]) => {
    return (
      groundGrassPatch?.cellId &&
      storyState?.flags?.[cellFlag] === groundGrassPatch.cellId &&
      !storyState.flags[revealedFlag]
    );
  });
}

function isFlowerLandscapePatch(groundGrassPatch) {
  return (
    groundGrassPatch?.id?.startsWith?.("flower-") ||
    groundGrassPatch?.id?.startsWith?.("leafage-flower-") ||
    String(groundGrassPatch?.habitatGroupId || "").includes("flower")
  );
}

function isPlayerInstantiatedLandscapePatch(groundGrassPatch) {
  return (
    groundGrassPatch?.source === "leafage" ||
    groundGrassPatch?.id?.startsWith?.("leafage-")
  );
}

function canDestroyWorldNature(storyState) {
  return Boolean(
    storyState?.flags?.bulbasaurRevealed ||
    storyState?.flags?.bulbasaurFollowing
  );
}

function getInstantiatedObjectLabel(groundGrassPatch) {
  if (
    groundGrassPatch?.state === "alive" &&
    isFlowerLandscapePatch(groundGrassPatch)
  ) {
    return "Flower";
  }

  if (groundGrassPatch?.state !== "alive") {
    return "Dry Grass";
  }

  return groundGrassPatch?.leafageObjectId === "garden1" ? "Garden-1" : "Tall Grass";
}

function isDestroyableLandscapePatch(
  groundGrassPatch,
  storyState,
  { includeRestoredGrass = false } = {}
) {
  if (
    !groundGrassPatch ||
    !Array.isArray(groundGrassPatch.position) ||
    isActiveRustlingPatch(groundGrassPatch, storyState)
  ) {
    return false;
  }

  if (isPlayerInstantiatedLandscapePatch(groundGrassPatch)) {
    return true;
  }

  if (!canDestroyWorldNature(storyState)) {
    return false;
  }

  return (
    includeRestoredGrass ||
    groundGrassPatch.state !== "alive" ||
    isFlowerLandscapePatch(groundGrassPatch)
  );
}

export function findNearbyDestroyableInstantiatedObject(
  playerPosition,
  groundGrassPatches,
  storyState,
  groundFlowerPatches = [],
  { includeRestoredGrass = true } = {}
) {
  let nearest = null;
  let nearestPatch = null;
  let nearestDistance = Infinity;

  for (const groundGrassPatch of [
    ...(groundGrassPatches || []),
    ...(groundFlowerPatches || [])
  ]) {
    if (!isDestroyableLandscapePatch(groundGrassPatch, storyState, { includeRestoredGrass })) {
      continue;
    }

    const distance = Math.hypot(
      playerPosition[0] - groundGrassPatch.position[0],
      playerPosition[2] - groundGrassPatch.position[2]
    );
    const sizeReach = Math.max(
      Number(groundGrassPatch.size?.[0]) || 0,
      Number(groundGrassPatch.size?.[1]) || 0
    ) * 0.5;
    const interactDistance = INSTANTIATED_OBJECT_INTERACT_DISTANCE + sizeReach;

    const shouldPreferFlowerTie =
      Math.abs(distance - nearestDistance) <= 0.001 &&
      isFlowerLandscapePatch(groundGrassPatch) &&
      !isFlowerLandscapePatch(nearestPatch);

    if (distance <= interactDistance && (distance < nearestDistance || shouldPreferFlowerTie)) {
      nearest = {
        kind: "site",
        id: groundGrassPatch.id,
        label: getInstantiatedObjectLabel(groundGrassPatch),
        action: "destroyInstantiatedObject",
        cellId: groundGrassPatch.cellId
      };
      nearestPatch = groundGrassPatch;
      nearestDistance = distance;
    }
  }

  return nearest ? { target: nearest, distance: nearestDistance } : null;
}

export function isNpcActive(npcActor, storyState) {
  return npcActor.activeWhen(storyState);
}

export function isInteractableActive(interactable, storyState) {
  return interactable.activeWhen(storyState);
}

function getInteractableObjectReach(interactable) {
  return Math.max(
    Number(interactable?.interactDistance) || 0,
    INTERACTABLE_OBJECT_REACH_MIN
  );
}

export function isResourceNodeActive(resourceNode, storyState) {
  return resourceNode.cooldown <= 0 && resourceNode.activeWhen(storyState);
}

export function updateResourceNodes(deltaTime, resourceNodes) {
  for (const resourceNode of resourceNodes || []) {
    const currentCooldown = Number(resourceNode.cooldown || 0);

    if (currentCooldown <= 0) {
      resourceNode.cooldown = 0;
      if (resourceNode.collected && Number(resourceNode.respawnDuration || 0) > 0) {
        resourceNode.collected = false;
      }
      continue;
    }

    resourceNode.cooldown = Math.max(0, currentCooldown - deltaTime);
    if (resourceNode.cooldown <= 0 && resourceNode.collected) {
      resourceNode.collected = false;
    }
  }
}

export function findNearbyResourceNode(playerPosition, resourceNodes, storyState) {
  let nearest = null;
  let nearestDistance = Infinity;

  for (const resourceNode of resourceNodes) {
    if (!isResourceNodeActive(resourceNode, storyState)) {
      continue;
    }

    const dx = playerPosition[0] - resourceNode.position[0];
    const dz = playerPosition[2] - resourceNode.position[2];
    const distance = Math.hypot(dx, dz);

    if (distance <= resourceNode.interactDistance && distance < nearestDistance) {
      nearest = resourceNode;
      nearestDistance = distance;
    }
  }

  return nearest ? { resourceNode: nearest, distance: nearestDistance } : null;
}

export function findNearbyInteractable(
  playerPosition,
  npcActors,
  interactables,
  storyState,
  groundGrassPatches = [],
  logChair = null,
  leafDen = null,
  timburrEncounter = null,
  charmanderEncounter = null,
  leppaTree = null,
  bulbasaurEncounter = null,
  groundFlowerPatches = []
) {
  let nearest = null;
  let nearestDistance = Infinity;

  for (const npcActor of npcActors) {
    if (!isNpcActive(npcActor, storyState)) {
      continue;
    }

    const [x,, z] = npcActor.character.getPosition();
    const distance = Math.hypot(playerPosition[0] - x, playerPosition[2] - z);

    if (distance <= POKEMON_TALK_INTERACT_DISTANCE && distance < nearestDistance) {
      nearest = {
        kind: "npc",
        id: npcActor.id,
        label: npcActor.label
      };
      nearestDistance = distance;
    }
  }

  for (const interactable of interactables) {
    if (!isInteractableActive(interactable, storyState)) {
      continue;
    }

    const distance = Math.hypot(
      playerPosition[0] - interactable.position[0],
      playerPosition[2] - interactable.position[2]
    );

    const shouldPreferPokemonCenterInspection =
      interactable.id === "ruinedPokemonCenter" &&
      nearest?.kind === "npc" &&
      nearest.id === "tangrowth";

    if (
      distance <= getInteractableObjectReach(interactable) &&
      (distance < nearestDistance || shouldPreferPokemonCenterInspection)
    ) {
      nearest = {
        kind: interactable.type,
        id: interactable.id,
        label: interactable.label
      };
      nearestDistance = distance;
    }
  }

  const rustlingGrassCellId = storyState?.flags?.rustlingGrassCellId;
  const rustlingGrassActive =
    !storyState?.flags?.bulbasaurRevealed &&
    storyState?.flags?.chopperBulbasaurRepairBoxIntroComplete &&
    Boolean(rustlingGrassCellId);

  if (rustlingGrassActive) {
    const rustlingGrassPatch = groundGrassPatches.find((groundGrassPatch) => {
      return (
        groundGrassPatch.cellId === rustlingGrassCellId &&
        groundGrassPatch.state === "alive"
      );
    });

    if (rustlingGrassPatch) {
      const interactionPosition =
        bulbasaurEncounter?.repairBoxPosition ||
        bulbasaurEncounter?.repairPosition ||
        rustlingGrassPatch.position;
      const distance = Math.hypot(
        playerPosition[0] - interactionPosition[0],
        playerPosition[2] - interactionPosition[2]
      );

      if (distance <= BULBASAUR_TALK_INTERACT_DISTANCE && distance < nearestDistance) {
        nearest = {
          kind: "grassEncounter",
          id: "rustlingGrass",
          label: `Check on ${SANDBOTS_BOT_NAMES.grow}`,
          cellId: rustlingGrassPatch.cellId
        };
        nearestDistance = distance;
      }
    }
  }

  const bulbasaurGrassPatch = rustlingGrassCellId ?
    groundGrassPatches.find((groundGrassPatch) => {
      return (
        groundGrassPatch.cellId === rustlingGrassCellId &&
        groundGrassPatch.state === "alive"
      );
    }) :
    null;
  const bulbasaurEncounterPosition =
    bulbasaurEncounter?.visible && Array.isArray(bulbasaurEncounter.position) ?
      bulbasaurEncounter.position :
      null;
  const bulbasaurRepairBoxPosition =
    Array.isArray(bulbasaurEncounter?.repairBoxPosition) ?
      bulbasaurEncounter.repairBoxPosition :
      null;
  const bulbasaurInteractionPosition =
    bulbasaurEncounterPosition || bulbasaurGrassPatch?.position || null;
  const createBulbasaurTarget = (target) => {
    return bulbasaurEncounterPosition ?
      { ...target, position: [...bulbasaurEncounterPosition] } :
      target;
  };
  const setNearbyBulbasaurTarget = (target) => {
    if (!bulbasaurInteractionPosition) {
      return;
    }

    let distance = Math.hypot(
      playerPosition[0] - bulbasaurInteractionPosition[0],
      playerPosition[2] - bulbasaurInteractionPosition[2]
    );

    if (
      target.kind === "bulbasaurMission" &&
      bulbasaurRepairBoxPosition
    ) {
      distance = Math.min(
        distance,
        Math.hypot(
          playerPosition[0] - bulbasaurRepairBoxPosition[0],
          playerPosition[2] - bulbasaurRepairBoxPosition[2]
        )
      );
    }

    if (distance <= BULBASAUR_TALK_INTERACT_DISTANCE && distance < nearestDistance) {
      nearest = createBulbasaurTarget(target);
      nearestDistance = distance;
    }
  };

  const charmanderRustlingGrassCellId = storyState?.flags?.charmanderRustlingGrassCellId;
  const charmanderRustlingGrassActive =
    !storyState?.flags?.charmanderRevealed &&
    Boolean(charmanderRustlingGrassCellId);

  if (charmanderRustlingGrassActive) {
    const rustlingGrassPatch = groundGrassPatches.find((groundGrassPatch) => {
      return (
        groundGrassPatch.cellId === charmanderRustlingGrassCellId &&
        groundGrassPatch.state === "alive"
      );
    });

    if (rustlingGrassPatch) {
      const interactionPosition = charmanderEncounter?.repairPosition || rustlingGrassPatch.position;
      const distance = Math.hypot(
        playerPosition[0] - interactionPosition[0],
        playerPosition[2] - interactionPosition[2]
      );

      if (distance <= POKEMON_TALK_INTERACT_DISTANCE && distance < nearestDistance) {
        nearest = {
          kind: "charmanderGrassEncounter",
          id: "charmanderRustlingGrass",
          label: `Help ${SANDBOTS_BOT_NAMES.thermal}`,
          cellId: rustlingGrassPatch.cellId
        };
        nearestDistance = distance;
      }
    }
  }

  const timburrRustlingGrassCellId = storyState?.flags?.timburrRustlingGrassCellId;
  const timburrRustlingGrassActive =
    !storyState?.flags?.timburrRevealed &&
    Boolean(timburrRustlingGrassCellId);

  if (timburrRustlingGrassActive) {
    const rustlingGrassPatch = groundGrassPatches.find((groundGrassPatch) => {
      return (
        groundGrassPatch.cellId === timburrRustlingGrassCellId &&
        groundGrassPatch.state === "alive"
      );
    });

    if (rustlingGrassPatch) {
      const interactionPosition = timburrEncounter?.repairPosition || rustlingGrassPatch.position;
      const distance = Math.hypot(
        playerPosition[0] - interactionPosition[0],
        playerPosition[2] - interactionPosition[2]
      );

      if (distance <= POKEMON_TALK_INTERACT_DISTANCE && distance < nearestDistance) {
        nearest = {
          kind: "timburrGrassEncounter",
          id: "timburrRustlingGrass",
          label: `Help ${SANDBOTS_BOT_NAMES.builder}`,
          cellId: rustlingGrassPatch.cellId
        };
        nearestDistance = distance;
      }
    }
  }

  const bulbasaurMissionActive =
    storyState?.flags?.bulbasaurRevealed &&
    !(
      storyState?.flags?.squirtleLeppaRequestAvailable &&
      !storyState?.flags?.leppaTreeRevived
    ) &&
    !storyState?.flags?.bulbasaurDryGrassMissionAccepted &&
    Boolean(rustlingGrassCellId);
  const bulbasaurRequestReady =
    storyState?.flags?.bulbasaurRevealed &&
    storyState?.flags?.bulbasaurDryGrassMissionAccepted &&
    !storyState?.flags?.bulbasaurDryGrassRequestTurnedIn &&
    !isFirstTaughtActionFreedomWindowActive(storyState) &&
    (
      storyState?.flags?.bulbasaurDryGrassMissionComplete ||
      (storyState?.flags?.restoredGrassCount || 0) >= BULBASAUR_DRY_GRASS_MISSION_RESTORE_COUNT
    ) &&
    Boolean(rustlingGrassCellId);

  if (bulbasaurMissionActive || bulbasaurRequestReady) {
    setNearbyBulbasaurTarget({
      kind: bulbasaurRequestReady ? "bulbasaurRequestComplete" : "bulbasaurMission",
      id: bulbasaurRequestReady ? "bulbasaurLeafageReward" : "bulbasaurDryGrassMission",
      label: `Talk to ${SANDBOTS_BOT_NAMES.grow}`,
      cellId: rustlingGrassCellId
    });
  }

  const leppaGiftReady =
    storyState?.flags?.squirtleLeppaRequestAvailable &&
    storyState?.flags?.bulbasaurDryGrassRequestTurnedIn &&
    storyState?.flags?.leppaBerryCollected &&
    !storyState?.flags?.leppaBerryGiftComplete &&
    storyState?.flags?.bulbasaurRevealed &&
    Boolean(rustlingGrassCellId);

  if (leppaGiftReady) {
    setNearbyBulbasaurTarget({
      kind: "leppaBerryGift",
      id: "bulbasaur",
      label: "Look at this!",
      cellId: rustlingGrassCellId
    });
  }

  const nearbyLeppaTree = findNearbyLeppaTree(playerPosition, leppaTree, storyState);
  if (
    nearbyLeppaTree?.action === "headbutt" &&
    nearbyLeppaTree.distance < nearestDistance
  ) {
    nearest = {
      kind: "leppaBerryTree",
      id: "leppaTree",
      label: "Pick Pulse Berry"
    };
    nearestDistance = nearbyLeppaTree.distance;
  }

  if (
    nearbyLeppaTree?.action === "leafageOptions" &&
    nearbyLeppaTree.distance < nearestDistance
  ) {
    nearest = {
      kind: "leppaTreeLeafageOptions",
      id: "leppaTree",
      label: `${SANDBOTS_ITEM_NAMES.growTool} Options`
    };
    nearestDistance = nearbyLeppaTree.distance;
  }

  const bulbasaurStrawBedRecipeReady =
    storyState?.flags?.bulbasaurRevealed &&
    storyState?.flags?.bulbasaurStrawBedChallengeComplete &&
    !storyState?.flags?.strawBedRecipeUnlocked &&
    Boolean(rustlingGrassCellId);

  if (bulbasaurStrawBedRecipeReady) {
    setNearbyBulbasaurTarget({
      kind: "bulbasaurStrawBedRecipe",
      id: "bulbasaurStrawBedRecipe",
      label: "Do you need anything?",
      cellId: rustlingGrassCellId
    });
  }

  const bulbasaurStrawBedCompleteReady =
    storyState?.flags?.bulbasaurRevealed &&
    storyState?.flags?.strawBedPlacedInBulbasaurHabitat &&
    !storyState?.flags?.bulbasaurStrawBedRequestComplete &&
    Boolean(rustlingGrassCellId);

  if (bulbasaurStrawBedCompleteReady) {
    setNearbyBulbasaurTarget({
      kind: "bulbasaurStrawBedComplete",
      id: "bulbasaurStrawBedComplete",
      label: `Talk to ${SANDBOTS_BOT_NAMES.grow}`,
      cellId: rustlingGrassCellId
    });
  }

  const nearbyLogChair = findNearbyLogChair(playerPosition, logChair, storyState);
  if (nearbyLogChair && nearbyLogChair.distance < nearestDistance) {
    nearest = {
      kind: "logChairSeat",
      id: "logChair",
      label: "Save Game"
    };
    nearestDistance = nearbyLogChair.distance;
  }

  const nearbyLeafDen = findNearbyLeafDen(playerPosition, leafDen, storyState);
  if (nearbyLeafDen && nearbyLeafDen.distance < nearestDistance) {
    nearest = {
      kind: storyState?.flags?.leafDenBuilt ?
        "leafDenEntrance" :
        "leafDenConstruction",
      id: "leafDen",
      label: nearbyLeafDen.leafDen?.constructionName || "House"
    };
    nearestDistance = nearbyLeafDen.distance;
  }

  const nearbyInstantiatedObject = findNearbyDestroyableInstantiatedObject(
    playerPosition,
    groundGrassPatches,
    storyState,
    groundFlowerPatches,
    { includeRestoredGrass: false }
  );
  if (nearbyInstantiatedObject && nearbyInstantiatedObject.distance < nearestDistance) {
    nearest = nearbyInstantiatedObject.target;
    nearestDistance = nearbyInstantiatedObject.distance;
  }

  const timburrFurnitureReady =
    storyState?.flags?.leafDenFurnitureRequestAvailable &&
    !storyState?.flags?.leafDenFurnitureRequestComplete &&
    Number(storyState?.flags?.leafDenFurniturePlacedCount || 0) >= 3 &&
    storyState?.flags?.timburrRevealed &&
    timburrEncounter?.visible &&
    Array.isArray(timburrEncounter.position);

  if (timburrFurnitureReady) {
    const distance = Math.hypot(
      playerPosition[0] - timburrEncounter.position[0],
      playerPosition[2] - timburrEncounter.position[2]
    );

    if (distance <= POKEMON_TALK_INTERACT_DISTANCE && distance < nearestDistance) {
      nearest = {
        kind: "timburrLeafDenFurnitureComplete",
        id: "timburr",
        label: `Talk to ${SANDBOTS_BOT_NAMES.builder}`
      };
      nearestDistance = distance;
    }
  }

  const charmanderCelebrationReady =
    storyState?.flags?.charmanderCelebrationRequestAvailable &&
    !storyState?.flags?.charmanderCelebrationSuggested &&
    storyState?.flags?.charmanderRevealed &&
    charmanderEncounter?.visible &&
    Array.isArray(charmanderEncounter.position);

  if (charmanderCelebrationReady) {
    const distance = Math.hypot(
      playerPosition[0] - charmanderEncounter.position[0],
      playerPosition[2] - charmanderEncounter.position[2]
    );

    if (distance <= POKEMON_TALK_INTERACT_DISTANCE && distance < nearestDistance) {
      nearest = {
        kind: "charmanderCelebrationRequest",
        id: "charmander",
        label: `Talk to ${SANDBOTS_BOT_NAMES.thermal}`
      };
      nearestDistance = distance;
    }
  }

  const setNearbyCompanionTarget = ({ id, label, encounter, revealedFlag }) => {
    if (
      !storyState?.flags?.[revealedFlag] ||
      storyState.flags?.[POKEMON_FOLLOW_FLAGS[id]] ||
      !encounter?.visible ||
      !Array.isArray(encounter.position)
    ) {
      return;
    }

    const distance = Math.hypot(
      playerPosition[0] - encounter.position[0],
      playerPosition[2] - encounter.position[2]
    );

    const interactDistance = HELPER_BOT_TALK_INTERACT_DISTANCE;

    if (distance <= interactDistance && distance < nearestDistance) {
      nearest = {
        kind: "pokemonCompanion",
        id,
        label: `Follow me: ${label}`,
        position: [...encounter.position]
      };
      nearestDistance = distance;
    }
  };

  setNearbyCompanionTarget({
    id: "bulbasaur",
    label: SANDBOTS_BOT_NAMES.grow,
    encounter: bulbasaurEncounter,
    revealedFlag: "bulbasaurRevealed"
  });
  setNearbyCompanionTarget({
    id: "charmander",
    label: SANDBOTS_BOT_NAMES.thermal,
    encounter: charmanderEncounter,
    revealedFlag: "charmanderRevealed"
  });
  setNearbyCompanionTarget({
    id: "timburr",
    label: SANDBOTS_BOT_NAMES.builder,
    encounter: timburrEncounter,
    revealedFlag: "timburrRevealed"
  });

  return nearest ? { target: nearest, distance: nearestDistance } : null;
}

export function findNearbyHarvestTarget(
  playerPosition,
  palmModel,
  palmInstances,
  resourceNodes,
  storyState
) {
  const nearbyResourceNode = findNearbyResourceNode(playerPosition, resourceNodes, storyState);
  const nearbyPalm = findNearbyPalm(playerPosition, palmModel, palmInstances);

  let nearbyPalmDistance = Infinity;
  if (nearbyPalm) {
    nearbyPalmDistance = Math.hypot(
      playerPosition[0] - nearbyPalm.offset[0],
      playerPosition[2] - nearbyPalm.offset[2]
    );
  }

  if (nearbyResourceNode && nearbyResourceNode.distance <= nearbyPalmDistance) {
    return nearbyResourceNode;
  }

  if (nearbyPalm) {
    return {
      palm: nearbyPalm,
      distance: nearbyPalmDistance
    };
  }

  return null;
}

export function buildNearbyPrompt({
  harvestTarget,
  interactTarget,
  quest,
  transientMessage,
  getItemLabel,
  storyState = null,
  activeMoveId = null,
  pendingWaterGunCount = 0
}) {
  const interactPromptPrefix = "[E / X]";
  const placePromptPrefix = "[X / Enter]";
  const targetLabel = normalizeWorldPromptCopy(interactTarget?.target?.label || "");
  const questTitle = normalizeWorldPromptCopy(quest?.title || "Explore");
  const questActionLabel = normalizeWorldPromptCopy(quest?.actionLabel || "Interact");
  const formatInteractPrompt = (detail) => {
    const promptDetail = normalizeWorldPromptCopy(detail || "");
    if (!promptDetail || promptDetail === targetLabel || promptDetail === "Explore") {
      return `${interactPromptPrefix} ${targetLabel}`;
    }

    return `${interactPromptPrefix} ${targetLabel} • ${promptDetail}`;
  };

  if (transientMessage) {
    return normalizeWorldPromptCopy(transientMessage);
  }

  if (harvestTarget?.logChairPlacement) {
    return `${placePromptPrefix} Place the Log Chair nearby`;
  }

  if (harvestTarget?.strawBedPlacement) {
    return harvestTarget.strawBedPlacement.canPlace ?
      `${placePromptPrefix} Place the Solar Station on open terrain` :
      `${placePromptPrefix} Move to open terrain`;
  }

  if (harvestTarget?.leafDenKitPlacement) {
    return harvestTarget.leafDenKitPlacement?.canPlace === false ?
      `${placePromptPrefix} Place the Solar Station first` :
      `${placePromptPrefix} Place the House Kit`;
  }

  if (harvestTarget?.leafDenFurniturePlacement) {
    return `${placePromptPrefix} Place furniture inside the House`;
  }

  if (harvestTarget?.dittoFlagPlacement) {
    return `${placePromptPrefix} Place the ${SANDBOTS_ITEM_NAMES.colonyFlag} on the House`;
  }

  if (
    interactTarget?.target?.id === "tangrowth" &&
    quest?.id === "spit-out-campfire"
  ) {
    return `${interactPromptPrefix} ${targetLabel} • Place ${SANDBOTS_ITEM_NAMES.thermalCabin}`;
  }

  if (interactTarget?.target?.id === "ruinedPokemonCenter") {
    return `${interactPromptPrefix} ${targetLabel} • Inspect`;
  }

  if (interactTarget?.target?.id === "pokemonCenterPc") {
    return `${interactPromptPrefix} ${targetLabel} • Check terminal`;
  }

  if (interactTarget?.target?.kind === "leafDenConstruction") {
    return storyState?.flags?.leafDenConstructionStarted ?
      `${interactPromptPrefix} ${targetLabel} • Check construction` :
      `${interactPromptPrefix} ${targetLabel} • Start construction`;
  }

  if (interactTarget?.target?.kind === "leafDenEntrance") {
    return `${interactPromptPrefix} ${targetLabel} • Enter`;
  }

  if (interactTarget?.target?.kind === "timburrLeafDenFurnitureComplete") {
    return `${interactPromptPrefix} ${targetLabel} • Complete request`;
  }

  if (interactTarget?.target?.kind === "charmanderCelebrationRequest") {
    return `${interactPromptPrefix} ${targetLabel} • Celebration`;
  }

  if (interactTarget?.target?.kind === "leppaTreeLeafageOptions") {
    return `${interactPromptPrefix} ${targetLabel} • Choose ${SANDBOTS_ITEM_NAMES.growTool} object`;
  }

  if (interactTarget?.target?.action === "destroyInstantiatedObject") {
    const actionLabel = quest?.actionLabel === "Destroy" ?
      quest.actionLabel :
      (interactTarget.target.actionLabel || "Cut");
    return `[Y] ${targetLabel} • ${normalizeWorldPromptCopy(actionLabel)}`;
  }

  if (interactTarget?.target?.kind === "logChairSeat") {
    return `[X] ${targetLabel}`;
  }

  if (interactTarget?.target?.kind === "station") {
    return formatInteractPrompt(questTitle);
  }

  if (interactTarget?.target) {
    return formatInteractPrompt(questTitle);
  }

  if (harvestTarget?.resourceNode) {
    return `[Enter] ${harvestTarget.resourceNode.label} • +${harvestTarget.resourceNode.yield} ${getItemLabel(
      harvestTarget.resourceNode.itemId
    )}`;
  }

  if (harvestTarget?.palm) {
    if (activeMoveId === "waterGun") {
      return `[Enter] Use ${SANDBOTS_ITEM_NAMES.hydroTool} on the dead tree`;
    }

    if (
      storyState?.flags?.bulbasaurStrawBedChallengeAvailable &&
      !storyState.flags.bulbasaurStrawBedChallengeComplete &&
      !storyState.flags.strawBedRecipeUnlocked
    ) {
      return `[Enter] Use ${SANDBOTS_ITEM_NAMES.hydroTool} on the tree`;
    }

    return "[Enter] Hit the palm tree to drop Wood";
  }

  if (harvestTarget?.leppaTree?.action === "water") {
    return `[Enter] Use ${SANDBOTS_ITEM_NAMES.hydroTool} on the dead tree`;
  }

  if (harvestTarget?.leppaTree?.action === "headbutt") {
    return "[Enter] Headbutt the tree to drop a Pulse Berry";
  }

  if (harvestTarget?.leafageGroundCell) {
    return formatMoveTargetPromptByAbilityId("leafage", "ground");
  }

  if (harvestTarget?.groundCell) {
    return formatMoveTargetPromptByAbilityId("waterGun", "ground", {
      pendingWaterGunCount
    });
  }

  const activeMoveGuidance = formatActiveMoveGuidanceByAbilityId(activeMoveId, {
    pendingWaterGunCount,
    storyFlags: storyState?.flags || null
  });
  if (activeMoveGuidance) {
    return activeMoveGuidance;
  }

  return `${questTitle} • ${questActionLabel}`;
}

export function createKeyboardController(
  camera,
  pressedKeys,
  {
    getAnalogMovement = () => ({ x: 0, y: 0 }),
    isRunActive = () => false,
    consumeJumpRequest = () => false
  } = {}
) {
  return {
    getIntent() {
      const movementAxes = camera.getMovementAxes();
      const analogMovement = getAnalogMovement();
      const verticalInput =
        (pressedKeys.has("w") ? 1 : 0) -
        (pressedKeys.has("s") ? 1 : 0) -
        Number(analogMovement.y || 0);
      const horizontalInput =
        (pressedKeys.has("d") ? 1 : 0) -
        (pressedKeys.has("a") ? 1 : 0) +
        Number(analogMovement.x || 0);
      const movement = [0, 0, 0];

      movement[0] += movementAxes.up[0] * verticalInput;
      movement[2] += movementAxes.up[2] * verticalInput;
      movement[0] += movementAxes.right[0] * horizontalInput;
      movement[2] += movementAxes.right[2] * horizontalInput;

      let facing = "down";
      if (Math.abs(horizontalInput) > Math.abs(verticalInput)) {
        facing = horizontalInput > 0 ? "right" : "left";
      } else if (verticalInput !== 0) {
        facing = verticalInput > 0 ? "up" : "down";
      }

      return {
        movement,
        moving: Math.abs(verticalInput) > 0.001 || Math.abs(horizontalInput) > 0.001,
        facing,
        running: isRunActive(),
        jumping: consumeJumpRequest()
      };
    }
  };
}

export function createCollisionChecker(
  houseModel,
  treeModel,
  palmInstances,
  getDynamicBarriers = () => [],
  getTerrainColliders = () => [],
  sceneLimit = WORLD_LIMIT
) {
  const houseHalfX = houseModel.size[0] * 0.5 + 0.35;
  const houseHalfZ = houseModel.size[2] * 0.5 + 0.35;

  return function isBlocked(nextPosition) {
    const [x, y, z] = nextPosition;

    if (Math.abs(x) > sceneLimit || Math.abs(z) > sceneLimit) {
      return true;
    }

    if (Math.abs(x) < houseHalfX && Math.abs(z) < houseHalfZ) {
      return true;
    }

    const blockedByStatic = palmInstances.some((instance) => {
      if (instance.active === false) {
        return false;
      }

      const radius = treeFootprint(treeModel, instance) * 0.34;
      return Math.hypot(x - instance.offset[0], z - instance.offset[2]) < radius;
    }) || getDynamicBarriers().some((barrier) => {
      return Math.hypot(x - barrier.position[0], z - barrier.position[2]) < barrier.radius;
    });

    if (blockedByStatic) {
      return true;
    }

    const terrainColliders = getTerrainColliders();
    const terrainColliderCandidates = getTerrainColliderCandidates(nextPosition, terrainColliders);
    const terrainCollider = terrainColliderCandidates.reduce((highestCollider, collider) => {
      if (!collider?.blocksPlayer || !isInsideColliderFootprint(x, z, collider)) {
        return highestCollider;
      }

      if (!highestCollider || collider.surfaceY > highestCollider.surfaceY) {
        return collider;
      }

      return highestCollider;
    }, null);

    if (!terrainCollider) {
      return false;
    }

    if (y >= terrainCollider.surfaceY - 0.18) {
      return {
        blocked: false,
        landingY: terrainCollider.surfaceY
      };
    }

    return true;
  };
}
