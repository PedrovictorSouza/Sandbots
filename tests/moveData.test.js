import { describe, expect, it } from "vitest";
import {
  getSmallIslandMoveById,
  formatActiveMoveGuidanceByAbilityId,
  formatMoveTargetPromptByAbilityId,
  getPlayableMoveDesignGaps,
  getPlayableMovePresentationGaps,
  MOVE_CATEGORY,
  MOVE_STATUS,
  SMALL_ISLAND_MOVES
} from "../app/sandbox/moveData.js";
import { getCompanionAbilityByAbilityId } from "../app/gameplay/content/companionAbilities.js";

const CORE_FIELD_MOVE_ABILITY_IDS = [
  "waterGun",
  "leafage",
  "cut",
  "rockSmash",
  "rototiller",
  "jump",
  "strength",
  "suck"
];

describe("small island move data", () => {
  it("keeps core field moves aligned with companion ability definitions", () => {
    for (const abilityId of CORE_FIELD_MOVE_ABILITY_IDS) {
      const ability = getCompanionAbilityByAbilityId(abilityId);
      const move = getSmallIslandMoveById(ability.moveId);

      expect(move).toMatchObject({
        id: ability.moveId,
        abilityId,
        label: ability.label,
        category: MOVE_CATEGORY.REGULAR,
        status: ability.status,
        requiredPokemon: ability.companionName,
        requiredPokemonId: ability.companionId
      });
      expect(move.worldEffects).toEqual(ability.worldEffects);
    }
  });

  it("keeps future transformation moves separate from companion field moves", () => {
    expect(getSmallIslandMoveById("surf")).toMatchObject({
      category: MOVE_CATEGORY.TRANSFORMATION,
      status: MOVE_STATUS.PLANNED,
      requiredPokemon: null
    });
  });

  it("formats active move guidance from the shared move definition", () => {
    expect(formatActiveMoveGuidanceByAbilityId("leafage")).toBe(
      "Leafage: grow tall grass on restored ground."
    );
    expect(formatActiveMoveGuidanceByAbilityId("waterGun")).toBe(
      "Water Gun: mark dry ground for Squirtle to restore."
    );
    expect(formatActiveMoveGuidanceByAbilityId("waterGun", {
      pendingWaterGunCount: 2
    })).toBe("Water Gun: Squirtle has 2 tiles queued.");
    expect(formatActiveMoveGuidanceByAbilityId("unknown")).toBeNull();
  });

  it("uses first-use guidance while a learned move has not succeeded yet", () => {
    expect(getSmallIslandMoveById("water-gun").firstUseCompleteFlags).toEqual([
      "firstGrassRestored"
    ]);
    expect(getSmallIslandMoveById("leafage").firstUseCompleteFlags).toEqual([
      "leafageTallGrassCount",
      "leafageTallGrassHabitatCreated"
    ]);

    expect(formatActiveMoveGuidanceByAbilityId("waterGun", {
      storyFlags: {}
    })).toBe("Water Gun: mark dry ground; Squirtle will move over and restore it.");
    expect(formatActiveMoveGuidanceByAbilityId("waterGun", {
      storyFlags: {
        firstGrassRestored: true
      }
    })).toBe("Water Gun: mark dry ground for Squirtle to restore.");

    expect(formatActiveMoveGuidanceByAbilityId("leafage", {
      storyFlags: {}
    })).toBe("Leafage: use it on restored ground to grow tall grass.");
    expect(formatActiveMoveGuidanceByAbilityId("leafage", {
      storyFlags: {
        leafageTallGrassCount: 1
      }
    })).toBe("Leafage: grow tall grass on restored ground.");
    expect(formatActiveMoveGuidanceByAbilityId("leafage", {
      storyFlags: {
        leafageTallGrassHabitatCreated: true
      }
    })).toBe("Leafage: grow tall grass on restored ground.");
  });

  it("formats target prompts for current field moves", () => {
    expect(formatMoveTargetPromptByAbilityId("leafage", "ground")).toBe(
      "[Enter] Use Leafage to grow tall grass"
    );
    expect(formatMoveTargetPromptByAbilityId("waterGun", "ground")).toBe(
      "[Enter] Mark dry ground for Squirtle"
    );
    expect(formatMoveTargetPromptByAbilityId("waterGun", "ground", {
      pendingWaterGunCount: 3
    })).toBe("[Enter] Mark dry ground for Squirtle • 3 queued");
    expect(formatMoveTargetPromptByAbilityId("leafage", "unknown")).toBeNull();
  });

  it("documents game design constraints for current playable moves", () => {
    expect(getSmallIslandMoveById("water-gun").design).toEqual({
      benefit: "Restores dry ground, dry plants, and future crop targets.",
      limit: "Requires a marked valid target and Squirtle travel time.",
      feedback: "Target prompt, Squirtle movement, restored tile state, and restoration notice.",
      firstSafeUse: "A nearby dry grass or dry ground patch in the opening field."
    });
    expect(getSmallIslandMoveById("leafage").design).toEqual({
      benefit: "Creates tall grass patches for habitats and Pokemon gathering.",
      limit: "Only works on restored ground, never on still-dry terrain.",
      feedback: "Tile outline, Bulbasaur action, tall grass spawn, and habitat rustle.",
      firstSafeUse: "A restored ground patch created with Water Gun."
    });
    expect(getPlayableMoveDesignGaps()).toEqual([]);
    expect(getPlayableMoveDesignGaps([
      {
        id: "test-move",
        category: MOVE_CATEGORY.REGULAR,
        status: MOVE_STATUS.ACTIVE,
        design: {
          benefit: "",
          limit: "",
          feedback: "",
          firstSafeUse: ""
        }
      }
    ])).toEqual([
      {
        id: "test-move",
        missing: ["benefit", "limit", "feedback", "firstSafeUse"]
      }
    ]);
  });

  it("guards active playable moves from missing UX guidance", () => {
    expect(getPlayableMovePresentationGaps()).toEqual([]);
    expect(getPlayableMovePresentationGaps([
      {
        id: "test-move",
        category: MOVE_CATEGORY.REGULAR,
        status: MOVE_STATUS.ACTIVE,
        activeGuidance: "",
        firstUseGuidance: null,
        firstUseCompleteFlags: [],
        targetPrompts: {}
      }
    ])).toEqual([
      {
        id: "test-move",
        missing: ["activeGuidance", "firstUseGuidance", "firstUseCompleteFlags", "targetPrompts"]
      }
    ]);
  });

  it("exposes immutable shared move content", () => {
    expect(Object.isFrozen(SMALL_ISLAND_MOVES)).toBe(true);
    expect(Object.isFrozen(SMALL_ISLAND_MOVES[0])).toBe(true);
  });
});
