import { describe, expect, it } from "vitest";
import { findNearbyInteractable } from "../world/islandWorld.js";

describe("findNearbyInteractable", () => {
  it("detects a rustling grass encounter after Tangrowth's habitat hint", () => {
    const result = findNearbyInteractable(
      [8.1, 0, -3.9],
      [],
      [],
      {
        flags: {
          tangrowthTallGrassCommentSeen: true,
          bulbasaurRevealed: false,
          rustlingGrassCellId: "ground-3-1"
        }
      },
      [
        {
          id: "grass-3",
          cellId: "ground-3-1",
          position: [8.4, 0.02, -4.2],
          state: "alive"
        }
      ]
    );

    expect(result).toEqual({
      target: {
        kind: "grassEncounter",
        id: "rustlingGrass",
        label: "Investigate the rustling grass",
        cellId: "ground-3-1"
      },
      distance: expect.any(Number)
    });
  });
});
