const LARGE_TERRAIN_RADIUS = 10;

function getDrawDistance(sceneObject, instance) {
  if (
    instance?.terrainHillRadius >= LARGE_TERRAIN_RADIUS &&
    sceneObject?.distantTerrainDrawDistanceFromCameraTarget > 0
  ) {
    return sceneObject.distantTerrainDrawDistanceFromCameraTarget;
  }

  if (sceneObject?.terrainSupportDrawDistanceFromCameraTarget > 0) {
    return sceneObject.terrainSupportDrawDistanceFromCameraTarget;
  }

  return sceneObject?.drawDistanceFromCameraTarget || 0;
}

export function shouldDrawSceneInstance(instance, sceneObject, cameraTarget, options = null) {
  const drawDistance = getDrawDistance(sceneObject, instance);

  if (!(drawDistance > 0) || !Array.isArray(cameraTarget) || !Array.isArray(instance?.offset)) {
    return true;
  }

  let distanceSquared;
  if (typeof options?.getPlanarDistanceSquared === "function") {
    distanceSquared = options.getPlanarDistanceSquared(instance.offset, cameraTarget);
  } else {
    const dx = instance.offset[0] - cameraTarget[0];
    const dz = instance.offset[2] - cameraTarget[2];
    distanceSquared = dx * dx + dz * dz;
  }

  return distanceSquared <= drawDistance * drawDistance;
}
