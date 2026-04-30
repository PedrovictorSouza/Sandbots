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

export function getInventorySlotRole(item = {}) {
  return item.slotRole || "other";
}

export function getInventorySlotRoleLabel(item = {}) {
  const role = getInventorySlotRole(item);
  return item.slotRoleLabel || INVENTORY_SLOT_ROLE_LABELS[role] || INVENTORY_SLOT_ROLE_LABELS.other;
}

export function getInventoryPresentationOrder(inventory = {}, inventoryOrder = [], itemDefs = {}) {
  const orderIndexByItemId = new Map(
    inventoryOrder.map((itemId, index) => [itemId, index])
  );

  return inventoryOrder
    .filter((itemId) => (inventory[itemId] || 0) > 0)
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
