import {
  BOULDER_SHADED_TALL_GRASS_BOULDER_POSITION,
  BOULDER_SHADED_TALL_GRASS_RADIUS,
  CAMPFIRE_ITEM_ID,
  DITTO_FLAG_ITEM_ID,
  LEAF_DEN_KIT_ITEM_ID,
  LOG_CHAIR_ITEM_ID,
  STRAW_BED_ITEM_ID,
  STORY_QUESTS,
  WORLD_LIMIT
} from "../gameplayContent.js";
import { QUEST_EVENT } from "../app/quest/questData.js";
import { HABITAT_EVENT } from "../app/sandbox/habitatData.js";
import {
  FIRST_TAUGHT_ACTION_IDS,
  recordFirstTaughtActionFreedomUse,
  startFirstTaughtActionFreedomWindow
} from "../app/story/earlyFreedomWindow.js";
import { reactivateHelperRobot } from "../app/story/robotReactivation.js";
import {
  collectLeppaBerryDrops,
  dropLeppaBerryFromTree,
  getLeppaTreeSurroundingGroundCells,
  findNearbyDestroyableInstantiatedObject,
  findNearbyLeafDen,
  reviveLeppaTreeFromWateredTiles
} from "./islandWorld.js";
import { createWorkbenchRecipeMap } from "../app/gameplay/buildableCatalog.js";
import {
  COLONY_FEEDBACK_IDS,
  getColonyFeedbackNotice
} from "../app/gameplay/colonyFeedbackContracts.js";
import {
  ACTION_FEEDBACK_ACTION,
  ACTION_FEEDBACK_RESULT,
  getActionFeedbackResponse
} from "../app/gameplay/actionFeedbackContracts.js";
import { createColonyCacheState } from "../app/gameplay/colonyCacheContract.js";
import { getRequiredMaterialChargeFieldAbilityCost } from "../app/gameplay/content/fieldAbilityCosts.ts";
import {
  getHouseKitPlacementReadiness,
  getHouseKitProgressState,
  getSolarStationProgressState,
  getTrainHouseProgressState,
  HOUSE_KIT_PROGRESS_STATE,
  SOLAR_STATION_PROGRESS_STATE,
  TRAIN_HOUSE_PROGRESS_STATE
} from "../app/story/progressionContracts.js";
import {
  SANDBOTS_BOT_NAMES,
  SANDBOTS_ITEM_NAMES
} from "../app/story/sandbotsLexicon.js";
import { getResourcePurposeByItemId } from "../app/story/resourcePurposeCatalog.js";
import {
  COLONY_PROGRESS_EVENT,
  emitColonyProgressQuestEvents
} from "../app/story/progressionTriggerContract.js";
import { MOTION_IMPACT_PRESET_IDS } from "../app/motion/motionImpactPresets.js";

const BULBASAUR_RUSTLING_GRASS_RESTORE_COUNT = 4;
const BULBASAUR_DRY_GRASS_MISSION_RESTORE_COUNT = 10;
const BULBASAUR_RUSTLING_GRASS_DELAY = 5.5;
const LEAFAGE_TALL_GRASS_HABITAT_COUNT = 4;
const LEAFAGE_TALL_GRASS_GROUP_ID = "leafage-tall-grass-habitat-0";
const LEAFAGE_FLOWER_GROUP_ID = "leafage-flower-bed-habitat-0";
const LEAFAGE_OBJECT_ID_TALL_GRASS = "tallGrass";
const LEAFAGE_OBJECT_ID_GARDEN_1 = "garden1";
const LEAFAGE_OBJECT_ID_FLOWER = "flower";
const BOULDER_SHADED_TALL_GRASS_GROUP_ID = "boulder-shaded-tall-grass-habitat-0";
const LEAFAGE_GROUND_CELL_INTERACT_RADIUS_FACTOR = 0.82;
const LEPPA_TREE_WATER_HINT_DISTANCE = 2.85;
const CHARMANDER_FIRE_COST = getRequiredMaterialChargeFieldAbilityCost("fire");
export const CHARMANDER_FIRE_USES_PER_CARBON = CHARMANDER_FIRE_COST.usesPerUnit;
export const CHARMANDER_FIRE_CARBON_USES_FLAG = CHARMANDER_FIRE_COST.useFlag;
export const MAX_ACTIVE_POKEMON_FOLLOWERS = 5;
const SOLAR_STATION_PLACEMENT_WORLD_MARGIN = 2.2;
const POKEMON_FOLLOW_FLAGS = Object.freeze({
  squirtle: "squirtleFollowing",
  bulbasaur: "bulbasaurFollowing",
  charmander: "charmanderFollowing",
  timburr: "timburrFollowing"
});
const POKEMON_FOLLOW_NAMES = Object.freeze({
  squirtle: SANDBOTS_BOT_NAMES.hydro,
  bulbasaur: SANDBOTS_BOT_NAMES.grow,
  charmander: SANDBOTS_BOT_NAMES.thermal,
  timburr: SANDBOTS_BOT_NAMES.builder
});
const BEE_FIELD_FLOWER_GROUP_ID = "water-gun-flower-field-0";

function formatColonyCacheInteractionNotice(inventory = {}) {
  const cacheState = createColonyCacheState({ inventory });

  if (cacheState.totalItems <= 0) {
    return "Colony Cache empty. Gather local supplies to protect colony progress.";
  }

  const topItem = cacheState.storedItems.find((item) => item.purposeText) ||
    cacheState.storedItems[0];
  const supplyLabel = cacheState.totalItems === 1 ? "supply" : "supplies";
  const purposeText = topItem?.purposeText ? ` ${topItem.label}: ${topItem.purposeText}` : "";

  return `Colony Cache: ${cacheState.totalItems} protected ${supplyLabel}.${purposeText}`;
}

export function countActivePokemonFollowers(flags = {}, followFlags = POKEMON_FOLLOW_FLAGS) {
  return Object.values(followFlags)
    .filter((followFlag) => Boolean(flags?.[followFlag]))
    .length;
}

export function canAddPokemonFollower(storyState, pokemonId, {
  followFlags = POKEMON_FOLLOW_FLAGS,
  maxFollowers = MAX_ACTIVE_POKEMON_FOLLOWERS
} = {}) {
  const followFlag = followFlags[pokemonId];
  if (!followFlag) {
    return false;
  }

  const flags = storyState?.flags || {};
  return Boolean(flags[followFlag]) || countActivePokemonFollowers(flags, followFlags) < maxFollowers;
}

function markPokemonFollowing(storyState, pokemonId, {
  followFlags = POKEMON_FOLLOW_FLAGS,
  maxFollowers = MAX_ACTIVE_POKEMON_FOLLOWERS
} = {}) {
  const followFlag = followFlags[pokemonId];

  if (!followFlag) {
    return false;
  }

  storyState.flags ||= {};
  if (!canAddPokemonFollower(storyState, pokemonId, { followFlags, maxFollowers })) {
    return false;
  }

  const alreadyFollowing = Boolean(storyState.flags[followFlag]);
  reactivateHelperRobot(storyState, pokemonId, {
    source: "field-repair"
  });
  storyState.flags[followFlag] = true;
  return !alreadyFollowing;
}

function getCharmanderFireCarbonUses(storyState) {
  return Math.max(
    0,
    Math.floor(Number(storyState?.flags?.[CHARMANDER_FIRE_CARBON_USES_FLAG] || 0))
  );
}

export function canUseCharmanderFireWithCarbon({ storyState, inventory } = {}) {
  return Number(inventory?.[CHARMANDER_FIRE_COST.materialId] || 0) > 0;
}

function recordCharmanderFireCarbonUse({ storyState, inventory, syncInventoryUi }) {
  storyState.flags ||= {};
  const currentCarbon = Number(inventory?.[CHARMANDER_FIRE_COST.materialId] || 0);
  if (currentCarbon <= 0) {
    return false;
  }

  const nextUses = getCharmanderFireCarbonUses(storyState) + 1;
  if (nextUses >= CHARMANDER_FIRE_USES_PER_CARBON) {
    inventory[CHARMANDER_FIRE_COST.materialId] = Math.max(0, currentCarbon - 1);
    storyState.flags[CHARMANDER_FIRE_CARBON_USES_FLAG] = 0;
    syncInventoryUi(inventory);
  } else {
    storyState.flags[CHARMANDER_FIRE_CARBON_USES_FLAG] = nextUses;
  }

  return true;
}

