import { describe, expect, it } from "vitest";
import {
  ALIVE_PATCH_STATE,
  buildGroundGrassPatches,
  buildGroundFlowerPatches,
  buildGroundGridInstances,
  DEAD_PATCH_STATE,
  DEAD_GRASS_STATE,
  findNearbyGroundCell,
  GROUND_TILE_INSTANCE_SCALE,
  GREEN_GRASS_STATE,
  purifyGroundCell,
  reviveGroundFlower,
  reviveGroundGrass
} from "../groundGrid.js";

describe("buildGroundGridInstances", () => {
  it("fills the full world bounds with retro tiles and buries them so the top sits on the ground plane", () => {
    const instances = buildGroundGridInstances({
      worldLimit: 72,
      tileFootprint: 3.8,
      tileHeight: 3.8,
    });

    expect(instances).toHaveLength(10404);
    expect(instances[0]).toMatchObject({
      id: "ground-0-0",
      scale: GROUND_TILE_INSTANCE_SCALE,
      yaw: 0,
    });
    expect(instances[0].offset[0]).toBeCloseTo(-71.2875);
    expect(instances[0].offset[1]).toBeCloseTo(-1.425);
    expect(instances[0].offset[2]).toBeCloseTo(-71.2875);

    const halfSpan = (3.8 * GROUND_TILE_INSTANCE_SCALE) * 0.5;
    const minX = Math.min(...instances.map((instance) => instance.offset[0] - halfSpan));
    const maxX = Math.max(...instances.map((instance) => instance.offset[0] + halfSpan));
    const minZ = Math.min(...instances.map((instance) => instance.offset[2] - halfSpan));
    const maxZ = Math.max(...instances.map((instance) => instance.offset[2] + halfSpan));

    expect(minX).toBeLessThanOrEqual(-72);
    expect(maxX).toBeGreaterThanOrEqual(72);
    expect(minZ).toBeLessThanOrEqual(-72);
    expect(maxZ).toBeGreaterThanOrEqual(72);
    expect(Math.min(...instances.map((instance) => instance.offset[1]))).toBeCloseTo(-1.425);
    expect(Math.max(...instances.map((instance) => instance.offset[1]))).toBeCloseTo(-1.425);
  });

  it("finds the closest corrupted ground cell near the player", () => {
    const instances = buildGroundGridInstances({
      worldLimit: 2,
      tileFootprint: 3.8,
      tileHeight: 3.8,
    });

    const nearestGroundCell = findNearbyGroundCell(
      [instances[0].offset[0] + 0.1, 0, instances[0].offset[2] + 0.1],
      instances
    );

    expect(nearestGroundCell).toEqual(expect.objectContaining({
      distance: expect.any(Number),
      groundCell: expect.objectContaining({
        id: instances[0].id
      })
    }));
  });

  it("moves a corrupted cell into the purified ground layer", () => {
    const corruptedGroundInstances = buildGroundGridInstances({
      worldLimit: 2,
      tileFootprint: 3.8,
      tileHeight: 3.8,
    });
    const purifiedGroundInstances = [];

    const purified = purifyGroundCell(
      corruptedGroundInstances[0],
      corruptedGroundInstances,
      purifiedGroundInstances
    );

    expect(purified).toBe(true);
    expect(corruptedGroundInstances).toHaveLength(8);
    expect(purifiedGroundInstances).toHaveLength(1);
    expect(purifiedGroundInstances[0].id).toBe("ground-0-0");
  });

  it("attaches grass patches to target cells and revives them when the tile is purified", () => {
    const groundInstances = buildGroundGridInstances({
      worldLimit: 2,
      tileFootprint: 3.8,
      tileHeight: 3.8,
    });

    const grassPatches = buildGroundGrassPatches({
      groundInstances,
      layout: [
        { id: "grass-a", position: [groundInstances[0].offset[0], 0, groundInstances[0].offset[2]] }
      ]
    });

    expect(grassPatches).toHaveLength(1);
    expect(grassPatches[0]).toMatchObject({
      id: "grass-a",
      cellId: groundInstances[0].id,
      state: DEAD_GRASS_STATE
    });

    const revived = reviveGroundGrass(groundInstances[0], grassPatches);

    expect(revived).toBe(grassPatches[0]);
    expect(grassPatches[0].state).toBe(GREEN_GRASS_STATE);
    expect(reviveGroundGrass(groundInstances[0], grassPatches)).toBe(false);
  });

  it("attaches flower patches to target cells and revives them with the same dead/alive states", () => {
    const groundInstances = buildGroundGridInstances({
      worldLimit: 2,
      tileFootprint: 3.8,
      tileHeight: 3.8,
    });

    const flowerPatches = buildGroundFlowerPatches({
      groundInstances,
      layout: [
        { id: "flower-a", position: [groundInstances[1].offset[0], 0, groundInstances[1].offset[2]] }
      ]
    });

    expect(flowerPatches).toHaveLength(1);
    expect(flowerPatches[0]).toMatchObject({
      id: "flower-a",
      cellId: groundInstances[1].id,
      state: DEAD_PATCH_STATE
    });

    const revived = reviveGroundFlower(groundInstances[1], flowerPatches);

    expect(revived).toBe(flowerPatches[0]);
    expect(flowerPatches[0].state).toBe(ALIVE_PATCH_STATE);
    expect(reviveGroundFlower(groundInstances[1], flowerPatches)).toBe(false);
  });
});
