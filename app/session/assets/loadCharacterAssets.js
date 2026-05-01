import { createCharacterFactory } from "../../../characterFactory.js";
import { loadTexturedModel } from "../../../rendering/worldAssets.js";
import { loadChopperAssets } from "../../characters/chopper/loadChopperAssets.js";

const BROKEN_MODULE_GLTF_PATH = "./Character/Broken-module/unnamed_7.gltf";
const BROKEN_MODULE_BIN_PATH = "./Character/Broken-module/unnamed_7.bin";
const BROKEN_MODULE_TEXTURE_PATH = "./Character/Broken-module/unnamed_7.png";

export async function loadCharacterAssets({ gl, setStatus }) {
  const [
    chopperAssets,
    robot1Model,
    gameplayOpeningShipModel,
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
    loadTexturedModel({
      gl,
      gltfPath: BROKEN_MODULE_GLTF_PATH,
      binPath: BROKEN_MODULE_BIN_PATH,
      texturePath: BROKEN_MODULE_TEXTURE_PATH,
      normalizedSize: 2.05,
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
    gameplayOpeningShipModel,
    characterFactory,
    characterPartLibraries: {
      chopper: chopperAssets.chopperParts
    }
  };
}
