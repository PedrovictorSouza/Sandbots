import { getInventoryPresentationOrder } from "../ui/inventoryPresentation.js";

export function createBagUiRuntime({
  bagOnboarding,
  bagDetails,
  gameplayUiVisibility,
  inventory,
  inventoryOrder,
  itemDefs,
  isBagDetailItemId
}) {
  let bagOnboardingActive = false;
  let bagDetailsOpen = false;
  let restoreQuestAfterBagOverlay = false;
  let selectedBagItemId = null;

  function beginOverlay() {
    if (!bagOnboardingActive && !bagDetailsOpen) {
      restoreQuestAfterBagOverlay = gameplayUiVisibility.isSectionVisible("quest");
      gameplayUiVisibility.hideSections(["quest"]);
    }
  }

  function endOverlay() {
    if (bagOnboardingActive || bagDetailsOpen) {
      return;
    }

    if (restoreQuestAfterBagOverlay) {
      gameplayUiVisibility.showSections(["quest"]);
    }
    restoreQuestAfterBagOverlay = false;
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
      bagDetails.setItem(null, 0);
      return false;
    }

    selectedBagItemId = itemId;
    bagDetails.setItem(itemDefs[itemId], inventory[itemId] || 0);
    return true;
  }

  function selectItem(itemId) {
    selectedBagItemId = itemId;
    if (bagDetailsOpen) {
      syncDetailsPanel();
    }
  }

  function showOnboarding() {
    bagOnboarding.setHint({
      title: "Your Bag",
      bodyHtml:
        "<p>Items you obtain are placed in your bag.</p>" +
        "<p>You can press <span class=\"bag-onboarding-panel__key\">X</span> to look inside.</p>"
    });
    beginOverlay();
    bagOnboardingActive = true;
    gameplayUiVisibility.showSections(["bagOnboarding", "inventory"]);
  }

  function dismissOnboarding() {
    if (!bagOnboardingActive && !gameplayUiVisibility.isSectionVisible("bagOnboarding")) {
      return;
    }

    bagOnboardingActive = false;
    gameplayUiVisibility.hideSections(["bagOnboarding"]);
    endOverlay();
  }

  function showDetails() {
    if (!syncDetailsPanel()) {
      return;
    }

    beginOverlay();
    bagDetailsOpen = true;
    gameplayUiVisibility.showSections(["bagDetails", "inventory"]);

    if (bagOnboardingActive) {
      dismissOnboarding();
    }
  }

  function hideDetails() {
    if (!bagDetailsOpen && !gameplayUiVisibility.isSectionVisible("bagDetails")) {
      return;
    }

    bagDetailsOpen = false;
    gameplayUiVisibility.hideSections(["bagDetails"]);
    endOverlay();
  }

  function inspect() {
    gameplayUiVisibility.showSections(["inventory"]);

    if (bagDetailsOpen) {
      hideDetails();
      return;
    }

    showDetails();
  }

  function handleItemCollected(itemId, storyState) {
    if (isBagDetailItemId(itemId)) {
      selectItem(itemId);
    }

    if (storyState.flags.bagOnboardingSeen) {
      return;
    }

    storyState.flags.bagOnboardingSeen = true;
    showOnboarding();
  }

  return {
    handleItemCollected,
    hideDetails,
    getSelectedItemId: () => resolveSelectedItemId(),
    inspect,
    isDetailsOpen: () => bagDetailsOpen,
    selectItem,
    showDetails,
    showOnboarding,
    syncDetailsPanel
  };
}
