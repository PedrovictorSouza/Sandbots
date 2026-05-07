import { createSpatialHashIndex } from "./world/spatialHash.js";

export const GROUND_TILE_INSTANCE_SCALE = 0.375;
export const GROUND_CELL_INTERACT_RADIUS_FACTOR = 0.82;
export const DEAD_PATCH_STATE = "dead";
export const ALIVE_PATCH_STATE = "alive";
export const DEAD_GRASS_STATE = DEAD_PATCH_STATE;
export const GREEN_GRASS_STATE = ALIVE_PATCH_STATE;

const GROUND_CELL_INDEX_MIN_SIZE = 128;
const groundCellIndexCache = new WeakMap();

function getMaxTileSpan(groundInstances) {
  return groundInstances.reduce((maxTileSpan, groundCell) => {
    return Math.max(maxTileSpan, Number(groundCell?.tileSpan) || 0);
  }, 0);
}

export function createGroundCellSpatialIndex(groundInstances) {
  if (!Array.isArray(groundInstances)) {
    return null;
  }

  const maxTileSpan = getMaxTileSpan(groundInstances);
  const cellSize = Math.max(4, maxTileSpan * 4);
  const index = createSpatialHashIndex(groundInstances, { cellSize });

  return {
    ...index,
    maxTileSpan,
    maxInteractDistance: maxTileSpan * GROUND_CELL_INTERACT_RADIUS_FACTOR
  };
}

function getCachedGroundCellSpatialIndex(groundInstances) {
  if (!Array.isArray(groundInstances) || groundInstances.length < GROUND_CELL_INDEX_MIN_SIZE) {
    return null;
  }

  const cached = groundCellIndexCache.get(groundInstances);
  if (cached?.length === groundInstances.length) {
    return cached.index;
  }

  const index = createGroundCellSpatialIndex(groundInstances);
  groundCellIndexCache.set(groundInstances, {
    length: groundInstances.length,
    index
  });

  return index;
}

function getGroundCellCandidates(playerPosition, groundInstances, maxDistanceFactor, spatialIndex) {
  const index = spatialIndex || getCachedGroundCellSpatialIndex(groundInstances);

  if (!index) {
    return groundInstances;
  }

  return index.queryRadius(
    playerPosition,
    Math.max(index.maxInteractDistance, (index.maxTileSpan || 0) * maxDistanceFactor)
  );
}

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

function getStableHash(value) {
  const text = String(value || "");
  let hash = 2166136261;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function isGroundCellInSafeZone(groundCell, safeZones = []) {
  if (!Array.isArray(groundCell?.offset) || !Array.isArray(safeZones)) {
    return false;
  }

  const cellX = groundCell.offset[0];
  const cellZ = groundCell.offset[2];

  return safeZones.some((safeZone) => {
    if (!Array.isArray(safeZone?.position) || !(safeZone.radius > 0)) {
      return false;
    }

    const dx = cellX - safeZone.position[0];
    const dz = cellZ - safeZone.position[1];
    return dx * dx + dz * dz <= safeZone.radius * safeZone.radius;
  });
}

function createPatchFromGroundCell({
  groundCell,
  id,
  elevation,
  defaultSize,
  habitatGroupId = null
}) {
  const patch = {
    id,
    cellId: groundCell.id,
    position: [
      groundCell.offset[0],
      (groundCell.surfaceY || 0) + elevation,
      groundCell.offset[2]
    ],
    size: [...defaultSize],
    state: DEAD_PATCH_STATE
  };

  if (habitatGroupId) {
    patch.habitatGroupId = habitatGroupId;
  }

  return patch;
}

function appendCoverageGroundPatches({
  patches,
  groundInstances,
  coverageRatio,
  safeZones = [],
  seed = "ground-patches",
  elevation,
  defaultSize,
  idPrefix
}) {
  if (!(coverageRatio > 0) || !Array.isArray(groundInstances) || !groundInstances.length) {
    return patches;
  }

  const usedGroundCellIds = new Set(patches.map((patch) => patch.cellId));
  const eligibleGroundCells = groundInstances.filter((groundCell) => {
    return groundCell?.id && !isGroundCellInSafeZone(groundCell, safeZones);
  });
  const targetPatchCount = Math.round(eligibleGroundCells.length * Math.min(1, coverageRatio));
  const additionalPatchCount = Math.max(0, targetPatchCount - patches.length);

  if (!additionalPatchCount) {
    return patches;
  }

  const selectedGroundCells = eligibleGroundCells
    .filter((groundCell) => !usedGroundCellIds.has(groundCell.id))
    .map((groundCell) => ({
      groundCell,
      hash: getStableHash(`${seed}:${groundCell.id}`)
    }))
    .sort((left, right) => left.hash - right.hash)
    .slice(0, additionalPatchCount);

  for (const { groundCell } of selectedGroundCells) {
    patches.push(createPatchFromGroundCell({
      groundCell,
      id: `${idPrefix}-ecosystem-${patches.length}`,
      elevation,
      defaultSize
    }));
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
  defaultSize = [1.18, 0.96],
  coverageRatio = 0,
  safeZones = [],
  seed = "ground-grass"
} = {}) {
  const patches = buildGroundPatches({
    groundInstances,
    layout,
    elevation,
    defaultSize,
    idPrefix: "grass"
  });

  return appendCoverageGroundPatches({
    patches,
    groundInstances,
    coverageRatio,
    safeZones,
    seed,
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
  maxDistanceFactor = GROUND_CELL_INTERACT_RADIUS_FACTOR,
  spatialIndex = null
) {
  let nearestGroundCell = null;
  let nearestDistance = Infinity;
  const candidates = getGroundCellCandidates(
    playerPosition,
    groundInstances,
    maxDistanceFactor,
    spatialIndex
  );

  for (const groundCell of candidates) {
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
