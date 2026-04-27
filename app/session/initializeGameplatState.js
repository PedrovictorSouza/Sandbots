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
  session.resourceNodes = createResourceNodes();

  resetGameplayRuntimeState();

  Object.assign(storyState, createStoryState());
  Object.assign(inventory, createInitialInventory());

  syncInventoryUi(inventory);
  syncHudMeta(storyState, inventory);
  renderMissionCards(storyState, inventory);
}
