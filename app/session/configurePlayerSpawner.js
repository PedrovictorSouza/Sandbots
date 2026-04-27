import {
  ACT_TWO_PLAYER_CAMERA_DIRECTION,
  ACT_TWO_PLAYER_CAMERA_DISTANCE,
  ACT_TWO_PLAYER_CAMERA_TARGET_HEIGHT,
  ACT_TWO_PLAYER_CAMERA_ZOOM,
  ACT_TWO_PLAYER_SPAWN
} from "../../actTwoSceneConfig.js";

import {
  DYNAMIC_BARRIERS
} from "../../gameplayContent.js";

import {
  createCollisionChecker,
  createKeyboardController
} from "../../world/islandWorld.js";

export function configurePlayerSpawner(
  session,
  assets,
  {
    camera,
    cameraOrbit,
    pressedKeys,
    getAnalogMovement,
    isRunActive,
    consumeJumpRequest,
    storyState,
    inventory,
    syncHudMeta
  }
) {
  const { houseModel, palmModel, characterFactory } = assets;

  const collisionTest = createCollisionChecker(
    houseModel,
    palmModel,
    session.palmInstances,
    () => DYNAMIC_BARRIERS.filter((barrier) => barrier.activeWhen(storyState)),
    () => session.elevatedTerrainColliders
  );

  const keyboardController = createKeyboardController(camera, pressedKeys, {
    getAnalogMovement,
    isRunActive,
    consumeJumpRequest
  });

  session.spawnActTwoPlayer = ({ preserveCamera = false } = {}) => {
    if (session.playerCharacter) {
      return;
    }

    session.playerCharacter = characterFactory.createCharacter({
      id: "player",
      position: ACT_TWO_PLAYER_SPAWN,
      speed: 5.1,
      worldHeight: 1.55,
      controller: keyboardController,
      collisionTest
    });

    if (preserveCamera) {
      const currentPose = camera.getPose();

      camera.startTargetTransition(
        [ACT_TWO_PLAYER_SPAWN[0], ACT_TWO_PLAYER_CAMERA_TARGET_HEIGHT, ACT_TWO_PLAYER_SPAWN[2]],
        { duration: 1.15 }
      );
      cameraOrbit.sync(currentPose.direction);
    } else {
      camera.setPose({
        target: [ACT_TWO_PLAYER_SPAWN[0], ACT_TWO_PLAYER_CAMERA_TARGET_HEIGHT, ACT_TWO_PLAYER_SPAWN[2]],
        direction: ACT_TWO_PLAYER_CAMERA_DIRECTION,
        zoom: ACT_TWO_PLAYER_CAMERA_ZOOM,
        distance: ACT_TWO_PLAYER_CAMERA_DISTANCE
      });
      cameraOrbit.sync(ACT_TWO_PLAYER_CAMERA_DIRECTION);
    }

    syncHudMeta(storyState, inventory, session.playerCharacter.getPosition());
  };
}
