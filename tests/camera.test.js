// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { createPokemonCamera } from "../camera.js";

describe("createPokemonCamera", () => {
  it("follows horizontal movement while reducing vertical target tracking", () => {
    const worldCanvas = document.createElement("canvas");
    const spriteCanvas = document.createElement("canvas");
    const mount = document.createElement("div");
    const camera = createPokemonCamera({
      worldCanvas,
      spriteCanvas,
      mount,
      target: [0, 1.2, 0],
      direction: [0, 0.36, 1],
      followLeadDistance: 0,
      followVerticalStrength: 0.25
    });

    camera.follow([4, 3.2, -2]);

    const pose = camera.getPose();
    expect(pose.target[0]).toBeCloseTo(4);
    expect(pose.target[1]).toBeCloseTo(2);
    expect(pose.target[2]).toBeCloseTo(-2);
  });

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
