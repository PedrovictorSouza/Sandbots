import { describe, expect, it } from "vitest";
import {
  ALIVE_PATCH_STATE,
  bindPurifiedGroundVariantInstances,
  buildGroundGrassPatches,
  buildGroundFlowerPatches,
  buildGroundGridInstances,
  COLD_GROUND_KIND,
  createGroundCellSpatialIndex,
  DEAD_PATCH_STATE,
  DEAD_GRASS_STATE,
  DEAD_GROUND_KIND,
  findNearbyGroundCell,
  GROUND_TILE_INSTANCE_SCALE,
  GREEN_GRASS_STATE,
  isAlternatePurifiedGroundCell,
  partitionColdGroundInstances,
  purifyGroundCell,
  reviveGroundFlower,
  reviveGroundGrass,
  syncPurifiedGroundVariantInstances
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

  it("finds the same nearby cell through the spatial index while checking fewer candidates", () => {
    const instances = buildGroundGridInstances({
      worldLimit: 32,
      tileFootprint: 3.8,
      tileHeight: 3.8,
    });
    const playerPosition = [instances[44].offset[0] + 0.1, 0, instances[44].offset[2] + 0.1];
    const index = createGroundCellSpatialIndex(instances);
    const linearResult = findNearbyGroundCell(playerPosition, instances);
    const indexedResult = findNearbyGroundCell(playerPosition, instances, undefined, index);
    const candidates = index.queryRadius(playerPosition, index.maxInteractDistance);

    expect(indexedResult).toEqual(linearResult);
    expect(candidates.length).toBeLessThan(instances.length);
  });

  it("keeps custom interaction radii equivalent when using the spatial index", () => {
    const instances = buildGroundGridInstances({
      worldLimit: 32,
      tileFootprint: 3.8,
      tileHeight: 3.8,
    });
    const target = instances[80];
    const playerPosition = [target.offset[0] + target.tileSpan * 1.4, 0, target.offset[2]];
    const index = createGroundCellSpatialIndex(instances);

    expect(findNearbyGroundCell(playerPosition, instances, 1.5, index)).toEqual(
      findNearbyGroundCell(playerPosition, instances, 1.5)
    );
  });

  it("partitions cold ground as non-purifiable cells outside local warm regions", () => {
    const instances = buildGroundGridInstances({
      worldLimit: 8,
      tileFootprint: 3.8,
      tileHeight: 3.8,
    });
    const warmZone = {
      position: [instances[0].offset[0], instances[0].offset[2]],
      radius: instances[0].tileSpan * 1.1,
      coverageRatio: 0
    };
    const warmZoneCellIds = new Set(instances
      .filter((instance) => {
        const dx = instance.offset[0] - warmZone.position[0];
        const dz = instance.offset[2] - warmZone.position[1];
        return dx * dx + dz * dz <= warmZone.radius * warmZone.radius;
      })
      .map((instance) => instance.id));

    const {
      deadGroundInstances,
      coldGroundInstances
    } = partitionColdGroundInstances(instances, {
      coldCoverageRatio: 1,
      coverageZones: [warmZone],
      seed: "test-cold-ground"
    });

    expect(deadGroundInstances).toHaveLength(warmZoneCellIds.size);
    expect(coldGroundInstances).toHaveLength(instances.length - warmZoneCellIds.size);
    expect(deadGroundInstances.every((groundCell) => {
      return groundCell.groundKind === DEAD_GROUND_KIND && groundCell.purifiable === true;
    })).toBe(true);
    expect(coldGroundInstances.every((groundCell) => {
      return groundCell.groundKind === COLD_GROUND_KIND && groundCell.purifiable === false;
    })).toBe(true);

    const coldGroundCell = coldGroundInstances[0];
    expect(findNearbyGroundCell(
      [coldGroundCell.offset[0], 0, coldGroundCell.offset[2]],
      coldGroundInstances
    )).toBeNull();
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

  it("routes purified cells into light and dark checkerboard render layers", () => {
    const corruptedGroundInstances = buildGroundGridInstances({
      worldLimit: 2,
      tileFootprint: 3.8,
      tileHeight: 3.8,
    });
    const purifiedGroundInstances = [];
    const lightInstances = [];
    const darkInstances = [];
    bindPurifiedGroundVariantInstances(purifiedGroundInstances, {
      lightInstances,
      darkInstances
    });

    purifyGroundCell(corruptedGroundInstances[0], corruptedGroundInstances, purifiedGroundInstances);
    purifyGroundCell(corruptedGroundInstances[0], corruptedGroundInstances, purifiedGroundInstances);

    expect(isAlternatePurifiedGroundCell(purifiedGroundInstances[0])).toBe(false);
    expect(isAlternatePurifiedGroundCell(purifiedGroundInstances[1])).toBe(true);
    expect(lightInstances.map((groundCell) => groundCell.id)).toEqual(["ground-0-0"]);
    expect(darkInstances.map((groundCell) => groundCell.id)).toEqual(["ground-0-1"]);

    lightInstances.length = 0;
    darkInstances.length = 0;
    syncPurifiedGroundVariantInstances(purifiedGroundInstances);

    expect(lightInstances.map((groundCell) => groundCell.id)).toEqual(["ground-0-0"]);
    expect(darkInstances.map((groundCell) => groundCell.id)).toEqual(["ground-0-1"]);
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

  it("can seed dry grass across a target share of planet tiles", () => {
    const groundInstances = buildGroundGridInstances({
      worldLimit: 4,
      tileFootprint: 3.8,
      tileHeight: 3.8,
    });

    const grassPatches = buildGroundGrassPatches({
      groundInstances,
      layout: [
        { id: "grass-anchor", position: [groundInstances[0].offset[0], 0, groundInstances[0].offset[2]] }
      ],
      coverageRatio: 0.25,
      seed: "test-ecosystem-grass"
    });

    expect(grassPatches).toHaveLength(Math.round(groundInstances.length * 0.25));
    expect(grassPatches.some((patch) => patch.id === "grass-anchor")).toBe(true);
    expect(new Set(grassPatches.map((patch) => patch.cellId)).size).toBe(grassPatches.length);
    expect(grassPatches.every((patch) => patch.state === DEAD_GRASS_STATE)).toBe(true);
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
