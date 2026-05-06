import { describe, expect, it } from "vitest";
import {
  curveWorldPosition,
  getWorldCurvatureDrop,
  resolveWorldCurvatureOrigin
} from "../rendering/worldCurvature.js";

describe("world curvature", () => {
  it("keeps the camera target flat and bends distant positions visually downward", () => {
    const origin = resolveWorldCurvatureOrigin([10, 4, -6]);
    const config = {
      enabled: true,
      strength: 0.01,
      maxDrop: 20
    };

    expect(origin).toEqual([10, 0, -6]);
    expect(getWorldCurvatureDrop([10, 3, -6], origin, config)).toBe(0);
    expect(getWorldCurvatureDrop([20, 3, -6], origin, config)).toBe(1);
    expect(curveWorldPosition([20, 3, -6], origin, config)).toEqual([20, 2, -6]);
  });

  it("caps the visual drop and leaves gameplay positions immutable", () => {
    const position = [100, 5, 0];
    const curved = curveWorldPosition(position, [0, 0, 0], {
      enabled: true,
      strength: 1,
      maxDrop: 8
    });

    expect(curved).toEqual([100, -3, 0]);
    expect(position).toEqual([100, 5, 0]);
  });

  it("can be disabled without moving visual positions", () => {
    expect(curveWorldPosition([12, 2, -8], [0, 0, 0], {
      enabled: false,
      strength: 1,
      maxDrop: 8
    })).toEqual([12, 2, -8]);
  });
});
