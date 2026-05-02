import {
  loadPicoModel,
  loadTexturedModel
} from "../../../rendering/worldAssets.js";

export async function loadTerrainAssets({ gl, setStatus }) {
  const [
    groundDeadModel,
    groundPurifiedModel,
    houseModel,
    palmModel,
    tallGrassModel,
    deadGrassModel
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
    loadTexturedModel({
      gl,
      gltfPath: "./Trees/tall-grass/tall-grass.gltf",
      binPath: "./Trees/tall-grass/tall-grass.bin",
      texturePath: "./Trees/tall-grass/tall-grass.png",
      normalizedSize: 1.34,
      onStatus: setStatus
    }),
    loadTexturedModel({
      gl,
      gltfPath: "./Trees/Dead-Grass/dead-grass.gltf",
      binPath: "./Trees/Dead-Grass/dead-grass.bin",
      texturePath: "./Trees/Dead-Grass/dead-grass.png",
      normalizedSize: 1.34,
      onStatus: setStatus
    })
  ]);

  return {
    groundDeadModel,
    groundPurifiedModel,
    houseModel,
    palmModel,
    tallGrassModel,
    deadGrassModel
  };
}
