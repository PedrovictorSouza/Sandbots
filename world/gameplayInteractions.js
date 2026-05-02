import {
  BOULDER_SHADED_TALL_GRASS_BOULDER_POSITION,
  BOULDER_SHADED_TALL_GRASS_RADIUS,
  CAMPFIRE_ITEM_ID,
  DITTO_FLAG_ITEM_ID,
  LEAF_DEN_KIT_ITEM_ID,
  LOG_CHAIR_ITEM_ID,
  STRAW_BED_ITEM_ID,
  STORY_QUESTS
} from "../gameplayContent.js";
import { QUEST_EVENT } from "../app/quest/questData.js";
import { HABITAT_EVENT } from "../app/sandbox/habitatData.js";
import {
  dropLeppaBerryFromTree,
  findNearbyLeafDen,
  findNearbyLeppaTree,
  reviveLeppaTree
} from "./islandWorld.js";

const BULBASAUR_RUSTLING_GRASS_RESTORE_COUNT = 4;
const BULBASAUR_DRY_GRASS_MISSION_RESTORE_COUNT = 10;
const BULBASAUR_RUSTLING_GRASS_DELAY = 5.5;
const LEAFAGE_TALL_GRASS_HABITAT_COUNT = 4;
const LEAFAGE_TALL_GRASS_GROUP_ID = "leafage-tall-grass-habitat-0";
const BOULDER_SHADED_TALL_GRASS_GROUP_ID = "boulder-shaded-tall-grass-habitat-0";
const LEAFAGE_GROUND_CELL_INTERACT_RADIUS_FACTOR = 0.82;

