import {
  CAMPFIRE_ITEM_ID,
  getBuildingKitByItemId,
  ITEM_DEFS,
  LEAF_DEN_KIT_ITEM_ID,
  PLACEHOLDER_RECIPES,
  STRAW_BED_ITEM_ID
} from "../../gameplayContent.js";
import {
  DEFAULT_PLACEABLE_OBJECTS,
  GRID_BUILD_CATEGORIES,
  GRID_PLACEABLE_IDS
} from "./gridBuildingSystem.js";
import { RECIPE_DEFS } from "../../studies/typescript/recipes.ts";

export const BUILDABLE_SOURCE_TYPES = Object.freeze({
  RECIPE: "recipe",
  BUILDING_KIT: "building-kit"
});

const WORKBENCH_BUILDABLE_DEFS = Object.freeze([
  Object.freeze({
    id: GRID_PLACEABLE_IDS.TRAIN_HOUSE,
    recipeId: "campfire",
    gridPlaceableId: GRID_PLACEABLE_IDS.TRAIN_HOUSE,
    sourceType: BUILDABLE_SOURCE_TYPES.RECIPE
  }),
  Object.freeze({
    id: GRID_PLACEABLE_IDS.SOLAR_STATION,
    recipeId: "strawBed",
    gridPlaceableId: GRID_PLACEABLE_IDS.SOLAR_STATION,
    sourceType: BUILDABLE_SOURCE_TYPES.RECIPE
  }),
  Object.freeze({
    id: GRID_PLACEABLE_IDS.LEAF_DEN,
    itemId: LEAF_DEN_KIT_ITEM_ID,
    gridPlaceableId: GRID_PLACEABLE_IDS.LEAF_DEN_KIT,
    completedGridPlaceableId: GRID_PLACEABLE_IDS.LEAF_DEN,
    sourceType: BUILDABLE_SOURCE_TYPES.BUILDING_KIT,
    workbenchRecipe: RECIPE_DEFS.leafDenKit
  })
]);

function shallowFreezeRecord(record) {
  Object.values(record).forEach((value) => {
    if (value && typeof value === "object" && !Object.isFrozen(value)) {
      Object.freeze(value);
    }
  });
  return Object.freeze(record);
}

function getPlaceableById(placeableId) {
  return DEFAULT_PLACEABLE_OBJECTS.find((placeable) => placeable.id === placeableId) || null;
}

function getRecipeOutputItemId(recipe) {
  return Object.keys(recipe?.output || {})[0] || null;
}

function createRecipeBuildable(def) {
  const recipe = PLACEHOLDER_RECIPES[def.recipeId];
  if (!recipe) {
    throw new Error(`Missing buildable recipe: ${def.recipeId}`);
  }

  const outputItemId = getRecipeOutputItemId(recipe);
  const item = ITEM_DEFS[outputItemId];
  const placeable = getPlaceableById(def.gridPlaceableId);

  if (!outputItemId || !item || !placeable) {
    throw new Error(`Incomplete recipe buildable data: ${def.id}`);
  }

  return shallowFreezeRecord({
    id: def.id,
    label: item.label || recipe.title,
    group: GRID_BUILD_CATEGORIES.WORKBENCH,
    sourceType: BUILDABLE_SOURCE_TYPES.RECIPE,
    sourceId: recipe.id,
    sourceItemId: outputItemId,
    inventoryItemId: outputItemId,
    recipeId: recipe.id,
    ingredients: Object.freeze({ ...recipe.ingredients }),
    output: Object.freeze({ ...recipe.output }),
    gridPlaceableId: placeable.id,
    prefabKey: placeable.prefabKey,
    footprint: Object.freeze({ ...placeable.footprint }),
    placementType: placeable.placementType,
    buildCategory: placeable.buildCategory,
    note: recipe.note || ""
  });
}

