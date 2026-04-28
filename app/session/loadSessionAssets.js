import { loadPicoModel, loadImageAsset, loadTexturedModel } from "../../rendering/worldAssets.js";
import { createCharacterFactory } from "../../characterFactory.js";
import { createFilteredGltfUrl } from "../../rendering/createFilteredGltfUrl.js";

export async function loadSessionAssets({ gl, setStatus }) {
  setStatus("Carregando assets...");

  const [chopperBodyGltfUrl, chopperPropellerGltfUrl] = await Promise.all([
    createFilteredGltfUrl("./Character/Chopper/chopper.gltf", {
      excludeNodes: [3]
    }),
    createFilteredGltfUrl("./Character/Chopper/chopper.gltf", {
      includeNodes: [3]
    })
  ]);

  const [
    groundDeadModel,
    groundPurifiedModel,
    houseModel,
    palmModel,
    chopperModel,
    chopperBodyModel,
    chopperPropellerModel,
    robot1Model,
    characterFactory,
    woodImage
  ] = await Promise.all([
    loadPicoModel({
      gl,
      gltfPath: "./ground/ground-dead.gltf",
      txtPath: "./ground/ground-dead.txt",
      onStatus: setStatus
    }),
    loadPicoModel({
      gl,
      gltfPath: "./ground/ground.gltf",
      txtPath: "./ground/ground.txt",
      onStatus: setStatus
    }),
    loadPicoModel({
      gl,
      gltfPath: "./house_2.gltf",
      txtPath: "./house_2.txt",
      onStatus: setStatus
    }),
    loadPicoModel({
      gl,
      gltfPath: "./Trees/PalmTree/plamTree.gltf",
      txtPath: "./Trees/PalmTree/plamTree.txt",
      onStatus: setStatus
    }),

    // Modelo original, mantido por enquanto para não quebrar o resto.
    loadTexturedModel({
      gl,
      gltfPath: "./Character/Chopper/chopper.gltf",
      binPath: "./Character/Chopper/chopper.bin",
      texturePath: "./Character/Chopper/chopper.png",
      normalizedSize: 2.45,
      onStatus: setStatus
    }),

    // Chopper sem hélice.
    loadTexturedModel({
      gl,
      gltfPath: chopperBodyGltfUrl,
      binPath: "./Character/Chopper/chopper.bin",
      texturePath: "./Character/Chopper/chopper.png",
      normalizedSize: 2.45,
      onStatus: setStatus
    }),

    // Só a hélice.
    loadTexturedModel({
      gl,
      gltfPath: chopperPropellerGltfUrl,
      binPath: "./Character/Chopper/chopper.bin",
      texturePath: "./Character/Chopper/chopper.png",
      normalizedSize: 2.45,
      onStatus: setStatus
    }),

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
    }),

    loadImageAsset("./Objects/wood.png")
  ]);

  chopperBodyModel.offset = [...chopperModel.offset];
  chopperBodyModel.scale = chopperModel.scale;

  chopperPropellerModel.offset = [...chopperModel.offset];
  chopperPropellerModel.scale = chopperModel.scale;

  return {
    groundDeadModel,
    groundPurifiedModel,
    houseModel,
    palmModel,

    // Antigo.
    chopperModel,

    // Novos.
    chopperBodyModel,
    chopperPropellerModel,
    robot1Model,

    characterFactory,
    woodImage
  };
}
