import {
  INTRO_ROOM_CAMERA_POSE,
  INTRO_ROOM_CHOPPER_ACTOR,
  INTRO_ROOM_CORRUPTION_FOCUS_POINT,
  INTRO_ROOM_ENTRY_DELAY,
  INTRO_ROOM_ENTRY_KEYFRAMES,
  INTRO_ROOM_FLOOR_INSTANCES
} from "./introRoomConfig.js";

const INTRO_ROOM_ENTRY_DURATION = INTRO_ROOM_ENTRY_KEYFRAMES.at(-1)?.time || 0;
const INTRO_ROOM_ENTRY_TOTAL_DURATION = INTRO_ROOM_ENTRY_DELAY + INTRO_ROOM_ENTRY_DURATION;
const INTRO_ROOM_ENTRY_SEGMENTS = createEntrySegments(INTRO_ROOM_ENTRY_KEYFRAMES);
const INTRO_ROOM_ENTRY_DISTANCE = INTRO_ROOM_ENTRY_SEGMENTS.reduce(
  (total, segment) => total + segment.distance,
  0
);

function cloneActor(actor) {
  return {
    ...actor,
    position: [...actor.position],
    rotation: {
      yaw: actor.rotation?.yaw ?? actor.yaw ?? 0,
      pitch: actor.rotation?.pitch ?? 0,
      roll: actor.rotation?.roll ?? 0
    }
  };
}

function getTimeSeconds() {
  return typeof performance !== "undefined" ? performance.now() * 0.001 : Date.now() * 0.001;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0, edge1, value) {
  const amount = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return amount * amount * (3 - 2 * amount);
}

function catmullRom(previous, current, next, following, amount) {
  const t = clamp(amount, 0, 1);
  const t2 = t * t;
  const t3 = t2 * t;

  return 0.5 * (
    (2 * current) +
    (-previous + next) * t +
    (2 * previous - 5 * current + 4 * next - following) * t2 +
    (-previous + 3 * current - 3 * next + following) * t3
  );
}

function getVectorDistance(first, second) {
  const x = second[0] - first[0];
  const y = second[1] - first[1];
  const z = second[2] - first[2];

  return Math.hypot(x, y, z);
}

function createEntrySegments(keyframes) {
  return keyframes.slice(0, -1).map((keyframe, index) => ({
    index,
    distance: Math.max(0.001, getVectorDistance(keyframe.position, keyframes[index + 1].position))
  }));
}

function cloneSceneInstance(instance) {
  return {
    ...instance,
    offset: [...instance.offset]
  };
}

function isIntroRestoredFloorInstance(instance) {
  return Math.abs(instance.offset?.[0] || 0) < 0.001 &&
    Math.abs(instance.offset?.[2] || 0) < 0.001;
}

function normalizeAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function getYawToward(fromPosition, toPosition) {
  const deltaX = toPosition[0] - fromPosition[0];
  const deltaZ = toPosition[2] - fromPosition[2];
  return Math.atan2(deltaX, deltaZ);
}

function getIntroConcernWeight(elapsed) {
  const leanIn = smoothstep(0.2, 1.1, elapsed);
  const leanOut = 1 - smoothstep(3.2, 4.3, elapsed);
  return leanIn * leanOut;
}

function interpolateVector(keyframes, index, amount, field) {
  const previous = keyframes[Math.max(0, index - 1)][field];
  const current = keyframes[index][field];
  const next = keyframes[index + 1][field];
  const following = keyframes[Math.min(keyframes.length - 1, index + 2)][field];

  return current.map((value, componentIndex) => catmullRom(
    previous[componentIndex],
    value,
    next[componentIndex],
    following[componentIndex],
    amount
  ));
}

function interpolateScalar(keyframes, index, amount, getValue) {
  return catmullRom(
    getValue(keyframes[Math.max(0, index - 1)]),
    getValue(keyframes[index]),
    getValue(keyframes[index + 1]),
    getValue(keyframes[Math.min(keyframes.length - 1, index + 2)]),
    amount
  );
}

