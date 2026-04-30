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
    chopperBodyModel,
    chopperPropellerModel,
    robot1Model,
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

  if (tallGrassModel) {
    session.sceneObjects.push({
      model: tallGrassModel,
      instances: session.tallGrassInstances,
      brightness: 1.06
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

  session.introRoomScene = buildIntroRoomScene(assets);
}
