import { PLACEHOLDER_RECIPES } from "../../gameplayContent.js";
import { MACRO_BIOME_IDS } from "./biomeProgressionData.js";
import {
  ECONOMY_TIER,
  getRecipeTaxonomyValidationErrors,
  ITEM_CATEGORY,
  PROGRESSION_ROLE,
  RECIPE_UNLOCK_SOURCE
} from "./recipeItemTaxonomyData.js";

function deepFreeze(value) {
  if (!value || typeof value !== "object") {
    return value;
  }

  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

const CURRENT_RECIPE_TAXONOMY_BY_ID = deepFreeze({
  campfire: {
    category: ITEM_CATEGORY.OUTDOOR,
    unlockSource: RECIPE_UNLOCK_SOURCE.FIRST_WORKBENCH,
    progressionRole: PROGRESSION_ROLE.COMFORT_ITEM,
    economyTier: ECONOMY_TIER.STARTER_NATURAL,
    placeholderState: "final",
    macroBiomeId: MACRO_BIOME_IDS.ASH_WILDS
  },
  strawBed: {
    category: ITEM_CATEGORY.FURNITURE,
    unlockSource: RECIPE_UNLOCK_SOURCE.REQUEST_REWARD,
    progressionRole: PROGRESSION_ROLE.COMFORT_ITEM,
    economyTier: ECONOMY_TIER.STARTER_NATURAL,
    placeholderState: "final",
    macroBiomeId: MACRO_BIOME_IDS.ASH_WILDS
  },
  bridgeKit: {
    category: ITEM_CATEGORY.UTILITY,
    unlockSource: RECIPE_UNLOCK_SOURCE.REQUEST_REWARD,
    progressionRole: PROGRESSION_ROLE.REQUIRED_STORY_ITEM,
    economyTier: ECONOMY_TIER.STARTER_NATURAL,
    placeholderState: "final",
    macroBiomeId: MACRO_BIOME_IDS.ASH_WILDS
  },
  marshPie: {
    category: ITEM_CATEGORY.MISC,
    unlockSource: RECIPE_UNLOCK_SOURCE.REQUEST_REWARD,
    progressionRole: PROGRESSION_ROLE.REQUIRED_STORY_ITEM,
    economyTier: ECONOMY_TIER.STARTER_NATURAL,
    placeholderState: "prototype",
    macroBiomeId: MACRO_BIOME_IDS.ASH_WILDS
  },
  granitePickaxe: {
    category: ITEM_CATEGORY.UTILITY,
    unlockSource: RECIPE_UNLOCK_SOURCE.REQUEST_REWARD,
    progressionRole: PROGRESSION_ROLE.TRAVERSAL_UTILITY,
    economyTier: ECONOMY_TIER.RIDGE_ORE_COOKING,
    placeholderState: "prototype",
    macroBiomeId: MACRO_BIOME_IDS.GRANITE_RIDGE
  },
  burrowRepairKit: {
    category: ITEM_CATEGORY.UTILITY,
    unlockSource: RECIPE_UNLOCK_SOURCE.STORY_MILESTONE,
    progressionRole: PROGRESSION_ROLE.HABITAT_INGREDIENT,
    economyTier: ECONOMY_TIER.SKY_CONCRETE_ADVANCED,
    placeholderState: "planned",
    macroBiomeId: MACRO_BIOME_IDS.SKYFORGE_SPIRES
  }
});

const CURRENT_RECIPE_TAXONOMY = deepFreeze(Object.keys(PLACEHOLDER_RECIPES).map((recipeId) => ({
  id: recipeId,
  ...CURRENT_RECIPE_TAXONOMY_BY_ID[recipeId]
})));

export function listCurrentRecipeTaxonomy() {
  return CURRENT_RECIPE_TAXONOMY;
}

export function getCurrentRecipeTaxonomyById(id) {
  return CURRENT_RECIPE_TAXONOMY.find((entry) => entry.id === id) || null;
}

export function getCurrentRecipeTaxonomyGaps() {
  return listCurrentRecipeTaxonomy()
    .map((entry) => {
      const missing = [];

      if (!CURRENT_RECIPE_TAXONOMY_BY_ID[entry.id]) {
        missing.push("taxonomy");
      } else {
        missing.push(...getRecipeTaxonomyValidationErrors(entry));
      }

      return {
        id: entry.id,
        missing
      };
    })
    .filter((entry) => entry.missing.length > 0);
}
