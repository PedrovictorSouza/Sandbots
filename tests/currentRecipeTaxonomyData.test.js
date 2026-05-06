import { describe, expect, it } from "vitest";
import { PLACEHOLDER_RECIPES } from "../gameplayContent.js";
import {
  getCurrentRecipeTaxonomyById,
  getCurrentRecipeTaxonomyGaps,
  listCurrentRecipeTaxonomy
} from "../app/story/currentRecipeTaxonomyData.js";
import { canRecipeBlockCredits, PROGRESSION_ROLE } from "../app/story/recipeItemTaxonomyData.js";

describe("current recipe taxonomy data", () => {
  it("classifies every current placeholder recipe without changing recipe data", () => {
    expect(listCurrentRecipeTaxonomy().map((entry) => entry.id)).toEqual(
      Object.keys(PLACEHOLDER_RECIPES)
    );
    expect(getCurrentRecipeTaxonomyGaps()).toEqual([]);
  });

  it("marks current story recipes with macro-biome context", () => {
    expect(getCurrentRecipeTaxonomyById("bridgeKit")).toMatchObject({
      progressionRole: PROGRESSION_ROLE.REQUIRED_STORY_ITEM,
      macroBiomeId: "ash-wilds"
    });
    expect(getCurrentRecipeTaxonomyById("granitePickaxe")).toMatchObject({
      progressionRole: PROGRESSION_ROLE.TRAVERSAL_UTILITY,
      macroBiomeId: "granite-ridge"
    });
  });

  it("keeps comfort recipes from becoming credits blockers", () => {
    expect(getCurrentRecipeTaxonomyById("strawBed")).toMatchObject({
      progressionRole: PROGRESSION_ROLE.COMFORT_ITEM
    });
    expect(canRecipeBlockCredits(getCurrentRecipeTaxonomyById("strawBed"))).toBe(false);
  });

  it("keeps planned placeholder recipes out of credits blockers", () => {
    expect(getCurrentRecipeTaxonomyById("burrowRepairKit")).toMatchObject({
      placeholderState: "planned"
    });
    expect(canRecipeBlockCredits(getCurrentRecipeTaxonomyById("burrowRepairKit"))).toBe(false);
  });

  it("exposes current recipe taxonomy as immutable catalog data", () => {
    const taxonomy = listCurrentRecipeTaxonomy();

    expect(Object.isFrozen(taxonomy)).toBe(true);
    expect(Object.isFrozen(taxonomy[0])).toBe(true);
    expect(Object.isFrozen(getCurrentRecipeTaxonomyById("bridgeKit"))).toBe(true);
  });
});
