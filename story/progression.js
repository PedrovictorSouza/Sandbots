import {
  INTERACTABLE_DEFS,
  NPC_DEFS,
  STORY_QUESTS,
  WORLD_REGIONS,
  getCreatureById,
  getHomeById,
  getItemLabel
} from "../gameplayContent.js";

export function createStoryState() {
  return {
    questIndex: 0,
    flags: {
      bridgeRepaired: false,
      bufoFed: false,
      pickaxeCrafted: false,
      graniteGateOpened: false,
      burrowFixed: false,
      dinnerHosted: false,
      firstGrassRestored: false,
      restoredGrassCount: 0,
      tallGrassDiscovered: false,
      rustlingGrassCellId: null,
      tangrowthTallGrassCommentSeen: false,
      restoredFlowerCount: 0,
      tangrowthFlowerCommentSeen: false,
      bulbasaurRevealed: false,
      squirtleLeppaRequestAvailable: false,
      leppaTreeRevived: false,
      leppaBerryDropped: false,
      leppaBerryCollected: false,
      leppaBerryGiftComplete: false,
      tangrowthLogChairRequestAvailable: false,
      logChairReceived: false,
      logChairPlaced: false,
      logChairSat: false,
      bulbasaurWorkbenchGuideAvailable: false,
      workbenchDiyRecipesReceived: false,
      campfireCrafted: false,
      campfireSelectedForTangrowth: false,
      campfireSpatOut: false,
      leafageTallGrassCount: 0,
      leafageTallGrassHabitatCreated: false,
      charmanderRustlingGrassCellId: null,
      charmanderRevealed: false,
      charmanderFollowing: false,
      charmanderCampfireLit: false,
      pokemonCenterGuideStarted: false,
      pokemonCenterGuideFlightStarted: false,
      ruinedPokemonCenterInspected: false,
      challengesUnlocked: false,
      boulderChallengeAvailable: false,
      boulderShadedTallGrassCount: 0,
      boulderShadedTallGrassHabitatCreated: false,
      timburrRustlingGrassCellId: null,
      timburrRevealed: false,
      boulderChallengeRewardReady: false,
      boulderChallengeRewardClaimed: false,
      bulbasaurStrawBedChallengeAvailable: false,
      wateredTreeCount: 0,
      sturdySticksGatheredForChallenge: 0,
      bulbasaurStrawBedChallengeComplete: false,
      bulbasaurStrawBedChallengeCompletionNoticePending: false,
      strawBedRecipeUnlocked: false,
      strawBedCrafted: false,
      strawBedSelectedForBulbasaur: false,
      strawBedPlacedInBulbasaurHabitat: false,
      bulbasaurStrawBedRequestComplete: false,
      newPcChallengesAvailable: false,
      newPcChallengesChecked: false,
      tangrowthHouseTalkAvailable: false,
      tangrowthHouseTalkComplete: false,
      leafDenKitPurchaseAvailable: false,
      leafDenKitPurchased: false,
      leafDenBuildAvailable: false,
      leafDenKitSelected: false,
      leafDenKitPlaced: false,
      leafDenConstructionStarted: false,
      leafDenConstructionStartedAt: 0,
      leafDenConstructionCompletesAt: 0,
      leafDenBuilt: false,
      leafDenFurnitureRequestAvailable: false,
      leafDenInteriorEntered: false,
      leafDenFurniturePlacedCount: 0,
      leafDenFurnitureRequestComplete: false,
      charmanderCelebrationRequestAvailable: false,
      charmanderCelebrationSuggested: false,
      charmanderCelebrationComplete: false,
      dittoFlagReceived: false,
      dittoFlagSelectedForHouse: false,
      dittoFlagPlacedOnHouse: false,
      chopperSecondTalkApproachSeen: false
    }
  };
}

export function getActiveQuest(storyState) {
  return STORY_QUESTS[Math.min(storyState.questIndex, STORY_QUESTS.length - 1)];
}

export function hasItems(inventory, requirements = {}) {
  return Object.entries(requirements).every(([itemId, amount]) => (inventory[itemId] || 0) >= amount);
}

