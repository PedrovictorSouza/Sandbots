import { createInitialInventory } from "../../gameplayContent.js";
import { createStoryState } from "../../story/progression.js";
import { createResourceNodes } from "../../world/islandWorld.js";
import { createSnowstormParticleField } from "./snowstormParticleField.js";

const STARTING_WOOD_DROP_SIZE = 0.78;
const STARTING_WOOD_PICKUP_RADIUS = 0.64;
const STARTING_WOOD_DROP_SAMPLE_STEP = 3;
const STARTING_WOOD_CLEARING_ZONES = Object.freeze([
  Object.freeze({ center: [12, -3.5], radius: 9 }),
  Object.freeze({ center: [1.42, 62.48], radius: 18 })
]);
const STARTING_WOOD_DROP_POSITIONS = Object.freeze([
  [7.25, 0.02, -2.1],
  [9.15, 0.02, -4.6],
  [10.9, 0.02, -1.95],
  [12.35, 0.02, -4.9],
  [13.9, 0.02, -2.4],
  [15.75, 0.02, -4.0],
  [-18.4, 0.02, -10.2],
  [-24.8, 0.02, 8.6],
  [-12.2, 0.02, 24.4],
  [4.6, 0.02, 31.2],
  [22.8, 0.02, 18.5],
  [38.6, 0.02, -4.3],
  [47.4, 0.02, 16.8],
  [58.2, 0.02, -18.5],
  [72.5, 0.02, 6.4],
  [86.3, 0.02, -28.8],
  [102.4, 0.02, -8.6],
  [118.2, 0.02, 20.2],
  [132.6, 0.02, -22.4],
  [-132.4, 0.02, 18.6],
  [-118.6, 0.02, -16.8],
  [-101.2, 0.02, 34.5],
  [-84.8, 0.02, -26.2],
  [-66.4, 0.02, 12.8],
  [-52.6, 0.02, -42.4],
  [-34.8, 0.02, 36.2],
  [-8.4, 0.02, 54.6],
  [28.8, 0.02, 50.2],
  [64.2, 0.02, 42.8],
  [104.5, 0.02, 52.4],
  [6.1, 0.02, -3.35],
  [8.4, 0.02, -1.25],
  [11.75, 0.02, -3.3],
  [13.4, 0.02, -6.15],
  [15.1, 0.02, -1.0],
  [17.3, 0.02, -5.2],
  [-20.6, 0.02, -7.7],
  [-22.1, 0.02, 10.9],
  [-14.7, 0.02, 22.1],
  [7.8, 0.02, 29.5],
  [25.4, 0.02, 20.9],
  [36.3, 0.02, -1.6],
  [49.8, 0.02, 14.1],
  [60.4, 0.02, -15.8],
  [70.1, 0.02, 9.7],
  [88.9, 0.02, -25.4],
  [100.0, 0.02, -11.8],
  [115.0, 0.02, 17.6],
  [135.2, 0.02, -19.6],
  [-129.6, 0.02, 21.3],
  [-121.4, 0.02, -13.9],
  [-104.0, 0.02, 31.8],
  [-82.1, 0.02, -29.7],
  [-69.2, 0.02, 15.9],
  [-55.0, 0.02, -39.2],
  [-31.7, 0.02, 33.6],
  [-5.5, 0.02, 57.2],
  [31.6, 0.02, 47.6],
  [61.5, 0.02, 45.1],
  [107.8, 0.02, 49.8]
]);

function isInsideStartingWoodClearing(position) {
  return STARTING_WOOD_CLEARING_ZONES.some((zone) => {
    const dx = Number(position?.[0] || 0) - zone.center[0];
    const dz = Number(position?.[2] || 0) - zone.center[1];
    return Math.hypot(dx, dz) < zone.radius;
  });
}

function createStartingWoodDrops() {
  return STARTING_WOOD_DROP_POSITIONS
    .filter((_, index) => index % STARTING_WOOD_DROP_SAMPLE_STEP === 0)
    .filter((position) => !isInsideStartingWoodClearing(position))
    .map((position, index) => ({
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
  session.playerHouses = [];
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
  session.snowstorm = createSnowstormParticleField();

  resetGameplayRuntimeState();

  Object.assign(storyState, createStoryState());
  Object.assign(inventory, createInitialInventory());

  syncInventoryUi(inventory);
  syncHudMeta(storyState, inventory);
  renderMissionCards(storyState, inventory);
}
