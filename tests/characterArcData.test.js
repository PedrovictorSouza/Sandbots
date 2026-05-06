import { describe, expect, it } from "vitest";
import {
  CHARACTER_ARC_IDS,
  getCharacterArcById,
  getRequiredCharacterArcGaps,
  listCharacterArcs,
  SMALL_ISLAND_CHARACTER_ARCS
} from "../app/story/characterArcData.js";
import { MACRO_BIOME_IDS } from "../app/story/biomeProgressionData.js";

describe("character arc data", () => {
  it("exposes required story-bible character arcs", () => {
    expect(listCharacterArcs().map((arc) => arc.id)).toEqual([
      CHARACTER_ARC_IDS.SHAPER,
      CHARACTER_ARC_IDS.CHOPPER,
      CHARACTER_ARC_IDS.AUNTY,
      CHARACTER_ARC_IDS.SPRIG,
      CHARACTER_ARC_IDS.NAMI,
      CHARACTER_ARC_IDS.KELP,
      CHARACTER_ARC_IDS.MICA,
      CHARACTER_ARC_IDS.RIFF,
      CHARACTER_ARC_IDS.AERO,
      CHARACTER_ARC_IDS.TOVA
    ]);
  });

  it("maps required characters to macro-biomes or global story context", () => {
    expect(getCharacterArcById(CHARACTER_ARC_IDS.CHOPPER)).toMatchObject({
      macroBiomeId: MACRO_BIOME_IDS.ASH_WILDS,
      required: true
    });
    expect(getCharacterArcById(CHARACTER_ARC_IDS.NAMI)).toMatchObject({
      macroBiomeId: MACRO_BIOME_IDS.TIDEFALL_COAST,
      required: true
    });
    expect(getCharacterArcById(CHARACTER_ARC_IDS.MICA)).toMatchObject({
      macroBiomeId: MACRO_BIOME_IDS.GRANITE_RIDGE,
      required: true
    });
    expect(getCharacterArcById(CHARACTER_ARC_IDS.TOVA)).toMatchObject({
      macroBiomeId: MACRO_BIOME_IDS.SKYFORGE_SPIRES,
      required: true
    });
  });

  it("anchors Tidefall Coast mood, cleanup and light progress to required local arcs", () => {
    expect(getCharacterArcById(CHARACTER_ARC_IDS.NAMI)).toMatchObject({
      macroBiomeId: MACRO_BIOME_IDS.TIDEFALL_COAST,
      role: "Water guide.",
      progressionContribution: "Leads cleanup, water routing and light restoration.",
      completionPayoff: "Restores the coast signal for the final biome."
    });

    expect(getCharacterArcById(CHARACTER_ARC_IDS.KELP)).toMatchObject({
      macroBiomeId: MACRO_BIOME_IDS.TIDEFALL_COAST,
      role: "Coast conflict character.",
      progressionContribution: "Makes flooded homes and blocked infrastructure personal.",
      completionPayoff: "Shows that cleanup restores livable community space."
    });
  });

  it("anchors Granite Ridge rescue, crafting and celebration progress to required local arcs", () => {
    expect(getCharacterArcById(CHARACTER_ARC_IDS.MICA)).toMatchObject({
      macroBiomeId: MACRO_BIOME_IDS.GRANITE_RIDGE,
      role: "Ridge specialist.",
      progressionContribution: "Opens material, crafting and rescue loops.",
      completionPayoff: "Turns heavy terrain into useful repair knowledge."
    });

    expect(getCharacterArcById(CHARACTER_ARC_IDS.RIFF)).toMatchObject({
      macroBiomeId: MACRO_BIOME_IDS.GRANITE_RIDGE,
      role: "Celebration lead.",
      progressionContribution: "Turns tools and food into community morale.",
      completionPayoff: "Proves repair can become culture, not only survival."
    });
  });

  it("guards required character arcs from missing story context", () => {
    expect(getRequiredCharacterArcGaps()).toEqual([]);
    expect(getRequiredCharacterArcGaps([
      {
        id: "missing-arc",
        required: true,
        macroBiomeId: "",
        progressionContribution: "",
        completionPayoff: ""
      }
    ])).toEqual([
      {
        id: "missing-arc",
        missing: ["macroBiomeId", "progressionContribution", "completionPayoff"]
      }
    ]);
  });

  it("exposes immutable shared character arc data", () => {
    expect(Object.isFrozen(SMALL_ISLAND_CHARACTER_ARCS)).toBe(true);
    expect(Object.isFrozen(getCharacterArcById(CHARACTER_ARC_IDS.TOVA))).toBe(true);
  });
});