export function addItems(inventory, output = {}) {
  for (const [itemId, amount] of Object.entries(output)) {
    inventory[itemId] = (inventory[itemId] || 0) + amount;
  }
}

export function consumeItems(inventory, requirements = {}) {
  if (!hasItems(inventory, requirements)) {
    return false;
  }

  for (const [itemId, amount] of Object.entries(requirements)) {
    inventory[itemId] = Math.max(0, (inventory[itemId] || 0) - amount);
  }

  return true;
}

export function depositOneConstructionMaterial(
  inventory = {},
  depositedMaterials = {},
  requirements = {},
  itemId
) {
  const required = Math.max(0, Math.floor(Number(requirements[itemId] || 0)));
  if (!itemId || required <= 0) {
    return { ok: false, reason: "not-required", itemId };
  }

  const deposited = Math.max(0, Math.floor(Number(depositedMaterials[itemId] || 0)));
  if (deposited >= required) {
    return { ok: false, reason: "already-complete", itemId };
  }

  const current = Math.max(0, Math.floor(Number(inventory[itemId] || 0)));
  if (current <= 0) {
    return { ok: false, reason: "missing-material", itemId };
  }

  inventory[itemId] = current - 1;
  depositedMaterials[itemId] = deposited + 1;

  return {
    ok: true,
    reason: "deposited",
    itemId,
    current: inventory[itemId],
    deposited: depositedMaterials[itemId],
    required
  };
}

export function depositConstructionMaterialStack(
  inventory = {},
  depositedMaterials = {},
  requirements = {},
  itemId
) {
  const required = Math.max(0, Math.floor(Number(requirements[itemId] || 0)));
  if (!itemId || required <= 0) {
    return { ok: false, reason: "not-required", itemId };
  }

  const deposited = Math.max(0, Math.floor(Number(depositedMaterials[itemId] || 0)));
  if (deposited >= required) {
    return { ok: false, reason: "already-complete", itemId };
  }

  const current = Math.max(0, Math.floor(Number(inventory[itemId] || 0)));
  if (current <= 0) {
    return { ok: false, reason: "missing-material", itemId };
  }

  const amount = Math.min(current, required - deposited);
  inventory[itemId] = current - amount;
  depositedMaterials[itemId] = deposited + amount;

  return {
    ok: true,
    reason: "deposited",
    itemId,
    amount,
    current: inventory[itemId],
    deposited: depositedMaterials[itemId],
    required
  };
}

export function depositConstructionMaterialsAll(
  inventory = {},
  depositedMaterials = {},
  requirements = {}
) {
  const rows = Object.entries(requirements).map(([itemId, amount]) => {
    const required = Math.max(0, Math.floor(Number(amount || 0)));
    const deposited = Math.max(0, Math.floor(Number(depositedMaterials[itemId] || 0)));
    const current = Math.max(0, Math.floor(Number(inventory[itemId] || 0)));
    const missing = Math.max(0, required - deposited);

    return {
      itemId,
      current,
      deposited,
      missing,
      required
    };
  }).filter((row) => row.required > 0);

  const missingMaterials = rows
    .filter((row) => row.current < row.missing)
    .map((row) => ({
      itemId: row.itemId,
      current: row.current,
      missing: row.missing,
      deposited: row.deposited,
      required: row.required
    }));

  if (missingMaterials.length > 0) {
    return {
      ok: false,
      reason: "missing-materials",
      missingMaterials
    };
  }

  const depositedItems = [];
  let amount = 0;
  for (const row of rows) {
    if (row.missing <= 0) {
      continue;
    }

    inventory[row.itemId] = row.current - row.missing;
    depositedMaterials[row.itemId] = row.deposited + row.missing;
    amount += row.missing;
    depositedItems.push({
      itemId: row.itemId,
      amount: row.missing,
      current: inventory[row.itemId],
      deposited: depositedMaterials[row.itemId],
      required: row.required
    });
  }

  if (amount <= 0) {
    return {
      ok: false,
      reason: "already-complete"
    };
  }

  return {
    ok: true,
    reason: "deposited",
    amount,
    depositedItems
  };
}

