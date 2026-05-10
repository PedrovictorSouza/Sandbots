import {
  loadImageAsset,
  loadPicoModel,
  loadTexturedModel
} from "../../../rendering/worldAssets.js";

const WORKBENCH_MODEL_GLTF_PATH = new URL("../../buildings/workbench/workbench.gltf", import.meta.url).href;
const WORKBENCH_MODEL_BIN_PATH = new URL("../../buildings/workbench/workbench.bin", import.meta.url).href;
const WORKBENCH_MODEL_TEXTURE_PATH = new URL("../../buildings/workbench/workbench.png", import.meta.url).href;
const WORKSHOP_MODEL_GLTF_PATH = new URL("../../buildings/workshop/workshop.gltf", import.meta.url).href;
const WORKSHOP_MODEL_BIN_PATH = new URL("../../buildings/workshop/workshop.bin", import.meta.url).href;
const WORKSHOP_MODEL_TEXTURE_PATH = new URL("../../buildings/workshop/workshop.png", import.meta.url).href;
const BOX_MODEL_GLTF_PATH = new URL("../../buildings/Box/box.gltf", import.meta.url).href;
const BOX_MODEL_BIN_PATH = new URL("../../buildings/Box/box.bin", import.meta.url).href;
const BOX_MODEL_TEXTURE_PATH = new URL("../../buildings/Box/box.png", import.meta.url).href;
const CLOUD_MODEL_GLTF_PATH = new URL("../../buildings/cloud/cloud.gltf", import.meta.url).href;
const CLOUD_MODEL_BIN_PATH = new URL("../../buildings/cloud/cloud.bin", import.meta.url).href;
const CLOUD_MODEL_TEXTURE_PATH = new URL("../../buildings/cloud/cloud.png", import.meta.url).href;
const CARBON_ORE_MODEL_GLTF_PATH = new URL("../../Commodities/carbon/carvao.gltf", import.meta.url).href;
const CARBON_ORE_MODEL_BIN_PATH = new URL("../../Commodities/carbon/carvao.bin", import.meta.url).href;
const CARBON_ORE_MODEL_TEXTURE_PATH = new URL("../../Commodities/carbon/carvao.png", import.meta.url).href;
const SOLAR_STATION_MODEL_GLTF_PATH = new URL("../../../Solar-Station/Solar-Station.gltf", import.meta.url).href;
const SOLAR_STATION_MODEL_BIN_PATH = new URL("../../../Solar-Station/Solar-Station.bin", import.meta.url).href;
const SOLAR_STATION_MODEL_TEXTURE_PATH = new URL("../../../Solar-Station/Solar-Station.png", import.meta.url).href;
const TRAIN_HOUSE_MODEL_GLTF_PATH = new URL("../../../Train-house/train-house.gltf", import.meta.url).href;
const TRAIN_HOUSE_MODEL_BIN_PATH = new URL("../../../Train-house/train-house.bin", import.meta.url).href;
const TRAIN_HOUSE_MODEL_TEXTURE_PATH = new URL("../../../Train-house/train-house.png", import.meta.url).href;
const HOUSE_MODEL_GLTF_PATH = new URL("../../../house/house_2.gltf", import.meta.url).href;
const HOUSE_MODEL_TXT_PATH = new URL("../../../house/house_2.txt", import.meta.url).href;
const ICE_GROUND_MODEL_GLTF_PATH = new URL("../../../iceground/iceground.gltf", import.meta.url).href;
const ICE_GROUND_MODEL_BIN_PATH = new URL("../../../iceground/iceground.bin", import.meta.url).href;
const ICE_GROUND_MODEL_TEXTURE_PATH = new URL("../../../iceground/iceground.png", import.meta.url).href;
const GROUND_2_MODEL_GLTF_PATH = new URL("../../../ground-2/ground-2.gltf", import.meta.url).href;
const GROUND_2_MODEL_BIN_PATH = new URL("../../../ground-2/ground-2.bin", import.meta.url).href;
const GROUND_2_MODEL_TEXTURE_PATH = new URL("../../../ground-2/ground-2.png", import.meta.url).href;
const DEAD_TREE_MODEL_GLTF_PATH = new URL("../../../Trees/Dead-Tree/Dead-Tree.gltf", import.meta.url).href;
const DEAD_TREE_MODEL_BIN_PATH = new URL("../../../Trees/Dead-Tree/Dead-Tree.bin", import.meta.url).href;
const DEAD_TREE_MODEL_TEXTURE_PATH = new URL("../../../Trees/Dead-Tree/Dead-Tree.png", import.meta.url).href;
const TREE_2_MODEL_GLTF_PATH = new URL("../../../Trees/tree-2/tree-2.gltf", import.meta.url).href;
const TREE_2_MODEL_BIN_PATH = new URL("../../../Trees/tree-2/tree-2.bin", import.meta.url).href;
const TREE_2_MODEL_TEXTURE_PATH = new URL("../../../Trees/tree-2/tree-2.png", import.meta.url).href;
const GARDEN_1_MODEL_GLTF_PATH = new URL("../../../Trees/Garden-1/garden-1.gltf", import.meta.url).href;
const GARDEN_1_MODEL_BIN_PATH = new URL("../../../Trees/Garden-1/garden-1.bin", import.meta.url).href;
const GARDEN_1_MODEL_TEXTURE_PATH = new URL("../../../Trees/Garden-1/garden-1.png", import.meta.url).href;
const LEAF_DEN_MODEL_GLTF_PATH = new URL("../../../house/house_2.gltf", import.meta.url).href;
const LEAF_DEN_MODEL_BIN_PATH = new URL("../../../house/house_2.bin", import.meta.url).href;
const LEAF_DEN_MODEL_TEXTURE_PATH = new URL("../../../house/house_2.png", import.meta.url).href;
const LEPPA_TREE_DEAD_MODEL_GLTF_PATH = new URL("../../../Trees/Special-tree/Dead-Tree_Special.gltf", import.meta.url).href;
const LEPPA_TREE_DEAD_MODEL_BIN_PATH = new URL("../../../Trees/Special-tree/Dead-Tree_Special.bin", import.meta.url).href;
const LEPPA_TREE_DEAD_MODEL_TEXTURE_PATH = new URL("../../../Trees/Special-tree/Dead-Tree_Special.png", import.meta.url).href;
const LEPPA_TREE_MUSICAL_NOTE_IMAGE_PATHS = [
  new URL("../../../Trees/Special-tree/musical-note-1.png", import.meta.url).href,
  new URL("../../../Trees/Special-tree/musical-note-2.png", import.meta.url).href,
  new URL("../../../Trees/Special-tree/musical-note-3.png", import.meta.url).href
];
const CLOUD_SHADOW_TEXTURE_SIZE = 32;

