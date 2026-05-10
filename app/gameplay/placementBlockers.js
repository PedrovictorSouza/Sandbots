export const DEFAULT_PLAYER_CONSTRUCTION_FOOTPRINTS = Object.freeze({
  solarStation: Object.freeze([2.2, 2.2]),
  trainHouse: Object.freeze([1.7, 1.45]),
  houseKit: Object.freeze([1.95, 1.45]),
  houseBuilt: Object.freeze([3.9, 2.9])
});

function hasPlacementPosition(placement) {
  return Array.isArray(placement?.position) &&
    Number.isFinite(Number(placement.position[0])) &&
    Number.isFinite(Number(placement.position[2]));
}

export function getPlacementFootprintSize(placement, fallbackSize = [1, 1]) {
  if (
    Array.isArray(placement?.size) &&
    Number(placement.size[0]) > 0 &&
    Number(placement.size[1]) > 0
  ) {
    return [Number(placement.size[0]), Number(placement.size[1])];
  }

  return [
    Math.max(0.01, Number(fallbackSize?.[0]) || 1),
    Math.max(0.01, Number(fallbackSize?.[1]) || 1)
  ];
}

export function getRotatedFootprintSize(size = [1, 1], yaw = 0) {
  const width = Math.max(0.01, Number(size?.[0]) || 1);
  const depth = Math.max(0.01, Number(size?.[1]) || 1);
  const normalizedYaw = ((Number(yaw || 0) % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);
  const quarterTurns = Math.round(normalizedYaw / (Math.PI * 0.5)) % 4;

  return quarterTurns % 2 === 1 ? [depth, width] : [width, depth];
}

function addConstructionBlocker(blockers, {
  id,
  kind,
  placement,
  fallbackSize,
  rotateSize = false
}) {
  if (!hasPlacementPosition(placement)) {
    return;
  }

  const baseSize = getPlacementFootprintSize(placement, fallbackSize);
  blockers.push({
    id,
    kind,
    position: placement.position,
    size: rotateSize ? getRotatedFootprintSize(baseSize, placement.yaw) : baseSize
  });
}

export function createPlayerConstructionPlacementBlockers({
  session = {},
  storyState = {},
  footprints = DEFAULT_PLAYER_CONSTRUCTION_FOOTPRINTS
} = {}) {
  const flags = storyState?.flags || {};
  const blockers = [];

  if (flags.strawBedPlacedInBulbasaurHabitat) {
    addConstructionBlocker(blockers, {
      id: "solar-station",
      kind: "solarStation",
      placement: session.strawBed,
      fallbackSize: footprints.solarStation
    });
  }

  if (flags.campfireSpatOut) {
    addConstructionBlocker(blockers, {
      id: "train-house",
      kind: "trainHouse",
      placement: session.campfire,
      fallbackSize: footprints.trainHouse,
      rotateSize: true
    });
  }

  if (flags.leafDenKitPlaced || flags.leafDenBuilt) {
    addConstructionBlocker(blockers, {
      id: "house",
      kind: "house",
      placement: session.leafDen,
      fallbackSize: flags.leafDenBuilt ? footprints.houseBuilt : footprints.houseKit,
      rotateSize: true
    });
  }

  for (const playerHouse of session.playerHouses || []) {
    addConstructionBlocker(blockers, {
      id: playerHouse?.id ? `player-house:${playerHouse.id}` : "player-house",
      kind: "playerHouse",
      placement: playerHouse,
      fallbackSize: footprints.houseBuilt,
      rotateSize: true
    });
  }

  return blockers;
}

export function createPlayerConstructionTerrainColliders({
  session = {},
  storyState = {},
  footprints = DEFAULT_PLAYER_CONSTRUCTION_FOOTPRINTS,
  surfaceY = 2.4,
  height = 2.4,
  padding = 0.12
} = {}) {
  return createPlayerConstructionPlacementBlockers({
    session,
    storyState,
    footprints
  }).map((blocker) => {
    return {
      id: `player-construction-collider:${blocker.id}`,
      kind: blocker.kind,
      position: [
        Number(blocker.position[0]),
        0,
        Number(blocker.position[2])
      ],
      size: [
        Math.max(0.01, Number(blocker.size?.[0]) || 1),
        Math.max(0.01, Number(height) || 1),
        Math.max(0.01, Number(blocker.size?.[1]) || 1)
      ],
      surfaceY: Math.max(0.2, Number(surfaceY) || 2.4),
      blocksPlayer: true,
      padding: Math.max(0, Number(padding) || 0)
    };
  });
}

export function isPositionInsideTerrainColliderFootprint(position, collider) {
  if (!Array.isArray(position) || !collider?.blocksPlayer || !Array.isArray(collider.position)) {
    return false;
  }

  const x = Number(position[0]);
  const y = Number(position[1] || 0);
  const z = Number(position[2]);
  const colliderX = Number(collider.position[0]);
  const colliderZ = Number(collider.position[2]);
  const halfX = (Number(collider.size?.[0]) || 0) * 0.5 + (Number(collider.padding) || 0);
  const halfZ = (Number(collider.size?.[2]) || 0) * 0.5 + (Number(collider.padding) || 0);
  const surfaceY = Number(collider.surfaceY);

  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(z) ||
    !Number.isFinite(colliderX) ||
    !Number.isFinite(colliderZ)
  ) {
    return false;
  }

  if (Number.isFinite(surfaceY) && y >= surfaceY - 0.18) {
    return false;
  }

  return Math.abs(x - colliderX) < halfX && Math.abs(z - colliderZ) < halfZ;
}

export function isPositionBlockedByTerrainColliders(position, colliders = []) {
  return (colliders || []).some((collider) => {
    return isPositionInsideTerrainColliderFootprint(position, collider);
  });
}
