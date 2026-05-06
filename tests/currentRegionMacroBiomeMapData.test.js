import { describe, expect, it } from "vitest";
import { WORLD_REGIONS } from "../gameplayContent.js";
import { MACRO_BIOME_IDS } from "../app/story/biomeProgressionData.js";
import {
  getCurrentRegionMacroBiomeGaps,
  getInternalRegionMacroBiomeMappingById,
  listInternalRegionMacroBiomeMappings
} from "../app/story/currentRegionMacroBiomeMapData.js";

describe("current region macro-biome map data", () => {
  it("maps every current internal world region into one of four macro-biomes", () => {
    const mappings = listInternalRegionMacroBiomeMappings();

    expect(mappings.map((mapping) => mapping.id)).toEqual(
      WORLD_REGIONS.map((region) => region.id)
    );
    expect(new Set(mappings.map((mapping) => mapping.macroBiomeId))).toEqual(
      new Set(Object.values(MACRO_BIOME_IDS))
    );
    expect(getCurrentRegionMacroBiomeGaps()).toEqual([]);
  });

  it("keeps current world regions classified as internal spatial regions", () => {
    for (const mapping of listInternalRegionMacroBiomeMappings()) {
      expect(mapping.isMacroBiome).toBe(false);
      expect(mapping.mappingStatus).toBe("provisional");
    }
  });

  it("anchors representative internal regions to their target macro-biomes", () => {
    expect(getInternalRegionMacroBiomeMappingById("hearth-hollow")).toMatchObject({
      macroBiomeId: "ash-wilds"
    });
    expect(getInternalRegionMacroBiomeMappingById("east-palm-coast")).toMatchObject({
      macroBiomeId: "tidefall-coast"
    });
    expect(getInternalRegionMacroBiomeMappingById("granite-ford")).toMatchObject({
      macroBiomeId: "granite-ridge"
    });
    expect(getInternalRegionMacroBiomeMappingById("old-burrow-ruins")).toMatchObject({
      macroBiomeId: "skyforge-spires"
    });
  });

  it("exposes immutable mapping data for future scenario specs", () => {
    const mappings = listInternalRegionMacroBiomeMappings();

    expect(Object.isFrozen(mappings)).toBe(true);
    expect(Object.isFrozen(mappings[0])).toBe(true);
    expect(Object.isFrozen(getInternalRegionMacroBiomeMappingById("hearth-hollow"))).toBe(true);
  });
});
