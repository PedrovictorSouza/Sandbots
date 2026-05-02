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
import { getGameplayOpeningShipDynamicBarrier } from "./gameplayOpeningShip.js";

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
    () => [
      ...DYNAMIC_BARRIERS.filter((barrier) => barrier.activeWhen(storyState)),
      getGameplayOpeningShipDynamicBarrier(session.gameplayOpeningShip)
    ].filter(Boolean),
    () => session.elevatedTerrainColliders
  );

  const keyboardController = createKeyboardController(camera, pressedKeys, {
    getAnalogMovement,
    isRunActive,
    consumeJumpRequest
  });

  session.spawnActTwoPlayer = ({
    preserveCamera = false,
    configureCamera = true,
    position = ACT_TWO_PLAYER_SPAWN
  } = {}) => {
    if (session.playerCharacter) {
      return;
    }

    session.playerCharacter = characterFactory.createCharacter({
      id: "player",
      position,
      speed: 5.1,
      worldHeight: 1.55,
      controller: keyboardController,
      collisionTest
    });
    session.playerCharacter.renderCharacter = false;

    if (session.playerModelInstance) {
      session.playerModelInstance.offset = [...position];
      session.playerModelInstance.scale = 0.75;
      session.playerModelInstance.yaw = -Math.PI * 0.5;
      session.playerModelInstance.active = true;
    }

    if (!configureCamera) {
      syncHudMeta(storyState, inventory, session.playerCharacter.getPosition());
      return;
    }

    if (preserveCamera) {
      const currentPose = camera.getPose();

      camera.startTargetTransition(
        [position[0], ACT_TWO_PLAYER_CAMERA_TARGET_HEIGHT, position[2]],
        { duration: 1.15 }
      );
      cameraOrbit.sync(currentPose.direction);
    } else {
      camera.setPose({
        target: [position[0], ACT_TWO_PLAYER_CAMERA_TARGET_HEIGHT, position[2]],
        direction: ACT_TWO_PLAYER_CAMERA_DIRECTION,
        zoom: ACT_TWO_PLAYER_CAMERA_ZOOM,
        distance: ACT_TWO_PLAYER_CAMERA_DISTANCE
      });
      cameraOrbit.sync(ACT_TWO_PLAYER_CAMERA_DIRECTION);
    }

    syncHudMeta(storyState, inventory, session.playerCharacter.getPosition());
  };
}
