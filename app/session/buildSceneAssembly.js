import {
  NPC_DEFS,
  OUTPOST_INSTANCE_LAYOUT,
  RUINED_POKEMON_CENTER_POSITION,
  WORLD_LIMIT,
  WORKBENCH_POSITION
} from "../../gameplayContent.js";
import { buildIntroRoomScene } from "../scenes/introRoom/buildIntroRoomScene.js";
import { createFacingStaticController } from "../../world/islandWorld.js";
import { createChopperNpcActor } from "./chopperNpcActor.js";

const TERRAIN_DRAW_DISTANCE_FROM_CAMERA_TARGET = 42;
const DISTANT_TERRAIN_DRAW_DISTANCE_FROM_CAMERA_TARGET = 160;
const WORKBENCH_MODEL_FACE_YAW_OFFSET = Math.PI;
const WORKBENCH_MODEL_SCALE = 3;
const WORKSHOP_MODEL_FACE_YAW_OFFSET = 0;
const WORKSHOP_BASE_YAW = -0.18;
const WORKSHOP_DISMANTLED_GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const WORKSHOP_DISMANTLED_MIN_RADIUS = 0.936;
const WORKSHOP_DISMANTLED_RADIUS_STEP = 0.338;
const CLOUD_MODEL_FACE_YAW_OFFSET = 0;
const CLOUD_ATMOSPHERE_COUNT = 16;
const CLOUD_ATMOSPHERE_GROUND_Y = 0.075;
const CLOUD_ATMOSPHERE_DRAW_DISTANCE = 190;
const CLOUD_SHADOW_LIGHT_OFFSET_X = -1.4;
const CLOUD_SHADOW_LIGHT_OFFSET_Z = 2.15;
const PLAYER_DUST_CLOUD_DRAW_DISTANCE = 34;
const PLAYER_DUST_CLOUD_BRIGHTNESS = 0.94;
const BEE_FIELD_DRAW_DISTANCE = 72;

function withTerrainSupportDrawDistance(sceneObject) {
  return {
    ...sceneObject,
    terrainSupportDrawDistanceFromCameraTarget: TERRAIN_DRAW_DISTANCE_FROM_CAMERA_TARGET
  };
}

function createSinglePrimitiveModel(model, primitive) {
  return {
    primitives: [primitive],
    texture: model.texture,
    offset: model.offset,
    scale: model.scale,
    size: model.size
  };
}

function createDismantledWorkshopInstance(index) {
  const angle = index * WORKSHOP_DISMANTLED_GOLDEN_ANGLE;
  const radius = WORKSHOP_DISMANTLED_MIN_RADIUS + (index % 7) * WORKSHOP_DISMANTLED_RADIUS_STEP;
  const yawJitter = ((index % 5) - 2) * 0.1;

  return {
    id: `pokemon-center-workshop-part-${index}`,
    offset: [
      RUINED_POKEMON_CENTER_POSITION[0] + Math.cos(angle) * radius,
      RUINED_POKEMON_CENTER_POSITION[1] + 0.02,
      RUINED_POKEMON_CENTER_POSITION[2] + Math.sin(angle) * radius
    ],
    scale: 1,
    yaw: WORKSHOP_BASE_YAW + WORKSHOP_MODEL_FACE_YAW_OFFSET + yawJitter,
    pitch: ((index % 3) - 1) * 0.06,
    roll: ((index % 4) - 1.5) * 0.05,
    active: true
  };
}

