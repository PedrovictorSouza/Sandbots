import { createEmptySession } from "./session/createEmptySession.js";
import { loadSessionAssets } from "./session/loadSessionAssets.js";
import { buildSessionResources } from "./session/buildSessionResources.js";
import { buildWorldLayout } from "./session/buildWorldLayout.js";
import { configurePlayerSpawner } from "./session/configurePlayerSpawner.js";
import { initializeGameplayState } from "./session/initializeGameplatState.js";
import { finalizeSessionBoot } from "./session/finalizeSessionBoot.js";


export async function createGameSession({
  gl,
  setStatus,
  camera,
  cameraOrbit,
  worldTextureFactory,
  pressedKeys,
  getAnalogMovement,
  isRunActive,
  consumeJumpRequest,
  storyState,
  inventory,
  resetGameplayRuntimeState,
  syncInventoryUi,
  syncHudMeta,
  syncHudInstructions,
  renderMissionCards,
  clearGameFlowInput,
  launchMode,
  initialSceneId,
  startScreen,
  introSequence
}) {
  const session = createEmptySession();

  setStatus("Carregando assets...");
  const assets = await loadSessionAssets({ gl, setStatus });
  buildSessionResources(session, assets, { worldTextureFactory });

  buildWorldLayout(session, assets);
  configurePlayerSpawner(session, assets, {
    camera,
    cameraOrbit,
    pressedKeys,
    getAnalogMovement,
    isRunActive,
    consumeJumpRequest,
    storyState,
    inventory,
    syncHudMeta
  });

  initializeGameplayState(session, {
    storyState,
    inventory,
    resetGameplayRuntimeState,
    syncInventoryUi,
    syncHudMeta,
    renderMissionCards
  });

  finalizeSessionBoot(session, assets, {
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
  });

  return session;
}
