import { loadTexturedModel } from "../../../rendering/worldAssets.js";
import { createFilteredGltfUrl } from "../../../rendering/createFilteredGltfUrl.js";

function normalizePartFilter(filter) {
  if (Array.isArray(filter)) {
    return { includeNodes: filter };
  }

  return filter || {};
}

function alignPartModelToBase(partModel, baseModel) {
  if (!partModel || !baseModel) {
    return;
  }

  partModel.offset = [...baseModel.offset];
  partModel.scale = baseModel.scale;
}

function revokeObjectUrl(url) {
  if (typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") {
    URL.revokeObjectURL(url);
  }
}

export async function loadSegmentedGltfModel({
  gl,
  gltfPath,
  binPath = null,
  texturePath = null,
  normalizedSize = 3.8,
  parts = {},
  loadBaseModel = true,
  onStatus
}) {
  const partEntries = Object.entries(parts);

  const partUrlEntries = await Promise.all(
    partEntries.map(async ([partKey, filter]) => [
      partKey,
      await createFilteredGltfUrl(gltfPath, normalizePartFilter(filter))
    ])
  );

  const baseModelPromise = loadBaseModel ?
    loadTexturedModel({
      gl,
      gltfPath,
      binPath,
      texturePath,
      normalizedSize,
      onStatus
    }) :
    Promise.resolve(null);

  const partModelEntriesPromise = Promise.all(
    partUrlEntries.map(async ([partKey, partGltfUrl]) => {
      try {
        const model = await loadTexturedModel({
          gl,
          gltfPath: partGltfUrl,
          binPath,
          texturePath,
          normalizedSize,
          onStatus
        });

        return [partKey, model];
      } finally {
        revokeObjectUrl(partGltfUrl);
      }
    })
  );

  const [baseModel, partModelEntries] = await Promise.all([
    baseModelPromise,
    partModelEntriesPromise
  ]);
  const partModels = Object.fromEntries(partModelEntries);

  for (const partModel of Object.values(partModels)) {
    alignPartModelToBase(partModel, baseModel);
  }

  return {
    baseModel,
    partModels
  };
}
