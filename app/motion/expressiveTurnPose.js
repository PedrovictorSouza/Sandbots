const TWO_PI = Math.PI * 2;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function normalizeAngleRadians(angle) {
  if (!Number.isFinite(angle)) {
    return 0;
  }

  return ((((angle + Math.PI) % TWO_PI) + TWO_PI) % TWO_PI) - Math.PI;
}

export function getShortestAngleDeltaRadians(fromAngle, toAngle) {
  return normalizeAngleRadians(toAngle - fromAngle);
}

export function createExpressiveTurnPoseState({ initialYaw = 0 } = {}) {
  return {
    visualYaw: normalizeAngleRadians(initialYaw),
    pitch: 0,
    roll: 0,
    yawLag: 0
  };
}

export function updateExpressiveTurnPose(state, targetYaw, deltaTime = 0, {
  yawResponsiveness = 9,
  pitchResponsiveness = 7,
  rollResponsiveness = 11,
  yawLagForFullPose = Math.PI * 0.75,
  maxPitch = 0.07,
  maxRoll = 0.12
} = {}) {
  const poseState = state || createExpressiveTurnPoseState({ initialYaw: targetYaw });
  const dt = Math.max(0, Number(deltaTime) || 0);
  const safeYawLagForFullPose = Math.max(0.001, yawLagForFullPose);
  const target = normalizeAngleRadians(targetYaw);
  const yawBlend = dt > 0 ? 1 - Math.exp(-Math.max(0.001, yawResponsiveness) * dt) : 1;
  const nextYawDelta = getShortestAngleDeltaRadians(poseState.visualYaw, target);

  poseState.visualYaw = normalizeAngleRadians(poseState.visualYaw + nextYawDelta * yawBlend);
  poseState.yawLag = getShortestAngleDeltaRadians(poseState.visualYaw, target);

  const turnAmount = clamp(Math.abs(poseState.yawLag) / safeYawLagForFullPose, 0, 1);
  const pitchTarget = -turnAmount * maxPitch;
  const rollTarget = clamp(
    -poseState.yawLag / safeYawLagForFullPose,
    -1,
    1
  ) * maxRoll;
  const pitchBlend = dt > 0 ? 1 - Math.exp(-Math.max(0.001, pitchResponsiveness) * dt) : 1;
  const rollBlend = dt > 0 ? 1 - Math.exp(-Math.max(0.001, rollResponsiveness) * dt) : 1;

  poseState.pitch += (pitchTarget - poseState.pitch) * pitchBlend;
  poseState.roll += (rollTarget - poseState.roll) * rollBlend;

  return {
    yaw: poseState.visualYaw,
    pitch: poseState.pitch,
    roll: poseState.roll,
    yawLag: poseState.yawLag
  };
}
