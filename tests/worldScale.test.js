import { describe, expect, it } from "vitest";
import { WORLD_LIMIT } from "../gameplayContent.js";
import { buildElevatedTerrain } from "../app/session/buildElevatedTerrain.js";

function getHillIds(instances) {
  return new Set(
    instances.map((instance) => {
      return instance.id.replace(/^elevated-/, "").replace(/-\d+-\d+-\d+$/, "");
    })
  );
}

describe("world scale", () => {
  it("doubles the playable world radius", () => {
    expect(WORLD_LIMIT).toBe(144);
  });

  it("uses twice as many elevated terrain hills, including larger distant mountains", () => {
    const terrain = buildElevatedTerrain({
      tileSpan: 1,
      tileHeight: 1,
      tileScale: 1,
      safeZones: []
    });
    const hillIds = getHillIds(terrain.instances);
    const largeDistantMountainCount = terrain.instances.filter((instance) => {
      return (
        instance.terrainHillRadius >= 10 &&
        Math.hypot(instance.terrainHillCenter[0], instance.terrainHillCenter[1]) > 90
      );
    }).length;

    expect(hillIds.size).toBeGreaterThanOrEqual(30);
    expect(terrain.instances.length).toBeLessThan(9000);
    expect(largeDistantMountainCount).toBeGreaterThan(0);
  });
});
