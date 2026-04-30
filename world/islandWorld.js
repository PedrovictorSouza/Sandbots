import {
  LEPPA_BERRY_ITEM_ID,
  LEPPA_TREE_DROP_OFFSET,
  RESOURCE_NODE_DEFS,
  WORLD_LIMIT
} from "../gameplayContent.js";

const WOOD_DROP_HEIGHT = 0.78;
const WOOD_PICKUP_RADIUS = 0.64;
const LEPPA_DROP_HEIGHT = 0.72;
const LEPPA_PICKUP_RADIUS = 0.68;
const LEPPA_TREE_INTERACT_DISTANCE = 2.35;
const LOG_CHAIR_INTERACT_DISTANCE = 1.45;
const LEAF_DEN_INTERACT_DISTANCE = 2.2;
const PALM_SHAKE_DURATION = 0.42;
const BULBASAUR_DRY_GRASS_MISSION_RESTORE_COUNT = 10;
const BULBASAUR_STRAW_BED_TREE_TARGET_COUNT = 5;
const BULBASAUR_STRAW_BED_STICK_TARGET_COUNT = 10;

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

  return placed.map((instance, index) => ({
    ...instance,
    id: `palm-${index}`,
    active: true,
    hitCount: 0,
    shakeTimer: 0,
    shakeDuration: PALM_SHAKE_DURATION,
    swayStrength: 0
  }));
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

export function waterNearbyPalm(playerPosition, treeModel, palmInstances, storyState) {
  if (
    !storyState?.flags?.bulbasaurStrawBedChallengeAvailable ||
    storyState.flags.strawBedRecipeUnlocked
  ) {
    return {
      hit: false,
      counted: false,
      challengeComplete: false,
      palm: null
    };
  }

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

  if (nearestPalm.wateredForBulbasaurChallenge) {
    return {
      hit: true,
      counted: false,
      challengeComplete: false,
      palm: nearestPalm
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
    palm: nearestPalm
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
      continue;
    }

    instance.shakeTimer = Math.max(0, instance.shakeTimer - deltaTime);
    const progress = 1 - instance.shakeTimer / instance.shakeDuration;
    const envelope = instance.shakeTimer / instance.shakeDuration;
    instance.swayStrength = Math.sin(progress * Math.PI * 5.5) * 0.22 * envelope;
  }
}

export function collectWoodDrops(playerPosition, woodDrops, inventory) {
  let collectedThisFrame = 0;

  for (const woodDrop of woodDrops) {
    if (woodDrop.collected) {
      continue;
    }

    const dx = playerPosition[0] - woodDrop.position[0];
    const dz = playerPosition[2] - woodDrop.position[2];
    if (Math.hypot(dx, dz) > woodDrop.pickupRadius) {
      continue;
    }

    woodDrop.collected = true;
    inventory.wood += 1;
    collectedThisFrame += 1;
  }

  return collectedThisFrame;
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
    leppaTree.deadInstance.active = requestActive && !revived;
  }

  if (leppaTree.aliveInstance) {
    leppaTree.aliveInstance.active = revived;
  }

  return leppaTree;
}

