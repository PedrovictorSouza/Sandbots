import { describe, expect, it, vi } from "vitest";
import { createGameplayCameraDirector } from "../app/runtime/gameplayCameraDirector.js";
import {
  ACT_TWO_GAMEPLAY_OPENING_CAMERA_HOLD,
  ACT_TWO_GAMEPLAY_OPENING_CAMERA_POSE,
  ACT_TWO_PLAYER_CAMERA_DIRECTION,
  ACT_TWO_PLAYER_CAMERA_DISTANCE,
  ACT_TWO_PLAYER_CAMERA_ZOOM
} from "../actTwoSceneConfig.js";

describe("createGameplayCameraDirector", () => {
  it("owns the opening shot briefly, then releases back to gameplay follow", () => {
    const camera = {
      follow: vi.fn(),
      setPose: vi.fn()
    };
    const cameraOrbit = {
      sync: vi.fn()
    };
    const playerPosition = [8.4, 0, -3.2];
    const director = createGameplayCameraDirector({ camera, cameraOrbit });

    expect(
      director.beginFrame({
        now: 1000,
        gameplayActive: true,
        hasPlayer: true
      })
    ).toBe(true);

    director.update({
      now: 1000,
      gameplayActive: true,
      playerPosition,
      canFollow: true
    });

    expect(camera.setPose).toHaveBeenLastCalledWith(ACT_TWO_GAMEPLAY_OPENING_CAMERA_POSE);
    expect(camera.follow).not.toHaveBeenCalled();

    director.update({
      now: 1000 + (ACT_TWO_GAMEPLAY_OPENING_CAMERA_HOLD * 1000) + 1,
      gameplayActive: true,
      playerPosition,
      canFollow: true
    });

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
        gameplayActive: true,
        hasPlayer: true
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
