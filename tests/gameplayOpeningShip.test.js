import { describe, expect, it } from "vitest";
import {
  createGameplayOpeningShipState,
  getGameplayOpeningShipDynamicBarrier,
  getGameplayOpeningShipSceneObjects
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

  it("keeps the opening ship assembled while it is falling", () => {
    const model = {
      primitives: ["body-a", "body-b", "body-c", "right-panel", "left-panel", "rear-fragment"]
    };
    const ship = createGameplayOpeningShipState({ model });

    ship.visible = true;
    ship.phase = "falling";
    ship.position = [5.95, 0.06, 6.45];

    const sceneObjects = getGameplayOpeningShipSceneObjects([], ship);

    expect(sceneObjects).toHaveLength(1);
    expect(sceneObjects[0].model.primitives).toEqual(model.primitives);
  });

  it("scatters modular destruction parts after the opening ship impact", () => {
    const model = {
      primitives: ["body-a", "body-b", "body-c", "right-panel", "left-panel", "rear-fragment"]
    };
    const ship = createGameplayOpeningShipState({ model });

    ship.visible = true;
    ship.phase = "landed";
    ship.position = [5.95, 0.06, 6.45];
    ship.destructionProgress = 1;

    const sceneObjects = getGameplayOpeningShipSceneObjects([], ship);

    expect(sceneObjects).toHaveLength(4);
    expect(sceneObjects[0].model.primitives).toEqual(["body-a", "body-b", "body-c"]);
    expect(sceneObjects.slice(1).map((sceneObject) => sceneObject.model.primitives)).toEqual([
      ["right-panel"],
      ["left-panel"],
      ["rear-fragment"]
    ]);
    expect(sceneObjects.slice(1).map((sceneObject) => sceneObject.instances[0].active))
      .toEqual([true, true, true]);
    expect(sceneObjects[1].instances[0].offset[0]).toBeGreaterThan(8);
    expect(sceneObjects[2].instances[0].offset[0]).toBeLessThan(4);
  });
});
