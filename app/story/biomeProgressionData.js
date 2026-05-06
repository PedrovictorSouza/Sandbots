export const MACRO_BIOME_IDS = Object.freeze({
  ASH_WILDS: "ash-wilds",
  TIDEFALL_COAST: "tidefall-coast",
  GRANITE_RIDGE: "granite-ridge",
  SKYFORGE_SPIRES: "skyforge-spires"
});

export const MACRO_BIOME_COMPLETION_TOKENS = Object.freeze({
  ROOT_SIGNAL: "root-signal",
  TIDE_SIGNAL: "tide-signal",
  FORGE_SIGNAL: "forge-signal",
  SKY_SIGNAL: "sky-signal"
});

function deepFreeze(value) {
  if (!value || typeof value !== "object") {
    return value;
  }

  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

export const SMALL_ISLAND_MACRO_BIOMES = deepFreeze([
  {
    id: MACRO_BIOME_IDS.ASH_WILDS,
    label: "Ash Wilds",
    role: "starting",
    act: "Act 1",
    completionTokenId: MACRO_BIOME_COMPLETION_TOKENS.ROOT_SIGNAL,
    requiredTokenIds: [],
    unlocksMacroBiomeIds: [
      MACRO_BIOME_IDS.TIDEFALL_COAST,
      MACRO_BIOME_IDS.GRANITE_RIDGE
    ],
    storyPurpose: "Teaches restoration, habitats, requests, crafting, home building and first hub repair."
  },
  {
    id: MACRO_BIOME_IDS.TIDEFALL_COAST,
    label: "Tidefall Coast",
    role: "intermediate",
    act: "Act 2A",
    completionTokenId: MACRO_BIOME_COMPLETION_TOKENS.TIDE_SIGNAL,
    requiredTokenIds: [
      MACRO_BIOME_COMPLETION_TOKENS.ROOT_SIGNAL
    ],
    unlocksMacroBiomeIds: [
      MACRO_BIOME_IDS.SKYFORGE_SPIRES
    ],
    storyPurpose: "Restores blocked water flow, cleanup routes and dim infrastructure."
  },
  {
    id: MACRO_BIOME_IDS.GRANITE_RIDGE,
    label: "Granite Ridge",
    role: "intermediate",
    act: "Act 2B",
    completionTokenId: MACRO_BIOME_COMPLETION_TOKENS.FORGE_SIGNAL,
    requiredTokenIds: [
      MACRO_BIOME_COMPLETION_TOKENS.ROOT_SIGNAL
    ],
    unlocksMacroBiomeIds: [
      MACRO_BIOME_IDS.SKYFORGE_SPIRES
    ],
    storyPurpose: "Restores collapsed workshop routes through tools, cooking and celebration."
  },
  {
    id: MACRO_BIOME_IDS.SKYFORGE_SPIRES,
    label: "Skyforge Spires",
    role: "final",
    act: "Act 3",
    completionTokenId: MACRO_BIOME_COMPLETION_TOKENS.SKY_SIGNAL,
    requiredTokenIds: [
      MACRO_BIOME_COMPLETION_TOKENS.TIDE_SIGNAL,
      MACRO_BIOME_COMPLETION_TOKENS.FORGE_SIGNAL
    ],
    unlocksMacroBiomeIds: [],
    storyPurpose: "Tests prior systems through elevated traversal and staged beacon repair."
  }
]);

export const REQUIRED_CREDITS_TOKEN_IDS = deepFreeze(
  SMALL_ISLAND_MACRO_BIOMES.map((biome) => biome.completionTokenId)
);

export function listMacroBiomes() {
  return SMALL_ISLAND_MACRO_BIOMES;
}

export function getMacroBiomeById(id) {
  return SMALL_ISLAND_MACRO_BIOMES.find((biome) => biome.id === id) || null;
}

export function getMissingMacroBiomeTokenIds(id, completedTokenIds = []) {
  const biome = getMacroBiomeById(id);

  if (!biome) {
    return [];
  }

  const completedTokens = new Set(completedTokenIds);
  return biome.requiredTokenIds.filter((tokenId) => !completedTokens.has(tokenId));
}

export function canEnterMacroBiome(id, completedTokenIds = []) {
  const biome = getMacroBiomeById(id);

  if (!biome) {
    return false;
  }

  return getMissingMacroBiomeTokenIds(id, completedTokenIds).length === 0;
}

export function hasRequiredCreditsSignals(completedTokenIds = []) {
  const completedTokens = new Set(completedTokenIds);
  return REQUIRED_CREDITS_TOKEN_IDS.every((tokenId) => completedTokens.has(tokenId));
}