function findEntrySegment(time) {
  const pathDistance = INTRO_ROOM_ENTRY_DISTANCE * clamp(time / INTRO_ROOM_ENTRY_DURATION, 0, 1);
  let traveledDistance = 0;

  for (const segment of INTRO_ROOM_ENTRY_SEGMENTS) {
    const nextTraveledDistance = traveledDistance + segment.distance;

    if (pathDistance <= nextTraveledDistance) {
      return {
        index: segment.index,
        amount: (pathDistance - traveledDistance) / segment.distance
      };
    }

    traveledDistance = nextTraveledDistance;
  }

  const lastSegment = INTRO_ROOM_ENTRY_SEGMENTS.at(-1);
  return {
    index: lastSegment.index,
    amount: 1
  };
}

function getInterpolatedEntryPose(time) {
  if (time <= 0) {
    return INTRO_ROOM_ENTRY_KEYFRAMES[0];
  }

  if (time >= INTRO_ROOM_ENTRY_DURATION) {
    return INTRO_ROOM_ENTRY_KEYFRAMES.at(-1);
  }

  const { index, amount } = findEntrySegment(time);

  return {
    position: interpolateVector(INTRO_ROOM_ENTRY_KEYFRAMES, index, amount, "position"),
    rotation: {
      yaw: interpolateScalar(INTRO_ROOM_ENTRY_KEYFRAMES, index, amount, (keyframe) => keyframe.rotation.yaw),
      pitch: interpolateScalar(INTRO_ROOM_ENTRY_KEYFRAMES, index, amount, (keyframe) => keyframe.rotation.pitch),
      roll: interpolateScalar(INTRO_ROOM_ENTRY_KEYFRAMES, index, amount, (keyframe) => keyframe.rotation.roll)
    },
    scale: interpolateScalar(INTRO_ROOM_ENTRY_KEYFRAMES, index, amount, (keyframe) => keyframe.scale)
  };
}

function assertIntroRoomAssets(assets) {
  if (!assets?.chopperBodyModel) {
    throw new Error("IntroRoomScene: assets.chopperBodyModel ausente.");
  }

  if (!assets?.chopperPropellerModel) {
    throw new Error("IntroRoomScene: assets.chopperPropellerModel ausente.");
  }

  if (
    assets.chopperBodyModel === assets.groundDeadModel ||
    assets.chopperBodyModel === assets.groundPurifiedModel
  ) {
    throw new Error("IntroRoomScene: assets.chopperBodyModel nao pode apontar para modelo de ground.");
  }
}

