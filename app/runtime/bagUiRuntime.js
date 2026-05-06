import { getInventoryPresentationOrder } from "../ui/inventoryPresentation.js";

export function createBagUiRuntime({
  bagOnboarding,
  gameplayUiVisibility,
  inventory,
  inventoryOrder,
  itemDefs,
  isBagDetailItemId
}) {
  let bagOnboardingActive = false;
  let restoreQuestAfterBagOverlay = false;
  let selectedBagItemId = null;

  function beginOverlay() {
    if (!bagOnboardingActive) {
      restoreQuestAfterBagOverlay = gameplayUiVisibility.isSectionVisible("quest");
      gameplayUiVisibility.hideSections(["quest"]);
    }
  }

  function endOverlay() {
    if (bagOnboardingActive) {
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
      return false;
    }

    selectedBagItemId = itemId;
    return true;
  }

  function selectItem(itemId) {
    selectedBagItemId = itemId;
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
    syncDetailsPanel();
    gameplayUiVisibility.showSections(["inventory"]);

    if (bagOnboardingActive) {
      dismissOnboarding();
    }
  }

  function hideDetails() {
    gameplayUiVisibility.hideSections(["bagDetails"]);
  }

  function inspect() {
    gameplayUiVisibility.showSections(["inventory"]);

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
    isDetailsOpen: () => false,
    selectItem,
    showDetails,
    showOnboarding,
    syncDetailsPanel
  };
}
