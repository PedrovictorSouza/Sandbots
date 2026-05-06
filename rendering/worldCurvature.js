export const WORLD_CURVATURE_CONFIG = Object.freeze({
  enabled: true,
  strength: 0.00105,
  maxDrop: 18
});

export function resolveWorldCurvatureOrigin(cameraTarget = [0, 0, 0]) {
  return [
    Number(cameraTarget?.[0]) || 0,
    0,
    Number(cameraTarget?.[2]) || 0
  ];
}

export function getWorldCurvatureDrop(position, origin = [0, 0, 0], config = WORLD_CURVATURE_CONFIG) {
  if (!config?.enabled) {
    return 0;
  }

  const dx = (Number(position?.[0]) || 0) - (Number(origin?.[0]) || 0);
  const dz = (Number(position?.[2]) || 0) - (Number(origin?.[2]) || 0);
  const strength = Math.max(0, Number(config.strength) || 0);
  const maxDrop = Math.max(0, Number(config.maxDrop) || 0);

  return Math.min((dx * dx + dz * dz) * strength, maxDrop);
}

export function curveWorldPosition(position, origin = [0, 0, 0], config = WORLD_CURVATURE_CONFIG) {
  const nextPosition = [
    Number(position?.[0]) || 0,
    Number(position?.[1]) || 0,
    Number(position?.[2]) || 0
  ];
  nextPosition[1] -= getWorldCurvatureDrop(nextPosition, origin, config);
  return nextPosition;
}
