import type {
  ModelAssetDefinition,
  ModelAssetDto,
  ModelAssetId
} from "./modelAssetDto";

const MODEL_ASSET_MANIFEST_URL = new URL("./model-assets.json", import.meta.url).href;
const MODEL_ASSET_IDS: readonly ModelAssetId[] = ["tall-grass"];

type FetchModelAssetDefinitionsOptions = {
  fetchImpl?: typeof fetch;
  manifestUrl?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isModelAssetId(value: unknown): value is ModelAssetId {
  return MODEL_ASSET_IDS.includes(value as ModelAssetId);
}

export function isModelAssetDto(value: unknown): value is ModelAssetDto {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isModelAssetId(value.id) &&
    value.kind === "textured-model" &&
    typeof value.gltf === "string" &&
    typeof value.bin === "string" &&
    typeof value.texture === "string" &&
    (
      value.normalizedSize === undefined ||
      typeof value.normalizedSize === "number"
    )
  );
}

export function mapModelAssetDto(dto: ModelAssetDto): ModelAssetDefinition {
  return {
    id: dto.id,
    kind: dto.kind,
    gltfPath: dto.gltf,
    binPath: dto.bin,
    texturePath: dto.texture,
    normalizedSize: dto.normalizedSize
  };
}

export async function fetchModelAssetDefinitions(
  options: FetchModelAssetDefinitionsOptions = {}
): Promise<ModelAssetDefinition[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const manifestUrl = options.manifestUrl ?? MODEL_ASSET_MANIFEST_URL;
  const response = await fetchImpl(manifestUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch model assets: ${response.status}`);
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data)) {
    throw new Error("Model asset manifest must be an array.");
  }

  return data.map((asset) => {
    if (!isModelAssetDto(asset)) {
      throw new Error("Invalid model asset DTO.");
    }

    return mapModelAssetDto(asset);
  });
}

export async function fetchModelAssetDefinition(
  id: ModelAssetId,
  options: FetchModelAssetDefinitionsOptions = {}
): Promise<ModelAssetDefinition> {
  const assets = await fetchModelAssetDefinitions(options);
  const asset = assets.find((item) => item.id === id);

  if (!asset) {
    throw new Error(`Model asset not found: ${id}`);
  }

  return asset;
}
