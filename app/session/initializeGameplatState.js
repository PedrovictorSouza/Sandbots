import { createInitialInventory } from "../../gameplayContent.js";
import { createStoryState } from "../../story/progression.js";
import { createResourceNodes } from "../../world/islandWorld.js";

export function initializeGameplayState(
  session,
  {
    storyState,
    inventory,
    resetGameplayRuntimeState,
    syncInventoryUi,
    syncHudMeta,
    renderMissionCards
  }
) {
  session.woodDrops = [];
  session.leppaBerryDrops = [];
  session.logChair = null;
  session.leafDen = null;
  session.leafDenFurniture = [];
  session.dittoFlag = null;
  session.campfire = null;
  if (session.charmanderEncounter) {
    session.charmanderEncounter.visible = false;
    session.charmanderEncounter.position = null;
    session.charmanderEncounter.targetPosition = null;
    session.charmanderEncounter.litCampfire = false;
  }
  if (session.leppaTree) {
    session.leppaTree.revived = false;
    session.leppaTree.berryDropped = false;
    if (session.leppaTree.deadInstance) {
      session.leppaTree.deadInstance.active = false;
    }
    if (session.leppaTree.aliveInstance) {
      session.leppaTree.aliveInstance.active = false;
    }
  }
  session.resourceNodes = createResourceNodes();

  resetGameplayRuntimeState();

  Object.assign(storyState, createStoryState());
  Object.assign(inventory, createInitialInventory());

  syncInventoryUi(inventory);
  syncHudMeta(storyState, inventory);
  renderMissionCards(storyState, inventory);
}