function createCloudAtmosphereSeed(index) {
  const radiusStep = WORLD_LIMIT * 0.085;
  const baseRadius = WORLD_LIMIT * 0.38 + (index % 5) * radiusStep;
  const angle = (index / CLOUD_ATMOSPHERE_COUNT) * Math.PI * 2 + (index % 3) * 0.17;
  const scale = 0.78 + (index % 4) * 0.13;

  return {
    angle,
    baseRadius,
    radialDrift: 1.8 + (index % 3) * 0.65,
    radialSpeed: 0.025 + (index % 4) * 0.004,
    baseY: 15.8 + (index % 5) * 1.9,
    bobHeight: 0.5 + (index % 3) * 0.16,
    bobSpeed: 0.18 + (index % 4) * 0.025,
    angularSpeed: 0.0048 + (index % 5) * 0.00055,
    phase: index * 1.73,
    scale,
    shadowScale: scale * (6.4 + (index % 3) * 0.55),
    yawOffset: CLOUD_MODEL_FACE_YAW_OFFSET
  };
}

function syncCloudAtmosphereEntry(entry, elapsed) {
  const angle = entry.angle + elapsed * entry.angularSpeed;
  const radius = entry.baseRadius +
    Math.sin(elapsed * entry.radialSpeed + entry.phase) * entry.radialDrift;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  const y = entry.baseY + Math.sin(elapsed * entry.bobSpeed + entry.phase) * entry.bobHeight;

  entry.instance.offset[0] = x;
  entry.instance.offset[1] = y;
  entry.instance.offset[2] = z;
  entry.instance.yaw = angle + entry.yawOffset + Math.sin(elapsed * 0.08 + entry.phase) * 0.08;
  entry.instance.roll = Math.sin(elapsed * 0.14 + entry.phase) * 0.035;
  entry.instance.swayStrength = Math.sin(elapsed * 0.2 + entry.phase) * 0.02;

  entry.shadowInstance.offset[0] = x + CLOUD_SHADOW_LIGHT_OFFSET_X;
  entry.shadowInstance.offset[1] = CLOUD_ATMOSPHERE_GROUND_Y;
  entry.shadowInstance.offset[2] = z + CLOUD_SHADOW_LIGHT_OFFSET_Z;
  entry.shadowInstance.scale = entry.shadowScale;
  entry.shadowInstance.yaw = angle + entry.yawOffset;
}

function createCloudAtmosphere() {
  const clouds = Array.from({ length: CLOUD_ATMOSPHERE_COUNT }, (_, index) => {
    const seed = createCloudAtmosphereSeed(index);
    return {
      ...seed,
      instance: {
        id: `atmosphere-cloud-${index}`,
        offset: [0, seed.baseY, 0],
        scale: seed.scale,
        yaw: seed.angle + seed.yawOffset,
        pitch: 0,
        roll: 0,
        active: true,
        swayStrength: 0
      },
      shadowInstance: {
        id: `atmosphere-cloud-shadow-${index}`,
        offset: [0, CLOUD_ATMOSPHERE_GROUND_Y, 0],
        scale: seed.shadowScale,
        yaw: seed.angle + seed.yawOffset,
        pitch: 0,
        roll: 0,
        active: true
      }
    };
  });
  const atmosphere = {
    elapsed: 0,
    clouds,
    cloudInstances: clouds.map((cloud) => cloud.instance),
    shadowInstances: clouds.map((cloud) => cloud.shadowInstance),
    update(deltaTime = 0) {
      this.elapsed += Math.max(0, Number(deltaTime) || 0);
      this.clouds.forEach((cloud) => syncCloudAtmosphereEntry(cloud, this.elapsed));
    }
  };

  atmosphere.update(0);
  return atmosphere;
}

