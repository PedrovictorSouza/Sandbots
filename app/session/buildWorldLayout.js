import {
  buildGroundFlowerPatches,
  buildGroundGrassPatches,
  buildGroundGridInstances,
  GROUND_TILE_INSTANCE_SCALE,
  partitionColdGroundInstances
} from "../../groundGrid.js";

import {
  DYNAMIC_BARRIERS,
  INTERACTABLE_DEFS,
  NPC_DEFS,
  OUTPOST_INSTANCE_LAYOUT,
  PALM_INSTANCE_LAYOUT,
  LEPPA_TREE_POSITION,
  RUINED_POKEMON_CENTER_LAYOUT,
  RUINED_POKEMON_CENTER_POSITION,
  RESOURCE_NODE_DEFS,
  WORKBENCH_POSITION,
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

const LEPPA_TREE_DEAD_MODEL_FACE_YAW_OFFSET = 0;
const TREE_2_MODEL_FACE_YAW_OFFSET = 0;
const TREE_VARIANT = Object.freeze({
  PALM: "palm",
  TREE_2: "tree2"
});
const TREE_2_CAMP_RADIUS = 38;
const PALM_LOW_SNOW_REGION = Object.freeze({
  minX: 18,
  maxX: 72,
  minZ: -28,
  maxZ: 32
});
const DRY_GRASS_PLANET_COVERAGE_RATIO = 0.01;
const COLD_GROUND_PLANET_COVERAGE_RATIO = 0.8;
const COLD_GROUND_START_REGION_COVERAGE_RATIO = 0.05;
const COLD_GROUND_START_REGION_RADIUS = 35;

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
    toSafeZoneFromPosition(LEPPA_TREE_POSITION, 8),
    { position: [0, 0], radius: 12 },
    ...NPC_DEFS.map((npc) => toSafeZoneFromPosition(npc.position, 8)),
    ...INTERACTABLE_DEFS.map((interactable) => {
      return toSafeZoneFromPosition(interactable.position, interactable.id === "squirtle" ? 24 : 7);
    }),
    ...RESOURCE_NODE_DEFS.map((resourceNode) => toSafeZoneFromPosition(resourceNode.position, 5.5)),
    ...GROUND_FLOWER_LAYOUT.map((flowerPatch) => toSafeZoneFromPosition(flowerPatch.position, 2.6)),
    ...PALM_INSTANCE_LAYOUT.map((palm) => ({
      position: [palm.offset[0], palm.offset[2]],
      radius: 5.5
    })),
    ...OUTPOST_INSTANCE_LAYOUT.map((outpost) => ({
      position: [outpost.offset[0], outpost.offset[2]],
      radius: 9
    })),
    ...RUINED_POKEMON_CENTER_LAYOUT.map((ruin) => ({
      position: [ruin.offset[0], ruin.offset[2]],
      radius: 9
    })),
    ...DYNAMIC_BARRIERS.map((barrier) => ({
      position: [barrier.position[0], barrier.position[2]],
      radius: barrier.radius + 3
    }))
  ];
}

function createBuildingCollider(id, position, size, surfaceY, offset = [0, 0], padding = 0.12) {
  return {
    id,
    position: [
      Number((position[0] + offset[0]).toFixed(4)),
      0,
      Number((position[2] + offset[1]).toFixed(4))
    ],
    size,
    surfaceY,
    blocksPlayer: true,
    padding
  };
}

function buildBuildingColliders() {
  return [
    createBuildingCollider(
      "pokemon-center-workshop-solid-collider",
      RUINED_POKEMON_CENTER_POSITION,
      [7.6, 3.2, 6.2],
      3.2,
      [0, 0.15],
      0.18
    ),
    createBuildingCollider(
      "workbench-solid-collider",
      WORKBENCH_POSITION,
      [7.9, 3.0, 4.5],
      3,
      [0, 0.95],
      0.08
    ),
    createBuildingCollider(
      "workbench-left-side-solid-collider",
      WORKBENCH_POSITION,
      [2.1, 3.0, 2.6],
      3,
      [-2.95, -2.75],
      0.08
    ),
    createBuildingCollider(
      "workbench-right-side-solid-collider",
      WORKBENCH_POSITION,
      [2.1, 3.0, 2.6],
      3,
      [2.95, -2.75],
      0.08
    ),
    createBuildingCollider(
      "workbench-ramp-collider",
      WORKBENCH_POSITION,
      [3.6, 0.16, 2.2],
      0.16,
      [0, -3.0],
      0.04
    )
  ];
}

