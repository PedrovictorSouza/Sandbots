import { RESOURCE_NODE_DEFS, WORLD_LIMIT } from "../gameplayContent.js";

const WOOD_DROP_HEIGHT = 0.78;
const WOOD_PICKUP_RADIUS = 0.64;
const PALM_SHAKE_DURATION = 0.42;

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
  groundGrassPatches = []
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
    storyState?.flags?.tangrowthTallGrassCommentSeen &&
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
  getItemLabel
}) {
  if (transientMessage) {
    return transientMessage;
  }

  if (interactTarget?.target) {
    return `[E] ${interactTarget.target.label} • ${quest.title}`;
  }

  if (harvestTarget?.resourceNode) {
    return `[Enter] ${harvestTarget.resourceNode.label} • +${harvestTarget.resourceNode.yield} ${getItemLabel(
      harvestTarget.resourceNode.itemId
    )}`;
  }

  if (harvestTarget?.palm) {
    return "[Enter] Hit the palm tree to drop Wood";
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