export function createGameplayInteractions({
  npcProfiles,
  placeholderRecipes = {},
  workbenchRecipes = createWorkbenchRecipeMap({ placeholderRecipes }),
  startDialogue = null,
  unlockPlayerAbility = () => {},
  unlockPokedexReward = () => {},
  onFirstGrassRestored = () => {},
  onFlowersRecovered = () => {},
  onBulbasaurRevealed = () => {},
  onBulbasaurDryGrassMissionAccepted = () => {},
  onBulbasaurDryGrassRequestCompleted = () => {},
  onBulbasaurStrawBedRecipeRequested = () => {},
  onCharmanderRevealed = () => {},
  onTimburrRevealed = () => {},
  onLeppaBerryGiftRequested = () => {},
  onLeppaTreeLeafageOptionsRequested = () => {},
  onChopperLogChairGiftRequested = () => {},
  onTangrowthHouseTalkRequested = () => {},
  onLeafDenKitPlacementRequested = () => {},
  onLeafDenConstructionRequested = () => {},
  onLeafDenEnterRequested = () => {},
  onLeafDenFurniturePlacementRequested = () => {},
  onTimburrLeafDenFurnitureCompleteRequested = () => {},
  onCharmanderCelebrationSuggested = () => {},
  onCharmanderCelebrationTangrowthRequested = () => {},
  onDittoFlagPlacementRequested = () => {},
  onLogChairPlacementRequested = () => {},
  onLogChairSitRequested = () => {},
  onWorkbenchRecipesRequested = () => {},
  onWorkbenchCraftOptionsRequested = () => {},
  onWorkbenchCraftMotionRequested = () => {},
  onWaterGunImpactMotionRequested = () => {},
  onCampfireCraftRequested = () => {},
  onCampfireCrafted = () => {},
  onCampfireSpitOutRequested = () => {},
  onStrawBedCrafted = () => {},
  onStrawBedPlacementRequested = () => {},
  onBulbasaurStrawBedRequestCompleted = () => {},
  onRuinedPokemonCenterInspectRequested = () => {},
  onPokemonCenterPcCheckRequested = () => {},
  onGroundItemCollected = () => {},
  onNaturePatchRevived = () => {},
  onLeppaTreeRevived = () => {},
  onLeppaTreeWaterHintRequested = () => {},
  onTallGrassHabitatRestored = () => {},
  onFlowerHabitatRestored = () => {},
  getActiveQuest,
  hasItems,
  consumeItems,
  addItems,
  formatRequirementSummary,
  getItemLabel,
  findNearbyInteractable,
  findNearbyHarvestTarget,
  findNearbyGroundCell,
  purifyGroundCell,
  reviveGroundFlower = () => {},
  reviveGroundGrass = () => {},
  waterNearbyPalm = () => ({
    hit: false,
    counted: false,
    challengeComplete: false,
    palm: null
  }),
  syncInventoryUi,
  pushNotice,
  questSystem = null,
  habitatSystem = null,
  pokemonFollowFlags = POKEMON_FOLLOW_FLAGS,
  maxPokemonFollowers = MAX_ACTIVE_POKEMON_FOLLOWERS
}) {
  let missedInteractAttempts = 0;
  let missedHarvestAttempts = 0;

  function pushMissedInteractNotice() {
    missedInteractAttempts += 1;
    const noTargetResponse = getActionFeedbackResponse(
      ACTION_FEEDBACK_ACTION.INTERACT,
      ACTION_FEEDBACK_RESULT.NO_TARGET
    );

    pushNotice(
      missedInteractAttempts >= 2 ?
        noTargetResponse?.repeatMessage || "Still nothing nearby. Look for an interaction marker or move closer, then press A / E / X." :
        noTargetResponse?.message || "Nothing to talk to nearby. Move closer to a marker or bot, then press E / X."
    );
  }

  function canPlaceCraftedCampfire(storyState, inventory) {
    return Boolean(
      storyState?.flags?.campfireCrafted &&
      !storyState.flags.campfireSpatOut &&
      Number(inventory?.[CAMPFIRE_ITEM_ID] || 0) > 0 &&
      hasItems(inventory, { [CAMPFIRE_ITEM_ID]: 1 })
    );
  }

  function pushMissedHarvestNotice({
    canPurifyGround = false,
    canUseLeafage = false,
    canUseFire = false
  } = {}) {
    missedHarvestAttempts += 1;

    if (missedHarvestAttempts >= 2) {
      pushNotice(getActionFeedbackResponse(
        ACTION_FEEDBACK_ACTION.USE_FIELD_TOOL,
        ACTION_FEEDBACK_RESULT.NO_TARGET
      )?.message || "Still no target. Move until a tile outline or interaction marker appears, then press X / Enter.");
      return;
    }

    pushNotice(
      canPurifyGround ?
        "No target in range. Move closer to dry ground, grass, a tree, or a marker, then press Enter." :
        canUseLeafage ?
          `No target in range. Move closer to clear ground, then press Enter to use ${SANDBOTS_ITEM_NAMES.growTool}.` :
        canUseFire ?
          `No white ground in range. Move closer to a white tile, then press Enter to use ${SANDBOTS_ITEM_NAMES.thermalTool}.` :
        "No resource in range. Move closer to a tree or drop, then press Enter."
    );
  }

  function isLeppaTreeWaterHintAvailable(playerPosition, leppaTree, storyState) {
    if (
      !Array.isArray(playerPosition) ||
      !Array.isArray(leppaTree?.position) ||
      !storyState?.flags?.squirtleLeppaRequestAvailable ||
      storyState.flags.leppaTreeRevived ||
      storyState.flags.leppaBerryGiftComplete
    ) {
      return false;
    }

    const distance = Math.hypot(
      playerPosition[0] - leppaTree.position[0],
      playerPosition[2] - leppaTree.position[2]
    );

    return distance <= LEPPA_TREE_WATER_HINT_DISTANCE;
  }

  function getRestoredPatchHabitat(revivedPatch, patches) {
    const habitatGroupId = revivedPatch?.habitatGroupId;

    if (!habitatGroupId) {
      return null;
    }

    const habitatPatches = patches.filter((patch) => {
      return patch.habitatGroupId === habitatGroupId;
    });

    if (habitatPatches.length < 4) {
      return null;
    }

    if (!habitatPatches.every((patch) => patch.state === "alive")) {
      return null;
    }

    return {
      id: habitatGroupId,
      patches: habitatPatches
    };
  }

  function getRestoredGrassHabitat(revivedGrass, groundGrassPatches) {
    return getRestoredPatchHabitat(revivedGrass, groundGrassPatches);
  }

  function hasGrassPatchForGroundCell(groundCell, groundGrassPatches = []) {
    if (!groundCell?.id) {
      return false;
    }

    return groundGrassPatches.some((patch) => patch?.cellId === groundCell.id);
  }

  function canWaterGunRestoreEmptyGround() {
    return true;
  }

  function isLeppaTreeWateringGroundCell(groundCell, leppaTree, storyState = {}) {
    if (
      !groundCell ||
      !leppaTree?.position ||
      !storyState.flags?.squirtleLeppaRequestAvailable ||
      storyState.flags.leppaTreeRevived ||
      storyState.flags.leppaBerryGiftComplete
    ) {
      return false;
    }

    return getLeppaTreeSurroundingGroundCells(leppaTree, [groundCell]).length > 0;
  }

  function canWaterGunTargetGroundCell(groundCell, groundGrassPatches, storyState, leppaTree = null) {
    return hasGrassPatchForGroundCell(groundCell, groundGrassPatches) ||
      canWaterGunRestoreEmptyGround(storyState) ||
      isLeppaTreeWateringGroundCell(groundCell, leppaTree, storyState);
  }

  function findNearbyWaterGunPatchGroundCell({
    playerPosition,
    groundDeadInstances = [],
    groundPurifiedInstances = [],
    groundGrassPatches = [],
    storyState,
    leppaTree = null
  }) {
    if (!Array.isArray(playerPosition)) {
      return null;
    }

    const groundCellById = new Map(
      [
        ...(groundDeadInstances || []),
        ...(groundPurifiedInstances || [])
      ]
        .filter((groundCell) => typeof groundCell?.id === "string")
        .map((groundCell) => [groundCell.id, groundCell])
    );
    let nearest = null;
    let nearestDistance = Infinity;

    for (const patch of groundGrassPatches || []) {
      const groundCell = groundCellById.get(patch?.cellId);
      if (
        !groundCell ||
        groundCell.active === false ||
        groundCell.purifiable === false ||
        !canWaterGunTargetGroundCell(groundCell, groundGrassPatches, storyState, leppaTree)
      ) {
        continue;
      }

      const targetPosition = Array.isArray(patch?.position) ? patch.position : groundCell.offset;
      if (!Array.isArray(targetPosition)) {
        continue;
      }

      const dx = playerPosition[0] - targetPosition[0];
      const dz = playerPosition[2] - targetPosition[2];
      const distance = Math.hypot(dx, dz);
      const tileReach = (groundCell.tileSpan || 0) * LEAFAGE_GROUND_CELL_INTERACT_RADIUS_FACTOR;
      const patchReach = Math.max(Number(patch?.size?.[0]) || 0, Number(patch?.size?.[1]) || 0) * 0.28;
      const interactDistance = tileReach + patchReach;

      if (distance <= interactDistance && distance < nearestDistance) {
        nearest = {
          groundCell,
          distance
        };
        nearestDistance = distance;
      }
    }

    return nearest;
  }

  function findNearbyWaterGunGroundCell({
    playerPosition,
    groundDeadInstances = [],
    groundPurifiedInstances = [],
    groundGrassPatches = [],
    storyState,
    leppaTree = null
  }) {
    const nearbyGroundCell = findNearbyGroundCell(playerPosition, groundDeadInstances);

    if (
      nearbyGroundCell?.groundCell &&
      canWaterGunTargetGroundCell(
        nearbyGroundCell.groundCell,
        groundGrassPatches,
        storyState,
        leppaTree
      )
    ) {
      return nearbyGroundCell;
    }

    return findNearbyWaterGunPatchGroundCell({
      playerPosition,
      groundDeadInstances,
      groundPurifiedInstances,
      groundGrassPatches,
      storyState,
      leppaTree
    });
  }

  function findNearbyFireGroundCell(playerPosition, iceGroundInstances = []) {
    if (!Array.isArray(playerPosition) || !Array.isArray(iceGroundInstances)) {
      return null;
    }

    let nearestGroundCell = null;
    let nearestDistance = Infinity;

    for (const groundCell of iceGroundInstances) {
      if (
        !groundCell ||
        groundCell.active === false ||
        !Array.isArray(groundCell.offset)
      ) {
        continue;
      }

      const dx = playerPosition[0] - groundCell.offset[0];
      const dz = playerPosition[2] - groundCell.offset[2];
      const distance = Math.hypot(dx, dz);
      const interactDistance =
        (groundCell.tileSpan || 0) * LEAFAGE_GROUND_CELL_INTERACT_RADIUS_FACTOR;

      if (distance <= interactDistance && distance < nearestDistance) {
        nearestGroundCell = groundCell;
        nearestDistance = distance;
      }
    }

    return nearestGroundCell ? {
      groundCell: nearestGroundCell,
      distance: nearestDistance
    } : null;
  }

  function burnFireGroundCell(groundCell, iceGroundInstances = [], groundDeadInstances = []) {
    if (!groundCell || !Array.isArray(iceGroundInstances) || !Array.isArray(groundDeadInstances)) {
      return false;
    }

    const iceIndex = iceGroundInstances.indexOf(groundCell);
    if (iceIndex === -1) {
      return false;
    }

    const [burnedGroundCell] = iceGroundInstances.splice(iceIndex, 1);
    burnedGroundCell.groundKind = "dead";
    burnedGroundCell.purifiable = true;
    burnedGroundCell.wasColdGroundBurned = true;

    if (!groundDeadInstances.includes(burnedGroundCell)) {
      groundDeadInstances.push(burnedGroundCell);
    }

    return true;
  }

  function completeBulbasaurDryGrassMission(storyState) {
    const flags = storyState.flags || {};
    if (flags.bulbasaurDryGrassMissionComplete) {
      return false;
    }

    flags.bulbasaurDryGrassMissionComplete = true;
    startFirstTaughtActionFreedomWindow(storyState, {
      actionId: FIRST_TAUGHT_ACTION_IDS.WATER_DRY_GRASS
    });
    return true;
  }

  function getFirstRestoredGrassHabitat(groundGrassPatches) {
    const groups = new Map();

    for (const patch of groundGrassPatches) {
      if (!patch?.habitatGroupId) {
        continue;
      }

      const groupPatches = groups.get(patch.habitatGroupId) || [];
      groupPatches.push(patch);
      groups.set(patch.habitatGroupId, groupPatches);
    }

    for (const [id, patches] of groups.entries()) {
      if (patches.length >= 4 && patches.every((patch) => patch.state === "alive")) {
        return {
          id,
          patches
        };
      }
    }

    return null;
  }

  function getBulbasaurHabitatPlacementTarget(playerPosition) {
    const center = [
      Number(playerPosition?.[0]) || 0,
      0.02,
      Number(playerPosition?.[2]) || 0
    ];
    const bounds = {
      minX: -WORLD_LIMIT + SOLAR_STATION_PLACEMENT_WORLD_MARGIN,
      maxX: WORLD_LIMIT - SOLAR_STATION_PLACEMENT_WORLD_MARGIN,
      minZ: -WORLD_LIMIT + SOLAR_STATION_PLACEMENT_WORLD_MARGIN,
      maxZ: WORLD_LIMIT - SOLAR_STATION_PLACEMENT_WORLD_MARGIN
    };

    return {
      canPlace: true,
      center,
      bounds,
      gridStep: 1,
      habitatGroupId: null,
      showField: false,
      reason: ""
    };
  }

  function getRestoredFlowerBedHabitat(revivedFlower, groundFlowerPatches) {
    return getRestoredPatchHabitat(revivedFlower, groundFlowerPatches);
  }

  function recordRestoredPatchHabitat(storyState, habitat, restoredIdsFlag) {
    if (!habitat?.id) {
      return false;
    }

    storyState.flags[restoredIdsFlag] ||= [];

    if (storyState.flags[restoredIdsFlag].includes(habitat.id)) {
      return false;
    }

    storyState.flags[restoredIdsFlag].push(habitat.id);
    return true;
  }

  function recordRestoredGrassHabitat(storyState, habitat) {
    return recordRestoredPatchHabitat(storyState, habitat, "restoredTallGrassHabitatIds");
  }

  function recordRestoredFlowerBedHabitat(storyState, habitat) {
    return recordRestoredPatchHabitat(storyState, habitat, "restoredFlowerBedHabitatIds");
  }

  function scheduleRustlingGrassEncounter(storyState, groundGrassPatches) {
    if (
      storyState.flags.bulbasaurRevealed ||
      storyState.flags.rustlingGrassCellId ||
      storyState.flags.pendingRustlingGrassCellId ||
      (storyState.flags.restoredGrassCount || 0) < BULBASAUR_RUSTLING_GRASS_RESTORE_COUNT
    ) {
      return false;
    }

    const restoredGrassHabitat = getFirstRestoredGrassHabitat(groundGrassPatches);
    const rustlingPatch = restoredGrassHabitat?.patches?.[0];

    if (!rustlingPatch?.cellId) {
      return false;
    }

    storyState.flags.pendingRustlingGrassCellId = rustlingPatch.cellId;
    storyState.flags.rustlingGrassDelay = BULBASAUR_RUSTLING_GRASS_DELAY;
    return true;
  }

  function hasPatchForGroundCell(cellId, patches = []) {
    return patches.some((patch) => patch.cellId === cellId);
  }

  function buildOccupiedGroundCellIds(...patchGroups) {
    const occupiedCellIds = new Set();

    for (const patches of patchGroups) {
      for (const patch of patches || []) {
        if (patch?.cellId) {
          occupiedCellIds.add(patch.cellId);
        }
      }
    }

    return occupiedCellIds;
  }

  function findNearestAvailableGroundCell(playerPosition, groundCellLists, occupiedCellIds) {
    if (!Array.isArray(playerPosition)) {
      return null;
    }

    const seenCellIds = new Set();
    let nearestGroundCell = null;
    let nearestDistanceSquared = Infinity;

    for (const groundCells of groundCellLists) {
      for (const groundCell of groundCells || []) {
        if (!groundCell?.id || !Array.isArray(groundCell.offset)) {
          continue;
        }

        if (seenCellIds.has(groundCell.id) || occupiedCellIds.has(groundCell.id)) {
          continue;
        }

        seenCellIds.add(groundCell.id);

        if (groundCell.active === false || groundCell.purifiable === false) {
          continue;
        }

        const interactDistance =
          (groundCell.tileSpan || 0) * LEAFAGE_GROUND_CELL_INTERACT_RADIUS_FACTOR;
        if (!(interactDistance > 0)) {
          continue;
        }

        const dx = playerPosition[0] - groundCell.offset[0];
        const dz = playerPosition[2] - groundCell.offset[2];
        const distanceSquared = dx * dx + dz * dz;
        const interactDistanceSquared = interactDistance * interactDistance;

        if (
          distanceSquared <= interactDistanceSquared &&
          distanceSquared < nearestDistanceSquared
        ) {
          nearestGroundCell = groundCell;
          nearestDistanceSquared = distanceSquared;
        }
      }
    }

    return nearestGroundCell ? {
      groundCell: nearestGroundCell,
      distance: Math.sqrt(nearestDistanceSquared)
    } : null;
  }

  function getDistanceToBoulderShade(groundCell) {
    if (!groundCell?.offset) {
      return Infinity;
    }

    return Math.hypot(
      groundCell.offset[0] - BOULDER_SHADED_TALL_GRASS_BOULDER_POSITION[0],
      groundCell.offset[2] - BOULDER_SHADED_TALL_GRASS_BOULDER_POSITION[2]
    );
  }

  function isBoulderShadedLeafageCell(groundCell, storyState) {
    return Boolean(
      storyState?.flags?.boulderChallengeAvailable &&
      !storyState.flags.boulderShadedTallGrassHabitatCreated &&
      getDistanceToBoulderShade(groundCell) <= BOULDER_SHADED_TALL_GRASS_RADIUS
    );
  }

  function getLeafageGrassGroupId(groundCell, storyState) {
    return isBoulderShadedLeafageCell(groundCell, storyState) ?
      BOULDER_SHADED_TALL_GRASS_GROUP_ID :
      LEAFAGE_TALL_GRASS_GROUP_ID;
  }

  function findNearbyLeafageGroundCell({
    playerPosition,
    groundDeadInstances = [],
    groundPurifiedInstances = [],
    groundGrassPatches = [],
    groundFlowerPatches = []
  } = {}) {
    return findNearestAvailableGroundCell(
      playerPosition,
      [groundPurifiedInstances],
      buildOccupiedGroundCellIds(groundGrassPatches, groundFlowerPatches)
    );
  }

  function growLeafagePatch(groundCell, groundGrassPatches, groundFlowerPatches, storyState) {
    if (
      !groundCell ||
      hasPatchForGroundCell(groundCell.id, groundGrassPatches) ||
      hasPatchForGroundCell(groundCell.id, groundFlowerPatches)
    ) {
      return null;
    }

    storyState.flags ||= {};
    const selectedLeafageObjectId = storyState?.flags?.leafageObjectId;

    if (selectedLeafageObjectId === LEAFAGE_OBJECT_ID_FLOWER) {
      const patch = {
        id: `leafage-flower-${groundCell.id}`,
        cellId: groundCell.id,
        habitatGroupId: LEAFAGE_FLOWER_GROUP_ID,
        source: "leafage",
        position: [
          groundCell.offset[0],
          (groundCell.surfaceY || 0) + 0.04,
          groundCell.offset[2]
        ],
        size: [1.12, 1.12],
        state: "alive"
      };

      groundFlowerPatches.push(patch);
      storyState.flags.leafageFlowerCount =
        (storyState.flags.leafageFlowerCount || 0) + 1;
      return {
        patch,
        type: "flower"
      };
    }

    const habitatGroupId = getLeafageGrassGroupId(groundCell, storyState);
    const leafageObjectId =
      selectedLeafageObjectId === LEAFAGE_OBJECT_ID_GARDEN_1 ?
        LEAFAGE_OBJECT_ID_GARDEN_1 :
        LEAFAGE_OBJECT_ID_TALL_GRASS;
    const patch = {
      id: `leafage-grass-${groundCell.id}`,
      cellId: groundCell.id,
      habitatGroupId,
      leafageObjectId,
      source: "leafage",
      position: [
        groundCell.offset[0],
        (groundCell.surfaceY || 0) + 0.02,
        groundCell.offset[2]
      ],
      size: leafageObjectId === LEAFAGE_OBJECT_ID_GARDEN_1 ? [1.42, 1.18] : [1.18, 0.96],
      state: "alive"
    };

    groundGrassPatches.push(patch);
    if (habitatGroupId === BOULDER_SHADED_TALL_GRASS_GROUP_ID) {
      storyState.flags.boulderShadedTallGrassCount =
        (storyState.flags.boulderShadedTallGrassCount || 0) + 1;
    } else {
      storyState.flags.leafageTallGrassCount =
        (storyState.flags.leafageTallGrassCount || 0) + 1;
    }
    return {
      patch,
      type: "grass"
    };
  }

  function isDestroyableInstantiatedPatch(patch) {
    return Boolean(patch);
  }

  function isFlowerInstantiatedPatch(patch) {
    return (
      patch?.id?.startsWith?.("flower-") ||
      patch?.id?.startsWith?.("leafage-flower-") ||
      String(patch?.habitatGroupId || "").includes("flower")
    );
  }

  function findDestroyableInstantiatedPatchIndex(target, patches = [], { matchCellId = true } = {}) {
    const isDestroyablePatch = (patch) => {
      return isDestroyableInstantiatedPatch(patch);
    };

    const exactIdIndex = patches.findIndex((patch) => {
      return isDestroyablePatch(patch) && patch.id === target.id;
    });

    if (exactIdIndex >= 0) {
      return exactIdIndex;
    }

    return patches.findIndex((patch) => {
      return matchCellId && isDestroyablePatch(patch) && target.cellId && patch.cellId === target.cellId;
    });
  }

  function destroyInstantiatedObjectPatch(target, groundGrassPatches, groundFlowerPatches, storyState) {
    const collections = [groundGrassPatches, groundFlowerPatches];
    let patchCollection = null;
    let patchIndex = -1;

    for (const collection of collections) {
      const exactIndex = findDestroyableInstantiatedPatchIndex(target, collection, {
        matchCellId: false
      });
      if (exactIndex >= 0) {
        patchCollection = collection;
        patchIndex = exactIndex;
        break;
      }
    }

    if (patchIndex < 0) {
      for (const collection of collections) {
        const cellIndex = findDestroyableInstantiatedPatchIndex(target, collection);
        if (cellIndex >= 0) {
          patchCollection = collection;
          patchIndex = cellIndex;
          break;
        }
      }
    }

    if (patchIndex < 0) {
      pushNotice("Nothing to destroy here.");
      return false;
    }

    const [patch] = patchCollection.splice(patchIndex, 1);
    const countFlag = patch.source === "leafage" ?
      (
        patch.habitatGroupId === BOULDER_SHADED_TALL_GRASS_GROUP_ID ?
          "boulderShadedTallGrassCount" :
          patch.habitatGroupId === LEAFAGE_FLOWER_GROUP_ID ?
            "leafageFlowerCount" :
            "leafageTallGrassCount"
      ) :
      null;

    if (countFlag && storyState?.flags && Number(storyState.flags[countFlag] || 0) > 0) {
      storyState.flags[countFlag] = Math.max(0, Number(storyState.flags[countFlag] || 0) - 1);
    }

    pushNotice(
      patch.state !== "alive" ?
        "Dry Grass cut." :
        isFlowerInstantiatedPatch(patch) ?
        "Flower destroyed." :
        patch.leafageObjectId === LEAFAGE_OBJECT_ID_GARDEN_1 ?
        "Garden-1 destroyed." :
        "Tall Grass destroyed."
    );
    return true;
  }

  function getBoulderShadedTallGrassHabitat(groundGrassPatches) {
    const patches = groundGrassPatches.filter((patch) => {
      return (
        patch.habitatGroupId === BOULDER_SHADED_TALL_GRASS_GROUP_ID &&
        patch.state === "alive"
      );
    });

    if (patches.length < LEAFAGE_TALL_GRASS_HABITAT_COUNT) {
      return null;
    }

    return {
      id: BOULDER_SHADED_TALL_GRASS_GROUP_ID,
      patches: patches.slice(0, LEAFAGE_TALL_GRASS_HABITAT_COUNT)
    };
  }

  function recordBoulderShadedTallGrassHabitat(storyState, groundGrassPatches) {
    if (storyState.flags.boulderShadedTallGrassHabitatCreated) {
      return null;
    }

    const habitat = getBoulderShadedTallGrassHabitat(groundGrassPatches);
    const rustlingPatch = habitat?.patches?.[0];

    if (!rustlingPatch?.cellId) {
      return null;
    }

    storyState.flags.boulderShadedTallGrassHabitatCreated = true;
    storyState.flags.timburrRustlingGrassCellId = rustlingPatch.cellId;
    return habitat;
  }

  function getLeafageTallGrassHabitat(groundGrassPatches) {
    const patches = groundGrassPatches.filter((patch) => {
      return (
        patch.habitatGroupId === LEAFAGE_TALL_GRASS_GROUP_ID &&
        patch.state === "alive"
      );
    });

    if (patches.length < LEAFAGE_TALL_GRASS_HABITAT_COUNT) {
      return null;
    }

    return {
      id: LEAFAGE_TALL_GRASS_GROUP_ID,
      patches: patches.slice(0, LEAFAGE_TALL_GRASS_HABITAT_COUNT)
    };
  }

  function recordLeafageTallGrassHabitat(storyState, groundGrassPatches) {
    if (storyState.flags.leafageTallGrassHabitatCreated) {
      return null;
    }

    const habitat = getLeafageTallGrassHabitat(groundGrassPatches);
    const rustlingPatch = habitat?.patches?.[0];

    if (!rustlingPatch?.cellId) {
      return null;
    }

    storyState.flags.leafageTallGrassHabitatCreated = true;
    storyState.flags.charmanderRustlingGrassCellId = rustlingPatch.cellId;
    return habitat;
  }

  function resetRuntimeState() {}

  function advanceQuest(storyState, message) {
    storyState.questIndex = Math.min(storyState.questIndex + 1, STORY_QUESTS.length - 1);
    const nextQuest = getActiveQuest(storyState);
    const handoff = nextQuest && nextQuest.id !== "epilogue" ?
      `Proximo: ${nextQuest.title}. ${nextQuest.actionLabel}.` :
      "";
    pushNotice([message, handoff].filter(Boolean).join(" "));
  }

  function harvestResourceNode(resourceNode, inventory) {
    inventory[resourceNode.itemId] = (inventory[resourceNode.itemId] || 0) + resourceNode.yield;
    resourceNode.cooldown = resourceNode.respawnDuration;
    syncInventoryUi(inventory);
    onGroundItemCollected({
      itemId: resourceNode.itemId,
      amount: resourceNode.yield
    });
    questSystem?.emit?.({
      type: QUEST_EVENT.COLLECT,
      targetId: resourceNode.itemId,
      amount: resourceNode.yield
    });
    const resourcePurpose = getResourcePurposeByItemId(resourceNode.itemId);
    const baseNotice = `+${resourceNode.yield} ${getItemLabel(resourceNode.itemId)} added to Colony Cache`;
    pushNotice(
      resourcePurpose?.playerFacingPurpose ?
        `${baseNotice}: ${resourcePurpose.playerFacingPurpose}` :
        `+${resourceNode.yield} ${getItemLabel(resourceNode.itemId)} added to cache`
    );
  }

  function formatRequirementProgress(ingredients = {}, inventory = {}) {
    const entries = Object.entries(ingredients || {});
    if (!entries.length) {
      return typeof formatRequirementSummary === "function" ?
        formatRequirementSummary(ingredients, inventory) :
        "";
    }

    return entries.map(([itemId, requiredAmount]) => {
      const required = Math.max(0, Number(requiredAmount || 0));
      const owned = Math.max(0, Number(inventory?.[itemId] || 0));
      const label = typeof getItemLabel === "function" ? getItemLabel(itemId) : itemId;
      return `${label} ${Math.min(owned, required)}/${required}`;
    }).join(", ");
  }

  function pushMissingRequirementNotice(ingredients, inventory) {
    const requirementProgress = formatRequirementProgress(ingredients, inventory);
    pushNotice(requirementProgress ? `Missing: ${requirementProgress}` : "Missing materials.");
  }

  function requestWorkbenchCraftMotion(recipe) {
    onWorkbenchCraftMotionRequested({
      presetId: MOTION_IMPACT_PRESET_IDS.WORKBENCH_CRAFT,
      recipe
    });
  }

  function requestWaterGunImpactMotion({
    groundCell,
    patch = null,
    type = "ground"
  } = {}) {
    onWaterGunImpactMotionRequested({
      presetId: MOTION_IMPACT_PRESET_IDS.WATER_GUN_HIT,
      groundCell,
      patch,
      type
    });
  }

  function craftCampfireAtWorkbench({ storyState, inventory } = {}) {
    const campfireRecipe = workbenchRecipes.campfire;

    if (!storyState?.flags || !inventory || !campfireRecipe) {
      return false;
    }

    const trainHouseState = getTrainHouseProgressState({ storyState, inventory });

    if (trainHouseState.state === TRAIN_HOUSE_PROGRESS_STATE.READY_TO_PLACE) {
      onCampfireSpitOutRequested({ source: "workbench" });
      return true;
    }

    if (trainHouseState.state === TRAIN_HOUSE_PROGRESS_STATE.PLACED) {
      return false;
    }

    if (!hasItems(inventory, campfireRecipe.ingredients)) {
      pushMissingRequirementNotice(campfireRecipe.ingredients, inventory);
      return false;
    }

    consumeItems(inventory, campfireRecipe.ingredients);
    addItems(inventory, campfireRecipe.output);
    storyState.flags.campfireCrafted = true;
    syncInventoryUi(inventory);
    questSystem?.emit?.({
      type: QUEST_EVENT.BUILD,
      targetId: CAMPFIRE_ITEM_ID,
      amount: 1
    });
    onCampfireCrafted({
      recipe: campfireRecipe
    });
    requestWorkbenchCraftMotion(campfireRecipe);
    return true;
  }

  function craftStrawBedAtWorkbench({ storyState, inventory } = {}) {
    const strawBedRecipe = workbenchRecipes.strawBed;

    if (!storyState?.flags || !inventory || !strawBedRecipe) {
      return false;
    }

    const solarStationState = getSolarStationProgressState({ storyState, inventory });

    if (solarStationState.state === SOLAR_STATION_PROGRESS_STATE.READY_TO_PLACE) {
      onStrawBedPlacementRequested({ source: "workbench" });
      return true;
    }

    if (solarStationState.state === SOLAR_STATION_PROGRESS_STATE.PLACED) {
      return false;
    }

    if (solarStationState.state === SOLAR_STATION_PROGRESS_STATE.LOCKED) {
      return false;
    }

    if (!hasItems(inventory, strawBedRecipe.ingredients)) {
      pushMissingRequirementNotice(strawBedRecipe.ingredients, inventory);
      return false;
    }

    consumeItems(inventory, strawBedRecipe.ingredients);
    addItems(inventory, strawBedRecipe.output);
    storyState.flags.strawBedCrafted = true;
    syncInventoryUi(inventory);
    questSystem?.emit?.({
      type: QUEST_EVENT.BUILD,
      targetId: STRAW_BED_ITEM_ID,
      amount: 1
    });
    onStrawBedCrafted({
      recipe: strawBedRecipe
    });
    requestWorkbenchCraftMotion(strawBedRecipe);
    return true;
  }

  function craftLeafDenKitAtWorkbench({ storyState, inventory } = {}) {
    const houseRecipe = workbenchRecipes[LEAF_DEN_KIT_ITEM_ID];

    if (!storyState?.flags || !inventory) {
      return false;
    }

    if (!houseRecipe) {
      return false;
    }

    const houseKitState = getHouseKitProgressState({ storyState, inventory });

    if (houseKitState.state === HOUSE_KIT_PROGRESS_STATE.LOCKED) {
      pushNotice(getColonyFeedbackNotice(COLONY_FEEDBACK_IDS.HOUSE_KIT_LOCKED));
      return false;
    }

    if (houseKitState.state === HOUSE_KIT_PROGRESS_STATE.READY_TO_PLACE) {
      storyState.flags.leafDenKitSelected = true;
      syncInventoryUi(inventory);
      pushNotice(getColonyFeedbackNotice(COLONY_FEEDBACK_IDS.HOUSE_KIT_SELECTED));
      return true;
    }

    if (!hasItems(inventory, houseRecipe.ingredients)) {
      pushMissingRequirementNotice(houseRecipe.ingredients, inventory);
      return false;
    }

    if (Object.keys(houseRecipe.ingredients || {}).length > 0) {
      consumeItems(inventory, houseRecipe.ingredients);
    }
    addItems(inventory, houseRecipe.output);
    storyState.flags.leafDenKitPurchased = true;
    storyState.flags.leafDenBuildAvailable = true;
    storyState.flags.leafDenKitSelected = true;
    syncInventoryUi(inventory);
    questSystem?.emit?.({
      type: QUEST_EVENT.BUILD,
      targetId: LEAF_DEN_KIT_ITEM_ID,
      amount: 1
    });
    pushNotice(getColonyFeedbackNotice(COLONY_FEEDBACK_IDS.HOUSE_KIT_ISSUED));
    requestWorkbenchCraftMotion(houseRecipe);
    return true;
  }

  function getLockedRecipeStatus(recipe, inventory = {}) {
    const requirementSummary = formatRequirementSummary(recipe?.ingredients || {}, inventory);
    return requirementSummary ? `Locked · Needs ${requirementSummary}` : "Locked";
  }

  function getWorkbenchRecipeOptions(storyState, inventory = {}) {
    const flags = storyState?.flags || {};
    const recipeOptions = [];

    if (workbenchRecipes.campfire) {
      const trainHouseState = getTrainHouseProgressState({ flags, inventory });
      recipeOptions.push({
        recipe: workbenchRecipes.campfire,
        disabled: trainHouseState.disabled,
        status: trainHouseState.status ||
          (
            trainHouseState.state === TRAIN_HOUSE_PROGRESS_STATE.LOCKED ?
              getLockedRecipeStatus(workbenchRecipes.campfire, inventory) :
              null
          ),
        actionLabel: trainHouseState.actionLabel
      });
    }

    if (workbenchRecipes.strawBed) {
      const solarStationState = getSolarStationProgressState({ flags, inventory });
      recipeOptions.push({
        recipe: workbenchRecipes.strawBed,
        disabled: solarStationState.disabled,
        status: solarStationState.status ||
          (
            solarStationState.state === SOLAR_STATION_PROGRESS_STATE.LOCKED ?
              getLockedRecipeStatus(workbenchRecipes.strawBed, inventory) :
              null
          ),
        actionLabel: solarStationState.actionLabel
      });
    }

    const houseRecipe = workbenchRecipes[LEAF_DEN_KIT_ITEM_ID];

    if (houseRecipe) {
      const houseKitState = getHouseKitProgressState({ flags, inventory });
      recipeOptions.push({
        recipe: houseRecipe,
        disabled: houseKitState.disabled,
        status: houseKitState.status,
        actionLabel: houseKitState.actionLabel
      });
    }

    return recipeOptions;
  }

  function handleStationInteraction(stationId, storyState, inventory) {
    if (
      stationId === "workbench" &&
      storyState.flags.bulbasaurWorkbenchGuideAvailable &&
      !storyState.flags.workbenchDiyRecipesReceived
    ) {
      onWorkbenchRecipesRequested();
      return true;
    }

    if (
      stationId === "workbench" &&
      getWorkbenchRecipeOptions(storyState, inventory).length > 0
    ) {
      const recipes = getWorkbenchRecipeOptions(storyState, inventory);

      onWorkbenchCraftOptionsRequested({ recipes });
      return true;
    }

    const quest = getActiveQuest(storyState);
    const recipe = quest.recipeId ? placeholderRecipes[quest.recipeId] : null;

    if (!recipe || quest.stationId !== stationId) {
      pushNotice(
        stationId === "stove" ?
          "Nenhuma receita critica no fogao agora." :
          "Workbench livre no momento."
      );
      return false;
    }

    if (!hasItems(inventory, recipe.ingredients)) {
      pushMissingRequirementNotice(recipe.ingredients, inventory);
      return false;
    }

    consumeItems(inventory, recipe.ingredients);
    addItems(inventory, recipe.output);

    if (recipe.id === "granitePickaxe") {
      storyState.flags.pickaxeCrafted = true;
    }

    syncInventoryUi(inventory);
    questSystem?.emit?.({
      type: QUEST_EVENT.BUILD,
      targetId: recipe.id,
      amount: 1
    });
    advanceQuest(storyState, `${recipe.title} pronto.`);
    return true;
  }

  function handleNpcInteraction(npcId, storyState, onDialogueOpen = () => {}) {
    const quest = getActiveQuest(storyState);
    const activeSystemQuest = questSystem?.getActiveQuest?.();
    const npcProfile = npcProfiles[npcId];

    if (npcId === "tangrowth") {
      if (
        storyState.flags.tangrowthLogChairRequestAvailable &&
        !storyState.flags.logChairReceived
      ) {
        if (typeof startDialogue === "function") {
          const opened = startDialogue({
            targetId: npcId,
            dialogueId: "logChairGift",
            onComplete: onChopperLogChairGiftRequested
          });

          if (opened) {
            onDialogueOpen();
            return true;
          }
        }

        onChopperLogChairGiftRequested();
        return true;
      }

      if (
        storyState.flags.tangrowthHouseTalkAvailable &&
        !storyState.flags.tangrowthHouseTalkComplete
      ) {
        onDialogueOpen();
        onTangrowthHouseTalkRequested({
          targetId: npcId
        });
        return true;
      }

      if (
        storyState.flags.charmanderCelebrationSuggested &&
        !storyState.flags.charmanderCelebrationComplete
      ) {
        onDialogueOpen();
        onCharmanderCelebrationTangrowthRequested({
          targetId: npcId
        });
        return true;
      }

      if (activeSystemQuest?.id === "chopper-first-habitat-report") {
        const completeFirstHabitatReport = () => {
          questSystem.emit({
            type: QUEST_EVENT.TALK,
            targetId: "chopper-first-habitat-report"
          });
        };

        if (typeof startDialogue === "function") {
          const opened = startDialogue({
            targetId: npcId,
            dialogueId: "firstHabitatReport",
            onComplete: completeFirstHabitatReport
          });

          if (opened) {
            onDialogueOpen();
            return true;
          }
        }

        completeFirstHabitatReport();
        return true;
      }

      if (quest.id === "meetTangrowth") {
        const completeOnboarding = () => {
          questSystem?.emit?.({
            type: QUEST_EVENT.TALK,
            targetId: npcId
          });
          advanceQuest(
            storyState,
            quest.resolveLine || `${SANDBOTS_BOT_NAMES.overseer} pointed you toward the colony hub and the Core Keeper Bot.`
          );
        };

        if (typeof startDialogue === "function") {
          const opened = startDialogue({
            targetId: npcId,
            dialogueId: "onboarding",
            onComplete: completeOnboarding
          });

          if (opened) {
            onDialogueOpen();
            return true;
          }
        }

        completeOnboarding();
        return true;
      }

      if (
        storyState.flags.tallGrassDiscovered &&
        !storyState.flags.tangrowthTallGrassCommentSeen
      ) {
        const completeTallGrassReturn = () => {
          storyState.flags.tangrowthTallGrassCommentSeen = true;
        };

        if (typeof startDialogue === "function") {
          const opened = startDialogue({
            targetId: npcId,
            dialogueId: "tallGrassReturn",
            onComplete: completeTallGrassReturn
          });

          if (opened) {
            onDialogueOpen();
            return true;
          }
        }

        completeTallGrassReturn();
        return true;
      }

      pushNotice(
        npcProfile?.idleLine ||
        `${SANDBOTS_BOT_NAMES.overseer}: keep moving. The Core Keeper Bot holds the home loop together.`
      );
      return false;
    }

    if (npcId === "aunty") {
      if (quest.id === "meetAunty") {
        questSystem?.emit?.({
          type: QUEST_EVENT.TALK,
          targetId: npcId
        });
        advanceQuest(storyState, quest.resolveLine || "Core Keeper Bot marked the bridge route and authorized the Workbench.");
        return true;
      }

      if (quest.id === "hostDinner") {
        storyState.flags.dinnerHosted = true;
        questSystem?.emit?.({
          type: QUEST_EVENT.TALK,
          targetId: npcId
        });
        advanceQuest(storyState, quest.resolveLine || "Final hub check complete. Free roam unlocked.");
        return true;
      }

      pushNotice(
        npcProfile?.idleLine ||
        "Core Keeper Bot: follow the active route and return when the next milestone is ready."
      );
      return false;
    }

    if (npcId === "bufo") {
      if (quest.id === "meetBufo") {
        questSystem?.emit?.({
          type: QUEST_EVENT.TALK,
          targetId: npcId
        });
        advanceQuest(storyState, quest.resolveLine || "Route Survey Bot needs a Marsh Ration before releasing the blueprint.");
        return true;
      }

      pushNotice(npcProfile?.idleLine || "Route Survey Bot: without the right ration, progress stops here.");
      return false;
    }

    if (npcId === "willow") {
      if (quest.id === "meetWillow") {
        questSystem?.emit?.({
          type: QUEST_EVENT.TALK,
          targetId: npcId
        });
        advanceQuest(
          storyState,
          quest.resolveLine || "Willow marked the final repair kit for the Old Colony Hub."
        );
        return true;
      }

      pushNotice(npcProfile?.idleLine || "Willow: open the final trail and bring back the repair kit.");
      return false;
    }

    return false;
  }

  function handleDeliveryInteraction(targetId, storyState, inventory, onDialogueOpen = () => {}) {
    const quest = getActiveQuest(storyState);

    if (targetId === "squirtle") {
      if (
        storyState.flags.squirtleLeppaRequestAvailable &&
        !storyState.flags.leppaBerryGiftComplete
      ) {
        markPokemonFollowing(storyState, targetId);
        onDialogueOpen();
        onLeppaBerryGiftRequested({
          targetId
        });
        return true;
      }

      if (quest.id !== "findPokemon") {
        pushNotice("The damaged bot is not the active priority right now.");
        return false;
      }

      const completeDiscovery = () => {
        questSystem?.emit?.({
          type: QUEST_EVENT.TALK,
          targetId
        });
        markPokemonFollowing(storyState, targetId);
        unlockPlayerAbility("waterGun");
        unlockPokedexReward();
        advanceQuest(
          storyState,
          quest.resolveLine || `You found the bot ${SANDBOTS_BOT_NAMES.overseer} detected.`
        );
      };

      if (typeof startDialogue === "function") {
        const opened = startDialogue({
          targetId,
          dialogueId: "discovery",
          onComplete: completeDiscovery
        });

        if (opened) {
          onDialogueOpen();
          return true;
        }
      }

      completeDiscovery();
      return true;
    }

    if (targetId === "bridge") {
      if (quest.id !== "repairBridge") {
        pushNotice("The bridge is not the active priority yet.");
        return false;
      }

      if (!consumeItems(inventory, quest.delivery)) {
        pushMissingRequirementNotice(quest.delivery, inventory);
        return false;
      }

      storyState.flags.bridgeRepaired = true;
      syncInventoryUi(inventory);
      advanceQuest(storyState, "Bridge repaired. The south route now reaches Route Survey Bot.");
      return true;
    }

    if (targetId === "bufo") {
      if (quest.id !== "feedBufo") {
        pushNotice("Route Survey Bot is waiting for another step before delivery.");
        return false;
      }

      if (!consumeItems(inventory, quest.delivery)) {
        pushMissingRequirementNotice(quest.delivery, inventory);
        return false;
      }

      storyState.flags.bufoFed = true;
      syncInventoryUi(inventory);
      advanceQuest(storyState, "Route Survey Bot released the Granite Pickaxe blueprint.");
      return true;
    }

    if (targetId === "graniteGate") {
      if (quest.id !== "breakGate") {
        pushNotice("The Granite Gate is not the active objective yet.");
        return false;
      }

      if ((inventory.granitePickaxe || 0) <= 0) {
        pushNotice("Without the Granite Pickaxe, the gate stays shut.");
        return false;
      }

      storyState.flags.graniteGateOpened = true;
      advanceQuest(storyState, "Granite Gate opened. Willow is reachable now.");
      return true;
    }

    if (targetId === "burrowSite") {
      if (quest.id !== "repairBurrow") {
        pushNotice("The Old Colony Hub cannot be repaired yet.");
        return false;
      }

      if (!consumeItems(inventory, quest.delivery)) {
        pushMissingRequirementNotice(quest.delivery, inventory);
        return false;
      }

      storyState.flags.burrowFixed = true;
      syncInventoryUi(inventory);
      advanceQuest(storyState, "Old Colony Hub repaired. Return to the Core Keeper Bot to close the campaign route.");
      return true;
    }

    return false;
  }

  function findNearbyActionTarget({
    playerPosition,
    palmModel,
    palmInstances,
    resourceNodes,
    leppaTree = null,
    leafDen = null,
    storyState,
    inventory = null,
    groundDeadInstances = [],
    iceGroundInstances = [],
    groundPurifiedInstances = [],
    groundGrassPatches = [],
    groundFlowerPatches = [],
    canPurifyGround = false,
    canUseLeafage = false,
    canUseFire = false,
    allowPlacement = true
  }) {
    const nearbyHarvestTarget = findNearbyHarvestTarget(
      playerPosition,
      palmModel,
      palmInstances,
      resourceNodes,
      storyState
    );
    const waterGunTreeTargetActive = Boolean(canPurifyGround && nearbyHarvestTarget?.palm);
    let nearestTarget =
      nearbyHarvestTarget?.palm && !waterGunTreeTargetActive ?
        null :
        nearbyHarvestTarget;

    if (
      allowPlacement &&
      storyState?.flags?.logChairReceived &&
      !storyState?.flags?.logChairPlaced &&
      (inventory?.[LOG_CHAIR_ITEM_ID] || 0) > 0
    ) {
      return {
        logChairPlacement: true,
        distance: 0
      };
    }

    if (
      allowPlacement &&
      storyState?.flags?.strawBedCrafted &&
      !storyState?.flags?.strawBedPlacedInBulbasaurHabitat &&
      (inventory?.[STRAW_BED_ITEM_ID] || 0) > 0
    ) {
      return {
        strawBedPlacement: getBulbasaurHabitatPlacementTarget(
          playerPosition,
          groundGrassPatches,
          storyState
        ),
        distance: 0
      };
    }

    if (
      allowPlacement &&
      storyState?.flags?.leafDenBuildAvailable &&
      storyState?.flags?.leafDenKitSelected &&
      (inventory?.[LEAF_DEN_KIT_ITEM_ID] || 0) > 0
    ) {
      const placementReadiness = getHouseKitPlacementReadiness({ storyState, inventory });
      return {
        leafDenKitPlacement: placementReadiness,
        distance: 0
      };
    }

    if (
      allowPlacement &&
      storyState?.flags?.leafDenFurnitureRequestAvailable &&
      storyState?.flags?.leafDenInteriorEntered &&
      !storyState?.flags?.leafDenFurnitureRequestComplete &&
      Number(storyState?.flags?.leafDenFurniturePlacedCount || 0) < 3
    ) {
      return {
        leafDenFurniturePlacement: true,
        distance: 0
      };
    }

    if (
      allowPlacement &&
      storyState?.flags?.dittoFlagReceived &&
      storyState?.flags?.dittoFlagSelectedForHouse &&
      !storyState?.flags?.dittoFlagPlacedOnHouse &&
      storyState?.flags?.leafDenBuilt &&
      (inventory?.[DITTO_FLAG_ITEM_ID] || 0) > 0
    ) {
      const nearbyLeafDen = findNearbyLeafDen(playerPosition, leafDen, storyState);

      if (nearbyLeafDen) {
        return {
          dittoFlagPlacement: {
            leafDen: nearbyLeafDen.leafDen
          },
          distance: nearbyLeafDen.distance
        };
      }
    }

    const nearbyLeafageTarget = canUseLeafage ?
      findNearbyLeafageGroundCell({
        playerPosition,
        groundDeadInstances,
        groundPurifiedInstances,
        groundGrassPatches,
        groundFlowerPatches
      }) :
      null;

    if (nearbyLeafageTarget && (!nearestTarget || nearbyLeafageTarget.distance < nearestTarget.distance)) {
      nearestTarget = {
        leafageGroundCell: nearbyLeafageTarget.groundCell,
        distance: nearbyLeafageTarget.distance
      };
    }

    const nearbyFireTarget = canUseFire ?
      findNearbyFireGroundCell(playerPosition, iceGroundInstances) :
      null;

    if (nearbyFireTarget) {
      return {
        fireGroundCell: nearbyFireTarget.groundCell,
        distance: nearbyFireTarget.distance
      };
    }

    if (!canPurifyGround) {
      return nearestTarget;
    }

    const nearbyGroundCell = findNearbyWaterGunGroundCell({
      playerPosition,
      groundDeadInstances,
      groundPurifiedInstances,
      groundGrassPatches,
      storyState,
      leppaTree
    });
    if (!nearbyGroundCell) {
      return nearestTarget;
    }

    if (
      !nearestTarget ||
      nearestTarget.resourceNode ||
      nearbyGroundCell.distance < nearestTarget.distance
    ) {
      return nearbyGroundCell;
    }

    return nearestTarget;
  }

  function performInteractAction({
    playerPosition,
    npcActors,
    interactables,
    storyState,
    inventory,
    groundGrassPatches = [],
    groundFlowerPatches = [],
    logChair = null,
    leafDen = null,
    leppaTree = null,
    leppaBerryDrops = [],
    timburrEncounter = null,
    charmanderEncounter = null,
    bulbasaurEncounter = null,
    allowDestroyInstantiatedObject = false,
    onNpcInteractionStart = () => {}
  }) {
    const getInteractionTargetPosition = (target) => {
      if (!target) {
        return null;
      }

      if (Array.isArray(target.position)) {
        return target.position;
      }

      const groundGrassTargetKinds = new Set([
        "grassEncounter",
        "charmanderGrassEncounter",
        "timburrGrassEncounter",
        "bulbasaurMission",
        "bulbasaurRequestComplete",
        "bulbasaurStrawBedRecipe",
        "bulbasaurStrawBedComplete",
        "leppaBerryGift"
      ]);

      if (groundGrassTargetKinds.has(target.kind) && target.cellId) {
        const groundGrassPatch = groundGrassPatches.find((patch) => patch.cellId === target.cellId);
        return groundGrassPatch?.position || null;
      }

      if (target.kind === "timburrLeafDenFurnitureComplete") {
        return timburrEncounter?.position || null;
      }

      if (target.kind === "charmanderCelebrationRequest") {
        return charmanderEncounter?.position || null;
      }

      if (target.kind === "leppaBerryTree") {
        return leppaTree?.position || null;
      }

      if (target.kind === "leppaTreeLeafageOptions") {
        return leppaTree?.position || null;
      }

      return null;
    };

    const notifyInteractionStart = (target) => {
      const targetPosition = getInteractionTargetPosition(target);
      const interactionStartEvent = {
        targetId: target.id,
        playerPosition,
        npcActors,
        interactables
      };

      if (targetPosition) {
        interactionStartEvent.targetPosition = targetPosition;
      }

      onNpcInteractionStart(interactionStartEvent);
    };

    if (allowDestroyInstantiatedObject) {
      const nearbyDestroyableObject = findNearbyDestroyableInstantiatedObject(
        playerPosition,
        groundGrassPatches,
        storyState,
        groundFlowerPatches
      );

      if (!nearbyDestroyableObject?.target) {
        pushNotice("Nothing to destroy here.");
        return false;
      }

      return destroyInstantiatedObjectPatch(
        nearbyDestroyableObject.target,
        groundGrassPatches,
        groundFlowerPatches,
        storyState
      );
    }

    if (canPlaceCraftedCampfire(storyState, inventory)) {
      missedInteractAttempts = 0;
      onCampfireSpitOutRequested({
        playerPosition
      });
      return true;
    }

    const nearbyTarget = findNearbyInteractable(
      playerPosition,
      npcActors,
      interactables,
      storyState,
      groundGrassPatches,
      logChair,
      leafDen,
      timburrEncounter,
      charmanderEncounter,
      leppaTree,
      bulbasaurEncounter,
      groundFlowerPatches
    );
    if (!nearbyTarget?.target) {
      if (isLeppaTreeWaterHintAvailable(playerPosition, leppaTree, storyState)) {
        missedInteractAttempts = 0;
        onLeppaTreeWaterHintRequested({
          leppaTree
        });
        return true;
      }

      pushMissedInteractNotice();
      return false;
    }

    missedInteractAttempts = 0;
    const { target } = nearbyTarget;

    if (target.kind === "npc") {
      const onDialogueOpen = () => notifyInteractionStart(target);

      if (target.id === "bufo" && getActiveQuest(storyState).id === "feedBufo") {
        return handleDeliveryInteraction(target.id, storyState, inventory, onDialogueOpen);
      }

      return handleNpcInteraction(target.id, storyState, onDialogueOpen);
    }

    if (target.kind === "grassEncounter") {
      if (!storyState.flags.chopperBulbasaurRepairBoxIntroComplete) {
        return false;
      }

      if (!storyState.flags.bulbasaurRevealed) {
        storyState.flags.bulbasaurRevealed = true;
        markPokemonFollowing(storyState, "bulbasaur");
        notifyInteractionStart(target);
        onBulbasaurRevealed({
          cellId: target.cellId
        });
      }
      return true;
    }

    if (target.kind === "charmanderGrassEncounter") {
      if (!storyState.flags.charmanderRevealed) {
        storyState.flags.charmanderRevealed = true;
        markPokemonFollowing(storyState, "charmander");
        notifyInteractionStart(target);
        onCharmanderRevealed({
          cellId: target.cellId
        });
      }
      return true;
    }

    if (target.kind === "timburrGrassEncounter") {
      if (!storyState.flags.timburrRevealed) {
        storyState.flags.timburrRevealed = true;
        markPokemonFollowing(storyState, "timburr");
        notifyInteractionStart(target);
        onTimburrRevealed({
          cellId: target.cellId
        });
      }
      return true;
    }

    if (target.kind === "bulbasaurMission") {
      notifyInteractionStart(target);
      markPokemonFollowing(storyState, "bulbasaur");
      storyState.flags.bulbasaurDryGrassMissionAccepted = true;
      if (
        (storyState.flags.restoredGrassCount || 0) >= BULBASAUR_DRY_GRASS_MISSION_RESTORE_COUNT
      ) {
        completeBulbasaurDryGrassMission(storyState);
      }
      onBulbasaurDryGrassMissionAccepted();
      return true;
    }

    if (target.kind === "bulbasaurRequestComplete") {
      notifyInteractionStart(target);
      markPokemonFollowing(storyState, "bulbasaur");
      onBulbasaurDryGrassRequestCompleted();
      return true;
    }

    if (target.kind === "bulbasaurStrawBedRecipe") {
      notifyInteractionStart(target);
      markPokemonFollowing(storyState, "bulbasaur");
      onBulbasaurStrawBedRecipeRequested();
      return true;
    }

    if (target.kind === "bulbasaurStrawBedComplete") {
      notifyInteractionStart(target);
      markPokemonFollowing(storyState, "bulbasaur");
      onBulbasaurStrawBedRequestCompleted();
      return true;
    }

    if (target.kind === "leppaBerryTree") {
      notifyInteractionStart(target);

      const dropAndCollectLeppaBerry = () => {
        const drop = dropLeppaBerryFromTree(leppaTree, leppaBerryDrops, storyState);
        if (!drop) {
          return false;
        }

        const collected = collectLeppaBerryDrops(
          drop.position,
          leppaBerryDrops,
          inventory,
          storyState
        );

        if (collected > 0) {
          syncInventoryUi(inventory);
          pushNotice(`+${collected} Pulse Berry`);
        } else {
          pushNotice("A Pulse Berry fell from the tree.");
        }

        return true;
      };

      const opened = startDialogue?.({
        targetId: "leppaTree",
        dialogueId: "revivedTree",
        onComplete: dropAndCollectLeppaBerry
      });

      if (opened) {
        return true;
      }

      if (!dropAndCollectLeppaBerry()) {
        pushNotice("The tree has already dropped its Pulse Berry.");
        return false;
      }

      return true;
    }

    if (target.kind === "leppaTreeLeafageOptions") {
      notifyInteractionStart(target);
      onLeppaTreeLeafageOptionsRequested({
        targetId: target.id
      });
      return true;
    }

    if (target.action === "destroyInstantiatedObject") {
      if (!allowDestroyInstantiatedObject) {
        pushNotice("Press Y to destroy this object.");
        return false;
      }

      return destroyInstantiatedObjectPatch(
        target,
        groundGrassPatches,
        groundFlowerPatches,
        storyState
      );
    }

    if (target.kind === "leppaBerryGift") {
      notifyInteractionStart(target);
      markPokemonFollowing(storyState, target.id);
      onLeppaBerryGiftRequested({
        targetId: target.id
      });
      return true;
    }

    if (target.kind === "logChairSeat") {
      onLogChairSitRequested({
        targetId: target.id
      });
      return true;
    }

    if (target.kind === "leafDenConstruction") {
      onLeafDenConstructionRequested({
        targetId: target.id
      });
      return true;
    }

    if (target.kind === "leafDenEntrance") {
      onLeafDenEnterRequested({
        targetId: target.id
      });
      return true;
    }

    if (target.kind === "timburrLeafDenFurnitureComplete") {
      notifyInteractionStart(target);
      markPokemonFollowing(storyState, "timburr");
      onTimburrLeafDenFurnitureCompleteRequested({
        targetId: target.id
      });
      return true;
    }

    if (target.kind === "charmanderCelebrationRequest") {
      notifyInteractionStart(target);
      markPokemonFollowing(storyState, "charmander");
      onCharmanderCelebrationSuggested({
        targetId: target.id
      });
      return true;
    }

    if (target.kind === "pokemonCompanion") {
      notifyInteractionStart(target);
      if (!markPokemonFollowing(storyState, target.id, {
        followFlags: pokemonFollowFlags,
        maxFollowers: maxPokemonFollowers
      })) {
        pushNotice("Follower group is full.");
        return true;
      }

      pushNotice(`${POKEMON_FOLLOW_NAMES[target.id] || target.label || "Bot"} is following you.`);
      return true;
    }

    if (target.kind === "beeFieldRepairBox") {
      notifyInteractionStart(target);

      if (
        !(storyState.flags?.restoredFlowerBedHabitatIds || [])
          .includes(BEE_FIELD_FLOWER_GROUP_ID)
      ) {
        pushNotice("Restore every flower in this field first.");
        return true;
      }

      if (storyState.flags.beeFieldRepairBoxOpened) {
        pushNotice("The Bee Box is already open.");
        return true;
      }

      storyState.flags.beeFieldRepairBoxOpened = true;
      pushNotice("The Bee Box clicks open. Something inside is waking up.");
      return true;
    }

    if (target.kind === "station") {
      return handleStationInteraction(target.id, storyState, inventory);
    }

    if (target.id === "colonyCache") {
      notifyInteractionStart(target);
      pushNotice(formatColonyCacheInteractionNotice(inventory));
      return true;
    }

    if (target.id === "ruinedPokemonCenter") {
      notifyInteractionStart(target);
      onRuinedPokemonCenterInspectRequested({
        targetId: target.id
      });
      return true;
    }

    if (target.id === "pokemonCenterPc") {
      notifyInteractionStart(target);
      onPokemonCenterPcCheckRequested({
        targetId: target.id
      });
      return true;
    }

    return handleDeliveryInteraction(target.id, storyState, inventory, () => notifyInteractionStart(target));
  }

  function performHarvestAction({
    playerPosition,
    palmModel,
    palmInstances,
    resourceNodes,
    inventory,
    storyState,
    woodDrops,
    leppaTree = null,
    leafDen = null,
    leppaBerryDrops = [],
    groundDeadInstances = [],
    iceGroundInstances = [],
    groundFlowerPatches = [],
    groundPurifiedInstances = [],
    groundGrassPatches = [],
    canPurifyGround = false,
    canUseLeafage = false,
    canUseFire = false,
    useWaterGun = false,
    useFire = false,
    forcedHarvestTarget = null,
    allowPlacement = true
  }) {
    const nearbyHarvestTarget = forcedHarvestTarget || findNearbyActionTarget({
      playerPosition,
      palmModel,
      palmInstances,
      resourceNodes,
      leppaTree,
      leafDen,
      storyState,
      inventory,
      groundDeadInstances,
      iceGroundInstances,
      groundPurifiedInstances,
      groundGrassPatches,
      groundFlowerPatches,
      canPurifyGround,
      canUseLeafage,
      canUseFire,
      allowPlacement
    });

    if (nearbyHarvestTarget) {
      missedHarvestAttempts = 0;
    }

    if (!nearbyHarvestTarget && canPurifyGround) {
      const blockedGroundCell = findNearbyGroundCell(playerPosition, groundDeadInstances);
      if (
        blockedGroundCell?.groundCell &&
        !canWaterGunTargetGroundCell(
          blockedGroundCell.groundCell,
          groundGrassPatches,
          storyState,
          leppaTree
        )
      ) {
        pushNotice(`${SANDBOTS_ITEM_NAMES.hydroTool} can only restore dry tall grass right now.`);
        return false;
      }
    }

    if (nearbyHarvestTarget?.logChairPlacement) {
      onLogChairPlacementRequested({
        playerPosition
      });
      return true;
    }

    if (nearbyHarvestTarget?.strawBedPlacement) {
      if (!nearbyHarvestTarget.strawBedPlacement.canPlace) {
        pushNotice(nearbyHarvestTarget.strawBedPlacement.reason);
        return false;
      }

      onStrawBedPlacementRequested({
        placementTarget: nearbyHarvestTarget.strawBedPlacement
      });
      return true;
    }

    if (nearbyHarvestTarget?.leafDenKitPlacement) {
      if (nearbyHarvestTarget.leafDenKitPlacement?.canPlace === false) {
        pushNotice(nearbyHarvestTarget.leafDenKitPlacement.reason);
        return false;
      }

      onLeafDenKitPlacementRequested({
        playerPosition
      });
      return true;
    }

    if (nearbyHarvestTarget?.leafDenFurniturePlacement) {
      onLeafDenFurniturePlacementRequested({
        playerPosition
      });
      return true;
    }

    if (nearbyHarvestTarget?.dittoFlagPlacement) {
      onDittoFlagPlacementRequested({
        placementTarget: nearbyHarvestTarget.dittoFlagPlacement
      });
      return true;
    }

    if (useWaterGun && nearbyHarvestTarget?.palm) {
      const wateredPalm = waterNearbyPalm(
        playerPosition,
        palmModel,
        palmInstances,
        storyState,
        woodDrops
      );

      if (!wateredPalm.hit) {
        return false;
      }

      if (wateredPalm.challengeComplete) {
        pushNotice(getColonyFeedbackNotice(COLONY_FEEDBACK_IDS.HABITAT_CHECK_COMPLETE, {
          growBotName: SANDBOTS_BOT_NAMES.grow
        }));
      } else if (wateredPalm.counted) {
        const wateredTreeCount = Math.min(5, Number(storyState.flags.wateredTreeCount || 0));
        pushNotice(`Tree watered for ${SANDBOTS_BOT_NAMES.grow}. ${wateredTreeCount}/5 trees watered.`);
      }

      return true;
    }

    if (nearbyHarvestTarget?.resourceNode) {
      harvestResourceNode(nearbyHarvestTarget.resourceNode, inventory);
      return true;
    }

    if (canUseLeafage) {
      const leafageGroundCell =
        nearbyHarvestTarget?.leafageGroundCell ||
        findNearbyLeafageGroundCell({
          playerPosition,
          groundDeadInstances,
          groundPurifiedInstances,
          groundGrassPatches,
          groundFlowerPatches
        })?.groundCell;

      if (leafageGroundCell) {
        const leafagePatchResult = growLeafagePatch(
          leafageGroundCell,
          groundGrassPatches,
          groundFlowerPatches,
          storyState
        );

        if (leafagePatchResult?.patch) {
          const { patch: leafagePatch, type: leafagePatchType } = leafagePatchResult;

          questSystem?.emit?.({
            type: QUEST_EVENT.PLACE,
            targetId: "leafy-home-patch"
          });
          onNaturePatchRevived({
            patch: leafagePatch,
            type: leafagePatchType
          });
          habitatSystem?.recordEvent?.({
            type: HABITAT_EVENT.REVIVE_PATCH,
            targetId: leafagePatchType
          });

          if (leafagePatchType === "flower") {
            const leafageFlowerBedHabitat = getRestoredFlowerBedHabitat(
              leafagePatch,
              groundFlowerPatches
            );

            if (recordRestoredFlowerBedHabitat(storyState, leafageFlowerBedHabitat)) {
              pushNotice("A pretty flower bed bloomed.", 3.6);
              habitatSystem?.recordEvent?.({
                type: HABITAT_EVENT.RESTORE_HABITAT,
                targetId: "pretty-flower-bed"
              });
              return true;
            }

            pushNotice(`${SANDBOTS_ITEM_NAMES.growTool} grew a flower.`);
            return true;
          }

          const boulderShadedTallGrassHabitat = recordBoulderShadedTallGrassHabitat(
            storyState,
            groundGrassPatches
          );

          if (boulderShadedTallGrassHabitat) {
            pushNotice("A boulder-shaded tall grass habitat is rustling.", 3.6);
            habitatSystem?.recordEvent?.({
              type: HABITAT_EVENT.RESTORE_HABITAT,
              targetId: "boulder-shaded-tall-grass"
            });
            return true;
          }

          const leafageTallGrassHabitat = recordLeafageTallGrassHabitat(
            storyState,
            groundGrassPatches
          );

          if (leafageTallGrassHabitat) {
            pushNotice("A patch of tall grass is rustling.", 3.4);
            habitatSystem?.recordEvent?.({
              type: HABITAT_EVENT.RESTORE_HABITAT,
              targetId: "tall-grass"
            });
            return true;
          }

          pushNotice(
            leafagePatch.leafageObjectId === LEAFAGE_OBJECT_ID_GARDEN_1 ?
              `${SANDBOTS_ITEM_NAMES.growTool} grew a garden.` :
              `${SANDBOTS_ITEM_NAMES.growTool} grew tall grass.`
          );
          return true;
        }
      }

      const nearbyDryGroundCell = findNearbyGroundCell(playerPosition, groundDeadInstances);
      if (nearbyDryGroundCell?.groundCell) {
        pushNotice(`${SANDBOTS_ITEM_NAMES.growTool} needs restored ground. Use ${SANDBOTS_ITEM_NAMES.hydroTool} here first.`);
        return false;
      }
    }

    if (canUseFire || useFire) {
      const fireGroundCell =
        nearbyHarvestTarget?.fireGroundCell ||
        findNearbyFireGroundCell(playerPosition, iceGroundInstances)?.groundCell;

      if (fireGroundCell) {
        if (!canUseCharmanderFireWithCarbon({ storyState, inventory })) {
          pushNotice(CHARMANDER_FIRE_COST.emptyNotice);
          return false;
        }

        const burned = burnFireGroundCell(
          fireGroundCell,
          iceGroundInstances,
          groundDeadInstances
        );

        if (burned) {
          recordCharmanderFireCarbonUse({ storyState, inventory, syncInventoryUi });
          pushNotice(`${SANDBOTS_ITEM_NAMES.thermalTool} burned the white ground into dry ground.`);
          return true;
        }
      }

      if (useFire || forcedHarvestTarget?.fireGroundCell) {
        return false;
      }
    }

    if (nearbyHarvestTarget?.groundCell) {
      if (!canWaterGunTargetGroundCell(
        nearbyHarvestTarget.groundCell,
        groundGrassPatches,
        storyState,
        leppaTree
      )) {
        pushNotice(`${SANDBOTS_ITEM_NAMES.hydroTool} can only restore dry tall grass right now.`);
        return false;
      }

      const alreadyPurified = groundPurifiedInstances.includes(nearbyHarvestTarget.groundCell);
      const purified = alreadyPurified || purifyGroundCell(
        nearbyHarvestTarget.groundCell,
        groundDeadInstances,
        groundPurifiedInstances
      );

      if (purified) {
        if (
          reviveLeppaTreeFromWateredTiles(
            leppaTree,
            storyState,
            groundPurifiedInstances
          )
        ) {
          pushNotice("The dead tree perked back up.");
          onLeppaTreeRevived({
            leppaTree
          });
        }

        questSystem?.emit?.({
          type: QUEST_EVENT.BUILD,
          targetId: "revived-habitat"
        });

        const revivedGrass = reviveGroundGrass(
          nearbyHarvestTarget.groundCell,
          groundGrassPatches
        );

        if (revivedGrass) {
          const dryGrassMissionAlreadyComplete = Boolean(
            storyState.flags.bulbasaurDryGrassMissionComplete
          );
          storyState.flags.restoredGrassCount =
            (storyState.flags.restoredGrassCount || 0) + 1;
          if (
            !dryGrassMissionAlreadyComplete &&
            storyState.flags.bulbasaurDryGrassMissionAccepted &&
            storyState.flags.restoredGrassCount >= BULBASAUR_DRY_GRASS_MISSION_RESTORE_COUNT
          ) {
            completeBulbasaurDryGrassMission(storyState);
          } else if (dryGrassMissionAlreadyComplete) {
            recordFirstTaughtActionFreedomUse(storyState, {
              actionId: FIRST_TAUGHT_ACTION_IDS.WATER_DRY_GRASS
            });
          }
          emitColonyProgressQuestEvents({
            questSystem,
            eventType: COLONY_PROGRESS_EVENT.RESTORATION_APPLIED,
            payload: {
              targetId: "dry-grass",
              toolId: "waterGun"
            }
          });
          if (questSystem?.hasUnlocked?.("leafage")) {
            questSystem.emit({
              type: QUEST_EVENT.PLACE,
              targetId: "leafy-home-patch"
            });
          }
          onNaturePatchRevived({
            patch: revivedGrass,
            type: "grass"
          });
          habitatSystem?.recordEvent?.({
            type: HABITAT_EVENT.REVIVE_PATCH,
            targetId: "grass"
          });

          const restoredGrassHabitat = getRestoredGrassHabitat(
            revivedGrass,
            groundGrassPatches
          );

          if (recordRestoredGrassHabitat(storyState, restoredGrassHabitat)) {
            pushNotice("You've restored a tall grass habitat!", 3.6);
            const newlyDiscoveredHabitats = habitatSystem?.recordEvent?.({
              type: HABITAT_EVENT.RESTORE_HABITAT,
              targetId: "tall-grass"
            }) || [];
            onTallGrassHabitatRestored({
              groundCell: nearbyHarvestTarget.groundCell,
              restoredGrassHabitat,
              newlyDiscoveredHabitats
            });
          }
        }

        const revivedFlower = reviveGroundFlower(
          nearbyHarvestTarget.groundCell,
          groundFlowerPatches
        );

        requestWaterGunImpactMotion({
          groundCell: nearbyHarvestTarget.groundCell,
          patch: revivedGrass || revivedFlower || null,
          type: revivedGrass ? "grass" : revivedFlower ? "flower" : "ground"
        });

        if (revivedFlower) {
          storyState.flags.restoredFlowerCount =
            (storyState.flags.restoredFlowerCount || 0) + 1;
          onNaturePatchRevived({
            patch: revivedFlower,
            type: "flower"
          });
          habitatSystem?.recordEvent?.({
            type: HABITAT_EVENT.REVIVE_PATCH,
            targetId: "flower"
          });

          const restoredFlowerBedHabitat = getRestoredFlowerBedHabitat(
            revivedFlower,
            groundFlowerPatches
          );

          if (recordRestoredFlowerBedHabitat(storyState, restoredFlowerBedHabitat)) {
            pushNotice("You've restored a pretty flower bed habitat!", 3.6);
            habitatSystem?.recordEvent?.({
              type: HABITAT_EVENT.RESTORE_HABITAT,
              targetId: "pretty-flower-bed"
            });
            onFlowerHabitatRestored({
              groundCell: nearbyHarvestTarget.groundCell,
              revivedFlower,
              restoredFlowerBedHabitat
            });
            return true;
          }
        }

        if (revivedGrass && !storyState.flags.firstGrassRestored) {
          storyState.flags.firstGrassRestored = true;
          pushNotice("Dry grass restored.");
          onFirstGrassRestored();
          return true;
        }

        if (
          revivedGrass &&
          scheduleRustlingGrassEncounter(storyState, groundGrassPatches)
        ) {
          return true;
        }

        if (
          revivedFlower &&
          !storyState.flags.tangrowthFlowerCommentSeen &&
          (storyState.flags.restoredFlowerCount || 0) >= 2
        ) {
          storyState.flags.tangrowthFlowerCommentSeen = true;
          onFlowersRecovered();
          return true;
        }

        pushNotice("Ground restored.");
        return true;
      }

      if (forcedHarvestTarget?.groundCell) {
        return false;
      }
    }

    pushMissedHarvestNotice({ canPurifyGround, canUseLeafage, canUseFire });
    return false;
  }

  return {
    craftCampfireAtWorkbench,
    craftLeafDenKitAtWorkbench,
    craftStrawBedAtWorkbench,
    findNearbyActionTarget,
    performHarvestAction,
    performInteractAction,
    recordQuestEvent(event) {
      return questSystem?.emit?.(event) || { changed: false, completedQuestIds: [] };
    },
    resetRuntimeState
  };
}
