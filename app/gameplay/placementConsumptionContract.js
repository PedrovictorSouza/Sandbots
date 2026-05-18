export const PLACEMENT_CONSUMPTION_REASON = Object.freeze({
  READY: "ready",
  INACTIVE_PREVIEW: "inactive-preview",
  PREVIEW_NOT_READY: "preview-not-ready",
  INVALID_PLACEMENT: "invalid-placement",
  MISSING_ITEM: "missing-item"
});

function getInventoryCount(inventory, itemId) {
  return Math.max(0, Number(inventory?.[itemId] || 0));
}

export function resolvePlacementConsumptionDecision({
  preview = null,
  inventory = {},
  itemId = ""
} = {}) {
  if (!preview?.active) {
    return Object.freeze({
      shouldConsume: false,
      reason: PLACEMENT_CONSUMPTION_REASON.INACTIVE_PREVIEW
    });
  }

  if (!preview.readyForConfirm) {
    return Object.freeze({
      shouldConsume: false,
      reason: PLACEMENT_CONSUMPTION_REASON.PREVIEW_NOT_READY
    });
  }

  if (preview.valid === false) {
    return Object.freeze({
      shouldConsume: false,
      reason: PLACEMENT_CONSUMPTION_REASON.INVALID_PLACEMENT
    });
  }

  if (!itemId || getInventoryCount(inventory, itemId) <= 0) {
    return Object.freeze({
      shouldConsume: false,
      reason: PLACEMENT_CONSUMPTION_REASON.MISSING_ITEM
    });
  }

  return Object.freeze({
    shouldConsume: true,
    reason: PLACEMENT_CONSUMPTION_REASON.READY
  });
}
