export const GAMEPLAY_OPENING_SHIP_EVENTS = Object.freeze({
  FALL_STARTED: "gameplay-opening-ship:fall-started",
  IMPACT: "gameplay-opening-ship:impact",
  SETTLED: "gameplay-opening-ship:settled"
});

const FULL_UV_RECT = [0, 0, 1, 1];
const SHIP_MODEL_SCALE = 3;
const FALLING_SMOKE_SIZE_SCALE = 3.6;
const LANDED_SMOKE_SIZE_SCALE = 2.25;
const IMPACT_DUST_SIZE_SCALE = 4.8;
const IMPACT_DUST_RADIUS_SCALE = 4.1;
const IMPACT_DUST_LIFT_SCALE = 3.1;
const SHIP_COLLIDER_RADIUS = 2.8;
const DAMAGED_FRAGMENT_INDICES = Object.freeze([3, 4, 5]);
const LANDED_MODEL_POSE = Object.freeze({
  yaw: -0.52,
  pitch: 0.05,
  roll: -0.68
});
const AIRBORNE_MODEL_POSE = Object.freeze({
  yaw: -0.58,
  pitch: 0.34,
  roll: -0.52
});
const DAMAGED_FRAGMENT_POSES = Object.freeze([
  {
    primitiveIndex: 3,
    offset: [0.82, 0.02, -0.38],
    yaw: -0.9,
    pitch: -0.12,
    roll: -1.05
  },
  {
    primitiveIndex: 4,
    offset: [-0.64, 0.02, 0.46],
    yaw: 0.18,
    pitch: 0.16,
    roll: 0.78
  },
  {
    primitiveIndex: 5,
    offset: [0.28, 0.03, 0.88],
    yaw: 0.7,
    pitch: -0.2,
    roll: 1.18
  }
]);

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function lerpVector(from, to, amount) {
  return [
    from[0] + (to[0] - from[0]) * amount,
    from[1] + (to[1] - from[1]) * amount,
    from[2] + (to[2] - from[2]) * amount
  ];
}

function createEventState() {
  return {
    fallStarted: false,
    impact: false,
    settled: false
  };
}

function ensureEventState(ship) {
  if (!ship.eventState) {
    ship.eventState = createEventState();
  }

  if (!Array.isArray(ship.events)) {
    ship.events = [];
  }

  return ship.eventState;
}

function emitOnce(ship, eventKey, type, payload) {
  const eventState = ensureEventState(ship);

  if (eventState[eventKey]) {
    return;
  }

  eventState[eventKey] = true;
  ship.events.push({
    type,
    ...payload
  });
}

function scaleSize(size, scale) {
  return [size[0] * scale, size[1] * scale];
}

function buildImpactDust(position, impactProgress) {
  if (impactProgress <= 0) {
    return [];
  }

  const dustProgress = clamp01(impactProgress);
  const dustCount = Math.ceil(9 + dustProgress * 11);
  const dust = [];

  for (let index = 0; index < dustCount; index += 1) {
    const angle = index * 1.79 + dustProgress * 1.3;
    const radius =
      (0.24 + index * 0.12) *
      (0.25 + dustProgress) *
      IMPACT_DUST_RADIUS_SCALE;
    const lift =
      Math.sin(dustProgress * Math.PI) *
      (0.32 + index * 0.035) *
      IMPACT_DUST_LIFT_SCALE;
    const size = (0.38 + (index % 4) * 0.07) * (1 - dustProgress * 0.22);

    dust.push({
      position: [
        position[0] + Math.cos(angle) * radius,
        position[1] + 0.2 + lift,
        position[2] + Math.sin(angle) * radius
      ],
      size: scaleSize([size * 1.55, size], IMPACT_DUST_SIZE_SCALE),
      rotation: angle + dustProgress * 7.2 + index * 0.19,
      alpha: clamp01(1 - dustProgress * 0.92)
    });
  }

  return dust;
}

function buildSmokeTrail(
  position,
  elapsed,
  intensity = 1,
  {
    sizeScale = 1,
    countScale = 1,
    spread = 1
  } = {}
) {
  const smoke = [];
  const smokeCount = Math.max(3, Math.round(7 * intensity * countScale));

  for (let index = 0; index < smokeCount; index += 1) {
    const age = index / smokeCount;
    const sway = Math.sin(elapsed * 5.7 + index * 1.31) * 0.12 * spread;
    const rise = age * (0.4 + intensity * 0.22);
    const drift = age * (0.22 + intensity * 0.12) * spread;
    const size = (0.24 + age * 0.36) * (0.72 + intensity * 0.32);

    smoke.push({
      position: [
        position[0] - 0.18 - drift + sway,
        position[1] + 0.36 + rise,
        position[2] + 0.1 + age * 0.16
      ],
      size: scaleSize([size * 1.35, size], sizeScale),
      rotation: Math.sin(elapsed * 0.8 + index * 0.57) * 0.18,
      alpha: clamp01((1 - age) * 0.92)
    });
  }

  return smoke;
}