function getShadowPixelNoise(x, y) {
  const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function createCloudShadowCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = CLOUD_SHADOW_TEXTURE_SIZE;
  canvas.height = CLOUD_SHADOW_TEXTURE_SIZE;

  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = false;

  const center = (CLOUD_SHADOW_TEXTURE_SIZE - 1) * 0.5;
  const radius = CLOUD_SHADOW_TEXTURE_SIZE * 0.47;

  for (let y = 0; y < CLOUD_SHADOW_TEXTURE_SIZE; y += 1) {
    for (let x = 0; x < CLOUD_SHADOW_TEXTURE_SIZE; x += 1) {
      const noise = getShadowPixelNoise(x, y);
      const normalizedX = (x - center) / radius;
      const normalizedY = ((y - center) / radius) / 0.58;
      const distance = Math.hypot(normalizedX, normalizedY);
      const edgeJitter = (noise - 0.5) * 0.162;

      if (distance > 1 + edgeJitter) {
        continue;
      }

      if (distance > 0.56 && ((x * 3 + y * 5 + Math.floor(noise * 7)) % 13 === 0)) {
        continue;
      }

      const core = Math.max(0, 1 - distance);
      const band = Math.floor((core + noise * 0.162) * 5) / 5;
      const alpha = 0.025 + band * 0.095;

      context.fillStyle = `rgba(18, 14, 22, ${alpha})`;
      context.fillRect(x, y, 1, 1);
    }
  }

  return canvas;
}

