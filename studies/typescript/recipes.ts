import type { CraftedItemId } from "./crafted-items";
import type { MaterialId } from "./materials";

export const FOOD_INGREDIENT_IDS = [
  "blackberry",
  "rowanberry",
  "elderberry",
] as const;

export type FoodIngredientId = typeof FOOD_INGREDIENT_IDS[number];
export type IngredientId = MaterialId | FoodIngredientId;
export type CraftingStationId = "workbench" | "stove";

export type IngredientStack = Partial<Record<IngredientId, number>>;
export type MaterialRequirementStack = Partial<Record<MaterialId, number>>;
export type RecipeOutput = Partial<Record<CraftedItemId, number>>;

export type RecipeDef = {
  id: string;
  title: string;
  stationId: CraftingStationId;
  ingredients: IngredientStack;
  output: RecipeOutput;
  note?: string;
};

export const RECIPE_DEFS = {
  campfire: {
    id: "campfire",
    title: "Thermal Cabin",
    stationId: "workbench",
    ingredients: {
      wood: 3,
    },
    output: {
      campfire: 1,
    },
    note: "Simple wooden DIY recipe for the first thermal shelter objective.",
  },
  strawBed: {
    id: "strawBed",
    title: "Solar Station",
    stationId: "workbench",
    ingredients: {
      leaves: 2,
    },
    output: {
      strawBed: 1,
    },
    note: "A Grow Bot recipe for a compact habitat Solar Station.",
  },
  bridgeKit: {
    id: "bridgeKit",
    title: "Bridge Repair Kit",
    stationId: "workbench",
    ingredients: {
      wood: 4,
      flaxFiber: 2,
    },
    output: {
      bridgeKit: 1,
    },
    note: "Placeholder craft for the bridge repair step.",
  },
  marshPie: {
    id: "marshPie",
    title: "Marsh Ration",
    stationId: "stove",
    ingredients: {
      blackberry: 4,
      rowanberry: 4,
      elderberry: 2,
    },
    output: {
      marshPie: 1,
    },
    note: "Placeholder cooking step standing in for Route Survey Bot's ration route.",
  },
  granitePickaxe: {
    id: "granitePickaxe",
    title: "Granite Pickaxe",
    stationId: "workbench",
    ingredients: {
      wood: 3,
      granite: 3,
      woolYarn: 1,
    },
    output: {
      granitePickaxe: 1,
    },
    note: "Placeholder tool craft that opens the granite gate route.",
  },
  burrowRepairKit: {
    id: "burrowRepairKit",
    title: "Burrow Repair Kit",
    stationId: "workbench",
    ingredients: {
      wood: 6,
      granite: 4,
      silkYarn: 1,
    },
    output: {
      burrowRepairKit: 1,
    },
    note: "Placeholder restoration bundle for the finale.",
  },
  leafDenKit: {
    id: "leafDenKit",
    title: "House",
    stationId: "workbench",
    ingredients: {},
    output: {
      leafDenKit: 1,
    },
    note: "A colony protocol issue for the first proper human home.",
  },
} satisfies Record<string, RecipeDef>;

export type RecipeId = keyof typeof RECIPE_DEFS;

export const CONSTRUCTION_MATERIAL_REQUIREMENTS = {
  leafDenKit: {
    wood: 3,
    leaves: 3,
  },
} satisfies Partial<Record<CraftedItemId, MaterialRequirementStack>>;
