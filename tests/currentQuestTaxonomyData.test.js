import { describe, expect, it } from "vitest";
import { SMALL_ISLAND_QUESTS } from "../app/quest/questData.js";
import {
  getCurrentQuestTaxonomyById,
  getCurrentQuestTaxonomyGaps,
  listCurrentQuestTaxonomy
} from "../app/story/currentQuestTaxonomyData.js";
import { canRequestBlockCredits } from "../app/story/requestTaxonomyData.js";

describe("current quest taxonomy data", () => {
  it("classifies every current quest without changing quest runtime data", () => {
    expect(listCurrentQuestTaxonomy().map((entry) => entry.id)).toEqual(
      SMALL_ISLAND_QUESTS.map((quest) => quest.id)
    );
    expect(getCurrentQuestTaxonomyGaps()).toEqual([]);
  });

  it("keeps current onboarding and support quests out of credits blockers", () => {
    for (const quest of SMALL_ISLAND_QUESTS) {
      const taxonomy = getCurrentQuestTaxonomyById(quest.id);

      expect(canRequestBlockCredits(taxonomy)).toBe(false);
      expect(taxonomy.blocksCredits).toBe(false);
    }
  });

  it("maps current quests to story context for future migration", () => {
    expect(getCurrentQuestTaxonomyById("learn-to-move")).toMatchObject({
      macroBiomeId: "ash-wilds",
      characterArcId: "system"
    });
    expect(getCurrentQuestTaxonomyById("inspect-rustling-grass")).toMatchObject({
      macroBiomeId: "ash-wilds",
      characterArcId: "sprig"
    });
  });

  it("exposes current quest taxonomy as immutable catalog data", () => {
    const taxonomy = listCurrentQuestTaxonomy();

    expect(Object.isFrozen(taxonomy)).toBe(true);
    expect(Object.isFrozen(taxonomy[0])).toBe(true);
    expect(Object.isFrozen(getCurrentQuestTaxonomyById("learn-to-move"))).toBe(true);
  });
});