export function buildSceneAssembly(session, assets) {
  const {
    groundDeadModel,
    groundPurifiedModel,
    houseModel,
    palmModel,
    deadTreeModel,
    leppaTreeDeadModel,
    tallGrassModel,
    deadGrassModel,
    workbenchModel,
    workshopModel,
    boxModel,
    cloudModel,
    cloudShadowModel,
    chopperBodyModel,
    chopperPropellerModel,
    playerModel,
    robot1Model,
    robot2Model,
    beeModel,
    gameplayOpeningShipModel,
    characterFactory
  } = assets;

  session.sceneObjects = [
    {
      model: groundDeadModel,
      instances: session.groundDeadInstances,
      brightness: 0.75,
      drawDistanceFromCameraTarget: TERRAIN_DRAW_DISTANCE_FROM_CAMERA_TARGET,
      distantTerrainDrawDistanceFromCameraTarget: DISTANT_TERRAIN_DRAW_DISTANCE_FROM_CAMERA_TARGET
    },
    withTerrainSupportDrawDistance({
      model: groundPurifiedModel,
      instances: session.groundPurifiedInstances,
      brightness: 0.75
    })
  ];

  session.deadGrassModel = deadGrassModel;
  session.deadGrassInstances = session.deadGrassInstances || [];

  if (cloudModel && cloudShadowModel) {
    session.cloudAtmosphere = createCloudAtmosphere();
    session.updateCloudAtmosphere = (deltaTime) => session.cloudAtmosphere.update(deltaTime);
    session.sceneObjects.push({
      model: cloudShadowModel,
      instances: session.cloudAtmosphere.shadowInstances,
      brightness: 1,
      drawDistanceFromCameraTarget: CLOUD_ATMOSPHERE_DRAW_DISTANCE
    });
  }

  if (tallGrassModel) {
    session.sceneObjects.push(withTerrainSupportDrawDistance({
      model: tallGrassModel,
      instances: session.tallGrassInstances,
      brightness: 1.06
    }));
  }

  if (deadGrassModel) {
    session.sceneObjects.push(withTerrainSupportDrawDistance({
      model: deadGrassModel,
      instances: session.deadGrassInstances,
      brightness: 0.92
    }));
  }

  session.sceneObjects.push(
    withTerrainSupportDrawDistance({
      model: houseModel,
      instances: [
        { offset: [0, 0, 0], scale: 1, yaw: 0 },
        ...OUTPOST_INSTANCE_LAYOUT
      ]
    })
  );

  if (deadTreeModel) {
    session.sceneObjects.push(withTerrainSupportDrawDistance({
      model: deadTreeModel,
      instances: session.palmInstances.map((instance) => instance.deadInstance || instance),
      brightness: 0.78
    }));
  }

  if (palmModel) {
    session.sceneObjects.push(withTerrainSupportDrawDistance({
      model: palmModel,
      instances: session.palmInstances.map((instance) => instance.aliveInstance || instance)
    }));
  }

  if (workbenchModel) {
    session.workbenchModelInstance = {
      id: "workbench-model",
      offset: [...WORKBENCH_POSITION],
      scale: WORKBENCH_MODEL_SCALE,
      yaw: WORKBENCH_MODEL_FACE_YAW_OFFSET
    };
    session.sceneObjects.push(withTerrainSupportDrawDistance({
      model: workbenchModel,
      instances: [session.workbenchModelInstance],
      brightness: 1
    }));
  }

  if (workshopModel) {
    session.pokemonCenterWorkshopAssembledInstance = {
      id: "pokemon-center-workshop-assembled",
      offset: [...RUINED_POKEMON_CENTER_POSITION],
      scale: 1,
      yaw: WORKSHOP_BASE_YAW + WORKSHOP_MODEL_FACE_YAW_OFFSET,
      active: false
    };
    session.pokemonCenterWorkshopDismantledInstances = workshopModel.primitives.map((_, index) => {
      return createDismantledWorkshopInstance(index);
    });

    session.sceneObjects.push(withTerrainSupportDrawDistance({
      model: workshopModel,
      instances: [session.pokemonCenterWorkshopAssembledInstance],
      brightness: 1
    }));

    workshopModel.primitives.forEach((primitive, index) => {
      session.sceneObjects.push(withTerrainSupportDrawDistance({
        model: createSinglePrimitiveModel(workshopModel, primitive),
        instances: [session.pokemonCenterWorkshopDismantledInstances[index]],
        brightness: 0.62
      }));
    });
  }

  if (session.leppaTree) {
    session.sceneObjects.push(
      withTerrainSupportDrawDistance({
        model: leppaTreeDeadModel || deadTreeModel || palmModel,
        instances: [session.leppaTree.deadInstance],
        brightness: 0.42
      }),
      withTerrainSupportDrawDistance({
        model: palmModel,
        instances: [session.leppaTree.aliveInstance],
        brightness: 1
      })
    );
  }

  session.npcActors = NPC_DEFS.map((npc) => ({
    ...npc,
    character: characterFactory.createCharacter({
      id: npc.id,
      position: npc.position,
      speed: 0,
      worldHeight: 1.55,
      controller: createFacingStaticController(npc.facing),
      collisionTest: null
    })
  }));

  const tangrowthActor = session.npcActors.find((npcActor) => npcActor.id === "tangrowth");

  if (tangrowthActor && chopperBodyModel && chopperPropellerModel) {
    session.chopperNpcActor = createChopperNpcActor({
      npcActor: tangrowthActor
    });
    session.sceneObjects.push(
      withTerrainSupportDrawDistance({
        model: chopperBodyModel,
        instances: [session.chopperNpcActor.bodyInstance],
        brightness: 1
      }),
      withTerrainSupportDrawDistance({
        model: chopperPropellerModel,
        instances: [session.chopperNpcActor.propellerInstance],
        brightness: 1
      })
    );
  }

  if (robot1Model && session.actTwoSquirtle?.modelInstance) {
    session.sceneObjects.push(withTerrainSupportDrawDistance({
      model: robot1Model,
      instances: [session.actTwoSquirtle.modelInstance],
      brightness: 1
    }));
  }

  const robotRepairModuleModel = boxModel || gameplayOpeningShipModel;

  if (robotRepairModuleModel && session.robotRepairModuleInstances?.length) {
    session.sceneObjects.push(withTerrainSupportDrawDistance({
      model: robotRepairModuleModel,
      instances: session.robotRepairModuleInstances,
      brightness: 0.9
    }));
  }

  if (robot2Model && session.bulbasaurEncounter) {
    session.bulbasaurEncounter.model = robot2Model;
    session.bulbasaurEncounter.modelInstance = {
      offset: session.bulbasaurEncounter.position || [0, 0.04, 0],
      scale: 0.5,
      yaw: 0,
      active: false
    };
    session.sceneObjects.push(withTerrainSupportDrawDistance({
      model: robot2Model,
      instances: [session.bulbasaurEncounter.modelInstance],
      brightness: 1
    }));
  }

  session.beeModel = beeModel;
  session.beeInstances ||= [];

  if (beeModel) {
    session.sceneObjects.push({
      model: beeModel,
      instances: session.beeInstances,
      brightness: 1.08,
      drawDistanceFromCameraTarget: BEE_FIELD_DRAW_DISTANCE
    });
  }

  if (playerModel && session.playerModelInstance) {
    session.sceneObjects.push(withTerrainSupportDrawDistance({
      model: playerModel,
      instances: [session.playerModelInstance],
      brightness: 1
    }));
  }

  if (cloudModel && session.playerDust?.particles) {
    session.sceneObjects.push({
      model: cloudModel,
      instances: session.playerDust.particles,
      brightness: PLAYER_DUST_CLOUD_BRIGHTNESS,
      drawDistanceFromCameraTarget: PLAYER_DUST_CLOUD_DRAW_DISTANCE
    });
  }

  if (cloudModel && session.cloudAtmosphere) {
    session.sceneObjects.push({
      model: cloudModel,
      instances: session.cloudAtmosphere.cloudInstances,
      brightness: 1.08,
      drawDistanceFromCameraTarget: CLOUD_ATMOSPHERE_DRAW_DISTANCE
    });
  }

  session.introRoomScene = buildIntroRoomScene(assets);
}
