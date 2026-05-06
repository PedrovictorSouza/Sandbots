import { describe, expect, it } from "vitest";
import {
  canRecipeBlockCredits,
  ECONOMY_TIER,
  getRecipePackByMacroBiomeId,
  getRecipeTaxonomyValidationErrors,
  isDecorativeRecipeExpansionRole,
  ITEM_CATEGORY,
  listEconomyTiers,
  listItemCategories,
  listProgressionRoles,
  listRecipePacksByMacroBiome,
  listRecipeUnlockSources,
  PROGRESSION_ROLE,
  RECIPE_UNLOCK_SOURCE
} from "../app/story/recipeItemTaxonomyData.js";
import {
  listMacroBiomes,
  MACRO_BIOME_IDS
} from "../app/story/biomeProgressionData.js";
import { REQUEST_ARCHETYPE } from "../app/story/requestTaxonomyData.js";

describe("recipe item taxonomy data", () => {
  it("exposes the recipe and item taxonomy axes", () => {
    expect(listItemCategories()).toEqual([
      ITEM_CATEGORY.FURNITURE,
      ITEM_CATEGORY.MISC,
      ITEM_CATEGORY.OUTDOOR,
      ITEM_CATEGORY.UTILITY,
      ITEM_CATEGORY.BUILDING,
      ITEM_CATEGORY.BLOCK,
      ITEM_CATEGORY.MATERIAL,
      ITEM_CATEGORY.SPECIAL
    ]);

    expect(listRecipeUnlockSources()).toContain(RECIPE_UNLOCK_SOURCE.REQUEST_REWARD);
    expect(listProgressionRoles()).toContain(PROGRESSION_ROLE.REQUIRED_STORY_ITEM);
    expect(listEconomyTiers()).toEqual([
      "starter-natural",
      "coast-clay-glass",
      "ridge-ore-cooking",
      "sky-concrete-advanced",
      "rare-post-story",
      "debug"
    ]);
  });

  it("requires required recipes to declare macro-biome context", () => {
    expect(getRecipeTaxonomyValidationErrors({
      id: "root-repair-kit",
      category: ITEM_CATEGORY.UTILITY,
      unlockSource: RECIPE_UNLOCK_SOURCE.REQUEST_REWARD,
      progressionRole: PROGRESSION_ROLE.REQUIRED_STORY_ITEM,
      economyTier: "starter-natural",
      placeholderState: "final",
      macroBiomeId: "ash-wilds"
    })).toEqual([]);

    expect(getRecipeTaxonomyValidationErrors({
      id: "missing-biome",
      category: ITEM_CATEGORY.UTILITY,
      unlockSource: RECIPE_UNLOCK_SOURCE.REQUEST_REWARD,
      progressionRole: PROGRESSION_ROLE.REQUIRED_STORY_ITEM,
      economyTier: "starter-natural",
      placeholderState: "final"
    })).toEqual([
      "macroBiomeId is required for progression recipes"
    ]);
  });

  it("keeps planned recipes out of credits blockers", () => {
    expect(canRecipeBlockCredits({
      progressionRole: PROGRESSION_ROLE.REQUIRED_STORY_ITEM,
      placeholderState: "planned"
    })).toBe(false);

    expect(getRecipeTaxonomyValidationErrors({
      id: "planned-root-repair-kit",
      category: ITEM_CATEGORY.UTILITY,
      unlockSource: RECIPE_UNLOCK_SOURCE.REQUEST_REWARD,
      progressionRole: PROGRESSION_ROLE.REQUIRED_STORY_ITEM,
      economyTier: "starter-natural",
      placeholderState: "planned",
      macroBiomeId: "ash-wilds"
    })).toEqual([
      "planned recipes cannot block required progression"
    ]);
  });

  it("keeps decorative and post-story recipes out of credits blockers", () => {
    expect(canRecipeBlockCredits({
      progressionRole: PROGRESSION_ROLE.DECORATION_FLAVOR,
      placeholderState: "final"
    })).toBe(false);

    expect(canRecipeBlockCredits({
      progressionRole: PROGRESSION_ROLE.POST_STORY_COLLECTIBLE,
      placeholderState: "final"
    })).toBe(false);
  });

  it("defines one recipe pack for each macro-biome", () => {
    const packs = listRecipePacksByMacroBiome();

    expect(packs.map((pack) => pack.macroBiomeId)).toEqual(
      listMacroBiomes().map((biome) => biome.id)
    );
    expect(Object.isFrozen(packs)).toBe(true);
    expect(Object.isFrozen(packs[0])).toBe(true);
  });

  it("maps macro-biome recipe packs to economy tiers and request archetypes", () => {
    expect(getRecipePackByMacroBiomeId(MACRO_BIOME_IDS.ASH_WILDS)).toMatchObject({
      economyTier: ECONOMY_TIER.STARTER_NATURAL,
      primaryRequestArchetypes: expect.arrayContaining([
        REQUEST_ARCHETYPE.HABITAT_HOME,
        REQUEST_ARCHETYPE.MAJOR_REPAIR
      ])
    });

    expect(getRecipePackByMacroBiomeId(MACRO_BIOME_IDS.SKYFORGE_SPIRES)).toMatchObject({
      economyTier: ECONOMY_TIER.SKY_CONCRETE_ADVANCED,
      primaryRequestArchetypes: expect.arrayContaining([
        REQUEST_ARCHETYPE.MAJOR_REPAIR,
        REQUEST_ARCHETYPE.ABILITY_UNLOCK
      ])
    });
  });

  it("keeps decorative recipe expansion separate from the credits path", () => {
    expect(isDecorativeRecipeExpansionRole(PROGRESSION_ROLE.DECORATION_FLAVOR)).toBe(true);
    expect(isDecorativeRecipeExpansionRole(PROGRESSION_ROLE.REQUIRED_STORY_ITEM)).toBe(false);

    for (const pack of listRecipePacksByMacroBiome()) {
      expect(pack.requiredProgressionRoles).not.toContain(PROGRESSION_ROLE.DECORATION_FLAVOR);
      expect(pack.requiredProgressionRoles).not.toContain(PROGRESSION_ROLE.POST_STORY_COLLECTIBLE);
      expect(pack.decorativeExpansionRoles).toEqual([
        PROGRESSION_ROLE.DECORATION_FLAVOR,
        PROGRESSION_ROLE.POST_STORY_COLLECTIBLE
      ]);
    }
  });
});