function isInsidePalmLowSnowRegion(offset) {
  return (
    offset[0] >= PALM_LOW_SNOW_REGION.minX &&
    offset[0] <= PALM_LOW_SNOW_REGION.maxX &&
    offset[2] >= PALM_LOW_SNOW_REGION.minZ &&
    offset[2] <= PALM_LOW_SNOW_REGION.maxZ
  );
}

function isNearCamp(offset) {
  return Math.hypot(
    offset[0] - ACT_TWO_MONSTER_POSITION[0],
    offset[2] - ACT_TWO_MONSTER_POSITION[2]
  ) <= TREE_2_CAMP_RADIUS;
}

function resolveTreeVariant(tree, index) {
  if (isNearCamp(tree.offset)) {
    return TREE_VARIANT.TREE_2;
  }

  if (isInsidePalmLowSnowRegion(tree.offset)) {
    return TREE_VARIANT.PALM;
  }

  return index % 2 === 0 ? TREE_VARIANT.TREE_2 : TREE_VARIANT.PALM;
}

function withTreeVariant(tree, index) {
  const aliveModelKey = resolveTreeVariant(tree, index);
  const yawOffset = aliveModelKey === TREE_VARIANT.TREE_2 ?
    TREE_2_MODEL_FACE_YAW_OFFSET :
    0;

  return {
    ...tree,
    aliveModelKey,
    yaw: (tree.yaw || 0) + yawOffset
  };
}

export function buildWorldLayout(session, assets) {
  const { groundDeadModel, houseModel, palmModel, tallGrassModel, tree2Model } = assets;
  const groundTileFootprint = Math.max(groundDeadModel.size[0], groundDeadModel.size[2]);
  const groundTileScale = GROUND_TILE_INSTANCE_SCALE;
  const groundTileSpan = groundTileFootprint * groundTileScale;
  const terrainSafeZones = buildElevatedTerrainSafeZones();

  session.palmModel = palmModel;
  session.tree2Model = tree2Model;
  session.tallGrassModel = tallGrassModel;
  session.leafageGardenInstances = session.leafageGardenInstances || [];
  session.palmInstances = buildPalmInstances(
    houseModel,
    palmModel,
    PALM_INSTANCE_LAYOUT.map(withTreeVariant)
  );
  session.leppaTree = {
    id: "leppa-tree",
    position: [...LEPPA_TREE_POSITION],
    revived: false,
    berryDropped: false,
    deadInstance: {
      id: "leppa-tree-dead",
      offset: [...LEPPA_TREE_POSITION],
      scale: 0.78,
      yaw: -0.22 + LEPPA_TREE_DEAD_MODEL_FACE_YAW_OFFSET,
      active: false,
      swayStrength: 0
    },
    aliveInstance: {
      id: "leppa-tree-alive",
      offset: [...LEPPA_TREE_POSITION],
      scale: 0.88,
      yaw: -0.22,
      active: false,
      swayStrength: 0.04
    }
  };

  const groundGridInstances = buildGroundGridInstances({
    worldLimit: WORLD_LIMIT,
    tileFootprint: groundTileFootprint,
    tileHeight: groundDeadModel.size[1]
  });
  const partitionedGround = partitionColdGroundInstances(groundGridInstances, {
    coldCoverageRatio: COLD_GROUND_PLANET_COVERAGE_RATIO,
    coverageZones: [{
      position: [ACT_TWO_MONSTER_POSITION[0], ACT_TWO_MONSTER_POSITION[2]],
      radius: COLD_GROUND_START_REGION_RADIUS,
      coverageRatio: COLD_GROUND_START_REGION_COVERAGE_RATIO
    }],
    seed: "small-island-cold-ground"
  });

  session.groundDeadInstances = partitionedGround.deadGroundInstances;
  session.iceGroundInstances = partitionedGround.coldGroundInstances;

  session.groundGrassPatches = buildGroundGrassPatches({
    groundInstances: session.groundDeadInstances,
    layout: GROUND_GRASS_LAYOUT,
    defaultSize: GROUND_GRASS_SIZE,
    coverageRatio: DRY_GRASS_PLANET_COVERAGE_RATIO,
    seed: "small-island-dry-grass-planet"
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
    safeZones: terrainSafeZones
  });
  session.elevatedTerrainInstances = elevatedTerrain.instances;
  session.elevatedTerrainColliders = [
    ...elevatedTerrain.colliders,
    ...buildBuildingColliders()
  ];
  session.groundDeadInstances.push(...session.elevatedTerrainInstances);

  session.groundPurifiedInstances = [];
}
