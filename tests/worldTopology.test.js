import { describe, expect, it } from "vitest";
import {
  createWrappedWorldTopology,
  FLAT_WORLD_TOPOLOGY,
  WORLD_WRAP_AXIS_X,
  WORLD_WRAP_AXIS_Z
} from "../world/worldTopology.js";

describe("world topology", () => {
  it("leaves flat world positions unchanged without mutating the source", () => {
    const position = [145, 1, -9];
    const wrapped = FLAT_WORLD_TOPOLOGY.wrapPosition(position);

    expect(wrapped).toEqual(position);
    expect(wrapped).not.toBe(position);
  });

  it("wraps longitude positions across the positive and negative world limits", () => {
    const topology = createWrappedWorldTopology({
      limit: 144,
      axes: [WORLD_WRAP_AXIS_X]
    });

    expect(topology.wrapPosition([144, 0, 0])).toEqual([144, 0, 0]);
    expect(topology.wrapPosition([-144, 0, 0])).toEqual([-144, 0, 0]);
    expect(topology.wrapPosition([145, 0, 8])).toEqual([-143, 0, 8]);
    expect(topology.wrapPosition([-145, 0, 8])).toEqual([143, 0, 8]);
  });

  it("can wrap multiple axes for future planet-like topologies", () => {
    const topology = createWrappedWorldTopology({
      limit: 10,
      axes: [WORLD_WRAP_AXIS_X, WORLD_WRAP_AXIS_Z]
    });

    expect(topology.wrapPosition([11, 2, -11])).toEqual([-9, 2, 9]);
  });

  it("resolves render positions to the nearest wrapped copy of the camera", () => {
    const topology = createWrappedWorldTopology({
      limit: 144,
      axes: [WORLD_WRAP_AXIS_X, WORLD_WRAP_AXIS_Z]
    });
    const out = [0, 0, 0];

    expect(topology.getRenderPosition([-143, 0, -143], [141, 1, 141], out)).toBe(out);
    expect(out).toEqual([145, 0, 145]);

    expect(topology.getRenderPosition([143, 0, 143], [-141, 1, -141], out)).toBe(out);
    expect(out).toEqual([-145, 0, -145]);
  });

  it("computes wrapped planar distance without resolving a render position first", () => {
    const topology = createWrappedWorldTopology({
      limit: 144,
      axes: [WORLD_WRAP_AXIS_X, WORLD_WRAP_AXIS_Z]
    });

    expect(topology.getPlanarDistanceSquared([-143, 0, -143], [141, 0, 141])).toBe(32);
    expect(topology.getPlanarDistanceSquared([12, 0, 8], [9, 0, 4])).toBe(25);
  });
});
