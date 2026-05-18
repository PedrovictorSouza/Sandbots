export type ModelAssetId = "tall-grass";

export type ModelAssetKind = "textured-model";

export type TexturedModelAssetDto = {
  id: ModelAssetId;
  kind: ModelAssetKind;
  gltf: string;
  bin: string;
  texture: string;
  normalizedSize?: number;
};

export type ModelAssetDto = TexturedModelAssetDto;


export type TexturedModelAssetDefinition = {
  id: ModelAssetId;
  kind: ModelAssetKind;
  gltfPath: string;
  binPath: string;
  texturePath: string;
  normalizedSize?: number;
};

export type ModelAssetDefinition = TexturedModelAssetDefinition;
