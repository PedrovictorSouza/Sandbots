import { createCharacterFactory } from "../../../characterFactory.js";
import { loadTexturedModel } from "../../../rendering/worldAssets.js";
import { loadChopperAssets } from "../../characters/chopper/loadChopperAssets.js";

export async function loadCharacterAssets({ gl, setStatus }) {
  const [
    chopperAssets,
    robot1Model,
    characterFactory
  ] = await Promise.all([
    loadChopperAssets({ gl, setStatus }),
    loadTexturedModel({
      gl,
      gltfPath: "./Character/Robot-1/robot-1.gltf",
      binPath: "./Character/Robot-1/robot-1.bin",
      texturePath: "./Character/Robot-1/robot-1.png",
      normalizedSize: 1.65,
      onStatus: setStatus
    }),
    createCharacterFactory({
      spriteSheetUrl: "./Character/player-spritesheet.png",
      idleUrl: "./Character/player-idle.png"
    })
  ]);

  return {
    ...chopperAssets,
    robot1Model,
    characterFactory,
    characterPartLibraries: {
      chopper: chopperAssets.chopperParts
    }
  };
}