export function validateConstructionMaterialsReady(requirements = {}, depositedMaterials = {}) {
  const missingMaterials = Object.entries(requirements)
    .map(([itemId, amount]) => {
      const required = Math.max(0, Math.floor(Number(amount || 0)));
      const deposited = Math.max(0, Math.floor(Number(depositedMaterials[itemId] || 0)));

      return {
        itemId,
        deposited,
        missing: Math.max(0, required - deposited),
        required
      };
    })
    .filter((row) => row.required > 0 && row.missing > 0);

  if (missingMaterials.length > 0) {
    return {
      ok: false,
      reason: "missing-materials",
      missingMaterials
    };
  }

  return {
    ok: true,
    reason: "ready"
  };
}

export function validateCreatureSpecialtiesReady(
  requiredSpecialties = [],
  {
    followingCreatureIds = [],
    nearbyCreatureIds = []
  } = {}
) {
  const candidateEntries = [];
  const seenCreatureIds = new Set();

  for (const creatureId of followingCreatureIds) {
    if (!creatureId || seenCreatureIds.has(creatureId)) {
      continue;
    }

    seenCreatureIds.add(creatureId);
    candidateEntries.push({
      creatureId,
      source: "following"
    });
  }

  for (const creatureId of nearbyCreatureIds) {
    if (!creatureId || seenCreatureIds.has(creatureId)) {
      continue;
    }

    seenCreatureIds.add(creatureId);
    candidateEntries.push({
      creatureId,
      source: "nearby"
    });
  }

  const candidates = candidateEntries
    .map((entry) => ({
      ...entry,
      creature: getCreatureById(entry.creatureId)
    }))
    .filter((entry) => entry.creature);

  const specialties = [...new Set(requiredSpecialties.filter(Boolean))];
  const satisfiedSpecialties = [];
  const missingSpecialties = [];

  for (const specialty of specialties) {
    const match = candidates.find((entry) => entry.creature.specialties.includes(specialty));
    if (match) {
      satisfiedSpecialties.push({
        specialty,
        creatureId: match.creatureId,
        source: match.source
      });
    } else {
      missingSpecialties.push({
        specialty
      });
    }
  }

  return {
    ok: missingSpecialties.length === 0,
    reason: missingSpecialties.length === 0 ? "ready" : "missing-specialties",
    satisfiedSpecialties,
    missingSpecialties
  };
}

export function getCreatureHomeIdleTarget(storyState = {}, creatureId, homes = {}) {
  const homeId = storyState.flags?.creatureHomeAssignments?.[creatureId] || null;
  if (!homeId) {
    return null;
  }

  const home = homes[homeId];
  if (!Array.isArray(home?.position)) {
    return null;
  }

  return {
    creatureId,
    homeId,
    position: [...home.position]
  };
}

export function getCreatureHomePreferenceStatus(storyState = {}, creatureId) {
  const creature = getCreatureById(creatureId);
  if (!creature) {
    return {
      ok: false,
      reason: "missing-creature",
      creatureId
    };
  }

  const currentHomeId = storyState.flags?.creatureHomeAssignments?.[creatureId] || creature.currentHomeId || null;
  if (!currentHomeId) {
    return {
      ok: false,
      reason: "no-home",
      creatureId,
      idealHabitat: creature.idealHabitat
    };
  }

  const home = getHomeById(currentHomeId);
  if (!home) {
    return {
      ok: false,
      reason: "missing-home",
      creatureId,
      currentHomeId,
      idealHabitat: creature.idealHabitat
    };
  }

  const matches = home.habitatType === creature.idealHabitat;
  return {
    ok: matches,
    reason: matches ? "matching-habitat" : "mismatched-habitat",
    creatureId,
    currentHomeId,
    homeHabitat: home.habitatType,
    idealHabitat: creature.idealHabitat
  };
}

export function getCreatureComfortBonusContext(storyState = {}, creatureId) {
  const preference = getCreatureHomePreferenceStatus(storyState, creatureId);

  return {
    creatureId,
    currentHomeId: preference.currentHomeId || null,
    idealHabitat: preference.idealHabitat || null,
    homeHabitat: preference.homeHabitat || null,
    bonusEligible: Boolean(preference.ok),
    bonusReason: preference.reason
  };
}

