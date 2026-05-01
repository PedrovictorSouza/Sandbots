import { GAME_FLOW } from "../../gameFlow.js";

export const LAUNCH_MODE = Object.freeze({
  DEFAULT: "default",
  HANDBOOK: "handbook",
  GAMEPLAY: "gameplay",
  GAMEPLAY_DEV: "gameplay-dev"
});
export const LAUNCH_MODE_STORAGE_KEY = "small-island:boot-mode";

const KNOWN_LAUNCH_MODES = new Set(Object.values(LAUNCH_MODE));
const DEV_ONLY_LAUNCH_MODES = new Set([LAUNCH_MODE.GAMEPLAY_DEV]);
const DIRECT_GAMEPLAY_LAUNCH_MODES = new Set([
  LAUNCH_MODE.HANDBOOK,
  LAUNCH_MODE.GAMEPLAY,
  LAUNCH_MODE.GAMEPLAY_DEV
]);

export function resolveLaunchMode({
  searchParams = new URLSearchParams(),
  hash = "",
  storedLaunchMode = null
} = {}, { isDev = false } = {}) {
  const hashParams = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const requestedLaunchMode =
    searchParams.get("boot") ||
    hashParams.get("boot") ||
    storedLaunchMode ||
    LAUNCH_MODE.DEFAULT;

  if (!KNOWN_LAUNCH_MODES.has(requestedLaunchMode)) {
    return LAUNCH_MODE.DEFAULT;
  }

  if (DEV_ONLY_LAUNCH_MODES.has(requestedLaunchMode) && !isDev) {
    return LAUNCH_MODE.DEFAULT;
  }

  return requestedLaunchMode;
}

export function getInitialGameFlowForLaunchMode(launchMode) {
  return DIRECT_GAMEPLAY_LAUNCH_MODES.has(launchMode) ?
    GAME_FLOW.GAMEPLAY :
    GAME_FLOW.START;
}

export function shouldUseNoopWebGlForLaunchMode(launchMode) {
  return launchMode === LAUNCH_MODE.HANDBOOK;
}

export function shouldStartInGameplayForLaunchMode(launchMode) {
  return DIRECT_GAMEPLAY_LAUNCH_MODES.has(launchMode);
}

export function applyLaunchModeRuntime(launchMode, {
  session,
  startScreen,
  introSequence,
  clearGameFlowInput,
  unlockPlayerSkill = () => {},
  unlockPokedexUi = () => {},
  setPokedexSeen = () => {},
  playerMemory = null
} = {}) {
  if (!shouldStartInGameplayForLaunchMode(launchMode)) {
    return;
  }

  startScreen?.dismiss?.();
  introSequence?.dismiss?.();
  clearGameFlowInput?.();
  if (session && !session.playerCharacter) {
    session.gameplayOpeningRequested = true;
  }

  if (launchMode !== LAUNCH_MODE.GAMEPLAY_DEV) {
    return;
  }

  unlockPlayerSkill("transform");
  unlockPlayerSkill("waterGun");
  unlockPokedexUi();
  setPokedexSeen(true);

  if (playerMemory) {
    playerMemory.foundPokedex = true;
  }

  if (session?.actTwoRepairPlant) {
    session.actTwoRepairPlant.fixed = true;
  }

  if (session?.actTwoSquirtle) {
    session.actTwoSquirtle.recovered = true;
  }
}
