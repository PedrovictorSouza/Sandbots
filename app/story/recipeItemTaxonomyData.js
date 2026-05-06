import { MACRO_BIOME_IDS } from "./biomeProgressionData.js";
import { REQUEST_ARCHETYPE } from "./requestTaxonomyData.js";

export const ITEM_CATEGORY = Object.freeze({
  FURNITURE: "furniture",
  MISC: "misc",
  OUTDOOR: "outdoor",
  UTILITY: "utility",
  BUILDING: "building",
  BLOCK: "block",
  MATERIAL: "material",
  SPECIAL: "special"
});

export const RECIPE_UNLOCK_SOURCE = Object.freeze({
  FIRST_WORKBENCH: "first-workbench",
  REQUEST_REWARD: "request-reward",
  STORY_MILESTONE: "story-milestone",
  SHOP_THRESHOLD: "shop-threshold",
  ENVIRONMENT_LEVEL: "environment-level",
  COLLECTION_COUNT: "collection-count",
  FIRST_MATERIAL_PICKUP: "first-material-pickup",
  WORLD_PICKUP: "world-pickup",
  RANDOM_DAILY: "random-daily",
  CHALLENGE_REWARD: "challenge-reward",
  DEBUG: "debug"
});

export const PROGRESSION_ROLE = Object.freeze({
  REQUIRED_STORY_ITEM: "required-story-item",
  HABITAT_INGREDIENT: "habitat-ingredient",
  COMFORT_ITEM: "comfort-item",
  REPAIR_MATERIAL: "repair-material",
  TRAVERSAL_UTILITY: "traversal-utility",
  DECORATION_FLAVOR: "decoration-flavor",
  POST_STORY_COLLECTIBLE: "post-story-collectible",
  DEBUG: "debug"
});

export const ECONOMY_TIER = Object.freeze({
  STARTER_NATURAL: "starter-natural",
  COAST_CLAY_GLASS: "coast-clay-glass",
  RIDGE_ORE_COOKING: "ridge-ore-cooking",
  SKY_CONCRETE_ADVANCED: "sky-concrete-advanced",
  RARE_POST_STORY: "rare-post-story",
  DEBUG: "debug"
});

const ITEM_CATEGORIES = Object.freeze(Object.values(ITEM_CATEGORY));
const RECIPE_UNLOCK_SOURCES = Object.freeze(Object.values(RECIPE_UNLOCK_SOURCE));
const PROGRESSION_ROLES = Object.freeze(Object.values(PROGRESSION_ROLE));
const ECONOMY_TIERS = Object.freeze(Object.values(ECONOMY_TIER));

