import {
  ACT_TWO_GAMEPLAY_OPENING_CAMERA_HOLD,
  ACT_TWO_GAMEPLAY_OPENING_CAMERA_POSE,
  ACT_TWO_PLAYER_CAMERA_DIRECTION,
  ACT_TWO_PLAYER_CAMERA_DISTANCE,
  ACT_TWO_PLAYER_CAMERA_ZOOM
} from "../../actTwoSceneConfig.js";

export function createGameplayCameraDirector({
  camera,
  cameraOrbit,
  openingDuration = ACT_TWO_GAMEPLAY_OPENING_CAMERA_HOLD,
  openingPose = ACT_TWO_GAMEPLAY_OPENING_CAMERA_POSE
}) {
  let openingShot = null;
  let openingPlayed = false;

  function beginFrame({ now, gameplayActive, hasPlayer }) {
    if (!gameplayActive || !hasPlayer) {
      openingShot = null;
      return false;
    }

    if (!openingShot && !openingPlayed) {
      openingShot = {
        startedAt: now
      };
    }

    if (!openingShot) {
      return false;
    }

    return (now - openingShot.startedAt) / 1000 < openingDuration;
  }

  function releaseToFollow(playerPosition, canFollow) {
    camera.setPose({
      direction: ACT_TWO_PLAYER_CAMERA_DIRECTION,
      zoom: ACT_TWO_PLAYER_CAMERA_ZOOM,
      distance: ACT_TWO_PLAYER_CAMERA_DISTANCE
    });
    cameraOrbit.sync(ACT_TWO_PLAYER_CAMERA_DIRECTION);

    if (canFollow) {
      camera.follow(playerPosition);
    }
  }

  function update({ now, gameplayActive, playerPosition, canFollow = true }) {
    const hasPlayer = Array.isArray(playerPosition);
    const openingActive = beginFrame({
      now,
      gameplayActive,
      hasPlayer
    });

    if (openingActive) {
      camera.setPose(openingPose);
      return {
        openingActive: true,
        released: false
      };
    }

    if (openingShot && gameplayActive && hasPlayer) {
      openingShot = null;
      openingPlayed = true;
      releaseToFollow(playerPosition, canFollow);
      return {
        openingActive: false,
        released: true
      };
    }

    if (gameplayActive && hasPlayer && canFollow) {
      camera.follow(playerPosition);
    }

    return {
      openingActive: false,
      released: false
    };
  }

  return {
    beginFrame,
    getState(now) {
      return {
        openingActive: Boolean(openingShot && (now - openingShot.startedAt) / 1000 < openingDuration),
        openingPlayed,
        openingElapsed: openingShot ? (now - openingShot.startedAt) / 1000 : null
      };
    },
    update
  };
}
