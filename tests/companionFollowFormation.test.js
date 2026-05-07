import { describe, expect, it } from "vitest";
import {
  resolveCompanionFollowDistance,
  resolveCompanionFollowSpeed
} from "../app/runtime/gameLoop.js";
import { ACT_TWO_PLAYER_SPEED } from "../app/session/configurePlayerSpawner.js";

describe("resolveCompanionFollowDistance", () => {
  it("keeps the companion for the active move closer to the player", () => {
    const squirtleWithWater = resolveCompanionFollowDistance({
      companionId: "squirtle",
      activeMoveId: "waterGun",
      defaultDistance: 1.18
    });
    const bulbasaurWithWater = resolveCompanionFollowDistance({
      companionId: "bulbasaur",
      activeMoveId: "waterGun",
      defaultDistance: 1.46
    });
    const squirtleWithLeafage = resolveCompanionFollowDistance({
      companionId: "squirtle",
      activeMoveId: "leafage",
      defaultDistance: 1.18
    });
    const bulbasaurWithLeafage = resolveCompanionFollowDistance({
      companionId: "bulbasaur",
      activeMoveId: "leafage",
      defaultDistance: 1.46
    });

    expect(squirtleWithWater).toBeLessThan(bulbasaurWithWater);
    expect(bulbasaurWithLeafage).toBeLessThan(squirtleWithLeafage);
  });

  it("keeps default spacing when no field move is selected", () => {
    expect(resolveCompanionFollowDistance({
      companionId: "squirtle",
      activeMoveId: null,
      defaultDistance: 1.18
    })).toBe(1.18);
  });

  it("uses the player movement speed for following companions", () => {
    expect(resolveCompanionFollowSpeed()).toBe(ACT_TWO_PLAYER_SPEED);
  });
});
