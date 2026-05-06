import { describe, expect, it } from "vitest";
import {
  ACT_TWO_GAMEPLAY_OPENING_CAMERA_HOLD,
  ACT_TWO_GAMEPLAY_OPENING_PLAYER_EXIT_END_POSITION,
  ACT_TWO_GAMEPLAY_OPENING_PLAYER_EXIT_START,
  ACT_TWO_GAMEPLAY_OPENING_PLAYER_EXIT_START_POSITION,
  ACT_TWO_GAMEPLAY_OPENING_SHIP_LAND,
  ACT_TWO_GAMEPLAY_OPENING_SHIP_LAND_POSITION,
  ACT_TWO_GAMEPLAY_OPENING_SHIP_START,
  ACT_TWO_GAMEPLAY_OPENING_SHIP_START_POSITION,
  ACT_TWO_MONSTER_POSITION,
  ACT_TWO_PLAYER_SPAWN
} from "../actTwoSceneConfig.js";

function planarDistance(a, b) {
  return Math.hypot(a[0] - b[0], a[2] - b[2]);
}

function planarDotFromOrigin(origin, a, b) {
  return (
    (a[0] - origin[0]) * (b[0] - origin[0]) +
    (a[2] - origin[2]) * (b[2] - origin[2])
  );
}

describe("act two scene config", () => {
  it("places the crash discovery route far from Chopper with the player ahead of the ship", () => {
    expect(ACT_TWO_PLAYER_SPAWN).toEqual(ACT_TWO_GAMEPLAY_OPENING_PLAYER_EXIT_END_POSITION);
    expect(planarDistance(ACT_TWO_GAMEPLAY_OPENING_SHIP_LAND_POSITION, ACT_TWO_MONSTER_POSITION))
      .toBeGreaterThanOrEqual(80);
    expect(planarDistance(ACT_TWO_PLAYER_SPAWN, ACT_TWO_GAMEPLAY_OPENING_SHIP_LAND_POSITION))
      .toBeGreaterThan(3);
    expect(planarDistance(ACT_TWO_PLAYER_SPAWN, ACT_TWO_GAMEPLAY_OPENING_SHIP_LAND_POSITION))
      .toBeLessThanOrEqual(5);
    expect(planarDistance(
      ACT_TWO_GAMEPLAY_OPENING_PLAYER_EXIT_START_POSITION,
      ACT_TWO_GAMEPLAY_OPENING_SHIP_LAND_POSITION
    )).toBeGreaterThan(3);
    expect(planarDotFromOrigin(
      ACT_TWO_GAMEPLAY_OPENING_SHIP_LAND_POSITION,
      ACT_TWO_GAMEPLAY_OPENING_PLAYER_EXIT_START_POSITION,
      ACT_TWO_MONSTER_POSITION
    )).toBeGreaterThan(0);
    expect(planarDotFromOrigin(
      ACT_TWO_GAMEPLAY_OPENING_SHIP_LAND_POSITION,
      ACT_TWO_PLAYER_SPAWN,
      ACT_TWO_MONSTER_POSITION
    )).toBeGreaterThan(0);
  });

  it("drops the ship from the horizon before the player exits", () => {
    expect(ACT_TWO_GAMEPLAY_OPENING_SHIP_START).toBeLessThan(ACT_TWO_GAMEPLAY_OPENING_SHIP_LAND);
    expect(ACT_TWO_GAMEPLAY_OPENING_SHIP_LAND - ACT_TWO_GAMEPLAY_OPENING_SHIP_START)
      .toBeGreaterThanOrEqual(3);
    expect(ACT_TWO_GAMEPLAY_OPENING_SHIP_START_POSITION[1])
      .toBeGreaterThan(ACT_TWO_GAMEPLAY_OPENING_SHIP_LAND_POSITION[1] + 10);
    expect(ACT_TWO_GAMEPLAY_OPENING_SHIP_START_POSITION[2])
      .toBeGreaterThan(ACT_TWO_GAMEPLAY_OPENING_SHIP_LAND_POSITION[2] + 30);
    expect(ACT_TWO_GAMEPLAY_OPENING_PLAYER_EXIT_START)
      .toBeGreaterThan(ACT_TWO_GAMEPLAY_OPENING_SHIP_LAND);
    expect(ACT_TWO_GAMEPLAY_OPENING_CAMERA_HOLD)
      .toBeGreaterThan(ACT_TWO_GAMEPLAY_OPENING_PLAYER_EXIT_START);
    expect(planarDistance(
      ACT_TWO_GAMEPLAY_OPENING_PLAYER_EXIT_START_POSITION,
      ACT_TWO_GAMEPLAY_OPENING_SHIP_LAND_POSITION
    )).toBeLessThan(4);
  });
});
