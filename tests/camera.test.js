// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { createPokemonCamera } from "../camera.js";

describe("createPokemonCamera", () => {
  it("smoothly settles the target through a transition before reaching the player pivot", () => {
    const worldCanvas = document.createElement("canvas");
    const spriteCanvas = document.createElement("canvas");
    const mount = document.createElement("div");
    const camera = createPokemonCamera({
      worldCanvas,
      spriteCanvas,
      mount,
      target: [0, 1.35, 0]
    });

    camera.startTargetTransition([10, 1.35, 0], { duration: 1 });

    expect(camera.isTargetTransitionActive()).toBe(true);

    camera.update(0.5);
    const midPose = camera.getPose();

    expect(midPose.target[0]).toBeGreaterThan(0);
    expect(midPose.target[0]).toBeLessThan(10);

    camera.update(0.5);
    const finalPose = camera.getPose();

    expect(camera.isTargetTransitionActive()).toBe(false);
    expect(finalPose.target[0]).toBeCloseTo(10);
    expect(finalPose.target[1]).toBeCloseTo(1.35);
    expect(finalPose.target[2]).toBeCloseTo(0);
  });
});
