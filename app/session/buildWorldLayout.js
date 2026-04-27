import {
  buildGroundFlowerPatches,
  buildGroundGrassPatches,
  buildGroundGridInstances,
  GROUND_TILE_INSTANCE_SCALE
} from "../../groundGrid.js";

import {
  DYNAMIC_BARRIERS,
  INTERACTABLE_DEFS,
  NPC_DEFS,
  OUTPOST_INSTANCE_LAYOUT,
  PALM_INSTANCE_LAYOUT,
  RESOURCE_NODE_DEFS,
  GROUND_FLOWER_LAYOUT,
  GROUND_GRASS_LAYOUT,
  WORLD_LIMIT
} from "../../gameplayContent.js";

import {
  ACT_TWO_MONSTER_POSITION,
  ACT_TWO_PLAYER_SPAWN
} from "../../actTwoSceneConfig.js";
import { ACT_TWO_SQUIRTLE_POSITION } from "../../rendering/worldAssets.js";
import { buildPalmInstances } from "../../world/islandWorld.js";
import { buildElevatedTerrain } from "./buildElevatedTerrain.js";

import {
  GROUND_FLOWER_SIZE,
  GROUND_GRASS_SIZE
} from "../../rendering/worldAssets.js";

function toSafeZoneFromPosition(position, radius) {
  return {
    position: [position[0], position[2]],
    radius
  };
}

function buildElevatedTerrainSafeZones() {
  return [
    toSafeZoneFromPosition(ACT_TWO_PLAYER_SPAWN, 24),
    toSafeZoneFromPosition(ACT_TWO_MONSTER_POSITION, 24),
    toSafeZoneFromPosition(ACT_TWO_SQUIRTLE_POSITION, 24),
    { position: [0, 0], radius: 12 },
    ...NPC_DEFS.map((npc) => toSafeZoneFromPosition(npc.position, 8)),
    ...INTERACTABLE_DEFS.map((interactable) => {
      return toSafeZoneFromPosition(interactable.position, interactable.id === "squirtle" ? 24 : 7);
    }),
    ...RESOURCE_NODE_DEFS.map((resourceNode) => toSafeZoneFromPosition(resourceNode.position, 5.5)),
    ...PALM_INSTANCE_LAYOUT.map((palm) => ({
      position: [palm.offset[0], palm.offset[2]],
      radius: 5.5
    })),
    ...OUTPOST_INSTANCE_LAYOUT.map((outpost) => ({
      position: [outpost.offset[0], outpost.offset[2]],
      radius: 9
    })),
    ...DYNAMIC_BARRIERS.map((barrier) => ({
      position: [barrier.position[0], barrier.position[2]],
      radius: barrier.radius + 3
    }))
  ];
}

export function buildWorldLayout(session, assets) {
  const { groundDeadModel, houseModel, palmModel } = assets;
  const groundTileFootprint = Math.max(groundDeadModel.size[0], groundDeadModel.size[2]);
  const groundTileScale = GROUND_TILE_INSTANCE_SCALE;
  const groundTileSpan = groundTileFootprint * groundTileScale;

  session.palmModel = palmModel;
  session.palmInstances = buildPalmInstances(
    houseModel,
    palmModel,
    PALM_INSTANCE_LAYOUT
  );

  session.groundDeadInstances = buildGroundGridInstances({
    worldLimit: WORLD_LIMIT,
    tileFootprint: groundTileFootprint,
    tileHeight: groundDeadModel.size[1]
  });

  session.groundGrassPatches = buildGroundGrassPatches({
    groundInstances: session.groundDeadInstances,
    layout: GROUND_GRASS_LAYOUT,
    defaultSize: GROUND_GRASS_SIZE
  });

  session.groundFlowerPatches = buildGroundFlowerPatches({
    groundInstances: session.groundDeadInstances,
    layout: GROUND_FLOWER_LAYOUT,
    defaultSize: GROUND_FLOWER_SIZE
  });

  const elevatedTerrain = buildElevatedTerrain({
    tileSpan: groundTileSpan,
    tileHeight: groundDeadModel.size[1],
    tileScale: groundTileScale,
    safeZones: buildElevatedTerrainSafeZones()
  });
  session.elevatedTerrainInstances = elevatedTerrain.instances;
  session.elevatedTerrainColliders = elevatedTerrain.colliders;
  session.groundDeadInstances.push(...session.elevatedTerrainInstances);

  session.groundPurifiedInstances = [];
}
