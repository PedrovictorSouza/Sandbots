import {
  INTERACTABLE_DEFS,
  NPC_DEFS,
  STORY_QUESTS,
  WORLD_REGIONS,
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
      bagOnboardingSeen: false
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

export function formatRequirementSummary(requirements = {}, inventory = {}) {
  return Object.entries(requirements)
    .map(([itemId, amount]) => `${getItemLabel(itemId)} ${inventory[itemId] || 0}/${amount}`)
    .join(" · ");
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