function buildShipSmoke(position, elapsed, landed) {
  if (landed) {
    return [
      ...buildSmokeTrail(
        [position[0] + 0.88, position[1] + 0.74, position[2] - 0.42],
        elapsed,
        0.95,
        {
          sizeScale: LANDED_SMOKE_SIZE_SCALE,
          countScale: 1.35,
          spread: 1.35
        }
      ),
      ...buildSmokeTrail(
        [position[0] - 0.62, position[1] + 0.58, position[2] + 0.34],
        elapsed + 0.47,
        0.66,
        {
          sizeScale: LANDED_SMOKE_SIZE_SCALE * 0.82,
          countScale: 1.2,
          spread: 1.1
        }
      )
    ];
  }

  const trailSmoke = buildSmokeTrail(
    [position[0] - 0.7, position[1] + 0.74, position[2] + 0.54],
    elapsed,
    1.28,
    {
      sizeScale: FALLING_SMOKE_SIZE_SCALE,
      countScale: 1.45,
      spread: 1.55
    }
  );
  const damageSmoke = buildSmokeTrail(
    [
      position[0] + 0.82,
      position[1] + 0.2,
      position[2] - 0.52
    ],
    elapsed + 0.31,
    0.9,
    {
      sizeScale: FALLING_SMOKE_SIZE_SCALE * 0.92,
      countScale: 1.25,
      spread: 1.35
    }
  );

  return [
    ...trailSmoke,
    ...damageSmoke
  ];
}

function buildImpactFlash(position, impactProgress) {
  if (impactProgress <= 0 || impactProgress > 0.95) {
    return null;
  }

  const flashProgress = impactProgress / 0.95;
  const size = 2.1 * (1 - flashProgress * 0.68);

  return {
    position: [position[0], position[1] + 0.34, position[2]],
    size: [size * 1.4, size]
  };
}

function hideShip(ship) {
  ship.visible = false;
  ship.phase = "waiting";
  ship.dust = [];
  ship.flash = null;
  ship.smoke = [];

  if (ship.modelInstance) {
    ship.modelInstance.active = false;
  }
}

function syncModelInstance(ship) {
  const modelInstance = ship?.modelInstance || null;

  if (!modelInstance) {
    return null;
  }

  const visible = Boolean(ship.visible && Array.isArray(ship.position));
  modelInstance.active = visible;

  if (!visible) {
    return modelInstance;
  }

  const pose = ship.position[1] > 0.45 ? AIRBORNE_MODEL_POSE : LANDED_MODEL_POSE;
  modelInstance.offset = [...ship.position];
  modelInstance.scale = SHIP_MODEL_SCALE;
  modelInstance.yaw = pose.yaw;
  modelInstance.pitch = pose.pitch;
  modelInstance.roll = pose.roll;
  return modelInstance;
}

function createPrimitiveModel(model, primitives) {
  return {
    ...model,
    primitives
  };
}

function getDamagedShipSceneObjects(ship, modelInstance) {
  const model = ship?.model;

  if (!model?.primitives?.length || ship.phase !== "landed") {
    return [
      {
        model,
        instances: [modelInstance],
        brightness: 0.92
      }
    ];
  }

  const movedPrimitiveIndices = new Set(DAMAGED_FRAGMENT_INDICES);
  const bodyPrimitives = model.primitives.filter((primitive, index) => {
    return primitive && !movedPrimitiveIndices.has(index);
  });
  const sceneObjects = [];

  if (bodyPrimitives.length) {
    sceneObjects.push({
      model: createPrimitiveModel(model, bodyPrimitives),
      instances: [modelInstance],
      brightness: 0.92
    });
  }

  for (const fragmentPose of DAMAGED_FRAGMENT_POSES) {
    const primitive = model.primitives[fragmentPose.primitiveIndex];

    if (!primitive) {
      continue;
    }

    sceneObjects.push({
      model: createPrimitiveModel(model, [primitive]),
      instances: [
        {
          offset: [
            modelInstance.offset[0] + fragmentPose.offset[0],
            modelInstance.offset[1] + fragmentPose.offset[1],
            modelInstance.offset[2] + fragmentPose.offset[2]
          ],
          scale: SHIP_MODEL_SCALE,
          yaw: fragmentPose.yaw,
          pitch: fragmentPose.pitch,
          roll: fragmentPose.roll,
          active: true
        }
      ],
      brightness: 0.86
    });
  }

  return sceneObjects;
}

export function createGameplayOpeningShipState({ model = null } = {}) {
  return {
    visible: false,
    phase: "waiting",
    position: null,
    size: null,
    dust: [],
    flash: null,
    smoke: [],
    events: [],
    eventState: createEventState(),
    model,
    modelInstance: {
      offset: [0, -999, 0],
      scale: SHIP_MODEL_SCALE,
      yaw: LANDED_MODEL_POSE.yaw,
      pitch: LANDED_MODEL_POSE.pitch,
      roll: LANDED_MODEL_POSE.roll,
      active: false
    }
  };
}

