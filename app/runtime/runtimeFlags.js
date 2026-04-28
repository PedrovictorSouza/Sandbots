export const SKIP_START_SCREEN_STORAGE_KEY = "small-island:skip-start-screen";

export const DEV_SCENE = Object.freeze({
  GAMEPLAY: "gameplay",
  INTRO: "intro",
  TUTORIAL: "tutorial"
});

const KNOWN_DEV_SCENES = new Set(Object.values(DEV_SCENE));

const TRUE_FLAG_VALUES = new Set(["1", "true", "yes", "on"]);

function normalizeFlagValue(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase();
}

function isEnabledFlagValue(value) {
  return TRUE_FLAG_VALUES.has(normalizeFlagValue(value));
}

function normalizeDevScene(value) {
  const normalizedValue = normalizeFlagValue(value);
  return KNOWN_DEV_SCENES.has(normalizedValue) ? normalizedValue : null;
}

export function resolveRuntimeFlags({
  searchParams = new URLSearchParams(),
  hash = "",
  storedSkipStartScreen = null
} = {}) {
  const hashParams = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  const skipStartScreenValue =
    searchParams.get("skipStart") ||
    searchParams.get("skipStartScreen") ||
    hashParams.get("skipStart") ||
    hashParams.get("skipStartScreen") ||
    storedSkipStartScreen;
  const introRoomValue =
    searchParams.get("introRoom") ||
    searchParams.get("skipStartForIntro") ||
    hashParams.get("introRoom") ||
    hashParams.get("skipStartForIntro");
  const debugCollidersValue =
    searchParams.get("debugColliders") ||
    searchParams.get("colliderGizmos") ||
    hashParams.get("debugColliders") ||
    hashParams.get("colliderGizmos");
  const requestedScene =
    normalizeDevScene(searchParams.get("scene")) ||
    normalizeDevScene(hashParams.get("scene"));
  const introRoom = isEnabledFlagValue(introRoomValue) || requestedScene === DEV_SCENE.INTRO;

  return {
    skipStartScreen: isEnabledFlagValue(skipStartScreenValue),
    debugColliders: isEnabledFlagValue(debugCollidersValue),
    introRoom,
    scene: requestedScene
  };
}
