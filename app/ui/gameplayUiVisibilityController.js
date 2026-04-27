const GAMEPLAY_UI_SECTIONS = Object.freeze([
  "hud",
  "quest",
  "bagOnboarding",
  "bagDetails",
  "missions",
  "nearbyHabitats",
  "skills",
  "inventory",
  "status",
  "builder"
]);

function toDatasetKey(sectionId) {
  return `gameplayUi${sectionId[0].toUpperCase()}${sectionId.slice(1)}`;
}

function assertValidSections(sectionIds) {
  for (const sectionId of sectionIds) {
    if (!GAMEPLAY_UI_SECTIONS.includes(sectionId)) {
      throw new Error(`Unknown gameplay UI section: ${sectionId}`);
    }
  }
}

export function createGameplayUiVisibilityController({
  uiLayer,
  initialVisibility = "visible"
} = {}) {
  if (!(uiLayer instanceof HTMLElement)) {
    throw new Error("Gameplay UI visibility controller requires a valid uiLayer.");
  }

  const allVisible = initialVisibility !== "hidden";
  const sectionVisibility = Object.fromEntries(
    GAMEPLAY_UI_SECTIONS.map((sectionId) => [sectionId, allVisible])
  );

  function syncUiLayerState() {
    const visibleCount = GAMEPLAY_UI_SECTIONS.filter((sectionId) => sectionVisibility[sectionId]).length;
    uiLayer.dataset.gameplayUiState =
      visibleCount === 0 ?
        "hidden" :
        visibleCount === GAMEPLAY_UI_SECTIONS.length ?
          "visible" :
          "custom";

    for (const sectionId of GAMEPLAY_UI_SECTIONS) {
      uiLayer.dataset[toDatasetKey(sectionId)] = sectionVisibility[sectionId] ? "visible" : "hidden";
    }
  }

  function setSectionsVisibility(sectionIds, visible) {
    assertValidSections(sectionIds);

    for (const sectionId of sectionIds) {
      sectionVisibility[sectionId] = visible;
    }

    syncUiLayerState();
  }

  syncUiLayerState();

  return {
    hideAll() {
      setSectionsVisibility(GAMEPLAY_UI_SECTIONS, false);
    },
    showAll() {
      setSectionsVisibility(GAMEPLAY_UI_SECTIONS, true);
    },
    hideSections(sectionIds) {
      setSectionsVisibility(sectionIds, false);
    },
    showSections(sectionIds) {
      setSectionsVisibility(sectionIds, true);
    },
    isSectionVisible(sectionId) {
      assertValidSections([sectionId]);
      return sectionVisibility[sectionId];
    }
  };
}