export function findNearbyLeppaTree(playerPosition, leppaTree, storyState) {
  if (!isLeppaTreeRequestActive(storyState) || !leppaTree?.position) {
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

  if (!revived) {
    return {
      leppaTree,
      action: "water",
      distance
    };
  }

  if (!berryDropped) {
    return {
      leppaTree,
      action: "headbutt",
      distance
    };
  }

  return null;
}

export function reviveLeppaTree(leppaTree, storyState) {
  if (!leppaTree || !isLeppaTreeRequestActive(storyState)) {
    return false;
  }

  leppaTree.revived = true;
  storyState.flags.leppaTreeRevived = true;
  syncLeppaTreeState(leppaTree, storyState);
  return true;
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
    size: [1.34, 1.08],
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

export function buildCampfirePlacement(anchorPosition = [12.4, 0.02, -8.4]) {
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
    position: [
      playerPosition[0] + 1.15,
      0.02,
      playerPosition[2] + 0.35
    ],
    size: [1.95, 1.45],
    uvRect: [0, 0, 1, 1]
  };
}

export function findNearbyLogChair(playerPosition, logChair, storyState) {
  if (
    !storyState?.flags?.logChairPlaced ||
    storyState?.flags?.logChairSat ||
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

export function isNpcActive(npcActor, storyState) {
  return npcActor.activeWhen(storyState);
}

export function isInteractableActive(interactable, storyState) {
  return interactable.activeWhen(storyState);
}

export function isResourceNodeActive(resourceNode, storyState) {
  return resourceNode.cooldown <= 0 && resourceNode.activeWhen(storyState);
}

export function updateResourceNodes(deltaTime, resourceNodes) {
  for (const resourceNode of resourceNodes) {
    if (resourceNode.cooldown <= 0) {
      resourceNode.cooldown = 0;
      continue;
    }

    resourceNode.cooldown = Math.max(0, resourceNode.cooldown - deltaTime);
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
  charmanderEncounter = null
) {
  let nearest = null;
  let nearestDistance = Infinity;

  for (const npcActor of npcActors) {
    if (!isNpcActive(npcActor, storyState)) {
      continue;
    }

    const [x,, z] = npcActor.character.getPosition();
    const distance = Math.hypot(playerPosition[0] - x, playerPosition[2] - z);

    if (distance <= 1.9 && distance < nearestDistance) {
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

    if (distance <= interactable.interactDistance && distance < nearestDistance) {
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
    Boolean(rustlingGrassCellId);

  if (rustlingGrassActive) {
    const rustlingGrassPatch = groundGrassPatches.find((groundGrassPatch) => {
      return (
        groundGrassPatch.cellId === rustlingGrassCellId &&
        groundGrassPatch.state === "alive"
      );
    });

    if (rustlingGrassPatch) {
      const distance = Math.hypot(
        playerPosition[0] - rustlingGrassPatch.position[0],
        playerPosition[2] - rustlingGrassPatch.position[2]
      );

      if (distance <= 1.6 && distance < nearestDistance) {
        nearest = {
          kind: "grassEncounter",
          id: "rustlingGrass",
          label: "Investigate the rustling grass",
          cellId: rustlingGrassPatch.cellId
        };
        nearestDistance = distance;
      }
    }
  }

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
      const distance = Math.hypot(
        playerPosition[0] - rustlingGrassPatch.position[0],
        playerPosition[2] - rustlingGrassPatch.position[2]
      );

      if (distance <= 1.85 && distance < nearestDistance) {
        nearest = {
          kind: "charmanderGrassEncounter",
          id: "charmanderRustlingGrass",
          label: "Inspect the rustling grass",
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
      const distance = Math.hypot(
        playerPosition[0] - rustlingGrassPatch.position[0],
        playerPosition[2] - rustlingGrassPatch.position[2]
      );

      if (distance <= 1.85 && distance < nearestDistance) {
        nearest = {
          kind: "timburrGrassEncounter",
          id: "timburrRustlingGrass",
          label: "Inspect the Boulder-Shaded Tall Grass",
          cellId: rustlingGrassPatch.cellId
        };
        nearestDistance = distance;
      }
    }
  }

  const bulbasaurMissionActive =
    storyState?.flags?.bulbasaurRevealed &&
    !storyState?.flags?.bulbasaurDryGrassMissionAccepted &&
    Boolean(rustlingGrassCellId);
  const bulbasaurRequestReady =
    storyState?.flags?.bulbasaurRevealed &&
    storyState?.flags?.bulbasaurDryGrassMissionAccepted &&
    !storyState?.flags?.bulbasaurDryGrassRequestTurnedIn &&
    (
      storyState?.flags?.bulbasaurDryGrassMissionComplete ||
      (storyState?.flags?.restoredGrassCount || 0) >= BULBASAUR_DRY_GRASS_MISSION_RESTORE_COUNT
    ) &&
    Boolean(rustlingGrassCellId);

  if (bulbasaurMissionActive || bulbasaurRequestReady) {
    const bulbasaurGrassPatch = groundGrassPatches.find((groundGrassPatch) => {
      return (
        groundGrassPatch.cellId === rustlingGrassCellId &&
        groundGrassPatch.state === "alive"
      );
    });

    if (bulbasaurGrassPatch) {
      const distance = Math.hypot(
        playerPosition[0] - bulbasaurGrassPatch.position[0],
        playerPosition[2] - bulbasaurGrassPatch.position[2]
      );

      if (distance <= 1.85 && distance < nearestDistance) {
        nearest = {
          kind: bulbasaurRequestReady ? "bulbasaurRequestComplete" : "bulbasaurMission",
          id: bulbasaurRequestReady ? "bulbasaurLeafageReward" : "bulbasaurDryGrassMission",
          label: "Talk to Bulbasaur",
          cellId: bulbasaurGrassPatch.cellId
        };
        nearestDistance = distance;
      }
    }
  }

  const leppaGiftReady =
    storyState?.flags?.squirtleLeppaRequestAvailable &&
    storyState?.flags?.leppaBerryCollected &&
    !storyState?.flags?.leppaBerryGiftComplete &&
    storyState?.flags?.bulbasaurRevealed &&
    Boolean(rustlingGrassCellId);

  if (leppaGiftReady) {
    const bulbasaurGrassPatch = groundGrassPatches.find((groundGrassPatch) => {
      return (
        groundGrassPatch.cellId === rustlingGrassCellId &&
        groundGrassPatch.state === "alive"
      );
    });

    if (bulbasaurGrassPatch) {
      const distance = Math.hypot(
        playerPosition[0] - bulbasaurGrassPatch.position[0],
        playerPosition[2] - bulbasaurGrassPatch.position[2]
      );

      if (distance <= 1.85 && distance < nearestDistance) {
        nearest = {
          kind: "leppaBerryGift",
          id: "bulbasaur",
          label: "Look at this!",
          cellId: bulbasaurGrassPatch.cellId
        };
        nearestDistance = distance;
      }
    }
  }

  const bulbasaurStrawBedRecipeReady =
    storyState?.flags?.bulbasaurRevealed &&
    storyState?.flags?.bulbasaurStrawBedChallengeComplete &&
    !storyState?.flags?.strawBedRecipeUnlocked &&
    Boolean(rustlingGrassCellId);

  if (bulbasaurStrawBedRecipeReady) {
    const bulbasaurGrassPatch = groundGrassPatches.find((groundGrassPatch) => {
      return (
        groundGrassPatch.cellId === rustlingGrassCellId &&
        groundGrassPatch.state === "alive"
      );
    });

    if (bulbasaurGrassPatch) {
      const distance = Math.hypot(
        playerPosition[0] - bulbasaurGrassPatch.position[0],
        playerPosition[2] - bulbasaurGrassPatch.position[2]
      );

      if (distance <= 1.85 && distance < nearestDistance) {
        nearest = {
          kind: "bulbasaurStrawBedRecipe",
          id: "bulbasaurStrawBedRecipe",
          label: "Do you need anything?",
          cellId: bulbasaurGrassPatch.cellId
        };
        nearestDistance = distance;
      }
    }
  }

  const bulbasaurStrawBedCompleteReady =
    storyState?.flags?.bulbasaurRevealed &&
    storyState?.flags?.strawBedPlacedInBulbasaurHabitat &&
    !storyState?.flags?.bulbasaurStrawBedRequestComplete &&
    Boolean(rustlingGrassCellId);

  if (bulbasaurStrawBedCompleteReady) {
    const bulbasaurGrassPatch = groundGrassPatches.find((groundGrassPatch) => {
      return (
        groundGrassPatch.cellId === rustlingGrassCellId &&
        groundGrassPatch.state === "alive"
      );
    });

    if (bulbasaurGrassPatch) {
      const distance = Math.hypot(
        playerPosition[0] - bulbasaurGrassPatch.position[0],
        playerPosition[2] - bulbasaurGrassPatch.position[2]
      );

      if (distance <= 1.85 && distance < nearestDistance) {
        nearest = {
          kind: "bulbasaurStrawBedComplete",
          id: "bulbasaurStrawBedComplete",
          label: "Talk to Bulbasaur",
          cellId: bulbasaurGrassPatch.cellId
        };
        nearestDistance = distance;
      }
    }
  }

  const nearbyLogChair = findNearbyLogChair(playerPosition, logChair, storyState);
  if (nearbyLogChair && nearbyLogChair.distance < nearestDistance) {
    nearest = {
      kind: "logChairSeat",
      id: "logChair",
      label: "Sit on Log Chair"
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
      label: storyState?.flags?.leafDenBuilt || storyState?.flags?.leafDenConstructionStarted ?
        "Leaf Den" :
        "Leaf Den Kit"
    };
    nearestDistance = nearbyLeafDen.distance;
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

    if (distance <= 1.85 && distance < nearestDistance) {
      nearest = {
        kind: "timburrLeafDenFurnitureComplete",
        id: "timburr",
        label: "Talk to Timburr"
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

    if (distance <= 1.85 && distance < nearestDistance) {
      nearest = {
        kind: "charmanderCelebrationRequest",
        id: "charmander",
        label: "Talk to Charmander"
      };
      nearestDistance = distance;
    }
  }

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
  storyState = null
}) {
  if (transientMessage) {
    return transientMessage;
  }

  if (harvestTarget?.logChairPlacement) {
    return "[Enter] Place the Log Chair nearby";
  }

  if (harvestTarget?.strawBedPlacement) {
    return harvestTarget.strawBedPlacement.canPlace ?
      "[Enter] Place the Straw Bed in Bulbasaur's habitat" :
      "[Enter] Move inside Bulbasaur's habitat to place the Straw Bed";
  }

  if (harvestTarget?.leafDenKitPlacement) {
    return "[Enter] Place the Leaf Den Kit";
  }

  if (harvestTarget?.leafDenFurniturePlacement) {
    return "[Enter] Place furniture inside the Leaf Den";
  }

  if (harvestTarget?.dittoFlagPlacement) {
    return "[Enter] Place the Ditto Flag on the Leaf Den";
  }

  if (
    interactTarget?.target?.id === "tangrowth" &&
    quest?.id === "spit-out-campfire"
  ) {
    return `[A / E] ${interactTarget.target.label} • Spit out Campfire`;
  }

  if (interactTarget?.target?.id === "ruinedPokemonCenter") {
    return `[A / E] ${interactTarget.target.label} • Inspect`;
  }

  if (interactTarget?.target?.id === "pokemonCenterPc") {
    return `[A / E] ${interactTarget.target.label} • Check PC`;
  }

  if (interactTarget?.target?.kind === "leafDenConstruction") {
    return storyState?.flags?.leafDenConstructionStarted ?
      `[A / E] ${interactTarget.target.label} • Check construction` :
      `[A / E] ${interactTarget.target.label} • Start construction`;
  }

  if (interactTarget?.target?.kind === "leafDenEntrance") {
    return `[A / E] ${interactTarget.target.label} • Enter`;
  }

  if (interactTarget?.target?.kind === "timburrLeafDenFurnitureComplete") {
    return `[A / E] ${interactTarget.target.label} • Complete request`;
  }

  if (interactTarget?.target?.kind === "charmanderCelebrationRequest") {
    return `[A / E] ${interactTarget.target.label} • Celebration`;
  }

  if (interactTarget?.target?.kind === "logChairSeat") {
    return `[A / E] ${interactTarget.target.label} • ${quest.title}`;
  }

  if (interactTarget?.target?.kind === "station") {
    return `[A / E] ${interactTarget.target.label} • ${quest.title}`;
  }

  if (interactTarget?.target) {
    return `[A / E] ${interactTarget.target.label} • ${quest.title}`;
  }

  if (harvestTarget?.resourceNode) {
    return `[Enter] ${harvestTarget.resourceNode.label} • +${harvestTarget.resourceNode.yield} ${getItemLabel(
      harvestTarget.resourceNode.itemId
    )}`;
  }

  if (harvestTarget?.palm) {
    if (
      storyState?.flags?.bulbasaurStrawBedChallengeAvailable &&
      !storyState.flags.bulbasaurStrawBedChallengeComplete &&
      !storyState.flags.strawBedRecipeUnlocked
    ) {
      return "[Enter] Use Water Gun on the tree";
    }

    return "[Enter] Hit the palm tree to drop Wood";
  }

  if (harvestTarget?.leppaTree?.action === "water") {
    return "[Enter] Use Water Gun on the dead tree";
  }

  if (harvestTarget?.leppaTree?.action === "headbutt") {
    return "[Enter] Headbutt the tree to drop a Leppa Berry";
  }

  if (harvestTarget?.leafageGroundCell) {
    return "[Enter] Use Leafage to grow tall grass";
  }

  if (harvestTarget?.groundCell) {
    return "[Enter] Restore the dry ground";
  }

  return `${quest.title} • ${quest.actionLabel}`;
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

    const terrainCollider = getTerrainColliders().reduce((highestCollider, collider) => {
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