export const COZY_IDLE_BEHAVIOR = Object.freeze({
  SLEEP: "sleep",
  SIT: "sit",
  WANDER: "wander",
  STAY_NEAR: "stay-near"
});

const COZY_OBJECT_BEHAVIOR = Object.freeze({
  bed: COZY_IDLE_BEHAVIOR.SLEEP,
  chair: COZY_IDLE_BEHAVIOR.SIT,
  floor: COZY_IDLE_BEHAVIOR.WANDER,
  campfire: COZY_IDLE_BEHAVIOR.STAY_NEAR
});

export function getCreatureCozyIdleOptions({
  furnitureItems = []
} = {}) {
  const options = [
    {
      behavior: COZY_IDLE_BEHAVIOR.WANDER,
      targetKind: "floor",
      targetId: null
    }
  ];

  for (const item of furnitureItems) {
    const behavior = COZY_OBJECT_BEHAVIOR[item?.kind];
    if (!behavior) {
      continue;
    }

    options.push({
      behavior,
      targetKind: item.kind,
      targetId: item.id || null
    });
  }

  return options;
}

export function chooseCreatureCozyIdleBehavior({
  creatureId,
  furnitureItems = [],
  random = Math.random
} = {}) {
  const options = getCreatureCozyIdleOptions({ furnitureItems });
  const index = Math.min(
    options.length - 1,
    Math.max(0, Math.floor(random() * options.length))
  );

  return {
    creatureId,
    ...options[index]
  };
}

export function formatRequirementSummary(requirements = {}, inventory = {}) {
  return Object.entries(requirements)
    .map(([itemId, amount]) => `${getItemLabel(itemId)} ${inventory[itemId] || 0}/${amount}`)
    .join(" · ");
}

export function getConstructionMaterialRows(requirements = {}, inventory = {}, depositedMaterials = {}) {
  return Object.entries(requirements).map(([itemId, amount]) => ({
    itemId,
    label: getItemLabel(itemId),
    current: inventory[itemId] || 0,
    deposited: depositedMaterials[itemId] || 0,
    required: amount
  }));
}

export function formatConstructionMaterialsSummary(
  constructionName,
  requirements = {},
  inventory = {},
  depositedMaterials = {}
) {
  const name = typeof constructionName === "string" && constructionName.trim() ?
    constructionName.trim() :
    "Construction";
  const materials = getConstructionMaterialRows(requirements, inventory, depositedMaterials)
    .map((material) => {
      const deposited = material.deposited > 0 ? `, deposited ${material.deposited}/${material.required}` : "";
      return `${material.label} ${material.current}/${material.required}${deposited}`;
    })
    .join(" · ");

  return materials ? `${name} materials: ${materials}` : `${name} materials: none`;
}

export function getWorldLabelById(targetId) {
  const npc = NPC_DEFS.find((entry) => entry.id === targetId);
  if (npc) {
    return npc.label;
  }

  const interactable = INTERACTABLE_DEFS.find((entry) => entry.id === targetId);
  if (interactable) {
    return interactable.label;
  }

  return targetId;
}

export function formatDifficulty(quest) {
  return `Threat ${quest.difficulty || 1}/5`;
}

export function getRegionForPosition(position) {
  const [x,, z] = position;

  return WORLD_REGIONS.find((region) => {
    return x >= region.minX && x <= region.maxX && z >= region.minZ && z <= region.maxZ;
  }) || WORLD_REGIONS[0];
}

export function getQuestProgressDescriptor(quest) {
  if (quest.requirements) {
    return {
      kind: "requirements",
      payload: quest.requirements
    };
  }

  if (quest.delivery) {
    return {
      kind: "delivery",
      payload: quest.delivery
    };
  }

  if (quest.targetId) {
    return {
      kind: "target",
      payload: quest.targetId
    };
  }

  return {
    kind: "default",
    payload: null
  };
}

export function buildQuestProgressCopy(questProgressDescriptor, inventory) {
  switch (questProgressDescriptor.kind) {
    case "requirements":
    case "delivery":
      return formatRequirementSummary(questProgressDescriptor.payload, inventory);
    case "target":
      return `Alvo: ${getWorldLabelById(questProgressDescriptor.payload)}`;
    default:
      return "Livre exploracao";
  }
}
