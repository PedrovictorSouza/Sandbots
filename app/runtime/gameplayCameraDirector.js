import {
  ACT_TWO_GAMEPLAY_OPENING_CAMERA_HOLD,
  ACT_TWO_GAMEPLAY_OPENING_CAMERA_POSE,
  ACT_TWO_GAMEPLAY_OPENING_IMPACT_SHAKE_DURATION,
  ACT_TWO_GAMEPLAY_OPENING_PLAYER_EXIT_END_POSITION,
  ACT_TWO_GAMEPLAY_OPENING_PLAYER_EXIT_START,
  ACT_TWO_GAMEPLAY_OPENING_PLAYER_EXIT_START_POSITION,
  ACT_TWO_GAMEPLAY_OPENING_SHIP_LAND,
  ACT_TWO_GAMEPLAY_OPENING_SHIP_LAND_POSITION,
  ACT_TWO_GAMEPLAY_OPENING_SHIP_SIZE,
  ACT_TWO_GAMEPLAY_OPENING_SHIP_SMOKE_DURATION,
  ACT_TWO_GAMEPLAY_OPENING_SHIP_START,
  ACT_TWO_GAMEPLAY_OPENING_SHIP_START_POSITION,
  ACT_TWO_PLAYER_CAMERA_DIRECTION,
  ACT_TWO_PLAYER_CAMERA_DISTANCE,
  ACT_TWO_PLAYER_CAMERA_ZOOM
} from "../../actTwoSceneConfig.js";

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function easeInCubic(value) {
  const t = clamp01(value);
  return t * t * t;
}

function easeOutCubic(value) {
  const t = clamp01(value);
  return 1 - Math.pow(1 - t, 3);
}

function lerpVector(from, to, amount) {
  return [
    from[0] + (to[0] - from[0]) * amount,
    from[1] + (to[1] - from[1]) * amount,
    from[2] + (to[2] - from[2]) * amount
  ];
}

function buildImpactDust(position, impactProgress) {
  if (impactProgress <= 0) {
    return [];
  }

  const dustProgress = clamp01(impactProgress);
  const dustCount = Math.ceil(dustProgress * 7);
  const dust = [];

  for (let index = 0; index < dustCount; index += 1) {
    const angle = index * 1.79;
    const radius = (0.18 + index * 0.08) * dustProgress;
    const lift = Math.sin(dustProgress * Math.PI) * (0.1 + index * 0.025);
    const size = (0.18 + (index % 3) * 0.04) * (1 - dustProgress * 0.28);

    dust.push({
      position: [
        position[0] + Math.cos(angle) * radius,
        position[1] + 0.08 + lift,
        position[2] + Math.sin(angle) * radius
      ],
      size: [size * 1.55, size]
    });
  }

  return dust;
}

function buildSmokeTrail(position, elapsed, intensity = 1) {
  const smoke = [];
  const smokeCount = Math.max(3, Math.round(7 * intensity));

  for (let index = 0; index < smokeCount; index += 1) {
    const age = index / smokeCount;
    const sway = Math.sin(elapsed * 5.7 + index * 1.31) * 0.12;
    const rise = age * (0.4 + intensity * 0.22);
    const drift = age * (0.22 + intensity * 0.12);
    const size = (0.24 + age * 0.36) * (0.72 + intensity * 0.32);

    smoke.push({
      position: [
        position[0] - 0.18 - drift + sway,
        position[1] + 0.36 + rise,
        position[2] + 0.1 + age * 0.16
      ],
      size: [size * 1.35, size]
    });
  }

  return smoke;
}

function buildImpactFlash(position, impactProgress) {
  if (impactProgress < 0.44 || impactProgress > 0.95) {
    return null;
  }

  const flashProgress = (impactProgress - 0.44) / 0.51;
  const size = 1.55 * (1 - flashProgress * 0.62);

  return {
    position: [position[0], position[1] + 0.34, position[2]],
    size: [size * 1.4, size]
  };
}