export function updateGameplayOpeningShipFall(ship, {
  elapsed,
  shipStartTime,
  shipLandTime,
  shipStartPosition,
  shipLandPosition,
  shipSize
}) {
  if (!ship) {
    return;
  }

  ensureEventState(ship);

  if (elapsed < shipStartTime) {
    hideShip(ship);
    return;
  }

  emitOnce(ship, "fallStarted", GAMEPLAY_OPENING_SHIP_EVENTS.FALL_STARTED, {
    elapsed,
    position: [...shipStartPosition]
  });

  const fallDuration = Math.max(0.001, shipLandTime - shipStartTime);
  const fallProgress = clamp01((elapsed - shipStartTime) / fallDuration);
  const impactAge = elapsed - shipLandTime;
  const impactProgress =
    impactAge < -0.08 || impactAge > 1.8 ?
      0 :
      clamp01((impactAge + 0.12) / 1.42);
  const position = lerpVector(
    shipStartPosition,
    shipLandPosition,
    Math.pow(fallProgress, 2.35)
  );
  const landed = fallProgress >= 1;
  const smokePosition = landed ? shipLandPosition : position;

  if (impactAge >= 0) {
    emitOnce(ship, "impact", GAMEPLAY_OPENING_SHIP_EVENTS.IMPACT, {
      elapsed,
      position: [...shipLandPosition]
    });
  }

  if (landed && impactAge >= 0.28) {
    emitOnce(ship, "settled", GAMEPLAY_OPENING_SHIP_EVENTS.SETTLED, {
      elapsed,
      position: [...shipLandPosition]
    });
  }

  ship.visible = true;
  ship.phase = landed ? "landed" : "falling";
  ship.position = landed ? [...shipLandPosition] : position;
  ship.size = landed && impactAge >= 0 && impactAge < 0.28 ?
    scaleSize([shipSize[0] * 1.12, shipSize[1] * 0.86], SHIP_MODEL_SCALE) :
    scaleSize([...shipSize], SHIP_MODEL_SCALE);
  ship.dust = buildImpactDust(shipLandPosition, impactProgress);
  ship.flash = buildImpactFlash(shipLandPosition, impactProgress);
  ship.smoke = buildShipSmoke(
    smokePosition,
    elapsed,
    landed
  );
}

export function updateGameplayOpeningShipPersistentSmoke(ship, { now, smokeUntil }) {
  if (!ship?.visible || !Array.isArray(ship.position)) {
    return;
  }

  if (typeof smokeUntil !== "number" || now > smokeUntil) {
    ship.smoke = [];
    ship.flash = null;
    return;
  }

  ship.smoke = buildShipSmoke(ship.position, now * 0.001, true);
  ship.flash = null;
}

export function clearGameplayOpeningShipImpactEffects(ship) {
  if (!ship) {
    return;
  }

  ship.dust = [];
}

export function consumeGameplayOpeningShipEvents(ship) {
  if (!ship || !Array.isArray(ship.events)) {
    return [];
  }

  const events = [...ship.events];
  ship.events.length = 0;
  return events;
}

export function getGameplayOpeningShipDynamicBarrier(ship) {
  if (!ship?.visible || ship.phase !== "landed" || !Array.isArray(ship.position)) {
    return null;
  }

  return {
    id: "gameplay-opening-ship-collider",
    position: [...ship.position],
    radius: SHIP_COLLIDER_RADIUS
  };
}

export function getGameplayOpeningShipSceneObjects(sceneObjects, ship) {
  const modelInstance = syncModelInstance(ship);

  if (!ship?.model || !modelInstance) {
    return sceneObjects;
  }

  return [
    ...sceneObjects,
    ...getDamagedShipSceneObjects(ship, modelInstance)
  ];
}

export function appendGameplayOpeningShipBillboards({
  billboards,
  ship,
  fallbackTexture,
  dustTexture,
  smokeTexture,
  flashTexture,
  fullUvRect = FULL_UV_RECT
}) {
  if (!ship?.visible) {
    return;
  }

  if (!ship.model && fallbackTexture) {
    billboards.push({
      texture: fallbackTexture,
      position: ship.position,
      size: ship.size,
      uvRect: fullUvRect
    });
  }

  billboards.push(
    ...(ship.dust || []).map((dustParticle) => ({
      texture: dustTexture,
      position: dustParticle.position,
      size: dustParticle.size,
      alpha: dustParticle.alpha,
      rotation: dustParticle.rotation,
      uvRect: fullUvRect
    }))
  );
  billboards.push(
    ...(ship.smoke || []).map((smokeParticle) => ({
      texture: smokeTexture,
      position: smokeParticle.position,
      size: smokeParticle.size,
      alpha: smokeParticle.alpha,
      rotation: smokeParticle.rotation,
      uvRect: fullUvRect
    }))
  );

  if (ship.flash) {
    billboards.push({
      texture: flashTexture,
      position: ship.flash.position,
      size: ship.flash.size,
      uvRect: fullUvRect
    });
  }
}