function createTextureFromCanvas(gl, canvas) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return texture;
}

function createCloudShadowModel(gl) {
  const interleaved = new Float32Array([
    -0.5, 0, -0.5, 0, 0, 0, 1, 0,
    0.5, 0, -0.5, 1, 0, 0, 1, 0,
    -0.5, 0, 0.5, 0, 1, 0, 1, 0,
    0.5, 0, 0.5, 1, 1, 0, 1, 0
  ]);
  const indices = new Uint16Array([0, 2, 1, 1, 2, 3]);
  const vertexBuffer = gl.createBuffer();
  const indexBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, interleaved, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return {
    primitives: [{
      vertexBuffer,
      indexBuffer,
      indexCount: indices.length,
      indexType: gl.UNSIGNED_SHORT
    }],
    texture: createTextureFromCanvas(gl, createCloudShadowCanvas()),
    offset: [0, 0, 0],
    scale: 1,
    size: [1, 0.01, 1]
  };
}

export async function loadTerrainAssets({ gl, setStatus }) {
  const [
    groundDeadModel,
    groundPurifiedModel,
    groundPurifiedAltModel,
    houseModel,
    palmModel,
    tallGrassModel,
    deadGrassModel,
    workbenchModel,
    workshopModel,
    boxModel,
    deadTreeModel,
    tree2Model,
    leppaTreeDeadModel,
    iceGroundModel,
    solarStationModel,
    trainHouseModel,
    carbonOreModel,
    cloudModel,
    garden1Model,
    leafDenModel,
    leppaTreeMusicalNoteImages
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
    loadTexturedModel({
      gl,
      gltfPath: GROUND_2_MODEL_GLTF_PATH,
      binPath: GROUND_2_MODEL_BIN_PATH,
      texturePath: GROUND_2_MODEL_TEXTURE_PATH,
      onStatus: setStatus
    }),
    loadPicoModel({
      gl,
      gltfPath: HOUSE_MODEL_GLTF_PATH,
      txtPath: HOUSE_MODEL_TXT_PATH,
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
    }),
    loadTexturedModel({
      gl,
      gltfPath: WORKBENCH_MODEL_GLTF_PATH,
      binPath: WORKBENCH_MODEL_BIN_PATH,
      texturePath: WORKBENCH_MODEL_TEXTURE_PATH,
      normalizedSize: 2.8,
      onStatus: setStatus
    }),
    loadTexturedModel({
      gl,
      gltfPath: WORKSHOP_MODEL_GLTF_PATH,
      binPath: WORKSHOP_MODEL_BIN_PATH,
      texturePath: WORKSHOP_MODEL_TEXTURE_PATH,
      normalizedSize: 7.2,
      onStatus: setStatus
    }),
    loadTexturedModel({
      gl,
      gltfPath: BOX_MODEL_GLTF_PATH,
      binPath: BOX_MODEL_BIN_PATH,
      texturePath: BOX_MODEL_TEXTURE_PATH,
      normalizedSize: 2.05,
      onStatus: setStatus
    }),
    loadTexturedModel({
      gl,
      gltfPath: DEAD_TREE_MODEL_GLTF_PATH,
      binPath: DEAD_TREE_MODEL_BIN_PATH,
      texturePath: DEAD_TREE_MODEL_TEXTURE_PATH,
      normalizedSize: 4.8,
      onStatus: setStatus
    }),
    loadTexturedModel({
      gl,
      gltfPath: TREE_2_MODEL_GLTF_PATH,
      binPath: TREE_2_MODEL_BIN_PATH,
      texturePath: TREE_2_MODEL_TEXTURE_PATH,
      normalizedSize: 4.8,
      onStatus: setStatus
    }),
    loadTexturedModel({
      gl,
      gltfPath: LEPPA_TREE_DEAD_MODEL_GLTF_PATH,
      binPath: LEPPA_TREE_DEAD_MODEL_BIN_PATH,
      texturePath: LEPPA_TREE_DEAD_MODEL_TEXTURE_PATH,
      normalizedSize: 4.8,
      onStatus: setStatus
    }),
    loadTexturedModel({
      gl,
      gltfPath: ICE_GROUND_MODEL_GLTF_PATH,
      binPath: ICE_GROUND_MODEL_BIN_PATH,
      texturePath: ICE_GROUND_MODEL_TEXTURE_PATH,
      normalizedSize: 3.8,
      onStatus: setStatus
    }),
    loadTexturedModel({
      gl,
      gltfPath: SOLAR_STATION_MODEL_GLTF_PATH,
      binPath: SOLAR_STATION_MODEL_BIN_PATH,
      texturePath: SOLAR_STATION_MODEL_TEXTURE_PATH,
      normalizedSize: 2.3,
      onStatus: setStatus
    }),
    loadTexturedModel({
      gl,
      gltfPath: TRAIN_HOUSE_MODEL_GLTF_PATH,
      binPath: TRAIN_HOUSE_MODEL_BIN_PATH,
      texturePath: TRAIN_HOUSE_MODEL_TEXTURE_PATH,
      normalizedSize: 3.6,
      onStatus: setStatus
    }),
    loadTexturedModel({
      gl,
      gltfPath: CARBON_ORE_MODEL_GLTF_PATH,
      binPath: CARBON_ORE_MODEL_BIN_PATH,
      texturePath: CARBON_ORE_MODEL_TEXTURE_PATH,
      normalizedSize: 1.18,
      onStatus: setStatus
    }),
    loadTexturedModel({
      gl,
      gltfPath: CLOUD_MODEL_GLTF_PATH,
      binPath: CLOUD_MODEL_BIN_PATH,
      texturePath: CLOUD_MODEL_TEXTURE_PATH,
      normalizedSize: 8.8,
      onStatus: setStatus
    }),
    loadTexturedModel({
      gl,
      gltfPath: GARDEN_1_MODEL_GLTF_PATH,
      binPath: GARDEN_1_MODEL_BIN_PATH,
      texturePath: GARDEN_1_MODEL_TEXTURE_PATH,
      normalizedSize: 1.8,
      onStatus: setStatus
    }),
    loadTexturedModel({
      gl,
      gltfPath: LEAF_DEN_MODEL_GLTF_PATH,
      binPath: LEAF_DEN_MODEL_BIN_PATH,
      texturePath: LEAF_DEN_MODEL_TEXTURE_PATH,
      normalizedSize: 2.6,
      onStatus: setStatus
    }),
    Promise.all(LEPPA_TREE_MUSICAL_NOTE_IMAGE_PATHS.map((path) => loadImageAsset(path)))
  ]);

  return {
    groundDeadModel,
    groundPurifiedModel,
    groundPurifiedAltModel,
    houseModel,
    palmModel,
    tallGrassModel,
    deadGrassModel,
    workbenchModel,
    workshopModel,
    boxModel,
    deadTreeModel,
    tree2Model,
    leppaTreeDeadModel,
    iceGroundModel,
    solarStationModel,
    trainHouseModel,
    carbonOreModel,
    cloudModel,
    garden1Model,
    leafDenModel,
    leppaTreeMusicalNoteImages,
    cloudShadowModel: createCloudShadowModel(gl)
  };
}
