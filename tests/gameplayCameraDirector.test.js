import { describe, expect, it, vi } from "vitest";
import { createGameplayCameraDirector } from "../app/runtime/gameplayCameraDirector.js";
import {
  ACT_TWO_GAMEPLAY_OPENING_CAMERA_HOLD,
  ACT_TWO_GAMEPLAY_OPENING_CAMERA_POSE,
  ACT_TWO_GAMEPLAY_OPENING_PLAYER_EXIT_END_POSITION,
  ACT_TWO_GAMEPLAY_OPENING_PLAYER_EXIT_START,
  ACT_TWO_GAMEPLAY_OPENING_PLAYER_EXIT_START_POSITION,
  ACT_TWO_GAMEPLAY_OPENING_SHIP_LAND,
  ACT_TWO_GAMEPLAY_OPENING_SHIP_LAND_POSITION,
  ACT_TWO_GAMEPLAY_OPENING_SHIP_START,
  ACT_TWO_PLAYER_CAMERA_DIRECTION,
  ACT_TWO_PLAYER_CAMERA_DISTANCE,
  ACT_TWO_PLAYER_CAMERA_ZOOM
} from "../actTwoSceneConfig.js";

describe("createGameplayCameraDirector", () => {
  it("holds Chopper alone, drops the ship, spawns the player, then releases to follow", () => {
    const camera = {
      follow: vi.fn(),
      setPose: vi.fn()
    };
    const cameraOrbit = {
      sync: vi.fn()
    };
    const playerPosition = [8.4, 0, -3.2];
    const ship = {
      visible: false,
      position: null,
      dust: [],
      smoke: []
    };
    const spawnPlayer = vi.fn(() => playerPosition);
    const movePlayer = vi.fn();
    const director = createGameplayCameraDirector({ camera, cameraOrbit });

    expect(
      director.beginFrame({
        now: 1000,
        gameplayActive: true
      })
    ).toBe(false);

    director.requestOpening();

    expect(
      director.beginFrame({
        now: 1000,
        gameplayActive: true
      })
    ).toBe(true);

    director.update({
      now: 1000,
      gameplayActive: true,
      playerPosition: null,
      ship,
      canFollow: true
    });

    expect(camera.setPose).toHaveBeenLastCalledWith(ACT_TWO_GAMEPLAY_OPENING_CAMERA_POSE);
    expect(camera.follow).not.toHaveBeenCalled();
    expect(ship.visible).toBe(false);
    expect(spawnPlayer).not.toHaveBeenCalled();

    director.update({
      now: 1000 + (ACT_TWO_GAMEPLAY_OPENING_SHIP_START * 1000) + 500,
      gameplayActive: true,
      playerPosition: null,
      ship,
      canFollow: true
    });

    expect(ship.visible).toBe(true);
    expect(ship.position[1]).toBeGreaterThan(ACT_TWO_GAMEPLAY_OPENING_SHIP_LAND_POSITION[1]);
    expect(ship.smoke.length).toBeGreaterThan(0);

    director.update({
      now: 1000 + (ACT_TWO_GAMEPLAY_OPENING_SHIP_LAND * 1000) + 1,
      gameplayActive: true,
      playerPosition: null,
      spawnPlayer,
      movePlayer,
      ship,
      canFollow: true
    });

    expect(ship.visible).toBe(true);
    expect(ship.position).toEqual(ACT_TWO_GAMEPLAY_OPENING_SHIP_LAND_POSITION);
    expect(ship.dust.length).toBeGreaterThan(0);
    expect(ship.flash).toEqual(expect.objectContaining({
      position: expect.any(Array),
      size: expect.any(Array)
    }));
    expect(camera.setPose.mock.calls.at(-1)[0].target).not.toEqual(
      ACT_TWO_GAMEPLAY_OPENING_CAMERA_POSE.target
    );
    expect(spawnPlayer).not.toHaveBeenCalled();
    expect(movePlayer).not.toHaveBeenCalled();
    expect(camera.follow).not.toHaveBeenCalled();

    director.update({
      now: 1000 + (ACT_TWO_GAMEPLAY_OPENING_PLAYER_EXIT_START * 1000) + 500,
      gameplayActive: true,
      playerPosition: null,
      spawnPlayer,
      movePlayer,
      ship,
      canFollow: true
    });

    expect(spawnPlayer).toHaveBeenCalledTimes(1);
    expect(spawnPlayer).toHaveBeenLastCalledWith(ACT_TWO_GAMEPLAY_OPENING_PLAYER_EXIT_START_POSITION);
    expect(movePlayer).toHaveBeenCalledTimes(1);
    expect(movePlayer.mock.calls[0][0][2]).toBeLessThan(ACT_TWO_GAMEPLAY_OPENING_PLAYER_EXIT_START_POSITION[2]);
    expect(movePlayer.mock.calls[0][0][2]).toBeGreaterThan(ACT_TWO_GAMEPLAY_OPENING_PLAYER_EXIT_END_POSITION[2]);
    expect(camera.follow).not.toHaveBeenCalled();

    director.update({
      now: 1000 + (ACT_TWO_GAMEPLAY_OPENING_CAMERA_HOLD * 1000) + 1,
      gameplayActive: true,
      playerPosition,
      spawnPlayer,
      movePlayer,
      ship,
      canFollow: true
    });

    expect(movePlayer).toHaveBeenLastCalledWith(ACT_TWO_GAMEPLAY_OPENING_PLAYER_EXIT_END_POSITION);
    expect(ship.smoke.length).toBeGreaterThan(0);
    expect(camera.setPose).toHaveBeenLastCalledWith({
      direction: ACT_TWO_PLAYER_CAMERA_DIRECTION,
      zoom: ACT_TWO_PLAYER_CAMERA_ZOOM,
      distance: ACT_TWO_PLAYER_CAMERA_DISTANCE
    });
    expect(cameraOrbit.sync).toHaveBeenLastCalledWith(ACT_TWO_PLAYER_CAMERA_DIRECTION);
    expect(camera.follow).toHaveBeenLastCalledWith(playerPosition);

    camera.follow.mockClear();
    camera.setPose.mockClear();

    expect(
      director.beginFrame({
        now: 1000 + (ACT_TWO_GAMEPLAY_OPENING_CAMERA_HOLD * 1000) + 20,
        gameplayActive: true
      })
    ).toBe(false);

    director.update({
      now: 1000 + (ACT_TWO_GAMEPLAY_OPENING_CAMERA_HOLD * 1000) + 20,
      gameplayActive: true,
      playerPosition,
      canFollow: true
    });

    expect(camera.setPose).not.toHaveBeenCalled();
    expect(camera.follow).toHaveBeenLastCalledWith(playerPosition);
  });
});
