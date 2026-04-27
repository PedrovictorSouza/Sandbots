export function createHabitatHudController({
  questTitleElement,
  questBodyElement,
  nearbyHabitatsValueElement,
  getActiveQuest
}) {
  const uiCache = {
    questTitle: "",
    questBody: "",
    nearbyHabitats: ""
  };

  function syncQuestFocus(storyState) {
    if (!questTitleElement || !questBodyElement) {
      return;
    }

    const activeQuest = getActiveQuest(storyState);
    const nextTitle = activeQuest?.title || "";
    const nextBody = activeQuest?.body || "";

    if (uiCache.questTitle !== nextTitle) {
      uiCache.questTitle = nextTitle;
      questTitleElement.textContent = nextTitle;
    }

    if (uiCache.questBody !== nextBody) {
      uiCache.questBody = nextBody;
      questBodyElement.textContent = nextBody;
    }
  }

  function setNearbyHabitats(habitatLabels = []) {
    if (!nearbyHabitatsValueElement) {
      return;
    }

    const nextValue = habitatLabels.filter(Boolean).join(" • ");
    if (uiCache.nearbyHabitats === nextValue) {
      return;
    }

    uiCache.nearbyHabitats = nextValue;
    nearbyHabitatsValueElement.textContent = nextValue;
  }

  return {
    setNearbyHabitats,
    syncQuestFocus
  };
}
