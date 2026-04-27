import { GAME_FLOW } from "../../gameFlow.js";
import { LAUNCH_MODE } from "../runtime/launchMode.js";

const DEFAULT_SCENE_WORKBENCH_CONFIG = Object.freeze({
  enabled: true,
  initialSceneId: GAME_FLOW.START,
  launchMode: LAUNCH_MODE.DEFAULT,
  postCinematicSceneId: null
});

export function resolveSceneWorkbench(config = DEFAULT_SCENE_WORKBENCH_CONFIG) {
  if (!config?.enabled) {
    return null;
  }

  return {
    initialSceneId: config.initialSceneId,
    launchMode: config.launchMode,
    postCinematicSceneId: config.postCinematicSceneId ?? null
  };
}

export function resolveActiveSceneWorkbench(launchMode, config = DEFAULT_SCENE_WORKBENCH_CONFIG) {
  if (launchMode !== LAUNCH_MODE.DEFAULT) {
    return null;
  }

  return resolveSceneWorkbench(config);
}
