import { describe, expect, it } from "vitest";
import {
  COMPANION_ABILITIES,
  COMPANION_ABILITY_DESIGN_FIELDS,
  COMPANION_ABILITY_FIRST_USE_FIELDS,
  COMPANION_ABILITY_KIND,
  COMPANION_ABILITY_STATUS,
  getCompanionAbilityByAbilityId,
  getCompanionAbilityByCompanion,
  getCompanionAbilityDesignGaps,
  getCompanionAbilityFirstUseGaps,
  listCompanionAbilities
} from "../app/gameplay/content/companionAbilities.js";

const EXPECTED_MOVE_LIST = [
  ["leafage", "Grow Bot", "creates patches of tall grass"],
  ["fire", "Thermal Bot", "turns white ground into dry ground for Hydro Jet restoration"],
  ["waterGun", "Hydro Bot", "revitalizes dried up terrain"],
  ["cut", "Cutter Bot", "cuts lumber"],
  ["rockSmash", "Impact Bot", "destroys blocks of terrain"],
  ["rototiller", "Drill Bot", "tills fields into plantable soil"],
  ["jump", "Ferry Bot", "springs upward"],
  ["strength", "Hauler Bot", "pushes objects"],
  ["suck", "Mud Bot", "sucks up liquids"]
];

