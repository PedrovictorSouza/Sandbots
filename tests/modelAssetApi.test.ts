import { describe, expect, it, vi } from "vitest";
import {
  fetchModelAssetDefinition,
  fetchModelAssetDefinitions,
  isModelAssetDto,
  mapModelAssetDto
} from "../app/session/assets/modelAssetApi.ts";

const tallGrassDto = {
  id: "tall-grass",
  kind: "textured-model",
  gltf: "./Trees/tall-grass/tall-grass.gltf",
  bin: "./Trees/tall-grass/tall-grass.bin",
  texture: "./Trees/tall-grass/tall-grass.png",
  normalizedSize: 1.34
} as const;

describe("modelAssetApi", () => {
  it("validates the tall grass DTO shape", () => {
    expect(isModelAssetDto(tallGrassDto)).toBe(true);
    expect(isModelAssetDto({
      ...tallGrassDto,
      gltf: 123
    })).toBe(false);
  });

  it("maps raw DTO asset paths to the internal loader definition", () => {
    expect(mapModelAssetDto(tallGrassDto)).toEqual({
      id: "tall-grass",
      kind: "textured-model",
      gltfPath: "./Trees/tall-grass/tall-grass.gltf",
      binPath: "./Trees/tall-grass/tall-grass.bin",
      texturePath: "./Trees/tall-grass/tall-grass.png",
      normalizedSize: 1.34
    });
  });

  it("fetches and maps the model asset manifest", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify([
      tallGrassDto
    ]))) as unknown as typeof fetch;

    await expect(fetchModelAssetDefinitions({
      fetchImpl,
      manifestUrl: "/assets/model-assets.json"
    })).resolves.toEqual([{
      id: "tall-grass",
      kind: "textured-model",
      gltfPath: "./Trees/tall-grass/tall-grass.gltf",
      binPath: "./Trees/tall-grass/tall-grass.bin",
      texturePath: "./Trees/tall-grass/tall-grass.png",
      normalizedSize: 1.34
    }]);
    expect(fetchImpl).toHaveBeenCalledWith("/assets/model-assets.json");
  });

  it("fetches one model asset definition by id", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify([
      tallGrassDto
    ]))) as unknown as typeof fetch;

    await expect(fetchModelAssetDefinition("tall-grass", {
      fetchImpl,
      manifestUrl: "/assets/model-assets.json"
    })).resolves.toEqual({
      id: "tall-grass",
      kind: "textured-model",
      gltfPath: "./Trees/tall-grass/tall-grass.gltf",
      binPath: "./Trees/tall-grass/tall-grass.bin",
      texturePath: "./Trees/tall-grass/tall-grass.png",
      normalizedSize: 1.34
    });
  });

  it("rejects malformed manifests before they reach terrain loaders", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      id: "tall-grass"
    }))) as unknown as typeof fetch;

    await expect(fetchModelAssetDefinitions({
      fetchImpl,
      manifestUrl: "/assets/model-assets.json"
    })).rejects.toThrow("Model asset manifest must be an array.");
  });

  it("rejects malformed asset DTOs", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify([{
      ...tallGrassDto,
      normalizedSize: "large"
    }]))) as unknown as typeof fetch;

    await expect(fetchModelAssetDefinitions({
      fetchImpl,
      manifestUrl: "/assets/model-assets.json"
    })).rejects.toThrow("Invalid model asset DTO.");
  });
});
