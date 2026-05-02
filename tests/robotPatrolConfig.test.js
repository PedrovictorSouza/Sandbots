import { describe, expect, it } from "vitest";
import {
  BULBASAUR_IDLE_PATROL_RADIUS,
  ROBOT_IDLE_PATROL_RADIUS_MULTIPLIER,
  SQUIRTLE_IDLE_PATROL_RADIUS
} from "../app/runtime/robotPatrolConfig.js";

describe("robot patrol config", () => {
  it("doubles non-Chopper robot patrol radius from the previous multiplier", () => {
    expect(ROBOT_IDLE_PATROL_RADIUS_MULTIPLIER).toBe(6);
    expect(SQUIRTLE_IDLE_PATROL_RADIUS).toBeCloseTo(0.58 * 6);
    expect(BULBASAUR_IDLE_PATROL_RADIUS).toBeCloseTo(0.68 * 6);
  });
});
