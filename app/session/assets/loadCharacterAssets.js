import { createCharacterFactory } from "../../../characterFactory.js";
import { loadImageAsset, loadTexturedModel } from "../../../rendering/worldAssets.js";
import { loadChopperAssets } from "../../characters/chopper/loadChopperAssets.js";

const BROKEN_MODULE_GLTF_PATH = "./Character/Broken-module/unnamed_7.gltf";
const BROKEN_MODULE_BIN_PATH = "./Character/Broken-module/unnamed_7.bin";
const BROKEN_MODULE_TEXTURE_PATH = "./Character/Broken-module/unnamed_7.png";
const BILL_IMAGE_PATH = new URL("../../characters/bill/bill.png", import.meta.url).href;
const PLAYER_MODEL_GLTF_PATH = new URL("../../characters/player/player.gltf", import.meta.url).href;
const PLAYER_MODEL_BIN_PATH = new URL("../../characters/player/player.bin", import.meta.url).href;
const PLAYER_MODEL_TEXTURE_PATH = new URL("../../characters/player/player.png", import.meta.url).href;
const ROBOT_2_MODEL_GLTF_PATH = new URL("../../characters/Robot-2/robot-2.gltf", import.meta.url).href;
const ROBOT_2_MODEL_BIN_PATH = new URL("../../characters/Robot-2/robot-2.bin", import.meta.url).href;
const ROBOT_2_MODEL_TEXTURE_PATH = new URL("../../characters/Robot-2/robot-2.png", import.meta.url).href;

export async function loadCharacterAssets({ gl, setStatus }) {
  const [
    chopperAssets,
    robot1Model,
    robot2Model,
    gameplayOpeningShipModel,
    playerModel,
    billImage,
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
      gltfPath: ROBOT_2_MODEL_GLTF_PATH,
      binPath: ROBOT_2_MODEL_BIN_PATH,
      texturePath: ROBOT_2_MODEL_TEXTURE_PATH,
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
    loadTexturedModel({
      gl,
      gltfPath: PLAYER_MODEL_GLTF_PATH,
      binPath: PLAYER_MODEL_BIN_PATH,
      texturePath: PLAYER_MODEL_TEXTURE_PATH,
      normalizedSize: 1.65,
      onStatus: setStatus
    }),
    loadImageAsset(BILL_IMAGE_PATH),
    createCharacterFactory({
      spriteSheetUrl: "./Character/player-spritesheet.png",
      idleUrl: "./Character/player-idle.png"
    })
  ]);

  return {
    ...chopperAssets,
    robot1Model,
    robot2Model,
    gameplayOpeningShipModel,
    playerModel,
    billImage,
    characterFactory,
    characterPartLibraries: {
      chopper: chopperAssets.chopperParts
    }
  };
}
