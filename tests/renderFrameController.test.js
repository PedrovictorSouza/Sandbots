// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { createRenderFrameController } from "../app/runtime/renderFrameController.js";
import {
  RENDER_FRAME_MODE,
  createRenderFrameStrategyRegistry
} from "../app/runtime/renderFrameStrategies.js";

describe("createRenderFrameController", () => {
  it("uses the fixed console frame as the default", () => {
    const frameElement = document.createElement("div");
    const controller = createRenderFrameController({
      frameElement,
      windowRef: {
        innerWidth: 1680,
        innerHeight: 1050
      }
    });

    const frame = controller.sync();

    expect(frame).toMatchObject({
      mode: RENDER_FRAME_MODE.WIDESCREEN_SAFE,
      width: 1600,
      height: 900,
      canvasWidth: 426,
      canvasHeight: 240,
      sceneScale: 1
    });
    expect(frame.gameScale).toBe(1);
    expect(frame.renderScale).toBe(1);
    expect(frame.safeScale).toBe(1);
    expect(frameElement.dataset.renderFrameMode).toBe(RENDER_FRAME_MODE.WIDESCREEN_SAFE);
    expect(frameElement.style.getPropertyValue("--game-stage-width")).toBe("1600px");
    expect(frameElement.style.getPropertyValue("--game-stage-height")).toBe("900px");
    expect(frameElement.style.getPropertyValue("--game-scale")).toBe("1");
    expect(frameElement.style.getPropertyValue("--render-frame-scale")).toBe("1");
    expect(frameElement.style.getPropertyValue("--render-frame-safe-scale")).toBe("1");
    expect(frameElement.style.getPropertyValue("--scene-scale")).toBe("1");
    expect(frameElement.style.getPropertyValue("--viewport-internal-width")).toBe("426");
    expect(frameElement.style.getPropertyValue("--viewport-internal-height")).toBe("240");
  });

  it("scales only in integer multiples of the fixed stage", () => {
    const frameElement = document.createElement("div");
    const controller = createRenderFrameController({
      frameElement,
      windowRef: {
        innerWidth: 3200,
        innerHeight: 1800
      }
    });

    expect(controller.sync()).toMatchObject({
      width: 1600,
      height: 900,
      gameScale: 2,
      renderScale: 2,
      safeScale: 2,
      sceneScale: 2
    });
    expect(frameElement.style.getPropertyValue("--game-scale")).toBe("2");
  });

  it("uses the expected integer scale for common 16:9 viewports", () => {
    const cases = [
      { width: 1920, height: 1080, scale: 1 },
      { width: 3200, height: 1800, scale: 2 },
      { width: 4800, height: 2700, scale: 3 }
    ];

    for (const viewport of cases) {
      const frameElement = document.createElement("div");
      const controller = createRenderFrameController({
        frameElement,
        windowRef: {
          innerWidth: viewport.width,
          innerHeight: viewport.height
        }
      });

      expect(controller.sync().gameScale).toBe(viewport.scale);
      expect(frameElement.style.getPropertyValue("--game-scale")).toBe(`${viewport.scale}`);
    }
  });

  it("keeps a fixed internal frame when switching policies", () => {
    const frameElement = document.createElement("div");
    const controller = createRenderFrameController({
      frameElement,
      windowRef: {
        innerWidth: 1680,
        innerHeight: 1050
      }
    });

    expect(controller.setMode(RENDER_FRAME_MODE.CLASSIC_4_3)).toMatchObject({
      mode: RENDER_FRAME_MODE.CLASSIC_4_3,
      width: 1600,
      height: 900,
      canvasWidth: 426,
      canvasHeight: 240
    });

    expect(controller.setMode(RENDER_FRAME_MODE.WIDESCREEN_NATIVE)).toMatchObject({
      mode: RENDER_FRAME_MODE.WIDESCREEN_NATIVE,
      width: 1600,
      height: 900,
      canvasWidth: 426,
      canvasHeight: 240
    });
  });

  it("accepts injected frame strategies", () => {
    const frameElement = document.createElement("div");
    const strategies = createRenderFrameStrategyRegistry({
      square: {
        calculate() {
          return {
            width: 512,
            height: 512,
            gameScale: 2,
            sceneScale: 1
          };
        }
      }
    });
    const controller = createRenderFrameController({
      frameElement,
      initialMode: "square",
      strategies,
      windowRef: {
        innerWidth: 900,
        innerHeight: 700
      }
    });

    expect(controller.sync()).toMatchObject({
      mode: "square",
      width: 512,
      height: 512,
      gameScale: 2,
      renderScale: 2
    });
    expect(frameElement.dataset.renderFrameMode).toBe("square");
  });
});