function getShakenOpeningPose(openingPose, elapsed, shipLandTime, shakeDuration) {
  const shakeProgress = clamp01((elapsed - shipLandTime) / shakeDuration);

  if (shakeProgress <= 0 || shakeProgress >= 1) {
    return openingPose;
  }

  const strength = (1 - shakeProgress) * 0.18;
  const shakeX = Math.sin(elapsed * 85) * strength;
  const shakeY = Math.cos(elapsed * 71) * strength * 0.38;

  return {
    ...openingPose,
    target: [
      openingPose.target[0] + shakeX,
      openingPose.target[1] + shakeY,
      openingPose.target[2] - shakeX * 0.42
    ]
  };
}

export function createGameplayCameraDirector({
  camera,
  cameraOrbit,
  openingDuration = ACT_TWO_GAMEPLAY_OPENING_CAMERA_HOLD,
  openingPose = ACT_TWO_GAMEPLAY_OPENING_CAMERA_POSE,
  shipStartTime = ACT_TWO_GAMEPLAY_OPENING_SHIP_START,
  shipLandTime = ACT_TWO_GAMEPLAY_OPENING_SHIP_LAND,
  shipStartPosition = ACT_TWO_GAMEPLAY_OPENING_SHIP_START_POSITION,
  shipLandPosition = ACT_TWO_GAMEPLAY_OPENING_SHIP_LAND_POSITION,
  shipSize = ACT_TWO_GAMEPLAY_OPENING_SHIP_SIZE,
  playerExitStartTime = ACT_TWO_GAMEPLAY_OPENING_PLAYER_EXIT_START,
  playerExitStartPosition = ACT_TWO_GAMEPLAY_OPENING_PLAYER_EXIT_START_POSITION,
  playerExitEndPosition = ACT_TWO_GAMEPLAY_OPENING_PLAYER_EXIT_END_POSITION,
  impactShakeDuration = ACT_TWO_GAMEPLAY_OPENING_IMPACT_SHAKE_DURATION,
  smokeDuration = ACT_TWO_GAMEPLAY_OPENING_SHIP_SMOKE_DURATION
}) {
  let openingShot = null;
  let openingPlayed = false;
  let smokeUntil = null;

  function requestOpening() {
    if (openingPlayed) {
      return false;
    }

    openingShot = {
      playerSpawned: false,
      startedAt: null
    };
    smokeUntil = null;
    return true;
  }

  function getElapsed(now) {
    if (!openingShot || typeof openingShot.startedAt !== "number") {
      return null;
    }

    return (now - openingShot.startedAt) / 1000;
  }

  function isOpeningActive(now) {
    const elapsed = getElapsed(now);
    return elapsed !== null && elapsed < openingDuration;
  }

  function beginFrame({ now, gameplayActive }) {
    if (!gameplayActive) {
      openingShot = null;
      return false;
    }

    if (openingShot && openingShot.startedAt === null) {
      openingShot.startedAt = now;
    }

    return isOpeningActive(now);
  }

  function updateShip(ship, elapsed) {
    if (!ship) {
      return;
    }

    if (elapsed < shipStartTime) {
      ship.visible = false;
      ship.dust = [];
      ship.flash = null;
      ship.smoke = [];
      return;
    }

    const fallDuration = Math.max(0.001, shipLandTime - shipStartTime);
    const fallProgress = clamp01((elapsed - shipStartTime) / fallDuration);
    const impactAge = elapsed - shipLandTime;
    const impactProgress =
      impactAge > 1.1 ?
        0 :
        clamp01((elapsed - (shipLandTime - 0.42)) / 0.78);
    const position = lerpVector(
      shipStartPosition,
      shipLandPosition,
      Math.pow(fallProgress, 2.35)
    );
    const landed = fallProgress >= 1;
    const smokePosition = landed ? shipLandPosition : position;

    ship.visible = true;
    ship.position = landed ? [...shipLandPosition] : position;
    ship.size = landed && impactAge >= 0 && impactAge < 0.28 ?
      [shipSize[0] * 1.12, shipSize[1] * 0.86] :
      [...shipSize];
    ship.dust = buildImpactDust(shipLandPosition, impactProgress);
    ship.flash = buildImpactFlash(shipLandPosition, impactProgress);
    ship.smoke = buildSmokeTrail(
      smokePosition,
      elapsed,
      landed ? 0.82 : 1.18
    );
  }

  function updatePersistentSmoke(ship, now) {
    if (!ship?.visible || !Array.isArray(ship.position)) {
      return;
    }

    if (typeof smokeUntil !== "number" || now > smokeUntil) {
      ship.smoke = [];
      ship.flash = null;
      return;
    }

    ship.smoke = buildSmokeTrail(
      ship.position,
      now * 0.001,
      0.66
    );
    ship.flash = null;
  }

  function getPlayerExitPosition(elapsed) {
    const exitDuration = Math.max(0.001, openingDuration - playerExitStartTime);
    const exitProgress = clamp01((elapsed - playerExitStartTime) / exitDuration);

    return lerpVector(
      playerExitStartPosition,
      playerExitEndPosition,
      easeOutCubic(exitProgress)
    );
  }

  function ensureOpeningPlayer(playerPosition, spawnPlayer) {
    if (Array.isArray(playerPosition)) {
      return playerPosition;
    }

    if (!openingShot || openingShot.playerSpawned) {
      return null;
    }

    openingShot.playerSpawned = true;
    const spawnedPosition = spawnPlayer?.([...playerExitStartPosition]) || null;
    return Array.isArray(spawnedPosition) ? spawnedPosition : null;
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

  function update({
    now,
    gameplayActive,
    playerPosition,
    canFollow = true,
    spawnPlayer = null,
    movePlayer = null,
    ship = null
  }) {
    const hasPlayer = Array.isArray(playerPosition);
    const openingActive = beginFrame({
      now,
      gameplayActive
    });
    const elapsed = getElapsed(now);

    if (openingActive) {
      camera.setPose(getShakenOpeningPose(
        openingPose,
        elapsed,
        shipLandTime,
        impactShakeDuration
      ));
      updateShip(ship, elapsed);
      if (elapsed >= playerExitStartTime) {
        const currentPlayerPosition = ensureOpeningPlayer(playerPosition, spawnPlayer);
        const nextPlayerPosition = getPlayerExitPosition(elapsed);
        if (currentPlayerPosition) {
          movePlayer?.(nextPlayerPosition);
        }
      }
      return {
        openingActive: true,
        released: false,
        phase: elapsed < shipStartTime ?
          "chopper" :
          elapsed < shipLandTime ?
            "ship-fall" :
            elapsed < playerExitStartTime ?
              "ship-landed" :
              "player-exit"
      };
    }

    if (openingShot && gameplayActive) {
      updateShip(ship, openingDuration);
      smokeUntil = now + smokeDuration * 1000;
      const spawnedPlayerPosition = ensureOpeningPlayer(playerPosition, spawnPlayer);
      const nextPlayerPosition = Array.isArray(spawnedPlayerPosition) ?
        spawnedPlayerPosition :
        null;

      openingShot = null;
      openingPlayed = true;
      if (nextPlayerPosition) {
        movePlayer?.([...playerExitEndPosition]);
        releaseToFollow(playerExitEndPosition, canFollow);
      }
      return {
        openingActive: false,
        released: true,
        phase: "released"
      };
    }

    if (openingPlayed) {
      updatePersistentSmoke(ship, now);
    }

    if (openingPlayed && ship?.dust?.length) {
      ship.dust = [];
    }

    if (gameplayActive && hasPlayer && canFollow) {
      camera.follow(playerPosition);
    }

    return {
      openingActive: false,
      released: false,
      phase: openingPlayed ? "played" : "idle"
    };
  }

  return {
    beginFrame,
    getState(now) {
      const elapsed = getElapsed(now);
      return {
        openingActive: isOpeningActive(now),
        openingPlayed,
        openingElapsed: elapsed,
        openingPhase: !openingShot ?
          (openingPlayed ? "played" : "idle") :
          elapsed < shipStartTime ?
            "chopper" :
            elapsed < shipLandTime ?
              "ship-fall" :
              elapsed < playerExitStartTime ?
                "ship-landed" :
            isOpeningActive(now) ?
              "player-exit" :
              "release"
      };
    },
    requestOpening,
    update
  };
}
