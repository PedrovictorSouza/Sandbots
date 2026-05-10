import { getInventoryPresentationOrder } from "../ui/inventoryPresentation.js";

export function createBagUiRuntime({
  gameplayUiVisibility,
  inventory,
  inventoryOrder,
  itemDefs,
  isBagDetailItemId
}) {
  let bagOverlayActive = false;
  let restoreQuestAfterBagOverlay = false;
  let selectedBagItemId = null;

  function beginOverlay() {
    if (bagOverlayActive) {
      return;
    }

    restoreQuestAfterBagOverlay = gameplayUiVisibility.isSectionVisible("quest");
    gameplayUiVisibility.hideSections(["quest"]);
    bagOverlayActive = true;
  }

  function endOverlay() {
    if (!bagOverlayActive) {
      return;
    }

    if (restoreQuestAfterBagOverlay) {
      gameplayUiVisibility.showSections(["quest"]);
    }
    restoreQuestAfterBagOverlay = false;
    bagOverlayActive = false;
  }

  function resolveSelectedItemId() {
    if (
      selectedBagItemId &&
      isBagDetailItemId(selectedBagItemId) &&
      (inventory[selectedBagItemId] || 0) > 0
    ) {
      return selectedBagItemId;
    }

    return (
      getInventoryPresentationOrder(inventory, inventoryOrder, itemDefs).find(
        (itemId) => isBagDetailItemId(itemId)
      ) || null
    );
  }

  function syncDetailsPanel() {
    const itemId = resolveSelectedItemId();
    if (!itemId) {
      return false;
    }

    selectedBagItemId = itemId;
    return true;
  }

  function selectItem(itemId) {
    selectedBagItemId = itemId;
  }

  function showDetails() {
    beginOverlay();
    syncDetailsPanel();
    gameplayUiVisibility.showSections(["inventory"]);
  }

  function hideDetails() {
    gameplayUiVisibility.hideSections(["bagDetails"]);
    endOverlay();
  }

  function inspect() {
    gameplayUiVisibility.showSections(["inventory"]);

    showDetails();
  }

  function handleItemCollected(itemId, storyState) {
    if (isBagDetailItemId(itemId)) {
      selectItem(itemId);
    }
  }

  return {
    handleItemCollected,
    hideDetails,
    getSelectedItemId: () => resolveSelectedItemId(),
    inspect,
    isDetailsOpen: () => false,
    selectItem,
    showDetails,
    syncDetailsPanel
  };
}
