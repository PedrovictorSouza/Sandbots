import { describe, expect, it } from "vitest";
import {
  canEnterMacroBiome,
  getMissingMacroBiomeTokenIds,
  MACRO_BIOME_COMPLETION_TOKENS,
  MACRO_BIOME_IDS
} from "../app/story/biomeProgressionData.js";
import {
  CHARACTER_ARC_IDS,
  getCharacterArcById
} from "../app/story/characterArcData.js";
import {
  getFinalInteraction,
  listFinalRequiredGoals,
  listFinalRequiredImportantRequests
} from "../app/story/finalReadinessData.js";
import { getSmallIslandMoveById } from "../app/sandbox/moveData.js";
import {
  getSkyforgeRepairStageById,
  getSkyforgeReturnGate,
  listSkyforgeRepairStages,
  SKYFORGE_FINAL_RANK_ID,
  SKYFORGE_REPAIR_STAGE_IDS,
  SKYFORGE_RETURN_GATE_ID
} from "../app/story/skyforgeRepairData.js";

describe("Skyforge repair data", () => {
  it("locks Skyforge Spires until both intermediate signals are earned", () => {
    expect(canEnterMacroBiome(MACRO_BIOME_IDS.SKYFORGE_SPIRES, [])).toBe(false);
    expect(canEnterMacroBiome(MACRO_BIOME_IDS.SKYFORGE_SPIRES, [
      MACRO_BIOME_COMPLETION_TOKENS.TIDE_SIGNAL
    ])).toBe(false);
    expect(canEnterMacroBiome(MACRO_BIOME_IDS.SKYFORGE_SPIRES, [
      MACRO_BIOME_COMPLETION_TOKENS.FORGE_SIGNAL
    ])).toBe(false);

    expect(getMissingMacroBiomeTokenIds(MACRO_BIOME_IDS.SKYFORGE_SPIRES, [
      MACRO_BIOME_COMPLETION_TOKENS.TIDE_SIGNAL
    ])).toEqual([MACRO_BIOME_COMPLETION_TOKENS.FORGE_SIGNAL]);

    expect(canEnterMacroBiome(MACRO_BIOME_IDS.SKYFORGE_SPIRES, [
      MACRO_BIOME_COMPLETION_TOKENS.TIDE_SIGNAL,
      MACRO_BIOME_COMPLETION_TOKENS.FORGE_SIGNAL
    ])).toBe(true);
  });

  it("anchors late traversal to the planned glide move and Aero mentor arc", () => {
    expect(getSmallIslandMoveById("glide")).toMatchObject({
      id: "glide",
      abilityId: "glide",
      learnedFromNpcId: "sky-helper",
      effects: ["glide-from-high-places"],
      worldEffects: ["glides from high places"]
    });

    expect(getCharacterArcById(CHARACTER_ARC_IDS.AERO)).toMatchObject({
      macroBiomeId: MACRO_BIOME_IDS.SKYFORGE_SPIRES,
      role: "Sky traversal mentor.",
      progressionContribution: "Tests elevated traversal and route planning."
    });
  });

  it("defines staged large-building repair from lift footing to beacon core", () => {
    expect(listSkyforgeRepairStages().map((stage) => stage.id)).toEqual([
      SKYFORGE_REPAIR_STAGE_IDS.FOUNDATION_LIFT,
      SKYFORGE_REPAIR_STAGE_IDS.SPIRE_FRAME,
      SKYFORGE_REPAIR_STAGE_IDS.BEACON_CORE
    ]);

    expect(getSkyforgeRepairStageById(SKYFORGE_REPAIR_STAGE_IDS.FOUNDATION_LIFT)).toMatchObject({
      order: 1,
      helperArcIds: [CHARACTER_ARC_IDS.AERO],
      recipeFamilies: [
        "lift-platform-pieces",
        "concrete-processing"
      ],
      unlocks: ["platform-lift-access"]
    });

    expect(getSkyforgeRepairStageById(SKYFORGE_REPAIR_STAGE_IDS.SPIRE_FRAME)).toMatchObject({
      order: 2,
      requiredPreviousStageId: SKYFORGE_REPAIR_STAGE_IDS.FOUNDATION_LIFT,
      helperArcIds: [CHARACTER_ARC_IDS.TOVA],
      unlocks: ["upper-platform-route"]
    });

    expect(getSkyforgeRepairStageById(SKYFORGE_REPAIR_STAGE_IDS.BEACON_CORE)).toMatchObject({
      order: 3,
      requiredPreviousStageId: SKYFORGE_REPAIR_STAGE_IDS.SPIRE_FRAME,
      helperArcIds: [
        CHARACTER_ARC_IDS.AERO,
        CHARACTER_ARC_IDS.TOVA
      ],
      completionTokenId: MACRO_BIOME_COMPLETION_TOKENS.SKY_SIGNAL,
      finalRankId: SKYFORGE_FINAL_RANK_ID,
      unlocks: [SKYFORGE_RETURN_GATE_ID]
    });
  });

  it("hands off sky-signal through final readiness and unlocks the return gate", () => {
    expect(listFinalRequiredImportantRequests()).toContainEqual(expect.objectContaining({
      id: "important:skyforge-spires-sky-signal",
      macroBiomeId: MACRO_BIOME_IDS.SKYFORGE_SPIRES,
      completionTokenId: MACRO_BIOME_COMPLETION_TOKENS.SKY_SIGNAL,
      label: "Restore the Skyforge Spires sky signal"
    }));

    expect(listFinalRequiredGoals()).toContainEqual(expect.objectContaining({
      id: "signal:sky-signal",
      tokenId: MACRO_BIOME_COMPLETION_TOKENS.SKY_SIGNAL
    }));

    expect(getFinalInteraction()).toMatchObject({
      id: "skyforge-beacon-final-repair",
      locationId: "skyforge-beacon",
      macroBiomeId: MACRO_BIOME_IDS.SKYFORGE_SPIRES,
      characterArcIds: [
        CHARACTER_ARC_IDS.TOVA,
        CHARACTER_ARC_IDS.CHOPPER
      ]
    });

    expect(getSkyforgeReturnGate()).toEqual({
      id: SKYFORGE_RETURN_GATE_ID,
      macroBiomeId: MACRO_BIOME_IDS.SKYFORGE_SPIRES,
      ownerSystem: "Scenario System",
      unlocksWhenStageId: SKYFORGE_REPAIR_STAGE_IDS.BEACON_CORE,
      requiresCompletionTokenId: MACRO_BIOME_COMPLETION_TOKENS.SKY_SIGNAL,
      destination: "post-story-sandbox"
    });
  });
});
