import { loadSegmentedGltfModel } from "../shared/loadSegmentedGltfModel.js";

const CHOPPER_GLTF_PATH = "./Character/Chopper/chopper.gltf";
const CHOPPER_BIN_PATH = "./Character/Chopper/chopper.bin";
const CHOPPER_TEXTURE_PATH = "./Character/Chopper/chopper.png";
const CHOPPER_NORMALIZED_SIZE = 2.45;

export const CHOPPER_PART_FILTERS = {
  body: {
    excludeNodes: [3],
    excludeNodeNames: ["propeller"]
  },
  propeller: {
    includeNodes: [3],
    includeNodeNames: ["propeller"]
  }
};

export async function loadChopperAssets({ gl, setStatus }) {
  const { baseModel, partModels } = await loadSegmentedGltfModel({
    gl,
    gltfPath: CHOPPER_GLTF_PATH,
    binPath: CHOPPER_BIN_PATH,
    texturePath: CHOPPER_TEXTURE_PATH,
    normalizedSize: CHOPPER_NORMALIZED_SIZE,
    parts: CHOPPER_PART_FILTERS,
    onStatus: setStatus
  });

  return {
    chopperModel: baseModel,
    chopperBodyModel: partModels.body,
    chopperPropellerModel: partModels.propeller,
    chopperParts: partModels
  };
}
