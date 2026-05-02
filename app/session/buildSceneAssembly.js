import {
  NPC_DEFS,
  OUTPOST_INSTANCE_LAYOUT,
  RUINED_POKEMON_CENTER_LAYOUT
} from "../../gameplayContent.js";
import { buildIntroRoomScene } from "../scenes/introRoom/buildIntroRoomScene.js";
import { createFacingStaticController } from "../../world/islandWorld.js";
import { createChopperNpcActor } from "./chopperNpcActor.js";

export function buildSceneAssembly(session, assets) {
  const {
    groundDeadModel,
    groundPurifiedModel,
    houseModel,
    palmModel,
    tallGrassModel,
    deadGrassModel,
    chopperBodyModel,
    chopperPropellerModel,
    playerModel,
    robot1Model,
    robot2Model,
    characterFactory
  } = assets;

  session.sceneObjects = [
    {
      model: groundDeadModel,
      instances: session.groundDeadInstances,
      brightness: 0.75
    },
    {
      model: groundPurifiedModel,
      instances: session.groundPurifiedInstances,
      brightness: 0.75
    }
  ];

  session.deadGrassModel = deadGrassModel;
  session.deadGrassInstances = session.deadGrassInstances || [];

  if (tallGrassModel) {
    session.sceneObjects.push({
      model: tallGrassModel,
      instances: session.tallGrassInstances,
      brightness: 1.06
    });
  }

  if (deadGrassModel) {
    session.sceneObjects.push({
      model: deadGrassModel,
      instances: session.deadGrassInstances,
      brightness: 0.92
    });
  }

  session.sceneObjects.push(
    {
      model: houseModel,
      instances: [
        { offset: [0, 0, 0], scale: 1, yaw: 0 },
        ...OUTPOST_INSTANCE_LAYOUT
      ]
    },
    {
      model: houseModel,
      instances: RUINED_POKEMON_CENTER_LAYOUT,
      brightness: 0.52
    },
    {
      model: palmModel,
      instances: session.palmInstances
    }
  );

  if (session.leppaTree) {
    session.sceneObjects.push(
      {
        model: palmModel,
        instances: [session.leppaTree.deadInstance],
        brightness: 0.42
      },
      {
        model: palmModel,
        instances: [session.leppaTree.aliveInstance],
        brightness: 1
      }
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
      {
        model: chopperBodyModel,
        instances: [session.chopperNpcActor.bodyInstance],
        brightness: 1
      },
      {
        model: chopperPropellerModel,
        instances: [session.chopperNpcActor.propellerInstance],
        brightness: 1
      }
    );
  }

  if (robot1Model && session.actTwoSquirtle?.modelInstance) {
    session.sceneObjects.push({
      model: robot1Model,
      instances: [session.actTwoSquirtle.modelInstance],
      brightness: 1
    });
  }

  if (robot2Model && session.bulbasaurEncounter) {
    session.bulbasaurEncounter.model = robot2Model;
    session.bulbasaurEncounter.modelInstance = {
      offset: session.bulbasaurEncounter.position || [0, 0.04, 0],
      scale: 0.5,
      yaw: 0,
      active: false
    };
    session.sceneObjects.push({
      model: robot2Model,
      instances: [session.bulbasaurEncounter.modelInstance],
      brightness: 1
    });
  }

  if (playerModel && session.playerModelInstance) {
    session.sceneObjects.push({
      model: playerModel,
      instances: [session.playerModelInstance],
      brightness: 1
    });
  }

  session.introRoomScene = buildIntroRoomScene(assets);
}
