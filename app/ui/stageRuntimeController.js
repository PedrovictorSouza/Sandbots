const FIXED_UI_LAYOUT = Object.freeze({
  uiStageWidth: 1600,
  uiStageHeight: 900,
  gap: 20,
  hudWidth: 420,
  statusWidth: 420,
  skillsWidth: 280,
  inventoryWidth: 460,
  missionsWidth: 420,
  hudScale: 1,
  overlayScale: 1,
  guideScale: 1
});

function formatScale(value) {
  return Number(value).toFixed(3).replace(/\.?0+$/, "");
}

function normalizeStageScale(value) {
  const scale = Number(value);

  if (!Number.isFinite(scale) || scale <= 0) {
    return 1;
  }

  if (scale < 1) {
    return scale;
  }

  return Math.max(1, Math.floor(scale));
}

export function createStageRuntimeController({
  rootStyle,
  jitterValueElement,
  warmOverlayElement
}) {
  return {
    syncUiScale(frame = {}) {
      const gameScale = normalizeStageScale(frame.gameScale || frame.renderScale || 1);
      const formattedGameScale = formatScale(gameScale);

      rootStyle.setProperty("--game-scale", formattedGameScale);
      rootStyle.setProperty("--console-display-scale", formattedGameScale);
      rootStyle.setProperty("--ui-gap", `${FIXED_UI_LAYOUT.gap}px`);
      rootStyle.setProperty("--hud-width", `${FIXED_UI_LAYOUT.hudWidth}px`);
      rootStyle.setProperty("--status-width", `${FIXED_UI_LAYOUT.statusWidth}px`);
      rootStyle.setProperty("--skills-width", `${FIXED_UI_LAYOUT.skillsWidth}px`);
      rootStyle.setProperty("--inventory-width", `${FIXED_UI_LAYOUT.inventoryWidth}px`);
      rootStyle.setProperty("--missions-width", `${FIXED_UI_LAYOUT.missionsWidth}px`);
      rootStyle.setProperty("--hud-scale", `${FIXED_UI_LAYOUT.hudScale}`);
      rootStyle.setProperty("--overlay-scale", `${FIXED_UI_LAYOUT.overlayScale}`);
      rootStyle.setProperty("--guide-scale", `${FIXED_UI_LAYOUT.guideScale}`);
      rootStyle.setProperty("--ui-stage-width", `${FIXED_UI_LAYOUT.uiStageWidth}px`);
      rootStyle.setProperty("--ui-stage-height", `${FIXED_UI_LAYOUT.uiStageHeight}px`);
      rootStyle.setProperty("--ui-stage-scale", formattedGameScale);
    },

    syncJitterUi(jitterAmount) {
      if (jitterValueElement) {
        jitterValueElement.textContent = `${Math.round(jitterAmount * 100)}%`;
      }

      if (warmOverlayElement) {
        const overlayStrength = Math.pow(jitterAmount, 1.35);
        warmOverlayElement.style.opacity = `${overlayStrength * 0.58}`;
      }
    }
  };
}
