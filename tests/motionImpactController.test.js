import { describe, expect, it, vi } from "vitest";
import {
  MOTION_IMPACT_PRESET_IDS,
  getMotionImpactPreset
} from "../app/motion/motionImpactPresets.js";
import { createMotionImpactController } from "../app/motion/createMotionImpactController.js";

describe("motion impact presets", () => {
  it("defines a camera-readable water gun hit preset with named timing fields", () => {
    expect(getMotionImpactPreset(MOTION_IMPACT_PRESET_IDS.WATER_GUN_HIT)).toMatchObject({
      id: "water-gun-hit",
      durationMs: 220,
      freezeMs: 40,
      anticipationMs: 30,
      recoverMs: 120,
      positionJolt: { x: 0, y: 0.03, z: -0.04 },
      rotationJolt: { x: -0.08, y: 0.12, z: 0.04 },
      scalePulse: 1.04,
      blend: "sharp",
      silhouetteBias: "camera-readable"
    });
  });
});

describe("createMotionImpactController", () => {
  it("holds the extreme impact pose during the freeze window, then recovers by delta time", () => {
    const controller = createMotionImpactController();

    const firstFrame = controller.trigger({
      targetId: "tile-7",
      presetId: MOTION_IMPACT_PRESET_IDS.WATER_GUN_HIT
    });
    const frozenFrame = controller.update(40).getFrame("tile-7");
    const recoveringFrame = controller.update(90).getFrame("tile-7");
    const finishedFrame = controller.update(90).getFrame("tile-7");

    expect(firstFrame.phase).toBe("impact-freeze");
    expect(firstFrame.positionOffset).toEqual([0, 0.03, -0.04]);
    expect(firstFrame.rotationOffset).toEqual([-0.08, 0.12, 0.04]);
    expect(firstFrame.scale).toBeCloseTo(1.04);
    expect(frozenFrame.positionOffset).toEqual(firstFrame.positionOffset);
    expect(recoveringFrame.phase).toBe("recover");
    expect(recoveringFrame.positionOffset[1]).toBeGreaterThan(0);
    expect(recoveringFrame.positionOffset[1]).toBeLessThan(firstFrame.positionOffset[1]);
    expect(finishedFrame.phase).toBe("idle");
    expect(finishedFrame.positionOffset).toEqual([0, 0, 0]);
    expect(finishedFrame.scale).toBe(1);
  });

  it("applies frames through an adapter without mutating gameplay objects directly", () => {
    const applyMotionImpact = vi.fn();
    const controller = createMotionImpactController();
    const target = {
      id: "squirtle",
      position: [1, 0, 2],
      applyMotionImpact
    };

    controller.trigger({
      target,
      presetId: MOTION_IMPACT_PRESET_IDS.ROBOT_BUMP
    });
    controller.update(260);

    expect(target.position).toEqual([1, 0, 2]);
    expect(applyMotionImpact).toHaveBeenNthCalledWith(1, expect.objectContaining({
      targetId: "squirtle",
      presetId: MOTION_IMPACT_PRESET_IDS.ROBOT_BUMP,
      phase: "impact-freeze"
    }));
    expect(applyMotionImpact).toHaveBeenLastCalledWith(expect.objectContaining({
      targetId: "squirtle",
      phase: "idle",
      positionOffset: [0, 0, 0]
    }));
  });

  it("ignores unknown presets and clamps negative delta time", () => {
    const controller = createMotionImpactController();

    expect(controller.trigger({
      targetId: "unknown",
      presetId: "missing-preset"
    })).toBeNull();

    controller.trigger({
      targetId: "tile-8",
      presetId: MOTION_IMPACT_PRESET_IDS.TILE_RESTORE_POP
    });

    expect(() => controller.update(-120)).not.toThrow();
    expect(controller.getFrame("tile-8").phase).toBe("impact-freeze");
  });
});
