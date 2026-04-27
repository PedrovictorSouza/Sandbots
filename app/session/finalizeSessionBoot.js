import {
  ACT_TWO_MONSTER_POSITION,
  ACT_TWO_PLAYER_CAMERA_DIRECTION,
  ACT_TWO_PLAYER_CAMERA_DISTANCE,
  ACT_TWO_PLAYER_CAMERA_TARGET_HEIGHT,
  ACT_TWO_PLAYER_CAMERA_ZOOM
} from "../../actTwoSceneConfig.js";

import { GAME_FLOW } from "../../gameFlow.js";
import { shouldStartInGameplayForLaunchMode } from "../runtime/launchMode.js";
import { buildSceneAssembly } from "./buildSceneAssembly.js";

export function finalizeSessionBoot(
  session,
  assets,
  {
    camera,
    cameraOrbit,
    storyState,
    inventory,
    syncHudMeta,
    syncHudInstructions,
    renderMissionCards,
    setStatus,
    launchMode,
    initialSceneId,
    startScreen,
    introSequence,
    clearGameFlowInput
  }
) {
  if (shouldStartInGameplayForLaunchMode(launchMode)) {
    startScreen.dismiss();
    introSequence.dismiss();
    clearGameFlowInput();
    session.spawnActTwoPlayer();
  }

  buildSceneAssembly(session, assets);

  if (initialSceneId !== GAME_FLOW.CINEMATIC) {
    camera.setPose({
      target: [ACT_TWO_MONSTER_POSITION[0], ACT_TWO_PLAYER_CAMERA_TARGET_HEIGHT, ACT_TWO_MONSTER_POSITION[2]],
      direction: ACT_TWO_PLAYER_CAMERA_DIRECTION,
      zoom: ACT_TWO_PLAYER_CAMERA_ZOOM,
      distance: ACT_TWO_PLAYER_CAMERA_DISTANCE
    });
    cameraOrbit.sync(ACT_TWO_PLAYER_CAMERA_DIRECTION);
  }

  syncHudMeta(storyState, inventory, [0, 0, 0]);
  syncHudInstructions(storyState);
  renderMissionCards(storyState, inventory);

  setStatus("Campanha placeholder online. Fale com Tangrowth para iniciar.");

  if (initialSceneId === GAME_FLOW.START && startScreen.isActive?.()) {
    startScreen.start();
  }
}
