import { createGameHudController } from "./gameHudController.js";

export function createGameplayHudRuntime({
  statusElement,
  hudInstructionsElement,
  hudContextElement,
  hudChecklistElement,
  hudMetaElement,
  missionsStackElement,
  inventoryGridElement,
  skillsPanelElement,
  skillsGridElement,
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
  questSystem = null,
  initialStatus
}) {
  const gameHud = createGameHudController({
    statusElement,
    hudInstructionsElement,
    hudContextElement,
    hudChecklistElement,
    hudMetaElement,
    missionsStackElement,
    inventoryGridElement,
    skillsPanelElement,
    skillsGridElement,
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
    questSystem,
    initialStatus
  });

  return gameHud;
}
