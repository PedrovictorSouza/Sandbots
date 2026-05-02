import { describe, expect, it } from "vitest";
import {
  COMPANION_ABILITIES,
  COMPANION_ABILITY_KIND,
  COMPANION_ABILITY_STATUS,
  getCompanionAbilityByAbilityId,
  getCompanionAbilityByCompanion,
  listCompanionAbilities
} from "../app/gameplay/content/companionAbilities.js";

const EXPECTED_MOVE_LIST = [
  ["leafage", "Bulbasaur", "creates patches of tall grass"],
  ["waterGun", "Squirtle", "revitalizes dried up terrain"],
  ["cut", "Scyther", "cuts lumber"],
  ["rockSmash", "Hitmonchan", "destroys blocks of terrain"],
  ["rototiller", "Drilbur", "tills fields into plantable soil"],
  ["jump", "Magikarp", "springs upward"],
  ["strength", "Machoke", "pushes objects"],
  ["suck", "Paldean Wooper", "sucks up liquids"]
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
      abilityId: "ember",
      element: "fire",
      kind: COMPANION_ABILITY_KIND.HELPER_EVENT,
      status: COMPANION_ABILITY_STATUS.PLANNED
    });
  });

  it("can be queried by future unlock ability id", () => {
    expect(getCompanionAbilityByAbilityId("waterGun")?.companionName).toBe("Squirtle");
    expect(getCompanionAbilityByAbilityId("leafage")?.companionName).toBe("Bulbasaur");
    expect(getCompanionAbilityByAbilityId("ember")?.companionName).toBe("Charmander");
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
    }
  });

  it("exposes the registry as immutable shared content", () => {
    expect(Object.isFrozen(listCompanionAbilities())).toBe(true);
    expect(Object.isFrozen(listCompanionAbilities()[0])).toBe(true);
  });
});
