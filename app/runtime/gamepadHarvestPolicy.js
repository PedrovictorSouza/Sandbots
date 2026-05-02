const GAMEPAD_BAG_PLACEMENT_TARGET_KEYS = Object.freeze([
  "logChairPlacement",
  "strawBedPlacement",
  "leafDenKitPlacement",
  "leafDenFurniturePlacement",
  "dittoFlagPlacement"
]);

export function isGamepadBagPlacementTarget(activeHarvestTarget) {
  if (!activeHarvestTarget) {
    return false;
  }

  return GAMEPAD_BAG_PLACEMENT_TARGET_KEYS.some((targetKey) => {
    return Boolean(activeHarvestTarget[targetKey]);
  });
}

export function shouldGamepadSourceHarvestTarget({
  source = null,
  activeHarvestTarget = null
} = {}) {
  if (!activeHarvestTarget) {
    return false;
  }

  if (source === "gamepadBag") {
    return isGamepadBagPlacementTarget(activeHarvestTarget);
  }

  return true;
}
