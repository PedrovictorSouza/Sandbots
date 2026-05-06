import { describe, expect, it, vi } from "vitest";
import { createEngineRuntime } from "../app/runtime/createEngineRuntime.js";

function createStyleMap() {
  const properties = new Map();

  return {
    properties,
    style: {
      setProperty(name, value) {
        properties.set(name, value);
      }
    }
  };
}

describe("createEngineRuntime", () => {
  it("syncs fixed-stage scale before reporting WebGL unavailable", () => {
    const root = createStyleMap();
    const frame = createStyleMap();
    const onWebGlUnavailable = vi.fn();

    expect(() => createEngineRuntime({
      dom: {
        worldCanvas: {
          getContext: () => null
        },
        spriteCanvas: {},
        mount: {},
        renderFrame: {
          dataset: {},
          style: frame.style
        },
        jitterSlider: null,
        jitterValue: null,
        warmOverlay: null,
        rootStyle: root.style
      },
      launchMode: "gameplay",
      shouldUseNoopWebGlForLaunchMode: () => false,
      onWebGlUnavailable,
      windowRef: {
        innerWidth: 1280,
        innerHeight: 720
      }
    })).toThrow("WebGL indisponivel");

    expect(onWebGlUnavailable).toHaveBeenCalledTimes(1);
    expect(frame.properties.get("--render-frame-scale")).toBe("0.8");
    expect(root.properties.get("--ui-stage-scale")).toBe("0.8");
    expect(root.properties.get("--game-scale")).toBe("0.8");
  });
});
