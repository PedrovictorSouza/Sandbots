const DIALOGUE_CAMERA_TRANSITION_DURATION = 0.45;
const DIALOGUE_CAMERA_TARGET_HEIGHT = 1.25;
const DIALOGUE_CAMERA_BASE_DISTANCE = 5.4;
const DIALOGUE_CAMERA_ZOOM = 3.9;
const DIALOGUE_CAMERA_POINT_FOCUS_HEIGHT = 0.9;
const DIALOGUE_CAMERA_POINT_FOCUS_DISTANCE = 6.2;
const DIALOGUE_CAMERA_POINT_FOCUS_ZOOM = 4.45;

function normalize2([x, z]) {
  const length = Math.hypot(x, z) || 1;
  return [x / length, z / length];
}

function dot3(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function getNpcPosition(npcActors, interactables, targetId) {
  const npcActor = npcActors.find((actor) => actor.id === targetId);
  const interactable = interactables.find((item) => item.id === targetId);
  return npcActor?.character?.getPosition?.() || interactable?.position || null;
}

function buildDialogueCameraPose({ camera, playerPosition, npcPosition }) {
  const midpoint = [
    (playerPosition[0] + npcPosition[0]) * 0.5,
    DIALOGUE_CAMERA_TARGET_HEIGHT,
    (playerPosition[2] + npcPosition[2]) * 0.5
  ];
  const toNpc = normalize2([
    npcPosition[0] - playerPosition[0],
    npcPosition[2] - playerPosition[2]
  ]);
  const side = [toNpc[1], -toNpc[0]];
  const currentDirection = camera.getPose().direction;
  const rightSideDirection = [side[0], 0.34, side[1]];
  const leftSideDirection = [-side[0], 0.34, -side[1]];
  const direction =
    dot3(currentDirection, rightSideDirection) >= dot3(currentDirection, leftSideDirection) ?
      rightSideDirection :
      leftSideDirection;
  const characterGap = Math.hypot(
    npcPosition[0] - playerPosition[0],
    npcPosition[2] - playerPosition[2]
  );

  return {
    target: midpoint,
    direction,
    zoom: DIALOGUE_CAMERA_ZOOM,
    distance: Math.max(DIALOGUE_CAMERA_BASE_DISTANCE, characterGap * 2.7)
  };
}

export function createDialogueCameraController({ camera, cameraOrbit }) {
  let restorePose = null;

  function captureRestorePose() {
    if (!restorePose) {
      restorePose = camera.getPose();
    }
  }

  function focusNpcConversation({
    playerPosition,
    npcActors = [],
    interactables = [],
    targetId,
    targetPosition = null
  }) {
    const npcPosition = targetPosition || getNpcPosition(npcActors, interactables, targetId);

    if (!npcPosition) {
      return;
    }

    captureRestorePose();
    const dialoguePose = buildDialogueCameraPose({
      camera,
      playerPosition,
      npcPosition
    });

    camera.startPoseTransition(dialoguePose, {
      duration: DIALOGUE_CAMERA_TRANSITION_DURATION
    });
    cameraOrbit.sync(dialoguePose.direction);
  }

  function focusWorldPoint({ position, height = DIALOGUE_CAMERA_POINT_FOCUS_HEIGHT } = {}) {
    if (!position) {
      return;
    }

    captureRestorePose();
    const currentPose = camera.getPose();
    const pointPose = {
      target: [position[0], height, position[2]],
      direction: currentPose.direction,
      zoom: DIALOGUE_CAMERA_POINT_FOCUS_ZOOM,
      distance: DIALOGUE_CAMERA_POINT_FOCUS_DISTANCE
    };

    camera.startPoseTransition(pointPose, {
      duration: DIALOGUE_CAMERA_TRANSITION_DURATION
    });
    cameraOrbit.sync(pointPose.direction);
  }

  function restoreGameplayCamera() {
    if (!restorePose) {
      return;
    }

    camera.startPoseTransition(restorePose, {
      duration: DIALOGUE_CAMERA_TRANSITION_DURATION
    });
    cameraOrbit.sync(restorePose.direction);
    restorePose = null;
  }

  return {
    focusWorldPoint,
    focusNpcConversation,
    restoreGameplayCamera
  };
}
