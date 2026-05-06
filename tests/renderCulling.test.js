import { describe, expect, it } from "vitest";
import { shouldDrawSceneInstance } from "../rendering/renderCulling.js";

describe("render culling", () => {
  it("keeps nearby floor instances and skips far floor instances", () => {
    const sceneObject = { drawDistanceFromCameraTarget: 40 };

    expect(shouldDrawSceneInstance(
      { offset: [12, 0, -8] },
      sceneObject,
      [0, 0, 0]
    )).toBe(true);
    expect(shouldDrawSceneInstance(
      { offset: [96, 0, -8] },
      sceneObject,
      [0, 0, 0]
    )).toBe(false);
  });

  it("uses a farther budget for large distant terrain", () => {
    const sceneObject = {
      drawDistanceFromCameraTarget: 40,
      distantTerrainDrawDistanceFromCameraTarget: 160
    };

    expect(shouldDrawSceneInstance(
      { offset: [112, 0, -60], terrainHillRadius: 12 },
      sceneObject,
      [0, 0, 0]
    )).toBe(true);
  });

  it("culls terrain-supported objects before they outdraw their floor", () => {
    const sceneObject = {
      terrainSupportDrawDistanceFromCameraTarget: 42
    };

    expect(shouldDrawSceneInstance(
      { offset: [18, 0, 0] },
      sceneObject,
      [0, 0, 0]
    )).toBe(true);
    expect(shouldDrawSceneInstance(
      { offset: [64, 0, 0] },
      sceneObject,
      [0, 0, 0]
    )).toBe(false);
  });

  it("can cull with a wrapped planar distance calculator", () => {
    const sceneObject = { drawDistanceFromCameraTarget: 8 };
    const getPlanarDistanceSquared = (position, cameraTarget) => {
      const dx = Math.abs(position[0] - cameraTarget[0]);
      const dz = Math.abs(position[2] - cameraTarget[2]);
      return Math.min(dx, 20 - dx) ** 2 + Math.min(dz, 20 - dz) ** 2;
    };

    expect(shouldDrawSceneInstance(
      { offset: [-9, 0, 0] },
      sceneObject,
      [9, 0, 0],
      { getPlanarDistanceSquared }
    )).toBe(true);
  });
});