function deepFreeze(value) {
  if (!value || typeof value !== "object") {
    return value;
  }

  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

const PROGRESSION_BLOCKING_ROLES = new Set([
  PROGRESSION_ROLE.REQUIRED_STORY_ITEM,
  PROGRESSION_ROLE.REPAIR_MATERIAL,
  PROGRESSION_ROLE.TRAVERSAL_UTILITY
]);

const DECORATIVE_CREDITS_EXCLUDED_ROLES = deepFreeze([
  PROGRESSION_ROLE.DECORATION_FLAVOR,
  PROGRESSION_ROLE.POST_STORY_COLLECTIBLE
]);

const RECIPE_PACKS_BY_MACRO_BIOME = deepFreeze([
  {
    id: "ash-wilds-starter-recipes",
    macroBiomeId: MACRO_BIOME_IDS.ASH_WILDS,
    economyTier: ECONOMY_TIER.STARTER_NATURAL,
    primaryRequestArchetypes: [
      REQUEST_ARCHETYPE.HABITAT_HOME,
      REQUEST_ARCHETYPE.MAJOR_REPAIR
    ],
    requiredProgressionRoles: [
      PROGRESSION_ROLE.REQUIRED_STORY_ITEM,
      PROGRESSION_ROLE.REPAIR_MATERIAL
    ],
    decorativeExpansionRoles: DECORATIVE_CREDITS_EXCLUDED_ROLES
  },
  {
    id: "tidefall-coast-cleanup-recipes",
    macroBiomeId: MACRO_BIOME_IDS.TIDEFALL_COAST,
    economyTier: ECONOMY_TIER.COAST_CLAY_GLASS,
    primaryRequestArchetypes: [
      REQUEST_ARCHETYPE.ENVIRONMENTAL_RESTORATION,
      REQUEST_ARCHETYPE.ABILITY_UNLOCK
    ],
    requiredProgressionRoles: [
      PROGRESSION_ROLE.REPAIR_MATERIAL,
      PROGRESSION_ROLE.TRAVERSAL_UTILITY
    ],
    decorativeExpansionRoles: DECORATIVE_CREDITS_EXCLUDED_ROLES
  },
  {
    id: "granite-ridge-crafting-recipes",
    macroBiomeId: MACRO_BIOME_IDS.GRANITE_RIDGE,
    economyTier: ECONOMY_TIER.RIDGE_ORE_COOKING,
    primaryRequestArchetypes: [
      REQUEST_ARCHETYPE.CRAFTING_COOKING,
      REQUEST_ARCHETYPE.CELEBRATION_MOOD
    ],
    requiredProgressionRoles: [
      PROGRESSION_ROLE.REPAIR_MATERIAL,
      PROGRESSION_ROLE.TRAVERSAL_UTILITY
    ],
    decorativeExpansionRoles: DECORATIVE_CREDITS_EXCLUDED_ROLES
  },
  {
    id: "skyforge-spires-final-recipes",
    macroBiomeId: MACRO_BIOME_IDS.SKYFORGE_SPIRES,
    economyTier: ECONOMY_TIER.SKY_CONCRETE_ADVANCED,
    primaryRequestArchetypes: [
      REQUEST_ARCHETYPE.MAJOR_REPAIR,
      REQUEST_ARCHETYPE.ABILITY_UNLOCK
    ],
    requiredProgressionRoles: [
      PROGRESSION_ROLE.REQUIRED_STORY_ITEM,
      PROGRESSION_ROLE.REPAIR_MATERIAL
    ],
    decorativeExpansionRoles: DECORATIVE_CREDITS_EXCLUDED_ROLES
  }
]);

export function listItemCategories() {
  return ITEM_CATEGORIES;
}

export function listRecipeUnlockSources() {
  return RECIPE_UNLOCK_SOURCES;
}

export function listProgressionRoles() {
  return PROGRESSION_ROLES;
}

export function listEconomyTiers() {
  return ECONOMY_TIERS;
}

export function listRecipePacksByMacroBiome() {
  return RECIPE_PACKS_BY_MACRO_BIOME;
}

export function getRecipePackByMacroBiomeId(macroBiomeId) {
  return RECIPE_PACKS_BY_MACRO_BIOME.find((pack) => pack.macroBiomeId === macroBiomeId) || null;
}

export function isDecorativeRecipeExpansionRole(progressionRole) {
  return DECORATIVE_CREDITS_EXCLUDED_ROLES.includes(progressionRole);
}

export function canRecipeBlockCredits(recipe = {}) {
  return PROGRESSION_BLOCKING_ROLES.has(recipe.progressionRole) && recipe.placeholderState !== "planned";
}

export function getRecipeTaxonomyValidationErrors(recipe = {}) {
  const errors = [];

  if (!ITEM_CATEGORIES.includes(recipe.category)) {
    errors.push("category is required");
  }
  if (!RECIPE_UNLOCK_SOURCES.includes(recipe.unlockSource)) {
    errors.push("unlockSource is required");
  }
  if (!PROGRESSION_ROLES.includes(recipe.progressionRole)) {
    errors.push("progressionRole is required");
  }
  if (!ECONOMY_TIERS.includes(recipe.economyTier)) {
    errors.push("economyTier is required");
  }

  if (PROGRESSION_BLOCKING_ROLES.has(recipe.progressionRole)) {
    if (!recipe.macroBiomeId) {
      errors.push("macroBiomeId is required for progression recipes");
    }
    if (recipe.placeholderState === "planned") {
      errors.push("planned recipes cannot block required progression");
    }
  }

  return errors;
}
