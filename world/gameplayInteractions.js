import { STORY_QUESTS } from "../gameplayContent.js";
import {
  FLOWER_BED_POKEDEX_ENTRY_ID,
  TALL_GRASS_POKEDEX_ENTRY_ID
} from "../pokedexEntries.js";

export function createGameplayInteractions({
  npcProfiles,
  placeholderRecipes,
  startDialogue = null,
  unlockPlayerAbility = () => {},
  unlockPokedexReward = () => {},
  showPokedexEntry = () => {},
  onFirstGrassRestored = () => {},
  onFlowersRecovered = () => {},
  onBulbasaurRevealed = () => {},
  onGroundItemCollected = () => {},
  onNaturePatchRevived = () => {},
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
  syncInventoryUi,
  pushNotice
}) {
  let nextWoodDropId = 1;

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
    pushNotice(`+${resourceNode.yield} ${getItemLabel(resourceNode.itemId)}`);
  }

  function handleStationInteraction(stationId, storyState, inventory) {
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
    advanceQuest(storyState, `${recipe.title} pronto.`);
    return true;
  }

  function handleNpcInteraction(npcId, storyState, onDialogueOpen = () => {}) {
    const quest = getActiveQuest(storyState);
    const npcProfile = npcProfiles[npcId];

    if (npcId === "tangrowth") {
      if (quest.id === "meetTangrowth") {
        const completeOnboarding = () => {
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
        advanceQuest(storyState, quest.resolveLine || "Aunty marcou a ponte e liberou o Workbench.");
        return true;
      }

      if (quest.id === "hostDinner") {
        storyState.flags.dinnerHosted = true;
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
        advanceQuest(storyState, quest.resolveLine || "Bufo quer um Marsh Pie antes de liberar o blueprint.");
        return true;
      }

      pushNotice(npcProfile?.idleLine || "Bufo: sem o pie certo, o progresso para por aqui.");
      return false;
    }

    if (npcId === "willow") {
      if (quest.id === "meetWillow") {
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
      if (quest.id !== "findPokemon") {
        pushNotice("O Pokemon ferido nao e a prioridade atual.");
        return false;
      }

      const completeDiscovery = () => {
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
    storyState,
    groundDeadInstances = [],
    canPurifyGround = false
  }) {
    const nearbyHarvestTarget = findNearbyHarvestTarget(
      playerPosition,
      palmModel,
      palmInstances,
      resourceNodes,
      storyState
    );

    if (!canPurifyGround) {
      return nearbyHarvestTarget;
    }

    const nearbyGroundCell = findNearbyGroundCell(playerPosition, groundDeadInstances);
    if (!nearbyGroundCell) {
      return nearbyHarvestTarget;
    }

    if (!nearbyHarvestTarget || nearbyGroundCell.distance < nearbyHarvestTarget.distance) {
      return nearbyGroundCell;
    }

    return nearbyHarvestTarget;
  }

  function performInteractAction({
    playerPosition,
    npcActors,
    interactables,
    storyState,
    inventory,
    groundGrassPatches = [],
    onNpcInteractionStart = () => {}
  }) {
    const nearbyTarget = findNearbyInteractable(
      playerPosition,
      npcActors,
      interactables,
      storyState,
      groundGrassPatches
    );
    if (!nearbyTarget?.target) {
      pushNotice("Nada para interagir por perto.");
      return false;
    }

    const { target } = nearbyTarget;

    if (target.kind === "npc") {
      const onDialogueOpen = () => onNpcInteractionStart({
        targetId: target.id,
        playerPosition,
        npcActors,
        interactables
      });

      if (target.id === "bufo" && getActiveQuest(storyState).id === "feedBufo") {
        return handleDeliveryInteraction(target.id, storyState, inventory, onDialogueOpen);
      }

      return handleNpcInteraction(target.id, storyState, onDialogueOpen);
    }

    if (target.kind === "grassEncounter") {
      if (!storyState.flags.bulbasaurRevealed) {
        storyState.flags.bulbasaurRevealed = true;
        onBulbasaurRevealed({
          cellId: target.cellId
        });
      }
      return true;
    }

    if (target.kind === "station") {
      return handleStationInteraction(target.id, storyState, inventory);
    }

    return handleDeliveryInteraction(target.id, storyState, inventory, () => onNpcInteractionStart({
      targetId: target.id,
      playerPosition,
      npcActors,
      interactables
    }));
  }

  function performHarvestAction({
    playerPosition,
    palmModel,
    palmInstances,
    resourceNodes,
    inventory,
    storyState,
    woodDrops,
    groundDeadInstances = [],
    groundFlowerPatches = [],
    groundPurifiedInstances = [],
    groundGrassPatches = [],
    canPurifyGround = false
  }) {
    const nearbyHarvestTarget = findNearbyActionTarget({
      playerPosition,
      palmModel,
      palmInstances,
      resourceNodes,
      storyState,
      groundDeadInstances,
      canPurifyGround
    });

    if (nearbyHarvestTarget?.resourceNode) {
      harvestResourceNode(nearbyHarvestTarget.resourceNode, inventory);
      return true;
    }

    if (nearbyHarvestTarget?.groundCell) {
      const purified = purifyGroundCell(
        nearbyHarvestTarget.groundCell,
        groundDeadInstances,
        groundPurifiedInstances
      );

      if (purified) {
        const revivedGrass = reviveGroundGrass(
          nearbyHarvestTarget.groundCell,
          groundGrassPatches
        );

        if (revivedGrass) {
          storyState.flags.restoredGrassCount =
            (storyState.flags.restoredGrassCount || 0) + 1;
          onNaturePatchRevived({
            patch: revivedGrass,
            type: "grass"
          });
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
        }

        if (revivedGrass && !storyState.flags.firstGrassRestored) {
          storyState.flags.firstGrassRestored = true;
          pushNotice("You've restored a dead grass!");
          showPokedexEntry(FLOWER_BED_POKEDEX_ENTRY_ID);
          onFirstGrassRestored();
          return true;
        }

        if (
          revivedGrass &&
          !storyState.flags.tallGrassDiscovered &&
          (storyState.flags.restoredGrassCount || 0) >= 4
        ) {
          storyState.flags.tallGrassDiscovered = true;
          storyState.flags.rustlingGrassCellId = nearbyHarvestTarget.groundCell.id;
          showPokedexEntry(TALL_GRASS_POKEDEX_ENTRY_ID);
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
          "Nenhum recurso ou chao corrompido na area." :
          "Nenhum recurso na area."
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
    resetRuntimeState
  };
}
