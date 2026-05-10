const INVENTORY_SLOT_ROLE_PRIORITY = Object.freeze({
  placeable: 0,
  tool: 1,
  recipe: 2,
  material: 3,
  gift: 4,
  food: 5,
  currency: 6,
  key: 7,
  other: 8
});

const INVENTORY_SLOT_ROLE_LABELS = Object.freeze({
  placeable: "Place",
  tool: "Tool",
  recipe: "Recipe",
  material: "Mat",
  gift: "Gift",
  food: "Food",
  currency: "Coins",
  key: "Key",
  other: "Item"
});

const FOLLOWER_SUPPLY_EXCLUDED_ITEM_IDS = new Set([
  "bulbasaur",
  "bulbasaurFollowing",
  "charmander",
  "charmanderFollowing",
  "squirtle",
  "squirtleFollowing",
  "timburr",
  "timburrFollowing"
]);

function normalizeExclusionSet(value) {
  if (!value) {
    return null;
  }

  return value instanceof Set ? value : new Set(value);
}

export function getInventorySlotRole(item = {}) {
  return item.slotRole || "other";
}

export function getInventorySlotRoleLabel(item = {}) {
  const role = getInventorySlotRole(item);
  return item.slotRoleLabel || INVENTORY_SLOT_ROLE_LABELS[role] || INVENTORY_SLOT_ROLE_LABELS.other;
}

export function getInventoryPresentationOrder(
  inventory = {},
  inventoryOrder = [],
  itemDefs = {},
  options = {}
) {
  const orderIndexByItemId = new Map(
    inventoryOrder.map((itemId, index) => [itemId, index])
  );
  const excludedItemIds = normalizeExclusionSet(options.excludedItemIds);
  const excludedRoles = normalizeExclusionSet(options.excludedRoles);

  return inventoryOrder
    .filter((itemId) => {
      const item = itemDefs[itemId] || {};
      const role = getInventorySlotRole(item);
      return (
        (inventory[itemId] || 0) > 0 &&
        !excludedItemIds?.has(itemId) &&
        !excludedRoles?.has(role) &&
        !FOLLOWER_SUPPLY_EXCLUDED_ITEM_IDS.has(itemId) &&
        !itemId.endsWith("Following") &&
        role !== "companion" &&
        role !== "pokemon"
      );
    })
    .sort((leftItemId, rightItemId) => {
      const leftItem = itemDefs[leftItemId] || {};
      const rightItem = itemDefs[rightItemId] || {};
      const leftRole = getInventorySlotRole(leftItem);
      const rightRole = getInventorySlotRole(rightItem);
      const leftPriority = INVENTORY_SLOT_ROLE_PRIORITY[leftRole] ?? INVENTORY_SLOT_ROLE_PRIORITY.other;
      const rightPriority = INVENTORY_SLOT_ROLE_PRIORITY[rightRole] ?? INVENTORY_SLOT_ROLE_PRIORITY.other;

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      return (orderIndexByItemId.get(leftItemId) ?? 0) - (orderIndexByItemId.get(rightItemId) ?? 0);
    });
}