export function createGameplayInteractions({
  npcProfiles,
  placeholderRecipes,
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
  onCampfireCrafted = () => {},
  onCampfireSpitOutRequested = () => {},
  onStrawBedCrafted = () => {},
  onStrawBedPlacementRequested = () => {},
  onBulbasaurStrawBedRequestCompleted = () => {},
  onRuinedPokemonCenterInspectRequested = () => {},
  onPokemonCenterPcCheckRequested = () => {},
  onGroundItemCollected = () => {},
  onNaturePatchRevived = () => {},
  onTallGrassHabitatRestored = () => {},
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
  strikeNearbyPalm,
  waterNearbyPalm = () => ({
    hit: false,
    counted: false,
    challengeComplete: false,
    palm: null
  }),
  syncInventoryUi,
  pushNotice,
  questSystem = null,
  habitatSystem = null
}) {
  let nextWoodDropId = 1;

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

  function getBulbasaurHabitatPlacementTarget(playerPosition, groundGrassPatches, storyState) {
    const rustlingGrassCellId = storyState?.flags?.rustlingGrassCellId;
    const bulbasaurPatch = groundGrassPatches.find((groundGrassPatch) => {
      return (
        groundGrassPatch.cellId === rustlingGrassCellId &&
        groundGrassPatch.state === "alive"
      );
    });

    if (!bulbasaurPatch?.habitatGroupId) {
      return {
        canPlace: false,
        center: null,
        reason: "Bulbasaur's restored tall grass habitat is not ready."
      };
    }

    const habitatPatches = groundGrassPatches.filter((groundGrassPatch) => {
      return (
        groundGrassPatch.habitatGroupId === bulbasaurPatch.habitatGroupId &&
        groundGrassPatch.state === "alive" &&
        Array.isArray(groundGrassPatch.position)
      );
    });

    if (!habitatPatches.length) {
      return {
        canPlace: false,
        center: null,
        reason: "Bulbasaur's restored tall grass habitat is not ready."
      };
    }

    const bounds = habitatPatches.reduce((nextBounds, groundGrassPatch) => ({
      minX: Math.min(nextBounds.minX, groundGrassPatch.position[0]),
      maxX: Math.max(nextBounds.maxX, groundGrassPatch.position[0]),
      minZ: Math.min(nextBounds.minZ, groundGrassPatch.position[2]),
      maxZ: Math.max(nextBounds.maxZ, groundGrassPatch.position[2])
    }), {
      minX: Infinity,
      maxX: -Infinity,
      minZ: Infinity,
      maxZ: -Infinity
    });
    const center = [
      (bounds.minX + bounds.maxX) * 0.5,
      0.02,
      (bounds.minZ + bounds.maxZ) * 0.5
    ];
    const placementMargin = 1.75;
    const canPlace =
      playerPosition[0] >= bounds.minX - placementMargin &&
      playerPosition[0] <= bounds.maxX + placementMargin &&
      playerPosition[2] >= bounds.minZ - placementMargin &&
      playerPosition[2] <= bounds.maxZ + placementMargin;

    return {
      canPlace,
      center,
      reason: canPlace ? "" : "Move closer to Bulbasaur's restored tall grass habitat."
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

  function growLeafageGrassPatch(groundCell, groundGrassPatches, storyState) {
    if (!groundCell || hasPatchForGroundCell(groundCell.id, groundGrassPatches)) {
      return null;
    }

    const habitatGroupId = getLeafageGrassGroupId(groundCell, storyState);
    const patch = {
      id: `leafage-grass-${groundCell.id}`,
      cellId: groundCell.id,
      habitatGroupId,
      source: "leafage",
      position: [
        groundCell.offset[0],
        (groundCell.surfaceY || 0) + 0.02,
        groundCell.offset[2]
      ],
      size: [1.18, 0.96],
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
    return patch;
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

  function resetRuntimeState() {
    nextWoodDropId = 1;
  }

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
    pushNotice(`+${resourceNode.yield} ${getItemLabel(resourceNode.itemId)}`);
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
      storyState.flags.workbenchDiyRecipesReceived &&
      !storyState.flags.campfireCrafted
    ) {
      const campfireRecipe = placeholderRecipes.campfire;

      if (!hasItems(inventory, campfireRecipe.ingredients)) {
        pushNotice(`Missing: ${formatRequirementSummary(campfireRecipe.ingredients, inventory)}`);
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
      return true;
    }

    if (
      stationId === "workbench" &&
      storyState.flags.strawBedRecipeUnlocked &&
      !storyState.flags.strawBedCrafted
    ) {
      const strawBedRecipe = placeholderRecipes.strawBed;

      if (!hasItems(inventory, strawBedRecipe.ingredients)) {
        pushNotice(`Missing: ${formatRequirementSummary(strawBedRecipe.ingredients, inventory)}`);
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
      pushNotice(`Faltando: ${formatRequirementSummary(recipe.ingredients, inventory)}`);
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
        storyState.flags.campfireCrafted &&
        !storyState.flags.campfireSpatOut
      ) {
        if (!storyState.flags.campfireSelectedForTangrowth) {
          pushNotice("Open the bag with X and select the Campfire first.");
          return false;
        }

        onDialogueOpen();
        onCampfireSpitOutRequested({
          targetId: npcId
        });
        return true;
      }

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
            quest.resolveLine || "Tangrowth te apontou para o burrow e para a Aunty."
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
        "Tangrowth: keep moving. Aunty holds the home loop together."
      );
      return false;
    }

    if (npcId === "aunty") {
      if (quest.id === "meetAunty") {
        questSystem?.emit?.({
          type: QUEST_EVENT.TALK,
          targetId: npcId
        });
        advanceQuest(storyState, quest.resolveLine || "Aunty marcou a ponte e liberou o Workbench.");
        return true;
      }

      if (quest.id === "hostDinner") {
        storyState.flags.dinnerHosted = true;
        questSystem?.emit?.({
          type: QUEST_EVENT.TALK,
          targetId: npcId
        });
        advanceQuest(storyState, quest.resolveLine || "Grand Dinner concluido. Free-roam liberado.");
        return true;
      }

      pushNotice(
        npcProfile?.idleLine ||
        "Aunty: siga a rota ativa e volte quando o proximo marco estiver pronto."
      );
      return false;
    }

    if (npcId === "bufo") {
      if (quest.id === "meetBufo") {
        questSystem?.emit?.({
          type: QUEST_EVENT.TALK,
          targetId: npcId
        });
        advanceQuest(storyState, quest.resolveLine || "Bufo quer um Marsh Pie antes de liberar o blueprint.");
        return true;
      }

      pushNotice(npcProfile?.idleLine || "Bufo: sem o pie certo, o progresso para por aqui.");
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
          quest.resolveLine || "Willow marcou o repair kit final para o velho burrow."
        );
        return true;
      }

      pushNotice(npcProfile?.idleLine || "Willow: abra a trilha final e volte com o repair kit.");
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
        onDialogueOpen();
        onLeppaBerryGiftRequested({
          targetId
        });
        return true;
      }

      if (quest.id !== "findPokemon") {
        pushNotice("O Pokemon ferido nao e a prioridade atual.");
        return false;
      }

      const completeDiscovery = () => {
        questSystem?.emit?.({
          type: QUEST_EVENT.TALK,
          targetId
        });
        unlockPlayerAbility("waterGun");
        unlockPokedexReward();
        advanceQuest(
          storyState,
          quest.resolveLine || "Voce encontrou o Pokemon que Tangrowth ouviu."
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
        pushNotice("A ponte ainda nao e a prioridade atual.");
        return false;
      }

      if (!consumeItems(inventory, quest.delivery)) {
        pushNotice(`Faltando: ${formatRequirementSummary(quest.delivery, inventory)}`);
        return false;
      }

      storyState.flags.bridgeRepaired = true;
      syncInventoryUi(inventory);
      advanceQuest(storyState, "Ponte reparada. O sul agora leva ate Bufo.");
      return true;
    }

    if (targetId === "bufo") {
      if (quest.id !== "feedBufo") {
        pushNotice("Bufo ainda espera outra etapa antes da entrega.");
        return false;
      }

      if (!consumeItems(inventory, quest.delivery)) {
        pushNotice(`Faltando: ${formatRequirementSummary(quest.delivery, inventory)}`);
        return false;
      }

      storyState.flags.bufoFed = true;
      syncInventoryUi(inventory);
      advanceQuest(storyState, "Bufo liberou o blueprint da Granite Pickaxe.");
      return true;
    }

    if (targetId === "graniteGate") {
      if (quest.id !== "breakGate") {
        pushNotice("O granite gate ainda nao e o objetivo ativo.");
        return false;
      }

      if ((inventory.granitePickaxe || 0) <= 0) {
        pushNotice("Sem Granite Pickaxe, o gate continua fechado.");
        return false;
      }

      storyState.flags.graniteGateOpened = true;
      advanceQuest(storyState, "Granite gate quebrado. Willow ficou acessivel.");
      return true;
    }

    if (targetId === "burrowSite") {
      if (quest.id !== "repairBurrow") {
        pushNotice("O velho burrow ainda nao pode ser reparado.");
        return false;
      }

      if (!consumeItems(inventory, quest.delivery)) {
        pushNotice(`Faltando: ${formatRequirementSummary(quest.delivery, inventory)}`);
        return false;
      }

      storyState.flags.burrowFixed = true;
      syncInventoryUi(inventory);
      advanceQuest(storyState, "Burrow reparado. Volte para Aunty e feche a campanha.");
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
    groundPurifiedInstances = [],
    groundGrassPatches = [],
    groundFlowerPatches = [],
    canPurifyGround = false,
    canUseLeafage = false
  }) {
    const nearbyHarvestTarget = findNearbyHarvestTarget(
      playerPosition,
      palmModel,
      palmInstances,
      resourceNodes,
      storyState
    );
    const leppaTreeHeadbuttAvailable = Boolean(
      storyState?.flags?.leppaTreeRevived || leppaTree?.revived
    );
    const nearbyLeppaTree = (canPurifyGround || leppaTreeHeadbuttAvailable) ?
      findNearbyLeppaTree(playerPosition, leppaTree, storyState) :
      null;
    let nearestTarget = nearbyHarvestTarget;

    if (
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
      storyState?.flags?.strawBedCrafted &&
      storyState?.flags?.strawBedSelectedForBulbasaur &&
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
      storyState?.flags?.leafDenBuildAvailable &&
      storyState?.flags?.leafDenKitSelected &&
      !storyState?.flags?.leafDenKitPlaced &&
      (inventory?.[LEAF_DEN_KIT_ITEM_ID] || 0) > 0
    ) {
      return {
        leafDenKitPlacement: true,
        distance: 0
      };
    }

    if (
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

    if (nearbyLeppaTree) {
      return nearbyLeppaTree;
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

    if (!canPurifyGround) {
      return nearestTarget;
    }

    const nearbyGroundCell = findNearbyGroundCell(playerPosition, groundDeadInstances);
    if (!nearbyGroundCell) {
      return nearestTarget;
    }

    if (!nearestTarget || nearbyGroundCell.distance < nearestTarget.distance) {
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
    logChair = null,
    leafDen = null,
    timburrEncounter = null,
    charmanderEncounter = null,
    onNpcInteractionStart = () => {}
  }) {
    const getInteractionTargetPosition = (target) => {
      if (!target) {
        return null;
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

    const nearbyTarget = findNearbyInteractable(
      playerPosition,
      npcActors,
      interactables,
      storyState,
      groundGrassPatches,
      logChair,
      leafDen,
      timburrEncounter,
      charmanderEncounter
    );
    if (!nearbyTarget?.target) {
      pushNotice("Nothing to talk to nearby. Move closer to a marker or character, then press E.");
      return false;
    }

    const { target } = nearbyTarget;

    if (target.kind === "npc") {
      const onDialogueOpen = () => notifyInteractionStart(target);

      if (target.id === "bufo" && getActiveQuest(storyState).id === "feedBufo") {
        return handleDeliveryInteraction(target.id, storyState, inventory, onDialogueOpen);
      }

      return handleNpcInteraction(target.id, storyState, onDialogueOpen);
    }

    if (target.kind === "grassEncounter") {
      if (!storyState.flags.bulbasaurRevealed) {
        storyState.flags.bulbasaurRevealed = true;
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
        notifyInteractionStart(target);
        onTimburrRevealed({
          cellId: target.cellId
        });
      }
      return true;
    }

    if (target.kind === "bulbasaurMission") {
      notifyInteractionStart(target);
      storyState.flags.bulbasaurDryGrassMissionAccepted = true;
      if (
        (storyState.flags.restoredGrassCount || 0) >= BULBASAUR_DRY_GRASS_MISSION_RESTORE_COUNT
      ) {
        storyState.flags.bulbasaurDryGrassMissionComplete = true;
      }
      onBulbasaurDryGrassMissionAccepted();
      return true;
    }

    if (target.kind === "bulbasaurRequestComplete") {
      notifyInteractionStart(target);
      onBulbasaurDryGrassRequestCompleted();
      return true;
    }

    if (target.kind === "bulbasaurStrawBedRecipe") {
      notifyInteractionStart(target);
      onBulbasaurStrawBedRecipeRequested();
      return true;
    }

    if (target.kind === "bulbasaurStrawBedComplete") {
      notifyInteractionStart(target);
      onBulbasaurStrawBedRequestCompleted();
      return true;
    }

    if (target.kind === "leppaBerryGift") {
      notifyInteractionStart(target);
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
      onTimburrLeafDenFurnitureCompleteRequested({
        targetId: target.id
      });
      return true;
    }

    if (target.kind === "charmanderCelebrationRequest") {
      notifyInteractionStart(target);
      onCharmanderCelebrationSuggested({
        targetId: target.id
      });
      return true;
    }

    if (target.kind === "station") {
      return handleStationInteraction(target.id, storyState, inventory);
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
    groundFlowerPatches = [],
    groundPurifiedInstances = [],
    groundGrassPatches = [],
    canPurifyGround = false,
    canUseLeafage = false,
    useWaterGun = false,
    forcedHarvestTarget = null
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
      groundPurifiedInstances,
      groundGrassPatches,
      groundFlowerPatches,
      canPurifyGround,
      canUseLeafage
    });

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

    if (nearbyHarvestTarget?.leppaTree) {
      if (nearbyHarvestTarget.action === "water") {
        const revived = reviveLeppaTree(nearbyHarvestTarget.leppaTree, storyState);
        if (revived) {
          pushNotice("The dead tree perked back up.");
          return true;
        }
      }

      if (nearbyHarvestTarget.action === "headbutt") {
        const drop = dropLeppaBerryFromTree(
          nearbyHarvestTarget.leppaTree,
          leppaBerryDrops,
          storyState
        );

        if (drop) {
          pushNotice("A Leppa Berry fell from the tree.");
          return true;
        }

        pushNotice("The tree has already dropped its Leppa Berry.");
        return false;
      }
    }

    if (useWaterGun && nearbyHarvestTarget?.palm) {
      const wateredPalm = waterNearbyPalm(
        playerPosition,
        palmModel,
        palmInstances,
        storyState
      );

      if (!wateredPalm.hit) {
        return false;
      }

      if (wateredPalm.challengeComplete) {
        pushNotice("First set of challenges complete. Talk to Bulbasaur.");
      } else if (wateredPalm.counted) {
        const wateredTreeCount = Math.min(5, Number(storyState.flags.wateredTreeCount || 0));
        pushNotice(`Tree watered for Bulbasaur. ${wateredTreeCount}/5 trees watered.`);
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
        const leafageGrassPatch = growLeafageGrassPatch(
          leafageGroundCell,
          groundGrassPatches,
          storyState
        );

        if (leafageGrassPatch) {
          questSystem?.emit?.({
            type: QUEST_EVENT.PLACE,
            targetId: "leafy-home-patch"
          });
          onNaturePatchRevived({
            patch: leafageGrassPatch,
            type: "grass"
          });
          habitatSystem?.recordEvent?.({
            type: HABITAT_EVENT.REVIVE_PATCH,
            targetId: "grass"
          });

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

          pushNotice("Leafage grew tall grass.");
          return true;
        }
      }

      const nearbyDryGroundCell = findNearbyGroundCell(playerPosition, groundDeadInstances);
      if (nearbyDryGroundCell?.groundCell) {
        pushNotice("Leafage needs restored ground. Use Water Gun here first.");
        return false;
      }
    }

    if (nearbyHarvestTarget?.groundCell) {
      const purified = purifyGroundCell(
        nearbyHarvestTarget.groundCell,
        groundDeadInstances,
        groundPurifiedInstances
      );

      if (purified) {
        questSystem?.emit?.({
          type: QUEST_EVENT.BUILD,
          targetId: "revived-habitat"
        });

        const revivedGrass = reviveGroundGrass(
          nearbyHarvestTarget.groundCell,
          groundGrassPatches
        );

        if (revivedGrass) {
          storyState.flags.restoredGrassCount =
            (storyState.flags.restoredGrassCount || 0) + 1;
          if (
            storyState.flags.bulbasaurDryGrassMissionAccepted &&
            storyState.flags.restoredGrassCount >= BULBASAUR_DRY_GRASS_MISSION_RESTORE_COUNT
          ) {
            storyState.flags.bulbasaurDryGrassMissionComplete = true;
          }
          questSystem?.emit?.({
            type: QUEST_EVENT.BUILD,
            targetId: "revived-grass"
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
            return true;
          }
        }

        if (revivedGrass && !storyState.flags.firstGrassRestored) {
          storyState.flags.firstGrassRestored = true;
          pushNotice("You've restored a dead grass!");
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

        pushNotice("Chao purificado.");
        return true;
      }

      if (forcedHarvestTarget?.groundCell) {
        return false;
      }
    }

    const palmStrike = strikeNearbyPalm(
      playerPosition,
      palmModel,
      palmInstances,
      woodDrops,
      nextWoodDropId
    );
    if (!palmStrike.hit) {
      pushNotice(
        canPurifyGround ?
          "No target in range. Move closer to dry ground, grass, a tree, or a marker, then press Enter." :
          canUseLeafage ?
            "No target in range. Move closer to clear ground, then press Enter to use Leafage." :
          "No resource in range. Move closer to a tree or drop, then press Enter."
      );
      return false;
    }

    nextWoodDropId = palmStrike.nextWoodDropId;
    pushNotice(
      palmStrike.felled ?
        "Palmeira derrubada. Pegue os drops de Wood." :
        `Golpe ${palmStrike.palm.hitCount}/5 na palmeira.`
    );
    return true;
  }

  return {
    findNearbyActionTarget,
    performHarvestAction,
    performInteractAction,
    recordQuestEvent(event) {
      return questSystem?.emit?.(event) || { changed: false, completedQuestIds: [] };
    },
    resetRuntimeState
  };
}
