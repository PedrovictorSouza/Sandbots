import type { MaterialId } from "../../../studies/typescript/materials";
import type {
  FieldAbilityId,
  FieldAbilityCompanionId,
  FieldAbilityPairFor
} from "./activeFieldMoveState";
import {
  SANDBOTS_BOT_NAMES,
  SANDBOTS_ITEM_NAMES
} from "../../story/sandbotsLexicon.js";

export type { FieldAbilityId, FieldAbilityCompanionId };

export type MaterialStack = {
  materialId: MaterialId;
  amount: number;
};

export type AbilityCost =
  | { kind: "none" }
  | {
      kind: "materialCharges";
      materialId: MaterialId;
      usesPerUnit: number;
      useFlag: string;
      emptyNotice: string;
    }
  | {
      kind: "materialBundle";
      materials: readonly MaterialStack[];
      emptyNotice: string;
    };

export type FieldAbilityCostDef<AbilityId extends FieldAbilityId = FieldAbilityId> =
  FieldAbilityPairFor<AbilityId> & {
    cost: AbilityCost;
  };

type FieldAbilityCostRegistry = {
  [AbilityId in FieldAbilityId]: FieldAbilityCostDef<AbilityId>;
};

const SOIL_NUTRIENT_BUNDLE = [
  { materialId: "nitrogen", amount: 1 },
  { materialId: "phosphorus", amount: 1 },
  { materialId: "potassium", amount: 1 },
] as const satisfies readonly MaterialStack[];

export const FIELD_ABILITY_COSTS = {
  waterGun: {
    abilityId: "waterGun",
    companionId: "squirtle",
    cost: {
      kind: "materialBundle",
      materials: SOIL_NUTRIENT_BUNDLE,
      emptyNotice: `${SANDBOTS_BOT_NAMES.hydro} needs Nitrogen, Phosphorus, and Potassium to restore soil.`,
    },
  },
  leafage: {
    abilityId: "leafage",
    companionId: "bulbasaur",
    cost: {
      kind: "materialBundle",
      materials: SOIL_NUTRIENT_BUNDLE,
      emptyNotice: `${SANDBOTS_BOT_NAMES.grow} needs Nitrogen, Phosphorus, and Potassium to grow plants.`,
    },
  },
  fire: {
    abilityId: "fire",
    companionId: "charmander",
    cost: {
      kind: "materialCharges",
      materialId: "carbon",
      usesPerUnit: 10,
      useFlag: "charmanderFireCarbonUses",
      emptyNotice: `${SANDBOTS_BOT_NAMES.thermal} needs Carbon to use ${SANDBOTS_ITEM_NAMES.thermalTool}.`,
    },
  },
} as const satisfies FieldAbilityCostRegistry;

export function getFieldAbilityCost(abilityId: FieldAbilityId): AbilityCost {
  return FIELD_ABILITY_COSTS[abilityId].cost;
}

export function getRequiredMaterialChargeFieldAbilityCost(abilityId: FieldAbilityId) {
  const cost = getFieldAbilityCost(abilityId);

  if (cost.kind !== "materialCharges") {
    throw new Error(`Field ability "${abilityId}" does not use material charges.`);
  }

  return cost;
}
