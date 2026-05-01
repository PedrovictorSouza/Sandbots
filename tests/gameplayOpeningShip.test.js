import { describe, expect, it } from "vitest";
import {
  createGameplayOpeningShipState,
  getGameplayOpeningShipDynamicBarrier
} from "../app/session/gameplayOpeningShip.js";

describe("gameplay opening ship", () => {
  it("exposes a player-blocking barrier only after the ship has landed", () => {
    const ship = createGameplayOpeningShipState();

    expect(getGameplayOpeningShipDynamicBarrier(ship)).toBe(null);

    ship.visible = true;
    ship.phase = "falling";
    ship.position = [5.95, 0.06, 6.45];

    expect(getGameplayOpeningShipDynamicBarrier(ship)).toBe(null);

    ship.phase = "landed";

    expect(getGameplayOpeningShipDynamicBarrier(ship)).toEqual({
      id: "gameplay-opening-ship-collider",
      position: [5.95, 0.06, 6.45],
      radius: expect.any(Number)
    });
  });
});
