import { createInitialInventory } from "../../gameplayContent.js";
import { createStoryState } from "../../story/progression.js";
import { createResourceNodes } from "../../world/islandWorld.js";

const STARTING_WOOD_DROP_SIZE = 0.78;
const STARTING_WOOD_PICKUP_RADIUS = 0.64;
const STARTING_WOOD_DROP_POSITIONS = Object.freeze([
  [7.25, 0.02, -2.1],
  [9.15, 0.02, -4.6],
  [10.9, 0.02, -1.95],
  [12.35, 0.02, -4.9],
  [13.9, 0.02, -2.4],
  [15.75, 0.02, -4.0]
]);

function createStartingWoodDrops() {
  return STARTING_WOOD_DROP_POSITIONS.map((position, index) => ({
    id: `starting-wood-${index + 1}`,
    position: [...position],
    size: [STARTING_WOOD_DROP_SIZE, STARTING_WOOD_DROP_SIZE],
    uvRect: [0, 0, 1, 1],
    pickupRadius: STARTING_WOOD_PICKUP_RADIUS,
    collected: false
  }));
}

function resetRepairModule(instance) {
  if (instance) {
    instance.active = true;
  }
}

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
  session.woodDrops = createStartingWoodDrops();
  session.leppaBerryDrops = [];
  session.logChair = null;
  session.leafDen = null;
  session.leafDenFurniture = [];
  session.dittoFlag = null;
  session.campfire = null;
  resetRepairModule(session.actTwoSquirtle?.repairModuleInstance);
  if (session.bulbasaurEncounter) {
    session.bulbasaurEncounter.visible = false;
    session.bulbasaurEncounter.jumpTimer = 0;
    session.bulbasaurEncounter.originPosition = null;
    session.bulbasaurEncounter.landingPosition = null;
    session.bulbasaurEncounter.position = null;
    resetRepairModule(session.bulbasaurEncounter.repairModuleInstance);
  }
  if (session.charmanderEncounter) {
    session.charmanderEncounter.visible = false;
    session.charmanderEncounter.position = null;
    session.charmanderEncounter.targetPosition = null;
    session.charmanderEncounter.litCampfire = false;
    resetRepairModule(session.charmanderEncounter.repairModuleInstance);
  }
  if (session.timburrEncounter) {
    session.timburrEncounter.visible = false;
    session.timburrEncounter.position = null;
    resetRepairModule(session.timburrEncounter.repairModuleInstance);
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
