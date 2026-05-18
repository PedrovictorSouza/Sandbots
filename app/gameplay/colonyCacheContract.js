import { ITEM_DEFS } from "../../gameplayContent.js";
import {
  getResourcePurposeByItemId,
  listEarlyResourcePurposes
} from "../story/resourcePurposeCatalog.js";

export const COLONY_CACHE_ID = "colony-cache";

export const COLONY_CACHE_ITEM_GROUP = Object.freeze({
  MATERIALS: "materials",
  PLACEABLES: "placeables",
  TOOLS: "tools",
  STORY: "story",
  OTHER: "other"
});

function classifyCacheItem(itemDef, purposeEntry) {
  if (itemDef?.slotRole === "material") {
    return COLONY_CACHE_ITEM_GROUP.MATERIALS;
  }

  if (itemDef?.slotRole === "placeable") {
    return COLONY_CACHE_ITEM_GROUP.PLACEABLES;
  }

  if (itemDef?.slotRole === "key" || purposeEntry?.purposes?.includes("tool")) {
    return COLONY_CACHE_ITEM_GROUP.TOOLS;
  }

  if (itemDef?.slotRole === "gift" || itemDef?.slotRole === "recipe" || purposeEntry?.purposes?.includes("story")) {
    return COLONY_CACHE_ITEM_GROUP.STORY;
  }

  return COLONY_CACHE_ITEM_GROUP.OTHER;
}

function createCacheItem(itemId, quantity, itemDefs, purposeEntry) {
  const itemDef = itemDefs[itemId] || { id: itemId, label: itemId };
  const group = classifyCacheItem(itemDef, purposeEntry);

  return Object.freeze({
    itemId,
    label: itemDef.bagLabel || itemDef.label || itemId,
    quantity,
    group,
    purposes: Object.freeze([...(purposeEntry?.purposes || [])]),
    purposeText: purposeEntry?.playerFacingPurpose || ""
  });
}

export function createColonyCacheState({
  inventory = {},
  itemDefs = ITEM_DEFS,
  purposeCatalog = listEarlyResourcePurposes()
} = {}) {
  const purposeByItemId = new Map(purposeCatalog.map((entry) => [entry.itemId, entry]));
  const storedItems = Object.entries(inventory)
    .filter(([, quantity]) => Number(quantity || 0) > 0)
    .filter(([itemId]) => !itemDefs[itemId]?.hiddenFromInventory)
    .map(([itemId, quantity]) => createCacheItem(
      itemId,
      Number(quantity),
      itemDefs,
      purposeByItemId.get(itemId) || getResourcePurposeByItemId(itemId)
    ));

  const groupCounts = Object.freeze(storedItems.reduce((counts, item) => {
    counts[item.group] = (counts[item.group] || 0) + item.quantity;
    return counts;
  }, {}));

  return Object.freeze({
    id: COLONY_CACHE_ID,
    label: "Colony Cache",
    storedItems: Object.freeze(storedItems),
    groupCounts,
    totalItems: storedItems.reduce((sum, item) => sum + item.quantity, 0)
  });
}

export function validateColonyCacheState(cacheState) {
  const errors = [];
  const ids = new Set();
  const groups = new Set(Object.values(COLONY_CACHE_ITEM_GROUP));

  if (cacheState?.id !== COLONY_CACHE_ID) {
    errors.push({ type: "invalid-cache-id", cacheId: cacheState?.id || null });
  }

  if (!Array.isArray(cacheState?.storedItems)) {
    errors.push({ type: "missing-stored-items" });
    return Object.freeze(errors);
  }

  cacheState.storedItems.forEach((item, index) => {
    if (!item?.itemId) {
      errors.push({ type: "missing-item-id", index });
      return;
    }

    if (ids.has(item.itemId)) {
      errors.push({ type: "duplicate-item-id", itemId: item.itemId, index });
    }
    ids.add(item.itemId);

    if (!item.label) {
      errors.push({ type: "missing-item-label", itemId: item.itemId, index });
    }

    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      errors.push({ type: "invalid-item-quantity", itemId: item.itemId, quantity: item.quantity, index });
    }

    if (!groups.has(item.group)) {
      errors.push({ type: "unknown-item-group", itemId: item.itemId, group: item.group, index });
    }
  });

  return Object.freeze(errors.map((error) => Object.freeze(error)));
}
