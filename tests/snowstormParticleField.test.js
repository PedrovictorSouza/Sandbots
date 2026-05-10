import { describe, expect, it } from "vitest";
import { WORLD_LIMIT } from "../gameplayContent.js";
import {
  SNOWSTORM_REGION,
  createSnowstormParticleField,
  getSnowstormBillboards,
  getSnowstormFogIntensity,
  isInsideSnowstormGroundRegion,
  isInsideSnowstormActivationRange,
  updateSnowstormParticleField
} from "../app/session/snowstormParticleField.js";

describe("snowstormParticleField", () => {
  it("covers more than half of the wrapped planet area", () => {
    const regionArea = Math.PI * SNOWSTORM_REGION.radius ** 2;
    const planetArea = (WORLD_LIMIT * 2) ** 2;
    const coverage = regionArea / planetArea;

    expect(coverage).toBeGreaterThan(0.52);
    expect(coverage).toBeLessThan(0.54);
  });

  it("activates near the snow region and reuses billboard objects", () => {
    const field = createSnowstormParticleField({ particleLimit: 12, seed: 7 });
    const texture = { id: "snowflake-texture" };

    updateSnowstormParticleField(field, {
      deltaTime: 1 / 60,
      playerPosition: [0, 0, 0]
    });
    expect(field.active).toBe(false);
    expect(getSnowstormBillboards(field, texture)).toHaveLength(0);

    updateSnowstormParticleField(field, {
      deltaTime: 1 / 60,
      playerPosition: SNOWSTORM_REGION.center
    });
    expect(field.active).toBe(true);

    const firstBillboards = getSnowstormBillboards(field, texture);
    const firstBillboard = firstBillboards[0];
    expect(firstBillboards).toHaveLength(12);
    expect(firstBillboard.texture).toBe(texture);

    updateSnowstormParticleField(field, {
      deltaTime: 1 / 60,
      playerPosition: SNOWSTORM_REGION.center
    });
    const secondBillboards = getSnowstormBillboards(field, texture);
    expect(secondBillboards[0]).toBe(firstBillboard);
  });

  it("ramps fog intensity only inside the snowstorm approach range", () => {
    const field = createSnowstormParticleField({ particleLimit: 1 });

    expect(getSnowstormFogIntensity(field, [0, 0, 0])).toBe(0);
    expect(getSnowstormFogIntensity(field, SNOWSTORM_REGION.center)).toBe(1);

    updateSnowstormParticleField(field, {
      deltaTime: 1 / 60,
      playerPosition: SNOWSTORM_REGION.center
    });
    expect(field.fogIntensity).toBe(1);
  });

  it("uses wrapped distance at the planet seam", () => {
    const field = createSnowstormParticleField({ particleLimit: 1 });

    expect(isInsideSnowstormActivationRange(field, [140, 0, 84])).toBe(true);
  });

  it("identifies ground cells inside the snowstorm core region", () => {
    expect(isInsideSnowstormGroundRegion(SNOWSTORM_REGION.center)).toBe(true);
    expect(isInsideSnowstormGroundRegion([0, 0, 0])).toBe(false);
  });
});
