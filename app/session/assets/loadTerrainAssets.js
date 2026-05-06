import {
  loadPicoModel,
  loadTexturedModel
} from "../../../rendering/worldAssets.js";

const WORKBENCH_MODEL_GLTF_PATH = new URL("../../buildings/workbench/workbench.gltf", import.meta.url).href;
const WORKBENCH_MODEL_BIN_PATH = new URL("../../buildings/workbench/workbench.bin", import.meta.url).href;
const WORKBENCH_MODEL_TEXTURE_PATH = new URL("../../buildings/workbench/workbench.png", import.meta.url).href;
const WORKSHOP_MODEL_GLTF_PATH = new URL("../../buildings/workshop/workshop.gltf", import.meta.url).href;
const WORKSHOP_MODEL_BIN_PATH = new URL("../../buildings/workshop/workshop.bin", import.meta.url).href;
const WORKSHOP_MODEL_TEXTURE_PATH = new URL("../../buildings/workshop/workshop.png", import.meta.url).href;
const CLOUD_MODEL_GLTF_PATH = new URL("../../buildings/cloud/cloud.gltf", import.meta.url).href;
const CLOUD_MODEL_BIN_PATH = new URL("../../buildings/cloud/cloud.bin", import.meta.url).href;
const CLOUD_MODEL_TEXTURE_PATH = new URL("../../buildings/cloud/cloud.png", import.meta.url).href;
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
    houseModel,
    palmModel,
    tallGrassModel,
    deadGrassModel,
    workbenchModel,
    workshopModel,
    cloudModel
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
      gltfPath: CLOUD_MODEL_GLTF_PATH,
      binPath: CLOUD_MODEL_BIN_PATH,
      texturePath: CLOUD_MODEL_TEXTURE_PATH,
      normalizedSize: 8.8,
      onStatus: setStatus
    })
  ]);

  return {
    groundDeadModel,
    groundPurifiedModel,
    houseModel,
    palmModel,
    tallGrassModel,
    deadGrassModel,
    workbenchModel,
    workshopModel,
    cloudModel,
    cloudShadowModel: createCloudShadowModel(gl)
  };
}