describe("companion ability registry", () => {
  it("tracks the current starter companion ability pattern", () => {
    expect(getCompanionAbilityByCompanion("squirtle")).toMatchObject({
      abilityId: "waterGun",
      element: "water",
      kind: COMPANION_ABILITY_KIND.FIELD_MOVE,
      status: COMPANION_ABILITY_STATUS.ACTIVE
    });
    expect(getCompanionAbilityByCompanion("bulbasaur")).toMatchObject({
      abilityId: "leafage",
      element: "grass",
      kind: COMPANION_ABILITY_KIND.FIELD_MOVE,
      status: COMPANION_ABILITY_STATUS.ACTIVE
    });
    expect(getCompanionAbilityByCompanion("charmander")).toMatchObject({
      abilityId: "fire",
      element: "fire",
      kind: COMPANION_ABILITY_KIND.FIELD_MOVE,
      status: COMPANION_ABILITY_STATUS.PARTIAL
    });
  });

  it("can be queried by future unlock ability id", () => {
    expect(getCompanionAbilityByAbilityId("waterGun")?.companionName).toBe("Hydro Bot");
    expect(getCompanionAbilityByAbilityId("leafage")?.companionName).toBe("Grow Bot");
    expect(getCompanionAbilityByAbilityId("fire")?.companionName).toBe("Thermal Bot");
    expect(getCompanionAbilityByAbilityId("unknown")).toBeNull();
  });

  it("tracks the supplied move list with required Pokemon and effects", () => {
    for (const [abilityId, companionName, expectedEffect] of EXPECTED_MOVE_LIST) {
      const ability = getCompanionAbilityByAbilityId(abilityId);

      expect(ability).toBeTruthy();
      expect(ability.companionName).toBe(companionName);
      expect(ability.kind).toBe(COMPANION_ABILITY_KIND.FIELD_MOVE);
      expect(ability.worldEffects).toContain(expectedEffect);
    }
  });

  it("keeps each entry complete enough for future unlock wiring", () => {
    const ids = new Set();

    for (const ability of COMPANION_ABILITIES) {
      expect(ids.has(ability.id)).toBe(false);
      ids.add(ability.id);
      expect(ability.companionId).toBeTruthy();
      expect(ability.companionName).toBeTruthy();
      expect(ability.element).toBeTruthy();
      expect(ability.abilityId).toBeTruthy();
      expect(ability.label).toBeTruthy();
      expect(ability.unlock?.when).toBeTruthy();
      expect(ability.targets.length).toBeGreaterThan(0);
      expect(ability.worldEffects.length).toBeGreaterThan(0);
      expect(ability.narrativePurpose).toBeTruthy();
    }
  });

  it("explains why current and planned abilities matter narratively", () => {
    expect(getCompanionAbilityByAbilityId("waterGun")?.narrativePurpose).toContain("reverse drought");
    expect(getCompanionAbilityByAbilityId("leafage")?.narrativePurpose).toContain("social invitation");
    expect(getCompanionAbilityByAbilityId("rockSmash")?.narrativePurpose).toContain("ridge repair story");
    expect(getCompanionAbilityByAbilityId("fire")?.narrativePurpose).toContain("emotional recovery");
  });

  it("documents Jesse-style benefit, limit, first use, feedback, and synergy for current field abilities", () => {
    for (const abilityId of ["waterGun", "leafage", "fire"]) {
      const design = getCompanionAbilityByAbilityId(abilityId)?.design;

      expect(design?.benefit).toBeTruthy();
      expect(design?.limit).toBeTruthy();
      expect(design?.validTarget).toBeTruthy();
      expect(design?.firstSafeUse).toBeTruthy();
      expect(design?.feedback).toBeTruthy();
      expect(design?.synergy).toBeTruthy();
    }

    expect(getCompanionAbilityByAbilityId("waterGun")?.design.benefit)
      .toContain("Restores drought-damaged terrain");
    expect(getCompanionAbilityByAbilityId("leafage")?.design.limit)
      .toContain("Only works on restored ground");
    expect(getCompanionAbilityByAbilityId("fire")?.design.synergy)
      .toContain("Prepares white ground");
  });

  it("validates active ability design notes before runtime integration", () => {
    expect(COMPANION_ABILITY_DESIGN_FIELDS).toEqual([
      "benefit",
      "limit",
      "validTarget",
      "firstSafeUse",
      "feedback",
      "synergy"
    ]);
    expect(getCompanionAbilityDesignGaps()).toEqual([]);
    expect(getCompanionAbilityDesignGaps([
      {
        abilityId: "testTool",
        companionName: "Test Bot",
        kind: COMPANION_ABILITY_KIND.FIELD_MOVE,
        status: COMPANION_ABILITY_STATUS.ACTIVE,
        design: {
          benefit: "Does one useful thing.",
          limit: "",
          validTarget: "One clear target."
        }
      },
      {
        abilityId: "futureTool",
        companionName: "Future Bot",
        kind: COMPANION_ABILITY_KIND.FIELD_MOVE,
        status: COMPANION_ABILITY_STATUS.PLANNED
      }
    ])).toEqual([
      {
        abilityId: "testTool",
        companionName: "Test Bot",
        missing: ["limit", "firstSafeUse", "feedback", "synergy"]
      }
    ]);
  });

  it("keeps first-use onboarding checklists for unlocked field abilities", () => {
    expect(COMPANION_ABILITY_FIRST_USE_FIELDS).toEqual([
      "validTarget",
      "prompt",
      "firstSafeUse",
      "safeFailure",
      "feedback",
      "reward",
      "nextHook"
    ]);
    expect(getCompanionAbilityFirstUseGaps()).toEqual([]);
    expect(getCompanionAbilityByAbilityId("waterGun")?.design).toMatchObject({
      prompt: "Aim Hydro Jet at dry ground or thirsty plants.",
      reward: "The dry tile visibly restores into usable colony ground.",
      nextHook: "Restored ground can support Grow Bot's Bio-Grow."
    });
    expect(getCompanionAbilityByAbilityId("leafage")?.design).toMatchObject({
      prompt: "Use Bio-Grow on restored ground.",
      safeFailure: "Dry or unstable ground points back to Hydro Jet before growth is allowed."
    });
    expect(getCompanionAbilityFirstUseGaps([
      {
        abilityId: "halfTaughtTool",
        companionName: "Half-Taught Bot",
        kind: COMPANION_ABILITY_KIND.FIELD_MOVE,
        status: COMPANION_ABILITY_STATUS.ACTIVE,
        design: {
          validTarget: "A visible target.",
          prompt: "Use the tool.",
          firstSafeUse: "A safe target."
        }
      }
    ])).toEqual([
      {
        abilityId: "halfTaughtTool",
        companionName: "Half-Taught Bot",
        missing: ["safeFailure", "feedback", "reward", "nextHook"]
      }
    ]);
  });

  it("exposes the registry as immutable shared content", () => {
    expect(Object.isFrozen(listCompanionAbilities())).toBe(true);
    expect(Object.isFrozen(listCompanionAbilities()[0])).toBe(true);
  });
});
