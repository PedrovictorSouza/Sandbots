import { describe, expect, it } from "vitest";
import {
  applyTrainHouseDance,
  resolveTrainHouseMusicVolume
} from "../app/runtime/gameLoop.js";

describe("Thermal Cabin runtime effects", () => {
  it("raises music volume as the player approaches the Thermal Cabin", () => {
    const trainHousePosition = [4, 0, 4];

    const farVolume = resolveTrainHouseMusicVolume({
      playerPosition: [20.4, 0, 4],
      trainHousePosition
    });
    const edgeVolume = resolveTrainHouseMusicVolume({
      playerPosition: [12.2, 0, 4],
      trainHousePosition
    });
    const midVolume = resolveTrainHouseMusicVolume({
      playerPosition: [8, 0, 4],
      trainHousePosition
    });
    const closeVolume = resolveTrainHouseMusicVolume({
      playerPosition: [4.4, 0, 4],
      trainHousePosition
    });

    expect(farVolume).toBe(0);
    expect(edgeVolume).toBeGreaterThan(0);
    expect(midVolume).toBeGreaterThan(0);
    expect(midVolume).toBeGreaterThan(edgeVolume);
    expect(closeVolume).toBeGreaterThan(midVolume);
  });

  it("dances the Thermal Cabin without moving its ground pivot", () => {
    const instance = {
      offset: [0, 0.02, 0],
      scale: 3,
      yaw: 0,
      active: false
    };

    const applied = applyTrainHouseDance(instance, [6, 0, -2], 1.25);

    expect(applied).toBe(true);
    expect(instance.active).toBe(true);
    expect(instance.offset[1]).toBe(0.02);
    expect(instance.offset[0]).not.toBe(6);
    expect(instance.offset[2]).not.toBe(-2);
    expect(instance.scale).not.toBe(3);
    expect(Math.abs(instance.swayStrength)).toBeGreaterThan(0);
  });
});
