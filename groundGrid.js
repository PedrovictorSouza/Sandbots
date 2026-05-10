import { createSpatialHashIndex } from "./world/spatialHash.js";

export const GROUND_TILE_INSTANCE_SCALE = 0.375;
export const GROUND_CELL_INTERACT_RADIUS_FACTOR = 0.82;
export const DEAD_PATCH_STATE = "dead";
export const ALIVE_PATCH_STATE = "alive";
export const DEAD_GRASS_STATE = DEAD_PATCH_STATE;
export const GREEN_GRASS_STATE = ALIVE_PATCH_STATE;
export const DEAD_GROUND_KIND = "dead";
export const COLD_GROUND_KIND = "cold";

const GROUND_CELL_INDEX_MIN_SIZE = 128;
const PURIFIED_GROUND_VARIANT_INSTANCES = Symbol.for("small-island.purifiedGroundVariantInstances");
const GROUND_CELL_ID_PATTERN = /^ground-(\d+)-(\d+)$/;
const groundCellIndexCache = new WeakMap();

function getMaxTileSpan(groundInstances) {
  return groundInstances.reduce((maxTileSpan, groundCell) => {
    return Math.max(maxTileSpan, Number(groundCell?.tileSpan) || 0);
  }, 0);
}

export function isAlternatePurifiedGroundCell(groundCell) {
  const match = typeof groundCell?.id === "string" ?
    GROUND_CELL_ID_PATTERN.exec(groundCell.id) :
    null;

  if (!match) {
    return false;
  }

  const xIndex = Number(match[1]);
  const zIndex = Number(match[2]);
  return (xIndex + zIndex) % 2 === 1;
}

export function bindPurifiedGroundVariantInstances(
  purifiedGroundInstances,
  {
    lightInstances = [],
    darkInstances = []
  } = {}
) {
  if (!Array.isArray(purifiedGroundInstances)) {
    return;
  }

  Object.defineProperty(purifiedGroundInstances, PURIFIED_GROUND_VARIANT_INSTANCES, {
    value: {
      lightInstances,
      darkInstances
    },
    configurable: true
  });
}

export function syncPurifiedGroundVariantInstances(purifiedGroundInstances) {
  const variants = purifiedGroundInstances?.[PURIFIED_GROUND_VARIANT_INSTANCES];
  if (!variants) {
    return;
  }

  variants.lightInstances.length = 0;
  variants.darkInstances.length = 0;

  for (const groundCell of purifiedGroundInstances) {
    const targetInstances = isAlternatePurifiedGroundCell(groundCell) ?
      variants.darkInstances :
      variants.lightInstances;
    targetInstances.push(groundCell);
  }
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

function clampRatio(value) {
  return Math.min(1, Math.max(0, Number(value) || 0));
}

function getGroundCellCoverageGroup(groundCell, coverageZones = [], fallbackRatio = 0) {
  if (!Array.isArray(groundCell?.offset) || !Array.isArray(coverageZones)) {
    return {
      key: "default",
      coverageRatio: fallbackRatio
    };
  }

  const cellX = groundCell.offset[0];
  const cellZ = groundCell.offset[2];

  for (let zoneIndex = 0; zoneIndex < coverageZones.length; zoneIndex += 1) {
    const coverageZone = coverageZones[zoneIndex];
    if (!Array.isArray(coverageZone?.position) || !(coverageZone.radius > 0)) {
      continue;
    }

    const dx = cellX - coverageZone.position[0];
    const dz = cellZ - coverageZone.position[1];

    if (dx * dx + dz * dz <= coverageZone.radius * coverageZone.radius) {
      return {
        key: `zone-${zoneIndex}`,
        coverageRatio: clampRatio(coverageZone.coverageRatio)
      };
    }
  }

  return {
    key: "default",
    coverageRatio: fallbackRatio
  };
}

export function partitionColdGroundInstances(groundInstances, {
  coldCoverageRatio = 0.8,
  coverageZones = [],
  seed = "cold-ground"
} = {}) {
  const deadGroundInstances = [];
  const coldGroundInstances = [];

  if (!Array.isArray(groundInstances) || !groundInstances.length) {
    return {
      deadGroundInstances,
      coldGroundInstances
    };
  }

  const defaultCoverageRatio = clampRatio(coldCoverageRatio);
  const coverageGroups = new Map();
  const coldGroundCellIds = new Set();

  for (const groundCell of groundInstances) {
    const coverageGroup = getGroundCellCoverageGroup(
      groundCell,
      coverageZones,
      defaultCoverageRatio
    );

    if (!coverageGroups.has(coverageGroup.key)) {
      coverageGroups.set(coverageGroup.key, {
        coverageRatio: coverageGroup.coverageRatio,
        cells: []
      });
    }

    coverageGroups.get(coverageGroup.key).cells.push({
      groundCell,
      hash: getStableHash(`${seed}:${coverageGroup.key}:${groundCell.id}`)
    });
  }

  for (const group of coverageGroups.values()) {
    const coldCount = Math.round(group.cells.length * group.coverageRatio);
    const selectedCells = group.cells
      .sort((left, right) => left.hash - right.hash)
      .slice(0, coldCount);

    for (const { groundCell } of selectedCells) {
      coldGroundCellIds.add(groundCell.id);
    }
  }

  for (const groundCell of groundInstances) {
    if (coldGroundCellIds.has(groundCell.id)) {
      groundCell.groundKind = COLD_GROUND_KIND;
      groundCell.purifiable = false;
      coldGroundInstances.push(groundCell);
      continue;
    }

    groundCell.groundKind = DEAD_GROUND_KIND;
    groundCell.purifiable = true;
    deadGroundInstances.push(groundCell);
  }

  return {
    deadGroundInstances,
    coldGroundInstances
  };
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
  const variants = purifiedGroundInstances?.[PURIFIED_GROUND_VARIANT_INSTANCES];
  if (variants) {
    const targetInstances = isAlternatePurifiedGroundCell(corruptedGroundCell) ?
      variants.darkInstances :
      variants.lightInstances;
    targetInstances.push(corruptedGroundCell);
  }
  return true;
}

export function reviveGroundGrass(groundCell, groundGrassPatches) {
  return reviveGroundPatch(groundCell, groundGrassPatches);
}

export function reviveGroundFlower(groundCell, groundFlowerPatches) {
  return reviveGroundPatch(groundCell, groundFlowerPatches);
}
