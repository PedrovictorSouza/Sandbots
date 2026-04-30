import { describe, expect, it } from "vitest";
import { resolveFilteredSceneNodeIndices } from "../rendering/createFilteredGltfUrl.js";

function createGltfFixture() {
  return {
    scene: 0,
    scenes: [
      {
        nodes: [0, 1, 2, 3]
      }
    ],
    nodes: [
      { name: "torso", mesh: 0 },
      { name: "head", mesh: 1 },
      { name: "leg_L", mesh: 2 },
      { name: "leg_R", mesh: 3 }
    ]
  };
}

describe("resolveFilteredSceneNodeIndices", () => {
  it("keeps the existing include/exclude node index behavior", () => {
    const gltf = createGltfFixture();

    expect(resolveFilteredSceneNodeIndices(gltf, {
      includeNodes: []
    })).toEqual([]);

    expect(resolveFilteredSceneNodeIndices(gltf, {
      includeNodes: [1, 3]
    })).toEqual([1, 3]);

    expect(resolveFilteredSceneNodeIndices(gltf, {
      excludeNodes: [2]
    })).toEqual([0, 1, 3]);
  });

  it("can filter character parts by node name", () => {
    const gltf = createGltfFixture();

    expect(resolveFilteredSceneNodeIndices(gltf, {
      includeNodeNames: ["head", "leg_L"]
    })).toEqual([1, 2]);

    expect(resolveFilteredSceneNodeIndices(gltf, {
      excludeNodeNames: ["head"]
    })).toEqual([0, 2, 3]);
  });

  it("lets exclude filters narrow include filters", () => {
    const gltf = createGltfFixture();

    expect(resolveFilteredSceneNodeIndices(gltf, {
      includeNodeNames: ["head", "leg_L", "leg_R"],
      excludeNodes: [3]
    })).toEqual([1, 2]);
  });
});