export function buildIntroRoomScene(assets) {
  assertIntroRoomAssets(assets);

  const chopperIntroActor = cloneActor(INTRO_ROOM_CHOPPER_ACTOR);
  const chopperBodyInstance = {
    offset: chopperIntroActor.position,
    scale: chopperIntroActor.scale,
    yaw: chopperIntroActor.rotation.yaw,
    pitch: chopperIntroActor.rotation.pitch,
    roll: chopperIntroActor.rotation.roll
  };

  const chopperPropellerInstance = {
    offset: chopperIntroActor.position,
    scale: chopperIntroActor.scale,
    yaw: chopperIntroActor.rotation.yaw,
    pitch: chopperIntroActor.rotation.pitch,
    roll: chopperIntroActor.rotation.roll,

    localYaw: 0,
    localPivot: [0.125, 2, 0]
  };
  const introDeadFloorInstances = INTRO_ROOM_FLOOR_INSTANCES
    .filter((instance) => !isIntroRestoredFloorInstance(instance))
    .map(cloneSceneInstance);
  const introRestoredFloorInstances = INTRO_ROOM_FLOOR_INSTANCES
    .filter(isIntroRestoredFloorInstance)
    .map(cloneSceneInstance);
  const sceneObjects = [
     {
      model: assets.chopperBodyModel,
      instances: [chopperBodyInstance],
      brightness: 1
    },
    {
      model: assets.chopperPropellerModel,
      instances: [chopperPropellerInstance],
      brightness: 1
    }
  ];

  if (assets.groundDeadModel && introDeadFloorInstances.length) {
    sceneObjects.push({
      model: assets.groundDeadModel,
      instances: introDeadFloorInstances,
      brightness: 0.5
    });
  }

  if (assets.groundPurifiedModel && introRestoredFloorInstances.length) {
    sceneObjects.push({
      model: assets.groundPurifiedModel,
      instances: introRestoredFloorInstances,
      brightness: 0.86
    });
  }

  let active = false;
  let debugControlsActive = false;
  const animationState = {
    startedAt: 0,
    complete: false,
    completedAt: 0
  };
  const propellerState = {
    angle: 0,
    speed: 24
  };

  function syncChopperInstance({
  idleYaw = 0,
  idlePitch = 0,
  idleRoll = 0,
  idleXOffset = 0,
  idleYOffset = 0,
  idleZOffset = 0
} = {}) {
  const offset = [
    chopperIntroActor.position[0] + idleXOffset,
    chopperIntroActor.position[1] + idleYOffset,
    chopperIntroActor.position[2] + idleZOffset
  ];

  const scale = chopperIntroActor.scale;

  chopperBodyInstance.yaw = chopperIntroActor.rotation.yaw + idleYaw;  
  chopperBodyInstance.pitch = chopperIntroActor.rotation.pitch + idlePitch;
  chopperBodyInstance.roll = chopperIntroActor.rotation.roll + idleRoll;
  chopperBodyInstance.offset = offset;
  chopperBodyInstance.scale = scale;

  chopperPropellerInstance.yaw =
  chopperIntroActor.rotation.yaw + idleYaw;

  chopperPropellerInstance.pitch =
    chopperIntroActor.rotation.pitch + idlePitch;

  chopperPropellerInstance.roll =
    chopperIntroActor.rotation.roll + idleRoll;

  chopperPropellerInstance.localYaw = propellerState.angle;

  chopperPropellerInstance.offset = offset;
  chopperPropellerInstance.scale = scale;
}

  function normalizeChopperPose(pose = {}) {
    const rotation = pose.rotation || {};

    return {
      position: Array.isArray(pose.position) ? [...pose.position] : [...chopperIntroActor.position],
      rotation: {
        yaw: Number.isFinite(Number(rotation.yaw)) ? Number(rotation.yaw) : chopperIntroActor.rotation.yaw,
        pitch: Number.isFinite(Number(rotation.pitch)) ? Number(rotation.pitch) : chopperIntroActor.rotation.pitch,
        roll: Number.isFinite(Number(rotation.roll)) ? Number(rotation.roll) : chopperIntroActor.rotation.roll
      },
      scale: Number.isFinite(Number(pose.scale)) ? Number(pose.scale) : chopperIntroActor.scale
    };
  }

  function applyChopperPose(pose) {
    const nextPose = normalizeChopperPose(pose);

    chopperIntroActor.position = nextPose.position;
    chopperIntroActor.rotation = nextPose.rotation;
    chopperIntroActor.yaw = nextPose.rotation.yaw;
    chopperIntroActor.scale = nextPose.scale;
    syncChopperInstance();
  }

  function getCameraPose({ camera } = {}) {
    return camera?.getPose?.() || {
      target: [...INTRO_ROOM_CAMERA_POSE.target],
      direction: [...INTRO_ROOM_CAMERA_POSE.direction],
      zoom: INTRO_ROOM_CAMERA_POSE.zoom,
      distance: INTRO_ROOM_CAMERA_POSE.distance
    };
  }

  return {
    chopperIntroActor,

    enter({ camera, cameraOrbit } = {}) {
      active = true;
      debugControlsActive = false;
      animationState.startedAt = getTimeSeconds();
      animationState.complete = false;
      animationState.completedAt = 0;
      const firstPose = INTRO_ROOM_ENTRY_KEYFRAMES[0];
      chopperIntroActor.position = [...firstPose.position];
      chopperIntroActor.rotation = { ...firstPose.rotation };
      chopperIntroActor.yaw = firstPose.rotation.yaw;
      chopperIntroActor.scale = firstPose.scale;
      syncChopperInstance();
      camera?.setPose?.(INTRO_ROOM_CAMERA_POSE);
      cameraOrbit?.sync?.(INTRO_ROOM_CAMERA_POSE.direction);
    },

    exit() {
      active = false;
    },

    isActive() {
      return active;
    },

    update(deltaTime = 0) {
      propellerState.angle =
        (propellerState.angle + deltaTime * propellerState.speed) % (Math.PI * 2);
      const time = getTimeSeconds();

      if (!debugControlsActive && !animationState.complete) {
        const elapsed = time - animationState.startedAt;
        const entryTime = Math.max(0, elapsed - INTRO_ROOM_ENTRY_DELAY);
        const entryPose = getInterpolatedEntryPose(entryTime);

        applyChopperPose(entryPose);
        animationState.complete = elapsed >= INTRO_ROOM_ENTRY_TOTAL_DURATION;
        if (animationState.complete && animationState.completedAt === 0) {
          animationState.completedAt = time;
        }

        if (!animationState.complete) {
          return;
        }
      }

      const idleTime = time + deltaTime;
      const concernWeight = debugControlsActive || animationState.completedAt === 0 ?
        0 :
        getIntroConcernWeight(time - animationState.completedAt);
      const corruptionYaw = getYawToward(
        chopperIntroActor.position,
        INTRO_ROOM_CORRUPTION_FOCUS_POINT
      );
      const concernYaw = normalizeAngle(
        corruptionYaw - chopperIntroActor.rotation.yaw
      ) * concernWeight;
      const idleYaw = debugControlsActive ? 0 : Math.sin(idleTime * 1.55) * 0.035;
      const idlePitch = debugControlsActive ? 0 : -0.09 * concernWeight;
      const idleRoll = debugControlsActive ?
        0 :
        Math.sin(idleTime * 1.35 + 0.8) * 0.045 - 0.075 * concernWeight;
      const idleXOffset = debugControlsActive ? 0 : Math.sin(idleTime * 1.25) * 0.08;
      const idleYOffset = debugControlsActive ? 0 : Math.sin(idleTime * 2.1) * 0.055;
      const idleZOffset = debugControlsActive ? 0 : Math.cos(idleTime * 1.15) * 0.025;

      syncChopperInstance({
        idleYaw: idleYaw + concernYaw,
        idlePitch,
        idleRoll,
        idleXOffset,
        idleYOffset,
        idleZOffset
      });
    },

    getRenderSnapshot({ camera, worldCanvas }) {
      return {
        viewProjection: camera.getViewProjection(worldCanvas.width, worldCanvas.height),
        sceneObjects
      };
    },

    getChopperPose() {
      return {
        id: chopperIntroActor.id,
        state: chopperIntroActor.state,
        position: [...chopperIntroActor.position],
        rotation: { ...chopperIntroActor.rotation },
        scale: chopperIntroActor.scale
      };
    },

    setChopperPose(pose) {
      applyChopperPose(pose);
    },

    getCameraPose({ camera } = {}) {
      return getCameraPose({ camera });
    },

    setCameraPose(pose = {}, { camera, cameraOrbit } = {}) {
      const currentPose = getCameraPose({ camera });
      const nextPose = {
        target: Array.isArray(pose.target) ? [...pose.target] : currentPose.target,
        direction: Array.isArray(pose.direction) ? [...pose.direction] : currentPose.direction,
        zoom: Number.isFinite(Number(pose.zoom)) ? Number(pose.zoom) : currentPose.zoom,
        distance: Number.isFinite(Number(pose.distance)) ? Number(pose.distance) : currentPose.distance
      };

      camera?.setPose?.(nextPose);
      if (nextPose.direction) {
        cameraOrbit?.sync?.(nextPose.direction);
      }
    },

    getIntroUiDelayMs() {
      return INTRO_ROOM_ENTRY_TOTAL_DURATION * 1000;
    },

    setDebugControlsActive(enabled) {
      debugControlsActive = Boolean(enabled);
      if (debugControlsActive) {
        animationState.complete = true;
      }
      syncChopperInstance();
    }
  };
}
