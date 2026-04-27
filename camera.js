const WORLD_UP = [0, 1, 0];
const RETRO_RENDER_WIDTH = 426;
const RETRO_RENDER_HEIGHT = 240;
const DEG_TO_RAD = Math.PI / 180;

function mat4Identity() {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ]);
}

function mat4Orthographic(left, right, bottom, top, near, far) {
  const lr = 1 / (left - right);
  const bt = 1 / (bottom - top);
  const nf = 1 / (near - far);
  const out = mat4Identity();
  out[0] = -2 * lr;
  out[5] = -2 * bt;
  out[10] = 2 * nf;
  out[12] = (left + right) * lr;
  out[13] = (top + bottom) * bt;
  out[14] = (far + near) * nf;
  return out;
}

function mat4Perspective(fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy * 0.5);
  const nf = 1 / (near - far);
  const out = new Float32Array(16);

  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[14] = 2 * far * near * nf;

  return out;
}

function vec3Normalize(vector) {
  const length = Math.hypot(vector[0], vector[1], vector[2]) || 1;
  return [vector[0] / length, vector[1] / length, vector[2] / length];
}

function vec3Cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function vec3Subtract(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function vec3Lerp(a, b, t) {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

function numberLerp(a, b, t) {
  return a + (b - a) * t;
}

function easeOutCubic(value) {
  const t = Math.max(0, Math.min(1, value));
  return 1 - Math.pow(1 - t, 3);
}

function mat4LookAt(eye, target, up) {
  const zAxis = vec3Normalize(vec3Subtract(eye, target));
  const xAxis = vec3Normalize(vec3Cross(up, zAxis));
  const yAxis = vec3Cross(zAxis, xAxis);

  const out = mat4Identity();
  out[0] = xAxis[0];
  out[1] = yAxis[0];
  out[2] = zAxis[0];
  out[4] = xAxis[1];
  out[5] = yAxis[1];
  out[6] = zAxis[1];
  out[8] = xAxis[2];
  out[9] = yAxis[2];
  out[10] = zAxis[2];
  out[12] = -(xAxis[0] * eye[0] + xAxis[1] * eye[1] + xAxis[2] * eye[2]);
  out[13] = -(yAxis[0] * eye[0] + yAxis[1] * eye[1] + yAxis[2] * eye[2]);
  out[14] = -(zAxis[0] * eye[0] + zAxis[1] * eye[1] + zAxis[2] * eye[2]);
  return out;
}

function mat4Multiply(a, b) {
  const out = new Float32Array(16);
  const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
  const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
  const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
  const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

  const b00 = b[0], b01 = b[1], b02 = b[2], b03 = b[3];
  const b10 = b[4], b11 = b[5], b12 = b[6], b13 = b[7];
  const b20 = b[8], b21 = b[9], b22 = b[10], b23 = b[11];
  const b30 = b[12], b31 = b[13], b32 = b[14], b33 = b[15];

  out[0] = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03;
  out[1] = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03;
  out[2] = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03;
  out[3] = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03;
  out[4] = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13;
  out[5] = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13;
  out[6] = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13;
  out[7] = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13;
  out[8] = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23;
  out[9] = a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23;
  out[10] = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23;
  out[11] = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23;
  out[12] = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33;
  out[13] = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33;
  out[14] = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33;
  out[15] = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33;
  return out;
}

function transformPoint(matrix, point) {
  const x = point[0];
  const y = point[1];
  const z = point[2];
  const w = 1;

  return {
    x: matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12] * w,
    y: matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13] * w,
    z: matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14] * w,
    w: matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15] * w,
  };
}

