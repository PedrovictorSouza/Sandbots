import { describe, expect, it } from "vitest";
import {
  CARBON_ITEM_ID,
  INVENTORY_ORDER,
  ITEM_DEFS,
  LEAF_DEN_KIT_ITEM_ID,
  NITROGEN_ITEM_ID,
  PHOSPHORUS_ITEM_ID,
  PLACEHOLDER_RECIPES,
  POTASSIUM_ITEM_ID
} from "../gameplayContent.js";
import { createWorkbenchRecipeMap } from "../app/gameplay/buildableCatalog.js";
import {
  FIELD_ABILITY_COMPANION_BY_ID,
  createActiveFieldMoveState,
  createInactiveFieldMoveState,
  getActiveFieldMoveAbilityId,
  getActiveFieldMoveStateFromAbilityId
} from "../app/gameplay/content/activeFieldMoveState.ts";
import { getCompanionAbilityByAbilityId } from "../app/gameplay/content/companionAbilities.js";
import { CRAFTED_ITEM_DEFS } from "../studies/typescript/crafted-items.ts";
import { MATERIAL_DEFS } from "../studies/typescript/materials.ts";
import { RECIPE_DEFS } from "../studies/typescript/recipes.ts";
import {
  FIELD_ABILITY_COSTS,
  getRequiredMaterialChargeFieldAbilityCost
} from "../app/gameplay/content/fieldAbilityCosts.ts";

describe("material crafting contracts", () => {
  it("uses material definitions as material inventory items", () => {
    Object.entries(MATERIAL_DEFS).forEach(([materialId, material]) => {
      expect(ITEM_DEFS[materialId]).toMatchObject({
        id: material.id,
        label: material.label,
        bagLabel: material.bagLabel,
        slotRole: "material"
      });
    });

    expect(INVENTORY_ORDER).toEqual(expect.arrayContaining(Object.keys(MATERIAL_DEFS)));
    expect([NITROGEN_ITEM_ID, PHOSPHORUS_ITEM_ID, POTASSIUM_ITEM_ID]).toEqual([
      "nitrogen",
      "phosphorus",
      "potassium"
    ]);
  });

  it("uses crafted item definitions for craftable inventory items", () => {
    Object.entries(CRAFTED_ITEM_DEFS).forEach(([itemId, item]) => {
      expect(ITEM_DEFS[itemId]).toMatchObject({
        id: item.id,
        label: item.label,
        bagLabel: item.bagLabel
      });
    });
  });

  it("uses recipe definitions for current recipe catalogs", () => {
    Object.keys(PLACEHOLDER_RECIPES).forEach((recipeId) => {
      expect(PLACEHOLDER_RECIPES[recipeId]).toBe(RECIPE_DEFS[recipeId]);
    });

    expect(createWorkbenchRecipeMap()[LEAF_DEN_KIT_ITEM_ID]).toMatchObject(
      RECIPE_DEFS[LEAF_DEN_KIT_ITEM_ID]
    );
  });

  it("defines production material costs for current field abilities", () => {
    expect(getRequiredMaterialChargeFieldAbilityCost("fire")).toMatchObject({
      kind: "materialCharges",
      materialId: CARBON_ITEM_ID,
      usesPerUnit: 10,
      useFlag: "charmanderFireCarbonUses",
      emptyNotice: "Thermal Bot needs Carbon to use Thermal Torch."
    });

    expect(FIELD_ABILITY_COSTS.waterGun.cost).toMatchObject({
      kind: "materialBundle",
      materials: [
        { materialId: NITROGEN_ITEM_ID, amount: 1 },
        { materialId: PHOSPHORUS_ITEM_ID, amount: 1 },
        { materialId: POTASSIUM_ITEM_ID, amount: 1 }
      ]
    });
    expect(FIELD_ABILITY_COSTS.leafage.cost).toMatchObject({
      kind: "materialBundle",
      materials: [
        { materialId: NITROGEN_ITEM_ID, amount: 1 },
        { materialId: PHOSPHORUS_ITEM_ID, amount: 1 },
        { materialId: POTASSIUM_ITEM_ID, amount: 1 }
      ]
    });
  });

  it("models active field moves as valid companion ability pairs", () => {
    expect(createInactiveFieldMoveState()).toEqual({ kind: "inactive" });
    const waterGunState = createActiveFieldMoveState("waterGun");

    expect(waterGunState).toEqual({
      kind: "active",
      abilityId: "waterGun",
      companionId: "squirtle"
    });
    expect(getActiveFieldMoveAbilityId(waterGunState)).toBe("waterGun");
    expect(getActiveFieldMoveAbilityId(createInactiveFieldMoveState())).toBeNull();
    expect(createActiveFieldMoveState("leafage")).toEqual({
      kind: "active",
      abilityId: "leafage",
      companionId: "bulbasaur"
    });
    expect(createActiveFieldMoveState("fire")).toEqual({
      kind: "active",
      abilityId: "fire",
      companionId: "charmander"
    });

    expect(getActiveFieldMoveStateFromAbilityId(null)).toEqual({ kind: "inactive" });
    expect(getActiveFieldMoveStateFromAbilityId("unknown")).toEqual({ kind: "inactive" });

    Object.entries(FIELD_ABILITY_COMPANION_BY_ID).forEach(([abilityId, companionId]) => {
      expect(getCompanionAbilityByAbilityId(abilityId)?.companionId).toBe(companionId);
      expect(FIELD_ABILITY_COSTS[abilityId].companionId).toBe(companionId);
    });
  });
});
