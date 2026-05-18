import { describe, expect, it, vi } from "vitest";
import {
  fetchArrayBufferAsset,
  fetchGltfAsset,
  fetchJsonAsset
} from "../rendering/assetFetch.ts";

describe("assetFetch", () => {
  it("fetches typed JSON assets", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      texture: {
        pixels: ["0"],
        colors: ["#000000"]
      }
    }))) as unknown as typeof fetch;

    await expect(fetchJsonAsset<{ texture: unknown }>("./ground/ground.txt", {
      fetchImpl
    })).resolves.toEqual({
      texture: {
        pixels: ["0"],
        colors: ["#000000"]
      }
    });
    expect(fetchImpl).toHaveBeenCalledWith("./ground/ground.txt");
  });

  it("fetches GLTF assets only when the required shape exists", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      buffers: [{ uri: "model.bin" }],
      meshes: [{ primitives: [] }]
    }))) as unknown as typeof fetch;

    await expect(fetchGltfAsset("./model.gltf", {
      fetchImpl
    })).resolves.toEqual({
      buffers: [{ uri: "model.bin" }],
      meshes: [{ primitives: [] }]
    });
  });

  it("rejects invalid GLTF JSON", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      buffers: []
    }))) as unknown as typeof fetch;

    await expect(fetchGltfAsset("./broken.gltf", {
      fetchImpl
    })).rejects.toThrow("GLTF invalido: ./broken.gltf");
  });

  it("fetches binary asset data", async () => {
    const buffer = new ArrayBuffer(4);
    const fetchImpl = vi.fn(async () => new Response(buffer)) as unknown as typeof fetch;

    await expect(fetchArrayBufferAsset("./model.bin", {
      fetchImpl
    })).resolves.toEqual(buffer);
  });

  it("keeps the existing asset loading error message", async () => {
    const fetchImpl = vi.fn(async () => new Response("", {
      status: 404
    })) as unknown as typeof fetch;

    await expect(fetchJsonAsset("./missing.gltf", {
      fetchImpl
    })).rejects.toThrow("Nao foi possivel carregar ./missing.gltf");
  });
});
