import { describe, expect, it } from "vitest";
import {
  canEnterMacroBiome,
  getMacroBiomeById,
  getMissingMacroBiomeTokenIds,
  hasRequiredCreditsSignals,
  listMacroBiomes,
  MACRO_BIOME_COMPLETION_TOKENS,
  MACRO_BIOME_IDS,
  SMALL_ISLAND_MACRO_BIOMES
} from "../app/story/biomeProgressionData.js";

describe("biome progression data", () => {
  it("exposes exactly the four player-facing macro-biomes from the story bible", () => {
    expect(listMacroBiomes().map((biome) => biome.id)).toEqual([
      MACRO_BIOME_IDS.ASH_WILDS,
      MACRO_BIOME_IDS.TIDEFALL_COAST,
      MACRO_BIOME_IDS.GRANITE_RIDGE,
      MACRO_BIOME_IDS.SKYFORGE_SPIRES
    ]);

    expect(listMacroBiomes().map((biome) => biome.completionTokenId)).toEqual([
      "root-signal",
      "tide-signal",
      "forge-signal",
      "sky-signal"
    ]);
  });

  it("unlocks Tidefall Coast and Granite Ridge only after the root-signal repair token", () => {
    expect(canEnterMacroBiome(MACRO_BIOME_IDS.ASH_WILDS, [])).toBe(true);
    expect(canEnterMacroBiome(MACRO_BIOME_IDS.TIDEFALL_COAST, [])).toBe(false);
    expect(canEnterMacroBiome(MACRO_BIOME_IDS.GRANITE_RIDGE, [])).toBe(false);

    const completedTokens = [MACRO_BIOME_COMPLETION_TOKENS.ROOT_SIGNAL];

    expect(canEnterMacroBiome(MACRO_BIOME_IDS.TIDEFALL_COAST, completedTokens)).toBe(true);
    expect(canEnterMacroBiome(MACRO_BIOME_IDS.GRANITE_RIDGE, completedTokens)).toBe(true);
    expect(canEnterMacroBiome(MACRO_BIOME_IDS.SKYFORGE_SPIRES, completedTokens)).toBe(false);
  });

  it("locks the final biome until both intermediate tokens are present", () => {
    expect(getMissingMacroBiomeTokenIds(MACRO_BIOME_IDS.SKYFORGE_SPIRES, [
      "root-signal",
      "tide-signal"
    ])).toEqual(["forge-signal"]);

    expect(getMissingMacroBiomeTokenIds(MACRO_BIOME_IDS.SKYFORGE_SPIRES, [
      "root-signal",
      "forge-signal"
    ])).toEqual(["tide-signal"]);

    expect(canEnterMacroBiome(MACRO_BIOME_IDS.SKYFORGE_SPIRES, [
      "root-signal",
      "tide-signal",
      "forge-signal"
    ])).toBe(true);
  });

  it("requires every macro-biome signal for credits readiness", () => {
    expect(hasRequiredCreditsSignals([
      "root-signal",
      "tide-signal",
      "forge-signal"
    ])).toBe(false);

    expect(hasRequiredCreditsSignals([
      "root-signal",
      "tide-signal",
      "forge-signal",
      "sky-signal"
    ])).toBe(true);
  });

  it("exposes immutable shared macro-biome data", () => {
    expect(Object.isFrozen(SMALL_ISLAND_MACRO_BIOMES)).toBe(true);
    expect(Object.isFrozen(getMacroBiomeById(MACRO_BIOME_IDS.ASH_WILDS))).toBe(true);
  });
});
