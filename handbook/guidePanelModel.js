import {
  ALL_RECIPES,
  COOKING_RECIPES,
  CRAFTING_RECIPES,
  FEATURED_ARTICLE_ID,
  SMALL_ISLAND_MAP_POINTS,
  TOOLKIT_ARTICLES,
  TOOLKIT_GUIDES,
} from "../winterBurrowData.js";

const RECIPE_VIEWS = new Set(["crafting", "cooking", "database"]);

function buildRecipeSearchCorpus(recipe) {
  const ingredientList = recipe.ingredients.map((entry) => `${entry.amount} ${entry.name}`).join(", ");
  const fields = [
    recipe.name,
    recipe.category,
    ingredientList,
    recipe.attack ? `attack ${recipe.attack}` : "",
    recipe.obtainedFrom || "",
    recipe.duration || "",
    ...(recipe.statBoosts || []),
  ];

  return fields.join(" ").toLowerCase();
}

export function createGuidePanelState() {
  return {
    view: "home",
    search: "",
    filter: "all",
    selectedGuideId: TOOLKIT_GUIDES[0]?.id || null,
    selectedArticleId: FEATURED_ARTICLE_ID,
    selectedRecipeId: CRAFTING_RECIPES[0]?.id || null,
    trackedRecipeId: null,
    selectedMapPointId: SMALL_ISLAND_MAP_POINTS[0]?.id || null,
  };
}

export function isRecipeView(view) {
  return RECIPE_VIEWS.has(view);
}

export function getRecipesForView(view) {
  if (view === "crafting") {
    return CRAFTING_RECIPES;
  }

  if (view === "cooking") {
    return COOKING_RECIPES;
  }

  if (view === "database") {
    return ALL_RECIPES;
  }

  return [];
}

export function getArticleById(articleId) {
  return TOOLKIT_ARTICLES.find((article) => article.id === articleId) || TOOLKIT_ARTICLES[0] || null;
}

export function getGuideById(guideId) {
  return TOOLKIT_GUIDES.find((guide) => guide.id === guideId) || TOOLKIT_GUIDES[0] || null;
}

export function getTrackedRecipe(trackedRecipeId) {
  return ALL_RECIPES.find((recipe) => recipe.id === trackedRecipeId) || null;
}

export function getVisibleRecipes(state) {
  const recipes = getRecipesForView(state.view);
  const query = state.search.trim().toLowerCase();

  return recipes.filter((recipe) => {
    const matchesFilter = state.view === "database"
      ? state.filter === "all" || recipe.section === state.filter
      : state.filter === "all" || recipe.category === state.filter;

    if (!matchesFilter) {
      return false;
    }

    if (!query) {
      return true;
    }

    return buildRecipeSearchCorpus(recipe).includes(query);
  });
}

export function ensureSelection(state) {
  if (!isRecipeView(state.view)) {
    return;
  }

  const visibleRecipes = getVisibleRecipes(state);
  if (!visibleRecipes.length) {
    state.selectedRecipeId = null;
    return;
  }

  const stillVisible = visibleRecipes.some((recipe) => recipe.id === state.selectedRecipeId);
  if (!stillVisible) {
    state.selectedRecipeId = visibleRecipes[0].id;
  }
}

export function setView(state, view) {
  state.view = view;
  state.search = "";
  state.filter = "all";

  if (view === "map") {
    state.selectedMapPointId = state.selectedMapPointId || SMALL_ISLAND_MAP_POINTS[0]?.id || null;
  }

  if (isRecipeView(view)) {
    const nextRecipes = getRecipesForView(view);
    state.selectedRecipeId = nextRecipes[0]?.id || null;
  }

  if (view === "guides") {
    state.selectedGuideId = state.selectedGuideId || TOOLKIT_GUIDES[0]?.id || null;
  }

  if (view === "articles") {
    state.selectedArticleId = state.selectedArticleId || FEATURED_ARTICLE_ID;
  }

  ensureSelection(state);
}
