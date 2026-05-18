const ELEVATED_TERRAIN_HILLS = Object.freeze([
  { id: "northwest-ridge-a", center: [-50, -46], radius: 6, height: 5 },
  { id: "northwest-ridge-b", center: [-34, -42], radius: 5, height: 4 },
  { id: "west-plateau-a", center: [-54, 14], radius: 6, height: 4 },
  { id: "west-plateau-b", center: [-38, 34], radius: 7, height: 3 },
  { id: "north-cliffs-a", center: [26, -54], radius: 6, height: 5 },
  { id: "north-cliffs-b", center: [48, -42], radius: 5, height: 4 },
  { id: "east-steppe-a", center: [54, 14], radius: 6, height: 4 },
  { id: "east-steppe-b", center: [44, 36], radius: 5, height: 3 },
  { id: "south-spine-a", center: [-18, 52], radius: 6, height: 4 },
  { id: "south-spine-b", center: [10, 54], radius: 7, height: 3 },
  { id: "far-east-crown", center: [60, -12], radius: 4, height: 5 },
  { id: "far-west-crown", center: [-62, -10], radius: 4, height: 5 },
  { id: "southwest-valley-wall", center: [-48, 54], radius: 5, height: 4 },
  { id: "southeast-valley-wall", center: [42, 52], radius: 5, height: 4 },
  { id: "distant-north-wall", center: [0, -62], radius: 7, height: 3 },
  { id: "outer-northwest-massif", center: [-104, -100], radius: 12, height: 6, cellStep: 2 },
  { id: "outer-northwest-ridge", center: [-128, -74], radius: 10, height: 5, cellStep: 2 },
  { id: "outer-north-deep-wall", center: [-52, -118], radius: 11, height: 6, cellStep: 2 },
  { id: "outer-northeast-massif", center: [96, -104], radius: 12, height: 6, cellStep: 2 },
  { id: "outer-northeast-ridge", center: [124, -74], radius: 10, height: 5, cellStep: 2 },
  { id: "outer-east-steppe", center: [112, 18], radius: 11, height: 5, cellStep: 2 },
  { id: "outer-east-butte", center: [132, 62], radius: 10, height: 5, cellStep: 2 },
  { id: "outer-southeast-massif", center: [96, 108], radius: 12, height: 5, cellStep: 2 },
  { id: "outer-southeast-ridge", center: [42, 122], radius: 10, height: 4, cellStep: 2 },
  { id: "outer-south-spine", center: [-20, 126], radius: 14, height: 6, cellStep: 2 },
  { id: "outer-southwest-massif", center: [-104, 106], radius: 12, height: 5, cellStep: 2 },
  { id: "outer-southwest-ridge", center: [-132, 70], radius: 10, height: 5, cellStep: 2 },
  { id: "outer-west-plateau", center: [-118, 18], radius: 11, height: 5, cellStep: 2 },
  { id: "outer-west-crown", center: [-130, -34], radius: 8, height: 6 },
  { id: "outer-north-mid-wall", center: [8, -112], radius: 9, height: 5 }
]);

function distance2d(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function isInsideSafeZone(position, safeZones) {
  return safeZones.some((safeZone) => {
    return distance2d(position, safeZone.position) < safeZone.radius;
  });
}

function getHeightForCell(x, z, hill) {
  const distance = Math.max(Math.abs(x) * 0.92, Math.abs(z));

  if (distance > hill.radius) {
    return 0;
  }

  const normalized = 1 - distance / Math.max(1, hill.radius);
  const shelfNoise = (Math.abs(x * 13 + z * 7 + hill.height) % 4) * 0.16;
  const valleyCut = Math.abs(x - z) % 5 === 0 && distance > hill.radius * 0.46 ? 1 : 0;
  return Math.max(1, Math.round(hill.height * normalized + shelfNoise) - valleyCut);
}

export function buildElevatedTerrain({
  tileSpan,
  tileHeight,
  tileScale,
  safeZones = []
} = {}) {
  if (!(tileSpan > 0) || !(tileHeight > 0) || !(tileScale > 0)) {
    return {
      instances: [],
      colliders: []
    };
  }

  const instances = [];
  const colliders = [];

  for (const hill of ELEVATED_TERRAIN_HILLS) {
    const cellStep = Math.max(1, hill.cellStep || 1);
    const cellScale = tileScale * cellStep;
    const cellHeight = tileHeight * cellScale;
    const cellSpan = tileSpan * cellStep;

    for (let x = -hill.radius; x <= hill.radius; x += cellStep) {
      for (let z = -hill.radius; z <= hill.radius; z += cellStep) {
        const stackHeight = getHeightForCell(x, z, hill);

        if (stackHeight <= 0) {
          continue;
        }

        const worldX = Number((hill.center[0] + x * tileSpan).toFixed(4));
        const worldZ = Number((hill.center[1] + z * tileSpan).toFixed(4));

        if (isInsideSafeZone([worldX, worldZ], safeZones)) {
          continue;
        }

        for (let layer = 1; layer <= stackHeight; layer += 1) {
          const surfaceY = layer * cellHeight;
          const isTopLayer = layer === stackHeight;
          const instance = {
            id: `elevated-${hill.id}-${x + hill.radius}-${z + hill.radius}-${layer}`,
            offset: [worldX, Number((surfaceY - cellHeight).toFixed(4)), worldZ],
            scale: cellScale,
            surfaceY,
            tileSpan: cellSpan,
            purifiable: isTopLayer,
            terrainHillCenter: [...hill.center],
            terrainHillCellStep: cellStep,
            terrainHillRadius: hill.radius,
            terrainLayer: layer,
            terrainStackHeight: stackHeight,
            yaw: ((x + z + layer) & 3) * (Math.PI * 0.5)
          };

          instances.push(instance);
          colliders.push({
            id: `${instance.id}-collider`,
            position: [...instance.offset],
            size: [cellSpan, cellHeight, cellSpan],
            surfaceY,
            blocksPlayer: false,
            visualOnly: true
          });
        }
      }
    }
  }

  return {
    instances,
    colliders
  };
}
