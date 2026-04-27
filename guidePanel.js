import {
  createGuidePanelState,
  ensureSelection,
  getTrackedRecipe,
  setView,
} from "./handbook/guidePanelModel.js";
import {
  focusGuidePanelControl,
  mountGuidePanelShell,
  renderGuidePanel,
} from "./handbook/guidePanelRenderer.js";

export function createGuidePanel({ root, onClose = () => {}, onTrackRecipe = () => {} } = {}) {
  const state = createGuidePanelState();
  const refs = mountGuidePanelShell(root);

  function render() {
    renderGuidePanel(refs, state);
  }

  refs.searchInput.addEventListener("keydown", (event) => {
    event.stopPropagation();
  });

  refs.searchInput.addEventListener("input", () => {
    state.search = refs.searchInput.value;
    ensureSelection(state);
    render();
  });

  refs.closeButton.addEventListener("click", () => {
    onClose();
  });

  function handleNavigationAction(type, targetId) {
    if (type === "view") {
      setView(state, targetId);
      render();
      return;
    }

    if (type === "article") {
      state.selectedArticleId = targetId;
      state.view = "articles";
      render();
      return;
    }

    if (type === "guide") {
      state.selectedGuideId = targetId;
      state.view = "guides";
      render();
    }
  }

  root.addEventListener("click", (event) => {
    const viewButton = event.target.closest("[data-guide-view]");
    if (viewButton) {
      setView(state, viewButton.dataset.guideView);
      render();
      return;
    }

    const actionButton = event.target.closest("[data-toolkit-action-type]");
    if (actionButton) {
      handleNavigationAction(
        actionButton.dataset.toolkitActionType,
        actionButton.dataset.toolkitActionTarget
      );
      return;
    }

    const guideButton = event.target.closest("[data-toolkit-guide]");
    if (guideButton) {
      state.selectedGuideId = guideButton.dataset.toolkitGuide;
      render();
      return;
    }

    const articleButton = event.target.closest("[data-toolkit-article]");
    if (articleButton) {
      state.selectedArticleId = articleButton.dataset.toolkitArticle;
      render();
      return;
    }

    const sectionButton = event.target.closest("[data-article-section]");
    if (sectionButton) {
      const sectionNode = document.getElementById(sectionButton.dataset.articleSection);
      sectionNode?.scrollIntoView({ block: "start", behavior: "smooth" });
      return;
    }

    const filterButton = event.target.closest("[data-guide-filter]");
    if (filterButton) {
      state.filter = filterButton.dataset.guideFilter;
      ensureSelection(state);
      render();
      return;
    }

    const recipeButton = event.target.closest("[data-recipe-id]");
    if (recipeButton) {
      state.selectedRecipeId = recipeButton.dataset.recipeId;
      render();
      return;
    }

    const trackButton = event.target.closest("[data-track-recipe]");
    if (trackButton) {
      const recipeId = trackButton.dataset.trackRecipe;
      const nextTrackedId = state.trackedRecipeId === recipeId ? null : recipeId;
      state.trackedRecipeId = nextTrackedId;
      onTrackRecipe(getTrackedRecipe(nextTrackedId));
      render();
      return;
    }

    const mapButton = event.target.closest("[data-map-point]");
    if (mapButton) {
      state.selectedMapPointId = mapButton.dataset.mapPoint;
      render();
    }
  });

  render();

  return {
    focusSearch() {
      focusGuidePanelControl(refs);
    },
    clearTrack() {
      state.trackedRecipeId = null;
      onTrackRecipe(null);
      render();
    },
  };
}
