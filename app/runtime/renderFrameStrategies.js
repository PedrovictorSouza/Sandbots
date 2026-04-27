export const RENDER_FRAME_MODE = Object.freeze({
  CLASSIC_4_3: "classic-4-3",
  WIDESCREEN_NATIVE: "widescreen-native",
  WIDESCREEN_SAFE: "widescreen-safe"
});

export const DEFAULT_RENDER_FRAME_CONFIG = Object.freeze({
  internalWidth: 1600,
  internalHeight: 900,
  canvasWidth: 426,
  canvasHeight: 240
});

function createFixedConsoleFrame(config = DEFAULT_RENDER_FRAME_CONFIG) {
  return {
    width: config.internalWidth,
    height: config.internalHeight,
    canvasWidth: config.canvasWidth,
    canvasHeight: config.canvasHeight,
    sceneScale: 1
  };
}

export const RENDER_FRAME_STRATEGIES = Object.freeze({
  [RENDER_FRAME_MODE.CLASSIC_4_3]: {
    id: RENDER_FRAME_MODE.CLASSIC_4_3,
    calculate({ config = DEFAULT_RENDER_FRAME_CONFIG } = {}) {
      return createFixedConsoleFrame(config);
    }
  },
  [RENDER_FRAME_MODE.WIDESCREEN_NATIVE]: {
    id: RENDER_FRAME_MODE.WIDESCREEN_NATIVE,
    calculate({ config = DEFAULT_RENDER_FRAME_CONFIG } = {}) {
      return createFixedConsoleFrame(config);
    }
  },
  [RENDER_FRAME_MODE.WIDESCREEN_SAFE]: {
    id: RENDER_FRAME_MODE.WIDESCREEN_SAFE,
    calculate({ config = DEFAULT_RENDER_FRAME_CONFIG } = {}) {
      return createFixedConsoleFrame(config);
    }
  }
});

export function createRenderFrameStrategyRegistry(extraStrategies = {}) {
  return {
    ...RENDER_FRAME_STRATEGIES,
    ...extraStrategies
  };
}