function createBuildingKitBuildable(def) {
  const kit = getBuildingKitByItemId(def.itemId);
  const item = ITEM_DEFS[def.itemId];
  const previewPlaceable = getPlaceableById(def.gridPlaceableId);
  const completedPlaceable = getPlaceableById(def.completedGridPlaceableId);

  if (!kit || !item || !previewPlaceable || !completedPlaceable) {
    throw new Error(`Incomplete building kit buildable data: ${def.id}`);
  }

  return shallowFreezeRecord({
    id: def.id,
    label: item.label || kit.name,
    group: GRID_BUILD_CATEGORIES.WORKBENCH,
    sourceType: BUILDABLE_SOURCE_TYPES.BUILDING_KIT,
    sourceId: kit.id,
    sourceItemId: kit.itemId,
    inventoryItemId: kit.itemId,
    buildingKitId: kit.id,
    gridPlaceableId: previewPlaceable.id,
    completedGridPlaceableId: completedPlaceable.id,
    prefabKey: previewPlaceable.prefabKey,
    completedPrefabKey: completedPlaceable.prefabKey,
    footprint: Object.freeze({ ...previewPlaceable.footprint }),
    completedFootprint: Object.freeze({ ...completedPlaceable.footprint }),
    placementType: previewPlaceable.placementType,
    buildCategory: previewPlaceable.buildCategory,
    requiredMaterials: Object.freeze(kit.requiredMaterials.map((material) => Object.freeze({ ...material }))),
    requiredSpecialties: Object.freeze([...kit.requiredSpecialties]),
    buildDurationSeconds: kit.buildDurationSeconds,
    minFurnitureRequired: kit.minFurnitureRequired,
    validPlacementRules: Object.freeze([...kit.validPlacementRules]),
    workbenchRecipe: def.workbenchRecipe ? cloneRecipe(def.workbenchRecipe) : null
  });
}

function createWorkbenchBuildable(def) {
  if (def.sourceType === BUILDABLE_SOURCE_TYPES.RECIPE) {
    return createRecipeBuildable(def);
  }

  if (def.sourceType === BUILDABLE_SOURCE_TYPES.BUILDING_KIT) {
    return createBuildingKitBuildable(def);
  }

  throw new Error(`Unsupported buildable source type: ${def.sourceType}`);
}

function assertUniqueBuildables(buildables) {
  const ids = new Set();
  const itemIds = new Set();

  buildables.forEach((buildable) => {
    if (ids.has(buildable.id)) {
      throw new Error(`Duplicate buildable id: ${buildable.id}`);
    }
    ids.add(buildable.id);

    if (itemIds.has(buildable.inventoryItemId)) {
      throw new Error(`Duplicate buildable inventory item id: ${buildable.inventoryItemId}`);
    }
    itemIds.add(buildable.inventoryItemId);
  });
}

const WORKBENCH_BUILDABLES = Object.freeze(WORKBENCH_BUILDABLE_DEFS.map(createWorkbenchBuildable));
assertUniqueBuildables(WORKBENCH_BUILDABLES);

export function listWorkbenchBuildables() {
  return WORKBENCH_BUILDABLES;
}

export function getWorkbenchBuildableById(buildableId) {
  return WORKBENCH_BUILDABLES.find((buildable) => buildable.id === buildableId) || null;
}

export function getWorkbenchBuildableByInventoryItemId(itemId) {
  return WORKBENCH_BUILDABLES.find((buildable) => buildable.inventoryItemId === itemId) || null;
}

export function getWorkbenchBuildableByOutputItemId(itemId) {
  if (itemId === CAMPFIRE_ITEM_ID || itemId === STRAW_BED_ITEM_ID) {
    return getWorkbenchBuildableByInventoryItemId(itemId);
  }

  return getWorkbenchBuildableByInventoryItemId(itemId);
}

function cloneRecipe(recipe) {
  return shallowFreezeRecord({
    ...recipe,
    ingredients: Object.freeze({ ...(recipe?.ingredients || {}) }),
    output: Object.freeze({ ...(recipe?.output || {}) })
  });
}

export function createWorkbenchRecipeMap({ placeholderRecipes = PLACEHOLDER_RECIPES } = {}) {
  const recipeMap = {};

  Object.entries(placeholderRecipes || {}).forEach(([recipeId, recipe]) => {
    recipeMap[recipeId] = cloneRecipe(recipe);
  });

  WORKBENCH_BUILDABLE_DEFS.forEach((def) => {
    if (def.sourceType === BUILDABLE_SOURCE_TYPES.RECIPE) {
      const recipe = placeholderRecipes?.[def.recipeId] || PLACEHOLDER_RECIPES[def.recipeId];
      if (recipe) {
        recipeMap[def.recipeId] = cloneRecipe(recipe);
      }
      return;
    }

    if (def.workbenchRecipe) {
      recipeMap[def.workbenchRecipe.id] = cloneRecipe(def.workbenchRecipe);
    }
  });

  return Object.freeze(recipeMap);
}
