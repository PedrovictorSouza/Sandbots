import { loadImageAsset } from "../../../rendering/worldAssets.js";

const SKY_IMAGE_PATHS = [
  "./dist/assets/sky.png",
  "./assets/sky.png"
];

async function loadSkyImageAsset() {
  let lastError = null;

  for (const path of SKY_IMAGE_PATHS) {
    try {
      return await loadImageAsset(path);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Nao foi possivel carregar o ceu.");
}

export async function loadPropAssets() {
  const [
    woodImage,
    skyImage
  ] = await Promise.all([
    loadImageAsset("./Objects/wood.png"),
    loadSkyImageAsset()
  ]);

  return {
    woodImage,
    skyImage
  };
}
