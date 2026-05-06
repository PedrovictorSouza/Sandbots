import { describe, expect, it } from "vitest";
import {
  COMPANION_ABILITY_STATUS,
  listCompanionAbilities
} from "../app/gameplay/content/companionAbilities.js";
import { HABITAT_STATUS, SMALL_ISLAND_HABITATS } from "../app/sandbox/habitatData.js";
import { MOVE_STATUS, SMALL_ISLAND_MOVES } from "../app/sandbox/moveData.js";
import {
  canPlaceholderBlockRequiredProgress,
  PLACEHOLDER_STATE
} from "../app/story/placeholderPolicyData.js";
import {
  getCurrentCompanionAbilityPlaceholderById,
  getCurrentHabitatPlaceholderById,
  getCurrentMovePlaceholderById,
  getCurrentPlaceholderCatalogGaps,
  listCurrentCompanionAbilityPlaceholders,
  listCurrentHabitatPlaceholders,
  listCurrentMovePlaceholders
} from "../app/story/currentPlaceholderCatalogData.js";

describe("current placeholder catalog data", () => {
  it("classifies every current habitat with placeholder policy metadata", () => {
    expect(listCurrentHabitatPlaceholders().map((entry) => entry.id)).toEqual(
      SMALL_ISLAND_HABITATS.map((habitat) => habitat.id)
    );
    expect(getCurrentPlaceholderCatalogGaps().habitats).toEqual([]);
  });

  it("keeps planned habitats out of required progression", () => {
    const plannedHabitat = SMALL_ISLAND_HABITATS.find(
      (habitat) => habitat.status === HABITAT_STATUS.PLANNED
    );
    const metadata = getCurrentHabitatPlaceholderById(plannedHabitat.id);

    expect(metadata).toMatchObject({
      state: PLACEHOLDER_STATE.PLANNED,
      progressionAllowed: false,
      playerVisible: false
    });
    expect(canPlaceholderBlockRequiredProgress(metadata)).toBe(false);
  });

  it("classifies every current move with placeholder policy metadata", () => {
    expect(listCurrentMovePlaceholders().map((entry) => entry.id)).toEqual(
      SMALL_ISLAND_MOVES.map((move) => move.id)
    );
    expect(getCurrentPlaceholderCatalogGaps().moves).toEqual([]);
  });

  it("keeps planned moves and abilities out of required progression", () => {
    const plannedMove = SMALL_ISLAND_MOVES.find((move) => move.status === MOVE_STATUS.PLANNED);
    const plannedAbility = listCompanionAbilities().find(
      (ability) => ability.status === COMPANION_ABILITY_STATUS.PLANNED
    );

    expect(getCurrentMovePlaceholderById(plannedMove.id)).toMatchObject({
      state: PLACEHOLDER_STATE.PLANNED,
      progressionAllowed: false
    });
    expect(getCurrentCompanionAbilityPlaceholderById(plannedAbility.id)).toMatchObject({
      state: PLACEHOLDER_STATE.PLANNED,
      progressionAllowed: false
    });
    expect(canPlaceholderBlockRequiredProgress(getCurrentMovePlaceholderById(plannedMove.id))).toBe(false);
    expect(canPlaceholderBlockRequiredProgress(
      getCurrentCompanionAbilityPlaceholderById(plannedAbility.id)
    )).toBe(false);
  });

  it("classifies every companion ability with placeholder policy metadata", () => {
    expect(listCurrentCompanionAbilityPlaceholders().map((entry) => entry.id)).toEqual(
      listCompanionAbilities().map((ability) => ability.id)
    );
    expect(getCurrentPlaceholderCatalogGaps().companionAbilities).toEqual([]);
  });
});
