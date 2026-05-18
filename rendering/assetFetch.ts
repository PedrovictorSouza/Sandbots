export type AssetPath = string;

export type GltfBufferDto = {
  uri: string;
};

export type GltfImageDto = {
  uri?: string;
};

export type GltfTextureDto = {
  source?: number;
};

export type GltfPrimitiveDto = {
  attributes: Record<string, number>;
  indices: number;
};

export type GltfMeshDto = {
  primitives: GltfPrimitiveDto[];
};

export type GltfAssetDto = {
  buffers: GltfBufferDto[];
  images?: GltfImageDto[];
  textures?: GltfTextureDto[];
  meshes: GltfMeshDto[];
  [key: string]: unknown;
};

export type AssetFetchOptions = {
  fetchImpl?: typeof fetch;
};

function resolveFetch(fetchImpl?: typeof fetch): typeof fetch {
  return fetchImpl || globalThis.fetch.bind(globalThis);
}

function assertFetchOk(response: Response, assetPath: AssetPath): void {
  if (!response.ok) {
    throw new Error(`Nao foi possivel carregar ${assetPath}`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isGltfAssetDto(value: unknown): value is GltfAssetDto {
  if (!isRecord(value)) {
    return false;
  }

  return Array.isArray(value.buffers) && Array.isArray(value.meshes);
}

export async function fetchJsonAsset<T = unknown>(
  assetPath: AssetPath,
  options: AssetFetchOptions = {}
): Promise<T> {
  const response = await resolveFetch(options.fetchImpl)(assetPath);
  assertFetchOk(response, assetPath);

  return response.json() as Promise<T>;
}

export async function fetchArrayBufferAsset(
  assetPath: AssetPath,
  options: AssetFetchOptions = {}
): Promise<ArrayBuffer> {
  const response = await resolveFetch(options.fetchImpl)(assetPath);
  assertFetchOk(response, assetPath);

  return response.arrayBuffer();
}

export async function fetchGltfAsset(
  assetPath: AssetPath,
  options: AssetFetchOptions = {}
): Promise<GltfAssetDto> {
  const gltf = await fetchJsonAsset<unknown>(assetPath, options);

  if (!isGltfAssetDto(gltf)) {
    throw new Error(`GLTF invalido: ${assetPath}`);
  }

  return gltf;
}
