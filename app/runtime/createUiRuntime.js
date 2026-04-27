import { createBagDetailsController } from "../ui/bagDetailsController.js";
import { createGameplayDialogueController } from "../ui/gameplayDialogueController.js";
import { createGameplayUiVisibilityController } from "../ui/gameplayUiVisibilityController.js";
import { createGroundCellHighlightController } from "../ui/groundCellHighlightController.js";
import { createHudSuspenseBoundary } from "../ui/hudSuspenseBoundary.js";
import { createOnboardingHintController } from "../ui/onboardingHintController.js";
import { createWorldSpeechController } from "../ui/worldSpeechController.js";
import { createBagUiRuntime } from "./bagUiRuntime.js";
import { createLazyModuleHandle } from "./lazyModuleHandle.js";
import { createPokedexRuntime } from "./pokedexRuntime.js";

export function createUiRuntime({
  dom,
  inventory,
  storyState,
  playerSkills,
  inventoryOrder,
  itemDefs,
  playerSkillDefs,
  playerSkillOrder,
  npcProfiles,
  placeholderRecipes,
  getActiveQuest,
  getQuestProgressDescriptor,
  buildQuestProgressCopy,
  formatRequirementSummary,
  formatDifficulty,
  getRegionForPosition,
  resourceHarvestPrompt,
  interactPrompt,
  isBagDetailItemId,
  clearGameFlowInput,
  isBuilderPanelOpen,
  setBuilderPanelOpen,
  onPokedexScriptedClose
}) {
  const {
    status,
    hudInstructions,
    hudContext,
    hudChecklist,
    hudMeta,
    missionsStack,
    questFocusTitle,
    questFocusBody,
    nearbyHabitatsValue,
    bagOnboardingTitle,
    bagOnboardingBody,
    bagDetailsIcon,
    bagDetailsName,
    bagDetailsCount,
    bagDetailsDescription,
    inventoryGrid,
    skillsPanel,
    skillsGrid,
    builderPanel,
    uiLayer,
    hudPanel,
    questFocusPanel,
    missionsPanel,
    inventoryPanel,
    pokedexAlertButton,
    pokedexOverlay,
    mount,
    renderFrame
  } = dom;
  const overlayMount = renderFrame || mount;

  function setStatusFallback(message, isError = false) {
    if (!status) {
      return;
    }

    status.textContent = message;
    status.dataset.error = isError ? "true" : "false";
  }

  const hudBoundary = createHudSuspenseBoundary({
    uiLayer,
    hudElement: hudPanel,
    questPanelElement: questFocusPanel,
    missionsPanelElement: missionsPanel,
    inventoryPanelElement: inventoryPanel,
    skillsPanelElement: skillsPanel,
    statusElement: status,
    hudInstructionsElement: hudInstructions,
    hudContextElement: hudContext,
    hudChecklistElement: hudChecklist,
    hudMetaElement: hudMeta,
    missionsStackElement: missionsStack,
    inventoryGridElement: inventoryGrid,
    questTitleElement: questFocusTitle,
    questBodyElement: questFocusBody,
    nearbyHabitatsValueElement: nearbyHabitatsValue
  });
  const hudModule = createLazyModuleHandle(async () => {
    const { createGameplayHudRuntime } = await import("../ui/gameplayHudRuntime.js");
    const hudRuntime = createGameplayHudRuntime({
      statusElement: status,
      hudInstructionsElement: hudInstructions,
      hudContextElement: hudContext,
      hudChecklistElement: hudChecklist,
      hudMetaElement: hudMeta,
      missionsStackElement: missionsStack,
      inventoryGridElement: inventoryGrid,
      skillsPanelElement: skillsPanel,
      skillsGridElement: skillsGrid,
      inventoryOrder,
      itemDefs,
      playerSkillDefs,
      playerSkillOrder,
      npcProfiles,
      placeholderRecipes,
      getActiveQuest,
      getQuestProgressDescriptor,
      buildQuestProgressCopy,
      formatRequirementSummary,
      formatDifficulty,
      getRegionForPosition,
      resourceHarvestPrompt,
      interactPrompt,
      initialStatus: status?.textContent || "Inicializando cena...",
      questTitleElement: questFocusTitle,
      questBodyElement: questFocusBody,
      nearbyHabitatsValueElement: nearbyHabitatsValue
    });

    hudBoundary.setLoading(false);
    return hudRuntime;
  }, {
    onError(error) {
      hudBoundary.setLoading(false);
      setStatusFallback(error?.message || "Falha ao carregar o HUD.", true);
    }
  });

  function invokeHud(methodName, args = [], { defaultValue, replayIfUnloaded = false } = {}) {
    if (!hudModule.isLoaded()) {
      hudBoundary.setLoading(true);
    }

    return hudModule.invoke(methodName, args, {
      defaultValue,
      replayIfUnloaded
    });
  }

  const hud = {
    preload() {
      if (!hudModule.isLoaded()) {
        hudBoundary.setLoading(true);
      }

      return hudModule.preload();
    },
    getNoticeMessage() {
      return invokeHud("getNoticeMessage", [], {
        defaultValue: ""
      });
    },
    pushNotice(message, duration) {
      return invokeHud("pushNotice", [message, duration], {
        replayIfUnloaded: true
      });
    },
    renderMissionCards(storyStateValue, inventoryState, nearbyPrompt = "") {
      return invokeHud("renderMissionCards", [storyStateValue, inventoryState, nearbyPrompt], {
        replayIfUnloaded: true
      });
    },
    renderStatus() {
      return invokeHud("renderStatus", [], {
        replayIfUnloaded: true
      });
    },
    setStatus(message, isError = false) {
      return invokeHud("setStatus", [message, isError], {
        replayIfUnloaded: true,
        defaultValue: () => setStatusFallback(message, isError)
      });
    },
    setTrackedRecipe(recipe) {
      return invokeHud("setTrackedRecipe", [recipe], {
        replayIfUnloaded: true
      });
    },
    syncHudInstructions(storyStateValue, promptCopy = "") {
      return invokeHud("syncHudInstructions", [storyStateValue, promptCopy], {
        replayIfUnloaded: true
      });
    },
    syncHudMeta(storyStateValue, inventoryState, playerPosition = [0, 0, 0]) {
      return invokeHud("syncHudMeta", [storyStateValue, inventoryState, playerPosition], {
        replayIfUnloaded: true
      });
    },
    syncInventoryUi(inventoryState) {
      return invokeHud("syncInventoryUi", [inventoryState], {
        replayIfUnloaded: true
      });
    },
    syncSkillsUi(skillsState) {
      return invokeHud("syncSkillsUi", [skillsState], {
        replayIfUnloaded: true
      });
    },
    updateTransientNotice(deltaTime) {
      return invokeHud("updateTransientNotice", [deltaTime], {
        replayIfUnloaded: true
      });
    },
    syncQuestFocus(storyStateValue) {
      return invokeHud("syncQuestFocus", [storyStateValue], {
        replayIfUnloaded: true
      });
    },
    setNearbyHabitats(habitatLabels = []) {
      return invokeHud("setNearbyHabitats", [habitatLabels], {
        replayIfUnloaded: true
      });
    }
  };

  void hud.preload();

  function createLazyUiModule(loadFactory) {
    return createLazyModuleHandle(loadFactory, {
      onError(error) {
        hud.setStatus(error?.message || "Falha ao carregar a interface.", true);
      }
    });
  }

  function setGuidePanelLoading(loading) {
    if (!(builderPanel instanceof HTMLElement)) {
      return;
    }

    builderPanel.dataset.loading = loading ? "true" : "false";
    builderPanel.setAttribute("aria-busy", loading ? "true" : "false");

    if (loading && !builderPanel.innerHTML.trim()) {
      builderPanel.innerHTML = '<div class="builder-panel__status">Loading handbook...</div>';
    }
  }

  const gameplayUiVisibility = createGameplayUiVisibilityController({
    uiLayer,
    initialVisibility: "hidden"
  });
  const bagOnboarding = createOnboardingHintController({
    titleElement: bagOnboardingTitle,
    bodyElement: bagOnboardingBody
  });
  const bagDetails = createBagDetailsController({
    iconElement: bagDetailsIcon,
    nameElement: bagDetailsName,
    countElement: bagDetailsCount,
    descriptionElement: bagDetailsDescription
  });
  const bagUiRuntime = createBagUiRuntime({
    bagOnboarding,
    bagDetails,
    gameplayUiVisibility,
    inventory,
    inventoryOrder,
    itemDefs,
    isBagDetailItemId
  });
  const gameplayDialogue = createGameplayDialogueController({
    uiLayer,
    clearGameFlowInput
  });
  const worldSpeech = createWorldSpeechController({
    mount: overlayMount
  });
  const groundCellHighlight = createGroundCellHighlightController({
    mount: overlayMount
  });
  const guidePanelModule = createLazyUiModule(async () => {
    const { createGuidePanel } = await import("../../guidePanel.js");
    const guidePanelInstance = createGuidePanel({
      root: builderPanel,
      onClose: () => setBuilderPanelOpen(false),
      onTrackRecipe: (recipe) => {
        hud.setTrackedRecipe(recipe);
        hud.renderMissionCards(storyState, inventory, hud.getNoticeMessage());
      }
    });

    setGuidePanelLoading(false);
    return guidePanelInstance;
  });
  const guidePanel = {
    preload() {
      setGuidePanelLoading(true);
      return guidePanelModule.preload().finally(() => {
        setGuidePanelLoading(false);
      });
    },
    isLoaded() {
      return guidePanelModule.isLoaded();
    },
    focusSearch() {
      setGuidePanelLoading(true);
      return guidePanelModule.invoke("focusSearch", [], {
        replayIfUnloaded: true
      });
    },
    clearTrack() {
      return guidePanelModule.invoke("clearTrack", [], {
        replayIfUnloaded: true
      });
    }
  };
  const pokedexRuntime = createPokedexRuntime({
    createLazyUiModule,
    root: pokedexOverlay,
    alertButton: pokedexAlertButton,
    clearGameFlowInput,
    isBuilderPanelOpen,
    closeBuilderPanel: () => setBuilderPanelOpen(false),
    loadPokedexOverlay: () => import("../../pokedexOverlay.js"),
    onScriptedClose: onPokedexScriptedClose
  });

  hud.syncInventoryUi(inventory);
  hud.syncSkillsUi(playerSkills);
  hud.syncQuestFocus(storyState);
  hud.setNearbyHabitats([]);
  hud.syncHudMeta(storyState, inventory);
  hud.syncHudInstructions(storyState);
  hud.renderMissionCards(storyState, inventory);
  hud.renderStatus();
  pokedexRuntime.syncUi();

  return {
    ...hud,
    bagUiRuntime,
    createLazyUiModule,
    gameplayDialogue,
    gameplayUiVisibility,
    groundCellHighlight,
    guidePanel,
    inspectBag: bagUiRuntime.inspect,
    pokedexEntry: pokedexRuntime.entry,
    pokedexRuntime,
    pokedexUiState: pokedexRuntime.state,
    setStatusFallback,
    worldSpeech
  };
}