export function createPokemonCamera({
  worldCanvas,
  spriteCanvas,
  mount,
  initialZoom = 3.15,
  target = [0, 1.35, 0],
  direction = [1.6, 1.15, 0],
  distance = 8,
  projectionMode = "perspective",
  followLeadDistance = 2.35,
  enableWheelZoom = false,
}) {
  const state = {
    zoom: initialZoom,
    fov: Math.max(34, Math.min(64, initialZoom * 9.5)) * DEG_TO_RAD,
    target: [...target],
    followHeight: target[1],
    direction: vec3Normalize(direction),
    distance,
    projectionMode,
    followLeadDistance,
    viewProjection: mat4Identity(),
    targetTransition: null,
    poseTransition: null,
  };

  function resizeCanvases() {
    const internalWidth = RETRO_RENDER_WIDTH;
    const internalHeight = RETRO_RENDER_HEIGHT;

    if (worldCanvas.width !== internalWidth || worldCanvas.height !== internalHeight) {
      worldCanvas.width = internalWidth;
      worldCanvas.height = internalHeight;
    }

    if (spriteCanvas.width !== internalWidth || spriteCanvas.height !== internalHeight) {
      spriteCanvas.width = internalWidth;
      spriteCanvas.height = internalHeight;
    }

    return { width: internalWidth, height: internalHeight };
  }

  function getEye() {
    return [
      state.target[0] + state.direction[0] * state.distance,
      state.target[1] + state.direction[1] * state.distance,
      state.target[2] + state.direction[2] * state.distance,
    ];
  }

  function getViewProjection(width, height) {
    const aspect = width / height;
    const projection =
      state.projectionMode === "perspective" ?
        mat4Perspective(state.fov, aspect, 0.08, 160) :
        (() => {
          const halfHeight = state.zoom;
          const halfWidth = state.zoom * aspect;
          return mat4Orthographic(
            -halfWidth,
            halfWidth,
            -halfHeight,
            halfHeight,
            0.1,
            100
          );
        })();
    const view = mat4LookAt(getEye(), state.target, WORLD_UP);
    state.viewProjection = mat4Multiply(projection, view);
    return state.viewProjection;
  }

  function project(worldPosition, viewportWidth, viewportHeight) {
    const clip = transformPoint(state.viewProjection, worldPosition);
    const clipX = clip.x / (clip.w || 1);
    const clipY = clip.y / (clip.w || 1);

    return {
      x: (clipX * 0.5 + 0.5) * viewportWidth,
      y: (1 - (clipY * 0.5 + 0.5)) * viewportHeight,
      depth: clip.z / (clip.w || 1),
    };
  }

  function getPixelsPerWorldUnit(viewportHeight) {
    if (state.projectionMode === "perspective") {
      return viewportHeight / Math.max(1, state.distance * Math.tan(state.fov * 0.5) * 2);
    }

    return viewportHeight / (state.zoom * 2);
  }

  function getMovementAxes() {
    const eye = getEye();
    const viewDirection = vec3Normalize(vec3Subtract(state.target, eye));
    const toCamera = vec3Normalize(vec3Subtract(eye, state.target));
    const upAxis = vec3Normalize([viewDirection[0], 0, viewDirection[2]]);
    const rightAxis = vec3Normalize(vec3Cross(WORLD_UP, toCamera));
    return {
      up: [upAxis[0], 0, upAxis[2]],
      right: [rightAxis[0], 0, rightAxis[2]],
    };
  }

  function getBillboardAxes() {
    const toCamera = vec3Normalize(vec3Subtract(getEye(), state.target));
    const right = vec3Normalize(vec3Cross(WORLD_UP, toCamera));
    const up = vec3Normalize(vec3Cross(toCamera, right));
    return {
      right,
      up,
    };
  }

  function follow(worldPosition) {
    const viewDirection = vec3Normalize([
      -state.direction[0],
      0,
      -state.direction[2]
    ]);

    state.target[0] = worldPosition[0] + viewDirection[0] * state.followLeadDistance;
    state.target[1] = state.followHeight + Math.max(0, worldPosition[1] || 0);
    state.target[2] = worldPosition[2] + viewDirection[2] * state.followLeadDistance;
  }

  function setTarget(targetPosition) {
    state.target[0] = targetPosition[0];
    state.target[1] = targetPosition[1];
    state.target[2] = targetPosition[2];
    state.targetTransition = null;
  }

  function startTargetTransition(targetPosition, { duration = 1.1 } = {}) {
    state.targetTransition = {
      from: [...state.target],
      to: [...targetPosition],
      elapsed: 0,
      duration: Math.max(0.001, duration),
    };
  }

  function update(deltaTime) {
    if (state.poseTransition) {
      state.poseTransition.elapsed = Math.min(
        state.poseTransition.duration,
        state.poseTransition.elapsed + deltaTime
      );

      const progress = easeOutCubic(
        state.poseTransition.elapsed / state.poseTransition.duration
      );
      const nextTarget = vec3Lerp(
        state.poseTransition.from.target,
        state.poseTransition.to.target,
        progress
      );
      const nextDirection = vec3Lerp(
        state.poseTransition.from.direction,
        state.poseTransition.to.direction,
        progress
      );

      state.target[0] = nextTarget[0];
      state.target[1] = nextTarget[1];
      state.target[2] = nextTarget[2];
      state.direction = vec3Normalize(nextDirection);
      state.zoom = numberLerp(state.poseTransition.from.zoom, state.poseTransition.to.zoom, progress);
      state.fov = Math.max(34, Math.min(64, state.zoom * 9.5)) * DEG_TO_RAD;
      state.distance = numberLerp(
        state.poseTransition.from.distance,
        state.poseTransition.to.distance,
        progress
      );

      if (state.poseTransition.elapsed >= state.poseTransition.duration) {
        state.poseTransition = null;
      }

      return;
    }

    if (!state.targetTransition) {
      return;
    }

    state.targetTransition.elapsed = Math.min(
      state.targetTransition.duration,
      state.targetTransition.elapsed + deltaTime
    );

    const progress = easeOutCubic(
      state.targetTransition.elapsed / state.targetTransition.duration
    );
    const nextTarget = vec3Lerp(
      state.targetTransition.from,
      state.targetTransition.to,
      progress
    );

    state.target[0] = nextTarget[0];
    state.target[1] = nextTarget[1];
    state.target[2] = nextTarget[2];

    if (state.targetTransition.elapsed >= state.targetTransition.duration) {
      state.targetTransition = null;
    }
  }

  function isTargetTransitionActive() {
    return Boolean(state.targetTransition || state.poseTransition);
  }

  function setDirection(nextDirection) {
    state.direction = vec3Normalize(nextDirection);
  }

  function setZoom(nextZoom) {
    state.zoom = Math.max(1.8, Math.min(6.4, nextZoom));
    state.fov = Math.max(34, Math.min(64, state.zoom * 9.5)) * DEG_TO_RAD;
  }

  function setDistance(nextDistance) {
    state.distance = Math.max(2.5, nextDistance);
  }

  function setPose({ target: targetPosition, direction: nextDirection, zoom: nextZoom, distance: nextDistance }) {
    state.poseTransition = null;

    if (targetPosition) {
      setTarget(targetPosition);
    }

    if (nextDirection) {
      setDirection(nextDirection);
    }

    if (typeof nextZoom === "number") {
      setZoom(nextZoom);
    }

    if (typeof nextDistance === "number") {
      setDistance(nextDistance);
    }
  }

  function getPose() {
    return {
      target: [...state.target],
      direction: [...state.direction],
      zoom: state.zoom,
      distance: state.distance
    };
  }

  function startPoseTransition(nextPose, { duration = 0.45 } = {}) {
    state.targetTransition = null;
    state.poseTransition = {
      from: getPose(),
      to: {
        ...getPose(),
        ...nextPose,
        target: nextPose.target ? [...nextPose.target] : [...state.target],
        direction: nextPose.direction ? vec3Normalize(nextPose.direction) : [...state.direction],
      },
      elapsed: 0,
      duration: Math.max(0.001, duration),
    };
  }

  if (enableWheelZoom) {
    mount.addEventListener("wheel", (event) => {
      event.preventDefault();
      state.zoom = Math.max(1.8, Math.min(6, state.zoom + event.deltaY * 0.004));
    }, { passive: false });
  }

  return {
    resizeCanvases,
    getViewProjection,
    project,
    getPixelsPerWorldUnit,
    getMovementAxes,
    getBillboardAxes,
    update,
    follow,
    startTargetTransition,
    startPoseTransition,
    isTargetTransitionActive,
    setTarget,
    setDirection,
    setZoom,
    setDistance,
    setPose,
    getPose,
  };
}
