export function updateIntroRoomFrame({
  introRoomScene,
  camera,
  worldCanvas,
  frame,
  deltaTime
}) {
  if (!introRoomScene?.isActive?.()) {
    return false;
  }

  introRoomScene.update(deltaTime);
  const renderSnapshot = introRoomScene.getRenderSnapshot({
    camera,
    worldCanvas
  });

  frame.render.viewProjection = renderSnapshot.viewProjection;
  frame.render.sceneObjects = renderSnapshot.sceneObjects;
  return true;
}
