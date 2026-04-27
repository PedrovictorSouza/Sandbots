import {
  DEFAULT_RENDER_FRAME_CONFIG,
  RENDER_FRAME_MODE,
  createRenderFrameStrategyRegistry
} from "./renderFrameStrategies.js";

function getViewportSize(windowRef) {
  return {
    width: windowRef?.innerWidth || 1,
    height: windowRef?.innerHeight || 1
  };
}

function calculateGameScale(viewport, width, height) {
  const scaleX = viewport.width / width;
  const scaleY = viewport.height / height;

  return Math.max(1, Math.floor(Math.min(scaleX, scaleY)));
}

function normalizeFrame(frame, mode, viewport) {
  const width = Math.max(1, Math.round(Number(frame?.width) || 1));
  const height = Math.max(1, Math.round(Number(frame?.height) || 1));
  const gameScale = Math.max(1, Math.floor(Number(frame?.gameScale) || calculateGameScale(viewport, width, height)));

  return {
    mode,
    width,
    height,
    canvasWidth: Math.max(1, Math.round(Number(frame?.canvasWidth) || 426)),
    canvasHeight: Math.max(1, Math.round(Number(frame?.canvasHeight) || 240)),
    gameScale,
    renderScale: gameScale,
    safeScale: gameScale,
    sceneScale: gameScale
  };
}

function formatScale(value) {
  return Number(value).toFixed(3).replace(/\.?0+$/, "");
}

function applyFrameVariables(frameElement, frame) {
  frameElement.dataset.renderFrameMode = frame.mode;
  frameElement.style.setProperty("--game-stage-width", `${frame.width}px`);
  frameElement.style.setProperty("--game-stage-height", `${frame.height}px`);
  frameElement.style.setProperty("--game-scale", formatScale(frame.gameScale));
  frameElement.style.setProperty("--render-frame-scale", formatScale(frame.renderScale));
  frameElement.style.setProperty("--render-frame-safe-scale", formatScale(frame.safeScale));
  frameElement.style.setProperty("--scene-scale", formatScale(frame.sceneScale));
  frameElement.style.setProperty("--viewport-internal-width", `${frame.canvasWidth}`);
  frameElement.style.setProperty("--viewport-internal-height", `${frame.canvasHeight}`);
}

export function createRenderFrameController({
  frameElement,
  windowRef,
  initialMode = RENDER_FRAME_MODE.WIDESCREEN_SAFE,
  resolveMode = null,
  strategies = createRenderFrameStrategyRegistry(),
  strategyConfig = DEFAULT_RENDER_FRAME_CONFIG
} = {}) {
  if (!frameElement?.style?.setProperty) {
    throw new Error("Render frame controller requires a valid frame element.");
  }

  const resolvedWindowRef = windowRef || (typeof window !== "undefined" ? window : undefined);
  let activeMode = initialMode;
  let currentFrame = null;

  function getModeForViewport(viewport) {
    if (typeof resolveMode === "function") {
      return resolveMode({
        activeMode,
        viewport
      }) || activeMode;
    }

    return activeMode;
  }

  function getStrategy(mode) {
    const strategy = strategies[mode];

    if (!strategy?.calculate) {
      throw new Error(`Render frame strategy not registered: ${mode}`);
    }

    return strategy;
  }

  function sync() {
    const viewport = getViewportSize(resolvedWindowRef);
    const mode = getModeForViewport(viewport);
    const strategy = getStrategy(mode);
    const frame = normalizeFrame(
      strategy.calculate({
        viewport,
        config: strategyConfig
      }),
      mode,
      viewport
    );

    activeMode = mode;
    currentFrame = frame;
    applyFrameVariables(frameElement, frame);
    return frame;
  }

  return {
    getFrame() {
      return currentFrame;
    },
    getMode() {
      return activeMode;
    },
    setMode(mode) {
      getStrategy(mode);
      activeMode = mode;
      return sync();
    },
    sync
  };
}
