export function createCameraOrbitController({
  camera,
  initialDirection,
  minPitch = -0.18,
  maxPitch = 1.12
}) {
  const orbitState = {
    yaw: 0,
    pitch: 0
  };

  function clampPitch(nextPitch) {
    return Math.max(minPitch, Math.min(maxPitch, nextPitch));
  }

  function sync(direction) {
    const length = Math.hypot(direction[0], direction[1], direction[2]) || 1;
    const normalized = [
      direction[0] / length,
      direction[1] / length,
      direction[2] / length
    ];

    orbitState.yaw = Math.atan2(normalized[2], normalized[0]);
    orbitState.pitch = Math.atan2(
      normalized[1],
      Math.hypot(normalized[0], normalized[2])
    );
    orbitState.pitch = clampPitch(orbitState.pitch);
  }

  function getDirection() {
    const planarLength = Math.max(0.18, Math.cos(orbitState.pitch));
    return [
      Math.cos(orbitState.yaw) * planarLength,
      Math.sin(orbitState.pitch),
      Math.sin(orbitState.yaw) * planarLength
    ];
  }

  function rotate(deltaYaw = 0, deltaPitch = 0) {
    orbitState.yaw += deltaYaw;
    orbitState.pitch = clampPitch(orbitState.pitch + deltaPitch);
    camera.setDirection(getDirection());
  }

  sync(initialDirection);

  return {
    getDirection,
    rotate,
    sync
  };
}
