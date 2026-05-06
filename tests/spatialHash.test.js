import { describe, expect, it } from "vitest";
import { createSpatialHashIndex } from "../world/spatialHash.js";

describe("createSpatialHashIndex", () => {
  it("queries only nearby point items from chunk buckets", () => {
    const items = [
      { id: "near", offset: [1, 0, 1] },
      { id: "far", offset: [48, 0, 48] }
    ];
    const index = createSpatialHashIndex(items, { cellSize: 8 });

    expect(index.queryRadius([0, 0, 0], 4).map((item) => item.id)).toEqual(["near"]);
    expect(index.queryRadius([48, 0, 48], 4).map((item) => item.id)).toEqual(["far"]);
  });

  it("indexes bounds across every touched chunk", () => {
    const index = createSpatialHashIndex(
      [
        {
          id: "wide-collider",
          position: [8, 0, 0],
          size: [16, 1, 4]
        }
      ],
      {
        cellSize: 8,
        getBounds(item) {
          return {
            minX: item.position[0] - item.size[0] * 0.5,
            maxX: item.position[0] + item.size[0] * 0.5,
            minZ: item.position[2] - item.size[2] * 0.5,
            maxZ: item.position[2] + item.size[2] * 0.5
          };
        }
      }
    );

    expect(index.queryPoint([0.5, 0, 0]).map((item) => item.id)).toEqual(["wide-collider"]);
    expect(index.queryPoint([15.5, 0, 0]).map((item) => item.id)).toEqual(["wide-collider"]);
  });
});
