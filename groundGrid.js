export const GROUND_TILE_INSTANCE_SCALE = 0.375;
export const GROUND_CELL_INTERACT_RADIUS_FACTOR = 0.82;
export const DEAD_PATCH_STATE = "dead";
export const ALIVE_PATCH_STATE = "alive";
export const DEAD_GRASS_STATE = DEAD_PATCH_STATE;
export const GREEN_GRASS_STATE = ALIVE_PATCH_STATE;

function buildGroundPatches({
  groundInstances,
  layout = [],
  elevation = 0.02,
  defaultSize = [1.18, 0.96],
  idPrefix = "patch"
} = {}) {
  if (!Array.isArray(groundInstances) || !groundInstances.length || !Array.isArray(layout)) {
    return [];
  }

  const usedGroundCellIds = new Set();
  const patches = [];

  for (const entry of layout) {
    if (!Array.isArray(entry?.position) || entry.position.length < 3) {
      continue;
    }

    let nearestGroundCell = null;
    let nearestDistance = Infinity;

    for (const groundCell of groundInstances) {
      if (usedGroundCellIds.has(groundCell.id)) {
        continue;
      }

      const dx = entry.position[0] - groundCell.offset[0];
      const dz = entry.position[2] - groundCell.offset[2];
      const distance = Math.hypot(dx, dz);

      if (distance < nearestDistance) {
        nearestGroundCell = groundCell;
        nearestDistance = distance;
      }
    }

    if (!nearestGroundCell) {
      continue;
    }

    usedGroundCellIds.add(nearestGroundCell.id);
    const patch = {
      id: entry.id || `${idPrefix}-${patches.length}`,
      cellId: nearestGroundCell.id,
      position: [
        nearestGroundCell.offset[0],
        (nearestGroundCell.surfaceY || 0) + elevation,
        nearestGroundCell.offset[2]
      ],
      size: Array.isArray(entry.size) ? [...entry.size] : [...defaultSize],
      state: DEAD_PATCH_STATE
    };

    if (entry.habitatGroupId) {
      patch.habitatGroupId = entry.habitatGroupId;
    }

    patches.push(patch);
  }

  return patches;
}

function reviveGroundPatch(groundCell, patches) {
  if (!groundCell || !Array.isArray(patches)) {
    return false;
  }

  const matchingPatch = patches.find((patch) => {
    return patch.cellId === groundCell.id;
  });

  if (!matchingPatch) {
    return false;
  }

  if (matchingPatch.state === ALIVE_PATCH_STATE) {
    return false;
  }

  matchingPatch.state = ALIVE_PATCH_STATE;
  return matchingPatch;
}

export function buildGroundGridInstances({
  worldLimit,
  tileFootprint,
  tileHeight,
  tileScale = GROUND_TILE_INSTANCE_SCALE,
  surfaceY = 0,
} = {}) {
  if (!(worldLimit > 0) || !(tileFootprint > 0) || !(tileHeight > 0) || !(tileScale > 0)) {
    return [];
  }

  const tileSpan = tileFootprint * tileScale;
  const scaledHeight = tileHeight * tileScale;
  const tileCountPerAxis = Math.max(1, Math.ceil((worldLimit * 2) / tileSpan));
  const start = -worldLimit + tileSpan * 0.5;
  const buriedY = surfaceY - scaledHeight;
  const instances = [];

  for (let xIndex = 0; xIndex < tileCountPerAxis; xIndex += 1) {
    for (let zIndex = 0; zIndex < tileCountPerAxis; zIndex += 1) {
      const yaw = ((xIndex + zIndex) % 4) * (Math.PI * 0.5);
      instances.push({
        id: `ground-${xIndex}-${zIndex}`,
        offset: [
          Number((start + xIndex * tileSpan).toFixed(4)),
          buriedY,
          Number((start + zIndex * tileSpan).toFixed(4)),
        ],
        scale: tileScale,
        surfaceY,
        tileSpan,
        yaw,
      });
    }
  }

  return instances;
}

export function buildGroundGrassPatches({
  groundInstances,
  layout = [],
  elevation = 0.02,
  defaultSize = [1.18, 0.96]
} = {}) {
  return buildGroundPatches({
    groundInstances,
    layout,
    elevation,
    defaultSize,
    idPrefix: "grass"
  });
}

export function buildGroundFlowerPatches({
  groundInstances,
  layout = [],
  elevation = 0.02,
  defaultSize = [1.02, 0.78]
} = {}) {
  return buildGroundPatches({
    groundInstances,
    layout,
    elevation,
    defaultSize,
    idPrefix: "flower"
  });
}

export function findNearbyGroundCell(
  playerPosition,
  groundInstances,
  maxDistanceFactor = GROUND_CELL_INTERACT_RADIUS_FACTOR
) {
  let nearestGroundCell = null;
  let nearestDistance = Infinity;

  for (const groundCell of groundInstances) {
    if (groundCell.active === false) {
      continue;
    }

    if (groundCell.purifiable === false) {
      continue;
    }

    const dx = playerPosition[0] - groundCell.offset[0];
    const dz = playerPosition[2] - groundCell.offset[2];
    const distance = Math.hypot(dx, dz);
    const interactDistance = (groundCell.tileSpan || 0) * maxDistanceFactor;

    if (distance <= interactDistance && distance < nearestDistance) {
      nearestGroundCell = groundCell;
      nearestDistance = distance;
    }
  }

  return nearestGroundCell ? {
    groundCell: nearestGroundCell,
    distance: nearestDistance
  } : null;
}

export function purifyGroundCell(groundCell, corruptedGroundInstances, purifiedGroundInstances) {
  const corruptedIndex = corruptedGroundInstances.indexOf(groundCell);
  if (corruptedIndex === -1) {
    return false;
  }

  const [corruptedGroundCell] = corruptedGroundInstances.splice(corruptedIndex, 1);
  purifiedGroundInstances.push(corruptedGroundCell);
  return true;
}

export function reviveGroundGrass(groundCell, groundGrassPatches) {
  return reviveGroundPatch(groundCell, groundGrassPatches);
}

export function reviveGroundFlower(groundCell, groundFlowerPatches) {
  return reviveGroundPatch(groundCell, groundFlowerPatches);
}
